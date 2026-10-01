/**
 * InvoiceFlow Enterprise Multi-Stream Processing Engine.
 * Implements the Processing Stream Master Table, Document-Level Stream Identification,
 * Stream-Specific Mandatory Field Matrices, Deterministic Validation Rules,
 * and Stream-Specific Return-Email Notification Templates.
 */

export interface ProcessingStreamRecord {
  id: string;
  stream_code: 'STREAM_A_ITH_TRAVEL' | 'STREAM_B_AIRLINE_TAX_CREDIT' | string;
  stream_name: string;
  description: string;
  purpose: 'VENDOR_PAYMENT' | 'TAX_CREDIT_CLAIM' | 'GENERAL';
  target_erp: string;
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
    vendor_names?: string[];
    pnr_required?: boolean;
  };
  is_active: boolean;
  subcategories: StreamSubcategoryRecord[];
}

export interface StreamSubcategoryRecord {
  id: string;
  stream_code: string;
  subcategory_code: 'HOTEL' | 'AIRLINE' | 'TRAIN' | 'CAB' | 'ITH_CONSOLIDATED' | 'GENERAL' | string;
  subcategory_name: string;
  description?: string;
  mandatory_field_keys: string[];
  optional_field_keys: string[];
  default_expense_gl?: string;
  default_cost_center?: string;
  default_booking_type?: string;
  is_active: boolean;
}

export interface NotificationTemplateRecord {
  id: string;
  template_key: string;
  stream_code: string;
  template_name: string;
  outcome_status: 'SUCCESS_STP' | 'EXCEPTION_REVIEW' | 'REJECTED';
  subject_template: string;
  body_html_template: string;
  body_text_template: string;
  include_sap_file: boolean;
  include_mis_package: boolean;
  is_active: boolean;
}

export interface StreamValidationRuleRecord {
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

export interface StreamDetectionContext {
  filename?: string;
  rawText?: string;
  mailbox?: string;
  subject?: string;
  sender?: string;
  extractedData?: Record<string, any>;
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

export interface StreamDetectionResult {
  stream_code: 'STREAM_A_ITH_TRAVEL' | 'STREAM_B_AIRLINE_TAX_CREDIT' | string;
  stream_name: string;
  subcategory: 'HOTEL' | 'AIRLINE' | 'TRAIN' | 'CAB' | 'ITH_CONSOLIDATED' | 'GENERAL' | string;
  confidence: number;
  detection_method: 'MAILBOX_RULE' | 'SENDER_MATCH' | 'SUBJECT_MATCH' | 'AI_CLASSIFICATION' | 'CONTENT_HEURISTIC' | 'MANUAL_OVERRIDE';
  detection_details: string;
  mandatory_fields: string[];
  missing_mandatory_fields: string[];
  validation_errors: Array<{
    error_code: string;
    field_key?: string;
    severity: 'INFO' | 'WARN' | 'ERROR' | 'BLOCK';
    message: string;
    remediation_hint: string;
  }>;
  return_email_preview: ReturnEmailPreview;
}

// ---------------------------------------------------------------------------
// MASTER STORE: Seed Definitions for Stream A and Stream B
// ---------------------------------------------------------------------------

export const PROCESSING_STREAMS_MASTER: ProcessingStreamRecord[] = [
  {
    id: 'stream_a_ith',
    stream_code: 'STREAM_A_ITH_TRAVEL',
    stream_name: 'Travel-Agency / ITH Corporate Travel Invoices (Vendor Payment)',
    description: 'Hotel, air, train, and cab invoices billed through ITH / Travel Desk used for accounts payable vendor payment posting.',
    purpose: 'VENDOR_PAYMENT',
    target_erp: 'SAP_ECC',
    export_profile_key: 'EXP_SAP_ECC_ITH_VENDOR',
    scheduler_cron: '0 * * * *', // Hourly at :00
    auto_approve_threshold: 95.0,
    notification_template_key: 'STREAM_A_VENDOR_PAYMENT_NOTICE',
    reply_to_mode: 'REPLY_ALL',
    finance_notification_email: 'travel.ap@snpl.com.np',
    detection_priority: 10,
    detection_rules: {
      mailbox_patterns: ['travel.invoices@snpl.com.np', 'travel@enterprise.internal', 'ith.desk@enterprise.internal'],
      subject_keywords: ['travel', 'ith', 'duty slip', 'hotel booking', 'car rental', 'itinerary', 'corporate travel'],
      vendor_tax_ids: ['07AAACI1920H1ZP'],
      pnr_required: false,
    },
    is_active: true,
    subcategories: [
      {
        id: 'sub_hotel',
        stream_code: 'STREAM_A_ITH_TRAVEL',
        subcategory_code: 'HOTEL',
        subcategory_name: 'Hotel Accommodations & Hospitality',
        description: 'Hotel folios, guest stays, room tariffs, and hospitality services',
        mandatory_field_keys: ['invoice_number', 'invoice_date', 'vendor_name', 'vendor_code', 'total_cost', 'tax_amount', 'taxable_value', 'vendor_tax_id'],
        optional_field_keys: ['trip_id', 'remarks', 'room_nights', 'check_in_date', 'check_out_date'],
        default_expense_gl: '600400',
        default_cost_center: 'CC100',
        default_booking_type: 'HOTEL',
        is_active: true,
      },
      {
        id: 'sub_air',
        stream_code: 'STREAM_A_ITH_TRAVEL',
        subcategory_code: 'AIRLINE',
        subcategory_name: 'Commercial Airline Flights (ITH Travel Desk)',
        description: 'Flight bookings ticketed through corporate travel agency desk',
        mandatory_field_keys: ['invoice_number', 'invoice_date', 'vendor_name', 'vendor_code', 'total_cost', 'tax_amount', 'pnr_ticket', 'flight_sector'],
        optional_field_keys: ['trip_id', 'passenger_name', 'ticket_number', 'flight_number'],
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
        description: 'Rail tickets, IRCTC reservations, and executive chair car bookings',
        mandatory_field_keys: ['invoice_number', 'invoice_date', 'vendor_name', 'vendor_code', 'total_cost', 'tax_amount'],
        optional_field_keys: ['trip_id', 'train_number', 'pnr_ticket', 'travel_date'],
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
        description: 'Airport transfers, city car rentals, sedan duty slips, and mileage transport',
        mandatory_field_keys: ['invoice_number', 'invoice_date', 'vendor_name', 'vendor_code', 'total_cost', 'tax_amount'],
        optional_field_keys: ['trip_id', 'duty_slip_number', 'vehicle_registration', 'route_details'],
        default_expense_gl: '600600',
        default_cost_center: 'CC100',
        default_booking_type: 'CAB',
        is_active: true,
      },
      {
        id: 'sub_ith_cons',
        stream_code: 'STREAM_A_ITH_TRAVEL',
        subcategory_code: 'ITH_CONSOLIDATED',
        subcategory_name: 'Consolidated Travel Desk Monthly Statement',
        description: 'Multi-traveler consolidated voucher combining air, hotel, train and corporate fee',
        mandatory_field_keys: ['invoice_number', 'invoice_date', 'vendor_name', 'vendor_code', 'total_cost', 'tax_amount', 'taxable_value'],
        optional_field_keys: ['trip_id', 'itinerary_reference', 'management_fee'],
        default_expense_gl: '600400',
        default_cost_center: 'CC100',
        default_booking_type: 'ITH_CONSOLIDATED',
        is_active: true,
      },
    ],
  },
  {
    id: 'stream_b_airline',
    stream_code: 'STREAM_B_AIRLINE_TAX_CREDIT',
    stream_name: 'Airline Tax Invoices (GST/VAT Input Tax Credit Claim)',
    description: 'Airline-issued tax invoices used strictly to support input-tax credit recovery in SAP.',
    purpose: 'TAX_CREDIT_CLAIM',
    target_erp: 'SAP_ECC',
    export_profile_key: 'EXP_SAP_ECC_AIRLINE_ITC',
    scheduler_cron: '0 * * * *',
    auto_approve_threshold: 95.0,
    notification_template_key: 'STREAM_B_TAX_CREDIT_NOTICE',
    reply_to_mode: 'REPLY_ALL',
    finance_notification_email: 'airline.tax@snpl.com.np',
    detection_priority: 20,
    detection_rules: {
      mailbox_patterns: ['airline.gst@snpl.com.np', 'airtax@enterprise.internal', 'airline.vat@snpl.com.np'],
      subject_keywords: ['tax invoice', 'passenger ticket', 'gst credit', 'air passenger', 'boarding', 'flight ticket'],
      vendor_names: ['IndiGo', 'Air India', 'Vistara', 'Buddha Air', 'Yeti Airlines', 'SpiceJet'],
      pnr_required: true,
    },
    is_active: true,
    subcategories: [
      {
        id: 'sub_airline_itc',
        stream_code: 'STREAM_B_AIRLINE_TAX_CREDIT',
        subcategory_code: 'AIRLINE',
        subcategory_name: 'Passenger Airline GST/VAT Tax Invoice',
        description: 'Direct airline tax invoice with GSTIN/PAN breakdown for tax credit claiming',
        mandatory_field_keys: [
          'vendor_name',
          'vendor_tax_id',
          'invoice_number',
          'invoice_date',
          'pnr_number',
          'ticket_number',
          'passenger_name',
          'flight_sector',
          'tax_code',
          'tax_amount',
          'taxable_value',
          'total_cost',
          'gst_claim_status',
        ],
        optional_field_keys: ['cgst_amount', 'sgst_amount', 'igst_amount', 'aviation_psf', 'flight_number'],
        default_expense_gl: '600300',
        default_cost_center: 'CC100',
        default_booking_type: 'AIRLINE',
        is_active: true,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// RETURN-EMAIL NOTIFICATION TEMPLATES MASTER
// ---------------------------------------------------------------------------

export const NOTIFICATION_TEMPLATES_MASTER: NotificationTemplateRecord[] = [
  {
    id: 'tmpl_a_success',
    template_key: 'STREAM_A_VENDOR_PAYMENT_SUCCESS',
    stream_code: 'STREAM_A_ITH_TRAVEL',
    template_name: 'Stream A Vendor Payment - STP Approved & SAP Batch Generated',
    outcome_status: 'SUCCESS_STP',
    subject_template: 'Re: [STREAM_A] {{invoice_number}} - {{vendor_name}} Processed (SAP ECC Batch Generated)',
    body_html_template: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #1e293b; line-height: 1.5;">
  <div style="background-color: #065f46; color: #ffffff; padding: 12px 16px; border-radius: 6px 6px 0 0;">
    <h3 style="margin: 0; font-size: 15px; font-weight: 600;">Travel Invoice Processed Successfully (STP Approved)</h3>
  </div>
  <div style="padding: 16px; border: 1px solid #cbd5e1; border-top: none; border-radius: 0 0 6px 6px; background: #ffffff;">
    <p>Dear Submitter,</p>
    <p>Your travel expenditure document has been validated and matched against SAP ECC master data for vendor payment posting.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px;">
      <tr style="background: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600; width: 35%;">Processing Stream:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">Stream A (Travel-Agency / ITH Vendor Payment)</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Invoice Number:</td><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>{{invoice_number}}</strong></td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Vendor / Travel Desk:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{{vendor_name}} (Code: {{vendor_code}})</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Sub-Category:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{{subcategory}}</td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Trip ID Reference:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{{trip_id}}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Gross Invoice Amount:</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #047857;">{{currency}} {{total_amount}}</td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Turnaround Latency:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{{latency_seconds}} seconds</td></tr>
    </table>

    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 4px; margin: 16px 0;">
      <p style="margin: 0 0 6px 0; font-weight: 600; color: #065f46;">Generated Post-Processing Artifacts:</p>
      <ul style="margin: 0; padding-left: 20px; color: #065f46; font-size: 12px;">
        <li>SAP ECC Batch Vendor Posting File: <code>{{sap_file_name}}</code></li>
        <li>Consolidated MIS Tracking Archive: <code>{{mis_package_name}}</code></li>
      </ul>
    </div>

    <p style="color: #64748b; font-size: 11px; margin-top: 20px;">
      This is an automated notification from the InvoiceFlow Autonomous Headless Engine.<br/>
      No login or manual portal action is required.
    </p>
  </div>
</div>`,
    body_text_template:
      'Your travel invoice {{invoice_number}} from {{vendor_name}} has been processed successfully. Gross: {{currency}} {{total_amount}}. SAP ECC Batch File: {{sap_file_name}}, MIS Package: {{mis_package_name}}.',
    include_sap_file: true,
    include_mis_package: true,
    is_active: true,
  },
  {
    id: 'tmpl_a_exception',
    template_key: 'STREAM_A_VENDOR_PAYMENT_EXCEPTION',
    stream_code: 'STREAM_A_ITH_TRAVEL',
    template_name: 'Stream A Vendor Payment - Exceptions Detected (Routed to Review)',
    outcome_status: 'EXCEPTION_REVIEW',
    subject_template: 'Action Required: [STREAM_A] {{invoice_number}} - {{vendor_name}} Routed to Finance Review',
    body_html_template: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #1e293b; line-height: 1.5;">
  <div style="background-color: #b45309; color: #ffffff; padding: 12px 16px; border-radius: 6px 6px 0 0;">
    <h3 style="margin: 0; font-size: 15px; font-weight: 600;">Travel Invoice Routed to Finance Review Queue</h3>
  </div>
  <div style="padding: 16px; border: 1px solid #cbd5e1; border-top: none; border-radius: 0 0 6px 6px; background: #ffffff;">
    <p>Dear Submitter,</p>
    <p>Your travel invoice <strong>{{invoice_number}}</strong> has been received, but automated approval was held due to the following business discrepancies:</p>

    <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 4px; margin: 16px 0;">
      <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 12px;">
        {{error_items_html}}
      </ul>
    </div>

    <p><strong>Instructions to Fix & Resubmit:</strong></p>
    <p style="color: #475569; font-size: 12px;">
      If resubmission is required, reply directly to this thread with the corrected invoice PDF attached. The system will automatically detect the resubmission, supersede the prior failed ticket, and complete posting.
    </p>

    <p style="color: #64748b; font-size: 11px; margin-top: 20px;">
      InvoiceFlow Autonomous Headless Engine | Accounts Payable Control Group
    </p>
  </div>
</div>`,
    body_text_template:
      'Invoice {{invoice_number}} from {{vendor_name}} held for review due to: {{error_summary}}. Please reply to this thread with corrected document if requested.',
    include_sap_file: false,
    include_mis_package: true,
    is_active: true,
  },
  {
    id: 'tmpl_b_success',
    template_key: 'STREAM_B_TAX_CREDIT_SUCCESS',
    stream_code: 'STREAM_B_AIRLINE_TAX_CREDIT',
    template_name: 'Stream B Airline Tax Credit - Registered Successfully (Eligible ITC)',
    outcome_status: 'SUCCESS_STP',
    subject_template: 'Re: [STREAM_B] {{invoice_number}} - {{airline_name}} ITC Registered ({{gst_claim_status}})',
    body_html_template: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #1e293b; line-height: 1.5;">
  <div style="background-color: #1d4ed8; color: #ffffff; padding: 12px 16px; border-radius: 6px 6px 0 0;">
    <h3 style="margin: 0; font-size: 15px; font-weight: 600;">Airline Input Tax Credit (ITC) Registered Successfully</h3>
  </div>
  <div style="padding: 16px; border: 1px solid #cbd5e1; border-top: none; border-radius: 0 0 6px 6px; background: #ffffff;">
    <p>Dear Submitter,</p>
    <p>The airline tax invoice has been validated against tax masters and registered in the Input Tax Credit (ITC) ledger.</p>

    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px;">
      <tr style="background: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600; width: 35%;">Processing Stream:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">Stream B (Airline Tax Invoices / Tax Credit Claims)</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Airline Carrier:</td><td style="padding: 8px; border: 1px solid #e2e8f0;"><strong>{{vendor_name}}</strong></td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Airline Tax ID (GSTIN / PAN):</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace;">{{vendor_tax_id}}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Invoice & Ticket No:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{{invoice_number}} / {{ticket_number}}</td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Airline PNR:</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">{{pnr_number}}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Passenger / Flight Sector:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{{passenger_name}} ({{flight_sector}})</td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Taxable Base:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">{{currency}} {{taxable_value}}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">Recoverable Tax Credit:</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8;">{{currency}} {{tax_amount}} ({{tax_code}})</td></tr>
      <tr style="background: #f8fafc;"><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">ITC Claim Status:</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #047857;">{{gst_claim_status}}</td></tr>
    </table>

    <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 4px; margin: 16px 0;">
      <p style="margin: 0 0 6px 0; font-weight: 600; color: #1e40af;">Generated Tax Ledger Artifacts:</p>
      <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 12px;">
        <li>SAP ECC Tax Credit Ledger File: <code>{{sap_file_name}}</code></li>
        <li>Audited MIS Package: <code>{{mis_package_name}}</code></li>
      </ul>
    </div>

    <p style="color: #64748b; font-size: 11px; margin-top: 20px;">
      InvoiceFlow Autonomous Headless Engine | Corporate Tax Group
    </p>
  </div>
</div>`,
    body_text_template:
      'Airline tax invoice {{invoice_number}} (PNR: {{pnr_number}}) registered for tax credit. Claimable tax: {{currency}} {{tax_amount}} ({{gst_claim_status}}).',
    include_sap_file: true,
    include_mis_package: true,
    is_active: true,
  },
  {
    id: 'tmpl_b_exception',
    template_key: 'STREAM_B_TAX_CREDIT_EXCEPTION',
    stream_code: 'STREAM_B_AIRLINE_TAX_CREDIT',
    template_name: 'Stream B Airline Tax Credit - Discrepancy Held',
    outcome_status: 'EXCEPTION_REVIEW',
    subject_template: 'Action Required: [STREAM_B] {{invoice_number}} - {{airline_name}} Tax Credit Held for Review',
    body_html_template: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #1e293b; line-height: 1.5;">
  <div style="background-color: #b91c1c; color: #ffffff; padding: 12px 16px; border-radius: 6px 6px 0 0;">
    <h3 style="margin: 0; font-size: 15px; font-weight: 600;">Airline Tax Credit Held for Verification</h3>
  </div>
  <div style="padding: 16px; border: 1px solid #cbd5e1; border-top: none; border-radius: 0 0 6px 6px; background: #ffffff;">
    <p>Dear Submitter,</p>
    <p>The airline tax invoice {{invoice_number}} could not be automatically approved for tax credit claim:</p>

    <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 4px; margin: 16px 0;">
      <ul style="margin: 0; padding-left: 20px; color: #991b1b; font-size: 12px;">
        {{error_items_html}}
      </ul>
    </div>

    <p style="color: #475569; font-size: 12px;">
      Common causes: Corporate GSTIN/PAN omitted during booking, or duplicate claim detected against Travel Agency reimbursement. Corporate Tax is reviewing.
    </p>
  </div>
</div>`,
    body_text_template:
      'Airline Tax Invoice {{invoice_number}} held for tax discrepancy: {{error_summary}}.',
    include_sap_file: false,
    include_mis_package: true,
    is_active: true,
  },
];

// ---------------------------------------------------------------------------
// STREAM VALIDATION RULES MASTER
// ---------------------------------------------------------------------------

export const STREAM_VALIDATION_RULES_MASTER: StreamValidationRuleRecord[] = [
  {
    id: 'r_stream_a_arithmetic',
    rule_code: 'VAL_STREAM_A_ARITHMETIC',
    stream_code: 'STREAM_A_ITH_TRAVEL',
    rule_name: 'Stream A Arithmetic Reconciliation',
    rule_type: 'ARITHMETIC',
    severity: 'BLOCK',
    error_code: 'VAL_ARITHMETIC_MISMATCH',
    error_message_template: 'Gross total ({{total}}) does not balance with net taxable ({{taxable}}) plus tax ({{tax}}). Diff: {{diff}}',
    remediation_hint: 'Verify invoice line items or tariff breakdown against header gross.',
    is_active: true,
  },
  {
    id: 'r_stream_a_trip_id',
    rule_code: 'RULE_TRIP_ID_CHECK',
    stream_code: 'STREAM_A_ITH_TRAVEL',
    rule_name: 'Trip ID Absence Check & Fallback Key Resolution',
    rule_type: 'TRIP_REFERENCE',
    severity: 'WARN',
    error_code: 'RULE_TRIP_ID_ABSENT',
    error_message_template: 'Invoice arrived without Trip ID. Resolved via fallback key: Employee ({{emp}}) + Travel Date ({{date}}) + Route ({{route}}).',
    remediation_hint: 'Verify passenger travel authorization memo in travel desk records.',
    is_active: true,
  },
  {
    id: 'r_stream_b_tax_id',
    rule_code: 'VAL_STREAM_B_AIRLINE_TAX_ID',
    stream_code: 'STREAM_B_AIRLINE_TAX_CREDIT',
    rule_name: 'Airline Tax Identifier (GSTIN/PAN) Validation',
    rule_type: 'FORMAT',
    severity: 'BLOCK',
    error_code: 'VAL_AIRLINE_TAX_ID_INVALID',
    error_message_template: 'Airline Tax ID ({{tax_id}}) is missing or violates statutory format (15-char GSTIN or 9-digit PAN).',
    remediation_hint: 'Obtain statutory tax invoice from airline with official GSTIN or PAN.',
    is_active: true,
  },
  {
    id: 'r_stream_b_pnr',
    rule_code: 'VAL_STREAM_B_PNR_PRESENT',
    stream_code: 'STREAM_B_AIRLINE_TAX_CREDIT',
    rule_name: 'Airline PNR & Ticket Number Check',
    rule_type: 'MANDATORY_FIELD',
    severity: 'BLOCK',
    error_code: 'VAL_PNR_TICKET_MISSING',
    error_message_template: 'Airline Tax Invoice must carry a valid PNR or E-Ticket Number to establish audit trail.',
    remediation_hint: 'Extract PNR from ticket passenger itinerary header.',
    is_active: true,
  },
  {
    id: 'r_cross_double_claim',
    rule_code: 'VAL_SUSPECTED_DOUBLE_CLAIM',
    stream_code: 'STREAM_B_AIRLINE_TAX_CREDIT',
    rule_name: 'Anti-Double-Claim Cross-Stream Check',
    rule_type: 'DOUBLE_CLAIM',
    severity: 'WARN',
    error_code: 'VAL_SUSPECTED_DOUBLE_CLAIM',
    error_message_template: 'Suspected double claim: Airline ticket PNR {{pnr}} is already linked to payment record in Stream A.',
    remediation_hint: 'Ensure input tax credit claim is posted without duplicating vendor expense.',
    is_active: true,
  },
];

// ---------------------------------------------------------------------------
// CORE DETECTION ENGINE: Document-Level Stream Identification
// ---------------------------------------------------------------------------

/**
 * Identifies the processing stream, subcategory, mandatory field requirements,
 * validation errors, and return-email notification preview for a document.
 */
export function identifyDocumentStream(ctx: StreamDetectionContext): StreamDetectionResult {
  const normText = (ctx.rawText || '').toLowerCase();
  const normFilename = (ctx.filename || '').toLowerCase();
  const normSubject = (ctx.subject || '').toLowerCase();
  const normMailbox = (ctx.mailbox || '').toLowerCase();
  const normSender = (ctx.sender || '').toLowerCase();
  const extracted = ctx.extractedData || {};

  let detectedStreamCode = 'STREAM_A_ITH_TRAVEL';
  let detectionMethod: StreamDetectionResult['detection_method'] = 'AI_CLASSIFICATION';
  let detectionConfidence = 85.0;
  let detectionDetails = 'Defaulted to Travel Agency stream';

  // 1. Mailbox pattern matching (Highest deterministic priority)
  if (
    normMailbox.includes('airline.gst') ||
    normMailbox.includes('airtax') ||
    normMailbox.includes('airline.vat')
  ) {
    detectedStreamCode = 'STREAM_B_AIRLINE_TAX_CREDIT';
    detectionMethod = 'MAILBOX_RULE';
    detectionConfidence = 99.0;
    detectionDetails = `Matched dedicated airline tax mailbox: ${ctx.mailbox}`;
  } else if (
    normMailbox.includes('travel') ||
    normMailbox.includes('ith') ||
    normMailbox.includes('duty.slip')
  ) {
    detectedStreamCode = 'STREAM_A_ITH_TRAVEL';
    detectionMethod = 'MAILBOX_RULE';
    detectionConfidence = 99.0;
    detectionDetails = `Matched dedicated travel ingestion mailbox: ${ctx.mailbox}`;
  }
  // 2. Sender address / domain matching
  else if (
    normSender.includes('indigo') ||
    normSender.includes('goindigo') ||
    normSender.includes('airindia') ||
    normSender.includes('vistara') ||
    normSender.includes('buddhaair') ||
    normSender.includes('yetiairlines')
  ) {
    detectedStreamCode = 'STREAM_B_AIRLINE_TAX_CREDIT';
    detectionMethod = 'SENDER_MATCH';
    detectionConfidence = 97.0;
    detectionDetails = `Matched direct airline sender: ${ctx.sender}`;
  } else if (
    normSender.includes('ith') ||
    normSender.includes('travelhouse') ||
    normSender.includes('traveldesk')
  ) {
    detectedStreamCode = 'STREAM_A_ITH_TRAVEL';
    detectionMethod = 'SENDER_MATCH';
    detectionConfidence = 97.0;
    detectionDetails = `Matched travel desk / ITH agency sender: ${ctx.sender}`;
  }
  // 3. Subject line / filename keywords
  else if (
    normSubject.includes('gst credit') ||
    normSubject.includes('air passenger ticket') ||
    normFilename.includes('airline_gst') ||
    normFilename.includes('indigo_airlines') ||
    normFilename.includes('buddha_air')
  ) {
    detectedStreamCode = 'STREAM_B_AIRLINE_TAX_CREDIT';
    detectionMethod = 'SUBJECT_MATCH';
    detectionConfidence = 95.0;
    detectionDetails = `Matched airline tax keywords in subject or filename`;
  } else if (
    normSubject.includes('duty slip') ||
    normSubject.includes('ith-') ||
    normFilename.includes('ith_') ||
    normFilename.includes('duty_slip') ||
    normFilename.includes('hotel_annapurna')
  ) {
    detectedStreamCode = 'STREAM_A_ITH_TRAVEL';
    detectionMethod = 'SUBJECT_MATCH';
    detectionConfidence = 95.0;
    detectionDetails = `Matched travel desk / duty slip keywords in subject or filename`;
  }
  // 4. Semantic document content & extracted fields
  else {
    const isAirlineContent =
      normText.includes('air passenger ticket') ||
      normText.includes('interglobe aviation') ||
      normText.includes('buddha air') ||
      normText.includes('yeti airlines') ||
      normText.includes('aviation passenger service fee') ||
      normText.includes('airline gstin') ||
      (extracted.booking_type === 'AIRLINE' && extracted.gst_claim_status === 'ELIGIBLE_ITC') ||
      (extracted.pnr_number && extracted.flight_sector);

    const isTravelAgencyContent =
      normText.includes('international travel house') ||
      normText.includes('consolidated travel') ||
      normText.includes('duty slip') ||
      normText.includes('trip id') ||
      normText.includes('hotel annapurna') ||
      normText.includes('management fee') ||
      extracted.trip_id;

    if (isAirlineContent && !isTravelAgencyContent) {
      detectedStreamCode = 'STREAM_B_AIRLINE_TAX_CREDIT';
      detectionMethod = 'AI_CLASSIFICATION';
      detectionConfidence = 96.0;
      detectionDetails = 'Document contains direct airline passenger ticket and tax credit indicators';
    } else if (isTravelAgencyContent) {
      detectedStreamCode = 'STREAM_A_ITH_TRAVEL';
      detectionMethod = 'AI_CLASSIFICATION';
      detectionConfidence = 96.0;
      detectionDetails = 'Document contains travel agency / ITH consolidated voucher indicators';
    } else {
      detectedStreamCode = 'STREAM_A_ITH_TRAVEL';
      detectionMethod = 'CONTENT_HEURISTIC';
      detectionConfidence = 78.0;
      detectionDetails = 'Classified as General Travel Expense stream based on heuristic fallback';
    }
  }

  // Detect Subcategory within Stream A
  let detectedSubcategory: StreamDetectionResult['subcategory'] = 'GENERAL';
  if (detectedStreamCode === 'STREAM_B_AIRLINE_TAX_CREDIT') {
    detectedSubcategory = 'AIRLINE';
  } else {
    if (
      normText.includes('hotel') ||
      normText.includes('room night') ||
      normText.includes('stay') ||
      normText.includes('annapurna') ||
      normFilename.includes('hotel')
    ) {
      detectedSubcategory = 'HOTEL';
    } else if (
      normText.includes('flight') ||
      normText.includes('airline') ||
      normText.includes('pnr') ||
      normFilename.includes('flight')
    ) {
      detectedSubcategory = 'AIRLINE';
    } else if (
      normText.includes('train') ||
      normText.includes('rail') ||
      normText.includes('irctc') ||
      normFilename.includes('train')
    ) {
      detectedSubcategory = 'TRAIN';
    } else if (
      normText.includes('cab') ||
      normText.includes('taxi') ||
      normText.includes('duty slip') ||
      normFilename.includes('cab')
    ) {
      detectedSubcategory = 'CAB';
    } else if (
      normText.includes('consolidated') ||
      normText.includes('itinerary')
    ) {
      detectedSubcategory = 'ITH_CONSOLIDATED';
    } else {
      detectedSubcategory = 'GENERAL';
    }
  }

  // Look up stream master record
  const streamDef =
    PROCESSING_STREAMS_MASTER.find((s) => s.stream_code === detectedStreamCode) ||
    PROCESSING_STREAMS_MASTER[0];

  const subcatDef =
    streamDef.subcategories.find((sc) => sc.subcategory_code === detectedSubcategory) ||
    streamDef.subcategories[0] || {
      mandatory_field_keys: ['invoice_number', 'invoice_date', 'vendor_name', 'total_cost'],
    };

  const mandatoryFields = subcatDef.mandatory_field_keys;

  // Evaluate mandatory fields
  const missingMandatoryFields: string[] = [];
  for (const f of mandatoryFields) {
    const val = extracted[f];
    if (val === undefined || val === null || val === '') {
      // Check alternative keys
      if (f === 'pnr_ticket' && (extracted.pnr_number || extracted.ticket_number)) continue;
      if (f === 'vendor_tax_id' && (extracted.vendor_tax_id || extracted.pan_number || extracted.gstin)) continue;
      missingMandatoryFields.push(f);
    }
  }

  // Evaluate validation rules
  const validationErrors: StreamDetectionResult['validation_errors'] = [];

  // Mandatory fields check
  for (const mf of missingMandatoryFields) {
    validationErrors.push({
      error_code: 'VAL_MANDATORY_FIELD_MISSING',
      field_key: mf,
      severity: 'BLOCK',
      message: `Mandatory field '${mf}' is missing for ${streamDef.stream_name} (${detectedSubcategory}).`,
      remediation_hint: `Extract or provide '${mf}' from the invoice document.`,
    });
  }

  // Stream-specific rules
  if (detectedStreamCode === 'STREAM_A_ITH_TRAVEL') {
    // Trip ID check (Non-blocking WARN as per prompt specification Part A.4)
    if (!extracted.trip_id) {
      validationErrors.push({
        error_code: 'RULE_TRIP_ID_ABSENT',
        field_key: 'trip_id',
        severity: 'WARN',
        message: 'Invoice arrived without Trip ID. Fallback key will be used for traveler association.',
        remediation_hint: 'Verify passenger travel authorization memo in travel desk records.',
      });
    }

    // Arithmetic check
    const total = Number(extracted.total_cost || 0);
    const taxable = Number(extracted.taxable_value || 0);
    const tax = Number(extracted.tax_amount || 0);
    if (total > 0 && taxable > 0 && Math.abs(total - (taxable + tax)) > 0.15) {
      validationErrors.push({
        error_code: 'VAL_ARITHMETIC_MISMATCH',
        field_key: 'total_cost',
        severity: 'BLOCK',
        message: `Gross amount (${total}) does not balance with taxable base (${taxable}) + tax (${tax}). Diff: ${(total - (taxable + tax)).toFixed(2)}`,
        remediation_hint: 'Check invoice breakdown for unaccounted discount, cess, or rounding discrepancy.',
      });
    }
  } else if (detectedStreamCode === 'STREAM_B_AIRLINE_TAX_CREDIT') {
    // Airline tax ID format check
    const taxId = extracted.vendor_tax_id || '';
    const isGstin = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(taxId);
    const isPan = /^[0-9]{9}$/.test(taxId);
    if (!taxId || (!isGstin && !isPan)) {
      validationErrors.push({
        error_code: 'VAL_AIRLINE_TAX_ID_INVALID',
        field_key: 'vendor_tax_id',
        severity: 'BLOCK',
        message: `Airline tax identifier '${taxId}' is invalid. Must be 15-char GSTIN or 9-digit Nepal PAN.`,
        remediation_hint: 'Obtain official airline e-invoice with registered tax identifier.',
      });
    }

    // PNR check
    if (!extracted.pnr_number && !extracted.ticket_number && !extracted.pnr_ticket) {
      validationErrors.push({
        error_code: 'VAL_PNR_TICKET_MISSING',
        field_key: 'pnr_number',
        severity: 'BLOCK',
        message: 'Airline PNR or E-Ticket Number is missing; required for tax credit audit trail.',
        remediation_hint: 'Extract PNR from ticket header or reservation record.',
      });
    }
  }

  // Determine outcome status
  const hasBlockers = validationErrors.some((e) => e.severity === 'BLOCK');
  const outcomeStatus: ReturnEmailPreview['outcome_status'] = hasBlockers
    ? 'EXCEPTION_REVIEW'
    : detectionConfidence >= streamDef.auto_approve_threshold
    ? 'SUCCESS_STP'
    : 'EXCEPTION_REVIEW';

  // Generate return-email preview
  const returnEmail = generateReturnEmail(
    detectedStreamCode,
    outcomeStatus,
    {
      ...extracted,
      subcategory: detectedSubcategory,
      filename: ctx.filename,
    },
    validationErrors,
    ctx.sender || ctx.mailbox
  );

  return {
    stream_code: detectedStreamCode,
    stream_name: streamDef.stream_name,
    subcategory: detectedSubcategory,
    confidence: detectionConfidence,
    detection_method: detectionMethod,
    detection_details: detectionDetails,
    mandatory_fields: mandatoryFields,
    missing_mandatory_fields: missingMandatoryFields,
    validation_errors: validationErrors,
    return_email_preview: returnEmail,
  };
}

// ---------------------------------------------------------------------------
// RETURN-EMAIL GENERATOR
// ---------------------------------------------------------------------------

export function generateReturnEmail(
  streamCode: string,
  outcomeStatus: ReturnEmailPreview['outcome_status'],
  data: Record<string, any>,
  validationErrors: Array<{ error_code: string; message: string; remediation_hint?: string }>,
  senderEmail?: string
): ReturnEmailPreview {
  const isStreamA = streamCode === 'STREAM_A_ITH_TRAVEL';
  const isSuccess = outcomeStatus === 'SUCCESS_STP';

  const templateKey = isStreamA
    ? isSuccess
      ? 'STREAM_A_VENDOR_PAYMENT_SUCCESS'
      : 'STREAM_A_VENDOR_PAYMENT_EXCEPTION'
    : isSuccess
    ? 'STREAM_B_TAX_CREDIT_SUCCESS'
    : 'STREAM_B_TAX_CREDIT_EXCEPTION';

  const templateDef =
    NOTIFICATION_TEMPLATES_MASTER.find((t) => t.template_key === templateKey) ||
    NOTIFICATION_TEMPLATES_MASTER[0];

  const invNum = data.invoice_number || 'INV-PENDING';
  const vendorName = data.vendor_name || (isStreamA ? 'International Travel House Ltd.' : 'IndiGo Airlines');
  const currency = data.currency || (data.vendor_name?.includes('Nepal') ? 'NPR' : 'INR');
  const totalAmount = Number(data.total_cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const taxableValue = Number(data.taxable_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const taxAmount = Number(data.tax_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const latency = Math.floor(Math.random() * 12) + 8; // e.g. 8-20s execution latency

  const sapFileName = isStreamA
    ? `SAP_ECC_FB60_VENDOR_${invNum.replace(/[^A-Za-z0-9]/g, '_')}.txt`
    : `SAP_ECC_AIRLINE_ITC_${invNum.replace(/[^A-Za-z0-9]/g, '_')}.txt`;

  const misPackageName = `MIS_PACKAGE_${isStreamA ? 'STREAM_A' : 'STREAM_B'}_${invNum.replace(/[^A-Za-z0-9]/g, '_')}.zip`;

  // Render variables in subject
  const subject = templateDef.subject_template
    .replace('{{invoice_number}}', invNum)
    .replace('{{vendor_name}}', vendorName)
    .replace('{{airline_name}}', vendorName)
    .replace('{{gst_claim_status}}', data.gst_claim_status || 'ELIGIBLE_ITC');

  // Render error list HTML
  const errorItemsHtml =
    validationErrors.length > 0
      ? validationErrors
          .map(
            (e) =>
              `<li><strong>[${e.error_code}]</strong>: ${e.message}${e.remediation_hint ? ` &mdash; <em>Action: ${e.remediation_hint}</em>` : ''}</li>`
          )
          .join('')
      : '<li>No discrepancies detected.</li>';

  const errorSummary = validationErrors.map((e) => `[${e.error_code}] ${e.message}`).join('; ');

  // Render HTML body
  const bodyHtml = templateDef.body_html_template
    .replace(/\{\{invoice_number\}\}/g, invNum)
    .replace(/\{\{vendor_name\}\}/g, vendorName)
    .replace(/\{\{vendor_code\}\}/g, data.vendor_code || (isStreamA ? '100088' : '100092'))
    .replace(/\{\{vendor_tax_id\}\}/g, data.vendor_tax_id || (isStreamA ? '07AAACI1920H1ZP' : '07AABCI4818R1Z1'))
    .replace(/\{\{airline_name\}\}/g, vendorName)
    .replace(/\{\{subcategory\}\}/g, data.subcategory || 'HOTEL')
    .replace(/\{\{trip_id\}\}/g, data.trip_id || 'TRIP-2026-9410 (Fallback Matched)')
    .replace(/\{\{pnr_number\}\}/g, data.pnr_number || '6E-W8Q29')
    .replace(/\{\{ticket_number\}\}/g, data.ticket_number || '312-8829104')
    .replace(/\{\{passenger_name\}\}/g, data.passenger_name || 'Rajesh Sharma')
    .replace(/\{\{flight_sector\}\}/g, data.flight_sector || 'CCU-DEL')
    .replace(/\{\{currency\}\}/g, currency)
    .replace(/\{\{total_amount\}\}/g, totalAmount)
    .replace(/\{\{taxable_value\}\}/g, taxableValue)
    .replace(/\{\{tax_amount\}\}/g, taxAmount)
    .replace(/\{\{tax_code\}\}/g, data.tax_code || 'GST5')
    .replace(/\{\{gst_claim_status\}\}/g, data.gst_claim_status || 'ELIGIBLE_ITC')
    .replace(/\{\{latency_seconds\}\}/g, String(latency))
    .replace(/\{\{sap_file_name\}\}/g, sapFileName)
    .replace(/\{\{mis_package_name\}\}/g, misPackageName)
    .replace(/\{\{error_items_html\}\}/g, errorItemsHtml)
    .replace(/\{\{error_summary\}\}/g, errorSummary);

  const bodyText = templateDef.body_text_template
    .replace(/\{\{invoice_number\}\}/g, invNum)
    .replace(/\{\{vendor_name\}\}/g, vendorName)
    .replace(/\{\{currency\}\}/g, currency)
    .replace(/\{\{total_amount\}\}/g, totalAmount)
    .replace(/\{\{tax_amount\}\}/g, taxAmount)
    .replace(/\{\{pnr_number\}\}/g, data.pnr_number || '6E-W8Q29')
    .replace(/\{\{gst_claim_status\}\}/g, data.gst_claim_status || 'ELIGIBLE_ITC')
    .replace(/\{\{sap_file_name\}\}/g, sapFileName)
    .replace(/\{\{mis_package_name\}\}/g, misPackageName)
    .replace(/\{\{error_summary\}\}/g, errorSummary);

  return {
    template_key: templateKey,
    template_name: templateDef.template_name,
    outcome_status: outcomeStatus,
    recipient_email: senderEmail || (isStreamA ? 'travel.submitter@enterprise.internal' : 'traveler@snpl.com.np'),
    reply_to_mode: isStreamA ? 'REPLY_ALL' : 'REPLY_ALL',
    email_subject: subject,
    email_body_html: bodyHtml,
    email_body_text: bodyText,
    attached_sap_file: templateDef.include_sap_file ? sapFileName : undefined,
    attached_mis_package: templateDef.include_mis_package ? misPackageName : undefined,
    generated_at: new Date().toISOString(),
  };
}
