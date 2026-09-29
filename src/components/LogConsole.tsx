import React, { useState } from 'react';
import {
  History,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Code,
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { ProcessLogEntry } from '../types';

export const LogConsole: React.FC = () => {
  const { processLogs, clearLogs, errorCatalog } = useInvoiceFlowStore();

  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<ProcessLogEntry | null>(null);

  const filteredLogs = processLogs.filter((log) => {
    if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    return true;
  });

  const exportLogsAsJson = () => {
    const blob = new Blob([JSON.stringify(processLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InvoiceFlow_process_logs_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            Process &amp; Audit Log Trace
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Immutable process events partitioned by month. Every step records execution duration, correlation ID, and error catalog mapping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportLogsAsJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Logs (JSON)</span>
          </button>

          <button
            onClick={clearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-red-400 bg-neutral-900 border border-neutral-800 hover:border-red-800/40 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Trace</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-neutral-400 font-medium">Filter Module:</span>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
          >
            <option value="ALL">All Modules</option>
            <option value="INGEST">INGEST</option>
            <option value="OCR_ENGINE">OCR_ENGINE</option>
            <option value="AI_ENGINE">AI_ENGINE</option>
            <option value="VALIDATION">VALIDATION</option>
            <option value="RULE_ENGINE">RULE_ENGINE</option>
            <option value="WORKBENCH">WORKBENCH</option>
            <option value="EXPORT_ENGINE">EXPORT_ENGINE</option>
            <option value="METADATA">METADATA</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-neutral-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="WARNING">WARNING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <div className="ml-auto text-neutral-500 font-mono text-[11px]">
          Showing {filteredLogs.length} of {processLogs.length} events
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-neutral-400">
            <History className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <div className="font-semibold text-neutral-300">No Log Entries Found</div>
            <p className="mt-1 text-neutral-500">Events appear here as pipeline stages execute.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Module</th>
                <th className="py-2.5 px-3">Step</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Duration</th>
                <th className="py-2.5 px-3">Error Code</th>
                <th className="py-2.5 px-3">Message</th>
                <th className="py-2.5 px-3 text-right">Inspector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-800/30">
                  <td className="py-2 px-3 text-[11px] text-neutral-400 whitespace-nowrap">
                    {new Date(log.event_timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3 text-blue-400 font-medium">{log.module}</td>
                  <td className="py-2 px-3 text-neutral-300">{log.step_name}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.status === 'WARNING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-neutral-400 text-[11px] tabular-nums">
                    {log.duration_ms}ms
                  </td>
                  <td className="py-2 px-3 text-amber-400 text-[11px]">{log.error_catalog_code || '-'}</td>
                  <td className="py-2 px-3 text-neutral-300 font-sans truncate max-w-xs">{log.message}</td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2 py-0.5 text-[11px] font-sans text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Log Payload Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl p-5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-semibold text-white">Event Step Inspector</h3>
                <span className="text-[11px] font-mono text-blue-400">
                  {selectedLog.module} → {selectedLog.step_name} ({selectedLog.duration_ms}ms)
                </span>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-neutral-500 text-[11px] block">Message:</span>
                <div className="text-neutral-200 font-sans mt-0.5">{selectedLog.message}</div>
              </div>

              {selectedLog.error_catalog_code && (
                <div className="p-2.5 bg-amber-950/20 border border-amber-800/40 rounded">
                  <span className="text-amber-400 font-bold">Catalog Code: {selectedLog.error_catalog_code}</span>
                  {(() => {
                    const matchedError = errorCatalog.find((e) => e.error_code === selectedLog.error_catalog_code);
                    return matchedError ? (
                      <div className="text-[11px] text-amber-200 mt-1 font-sans">
                        <div>Remediation: {matchedError.remediation_text}</div>
                        <div>Auto Action: {matchedError.auto_action}</div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              <div>
                <span className="text-neutral-500 text-[11px] block">Input Payload:</span>
                <pre className="p-2.5 bg-neutral-950 border border-neutral-800 rounded text-neutral-300 max-h-36 overflow-y-auto text-[11px]">
                  {JSON.stringify(selectedLog.input_payload || {}, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-neutral-500 text-[11px] block">Output Payload:</span>
                <pre className="p-2.5 bg-neutral-950 border border-neutral-800 rounded text-neutral-300 max-h-36 overflow-y-auto text-[11px]">
                  {JSON.stringify(selectedLog.output_payload || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white"
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
