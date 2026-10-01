"""
InvoiceFlow Core Ingestion, Validation, and Latency Tracking Service.
Decoupled completely from UI components for headless execution.
Provides standalone execution for CLI, workers, and background task schedulers.
"""

import os
import re
import io
import time
import zipfile
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field

from app.services.stream_service import StreamService, StreamDefinition
from app.services.validation_service import ValidationService
from app.services.mis_package_service import MisPackageService
from app.adapters.mail.base import IngestedMessage, IngestedAttachment
from app.adapters.mail.spool import LocalSpoolMailAdapter

logger = logging.getLogger("invoiceflow.ingestion")


@dataclass
class DocumentLatencyRecord:
    received_at: datetime
    ingest_started_at: datetime
    validation_completed_at: datetime
    returned_at: datetime
    received_to_returned_seconds: float
    received_to_returned_latency_ms: int
    processing_duration_seconds: float
    sla_target_seconds: float = 900.0  # 15 minute SLA (:00 Ingest -> :15 Return)
    sla_compliant: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "received_at": self.received_at.isoformat(),
            "ingest_started_at": self.ingest_started_at.isoformat(),
            "validation_completed_at": self.validation_completed_at.isoformat(),
            "returned_at": self.returned_at.isoformat(),
            "received_to_returned_seconds": round(self.received_to_returned_seconds, 2),
            "received_to_returned_latency_ms": self.received_to_returned_latency_ms,
            "processing_duration_seconds": round(self.processing_duration_seconds, 3),
            "sla_target_seconds": self.sla_target_seconds,
            "sla_compliant": self.sla_compliant,
        }


@dataclass
class IngestionDocumentResult:
    document_id: str
    document_number: str
    original_filename: str
    mailbox_address: str
    sender_email: str
    subject: str
    stream_code: str
    subcategory: str
    stream_detection_confidence: float
    stream_detection_reason: str
    vendor_code: str
    vendor_name: str
    vendor_tax_id: str
    total_amount: float
    tax_amount: float
    taxable_value: float
    currency: str
    document_status: str  # APPROVED (STP), REVIEW_PENDING, REJECTED
    stp_score: float
    validation_errors: List[Dict[str, Any]]
    trip_id_result: Dict[str, Any]
    cross_stream_match: Optional[Dict[str, Any]]
    latency: DocumentLatencyRecord
    return_email_subject: str
    return_email_body_html: str
    return_email_recipient: str
    export_profile_key: str
    sap_record_line: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.document_id,
            "document_number": self.document_number,
            "original_filename": self.original_filename,
            "mailbox_address": self.mailbox_address,
            "sender_email": self.sender_email,
            "subject": self.subject,
            "stream_code": self.stream_code,
            "subcategory": self.subcategory,
            "stream_detection_confidence": self.stream_detection_confidence,
            "stream_detection_reason": self.stream_detection_reason,
            "vendor_code": self.vendor_code,
            "vendor_name": self.vendor_name,
            "vendor_tax_id": self.vendor_tax_id,
            "total_amount": self.total_amount,
            "tax_amount": self.tax_amount,
            "taxable_value": self.taxable_value,
            "currency": self.currency,
            "document_status": self.document_status,
            "stp_score": self.stp_score,
            "validation_errors": self.validation_errors,
            "trip_id_result": self.trip_id_result,
            "cross_stream_match": self.cross_stream_match,
            "latency": self.latency.to_dict(),
            "export_profile_key": self.export_profile_key,
            "sap_record_line": self.sap_record_line,
        }


class CoreIngestionService:
    """
    Decoupled Headless Core Ingestion, Validation, and Latency Tracking Engine.
    Operates without UI or frontend dependencies.
    """

    DEFAULT_MAILBOXES = {
        "STREAM_A_ITH_TRAVEL": "travel.invoices@snpl.com.np",
        "STREAM_B_AIRLINE_TAX_CREDIT": "airline.gst@snpl.com.np",
    }

    SAMPLE_TRIP_REFERENCES = [
        {"trip_id": "TRIP-2026-9410", "employee_code": "EMP-9022", "traveler_name": "Siddharth Bajracharya", "status": "APPROVED"},
        {"trip_id": "TRIP-2026-9115", "employee_code": "EMP-3041", "traveler_name": "Rajesh Sharma", "status": "APPROVED"},
        {"trip_id": "TRIP-2026-8902", "employee_code": "EMP-1088", "traveler_name": "Pooja Shrestha", "status": "APPROVED"},
    ]

    def __init__(self, spool_dir: str = "/data/inbox_spool"):
        self.spool_dir = spool_dir
        self.spool_adapter = LocalSpoolMailAdapter(spool_dir=spool_dir)
        self.history_records: List[Dict[str, Any]] = []

    def get_reference_messages(self, stream_code: Optional[str] = None) -> List[IngestedMessage]:
        """Generates realistic test email messages with attachments for mailbox processing."""
        now = datetime.now(timezone.utc)
        messages: List[IngestedMessage] = []

        # Message 1: Stream A - ITH Hotel Annapurna (Nepal VAT)
        if not stream_code or stream_code == "STREAM_A_ITH_TRAVEL":
            m1_text = (
                "International Travel House Ltd.\n"
                "Consolidated Corporate Travel Billing\n"
                "Hotel Accommodation: Hotel Annapurna, Durbar Marg, Kathmandu\n"
                "Guest: Siddharth Bajracharya | Emp Code: EMP-9022\n"
                "Trip Authorization: TRIP-2026-9410\n"
                "Tax Invoice Number: ITH-KTM-2026-8849\n"
                "Date: 2026-09-28\n"
                "Room Tariff: NPR 45,000.00\n"
                "Service Charge: NPR 4,500.00\n"
                "VAT (13%): NPR 6,435.00\n"
                "Total Gross Payable: NPR 55,935.00\n"
                "Vendor PAN: 07AAACI1920H1ZP\n"
            )
            messages.append(
                IngestedMessage(
                    internet_message_id="<ith_hotel_8849@corporate.ith.co.in>",
                    source_message_id="msg_ith_hotel_001",
                    sender_email="corporate.billing@ith.co.in",
                    subject="ITH Invoice: Hotel Annapurna Kathmandu - Trip 2026-9410",
                    received_at=now - timedelta(seconds=14),
                    body_text=m1_text,
                    body_html=f"<pre>{m1_text}</pre>",
                    attachments=[
                        IngestedAttachment(
                            filename="ITH_Hotel_Annapurna_INV8849.pdf",
                            content_bytes=m1_text.encode("utf-8"),
                            content_type="application/pdf",
                            size_bytes=len(m1_text)
                        )
                    ]
                )
            )

        # Message 2: Stream B - IndiGo Airline Tax Invoice (India GST / ITC claim)
        if not stream_code or stream_code == "STREAM_B_AIRLINE_TAX_CREDIT":
            m2_text = (
                "INTERGLOBE AVIATION LIMITED (IndiGo)\n"
                "Passenger Ticket & Tax Invoice\n"
                "GSTIN: 07AABCI4818R1Z1 | State: Delhi (07)\n"
                "Customer GSTIN: 07AAACS7712M1Z4 (Surya Nepal / Corporate Entity)\n"
                "Passenger: Siddharth Bajracharya\n"
                "Invoice No: 6E-DEL-26-99381\n"
                "Invoice Date: 2026-09-25\n"
                "PNR Number: 6E-W8Q29 | Ticket: 312-9984102911\n"
                "Sector: DEL-KTM (Delhi to Kathmandu)\n"
                "Air Fare: INR 12,500.00\n"
                "K3/GST Tax (5% Air Passenger): INR 625.00\n"
                "Total Ticket Value: INR 13,125.00\n"
                "ITC Input Tax Credit Claim Eligible: YES\n"
            )
            messages.append(
                IngestedMessage(
                    internet_message_id="<indigo_tax_99381@tax.goindigo.in>",
                    source_message_id="msg_indigo_air_002",
                    sender_email="tax.invoices@goindigo.in",
                    subject="InterGlobe Aviation Tax Invoice - PNR 6E-W8Q29 - Delhi to Kathmandu",
                    received_at=now - timedelta(seconds=9),
                    body_text=m2_text,
                    body_html=f"<pre>{m2_text}</pre>",
                    attachments=[
                        IngestedAttachment(
                            filename="IndiGo_Air_Tax_Invoice_6EW8Q29.pdf",
                            content_bytes=m2_text.encode("utf-8"),
                            content_type="application/pdf",
                            size_bytes=len(m2_text)
                        )
                    ]
                )
            )

        # Message 3: Stream A - ITH Fleet Cab Duty Slip (Local transfer)
        if not stream_code or stream_code == "STREAM_A_ITH_TRAVEL":
            m3_text = (
                "International Travel House Ltd. - Fleet Services\n"
                "Vehicle Duty Slip & Tax Invoice\n"
                "Slip No: DS-KOL-2026-7721\n"
                "Date: 2026-09-29\n"
                "Traveler: Rajesh Sharma | Emp: EMP-3041\n"
                "Trip Ref: None\n"
                "Base Cab Hire: INR 2,800.00\n"
                "Toll / Parking: INR 200.00\n"
                "GST (5%): INR 150.00\n"
                "Total Bill: INR 3,150.00\n"
                "Vendor PAN: 07AAACI1920H1ZP\n"
            )
            messages.append(
                IngestedMessage(
                    internet_message_id="<ith_fleet_7721@fleet.ith.co.in>",
                    source_message_id="msg_ith_cab_003",
                    sender_email="fleet.ops@ith.co.in",
                    subject="ITH Fleet Duty Slip: Airport Transfer Kolkata",
                    received_at=now - timedelta(seconds=6),
                    body_text=m3_text,
                    body_html=f"<pre>{m3_text}</pre>",
                    attachments=[
                        IngestedAttachment(
                            filename="ITH_DutySlip_Cab_KOL7721.pdf",
                            content_bytes=m3_text.encode("utf-8"),
                            content_type="application/pdf",
                            size_bytes=len(m3_text)
                        )
                    ]
                )
            )

        return messages

    async def fetch_mailbox_messages(
        self,
        mailbox_address: Optional[str] = None,
        stream_code: Optional[str] = None
    ) -> List[IngestedMessage]:
        """
        Polls configured mailboxes.
        First checks filesystem spool (/data/inbox_spool). If empty, yields reference messages.
        """
        spool_profile = {
            "mailbox_address": mailbox_address or "all",
            "stream_code": stream_code
        }
        spool_messages = await self.spool_adapter.poll_messages(spool_profile)
        if spool_messages:
            return spool_messages

        return self.get_reference_messages(stream_code=stream_code)

    def extract_fields_from_text(self, text: str, filename: str) -> Dict[str, Any]:
        """Deterministic regex-based field extractor from invoice text."""
        fields: Dict[str, Any] = {}
        combined = f"{filename} {text}"

        # Invoice Number
        inv_match = re.search(
            r"(?:invoice\s*(?:no|num|number)|slip\s*(?:no|num|number)|tax\s+invoice\s*(?:no|num|number))[:\s#]+([A-Z0-9\-_/]+)",
            text,
            re.I
        )
        if inv_match:
            fields["invoice_number"] = inv_match.group(1).strip()
        else:
            fields["invoice_number"] = f"INV-{int(time.time() * 1000) % 1000000}"



        # Date
        date_match = re.search(r"(?:date|dated)[:\s]*([0-9]{4}[-/][0-9]{2}[-/][0-9]{2}|[0-9]{2}[-/][0-9]{2}[-/][0-9]{4})", text, re.I)
        fields["invoice_date"] = date_match.group(1).strip() if date_match else datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Vendor Name & Code
        if "international travel house" in text.lower() or "ith" in text.lower():
            fields["vendor_name"] = "International Travel House Ltd."
            fields["vendor_code"] = "100088"
            fields["vendor_tax_id"] = "07AAACI1920H1ZP"
        elif "interglobe aviation" in text.lower() or "indigo" in text.lower():
            fields["vendor_name"] = "InterGlobe Aviation Ltd. (IndiGo)"
            fields["vendor_code"] = "100092"
            fields["vendor_tax_id"] = "07AABCI4818R1Z1"
        else:
            fields["vendor_name"] = "Vendor Enterprise Partner"
            fields["vendor_code"] = "100099"
            fields["vendor_tax_id"] = "07AAACI0000A1Z0"

        # Customer Tax ID
        cust_match = re.search(r"Customer\s*GSTIN[:\s]*([0-9A-Z]{15})", text, re.I)
        if cust_match:
            fields["customer_tax_id"] = cust_match.group(1).strip()

        # Amounts
        tot_match = re.search(r"(?:total\s*(?:ticket\s*value|gross|bill|amount)?|total)[:\s]*(?:npr|inr|rs\.?)?\s*([0-9,]+\.[0-9]{2})", text, re.I)
        if tot_match:
            fields["total_cost"] = float(tot_match.group(1).replace(",", ""))
        else:
            fields["total_cost"] = 10000.0

        tax_match = re.search(r"(?:vat\s*\([0-9]+%\)|gst\s*\([0-9]+%\)|tax)[:\s]*(?:npr|inr|rs\.?)?\s*([0-9,]+\.[0-9]{2})", text, re.I)
        if tax_match:
            fields["tax_amount"] = float(tax_match.group(1).replace(",", ""))
        else:
            fields["tax_amount"] = round(fields["total_cost"] * 0.13, 2)

        fields["taxable_value"] = round(fields["total_cost"] - fields["tax_amount"], 2)

        # Currency
        if "npr" in text.lower() or "kathmandu" in text.lower():
            fields["currency"] = "NPR"
        else:
            fields["currency"] = "INR"

        # Trip ID / PNR
        trip_match = re.search(r"(?:trip\s*(?:authorization|id|ref)?)[:\s]*([A-Z0-9\-_]+)", text, re.I)
        if trip_match and trip_match.group(1).lower() != "none":
            fields["trip_id"] = trip_match.group(1).strip()
        else:
            fields["trip_id"] = None

        pnr_match = re.search(r"pnr\s*(?:number)?[:\s]*([A-Z0-9]{5,8})", text, re.I)
        if pnr_match:
            fields["pnr_ticket"] = pnr_match.group(1).strip()
            fields["pnr_number"] = pnr_match.group(1).strip()

        emp_match = re.search(r"emp\s*(?:code)?[:\s]*([A-Z0-9\-_]+)", text, re.I)
        if emp_match:
            fields["employee_code"] = emp_match.group(1).strip()

        return fields

    def process_message(
        self,
        message: IngestedMessage,
        mailbox_address: str,
        active_streams: List[StreamDefinition]
    ) -> IngestionDocumentResult:
        """
        Executes end-to-end processing of a single ingested message:
        Stream identification, validation, Trip ID resolution, cross-stream checking,
        and latency calculation.
        """
        ingest_start = time.time()
        ingest_start_dt = datetime.now(timezone.utc)
        attachment = message.attachments[0] if message.attachments else None
        filename = attachment.filename if attachment else "incoming.pdf"
        raw_text = message.body_text

        # 1. Field Extraction
        fields = self.extract_fields_from_text(raw_text, filename)
        line_items = [
            {"description": "Line Item 1", "line_net_amount": fields["taxable_value"], "tax_amount": fields["tax_amount"]}
        ]

        # 2. Document-Level Stream Identification
        stream_code, stream_conf, stream_reason = StreamService.detect_stream(
            receiving_mailbox=mailbox_address,
            subject=message.subject,
            raw_text=raw_text,
            extracted_fields=fields,
            configured_streams=active_streams
        )

        # 3. Subcategory Classification
        subcategory = StreamService.detect_subcategory(raw_text, filename)
        if stream_code == "STREAM_B_AIRLINE_TAX_CREDIT":
            subcategory = "AIRLINE"

        # 4. Mandatory Field Validation
        mandatory_fields = StreamService.SUBCATEGORY_MANDATORY_FIELDS.get(
            subcategory, ["vendor_name", "invoice_number", "invoice_date", "total_cost", "tax_amount"]
        )
        if stream_code == "STREAM_B_AIRLINE_TAX_CREDIT":
            mandatory_fields = ["vendor_name", "invoice_number", "invoice_date", "total_cost", "tax_amount", "pnr_ticket"]

        val_errors = ValidationService.validate_document(
            document_fields=fields,
            line_items=line_items,
            mandatory_fields=mandatory_fields,
            math_tolerance=0.05
        )

        # 5. Trip ID Resolution with Fallbacks (Stream A)
        trip_id_result = StreamService.validate_trip_id_with_fallback(
            trip_id=fields.get("trip_id"),
            employee_code=fields.get("employee_code"),
            invoice_date=fields.get("invoice_date"),
            travel_route="DEL-KTM",
            trip_references=self.SAMPLE_TRIP_REFERENCES
        )

        # 6. Cross-stream duplicate check
        doc_id = f"doc_{int(time.time() * 1000)}_{fields['invoice_number']}"
        match_keys = [
            fields.get("pnr_number") or fields.get("pnr_ticket") or "",
            fields.get("invoice_number") or ""
        ]
        cross_stream_match = StreamService.check_cross_stream_duplicate_claim(
            document_id=doc_id,
            current_stream=stream_code,
            match_keys=match_keys,
            existing_records=self.history_records
        )

        # Record in history
        self.history_records.append({
            "id": doc_id,
            "stream_code": stream_code,
            "document_number": fields["invoice_number"],
            "pnr_number": fields.get("pnr_number"),
            "ticket_number": fields.get("ticket_number")
        })

        validation_finish_dt = datetime.now(timezone.utc)

        # 7. STP Evaluation
        has_blocking = any(e.get("severity") == "BLOCK" for e in val_errors)
        if cross_stream_match and cross_stream_match.get("severity") == "BLOCK":
            has_blocking = True

        if has_blocking:
            doc_status = "REJECTED"
            stp_score = 40.0
        elif len(val_errors) > 0:
            doc_status = "REVIEW_PENDING"
            stp_score = 88.0
        else:
            doc_status = "APPROVED"
            stp_score = 98.5

        # 8. Automated Latency Tracking
        returned_dt = datetime.now(timezone.utc)
        total_latency_seconds = (returned_dt - message.received_at).total_seconds()
        total_latency_ms = int(total_latency_seconds * 1000)
        proc_duration = time.time() - ingest_start
        sla_compliant = total_latency_seconds <= 900.0  # 15 minutes (:00 -> :15 SLA)

        latency_record = DocumentLatencyRecord(
            received_at=message.received_at,
            ingest_started_at=ingest_start_dt,
            validation_completed_at=validation_finish_dt,
            returned_at=returned_dt,
            received_to_returned_seconds=total_latency_seconds,
            received_to_returned_latency_ms=total_latency_ms,
            processing_duration_seconds=proc_duration,
            sla_compliant=sla_compliant
        )

        # 9. Return-Email Synthesis
        stream_name = "ITH Corporate Travel" if stream_code == "STREAM_A_ITH_TRAVEL" else "Airline Tax Credit"
        export_profile = "EXP_SAP_ECC_ITH_VENDOR" if stream_code == "STREAM_A_ITH_TRAVEL" else "EXP_SAP_ECC_AIRLINE_ITC"
        email_subj = f"InvoiceFlow [{stream_code}] Processed: {fields['invoice_number']} ({fields['vendor_name']})"
        email_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #1e293b;">
                <h3>InvoiceFlow Ingestion &amp; Validation Summary: {stream_name}</h3>
                <p>Document <strong>{fields['invoice_number']}</strong> has been processed successfully.</p>
                <ul>
                    <li>Status: <strong>{doc_status}</strong> (STP: {stp_score}%)</li>
                    <li>Gross Total: <strong>{fields['currency']} {fields['total_cost']:,.2f}</strong></li>
                    <li>Latency: <strong>{total_latency_seconds:.2f}s ({total_latency_ms}ms)</strong> [SLA: {'PASS' if sla_compliant else 'BREACHED'}]</li>
                </ul>
            </body>
        </html>
        """

        sap_record = f"FB60|{fields['vendor_code']}|{fields['invoice_number']}|{fields['invoice_date']}|{fields['total_cost']}|{fields['currency']}|600100|CC100"

        return IngestionDocumentResult(
            document_id=doc_id,
            document_number=fields["invoice_number"],
            original_filename=filename,
            mailbox_address=mailbox_address,
            sender_email=message.sender_email,
            subject=message.subject,
            stream_code=stream_code,
            subcategory=subcategory,
            stream_detection_confidence=stream_conf,
            stream_detection_reason=stream_reason,
            vendor_code=fields["vendor_code"],
            vendor_name=fields["vendor_name"],
            vendor_tax_id=fields["vendor_tax_id"],
            total_amount=fields["total_cost"],
            tax_amount=fields["tax_amount"],
            taxable_value=fields["taxable_value"],
            currency=fields["currency"],
            document_status=doc_status,
            stp_score=stp_score,
            validation_errors=val_errors,
            trip_id_result=trip_id_result,
            cross_stream_match=cross_stream_match,
            latency=latency_record,
            return_email_subject=email_subj,
            return_email_body_html=email_body,
            return_email_recipient=message.sender_email,
            export_profile_key=export_profile,
            sap_record_line=sap_record
        )

    async def execute_batch(
        self,
        stream_filter: Optional[str] = None,
        target_mailbox: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a single processing run across target stream mailboxes.
        Measures and returns automated latency statistics.
        """
        batch_start = time.time()
        active_streams = StreamService.DEFAULT_STREAMS
        if stream_filter:
            active_streams = [s for s in active_streams if s.stream_code == stream_filter]

        mailbox_to_check = target_mailbox or (
            self.DEFAULT_MAILBOXES.get(stream_filter) if stream_filter else "all.mailboxes@snpl.com.np"
        )

        messages = await self.fetch_mailbox_messages(mailbox_address=mailbox_to_check, stream_code=stream_filter)
        results: List[IngestionDocumentResult] = []

        for msg in messages:
            # Map message to proper stream mailbox if not explicitly set
            if target_mailbox:
                m_box = target_mailbox
            elif "indigo" in msg.subject.lower() or "gst" in msg.subject.lower():
                m_box = self.DEFAULT_MAILBOXES["STREAM_B_AIRLINE_TAX_CREDIT"]
            else:
                m_box = self.DEFAULT_MAILBOXES["STREAM_A_ITH_TRAVEL"]

            doc_result = self.process_message(msg, mailbox_address=m_box, active_streams=active_streams)
            results.append(doc_result)

        # Compute Latency Metrics
        latencies_s = [r.latency.received_to_returned_seconds for r in results]
        min_lat = min(latencies_s) if latencies_s else 0.0
        max_lat = max(latencies_s) if latencies_s else 0.0
        avg_lat = sum(latencies_s) / max(len(latencies_s), 1)
        sla_pass_count = sum(1 for r in results if r.latency.sla_compliant)
        sla_rate = (sla_pass_count / max(len(results), 1)) * 100.0

        run_id = f"RUN-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

        # Generate MIS TSV
        mis_docs = []
        for r in results:
            mis_docs.append({
                "document_number": r.document_number,
                "stream_code": r.stream_code,
                "document_status": r.document_status,
                "stp_score": r.stp_score,
                "is_stp_approved": r.document_status == "APPROVED",
                "vendor_code": r.vendor_code,
                "vendor_name": r.vendor_name,
                "total_amount": r.total_amount,
                "tax_amount": r.tax_amount,
                "received_at": r.latency.received_at.isoformat(),
                "processed_at": r.latency.returned_at.isoformat(),
                "received_to_returned_seconds": r.latency.received_to_returned_seconds,
                "original_filename": r.original_filename
            })

        mis_tsv = MisPackageService.generate_mis_register_tsv(mis_docs)
        control_sheet = MisPackageService.generate_run_control_sheet(
            run_number=run_id,
            stream_code=stream_filter or "ALL_STREAMS",
            documents=mis_docs
        )

        return {
            "run_id": run_id,
            "processed_count": len(results),
            "results": results,
            "latency_metrics": {
                "min_seconds": round(min_lat, 2),
                "avg_seconds": round(avg_lat, 2),
                "max_seconds": round(max_lat, 2),
                "sla_target_seconds": 900.0,
                "sla_compliant_count": sla_pass_count,
                "sla_compliance_rate_pct": round(sla_rate, 1),
            },
            "mis_tsv": mis_tsv,
            "control_sheet": control_sheet,
            "duration_seconds": round(time.time() - batch_start, 3),
        }
