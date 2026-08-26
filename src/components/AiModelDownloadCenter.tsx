import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  HardDrive,
  Cpu,
  Bot,
  Sparkles,
  Terminal,
  ExternalLink,
  Check,
  RefreshCw,
  FolderDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Play,
  FileCode,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  OFFLINE_AI_MODELS,
  DownloadableAiModel,
  getDownloadedModelIds,
  saveDownloadedModelIds,
  triggerBrowserFileDownload
} from '../utils/aiModelDownloader';
import { ProjectFile } from '../types';

interface AiModelDownloadCenterProps {
  onAddFileToWorkspace?: (file: ProjectFile) => void;
  onRunTerminalCommand?: (cmd: string) => void;
}

export const AiModelDownloadCenter: React.FC<AiModelDownloadCenterProps> = ({
  onAddFileToWorkspace,
  onRunTerminalCommand
}) => {
  const [downloadedIds, setDownloadedIds] = useState<string[]>(getDownloadedModelIds());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'mobile' | 'gguf' | 'runtime'>('all');
  const [registeredSuccess, setRegisteredSuccess] = useState<string | null>(null);

  useEffect(() => {
    setDownloadedIds(getDownloadedModelIds());
  }, []);

  const handleDownloadModel = (model: DownloadableAiModel) => {
    setDownloadingId(model.id);
    setDownloadProgress((prev) => ({ ...prev, [model.id]: 10 }));

    // Simulate chunked download progress in UI while triggering file save
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        const current = prev[model.id] || 10;
        if (current >= 95) {
          clearInterval(interval);
          return { ...prev, [model.id]: 100 };
        }
        return { ...prev, [model.id]: current + Math.floor(Math.random() * 20) + 15 };
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setDownloadProgress((prev) => ({ ...prev, [model.id]: 100 }));
      setDownloadingId(null);

      // Save to downloaded list
      const updated = Array.from(new Set([...downloadedIds, model.id]));
      setDownloadedIds(updated);
      saveDownloadedModelIds(updated);

      // Trigger actual download link
      triggerBrowserFileDownload(model.downloadUrl, model.filename);

      // Create model manifest stub in user sandbox workspace
      if (onAddFileToWorkspace) {
        const stubContent = `# Umakraft AI Model Manifest
Model Name: ${model.name}
File: ${model.filename}
Format: ${model.format}
Quantization: ${model.quantization}
Repository: ${model.hfRepo}
Target Path: ${model.targetDir}/${model.filename}
Direct Download URL: ${model.downloadUrl}
Status: Downloaded & Available in Sandbox

## Termux Execution Command
\`\`\`bash
${model.runtimeInstructions}
\`\`\`
`;
        const manifestFile: ProjectFile = {
          name: `${model.id}-manifest.md`,
          path: `sandbox/models/${model.id}-manifest.md`,
          content: stubContent,
          category: 'doc',
          language: 'markdown',
          module: 'ai-models',
          isSandbox: true,
          storageScope: 'sandbox_user'
        };
        onAddFileToWorkspace(manifestFile);
      }

      setRegisteredSuccess(model.id);
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
      setTimeout(() => setRegisteredSuccess(null), 3500);
    }, 1600);
  };

  const filteredModels = OFFLINE_AI_MODELS.filter((m) => {
    if (activeFilter === 'mobile') return m.sizeBytes < 800000000;
    if (activeFilter === 'gguf') return m.format === 'GGUF';
    if (activeFilter === 'runtime') return m.format === 'Weights & Config';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm bg-gradient-to-r from-[#1f6feb]/10 via-[#161b22] to-[#161b22]">
        <div className="flex items-start sm:items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#238636] via-[#1f6feb] to-[#a371f7] p-0.5 shadow-md shrink-0">
            <div className="h-full w-full bg-[#161b22] rounded-[14px] flex items-center justify-center">
              <FolderDown className="h-5 w-5 text-[#3fb950]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-[#f0f6fc]">
                Download Offline AI Models
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30 font-semibold">
                GGUF • HuggingFace
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Download quantified GGUF models directly to your device for 100% offline, zero-cloud inference on Android Termux and Ollama.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Models' },
            { id: 'mobile', label: 'Mobile (<800MB)' },
            { id: 'gguf', label: 'GGUF Coder' },
            { id: 'runtime', label: 'Termux Binaries' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-[#1f6feb] text-white shadow-sm'
                  : 'bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {filteredModels.map((model) => {
          const isDownloaded = downloadedIds.includes(model.id);
          const isCurrentlyDownloading = downloadingId === model.id;
          const progress = downloadProgress[model.id] || 0;

          return (
            <div
              key={model.id}
              className={`bg-[#161b22] border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all relative ${
                isDownloaded
                  ? 'border-[#238636]/50 shadow-md shadow-[#238636]/5'
                  : 'border-[#30363d] hover:border-[#58a6ff]/40'
              }`}
            >
              <div>
                {/* Top badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-[#58a6ff]">
                      {model.format} • {model.quantization}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${model.badgeColor}`}>
                      {model.badge}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-[#f0f6fc] shrink-0">
                    {model.sizeString}
                  </span>
                </div>

                {/* Model Title & Description */}
                <h4 className="text-sm sm:text-base font-bold text-[#f0f6fc] mb-1">
                  {model.name}
                </h4>
                <p className="text-xs text-[#8b949e] leading-relaxed line-clamp-2 mb-3">
                  {model.description}
                </p>

                {/* Info meta items */}
                <div className="space-y-1.5 bg-[#0d1117] p-2.5 rounded-xl border border-[#30363d]/60 text-[11px] font-mono text-[#8b949e] mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6e7681]">HuggingFace:</span>
                    <span className="text-[#c9d1d9] truncate max-w-[200px]">{model.hfRepo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6e7681]">Target:</span>
                    <span className="text-[#3fb950] truncate">{model.targetDir}/{model.filename}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6e7681]">Best For:</span>
                    <span className="text-[#58a6ff] truncate">{model.recommendedFor}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Progress Bar */}
              <div className="space-y-2 pt-2 border-t border-[#30363d]/50">
                {isCurrentlyDownloading && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#58a6ff] animate-pulse">Downloading model weights...</span>
                      <span className="text-[#f0f6fc] font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#1f6feb] to-[#238636] transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadModel(model)}
                    disabled={isCurrentlyDownloading}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 min-h-[44px] rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 ${
                      isDownloaded
                        ? 'bg-[#238636]/20 hover:bg-[#238636]/30 text-[#3fb950] border border-[#3fb950]/40'
                        : 'bg-[#238636] hover:bg-[#2ea043] text-white border border-[#3fb950]/30'
                    }`}
                  >
                    {isCurrentlyDownloading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Downloading ({progress}%)...</span>
                      </>
                    ) : isDownloaded ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-[#3fb950]" />
                        <span>Ready (Re-download)</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Download ({model.sizeString})</span>
                      </>
                    )}
                  </button>

                  {onRunTerminalCommand && (
                    <button
                      onClick={() => onRunTerminalCommand(model.runtimeInstructions)}
                      title="Run model launch command in Terminal"
                      className="px-3 py-2.5 min-h-[44px] bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-white rounded-xl border border-[#30363d] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span className="hidden xs:inline">Run</span>
                    </button>
                  )}
                </div>

                {registeredSuccess === model.id && (
                  <div className="text-[11px] text-[#3fb950] font-mono flex items-center gap-1.5 animate-in fade-in">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span>Added manifest to sandbox/models/{model.id}-manifest.md</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Offline Terminal Execution Guide Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#a371f7]/15 text-[#d2a8ff]">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#f0f6fc]">
              How to execute offline AI on Termux / Linux
            </h4>
            <p className="text-[11px] text-[#8b949e]">
              Place downloaded GGUF models in your storage path and launch with llama.cpp or Ollama.
            </p>
          </div>
        </div>

        <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d] font-mono text-xs text-[#c9d1d9] space-y-2 overflow-x-auto">
          <div className="text-[#8b949e]"># 1. Install llama-cli via Termux pkg:</div>
          <div className="text-[#58a6ff]">pkg install llama.cpp</div>
          <div className="text-[#8b949e]"># 2. Run local Qwen 1.5 Coder offline:</div>
          <div className="text-[#3fb950]">
            llama-cli -m ~/storage/downloads/qwen1_5-coder-0_5b-chat-q4_k_m.gguf -p "Create Android 14 Scoped Storage helper in Kotlin"
          </div>
        </div>
      </div>
    </div>
  );
};
