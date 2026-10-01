import React, { useState } from 'react';
import {
  GitBranch,
  Plane,
  Building2,
  Train,
  Car,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Mail,
  ShieldCheck,
  Plus,
  Sliders,
  Link as LinkIcon,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { ProcessingStreamEntity, ProcessingStreamSubcategory } from '../types';

export const ProcessingStreamsManager: React.FC = () => {
  const { streams, setStreams, subcategories, setSubcategories, documents, addLog } = useInvoiceFlowStore();

  const [selectedStreamCode, setSelectedStreamCode] = useState<string>('STREAM_A_ITH_TRAVEL');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'subcategories' | 'detection' | 'cross_links'>('overview');

  const currentStream = streams.find((s) => s.stream_code === selectedStreamCode) || streams[0];
  const streamSubcats = subcategories.filter((sub) => sub.stream_code === selectedStreamCode);

  const [isEditingStream, setIsEditingStream] = useState(false);
  const [streamForm, setStreamForm] = useState<ProcessingStreamEntity>(currentStream);

  const handleSelectStream = (code: string) => {
    setSelectedStreamCode(code);
    const target = streams.find((s) => s.stream_code === code);
    if (target) setStreamForm(target);
  };

  const handleSaveStream = () => {
    setStreams((prev) => prev.map((s) => (s.stream_code === streamForm.stream_code ? streamForm : s)));
    setIsEditingStream(false);
    addLog(
      'STREAMS',
      'STREAM_CONFIG_SAVED',
      'SUCCESS',
      `Processing stream updated: ${streamForm.stream_name} (Threshold: ${streamForm.auto_approve_threshold}%)`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Contract */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-neutral-900 border border-neutral-800 rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-white tracking-wide">Processing Streams & Business Scope</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Part A & B Architecture
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Streams are configurable <strong>data</strong>, not code branches. Manages distinct business channels:
            Stream A (Travel-Agency / ITH for vendor payment) and Stream B (Airline tax invoices for VAT/GST input tax credit claims).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Automated Detection Active
          </span>
        </div>
      </div>

      {/* Stream Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {streams.map((stream) => {
          const isSelected = stream.stream_code === selectedStreamCode;
          const docCount = documents.filter((d) => (d as any).stream_code === stream.stream_code).length;

          return (
            <div
              key={stream.id}
              onClick={() => handleSelectStream(stream.stream_code)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-950/20 border-blue-500/40 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-md ${isSelected ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                    {stream.stream_code === 'STREAM_A_ITH_TRAVEL' ? <Building2 className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{stream.stream_name}</h3>
                    <p className="text-[11px] font-mono text-neutral-400 mt-0.5">{stream.stream_code}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                  stream.purpose === 'VENDOR_PAYMENT'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {stream.purpose.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-neutral-400 mt-3 line-clamp-2">{stream.description}</p>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 grid grid-cols-3 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-neutral-500 block text-[10px]">Cadence</span>
                  <span className="text-neutral-300">Hourly (:00)</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">STP Cutoff</span>
                  <span className="text-emerald-400">{stream.auto_approve_threshold}%</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Documents</span>
                  <span className="text-white font-semibold">{docCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stream Tabs & Configuration */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 border-b border-neutral-800 bg-neutral-950/60 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeSubTab === 'overview'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Stream Parameters & Routing
          </button>
          <button
            onClick={() => setActiveSubTab('subcategories')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeSubTab === 'subcategories'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Sub-Categories & Mandatory Matrices ({streamSubcats.length})
          </button>
          <button
            onClick={() => setActiveSubTab('detection')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeSubTab === 'detection'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Email Ingest & Detection Rules
          </button>
          <button
            onClick={() => setActiveSubTab('cross_links')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeSubTab === 'cross_links'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Cross-Stream Links & Double Claim Check
          </button>
        </div>

        <div className="p-5">
          {activeSubTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Stream Configuration: {currentStream.stream_name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Parameters controlling SLA, return emails, and auto-approval thresholds.</p>
                </div>
                {!isEditingStream ? (
                  <button
                    onClick={() => setIsEditingStream(true)}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-white"
                  >
                    Edit Parameters
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingStream(false)}
                      className="px-3 py-1.5 rounded text-xs font-medium bg-neutral-800 text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveStream}
                      className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      Save Configuration
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-md">
                  <label className="text-[10px] font-mono uppercase text-neutral-500 block">Export Profile Key</label>
                  <p className="text-xs font-mono text-white mt-1">{currentStream.export_profile_key}</p>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Generates SAP ECC FB60 batch posting file</span>
                </div>

                <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-md">
                  <label className="text-[10px] font-mono uppercase text-neutral-500 block">Scheduler Cadence</label>
                  <p className="text-xs font-mono text-white mt-1">{currentStream.scheduler_cron}</p>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Hourly run: Ingest :30 &rarr; Process :00 &rarr; Return :15</span>
                </div>

                <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-md">
                  <label className="text-[10px] font-mono uppercase text-neutral-500 block">Auto-Approval Threshold</label>
                  {isEditingStream ? (
                    <input
                      type="number"
                      step="0.5"
                      min="70"
                      max="100"
                      value={streamForm.auto_approve_threshold}
                      onChange={(e) => setStreamForm({ ...streamForm, auto_approve_threshold: parseFloat(e.target.value) || 95 })}
                      className="w-full mt-1 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-white"
                    />
                  ) : (
                    <p className="text-xs font-mono text-emerald-400 mt-1 font-semibold">{currentStream.auto_approve_threshold}%</p>
                  )}
                  <span className="text-[10px] text-neutral-500 mt-1 block">Invoices below cutoff route to human exception review</span>
                </div>

                <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-md">
                  <label className="text-[10px] font-mono uppercase text-neutral-500 block">Reply Routing Mode</label>
                  <p className="text-xs font-mono text-white mt-1">{currentStream.reply_to_mode.replace('_', ' ')}</p>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Keeps response in same Microsoft Graph thread</span>
                </div>

                <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-md">
                  <label className="text-[10px] font-mono uppercase text-neutral-500 block">Finance Notification Mailbox</label>
                  <p className="text-xs font-mono text-neutral-300 mt-1">{currentStream.finance_notification_email || 'Not configured'}</p>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Receives batch MIS archive package</span>
                </div>

                <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-md">
                  <label className="text-[10px] font-mono uppercase text-neutral-500 block">Trip ID Absence Policy</label>
                  <p className="text-xs font-mono text-amber-400 mt-1">WARN & Auto-Link Fallback</p>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Absence is permitted; resolved via employee + dates</span>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'subcategories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Sub-Categories & Mandatory Field Matrices</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Stream A supports extensible travel booking sub-categories, each with customized mandatory field rules.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {streamSubcats.map((sub) => (
                  <div key={sub.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sub.subcategory_code === 'HOTEL' && <Building2 className="w-4 h-4 text-amber-400" />}
                        {sub.subcategory_code === 'AIRLINE' && <Plane className="w-4 h-4 text-blue-400" />}
                        {sub.subcategory_code === 'TRAIN' && <Train className="w-4 h-4 text-emerald-400" />}
                        {sub.subcategory_code === 'CAB' && <Car className="w-4 h-4 text-purple-400" />}
                        <h4 className="text-xs font-semibold text-white">{sub.subcategory_name}</h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                        {sub.subcategory_code}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block">Mandatory Fields Matrix</span>
                      <div className="flex flex-wrap gap-1">
                        {sub.mandatory_field_keys.map((k) => (
                          <span key={k} className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>Default Expense GL: <strong className="text-white">{sub.default_expense_gl || '600100'}</strong></span>
                      <span>Booking Type: <strong className="text-white">{sub.default_booking_type || 'GENERAL'}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'detection' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Stream Detection & Ingestion Order</h3>
              <p className="text-xs text-neutral-400">
                Incoming invoices sent to dedicated mailboxes are classified automatically via configurable rules:
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-mono text-xs font-bold">1</span>
                    <div>
                      <span className="text-xs font-semibold text-white">Receiving Mailbox Address / Folder</span>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Invoices addressed to <code className="text-blue-400 font-mono">travel.invoices@snpl.com.np</code> route to Stream A.
                        Invoices to <code className="text-blue-400 font-mono">airline.gst@snpl.com.np</code> route to Stream B.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">Priority 10 (Highest)</span>
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-mono text-xs font-bold">2</span>
                    <div>
                      <span className="text-xs font-semibold text-white">Email Subject Pattern Match</span>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Matches keywords: "ITH", "Duty Slip", "Hotel Itinerary", "Air Passenger Ticket", "GST Credit".
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">Priority 20</span>
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-mono text-xs font-bold">3</span>
                    <div>
                      <span className="text-xs font-semibold text-white">Multimodal AI Document Classification</span>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Detects airline PNR, flight sectors, hotel room nights, or ITH agency booking reference numbers.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">Priority 30 (Fallback)</span>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'cross_links' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Cross-Stream Linking & Duplicate Claim Prevention</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Guarantees that an airline flight booked and paid via Stream A (ITH Travel) can be safely linked with
                    Stream B (Airline GST/VAT Credit Claim) without double-booking the expense in SAP.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-950/20 border border-blue-500/20 rounded-lg text-xs space-y-2 text-neutral-300">
                <div className="flex items-center gap-2 font-semibold text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                  Dual Stream Accounting Rules
                </div>
                <p>
                  When a flight ticket is paid via travel desk (Stream A) and the airline issues a GST credit bill (Stream B):
                </p>
                <ul className="list-disc list-inside space-y-1 text-neutral-400 ml-1">
                  <li><strong>Stream A:</strong> Posts vendor payment credit to ITH and debits travel expense account (e.g. 600300).</li>
                  <li><strong>Stream B:</strong> Debits input tax credit account (ITC Asset) and credits expense to offset without duplicate cost center impact.</li>
                  <li><strong>Duplicate Prevention:</strong> If a ticket matches within the same stream, it raises <code className="text-red-400 font-mono">VAL_DUPLICATE_INVOICE</code>. Across streams, it flags <code className="text-blue-400 font-mono">VAL_STREAM_DOUBLE_CLAIM</code> (informational link).</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
