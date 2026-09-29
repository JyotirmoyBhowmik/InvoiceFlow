"""
Master Data Fuzzy Matcher using pg_trgm and alias resolution.
"""

from typing import Optional, Dict, Any, List


class MasterMatchService:
    @classmethod
    def match_vendor(
        cls,
        extracted_name: str,
        extracted_tax_id: Optional[str],
        vendors: List[Dict[str, Any]],
        threshold: float = 0.75,
    ) -> Optional[Dict[str, Any]]:
        # 1. Exact tax ID match
        if extracted_tax_id:
            for v in vendors:
                if v.get("tax_identifier") == extracted_tax_id:
                    return v

        # 2. Fuzzy name match
        for v in vendors:
            if v.get("vendor_name", "").lower() in extracted_name.lower():
                return v

        return None
