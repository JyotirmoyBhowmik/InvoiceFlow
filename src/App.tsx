import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Workbench } from './components/Workbench';
import { RunManager } from './components/RunManager';
import { FieldDefinitionManager } from './components/FieldDefinitionManager';
import { RuleBuilder } from './components/RuleBuilder';
import { MasterDataManager } from './components/MasterDataManager';
import { AIConsole } from './components/AIConsole';
import { OcrPipelineDesigner } from './components/OcrPipelineDesigner';
import { MailboxManager } from './components/MailboxManager';
import { ExportProfileDesigner } from './components/ExportProfileDesigner';
import { LogConsole } from './components/LogConsole';
import { ErrorCatalogManager } from './components/ErrorCatalogManager';
import { ThemeStudio } from './components/ThemeStudio';
import { SystemSettings } from './components/SystemSettings';
import { IngestModal } from './components/IngestModal';
import { AuthModal } from './components/AuthModal';
import { useInvoiceFlowStore } from './store/useInvoiceFlowStore';
import { UserSession } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Authenticated user session state (default to an initial superadmin for instant accessibility, or saved in storage)
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('invoiceflow_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    // Default bootstrap administrator session
    return {
      id: 'usr_bootstrap_superadmin',
      username: 'superadmin',
      email: 'admin@enterprise.internal',
      full_name: 'Enterprise Super Administrator',
      role: 'SUPER_ADMIN',
      permissions: [
        'INVOICE_VIEW',
        'INVOICE_EDIT',
        'INVOICE_APPROVE',
        'INVOICE_REJECT',
        'EXPORT_EXECUTE',
        'EXPORT_REVERSE',
        'CONFIG_FIELDS',
        'CONFIG_RULES',
        'CONFIG_MASTER_DATA',
        'CONFIG_SYSTEM',
      ],
      must_change_password: false,
      mfa_enabled: false,
      auth_provider: 'LOCAL',
      session_expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    };
  });

  const { documents, setDocuments, theme } = useInvoiceFlowStore();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('invoiceflow_user_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('invoiceflow_user_session');
    }
  }, [currentUser]);

  const handleDocumentIngested = (newDoc: any) => {
    setDocuments([newDoc, ...documents]);
    setSelectedDocId(newDoc.id);
    setCurrentTab('workbench');
  };

  const handleSelectTab = (tab: string, docId?: string) => {
    setCurrentTab(tab);
    if (docId) {
      setSelectedDocId(docId);
    }
  };

  const handleLoginSuccess = (session: UserSession) => {
    setCurrentUser(session);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-main)',
      }}
    >
      {/* Top Bar Contract (3 zones, wordmark, single-line actions, user auth badge) */}
      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenIngest={() => setIsIngestModalOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace: Sidebar + Viewport */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={handleSelectTab} />

        <main
          className="flex-1 overflow-y-auto p-6"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-bg) 90%, var(--color-surface) 10%)',
          }}
        >

          <div className="max-w-7xl mx-auto space-y-6">
            {currentTab === 'dashboard' && (
              <Dashboard
                onSelectTab={handleSelectTab}
                onOpenIngest={() => setIsIngestModalOpen(true)}
              />
            )}

            {currentTab === 'workbench' && (
              <Workbench
                selectedDocId={selectedDocId}
                onSelectDocId={setSelectedDocId}
                onOpenIngest={() => setIsIngestModalOpen(true)}
              />
            )}

            {currentTab === 'runs' && <RunManager />}

            {currentTab === 'fields' && <FieldDefinitionManager />}

            {currentTab === 'rules' && <RuleBuilder />}

            {currentTab === 'master_data' && <MasterDataManager />}

            {currentTab === 'ai_console' && <AIConsole />}

            {currentTab === 'ocr_pipeline' && <OcrPipelineDesigner />}

            {currentTab === 'mailbox' && <MailboxManager />}

            {currentTab === 'export_designer' && <ExportProfileDesigner />}

            {currentTab === 'logs' && <LogConsole />}

            {currentTab === 'error_catalog' && <ErrorCatalogManager />}

            {currentTab === 'theme_studio' && <ThemeStudio />}

            {currentTab === 'settings' && <SystemSettings />}
          </div>
        </main>
      </div>

      {/* Ingestion & Pipeline Execution Modal (Strict Document-First) */}
      <IngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onSuccess={handleDocumentIngested}
      />

      {/* Identity, Access Matrix & First-Admin Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
    </div>
  );
}
