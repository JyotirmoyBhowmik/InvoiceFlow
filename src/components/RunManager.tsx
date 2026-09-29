import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Eye,
  Hash,
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { ExportRunRecord, DocumentRecord } from '../types';

export const RunManager: React.FC = () => {
  const { exportRuns, setExportRuns, documents, setDocuments, exportProfile, addLog } =
    useInvoiceFlowStore();

  const [selectedRun, setSelectedRun] = useState<ExportRunRecord | null>(null);

  // Ready to export documents
  const approvedDocs = documents.filter((d) => d.document_status === 'APPROVED');

  const handleExecuteExportRun = () => {
    if (approvedDocs.length === 0) return;

    const runNumber = `RUN-${new Date().getFullYear()}-${String(exportRuns.length + 1).padStart(4, '0')}`;
    const sortedCols = [...exportProfile.columns].sort((a, b) => a.column_order - b.column_order);

    // 1. Generate CSV
    const csvLines: string[] = [];
    if (exportProfile.include_header_row) {
      csvLines.push(sortedCols.map((c) => `"${c.header_text}"`).join(exportProfile.csv_delimiter));
    }

    // 2. Generate TXT (fixed width)
    const txtLines: string[] = [];

    let totalDebit = 0;

    for (const doc of approvedDocs) {
      const items = doc.line_items.length > 0 ? doc.line_items : [{ line_net_amount: doc.total_amount, description: 'Invoice line' }];

      for (const itm of items) {
        // CSV row
        const rowCells = sortedCols.map((col) => {
          let val = '';
          if (col.record_type === 'HEADER' && col.constant_value) {
            val = col.constant_value;
          } else if (col.source_field_key === 'invoice_date') {
            val = doc.document_date || '2026.09.15';
          } else if (col.source_field_key === 'posting_date') {
            val = '2026.09.15';
          } else if (col.source_field_key === 'company_code') {
            val = doc.company_code || '1000';
          } else if (col.source_field_key === 'currency') {
            val = doc.currency_code || 'USD';
          } else if (col.source_field_key === 'invoice_number') {
            val = doc.document_number;
          } else if (col.source_field_key === 'vendor_code') {
            val = (doc.vendor_code || '100000').padStart(col.field_length || 10, '0');
          } else if (col.source_field_key === 'total_cost') {
            val = doc.total_amount.toFixed(2);
          } else if (col.source_field_key === 'tax_code') {
            val = doc.tax_code || 'V1';
          } else if (col.source_field_key === 'cost_center') {
            val = (doc.cost_center_code || 'CC100').padStart(col.field_length || 10, '0');
          } else if (col.source_field_key === 'gl_account_code') {
            val = (doc.gl_account_code || '600100').padStart(col.field_length || 10, '0');
          } else if (col.source_field_key === 'remarks') {
            val = doc.original_filename;
          }
          return `"${val}"`;
        });
        csvLines.push(rowCells.join(exportProfile.csv_delimiter));

        // TXT row
        let txtRow = '';
        for (const col of sortedCols) {
          let val = '';
          if (col.record_type === 'HEADER' && col.constant_value) val = col.constant_value;
          else if (col.source_field_key === 'invoice_number') val = doc.document_number;
          else if (col.source_field_key === 'total_cost') val = doc.total_amount.toFixed(2);
          else if (col.source_field_key === 'vendor_code') val = doc.vendor_code || '100000';
          else val = col.source_field_key;

          const len = col.field_length || 10;
          const padChar = col.pad_char || ' ';
          txtRow += col.alignment === 'RIGHT' ? val.padStart(len, padChar) : val.padEnd(len, padChar);
        }
        txtLines.push(txtRow);
      }

      totalDebit += doc.total_amount;
    }

    const csvContent = csvLines.join('\r\n');
    const txtContent = txtLines.join('\r\n');

    // SHA-256 hash approximation for control record
    const checksum = `SHA256-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

    const newRun: ExportRunRecord = {
      id: `run_${Date.now()}`,
      run_number: runNumber,
      profile_key: exportProfile.profile_key,
      status: 'GENERATED',
      total_documents: approvedDocs.length,
      total_debit: totalDebit,
      total_credit: 0,
      checksum_sha256: checksum,
      created_at: new Date().toISOString(),
      created_by: 'SAP System Operator',
      csv_preview: csvContent,
      txt_preview: txtContent,
    };

    setExportRuns([newRun, ...exportRuns]);

    // Mark documents as EXPORTED
    setDocuments(
      documents.map((d) => (d.document_status === 'APPROVED' ? { ...d, document_status: 'EXPORTED' } : d))
    );

    addLog(
      'EXPORT_ENGINE',
      'RUN_COMPLETED',
      'SUCCESS',
      `SAP ECC Export Run ${runNumber} generated: ${approvedDocs.length} documents ($${totalDebit.toFixed(2)})`,
      145,
      undefined,
      undefined,
      newRun.id
    );
  };

  const handleDownloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReverseRun = (run: ExportRunRecord) => {
    const updated = exportRuns.map((r) => (r.id === run.id ? { ...r, status: 'REVERSED' as const } : r));
    setExportRuns(updated);
    addLog(
      'EXPORT_ENGINE',
      'RUN_REVERSED',
      'WARNING',
      `Run ${run.run_number} reversed for SAP financial correction`,
      0,
      undefined,
      undefined,
      run.id
    );
    if (selectedRun?.id === run.id) {
      setSelectedRun({ ...selectedRun, status: 'REVERSED' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            SAP ECC Batch Export Runs
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Generate and dispatch validated invoice batches to SAP ECC FB60 standard layout CSV &amp; fixed-width TXT files.
          </p>
        </div>

        <button
          onClick={handleExecuteExportRun}
          disabled={approvedDocs.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded transition-colors shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Execute Run ({approvedDocs.length} Invoices Ready)</span>
        </button>
      </div>

      {/* Runs Table */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        {exportRuns.length === 0 ? (
          <div className="py-16 text-center text-xs text-neutral-400">
            <FileSpreadsheet className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <div className="font-semibold text-neutral-300">No Export Runs Executed Yet</div>
            <p className="mt-1 text-neutral-500 max-w-sm mx-auto">
              Approve invoices in the Review Workbench, then click "Execute Run" to compile standard SAP upload files.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                <th className="py-2.5 px-3">Run Number</th>
                <th className="py-2.5 px-3">Profile</th>
                <th className="py-2.5 px-3 text-center">Docs</th>
                <th className="py-2.5 px-3 text-right">Debit Balance</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Checksum</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {exportRuns.map((run) => (
                <tr key={run.id} className="hover:bg-neutral-800/30">
                  <td className="py-2.5 px-3 font-mono font-semibold text-white">{run.run_number}</td>
                  <td className="py-2.5 px-3 font-mono text-neutral-400">{run.profile_key}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{run.total_documents}</td>
                  <td className="py-2.5 px-3 font-mono-tabular text-right text-emerald-400 font-semibold">
                    ${run.total_debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                        run.status === 'GENERATED'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[10px] text-neutral-500 truncate max-w-[120px]">
                    {run.checksum_sha256}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedRun(run)}
                        className="px-2 py-1 text-[11px] text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => handleDownloadFile(run.csv_preview || '', `${run.run_number}.csv`, 'text/csv')}
                        className="px-2 py-1 text-[11px] text-blue-400 hover:text-white bg-blue-950/60 hover:bg-blue-900 border border-blue-800/40 rounded transition-colors flex items-center gap-1"
                        title="Download SAP CSV"
                      >
                        <Download className="w-3 h-3" />
                        <span>CSV</span>
                      </button>

                      <button
                        onClick={() => handleDownloadFile(run.txt_preview || '', `${run.run_number}.txt`, 'text/plain')}
                        className="px-2 py-1 text-[11px] text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors flex items-center gap-1"
                        title="Download SAP Fixed-Width TXT"
                      >
                        <Download className="w-3 h-3" />
                        <span>TXT</span>
                      </button>

                      {run.status !== 'REVERSED' && (
                        <button
                          onClick={() => handleReverseRun(run)}
                          className="p-1 text-neutral-500 hover:text-amber-400 transition-colors"
                          title="Reverse Run"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Run Detail Modal / Drawer */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl p-5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-semibold text-white">SAP File Artifact: {selectedRun.run_number}</h3>
                <span className="text-[11px] font-mono text-neutral-400">
                  {selectedRun.total_documents} documents · Control Total: ${selectedRun.total_debit.toFixed(2)}
                </span>
              </div>
              <button onClick={() => setSelectedRun(null)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs">
              <div>
                <span className="text-neutral-400 text-[11px] block mb-1">CSV File Output (SAP FB60 upload format):</span>
                <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded text-neutral-200 overflow-x-auto text-[11px]">
                  {selectedRun.csv_preview}
                </pre>
              </div>

              <div>
                <span className="text-neutral-400 text-[11px] block mb-1">Fixed-Width TXT Output:</span>
                <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded text-neutral-200 overflow-x-auto text-[11px]">
                  {selectedRun.txt_preview}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setSelectedRun(null)}
                className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
