import React, { useState } from 'react';
import {
  History,
  X,
  RotateCcw,
  RotateCw,
  Sparkles,
  Zap,
  FileCode,
  Wand2,
  Replace,
  FilePlus,
  Trash2,
  UploadCloud,
  CheckCircle2,
  ArrowLeft,
  Clock,
  Code2,
  AlertTriangle,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HistorySnapshot, HistoryActionType } from '../utils/undoRedoManager';

interface UndoRedoHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history?: HistorySnapshot[];
  snapshots?: HistorySnapshot[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onJumpToSnapshot: (index: number) => void;
  onClearHistory: () => void;
  currentFileContent?: string;
}

export const UndoRedoHistoryModal: React.FC<UndoRedoHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  snapshots,
  currentIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onJumpToSnapshot,
  onClearHistory
}) => {
  const historyList = history || snapshots || [];
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const activeIndex = selectedSnapshotIndex !== null ? selectedSnapshotIndex : currentIndex;
  const activeSnapshot = historyList[activeIndex] || null;

  const getActionBadge = (type: HistoryActionType) => {
    switch (type) {
      case 'ai_unrestrained':
        return {
          label: 'AI Autonomous',
          icon: <Flame className="h-3.5 w-3.5 text-[#ff7b72]" />,
          color: 'text-[#ff7b72]',
          bgColor: 'bg-[#ff7b72]/15',
          borderColor: 'border-[#ff7b72]/30'
        };
      case 'ai_patch':
        return {
          label: 'AI Patch',
          icon: <Sparkles className="h-3.5 w-3.5 text-[#d2a8ff]" />,
          color: 'text-[#d2a8ff]',
          bgColor: 'bg-[#d2a8ff]/15',
          borderColor: 'border-[#d2a8ff]/30'
        };
      case 'auto_format':
        return {
          label: 'Auto Format',
          icon: <Wand2 className="h-3.5 w-3.5 text-[#39c5bb]" />,
          color: 'text-[#39c5bb]',
          bgColor: 'bg-[#39c5bb]/15',
          borderColor: 'border-[#39c5bb]/30'
        };
      case 'global_replace':
      case 'replace_find':
        return {
          label: 'Replace',
          icon: <Replace className="h-3.5 w-3.5 text-[#e3b341]" />,
          color: 'text-[#e3b341]',
          bgColor: 'bg-[#e3b341]/15',
          borderColor: 'border-[#e3b341]/30'
        };
      case 'file_create':
        return {
          label: 'File Created',
          icon: <FilePlus className="h-3.5 w-3.5 text-[#3fb950]" />,
          color: 'text-[#3fb950]',
          bgColor: 'bg-[#3fb950]/15',
          borderColor: 'border-[#3fb950]/30'
        };
      case 'file_delete':
        return {
          label: 'File Deleted',
          icon: <Trash2 className="h-3.5 w-3.5 text-[#f85149]" />,
          color: 'text-[#f85149]',
          bgColor: 'bg-[#f85149]/15',
          borderColor: 'border-[#f85149]/30'
        };
      case 'file_import':
        return {
          label: 'Files Imported',
          icon: <UploadCloud className="h-3.5 w-3.5 text-[#58a6ff]" />,
          color: 'text-[#58a6ff]',
          bgColor: 'bg-[#58a6ff]/15',
          borderColor: 'border-[#58a6ff]/30'
        };
      case 'manual_edit':
      default:
        return {
          label: 'User Edit',
          icon: <FileCode className="h-3.5 w-3.5 text-[#58a6ff]" />,
          color: 'text-[#58a6ff]',
          bgColor: 'bg-[#58a6ff]/15',
          borderColor: 'border-[#58a6ff]/30'
        };
    }
  };

  const handleRevert = (index: number) => {
    onJumpToSnapshot(index);
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.5 } });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        className="bg-[#0d1117] border border-[#30363d] rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        id="undo-redo-history-modal"
      >
        {/* Header */}
        <div className="bg-[#161b22] border-b border-[#30363d] p-3 sm:p-4 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#8957e5] to-[#d2a8ff] text-white shadow-md shrink-0">
              <History className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white font-mono tracking-tight">
                  SANDBOX VERSION TIMELINE & UNDO/REDO
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8957e5]/20 text-[#d2a8ff] border border-[#8957e5]/30 font-semibold">
                  {historyList.length} Snapshots
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-mono truncate">
                Revert accidental AI changes, auto-formatings, or manual edits across your sandbox
              </p>
            </div>
          </div>

          {/* Quick Undo / Redo Buttons & Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo Last Action (Ctrl+Z)"
              className="px-2.5 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] disabled:opacity-30 border border-[#30363d] text-[#c9d1d9] hover:text-white text-xs flex items-center gap-1.5 transition-all font-mono font-bold"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#58a6ff]" />
              <span className="hidden sm:inline">Undo</span>
            </button>

            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
              className="px-2.5 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] disabled:opacity-30 border border-[#30363d] text-[#c9d1d9] hover:text-white text-xs flex items-center gap-1.5 transition-all font-mono font-bold"
            >
              <RotateCw className="h-3.5 w-3.5 text-[#3fb950]" />
              <span className="hidden sm:inline">Redo</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#21262d] hover:bg-[#da3633]/30 text-[#8b949e] hover:text-white border border-[#30363d] transition-all ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Left Timeline List, Right Snapshot Preview */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden font-mono">
          {/* Left Column: Timeline Snapshots List */}
          <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-[#30363d] overflow-y-auto p-3 space-y-2 bg-[#0d1117]">
            <div className="flex items-center justify-between text-[11px] text-[#8b949e] px-1 pb-1">
              <span>Timeline (Newest at Top)</span>
              <button
                type="button"
                onClick={onClearHistory}
                className="text-[10px] text-[#8b949e] hover:text-[#f85149] transition-colors"
              >
                Clear History
              </button>
            </div>

            {historyList.length === 0 ? (
              <div className="py-12 text-center text-[#8b949e] space-y-2">
                <Clock className="h-8 w-8 mx-auto text-[#30363d]" />
                <p className="text-xs">No history recorded yet</p>
              </div>
            ) : (
              [...historyList].reverse().map((snap, reverseIdx) => {
                const actualIndex = historyList.length - 1 - reverseIdx;
                const isCurrent = actualIndex === currentIndex;
                const isSelected = actualIndex === activeIndex;
                const badge = getActionBadge(snap.actionType);

                return (
                  <div
                    key={snap.id}
                    onClick={() => setSelectedSnapshotIndex(actualIndex)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none relative ${
                      isCurrent
                        ? 'bg-[#1f6feb]/15 border-[#1f6feb] ring-1 ring-[#1f6feb]/30'
                        : isSelected
                        ? 'bg-[#161b22] border-[#58a6ff]/60'
                        : 'bg-[#161b22]/70 border-[#30363d] hover:bg-[#161b22] hover:border-[#8b949e]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${badge.bgColor} ${badge.borderColor} ${badge.color}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                        <span className="text-xs font-bold text-white truncate">
                          {snap.fileName}
                        </span>
                      </div>

                      <span className="text-[10px] text-[#8b949e] shrink-0">{snap.timeLabel}</span>
                    </div>

                    <p className="text-[11px] text-[#8b949e] mt-1 line-clamp-1 truncate">
                      {snap.description}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#30363d]/40 text-[10px]">
                      <div className="flex items-center gap-1 text-[#8b949e]">
                        <FileCode className="h-3 w-3 text-[#58a6ff]" />
                        <span>{snap.files.length} files in sandbox</span>
                      </div>

                      {isCurrent ? (
                        <span className="flex items-center gap-1 text-[#3fb950] font-bold">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Active Current State</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevert(actualIndex);
                          }}
                          className="px-2 py-0.5 rounded-md bg-[#21262d] hover:bg-[#1f6feb] text-[#c9d1d9] hover:text-white border border-[#30363d] font-bold transition-all active:scale-95"
                        >
                          Revert to Here
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Snapshot Inspection Preview */}
          <div className="w-full md:w-1/2 flex flex-col bg-[#161b22]/30 overflow-hidden">
            {activeSnapshot ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Snapshot Details Header */}
                <div className="p-3 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between gap-2 flex-shrink-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-white truncate">
                        {activeSnapshot.fileName}
                      </span>
                      <span className="text-[10px] text-[#8b949e]">
                        {activeSnapshot.timeLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8b949e] truncate">
                      {activeSnapshot.filePath}
                    </p>
                  </div>

                  {activeIndex !== currentIndex && (
                    <button
                      type="button"
                      onClick={() => handleRevert(activeIndex)}
                      className="px-3 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold shadow-md transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Revert State</span>
                    </button>
                  )}
                </div>

                {/* Code Snapshot Content */}
                <div className="flex-1 overflow-y-auto p-3 bg-[#0d1117] text-xs font-mono text-[#c9d1d9]">
                  {(() => {
                    const target = activeSnapshot.files.find(
                      (f) => f.path === activeSnapshot.filePath
                    ) || activeSnapshot.files[0];

                    if (!target || !target.content) {
                      return (
                        <div className="text-center py-12 text-[#8b949e]">
                          File content is empty in this snapshot
                        </div>
                      );
                    }

                    return (
                      <pre className="whitespace-pre overflow-x-auto leading-relaxed text-[11px] text-[#8b949e]">
                        <code>{target.content.slice(0, 5000)}</code>
                        {target.content.length > 5000 && (
                          <div className="text-[#58a6ff] mt-2 italic text-[10px]">
                            ... (truncated {target.content.length - 5000} additional characters for preview)
                          </div>
                        )}
                      </pre>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center text-[#8b949e]">
                Select a timeline snapshot on the left to preview code
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-[#8b949e] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[#58a6ff] font-bold">Shortcuts:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[10px] text-white">
              Ctrl+Z
            </kbd>{' '}
            Undo &bull;{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[10px] text-white">
              Ctrl+Y
            </kbd>{' '}
            or{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[10px] text-white">
              Ctrl+Shift+Z
            </kbd>{' '}
            Redo
          </div>

          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[10px] text-white">
              Esc
            </kbd>
            <span className="hidden sm:inline">to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
