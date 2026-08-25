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
  HardDrive
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
import { SlideTerminalDrawer } from './components/SlideTerminalDrawer';
import { QuickPushModal } from './components/QuickPushModal';
import { AndroidPermissionsModal } from './components/AndroidPermissionsModal';
import { Camera, Shield } from 'lucide-react';

import { exportProjectToZip, downloadBlob } from './utils/zipExporter';
import {
  loadSavedSandboxFiles,
  saveSandboxFiles,
  SAMPLE_SANDBOX_DEMO_FILES
} from './utils/sandboxFileManager';

export type AppFunctionTab =
  | 'coder'
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
  
  // Sandbox Files (Purely user-uploaded, imported, or user-created files - isolated from App files)
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
      // If it's an app file, navigate to Storage page where all app files are shown
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
      const filesToExport = sandboxFiles.length > 0 ? sandboxFiles : appFiles;
      const archiveName = sandboxFiles.length > 0 ? 'Umakraft-Sandbox-Project' : 'Umakraft-TermuxXCoder-main';
      const blob = await exportProjectToZip(filesToExport, archiveName);
      downloadBlob(blob, `${archiveName}.zip`);
    } catch (e) {
      console.error(e);
    }
  };

  const pageMeta: Record<
    AppFunctionTab,
    { title: string; subtitle: string; badge: string; icon: any; category: string }
  > = {
    coder: {
      title: 'Umakraft Sandbox & AI Copilot',
      subtitle: 'Isolated Sandbox environment for user uploads, ZIP imports & multi-provider AI copilot',
      badge: 'Sandbox',
      icon: Code2,
      category: 'Primary Workspace'
    },
    terminal: {
      title: 'Terminal & GitHub Push Station',
      subtitle: 'Native PTY shell emulator, git remote sync & direct GitHub push console',
      badge: 'Git Push',
      icon: Terminal,
      category: 'Primary Workspace'
    },
    storage: {
      title: 'Storage & Isolated File Vault',
      subtitle: 'Encrypted internal app storage (All App Files, Keystore, build cache) & sandbox items',
      badge: 'App Files',
      icon: HardDrive,
      category: 'Primary Workspace'
    },
    functions: {
      title: 'Functions & Architecture Registry',
      subtitle: 'List of interactive studio tools and backend server-side services with live testing',
      badge: 'Capabilities',
      icon: Layers,
      category: 'Primary Workspace'
    },
    workflows: {
      title: 'GitHub CI/CD & Build Workflows',
      subtitle: 'Automated GitHub Actions pipelines to build, sign & publish Android APKs',
      badge: '3 Actions',
      icon: Workflow,
      category: 'Build & Release'
    },
    releasenotes: {
      title: 'Auto Release Notes & Checksums',
      subtitle: 'POSIX shell script parsing git commits into categorized release notes with SHA-256',
      badge: 'v1.0 Script',
      icon: FileText,
      category: 'Build & Release'
    },
    diagnostics: {
      title: 'APK Build Inspector & Diagnostics',
      subtitle: 'Pre-flight integrity checklist, AGP 8.3 & Android 10+ API 29–34 compliance',
      badge: 'All Pass',
      icon: FileCheck2,
      category: 'Build & Release'
    },
    keystore: {
      title: 'Signing & Keystore Wizard',
      subtitle: 'PKCS12 keystore generation, v1/v2/v3 APK signing & GitHub secrets guide',
      badge: 'PKCS12',
      icon: KeyRound,
      category: 'Security, AI & Docs'
    },
    docs: {
      title: '10 Volumes Blueprint Specifications',
      subtitle: 'Full architectural and implementation specifications across all 10 modules',
      badge: 'Complete',
      icon: BookOpen,
      category: 'Security, AI & Docs'
    },
    ai: {
      title: 'AI Code & Workflow Customizer',
      subtitle: 'Multi-model copilot options (Qwen 1.5 Local, Groq, OpenAI, Gemini, OpenRouter, OpenCode)',
      badge: 'AI Copilot',
      icon: Sparkles,
      category: 'Security, AI & Docs'
    }
  };

  return (
    <div className="h-[100dvh] h-screen w-full bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans selection:bg-[#1f6feb] selection:text-white overflow-hidden">
      {/* Umakraft Front Page Boot/Loading Screen */}
      {showSplash && (
        <UmakraftSplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* Top Header */}
      {activeTab !== 'coder' && (
        <Header
          files={sandboxFiles.length > 0 ? sandboxFiles : appFiles}
          activeTab={activeTab}
          onOpenQuickPush={() => setIsQuickPushOpen(true)}
          onToggleSlideDrawer={() => setIsSlideDrawerOpen((prev) => !prev)}
          onGoToCoder={() => setActiveTab('coder')}
          onOpenPermissions={() => setIsPermissionsModalOpen(true)}
          isSlideDrawerOpen={isSlideDrawerOpen}
        />
      )}

      {/* Top-Left Sliding Master Functions Drawer */}
      <SlideTerminalDrawer
        isOpen={isSlideDrawerOpen}
        onClose={() => setIsSlideDrawerOpen(false)}
        files={appFiles}
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId as AppFunctionTab)}
        onOpenQuickPush={() => setIsQuickPushOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 min-h-0 w-full overflow-hidden p-1.5 sm:p-2.5 flex flex-col">
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
            onGoToStorage={() => setActiveTab('storage')}
            onOpenSettings={() => setIsSlideDrawerOpen(true)}
            isAiModalOpen={isAiModalOpen}
            onCloseAiModal={() => setIsAiModalOpen(false)}
            onOpenAiModal={() => setIsAiModalOpen(true)}
          />
        )}
        {activeTab === 'terminal' && (
          <div className="h-full overflow-y-auto">
            <TerminalPageTab files={appFiles} onOpenQuickPush={() => setIsQuickPushOpen(true)} />
          </div>
        )}
        {activeTab === 'storage' && (
          <div className="h-full overflow-y-auto">
            <StoragePageTab
              files={appFiles}
              sandboxFiles={sandboxFiles}
              onSelectFile={(f) => {
                handleSelectFileToView(f);
              }}
              onOpenTerminal={() => setActiveTab('terminal')}
            />
          </div>
        )}
        {activeTab === 'functions' && (
          <div className="h-full overflow-y-auto">
            <FunctionsDirectoryTab
              files={appFiles}
              onSelectFunction={(fnId) => setActiveTab(fnId as AppFunctionTab)}
              onOpenQuickPush={() => setIsQuickPushOpen(true)}
              onExportZip={handleExportZip}
            />
          </div>
        )}
        {activeTab === 'workflows' && (
          <div className="h-full overflow-y-auto">
            <WorkflowsTab files={appFiles} onSelectFile={handleSelectFileToView} />
          </div>
        )}
        {activeTab === 'releasenotes' && (
          <div className="h-full overflow-y-auto">
            <ReleaseNotesTab files={appFiles} onSaveFile={handleAddAppFile} />
          </div>
        )}
        {activeTab === 'diagnostics' && (
          <div className="h-full overflow-y-auto">
            <BuildInspectorTab />
          </div>
        )}
        {activeTab === 'keystore' && (
          <div className="h-full overflow-y-auto">
            <KeystoreWizardTab />
          </div>
        )}
        {activeTab === 'docs' && (
          <div className="h-full overflow-y-auto">
            <VolumeDocsTab files={appFiles} onSelectFile={handleSelectFileToView} />
          </div>
        )}
        {activeTab === 'ai' && (
          <div className="h-full overflow-y-auto">
            <AiCustomizerTab files={appFiles} onAddFile={handleAddAppFile} />
          </div>
        )}
      </main>

      {/* Ultra-Modern Floating Dock Navigation */}
      <nav className="h-14 sm:h-16 flex-shrink-0 z-30 bg-[#161b22]/90 backdrop-blur-xl border-t border-[#30363d] px-3 sm:px-6 flex items-center justify-around shadow-2xl">
        <div className="flex items-center justify-around w-full max-w-md mx-auto">
          {/* Coder Icon Button (Sandbox) */}
          <button
            id="btn-nav-coder"
            onClick={() => {
              setActiveTab('coder');
              setIsAiModalOpen(false);
            }}
            title="Sandbox AI Coder (Upload & Import)"
            aria-label="AI Coder"
            className={`relative flex flex-col items-center justify-center h-10 w-12 sm:h-11 sm:w-14 min-h-[44px] min-w-[44px] rounded-2xl transition-all active:scale-95 group ${
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

          {/* Terminal & GitHub Push Icon Button */}
          <button
            id="btn-nav-terminal"
            onClick={() => {
              setActiveTab('terminal');
              setIsAiModalOpen(false);
            }}
            title="Terminal & GitHub Push"
            aria-label="Terminal"
            className={`relative flex flex-col items-center justify-center h-10 w-12 sm:h-11 sm:w-14 min-h-[44px] min-w-[44px] rounded-2xl transition-all active:scale-95 group ${
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

          {/* Storage & All App Files Directory Tree Icon Button */}
          <button
            id="btn-nav-storage"
            onClick={() => {
              setActiveTab('storage');
              setIsAiModalOpen(false);
            }}
            title="App Storage Vault & System Files"
            aria-label="App Storage"
            className={`relative flex flex-col items-center justify-center h-10 w-12 sm:h-11 sm:w-14 min-h-[44px] min-w-[44px] rounded-2xl transition-all active:scale-95 group ${
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

          {/* AI Copilot Icon Button */}
          <button
            id="btn-nav-ai"
            onClick={() => {
              setActiveTab('coder');
              setIsAiModalOpen((prev) => !prev);
            }}
            title="AI Copilot Assistant"
            aria-label="AI Copilot"
            className={`relative flex flex-col items-center justify-center h-10 w-12 sm:h-11 sm:w-14 min-h-[44px] min-w-[44px] rounded-2xl transition-all active:scale-95 group ${
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

          {/* Functions / Settings Gear Icon Button (App Drawer) */}
          <button
            id="btn-nav-functions"
            onClick={() => setIsSlideDrawerOpen(true)}
            title="App Drawer (All Functions & Tools)"
            aria-label="App Drawer"
            className="flex items-center justify-center h-10 w-12 sm:h-11 sm:w-14 min-h-[44px] min-w-[44px] rounded-2xl text-[#58a6ff] hover:text-[#79c0ff] bg-[#21262d]/60 hover:bg-[#21262d] border border-[#30363d] active:scale-95 transition-all group"
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
