import React, { useState } from 'react';
import {
  Github,
  Download,
  Terminal,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  GitBranch,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportProjectToZip, downloadBlob } from '../utils/zipExporter';
import { ProjectFile } from '../types';

interface HeaderProps {
  files: ProjectFile[];
  onOpenQuickPush: () => void;
}

export const Header: React.FC<HeaderProps> = ({ files, onOpenQuickPush }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      const blob = await exportProjectToZip(files, 'TermuxXCoder-main');
      downloadBlob(blob, 'TermuxXCoder-GitHub-Ready.zip');

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.2 }
      });
    } catch (e) {
      console.error('Failed to export zip:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-900/30 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Terminal className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                TermuxXCoder
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-mono">
                  v1.0 APK Prep
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Modular Android IDE • Sora Editor • Embedded Termux PTY • JGit • LSP • DAP
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Quick Push Guide Button */}
          <button
            id="btn-quick-push"
            onClick={onOpenQuickPush}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <Github className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Push to GitHub</span>
            <span className="sm:hidden">GitHub</span>
          </button>

          {/* Download Full Zip */}
          <button
            id="btn-export-zip"
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs shadow-md shadow-cyan-950/50 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Generating ZIP...' : 'Export GitHub ZIP'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
