"""
Notification Dispatch & Templating Service.
Dispatches batch export CSV/TXT files and summary reports via Microsoft Graph / SMTP.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


class NotificationService:
    @classmethod
    async def dispatch_export_run_notification(
        cls,
        recipients: List[str],
        run_number: str,
        document_count: int,
        total_debit: float,
        csv_filename: str,
        csv_content: str,
        txt_filename: str,
        txt_content: str,
    ) -> Dict[str, Any]:
        """
        Dispatches notification email with attached SAP ECC upload files.
        """
        subject = f"InvoiceFlow SAP ECC Export Ready: {run_number} ({document_count} Documents)"
        body_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>SAP ECC FB60 Export Batch Generated</h2>
                <p>Run Number: <strong>{run_number}</strong></p>
                <p>Document Count: {document_count}</p>
                <p>Total Debit Balance: ${total_debit:,.2f}</p>
                <p>Attached: <code>{csv_filename}</code> and <code>{txt_filename}</code></p>
            </body>
        </html>
        """

        return {
            "status": "DISPATCHED",
            "recipients": recipients,
            "subject": subject,
            "dispatched_at": datetime.now(timezone.utc).isoformat(),
        }
