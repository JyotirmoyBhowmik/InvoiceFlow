import React from 'react';
import { UploadCloud, ShieldCheck, User, LogIn, KeyRound } from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { UserSession } from '../types';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenIngest: () => void;
  currentUser: UserSession | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenIngest,
  currentUser,
  onOpenAuth,
}) => {
  const { documents } = useInvoiceFlowStore();

  const pendingReviews = documents.filter((d) => d.document_status === 'REVIEW_PENDING').length;
  const readyToExport = documents.filter((d) => d.document_status === 'APPROVED').length;

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark in display face */}
      <div className="flex items-center gap-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-white font-display hover:text-blue-400 transition-colors"
        >
          InvoiceFlow
        </a>
        <span className="text-xs text-neutral-500 font-mono">SAP ECC Engine</span>
      </div>

      {/* Zone 2: Clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`hover:text-white transition-colors whitespace-nowrap ${
            currentTab === 'dashboard' ? 'text-blue-400' : ''
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('workbench')}
          className={`hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === 'workbench' ? 'text-blue-400' : ''
          }`}
        >
          <span>Workbench</span>
          {pendingReviews > 0 && (
            <span className="font-mono text-xs px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded">
              {pendingReviews}
            </span>
          )}
        </button>
        <button
          onClick={() => onSelectTab('runs')}
          className={`hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            currentTab === 'runs' ? 'text-blue-400' : ''
          }`}
        >
          <span>SAP Runs</span>
          {readyToExport > 0 && (
            <span className="font-mono text-xs px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded">
              {readyToExport} Ready
            </span>
          )}
        </button>
        <button
          onClick={() => onSelectTab('master_data')}
          className={`hover:text-white transition-colors whitespace-nowrap ${
            currentTab === 'master_data' ? 'text-blue-400' : ''
          }`}
        >
          Master Data
        </button>
        <button
          onClick={() => onSelectTab('fields')}
          className={`hover:text-white transition-colors whitespace-nowrap ${
            currentTab === 'fields' ? 'text-blue-400' : ''
          }`}
        >
          Metadata Fields
        </button>
        <button
          onClick={() => onSelectTab('logs')}
          className={`hover:text-white transition-colors whitespace-nowrap ${
            currentTab === 'logs' ? 'text-blue-400' : ''
          }`}
        >
          Audit Logs
        </button>
      </nav>

      {/* Zone 3: Primary Actions & User Auth */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenIngest}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-md transition-colors shadow-sm whitespace-nowrap"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Source Document</span>
        </button>

        {/* User Identity / Access Matrix Button */}
        <button
          onClick={onOpenAuth}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
            currentUser
              ? 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:border-neutral-500'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
          }`}
          title="First Admin Access & Authentication Matrix"
        >
          {currentUser ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px] font-medium">{currentUser.username}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/40">
                {currentUser.role}
              </span>
            </>
          ) : (
            <>
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium">First Admin Access</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
