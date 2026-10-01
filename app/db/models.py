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
    stream_code: Mapped[str] = mapped_column(String(50), default="STREAM_A_ITH_TRAVEL")
    subcategory: Mapped[str] = mapped_column(String(50), default="HOTEL")
    trip_id: Mapped[Optional[str]] = mapped_column(String(60))
    email_message_id: Mapped[Optional[str]] = mapped_column(String(255))
    email_conversation_id: Mapped[Optional[str]] = mapped_column(String(255))
    sender_email: Mapped[Optional[str]] = mapped_column(String(255))
    received_to_returned_seconds: Mapped[Optional[int]] = mapped_column(Integer)
    ai_tokens_input: Mapped[int] = mapped_column(Integer, default=0)
    ai_tokens_output: Mapped[int] = mapped_column(Integer, default=0)
    ai_cost_inr: Mapped[float] = mapped_column(Numeric(10, 4), default=0.0)
    ai_cost_npr: Mapped[float] = mapped_column(Numeric(10, 4), default=0.0)
    bs_invoice_date: Mapped[Optional[str]] = mapped_column(String(20))
    profit_center_code: Mapped[Optional[str]] = mapped_column(String(50))
    cross_stream_link_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))


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


class ProcessingStream(Base, TimestampMixin):
    __tablename__ = "processing_stream"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stream_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    stream_name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    purpose: Mapped[str] = mapped_column(String(50), default="VENDOR_PAYMENT")
    target_erp: Mapped[str] = mapped_column(String(50), default="SAP_ECC")
    export_profile_key: Mapped[str] = mapped_column(String(100), nullable=False)
    scheduler_cron: Mapped[str] = mapped_column(String(50), default="0 * * * *")
    auto_approve_threshold: Mapped[float] = mapped_column(Numeric(5, 2), default=95.00)
    notification_template_key: Mapped[str] = mapped_column(String(100), default="STREAM_PROCESSED_SUMMARY")
    reply_to_mode: Mapped[str] = mapped_column(String(50), default="REPLY_ALL")
    finance_notification_email: Mapped[Optional[str]] = mapped_column(String(255))
    detection_priority: Mapped[int] = mapped_column(Integer, default=10)
    detection_rules: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict)


class ProcessingStreamSubcategory(Base):
    __tablename__ = "processing_stream_subcategory"
    __table_args__ = (
        UniqueConstraint("stream_code", "subcategory_code", name="uq_stream_subcat_model"),
        {"schema": "invoiceflow"}
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stream_code: Mapped[str] = mapped_column(String(50), nullable=False)
    subcategory_code: Mapped[str] = mapped_column(String(50), nullable=False)
    subcategory_name: Mapped[str] = mapped_column(String(150), nullable=False)
    mandatory_field_keys: Mapped[List[str]] = mapped_column(JSONB, default=list)
    default_expense_gl: Mapped[Optional[str]] = mapped_column(String(50))
    default_cost_center: Mapped[Optional[str]] = mapped_column(String(50))
    default_booking_type: Mapped[Optional[str]] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class StreamCrossLink(Base):
    __tablename__ = "stream_cross_link"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    primary_document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    secondary_document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    link_reason: Mapped[str] = mapped_column(String(60), default="TICKET_PNR_MATCH")
    match_key: Mapped[str] = mapped_column(String(150), nullable=False)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    is_flagged_double_claim: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_by: Mapped[Optional[str]] = mapped_column(String(120))
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class TripReference(Base):
    __tablename__ = "trip_reference"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    employee_code: Mapped[str] = mapped_column(String(60), nullable=False)
    traveler_name: Mapped[Optional[str]] = mapped_column(String(150))
    cost_center_code: Mapped[str] = mapped_column(String(50), nullable=False)
    company_code: Mapped[str] = mapped_column(String(20), default="1000")
    travel_start_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    travel_end_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    origin_city: Mapped[Optional[str]] = mapped_column(String(100))
    destination_city: Mapped[Optional[str]] = mapped_column(String(100))
    approved_budget: Mapped[float] = mapped_column(Numeric(18, 4), default=0.0)
    status: Mapped[str] = mapped_column(String(30), default="APPROVED")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class TaxRegime(Base):
    __tablename__ = "tax_regime"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    regime_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    regime_name: Mapped[str] = mapped_column(String(150), nullable=False)
    country_code: Mapped[str] = mapped_column(String(10), nullable=False)
    tax_type: Mapped[str] = mapped_column(String(30), default="VAT")
    identifier_name: Mapped[str] = mapped_column(String(50), default="PAN")
    identifier_regex: Mapped[str] = mapped_column(String(255), nullable=False)
    checksum_validator: Mapped[Optional[str]] = mapped_column(String(60), default="MOD9")
    standard_tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=13.00)
    input_tax_claimable: Mapped[bool] = mapped_column(Boolean, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class BikramSambatCalendar(Base):
    __tablename__ = "bikram_sambat_calendar"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ad_date: Mapped[datetime] = mapped_column(Date, unique=True, nullable=False)
    bs_year: Mapped[int] = mapped_column(Integer, nullable=False)
    bs_month: Mapped[int] = mapped_column(Integer, nullable=False)
    bs_day: Mapped[int] = mapped_column(Integer, nullable=False)
    bs_date_str: Mapped[str] = mapped_column(String(20), nullable=False)
    bs_month_name_nepali: Mapped[str] = mapped_column(String(50), nullable=False)
    bs_month_name_roman: Mapped[str] = mapped_column(String(50), nullable=False)
    nepal_fiscal_year: Mapped[str] = mapped_column(String(20), nullable=False)
    nepal_fiscal_period: Mapped[int] = mapped_column(Integer, nullable=False)
    is_working_day: Mapped[bool] = mapped_column(Boolean, default=True)


class MasterImportProfile(Base):
    __tablename__ = "master_import_profile"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_key: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    master_type: Mapped[str] = mapped_column(String(60), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    receiving_mailbox: Mapped[str] = mapped_column(String(255), nullable=False)
    allowed_sender_domains: Mapped[List[str]] = mapped_column(JSONB, default=list)
    subject_pattern: Mapped[str] = mapped_column(String(255), nullable=False)
    file_name_pattern: Mapped[str] = mapped_column(String(255), nullable=False)
    column_mapping: Mapped[Dict[str, str]] = mapped_column(JSONB, nullable=False)
    key_columns: Mapped[List[str]] = mapped_column(JSONB, nullable=False)
    import_mode: Mapped[str] = mapped_column(String(30), default="UPSERT")
    require_admin_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    max_deactivation_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=10.00)
    notification_email: Mapped[Optional[str]] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class MasterImportBatch(Base):
    __tablename__ = "master_import_batch"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_number: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    profile_key: Mapped[str] = mapped_column(String(60), nullable=False)
    source_channel: Mapped[str] = mapped_column(String(30), default="EMAIL")
    sender_email: Mapped[Optional[str]] = mapped_column(String(255))
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    total_rows: Mapped[int] = mapped_column(Integer, default=0)
    rows_added: Mapped[int] = mapped_column(Integer, default=0)
    rows_updated: Mapped[int] = mapped_column(Integer, default=0)
    rows_deactivated: Mapped[int] = mapped_column(Integer, default=0)
    rows_failed: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(30), default="RECEIVED")
    safety_threshold_breached: Mapped[bool] = mapped_column(Boolean, default=False)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text)
    approved_by: Mapped[Optional[str]] = mapped_column(String(120))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    applied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    diff_summary: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB)
    snapshot_data_uri: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class EvaluationSet(Base):
    __tablename__ = "evaluation_set"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    set_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    folder_path: Mapped[Optional[str]] = mapped_column(String(255))
    total_samples: Mapped[int] = mapped_column(Integer, default=0)
    sample_categories: Mapped[List[str]] = mapped_column(JSONB, default=list)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by: Mapped[str] = mapped_column(String(120), default="system")


class GroundTruthRecord(Base):
    __tablename__ = "ground_truth_record"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evaluation_set_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("invoiceflow.evaluation_set.id", ondelete="CASCADE"))
    sample_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    stream_code: Mapped[str] = mapped_column(String(50), default="STREAM_A_ITH_TRAVEL")
    subcategory: Mapped[Optional[str]] = mapped_column(String(50))
    is_nepali_language: Mapped[bool] = mapped_column(Boolean, default=False)
    is_handwritten: Mapped[bool] = mapped_column(Boolean, default=False)
    ground_truth_fields: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    ground_truth_line_items: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, default=list)
    verified_by: Mapped[str] = mapped_column(String(120), nullable=False)
    verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    notes: Mapped[Optional[str]] = mapped_column(Text)


class EvaluationRun(Base):
    __tablename__ = "evaluation_run"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_code: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    evaluation_set_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("invoiceflow.evaluation_set.id"))
    model_profile: Mapped[str] = mapped_column(String(100), nullable=False)
    total_evaluated: Mapped[int] = mapped_column(Integer, default=0)
    overall_exact_match_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    overall_tolerance_match_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    stp_rate_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    nepali_language_accuracy_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    avg_latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    avg_tokens_input: Mapped[int] = mapped_column(Integer, default=0)
    avg_tokens_output: Mapped[int] = mapped_column(Integer, default=0)
    avg_cost_inr: Mapped[float] = mapped_column(Numeric(10, 4), default=0.0)
    avg_cost_npr: Mapped[float] = mapped_column(Numeric(10, 4), default=0.0)
    markdown_report: Mapped[Optional[str]] = mapped_column(Text)
    excel_report_uri: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="COMPLETED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AccuracyCorrectionLog(Base):
    __tablename__ = "accuracy_correction_log"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    stream_code: Mapped[Optional[str]] = mapped_column(String(50))
    vendor_code: Mapped[Optional[str]] = mapped_column(String(50))
    field_key: Mapped[str] = mapped_column(String(100), nullable=False)
    original_extracted_value: Mapped[Optional[str]] = mapped_column(Text)
    corrected_value: Mapped[Optional[str]] = mapped_column(Text)
    confidence_at_extraction: Mapped[Optional[float]] = mapped_column(Numeric(5, 2))
    extractor_name: Mapped[Optional[str]] = mapped_column(String(100))
    ai_model_version: Mapped[Optional[str]] = mapped_column(String(100))
    corrected_by: Mapped[str] = mapped_column(String(120), nullable=False)
    corrected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    correction_reason: Mapped[Optional[str]] = mapped_column(Text)


class AiModelPricing(Base):
    __tablename__ = "ai_model_pricing"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    provider_name: Mapped[str] = mapped_column(String(60), nullable=False)
    price_per_1m_input_usd: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    price_per_1m_output_usd: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    benchmark_inr_target: Mapped[float] = mapped_column(Numeric(10, 4), default=0.1500)
    usd_to_inr_rate: Mapped[float] = mapped_column(Numeric(10, 4), default=83.5000)
    inr_to_npr_rate: Mapped[float] = mapped_column(Numeric(10, 4), default=1.6000)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class ProfitCenter(Base):
    __tablename__ = "profit_center"
    __table_args__ = {"schema": "invoiceflow"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profit_center_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    profit_center_name: Mapped[str] = mapped_column(String(150), nullable=False)
    company_code: Mapped[str] = mapped_column(String(20), default="1000")
    segment_code: Mapped[Optional[str]] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

