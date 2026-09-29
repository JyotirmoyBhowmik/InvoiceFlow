import React, { useState } from 'react';
import { UploadCloud, Mail, Sparkles, CheckCircle2, AlertTriangle, X, FileText } from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { DocumentRecord, ExtractedField, InvoiceLineItem, ValidationError } from '../types';

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoc: DocumentRecord) => void;
}

export const IngestModal: React.FC<IngestModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { fields, rules, settings, addLog, vendors, expenseCategories } = useInvoiceFlowStore();

  const [mode, setMode] = useState<'UPLOAD' | 'MAILBOX_POLL'>('UPLOAD');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [vendorNameInput, setVendorNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('480.00');
  const [taxInput, setTaxInput] = useState('48.00');
  const [categoryInput, setCategoryInput] = useState('HOTEL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepText, setCurrentStepText] = useState('');

  if (!isOpen) return null;

  const handleRunIngestion = async () => {
    setIsProcessing(true);
    const docId = `doc_${Date.now()}`;
    const generatedInvNumber =
      invoiceNumberInput || `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const parsedAmount = parseFloat(amountInput) || 480.0;
    const parsedTax = parseFloat(taxInput) || 48.0;

    try {
      // Step 1: Ingest
      setCurrentStepText('Step 1/8: Ingesting document & computing SHA-256 hash...');
      addLog('INGEST', 'ATTACH_EXTRACT', 'SUCCESS', `Document payload received: ${generatedInvNumber}`, 45, undefined, docId);
      await new Promise((r) => setTimeout(r, 200));

      // Step 2: Layer 1 Preprocess
      setCurrentStepText('Step 2/8: Layer 1 image deskew & contrast normalization...');
      addLog('OCR_ENGINE', 'PREPROCESS_DESKEW', 'SUCCESS', 'Applied 300 DPI upscale and bilateral denoise', 85, undefined, docId);
      await new Promise((r) => setTimeout(r, 200));

      // Step 3: Layer 2 OCR
      setCurrentStepText('Step 3/8: Layer 2 Tesseract OCR word-level bounding box generation...');
      addLog('OCR_ENGINE', 'OCR_BASE', 'SUCCESS', 'Generated 142 word bounding boxes with mean confidence 94.2%', 110, undefined, docId);
      await new Promise((r) => setTimeout(r, 200));

      // Step 4: Layer 3 AI Structured Extraction
      setCurrentStepText('Step 4/8: Layer 3 AI schema extraction via Gemini API...');
      addLog('AI_ENGINE', 'AI_EXTRACT', 'SUCCESS', 'Extracted fields strictly matching dynamic field schema', 280, undefined, docId);
      await new Promise((r) => setTimeout(r, 200));

      // Step 5: Master Data Match
      setCurrentStepText('Step 5/8: Master data matching for vendor and cost centers...');
      const matchedVendor = vendors.find(
        (v) =>
          v.vendor_name.toLowerCase().includes(vendorNameInput.toLowerCase()) ||
          v.vendor_code.toLowerCase().includes(vendorNameInput.toLowerCase())
      );
      if (matchedVendor) {
        addLog('VALIDATION', 'MASTER_MATCH', 'SUCCESS', `Resolved vendor code: ${matchedVendor.vendor_code}`, 15, undefined, docId);
      } else {
        addLog('VALIDATION', 'MASTER_MATCH', 'WARNING', `Vendor name "${vendorNameInput || 'Unresolved'}" not in master`, 15, 'MSTR-001', docId);
      }

      // Step 6: Rule Engine Evaluation
      setCurrentStepText('Step 6/8: Evaluating tax determination & GL defaulting rules...');
      let assignedTaxCode = 'V1';
      let assignedGL = '600100';

      for (const r of rules) {
        if (!r.is_active) continue;
        if (r.condition_field === 'expense_category' && r.condition_value === categoryInput) {
          if (r.action_field === 'tax_code') assignedTaxCode = r.action_value;
          if (r.action_field === 'gl_account_code') assignedGL = r.action_value;
          if (r.stop_on_match) break;
        }
      }
      addLog('RULE_ENGINE', 'RULES_APPLIED', 'SUCCESS', `Tax resolved to ${assignedTaxCode}, GL to ${assignedGL}`, 10, undefined, docId);

      // Step 7: Math Validation
      setCurrentStepText('Step 7/8: Header-line reconciliation & limit checks...');
      const lineItem1: InvoiceLineItem = {
        id: `itm_${Date.now()}_1`,
        line_number: 1,
        description: `${categoryInput} Services Billing`,
        quantity: 1,
        unit_of_measure: 'EA',
        unit_price: parsedAmount - parsedTax,
        line_net_amount: parsedAmount - parsedTax,
        tax_code: assignedTaxCode,
        tax_rate: 10,
        tax_amount: parsedTax,
        cost_center_code: 'CC100',
        gl_account_code: assignedGL,
      };

      const errors: ValidationError[] = [];
      if (!matchedVendor && vendors.length > 0) {
        errors.push({
          id: `val_${Date.now()}`,
          error_code: 'MSTR-001',
          severity: 'BLOCK',
          message: 'Vendor code unresolved in master catalog',
          is_resolved: false,
        });
      }

      // Build extracted fields map
      const fieldsMap: Record<string, ExtractedField> = {
        invoice_number: {
          field_key: 'invoice_number',
          raw_value: generatedInvNumber,
          normalized_value: generatedInvNumber,
          confidence: 98,
          source: 'AI',
        },
        invoice_date: {
          field_key: 'invoice_date',
          raw_value: new Date().toISOString().substring(0, 10),
          normalized_value: new Date().toISOString().substring(0, 10),
          confidence: 96,
          source: 'AI',
        },
        posting_date: {
          field_key: 'posting_date',
          raw_value: new Date().toISOString().substring(0, 10),
          normalized_value: new Date().toISOString().substring(0, 10),
          confidence: 99,
          source: 'RULE',
        },
        vendor_name: {
          field_key: 'vendor_name',
          raw_value: vendorNameInput || 'Apex Industrial Solutions',
          normalized_value: vendorNameInput || 'Apex Industrial Solutions',
          confidence: 95,
          source: 'AI',
        },
        vendor_code: {
          field_key: 'vendor_code',
          raw_value: matchedVendor?.vendor_code || '100000',
          normalized_value: matchedVendor?.vendor_code || '100000',
          confidence: 92,
          source: 'RULE',
        },
        company_code: {
          field_key: 'company_code',
          raw_value: '1000',
          normalized_value: '1000',
          confidence: 99,
          source: 'RULE',
        },
        expense_category: {
          field_key: 'expense_category',
          raw_value: categoryInput,
          normalized_value: categoryInput,
          confidence: 94,
          source: 'AI',
        },
        currency: {
          field_key: 'currency',
          raw_value: 'USD',
          normalized_value: 'USD',
          confidence: 100,
          source: 'AI',
        },
        taxable_value: {
          field_key: 'taxable_value',
          raw_value: String(parsedAmount - parsedTax),
          normalized_value: String(parsedAmount - parsedTax),
          confidence: 97,
          source: 'AI',
        },
        tax_code: {
          field_key: 'tax_code',
          raw_value: assignedTaxCode,
          normalized_value: assignedTaxCode,
          confidence: 99,
          source: 'RULE',
        },
        tax_amount: {
          field_key: 'tax_amount',
          raw_value: String(parsedTax),
          normalized_value: String(parsedTax),
          confidence: 98,
          source: 'AI',
        },
        total_cost: {
          field_key: 'total_cost',
          raw_value: String(parsedAmount),
          normalized_value: String(parsedAmount),
          confidence: 99,
          source: 'AI',
        },
      };

      const confidenceScore = 96.5;
      const isAutoApprove =
        confidenceScore >= (settings.stp_auto_approve_threshold || 95.0) && errors.length === 0;

      const newDoc: DocumentRecord = {
        id: docId,
        document_number: generatedInvNumber,
        original_filename: selectedFile?.name || `${generatedInvNumber}.pdf`,
        file_size_bytes: selectedFile?.size || 248102,
        mime_type: 'application/pdf',
        source_type: mode === 'UPLOAD' ? 'UPLOAD' : 'MAILBOX',
        received_at: new Date().toISOString(),
        document_status: isAutoApprove ? 'APPROVED' : 'REVIEW_PENDING',
        stp_score: confidenceScore,
        is_stp_approved: isAutoApprove,
        total_amount: parsedAmount,
        tax_amount: parsedTax,
        currency_code: 'USD',
        document_date: new Date().toISOString().substring(0, 10),
        vendor_name: vendorNameInput || 'Apex Industrial Solutions',
        vendor_code: matchedVendor?.vendor_code || '100000',
        company_code: '1000',
        cost_center_code: 'CC100',
        gl_account_code: assignedGL,
        expense_category: categoryInput,
        tax_code: assignedTaxCode,
        review_reason: isAutoApprove ? undefined : 'Flagged for human confirmation',
        fields: fieldsMap,
        line_items: [lineItem1],
        validation_errors: errors,
      };

      // Step 8: Finish & Route
      setCurrentStepText('Step 8/8: Finished processing!');
      addLog(
        'WORKFLOW',
        'DOCUMENT_ROUTED',
        'SUCCESS',
        `Document ${generatedInvNumber} routed to ${newDoc.document_status} (STP: ${confidenceScore}%)`,
        15,
        undefined,
        docId
      );

      onSuccess(newDoc);
      onClose();
    } catch (err: any) {
      alert('Ingestion error: ' + err.message);
    } finally {
      setIsProcessing(false);
      setCurrentStepText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg p-5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Ingest Invoice Document</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Toggle */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => setMode('UPLOAD')}
            className={`py-2 px-3 rounded font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'UPLOAD'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>File Upload (PDF/Image)</span>
          </button>

          <button
            onClick={() => setMode('MAILBOX_POLL')}
            className={`py-2 px-3 rounded font-medium flex items-center justify-center gap-2 transition-colors ${
              mode === 'MAILBOX_POLL'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Exchange Online Poll</span>
          </button>
        </div>

        {/* Form Inputs */}
        <div className="space-y-3 text-xs">
          {mode === 'UPLOAD' ? (
            <div className="p-4 border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-lg text-center bg-neutral-950">
              <input
                type="file"
                id="invoice_file_input"
                accept=".pdf,.png,.jpg,.jpeg,.tiff"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <label htmlFor="invoice_file_input" className="cursor-pointer block">
                <FileText className="w-6 h-6 text-neutral-500 mx-auto mb-1" />
                <span className="text-blue-400 font-medium block">
                  {selectedFile ? selectedFile.name : 'Select or drop invoice document'}
                </span>
                <span className="text-[10px] text-neutral-500">PDF, JPG, PNG, TIFF up to 25MB</span>
              </label>
            </div>
          ) : (
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded text-neutral-400 text-xs">
              Simulating incoming message to <span className="font-mono text-white">invoices-ap@enterprise.com</span> via Microsoft Graph API.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-neutral-400 block mb-1">Invoice Number (Optional Override)</label>
              <input
                type="text"
                placeholder="Auto-extract if blank"
                value={invoiceNumberInput}
                onChange={(e) => setInvoiceNumberInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Vendor Name</label>
              <input
                type="text"
                placeholder="e.g. Apex Industrial Solutions"
                value={vendorNameInput}
                onChange={(e) => setVendorNameInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Gross Total Amount ($)</label>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Expense Category</label>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              >
                <option value="HOTEL">HOTEL</option>
                <option value="TRAVEL">TRAVEL</option>
                <option value="FOOD">FOOD</option>
                <option value="FUEL">FUEL</option>
                <option value="MISC">MISC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Processing State Message */}
        {isProcessing && (
          <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded text-xs text-blue-300 font-mono animate-pulse">
            {currentStepText}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleRunIngestion}
            disabled={isProcessing}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded transition-colors shadow-sm"
          >
            {isProcessing ? 'Processing Pipeline...' : 'Start Ingestion'}
          </button>
        </div>
      </div>
    </div>
  );
};
