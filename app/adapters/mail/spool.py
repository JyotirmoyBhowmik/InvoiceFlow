"""
Local Spool Mailbox Adapter for InvoiceFlow.
Polls local directory spool (/data/inbox_spool) for incoming email messages,
PDFs, and invoice files, creating IngestedMessage objects with realistic headers.
Enables full headless worker execution and automated testing without external OAuth2/Graph dependencies.
"""

import os
import glob
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from app.adapters.mail.base import BaseMailAdapter, IngestedMessage, IngestedAttachment


class LocalSpoolMailAdapter(BaseMailAdapter):
    """
    Adapter that ingests documents from a filesystem spool folder,
    mapping directory contents to IngestedMessage instances with automated timestamps.
    """

    def __init__(self, spool_dir: str = "/data/inbox_spool"):
        self.spool_dir = spool_dir
        os.makedirs(self.spool_dir, exist_ok=True)

    async def connect(self, profile: Dict[str, Any]) -> bool:
        os.makedirs(self.spool_dir, exist_ok=True)
        return True

    async def poll_messages(
        self, profile: Dict[str, Any], delta_token: Optional[str] = None
    ) -> List[IngestedMessage]:
        target_mailbox = profile.get("mailbox_address", "invoices@snpl.com.np")
        stream_filter = profile.get("stream_code")
        messages: List[IngestedMessage] = []

        # Find files in spool folder
        extensions = ("*.pdf", "*.PDF", "*.png", "*.PNG", "*.jpg", "*.JPG", "*.txt", "*.json")
        found_files = []
        for ext in extensions:
            found_files.extend(glob.glob(os.path.join(self.spool_dir, ext)))

        now = datetime.now(timezone.utc)

        for filepath in found_files:
            try:
                filename = os.path.basename(filepath)
                stat = os.stat(filepath)
                file_time = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)

                with open(filepath, "rb") as f:
                    content = f.read()

                # Infer sender & subject from filename or content
                lower_name = filename.lower()
                if "indigo" in lower_name or "air" in lower_name or "tax" in lower_name:
                    sender = "tax.invoices@goindigo.in"
                    subject = f"IndiGo Passenger Tax Invoice: {filename}"
                elif "ith" in lower_name or "travel" in lower_name or "hotel" in lower_name:
                    sender = "corporate.billing@ith.co.in"
                    subject = f"ITH Consolidated Travel Billing: {filename}"
                else:
                    sender = "supplier.invoices@enterprise.internal"
                    subject = f"Invoice Delivery: {filename}"

                # Text preview if text or json
                body_text = ""
                if filename.endswith((".txt", ".json")):
                    body_text = content.decode("utf-8", errors="ignore")
                else:
                    body_text = f"Automated spool delivery for invoice file {filename}"

                attachment = IngestedAttachment(
                    filename=filename,
                    content_bytes=content,
                    content_type="application/pdf" if filename.lower().endswith(".pdf") else "application/octet-stream",
                    size_bytes=len(content)
                )

                msg = IngestedMessage(
                    internet_message_id=f"<spool_{stat.st_mtime}_{filename}@enterprise.local>",
                    source_message_id=f"spool_{stat.st_ino}",
                    sender_email=sender,
                    subject=subject,
                    received_at=file_time,
                    body_text=body_text,
                    body_html=f"<p>{body_text}</p>",
                    attachments=[attachment]
                )
                messages.append(msg)
            except Exception:
                continue

        return messages

    async def post_process_message(
        self, profile: Dict[str, Any], message_id: str, action: str
    ) -> None:
        # Move processed files to archive or leave for verification
        pass
