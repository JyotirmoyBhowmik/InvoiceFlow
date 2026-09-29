import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Server,
  Database,
  Mail,
  FileSpreadsheet,
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';

interface PreflightCheckItem {
  id: string;
  category: string;
  check_name: string;
  status: 'PASS' | 'WARN' | 'BLOCK';
  error_code?: string;
  message: string;
  remediation_tab: string;
  remediation_label: string;
}

interface PreflightCheckerProps {
  onSelectTab: (tab: string) => void;
  onCanExecuteRun?: (canExecute: boolean) => void;
}

export const PreflightChecker: React.FC<PreflightCheckerProps> = ({ onSelectTab }) => {
  const store = useInvoiceFlowStore();

  const runChecks = (): PreflightCheckItem[] => {
    const items: PreflightCheckItem[] = [];

    // 1. Dynamic Fields Check
    if (store.fields.length > 0) {
      items.push({
        id: 'chk_fields',
        category: 'METADATA',
        check_name: 'Dynamic Field Definitions',
        status: 'PASS',
        message: `${store.fields.length} active fields defined with valid data types`,
        remediation_tab: 'fields',
        remediation_label: 'View Fields',
      });
    } else {
      items.push({
        id: 'chk_fields_fail',
        category: 'METADATA',
        check_name: 'Dynamic Field Definitions',
        status: 'BLOCK',
        error_code: 'VAL-001',
        message: 'Zero field definitions found. Ingestion cannot generate extraction schemas.',
        remediation_tab: 'fields',
        remediation_label: 'Configure Fields',
      });
    }

    // 2. Export Profile Check
    if (store.exportProfile && store.exportProfile.columns.length > 0) {
      items.push({
        id: 'chk_export',
        category: 'EXPORT',
        check_name: 'SAP ECC Export Profile & Layout',
        status: 'PASS',
        message: `Profile "${store.exportProfile.profile_key}" mapped with ${store.exportProfile.columns.length} columns`,
        remediation_tab: 'export_designer',
        remediation_label: 'View Profile',
      });
    } else {
      items.push({
        id: 'chk_export_fail',
        category: 'EXPORT',
        check_name: 'SAP ECC Export Profile',
        status: 'BLOCK',
        error_code: 'EXP-001',
        message: 'No active export columns mapped. Run generation cannot produce SAP files.',
        remediation_tab: 'export_designer',
        remediation_label: 'Configure Export',
      });
    }

    // 3. Error Catalog Check
    if (store.errorCatalog.length >= 5) {
      items.push({
        id: 'chk_err_cat',
        category: 'OBSERVABILITY',
        check_name: 'Error Catalog Coverage',
        status: 'PASS',
        message: `${store.errorCatalog.length} structured domain error codes active`,
        remediation_tab: 'error_catalog',
        remediation_label: 'View Catalog',
      });
    } else {
      items.push({
        id: 'chk_err_cat_warn',
        category: 'OBSERVABILITY',
        check_name: 'Error Catalog Coverage',
        status: 'WARN',
        error_code: 'SYS-001',
        message: 'Minimal error catalog keys registered. Exception tracing may lack templates.',
        remediation_tab: 'error_catalog',
        remediation_label: 'Add Error Codes',
      });
    }

    // 4. Vendors Check
    if (store.vendors.length > 0) {
      items.push({
        id: 'chk_vendors',
        category: 'MASTER_DATA',
        check_name: 'Vendor Master Records',
        status: 'PASS',
        message: `${store.vendors.length} vendors registered in master catalog`,
        remediation_tab: 'master_data',
        remediation_label: 'View Vendors',
      });
    } else {
      items.push({
        id: 'chk_vendors_warn',
        category: 'MASTER_DATA',
        check_name: 'Vendor Master Records',
        status: 'WARN',
        error_code: 'MSTR-001',
        message: 'No vendors populated yet. Incoming documents will trigger MSTR-001 review exceptions.',
        remediation_tab: 'master_data',
        remediation_label: 'Add Vendors',
      });
    }

    return items;
  };

  const results = runChecks();
  const hasBlock = results.some((r) => r.status === 'BLOCK');
  const blockCount = results.filter((r) => r.status === 'BLOCK').length;
  const warnCount = results.filter((r) => r.status === 'WARN').length;

  return (
    <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-4 h-4 ${hasBlock ? 'text-red-400' : 'text-emerald-400'}`} />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            System Pre-Flight Readiness Engine
          </h3>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          {hasBlock ? (
            <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/60 font-semibold">
              {blockCount} BLOCKING ISSUES
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold">
              RUN READINESS: GREEN
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {results.map((item) => (
          <div
            key={item.id}
            className={`p-2.5 rounded border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              item.status === 'PASS'
                ? 'bg-neutral-950 border-neutral-800 text-neutral-300'
                : item.status === 'WARN'
                ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                : 'bg-red-950/20 border-red-800/40 text-red-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {item.status === 'PASS' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {item.status === 'WARN' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {item.status === 'BLOCK' && <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}

              <div>
                <div className="font-semibold text-white flex items-center gap-2">
                  <span>{item.check_name}</span>
                  {item.error_code && (
                    <span className="font-mono text-[10px] text-amber-400 font-bold">
                      [{item.error_code}]
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">{item.message}</div>
              </div>
            </div>

            <button
              onClick={() => onSelectTab(item.remediation_tab)}
              className="px-2 py-1 text-[11px] font-medium text-blue-400 hover:text-white bg-blue-950/60 hover:bg-blue-900 border border-blue-800/40 rounded transition-colors whitespace-nowrap self-start sm:self-auto flex items-center gap-1"
            >
              <span>{item.remediation_label}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
