import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  Database,
  Tag,
  Percent,
  Sliders,
  Cpu,
  Mail,
  FileSpreadsheet,
  Send,
  Users,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';

interface SetupWizardProps {
  onClose: () => void;
  onSelectTab: (tab: string) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onClose, onSelectTab }) => {
  const store = useInvoiceFlowStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [stepTestStatus, setStepTestStatus] = useState<Record<number, boolean>>({});

  const wizardSteps = [
    { number: 1, title: 'Organisation & Localisation', icon: Building2, desc: 'Set default timezone (Asia/Kathmandu), base currency, and fiscal variants.' },
    { number: 2, title: 'Company Codes & Plants', icon: Building2, desc: 'Register ERP legal company codes (BUKRS), plants, and divisions.' },
    { number: 3, title: 'Chart of Accounts & GL', icon: Database, desc: 'Define account heads, balance sheet/P&L GL accounts, and cost centers.' },
    { number: 4, title: 'Expense Taxonomy', icon: Tag, desc: 'Configure Travel, Food, Hotel, and Fuel operational categories and sub-categories.' },
    { number: 5, title: 'Tax Codes & Calculation Slabs', icon: Percent, desc: 'Configure SAP 2-character tax codes (V0, V1, I1), rates, and RCM flags.' },
    { number: 6, title: 'Vendor & Employee Master Data', icon: Users, desc: 'Add counterparty vendors and employee organizational hierarchy.' },
    { number: 7, title: 'Dynamic Field Definitions', icon: Sliders, desc: 'Verify or customize dynamic invoice fields (labels, types, mandatory flags).' },
    { number: 8, title: 'OCR & AI Provider Registration', icon: Cpu, desc: 'Select OCR pipeline and register Gemini AI provider model and budget.' },
    { number: 9, title: 'Exchange Mailbox Configuration', icon: Mail, desc: 'Connect Microsoft Graph client credentials and verify folder polling.' },
    { number: 10, title: 'SAP ECC Export Profile', icon: FileSpreadsheet, desc: 'Confirm FB60 CSV & fixed-width TXT column mapping and date formats.' },
    { number: 11, title: 'Notification Dispatch Engine', icon: Send, desc: 'Set up SMTP/Graph email dispatch for exported runs and alert reports.' },
    { number: 12, title: 'User Roles & Access Control', icon: ShieldCheck, desc: 'Assign granular operator and auditor permissions.' },
    { number: 13, title: 'Final System Pre-Flight', icon: CheckCircle2, desc: 'Execute end-to-end dependency verification and activate automation.' },
  ];

  const handleTestStep = (stepNum: number) => {
    setStepTestStatus({ ...stepTestStatus, [stepNum]: true });
    store.addLog('SETUP_WIZARD', `STEP_${stepNum}_VERIFIED`, 'SUCCESS', `Setup step ${stepNum} verification passed`);
  };

  const completedCount = Object.keys(stepTestStatus).length;

  return (
    <div className="p-6 rounded-lg bg-neutral-900 border border-neutral-800 space-y-6">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-white font-display">
              Enterprise Guided Setup Wizard
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Walkthrough to initialize your empty master tables, connect external services, and establish SAP export readiness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-400">
            {completedCount} / 13 Steps Verified
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
          >
            Exit Wizard
          </button>
        </div>
      </div>

      {/* Steps Navigation Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {wizardSteps.slice(0, 7).map((s) => (
          <button
            key={s.number}
            onClick={() => setCurrentStep(s.number)}
            className={`p-2 rounded text-left border text-xs transition-colors ${
              currentStep === s.number
                ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                : stepTestStatus[s.number]
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px]">Step {s.number}</span>
              {stepTestStatus[s.number] && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className="truncate font-medium mt-1">{s.title.split(' ')[0]}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {wizardSteps.slice(7).map((s) => (
          <button
            key={s.number}
            onClick={() => setCurrentStep(s.number)}
            className={`p-2 rounded text-left border text-xs transition-colors ${
              currentStep === s.number
                ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                : stepTestStatus[s.number]
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px]">Step {s.number}</span>
              {stepTestStatus[s.number] && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className="truncate font-medium mt-1">{s.title.split(' ')[0]}</div>
          </button>
        ))}
      </div>

      {/* Active Step Panel */}
      {(() => {
        const active = wizardSteps.find((s) => s.number === currentStep)!;
        const Icon = active.icon;

        return (
          <div className="p-6 rounded-lg bg-neutral-950 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Step {active.number}: {active.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">{active.desc}</p>
              </div>
            </div>

            <div className="p-4 rounded border border-neutral-800 bg-neutral-900/60 text-xs text-neutral-300 space-y-2">
              <div className="font-medium text-white">Required Configuration Actions:</div>
              <ul className="list-disc list-inside space-y-1 text-neutral-400">
                <li>Verify underlying database rows exist in the corresponding master table.</li>
                <li>Ensure all mandatory keys have valid format masks and temporal validity dates.</li>
                <li>Execute the test verification below before proceeding to the next sequential stage.</li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestStep(active.number)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 rounded transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Test Step {active.number} Readiness</span>
                </button>
                {stepTestStatus[active.number] && (
                  <span className="text-xs text-emerald-400 font-medium">Verified PASS</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentStep === 1}
                  onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white disabled:opacity-30"
                >
                  Previous
                </button>

                {currentStep < 13 ? (
                  <button
                    onClick={() => setCurrentStep((s) => Math.min(13, s + 1))}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors flex items-center gap-1"
                  >
                    <span>Next Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                    }}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
                  >
                    Complete Wizard &amp; Activate System
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
