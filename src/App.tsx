import React, { useState } from 'react';
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
import { CodebaseExplorerTab } from './components/CodebaseExplorerTab';
import { BuildInspectorTab } from './components/BuildInspectorTab';
import { KeystoreWizardTab } from './components/KeystoreWizardTab';
import { VolumeDocsTab } from './components/VolumeDocsTab';
import { AiCustomizerTab } from './components/AiCustomizerTab';
import { ReleaseNotesTab } from './components/ReleaseNotesTab';
import { TerminalPageTab } from './components/TerminalPageTab';
import { StoragePageTab } from './components/StoragePageTab';
import { SlideTerminalDrawer } from './components/SlideTerminalDrawer';
import { QuickPushModal } from './components/QuickPushModal';

import { exportProjectToZip, downloadBlob } from './utils/zipExporter';

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
  const [files, setFiles] = useState<ProjectFile[]>(INITIAL_PROJECT_FILES);
  const [activeTab, setActiveTab] = useState<AppFunctionTab>('coder');
  const [activeFilePath, setActiveFilePath] = useState<string>(INITIAL_PROJECT_FILES[0]?.path || '');
  const [isQuickPushOpen, setIsQuickPushOpen] = useState(false);
  const [isSlideDrawerOpen, setIsSlideDrawerOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const handleSelectFileToView = (file: ProjectFile) => {
    setActiveFilePath(file.path);
    setActiveTab('coder');
  };

  const handleUpdateFileContent = (path: string, newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content: newContent } : f))
    );
  };

  const handleAddFile = (newFile: ProjectFile) => {
    setFiles((prev) => {
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
      const blob = await exportProjectToZip(files, 'Umakraft-TermuxXCoder-main');
      downloadBlob(blob, 'Umakraft-TermuxXCoder-Project.zip');
    } catch (e) {
      console.error(e);
    }
  };

  const nonAppFilesCount = files.filter(
    (f) => f.module !== 'app' && !f.path.startsWith('app/')
  ).length;

  const pageMeta: Record<
    AppFunctionTab,
    { title: string; subtitle: string; badge: string; icon: any; category: string }
  > = {
    coder: {
      title: 'Umakraft AI Coder & Sandbox',
      subtitle: 'Full-screen mobile coder and Gemini AI Copilot for Android modular development',
      badge: 'Main Page',
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
      subtitle: 'Inaccessible internal app storage (APKs, Keystore, build cache) & workspace files',
      badge: 'Protected Vault',
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
      subtitle: 'Gemini-assisted intelligent modification of multi-module code and Gradle scripts',
      badge: 'Gemini',
      icon: Sparkles,
      category: 'Security, AI & Docs'
    }
  };

  const currentMeta = pageMeta[activeTab] || pageMeta.coder;
  const CurrentIcon = currentMeta.icon;

  return (
    <div className="h-[100dvh] h-screen w-full bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans selection:bg-[#1f6feb] selection:text-white overflow-hidden">
      {/* Umakraft Front Page Boot/Loading Screen */}
      {showSplash && (
        <UmakraftSplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* Top Header (Visible on sub-pages; on main Coder page, the Coder's top action bar with the gear icon takes over for maximum screen space) */}
      {activeTab !== 'coder' && (
        <Header
          files={files}
          activeTab={activeTab}
          onOpenQuickPush={() => setIsQuickPushOpen(true)}
          onToggleSlideDrawer={() => setIsSlideDrawerOpen((prev) => !prev)}
          onGoToCoder={() => setActiveTab('coder')}
          isSlideDrawerOpen={isSlideDrawerOpen}
        />
      )}

      {/* Top-Left Sliding Master Functions Drawer (Hidden under Gear Icon) */}
      <SlideTerminalDrawer
        isOpen={isSlideDrawerOpen}
        onClose={() => setIsSlideDrawerOpen(false)}
        files={files}
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId as AppFunctionTab)}
        onOpenQuickPush={() => setIsQuickPushOpen(true)}
      />

      {/* Main Container: Fixed Height on Mobile (h-[100dvh] / h-screen), Zero Outer Scroll */}
      <main className="flex-1 min-h-0 w-full overflow-hidden p-1.5 sm:p-2.5 flex flex-col">
        {activeTab === 'coder' && (
          <UmakraftAiCoder
            files={files}
            activeFilePath={activeFilePath}
            onUpdateFileContent={handleUpdateFileContent}
            onOpenSettings={() => setIsSlideDrawerOpen(true)}
            isAiModalOpen={isAiModalOpen}
            onCloseAiModal={() => setIsAiModalOpen(false)}
            onOpenAiModal={() => setIsAiModalOpen(true)}
          />
        )}
        {activeTab === 'terminal' && (
          <div className="h-full overflow-y-auto">
            <TerminalPageTab files={files} onOpenQuickPush={() => setIsQuickPushOpen(true)} />
          </div>
        )}
        {activeTab === 'storage' && (
          <div className="h-full overflow-y-auto">
            <StoragePageTab
              files={files}
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
              files={files}
              onSelectFunction={(fnId) => setActiveTab(fnId as AppFunctionTab)}
              onOpenQuickPush={() => setIsQuickPushOpen(true)}
              onExportZip={handleExportZip}
            />
          </div>
        )}
        {activeTab === 'workflows' && (
          <div className="h-full overflow-y-auto">
            <WorkflowsTab files={files} onSelectFile={handleSelectFileToView} />
          </div>
        )}
        {activeTab === 'releasenotes' && (
          <div className="h-full overflow-y-auto">
            <ReleaseNotesTab files={files} onSaveFile={handleAddFile} />
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
            <VolumeDocsTab files={files} onSelectFile={handleSelectFileToView} />
          </div>
        )}
        {activeTab === 'ai' && (
          <div className="h-full overflow-y-auto">
            <AiCustomizerTab files={files} onAddFile={handleAddFile} />
          </div>
        )}
      </main>

      {/* Ultra-Modern Floating Dock Navigation (Icon-First) */}
      <nav className="h-14 sm:h-16 flex-shrink-0 z-30 bg-[#161b22]/90 backdrop-blur-xl border-t border-[#30363d] px-3 sm:px-6 flex items-center justify-around shadow-2xl">
        <div className="flex items-center justify-around w-full max-w-md mx-auto">
          {/* Coder Icon Button */}
          <button
            id="btn-nav-coder"
            onClick={() => {
              setActiveTab('coder');
              setIsAiModalOpen(false);
            }}
            title="Sandbox AI Coder (Main Page)"
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

          {/* Workspace Files Directory Tree Icon Button */}
          <button
            id="btn-nav-storage"
            onClick={() => {
              setActiveTab('storage');
              setIsAiModalOpen(false);
            }}
            title="Workspace Files Directory Tree"
            aria-label="Workspace Files"
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
            title="Gemini AI Copilot"
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
        files={files}
      />
    </div>
  );
}


