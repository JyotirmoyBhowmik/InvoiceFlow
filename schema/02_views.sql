-- =============================================================================
-- INVOICEFLOW REPORTING & ANALYTICS VIEWS
-- File: schema/02_views.sql
-- =============================================================================

SET search_path TO invoiceflow, public;

CREATE OR REPLACE VIEW v_document_summary AS
SELECT 
    d.id AS document_id,
    d.document_number,
    d.document_status,
    d.source_type,
    d.original_filename,
    d.document_date,
    d.total_amount,
    d.tax_amount,
    d.currency_code,
    d.stp_score,
    d.is_stp_approved,
    v.vendor_name,
    v.vendor_code,
    e.full_name AS employee_name,
    c.code AS company_code,
    cat.category_name AS expense_category,
    d.received_at,
    d.approved_at,
    COUNT(vr.id) FILTER (WHERE vr.is_resolved = FALSE AND vr.severity = 'BLOCK') AS blocking_errors_count,
    COUNT(vr.id) FILTER (WHERE vr.is_resolved = FALSE) AS total_open_validations
FROM document d
LEFT JOIN vendor v ON d.vendor_id = v.id
LEFT JOIN employee e ON d.employee_id = e.id
LEFT JOIN company_code c ON d.company_code_id = c.id
LEFT JOIN expense_category cat ON d.expense_category_id = cat.id
LEFT JOIN validation_result vr ON d.id = vr.document_id
GROUP BY 
    d.id, d.document_number, d.document_status, d.source_type, d.original_filename,
    d.document_date, d.total_amount, d.tax_amount, d.currency_code, d.stp_score,
    d.is_stp_approved, v.vendor_name, v.vendor_code, e.full_name, c.code, cat.category_name,
    d.received_at, d.approved_at;

CREATE OR REPLACE VIEW v_pending_review_ageing AS
SELECT 
    d.id AS document_id,
    d.document_number,
    d.document_status,
    d.received_at,
    ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - d.received_at)) / 3600.0, 1) AS ageing_hours,
    CASE 
        WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - d.received_at)) / 3600.0 > 48 THEN 'CRITICAL_SLA'
        WHEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - d.received_at)) / 3600.0 > 24 THEN 'WARNING_SLA'
        ELSE 'WITHIN_SLA'
    END AS sla_status,
    d.total_amount,
    d.currency_code,
    d.review_reason
FROM document d
WHERE d.document_status IN ('REVIEW_PENDING', 'ON_HOLD', 'EXCEPTION');

CREATE OR REPLACE VIEW v_ai_usage_monthly AS
SELECT 
    DATE_TRUNC('month', created_at) AS usage_month,
    provider_key,
    model_identifier,
    COUNT(*) AS total_requests,
    SUM(input_tokens) AS total_input_tokens,
    SUM(output_tokens) AS total_output_tokens,
    SUM(cost_usd) AS total_cost_usd,
    AVG(duration_ms) AS avg_duration_ms
FROM ai_request_log
GROUP BY DATE_TRUNC('month', created_at), provider_key, model_identifier;
