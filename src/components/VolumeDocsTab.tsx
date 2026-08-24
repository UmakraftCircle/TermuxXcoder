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
        return <Layers className="h-4 w-4 text-[#58a6ff]" />;
      case 2:
        return <Code className="h-4 w-4 text-[#bc8cff]" />;
      case 3:
        return <Terminal className="h-4 w-4 text-[#3fb950]" />;
      case 4:
        return <BookOpen className="h-4 w-4 text-[#58a6ff]" />;
      case 5:
        return <Workflow className="h-4 w-4 text-[#d29922]" />;
      case 6:
        return <Cpu className="h-4 w-4 text-[#f778ba]" />;
      case 7:
      case 8:
        return <Sparkles className="h-4 w-4 text-[#bc8cff]" />;
      case 9:
      case 10:
        return <Shield className="h-4 w-4 text-[#58a6ff]" />;
      default:
        return <BookOpen className="h-4 w-4 text-[#8b949e]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bento Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-sm">
        <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#58a6ff]" />
          TermuxXCoder Engineering Specification (10 Volumes)
        </h2>
        <p className="text-xs text-[#8b949e] mt-1">
          Complete production blueprint covering Android architecture, Sora Editor, Termux PTY, JGit, LSP, DAP, AI Engine, and CI/CD.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 10 Volumes Index Bento Cards with Icon + Name */}
        <div className="lg:col-span-5 space-y-1.5">
          {ENGINEERING_VOLUMES.map((vol) => {
            const isSelected = vol.volume === selectedVolumeNum;
            return (
              <button
                key={vol.volume}
                onClick={() => setSelectedVolumeNum(vol.volume)}
                className={`w-full text-left px-3.5 py-3 rounded-xl border text-xs transition-all flex items-center justify-between gap-3 min-h-[44px] group ${
                  isSelected
                    ? 'bg-[#21262d] border-[#58a6ff] shadow-md shadow-[#1f6feb]/15 text-[#f0f6fc] font-bold'
                    : 'bg-[#161b22] border-[#30363d] hover:bg-[#21262d]/70 text-[#c9d1d9]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected ? 'bg-[#1f6feb] text-white' : 'bg-[#0d1117]'
                    }`}
                  >
                    {getModuleIcon(vol.volume)}
                  </div>
                  <span className="font-semibold truncate text-xs">
                    Vol {vol.volume}: {vol.title}
                  </span>
                </div>
                <ChevronRight
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    isSelected ? 'text-[#58a6ff] translate-x-0.5' : 'text-[#8b949e] group-hover:text-[#c9d1d9]'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Right Column: Volume Detail & Chapters Bento Card */}
        <div className="lg:col-span-7 bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="border-b border-[#30363d] pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#58a6ff] font-bold">
                VOLUME {selectedVolume.volume} OF 10
              </span>
              <div className="flex items-center gap-1.5">
                {selectedVolume.keyModules.map((mod) => (
                  <span
                    key={mod}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/40"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#f0f6fc] mt-1">{selectedVolume.title}</h3>
            <p className="text-xs text-[#8b949e] mt-0.5 font-medium">{selectedVolume.subtitle}</p>
            <p className="text-xs text-[#c9d1d9] mt-3 leading-relaxed bg-[#0d1117] p-3 rounded-xl border border-[#30363d]">
              {selectedVolume.summary}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8b949e] mb-3">
              Engineering Chapters & Implementation Requirements
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedVolume.chapters.map((ch, idx) => (
                <div
                  key={idx}
                  className="bg-[#0d1117] p-3 rounded-xl border border-[#30363d] flex flex-col justify-between hover:border-[#8b949e]/50 transition-colors"
                >
                  <span className="text-[11px] font-mono font-bold text-[#58a6ff]">{ch.title}</span>
                  <p className="text-xs text-[#c9d1d9] mt-1 leading-snug">{ch.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Implemented in root project tree</span>
            <button
              onClick={() => {
                const relatedFile = files.find((f) =>
                  selectedVolume.keyModules.some((mod) => f.path.startsWith(mod.replace(':', '')))
                );
                if (relatedFile) onSelectFile(relatedFile);
              }}
              className="text-xs font-semibold text-[#58a6ff] hover:text-[#79c0ff] flex items-center gap-1.5"
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
