"""
Cost-Center & WBS Allocation Engine.
Applies percentage-based and fixed-amount splits across cost centers.
"""

from typing import List, Dict, Any


class AllocationService:
    @classmethod
    def apply_cost_center_split(
        cls, total_amount: float, split_rules: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Splits total_amount across multiple cost centers.
        """
        allocated_lines: List[Dict[str, Any]] = []
        remaining = total_amount

        for rule in split_rules:
            pct = rule.get("percentage", 0.0)
            cc = rule.get("cost_center_code")
            gl = rule.get("gl_account_code")

            amount = round(total_amount * (pct / 100.0), 2)
            allocated_lines.append({
                "cost_center_code": cc,
                "gl_account_code": gl,
                "amount": amount,
                "percentage": pct,
            })
            remaining -= amount

        return allocated_lines
