import React, { useState, useEffect } from 'react';
import {
  Workflow,
  FolderTree,
  FileCheck2,
  KeyRound,
  BookOpen,
  Sparkles,
  Github,
  Download,
  Terminal,
  Layers,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  PanelLeft,
  FileText,
  Menu,
  ChevronRight,
  Zap,
  ArrowRight,
  Sliders,
  Settings,
  Code2,
  Bot,
  HardDrive,
  Camera,
  Shield
} from 'lucide-react';
import { INITIAL_PROJECT_FILES } from './data/projectFiles';
import { ProjectFile } from './types';
import { Header } from './components/Header';
import { UmakraftSplashScreen } from './components/UmakraftSplashScreen';
import { UmakraftAiCoder } from './components/UmakraftAiCoder';
import { FunctionsDirectoryTab } from './components/FunctionsDirectoryTab';
import { WorkflowsTab } from './components/WorkflowsTab';
import { BuildInspectorTab } from './components/BuildInspectorTab';
import { KeystoreWizardTab } from './components/KeystoreWizardTab';
import { VolumeDocsTab } from './components/VolumeDocsTab';
import { AiCustomizerTab } from './components/AiCustomizerTab';
import { ReleaseNotesTab } from './components/ReleaseNotesTab';
import { TerminalPageTab } from './components/TerminalPageTab';
import { StoragePageTab } from './components/StoragePageTab';
import { LayoutDesignerTab } from './components/LayoutDesignerTab';
import { SlideTerminalDrawer } from './components/SlideTerminalDrawer';
import { QuickPushModal } from './components/QuickPushModal';
import { AndroidPermissionsModal } from './components/AndroidPermissionsModal';

import { exportProjectToZip, downloadBlob } from './utils/zipExporter';
import {
  loadSavedSandboxFiles,
  saveSandboxFiles,
  SAMPLE_SANDBOX_DEMO_FILES
} from './utils/sandboxFileManager';

export type AppFunctionTab =
  | 'coder'
  | 'layout'
  | 'terminal'
  | 'storage'
  | 'functions'
  | 'workflows'
  | 'releasenotes'
  | 'diagnostics'
  | 'keystore'
  | 'docs'
  | 'ai';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  // App System Files (Protected internal architecture, workflows, modules)
  const [appFiles, setAppFiles] = useState<ProjectFile[]>(INITIAL_PROJECT_FILES);
  
  // Sandbox Files (User workspace files)
  const [sandboxFiles, setSandboxFiles] = useState<ProjectFile[]>(() => loadSavedSandboxFiles());
  
  const [activeTab, setActiveTab] = useState<AppFunctionTab>('coder');
  const [activeSandboxFilePath, setActiveSandboxFilePath] = useState<string>('');
  const [isQuickPushOpen, setIsQuickPushOpen] = useState(false);
  const [isSlideDrawerOpen, setIsSlideDrawerOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Sync sandbox files with localStorage
  useEffect(() => {
    saveSandboxFiles(sandboxFiles);
  }, [sandboxFiles]);

  const handleSelectFileToView = (file: ProjectFile) => {
    if (file.isSandbox || file.storageScope === 'sandbox_user') {
      setActiveSandboxFilePath(file.path);
      setActiveTab('coder');
    } else {
      setActiveTab('storage');
    }
  };

  const handleUpdateSandboxContent = (path: string, newContent: string) => {
    setSandboxFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content: newContent } : f))
    );
  };

  const handleAddSandboxFile = (newFile: ProjectFile) => {
    setSandboxFiles((prev) => {
      const filtered = prev.filter((f) => f.path !== newFile.path);
      return [newFile, ...filtered];
    });
    setActiveSandboxFilePath(newFile.path);
  };

  const handleAddMultipleSandboxFiles = (newFiles: ProjectFile[]) => {
    setSandboxFiles((prev) => {
      const newPaths = new Set(newFiles.map((f) => f.path));
      const existing = prev.filter((f) => !newPaths.has(f.path));
      return [...newFiles, ...existing];
    });
    if (newFiles.length > 0) {
      setActiveSandboxFilePath(newFiles[0].path);
    }
  };

  const handleDeleteSandboxFile = (path: string) => {
    setSandboxFiles((prev) => prev.filter((f) => f.path !== path));
  };

  const handleClearSandbox = () => {
    setSandboxFiles([]);
    setActiveSandboxFilePath('');
  };

  const handleLoadSampleSandbox = () => {
    handleAddMultipleSandboxFiles(SAMPLE_SANDBOX_DEMO_FILES);
  };

  const handleAddAppFile = (newFile: ProjectFile) => {
    setAppFiles((prev) => {
      const existing = prev.findIndex((f) => f.path === newFile.path);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = newFile;
        return copy;
      }
      return [newFile, ...prev];
    });
  };

  const handleExportZip = async () => {
    try {
      const combined = [...appFiles, ...sandboxFiles];
      const blob = await exportProjectToZip(combined);
      downloadBlob(blob, 'umakraft-v1.0-complete.zip');
    } catch (e) {
      console.error(e);
    }
  };

  if (showSplash) {
    return <UmakraftSplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d1117] text-[#c9d1d9] font-sans antialiased select-none">
      {/* Top Header */}
      <Header
        files={appFiles}
        activeTab={activeTab}
        onOpenQuickPush={() => setIsQuickPushOpen(true)}
        onOpenPermissions={() => setIsPermissionsModalOpen(true)}
        onToggleSlideDrawer={() => setIsSlideDrawerOpen(!isSlideDrawerOpen)}
        isSlideDrawerOpen={isSlideDrawerOpen}
        onGoToCoder={() => setActiveTab('coder')}
      />

      {/* Main Workspace Stage */}
      <main className="flex-1 min-h-0 overflow-hidden relative p-1.5 sm:p-2.5">
        {/* 1. AI Coder & Full-screen IDE */}
        {activeTab === 'coder' && (
          <UmakraftAiCoder
            files={sandboxFiles}
            appFiles={appFiles}
            activeFilePath={activeSandboxFilePath}
            onUpdateFileContent={handleUpdateSandboxContent}
            onAddSandboxFile={handleAddSandboxFile}
            onAddMultipleSandboxFiles={handleAddMultipleSandboxFiles}
            onDeleteSandboxFile={handleDeleteSandboxFile}
            onClearSandbox={handleClearSandbox}
            onLoadSampleSandbox={handleLoadSampleSandbox}
            onOpenSettings={() => setActiveTab('ai')}
            isAiModalOpen={isAiModalOpen}
            onCloseAiModal={() => setIsAiModalOpen(false)}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onGoToStorage={() => setActiveTab('storage')}
            onSelectFile={handleSelectFileToView}
          />
        )}

        {/* 2. Visual Layout & Compose Designer */}
        {activeTab === 'layout' && (
          <div className="h-full overflow-hidden">
            <LayoutDesignerTab
              files={[...appFiles, ...sandboxFiles]}
              onAddFileToSandbox={handleAddSandboxFile}
              onSelectTab={(tab) => setActiveTab(tab as AppFunctionTab)}
            />
          </div>
        )}

        {/* 3. Virtual Linux Shell & Git Push */}
        {activeTab === 'terminal' && (
          <div className="h-full overflow-y-auto">
            <TerminalPageTab
              files={appFiles}
              onOpenQuickPush={() => setIsQuickPushOpen(true)}
            />
          </div>
        )}

        {/* 3. Storage Directory & Files */}
        {activeTab === 'storage' && (
          <div className="h-full overflow-y-auto">
            <StoragePageTab
              files={appFiles}
              sandboxFiles={sandboxFiles}
              onSelectFile={handleSelectFileToView}
              onOpenTerminal={() => setActiveTab('terminal')}
            />
          </div>
        )}

        {/* 4. Functions & Service Hub */}
        {activeTab === 'functions' && (
          <div className="h-full overflow-y-auto">
            <FunctionsDirectoryTab
              files={appFiles}
              onSelectFunction={(tab) => setActiveTab(tab as AppFunctionTab)}
              onOpenQuickPush={() => setIsQuickPushOpen(true)}
              onExportZip={handleExportZip}
              onOpenWebSearch={() => {
                setActiveTab('coder');
                setIsAiModalOpen(true);
              }}
            />
          </div>
        )}

        {/* 5. GitHub Actions Workflows */}
        {activeTab === 'workflows' && (
          <div className="h-full overflow-y-auto">
            <WorkflowsTab
              files={appFiles}
              onSelectFile={handleSelectFileToView}
            />
          </div>
        )}

        {/* 6. APK Pre-flight Inspector */}
        {activeTab === 'diagnostics' && (
          <div className="h-full overflow-y-auto">
            <BuildInspectorTab />
          </div>
        )}

        {/* 7. Keystore PKCS12 Signing Wizard */}
        {activeTab === 'keystore' && (
          <div className="h-full overflow-y-auto">
            <KeystoreWizardTab />
          </div>
        )}

        {/* 8. AI Model Configurator */}
        {activeTab === 'ai' && (
          <div className="h-full overflow-y-auto">
            <AiCustomizerTab
              files={appFiles}
              onAddFile={handleAddAppFile}
            />
          </div>
        )}

        {/* 9. Specifications Docs */}
        {activeTab === 'docs' && (
          <div className="h-full overflow-y-auto">
            <VolumeDocsTab
              files={appFiles}
              onSelectFile={handleSelectFileToView}
            />
          </div>
        )}

        {/* 10. Release Notes Generator */}
        {activeTab === 'releasenotes' && (
          <div className="h-full overflow-y-auto">
            <ReleaseNotesTab files={appFiles} />
          </div>
        )}
      </main>

      {/* Slide-out App Drawer Modal */}
      <SlideTerminalDrawer
        isOpen={isSlideDrawerOpen}
        onClose={() => setIsSlideDrawerOpen(false)}
        files={appFiles}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsSlideDrawerOpen(false);
        }}
        onOpenQuickPush={() => {
          setIsSlideDrawerOpen(false);
          setIsQuickPushOpen(true);
        }}
      />

      {/* Floating Bottom Navigation Bar */}
      <nav
        id="umakraft-bottom-nav"
        aria-label="Main Navigation"
        className="bg-[#161b22]/95 backdrop-blur-md border-t border-[#30363d] px-3 py-1.5 flex items-center justify-around z-40 select-none shadow-2xl flex-shrink-0"
      >
        <div className="flex items-center justify-between w-full max-w-md mx-auto gap-2">
          {/* Coder */}
          <button
            id="btn-nav-coder"
            onClick={() => {
              setActiveTab('coder');
              setIsAiModalOpen(false);
            }}
            title="Code Editor"
            className={`relative flex items-center justify-center h-10 w-12 sm:h-11 sm:w-14 rounded-2xl transition-all active:scale-95 group ${
              activeTab === 'coder' && !isAiModalOpen
                ? 'text-white bg-gradient-to-b from-[#1f6feb] to-[#1158c7] shadow-lg shadow-[#1f6feb]/35 border border-[#388bfd]/50'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Code2 className="h-5 w-5 transition-transform group-hover:scale-110" />
            {activeTab === 'coder' && !isAiModalOpen && (
              <span className="absolute -bottom-1 h-1 w-3 rounded-full bg-white shadow-sm" />
            )}
          </button>

          {/* Terminal */}
          <button
            id="btn-nav-terminal"
            onClick={() => {
              setActiveTab('terminal');
              setIsAiModalOpen(false);
            }}
            title="Terminal"
            className={`relative flex items-center justify-center h-10 w-12 sm:h-11 sm:w-14 rounded-2xl transition-all active:scale-95 group ${
              activeTab === 'terminal'
                ? 'text-white bg-gradient-to-b from-[#238636] to-[#196c2e] shadow-lg shadow-[#238636]/35 border border-[#3fb950]/50'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Terminal className="h-5 w-5 transition-transform group-hover:scale-110" />
            {activeTab === 'terminal' && (
              <span className="absolute -bottom-1 h-1 w-3 rounded-full bg-white shadow-sm" />
            )}
          </button>

          {/* Storage */}
          <button
            id="btn-nav-storage"
            onClick={() => {
              setActiveTab('storage');
              setIsAiModalOpen(false);
            }}
            title="Storage"
            className={`relative flex items-center justify-center h-10 w-12 sm:h-11 sm:w-14 rounded-2xl transition-all active:scale-95 group ${
              activeTab === 'storage'
                ? 'text-white bg-gradient-to-b from-[#1f6feb] to-[#1158c7] shadow-lg shadow-[#1f6feb]/35 border border-[#388bfd]/50'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <FolderTree className="h-5 w-5 transition-transform group-hover:scale-110" />
            {activeTab === 'storage' && (
              <span className="absolute -bottom-1 h-1 w-3 rounded-full bg-white shadow-sm" />
            )}
          </button>

          {/* Copilot */}
          <button
            id="btn-nav-ai"
            onClick={() => {
              setActiveTab('coder');
              setIsAiModalOpen((prev) => !prev);
            }}
            title="Copilot"
            className={`relative flex items-center justify-center h-10 w-12 sm:h-11 sm:w-14 rounded-2xl transition-all active:scale-95 group ${
              isAiModalOpen
                ? 'text-white bg-gradient-to-b from-[#bc8cff] to-[#8957e5] shadow-lg shadow-[#bc8cff]/35 border border-[#d2a8ff]/50'
                : 'text-[#bc8cff] hover:text-[#d2a8ff] hover:bg-[#21262d]'
            }`}
          >
            <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />
            {isAiModalOpen && (
              <span className="absolute -bottom-1 h-1 w-3 rounded-full bg-white shadow-sm" />
            )}
          </button>

          {/* App Drawer */}
          <button
            id="btn-nav-functions"
            onClick={() => setIsSlideDrawerOpen(true)}
            title="App Drawer"
            className="flex items-center justify-center h-10 w-12 sm:h-11 sm:w-14 rounded-2xl text-[#58a6ff] hover:text-[#79c0ff] bg-[#21262d]/60 hover:bg-[#21262d] border border-[#30363d] active:scale-95 transition-all group"
          >
            <Settings className="h-5 w-5 transition-transform group-hover:rotate-45" />
          </button>
        </div>
      </nav>

      {/* Quick Push Modal Dialog */}
      <QuickPushModal
        isOpen={isQuickPushOpen}
        onClose={() => setIsQuickPushOpen(false)}
        files={appFiles}
      />

      {/* Android Permissions & Camera Vision Explainer Modal */}
      <AndroidPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        onOpenScanner={() => {
          setActiveTab('coder');
          setIsAiModalOpen(true);
        }}
      />
    </div>
  );
}
