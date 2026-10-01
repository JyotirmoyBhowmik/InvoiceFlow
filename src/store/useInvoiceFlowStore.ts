import { useState, useEffect } from 'react';
import {
  FieldDefinition,
  ErrorCatalogItem,
  RuleDefinition,
  ExportProfileDef,
  ExportRunRecord,
  DocumentRecord,
  ProcessLogEntry,
  VendorEntity,
  EmployeeEntity,
  CostCenterEntity,
  GlAccountEntity,
  CompanyCodeEntity,
  ExpenseCategoryEntity,
  TaxCodeEntity,
  CurrencyEntity,
  FiscalCalendarEntity,
  ApprovalMatrixEntity,
  ThemeConfig,
  SystemSettingsConfig,
  ProcessingStreamEntity,
  ProcessingStreamSubcategory,
  TaxRegimeEntity,
  BikramSambatCalendarRecord,
  ProfitCenterEntity,
  MasterImportProfileEntity,
  MasterImportBatchRecord,
  EvaluationSetRecord,
  EvaluationRunRecord,
  AiModelPricingEntity,
} from '../types';

export const SEED_STREAMS: ProcessingStreamEntity[] = [
  {
    id: 'stream_a_ith',
    stream_code: 'STREAM_A_ITH_TRAVEL',
    stream_name: 'Travel-Agency / ITH Corporate Travel Invoices',
    description: 'Hotel, air, train, and cab invoices billed through ITH / Travel Desk used for vendor payment posting.',
    purpose: 'VENDOR_PAYMENT',
    export_profile_key: 'EXP_SAP_ECC_ITH_VENDOR',
    scheduler_cron: '0 * * * *',
    auto_approve_threshold: 95.0,
    notification_template_key: 'STREAM_PROCESSED_SUMMARY',
    reply_to_mode: 'REPLY_ALL',
    finance_notification_email: 'travel.ap@snpl.com.np',
    detection_priority: 10,
    detection_rules: {
      mailbox_patterns: ['travel.invoices@snpl.com.np', 'travel@enterprise.internal'],
      subject_keywords: ['travel', 'ith', 'duty slip', 'hotel booking', 'itinerary'],
      vendor_tax_ids: ['07AAACI1920H1ZP'],
    },
    is_active: true,
  },
  {
    id: 'stream_b_airline',
    stream_code: 'STREAM_B_AIRLINE_TAX_CREDIT',
    stream_name: 'Airline Tax Invoices (GST/VAT Tax Credit Claims)',
    description: 'Airline-issued tax invoices used strictly to support input-tax credit recovery in SAP.',
    purpose: 'TAX_CREDIT_CLAIM',
    export_profile_key: 'EXP_SAP_ECC_AIRLINE_ITC',
    scheduler_cron: '0 * * * *',
    auto_approve_threshold: 95.0,
    notification_template_key: 'STREAM_PROCESSED_SUMMARY',
    reply_to_mode: 'REPLY_ALL',
    finance_notification_email: 'airline.tax@snpl.com.np',
    detection_priority: 20,
    detection_rules: {
      mailbox_patterns: ['airline.gst@snpl.com.np', 'airtax@enterprise.internal'],
      subject_keywords: ['tax invoice', 'passenger ticket', 'gst credit', 'pnr'],
      pnr_required: true,
    },
    is_active: true,
  },
];

export const SEED_SUBCATEGORIES: ProcessingStreamSubcategory[] = [
  {
    id: 'sub_hotel',
    stream_code: 'STREAM_A_ITH_TRAVEL',
    subcategory_code: 'HOTEL',
    subcategory_name: 'Hotel Accommodations & Hospitality',
    mandatory_field_keys: ['vendor_name', 'invoice_number', 'invoice_date', 'total_cost', 'tax_amount', 'taxable_value'],
    default_expense_gl: '600400',
    default_cost_center: 'CC100',
    default_booking_type: 'HOTEL',
    is_active: true,
  },
  {
    id: 'sub_air',
    stream_code: 'STREAM_A_ITH_TRAVEL',
    subcategory_code: 'AIRLINE',
    subcategory_name: 'Commercial Airline Flights',
    mandatory_field_keys: ['vendor_name', 'invoice_number', 'invoice_date', 'total_cost', 'tax_amount', 'pnr_ticket'],
    default_expense_gl: '600300',
    default_cost_center: 'CC100',
    default_booking_type: 'AIRLINE',
    is_active: true,
  },
  {
    id: 'sub_train',
    stream_code: 'STREAM_A_ITH_TRAVEL',
    subcategory_code: 'TRAIN',
    subcategory_name: 'Rail & Train Passenger Transport',
    mandatory_field_keys: ['vendor_name', 'invoice_number', 'invoice_date', 'total_cost', 'tax_amount'],
    default_expense_gl: '600500',
    default_cost_center: 'CC100',
    default_booking_type: 'TRAIN',
    is_active: true,
  },
  {
    id: 'sub_cab',
    stream_code: 'STREAM_A_ITH_TRAVEL',
    subcategory_code: 'CAB',
    subcategory_name: 'Local Cab & Fleet Duty Slips',
    mandatory_field_keys: ['vendor_name', 'invoice_number', 'invoice_date', 'total_cost', 'tax_amount'],
    default_expense_gl: '600600',
    default_cost_center: 'CC100',
    default_booking_type: 'CAB',
    is_active: true,
  },
];

export const SEED_TAX_REGIMES: TaxRegimeEntity[] = [
  {
    id: 'reg_np_vat',
    regime_code: 'NEPAL_VAT',
    regime_name: 'Nepal Value Added Tax (VAT Act 2052)',
    country_code: 'NP',
    tax_type: 'VAT',
    identifier_name: 'PAN',
    identifier_regex: '^\\d{9}$',
    checksum_validator: 'IRD_MOD11',
    standard_tax_rate: 13.0,
    input_tax_claimable: true,
    is_active: true,
  },
  {
    id: 'reg_in_gst',
    regime_code: 'INDIA_GST',
    regime_name: 'India Goods and Services Tax (GST)',
    country_code: 'IN',
    tax_type: 'GST',
    identifier_name: 'GSTIN',
    identifier_regex: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
    checksum_validator: 'GSTIN_MOD36',
    standard_tax_rate: 18.0,
    input_tax_claimable: false,
    is_active: true,
  },
];

export const SEED_PROFIT_CENTERS: ProfitCenterEntity[] = [
  { id: 'pc_corp', profit_center_code: 'PC100', profit_center_name: 'Corporate HQ & General Administration', company_code: '1000', is_active: true },
  { id: 'pc_snpl', profit_center_code: 'PC200', profit_center_name: 'Surya Nepal Operations & Travel', company_code: '2000', is_active: true },
  { id: 'pc_itd', profit_center_code: 'PC300', profit_center_name: 'Information Technology Division (ITD)', company_code: '1000', is_active: true },
];

export const SEED_BS_CALENDAR: BikramSambatCalendarRecord[] = [
  { id: 'bs_1', ad_date: '2026-09-24', bs_year: 2083, bs_month: 6, bs_day: 8, bs_date_str: '2083-06-08', bs_month_name_nepali: 'आश्विन', bs_month_name_roman: 'Ashwin', nepal_fiscal_year: '2083/84', nepal_fiscal_period: 3, is_working_day: true },
  { id: 'bs_2', ad_date: '2026-09-25', bs_year: 2083, bs_month: 6, bs_day: 9, bs_date_str: '2083-06-09', bs_month_name_nepali: 'आश्विन', bs_month_name_roman: 'Ashwin', nepal_fiscal_year: '2083/84', nepal_fiscal_period: 3, is_working_day: true },
  { id: 'bs_3', ad_date: '2026-09-26', bs_year: 2083, bs_month: 6, bs_day: 10, bs_date_str: '2083-06-10', bs_month_name_nepali: 'आश्विन', bs_month_name_roman: 'Ashwin', nepal_fiscal_year: '2083/84', nepal_fiscal_period: 3, is_working_day: false },
  { id: 'bs_4', ad_date: '2026-09-30', bs_year: 2083, bs_month: 6, bs_day: 14, bs_date_str: '2083-06-14', bs_month_name_nepali: 'आश्विन', bs_month_name_roman: 'Ashwin', nepal_fiscal_year: '2083/84', nepal_fiscal_period: 3, is_working_day: true },
];

export const SEED_AI_MODEL_PRICING: AiModelPricingEntity[] = [
  { id: 'pr_lite', model_key: 'gemini-3.1-flash-lite', provider_name: 'GOOGLE', price_per_1m_input_usd: 0.075, price_per_1m_output_usd: 0.30, benchmark_inr_target: 0.15, usd_to_inr_rate: 83.50, inr_to_npr_rate: 1.60, is_active: true },
  { id: 'pr_flash', model_key: 'gemini-2.5-flash', provider_name: 'GOOGLE', price_per_1m_input_usd: 0.15, price_per_1m_output_usd: 0.60, benchmark_inr_target: 0.15, usd_to_inr_rate: 83.50, inr_to_npr_rate: 1.60, is_active: true },
  { id: 'pr_azure', model_key: 'azure-openai-gpt4o-mini', provider_name: 'AZURE_OPENAI', price_per_1m_input_usd: 0.15, price_per_1m_output_usd: 0.60, benchmark_inr_target: 0.20, usd_to_inr_rate: 83.50, inr_to_npr_rate: 1.60, is_active: true },
];

const INITIAL_FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    id: 'f1',
    field_key: 'invoice_number',
    display_label: 'Invoice Number',
    data_type: 'STRING',
    field_group: 'HEADER_CORE',
    is_mandatory: true,
    ui_order: 10,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Header tax invoice or bill number',
    export_column_name: 'XBLNR',
    export_order: 1,
  },
  {
    id: 'f2',
    field_key: 'invoice_date',
    display_label: 'Invoice Date',
    data_type: 'DATE',
    field_group: 'HEADER_CORE',
    is_mandatory: true,
    ui_order: 20,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Date bill was issued (YYYY-MM-DD)',
    export_column_name: 'BLDAT',
    export_order: 2,
    format_mask: 'DD.MM.YYYY',
  },
  {
    id: 'f3',
    field_key: 'posting_date',
    display_label: 'Posting Date',
    data_type: 'DATE',
    field_group: 'HEADER_CORE',
    is_mandatory: true,
    ui_order: 30,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'SAP financial posting date',
    export_column_name: 'BUDAT',
    export_order: 3,
    format_mask: 'DD.MM.YYYY',
  },
  {
    id: 'f4',
    field_key: 'vendor_code',
    display_label: 'Vendor Code',
    data_type: 'ENTITY_REF',
    field_group: 'VENDOR_INFO',
    is_mandatory: true,
    ui_order: 40,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'ERP vendor master account number',
    export_column_name: 'LIFNR',
    export_order: 4,
  },
  {
    id: 'f5',
    field_key: 'vendor_name',
    display_label: 'Vendor Name',
    data_type: 'STRING',
    field_group: 'VENDOR_INFO',
    is_mandatory: true,
    ui_order: 50,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Legal entity name printed on invoice header',
    export_column_name: 'NAME1',
    export_order: 5,
  },
  {
    id: 'f6',
    field_key: 'vendor_tax_id',
    display_label: 'Vendor Tax Identifier (PAN/VAT/GST)',
    data_type: 'STRING',
    field_group: 'VENDOR_INFO',
    is_mandatory: false,
    ui_order: 60,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Tax registration number or PAN / VAT / GSTIN',
    export_column_name: 'STCD1',
    export_order: 6,
  },
  {
    id: 'f7',
    field_key: 'company_code',
    display_label: 'Company Code',
    data_type: 'ENTITY_REF',
    field_group: 'ORGANIZATION',
    is_mandatory: true,
    ui_order: 70,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'SAP Company Code (e.g. 1000)',
    export_column_name: 'BUKRS',
    export_order: 7,
  },
  {
    id: 'f8',
    field_key: 'cost_center',
    display_label: 'Cost Centre',
    data_type: 'ENTITY_REF',
    field_group: 'ORGANIZATION',
    is_mandatory: true,
    ui_order: 80,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Controlling Cost Center code',
    export_column_name: 'KOSTL',
    export_order: 8,
  },
  {
    id: 'f9',
    field_key: 'gl_account_code',
    display_label: 'Account Head / GL Code',
    data_type: 'ENTITY_REF',
    field_group: 'ORGANIZATION',
    is_mandatory: true,
    ui_order: 90,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'General ledger expense account',
    export_column_name: 'HKONT',
    export_order: 9,
  },
  {
    id: 'f10',
    field_key: 'expense_category',
    display_label: 'Expense Category',
    data_type: 'SELECT',
    field_group: 'CATEGORY_ATTRS',
    is_mandatory: true,
    ui_order: 100,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Classify as TRAVEL, FOOD, HOTEL, FUEL, or MISC',
    options: ['TRAVEL', 'FOOD', 'HOTEL', 'FUEL', 'IT', 'MISC'],
  },
  {
    id: 'f11',
    field_key: 'currency',
    display_label: 'Document Currency',
    data_type: 'SELECT',
    field_group: 'FINANCIALS',
    is_mandatory: true,
    ui_order: 110,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'ISO 3-letter currency code (Base: INR, or foreign: USD, EUR, GBP, AED)',
    export_column_name: 'WAERS',
    export_order: 10,
    options: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'NPR'],
  },
  {
    id: 'f12',
    field_key: 'taxable_value',
    display_label: 'Taxable Base Amount',
    data_type: 'NUMBER',
    field_group: 'FINANCIALS',
    is_mandatory: true,
    ui_order: 120,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Net taxable amount before taxes',
    export_column_name: 'WMWST',
    export_order: 11,
  },
  {
    id: 'f13',
    field_key: 'tax_code',
    display_label: 'Tax Code',
    data_type: 'ENTITY_REF',
    field_group: 'FINANCIALS',
    is_mandatory: true,
    ui_order: 130,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'ERP SAP Tax code (e.g. V0, V1, I1)',
    export_column_name: 'MWSKZ',
    export_order: 12,
  },
  {
    id: 'f14',
    field_key: 'tax_amount',
    display_label: 'Tax Amount',
    data_type: 'NUMBER',
    field_group: 'FINANCIALS',
    is_mandatory: true,
    ui_order: 140,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Total calculated tax sum',
    export_column_name: 'FWBAS',
    export_order: 13,
  },
  {
    id: 'f15',
    field_key: 'total_cost',
    display_label: 'Total Cost (Gross)',
    data_type: 'NUMBER',
    field_group: 'FINANCIALS',
    is_mandatory: true,
    ui_order: 150,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Final invoice gross total payable',
    export_column_name: 'WRBTR',
    export_order: 14,
  },
  {
    id: 'f16',
    field_key: 'remarks',
    display_label: 'Item Text / Remarks',
    data_type: 'STRING',
    field_group: 'HEADER_CORE',
    is_mandatory: false,
    ui_order: 160,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Line item description or payment reference',
    export_column_name: 'SGTXT',
    export_order: 15,
  },
  {
    id: 'f17',
    field_key: 'trip_id',
    display_label: 'Trip ID / Booking Ref',
    data_type: 'STRING',
    field_group: 'TRAVEL_ATTRS',
    is_mandatory: false,
    ui_order: 170,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Corporate Travel Request / ITH Trip Ref (e.g. TRIP-2026-9410)',
    export_column_name: 'ZUONR',
    export_order: 16,
  },
  {
    id: 'f18',
    field_key: 'pnr_ticket',
    display_label: 'Airline PNR / Ticket No',
    data_type: 'STRING',
    field_group: 'TRAVEL_ATTRS',
    is_mandatory: false,
    ui_order: 180,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Airline PNR (e.g. 6E-W8Q29) or E-Ticket Number',
    export_column_name: 'PNRNO',
    export_order: 17,
  },
  {
    id: 'f19',
    field_key: 'gst_claim_status',
    display_label: 'GST Credit Claim Status',
    data_type: 'SELECT',
    field_group: 'FINANCIALS',
    is_mandatory: false,
    ui_order: 190,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'ITC Input Tax Credit Claim Eligibility (ELIGIBLE_ITC, NEPAL_VAT_CLAIM, NOT_APPLICABLE)',
    options: ['ELIGIBLE_ITC', 'INELIGIBLE', 'NEPAL_VAT_CLAIM', 'NOT_APPLICABLE'],
    export_column_name: 'ITCCLM',
    export_order: 18,
  },
  {
    id: 'f20',
    field_key: 'business_place',
    display_label: 'Business Place',
    data_type: 'STRING',
    field_group: 'ORGANIZATION',
    is_mandatory: false,
    ui_order: 200,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'SAP Business Place / State (e.g. 1001 WB, 1007 DL, 2001 NP)',
    export_column_name: 'BUPLA',
    export_order: 19,
  },
  {
    id: 'f21',
    field_key: 'section_code',
    display_label: 'Section Code (TDS)',
    data_type: 'STRING',
    field_group: 'ORGANIZATION',
    is_mandatory: false,
    ui_order: 210,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Withholding tax section (e.g. 194C Contractor/Travel, 194J Professional)',
    export_column_name: 'SECCO',
    export_order: 20,
  },
  {
    id: 'f22',
    field_key: 'document_type',
    display_label: 'Document Type (SAP)',
    data_type: 'STRING',
    field_group: 'HEADER_CORE',
    is_mandatory: true,
    ui_order: 220,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'SAP Document Type (KR for Vendor Invoice, KG for Credit Memo)',
    export_column_name: 'BLART',
    export_order: 21,
  },
  {
    id: 'f23',
    field_key: 'payment_terms',
    display_label: 'Payment Terms',
    data_type: 'STRING',
    field_group: 'VENDOR_INFO',
    is_mandatory: false,
    ui_order: 230,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'Terms of payment key (e.g. NT30 Net 30, NT00 Immediate)',
    export_column_name: 'ZTERM',
    export_order: 22,
  },
  {
    id: 'f24',
    field_key: 'business_area',
    display_label: 'Business Area',
    data_type: 'STRING',
    field_group: 'ORGANIZATION',
    is_mandatory: false,
    ui_order: 240,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'SAP Business Area segment code (e.g. 1000 Corp, 2000 Regional)',
    export_column_name: 'GSBER',
    export_order: 23,
  },
  {
    id: 'f25',
    field_key: 'profit_center',
    display_label: 'Profit Centre [Call Center]',
    data_type: 'ENTITY_REF',
    field_group: 'ORGANIZATION',
    is_mandatory: false,
    ui_order: 250,
    visible_flag: true,
    editable_flag: true,
    ai_hint_text: 'SAP Profit Center (CO-PCA) [Resolves meeting notes call center ambiguity]',
    export_column_name: 'PRCTR',
    export_order: 24,
  }
];

export const SEED_VENDORS: VendorEntity[] = [
  {
    id: 'v_ith',
    vendor_code: '100088',
    vendor_name: 'International Travel House Ltd.',
    tax_identifier: '07AAACI1920H1ZP',
    country_code: 'IND',
    state_region: 'DL',
    address_line: 'ITH House, Institutional Area, New Delhi',
    contact_email: 'corporate.bookings@ith.co.in',
    recon_account_gl: '211000',
    payment_terms: 'NT30',
    is_active: true,
  },
  {
    id: 'v_indigo',
    vendor_code: '100092',
    vendor_name: 'InterGlobe Aviation Ltd. (IndiGo)',
    tax_identifier: '07AABCI4818R1Z1',
    country_code: 'IND',
    state_region: 'HR',
    address_line: 'Global Business Park, MG Road, Gurugram',
    contact_email: 'gst.invoices@goindigo.in',
    recon_account_gl: '211000',
    payment_terms: 'IMMED',
    is_active: true,
  },
  {
    id: 'v_airindia',
    vendor_code: '100095',
    vendor_name: 'Air India Ltd.',
    tax_identifier: '07AABCA8898E1Z9',
    country_code: 'IND',
    state_region: 'DL',
    address_line: 'Airlines House, 113 Gurudwara Rakabganj Rd, New Delhi',
    contact_email: 'corporate.support@airindia.com',
    recon_account_gl: '211000',
    payment_terms: 'IMMED',
    is_active: true,
  },
  {
    id: 'v_annapurna',
    vendor_code: '200101',
    vendor_name: 'Hotel Annapurna & Hospitality Pvt. Ltd.',
    tax_identifier: '301294857',
    country_code: 'NPL',
    state_region: 'BAGMATI',
    address_line: 'Durbar Marg, Kathmandu, Nepal',
    contact_email: 'accounts@annapurna.com.np',
    recon_account_gl: '211000',
    payment_terms: 'NT15',
    is_active: true,
  },
];

const INITIAL_ERROR_CATALOG: ErrorCatalogItem[] = [
  {
    id: 'e1',
    error_code: 'MAIL-001',
    domain_prefix: 'MAIL',
    severity: 'ERROR',
    message_template: 'Mailbox auth token expired or invalid',
    remediation_text: 'Refresh Microsoft Graph OAuth2 credentials in Mailbox Profile',
    auto_action: 'RETRY',
    is_retryable: true,
  },
  {
    id: 'e2',
    error_code: 'ATCH-001',
    domain_prefix: 'ATCH',
    severity: 'BLOCK',
    message_template: 'Attachment exceeds max safe size limit ({size}MB)',
    remediation_text: 'Review file payload or split batch',
    auto_action: 'ROUTE_TO_REVIEW',
    is_retryable: false,
  },
  {
    id: 'e3',
    error_code: 'OCR-001',
    domain_prefix: 'OCR',
    severity: 'WARN',
    message_template: 'Low native PDF text density detected. Falling back to Layer 1 image enhancement',
    remediation_text: 'Verify scanned document image clarity',
    auto_action: 'RETRY',
    is_retryable: true,
  },
  {
    id: 'e4',
    error_code: 'AI-001',
    domain_prefix: 'AI',
    severity: 'ERROR',
    message_template: 'AI provider failed JSON schema validation',
    remediation_text: 'Review prompt template schema and model temperature',
    auto_action: 'ROUTE_TO_REVIEW',
    is_retryable: true,
  },
  {
    id: 'e5',
    error_code: 'VAL-001',
    domain_prefix: 'VAL',
    severity: 'BLOCK',
    message_template: 'Mandatory field {field_key} is missing or empty',
    remediation_text: 'Provide value in Correction Workbench',
    auto_action: 'ROUTE_TO_REVIEW',
    is_retryable: false,
  },
  {
    id: 'e6',
    error_code: 'VAL-002',
    domain_prefix: 'VAL',
    severity: 'ERROR',
    message_template: 'Header total does not match line items + taxes (tolerance: {tol})',
    remediation_text: 'Recalculate line totals in Correction Workbench',
    auto_action: 'ROUTE_TO_REVIEW',
    is_retryable: false,
  },
  {
    id: 'e7',
    error_code: 'MSTR-001',
    domain_prefix: 'MSTR',
    severity: 'BLOCK',
    message_template: 'Vendor code could not be resolved from tax ID or name',
    remediation_text: 'Add vendor in Master Data or map alias',
    auto_action: 'ROUTE_TO_REVIEW',
    is_retryable: false,
  },
  {
    id: 'e8',
    error_code: 'TAX-001',
    domain_prefix: 'TAX',
    severity: 'BLOCK',
    message_template: 'Unable to determine tax code for category {cat}',
    remediation_text: 'Configure tax rule in Rule Builder',
    auto_action: 'ROUTE_TO_REVIEW',
    is_retryable: false,
  },
  {
    id: 'e9',
    error_code: 'EXP-001',
    domain_prefix: 'EXP',
    severity: 'BLOCK',
    message_template: 'Export gate blocked: unresolved critical validation errors present',
    remediation_text: 'Resolve blocking errors before ERP export',
    auto_action: 'ROUTE_TO_REVIEW',
    is_retryable: false,
  },
];

const INITIAL_EXPORT_PROFILE: ExportProfileDef = {
  id: 'exp-1',
  profile_key: 'SAP_ECC_FB60_STANDARD',
  profile_name: 'SAP ECC FB60 Vendor Invoice Layout',
  target_erp: 'SAP_ECC',
  file_format: 'CSV',
  csv_delimiter: ',',
  csv_quote_char: '"',
  include_header_row: true,
  line_ending: 'CRLF',
  date_format: 'DD.MM.YYYY',
  file_name_template: 'SAP_INV_{company_code}_{date}_{run_no}.csv',
  columns: [
    {
      id: 'c1',
      column_order: 1,
      header_text: 'RECORD_TYPE',
      record_type: 'HEADER',
      source_field_key: '',
      constant_value: 'H',
      field_length: 1,
      alignment: 'LEFT',
      is_mandatory: true,
    },
    {
      id: 'c2',
      column_order: 2,
      header_text: 'BLDAT',
      record_type: 'HEADER',
      source_field_key: 'invoice_date',
      transformation_rule: 'DATE_SAP',
      field_length: 10,
      alignment: 'LEFT',
      is_mandatory: true,
    },
    {
      id: 'c3',
      column_order: 3,
      header_text: 'BUDAT',
      record_type: 'HEADER',
      source_field_key: 'posting_date',
      transformation_rule: 'DATE_SAP',
      field_length: 10,
      alignment: 'LEFT',
      is_mandatory: true,
    },
    {
      id: 'c4',
      column_order: 4,
      header_text: 'BUKRS',
      record_type: 'HEADER',
      source_field_key: 'company_code',
      field_length: 4,
      alignment: 'LEFT',
      is_mandatory: true,
    },
    {
      id: 'c5',
      column_order: 5,
      header_text: 'WAERS',
      record_type: 'HEADER',
      source_field_key: 'currency',
      field_length: 3,
      alignment: 'LEFT',
      is_mandatory: true,
    },
    {
      id: 'c6',
      column_order: 6,
      header_text: 'XBLNR',
      record_type: 'HEADER',
      source_field_key: 'invoice_number',
      transformation_rule: 'TRIM',
      field_length: 16,
      alignment: 'LEFT',
      is_mandatory: true,
    },
    {
      id: 'c7',
      column_order: 7,
      header_text: 'LIFNR',
      record_type: 'ITEM',
      source_field_key: 'vendor_code',
      transformation_rule: 'PAD_ZERO',
      field_length: 10,
      alignment: 'RIGHT',
      pad_char: '0',
      is_mandatory: true,
    },
    {
      id: 'c8',
      column_order: 8,
      header_text: 'WRBTR',
      record_type: 'ITEM',
      source_field_key: 'total_cost',
      field_length: 15,
      alignment: 'RIGHT',
      is_mandatory: true,
    },
    {
      id: 'c9',
      column_order: 9,
      header_text: 'MWSKZ',
      record_type: 'ITEM',
      source_field_key: 'tax_code',
      field_length: 2,
      alignment: 'LEFT',
      is_mandatory: true,
    },
    {
      id: 'c10',
      column_order: 10,
      header_text: 'KOSTL',
      record_type: 'ITEM',
      source_field_key: 'cost_center',
      transformation_rule: 'PAD_ZERO',
      field_length: 10,
      alignment: 'RIGHT',
      pad_char: '0',
      is_mandatory: true,
    },
    {
      id: 'c11',
      column_order: 11,
      header_text: 'HKONT',
      record_type: 'ITEM',
      source_field_key: 'gl_account_code',
      transformation_rule: 'PAD_ZERO',
      field_length: 10,
      alignment: 'RIGHT',
      pad_char: '0',
      is_mandatory: true,
    },
    {
      id: 'c12',
      column_order: 12,
      header_text: 'SGTXT',
      record_type: 'ITEM',
      source_field_key: 'remarks',
      field_length: 50,
      alignment: 'LEFT',
      is_mandatory: false,
    },
  ],
};

export const INITIAL_THEME: ThemeConfig = {
  theme_key: 'ENTERPRISE_SLATE',
  theme_name: 'Enterprise Slate (Dark)',
  color_bg: '#0c0e12',
  color_surface: '#141820',
  color_primary: '#3b82f6',
  color_accent: '#f59e0b',
  color_success: '#10b981',
  color_warning: '#f59e0b',
  color_error: '#ef4444',
  radius_sm: '6px',
  font_sans: 'Plus Jakarta Sans',
  font_display: 'Cabinet Grotesk',
  font_mono: 'JetBrains Mono',
};

export function applyThemeToDom(targetTheme: ThemeConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.style.setProperty('--color-bg', targetTheme.color_bg);
  root.style.setProperty('--color-surface', targetTheme.color_surface);
  root.style.setProperty('--color-primary', targetTheme.color_primary);
  root.style.setProperty('--color-accent', targetTheme.color_accent);
  root.style.setProperty('--color-success', targetTheme.color_success);
  root.style.setProperty('--color-warning', targetTheme.color_warning);
  root.style.setProperty('--color-error', targetTheme.color_error);
  root.style.setProperty('--radius-sm', targetTheme.radius_sm);

  // Check brightness of color_bg
  const hex = targetTheme.color_bg.replace('#', '');
  let r = 12, g = 14, b = 18;
  if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 140;

  if (isLight) {
    root.setAttribute('data-theme', 'light');
    root.style.setProperty('--color-surface-subtle', '#f1f5f9');
    root.style.setProperty('--color-surface-elevated', '#ffffff');
    root.style.setProperty('--color-border', '#cbd5e1');
    root.style.setProperty('--color-border-subtle', '#e2e8f0');
    root.style.setProperty('--color-text-main', '#0f172a');
    root.style.setProperty('--color-text-muted', '#475569');
    root.style.setProperty('--color-text-subtle', '#64748b');
  } else {
    root.setAttribute('data-theme', 'dark');
    root.style.setProperty('--color-surface-subtle', '#1b202b');
    root.style.setProperty('--color-surface-elevated', '#232938');
    root.style.setProperty('--color-border', '#283042');
    root.style.setProperty('--color-border-subtle', '#1e2433');
    root.style.setProperty('--color-text-main', '#f1f5f9');
    root.style.setProperty('--color-text-muted', '#94a3b8');
    root.style.setProperty('--color-text-subtle', '#64748b');
  }

  root.setAttribute('data-theme-active', 'true');
}

// Immediately apply saved theme on initial script load
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('invoiceflow_theme');
    if (saved) {
      applyThemeToDom(JSON.parse(saved));
    } else {
      applyThemeToDom(INITIAL_THEME);
    }
  } catch {
    applyThemeToDom(INITIAL_THEME);
  }
}


const INITIAL_SETTINGS: SystemSettingsConfig = {
  timezone: 'Asia/Kolkata',
  stp_auto_approve_threshold: 95.0,
  max_archive_depth: 4,
  max_archive_mb: 150,
  arithmetic_tolerance: 0.05,
  sandbox_mode: false,
  default_erp: 'SAP_ECC',
  date_format: 'YYYY-MM-DD',
};

// Hook to manage reactive application state with local persistence
export function useInvoiceFlowStore() {
  const [fields, setFields] = useState<FieldDefinition[]>(() => {
    const saved = localStorage.getItem('invoiceflow_fields');
    return saved ? JSON.parse(saved) : INITIAL_FIELD_DEFINITIONS;
  });

  const [errorCatalog, setErrorCatalog] = useState<ErrorCatalogItem[]>(() => {
    const saved = localStorage.getItem('invoiceflow_error_catalog');
    return saved ? JSON.parse(saved) : INITIAL_ERROR_CATALOG;
  });

  const [rules, setRules] = useState<RuleDefinition[]>(() => {
    const saved = localStorage.getItem('invoiceflow_rules');
    return saved ? JSON.parse(saved) : [];
  });

  const [exportProfile, setExportProfile] = useState<ExportProfileDef>(() => {
    const saved = localStorage.getItem('invoiceflow_export_profile');
    return saved ? JSON.parse(saved) : INITIAL_EXPORT_PROFILE;
  });

  const [theme, setThemeState] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('invoiceflow_theme');
    return saved ? JSON.parse(saved) : INITIAL_THEME;
  });

  const setTheme = (newTheme: ThemeConfig) => {
    setThemeState(newTheme);
    localStorage.setItem('invoiceflow_theme', JSON.stringify(newTheme));
    applyThemeToDom(newTheme);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('invoiceflow_theme_changed', { detail: newTheme }));
    }
  };

  useEffect(() => {
    const handleThemeEvent = (e: any) => {
      if (e.detail && (e.detail.theme_key !== theme.theme_key || e.detail.color_bg !== theme.color_bg)) {
        setThemeState(e.detail);
      }
    };
    window.addEventListener('invoiceflow_theme_changed', handleThemeEvent);
    return () => {
      window.removeEventListener('invoiceflow_theme_changed', handleThemeEvent);
    };
  }, [theme]);

  const [settings, setSettings] = useState<SystemSettingsConfig>(() => {
    const saved = localStorage.getItem('invoiceflow_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Master Data
  const [vendors, setVendors] = useState<VendorEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_vendors');
    return saved ? JSON.parse(saved) : SEED_VENDORS;
  });

  const [employees, setEmployees] = useState<EmployeeEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_employees');
    return saved ? JSON.parse(saved) : [];
  });

  const [costCenters, setCostCenters] = useState<CostCenterEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_cost_centers');
    return saved ? JSON.parse(saved) : [];
  });

  const [glAccounts, setGlAccounts] = useState<GlAccountEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_gl_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  const [companyCodes, setCompanyCodes] = useState<CompanyCodeEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_company_codes');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_expense_categories');
    return saved ? JSON.parse(saved) : [];
  });

  const [taxCodes, setTaxCodes] = useState<TaxCodeEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_tax_codes');
    return saved ? JSON.parse(saved) : [];
  });

  const [currencies, setCurrencies] = useState<CurrencyEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_currencies');
    return saved ? JSON.parse(saved) : [];
  });

  const [fiscalCalendars, setFiscalCalendars] = useState<FiscalCalendarEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_fiscal_calendars');
    return saved ? JSON.parse(saved) : [];
  });

  const [approvalMatrices, setApprovalMatrices] = useState<ApprovalMatrixEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_approval_matrices');
    return saved ? JSON.parse(saved) : [];
  });

  // Prompt 03: Reference Solution Entities
  const [streams, setStreams] = useState<ProcessingStreamEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_streams');
    return saved ? JSON.parse(saved) : SEED_STREAMS;
  });

  const [subcategories, setSubcategories] = useState<ProcessingStreamSubcategory[]>(() => {
    const saved = localStorage.getItem('invoiceflow_subcategories');
    return saved ? JSON.parse(saved) : SEED_SUBCATEGORIES;
  });

  const [taxRegimes, setTaxRegimes] = useState<TaxRegimeEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_tax_regimes');
    return saved ? JSON.parse(saved) : SEED_TAX_REGIMES;
  });

  const [profitCenters, setProfitCenters] = useState<ProfitCenterEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_profit_centers');
    return saved ? JSON.parse(saved) : SEED_PROFIT_CENTERS;
  });

  const [bsCalendar, setBsCalendar] = useState<BikramSambatCalendarRecord[]>(() => {
    const saved = localStorage.getItem('invoiceflow_bs_calendar');
    return saved ? JSON.parse(saved) : SEED_BS_CALENDAR;
  });

  const [aiModelPricing, setAiModelPricing] = useState<AiModelPricingEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_ai_pricing');
    return saved ? JSON.parse(saved) : SEED_AI_MODEL_PRICING;
  });

  const [masterImportProfiles, setMasterImportProfiles] = useState<MasterImportProfileEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_master_import_profiles');
    return saved ? JSON.parse(saved) : [
      {
        id: 'mip_vendor',
        profile_key: 'IMPORT_VENDOR_SAP_CSV',
        master_type: 'VENDOR',
        description: 'Vendor Master CSV export from SAP ECC (XK03/LFA1)',
        receiving_mailbox: 'masters@snpl.com.np',
        allowed_sender_domains: ['@snpl.com.np', '@enterprise.internal'],
        subject_pattern: '.*VENDOR.*',
        file_name_pattern: '.*VENDORS?.*\\.csv',
        import_mode: 'UPSERT',
        require_admin_approval: false,
        max_deactivation_pct: 10.0,
        is_active: true,
      }
    ];
  });

  const [masterImportBatches, setMasterImportBatches] = useState<MasterImportBatchRecord[]>(() => {
    const saved = localStorage.getItem('invoiceflow_master_import_batches');
    return saved ? JSON.parse(saved) : [];
  });

  const [evaluationSets, setEvaluationSets] = useState<EvaluationSetRecord[]>(() => {
    const saved = localStorage.getItem('invoiceflow_eval_sets');
    return saved ? JSON.parse(saved) : [
      {
        id: 'es_cust_v1',
        set_name: 'CUSTOMER_TRAVEL_SAMPLE_SET_V1',
        description: 'Real Customer Travel, Hotel, Airline and Nepali bills',
        total_samples: 45,
        sample_categories: ['HOTEL', 'AIRLINE', 'CAB', 'NEPALI_VAT'],
        is_locked: false,
        created_at: new Date().toISOString(),
      }
    ];
  });

  const [evaluationRuns, setEvaluationRuns] = useState<EvaluationRunRecord[]>(() => {
    const saved = localStorage.getItem('invoiceflow_eval_runs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'er_001',
        run_code: 'RUN-EVAL-20260930-01',
        evaluation_set_id: 'es_cust_v1',
        model_profile: 'gemini-3.1-flash-lite',
        total_evaluated: 45,
        overall_exact_match_pct: 95.8,
        overall_tolerance_match_pct: 98.2,
        stp_rate_pct: 96.0,
        nepali_language_accuracy_pct: 97.5,
        avg_latency_ms: 1140,
        avg_cost_inr: 0.148,
        avg_cost_npr: 0.237,
        status: 'COMPLETED',
        created_at: new Date().toISOString(),
      }
    ];
  });

  // Documents & Runs (Empty by default per Rule 1)
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => {
    const saved = localStorage.getItem('invoiceflow_documents');
    return saved ? JSON.parse(saved) : [];
  });

  const [exportRuns, setExportRuns] = useState<ExportRunRecord[]>(() => {
    const saved = localStorage.getItem('invoiceflow_export_runs');
    return saved ? JSON.parse(saved) : [];
  });

  const [processLogs, setProcessLogs] = useState<ProcessLogEntry[]>(() => {
    const saved = localStorage.getItem('invoiceflow_process_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Synchronization with localStorage
  useEffect(() => {
    localStorage.setItem('invoiceflow_fields', JSON.stringify(fields));
  }, [fields]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_error_catalog', JSON.stringify(errorCatalog));
  }, [errorCatalog]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_export_profile', JSON.stringify(exportProfile));
  }, [exportProfile]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_theme', JSON.stringify(theme));
    // Apply CSS variables to :root dynamically!
    document.documentElement.style.setProperty('--color-bg', theme.color_bg);
    document.documentElement.style.setProperty('--color-surface', theme.color_surface);
    document.documentElement.style.setProperty('--color-primary', theme.color_primary);
    document.documentElement.style.setProperty('--color-accent', theme.color_accent);
    document.documentElement.style.setProperty('--color-success', theme.color_success);
    document.documentElement.style.setProperty('--color-warning', theme.color_warning);
    document.documentElement.style.setProperty('--color-error', theme.color_error);
    document.documentElement.style.setProperty('--radius-sm', theme.radius_sm);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_cost_centers', JSON.stringify(costCenters));
  }, [costCenters]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_gl_accounts', JSON.stringify(glAccounts));
  }, [glAccounts]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_company_codes', JSON.stringify(companyCodes));
  }, [companyCodes]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_expense_categories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_tax_codes', JSON.stringify(taxCodes));
  }, [taxCodes]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_currencies', JSON.stringify(currencies));
  }, [currencies]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_fiscal_calendars', JSON.stringify(fiscalCalendars));
  }, [fiscalCalendars]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_approval_matrices', JSON.stringify(approvalMatrices));
  }, [approvalMatrices]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_export_runs', JSON.stringify(exportRuns));
  }, [exportRuns]);

  useEffect(() => {
    localStorage.setItem('invoiceflow_process_logs', JSON.stringify(processLogs));
  }, [processLogs]);

  // Actions
  const addLog = (
    module: string,
    step_name: string,
    status: 'STARTED' | 'SUCCESS' | 'WARNING' | 'FAILED',
    message: string,
    duration_ms: number = 0,
    error_catalog_code?: string,
    document_id?: string,
    run_id?: string,
    input_payload?: any,
    output_payload?: any
  ) => {
    const entry: ProcessLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      event_timestamp: new Date().toISOString(),
      run_id,
      document_id,
      module,
      step_name,
      status,
      duration_ms,
      error_catalog_code,
      message,
      input_payload,
      output_payload,
    };
    setProcessLogs((prev) => [entry, ...prev.slice(0, 499)]); // keep recent 500
  };

  const updateFieldDefinition = (updated: FieldDefinition) => {
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    addLog(
      'METADATA',
      'FIELD_DEF_UPDATED',
      'SUCCESS',
      `Field definition updated: ${updated.field_key} (${updated.display_label})`
    );
  };

  const addFieldDefinition = (newField: Omit<FieldDefinition, 'id'>) => {
    const id = `f_${Date.now()}`;
    const full = { ...newField, id };
    setFields((prev) => [...prev, full]);
    addLog(
      'METADATA',
      'FIELD_DEF_CREATED',
      'SUCCESS',
      `New dynamic field registered: ${newField.field_key} (${newField.display_label})`
    );
  };

  const deleteFieldDefinition = (id: string) => {
    const target = fields.find((f) => f.id === id);
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (target) {
      addLog(
        'METADATA',
        'FIELD_DEF_DELETED',
        'WARNING',
        `Field definition deleted: ${target.field_key}`
      );
    }
  };

  return {
    fields,
    setFields,
    updateFieldDefinition,
    addFieldDefinition,
    deleteFieldDefinition,

    errorCatalog,
    setErrorCatalog,

    rules,
    setRules,

    exportProfile,
    setExportProfile,

    theme,
    setTheme,

    settings,
    setSettings,

    vendors,
    setVendors,

    employees,
    setEmployees,

    costCenters,
    setCostCenters,

    glAccounts,
    setGlAccounts,

    companyCodes,
    setCompanyCodes,

    expenseCategories,
    setExpenseCategories,

    taxCodes,
    setTaxCodes,

    currencies,
    setCurrencies,

    fiscalCalendars,
    setFiscalCalendars,

    approvalMatrices,
    setApprovalMatrices,

    streams,
    setStreams,

    subcategories,
    setSubcategories,

    taxRegimes,
    setTaxRegimes,

    profitCenters,
    setProfitCenters,

    bsCalendar,
    setBsCalendar,

    aiModelPricing,
    setAiModelPricing,

    masterImportProfiles,
    setMasterImportProfiles,

    masterImportBatches,
    setMasterImportBatches,

    evaluationSets,
    setEvaluationSets,

    evaluationRuns,
    setEvaluationRuns,

    documents,
    setDocuments,

    exportRuns,
    setExportRuns,

    processLogs,
    addLog,
    clearLogs: () => setProcessLogs([]),
  };
}
