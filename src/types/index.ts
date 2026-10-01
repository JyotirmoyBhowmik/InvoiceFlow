// Enterprise domain type definitions for InvoiceFlow

export type DataType = 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'ENTITY_REF';

export interface FieldDefinition {
  id: string;
  field_key: string;
  display_label: string;
  data_type: DataType;
  field_group: string;
  is_mandatory: boolean;
  regex_pattern?: string;
  min_value?: number;
  max_value?: number;
  default_value_expr?: string;
  ui_order: number;
  visible_flag: boolean;
  editable_flag: boolean;
  ai_hint_text?: string;
  export_column_name?: string;
  export_order?: number;
  format_mask?: string;
  options?: string[]; // for SELECT type
}

export type DocumentStatus =
  | 'RECEIVED'
  | 'PREPROCESSED'
  | 'OCR_DONE'
  | 'AI_EXTRACTED'
  | 'EXTRACTION_FAILED'
  | 'VALIDATED'
  | 'REVIEW_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPORTED'
  | 'ARCHIVED';

export type ValueSource =
  | 'EXTRACTED'
  | 'DERIVED'
  | 'MASTER_DEFAULT'
  | 'USER_CORRECTED'
  | 'NOT_FOUND';

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number;
  w: number;
  h: number;
  page?: number;
}

export interface ExtractedField {
  field_key: string;
  raw_value: string;
  normalized_value: string;
  confidence: number; // 0 - 100
  value_source: ValueSource;
  source_page?: number;
  source_bounding_box?: BoundingBox;
  extractor_name?: string;
  ai_model_version?: string;
  rule_id?: string;
  is_edited?: boolean;
}

export interface DocumentArtifact {
  id: string;
  document_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  sha256_hash: string;
  storage_uri: string;
  created_at: string;
}

export interface InvoiceLineItem {
  id: string;
  line_number: number;
  description: string;
  quantity: number;
  unit_of_measure: string;
  unit_price: number;
  line_net_amount: number;
  tax_code: string;
  tax_rate: number;
  tax_amount: number;
  cost_center_code: string;
  gl_account_code: string;
  value_source?: ValueSource;
}

export interface DocumentRecord {
  id: string;
  document_number: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  source_type: 'MAILBOX' | 'UPLOAD' | 'SFTP' | 'API';
  received_at: string;
  document_status: DocumentStatus;
  stp_score: number;
  is_stp_approved: boolean;
  total_amount: number;
  tax_amount: number;
  currency_code: string;
  base_currency?: string;
  exchange_rate_to_inr?: number;
  converted_total_inr?: number;
  converted_tax_inr?: number;
  document_date: string;
  document_artifact_id: string;
  document_artifact_sha256: string;
  document_artifact_uri: string;
  approved_at?: string;
  approved_by?: string;
  vendor_code?: string;
  vendor_name?: string;
  employee_code?: string;
  company_code?: string;
  cost_center_code?: string;
  gl_account_code?: string;
  expense_category?: string;
  tax_code?: string;
  trip_id?: string;
  booking_type?: 'AIRLINE' | 'HOTEL' | 'CAB' | 'TRAIN' | 'ITH_CONSOLIDATED' | 'GENERAL';
  pnr_number?: string;
  ticket_number?: string;
  passenger_name?: string;
  flight_sector?: string;
  gst_claim_status?: 'ELIGIBLE_ITC' | 'INELIGIBLE' | 'NEPAL_VAT_CLAIM' | 'NOT_APPLICABLE';
  business_place?: string;
  section_code?: string;
  review_reason?: string;
  stream_code?: 'STREAM_A_ITH_TRAVEL' | 'STREAM_B_AIRLINE_TAX_CREDIT' | string;
  subcategory?: 'HOTEL' | 'AIRLINE' | 'TRAIN' | 'CAB' | 'ITH_CONSOLIDATED' | 'GENERAL' | string;
  stream_detection_confidence?: number;
  stream_detection_method?: 'MAILBOX_RULE' | 'SENDER_MATCH' | 'SUBJECT_MATCH' | 'AI_CLASSIFICATION' | 'CONTENT_HEURISTIC' | 'MANUAL_OVERRIDE';
  stream_detection_details?: string;
  return_email_preview?: ReturnEmailPreview;
  fields: Record<string, ExtractedField>;
  line_items: InvoiceLineItem[];
  sample_image_url?: string;
  raw_ocr_text?: string;
  raw_ai_response?: string;
  validation_errors: ValidationError[];
}

export interface ValidationError {
  id: string;
  error_code: string;
  field_key?: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'BLOCK';
  message: string;
  expected?: string;
  actual?: string;
  is_resolved: boolean;
}

export interface ErrorCatalogItem {
  id: string;
  error_code: string;
  domain_prefix: 'MAIL' | 'ATCH' | 'OCR' | 'AI' | 'VAL' | 'MSTR' | 'TAX' | 'EXP' | 'SYS';
  severity: 'INFO' | 'WARN' | 'ERROR' | 'BLOCK';
  message_template: string;
  remediation_text: string;
  auto_action: string;
  is_retryable: boolean;
}

export interface RuleDefinition {
  id: string;
  rule_code: string;
  rule_name: string;
  rule_type: 'TAX' | 'CATEGORY' | 'ROUTING' | 'DEFAULTING' | 'SPLIT';
  priority: number;
  stop_on_match: boolean;
  is_active: boolean;
  condition_field: string;
  condition_op: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'contains';
  condition_value: string;
  action_field: string;
  action_value: string;
}

export interface ExportColumnDef {
  id: string;
  column_order: number;
  header_text: string;
  record_type: 'HEADER' | 'ITEM' | 'CONTROL';
  source_field_key: string;
  constant_value?: string;
  transformation_rule?: 'PAD_ZERO' | 'UPPERCASE' | 'DATE_SAP' | 'TRIM';
  field_length?: number;
  pad_char?: string;
  alignment: 'LEFT' | 'RIGHT';
  is_mandatory: boolean;
}

export interface ExportProfileDef {
  id: string;
  profile_key: string;
  profile_name: string;
  target_erp: string;
  file_format: 'CSV' | 'TXT';
  csv_delimiter: string;
  csv_quote_char: string;
  include_header_row: boolean;
  line_ending: 'CRLF' | 'LF';
  date_format: 'DD.MM.YYYY' | 'YYYYMMDD';
  file_name_template: string;
  columns: ExportColumnDef[];
}

export interface ExportRunRecord {
  id: string;
  run_number: string;
  profile_key: string;
  status: 'GENERATED' | 'DISPATCHED' | 'REVERSED';
  total_documents: number;
  total_debit: number;
  total_credit: number;
  checksum_sha256: string;
  created_at: string;
  created_by: string;
  csv_preview?: string;
  txt_preview?: string;
}

export interface ProcessLogEntry {
  id: string;
  event_timestamp: string;
  run_id?: string;
  document_id?: string;
  module: string;
  step_name: string;
  status: 'STARTED' | 'SUCCESS' | 'WARNING' | 'FAILED';
  duration_ms: number;
  error_catalog_code?: string;
  message: string;
  input_payload?: any;
  output_payload?: any;
}

// Master Data Entities
export interface VendorEntity {
  id: string;
  vendor_code: string;
  vendor_name: string;
  tax_identifier: string; // PAN/VAT/GST
  country_code: string;
  state_region?: string;
  address_line?: string;
  contact_email?: string;
  recon_account_gl: string;
  payment_terms: string;
  is_active: boolean;
}

export interface EmployeeEntity {
  id: string;
  employee_code: string;
  full_name: string;
  official_email: string;
  department_code: string;
  cost_center_code: string;
  grade_level: string;
  approval_level: number;
  is_active: boolean;
}

export interface CostCenterEntity {
  id: string;
  code: string;
  name: string;
  company_code: string;
  department: string;
  is_active: boolean;
}

export interface GlAccountEntity {
  id: string;
  gl_code: string;
  gl_name: string;
  account_head: string;
  company_code: string;
  is_balance_sheet: boolean;
  is_active: boolean;
}

export interface CompanyCodeEntity {
  id: string;
  code: string;
  name: string;
  country_code: string;
  currency_code: string;
  chart_of_accounts: string;
  fiscal_variant: string;
  is_active: boolean;
}

export interface ExpenseCategoryEntity {
  id: string;
  category_code: string;
  category_name: string;
  default_gl_code: string;
  subcategories: string[];
  requires_approval_limit: boolean;
  is_active: boolean;
}

export interface TaxCodeEntity {
  id: string;
  code: string;
  sap_tax_code: string;
  description: string;
  rate_percent: number;
  valid_from: string;
  valid_to: string;
  is_reverse_charge: boolean;
  is_active: boolean;
}

export interface CurrencyEntity {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  exchange_rate_to_base: number;
  is_base_currency: boolean;
}

export interface FiscalCalendarEntity {
  id: string;
  fiscal_year: string;
  period_number: number;
  start_date: string;
  end_date: string;
  is_posting_open: boolean;
}

export interface ApprovalMatrixEntity {
  id: string;
  category_code: string;
  min_amount: number;
  max_amount: number;
  approver_role: string;
  sla_hours: number;
}

export interface ThemeConfig {
  theme_key: string;
  theme_name: string;
  color_bg: string;
  color_surface: string;
  color_primary: string;
  color_accent: string;
  color_success: string;
  color_warning: string;
  color_error: string;
  radius_sm: string;
  font_sans: string;
  font_display: string;
  font_mono: string;
}

export interface SystemSettingsConfig {
  timezone: string;
  stp_auto_approve_threshold: number;
  max_archive_depth: number;
  max_archive_mb: number;
  arithmetic_tolerance: number;
  sandbox_mode: boolean;
  default_erp: string;
  date_format: string;
}

export interface UserSession {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'REVIEWER' | 'APPROVER' | 'AUDITOR';
  permissions: string[];
  must_change_password?: boolean;
  mfa_enabled?: boolean;
  mfa_verified?: boolean;
  auth_provider: 'LOCAL' | 'ENTRA_ID_SSO' | 'BREAK_GLASS';
  session_expires_at: string;
}

// ---------------------------------------------------------------------------
// Prompt 03: Reference Solution Alignment Entities
// ---------------------------------------------------------------------------

export interface ProcessingStreamEntity {
  id: string;
  stream_code: 'STREAM_A_ITH_TRAVEL' | 'STREAM_B_AIRLINE_TAX_CREDIT' | string;
  stream_name: string;
  description: string;
  purpose: 'VENDOR_PAYMENT' | 'TAX_CREDIT_CLAIM' | 'GENERAL';
  export_profile_key: string;
  scheduler_cron: string;
  auto_approve_threshold: number;
  notification_template_key: string;
  reply_to_mode: 'ORIGINAL_SENDER' | 'FINANCE_MAILBOX' | 'BOTH' | 'DISTRIBUTION_LIST' | 'REPLY_ALL';
  finance_notification_email?: string;
  detection_priority: number;
  detection_rules: {
    mailbox_patterns?: string[];
    subject_keywords?: string[];
    vendor_tax_ids?: string[];
    pnr_required?: boolean;
  };
  is_active: boolean;
}

export interface ProcessingStreamSubcategory {
  id: string;
  stream_code: string;
  subcategory_code: 'HOTEL' | 'AIRLINE' | 'TRAIN' | 'CAB' | 'GENERAL' | string;
  subcategory_name: string;
  mandatory_field_keys: string[];
  default_expense_gl?: string;
  default_cost_center?: string;
  default_booking_type?: string;
  is_active: boolean;
}

export interface TaxRegimeEntity {
  id: string;
  regime_code: 'NEPAL_VAT' | 'INDIA_GST' | string;
  regime_name: string;
  country_code: string;
  tax_type: 'VAT' | 'GST';
  identifier_name: 'PAN' | 'GSTIN' | string;
  identifier_regex: string;
  checksum_validator: string;
  standard_tax_rate: number;
  input_tax_claimable: boolean;
  is_active: boolean;
}

export interface BikramSambatCalendarRecord {
  id: string;
  ad_date: string; // YYYY-MM-DD
  bs_year: number;
  bs_month: number;
  bs_day: number;
  bs_date_str: string; // e.g. 2083-06-08
  bs_month_name_nepali: string;
  bs_month_name_roman: string;
  nepal_fiscal_year: string;
  nepal_fiscal_period: number;
  is_working_day: boolean;
}

export interface ProfitCenterEntity {
  id: string;
  profit_center_code: string;
  profit_center_name: string;
  company_code: string;
  segment_code?: string;
  is_active: boolean;
}

export interface MasterImportProfileEntity {
  id: string;
  profile_key: string;
  master_type: 'VENDOR' | 'GL_ACCOUNT' | 'COST_CENTER' | 'PROFIT_CENTER' | 'TAX_CODE' | 'EMPLOYEE' | 'TRIP_REFERENCE';
  description: string;
  receiving_mailbox: string;
  allowed_sender_domains: string[];
  subject_pattern: string;
  file_name_pattern: string;
  import_mode: 'UPSERT' | 'FULL_REPLACE' | 'DELTA';
  require_admin_approval: boolean;
  max_deactivation_pct: number;
  is_active: boolean;
}

export interface MasterImportBatchRecord {
  id: string;
  batch_number: string;
  profile_key: string;
  source_channel: 'EMAIL' | 'MANUAL_UPLOAD' | 'CLI' | 'API';
  sender_email?: string;
  original_filename: string;
  total_rows: number;
  rows_added: number;
  rows_updated: number;
  rows_deactivated: number;
  status: 'RECEIVED' | 'VALIDATING' | 'DIFF_CALCULATED' | 'PENDING_APPROVAL' | 'APPLIED' | 'REJECTED' | 'ROLLED_BACK';
  safety_threshold_breached: boolean;
  rejection_reason?: string;
  created_at: string;
  applied_at?: string;
}

export interface EvaluationSetRecord {
  id: string;
  set_name: string;
  description: string;
  folder_path?: string;
  total_samples: number;
  sample_categories: string[];
  is_locked: boolean;
  created_at: string;
}

export interface GroundTruthRecordEntity {
  id: string;
  evaluation_set_id: string;
  sample_filename: string;
  stream_code: string;
  subcategory?: string;
  is_nepali_language: boolean;
  is_handwritten: boolean;
  ground_truth_fields: Record<string, any>;
  verified_by: string;
  verified_at: string;
}

export interface EvaluationRunRecord {
  id: string;
  run_code: string;
  evaluation_set_id: string;
  model_profile: string;
  total_evaluated: number;
  overall_exact_match_pct: number;
  overall_tolerance_match_pct: number;
  stp_rate_pct: number;
  nepali_language_accuracy_pct: number;
  avg_latency_ms: number;
  avg_cost_inr: number;
  avg_cost_npr: number;
  status: string;
  created_at: string;
}

export interface AiModelPricingEntity {
  id: string;
  model_key: string;
  provider_name: string;
  price_per_1m_input_usd: number;
  price_per_1m_output_usd: number;
  benchmark_inr_target: number;
  usd_to_inr_rate: number;
  inr_to_npr_rate: number;
  is_active: boolean;
}

export interface ReturnEmailPreview {
  template_key: string;
  template_name: string;
  outcome_status: 'SUCCESS_STP' | 'EXCEPTION_REVIEW' | 'REJECTED';
  recipient_email: string;
  reply_to_mode: string;
  email_subject: string;
  email_body_html: string;
  email_body_text: string;
  attached_sap_file?: string;
  attached_mis_package?: string;
  generated_at: string;
}

export interface NotificationTemplateEntity {
  id: string;
  template_key: string;
  stream_code?: string;
  template_name: string;
  outcome_status: 'SUCCESS_STP' | 'EXCEPTION_REVIEW' | 'REJECTED' | 'GENERAL';
  subject_template: string;
  body_html_template: string;
  body_text_template: string;
  include_sap_file: boolean;
  include_mis_package: boolean;
  is_active: boolean;
}

export interface StreamValidationRuleEntity {
  id: string;
  rule_code: string;
  stream_code: string;
  subcategory_code?: string;
  rule_name: string;
  rule_type: 'MANDATORY_FIELD' | 'ARITHMETIC' | 'MASTER_MATCH' | 'TAX_DETERMINATION' | 'TRIP_REFERENCE' | 'DOUBLE_CLAIM' | 'FORMAT';
  severity: 'INFO' | 'WARN' | 'ERROR' | 'BLOCK';
  error_code: string;
  error_message_template: string;
  remediation_hint: string;
  is_active: boolean;
}

export interface StreamDetectionResult {
  stream_code: 'STREAM_A_ITH_TRAVEL' | 'STREAM_B_AIRLINE_TAX_CREDIT' | string;
  stream_name: string;
  subcategory: 'HOTEL' | 'AIRLINE' | 'TRAIN' | 'CAB' | 'ITH_CONSOLIDATED' | 'GENERAL' | string;
  confidence: number;
  detection_method: 'MAILBOX_RULE' | 'SENDER_MATCH' | 'SUBJECT_MATCH' | 'AI_CLASSIFICATION' | 'CONTENT_HEURISTIC' | 'MANUAL_OVERRIDE';
  detection_details: string;
  mandatory_fields: string[];
  applicable_rules: string[];
  return_email_template_key: string;
}


