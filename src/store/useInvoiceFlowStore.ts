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
} from '../types';

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
  }
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

const INITIAL_THEME: ThemeConfig = {
  theme_key: 'ENTERPRISE_SLATE',
  theme_name: 'Enterprise Slate',
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

  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('invoiceflow_theme');
    return saved ? JSON.parse(saved) : INITIAL_THEME;
  });

  const [settings, setSettings] = useState<SystemSettingsConfig>(() => {
    const saved = localStorage.getItem('invoiceflow_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Master Data (Empty by default per Rule 1 - no mock data)
  const [vendors, setVendors] = useState<VendorEntity[]>(() => {
    const saved = localStorage.getItem('invoiceflow_vendors');
    return saved ? JSON.parse(saved) : [];
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

    documents,
    setDocuments,

    exportRuns,
    setExportRuns,

    processLogs,
    addLog,
    clearLogs: () => setProcessLogs([]),
  };
}
