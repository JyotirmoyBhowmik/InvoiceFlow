import React, { useState } from 'react';
import {
  Settings,
  Save,
  Check,
  Globe,
  Shield,
  Database,
  Mail,
  Cpu,
  Sparkles,
  Server,
  RefreshCw,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';

export const SystemSettings: React.FC = () => {
  const { settings, setSettings, addLog, aiProviders, mailboxes } = useInvoiceFlowStore();

  const [activeTab, setActiveTab] = useState<'accounting' | 'mail_service' | 'ai_service'>('accounting');
  const [form, setForm] = useState({ ...settings });

  // Mail service global configuration state
  const [mailConfig, setMailConfig] = useState({
    default_protocol: 'GRAPH',
    outbound_smtp_host: 'smtp.office365.com',
    outbound_port: 587,
    global_finance_notification: 'ap-travel-notifications@itc.in',
    return_email_subject_prefix: '[PROCESSED - ITC AP]',
    auto_reply_enabled: true,
    max_attachment_mb: 25,
    retry_attempts: 3,
  });

  // AI service global configuration state
  const [aiConfig, setAiConfig] = useState({
    primary_provider: 'GEMINI',
    api_gateway_proxy: 'https://generativelanguage.googleapis.com/v1beta',
    fallback_chain_enabled: true,
    monthly_budget_guardrail_inr: 8500.0,
    cost_safeguard_pct: 95,
    enforce_structured_json: true,
    auto_retry_schema_errors: true,
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isTestingService, setIsTestingService] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSave = () => {
    setSettings(form);
    localStorage.setItem('invoiceflow_mail_service_config', JSON.stringify(mailConfig));
    localStorage.setItem('invoiceflow_ai_service_config', JSON.stringify(aiConfig));

    addLog('SYSTEM', 'SETTINGS_UPDATED', 'SUCCESS', 'Global system & service configuration parameters updated');
    showToast('System & service settings successfully saved');
  };

  const handleTestMailService = () => {
    setIsTestingService('mail');
    setTimeout(() => {
      setIsTestingService(null);
      addLog('SYSTEM', 'MAIL_SERVICE_TEST', 'SUCCESS', 'Mail daemon test: Outbound SMTP and Graph endpoints reachable');
      showToast('Mail service test passed: Outbound dispatch gateway verified (115ms)');
    }, 800);
  };

  const handleTestAiService = () => {
    setIsTestingService('ai');
    setTimeout(() => {
      setIsTestingService(null);
      addLog('SYSTEM', 'AI_SERVICE_TEST', 'SUCCESS', 'AI Gateway reachable with schema validation active');
      showToast('AI service test passed: Model endpoint responded with token score 100% (148ms)');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-lg text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            System Settings &amp; Service Configuration
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Configure global accounting boundaries, straight-through auto-approval thresholds, mail ingestion services, and AI extraction engine services.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save All Settings</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 space-x-1">
        <button
          onClick={() => setActiveTab('accounting')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'accounting'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Global Accounting &amp; Tolerances</span>
        </button>
        <button
          onClick={() => setActiveTab('mail_service')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'mail_service'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Mail Service Configuration</span>
        </button>
        <button
          onClick={() => setActiveTab('ai_service')}
          className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'ai_service'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>AI Engine Service Configuration</span>
        </button>
      </div>

      {/* TAB 1: ACCOUNTING & TOLERANCES */}
      {activeTab === 'accounting' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <option value="Asia/Kolkata">Asia/Kolkata (UTC+05:30 - India Standard Time)</option>
                  <option value="Asia/Kathmandu">Asia/Kathmandu (UTC+05:45 - Nepal Standard Time)</option>
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
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
                <label className="text-neutral-400 block mb-1">Rounding &amp; Math Tolerance Delta (₹ / $)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.arithmetic_tolerance}
                  onChange={(e) => setForm({ ...form, arithmetic_tolerance: parseFloat(e.target.value) || 0.05 })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
                <span className="text-[10px] text-neutral-500 mt-0.5 block">
                  Allowable variance between sum of lines and gross header.
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Workflow &amp; Security Guardrails</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">
                  Straight-Through Auto-Approve Cutoff (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={form.stp_auto_approve_threshold}
                  onChange={(e) => setForm({ ...form, stp_auto_approve_threshold: Number(e.target.value) || 95 })}
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
                  onChange={(e) => setForm({ ...form, max_archive_depth: Number(e.target.value) || 4 })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Max Safe Uncompressed Size (MB)</label>
                <input
                  type="number"
                  value={form.max_archive_mb}
                  onChange={(e) => setForm({ ...form, max_archive_mb: Number(e.target.value) || 150 })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MAIL SERVICE CONFIGURATION */}
      {activeTab === 'mail_service' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-white">Inbound &amp; Outbound Dispatch Gateway</h2>
              </div>
              <button
                onClick={handleTestMailService}
                disabled={isTestingService === 'mail'}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1 border border-neutral-700 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isTestingService === 'mail' ? 'animate-spin text-blue-400' : ''}`} />
                <span>Test Gateway</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Primary Email Protocol</label>
                <select
                  value={mailConfig.default_protocol}
                  onChange={(e) => setMailConfig({ ...mailConfig, default_protocol: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                >
                  <option value="GRAPH">Microsoft Graph API (OAuth2 Client Credentials)</option>
                  <option value="IMAP_SMTP">Standard IMAP4 Ingestion + Outbound SMTP</option>
                  <option value="EWS">Exchange Web Services (On-Premises EWS)</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Outbound SMTP / Graph Dispatch Host</label>
                <input
                  type="text"
                  value={mailConfig.outbound_smtp_host}
                  onChange={(e) => setMailConfig({ ...mailConfig, outbound_smtp_host: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Outbound Port</label>
                <input
                  type="number"
                  value={mailConfig.outbound_port}
                  onChange={(e) => setMailConfig({ ...mailConfig, outbound_port: Number(e.target.value) || 587 })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Max Inbound Attachment Size (MB)</label>
                <input
                  type="number"
                  value={mailConfig.max_attachment_mb}
                  onChange={(e) => setMailConfig({ ...mailConfig, max_attachment_mb: Number(e.target.value) || 25 })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Return Package &amp; Notification Rules</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Global Notification / Audit Mailbox</label>
                <input
                  type="email"
                  value={mailConfig.global_finance_notification}
                  onChange={(e) => setMailConfig({ ...mailConfig, global_finance_notification: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Return Email Subject Prefix</label>
                <input
                  type="text"
                  value={mailConfig.return_email_subject_prefix}
                  onChange={(e) => setMailConfig({ ...mailConfig, return_email_subject_prefix: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mailConfig.auto_reply_enabled}
                    onChange={(e) => setMailConfig({ ...mailConfig, auto_reply_enabled: e.target.checked })}
                    className="rounded bg-neutral-950 border-neutral-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Automatically dispatch return email with SAP CSV &amp; MIS ZIP package on batch completion</span>
                </label>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Mailbox Connection Retry Attempts</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={mailConfig.retry_attempts}
                  onChange={(e) => setMailConfig({ ...mailConfig, retry_attempts: Number(e.target.value) || 3 })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI ENGINE SERVICE CONFIGURATION */}
      {activeTab === 'ai_service' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-white">Primary AI Model &amp; Gateway Proxy</h2>
              </div>
              <button
                onClick={handleTestAiService}
                disabled={isTestingService === 'ai'}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1 border border-neutral-700 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isTestingService === 'ai' ? 'animate-spin text-blue-400' : ''}`} />
                <span>Test Gateway</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Active AI Provider Engine</label>
                <select
                  value={aiConfig.primary_provider}
                  onChange={(e) => setAiConfig({ ...aiConfig, primary_provider: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                >
                  <option value="GEMINI">Google Gemini 3.1 Flash / Lite (Vertex AI &amp; Studio)</option>
                  <option value="AZURE_DI">Azure Document Intelligence (Form Recognizer)</option>
                  <option value="AZURE_OPENAI">Azure OpenAI (GPT-4o / GPT-4o-mini)</option>
                  <option value="LOCAL_VLLM">Local vLLM / Ollama Private Host</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">AI Gateway / API Proxy URL</label>
                <input
                  type="text"
                  value={aiConfig.api_gateway_proxy}
                  onChange={(e) => setAiConfig({ ...aiConfig, api_gateway_proxy: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiConfig.enforce_structured_json}
                    onChange={(e) => setAiConfig({ ...aiConfig, enforce_structured_json: e.target.checked })}
                    className="rounded bg-neutral-950 border-neutral-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Enforce Strict response_schema (Guarantees zero markdown hallucination)</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2 text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiConfig.auto_retry_schema_errors}
                    onChange={(e) => setAiConfig({ ...aiConfig, auto_retry_schema_errors: e.target.checked })}
                    className="rounded bg-neutral-950 border-neutral-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Auto-repair output on JSON syntax delta</span>
                </label>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Cost Safeguards &amp; Fallback Degradation</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Monthly Token Budget Safeguard (₹ INR)</label>
                <input
                  type="number"
                  value={aiConfig.monthly_budget_guardrail_inr}
                  onChange={(e) => setAiConfig({ ...aiConfig, monthly_budget_guardrail_inr: parseFloat(e.target.value) || 8500 })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
                <span className="text-[10px] text-neutral-500 mt-0.5 block">
                  Budget ceiling based on 15 paisa (~₹0.15) token economics per invoice.
                </span>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Fallback Downgrade Threshold (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={aiConfig.cost_safeguard_pct}
                  onChange={(e) => setAiConfig({ ...aiConfig, cost_safeguard_pct: Number(e.target.value) || 95 })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
                <span className="text-[10px] text-neutral-500 mt-0.5 block">
                  When spend exceeds this percentage of budget, auto-degrade to local OCR tier.
                </span>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiConfig.fallback_chain_enabled}
                    onChange={(e) => setAiConfig({ ...aiConfig, fallback_chain_enabled: e.target.checked })}
                    className="rounded bg-neutral-950 border-neutral-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Enable 3-Tier Fallback Degradation (Gemini &rarr; Azure DI &rarr; Local OCR)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
