import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Send,
  Zap,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { PreflightChecker } from './PreflightChecker';
import { SetupWizard } from './SetupWizard';
import { formatINR, formatOriginalCurrency, convertToINR } from '../utils/currency';

interface DashboardProps {
  onSelectTab: (tab: string, docId?: string) => void;
  onOpenIngest: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTab, onOpenIngest }) => {
  const { documents, exportRuns, settings, vendors } = useInvoiceFlowStore();
  const [showWizard, setShowWizard] = useState(false);

  const totalDocs = documents.length;
  const approvedDocs = documents.filter((d) => d.document_status === 'APPROVED' || d.document_status === 'EXPORTED').length;
  const reviewPendingDocs = documents.filter((d) => d.document_status === 'REVIEW_PENDING');
  const stpDocs = documents.filter((d) => d.is_stp_approved).length;

  const stpRate = totalDocs > 0 ? Math.round((stpDocs / totalDocs) * 100) : 0;
  const totalInrVolume = documents.reduce((acc, d) => {
    const inr = d.converted_total_inr || convertToINR(d.total_amount, d.currency_code);
    return acc + (inr || 0);
  }, 0);
  const isMasterDataEmpty = vendors.length === 0;

  return (
    <div className="space-y-6">
      {/* Setup Incomplete / Wizard Banner */}
      {isMasterDataEmpty && !showWizard && (
        <div className="p-3.5 bg-blue-950/40 border border-blue-800/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Fresh Deployment Detected:</span>
              <span className="text-neutral-300 ml-1">
                Master data tables are empty by design. Launch the 13-stage Setup Wizard to configure your organization.
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="px-3 py-1 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Launch Setup Wizard
          </button>
        </div>
      )}

      {showWizard && (
        <SetupWizard onClose={() => setShowWizard(false)} onSelectTab={onSelectTab} />
      )}

      {/* Pre-Flight Health Widget */}
      <PreflightChecker onSelectTab={onSelectTab} />

      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            Operational Overview &amp; SAP ECC Pipeline
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time telemetry across mailbox ingestion, OCR layer, AI extraction, and ERP export gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectTab('workbench')}
            className="px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 rounded-md transition-colors"
          >
            Open Review Workbench
          </button>
          <button
            onClick={onOpenIngest}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-sm"
          >
            Upload Source Document
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (High density, tabular numerals, clean dividers) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Total Invoices Ingested</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono-tabular">
            {totalDocs.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            {approvedDocs} approved · {documents.filter((d) => d.document_status === 'EXPORTED').length} in SAP
          </div>
        </div>

        <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Straight-Through Rate (STP)</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono-tabular">
            {stpRate}%
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            Auto-approved (threshold: {settings.stp_auto_approve_threshold}%)
          </div>
        </div>

        <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Pending Human Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono-tabular">
            {reviewPendingDocs.length}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            Exceptions &amp; confidence threshold breaches
          </div>
        </div>

        <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Total Gross Invoiced</span>
            <span className="font-mono text-xs font-bold text-emerald-400">₹ INR</span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono-tabular">
            {formatINR(totalInrVolume)}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            Base accounting currency · Converted from all foreign invoices
          </div>
        </div>
      </div>

      {/* Operational Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Review Ageing Monitor */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Pending Review Queue &amp; SLA Ageing</h2>
              <p className="text-xs text-neutral-400">Documents held for human validation before SAP export gate.</p>
            </div>
            {reviewPendingDocs.length > 0 && (
              <button
                onClick={() => onSelectTab('workbench')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <span>View all in Workbench</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {reviewPendingDocs.length === 0 ? (
            <div className="py-12 text-center rounded border border-dashed border-neutral-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mx-auto mb-2" />
              <div className="text-sm font-medium text-neutral-300">All Invoices Clear</div>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                Zero items pending review. Ingest documents via mailbox simulation or upload to process batches.
              </p>
              <button
                onClick={onOpenIngest}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
              >
                Ingest First Document
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-500">
                    <th className="pb-2 font-medium">Document No</th>
                    <th className="pb-2 font-medium">Vendor</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2 font-medium">Flag Reason</th>
                    <th className="pb-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                  {reviewPendingDocs.slice(0, 5).map((doc) => (
                    <tr key={doc.id} className="hover:bg-neutral-800/30">
                      <td className="py-2.5 font-mono text-neutral-200">{doc.document_number}</td>
                      <td className="py-2.5">{doc.vendor_name || 'Unresolved Vendor'}</td>
                      <td className="py-2.5 font-mono text-neutral-400">{doc.expense_category || 'MISC'}</td>
                      <td className="py-2.5 font-mono-tabular text-right">
                        <div className="text-white font-medium">
                          {doc.currency_code === 'INR'
                            ? formatINR(doc.total_amount)
                            : formatOriginalCurrency(doc.total_amount, doc.currency_code)}
                        </div>
                        {doc.currency_code !== 'INR' && (
                          <div className="text-[10px] text-emerald-400 font-mono">
                            ≈ {formatINR(doc.converted_total_inr || convertToINR(doc.total_amount, doc.currency_code))}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 text-amber-400/90 truncate max-w-[180px]">
                        {doc.review_reason || 'Confidence below threshold'}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onSelectTab('workbench', doc.id)}
                          className="px-2 py-1 text-[11px] font-medium text-blue-400 hover:text-white bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/50 rounded transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SAP ECC Batch Export Run Summary */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">SAP ECC Export Runs</h2>
            <button
              onClick={() => onSelectTab('runs')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              View Runs
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded bg-neutral-950 border border-neutral-800/80">
              <div className="text-[11px] text-neutral-400 uppercase font-medium">Export Ready Queue</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono-tabular text-white">{approvedDocs}</span>
                <span className="text-xs text-emerald-400">Validated for SAP</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Ready to be compiled into standard SAP ECC FB60 layout CSV/TXT batch.
              </p>
              <button
                onClick={() => onSelectTab('runs')}
                disabled={approvedDocs === 0}
                className="mt-3 w-full py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Execute SAP Export Run</span>
              </button>
            </div>

            <div className="pt-2 text-xs space-y-2 border-t border-neutral-800/80">
              <div className="flex justify-between text-neutral-400">
                <span>Completed Runs</span>
                <span className="font-mono text-white">{exportRuns.length}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Target ERP Interface</span>
                <span className="font-mono text-white">{settings.default_erp}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Default Date Format</span>
                <span className="font-mono text-white">DD.MM.YYYY (SAP)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
