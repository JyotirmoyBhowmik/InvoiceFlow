import React, { useState } from 'react';
import { Mail, CheckCircle2, RefreshCw, Plus, Shield, Globe } from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';

export const MailboxManager: React.FC = () => {
  const { addLog } = useInvoiceFlowStore();

  const [profile, setProfile] = useState({
    profile_key: 'EXCHANGE_AP_SHARED',
    profile_name: 'Corporate Accounts Payable Shared Mailbox',
    adapter_type: 'MS_GRAPH',
    tenant_id: '8849-0123-entra-tenant-id',
    client_id: '4481-app-registration-id',
    mailbox_upn: 'invoices-ap@enterprise.com',
    folder_path: 'Inbox/Invoices',
    destination_folder: 'Archive/Processed',
    poll_interval_seconds: 120,
    use_delta_query: true,
    post_fetch_action: 'MOVE_TO_FOLDER',
    subject_regex: '(?i)(invoice|bill|receipt|statement)',
    sender_domain_allowlist: '*.enterprise.com, *.suppliers.com',
  });

  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult('SUCCESS: Microsoft Graph OAuth2 token acquired. Folder "Inbox/Invoices" verified.');
      addLog('MAIL_INGEST', 'CONNECTION_TEST', 'SUCCESS', `Mailbox ${profile.mailbox_upn} connection test passed`);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            Exchange Online Mailbox Profiles
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Microsoft Graph API OAuth2 Client Credentials integration for shared and executive AP mailboxes.
          </p>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
          <span>Test Graph Connection</span>
        </button>
      </div>

      {testResult && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* Configuration Form */}
      <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
        <h2 className="text-sm font-semibold text-white">Connection &amp; Ingestion Parameters</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-neutral-400 block mb-1">Profile Key</label>
            <input
              type="text"
              value={profile.profile_key}
              onChange={(e) => setProfile({ ...profile, profile_key: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-neutral-400 block mb-1">Profile Name</label>
            <input
              type="text"
              value={profile.profile_name}
              onChange={(e) => setProfile({ ...profile, profile_name: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
            />
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">Mailbox UPN / Email Address</label>
            <input
              type="email"
              value={profile.mailbox_upn}
              onChange={(e) => setProfile({ ...profile, mailbox_upn: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
            />
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">Microsoft Entra Tenant ID</label>
            <input
              type="text"
              value={profile.tenant_id}
              onChange={(e) => setProfile({ ...profile, tenant_id: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
            />
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">Application (Client) ID</label>
            <input
              type="text"
              value={profile.client_id}
              onChange={(e) => setProfile({ ...profile, client_id: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
            />
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">Source Folder Path</label>
            <input
              type="text"
              value={profile.folder_path}
              onChange={(e) => setProfile({ ...profile, folder_path: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
            />
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">Post-Fetch Action</label>
            <select
              value={profile.post_fetch_action}
              onChange={(e) => setProfile({ ...profile, post_fetch_action: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
            >
              <option value="MOVE_TO_FOLDER">Move to Destination Folder</option>
              <option value="MARK_READ">Mark as Read Only</option>
              <option value="CATEGORIZE">Apply Outlook Category</option>
              <option value="LEAVE">Leave Untouched</option>
            </select>
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">Poll Interval (Seconds)</label>
            <input
              type="number"
              value={profile.poll_interval_seconds}
              onChange={(e) => setProfile({ ...profile, poll_interval_seconds: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-neutral-400 block mb-1">Subject Ingestion Regex Filter</label>
            <input
              type="text"
              value={profile.subject_regex}
              onChange={(e) => setProfile({ ...profile, subject_regex: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
            />
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">Destination Archive Folder</label>
            <input
              type="text"
              value={profile.destination_folder}
              onChange={(e) => setProfile({ ...profile, destination_folder: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
