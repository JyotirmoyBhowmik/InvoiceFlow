-- =============================================================================
-- INVOICEFLOW ENTERPRISE DATABASE MIGRATION - PROMPT 03
-- File: schema/10_prompt03_changes.sql
-- Reference Solution Alignment: Travel-Agency / ITH & Airline Tax Streams,
-- Master Import by Email, Nepal VAT / Bikram Sambat, Evaluation Harness,
-- Architecture Portability, and Cost Transparency
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS invoiceflow;
SET search_path TO invoiceflow, public;

-- -----------------------------------------------------------------------------
-- 1. PROCESSING STREAMS MASTER TABLE (Part A)
-- Streams are configurable data, not code branches.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS processing_stream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_code VARCHAR(50) NOT NULL UNIQUE,
    stream_name VARCHAR(150) NOT NULL,
    description TEXT,
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('VENDOR_PAYMENT', 'TAX_CREDIT_CLAIM', 'GENERAL')),
    target_erp VARCHAR(50) NOT NULL DEFAULT 'SAP_ECC',
    export_profile_key VARCHAR(100) NOT NULL,
    scheduler_cron VARCHAR(50) NOT NULL DEFAULT '0 * * * *', -- Hourly at :00
    auto_approve_threshold NUMERIC(5, 2) NOT NULL DEFAULT 95.00,
    notification_template_key VARCHAR(100) NOT NULL DEFAULT 'STREAM_PROCESSED_SUMMARY',
    reply_to_mode VARCHAR(50) NOT NULL DEFAULT 'REPLY_ALL' CHECK (reply_to_mode IN ('ORIGINAL_SENDER', 'FINANCE_MAILBOX', 'BOTH', 'DISTRIBUTION_LIST')),
    finance_notification_email VARCHAR(255),
    detection_priority INT NOT NULL DEFAULT 10,
    detection_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120) DEFAULT 'system',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(120) DEFAULT 'system',
    version INT NOT NULL DEFAULT 1
);
COMMENT ON TABLE processing_stream IS 'Configurable business processing streams (e.g. Travel-Agency ITH vendor payment vs Airline GST/VAT tax credit claims)';

-- Sub-categories within streams (e.g. Stream A: Hotel, Air, Train, Cab)
CREATE TABLE IF NOT EXISTS processing_stream_subcategory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_code VARCHAR(50) NOT NULL REFERENCES processing_stream(stream_code) ON DELETE CASCADE,
    subcategory_code VARCHAR(50) NOT NULL,
    subcategory_name VARCHAR(150) NOT NULL,
    mandatory_field_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
    default_expense_gl VARCHAR(50),
    default_cost_center VARCHAR(50),
    default_booking_type VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 1,
    CONSTRAINT uq_stream_subcategory UNIQUE (stream_code, subcategory_code)
);
COMMENT ON TABLE processing_stream_subcategory IS 'Sub-categories per stream with specialized mandatory field matrices and defaulting';

-- Cross-stream link table (e.g. airline ticket billed via ITH payment and claimed for tax credit)
CREATE TABLE IF NOT EXISTS stream_cross_link (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_document_id UUID NOT NULL,
    secondary_document_id UUID NOT NULL,
    link_reason VARCHAR(60) NOT NULL DEFAULT 'TICKET_PNR_MATCH',
    match_key VARCHAR(150) NOT NULL, -- PNR or Ticket Number
    detected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_flagged_double_claim BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by VARCHAR(120),
    resolved_at TIMESTAMPTZ,
    CONSTRAINT uq_stream_cross_link UNIQUE (primary_document_id, secondary_document_id)
);
COMMENT ON TABLE stream_cross_link IS 'Links travel payment records with tax credit claims to prevent double posting or duplicate claims';

-- Trip ID Master & Reference Registry
CREATE TABLE IF NOT EXISTS trip_reference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id VARCHAR(60) NOT NULL UNIQUE,
    employee_code VARCHAR(60) NOT NULL,
    traveler_name VARCHAR(150),
    cost_center_code VARCHAR(50) NOT NULL,
    company_code VARCHAR(20) NOT NULL DEFAULT '1000',
    travel_start_date DATE NOT NULL,
    travel_end_date DATE NOT NULL,
    origin_city VARCHAR(100),
    destination_city VARCHAR(100),
    approved_budget NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(30) NOT NULL DEFAULT 'APPROVED',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE trip_reference IS 'Travel authorizations and trip references against which trip IDs and fallback travel keys are matched';

-- -----------------------------------------------------------------------------
-- 2. TAX REGIMES (Part D.2, Part E)
-- Multi-regime tax master (Nepal VAT, India GST, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tax_regime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regime_code VARCHAR(50) NOT NULL UNIQUE,
    regime_name VARCHAR(150) NOT NULL,
    country_code VARCHAR(10) NOT NULL, -- NP, IN
    tax_type VARCHAR(30) NOT NULL DEFAULT 'VAT', -- VAT, GST
    identifier_name VARCHAR(50) NOT NULL DEFAULT 'PAN', -- PAN (Nepal 9 digits), GSTIN (India 15 chars)
    identifier_regex VARCHAR(255) NOT NULL,
    checksum_validator VARCHAR(60) DEFAULT 'MOD9',
    standard_tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 13.00,
    input_tax_claimable BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE tax_regime IS 'Regime-driven tax master supporting Nepal VAT, India GST, and global jurisdictions';

-- -----------------------------------------------------------------------------
-- 3. BIKRAM SAMBAT (B.S.) CALENDAR MASTER (Part E.3)
-- Admin-maintained database conversion table for B.S. to A.D. and Nepal Fiscal Year
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bikram_sambat_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_date DATE NOT NULL UNIQUE,
    bs_year INT NOT NULL,
    bs_month INT NOT NULL,
    bs_day INT NOT NULL,
    bs_date_str VARCHAR(20) NOT NULL, -- e.g. '2083-06-08'
    bs_month_name_nepali VARCHAR(50) NOT NULL, -- e.g. 'आश्विन'
    bs_month_name_roman VARCHAR(50) NOT NULL, -- e.g. 'Ashwin'
    nepal_fiscal_year VARCHAR(20) NOT NULL, -- e.g. '2083/84'
    nepal_fiscal_period INT NOT NULL, -- Period 1 (Shrawan) to 12 (Ashadh)
    is_working_day BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bs_calendar_bs_date ON bikram_sambat_calendar (bs_year, bs_month, bs_day);
CREATE INDEX IF NOT EXISTS idx_bs_calendar_ad_date ON bikram_sambat_calendar (ad_date);
COMMENT ON TABLE bikram_sambat_calendar IS 'Maintainable calendar mapping Bikram Sambat dates to Gregorian dates and Nepal fiscal periods';

-- -----------------------------------------------------------------------------
-- 4. MASTER UPDATES BY EMAIL (Part D.4)
-- Dedicated automated email-based master ingestion with diff, validation, safety check & rollback
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_import_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_key VARCHAR(60) NOT NULL UNIQUE,
    master_type VARCHAR(60) NOT NULL CHECK (master_type IN ('VENDOR', 'GL_ACCOUNT', 'COST_CENTER', 'PROFIT_CENTER', 'TAX_CODE', 'EMPLOYEE', 'TRIP_REFERENCE')),
    description TEXT,
    receiving_mailbox VARCHAR(255) NOT NULL,
    allowed_sender_domains JSONB NOT NULL DEFAULT '["@enterprise.internal", "@snpl.com.np"]'::jsonb,
    subject_pattern VARCHAR(255) NOT NULL,
    file_name_pattern VARCHAR(255) NOT NULL,
    column_mapping JSONB NOT NULL,
    key_columns JSONB NOT NULL,
    import_mode VARCHAR(30) NOT NULL DEFAULT 'UPSERT' CHECK (import_mode IN ('UPSERT', 'FULL_REPLACE', 'DELTA')),
    require_admin_approval BOOLEAN NOT NULL DEFAULT FALSE,
    max_deactivation_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    notification_email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE master_import_profile IS 'Rules for ingesting master data updates automatically via CSV/Excel emails';

CREATE TABLE IF NOT EXISTS master_import_batch (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number VARCHAR(60) NOT NULL UNIQUE,
    profile_key VARCHAR(60) NOT NULL REFERENCES master_import_profile(profile_key),
    source_channel VARCHAR(30) NOT NULL DEFAULT 'EMAIL' CHECK (source_channel IN ('EMAIL', 'MANUAL_UPLOAD', 'CLI', 'API')),
    sender_email VARCHAR(255),
    original_filename VARCHAR(255) NOT NULL,
    file_sha256 VARCHAR(64) NOT NULL,
    total_rows INT NOT NULL DEFAULT 0,
    rows_added INT NOT NULL DEFAULT 0,
    rows_updated INT NOT NULL DEFAULT 0,
    rows_deactivated INT NOT NULL DEFAULT 0,
    rows_failed INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'VALIDATING', 'DIFF_CALCULATED', 'PENDING_APPROVAL', 'APPLIED', 'REJECTED', 'ROLLED_BACK')),
    safety_threshold_breached BOOLEAN NOT NULL DEFAULT FALSE,
    rejection_reason TEXT,
    approved_by VARCHAR(120),
    approved_at TIMESTAMPTZ,
    applied_at TIMESTAMPTZ,
    diff_summary JSONB,
    snapshot_data_uri TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE master_import_batch IS 'Execution batches for master updates with automated diff, validation, and rollback metadata';

-- -----------------------------------------------------------------------------
-- 5. ACCURACY EVALUATION HARNESS (Part G)
-- Ground truth evaluation on real Customer invoices without fabricated data
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evaluation_set (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    folder_path VARCHAR(255),
    total_samples INT NOT NULL DEFAULT 0,
    sample_categories JSONB DEFAULT '[]'::jsonb,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120) DEFAULT 'system'
);
COMMENT ON TABLE evaluation_set IS 'Registered real Customer invoice evaluation sets for accuracy validation';

CREATE TABLE IF NOT EXISTS ground_truth_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_set_id UUID NOT NULL REFERENCES evaluation_set(id) ON DELETE CASCADE,
    sample_filename VARCHAR(255) NOT NULL,
    file_sha256 VARCHAR(64) NOT NULL,
    stream_code VARCHAR(50) NOT NULL DEFAULT 'STREAM_A_ITH_TRAVEL',
    subcategory VARCHAR(50),
    is_nepali_language BOOLEAN NOT NULL DEFAULT FALSE,
    is_handwritten BOOLEAN NOT NULL DEFAULT FALSE,
    ground_truth_fields JSONB NOT NULL,
    ground_truth_line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    verified_by VARCHAR(120) NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    CONSTRAINT uq_sample_ground_truth UNIQUE (evaluation_set_id, sample_filename)
);
COMMENT ON TABLE ground_truth_record IS 'Audited human ground-truth data entered once for evaluation accuracy comparison';

CREATE TABLE IF NOT EXISTS evaluation_run (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_code VARCHAR(60) NOT NULL UNIQUE,
    evaluation_set_id UUID NOT NULL REFERENCES evaluation_set(id),
    model_profile VARCHAR(100) NOT NULL,
    total_evaluated INT NOT NULL DEFAULT 0,
    overall_exact_match_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    overall_tolerance_match_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    stp_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    nepali_language_accuracy_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    avg_latency_ms INT NOT NULL DEFAULT 0,
    avg_tokens_input INT NOT NULL DEFAULT 0,
    avg_tokens_output INT NOT NULL DEFAULT 0,
    avg_cost_inr NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
    avg_cost_npr NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
    markdown_report TEXT,
    excel_report_uri TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE evaluation_run IS 'Execution records of sandbox accuracy evaluations across models and language profiles';

-- -----------------------------------------------------------------------------
-- 6. ACCURACY TRACKING & HUMAN CORRECTION LOG (Part F.4)
-- Records every human correction against original extraction to provide live production accuracy
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accuracy_correction_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    stream_code VARCHAR(50),
    vendor_code VARCHAR(50),
    field_key VARCHAR(100) NOT NULL,
    original_extracted_value TEXT,
    corrected_value TEXT,
    confidence_at_extraction NUMERIC(5, 2),
    extractor_name VARCHAR(100),
    ai_model_version VARCHAR(100),
    corrected_by VARCHAR(120) NOT NULL,
    corrected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    correction_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_correction_log_field ON accuracy_correction_log (field_key);
CREATE INDEX IF NOT EXISTS idx_correction_log_vendor ON accuracy_correction_log (vendor_code);
COMMENT ON TABLE accuracy_correction_log IS 'Immutable log of human corrections in Workbench for live accuracy scoring';

-- -----------------------------------------------------------------------------
-- 7. AI MODEL PRICING MASTER (Part I.1)
-- Admin-maintained pricing per token to compute real cost and compare against 15 paisa INR benchmark
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_model_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_key VARCHAR(100) NOT NULL UNIQUE,
    provider_name VARCHAR(60) NOT NULL, -- GOOGLE, AZURE_OPENAI, AWS_BEDROCK, VERTEX
    price_per_1m_input_usd NUMERIC(10, 4) NOT NULL,
    price_per_1m_output_usd NUMERIC(10, 4) NOT NULL,
    benchmark_inr_target NUMERIC(10, 4) NOT NULL DEFAULT 0.1500, -- 15 paisa reference benchmark
    usd_to_inr_rate NUMERIC(10, 4) NOT NULL DEFAULT 83.5000,
    inr_to_npr_rate NUMERIC(10, 4) NOT NULL DEFAULT 1.6000, -- 1 INR = 1.60 NPR pegged
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE ai_model_pricing IS 'Token pricing configuration for accurate per-invoice cost accounting';

-- -----------------------------------------------------------------------------
-- 8. PROFIT CENTER MASTER (Part D.1 - CONFIRM resolution)
-- Resolving ambiguous 'call center' as standard SAP Profit Center
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profit_center (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profit_center_code VARCHAR(50) NOT NULL UNIQUE,
    profit_center_name VARCHAR(150) NOT NULL,
    company_code VARCHAR(20) NOT NULL DEFAULT '1000',
    segment_code VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE profit_center IS 'SAP Profit Center master data mapped against cost centers and business areas';

-- -----------------------------------------------------------------------------
-- 9. EXTEND DOCUMENT & RUN TABLES (Parts A, B, C, I)
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS document 
    ADD COLUMN IF NOT EXISTS stream_code VARCHAR(50) DEFAULT 'STREAM_A_ITH_TRAVEL',
    ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50) DEFAULT 'HOTEL',
    ADD COLUMN IF NOT EXISTS trip_id VARCHAR(60),
    ADD COLUMN IF NOT EXISTS email_message_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS email_conversation_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS sender_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS received_to_returned_seconds INT,
    ADD COLUMN IF NOT EXISTS ai_tokens_input INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_tokens_output INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_cost_inr NUMERIC(10, 4) DEFAULT 0.0000,
    ADD COLUMN IF NOT EXISTS ai_cost_npr NUMERIC(10, 4) DEFAULT 0.0000,
    ADD COLUMN IF NOT EXISTS bs_invoice_date VARCHAR(20),
    ADD COLUMN IF NOT EXISTS profit_center_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cross_stream_link_id UUID;

ALTER TABLE IF EXISTS export_run
    ADD COLUMN IF NOT EXISTS stream_code VARCHAR(50) DEFAULT 'STREAM_A_ITH_TRAVEL',
    ADD COLUMN IF NOT EXISTS mis_package_uri TEXT,
    ADD COLUMN IF NOT EXISTS mis_package_sha256 VARCHAR(64),
    ADD COLUMN IF NOT EXISTS direct_posting_status VARCHAR(30) DEFAULT 'DISABLED_BY_POLICY';
