import React, { useState } from 'react';
import { AlertTriangle, Plus, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { ErrorCatalogItem } from '../types';

export const ErrorCatalogManager: React.FC = () => {
  const { errorCatalog, setErrorCatalog, addLog } = useInvoiceFlowStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newError, setNewError] = useState<Omit<ErrorCatalogItem, 'id'>>({
    error_code: '',
    domain_prefix: 'VAL',
    severity: 'ERROR',
    message_template: '',
    remediation_text: '',
    auto_action: 'ROUTE_TO_REVIEW',
    is_retryable: false,
  });

  const handleAddCode = () => {
    if (!newError.error_code || !newError.message_template) return;
    const item: ErrorCatalogItem = {
      ...newError,
      id: `err_${Date.now()}`,
      error_code: newError.error_code.toUpperCase(),
    };
    setErrorCatalog([...errorCatalog, item]);
    addLog('SYSTEM', 'ERROR_CODE_REGISTERED', 'SUCCESS', `Registered error catalog code: ${item.error_code}`);
    setIsAdding(false);
    setNewError({
      error_code: '',
      domain_prefix: 'VAL',
      severity: 'ERROR',
      message_template: '',
      remediation_text: '',
      auto_action: 'ROUTE_TO_REVIEW',
      is_retryable: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            Error Code Catalog Manager
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Standardized structured error codes. Zero hard-coded error messages in source code; all lookups query this catalog.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Register Error Code</span>
        </button>
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="p-4 rounded-lg bg-neutral-900 border border-blue-500/40 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Register New Error Code
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-neutral-400 block mb-1">Prefix</label>
              <select
                value={newError.domain_prefix}
                onChange={(e) => setNewError({ ...newError, domain_prefix: e.target.value as any })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              >
                <option value="MAIL">MAIL (Mail Ingestion)</option>
                <option value="ATCH">ATCH (Attachments &amp; Archives)</option>
                <option value="OCR">OCR (Layer 0/1/2)</option>
                <option value="AI">AI (Layer 3 Intelligence)</option>
                <option value="VAL">VAL (Validation &amp; Math)</option>
                <option value="MSTR">MSTR (Master Data Resolution)</option>
                <option value="TAX">TAX (Tax Determination)</option>
                <option value="EXP">EXP (SAP ECC Export)</option>
                <option value="SYS">SYS (System Infrastructure)</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Error Code *</label>
              <input
                type="text"
                placeholder="VAL-099"
                value={newError.error_code}
                onChange={(e) => setNewError({ ...newError, error_code: e.target.value.toUpperCase() })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Severity</label>
              <select
                value={newError.severity}
                onChange={(e) => setNewError({ ...newError, severity: e.target.value as any })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              >
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
                <option value="BLOCK">BLOCK (Blocks Export Gate)</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Auto Action</label>
              <select
                value={newError.auto_action}
                onChange={(e) => setNewError({ ...newError, auto_action: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              >
                <option value="ROUTE_TO_REVIEW">Route to Human Review</option>
                <option value="RETRY">Automatic Retry with Backoff</option>
                <option value="DLQ">Send to Dead-Letter Queue</option>
                <option value="DROP">Drop / Ignore</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-neutral-400 block mb-1">Message Template (with placeholders)</label>
              <input
                type="text"
                placeholder="e.g. Field {field_key} failed validation regex"
                value={newError.message_template}
                onChange={(e) => setNewError({ ...newError, message_template: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-neutral-400 block mb-1">Remediation Text</label>
              <input
                type="text"
                placeholder="Guidance for operator in Correction Workbench"
                value={newError.remediation_text}
                onChange={(e) => setNewError({ ...newError, remediation_text: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white">
              Cancel
            </button>
            <button
              onClick={handleAddCode}
              disabled={!newError.error_code || !newError.message_template}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded transition-colors"
            >
              Register Code
            </button>
          </div>
        </div>
      )}

      {/* Catalog Table */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
              <th className="py-2.5 px-3">Code</th>
              <th className="py-2.5 px-3">Prefix</th>
              <th className="py-2.5 px-3">Severity</th>
              <th className="py-2.5 px-3">Message Template</th>
              <th className="py-2.5 px-3">Remediation Guidance</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3 text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 text-neutral-300">
            {errorCatalog.map((err) => (
              <tr key={err.id} className="hover:bg-neutral-800/30">
                <td className="py-2.5 px-3 font-mono font-bold text-white">{err.error_code}</td>
                <td className="py-2.5 px-3 font-mono text-neutral-400">{err.domain_prefix}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded border font-semibold ${
                      err.severity === 'BLOCK'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : err.severity === 'ERROR'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    {err.severity}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-neutral-200 font-medium">{err.message_template}</td>
                <td className="py-2.5 px-3 text-neutral-400">{err.remediation_text}</td>
                <td className="py-2.5 px-3 font-mono text-neutral-400 text-[11px]">{err.auto_action}</td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => setErrorCatalog(errorCatalog.filter((x) => x.id !== err.id))}
                    className="p-1 text-neutral-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
