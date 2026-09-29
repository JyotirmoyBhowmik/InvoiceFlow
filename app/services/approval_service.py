"""
Approval Routing & SLA Escalation Service.
Evaluates spend authority matrices by amount slab and operational category.
"""

from typing import Optional, Dict, Any, List


class ApprovalService:
    @classmethod
    def resolve_approver_role(
        cls,
        amount: float,
        category: str,
        approval_matrix: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        for slab in approval_matrix:
            if slab.get("category_code") == category:
                min_amt = slab.get("min_amount", 0.0)
                max_amt = slab.get("max_amount", 999999999.0)
                if min_amt <= amount <= max_amt:
                    return slab

        return None
