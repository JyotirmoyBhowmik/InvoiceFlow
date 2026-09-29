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
  review_reason?: string;
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
