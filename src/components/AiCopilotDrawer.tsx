import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  Copy,
  Check,
  PlusCircle,
  FileCode,
  X,
  RefreshCw,
  Cpu,
  Zap,
  Sliders,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Code2,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProjectFile, AiProviderType, AiCopilotConfig } from '../types';
import {
  AI_PROVIDERS,
  DEFAULT_AI_CONFIG,
  getSavedAiConfig,
  saveAiConfig,
  testAiConnection,
  requestAiAssist
} from '../utils/aiCopilotService';
import { copyToClipboard } from '../utils/clipboard';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  codeSnippet?: string;
  timestamp: string;
  provider?: string;
  model?: string;
}

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  activeFile?: ProjectFile | null;
  onAddFileToWorkspace?: (file: ProjectFile) => void;
  onInsertCodeSnippet?: (code: string) => void;
  onOpenFullSettings?: () => void;
}

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  files,
  activeFile,
  onAddFileToWorkspace,
  onInsertCodeSnippet,
  onOpenFullSettings
}) => {
  const [config, setConfig] = useState<AiCopilotConfig>(getSavedAiConfig());
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: "👋 Hi! I'm your UmaKraft AI Assistant.\n\nAsk me anything about Android Kotlin, Compose, C++ JNI bridges, Sora Editor, Termux PTY, Gradle, or XML layouts. I can generate complete code snippets and help you debug or export files straight to your workspace!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      provider: getSavedAiConfig().provider,
      model: getSavedAiConfig().model
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportedId, setExportedId] = useState<string | null>(null);
  const [showConfigPopover, setShowConfigPopover] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setConfig(getSavedAiConfig());
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages]);

  const currentProviderMeta = AI_PROVIDERS[config.provider];

  const handleProviderChange = (prov: AiProviderType) => {
    const meta = AI_PROVIDERS[prov];
    const newCfg: AiCopilotConfig = {
      ...config,
      provider: prov,
      model: meta.defaultModel,
      customEndpoint: meta.defaultEndpoint || config.customEndpoint
    };
    setConfig(newCfg);
    saveAiConfig(newCfg);
  };

  const handleSendMessage = async (text?: string) => {
    const query = (text || inputPrompt).trim();
    if (!query || isSynthesizing) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsSynthesizing(true);

    try {
      // Build context from active file if present
      const fileContext = activeFile
        ? `Active File: ${activeFile.path}\nLanguage: ${activeFile.language || 'text'}\nFile Content Preview:\n${activeFile.content.slice(0, 1500)}`
        : 'Project Context: Umakraft TermuxXCoder IDE';

      const result = await requestAiAssist({
        prompt: query,
        context: fileContext,
        configOverride: config
      });

      const reply = result.reply || 'No output received from Copilot.';
      const codeMatch = reply.match(/```(?:kotlin|java|cpp|yaml|groovy|json|kts|bash|sh|xml|tsx|ts)?\n([\s\S]*?)```/);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        codeSnippet: codeMatch ? codeMatch[1].trim() : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        provider: currentProviderMeta.shortName,
        model: config.model
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **AI Copilot Error (${currentProviderMeta.shortName}):** ${err.message || 'Connection failed. Please check your API key or use Qwen 1.5 Local AI.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCode = (id: string, codeSnippet: string) => {
    if (!onAddFileToWorkspace) return;
    const isCpp = codeSnippet.includes('#include') || codeSnippet.includes('JNIEXPORT');
    const isYml = codeSnippet.includes('name:') || codeSnippet.includes('runs-on:');
    const isXml = codeSnippet.includes('<?xml') || codeSnippet.includes('xmlns:android');

    const filename = isCpp
      ? `native-bridge-${Date.now().toString().slice(-4)}.cpp`
      : isYml
      ? `workflow-${Date.now().toString().slice(-4)}.yml`
      : isXml
      ? `layout_${Date.now().toString().slice(-4)}.xml`
      : `AiModule_${Date.now().toString().slice(-4)}.kt`;

    const newFile: ProjectFile = {
      name: filename,
      path: `workspace/generated/${filename}`,
      content: codeSnippet,
      category: 'generated',
      language: isCpp ? 'cpp' : isYml ? 'yaml' : isXml ? 'xml' : 'kotlin',
      module: 'ai-drawer'
    };

    onAddFileToWorkspace(newFile);
    setExportedId(id);
    confetti({ particleCount: 30, spread: 45, origin: { y: 0.7 } });
    setTimeout(() => setExportedId(null), 3000);
  };

  const quickPrompts = [
    { label: '🔍 Fix Code', prompt: 'Review my code for potential bugs, memory leaks, and Android 14 Scoped Storage issues.' },
    { label: '⚡ Optimize', prompt: 'Optimize this routine for background coroutines and high performance.' },
    { label: '🎨 Compose UI', prompt: 'Create a Jetpack Compose screen with a TopAppBar, LazyColumn cards, and a FloatingActionButton.' },
    { label: '🌉 POSIX JNI', prompt: 'Show a C++ JNI bridge using forkpty for Android terminal emulation.' }
  ];

  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleDrawerTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartPosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };

  const handleDrawerTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartPosRef.current.x;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartPosRef.current.y);

    // Swipe right (deltaX > 60) closes the right-side drawer
    if (deltaX > 60 && deltaY < 80) {
      onClose();
    }
    touchStartPosRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div
        className="relative w-full max-w-lg md:max-w-xl h-full bg-[#0d1117] border-l border-[#30363d] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200"
        onTouchStart={handleDrawerTouchStart}
        onTouchEnd={handleDrawerTouchEnd}
      >
        {/* Drawer Header */}
        <div className="px-3.5 py-2.5 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#1f6feb] via-[#a371f7] to-[#238636] p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="h-full w-full bg-[#0d1117] rounded-[10px] flex items-center justify-center">
                <Bot className="h-4 w-4 text-[#58a6ff]" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-[#f0f6fc] font-mono tracking-tight truncate">
                  UMAKRAFT COPILOT
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#3fb950]/30 font-semibold shrink-0">
                  {config.provider === 'qwen_local' ? 'Local AI' : currentProviderMeta.shortName}
                </span>
              </div>
              <p className="text-[10px] text-[#8b949e] font-mono truncate">
                {config.model}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Engine Selector Pill */}
            <button
              onClick={() => setShowConfigPopover(!showConfigPopover)}
              className={`px-2.5 py-1 min-h-[34px] rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showConfigPopover
                  ? 'bg-[#1f6feb] text-white border-[#58a6ff]'
                  : 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white border-[#30363d]'
              }`}
              title="Change AI Engine"
            >
              <Sliders className="h-3.5 w-3.5 text-[#58a6ff]" />
              <span className="text-[11px]">Engine</span>
            </button>

            {/* Close Drawer Button */}
            <button
              onClick={onClose}
              className="p-1.5 min-h-[34px] min-w-[34px] rounded-xl bg-[#21262d] hover:bg-[#da3633]/20 text-[#8b949e] hover:text-[#ff7b72] border border-[#30363d] hover:border-[#da3633]/50 flex items-center justify-center transition-all"
              title="Close Drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Engine Switcher Compact Accordion */}
        {showConfigPopover && (
          <div className="bg-[#161b22] border-b border-[#30363d] p-2.5 animate-in fade-in space-y-2 flex-shrink-0">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#f0f6fc]">
              <span>Select AI Provider Engine</span>
              {onOpenFullSettings && (
                <button
                  onClick={() => {
                    setShowConfigPopover(false);
                    onOpenFullSettings();
                  }}
                  className="text-[10px] text-[#58a6ff] hover:underline"
                >
                  Full AI Hub Settings &rarr;
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(AI_PROVIDERS) as AiProviderType[]).map((pKey) => {
                const p = AI_PROVIDERS[pKey];
                const isSelected = config.provider === pKey;
                return (
                  <button
                    key={pKey}
                    onClick={() => {
                      handleProviderChange(pKey);
                      setShowConfigPopover(false);
                    }}
                    className={`p-1.5 rounded-lg text-left border transition-all text-[11px] flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#1f6feb]/20 border-[#58a6ff] text-white font-bold ring-1 ring-[#58a6ff]'
                        : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
                    }`}
                  >
                    <span className="truncate font-semibold text-[11px]">{p.shortName}</span>
                    <span className="text-[8.5px] font-normal text-[#8b949e] truncate">
                      {p.requiresKey ? 'Key req.' : 'Offline'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Workspace Isolation Rule Micro Banner */}
        <div className="bg-[#0d1117] px-3 py-1 border-b border-[#30363d]/80 flex items-center justify-between text-[10px] text-[#8b949e] font-mono flex-shrink-0">
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-[#58a6ff]" />
            <span className="truncate">Target: <strong>sandbox/</strong></span>
          </div>
          {activeFile && (
            <span className="text-[10px] text-[#58a6ff] bg-[#161b22] px-1.5 py-0.5 rounded border border-[#30363d] truncate max-w-[150px]">
              {activeFile.name}
            </span>
          )}
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 font-sans text-xs sm:text-sm">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-[#8b949e] px-1">
                  <span>{isUser ? 'You' : msg.provider ? `Copilot (${msg.provider})` : 'Copilot'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-3.5 shadow-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#1f6feb] text-white rounded-br-none'
                      : 'bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap select-text font-sans">{msg.text}</div>

                  {/* Extracted Code Box if Present */}
                  {msg.codeSnippet && !isUser && (
                    <div className="mt-3 bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden shadow-inner">
                      <div className="px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#58a6ff] font-bold">
                          <Code2 className="h-3.5 w-3.5" />
                          <span>Generated Code</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {onInsertCodeSnippet && (
                            <button
                              onClick={() => onInsertCodeSnippet(msg.codeSnippet!)}
                              className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-white text-[10px] font-semibold transition-colors"
                              title="Insert directly into active editor"
                            >
                              Insert
                            </button>
                          )}
                          {onAddFileToWorkspace && (
                            <button
                              onClick={() => handleExportCode(msg.id, msg.codeSnippet!)}
                              className="px-2 py-0.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-[10px] font-semibold transition-colors flex items-center gap-1"
                              title="Export snippet to workspace file"
                            >
                              {exportedId === msg.id ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  <span>Saved</span>
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="h-3 w-3" />
                                  <span>Export</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyText(msg.id, msg.codeSnippet!)}
                            className="p-1 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-white"
                            title="Copy code"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3.5 w-3.5 text-[#3fb950]" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <pre className="p-3 font-mono text-[11px] sm:text-xs text-[#58a6ff] overflow-x-auto select-text leading-snug">
                        {msg.codeSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSynthesizing && (
            <div className="flex items-center gap-2 text-xs text-[#58a6ff] font-mono p-2 bg-[#161b22] border border-[#30363d] rounded-xl w-fit animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>{currentProviderMeta.shortName} is generating response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-2.5 py-1.5 bg-[#161b22] border-t border-[#30363d] flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.prompt)}
              className="px-2 py-0.5 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff]/40 text-[#c9d1d9] hover:text-white text-[10.5px] font-mono whitespace-nowrap transition-all active:scale-95"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-2.5 bg-[#161b22] border-t border-[#30363d] flex-shrink-0 space-y-1.5">
          <div className="relative flex items-center">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask ${config.provider === 'qwen_local' ? 'Local AI' : currentProviderMeta.shortName}...`}
              className="w-full pl-3 pr-11 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs sm:text-sm text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#58a6ff] font-sans resize-none max-h-24"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSynthesizing || !inputPrompt.trim()}
              className="absolute right-1.5 p-1.5 bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-40 text-white rounded-lg shadow transition-all active:scale-95 flex items-center justify-center min-h-[32px] min-w-[32px]"
              title="Send Prompt"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[9.5px] text-[#8b949e] font-mono px-1">
            <span className="truncate">Core: {currentProviderMeta.shortName}</span>
            <span className="shrink-0">Workspace Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
