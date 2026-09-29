import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Send,
  Layers,
  Calculator,
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { DocumentRecord, ExtractedField } from '../types';

export const Workbench: React.FC = () => {
  const { documents, setDocuments, fields, settings, addLog, errorCatalog } = useInvoiceFlowStore();

  const [selectedDocId, setSelectedDocId] = useState<string | null>(() => {
    return documents.length > 0 ? documents[0].id : null;
  });

  const [activeHighlightField, setActiveHighlightField] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rejectionModal, setRejectionModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const currentDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const handleUpdateFieldValue = (fieldKey: string, newValue: string) => {
    if (!currentDoc) return;

    const updatedFields = {
      ...currentDoc.fields,
      [fieldKey]: {
        ...(currentDoc.fields[fieldKey] || {
          field_key: fieldKey,
          confidence: 100,
          source: 'MANUAL',
        }),
        normalized_value: newValue,
        is_edited: true,
      },
    };

    // If amount field, update total_amount
    const newTotal = fieldKey === 'total_cost' ? parseFloat(newValue) || currentDoc.total_amount : currentDoc.total_amount;
    const newTax = fieldKey === 'tax_amount' ? parseFloat(newValue) || currentDoc.tax_amount : currentDoc.tax_amount;

    const updatedDoc: DocumentRecord = {
      ...currentDoc,
      fields: updatedFields,
      total_amount: newTotal,
      tax_amount: newTax,
      vendor_name: fieldKey === 'vendor_name' ? newValue : currentDoc.vendor_name,
      document_number: fieldKey === 'invoice_number' ? newValue : currentDoc.document_number,
    };

    setDocuments(documents.map((d) => (d.id === currentDoc.id ? updatedDoc : d)));
    addLog(
      'WORKBENCH',
      'FIELD_MANUALLY_EDITED',
      'SUCCESS',
      `Field ${fieldKey} edited to "${newValue}"`,
      0,
      undefined,
      currentDoc.id
    );
  };

  const handleApproveDocument = () => {
    if (!currentDoc) return;
    const updated: DocumentRecord = {
      ...currentDoc,
      document_status: 'APPROVED',
      approved_at: new Date().toISOString(),
      approved_by: 'Current Reviewer',
    };
    setDocuments(documents.map((d) => (d.id === currentDoc.id ? updated : d)));
    addLog(
      'WORKBENCH',
      'DOCUMENT_APPROVED',
      'SUCCESS',
      `Document ${currentDoc.document_number} approved for SAP ECC export gate`,
      0,
      undefined,
      currentDoc.id
    );
  };

  const handleRejectDocument = () => {
    if (!currentDoc) return;
    const updated: DocumentRecord = {
      ...currentDoc,
      document_status: 'REJECTED',
      review_reason: rejectionReason || 'Rejected during human review',
    };
    setDocuments(documents.map((d) => (d.id === currentDoc.id ? updated : d)));
    setRejectionModal(false);
    addLog(
      'WORKBENCH',
      'DOCUMENT_REJECTED',
      'WARNING',
      `Document ${currentDoc.document_number} rejected: ${rejectionReason}`,
      0,
      'VAL-001',
      currentDoc.id
    );
  };

  if (!currentDoc) {
    return (
      <div className="py-20 text-center rounded-lg border border-dashed border-neutral-800 bg-neutral-900/40">
        <FileText className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-white">No Invoices in Review Queue</h2>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
          The workbench displays invoices requiring human verification. Ingest an invoice via upload or mailbox simulator to begin.
        </p>
      </div>
    );
  }

  // Arithmetic reconciliation check
  const headerTotal = currentDoc.total_amount || 0;
  const lineSum = currentDoc.line_items.reduce((acc, itm) => acc + (itm.line_net_amount || 0), 0);
  const taxSum = currentDoc.tax_amount || 0;
  const calculatedGross = lineSum + taxSum;
  const delta = Math.abs(headerTotal - calculatedGross);
  const isMathValid = delta <= (settings.arithmetic_tolerance || 0.05);

  return (
    <div className="space-y-4">
      {/* Top Document Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
        <div className="flex items-center gap-3">
          <label className="text-xs text-neutral-400 font-medium">Document:</label>
          <select
            value={currentDoc.id}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono text-white"
          >
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.document_number} · {doc.vendor_name || 'Vendor Unresolved'} · ${doc.total_amount.toFixed(2)} (
                {doc.document_status})
              </option>
            ))}
          </select>

          <span
            className={`font-mono text-xs px-2 py-0.5 rounded border ${
              currentDoc.document_status === 'APPROVED'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : currentDoc.document_status === 'REVIEW_PENDING'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
          >
            {currentDoc.document_status}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRejectionModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 rounded transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>

          <button
            onClick={handleApproveDocument}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve for SAP Export</span>
          </button>
        </div>
      </div>

      {/* Dual-Pane Review Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-210px)] min-h-[600px]">
        {/* LEFT PANE: Document Visual Viewer with Bounding Box Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden">
          {/* Canvas Controls */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-900 text-xs">
            <span className="text-neutral-400 font-mono truncate">{currentDoc.original_filename}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
                className="p-1 hover:text-white text-neutral-400"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-neutral-400 w-10 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(160, z + 10))}
                className="p-1 hover:text-white text-neutral-400"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Document Simulation Sheet */}
          <div className="flex-1 overflow-auto p-4 flex justify-center bg-neutral-900/40">
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="relative w-[540px] min-h-[720px] bg-white text-neutral-900 p-8 shadow-2xl rounded-sm transition-transform select-none font-sans text-xs"
            >
              {/* Simulated Paper Invoice Document */}
              <div className="border-b-2 border-neutral-900 pb-4 mb-6 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-neutral-900 font-display">
                    {currentDoc.vendor_name || 'TAX INVOICE'}
                  </h2>
                  <p className="text-[10px] text-neutral-600 mt-1">Official Tax Invoice &amp; Folio</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-neutral-900">
                    {currentDoc.document_number}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    Date: {currentDoc.document_date || '2026-09-15'}
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-[11px]">
                <div className="p-2 border border-neutral-200 rounded">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase block">Billed To:</span>
                  <div className="font-semibold text-neutral-800">Enterprise Holding Ltd</div>
                  <div className="text-neutral-500">Company Code: {currentDoc.company_code || '1000'}</div>
                </div>
                <div className="p-2 border border-neutral-200 rounded text-right">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase block">Expense Category:</span>
                  <div className="font-semibold text-neutral-800 font-mono">
                    {currentDoc.expense_category || 'GENERAL'}
                  </div>
                  <div className="text-neutral-500 font-mono">Currency: {currentDoc.currency_code}</div>
                </div>
              </div>

              {/* Invoice Lines Table */}
              <table className="w-full text-left text-[11px] mb-6">
                <thead>
                  <tr className="border-b border-neutral-900 text-neutral-700 font-bold">
                    <th className="pb-1">Description</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Unit Price</th>
                    <th className="pb-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {currentDoc.line_items.map((itm) => (
                    <tr key={itm.id}>
                      <td className="py-2 text-neutral-800">{itm.description}</td>
                      <td className="py-2 text-center font-mono">{itm.quantity}</td>
                      <td className="py-2 text-right font-mono">${itm.unit_price.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono font-medium">${itm.line_net_amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="border-t-2 border-neutral-900 pt-3 space-y-1 text-right text-[11px]">
                <div className="flex justify-end gap-6 text-neutral-600">
                  <span>Net Taxable Amount:</span>
                  <span className="font-mono w-24">${(currentDoc.total_amount - currentDoc.tax_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-end gap-6 text-neutral-600">
                  <span>Tax Amount ({currentDoc.tax_code || 'V1'}):</span>
                  <span className="font-mono w-24">${currentDoc.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-end gap-6 text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-300">
                  <span>Gross Total Payable:</span>
                  <span className="font-mono w-24">${currentDoc.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Simulated Bounding Box Overlay for active highlighted field */}
              {activeHighlightField && (
                <div className="absolute inset-x-8 top-16 h-12 border-2 border-blue-500 bg-blue-500/10 rounded pointer-events-none animate-pulse flex items-center px-2">
                  <span className="text-[10px] bg-blue-600 text-white font-mono px-1 rounded">
                    Field: {activeHighlightField}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Dynamic Form Renderer & Reconciliation (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Dynamic Metadata Fields ({fields.length})
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              STP Score: {currentDoc.stp_score}%
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Arithmetic Reconciliation Card */}
            <div
              className={`p-3 rounded-lg border text-xs space-y-2 ${
                isMathValid
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  Header-Line Math Reconciliation
                </span>
                <span className="font-mono text-[11px]">
                  {isMathValid ? 'BALANCED' : `DELTA: $${delta.toFixed(2)}`}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 flex justify-between font-mono">
                <span>Σ Lines (${lineSum.toFixed(2)}) + Tax (${taxSum.toFixed(2)}) = ${calculatedGross.toFixed(2)}</span>
                <span>Header: ${headerTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Dynamic Fields List generated strictly from field_definition */}
            <div className="space-y-3">
              {fields.map((f) => {
                const extracted = currentDoc.fields[f.field_key];
                const val =
                  extracted?.normalized_value !== undefined
                    ? extracted.normalized_value
                    : f.field_key === 'total_cost'
                    ? currentDoc.total_amount
                    : f.field_key === 'tax_amount'
                    ? currentDoc.tax_amount
                    : f.field_key === 'invoice_number'
                    ? currentDoc.document_number
                    : f.field_key === 'vendor_name'
                    ? currentDoc.vendor_name
                    : f.field_key === 'expense_category'
                    ? currentDoc.expense_category
                    : f.field_key === 'company_code'
                    ? currentDoc.company_code
                    : '';

                const confidence = extracted?.confidence ?? 95;
                const isHighConf = confidence >= 90;
                const isMidConf = confidence >= 70 && confidence < 90;

                return (
                  <div
                    key={f.id}
                    onMouseEnter={() => setActiveHighlightField(f.field_key)}
                    onMouseLeave={() => setActiveHighlightField(null)}
                    className="p-2.5 rounded bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-neutral-300 flex items-center gap-1">
                        {f.display_label}
                        {f.is_mandatory && <span className="text-amber-400">*</span>}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="text-neutral-500">{f.export_column_name || '-'}</span>
                        <span
                          className={`px-1 py-0.2 rounded font-bold ${
                            isHighConf
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : isMidConf
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {confidence}%
                        </span>
                      </div>
                    </div>

                    <input
                      type={f.data_type === 'NUMBER' ? 'number' : 'text'}
                      value={val}
                      onChange={(e) => handleUpdateFieldValue(f.field_key, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 focus:border-blue-500 rounded text-xs text-white font-mono"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-4">
            <h3 className="text-sm font-semibold text-white">Reject Invoice Document</h3>
            <p className="text-xs text-neutral-400">
              State the rejection reason. This will be recorded in the audit log and returned to the sender/approver.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Unreadable tax identifier, incorrect company code"
              className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white font-sans"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectionModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDocument}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
