-- =============================================================================
-- INVOICEFLOW ENTERPRISE DATABASE MIGRATION - PROCESSING STREAM MASTER
-- File: schema/11_processing_stream_master.sql
-- Table: invoiceflow.processing_stream & Related Master Tables
-- Purpose: Configurable multi-stream ingestion (Stream A: Travel-Agency / ITH
--          Vendor Payment vs Stream B: Airline Tax Invoices Tax Credit Claim)
-- Target Database: PostgreSQL 14+ / SQL Server / Azure SQL
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS invoiceflow;
SET search_path TO invoiceflow, public;

-- -----------------------------------------------------------------------------
-- 1. PROCESSING STREAM MASTER TABLE
-- Streams are configurable data, never hardcoded application branches.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoiceflow.processing_stream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_code VARCHAR(60) NOT NULL UNIQUE,
    stream_name VARCHAR(180) NOT NULL,
    description TEXT,
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('VENDOR_PAYMENT', 'TAX_CREDIT_CLAIM', 'GENERAL')),
    target_erp VARCHAR(50) NOT NULL DEFAULT 'SAP_ECC',
    export_profile_key VARCHAR(100) NOT NULL,
    scheduler_cron VARCHAR(50) NOT NULL DEFAULT '0 * * * *', -- e.g. Hourly at :00
    auto_approve_threshold NUMERIC(5, 2) NOT NULL DEFAULT 95.00,
    notification_template_key VARCHAR(100) NOT NULL,
    reply_to_mode VARCHAR(50) NOT NULL DEFAULT 'REPLY_ALL' CHECK (reply_to_mode IN ('ORIGINAL_SENDER', 'FINANCE_MAILBOX', 'BOTH', 'DISTRIBUTION_LIST', 'REPLY_ALL')),
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
CREATE INDEX IF NOT EXISTS idx_proc_stream_code ON invoiceflow.processing_stream (stream_code);
CREATE INDEX IF NOT EXISTS idx_proc_stream_active ON invoiceflow.processing_stream (is_active, detection_priority);
COMMENT ON TABLE invoiceflow.processing_stream IS 'Configurable business processing streams defining fields, rules, templates, and export profiles';

-- -----------------------------------------------------------------------------
-- 2. PROCESSING STREAM SUBCATEGORIES (e.g. Stream A: Hotel, Air, Train, Cab)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoiceflow.processing_stream_subcategory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_code VARCHAR(60) NOT NULL REFERENCES invoiceflow.processing_stream(stream_code) ON DELETE CASCADE,
    subcategory_code VARCHAR(50) NOT NULL,
    subcategory_name VARCHAR(150) NOT NULL,
    description TEXT,
    mandatory_field_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
    optional_field_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
    default_expense_gl VARCHAR(50),
    default_cost_center VARCHAR(50),
    default_booking_type VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INT NOT NULL DEFAULT 1,
    CONSTRAINT uq_stream_subcategory UNIQUE (stream_code, subcategory_code)
);
COMMENT ON TABLE invoiceflow.processing_stream_subcategory IS 'Subcategories per stream defining specialized mandatory field matrices and account defaults';

-- -----------------------------------------------------------------------------
-- 3. RETURN-EMAIL NOTIFICATION TEMPLATES MASTER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoiceflow.notification_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(100) NOT NULL UNIQUE,
    stream_code VARCHAR(60) REFERENCES invoiceflow.processing_stream(stream_code) ON DELETE SET NULL,
    template_name VARCHAR(180) NOT NULL,
    outcome_status VARCHAR(30) NOT NULL CHECK (outcome_status IN ('SUCCESS_STP', 'EXCEPTION_REVIEW', 'REJECTED', 'GENERAL')),
    subject_template VARCHAR(255) NOT NULL,
    body_html_template TEXT NOT NULL,
    body_text_template TEXT NOT NULL,
    include_sap_file BOOLEAN NOT NULL DEFAULT TRUE,
    include_mis_package BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE invoiceflow.notification_template IS 'Jinja2/Handlebars return-email notification templates per stream and outcome status';

-- -----------------------------------------------------------------------------
-- 4. STREAM VALIDATION RULES MASTER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoiceflow.stream_validation_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code VARCHAR(60) NOT NULL UNIQUE,
    stream_code VARCHAR(60) REFERENCES invoiceflow.processing_stream(stream_code) ON DELETE CASCADE,
    subcategory_code VARCHAR(50),
    rule_name VARCHAR(180) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('MANDATORY_FIELD', 'ARITHMETIC', 'MASTER_MATCH', 'TAX_DETERMINATION', 'TRIP_REFERENCE', 'DOUBLE_CLAIM', 'FORMAT')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'WARN', 'ERROR', 'BLOCK')),
    condition_expression TEXT,
    error_code VARCHAR(50) NOT NULL,
    error_message_template TEXT NOT NULL,
    remediation_hint TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE invoiceflow.stream_validation_rule IS 'Configurable validation rules bound to streams and subcategories';

-- -----------------------------------------------------------------------------
-- 5. STREAM CROSS-LINK MASTER (Anti-Double Claim Engine)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoiceflow.stream_cross_link (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_document_id UUID NOT NULL,
    secondary_document_id UUID NOT NULL,
    primary_stream_code VARCHAR(60) NOT NULL,
    secondary_stream_code VARCHAR(60) NOT NULL,
    link_reason VARCHAR(60) NOT NULL DEFAULT 'TICKET_PNR_MATCH',
    match_key VARCHAR(150) NOT NULL, -- PNR or Ticket Number
    detected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_flagged_double_claim BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by VARCHAR(120),
    resolved_at TIMESTAMPTZ,
    CONSTRAINT uq_cross_link_pair UNIQUE (primary_document_id, secondary_document_id)
);
CREATE INDEX IF NOT EXISTS idx_stream_cross_link_match ON invoiceflow.stream_cross_link (match_key);
COMMENT ON TABLE invoiceflow.stream_cross_link IS 'Links travel payment records with tax credit claims to prevent double posting or duplicate claims';

-- -----------------------------------------------------------------------------
-- 6. SEED DATA: STREAMS A & B
-- -----------------------------------------------------------------------------
INSERT INTO invoiceflow.processing_stream (
    stream_code, stream_name, description, purpose, target_erp,
    export_profile_key, scheduler_cron, auto_approve_threshold,
    notification_template_key, reply_to_mode, finance_notification_email,
    detection_priority, detection_rules, is_active
) VALUES 
(
    'STREAM_A_ITH_TRAVEL',
    'Travel-Agency / ITH Corporate Travel Invoices (Vendor Payment)',
    'Hotel, air, train, and cab invoices billed through ITH / Travel Desk used for accounts payable vendor invoice posting.',
    'VENDOR_PAYMENT',
    'SAP_ECC',
    'EXP_SAP_ECC_ITH_VENDOR',
    '0 * * * *',
    95.00,
    'STREAM_A_VENDOR_PAYMENT_NOTICE',
    'REPLY_ALL',
    'travel.ap@snpl.com.np',
    10,
    '{
        "mailbox_patterns": ["travel.invoices@snpl.com.np", "travel@enterprise.internal", "ith.desk@enterprise.internal"],
        "subject_keywords": ["travel", "ith", "duty slip", "hotel booking", "car rental", "itinerary", "corporate travel"],
        "vendor_tax_ids": ["07AAACI1920H1ZP"],
        "pnr_required": false
    }'::jsonb,
    TRUE
),
(
    'STREAM_B_AIRLINE_TAX_CREDIT',
    'Airline Tax Invoices (GST/VAT Input Tax Credit Claim)',
    'Airline-issued tax invoices used strictly to support input-tax credit recovery in SAP.',
    'TAX_CREDIT_CLAIM',
    'SAP_ECC',
    'EXP_SAP_ECC_AIRLINE_ITC',
    '0 * * * *',
    95.00,
    'STREAM_B_TAX_CREDIT_NOTICE',
    'REPLY_ALL',
    'airline.tax@snpl.com.np',
    20,
    '{
        "mailbox_patterns": ["airline.gst@snpl.com.np", "airtax@enterprise.internal", "airline.vat@snpl.com.np"],
        "subject_keywords": ["tax invoice", "passenger ticket", "gst credit", "air passenger", "boarding", "flight ticket"],
        "vendor_names": ["IndiGo", "Air India", "Vistara", "Buddha Air", "Yeti Airlines", "SpiceJet"],
        "pnr_required": true
    }'::jsonb,
    TRUE
)
ON CONFLICT (stream_code) DO UPDATE SET
    stream_name = EXCLUDED.stream_name,
    description = EXCLUDED.description,
    purpose = EXCLUDED.purpose,
    target_erp = EXCLUDED.target_erp,
    export_profile_key = EXCLUDED.export_profile_key,
    scheduler_cron = EXCLUDED.scheduler_cron,
    auto_approve_threshold = EXCLUDED.auto_approve_threshold,
    detection_rules = EXCLUDED.detection_rules,
    updated_at = CURRENT_TIMESTAMP;

-- -----------------------------------------------------------------------------
-- 7. SEED DATA: SUBCATEGORIES FOR STREAM A
-- -----------------------------------------------------------------------------
INSERT INTO invoiceflow.processing_stream_subcategory (
    stream_code, subcategory_code, subcategory_name, description,
    mandatory_field_keys, optional_field_keys, default_expense_gl, default_cost_center, default_booking_type, is_active
) VALUES
(
    'STREAM_A_ITH_TRAVEL',
    'HOTEL',
    'Hotel Accommodations & Hospitality',
    'Commercial hotel folios, guest stays, room tariffs, and hospitality services',
    '["invoice_number", "invoice_date", "vendor_name", "vendor_code", "total_cost", "tax_amount", "taxable_value", "vendor_tax_id"]'::jsonb,
    '["trip_id", "remarks", "room_nights", "check_in_date", "check_out_date"]'::jsonb,
    '600400',
    'CC100',
    'HOTEL',
    TRUE
),
(
    'STREAM_A_ITH_TRAVEL',
    'AIRLINE',
    'Commercial Airline Flights (ITH Travel Desk)',
    'Flight bookings ticketed through corporate travel agency desk',
    '["invoice_number", "invoice_date", "vendor_name", "vendor_code", "total_cost", "tax_amount", "pnr_ticket", "flight_sector"]'::jsonb,
    '["trip_id", "passenger_name", "ticket_number", "flight_number"]'::jsonb,
    '600300',
    'CC100',
    'AIRLINE',
    TRUE
),
(
    'STREAM_A_ITH_TRAVEL',
    'TRAIN',
    'Rail & Train Passenger Transport',
    'Rail tickets, IRCTC reservations, and executive chair car bookings',
    '["invoice_number", "invoice_date", "vendor_name", "vendor_code", "total_cost", "tax_amount"]'::jsonb,
    '["trip_id", "train_number", "pnr_ticket", "travel_date"]'::jsonb,
    '600500',
    'CC100',
    'TRAIN',
    TRUE
),
(
    'STREAM_A_ITH_TRAVEL',
    'CAB',
    'Local Cab & Fleet Duty Slips',
    'Airport transfers, city car rentals, sedan duty slips, and mileage transport',
    '["invoice_number", "invoice_date", "vendor_name", "vendor_code", "total_cost", "tax_amount"]'::jsonb,
    '["trip_id", "duty_slip_number", "vehicle_registration", "route_details"]'::jsonb,
    '600600',
    'CC100',
    'CAB',
    TRUE
),
(
    'STREAM_A_ITH_TRAVEL',
    'ITH_CONSOLIDATED',
    'Consolidated Travel Desk Monthly Statement',
    'Multi-traveler consolidated voucher combining air, hotel, train and fees',
    '["invoice_number", "invoice_date", "vendor_name", "vendor_code", "total_cost", "tax_amount", "taxable_value"]'::jsonb,
    '["trip_id", "itinerary_reference", "management_fee"]'::jsonb,
    '600400',
    'CC100',
    'ITH_CONSOLIDATED',
    TRUE
)
ON CONFLICT (stream_code, subcategory_code) DO UPDATE SET
    subcategory_name = EXCLUDED.subcategory_name,
    mandatory_field_keys = EXCLUDED.mandatory_field_keys,
    optional_field_keys = EXCLUDED.optional_field_keys,
    default_expense_gl = EXCLUDED.default_expense_gl,
    default_cost_center = EXCLUDED.default_cost_center;

-- -----------------------------------------------------------------------------
-- 8. SEED DATA: NOTIFICATION RETURN-EMAIL TEMPLATES
-- -----------------------------------------------------------------------------
INSERT INTO invoiceflow.notification_template (
    template_key, stream_code, template_name, outcome_status,
    subject_template, body_html_template, body_text_template, include_sap_file, include_mis_package, is_active
) VALUES
(
    'STREAM_A_VENDOR_PAYMENT_SUCCESS',
    'STREAM_A_ITH_TRAVEL',
    'Stream A Vendor Payment Invoice Processed Successfully (STP Approved)',
    'SUCCESS_STP',
    'Re: [STREAM_A] {{invoice_number}} - {{vendor_name}} Processed (SAP ECC Batch Generated)',
    '<div style="font-family: sans-serif; font-size: 13px; color: #1e293b;">
        <h3 style="color: #059669;">Invoice Ingestion & Validation Succeeded (Straight-Through Processing)</h3>
        <p>Dear Submitter,</p>
        <p>Your travel invoice has been processed automatically by the InvoiceFlow Headless Engine for vendor payment.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Stream:</td><td style="padding: 6px; border: 1px solid #cbd5e1;">Stream A (Travel-Agency / ITH Vendor Payment)</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Invoice Number:</td><td style="padding: 6px; border: 1px solid #cbd5e1;">{{invoice_number}}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Vendor:</td><td style="padding: 6px; border: 1px solid #cbd5e1;">{{vendor_name}} (Code: {{vendor_code}})</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Gross Total:</td><td style="padding: 6px; border: 1px solid #cbd5e1;">{{currency}} {{total_amount}}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Trip ID:</td><td style="padding: 6px; border: 1px solid #cbd5e1;">{{trip_id}}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Turnaround Latency:</td><td style="padding: 6px; border: 1px solid #cbd5e1;">{{latency_seconds}}s</td></tr>
        </table>
        <p><strong>Attached Artifacts:</strong></p>
        <ul>
            <li>SAP ECC Batch Posting File: <code>{{sap_file_name}}</code></li>
            <li>Tracking & MIS Archive Package: <code>{{mis_package_name}}</code></li>
        </ul>
        <p style="color: #64748b; font-size: 11px;">InvoiceFlow Autonomous Processing Service | ITD Corporate Finance</p>
    </div>',
    'Your travel invoice {{invoice_number}} from {{vendor_name}} has been processed successfully. Gross: {{currency}} {{total_amount}}. Attached: SAP ECC file {{sap_file_name}} and MIS package {{mis_package_name}}.',
    TRUE, TRUE, TRUE
),
(
    'STREAM_A_VENDOR_PAYMENT_EXCEPTION',
    'STREAM_A_ITH_TRAVEL',
    'Stream A Vendor Payment Invoice - Review Pending / Exceptions Detected',
    'EXCEPTION_REVIEW',
    'Action Required: [STREAM_A] {{invoice_number}} - {{vendor_name}} Routed to Finance Review',
    '<div style="font-family: sans-serif; font-size: 13px; color: #1e293b;">
        <h3 style="color: #d97706;">Travel Invoice Routed to Human Review Queue</h3>
        <p>Dear Submitter,</p>
        <p>Your travel invoice {{invoice_number}} has been received and parsed, but requires manual validation prior to SAP posting:</p>
        <ul>
            {% for err in validation_errors %}
            <li><strong>[{{err.error_code}}]</strong>: {{err.message}} - <em>Remediation: {{err.remediation_hint}}</em></li>
            {% endfor %}
        </ul>
        <p><strong>Next Steps:</strong> The Accounts Payable team has been alerted. No resubmission is required unless requested by Finance.</p>
    </div>',
    'Your invoice {{invoice_number}} requires review due to: {{error_summary}}. Assigned to Finance review queue.',
    FALSE, TRUE, TRUE
),
(
    'STREAM_B_TAX_CREDIT_SUCCESS',
    'STREAM_B_AIRLINE_TAX_CREDIT',
    'Stream B Airline Tax Invoice - Input Tax Credit Registered Successfully',
    'SUCCESS_STP',
    'Re: [STREAM_B] {{invoice_number}} - {{airline_name}} ITC Registered ({{gst_claim_status}})',
    '<div style="font-family: sans-serif; font-size: 13px; color: #1e293b;">
        <h3 style="color: #059669;">Airline Input Tax Credit Claim Successfully Registered</h3>
        <p>Dear Submitter,</p>
        <p>The airline tax invoice has been validated against the tax master for Input Tax Credit (ITC) recovery.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Airline:</td><td style="padding: 6px; border: 1px solid #cbd5e1;">{{vendor_name}}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Airline GSTIN / PAN:</td><td style="padding: 6px; border: 1px solid #cbd5e1;">{{vendor_tax_id}}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">PNR / Ticket:</td><td style="padding: 6px; border: 1px solid #cbd5e1;">{{pnr_number}} / {{ticket_number}}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Passenger:</td><td style="padding: 6px; border: 1px solid #cbd5e1;">{{passenger_name}} (Sector: {{flight_sector}})</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Taxable Base:</td><td style="padding: 6px; border: 1px solid #cbd5e1;">{{currency}} {{taxable_value}}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Claimed Tax:</td><td style="padding: 6px; border: 1px solid #cbd5e1;">{{currency}} {{tax_amount}} (Code: {{tax_code}})</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">ITC Eligibility:</td><td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">{{gst_claim_status}}</td></tr>
        </table>
        <p>Attached: Input Tax Credit Register update and MIS Audit Package.</p>
    </div>',
    'Airline Tax Invoice {{invoice_number}} registered for tax credit. Tax: {{currency}} {{tax_amount}} ({{gst_claim_status}}).',
    TRUE, TRUE, TRUE
),
(
    'STREAM_B_TAX_CREDIT_EXCEPTION',
    'STREAM_B_AIRLINE_TAX_CREDIT',
    'Stream B Airline Tax Invoice - Discrepancy Flagged',
    'EXCEPTION_REVIEW',
    'Action Required: [STREAM_B] {{invoice_number}} - {{airline_name}} Tax Credit Flagged',
    '<div style="font-family: sans-serif; font-size: 13px; color: #1e293b;">
        <h3 style="color: #dc2626;">Airline Tax Credit Claim Held for Discrepancy</h3>
        <p>Dear Submitter,</p>
        <p>The airline tax invoice {{invoice_number}} could not be automatically approved for tax credit claim:</p>
        <ul>
            {% for err in validation_errors %}
            <li><strong>[{{err.error_code}}]</strong>: {{err.message}}</li>
            {% endfor %}
        </ul>
        <p>Please check if the customer GSTIN or PAN was correctly provided during airline reservation.</p>
    </div>',
    'Airline Tax Invoice {{invoice_number}} held for tax discrepancy: {{error_summary}}.',
    FALSE, TRUE, TRUE
)
ON CONFLICT (template_key) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    subject_template = EXCLUDED.subject_template,
    body_html_template = EXCLUDED.body_html_template,
    body_text_template = EXCLUDED.body_text_template,
    include_sap_file = EXCLUDED.include_sap_file,
    include_mis_package = EXCLUDED.include_mis_package;
