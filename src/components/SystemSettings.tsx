import React, { useState } from 'react';
import { Settings, Save, Check, Globe, Shield, Database } from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';

export const SystemSettings: React.FC = () => {
  const { settings, setSettings, addLog } = useInvoiceFlowStore();

  const [form, setForm] = useState({ ...settings });

  const handleSave = () => {
    setSettings(form);
    addLog('SYSTEM', 'SETTINGS_UPDATED', 'SUCCESS', 'Global system parameters updated in database');
    alert('System settings updated.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            System Settings &amp; Global Parameters
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Global operational boundaries, financial tolerances, timezone offsets, and straight-through auto-approval thresholds.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Localization & Financial Tolerances */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Localization &amp; Accounting Limits</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-neutral-400 block mb-1">Server Operational Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              >
                <option value="Asia/Kathmandu">Asia/Kathmandu (UTC+05:45 - Nepal Standard Time)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Target ERP System Profile</label>
              <input
                type="text"
                value={form.default_erp}
                onChange={(e) => setForm({ ...form, default_erp: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Rounding &amp; Math Tolerance Delta ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.arithmetic_tolerance}
                onChange={(e) => setForm({ ...form, arithmetic_tolerance: parseFloat(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Allowable penny variance between sum of lines and gross header.
              </span>
            </div>
          </div>
        </div>

        {/* Workflow & Archive Guardrails */}
        <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Workflow &amp; Security Guardrails</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-neutral-400 block mb-1">
                Straight-Through Auto-Approve Threshold (%)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={form.stp_auto_approve_threshold}
                onChange={(e) => setForm({ ...form, stp_auto_approve_threshold: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Documents with AI confidence &gt;= this score bypass manual review if no validation blocks occur.
              </span>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Max Recursive Archive Unpacking Depth</label>
              <input
                type="number"
                value={form.max_archive_depth}
                onChange={(e) => setForm({ ...form, max_archive_depth: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Max Safe Uncompressed Size (MB)</label>
              <input
                type="number"
                value={form.max_archive_mb}
                onChange={(e) => setForm({ ...form, max_archive_mb: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
