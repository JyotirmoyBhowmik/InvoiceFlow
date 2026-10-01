import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  RefreshCw,
  Plus,
  Shield,
  Globe,
  Clock,
  Send,
  FileText,
  FileSpreadsheet,
  Archive,
  Download,
  Check,
  AlertTriangle,
  Play,
  Server,
  Sparkles,
  Inbox,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { DocumentRecord, ExtractedField, InvoiceLineItem } from '../types';
import { formatINR, formatOriginalCurrency } from '../utils/currency';

interface InboundEmail {
  id: string;
  sender_email: string;
  sender_name: string;
  recipient_mailbox: string;
  subject: string;
  received_at: string;
  attachment_name: string;
  attachment_size_kb: number;
  status: 'QUEUED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  invoice_type: 'ITH_CONSOLIDATED' | 'AIRLINE_GST' | 'NEPALI_HOTEL' | 'CAB_TRAIN';
  trip_id?: string;
  pnr?: string;
  processed_doc_id?: string;
}

interface OutboundEmail {
  id: string;
  recipient_email: string;
  subject: string;
  dispatched_at: string;
  run_number: string;
  total_invoices: number;
  approved_count: number;
  exception_count: number;
  total_amount_inr: number;
  attachments: {
    name: string;
    type: 'CSV' | 'ZIP' | 'TXT';
    size: string;
  }[];
}

export const MailboxManager: React.FC = () => {
  const { addLog, documents, setDocuments, settings } = useInvoiceFlowStore();

  const [activeSubTab, setActiveSubTab] = useState<'scheduler' | 'inbound_queue' | 'outbound_dispatch' | 'mailboxes'>('scheduler');
  const [schedulerStatus, setSchedulerStatus] = useState<'IDLE' | 'RUNNING' | 'POLLING'>('IDLE');
  const [scheduleIntervalMins, setScheduleIntervalMins] = useState<number>(30);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(1800);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchResultMsg, setBatchResultMsg] = useState<string | null>(null);

  // Dedicated inboxes matching meeting notes
  const [inboxes, setInboxes] = useState([
    {
      id: 'mbx_ith',
      name: 'ITH Travel Agency Invoices (Air/Hotel/Cab/Train)',
      email: 'ap-ith-travel@itc.in',
      scope: 'ITH consolidated agency invoices with/without Trip ID',
      tenant: 'ITC ITD Cloud / MS Graph',
      status: 'MONITORING',
      unread_count: 2,
    },
    {
      id: 'mbx_airline',
      name: 'Airline Invoices (GST Credit Claims)',
      email: 'airline-gst@itc.in',
      scope: 'Airline GST input tax credit claim supporting invoices (IndiGo, Air India, Vistara)',
      tenant: 'ITC ITD Cloud / MS Graph',
      status: 'MONITORING',
      unread_count: 1,
    },
    {
      id: 'mbx_nepal',
      name: 'Surya Nepal / Customer Travel & Local Invoices',
      email: 'ap-nepal-travel@surya.com.np',
      scope: 'Customer local travel, hotel, and Nepali-language invoices',
      tenant: 'Customer Azure Tenant / On-Prem',
      status: 'MONITORING',
      unread_count: 1,
    },
  ]);

  // Live Inbound Email Queue (Awaiting periodic scheduler run)
  const [inboundQueue, setInboundQueue] = useState<InboundEmail[]>([
    {
      id: 'eml_01',
      sender_email: 'rajesh.sharma@itc.in',
      sender_name: 'Rajesh Sharma (ITD Operations)',
      recipient_mailbox: 'ap-ith-travel@itc.in',
      subject: 'Invoice for Mumbai Field Visit - Trip #TRIP-2026-9410',
      received_at: '2026-09-30 11:30 AM',
      attachment_name: 'ITH_Travel_Consolidated_INV-2026-9410.pdf',
      attachment_size_kb: 412,
      status: 'QUEUED',
      invoice_type: 'ITH_CONSOLIDATED',
      trip_id: 'TRIP-2026-9410',
    },
    {
      id: 'eml_02',
      sender_email: 'travel.helpdesk@itc.in',
      sender_name: 'ITH Executive Desk',
      recipient_mailbox: 'airline-gst@itc.in',
      subject: 'IndiGo Airline GST Tax Invoice PNR: 6E-W8Q29 (CCU-DEL)',
      received_at: '2026-09-30 11:42 AM',
      attachment_name: 'IndiGo_Airlines_GST_6E-W8Q29.pdf',
      attachment_size_kb: 284,
      status: 'QUEUED',
      invoice_type: 'AIRLINE_GST',
      pnr: '6E-W8Q29',
    },
    {
      id: 'eml_03',
      sender_email: 'finance.nepal@surya.com.np',
      sender_name: 'Nitesh Shrestha (Finance SNPL)',
      recipient_mailbox: 'ap-nepal-travel@surya.com.np',
      subject: 'होटल अन्नपूर्ण कर बिजक HA-2083-0492 (Kathmandu Stay)',
      received_at: '2026-09-30 11:50 AM',
      attachment_name: 'Hotel_Annapurna_Kathmandu_Tax_Invoice_NP.pdf',
      attachment_size_kb: 340,
      status: 'QUEUED',
      invoice_type: 'NEPALI_HOTEL',
    },
    {
      id: 'eml_04',
      sender_email: 'fleet.kolkata@itc.in',
      sender_name: 'ITH Airport Fleet Support',
      recipient_mailbox: 'ap-ith-travel@itc.in',
      subject: 'Airport Local Cab Duty Slip DS-4019 + Train Ticket',
      received_at: '2026-09-30 11:55 AM',
      attachment_name: 'ITH_Local_Cab_Train_DS-4019.pdf',
      attachment_size_kb: 198,
      status: 'QUEUED',
      invoice_type: 'CAB_TRAIN',
      trip_id: 'TRIP-2026-9410',
    },
  ]);

  // Outbound dispatched emails (Return email with SAP output & MIS package)
  const [outboundQueue, setOutboundQueue] = useState<OutboundEmail[]>([
    {
      id: 'out_prev_01',
      recipient_email: 'rajesh.sharma@itc.in',
      subject: '[PROCESSED] SAP Batch & ITD MIS Package - Run #RUN-2026-0003',
      dispatched_at: '2026-09-30 11:15 AM',
      run_number: 'RUN-2026-0003',
      total_invoices: 3,
      approved_count: 3,
      exception_count: 0,
      total_amount_inr: 45600.0,
      attachments: [
        { name: 'SAP_ECC_FB60_BATCH_RUN-2026-0003.csv', type: 'CSV', size: '14.2 KB' },
        { name: 'ITD_MIS_TRACKING_PACKAGE_RUN-2026-0003.zip', type: 'ZIP', size: '1.4 MB' },
        { name: 'AUTOMATED_AUDIT_REPORT.txt', type: 'TXT', size: '4.8 KB' },
      ],
    },
  ]);

  // Periodic scheduler timer countdown simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          return scheduleIntervalMins * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [scheduleIntervalMins]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Trigger Immediate Scheduled Run (Batch execution)
  const handleTriggerScheduledRun = async () => {
    const queuedItems = inboundQueue.filter((m) => m.status === 'QUEUED');
    if (queuedItems.length === 0) {
      setBatchResultMsg('Scheduled Batch Scan Complete: No new unread invoice emails in monitored mailboxes.');
      return;
    }

    setIsProcessingBatch(true);
    setSchedulerStatus('RUNNING');
    setBatchResultMsg(null);

    const start = performance.now();
    addLog(
      'SCHEDULER',
      'UNATTENDED_BATCH_START',
      'STARTED',
      `Unattended periodic run initiated for ${queuedItems.length} queued invoice emails`
    );

    // Process each queued item
    const newDocs: DocumentRecord[] = [];
    let approvedCount = 0;
    let exceptionCount = 0;
    let totalDebitInr = 0;

    for (const item of queuedItems) {
      let docNum = '';
      let vendor = '';
      let total = 0;
      let tax = 0;
      let curr = 'INR';
      let cat = 'TRAVEL';
      let tripId = item.trip_id;
      let pnr = item.pnr;
      let gstStatus: any = 'NOT_APPLICABLE';

      if (item.invoice_type === 'ITH_CONSOLIDATED') {
        docNum = 'ITH-2026-9410';
        vendor = 'International Travel House Ltd.';
        total = 31207.50;
        tax = 3807.50;
        cat = 'TRAVEL';
        tripId = 'TRIP-2026-9410';
        pnr = '6E-W8Q29';
      } else if (item.invoice_type === 'AIRLINE_GST') {
        docNum = '6E-INV-2026-88192';
        vendor = 'InterGlobe Aviation Ltd. (IndiGo)';
        total = 8820.00;
        tax = 420.00;
        cat = 'AIRLINE';
        pnr = '6E-W8Q29';
        gstStatus = 'ELIGIBLE_ITC';
      } else if (item.invoice_type === 'NEPALI_HOTEL') {
        docNum = 'HA-2083-0492';
        vendor = 'Hotel Annapurna & Hospitality Pvt. Ltd.';
        total = 20905.00;
        tax = 2405.00;
        curr = 'NPR';
        cat = 'HOTEL';
        gstStatus = 'NEPAL_VAT_CLAIM';
      } else if (item.invoice_type === 'CAB_TRAIN') {
        docNum = 'ITH-DS-2026-4019';
        vendor = 'International Travel House Ltd.';
        total = 4567.50;
        tax = 217.50;
        cat = 'CAB';
        tripId = 'TRIP-2026-9410';
      }

      const inrAmount = curr === 'NPR' ? total * 0.625 : total;
      totalDebitInr += inrAmount;

      const isApproved = item.invoice_type !== 'CAB_TRAIN'; // Make one an exception to demonstrate human review
      if (isApproved) approvedCount++;
      else exceptionCount++;

      const docId = `doc_mail_${Date.now()}_${Math.random().toString().slice(2, 6)}`;

      const fieldsMap: Record<string, ExtractedField> = {
        invoice_number: { field_key: 'invoice_number', raw_value: docNum, normalized_value: docNum, confidence: 98, value_source: 'EXTRACTED', extractor_name: 'gemini-3.1-flash-lite' },
        invoice_date: { field_key: 'invoice_date', raw_value: '2026-09-25', normalized_value: '2026-09-25', confidence: 96, value_source: 'EXTRACTED', extractor_name: 'gemini-3.1-flash-lite' },
        vendor_name: { field_key: 'vendor_name', raw_value: vendor, normalized_value: vendor, confidence: 96, value_source: 'EXTRACTED', extractor_name: 'gemini-3.1-flash-lite' },
        currency: { field_key: 'currency', raw_value: curr, normalized_value: curr, confidence: 98, value_source: 'EXTRACTED', extractor_name: 'gemini-3.1-flash-lite' },
        total_cost: { field_key: 'total_cost', raw_value: String(total), normalized_value: String(total), confidence: 98, value_source: 'EXTRACTED', extractor_name: 'gemini-3.1-flash-lite' },
        tax_amount: { field_key: 'tax_amount', raw_value: String(tax), normalized_value: String(tax), confidence: 94, value_source: 'EXTRACTED', extractor_name: 'gemini-3.1-flash-lite' },
        trip_id: { field_key: 'trip_id', raw_value: tripId || '', normalized_value: tripId || '', confidence: tripId ? 96 : 0, value_source: tripId ? 'EXTRACTED' : 'NOT_FOUND' },
        pnr_ticket: { field_key: 'pnr_ticket', raw_value: pnr || '', normalized_value: pnr || '', confidence: pnr ? 96 : 0, value_source: pnr ? 'EXTRACTED' : 'NOT_FOUND' },
        gst_claim_status: { field_key: 'gst_claim_status', raw_value: gstStatus, normalized_value: gstStatus, confidence: 95, value_source: 'DERIVED' },
      };

      const lineItem: InvoiceLineItem = {
        id: `itm_${Date.now()}_1`,
        line_number: 1,
        description: item.subject,
        quantity: 1,
        unit_of_measure: 'EA',
        unit_price: total - tax,
        line_net_amount: total - tax,
        tax_code: curr === 'NPR' ? 'VAT13' : (tax > 0 ? 'GST18' : 'EXEMPT'),
        tax_rate: curr === 'NPR' ? 13 : 18,
        tax_amount: tax,
        cost_center_code: 'CC100',
        gl_account_code: cat === 'AIRLINE' ? '600300' : (cat === 'HOTEL' ? '600400' : '600100'),
        value_source: 'EXTRACTED',
      };

      const newDoc: DocumentRecord = {
        id: docId,
        document_number: docNum,
        original_filename: item.attachment_name,
        file_size_bytes: item.attachment_size_kb * 1024,
        mime_type: 'application/pdf',
        source_type: 'MAILBOX',
        received_at: new Date().toISOString(),
        document_status: isApproved ? 'APPROVED' : 'REVIEW_PENDING',
        stp_score: isApproved ? 98.0 : 88.0,
        is_stp_approved: isApproved,
        total_amount: total,
        tax_amount: tax,
        currency_code: curr,
        base_currency: 'INR',
        exchange_rate_to_inr: curr === 'NPR' ? 0.625 : 1.0,
        converted_total_inr: inrAmount,
        converted_tax_inr: curr === 'NPR' ? tax * 0.625 : tax,
        document_date: '2026-09-25',
        document_artifact_id: `art_${Date.now()}`,
        document_artifact_sha256: `sha256_${Date.now().toString(16)}`,
        document_artifact_uri: `mailboxes/${item.recipient_mailbox}/${item.attachment_name}`,
        vendor_name: vendor,
        vendor_code: vendor.includes('IndiGo') ? '100092' : (vendor.includes('Annapurna') ? '200101' : '100088'),
        company_code: curr === 'NPR' ? '2000' : '1000',
        cost_center_code: 'CC100',
        gl_account_code: cat === 'AIRLINE' ? '600300' : (cat === 'HOTEL' ? '600400' : '600100'),
        expense_category: cat,
        trip_id: tripId,
        pnr_number: pnr,
        booking_type: cat === 'AIRLINE' ? 'AIRLINE' : (cat === 'HOTEL' ? 'HOTEL' : (cat === 'CAB' ? 'CAB' : 'ITH_CONSOLIDATED')),
        gst_claim_status: gstStatus,
        fields: fieldsMap,
        line_items: [lineItem],
        validation_errors: isApproved ? [] : [
          {
            id: 'err_val_cab',
            error_code: 'VAL-003',
            field_key: 'tax_code',
            severity: 'WARN',
            message: 'Cab transport SAC 9964 requires dual-check for 5% reverse charge applicability',
            is_resolved: false,
          }
        ],
        review_reason: isApproved ? undefined : 'TDS 194C / GST reverse charge manual verification needed',
      };

      newDocs.push(newDoc);
    }

    // Update documents reactive state
    setDocuments([...newDocs, ...documents]);

    // Mark inbound queue items as PROCESSED
    setInboundQueue((prev) =>
      prev.map((item) => ({ ...item, status: 'PROCESSED' }))
    );

    // Create Outbound Return Email Dispatch record matching meeting notes
    const runNum = `RUN-${new Date().getFullYear()}-${String(outboundQueue.length + 1).padStart(4, '0')}`;
    const newDispatch: OutboundEmail = {
      id: `out_${Date.now()}`,
      recipient_email: 'rajesh.sharma@itc.in; travel.helpdesk@itc.in; finance.nepal@surya.com.np',
      subject: `[PROCESSED] SAP Batch & ITD MIS Package - Run #${runNum}`,
      dispatched_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      run_number: runNum,
      total_invoices: queuedItems.length,
      approved_count: approvedCount,
      exception_count: exceptionCount,
      total_amount_inr: totalDebitInr,
      attachments: [
        { name: `SAP_ECC_FB60_BATCH_${runNum}.csv`, type: 'CSV', size: '18.4 KB' },
        { name: `ITD_MIS_TRACKING_PACKAGE_${runNum}.zip`, type: 'ZIP', size: '2.1 MB' },
        { name: 'AUDIT_VALIDATION_SUMMARY.txt', type: 'TXT', size: '5.2 KB' },
      ],
    };

    setOutboundQueue([newDispatch, ...outboundQueue]);

    addLog(
      'MAIL_INGEST',
      'UNATTENDED_BATCH_DISPATCHED',
      'SUCCESS',
      `Periodic run complete: ${queuedItems.length} invoices extracted (${approvedCount} approved, ${exceptionCount} review exceptions). Return email dispatched with MIS package.`,
      Math.round(performance.now() - start)
    );

    setIsProcessingBatch(false);
    setSchedulerStatus('IDLE');
    setCountdownSeconds(scheduleIntervalMins * 60);
    setBatchResultMsg(
      `Unattended run #${runNum} successfully executed: Processed ${queuedItems.length} invoices (${formatINR(totalDebitInr)}). SAP Batch CSV and ITD MIS Package ZIP returned to submitters by email.`
    );
  };

  // Simulate new inbound email dropped by user
  const handleSimulateNewInbound = (type: 'ITH_CONSOLIDATED' | 'AIRLINE_GST' | 'NEPALI_HOTEL') => {
    let subject = '';
    let att = '';
    let mbx = '';
    let trip = undefined;
    let pnr = undefined;

    if (type === 'ITH_CONSOLIDATED') {
      subject = 'Corporate Air + Hotel Booking for Kolkata Visit';
      att = `ITH_Invoice_${Date.now().toString().slice(-4)}.pdf`;
      mbx = 'ap-ith-travel@itc.in';
      trip = 'TRIP-2026-9410';
    } else if (type === 'AIRLINE_GST') {
      subject = 'IndiGo Airline GST Credit Ticket PNR 6E-T9A21';
      att = `IndiGo_GST_${Date.now().toString().slice(-4)}.pdf`;
      mbx = 'airline-gst@itc.in';
      pnr = '6E-T9A21';
    } else {
      subject = 'होटल अन्नपूर्ण पोखरा कर बिजक (Hotel Pokhara NP)';
      att = `Pokhara_Hotel_NP_${Date.now().toString().slice(-4)}.pdf`;
      mbx = 'ap-nepal-travel@surya.com.np';
    }

    const newMail: InboundEmail = {
      id: `eml_${Date.now()}`,
      sender_email: 'employee.traveler@itc.in',
      sender_name: 'ITC Executive Traveler',
      recipient_mailbox: mbx,
      subject,
      received_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment_name: att,
      attachment_size_kb: Math.floor(Math.random() * 200 + 150),
      status: 'QUEUED',
      invoice_type: type,
      trip_id: trip,
      pnr,
    };

    setInboundQueue([newMail, ...inboundQueue]);
    addLog('MAIL_INGEST', 'INBOUND_EMAIL_RECEIVED', 'SUCCESS', `Inbound email received at ${mbx} with attachment ${att}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white font-display">
              Unattended Email Ingestion &amp; Processing Service
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              DAEMON ACTIVE
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Headless console service developed for ITC / ITD &amp; Customer Surya Nepal. Receives invoices via dedicated inboxes, extracts via Gemini AI, validates against deterministic SAP masters, and returns SAP-ready output + ITD MIS tracking packages by email.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerScheduledRun}
            disabled={isProcessingBatch}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded transition-colors shadow-sm cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isProcessingBatch ? 'animate-spin' : ''}`} />
            <span>{isProcessingBatch ? 'Executing Batch Run...' : 'Trigger Immediate Scheduled Run'}</span>
          </button>
        </div>
      </div>

      {batchResultMsg && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{batchResultMsg}</span>
        </div>
      )}

      {/* Sub Navigation Tabs */}
      <div className="flex border-b border-neutral-800 space-x-1">
        <button
          onClick={() => setActiveSubTab('scheduler')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'scheduler'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Scheduler &amp; Service Health</span>
        </button>
        <button
          onClick={() => setActiveSubTab('inbound_queue')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'inbound_queue'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Inbound Mailbox Queue ({inboundQueue.filter((m) => m.status === 'QUEUED').length} Pending)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('outbound_dispatch')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'outbound_dispatch'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Automated Return Email Dispatches</span>
        </button>
        <button
          onClick={() => setActiveSubTab('mailboxes')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'mailboxes'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Dedicated Inboxes &amp; Tenant Config</span>
        </button>
      </div>

      {/* TAB 1: SCHEDULER & SERVICE HEALTH */}
      {activeSubTab === 'scheduler' && (
        <div className="space-y-6">
          {/* Unattended Workflow Card matching Meeting Notes */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-blue-950/30 to-indigo-950/20 border border-blue-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Unattended Email Workflow Architecture
              </span>
              <span className="text-[11px] font-mono text-neutral-400">ITC ITD · Surya Nepal Eval</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Users send invoice files directly to dedicated email addresses (no portal or manual data entry needed). The daemon runs periodically on a timer (e.g., invoices arriving at <strong>11:30 AM</strong> are extracted, validated against SAP master tables during the <strong>12:00 PM</strong> run, and the SAP-ready export + ITD MIS tracking package returned to the submitter by <strong>12:15 PM</strong>).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              <div className="p-2.5 rounded bg-neutral-900/80 border border-neutral-800 text-xs">
                <span className="text-neutral-500 block text-[10px]">1. Inbound Ingestion</span>
                <span className="font-semibold text-white block mt-0.5">MS Graph / Azure Mailbox</span>
                <span className="text-[11px] text-neutral-400">Reads PDF / image attachments</span>
              </div>
              <div className="p-2.5 rounded bg-neutral-900/80 border border-neutral-800 text-xs">
                <span className="text-neutral-500 block text-[10px]">2. AI Extraction</span>
                <span className="font-semibold text-white block mt-0.5">Gemini 3.1 Flash / Lite</span>
                <span className="text-[11px] text-neutral-400">15 paisa (~₹0.15) token cost</span>
              </div>
              <div className="p-2.5 rounded bg-neutral-900/80 border border-neutral-800 text-xs">
                <span className="text-neutral-500 block text-[10px]">3. Deterministic Rules</span>
                <span className="font-semibold text-white block mt-0.5">SAP Master Validation</span>
                <span className="text-[11px] text-neutral-400">GSTIN, Business Place, TDS</span>
              </div>
              <div className="p-2.5 rounded bg-neutral-900/80 border border-neutral-800 text-xs">
                <span className="text-neutral-500 block text-[10px]">4. Automated Return</span>
                <span className="font-semibold text-white block mt-0.5">SAP CSV + ITD MIS Zip</span>
                <span className="text-[11px] text-neutral-400">Dispatched back by email</span>
              </div>
            </div>
          </div>

          {/* Scheduler Metrics & Frequency Controller */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-1">
              <span className="text-xs text-neutral-400">Next Scheduled Execution</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {formatCountdown(countdownSeconds)}
                </span>
                <span className="text-xs text-neutral-500">remaining</span>
              </div>
              <span className="text-[11px] text-neutral-500 block">Frequency: Every {scheduleIntervalMins} minutes</span>
            </div>

            <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-1">
              <span className="text-xs text-neutral-400">Unprocessed Inbound Queue</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {inboundQueue.filter((m) => m.status === 'QUEUED').length}
                </span>
                <span className="text-xs text-amber-400">emails pending</span>
              </div>
              <span className="text-[11px] text-neutral-500 block">Ready for next automated batch run</span>
            </div>

            <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-1">
              <span className="text-xs text-neutral-400">Scheduler Frequency Configuration</span>
              <select
                value={scheduleIntervalMins}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setScheduleIntervalMins(val);
                  setCountdownSeconds(val * 60);
                }}
                className="w-full mt-1 px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
              >
                <option value={15}>Every 15 Minutes (High Volume)</option>
                <option value={30}>Every 30 Minutes (Recommended)</option>
                <option value={60}>Every 60 Minutes (Hourly)</option>
                <option value={120}>Every 2 Hours</option>
              </select>
              <span className="text-[10px] text-neutral-500 block mt-1">Configured for unattended cron execution</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INBOUND MAILBOX QUEUE */}
      {activeSubTab === 'inbound_queue' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-neutral-900/40 border border-neutral-800 rounded">
            <div>
              <span className="text-xs font-semibold text-white block">Simulate Inbound Invoice Email</span>
              <span className="text-[11px] text-neutral-400">Click to simulate an employee or travel agency sending an invoice to the mailbox:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSimulateNewInbound('ITH_CONSOLIDATED')}
                className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3 text-emerald-400" />
                <span>Simulate ITH Consolidated Travel</span>
              </button>
              <button
                onClick={() => handleSimulateNewInbound('AIRLINE_GST')}
                className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3 text-blue-400" />
                <span>Simulate IndiGo Airline GST</span>
              </button>
              <button
                onClick={() => handleSimulateNewInbound('NEPALI_HOTEL')}
                className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>Simulate Nepali Hotel Bill</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2 px-3">Sender</th>
                  <th className="py-2 px-3">Dedicated Inbox</th>
                  <th className="py-2 px-3">Subject &amp; Trip / PNR</th>
                  <th className="py-2 px-3">Attachment</th>
                  <th className="py-2 px-3">Received</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 bg-neutral-950 font-mono">
                {inboundQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-900/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-sans font-medium text-white block">{item.sender_name}</span>
                      <span className="text-[11px] text-neutral-500">{item.sender_email}</span>
                    </td>
                    <td className="py-2.5 px-3 text-blue-400 text-[11px]">
                      {item.recipient_mailbox}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-sans text-neutral-200 block">{item.subject}</span>
                      <div className="flex gap-2 text-[10px] mt-0.5">
                        {item.trip_id && <span className="text-amber-400">Trip: {item.trip_id}</span>}
                        {item.pnr && <span className="text-blue-400">PNR: {item.pnr}</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 text-neutral-300">
                        <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{item.attachment_name}</span>
                        <span className="text-neutral-500 text-[10px]">({item.attachment_size_kb} KB)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-400 text-[11px]">
                      {item.received_at}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        item.status === 'QUEUED'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OUTBOUND EMAIL DISPATCHES */}
      {activeSubTab === 'outbound_dispatch' && (
        <div className="space-y-4">
          <p className="text-xs text-neutral-400">
            Records of return response emails automatically dispatched back to submitters once periodic batch processing completes. Each return email contains the SAP-ready export batch and the zipped ITD MIS tracking package.
          </p>

          <div className="space-y-3">
            {outboundQueue.map((disp) => (
              <div key={disp.id} className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-white text-xs">{disp.subject}</span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Dispatched at {disp.dispatched_at} · Run #{disp.run_number}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Recipients</span>
                    <span className="text-neutral-300 font-mono text-[11px] break-all">{disp.recipient_email}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Validation Summary</span>
                    <span className="text-emerald-400 font-semibold">{disp.approved_count} Approved</span>
                    {disp.exception_count > 0 && (
                      <span className="text-amber-400 ml-2">({disp.exception_count} Human Review Exceptions)</span>
                    )}
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Total Debited</span>
                    <span className="text-white font-mono font-semibold">{formatINR(disp.total_amount_inr)}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 space-y-1.5 text-xs">
                  <span className="text-neutral-400 text-[11px] font-medium block">
                    Automated Return Email Package Attachments:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {disp.attachments.map((att, i) => (
                      <div key={i} className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded flex items-center gap-2 text-[11px]">
                        {att.type === 'ZIP' ? (
                          <Archive className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span className="text-neutral-200 font-mono">{att.name}</span>
                        <span className="text-neutral-500 text-[10px]">({att.size})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MAILBOXES & TENANT CONFIG */}
      {activeSubTab === 'mailboxes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inboxes.map((mbx) => (
              <div key={mbx.id} className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{mbx.name}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                    {mbx.status}
                  </span>
                </div>
                <div className="text-xs font-mono text-blue-400">{mbx.email}</div>
                <p className="text-[11px] text-neutral-400">{mbx.scope}</p>
                <div className="pt-2 border-t border-neutral-800 flex justify-between text-[11px] text-neutral-500">
                  <span>Host: {mbx.tenant}</span>
                  <span className="text-amber-400">{mbx.unread_count} Unread</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-3 text-xs">
            <h3 className="text-sm font-semibold text-white">Deployment &amp; Hosting Architecture (Customer Data Center / Azure Tenant)</h3>
            <p className="text-neutral-400 leading-relaxed">
              Per the meeting notes, Customer has an on-premises data center and a separate tenant rather than using the ITC data center. The unattended daemon can run within Customer’s Azure landing zone or directly in on-prem VMs:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-300">
              <li><strong>Zero Portals Required:</strong> Employees and travel desks email invoices; output is returned via email.</li>
              <li><strong>Portability:</strong> Standard MySQL / Azure SQL with application-layer validation (no proprietary triggers or stored procedures).</li>
              <li><strong>Model Flexibility:</strong> Gemini 3.1 Flash / Lite via Vertex AI or Google AI Studio with API proxy, or Azure OpenAI if required.</li>
              <li><strong>Automated Master Synchronization:</strong> Master views exported as CSV from SAP can be emailed to the system for scheduled refresh.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
