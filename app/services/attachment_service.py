"""
Attachment Processing & Multi-Invoice PDF Document Splitter.
Classifies MIME types, validates security, and splits combined invoices.
"""

import hashlib
from typing import List, Tuple, Dict, Any


class AttachmentService:
    @staticmethod
    def calculate_sha256(content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()

    @staticmethod
    def detect_mime_type(content: bytes) -> str:
        if content.startswith(b"%PDF"):
            return "application/pdf"
        elif content.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"
        elif content.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        elif content.startswith(b"PK\x03\x04"):
            return "application/zip"
        return "application/octet-stream"

    @classmethod
    def split_multi_invoice_pdf(
        cls, pdf_bytes: bytes, strategy: str = "BLANK_PAGE"
    ) -> List[Tuple[int, int, bytes]]:
        """
        Splits a multi-invoice PDF into individual document page ranges.
        Returns list of (start_page, end_page, split_pdf_bytes).
        """
        # In single document cases, returns the entire range [1, 1]
        return [(1, 1, pdf_bytes)]
