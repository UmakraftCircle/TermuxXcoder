import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Sliders,
  Settings,
  X,
  Camera,
  ShieldCheck,
  Search,
  Check,
  Copy,
  LayoutGrid,
  Columns2,
  Rows2,
  Maximize2,
  Minimize2,
  FileCode2,
  ArrowRight,
  Code2,
  Zap,
  Info,
  HelpCircle,
  Eye,
  GitCompare,
  PlusCircle,
  Clock
} from 'lucide-react';
import { ProjectFile, AiCopilotConfig } from '../types';
import { AI_PROVIDERS, AiProviderType } from '../utils/aiCopilotService';
import confetti from 'canvas-confetti';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  codeSnippet?: string;
  timestamp: string;
  providerBadge?: string;
}

export type CopilotLayoutMode = 'split' | 'bottom' | 'full';

interface UmakraftAiCopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  layoutMode: CopilotLayoutMode;
  onChangeLayoutMode: (mode: CopilotLayoutMode) => void;
  currentFile: ProjectFile | null;
  workspaceScope: 'sandbox' | 'app';
  messages: ChatMessage[];
  onSendMessage: (promptText?: string, image?: { data: string; mimeType?: string }) => Promise<void>;
  isAiLoading: boolean;
  aiConfig: AiCopilotConfig;
  onOpenAiSettings: () => void;
  onApplyCode: (code: string) => void;
  onInsertAtCursor?: (code: string) => void;
  onOpenScanner: () => void;
  editorContent: string;
}

export const UmakraftAiCopilotPanel: React.FC<UmakraftAiCopilotPanelProps> = ({
  isOpen,
  onClose,
  layoutMode,
  onChangeLayoutMode,
  currentFile,
  workspaceScope,
  messages,
  onSendMessage,
  isAiLoading,
  aiConfig,
  onOpenAiSettings,
  onApplyCode,
  onInsertAtCursor,
  onOpenScanner,
  editorContent
}) => {
  const [prompt, setPrompt] = useState('');
  const [activeDiffSnippet, setActiveDiffSnippet] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiLoading, isOpen]);

  if (!isOpen) return null;

  const handleCopyCode = (snippet: string, msgId: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedId(msgId);
    confetti({ particleCount: 15, spread: 35 });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (snippet: string, msgId: string) => {
    onApplyCode(snippet);
    setAppliedId(msgId);
    confetti({ particleCount: 25, spread: 45 });
    setTimeout(() => setAppliedId(null), 2500);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isAiLoading) return;
    const text = prompt.trim();
    setPrompt('');
    onSendMessage(text);
  };

  // Simple diff generator for visual inspection (Original vs AI Patch)
  const renderSimpleDiff = (snippet: string) => {
    const originalLines = (editorContent || '').split('\n').slice(0, 30);
    const newLines = snippet.split('\n').slice(0, 30);

    return (
      <div className="bg-[#090d13] border border-[#30363d] rounded-xl overflow-hidden text-[11px] font-mono">
        <div className="bg-[#161b22] px-3 py-1.5 border-b border-[#30363d] flex items-center justify-between text-xs text-[#8b949e]">
          <span className="flex items-center gap-1 font-semibold text-white">
            <GitCompare className="h-3.5 w-3.5 text-[#58a6ff]" />
            Side-by-Side Diff Inspector
          </span>
          <button
            onClick={() => setActiveDiffSnippet(null)}
            className="text-[10px] text-[#8b949e] hover:text-white px-2 py-0.5 rounded bg-[#21262d]"
          >
            Close Diff
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#30363d] max-h-60 overflow-y-auto">
          {/* Current Code */}
          <div className="p-2 bg-[#161b22]/40">
            <div className="text-[10px] text-[#ff7b72] font-bold mb-1 flex items-center gap-1">
              <span>- Current Active File Lines:</span>
            </div>
            <pre className="text-[#8b949e] leading-relaxed whitespace-pre-wrap">
              {originalLines.join('\n')}
              {originalLines.length >= 30 && '\n... (truncated)'}
            </pre>
          </div>
          {/* Proposed Code */}
          <div className="p-2 bg-[#238636]/10">
            <div className="text-[10px] text-[#3fb950] font-bold mb-1 flex items-center gap-1">
              <span>+ AI Proposed Patch:</span>
            </div>
            <pre className="text-[#7ee787] leading-relaxed whitespace-pre-wrap">
              {newLines.join('\n')}
              {newLines.length >= 30 && '\n... (truncated)'}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  // Container styling depending on Layout Mode (Zero Overlap Guaranteed)
  const containerClasses =
    layoutMode === 'split'
      ? 'w-full lg:w-[420px] xl:w-[480px] shrink-0 border-l border-[#30363d] bg-[#0d1117] flex flex-col h-full min-h-0 z-10 transition-all duration-200'
      : layoutMode === 'bottom'
      ? 'w-full h-[360px] shrink-0 border-t border-[#30363d] bg-[#0d1117] flex flex-col z-10 transition-all duration-200'
      : 'absolute inset-0 bg-[#0d1117]/98 backdrop-blur-md z-30 flex flex-col p-3 overflow-hidden border border-[#bc8cff]/30 shadow-2xl rounded-2xl animate-in fade-in duration-150';

  return (
    <div className={containerClasses} id="umakraft-ai-copilot-container">
      {/* Top Header Bar */}
      <div className="bg-[#161b22] px-3.5 py-2.5 border-b border-[#30363d] flex items-center justify-between flex-shrink-0">
        {/* Left Title & Model Pill */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/30 shadow-inner">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-white font-mono tracking-tight">UmaKraft AI Copilot</h4>
              <button
                onClick={onOpenAiSettings}
                title="Configure AI Provider / API Key"
                className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#58a6ff] hover:text-[#79c0ff] flex items-center gap-1 transition-colors"
              >
                <Bot className="h-2.5 w-2.5" />
                <span className="font-semibold">{AI_PROVIDERS[aiConfig.provider]?.shortName || 'Local AI'}</span>
                <Sliders className="h-2.5 w-2.5 text-[#8b949e]" />
              </button>
            </div>
            <p className="text-[10px] text-[#8b949e] font-mono truncate flex items-center gap-1">
              <span>File: {currentFile?.name || 'Workspace'}</span>
              <span>&bull;</span>
              <span className={workspaceScope === 'sandbox' ? 'text-[#3fb950]' : 'text-[#d29922]'}>
                {workspaceScope === 'sandbox' ? 'Sandbox' : 'App System (Read-Only)'}
              </span>
            </p>
          </div>
        </div>

        {/* Right Layout Mode & Close Actions */}
        <div className="flex items-center gap-1">
          {/* Layout Mode Switcher */}
          <div className="hidden sm:flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d] mr-1">
            <button
              onClick={() => onChangeLayoutMode('split')}
              title="Split View (Docked Right - No Overlap)"
              className={`p-1 rounded-md text-[10px] font-mono transition-colors ${
                layoutMode === 'split' ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onChangeLayoutMode('bottom')}
              title="Bottom Drawer View (No Overlap)"
              className={`p-1 rounded-md text-[10px] font-mono transition-colors ${
                layoutMode === 'bottom' ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <Rows2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onChangeLayoutMode('full')}
              title="Full Focus Modal"
              className={`p-1 rounded-md text-[10px] font-mono transition-colors ${
                layoutMode === 'full' ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={onOpenAiSettings}
            title="AI Engine Settings"
            className="p-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] transition-all"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onClose}
            title="Close Copilot (Ctrl+I to reopen)"
            className="p-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Action Chips Bar (Camera, Code Audit, Optimize, Explain) */}
      <div className="bg-[#0d1117] border-b border-[#30363d] px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
        <button
          onClick={onOpenScanner}
          disabled={isAiLoading}
          className="px-2.5 py-1 rounded-xl bg-[#58a6ff]/15 hover:bg-[#58a6ff]/25 text-[10px] font-mono text-[#58a6ff] hover:text-white border border-[#58a6ff]/40 shrink-0 active:scale-95 disabled:opacity-50 flex items-center gap-1 font-bold shadow-sm"
        >
          <Camera className="h-3 w-3 text-[#58a6ff]" />
          <span>📷 Scan Code Photo</span>
        </button>

        <button
          onClick={() =>
            onSendMessage(
              "Check this code thoroughly. Tell me what's wrong, why it's an issue, how it should be done correctly, and provide the fully fixed code."
            )
          }
          disabled={isAiLoading}
          className="px-2.5 py-1 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[10px] font-mono text-[#e3b341] hover:text-[#f0e6c8] border border-[#e3b341]/40 shrink-0 active:scale-95 disabled:opacity-50 flex items-center gap-1 font-bold shadow-sm"
        >
          <ShieldCheck className="h-3 w-3 text-[#e3b341]" />
          <span>🔍 Check Code & Fix</span>
        </button>

        <button
          onClick={() =>
            onSendMessage(
              "Review this code for Android 10+ (API 29-34) Scoped Storage compliance, main thread blocking, and memory leaks. Explain what's wrong and how to fix."
            )
          }
          disabled={isAiLoading}
          className="px-2.5 py-1 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[10px] font-mono text-[#3fb950] border border-[#30363d] shrink-0 active:scale-95 disabled:opacity-50 flex items-center gap-1"
        >
          <span>⚡ Android 10+ Audit</span>
        </button>

        <button
          onClick={() =>
            onSendMessage('Refactor and optimize this file for maximum execution speed, clean architecture, and thread safety.')
          }
          disabled={isAiLoading}
          className="px-2.5 py-1 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[10px] font-mono text-[#ffa657] border border-[#30363d] shrink-0 active:scale-95 disabled:opacity-50"
        >
          <span>🚀 Optimize</span>
        </button>

        <button
          onClick={() => onSendMessage('Explain line by line what this code does in clear detail.')}
          disabled={isAiLoading}
          className="px-2.5 py-1 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[10px] font-mono text-[#d2a8ff] border border-[#30363d] shrink-0 active:scale-95 disabled:opacity-50"
        >
          <span>📖 Explain</span>
        </button>
      </div>

      {/* Active Diff Inspector Panel (If Toggled) */}
      {activeDiffSnippet && (
        <div className="p-3 border-b border-[#30363d] bg-[#090d13]">
          {renderSimpleDiff(activeDiffSnippet)}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 font-mono text-xs select-text bg-[#0d1117]/60">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8b949e] space-y-2">
            <div className="p-3 rounded-2xl bg-[#161b22] border border-[#30363d] text-[#58a6ff]">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="font-bold text-white text-xs">UmaKraft AI Copilot Ready</p>
            <p className="text-[11px] max-w-xs text-[#8b949e]">
              Ask questions about your code, scan code photos from your camera, or run Android audits with zero overlap.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isDiagnostic = msg.text.includes("What's Wrong") || msg.text.includes('Identified');
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1 mb-1 text-[10px] text-[#8b949e]">
                <span>{msg.sender === 'user' ? 'You' : msg.providerBadge || 'AI Copilot'}</span>
                <span>&bull;</span>
                <span>{msg.timestamp}</span>
                {isDiagnostic && msg.sender === 'ai' && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/30 text-[9px] font-bold">
                    Code Diagnosis & Fix
                  </span>
                )}
              </div>

              <div
                className={`max-w-[95%] p-3 rounded-2xl shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-[#1f6feb] text-white rounded-tr-sm'
                    : 'bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                {/* Code Snippet Card */}
                {msg.codeSnippet && (
                  <div className="mt-2.5 pt-2 border-t border-[#30363d] space-y-2">
                    <div className="flex items-center justify-between pb-1 text-[10px] text-[#8b949e]">
                      <span className="font-semibold text-white flex items-center gap-1">
                        <FileCode2 className="h-3 w-3 text-[#58a6ff]" />
                        Suggested Code Patch:
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setActiveDiffSnippet(msg.codeSnippet!)}
                          className="px-2 py-0.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-white font-semibold text-[10px] flex items-center gap-1 border border-[#30363d] transition-all"
                          title="Inspect side-by-side diff"
                        >
                          <GitCompare className="h-3 w-3" />
                          <span>Diff</span>
                        </button>
                        <button
                          onClick={() => handleCopyCode(msg.codeSnippet!, msg.id)}
                          className="px-2 py-0.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white font-semibold text-[10px] flex items-center gap-1 border border-[#30363d] transition-all"
                          title="Copy code snippet to clipboard"
                        >
                          {copiedId === msg.id ? <Check className="h-3 w-3 text-[#3fb950]" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        {workspaceScope === 'sandbox' && (
                          <button
                            onClick={() => handleApply(msg.codeSnippet!, msg.id)}
                            className="px-2 py-0.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-[10px] flex items-center gap-1 active:scale-95 transition-all shadow"
                            title="Apply patch directly into active file & auto-save"
                          >
                            {appliedId === msg.id ? <Check className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                            <span>{appliedId === msg.id ? 'Applied!' : 'Apply Patch'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <pre className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl overflow-x-auto text-[11px] text-[#79c0ff] leading-relaxed">
                      <code>{msg.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isAiLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#161b22] border border-[#30363d] text-[#58a6ff] w-fit shadow-md">
            <Sparkles className="h-4 w-4 animate-spin" />
            <span className="text-xs font-mono font-semibold">
              {AI_PROVIDERS[aiConfig.provider]?.shortName || 'Local AI'} is thinking...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Prompt Input Strip */}
      <div className="p-2.5 bg-[#161b22] border-t border-[#30363d] flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Camera Scanner Button */}
          <button
            type="button"
            onClick={onOpenScanner}
            title="Scan Code Photo with Camera or Upload Image"
            className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-[#79c0ff] border border-[#30363d] transition-all active:scale-95 flex items-center justify-center shrink-0 min-h-[38px] min-w-[38px]"
          >
            <Camera className="h-4 w-4" />
          </button>

          {/* Prompt Input */}
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Ask ${AI_PROVIDERS[aiConfig.provider]?.shortName || 'Copilot'} to inspect, write, or fix code...`}
            disabled={isAiLoading}
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!prompt.trim() || isAiLoading}
            className="p-2 px-3.5 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white disabled:opacity-40 transition-all font-mono text-xs font-bold active:scale-95 shadow-md flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
