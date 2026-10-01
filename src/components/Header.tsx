import React, { useState } from 'react';
import { UploadCloud, ShieldCheck, User, LogIn, KeyRound, Palette, Sun, Moon, Check } from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { UserSession, ThemeConfig } from '../types';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string, docId?: string) => void;
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
  const { documents, theme, setTheme } = useInvoiceFlowStore();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const pendingReviews = documents.filter((d) => d.document_status === 'REVIEW_PENDING').length;
  const readyToExport = documents.filter((d) => d.document_status === 'APPROVED').length;

  const quickThemes: Record<string, Partial<ThemeConfig>> = {
    SLATE: {
      theme_key: 'SLATE',
      theme_name: 'Slate (Dark)',
      color_bg: '#0c0e12',
      color_surface: '#141820',
      color_primary: '#3b82f6',
      color_accent: '#f59e0b',
      color_success: '#10b981',
      color_warning: '#f59e0b',
      color_error: '#ef4444',
      radius_sm: '6px',
    },
    LIGHT: {
      theme_key: 'LIGHT',
      theme_name: 'Daylight (Light)',
      color_bg: '#f8fafc',
      color_surface: '#ffffff',
      color_primary: '#2563eb',
      color_accent: '#d97706',
      color_success: '#059669',
      color_warning: '#d97706',
      color_error: '#dc2626',
      radius_sm: '6px',
    },
    SAP_MIDNIGHT: {
      theme_key: 'SAP_MIDNIGHT',
      theme_name: 'SAP Horizon',
      color_bg: '#12171f',
      color_surface: '#1b222d',
      color_primary: '#0ea5e9',
      color_accent: '#38bdf8',
      color_success: '#22c55e',
      color_warning: '#eab308',
      color_error: '#f43f5e',
      radius_sm: '4px',
    },
    EMERALD_FOREST: {
      theme_key: 'EMERALD_FOREST',
      theme_name: 'ITC Green',
      color_bg: '#09130d',
      color_surface: '#112217',
      color_primary: '#10b981',
      color_accent: '#34d399',
      color_success: '#10b981',
      color_warning: '#f59e0b',
      color_error: '#ef4444',
      radius_sm: '6px',
    },
    HIGH_CONTRAST: {
      theme_key: 'HIGH_CONTRAST',
      theme_name: 'High Contrast',
      color_bg: '#000000',
      color_surface: '#111111',
      color_primary: '#60a5fa',
      color_accent: '#fbbf24',
      color_success: '#4ade80',
      color_warning: '#facc15',
      color_error: '#f87171',
      radius_sm: '2px',
    },
  };

  const handleSelectTheme = (key: string) => {
    const updated = { ...theme, ...quickThemes[key] } as ThemeConfig;
    setTheme(updated);
    setIsThemeMenuOpen(false);
  };

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

      {/* Zone 3: Primary Actions, Theme Switcher & User Auth */}
      <div className="flex items-center gap-3">
        {/* Quick Theme Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-700/80 rounded-md transition-colors"
            title="Switch Visual Theme Palette"
          >
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline text-[11px] font-medium">{theme.theme_name?.split(' ')[0] || 'Theme'}</span>
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md bg-neutral-900 border border-neutral-700 shadow-xl z-50 p-1.5 space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                Visual Themes
              </div>
              {Object.keys(quickThemes).map((key) => {
                const item = quickThemes[key];
                const isCurrent = theme.theme_key === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectTheme(key)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors text-left ${
                      isCurrent
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    <span className="truncate">{item.theme_name}</span>
                    {isCurrent && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
              <div className="pt-1 border-t border-neutral-800">
                <button
                  onClick={() => {
                    setIsThemeMenuOpen(false);
                    onSelectTab('theme_studio');
                  }}
                  className="w-full text-left px-2.5 py-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                >
                  Open Theme Studio &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

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
