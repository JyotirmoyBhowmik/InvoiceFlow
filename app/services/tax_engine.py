"""
Tax Determination & Calculation Engine.
Evaluates category, vendor country, amount slabs, and date validity.
Supports tax-inclusive/exclusive reconciliation and reverse charge.
"""

from typing import Dict, Any, Optional
from datetime import date


class TaxEngine:
    @classmethod
    def calculate_tax_breakdown(
        cls,
        taxable_amount: float,
        tax_rate_percent: float,
        is_tax_inclusive: bool = False,
    ) -> Dict[str, float]:
        rate_fraction = tax_rate_percent / 100.0

        if is_tax_inclusive:
            base_amount = taxable_amount / (1.0 + rate_fraction)
            tax_amount = taxable_amount - base_amount
            gross_amount = taxable_amount
        else:
            base_amount = taxable_amount
            tax_amount = taxable_amount * rate_fraction
            gross_amount = base_amount + tax_amount

        return {
            "base_amount": round(base_amount, 2),
            "tax_amount": round(tax_amount, 2),
            "gross_amount": round(gross_amount, 2),
        }
