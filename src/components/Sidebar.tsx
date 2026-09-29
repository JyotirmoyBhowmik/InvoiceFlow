import React from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  Database,
  Sliders,
  Sparkles,
  Cpu,
  Mail,
  FileSpreadsheet,
  Layers,
  History,
  AlertTriangle,
  Palette,
  Settings,
  Scale,
  Building2,
  Users,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string, docId?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard & Metrics', icon: LayoutDashboard },
        { id: 'workbench', label: 'Review & Correction', icon: FileCheck2 },
        { id: 'runs', label: 'SAP ECC Export Runs', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'METADATA & LOGIC',
      items: [
        { id: 'fields', label: 'Dynamic Field Definitions', icon: Sliders },
        { id: 'rules', label: 'Rule Builder & Simulator', icon: Scale },
        { id: 'master_data', label: 'Master Data Manager', icon: Database },
      ],
    },
    {
      title: 'INTELLIGENCE & INGEST',
      items: [
        { id: 'ai_console', label: 'AI Provider & Prompts', icon: Sparkles },
        { id: 'ocr_pipeline', label: 'Layered OCR Pipeline', icon: Cpu },
        { id: 'mailbox', label: 'Mailbox Profiles (Graph)', icon: Mail },
        { id: 'export_designer', label: 'SAP Profile Designer', icon: Layers },
      ],
    },
    {
      title: 'GOVERNANCE & SYSTEM',
      items: [
        { id: 'logs', label: 'Process & Audit Logs', icon: History },
        { id: 'error_catalog', label: 'Error Catalog Manager', icon: AlertTriangle },
        { id: 'theme_studio', label: 'Custom Theme Studio', icon: Palette },
        { id: 'settings', label: 'System Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-neutral-800 bg-neutral-950 flex flex-col shrink-0 min-h-[calc(100vh-49px)] select-none">
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase px-2 mb-1.5">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-neutral-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-neutral-800 text-[11px] text-neutral-500 font-mono flex items-center justify-between">
        <span>InvoiceFlow v1.0</span>
        <span className="text-emerald-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          Ready
        </span>
      </div>
    </aside>
  );
};
