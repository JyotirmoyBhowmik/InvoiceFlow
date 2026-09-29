"""
Field Schema & Normalization Service.
Validates, normalizes, and casts extracted values according to field_definition specifications.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime


class FieldSchemaService:
    @staticmethod
    def normalize_field_value(raw_val: Any, field_def: Dict[str, Any]) -> str:
        if raw_val is None:
            return ""

        str_val = str(raw_val).strip()
        data_type = field_def.get("data_type", "STRING")

        if data_type == "NUMBER":
            # Strip currency symbols and commas
            cleaned = str_val.replace("$", "").replace(",", "").replace("€", "").replace("£", "").strip()
            return cleaned
        elif data_type == "DATE":
            return str_val[:10]

        return str_val
