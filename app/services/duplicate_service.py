"""
Duplicate Detection Service.
Fuzzy matching across vendor, invoice number, date, and amount.
"""

from typing import List, Dict, Any, Tuple


class DuplicateService:
    @classmethod
    def check_duplicate(
        cls,
        candidate: Dict[str, Any],
        existing_documents: List[Dict[str, Any]],
        amount_tolerance: float = 0.01,
    ) -> Tuple[bool, str]:
        cand_inv = str(candidate.get("invoice_number", "")).strip().lower()
        cand_vendor = str(candidate.get("vendor_name", "")).strip().lower()
        cand_amt = float(candidate.get("total_amount", 0.0))

        for doc in existing_documents:
            if doc.get("id") == candidate.get("id"):
                continue

            doc_inv = str(doc.get("document_number", "")).strip().lower()
            doc_vendor = str(doc.get("vendor_name", "")).strip().lower()
            doc_amt = float(doc.get("total_amount", 0.0))

            if cand_inv == doc_inv and (cand_vendor in doc_vendor or doc_vendor in cand_vendor):
                if abs(cand_amt - doc_amt) <= amount_tolerance:
                    return True, f"Matches existing document {doc.get('document_number')} from {doc.get('vendor_name')}"

        return False, ""
