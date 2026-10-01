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
  Edit3,
  Trash2,
  X,
  Check,
  Settings2,
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { ProcessingStreamEntity, ProcessingStreamSubcategory } from '../types';

export const ProcessingStreamsManager: React.FC = () => {
  const {
    streams,
    setStreams,
    addStream,
    updateStream,
    deleteStream,
    subcategories,
    setSubcategories,
    documents,
    addLog,
  } = useInvoiceFlowStore();

  const [selectedStreamCode, setSelectedStreamCode] = useState<string>(
    streams.length > 0 ? streams[0].stream_code : 'STREAM_A_ITH_TRAVEL'
  );
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'subcategories' | 'detection' | 'cross_links'>('overview');

  const currentStream = streams.find((s) => s.stream_code === selectedStreamCode) || streams[0];
  const streamSubcats = subcategories.filter((sub) => sub.stream_code === selectedStreamCode);

  // Stream Edit / Add Modal States
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false);
  const [streamModalMode, setStreamModalMode] = useState<'create' | 'edit'>('create');
  const [streamFormData, setStreamFormData] = useState<Partial<ProcessingStreamEntity>>({
    stream_code: '',
    stream_name: '',
    purpose: 'VENDOR_PAYMENT',
    description: '',
    export_profile_key: 'SAP_ECC_FB60_STANDARD',
    scheduler_cron: '0 * * * *',
    auto_approve_threshold: 95,
    reply_to_mode: 'ORIGINAL_SENDER',
    finance_notification_email: 'ap-travel-notifications@itc.in',
    is_active: true,
  });

  // Delete Confirmation Dialog
  const [streamToDelete, setStreamToDelete] = useState<ProcessingStreamEntity | null>(null);

  // Subcategory Edit / Add Modal States
  const [isSubcatModalOpen, setIsSubcatModalOpen] = useState(false);
  const [subcatModalMode, setSubcatModalMode] = useState<'create' | 'edit'>('create');
  const [subcatFormData, setSubcatFormData] = useState<Partial<ProcessingStreamSubcategory>>({
    subcategory_code: '',
    subcategory_name: '',
    stream_code: selectedStreamCode,
    mandatory_field_keys: ['invoice_number', 'invoice_date', 'total_cost'],
    default_expense_gl: '600100',
    default_booking_type: 'GENERAL',
    is_active: true,
  });
  const [subcatToDelete, setSubcatToDelete] = useState<ProcessingStreamSubcategory | null>(null);

  // Notification Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSelectStream = (code: string) => {
    setSelectedStreamCode(code);
  };

  const handleOpenAddStream = () => {
    setStreamModalMode('create');
    setStreamFormData({
      stream_code: `STREAM_${String.fromCharCode(65 + streams.length)}_${Date.now().toString().slice(-4)}`,
      stream_name: 'New Custom Stream',
      purpose: 'VENDOR_PAYMENT',
      description: 'Custom processing stream configuration',
      export_profile_key: 'SAP_ECC_FB60_STANDARD',
      scheduler_cron: '0 * * * *',
      auto_approve_threshold: 95,
      reply_to_mode: 'ORIGINAL_SENDER',
      finance_notification_email: 'finance-desk@enterprise.internal',
      is_active: true,
    });
    setIsStreamModalOpen(true);
  };

  const handleOpenEditStream = (stream: ProcessingStreamEntity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStreamModalMode('edit');
    setStreamFormData({ ...stream });
    setIsStreamModalOpen(true);
  };

  const handleSaveStreamModal = () => {
    if (!streamFormData.stream_code || !streamFormData.stream_name) return;

    if (streamModalMode === 'create') {
      const newStream: ProcessingStreamEntity = {
        id: `stream_${Date.now()}`,
        stream_code: streamFormData.stream_code!,
        stream_name: streamFormData.stream_name!,
        purpose: streamFormData.purpose || 'VENDOR_PAYMENT',
        description: streamFormData.description || '',
        export_profile_key: streamFormData.export_profile_key || 'SAP_ECC_FB60_STANDARD',
        scheduler_cron: streamFormData.scheduler_cron || '0 * * * *',
        auto_approve_threshold: Number(streamFormData.auto_approve_threshold) || 95,
        notification_template_key: 'NOTIF_RETURN_DISPATCH_V1',
        reply_to_mode: streamFormData.reply_to_mode || 'ORIGINAL_SENDER',
        finance_notification_email: streamFormData.finance_notification_email,
        detection_priority: 10,
        detection_rules: { subject_keywords: ['INVOICE', streamFormData.stream_name!] },
        is_active: streamFormData.is_active ?? true,
      };
      addStream(newStream);
      setSelectedStreamCode(newStream.stream_code);
      showToast(`Processing Stream created: ${newStream.stream_name}`);
    } else {
      updateStream(streamFormData as ProcessingStreamEntity);
      showToast(`Processing Stream updated: ${streamFormData.stream_name}`);
    }
    setIsStreamModalOpen(false);
  };

  const handleDeleteStreamConfirm = () => {
    if (!streamToDelete) return;
    deleteStream(streamToDelete.stream_code);
    showToast(`Processing Stream removed: ${streamToDelete.stream_name}`);
    setStreamToDelete(null);
    const remaining = streams.filter((s) => s.stream_code !== streamToDelete.stream_code);
    if (remaining.length > 0) {
      setSelectedStreamCode(remaining[0].stream_code);
    }
  };

  // Subcategory Actions
  const handleOpenAddSubcat = () => {
    setSubcatModalMode('create');
    setSubcatFormData({
      subcategory_code: '',
      subcategory_name: '',
      stream_code: selectedStreamCode,
      mandatory_field_keys: ['invoice_number', 'invoice_date', 'total_cost'],
      default_expense_gl: '600100',
      default_booking_type: 'GENERAL',
      is_active: true,
    });
    setIsSubcatModalOpen(true);
  };

  const handleOpenEditSubcat = (sub: ProcessingStreamSubcategory) => {
    setSubcatModalMode('edit');
    setSubcatFormData({ ...sub });
    setIsSubcatModalOpen(true);
  };

  const handleSaveSubcatModal = () => {
    if (!subcatFormData.subcategory_code || !subcatFormData.subcategory_name) return;

    if (subcatModalMode === 'create') {
      const newSub: ProcessingStreamSubcategory = {
        id: `subcat_${Date.now()}`,
        stream_code: selectedStreamCode,
        subcategory_code: subcatFormData.subcategory_code.toUpperCase(),
        subcategory_name: subcatFormData.subcategory_name,
        mandatory_field_keys: subcatFormData.mandatory_field_keys || [],
        default_expense_gl: subcatFormData.default_expense_gl || '600100',
        default_booking_type: subcatFormData.default_booking_type || 'GENERAL',
        is_active: subcatFormData.is_active ?? true,
      };
      setSubcategories([...subcategories, newSub]);
      addLog('STREAMS', 'SUBCATEGORY_CREATED', 'SUCCESS', `Subcategory added: ${newSub.subcategory_name} (${newSub.subcategory_code})`);
      showToast(`Subcategory created: ${newSub.subcategory_name}`);
    } else {
      setSubcategories(
        subcategories.map((s) => (s.id === subcatFormData.id ? (subcatFormData as ProcessingStreamSubcategory) : s))
      );
      addLog('STREAMS', 'SUBCATEGORY_UPDATED', 'SUCCESS', `Subcategory updated: ${subcatFormData.subcategory_name}`);
      showToast(`Subcategory updated: ${subcatFormData.subcategory_name}`);
    }
    setIsSubcatModalOpen(false);
  };

  const handleDeleteSubcatConfirm = () => {
    if (!subcatToDelete) return;
    setSubcategories(subcategories.filter((s) => s.id !== subcatToDelete.id));
    addLog('STREAMS', 'SUBCATEGORY_DELETED', 'WARNING', `Subcategory deleted: ${subcatToDelete.subcategory_name}`);
    showToast(`Subcategory deleted: ${subcatToDelete.subcategory_name}`);
    setSubcatToDelete(null);
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

      {/* Header Contract */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-neutral-900 border border-neutral-800 rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-white tracking-wide">Processing Streams &amp; Business Scope</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Part A &amp; B Architecture
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Streams are configurable <strong>data</strong>, not hardcoded branches. Configure distinct ingestion channels,
            routing priorities, automated return emails, straight-through thresholds, and cross-stream linking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddStream}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Processing Stream</span>
          </button>
        </div>
      </div>

      {/* Stream Selector Cards with Edit & Delete Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {streams.map((stream) => {
          const isSelected = stream.stream_code === selectedStreamCode;
          const docCount = documents.filter((d) => (d as any).stream_code === stream.stream_code).length;

          return (
            <div
              key={stream.id || stream.stream_code}
              onClick={() => handleSelectStream(stream.stream_code)}
              className={`p-4 rounded-lg border cursor-pointer transition-all relative group ${
                isSelected
                  ? 'bg-blue-950/20 border-blue-500/40 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-md ${isSelected ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                    {stream.stream_code === 'STREAM_A_ITH_TRAVEL' ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <Plane className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{stream.stream_name}</h3>
                    <p className="text-[11px] font-mono text-neutral-400 mt-0.5">{stream.stream_code}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      stream.purpose === 'VENDOR_PAYMENT'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {stream.purpose.replace('_', ' ')}
                  </span>

                  {/* Edit Stream Button */}
                  <button
                    onClick={(e) => handleOpenEditStream(stream, e)}
                    className="p-1 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded transition-colors ml-1"
                    title="Edit Stream Configuration"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Stream Button (if more than 1 stream exists) */}
                  {streams.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStreamToDelete(stream);
                      }}
                      className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                      title="Delete Stream"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-neutral-400 mt-3 line-clamp-2">{stream.description}</p>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 grid grid-cols-3 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-neutral-500 block text-[10px]">Cadence</span>
                  <span className="text-neutral-300">{stream.scheduler_cron}</span>
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
      {currentStream && (
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
              Stream Parameters &amp; Routing
            </button>
            <button
              onClick={() => setActiveSubTab('subcategories')}
              className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
                activeSubTab === 'subcategories'
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Sub-Categories &amp; Mandatory Matrices ({streamSubcats.length})
            </button>
            <button
              onClick={() => setActiveSubTab('detection')}
              className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
                activeSubTab === 'detection'
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Email Ingest &amp; Detection Rules
            </button>
            <button
              onClick={() => setActiveSubTab('cross_links')}
              className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
                activeSubTab === 'cross_links'
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              Cross-Stream Links &amp; Double Claim Check
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditStream(currentStream)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Edit Parameters</span>
                    </button>
                    {streams.length > 1 && (
                      <button
                        onClick={() => setStreamToDelete(currentStream)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Stream</span>
                      </button>
                    )}
                  </div>
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
                    <span className="text-[10px] text-neutral-500 mt-1 block">Cron Expression for Automated Worker</span>
                  </div>

                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-md">
                    <label className="text-[10px] font-mono uppercase text-neutral-500 block">Auto-Approval Threshold</label>
                    <p className="text-xs font-mono text-emerald-400 mt-1 font-semibold">{currentStream.auto_approve_threshold}%</p>
                    <span className="text-[10px] text-neutral-500 mt-1 block">Invoices below cutoff route to human exception review</span>
                  </div>

                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-md">
                    <label className="text-[10px] font-mono uppercase text-neutral-500 block">Reply Routing Mode</label>
                    <p className="text-xs font-mono text-white mt-1">{currentStream.reply_to_mode.replace('_', ' ')}</p>
                    <span className="text-[10px] text-neutral-500 mt-1 block">Keeps response in same thread or routes to desk</span>
                  </div>

                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-md">
                    <label className="text-[10px] font-mono uppercase text-neutral-500 block">Finance Notification Mailbox</label>
                    <p className="text-xs font-mono text-neutral-300 mt-1">{currentStream.finance_notification_email || 'Not configured'}</p>
                    <span className="text-[10px] text-neutral-500 mt-1 block">Receives batch MIS archive package</span>
                  </div>

                  <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-md">
                    <label className="text-[10px] font-mono uppercase text-neutral-500 block">Trip ID Absence Policy</label>
                    <p className="text-xs font-mono text-amber-400 mt-1">WARN &amp; Auto-Link Fallback</p>
                    <span className="text-[10px] text-neutral-500 mt-1 block">Absence permitted; auto-resolved via traveler</span>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'subcategories' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Sub-Categories &amp; Mandatory Field Matrices</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Stream {currentStream.stream_name} supports extensible travel booking sub-categories with tailored validation matrices.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddSubcat}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Sub-Category</span>
                  </button>
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
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                            {sub.subcategory_code}
                          </span>
                          <button
                            onClick={() => handleOpenEditSubcat(sub)}
                            className="p-1 text-neutral-400 hover:text-blue-400 rounded transition-colors"
                            title="Edit Sub-Category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSubcatToDelete(sub)}
                            className="p-1 text-neutral-400 hover:text-red-400 rounded transition-colors"
                            title="Delete Sub-Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                <h3 className="text-sm font-semibold text-white">Stream Detection &amp; Ingestion Order</h3>
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
                          Invoices addressed to dedicated inboxes automatically associate to the mapped stream.
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
                          Detects airline PNR, flight sectors, hotel room nights, or agency booking reference numbers.
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
                    <h3 className="text-sm font-semibold text-white">Cross-Stream Linking &amp; Duplicate Claim Prevention</h3>
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
      )}

      {/* STREAM ADD / EDIT MODAL */}
      {isStreamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {streamModalMode === 'create' ? 'Create New Processing Stream' : `Edit Stream: ${streamFormData.stream_name}`}
                </h3>
              </div>
              <button
                onClick={() => setIsStreamModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Stream Code *</label>
                <input
                  type="text"
                  value={streamFormData.stream_code}
                  disabled={streamModalMode === 'edit'}
                  onChange={(e) => setStreamFormData({ ...streamFormData, stream_code: e.target.value.toUpperCase() })}
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono disabled:opacity-50"
                  placeholder="STREAM_C_DIRECT_VENDOR"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Stream Display Name *</label>
                <input
                  type="text"
                  value={streamFormData.stream_name}
                  onChange={(e) => setStreamFormData({ ...streamFormData, stream_name: e.target.value })}
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                  placeholder="Stream Name"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Purpose Category</label>
                <select
                  value={streamFormData.purpose}
                  onChange={(e) => setStreamFormData({ ...streamFormData, purpose: e.target.value as any })}
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                >
                  <option value="VENDOR_PAYMENT">VENDOR_PAYMENT (Agency / AP Debit)</option>
                  <option value="TAX_CREDIT_CLAIM">TAX_CREDIT_CLAIM (Airline GST/VAT Claim)</option>
                  <option value="GENERAL">GENERAL (Miscellaneous Invoice Posting)</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Auto-Approval Threshold (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="50"
                  max="100"
                  value={streamFormData.auto_approve_threshold}
                  onChange={(e) => setStreamFormData({ ...streamFormData, auto_approve_threshold: parseFloat(e.target.value) || 95 })}
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Export Profile Key</label>
                <input
                  type="text"
                  value={streamFormData.export_profile_key}
                  onChange={(e) => setStreamFormData({ ...streamFormData, export_profile_key: e.target.value })}
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Scheduler Cadence (Cron)</label>
                <input
                  type="text"
                  value={streamFormData.scheduler_cron}
                  onChange={(e) => setStreamFormData({ ...streamFormData, scheduler_cron: e.target.value })}
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                  placeholder="0 * * * *"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Return Email Routing Mode</label>
                <select
                  value={streamFormData.reply_to_mode}
                  onChange={(e) => setStreamFormData({ ...streamFormData, reply_to_mode: e.target.value as any })}
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                >
                  <option value="ORIGINAL_SENDER">ORIGINAL_SENDER</option>
                  <option value="FINANCE_MAILBOX">FINANCE_MAILBOX</option>
                  <option value="BOTH">BOTH (Submitter &amp; Finance)</option>
                  <option value="DISTRIBUTION_LIST">DISTRIBUTION_LIST</option>
                  <option value="REPLY_ALL">REPLY_ALL</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Finance Notification Mailbox</label>
                <input
                  type="email"
                  value={streamFormData.finance_notification_email || ''}
                  onChange={(e) => setStreamFormData({ ...streamFormData, finance_notification_email: e.target.value })}
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                  placeholder="ap-finance@enterprise.internal"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-neutral-400 block mb-1">Description / Business Scope</label>
                <textarea
                  rows={2}
                  value={streamFormData.description}
                  onChange={(e) => setStreamFormData({ ...streamFormData, description: e.target.value })}
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setIsStreamModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStreamModal}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm cursor-pointer"
              >
                {streamModalMode === 'create' ? 'Create Stream' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STREAM DELETE CONFIRMATION DIALOG */}
      {streamToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-700/60 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-white">Delete Processing Stream</h3>
            </div>
            <p className="text-xs text-neutral-300">
              Are you sure you want to delete stream <strong className="text-white">{streamToDelete.stream_name}</strong> (
              <span className="font-mono text-neutral-400">{streamToDelete.stream_code}</span>)?
              This will remove this channel configuration from the system.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setStreamToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStreamConfirm}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBCATEGORY ADD / EDIT MODAL */}
      {isSubcatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {subcatModalMode === 'create' ? 'Add Sub-Category' : `Edit Sub-Category: ${subcatFormData.subcategory_name}`}
              </h3>
              <button
                onClick={() => setIsSubcatModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Subcategory Code *</label>
                <input
                  type="text"
                  value={subcatFormData.subcategory_code}
                  onChange={(e) => setSubcatFormData({ ...subcatFormData, subcategory_code: e.target.value.toUpperCase() })}
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                  placeholder="E.g. HOTEL, AIRLINE, CAB"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  value={subcatFormData.subcategory_name}
                  onChange={(e) => setSubcatFormData({ ...subcatFormData, subcategory_name: e.target.value })}
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                  placeholder="E.g. Hotel Stay & Lodging"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Default Expense GL Account</label>
                <input
                  type="text"
                  value={subcatFormData.default_expense_gl}
                  onChange={(e) => setSubcatFormData({ ...subcatFormData, default_expense_gl: e.target.value })}
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                  placeholder="600100"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Default Booking Type</label>
                <input
                  type="text"
                  value={subcatFormData.default_booking_type}
                  onChange={(e) => setSubcatFormData({ ...subcatFormData, default_booking_type: e.target.value.toUpperCase() })}
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                  placeholder="HOTEL, FLIGHT, CAB"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Mandatory Fields (Comma-separated keys)</label>
                <input
                  type="text"
                  value={subcatFormData.mandatory_field_keys?.join(', ') || ''}
                  onChange={(e) =>
                    setSubcatFormData({
                      ...subcatFormData,
                      mandatory_field_keys: e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-2.5 py-2 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                  placeholder="invoice_number, invoice_date, total_cost, vendor_tax_id"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setIsSubcatModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubcatModal}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm cursor-pointer"
              >
                Save Sub-Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBCATEGORY DELETE CONFIRMATION */}
      {subcatToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-700/60 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Delete Sub-Category</h3>
            </div>
            <p className="text-xs text-neutral-300">
              Are you sure you want to delete sub-category <strong className="text-white">{subcatToDelete.subcategory_name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setSubcatToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubcatConfirm}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
