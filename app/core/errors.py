"""
Structured Error & Validation Catalog Provider.
No hardcoded error strings in business logic - all lookups query error_catalog.
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class CatalogError:
    code: str
    prefix: str
    severity: str
    message_template: str
    remediation: Optional[str] = None
    auto_action: str = "ROUTE_TO_REVIEW"
    is_retryable: bool = False

    def format_message(self, **kwargs: Any) -> str:
        try:
            return self.message_template.format(**kwargs)
        except Exception:
            return self.message_template


class ErrorCatalogRegistry:
    _instance = None
    _cache: Dict[str, CatalogError] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ErrorCatalogRegistry, cls).__new__(cls)
        return cls._instance

    def register(self, error: CatalogError) -> None:
        self._cache[error.code] = error

    def get(self, code: str) -> Optional[CatalogError]:
        return self._cache.get(code)

    def load_from_db_records(self, records: list[Dict[str, Any]]) -> None:
        for r in records:
            self._cache[r["error_code"]] = CatalogError(
                code=r["error_code"],
                prefix=r["domain_prefix"],
                severity=r["severity"],
                message_template=r["message_template"],
                remediation=r.get("remediation_text"),
                auto_action=r.get("auto_action", "ROUTE_TO_REVIEW"),
                is_retryable=r.get("is_retryable", False),
            )


error_catalog_registry = ErrorCatalogRegistry()
