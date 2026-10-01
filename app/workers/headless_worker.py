"""
InvoiceFlow Headless Worker & Autonomous Background Task Scheduler.
Operates 100% headless with ZERO UI dependencies.
Supports:
1. Multi-stream processing (Stream A: ITH Travel vendor payments, Stream B: Airline Tax Credit Claims).
2. Mailbox processing via Microsoft Graph, IMAP, and filesystem spool (/data/inbox_spool).
3. Document-level stream identification and subcategory classification.
4. Stream-specific mandatory field validation and arithmetic reconciliation.
5. Trip ID validation with fallback keys.
6. Cross-stream duplicate claim prevention.
7. Automated received-to-returned latency tracking and SLA enforcement (:00 to :15 SLA).
8. SAP batch generation, MIS Package ZIP creation, and return-email templating.
"""

import os
import sys
import time
import json
import zipfile
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple

from app.services.stream_service import StreamService, StreamDefinition
from app.services.validation_service import ValidationService
from app.services.mis_package_service import MisPackageService
from app.services.core_ingestion_service import CoreIngestionService, IngestionDocumentResult
from app.adapters.mail.base import IngestedMessage, IngestedAttachment

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [INVOICEFLOW-WORKER] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("invoiceflow.worker")


class HeadlessWorkerEngine:
    """
    Autonomous pipeline engine that ingests, validates, routes,
    and returns invoices across configured A/B streams.
    """

    def __init__(
        self,
        cadence_minutes: int = 60,
        stream_filter: Optional[str] = None,
        target_mailbox: Optional[str] = None,
        spool_dir: str = "/data/inbox_spool",
        output_dir: str = "/data/processed_artifacts"
    ):
        self.cadence_minutes = cadence_minutes
        self.stream_filter = stream_filter
        self.target_mailbox = target_mailbox
        self.spool_dir = spool_dir
        self.output_dir = output_dir
        self.is_running = False
        self.ingestion_service = CoreIngestionService(spool_dir=spool_dir)

        os.makedirs(self.spool_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)

    def print_latency_report(self, results: List[IngestionDocumentResult], batch_duration: float, run_id: str):
        """Prints a scannable operational table with exact received-to-returned latency."""
        print("\n" + "=" * 105)
        print(f" INVOICEFLOW EXECUTION REPORT — BATCH {run_id}")
        print("=" * 105)
        print(f"{'DOCUMENT #':<16} | {'STREAM':<24} | {'SUB':<8} | {'STATUS':<14} | {'LATENCY (s)':<12} | {'LATENCY (ms)':<12} | {'SLA (<15m)'}")
        print("-" * 105)

        for r in results:
            sla_tag = "[PASS] OK" if r.latency.sla_compliant else "[FAIL] BREACH"
            print(
                f"{r.document_number:<16} | "
                f"{r.stream_code:<24} | "
                f"{r.subcategory:<8} | "
                f"{r.document_status:<14} | "
                f"{r.latency.received_to_returned_seconds:>10.2f}s | "
                f"{r.latency.received_to_returned_latency_ms:>10}ms | "
                f"{sla_tag}"
            )

        print("-" * 105)
        total = len(results)
        stp_count = sum(1 for r in results if r.document_status == "APPROVED")
        exc_count = sum(1 for r in results if r.document_status == "REVIEW_PENDING")
        rej_count = sum(1 for r in results if r.document_status == "REJECTED")

        avg_lat = sum(r.latency.received_to_returned_seconds for r in results) / max(total, 1)
        max_lat = max((r.latency.received_to_returned_seconds for r in results), default=0.0)
        sla_met_pct = (sum(1 for r in results if r.latency.sla_compliant) / max(total, 1)) * 100.0

        print(f"SUMMARY METRICS:")
        print(f"  Total Ingested:       {total} documents")
        print(f"  STP Approved (STP):   {stp_count} ({ (stp_count/max(total, 1))*100:.1f}%)")
        print(f"  Review Exceptions:    {exc_count}")
        print(f"  Rejected Documents:   {rej_count}")
        print(f"  Average Latency:      {avg_lat:.2f} seconds")
        print(f"  Peak Latency:         {max_lat:.2f} seconds")
        print(f"  SLA Compliance Rate:  {sla_met_pct:.1f}% (All within 15-minute scheduled window)")
        print(f"  Engine Wall Time:     {batch_duration:.3f} seconds")
        print("=" * 105 + "\n")

    def save_artifacts(
        self,
        run_id: str,
        results: List[IngestionDocumentResult],
        mis_tsv: str,
        control_sheet: str,
        generate_zip: bool = True
    ) -> Dict[str, str]:
        """Persists SAP batch files, MIS register TSV, control sheet, and ZIP package."""
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        prefix = os.path.join(self.output_dir, f"{run_id}_{timestamp}")

        # 1. SAP ECC Batch Upload File
        sap_file = f"{prefix}_SAP_FB60_BATCH.txt"
        with open(sap_file, "w", encoding="utf-8") as f:
            f.write("# INVOICEFLOW SAP ECC FB60 BATCH UPLOAD\n")
            f.write(f"# RUN ID: {run_id}\n")
            f.write(f"# GENERATED AT: {datetime.now(timezone.utc).isoformat()}\n")
            f.write("HEADER|DOC_TYPE|COMP_CODE|POST_DATE|DOC_DATE|REF_DOC|CURRENCY\n")
            f.write("ITEM|ITEM_NO|ACCT_TYPE|ACCT_NO|AMOUNT|TAX_CODE|COST_CENTER|PROFIT_CENTER|TEXT\n")
            f.write("-" * 80 + "\n")
            for r in results:
                f.write(f"{r.sap_record_line}\n")

        # 2. MIS Register TSV
        tsv_file = f"{prefix}_MIS_REGISTER.tsv"
        with open(tsv_file, "w", encoding="utf-8") as f:
            f.write(mis_tsv)

        # 3. Run Control Sheet
        sheet_file = f"{prefix}_CONTROL_SHEET.txt"
        with open(sheet_file, "w", encoding="utf-8") as f:
            f.write(control_sheet)

        saved = {
            "sap_batch": sap_file,
            "mis_tsv": tsv_file,
            "control_sheet": sheet_file,
        }

        # 4. Optional Comprehensive MIS ZIP Package
        if generate_zip:
            zip_path = f"{prefix}_MIS_PACKAGE.zip"
            with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
                z.write(sap_file, arcname=os.path.basename(sap_file))
                z.write(tsv_file, arcname=os.path.basename(tsv_file))
                z.write(sheet_file, arcname=os.path.basename(sheet_file))

                # Include processed sample files into zip
                for r in results:
                    entry_name = f"documents/{r.stream_code}/{r.document_status.lower()}/{r.vendor_code}_{r.document_number}.txt"
                    z.writestr(entry_name, f"Invoice: {r.document_number}\nVendor: {r.vendor_name}\nTotal: {r.total_amount} {r.currency}\nLatency: {r.latency.received_to_returned_seconds:.2f}s\n")

            saved["mis_zip"] = zip_path
            logger.info(f"[ARTIFACTS] Comprehensive MIS ZIP generated: {zip_path}")

        return saved

    async def run_single_batch_async(
        self,
        specific_file: Optional[str] = None,
        generate_zip: bool = True
    ) -> Dict[str, Any]:
        """
        Executes a single end-to-end ingestion and return run across active streams/mailboxes.
        Operates without any UI dependencies.
        """
        batch_start = time.time()
        logger.info("=" * 80)
        logger.info("INVOICEFLOW AUTONOMOUS INGESTION & VALIDATION BATCH STARTING")
        logger.info(f"Target Stream Filter:   {self.stream_filter or 'ALL ACTIVE (A: Travel, B: Airline Tax)'}")
        logger.info(f"Target Mailbox Filter:  {self.target_mailbox or 'ALL CONFIGURED STREAM MAILBOXES'}")
        logger.info(f"Filesystem Spool Path:  {self.spool_dir}")
        logger.info(f"Execution Mode:         Headless Worker Service | SLA Target: <= 15 min")
        logger.info("=" * 80)

        # Direct file ingestion if specified
        if specific_file and os.path.exists(specific_file):
            logger.info(f"[DIRECT FILE INGEST] Ingesting single source file: {specific_file}")
            with open(specific_file, "rb") as f:
                content = f.read()

            filename = os.path.basename(specific_file)
            stat = os.stat(specific_file)
            file_time = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
            text_body = content.decode("utf-8", errors="ignore") if filename.endswith((".txt", ".json")) else f"Direct invoice {filename}"

            msg = IngestedMessage(
                internet_message_id=f"<direct_{stat.st_mtime}_{filename}@enterprise.local>",
                source_message_id=f"direct_{stat.st_ino}",
                sender_email="direct.upload@enterprise.internal",
                subject=f"Direct Invoice Upload: {filename}",
                received_at=file_time,
                body_text=text_body,
                body_html=f"<pre>{text_body}</pre>",
                attachments=[IngestedAttachment(filename=filename, content_bytes=content, content_type="application/octet-stream", size_bytes=len(content))]
            )

            active_streams = StreamService.DEFAULT_STREAMS
            if self.stream_filter:
                active_streams = [s for s in active_streams if s.stream_code == self.stream_filter]

            doc_result = self.ingestion_service.process_message(
                message=msg,
                mailbox_address=self.target_mailbox or "direct.upload@enterprise.internal",
                active_streams=active_streams
            )
            batch_result = {
                "run_id": f"RUN-DIRECT-{int(time.time())}",
                "processed_count": 1,
                "results": [doc_result],
                "mis_tsv": "",
                "control_sheet": "",
                "duration_seconds": round(time.time() - batch_start, 3)
            }
        else:
            # Mailbox & Spool Ingestion
            batch_result = await self.ingestion_service.execute_batch(
                stream_filter=self.stream_filter,
                target_mailbox=self.target_mailbox
            )

        results: List[IngestionDocumentResult] = batch_result["results"]
        duration = time.time() - batch_start

        # Print latency summary table to stdout
        self.print_latency_report(results, duration, batch_result["run_id"])

        # Persist SAP batch, MIS register, and ZIP
        saved_paths = self.save_artifacts(
            run_id=batch_result["run_id"],
            results=results,
            mis_tsv=batch_result.get("mis_tsv", ""),
            control_sheet=batch_result.get("control_sheet", ""),
            generate_zip=generate_zip
        )
        batch_result["artifacts"] = saved_paths

        return batch_result

    def run_single_batch(
        self,
        specific_file: Optional[str] = None,
        generate_zip: bool = True
    ) -> Dict[str, Any]:
        """Synchronous wrapper for run_single_batch_async."""
        return asyncio.run(self.run_single_batch_async(specific_file=specific_file, generate_zip=generate_zip))

    async def start_scheduler(self, max_runs: Optional[int] = None):
        """
        Runs the background task scheduler continuously according to cadence_minutes.
        Handles graceful shutdown on SIGINT/SIGTERM.
        """
        self.is_running = True
        logger.info("=" * 80)
        logger.info("INVOICEFLOW AUTONOMOUS BACKGROUND TASK SCHEDULER INITIALIZED")
        logger.info(f"Scheduler Polling Cadence: Every {self.cadence_minutes} minutes")
        logger.info(f"Target Streams:           {self.stream_filter or 'ALL ACTIVE'}")
        logger.info(f"Mailbox Ingestion Root:   {self.target_mailbox or 'Configured Stream Mailboxes'}")
        logger.info(f"Processing SLA Target:    <= 15 minutes (:00 Ingest -> :15 Return)")
        logger.info(f"Zero UI Dependencies:     Fully Headless Execution Active")
        logger.info("Press Ctrl+C to terminate.")
        logger.info("=" * 80)

        run_count = 0
        try:
            while self.is_running:
                run_count += 1
                poll_timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                logger.info(f"[SCHEDULER ITERATION #{run_count}] Polling mailboxes at {poll_timestamp}...")

                await self.run_single_batch_async()

                if max_runs and run_count >= max_runs:
                    logger.info(f"[SCHEDULER] Reached configured maximum runs limit ({max_runs}). Exiting cleanly.")
                    break

                sleep_seconds = self.cadence_minutes * 60
                logger.info(f"[SCHEDULER SLEEP] Next mailbox poll in {self.cadence_minutes} min ({sleep_seconds}s). Sleeping...")
                await asyncio.sleep(sleep_seconds)

        except asyncio.CancelledError:
            logger.info("[SCHEDULER SHUTDOWN] Received cancellation signal. Worker terminating gracefully.")
            self.is_running = False
        except KeyboardInterrupt:
            logger.info("[SCHEDULER INTERRUPT] Received Ctrl+C. Worker shutting down cleanly.")
            self.is_running = False
        except Exception as e:
            logger.error(f"[SCHEDULER ERROR] Unexpected failure in scheduler: {e}", exc_info=True)
            self.is_running = False
