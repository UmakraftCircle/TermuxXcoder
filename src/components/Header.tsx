import React, { useState } from 'react';
import {
  Github,
  Download,
  Settings,
  Code2,
  Sparkles,
  ShieldCheck,
  Camera,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportProjectToZip, downloadBlob } from '../utils/zipExporter';
import { ProjectFile } from '../types';

interface HeaderProps {
  files: ProjectFile[];
  activeTab: string;
  onOpenQuickPush: () => void;
  onToggleSlideDrawer: () => void;
  onToggleAiDrawer?: () => void;
  onGoToCoder?: () => void;
  onOpenPermissions?: () => void;
  onOpenGlobalSearch?: () => void;
  isSlideDrawerOpen?: boolean;
  isAiDrawerOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  files,
  activeTab,
  onOpenQuickPush,
  onToggleSlideDrawer,
  onToggleAiDrawer,
  onGoToCoder,
  onOpenPermissions,
  onOpenGlobalSearch,
  isSlideDrawerOpen,
  isAiDrawerOpen
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      const blob = await exportProjectToZip(files, 'Umakraft-TermuxXCoder-main');
      downloadBlob(blob, 'Umakraft-TermuxXCoder-GitHub-Ready.zip');

      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.2 }
      });
    } catch (e) {
      console.error('Failed to export zip:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="border-b border-[#30363d] bg-[#161b22]/95 backdrop-blur z-30 flex-shrink-0 shadow-sm">
      <div className="w-full px-3 sm:px-4 h-14 flex items-center justify-between">
        {/* Left Section: Drawer Toggle Gear */}
        <div className="flex items-center gap-2">
          <button
            id="btn-gear-functions-toggle"
            onClick={onToggleSlideDrawer}
            title="App Drawer & Functions"
            aria-label="Open Functions Menu"
            className={`flex items-center justify-center h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl border transition-all active:scale-95 group ${
              isSlideDrawerOpen
                ? 'bg-[#1f6feb] text-white border-[#388bfd] shadow-lg shadow-[#1f6feb]/30'
                : 'bg-[#21262d] text-[#c9d1d9] border-[#30363d] hover:bg-[#30363d] hover:text-[#f0f6fc] hover:border-[#58a6ff]/50'
            }`}
          >
            <Settings
              className={`h-5 w-5 transition-transform group-hover:rotate-45 ${
                isSlideDrawerOpen ? 'text-white rotate-90' : 'text-[#58a6ff]'
              }`}
            />
          </button>

          {/* Prominent Coder Branding Header */}
          <button
            onClick={onGoToCoder}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#21262d] transition-all cursor-pointer group"
            title="Umakraft Coder - Main Editor"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#1f6feb] to-[#238636] p-0.5 shadow-md flex-shrink-0">
              <div className="h-full w-full bg-[#0d1117] rounded-[6px] flex items-center justify-center">
                <Code2 className="h-4 w-4 text-[#58a6ff] group-hover:scale-110 transition-transform" />
              </div>
            </div>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-sm sm:text-base tracking-tight text-[#f0f6fc]">
                  CODER
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30 font-semibold">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-[#8b949e] font-mono -mt-0.5 hidden xs:inline">
                Umakraft IDE
              </span>
            </div>
          </button>
        </div>

        {/* Right Section: Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          {/* AI Copilot Drawer Toggle Button */}
          {onToggleAiDrawer && (
            <button
              id="btn-ai-copilot-drawer"
              onClick={onToggleAiDrawer}
              title="Toggle AI Copilot Chat Drawer (or swipe from right)"
              aria-label="AI Copilot Chat Drawer"
              className={`flex items-center justify-center h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl border transition-all active:scale-95 group relative ${
                isAiDrawerOpen
                  ? 'bg-gradient-to-br from-[#bc8cff] to-[#8957e5] text-white border-[#d2a8ff] shadow-lg shadow-[#bc8cff]/30'
                  : 'bg-[#21262d] hover:bg-[#30363d] border-[#30363d] hover:border-[#bc8cff]/50 text-[#bc8cff] hover:text-white'
              }`}
            >
              <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />
            </button>
          )}

          {/* Global Search & Indexer Button */}
          {onOpenGlobalSearch && (
            <button
              id="btn-global-search"
              onClick={onOpenGlobalSearch}
              title="Global Search Index across all files (Ctrl+Shift+F)"
              aria-label="Global Search"
              className="flex items-center justify-center h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-[#58a6ff]/40 text-[#c9d1d9] hover:text-[#58a6ff] transition-all active:scale-95 group relative"
            >
              <Search className="h-5 w-5 transition-transform group-hover:scale-110" />
            </button>
          )}

          {/* Permissions & Scopes Explainer Button */}
          {onOpenPermissions && (
            <button
              id="btn-permissions-info"
              onClick={onOpenPermissions}
              title="Storage & Camera Permissions Info"
              aria-label="App Permissions"
              className="flex items-center justify-center h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#3fb950] hover:text-[#7ee787] transition-all active:scale-95"
            >
              <ShieldCheck className="h-5 w-5" />
            </button>
          )}

          {/* Quick Push Guide Icon Button */}
          <button
            id="btn-quick-push"
            onClick={onOpenQuickPush}
            title="GitHub Remote Push"
            aria-label="GitHub Push"
            className="flex items-center justify-center h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#58a6ff] hover:text-[#79c0ff] transition-all active:scale-95"
          >
            <Github className="h-5 w-5" />
          </button>

          {/* Download Full Zip Icon Button */}
          <button
            id="btn-export-zip"
            onClick={handleDownloadZip}
            disabled={isExporting}
            title="Export Sandbox Source as ZIP"
            aria-label="Export ZIP"
            className="flex items-center justify-center h-10 w-10 min-h-[44px] min-w-[44px] rounded-xl bg-[#238636] hover:bg-[#2ea043] border border-[#3fb950]/30 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className={`h-5 w-5 ${isExporting ? 'animate-bounce' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
