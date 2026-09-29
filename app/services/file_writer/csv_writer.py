"""
SAP ECC Compliant CSV File Writer.
Fully metadata-driven from export_profile and export_column tables.
"""

from typing import List, Dict, Any


class CsvFileWriter:
    @staticmethod
    def write_csv(
        columns: List[Dict[str, Any]],
        rows: List[Dict[str, Any]],
        delimiter: str = ",",
        quote_char: str = '"',
        include_header: bool = True,
    ) -> str:
        sorted_cols = sorted(columns, key=lambda c: c.get("column_order", 0))
        lines: List[str] = []

        if include_header:
            headers = [f"{quote_char}{c.get('header_text')}{quote_char}" for c in sorted_cols]
            lines.append(delimiter.join(headers))

        for row in rows:
            cells = [f"{quote_char}{str(row.get(c.get('source_field_key', ''), ''))}{quote_char}" for c in sorted_cols]
            lines.append(delimiter.join(cells))

        return "\r\n".join(lines)
