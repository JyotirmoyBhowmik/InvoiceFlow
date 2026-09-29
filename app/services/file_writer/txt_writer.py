"""
SAP ECC Fixed-Width & Delimited TXT File Writer.
Supports column padding, alignment, and record-type indicators.
"""

from typing import List, Dict, Any


class TxtFileWriter:
    @staticmethod
    def write_fixed_width(
        columns: List[Dict[str, Any]],
        rows: List[Dict[str, Any]],
    ) -> str:
        sorted_cols = sorted(columns, key=lambda c: c.get("column_order", 0))
        lines: List[str] = []

        for row in rows:
            line_str = ""
            for c in sorted_cols:
                val = str(row.get(c.get("source_field_key", ""), ""))
                length = c.get("field_length") or 10
                pad = c.get("pad_char") or " "
                alignment = c.get("alignment", "LEFT")

                if len(val) > length:
                    val = val[:length]
                elif alignment == "RIGHT":
                    val = val.rjust(length, pad)
                else:
                    val = val.ljust(length, pad)

                line_str += val

            lines.append(line_str)

        return "\r\n".join(lines)
