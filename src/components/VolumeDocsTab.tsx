import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  ChevronRight,
  Code,
  Terminal,
  Cpu,
  Shield,
  Workflow,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ENGINEERING_VOLUMES } from '../data/diagnostics';
import { EngineeringVolume, ProjectFile } from '../types';

interface VolumeDocsTabProps {
  files: ProjectFile[];
  onSelectFile: (file: ProjectFile) => void;
}

export const VolumeDocsTab: React.FC<VolumeDocsTabProps> = ({ files, onSelectFile }) => {
  const [selectedVolumeNum, setSelectedVolumeNum] = useState<number>(1);

  const selectedVolume =
    ENGINEERING_VOLUMES.find((v) => v.volume === selectedVolumeNum) || ENGINEERING_VOLUMES[0];

  const getModuleIcon = (vol: number) => {
    switch (vol) {
      case 1:
        return <Layers className="h-4 w-4 text-cyan-400" />;
      case 2:
        return <Code className="h-4 w-4 text-violet-400" />;
      case 3:
        return <Terminal className="h-4 w-4 text-emerald-400" />;
      case 4:
        return <BookOpen className="h-4 w-4 text-blue-400" />;
      case 5:
        return <Workflow className="h-4 w-4 text-amber-400" />;
      case 6:
        return <Cpu className="h-4 w-4 text-pink-400" />;
      case 7:
      case 8:
        return <Sparkles className="h-4 w-4 text-purple-400" />;
      case 9:
      case 10:
        return <Shield className="h-4 w-4 text-indigo-400" />;
      default:
        return <BookOpen className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          TermuxXCoder Engineering Specification (10 Volumes)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Complete production blueprint covering Android architecture, Sora Editor, Termux PTY, JGit, LSP, DAP, AI Engine, and CI/CD.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 10 Volumes Index */}
        <div className="lg:col-span-5 space-y-2">
          {ENGINEERING_VOLUMES.map((vol) => {
            const isSelected = vol.volume === selectedVolumeNum;
            return (
              <button
                key={vol.volume}
                onClick={() => setSelectedVolumeNum(vol.volume)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 group ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/50 shadow-md text-white'
                    : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/40 text-slate-400'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">{getModuleIcon(vol.volume)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">Vol {vol.volume}:</span>
                      <span className="font-semibold text-slate-200 truncate">{vol.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{vol.subtitle}</p>
                  </div>
                </div>
                <ChevronRight
                  className={`h-4 w-4 shrink-0 mt-1 transition-transform ${
                    isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Right Column: Volume Detail & Chapters */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 font-bold">
                VOLUME {selectedVolume.volume} OF 10
              </span>
              <div className="flex items-center gap-1.5">
                {selectedVolume.keyModules.map((mod) => (
                  <span
                    key={mod}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">{selectedVolume.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{selectedVolume.subtitle}</p>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              {selectedVolume.summary}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Engineering Chapters & Implementation Requirements
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedVolume.chapters.map((ch, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between"
                >
                  <span className="text-[11px] font-mono font-bold text-cyan-400">{ch.title}</span>
                  <p className="text-xs text-slate-300 mt-1 leading-snug">{ch.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">Implemented in root project tree</span>
            <button
              onClick={() => {
                const relatedFile = files.find((f) =>
                  selectedVolume.keyModules.some((mod) => f.path.startsWith(mod.replace(':', '')))
                );
                if (relatedFile) onSelectFile(relatedFile);
              }}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
            >
              <span>View Related Source Code</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
