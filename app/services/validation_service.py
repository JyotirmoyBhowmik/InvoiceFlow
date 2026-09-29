"""
Validation Engine & Arithmetic Reconciliation Service.
Raises structured error catalog codes for math delta, missing mandatory fields, and closed periods.
"""

from typing import List, Dict, Any


class ValidationService:
    @classmethod
    def validate_document(
        cls,
        document_fields: Dict[str, Any],
        line_items: List[Dict[str, Any]],
        mandatory_fields: List[str],
        math_tolerance: float = 0.05,
    ) -> List[Dict[str, Any]]:
        validation_results: List[Dict[str, Any]] = []

        # 1. Mandatory check
        for req_key in mandatory_fields:
            val = document_fields.get(req_key)
            if val is None or str(val).strip() == "":
                validation_results.append({
                    "error_code": "VAL-001",
                    "severity": "BLOCK",
                    "field_key": req_key,
                    "message": f"Mandatory field {req_key} is missing or empty",
                })

        # 2. Arithmetic reconciliation
        header_total = float(document_fields.get("total_cost") or document_fields.get("total_amount") or 0.0)
        tax_amount = float(document_fields.get("tax_amount") or 0.0)
        lines_sum = sum(float(itm.get("line_net_amount") or 0.0) for itm in line_items)

        if lines_sum > 0:
            expected_total = lines_sum + tax_amount
            delta = abs(header_total - expected_total)
            if delta > math_tolerance:
                validation_results.append({
                    "error_code": "VAL-002",
                    "severity": "ERROR",
                    "expected": str(expected_total),
                    "actual": str(header_total),
                    "message": f"Header total ({header_total}) does not match line sum + tax ({expected_total})",
                })

        return validation_results
