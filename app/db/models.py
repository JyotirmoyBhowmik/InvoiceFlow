"""
SQLAlchemy 2.0 async models for InvoiceFlow enterprise database.
Directly aligns with schema/00_master.sql.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    String, Boolean, Integer, Numeric, Text, ForeignKey,
    DateTime, Date, JSON, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    created_by: Mapped[str] = mapped_column(String(120), default="system")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    updated_by: Mapped[str] = mapped_column(String(120), default="system")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    version: Mapped[int] = mapped_column(Integer, default=1)


class SystemSetting(Base, TimestampMixin):
    __tablename__ = "system_setting"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    setting_key: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    setting_value: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    data_type: Mapped[str] = mapped_column(String(30), default="string")
    category: Mapped[str] = mapped_column(String(60), default="SYSTEM")
    is_secret: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[Optional[str]] = mapped_column(Text)


class ErrorCatalog(Base, TimestampMixin):
    __tablename__ = "error_catalog"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    error_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    domain_prefix: Mapped[str] = mapped_column(String(20), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    message_template: Mapped[str] = mapped_column(Text, nullable=False)
    remediation_text: Mapped[Optional[str]] = mapped_column(Text)
    auto_action: Mapped[str] = mapped_column(String(50), default="ROUTE_TO_REVIEW")
    is_retryable: Mapped[bool] = mapped_column(Boolean, default=False)


class FieldDefinition(Base, TimestampMixin):
    __tablename__ = "field_definition"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    field_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    display_label: Mapped[str] = mapped_column(String(150), nullable=False)
    data_type: Mapped[str] = mapped_column(String(40), default="STRING")
    field_group_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=False)
    regex_pattern: Mapped[Optional[str]] = mapped_column(Text)
    min_value: Mapped[Optional[float]] = mapped_column(Numeric(18, 4))
    max_value: Mapped[Optional[float]] = mapped_column(Numeric(18, 4))
    default_value_expr: Mapped[Optional[str]] = mapped_column(Text)
    ui_order: Mapped[int] = mapped_column(Integer, default=10)
    visible_flag: Mapped[bool] = mapped_column(Boolean, default=True)
    editable_flag: Mapped[bool] = mapped_column(Boolean, default=True)
    ai_hint_text: Mapped[Optional[str]] = mapped_column(Text)
    export_column_name: Mapped[Optional[str]] = mapped_column(String(100))
    export_order: Mapped[Optional[int]] = mapped_column(Integer)
    format_mask: Mapped[Optional[str]] = mapped_column(String(50))


class Document(Base, TimestampMixin):
    __tablename__ = "document"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_number: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    source_type: Mapped[str] = mapped_column(String(40), default="MAILBOX")
    source_reference_id: Mapped[Optional[str]] = mapped_column(String(500))
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_uri: Mapped[str] = mapped_column(String(1000), nullable=False)
    total_pages: Mapped[int] = mapped_column(Integer, default=1)
    document_status: Mapped[str] = mapped_column(String(40), default="RECEIVED")
    stp_score: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    is_stp_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    total_amount: Mapped[float] = mapped_column(Numeric(18, 4), default=0.0)
    tax_amount: Mapped[float] = mapped_column(Numeric(18, 4), default=0.0)
    currency_code: Mapped[str] = mapped_column(String(3), default="USD")
    document_date: Mapped[Optional[datetime]] = mapped_column(Date)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    approved_by: Mapped[Optional[str]] = mapped_column(String(120))
    review_reason: Mapped[Optional[str]] = mapped_column(Text)


class ExtractedFieldValue(Base):
    __tablename__ = "extracted_field_value"
    __table_args__ = (
        UniqueConstraint("document_id", "field_key", name="uq_doc_field_model"),
        {"schema": "invoiceflow"}
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("invoiceflow.document.id", ondelete="CASCADE"))
    field_definition_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("invoiceflow.field_definition.id"))
    field_key: Mapped[str] = mapped_column(String(100), nullable=False)
    raw_extracted_value: Mapped[Optional[str]] = mapped_column(Text)
    normalized_value: Mapped[Optional[str]] = mapped_column(Text)
    confidence_score: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    extraction_source: Mapped[str] = mapped_column(String(40), default="AI")
    bounding_box: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB)
    is_manually_edited: Mapped[bool] = mapped_column(Boolean, default=False)
    edited_by: Mapped[Optional[str]] = mapped_column(String(120))
    edited_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class Rule(Base, TimestampMixin):
    __tablename__ = "rule"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_set_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    rule_code: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    rule_name: Mapped[str] = mapped_column(String(150), nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=10)
    stop_on_match: Mapped[bool] = mapped_column(Boolean, default=True)
    condition_tree: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    action_set: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)


class ExportProfile(Base, TimestampMixin):
    __tablename__ = "export_profile"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_key: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    profile_name: Mapped[str] = mapped_column(String(150), nullable=False)
    target_erp: Mapped[str] = mapped_column(String(40), default="SAP_ECC")
    file_format: Mapped[str] = mapped_column(String(20), default="CSV")
    csv_delimiter: Mapped[str] = mapped_column(String(1), default=",")
    csv_quote_char: Mapped[str] = mapped_column(String(1), default='"')
    include_header_row: Mapped[bool] = mapped_column(Boolean, default=True)
    line_ending: Mapped[str] = mapped_column(String(10), default="CRLF")
    encoding: Mapped[str] = mapped_column(String(30), default="UTF-8")
    date_format: Mapped[str] = mapped_column(String(30), default="DD.MM.YYYY")
    decimal_separator: Mapped[str] = mapped_column(String(1), default=".")
    negative_sign_format: Mapped[str] = mapped_column(String(20), default="TRAILING")
    file_name_template: Mapped[str] = mapped_column(String(255), default="SAP_INV_{company_code}_{date}_{run_no}.csv")


class ExportColumn(Base):
    __tablename__ = "export_column"
    __table_args__ = (
        UniqueConstraint("export_profile_id", "column_order", name="uq_exp_col_order_model"),
        {"schema": "invoiceflow"}
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    export_profile_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("invoiceflow.export_profile.id", ondelete="CASCADE"))
    column_order: Mapped[int] = mapped_column(Integer, nullable=False)
    header_text: Mapped[str] = mapped_column(String(100), nullable=False)
    record_type: Mapped[str] = mapped_column(String(20), default="ITEM")
    source_field_key: Mapped[Optional[str]] = mapped_column(String(100))
    constant_value: Mapped[Optional[str]] = mapped_column(String(255))
    transformation_rule: Mapped[Optional[str]] = mapped_column(String(100))
    field_length: Mapped[Optional[int]] = mapped_column(Integer)
    pad_char: Mapped[Optional[str]] = mapped_column(String(1), default=" ")
    alignment: Mapped[Optional[str]] = mapped_column(String(10), default="LEFT")
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=False)
