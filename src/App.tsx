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
  CheckCircle2
} from 'lucide-react';
import { INITIAL_PROJECT_FILES } from './data/projectFiles';
import { ProjectFile } from './types';
import { Header } from './components/Header';
import { WorkflowsTab } from './components/WorkflowsTab';
import { CodebaseExplorerTab } from './components/CodebaseExplorerTab';
import { BuildInspectorTab } from './components/BuildInspectorTab';
import { KeystoreWizardTab } from './components/KeystoreWizardTab';
import { VolumeDocsTab } from './components/VolumeDocsTab';
import { AiCustomizerTab } from './components/AiCustomizerTab';
import { QuickPushModal } from './components/QuickPushModal';

export default function App() {
  const [files, setFiles] = useState<ProjectFile[]>(INITIAL_PROJECT_FILES);
  const [activeTab, setActiveTab] = useState<
    'workflows' | 'codebase' | 'diagnostics' | 'keystore' | 'docs' | 'ai'
  >('workflows');
  const [isQuickPushOpen, setIsQuickPushOpen] = useState(false);

  const handleSelectFileToView = (file: ProjectFile) => {
    setActiveTab('codebase');
  };

  const handleUpdateFileContent = (path: string, newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.path === path ? { ...f, content: newContent } : f))
    );
  };

  const handleAddFile = (newFile: ProjectFile) => {
    setFiles((prev) => [newFile, ...prev]);
  };

  const tabs = [
    {
      id: 'workflows',
      label: 'GitHub CI/CD & Workflows',
      icon: Workflow,
      badge: '3 Workflows'
    },
    {
      id: 'codebase',
      label: '10-Module Codebase',
      icon: FolderTree,
      badge: `${files.length} Files`
    },
    {
      id: 'diagnostics',
      label: 'APK Build Inspector',
      icon: FileCheck2,
      badge: 'All Pass'
    },
    {
      id: 'keystore',
      label: 'Signing & Keystore',
      icon: KeyRound,
      badge: 'Release Ready'
    },
    {
      id: 'docs',
      label: '10 Volumes Blueprint',
      icon: BookOpen,
      badge: 'Complete'
    },
    {
      id: 'ai',
      label: 'AI Customizer',
      icon: Sparkles,
      badge: 'Gemini'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-900 selection:text-white">
      {/* Top Header Navigation */}
      <Header files={files} onOpenQuickPush={() => setIsQuickPushOpen(true)} />

      {/* Primary Workspace Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive ? 'bg-slate-950/20 text-slate-900 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {activeTab === 'workflows' && (
          <WorkflowsTab files={files} onSelectFile={handleSelectFileToView} />
        )}
        {activeTab === 'codebase' && (
          <CodebaseExplorerTab
            files={files}
            onSelectFile={handleSelectFileToView}
            onUpdateFileContent={handleUpdateFileContent}
          />
        )}
        {activeTab === 'diagnostics' && <BuildInspectorTab />}
        {activeTab === 'keystore' && <KeystoreWizardTab />}
        {activeTab === 'docs' && (
          <VolumeDocsTab files={files} onSelectFile={handleSelectFileToView} />
        )}
        {activeTab === 'ai' && <AiCustomizerTab files={files} onAddFile={handleAddFile} />}
      </main>

      {/* Quick Push Modal Dialog */}
      <QuickPushModal
        isOpen={isQuickPushOpen}
        onClose={() => setIsQuickPushOpen(false)}
        files={files}
      />

      {/* Bottom Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TermuxXCoder Engineering Specification Suite • Target Android 10+ (API 29–34)</span>
          <span className="font-mono text-[11px] text-slate-400">
            Sora Editor 0.23.5 • Embedded Termux PTY • JGit 7.2.0 • LSP • DAP • GGUF
          </span>
        </div>
      </footer>
    </div>
  );
}
