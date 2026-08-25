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
  FileCode2,
  Zap,
  Volume2,
  VolumeX,
  Square,
  Mic,
  MicOff,
  Globe,
  Loader2,
  GitCompare,
  BookOpen,
  Send,
  Wand2,
  Bug,
  Code,
  Brain,
  Layers,
  Columns2,
  Rows,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ProjectFile, AiCopilotConfig, CopilotLayoutMode } from '../types';
import { AI_PROVIDERS, getIsUnrestrainedMode, setIsUnrestrainedMode } from '../utils/aiCopilotService';
import { speechService, VoiceOption } from '../utils/speechService';
import { copyToClipboard } from '../utils/clipboard';
import { AiMemoryRagModal } from './AiMemoryRagModal';
import confetti from 'canvas-confetti';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  codeSnippet?: string;
  timestamp: string;
  providerBadge?: string;
  groundedSources?: { title: string; url: string }[];
  autoApplied?: boolean;
}

export type { CopilotLayoutMode };

interface UmakraftAiCopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  layoutMode?: CopilotLayoutMode;
  onChangeLayoutMode?: (mode: CopilotLayoutMode) => void;
  currentFile: ProjectFile | null;
  allFiles?: ProjectFile[];
  onSelectSnippetFile?: (path: string) => void;
  workspaceScope: 'sandbox' | 'app';
  messages: ChatMessage[];
  onSendMessage: (
    promptText?: string,
    image?: { data: string; mimeType?: string },
    useWebSearch?: boolean
  ) => Promise<void>;
  isAiLoading: boolean;
  aiConfig: AiCopilotConfig;
  onOpenAiSettings: () => void;
  onApplyCode: (code: string) => void;
  onOpenScanner: () => void;
  onOpenWebSearchModal?: () => void;
  editorContent: string;
  unrestrainedMode?: boolean;
  onToggleUnrestrainedMode?: (enabled: boolean) => void;
}

export const UmakraftAiCopilotPanel: React.FC<UmakraftAiCopilotPanelProps> = ({
  isOpen,
  onClose,
  layoutMode = 'split',
  onChangeLayoutMode,
  currentFile,
  allFiles = [],
  onSelectSnippetFile,
  workspaceScope,
  messages,
  onSendMessage,
  isAiLoading,
  aiConfig,
  onOpenAiSettings,
  onApplyCode,
  onOpenScanner,
  onOpenWebSearchModal,
  editorContent,
  unrestrainedMode: propUnrestrainedMode,
  onToggleUnrestrainedMode
}) => {
  const [prompt, setPrompt] = useState('');
  const [webSearchGrounded, setWebSearchGrounded] = useState<boolean>(false);
  const [activeDiffSnippet, setActiveDiffSnippet] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState<boolean>(false);

  // Unrestrained Sandbox Modification State
  const [isUnrestrained, setIsUnrestrained] = useState<boolean>(() => {
    if (propUnrestrainedMode !== undefined) return propUnrestrainedMode;
    return getIsUnrestrainedMode();
  });

  useEffect(() => {
    if (propUnrestrainedMode !== undefined) {
      setIsUnrestrained(propUnrestrainedMode);
    }
  }, [propUnrestrainedMode]);

  const handleToggleUnrestrained = () => {
    const nextState = !isUnrestrained;
    setIsUnrestrained(nextState);
    setIsUnrestrainedMode(nextState);
    if (onToggleUnrestrainedMode) {
      onToggleUnrestrainedMode(nextState);
    }
    if (nextState) {
      confetti({ particleCount: 30, spread: 45, origin: { y: 0.5 } });
    }
  };

  // Voice & Speech States
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState<boolean>(Boolean(aiConfig.autoSpeak));
  const [speechRate, setSpeechRate] = useState<number>(aiConfig.speechRate || 1.0);
  const [showVoiceControls, setShowVoiceControls] = useState<boolean>(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(aiConfig.selectedVoiceURI || '');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);

  // Subscribe to speech state changes
  useEffect(() => {
    const unsubSpeech = speechService.onSpeakingStateChange((speaking, msgId) => {
      setIsSpeaking(speaking);
      setSpeakingMessageId(msgId);
    });

    const unsubListen = speechService.onListeningStateChange((listening) => {
      setIsListening(listening);
    });

    if (speechService.isTtsSupported()) {
      const avail = speechService.getAvailableVoices();
      setVoices(avail);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
          setVoices(speechService.getAvailableVoices());
        };
      }
    }

    return () => {
      unsubSpeech();
      unsubListen();
      speechService.stop();
      speechService.stopListening();
    };
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiLoading, isOpen]);

  // Auto-speak new AI replies if enabled
  useEffect(() => {
    if (!autoSpeakEnabled || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender === 'ai' && lastMsg.id !== lastSpokenMessageIdRef.current) {
      lastSpokenMessageIdRef.current = lastMsg.id;
      handleSpeakMessage(lastMsg.text, lastMsg.id);
    }
  }, [messages, autoSpeakEnabled]);

  if (!isOpen) return null;

  const handleCopyCode = (snippet: string, msgId: string) => {
    copyToClipboard(snippet);
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
    onSendMessage(text, undefined, webSearchGrounded);
  };

  // Voice Speaking Handler
  const handleSpeakMessage = (text: string, msgId: string) => {
    if (isSpeaking && speakingMessageId === msgId) {
      speechService.stop();
      return;
    }

    speechService.speak(text, msgId, {
      rate: speechRate,
      voiceURI: selectedVoice || undefined,
      onError: (err) => console.error('Speech synthesis error:', err)
    });
  };

  const handleStopSpeaking = () => {
    speechService.stop();
  };

  // Voice Dictation / Mic Handler
  const handleToggleListening = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      return;
    }

    speechService.startListening(
      (transcript) => {
        setPrompt(transcript);
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  // Simple diff generator for visual inspection
  const renderSimpleDiff = (snippet: string) => {
    const originalLines = (editorContent || '').split('\n').slice(0, 25);
    const newLines = snippet.split('\n').slice(0, 25);

    return (
      <div className="bg-[#090d13] border border-[#30363d] rounded-xl overflow-hidden text-[11px] font-mono shadow-md">
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
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#30363d] max-h-56 overflow-y-auto">
          {/* Current Code */}
          <div className="p-2 bg-[#161b22]/40">
            <div className="text-[10px] text-[#ff7b72] font-bold mb-1 flex items-center gap-1">
              <span>- Current Buffer:</span>
            </div>
            <pre className="text-[#8b949e] leading-relaxed whitespace-pre-wrap">
              {originalLines.join('\n')}
              {originalLines.length >= 25 && '\n... (truncated)'}
            </pre>
          </div>
          {/* Proposed Code */}
          <div className="p-2 bg-[#238636]/10">
            <div className="text-[10px] text-[#3fb950] font-bold mb-1 flex items-center gap-1">
              <span>+ AI Proposed Patch:</span>
            </div>
            <pre className="text-[#7ee787] leading-relaxed whitespace-pre-wrap">
              {newLines.join('\n')}
              {newLines.length >= 25 && '\n... (truncated)'}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  const providerName = AI_PROVIDERS[aiConfig.provider]?.shortName || 'GEMINI 3.7';

  const containerClasses =
    layoutMode === 'full'
      ? 'absolute inset-0 bg-[#0d1117]/98 backdrop-blur-md z-30 flex flex-col p-2 sm:p-3 overflow-hidden border border-[#58a6ff]/30 shadow-2xl rounded-2xl animate-in fade-in duration-150'
      : 'h-full w-full bg-[#0d1117] flex flex-col p-2 sm:p-3 overflow-hidden border-0 shadow-none animate-in fade-in duration-150';

  return (
    <div className={containerClasses} id="umakraft-ai-copilot-container">
      {/* 1. Bold, Clean & Crisp Header */}
      <div className="bg-[#161b22] px-3 py-2 border border-[#30363d] rounded-xl flex items-center justify-between flex-shrink-0 gap-2 shadow-sm">
        {/* Left: Bold App Title & Model Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#1f6feb] to-[#a371f7] text-white shadow-md shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <h2 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase font-mono truncate">
              AI COPILOT
            </h2>
            <button
              onClick={onOpenAiSettings}
              title="Change AI Engine, API Key, or Toggle Local Qwen"
              className="px-2 py-0.5 rounded-md bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#58a6ff] hover:text-white text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 shrink-0"
            >
              <Bot className="h-3 w-3 text-[#58a6ff]" />
              <span className="truncate max-w-[80px] sm:max-w-[110px]">{providerName}</span>
            </button>
            <span className="h-2 w-2 rounded-full bg-[#3fb950] animate-pulse shrink-0 hidden md:inline-block" title="Ready & Connected" />
          </div>
        </div>

        {/* Right: Unrestrained Mode Toggle, Layout Switcher & Close Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Unrestrained Mode Toggle Button in Header */}
          <button
            type="button"
            onClick={handleToggleUnrestrained}
            title={
              isUnrestrained
                ? '⚡ Unrestrained Mode: ON (AI automatically updates and fixes sandbox files). Click to switch to Guarded Mode.'
                : '🛡️ Guarded Mode: Manual review before applying code. Click to switch to Unrestrained Mode.'
            }
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border transition-all active:scale-95 shrink-0 ${
              isUnrestrained
                ? 'bg-[#ffa657]/20 text-[#ffa657] border-[#ffa657]/50 shadow-sm shadow-[#ffa657]/20 ring-1 ring-[#ffa657]/30'
                : 'bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] border-[#30363d]'
            }`}
          >
            <Zap className={`h-3 w-3 ${isUnrestrained ? 'text-[#ffa657] fill-[#ffa657]' : ''}`} />
            <span className="hidden sm:inline">{isUnrestrained ? 'UNRESTRAINED' : 'GUARDED'}</span>
          </button>

          {/* Layout Mode Selector (Side-by-Side Split / Bottom Dock / Full Focus) */}
          {onChangeLayoutMode && (
            <div className="hidden sm:flex items-center bg-[#21262d] p-0.5 rounded-lg border border-[#30363d] gap-0.5">
              <button
                type="button"
                onClick={() => onChangeLayoutMode('split')}
                title="Side-by-Side Split Layout (Code on left, AI on right - No Overlap)"
                className={`p-1 rounded text-xs transition-colors ${
                  layoutMode === 'split' ? 'bg-[#1f6feb] text-white shadow-sm' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <Columns2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChangeLayoutMode('bottom')}
                title="Bottom Dock Layout (Code on top, AI on bottom)"
                className={`p-1 rounded text-xs transition-colors ${
                  layoutMode === 'bottom' ? 'bg-[#1f6feb] text-white shadow-sm' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <Rows className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChangeLayoutMode('full')}
                title="Full Focus Overlay"
                className={`p-1 rounded text-xs transition-colors ${
                  layoutMode === 'full' ? 'bg-[#1f6feb] text-white shadow-sm' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            title="Close AI Copilot"
            className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#da3633]/30 text-[#8b949e] hover:text-white border border-[#30363d] hover:border-[#da3633]/50 transition-all active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Voice Controls Bar (if opened) */}
      {showVoiceControls && (
        <div className="bg-[#161b22] px-3 py-1.5 my-1.5 border border-[#30363d] rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-[#c9d1d9] text-[11px]">
              <input
                type="checkbox"
                checked={autoSpeakEnabled}
                onChange={(e) => setAutoSpeakEnabled(e.target.checked)}
                className="rounded border-[#30363d] bg-[#0d1117] text-[#58a6ff] focus:ring-0"
              />
              <span>Auto-Read Answers</span>
            </label>

            {/* Speech Rate */}
            <div className="flex items-center gap-1 text-[11px] text-[#8b949e]">
              <span>Speed:</span>
              {[0.8, 1.0, 1.2, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    speechRate === rate
                      ? 'bg-[#1f6feb] text-white font-bold'
                      : 'bg-[#21262d] text-[#8b949e] hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {isSpeaking && (
            <button
              onClick={handleStopSpeaking}
              className="px-2 py-0.5 rounded-lg bg-[#da3633] text-white text-[10px] font-bold flex items-center gap-1 shadow animate-pulse"
            >
              <Square className="h-2.5 w-2.5 fill-current" />
              <span>Stop Speaking</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Main Body: Top-to-Bottom Icon Dock on Top-Left + Messages on Right */}
      <div className="flex-1 min-h-0 flex flex-col sm:flex-row gap-1.5 sm:gap-2 pt-1 pb-1">
        {/* RESPONSIVE ICON TOOLBAR: Horizontal ribbon on mobile, vertical side dock on sm+ screens */}
        <div className="flex flex-row sm:flex-col gap-1.5 p-1 sm:p-1.5 bg-[#161b22] border border-[#30363d] rounded-xl shrink-0 items-center justify-start overflow-x-auto sm:overflow-y-auto scrollbar-none shadow-md w-full sm:w-12">
          {/* 1. CAMERA SCAN CODE PHOTO (Top-Left Icon) */}
          <button
            onClick={onOpenScanner}
            disabled={isAiLoading}
            title="Scan Code Photo (Camera / Image Vision)"
            className="p-2 min-h-[38px] min-w-[38px] rounded-xl bg-[#58a6ff]/20 hover:bg-[#58a6ff]/35 text-[#58a6ff] hover:text-white border border-[#58a6ff]/50 transition-all active:scale-95 disabled:opacity-40 shadow-sm flex items-center justify-center shrink-0"
          >
            <Camera className="h-4 w-4" />
          </button>

          {/* 2. CHECK CODE & FIX (1-Tap Audit & Fix) */}
          <button
            onClick={() =>
              onSendMessage(
                "Check this code thoroughly. Tell me what's wrong, why it's an issue, how it should be done correctly, and provide the fully fixed code.",
                undefined,
                webSearchGrounded
              )
            }
            disabled={isAiLoading}
            title="Check Code & Auto-Fix"
            className="p-2 min-h-[38px] min-w-[38px] rounded-xl bg-[#e3b341]/15 hover:bg-[#e3b341]/30 text-[#e3b341] hover:text-[#f0e6c8] border border-[#e3b341]/40 transition-all active:scale-95 disabled:opacity-40 shadow-sm flex items-center justify-center shrink-0"
          >
            <ShieldCheck className="h-4 w-4" />
          </button>

          {/* 3. WEB GROUNDING TOGGLE */}
          <button
            onClick={() => setWebSearchGrounded(!webSearchGrounded)}
            title={webSearchGrounded ? 'Web Grounding is ON' : 'Turn ON Web Search Grounding'}
            className={`p-2 min-h-[38px] min-w-[38px] rounded-xl border transition-all active:scale-95 flex items-center justify-center shrink-0 ${
              webSearchGrounded
                ? 'bg-[#1f6feb] text-white border-[#388bfd] shadow-md shadow-[#1f6feb]/30'
                : 'bg-[#21262d] text-[#8b949e] hover:text-[#58a6ff] border-[#30363d]'
            }`}
          >
            <Globe className={`h-4 w-4 ${webSearchGrounded ? 'animate-spin' : ''}`} />
          </button>

          {/* 4. REFACTOR & OPTIMIZE */}
          <button
            onClick={() =>
              onSendMessage(
                'Refactor and optimize this file for maximum speed, clean architecture, and thread safety.',
                undefined,
                webSearchGrounded
              )
            }
            disabled={isAiLoading}
            title="Refactor & Optimize Code"
            className="p-2 min-h-[38px] min-w-[38px] rounded-xl bg-[#21262d] hover:bg-[#ffa657]/20 text-[#8b949e] hover:text-[#ffa657] border border-[#30363d] hover:border-[#ffa657]/40 transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center shrink-0"
          >
            <Zap className="h-4 w-4" />
          </button>

          {/* 5. EXPLAIN CODE */}
          <button
            onClick={() =>
              onSendMessage(
                'Explain line by line what this code does in clear detail.',
                undefined,
                webSearchGrounded
              )
            }
            disabled={isAiLoading}
            title="Explain Active Code"
            className="p-2 min-h-[38px] min-w-[38px] rounded-xl bg-[#21262d] hover:bg-[#d2a8ff]/20 text-[#8b949e] hover:text-[#d2a8ff] border border-[#30363d] hover:border-[#d2a8ff]/40 transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center shrink-0"
          >
            <BookOpen className="h-4 w-4" />
          </button>

          {/* 6. AI MEMORY & RAG KNOWLEDGE BASE */}
          <button
            onClick={() => setIsMemoryModalOpen(true)}
            title="AI Memory & RAG Knowledge"
            className="p-2 min-h-[38px] min-w-[38px] rounded-xl bg-[#21262d] hover:bg-[#a371f7]/20 text-[#8b949e] hover:text-[#d2a8ff] border border-[#30363d] hover:border-[#a371f7]/40 transition-all active:scale-95 flex items-center justify-center shrink-0"
          >
            <Brain className="h-4 w-4" />
          </button>

          {/* 7. VOICE TTS TOGGLE */}
          <button
            onClick={() => setShowVoiceControls(!showVoiceControls)}
            title="Toggle Voice Speech Controls"
            className={`p-2 min-h-[38px] min-w-[38px] rounded-xl border transition-all active:scale-95 flex items-center justify-center shrink-0 ${
              autoSpeakEnabled || isSpeaking
                ? 'bg-[#238636]/20 border-[#238636]/50 text-[#3fb950]'
                : 'bg-[#21262d] text-[#8b949e] hover:text-white border-[#30363d]'
            }`}
          >
            <Volume2 className={`h-4 w-4 ${isSpeaking ? 'animate-pulse text-[#3fb950]' : ''}`} />
          </button>

          {/* Spacer */}
          <div className="hidden sm:block flex-1" />

          {/* 8. AI ENGINE SETTINGS */}
          <button
            onClick={onOpenAiSettings}
            title="AI Engine Settings & Keys"
            className="p-2 min-h-[38px] min-w-[38px] rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] transition-all active:scale-95 flex items-center justify-center shrink-0"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* MESSAGES & CHAT WORKSPACE AREA */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#0d1117]/90 rounded-xl border border-[#30363d]/70 overflow-hidden shadow-inner">
          {/* Active Diff Inspector Panel (If Toggled) */}
          {activeDiffSnippet && (
            <div className="p-2 border-b border-[#30363d] bg-[#090d13]">
              {renderSimpleDiff(activeDiffSnippet)}
            </div>
          )}

          {/* Chat Messages Scroll Container */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 space-y-3 font-mono text-xs select-text">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8b949e] space-y-2.5">
                <div className="p-3 rounded-2xl bg-[#161b22] border border-[#30363d] text-[#58a6ff] shadow-inner">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="font-bold text-white text-sm">AI Copilot Ready</p>
                <p className="text-[11px] max-w-sm text-[#8b949e] leading-relaxed">
                  Use the left icon bar to scan photos, check code, or toggle web grounding. Ask questions or dictate via voice below.
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const isDiagnostic = msg.text.includes("What's Wrong") || msg.text.includes('Identified');
              const isCurrentlySpeakingThis = isSpeaking && speakingMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#8b949e]">
                    <span className="font-bold text-white">{msg.sender === 'user' ? 'You' : msg.providerBadge || 'AI Copilot'}</span>
                    <span>&bull;</span>
                    <span>{msg.timestamp}</span>
                    {isDiagnostic && msg.sender === 'ai' && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/30 text-[9px] font-bold">
                        Diagnosis & Fix
                      </span>
                    )}
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => handleSpeakMessage(msg.text, msg.id)}
                        title={isCurrentlySpeakingThis ? 'Stop speaking' : 'Read aloud'}
                        className={`ml-1 px-1.5 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                          isCurrentlySpeakingThis
                            ? 'bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/40 font-bold'
                            : 'bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d]'
                        }`}
                      >
                        {isCurrentlySpeakingThis ? (
                          <>
                            <Square className="h-2.5 w-2.5 fill-current" />
                            <span>Speaking...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-2.5 w-2.5" />
                            <span>Speak</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div
                    className={`max-w-[95%] p-3 rounded-2xl shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-[#1f6feb] text-white rounded-tr-sm'
                        : isCurrentlySpeakingThis
                        ? 'bg-[#161b22] border-2 border-[#3fb950]/50 text-[#c9d1d9] rounded-tl-sm shadow-[0_0_15px_rgba(63,185,80,0.15)]'
                        : 'bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    {/* Code Snippet Box */}
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
                              title="Inspect diff"
                            >
                              <GitCompare className="h-3 w-3" />
                              <span>Diff</span>
                            </button>
                            <button
                              onClick={() => handleCopyCode(msg.codeSnippet!, msg.id)}
                              className="px-2 py-0.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white font-semibold text-[10px] flex items-center gap-1 border border-[#30363d] transition-all"
                              title="Copy code"
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
                                {appliedId === msg.id ? <Check className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
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
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-mono font-semibold">
                  {webSearchGrounded ? 'Searching web docs & generating...' : `${providerName} is generating...`}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* 3. Bottom Input Bar */}
      <div className="p-2 bg-[#161b22] border border-[#30363d] rounded-xl flex-shrink-0 space-y-1.5 shadow-sm">
        {/* Live Listening Banner */}
        {isListening && (
          <div className="px-3 py-1 rounded-xl bg-[#da3633]/20 border border-[#da3633]/50 text-[#ff7b72] flex items-center justify-between text-xs font-mono animate-pulse">
            <span className="flex items-center gap-2">
              <Mic className="h-3.5 w-3.5 text-[#ff7b72]" />
              <span>Listening to voice... Speak now</span>
            </span>
            <button
              onClick={handleToggleListening}
              className="px-2 py-0.5 rounded bg-[#da3633] text-white text-[10px] font-bold"
            >
              Done
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          {/* Voice Microphone Dictation Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            title={isListening ? 'Stop Listening' : 'Speak to AI (Voice Dictation)'}
            className={`p-2 rounded-xl border transition-all active:scale-95 flex items-center justify-center shrink-0 min-h-[38px] min-w-[38px] ${
              isListening
                ? 'bg-[#da3633] border-[#da3633] text-white shadow-lg animate-pulse'
                : 'bg-[#21262d] hover:bg-[#30363d] text-[#3fb950] hover:text-[#56d364] border-[#30363d]'
            }`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* Prompt Input */}
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              webSearchGrounded
                ? 'Search web docs or ask grounded question...'
                : `Ask ${providerName} to write, debug, or refactor...`
            }
            disabled={isAiLoading}
            className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!prompt.trim() || isAiLoading}
            className="p-2 px-3.5 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white disabled:opacity-40 transition-all font-mono text-xs font-bold active:scale-95 shadow-md flex items-center gap-1.5 shrink-0 min-h-[38px]"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Send</span>
          </button>
        </form>
      </div>

      {/* AI Memory & RAG Knowledge Base Modal */}
      <AiMemoryRagModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        allFiles={allFiles}
        onSelectSnippetFile={onSelectSnippetFile}
      />
    </div>
  );
};
