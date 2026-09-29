"""
SAP ECC Export Builder Service.
Completely driven by export_profile and export_column master configuration.
Generates compliant CSV and fixed-width / delimited TXT files with control totals.
"""

from typing import List, Dict, Any, Tuple
import hashlib
from datetime import datetime


class SapEccExportService:
    @staticmethod
    def format_value(val: Any, col_config: Dict[str, Any], date_format: str = "DD.MM.YYYY") -> str:
        if val is None:
            val = col_config.get("constant_value") or ""

        str_val = str(val)
        rule = col_config.get("transformation_rule")

        # Transformations
        if rule == "PAD_ZERO":
            length = col_config.get("field_length") or 10
            str_val = str_val.zfill(length)
        elif rule == "UPPERCASE":
            str_val = str_val.upper()
        elif rule == "TRIM":
            str_val = str_val.strip()
        elif rule == "DATE_SAP":
            # Normalize to DD.MM.YYYY or YYYYMMDD
            try:
                dt = datetime.strptime(str_val[:10], "%Y-%m-%d")
                if date_format == "DD.MM.YYYY":
                    str_val = dt.strftime("%d.%m.%Y")
                elif date_format == "YYYYMMDD":
                    str_val = dt.strftime("%Y%m%d")
            except Exception:
                pass

        # Fixed width padding if requested
        length = col_config.get("field_length")
        pad_char = col_config.get("pad_char", " ") or " "
        alignment = col_config.get("alignment", "LEFT")

        if length and length > 0:
            if len(str_val) > length:
                str_val = str_val[:length]
            elif alignment == "RIGHT":
                str_val = str_val.rjust(length, pad_char)
            else:
                str_val = str_val.ljust(length, pad_char)

        return str_val

    @classmethod
    def generate_csv(
        cls,
        profile: Dict[str, Any],
        columns: List[Dict[str, Any]],
        documents_with_items: List[Dict[str, Any]]
    ) -> Tuple[str, Dict[str, Any]]:
        delimiter = profile.get("csv_delimiter", ",")
        quote_char = profile.get("csv_quote_char", '"')
        include_header = profile.get("include_header_row", True)
        date_format = profile.get("date_format", "DD.MM.YYYY")
        line_ending = "\r\n" if profile.get("line_ending") == "CRLF" else "\n"

        sorted_cols = sorted(columns, key=lambda c: c.get("column_order", 0))

        lines: List[str] = []

        # 1. Header row
        if include_header:
            header_cells = [f"{quote_char}{c.get('header_text')}{quote_char}" for c in sorted_cols]
            lines.append(delimiter.join(header_cells))

        total_debit = 0.0
        total_credit = 0.0
        doc_count = len(documents_with_items)

        # 2. Document & Item rows
        for doc in documents_with_items:
            doc_fields = doc.get("fields", {})
            items = doc.get("items", [{}])

            for itm in items:
                row_cells: List[str] = []
                for col in sorted_cols:
                    src_key = col.get("source_field_key")
                    val = itm.get(src_key) if src_key in itm else doc_fields.get(src_key)
                    formatted = cls.format_value(val, col, date_format)
                    row_cells.append(f"{quote_char}{formatted}{quote_char}")

                lines.append(delimiter.join(row_cells))

            # Accumulate totals
            amt = float(doc_fields.get("total_amount") or 0.0)
            total_debit += amt

        content = line_ending.join(lines)
        checksum = hashlib.sha256(content.encode("utf-8")).hexdigest()

        control_totals = {
            "total_documents": doc_count,
            "total_debit": round(total_debit, 2),
            "total_credit": round(total_credit, 2),
            "checksum_sha256": checksum,
            "row_count": len(lines),
        }

        return content, control_totals

    @classmethod
    def generate_txt_fixed_width(
        cls,
        profile: Dict[str, Any],
        columns: List[Dict[str, Any]],
        documents_with_items: List[Dict[str, Any]]
    ) -> Tuple[str, Dict[str, Any]]:
        date_format = profile.get("date_format", "DD.MM.YYYY")
        line_ending = "\r\n" if profile.get("line_ending") == "CRLF" else "\n"
        sorted_cols = sorted(columns, key=lambda c: c.get("column_order", 0))

        lines: List[str] = []
        total_debit = 0.0

        for doc in documents_with_items:
            doc_fields = doc.get("fields", {})
            items = doc.get("items", [{}])

            for itm in items:
                line_str = ""
                for col in sorted_cols:
                    src_key = col.get("source_field_key")
                    val = itm.get(src_key) if src_key in itm else doc_fields.get(src_key)
                    formatted = cls.format_value(val, col, date_format)
                    line_str += formatted

                lines.append(line_str)

            amt = float(doc_fields.get("total_amount") or 0.0)
            total_debit += amt

        content = line_ending.join(lines)
        checksum = hashlib.sha256(content.encode("utf-8")).hexdigest()

        return content, {
            "total_documents": len(documents_with_items),
            "total_debit": round(total_debit, 2),
            "checksum_sha256": checksum,
            "row_count": len(lines),
        }
