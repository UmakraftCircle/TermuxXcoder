import React, { useState } from 'react';
import {
  Terminal as TerminalIcon,
  X,
  Sparkles,
  Workflow,
  FileText,
  KeyRound,
  FileCheck2,
  BookOpen,
  Layers,
  Code2,
  HardDrive,
  FolderTree,
  Search,
  CheckCircle2,
  Compass,
  Layout,
  Database
} from 'lucide-react';
import { ProjectFile } from '../types';

interface SlideTerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  activeTab: string;
  onSelectTab: (tabId: any) => void;
  onOpenQuickPush?: () => void;
}

export const SlideTerminalDrawer: React.FC<SlideTerminalDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const appModules = [
    {
      id: 'coder',
      name: 'AI Coder',
      subtitle: 'Code Editor',
      icon: Code2,
      gradient: 'from-blue-600 to-indigo-600',
      iconColor: 'text-blue-200'
    },
    {
      id: 'layout',
      name: 'UI Designer',
      subtitle: 'Compose & XML Studio',
      icon: Layout,
      gradient: 'from-sky-500 to-indigo-600',
      iconColor: 'text-sky-200'
    },
    {
      id: 'terminal',
      name: 'Terminal',
      subtitle: 'Shell & Git',
      icon: TerminalIcon,
      gradient: 'from-emerald-600 to-green-600',
      iconColor: 'text-emerald-200'
    },
    {
      id: 'storage',
      name: 'Storage',
      subtitle: 'Files & Folders',
      icon: FolderTree,
      gradient: 'from-cyan-600 to-blue-600',
      iconColor: 'text-cyan-200'
    },
    {
      id: 'functions',
      name: 'Functions',
      subtitle: 'Services & APIs',
      icon: Layers,
      gradient: 'from-amber-500 to-orange-600',
      iconColor: 'text-amber-200'
    },
    {
      id: 'workflows',
      name: 'Workflows',
      subtitle: 'CI/CD & Git Hooks',
      icon: Workflow,
      gradient: 'from-violet-600 to-purple-600',
      iconColor: 'text-violet-200'
    },
    {
      id: 'releasenotes',
      name: 'Release Notes',
      subtitle: 'Changelog & SHA',
      icon: FileText,
      gradient: 'from-teal-600 to-emerald-600',
      iconColor: 'text-teal-200'
    },
    {
      id: 'diagnostics',
      name: 'Build Inspector',
      subtitle: 'Gradle & Cache Stats',
      icon: FileCheck2,
      gradient: 'from-rose-600 to-red-600',
      iconColor: 'text-rose-200'
    },
    {
      id: 'keystore',
      name: 'Keystore',
      subtitle: 'Certificate Signer',
      icon: KeyRound,
      gradient: 'from-yellow-500 to-amber-600',
      iconColor: 'text-yellow-200'
    },
    {
      id: 'ai',
      name: 'AI Models',
      subtitle: 'Engines & Keys',
      icon: Sparkles,
      gradient: 'from-fuchsia-600 to-pink-600',
      iconColor: 'text-fuchsia-200'
    },
    {
      id: 'turso',
      name: 'Turso Memory',
      subtitle: 'SQLite Cloud & RAG',
      icon: Database,
      gradient: 'from-emerald-500 to-teal-600',
      iconColor: 'text-emerald-200'
    },
    {
      id: 'docs',
      name: 'Specs',
      subtitle: 'Architecture Docs',
      icon: BookOpen,
      gradient: 'from-indigo-600 to-slate-700',
      iconColor: 'text-indigo-200'
    }
  ];

  const filteredApps = appModules.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLaunchApp = (appId: string) => {
    onSelectTab(appId);
    onClose();
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-50 bg-[#0d1117]/85 backdrop-blur-md transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* App Drawer Slide-out Panel */}
      <aside
        id="umakraft-app-drawer"
        aria-label="App Drawer"
        className={`fixed top-0 left-0 bottom-0 z-50 bg-[#161b22] border-r border-[#30363d] shadow-2xl flex flex-col transition-all duration-300 ease-in-out w-full sm:w-[380px] md:w-[420px] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Drawer Header */}
        <div className="px-4 py-3 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#1f6feb] to-[#8957e5] p-0.5 shadow-md flex items-center justify-center">
              <div className="h-full w-full bg-[#0d1117] rounded-[10px] flex items-center justify-center">
                <Compass className="h-4 w-4 text-[#58a6ff]" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white uppercase font-mono tracking-wider">
                APP DRAWER
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#3fb950]/30 font-bold">
                {appModules.length}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Close"
            className="flex items-center justify-center h-8 w-8 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] transition-all active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#30363d] bg-[#0d1117]/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b949e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools..."
              className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] rounded-xl pl-9 pr-8 py-1.5 text-xs font-mono text-white placeholder-[#6e7681] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* App Icons Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2.5">
            {filteredApps.map((app) => {
              const Icon = app.icon;
              const isActive = activeTab === app.id;

              return (
                <button
                  key={app.id}
                  onClick={() => handleLaunchApp(app.id)}
                  className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 text-center min-h-[95px] ${
                    isActive
                      ? 'bg-[#1f6feb]/15 border-[#1f6feb] shadow-lg shadow-[#1f6feb]/20 ring-1 ring-[#1f6feb]'
                      : 'bg-[#0d1117] border-[#30363d] hover:bg-[#21262d] hover:border-[#58a6ff]/40'
                  }`}
                >
                  {/* Active Dot */}
                  {isActive && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-mono text-[#3fb950] bg-[#238636]/20 px-1.5 py-0.2 rounded-full border border-[#3fb950]/30 font-bold">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      <span>Active</span>
                    </div>
                  )}

                  {/* App Icon Squircle */}
                  <div
                    className={`h-10 w-10 rounded-xl bg-gradient-to-br ${app.gradient} p-0.5 shadow-md flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-200`}
                  >
                    <div className="h-full w-full bg-[#161b22]/40 rounded-[9px] flex items-center justify-center backdrop-blur-sm">
                      <Icon className={`h-5 w-5 ${app.iconColor}`} />
                    </div>
                  </div>

                  {/* App Title */}
                  <span
                    className={`text-xs font-bold font-mono truncate w-full ${
                      isActive ? 'text-[#58a6ff]' : 'text-white group-hover:text-[#58a6ff]'
                    }`}
                  >
                    {app.name}
                  </span>

                  {/* App Subtitle */}
                  <span className="text-[10px] text-[#8b949e] font-mono truncate w-full mt-0.5">
                    {app.subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredApps.length === 0 && (
            <div className="py-12 text-center text-[#8b949e]">
              <Search className="h-8 w-8 mx-auto mb-2 text-[#8b949e]/50" />
              <p className="text-xs font-medium">No apps found matching "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-4 py-2.5 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between text-xs font-mono text-[#8b949e]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3fb950] animate-pulse" />
            <span className="text-[11px] font-bold text-white">UMAKRAFT</span>
          </span>
          <span className="text-[10px] text-[#6e7681]">v1.0.0</span>
        </div>
      </aside>
    </>
  );
};
