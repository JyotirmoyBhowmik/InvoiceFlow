import React, { useState } from 'react';
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
import { useInvoiceFlowStore } from './store/useInvoiceFlowStore';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const { documents, setDocuments } = useInvoiceFlowStore();

  const handleDocumentIngested = (newDoc: any) => {
    setDocuments([newDoc, ...documents]);
    setCurrentTab('workbench');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Contract (3 zones, wordmark, single-line actions) */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenIngest={() => setIsIngestModalOpen(true)}
      />

      {/* Main Workspace: Sidebar + Viewport */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        <main className="flex-1 overflow-y-auto p-6 bg-neutral-950/40">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentTab === 'dashboard' && (
              <Dashboard
                onSelectTab={setCurrentTab}
                onOpenIngest={() => setIsIngestModalOpen(true)}
              />
            )}

            {currentTab === 'workbench' && <Workbench />}

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

      {/* Ingestion & Pipeline Execution Modal */}
      <IngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onSuccess={handleDocumentIngested}
      />
    </div>
  );
}
