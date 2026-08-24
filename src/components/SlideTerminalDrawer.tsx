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
  Compass
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
      subtitle: 'Code Editor & Sandbox',
      icon: Code2,
      gradient: 'from-blue-600 to-indigo-600',
      iconColor: 'text-blue-200',
      badge: 'Main'
    },
    {
      id: 'terminal',
      name: 'Terminal',
      subtitle: 'PTY Shell & GitHub Push',
      icon: TerminalIcon,
      gradient: 'from-emerald-600 to-green-600',
      iconColor: 'text-emerald-200',
      badge: 'Git'
    },
    {
      id: 'storage',
      name: 'Workspace Files',
      subtitle: 'Directory Tree & Files',
      icon: FolderTree,
      gradient: 'from-cyan-600 to-blue-600',
      iconColor: 'text-cyan-200',
      badge: 'Tree'
    },
    {
      id: 'functions',
      name: 'Functions',
      subtitle: 'Backend & Service Registry',
      icon: Layers,
      gradient: 'from-amber-500 to-orange-600',
      iconColor: 'text-amber-200',
      badge: 'APIs'
    },
    {
      id: 'workflows',
      name: 'CI/CD Actions',
      subtitle: 'GitHub Actions Workflows',
      icon: Workflow,
      gradient: 'from-violet-600 to-purple-600',
      iconColor: 'text-violet-200',
      badge: 'Matrix'
    },
    {
      id: 'releasenotes',
      name: 'Release Notes',
      subtitle: 'POSIX Generator & Hashes',
      icon: FileText,
      gradient: 'from-teal-600 to-emerald-600',
      iconColor: 'text-teal-200',
      badge: 'v1.0'
    },
    {
      id: 'diagnostics',
      name: 'APK Inspector',
      subtitle: 'Build & NDK Diagnostics',
      icon: FileCheck2,
      gradient: 'from-rose-600 to-red-600',
      iconColor: 'text-rose-200',
      badge: 'Pre-flight'
    },
    {
      id: 'keystore',
      name: 'Keystore Signer',
      subtitle: 'PKCS12 & v1/v2/v3 Signer',
      icon: KeyRound,
      gradient: 'from-yellow-500 to-amber-600',
      iconColor: 'text-yellow-200',
      badge: 'Keys'
    },
    {
      id: 'ai',
      name: 'AI Customizer',
      subtitle: 'Gemini Copilot Tuning',
      icon: Sparkles,
      gradient: 'from-fuchsia-600 to-pink-600',
      iconColor: 'text-fuchsia-200',
      badge: 'AI'
    },
    {
      id: 'docs',
      name: '10 Vol. Specs',
      subtitle: 'Blueprint Architecture',
      icon: BookOpen,
      gradient: 'from-indigo-600 to-slate-700',
      iconColor: 'text-indigo-200',
      badge: 'Blueprint'
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
        className={`fixed top-0 left-0 bottom-0 z-50 bg-[#161b22] border-r border-[#30363d] shadow-2xl flex flex-col transition-all duration-300 ease-in-out w-full sm:w-[420px] md:w-[460px] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Drawer Header */}
        <div className="px-5 py-4 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#1f6feb] to-[#8957e5] p-0.5 shadow-md flex items-center justify-center">
              <div className="h-full w-full bg-[#0d1117] rounded-[14px] flex items-center justify-center">
                <Compass className="h-5 w-5 text-[#58a6ff]" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#f0f6fc] tracking-tight flex items-center gap-2">
                <span>App Drawer</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#3fb950]/30 font-semibold">
                  {appModules.length} Apps
                </span>
              </h2>
              <p className="text-xs text-[#8b949e]">
                Select an app to switch workspace view
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Close Drawer [ESC]"
            aria-label="Close App Drawer"
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] transition-all active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[#30363d] bg-[#0d1117]/60">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b949e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps and tools..."
              className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] rounded-xl pl-10 pr-4 py-2 text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#f0f6fc]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* App Icons Grid (App Launcher Style) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            {filteredApps.map((app) => {
              const Icon = app.icon;
              const isActive = activeTab === app.id;

              return (
                <button
                  key={app.id}
                  onClick={() => handleLaunchApp(app.id)}
                  className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 text-center min-h-[115px] ${
                    isActive
                      ? 'bg-[#1f6feb]/15 border-[#1f6feb] shadow-lg shadow-[#1f6feb]/20 ring-1 ring-[#1f6feb]'
                      : 'bg-[#0d1117] border-[#30363d] hover:bg-[#21262d] hover:border-[#58a6ff]/40 hover:shadow-md'
                  }`}
                >
                  {/* Active Indicator Badge */}
                  {isActive && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[9px] font-mono text-[#3fb950] bg-[#238636]/20 px-1.5 py-0.5 rounded-full border border-[#3fb950]/30 font-bold">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      <span>Active</span>
                    </div>
                  )}

                  {/* App Icon Squircle */}
                  <div
                    className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${app.gradient} p-0.5 shadow-md flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform duration-200`}
                  >
                    <div className="h-full w-full bg-[#161b22]/40 rounded-[14px] flex items-center justify-center backdrop-blur-sm">
                      <Icon className={`h-6 w-6 ${app.iconColor}`} />
                    </div>
                  </div>

                  {/* App Title */}
                  <span
                    className={`text-xs font-bold tracking-tight line-clamp-1 ${
                      isActive ? 'text-[#58a6ff]' : 'text-[#f0f6fc] group-hover:text-white'
                    }`}
                  >
                    {app.name}
                  </span>

                  {/* App Subtitle / Role */}
                  <span className="text-[10px] text-[#8b949e] line-clamp-1 mt-0.5">
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
        <div className="px-5 py-3.5 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between text-xs text-[#8b949e]">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#3fb950] animate-pulse" />
            <span className="text-[11px] font-medium">Umakraft Modular Engine</span>
          </span>
          <span className="text-[10px] font-mono text-[#8b949e]">Tap app to switch</span>
        </div>
      </aside>
    </>
  );
};
