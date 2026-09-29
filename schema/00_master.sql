-- =============================================================================
-- INVOICEFLOW ENTERPRISE DATABASE MASTER SCHEMA
-- File: schema/00_master.sql
-- Target Database: PostgreSQL 16+
-- Idempotent, Zero Mock Data, Fully Metadata-Driven
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

CREATE SCHEMA IF NOT EXISTS invoiceflow;
SET search_path TO invoiceflow, public;

-- =============================================================================
-- 1. CONFIG & SYSTEM METADATA
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_setting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(120) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    data_type VARCHAR(30) NOT NULL DEFAULT 'string',
    category VARCHAR(60) NOT NULL DEFAULT 'SYSTEM',
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120) DEFAULT 'system',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(120) DEFAULT 'system',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1
);
COMMENT ON TABLE system_setting IS 'Global enterprise configuration flags, timeouts, thresholds and service limits';

CREATE TABLE IF NOT EXISTS error_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_code VARCHAR(50) NOT NULL UNIQUE,
    domain_prefix VARCHAR(20) NOT NULL, -- MAIL, ATCH, OCR, AI, VAL, MSTR, TAX, EXP, SYS, AUTH
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'WARN', 'ERROR', 'BLOCK')),
    message_template TEXT NOT NULL,
    remediation_text TEXT,
    auto_action VARCHAR(50) DEFAULT 'ROUTE_TO_REVIEW',
    is_retryable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120) DEFAULT 'system',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(120) DEFAULT 'system',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1
);
COMMENT ON TABLE error_catalog IS 'Configurable catalog of structured process, validation, and system error codes';

CREATE TABLE IF NOT EXISTS sequence_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_key VARCHAR(60) NOT NULL UNIQUE,
    prefix VARCHAR(20) NOT NULL DEFAULT '',
    current_val BIGINT NOT NULL DEFAULT 1000,
    pad_length INT NOT NULL DEFAULT 8,
    suffix VARCHAR(20) DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS theme (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_key VARCHAR(60) NOT NULL UNIQUE,
    theme_name VARCHAR(120) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    custom_css TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120) DEFAULT 'system',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(120) DEFAULT 'system',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS theme_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES theme(id) ON DELETE CASCADE,
    token_category VARCHAR(60) NOT NULL, -- COLOR, TYPOGRAPHY, SPACING, RADIUS, SHADOW, BORDER, DENSITY
    token_name VARCHAR(100) NOT NULL,   -- e.g. color_primary, font_display, radius_sm
    token_value VARCHAR(255) NOT NULL,
    css_var_name VARCHAR(100) NOT NULL, -- e.g. --color-primary
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_theme_token UNIQUE (theme_id, token_name)
);

CREATE TABLE IF NOT EXISTS branding_asset (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_type VARCHAR(50) NOT NULL UNIQUE, -- LOGO_LIGHT, LOGO_DARK, FAVICON, WATERMARK, REPORT_HEADER
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    public_url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS localization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locale_code VARCHAR(10) NOT NULL UNIQUE,
    locale_name VARCHAR(60) NOT NULL,
    date_format VARCHAR(30) NOT NULL DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(30) NOT NULL DEFAULT 'HH24:MI:SS',
    decimal_separator CHAR(1) NOT NULL DEFAULT '.',
    thousands_separator CHAR(1) NOT NULL DEFAULT ',',
    timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Kathmandu',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- =============================================================================
-- 2. SECURITY & AUDIT
-- =============================================================================

CREATE TABLE IF NOT EXISTS role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key VARCHAR(60) NOT NULL UNIQUE,
    role_name VARCHAR(120) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120) DEFAULT 'system',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(120) DEFAULT 'system',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS permission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_key VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(60) NOT NULL,
    action VARCHAR(60) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    is_sso_only BOOLEAN NOT NULL DEFAULT FALSE,
    sso_provider VARCHAR(50),
    sso_sub VARCHAR(255),
    failed_login_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120) DEFAULT 'system',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(120) DEFAULT 'system',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS secret_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_key VARCHAR(120) NOT NULL UNIQUE,
    encrypted_value BYTEA NOT NULL,
    key_version INT NOT NULL DEFAULT 1,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(120) DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_id UUID,
    actor_name VARCHAR(120) NOT NULL,
    ip_address INET,
    action VARCHAR(60) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    before_state JSONB,
    after_state JSONB,
    diff_summary JSONB
);
CREATE INDEX idx_audit_entity ON audit_log(entity_name, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_log(event_timestamp);

-- =============================================================================
-- 3. DYNAMIC FIELD DEFINITIONS (CORE METADATA ENGINE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS field_group (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_key VARCHAR(60) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    ui_order INT NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS field_definition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_key VARCHAR(100) NOT NULL UNIQUE,
    display_label VARCHAR(150) NOT NULL,
    data_type VARCHAR(40) NOT NULL DEFAULT 'STRING', -- STRING, NUMBER, DATE, BOOLEAN, SELECT, ENTITY_REF
    field_group_id UUID REFERENCES field_group(id),
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    regex_pattern TEXT,
    min_value NUMERIC(18,4),
    max_value NUMERIC(18,4),
    default_value_expr TEXT,
    ui_order INT NOT NULL DEFAULT 10,
    visible_flag BOOLEAN NOT NULL DEFAULT TRUE,
    editable_flag BOOLEAN NOT NULL DEFAULT TRUE,
    ai_hint_text TEXT,
    export_column_name VARCHAR(100),
    export_order INT,
    format_mask VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120) DEFAULT 'system',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(120) DEFAULT 'system',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1
);
CREATE INDEX idx_field_def_order ON field_definition(ui_order);

CREATE TABLE IF NOT EXISTS field_option (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_definition_id UUID NOT NULL REFERENCES field_definition(id) ON DELETE CASCADE,
    option_key VARCHAR(100) NOT NULL,
    option_label VARCHAR(150) NOT NULL,
    sort_order INT NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_field_option UNIQUE (field_definition_id, option_key)
);

-- =============================================================================
-- 4. MASTER DATA (NO FAKE SEEDS — SCHEMA ONLY)
-- =============================================================================

CREATE TABLE IF NOT EXISTS company_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    chart_of_accounts VARCHAR(10),
    fiscal_variant VARCHAR(5),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS division (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_code_id UUID NOT NULL REFERENCES company_code(id),
    division_code VARCHAR(20) NOT NULL,
    division_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_division UNIQUE (company_code_id, division_code)
);

CREATE TABLE IF NOT EXISTS plant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_code_id UUID NOT NULL REFERENCES company_code(id),
    plant_code VARCHAR(20) NOT NULL,
    plant_name VARCHAR(150) NOT NULL,
    city VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_plant UNIQUE (company_code_id, plant_code)
);

CREATE TABLE IF NOT EXISTS vendor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_code VARCHAR(30) NOT NULL UNIQUE,
    vendor_name VARCHAR(255) NOT NULL,
    tax_identifier VARCHAR(60), -- PAN, VAT, GSTIN
    country_code VARCHAR(3) NOT NULL DEFAULT 'NPL',
    state_region VARCHAR(60),
    address_line TEXT,
    contact_email VARCHAR(255),
    payment_terms_code VARCHAR(20),
    recon_account_gl VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_vendor_name_trgm ON vendor USING gin (vendor_name gin_trgm_ops);
CREATE INDEX idx_vendor_tax_id ON vendor (tax_identifier);

CREATE TABLE IF NOT EXISTS vendor_alias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    alias_pattern VARCHAR(255) NOT NULL,
    confidence_weight NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    CONSTRAINT uq_vendor_alias UNIQUE (vendor_id, alias_pattern)
);

CREATE TABLE IF NOT EXISTS vendor_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    bank_name VARCHAR(150) NOT NULL,
    account_number VARCHAR(60) NOT NULL,
    swift_ifsc VARCHAR(30),
    is_primary BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS employee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    official_email VARCHAR(255) NOT NULL UNIQUE,
    department_code VARCHAR(60),
    cost_center_code VARCHAR(30),
    approval_level INT NOT NULL DEFAULT 1,
    grade_level VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_employee_name_trgm ON employee USING gin (full_name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS employee_alias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    alias_string VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS cost_center (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    company_code_id UUID NOT NULL REFERENCES company_code(id),
    department VARCHAR(100),
    manager_employee_id UUID REFERENCES employee(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS profit_center (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    company_code_id UUID NOT NULL REFERENCES company_code(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS account_head (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_head_code VARCHAR(30) NOT NULL UNIQUE,
    account_head_name VARCHAR(150) NOT NULL,
    category_group VARCHAR(60),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS gl_account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gl_code VARCHAR(30) NOT NULL UNIQUE,
    gl_name VARCHAR(150) NOT NULL,
    account_head_id UUID REFERENCES account_head(id),
    company_code_id UUID NOT NULL REFERENCES company_code(id),
    is_balance_sheet BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS expense_category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code VARCHAR(40) NOT NULL UNIQUE, -- TRAVEL, FOOD, HOTEL, FUEL, IT, MISC
    category_name VARCHAR(120) NOT NULL,
    description TEXT,
    default_gl_account_id UUID REFERENCES gl_account(id),
    requires_approval_limit BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS expense_subcategory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES expense_category(id) ON DELETE CASCADE,
    subcategory_code VARCHAR(40) NOT NULL,
    subcategory_name VARCHAR(120) NOT NULL,
    gl_account_id UUID REFERENCES gl_account(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_expense_subcategory UNIQUE (category_id, subcategory_code)
);

CREATE TABLE IF NOT EXISTS tax_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(150) NOT NULL,
    company_code_id UUID REFERENCES company_code(id),
    sap_tax_code VARCHAR(10) NOT NULL,
    is_reverse_charge BOOLEAN NOT NULL DEFAULT FALSE,
    is_withholding BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tax_rate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_code_id UUID NOT NULL REFERENCES tax_code(id) ON DELETE CASCADE,
    rate_percent NUMERIC(7,4) NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL DEFAULT '9999-12-31',
    deductible_percent NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    non_deductible_gl_id UUID REFERENCES gl_account(id),
    CONSTRAINT uq_tax_rate_date UNIQUE (tax_code_id, valid_from)
);

CREATE TABLE IF NOT EXISTS currency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(60) NOT NULL,
    symbol VARCHAR(10),
    decimal_places INT NOT NULL DEFAULT 2,
    is_base_currency BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS exchange_rate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency_code VARCHAR(3) NOT NULL REFERENCES currency(code),
    to_currency_code VARCHAR(3) NOT NULL REFERENCES currency(code),
    rate NUMERIC(18,6) NOT NULL,
    effective_date DATE NOT NULL,
    rate_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    CONSTRAINT uq_exchange_rate UNIQUE (from_currency_code, to_currency_code, effective_date, rate_type)
);

CREATE TABLE IF NOT EXISTS fiscal_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    start_month INT NOT NULL DEFAULT 4, -- e.g. July for Nepali FY (Shrawan)
    start_day INT NOT NULL DEFAULT 16,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS fiscal_period (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID NOT NULL REFERENCES fiscal_calendar(id) ON DELETE CASCADE,
    fiscal_year VARCHAR(10) NOT NULL, -- e.g. 2082-83 or 2026
    period_number INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_posting_open BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_fiscal_period UNIQUE (calendar_id, fiscal_year, period_number)
);

CREATE TABLE IF NOT EXISTS entitlement_limit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES expense_category(id),
    grade_level VARCHAR(30) NOT NULL,
    limit_type VARCHAR(30) NOT NULL, -- PER_DAY, PER_MEAL, PER_TRIP, PER_MONTH
    currency_code VARCHAR(3) NOT NULL REFERENCES currency(code),
    max_amount NUMERIC(18,4) NOT NULL,
    warning_threshold_pct NUMERIC(5,2) DEFAULT 80.00,
    is_hard_block BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS approval_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_code_id UUID REFERENCES company_code(id),
    category_id UUID REFERENCES expense_category(id),
    currency_code VARCHAR(3) NOT NULL REFERENCES currency(code),
    min_amount NUMERIC(18,4) NOT NULL DEFAULT 0.00,
    max_amount NUMERIC(18,4) NOT NULL,
    approver_role VARCHAR(60) NOT NULL,
    sla_hours INT NOT NULL DEFAULT 48,
    escalation_role VARCHAR(60),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- =============================================================================
-- 5. OCR & AI CONFIGURATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS ocr_pipeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_key VARCHAR(60) NOT NULL UNIQUE,
    pipeline_name VARCHAR(120) NOT NULL,
    document_type VARCHAR(50) NOT NULL DEFAULT 'INVOICE',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ocr_pipeline_step (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL REFERENCES ocr_pipeline(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    step_key VARCHAR(60) NOT NULL, -- GRAYSCALE, DESKEW, DENOISE, CONTRAST, UPSCALE, THRESHOLD
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_pipeline_step_order UNIQUE (pipeline_id, step_order)
);

CREATE TABLE IF NOT EXISTS ai_provider (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_key VARCHAR(60) NOT NULL UNIQUE, -- GEMINI, AZURE_DI, OPENAI, ANTHROPIC, AWS_TEXTRACT, GOOGLE_DOCAI
    provider_name VARCHAR(120) NOT NULL,
    api_endpoint TEXT,
    secret_ref VARCHAR(120),
    monthly_budget_usd NUMERIC(10,2) DEFAULT 1000.00,
    current_month_spend_usd NUMERIC(10,2) DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS ai_model (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES ai_provider(id) ON DELETE CASCADE,
    model_alias VARCHAR(80) NOT NULL UNIQUE,
    model_identifier VARCHAR(150) NOT NULL,
    max_tokens INT NOT NULL DEFAULT 4096,
    temperature NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    cost_per_1k_input_tokens NUMERIC(8,6) NOT NULL DEFAULT 0.0001,
    cost_per_1k_output_tokens NUMERIC(8,6) NOT NULL DEFAULT 0.0004,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ai_prompt_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(80) NOT NULL UNIQUE,
    template_name VARCHAR(150) NOT NULL,
    document_type VARCHAR(50) NOT NULL DEFAULT 'INVOICE',
    system_instruction TEXT NOT NULL,
    user_prompt_pattern TEXT NOT NULL,
    json_schema_definition JSONB NOT NULL,
    current_version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_prompt_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_template_id UUID NOT NULL REFERENCES ai_prompt_template(id) ON DELETE CASCADE,
    version_num INT NOT NULL,
    system_instruction TEXT NOT NULL,
    user_prompt_pattern TEXT NOT NULL,
    json_schema_definition JSONB NOT NULL,
    change_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120) DEFAULT 'system',
    CONSTRAINT uq_prompt_version UNIQUE (prompt_template_id, version_num)
);

CREATE TABLE IF NOT EXISTS ai_request_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID,
    provider_key VARCHAR(60) NOT NULL,
    model_identifier VARCHAR(150) NOT NULL,
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    duration_ms INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL,
    error_code VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 6. MAIL INGESTION PROFILES
-- =============================================================================

CREATE TABLE IF NOT EXISTS mailbox_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_key VARCHAR(60) NOT NULL UNIQUE,
    profile_name VARCHAR(150) NOT NULL,
    adapter_type VARCHAR(40) NOT NULL DEFAULT 'MS_GRAPH', -- MS_GRAPH, IMAP, EWS, WATCH_FOLDER
    tenant_id VARCHAR(100),
    client_id VARCHAR(100),
    secret_ref VARCHAR(120),
    mailbox_upn VARCHAR(255) NOT NULL,
    folder_path VARCHAR(255) NOT NULL DEFAULT 'Inbox',
    poll_interval_seconds INT NOT NULL DEFAULT 120,
    use_delta_query BOOLEAN NOT NULL DEFAULT TRUE,
    post_fetch_action VARCHAR(40) NOT NULL DEFAULT 'MOVE_TO_FOLDER', -- LEAVE, MARK_READ, MOVE_TO_FOLDER, CATEGORIZE
    destination_folder VARCHAR(255) DEFAULT 'Processed',
    error_folder VARCHAR(255) DEFAULT 'Failed',
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(40),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mail_filter_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mailbox_profile_id UUID NOT NULL REFERENCES mailbox_profile(id) ON DELETE CASCADE,
    rule_order INT NOT NULL DEFAULT 10,
    filter_type VARCHAR(40) NOT NULL, -- SENDER_DOMAIN_ALLOW, SENDER_DOMAIN_DENY, SUBJECT_REGEX, MIN_ATTACHMENT_SIZE, MAX_ATTACHMENT_SIZE
    filter_expression TEXT NOT NULL,
    action VARCHAR(30) NOT NULL DEFAULT 'ALLOW', -- ALLOW, DROP, DLQ
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS mail_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mailbox_profile_id UUID NOT NULL REFERENCES mailbox_profile(id),
    internet_message_id VARCHAR(500) NOT NULL UNIQUE,
    graph_item_id VARCHAR(500),
    sender_email VARCHAR(255) NOT NULL,
    subject TEXT,
    received_timestamp TIMESTAMPTZ NOT NULL,
    attachment_count INT NOT NULL DEFAULT 0,
    processed_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mail_attachment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mail_message_id UUID NOT NULL REFERENCES mail_message(id) ON DELETE CASCADE,
    attachment_name VARCHAR(500) NOT NULL,
    mime_type VARCHAR(150) NOT NULL,
    size_bytes BIGINT NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    is_inline BOOLEAN NOT NULL DEFAULT FALSE,
    is_archive BOOLEAN NOT NULL DEFAULT FALSE,
    unpack_status VARCHAR(40) DEFAULT 'NOT_APPLICABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_mail_att_hash ON mail_attachment(sha256_hash);

-- =============================================================================
-- 7. DOCUMENTS & EXTRACTIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_number VARCHAR(80) NOT NULL UNIQUE,
    source_type VARCHAR(40) NOT NULL DEFAULT 'MAILBOX', -- MAILBOX, UPLOAD, SFTP, API
    source_reference_id VARCHAR(500),
    original_filename VARCHAR(500) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    storage_uri VARCHAR(1000) NOT NULL,
    total_pages INT NOT NULL DEFAULT 1,
    document_status VARCHAR(40) NOT NULL DEFAULT 'RECEIVED',
    stp_score NUMERIC(5,2) DEFAULT 0.00,
    is_stp_approved BOOLEAN NOT NULL DEFAULT FALSE,
    company_code_id UUID REFERENCES company_code(id),
    vendor_id UUID REFERENCES vendor(id),
    employee_id UUID REFERENCES employee(id),
    expense_category_id UUID REFERENCES expense_category(id),
    currency_code VARCHAR(3) DEFAULT 'USD',
    total_amount NUMERIC(18,4) DEFAULT 0.00,
    tax_amount NUMERIC(18,4) DEFAULT 0.00,
    document_date DATE,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(120),
    review_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1
);
CREATE INDEX idx_doc_status ON document(document_status);
CREATE INDEX idx_doc_date ON document(document_date);
CREATE INDEX idx_doc_hash ON document(sha256_hash);

CREATE TABLE IF NOT EXISTS document_page (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    image_uri VARCHAR(1000) NOT NULL,
    width_px INT NOT NULL DEFAULT 0,
    height_px INT NOT NULL DEFAULT 0,
    dpi INT NOT NULL DEFAULT 300,
    has_native_text BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_document_page UNIQUE (document_id, page_number)
);

CREATE TABLE IF NOT EXISTS ocr_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    page_number INT NOT NULL DEFAULT 1,
    raw_text TEXT NOT NULL,
    mean_confidence NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    engine_name VARCHAR(60) NOT NULL DEFAULT 'TESSERACT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ocr_word_box (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ocr_result_id UUID NOT NULL REFERENCES ocr_result(id) ON DELETE CASCADE,
    word_text VARCHAR(255) NOT NULL,
    bbox_x NUMERIC(8,4) NOT NULL,
    bbox_y NUMERIC(8,4) NOT NULL,
    bbox_w NUMERIC(8,4) NOT NULL,
    bbox_h NUMERIC(8,4) NOT NULL,
    confidence NUMERIC(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS extracted_field_value (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    field_definition_id UUID NOT NULL REFERENCES field_definition(id),
    field_key VARCHAR(100) NOT NULL,
    raw_extracted_value TEXT,
    normalized_value TEXT,
    confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    extraction_source VARCHAR(40) NOT NULL DEFAULT 'AI', -- AI, OCR_REGEX, MASTER_MATCH, USER_OVERRIDE, RULE_DEFAULT
    bounding_box JSONB, -- {x, y, w, h, page}
    is_manually_edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_by VARCHAR(120),
    edited_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_doc_field UNIQUE (document_id, field_key)
);
CREATE INDEX idx_extracted_field_key ON extracted_field_value(field_key);

CREATE TABLE IF NOT EXISTS document_line_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    item_description TEXT,
    quantity NUMERIC(14,4) NOT NULL DEFAULT 1.0000,
    unit_of_measure VARCHAR(20) DEFAULT 'EA',
    unit_price NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    line_net_amount NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    tax_code VARCHAR(20),
    tax_rate NUMERIC(7,4) DEFAULT 0.0000,
    tax_amount NUMERIC(18,4) DEFAULT 0.0000,
    cost_center_code VARCHAR(30),
    gl_account_code VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_doc_line_item UNIQUE (document_id, line_number)
);

-- =============================================================================
-- 8. BUSINESS RULES & VALIDATION FRAMEWORK
-- =============================================================================

CREATE TABLE IF NOT EXISTS rule_set (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_key VARCHAR(80) NOT NULL UNIQUE,
    set_name VARCHAR(150) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- TAX, CATEGORY, ROUTING, ALLOCATION, DEFAULTING
    execution_order INT NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_set_id UUID NOT NULL REFERENCES rule_set(id) ON DELETE CASCADE,
    rule_code VARCHAR(80) NOT NULL UNIQUE,
    rule_name VARCHAR(150) NOT NULL,
    priority INT NOT NULL DEFAULT 10,
    stop_on_match BOOLEAN NOT NULL DEFAULT TRUE,
    condition_tree JSONB NOT NULL, -- Declarative tree: { "and": [ { "field": "expense_category", "op": "==", "value": "HOTEL" } ] }
    action_set JSONB NOT NULL,     -- { "set_fields": { "tax_code": "V0", "gl_code": "600100" } }
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS validation_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code VARCHAR(60) NOT NULL UNIQUE,
    rule_name VARCHAR(150) NOT NULL,
    target_field_key VARCHAR(100),
    validation_type VARCHAR(50) NOT NULL, -- MANDATORY, REGEX, ARITHMETIC, RANGE, MASTER_EXISTS, PERIOD_OPEN, DUPLICATE
    condition_expr JSONB NOT NULL,
    error_catalog_code VARCHAR(50) NOT NULL REFERENCES error_catalog(error_code),
    severity VARCHAR(20) NOT NULL DEFAULT 'ERROR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS validation_result (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    validation_rule_id UUID REFERENCES validation_rule(id),
    error_catalog_code VARCHAR(50) NOT NULL REFERENCES error_catalog(error_code),
    field_key VARCHAR(100),
    severity VARCHAR(20) NOT NULL,
    expected_value TEXT,
    actual_value TEXT,
    message TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by VARCHAR(120),
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_val_result_doc ON validation_result(document_id, is_resolved);

-- =============================================================================
-- 9. SAP ECC EXPORT ENGINE (FULLY METADATA MAPPED)
-- =============================================================================

CREATE TABLE IF NOT EXISTS export_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_key VARCHAR(60) NOT NULL UNIQUE,
    profile_name VARCHAR(150) NOT NULL,
    target_erp VARCHAR(40) NOT NULL DEFAULT 'SAP_ECC',
    file_format VARCHAR(20) NOT NULL DEFAULT 'CSV', -- CSV, TXT, XML, IDOC
    csv_delimiter CHAR(1) NOT NULL DEFAULT ',',
    csv_quote_char CHAR(1) NOT NULL DEFAULT '"',
    include_header_row BOOLEAN NOT NULL DEFAULT TRUE,
    line_ending VARCHAR(10) NOT NULL DEFAULT 'CRLF',
    encoding VARCHAR(30) NOT NULL DEFAULT 'UTF-8',
    date_format VARCHAR(30) NOT NULL DEFAULT 'DD.MM.YYYY',
    decimal_separator CHAR(1) NOT NULL DEFAULT '.',
    negative_sign_format VARCHAR(20) NOT NULL DEFAULT 'TRAILING', -- LEADING, TRAILING, PARENTHESES
    file_name_template VARCHAR(255) NOT NULL DEFAULT 'SAP_INV_{company_code}_{date}_{run_no}.csv',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS export_column (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_profile_id UUID NOT NULL REFERENCES export_profile(id) ON DELETE CASCADE,
    column_order INT NOT NULL,
    header_text VARCHAR(100) NOT NULL,
    record_type VARCHAR(20) NOT NULL DEFAULT 'ITEM', -- HEADER, ITEM, CONTROL
    source_field_key VARCHAR(100),
    constant_value VARCHAR(255),
    transformation_rule VARCHAR(100), -- PAD_ZERO, UPPERCASE, DATE_SAP, TRIM, SIGN_FLIP
    field_length INT,
    pad_char CHAR(1) DEFAULT ' ',
    alignment VARCHAR(10) DEFAULT 'LEFT', -- LEFT, RIGHT
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_export_col_order UNIQUE (export_profile_id, column_order)
);

CREATE TABLE IF NOT EXISTS export_run (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_number VARCHAR(60) NOT NULL UNIQUE,
    export_profile_id UUID NOT NULL REFERENCES export_profile(id),
    status VARCHAR(40) NOT NULL DEFAULT 'PREPARING', -- PREPARING, GENERATED, DISPATCHED, REVERSED
    total_documents INT NOT NULL DEFAULT 0,
    total_debit NUMERIC(18,4) NOT NULL DEFAULT 0.00,
    total_credit NUMERIC(18,4) NOT NULL DEFAULT 0.00,
    checksum_hash CHAR(64),
    generated_file_path VARCHAR(1000),
    is_reversal BOOLEAN NOT NULL DEFAULT FALSE,
    reversed_run_id UUID REFERENCES export_run(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120) DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS export_run_document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_run_id UUID NOT NULL REFERENCES export_run(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES document(id),
    CONSTRAINT uq_run_doc UNIQUE (export_run_id, document_id)
);

-- =============================================================================
-- 10. NOTIFICATION & DISPATCH
-- =============================================================================

CREATE TABLE IF NOT EXISTS notification_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_key VARCHAR(60) NOT NULL UNIQUE,
    profile_name VARCHAR(150) NOT NULL,
    transport_type VARCHAR(30) NOT NULL DEFAULT 'MS_GRAPH', -- MS_GRAPH, SMTP
    sender_email VARCHAR(255) NOT NULL,
    primary_recipients TEXT NOT NULL, -- comma-delimited
    cc_recipients TEXT,
    bcc_recipients TEXT,
    attach_csv BOOLEAN NOT NULL DEFAULT TRUE,
    attach_txt BOOLEAN NOT NULL DEFAULT TRUE,
    attach_summary_pdf BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS notification_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_profile_id UUID NOT NULL REFERENCES notification_profile(id) ON DELETE CASCADE,
    event_trigger VARCHAR(60) NOT NULL, -- RUN_COMPLETED, RUN_FAILED, SLA_BREACH, DUPLICATE_ALERT
    subject_template TEXT NOT NULL,
    body_html_template TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_notif_template UNIQUE (notification_profile_id, event_trigger)
);

CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_profile_id UUID REFERENCES notification_profile(id),
    recipient_email VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    message_id VARCHAR(500),
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 11. PROCESS LOGS & OBSERVABILITY (PARTITION READY)
-- =============================================================================

CREATE TABLE IF NOT EXISTS process_log (
    id UUID DEFAULT gen_random_uuid(),
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    run_id UUID,
    document_id UUID,
    module VARCHAR(50) NOT NULL,
    step_name VARCHAR(80) NOT NULL,
    status VARCHAR(30) NOT NULL, -- STARTED, SUCCESS, WARNING, FAILED
    duration_ms INT NOT NULL DEFAULT 0,
    error_catalog_code VARCHAR(50),
    message TEXT NOT NULL,
    input_payload JSONB,
    output_payload JSONB,
    correlation_id VARCHAR(100),
    actor VARCHAR(120) DEFAULT 'system',
    PRIMARY KEY (id, event_timestamp)
) PARTITION BY RANGE (event_timestamp);

CREATE TABLE IF NOT EXISTS process_log_default PARTITION OF process_log DEFAULT;

CREATE INDEX idx_process_log_doc ON process_log(document_id, event_timestamp);
CREATE INDEX idx_process_log_status ON process_log(status, event_timestamp);
CREATE INDEX idx_process_log_error ON process_log(error_catalog_code, event_timestamp);

-- =============================================================================
-- 12. TRIGGERS FOR UPDATED_AT & AUDIT CAPTURE
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_system_setting_updated_at BEFORE UPDATE ON system_setting FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE OR REPLACE TRIGGER trg_field_def_updated_at BEFORE UPDATE ON field_definition FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE OR REPLACE TRIGGER trg_vendor_updated_at BEFORE UPDATE ON vendor FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE OR REPLACE TRIGGER trg_document_updated_at BEFORE UPDATE ON document FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE OR REPLACE TRIGGER trg_rule_updated_at BEFORE UPDATE ON rule FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE OR REPLACE TRIGGER trg_export_prof_updated_at BEFORE UPDATE ON export_profile FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Schema Creation Complete
