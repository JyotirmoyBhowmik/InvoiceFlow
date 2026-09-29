-- =============================================================================
-- INVOICEFLOW STRUCTURAL BOOTSTRAP (ZERO BUSINESS DATA)
-- File: schema/01_bootstrap_structure.sql
-- Contains ONLY structural keys: error catalog, permission catalog, theme tokens, field groups
-- =============================================================================

SET search_path TO invoiceflow, public;

-- 1. ERROR CODE CATALOG (Prefix-driven, admin-extensible)
INSERT INTO error_catalog (error_code, domain_prefix, severity, message_template, remediation_text, auto_action, is_retryable) VALUES
('MAIL-001', 'MAIL', 'ERROR', 'Mailbox authentication token expired or invalid', 'Verify Entra ID client secret or delegated permissions', 'DLQ', TRUE),
('MAIL-002', 'MAIL', 'WARN', 'Message rejected due to exclusion filter: {filter}', 'Adjust mailbox filter rules if valid sender', 'DROP', FALSE),
('ATCH-001', 'ATCH', 'BLOCK', 'Attachment exceeds maximum safe uncompressed size limit', 'Verify safe file size threshold or split package', 'ROUTE_TO_REVIEW', FALSE),
('ATCH-002', 'ATCH', 'ERROR', 'Archive extraction failed due to password protection', 'Provide archive password in master store', 'ROUTE_TO_REVIEW', TRUE),
('OCR-001', 'OCR', 'WARN', 'Low native PDF text density detected. Falling back to Layer 1 image enhancement', 'Automatic fallback applied', 'RETRY', TRUE),
('OCR-002', 'OCR', 'ERROR', 'Tesseract engine failed to return valid bounding boxes', 'Check image resolution and DPI threshold', 'ROUTE_TO_REVIEW', TRUE),
('AI-001', 'AI', 'ERROR', 'AI Provider returned invalid JSON schema payload', 'Review prompt template schema and model temperature', 'RETRY', TRUE),
('AI-002', 'AI', 'BLOCK', 'Monthly AI token budget threshold exceeded ({pct}%)', 'Increase monthly budget limit in AI Provider Console', 'ROUTE_TO_REVIEW', FALSE),
('VAL-001', 'VAL', 'BLOCK', 'Mandatory field {field_key} is missing or empty', 'Provide missing field in Correction Workbench', 'ROUTE_TO_REVIEW', FALSE),
('VAL-002', 'VAL', 'ERROR', 'Header total does not match sum of line items + taxes (tolerance: {tol})', 'Review extracted lines or rounding rules', 'ROUTE_TO_REVIEW', FALSE),
('VAL-003', 'VAL', 'WARN', 'Potential duplicate invoice detected (Vendor: {v}, Inv: {inv})', 'Confirm if reissue or reject as duplicate', 'ROUTE_TO_REVIEW', FALSE),
('MSTR-001', 'MSTR', 'BLOCK', 'Vendor code could not be resolved from tax ID or name', 'Create vendor in Master Data or add alias', 'ROUTE_TO_REVIEW', FALSE),
('MSTR-002', 'MSTR', 'ERROR', 'Cost Center {cc} is invalid or inactive for company code {comp}', 'Assign active cost center in Workbench', 'ROUTE_TO_REVIEW', FALSE),
('TAX-001', 'TAX', 'BLOCK', 'Unable to determine tax code for category {cat} and vendor type {type}', 'Add tax determination rule in Rule Builder', 'ROUTE_TO_REVIEW', FALSE),
('EXP-001', 'EXP', 'BLOCK', 'Export gate blocked: unresolved critical validation errors present', 'Resolve all blocking validation codes before run export', 'ROUTE_TO_REVIEW', FALSE),
('SYS-001', 'SYS', 'ERROR', 'System database circuit breaker activated for storage adapter', 'Check infrastructure logs and disk health', 'DLQ', TRUE)
ON CONFLICT (error_code) DO NOTHING;

-- 2. PERMISSION CATALOG
INSERT INTO permission (permission_key, module, action, description) VALUES
('DOC_VIEW', 'DOCUMENT', 'READ', 'View invoices and documents'),
('DOC_EDIT', 'DOCUMENT', 'UPDATE', 'Edit extracted field values'),
('DOC_APPROVE', 'DOCUMENT', 'EXECUTE', 'Approve invoices for ERP export'),
('DOC_REJECT', 'DOCUMENT', 'EXECUTE', 'Reject invoices'),
('MASTER_MANAGE', 'MASTER_DATA', 'ADMIN', 'Manage master tables and entities'),
('SCHEMA_MANAGE', 'FIELD_SCHEMA', 'ADMIN', 'Add, rename, reorder dynamic fields'),
('RULE_MANAGE', 'RULES', 'ADMIN', 'Create and test business rules'),
('AI_MANAGE', 'AI_CONSOLE', 'ADMIN', 'Configure AI models and prompt versions'),
('EXPORT_MANAGE', 'EXPORT', 'EXECUTE', 'Generate and reverse SAP ECC export runs'),
('THEME_MANAGE', 'THEME', 'ADMIN', 'Modify design tokens and branding')
ON CONFLICT (permission_key) DO NOTHING;

-- 3. DEFAULT FIELD GROUPS
INSERT INTO field_group (group_key, display_name, ui_order) VALUES
('HEADER_CORE', 'Invoice Core Header', 10),
('VENDOR_INFO', 'Vendor & Counterparty', 20),
('ORGANIZATION', 'Organizational Assignment', 30),
('FINANCIALS', 'Amounts & Tax Calculation', 40),
('CATEGORY_ATTRS', 'Category Specific Details', 50)
ON CONFLICT (group_key) DO NOTHING;

-- 4. DEFAULT THEME
INSERT INTO theme (theme_key, theme_name, is_default) VALUES
('ENTERPRISE_SLATE', 'Enterprise Slate (Dark)', TRUE)
ON CONFLICT (theme_key) DO NOTHING;

-- 5. DEFAULT THEME TOKENS
INSERT INTO theme_token (theme_id, token_category, token_name, token_value, css_var_name)
SELECT id, 'COLOR', 'color_bg', '#0c0e12', '--color-bg' FROM theme WHERE theme_key = 'ENTERPRISE_SLATE'
ON CONFLICT (theme_id, token_name) DO NOTHING;

INSERT INTO theme_token (theme_id, token_category, token_name, token_value, css_var_name)
SELECT id, 'COLOR', 'color_surface', '#141820', '--color-surface' FROM theme WHERE theme_key = 'ENTERPRISE_SLATE'
ON CONFLICT (theme_id, token_name) DO NOTHING;

INSERT INTO theme_token (theme_id, token_category, token_name, token_value, css_var_name)
SELECT id, 'COLOR', 'color_primary', '#3b82f6', '--color-primary' FROM theme WHERE theme_key = 'ENTERPRISE_SLATE'
ON CONFLICT (theme_id, token_name) DO NOTHING;

INSERT INTO theme_token (theme_id, token_category, token_name, token_value, css_var_name)
SELECT id, 'COLOR', 'color_accent', '#f59e0b', '--color-accent' FROM theme WHERE theme_key = 'ENTERPRISE_SLATE'
ON CONFLICT (theme_id, token_name) DO NOTHING;

-- 6. SYSTEM DEFAULT SETTINGS
INSERT INTO system_setting (setting_key, setting_value, data_type, category, description) VALUES
('GLOBAL_TIMEZONE', '"Asia/Kathmandu"', 'string', 'LOCALIZATION', 'Default server timezone'),
('STP_AUTO_APPROVE_THRESHOLD', '95.00', 'number', 'WORKFLOW', 'Straight-through-processing auto approve confidence score minimum'),
('MAX_ARCHIVE_DEPTH', '4', 'number', 'ATTACHMENT', 'Maximum recursive archive unpacking depth limit'),
('MAX_ARCHIVE_UNCOMPRESSED_MB', '150', 'number', 'ATTACHMENT', 'Maximum uncompressed safe archive size in MB'),
('ARITHMETIC_TOLERANCE', '0.05', 'number', 'FINANCIAL', 'Allowable rounding delta between line sum and header total')
ON CONFLICT (setting_key) DO NOTHING;
