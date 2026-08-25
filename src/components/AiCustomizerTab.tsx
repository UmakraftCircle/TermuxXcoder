import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Terminal,
  FileCode,
  Check,
  Copy,
  Cpu,
  Layers,
  Zap,
  HelpCircle,
  Bot,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sliders,
  PlusCircle,
  ArrowRight,
  Database,
  Cloud
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProjectFile, AiProviderType, AiCopilotConfig } from '../types';
import { MemoryService } from '../utils/turso/memoryService';
import {
  AI_PROVIDERS,
  DEFAULT_AI_CONFIG,
  getSavedAiConfig,
  saveAiConfig,
  testAiConnection,
  requestAiAssist
} from '../utils/aiCopilotService';

interface AiCustomizerTabProps {
  files: ProjectFile[];
  onAddFile: (newFile: ProjectFile) => void;
  onGoToCoder?: () => void;
}

export const AiCustomizerTab: React.FC<AiCustomizerTabProps> = ({ files, onAddFile, onGoToCoder }) => {
  const [config, setConfig] = useState<AiCopilotConfig>(getSavedAiConfig());
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
  } | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  // Chat/Assist Lab State
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [extractedCode, setExtractedCode] = useState<string | null>(null);
  const [exportedSuccess, setExportedSuccess] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'response' | 'code'>('response');

  useEffect(() => {
    setConfig(getSavedAiConfig());
  }, []);

  const currentProviderMeta = AI_PROVIDERS[config.provider];

  const handleProviderSelect = (provider: AiProviderType) => {
    const meta = AI_PROVIDERS[provider];
    const newCfg: AiCopilotConfig = {
      ...config,
      provider,
      model: meta.defaultModel,
      customEndpoint: meta.defaultEndpoint || config.customEndpoint
    };
    setConfig(newCfg);
    saveAiConfig(newCfg);
    setTestResult(null);
  };

  const handleSaveConfig = () => {
    saveAiConfig(config);
    setSavedBanner(true);
    confetti({ particleCount: 30, spread: 45, origin: { y: 0.6 } });
    setTimeout(() => setSavedBanner(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testAiConnection(config);
      setTestResult(res);
      if (res.success) {
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const quickPromptChips = [
    { label: '🔍 Check & Fix Errors', query: 'Check this Android Kotlin & C++ code for syntax errors, memory leaks, and Scoped Storage violations. Tell me what is wrong and provide the fixed code.' },
    { label: '⚡ Optimize Performance', query: 'Refactor and optimize this code for maximum execution speed, background coroutines, and zero main-thread blocking.' },
    { label: '🛠️ Android 14 Storage Audit', query: 'Audit code for Android 10-14 (API 29-34) Scoped Storage and MediaStore SAF compliance.' },
    { label: '🌉 POSIX forkpty JNI', query: 'Generate an Android 10+ POSIX forkpty JNI bridge in C++ with termios window size handling.' },
    { label: '📜 Explain Line-by-Line', query: 'Explain line by line what this code does in clear, structured detail.' },
    { label: '🚀 GitHub Actions CI Matrix', query: 'Generate a GitHub Actions workflow to build release APKs in parallel for arm64-v8a, armeabi-v7a, and x86_64.' }
  ];

  const handleSendPrompt = async (textToSend?: string) => {
    const query = (textToSend || prompt).trim();
    if (!query) return;

    setIsLoading(true);
    setResponse(null);
    setExtractedCode(null);
    setExportedSuccess(false);

    try {
      const result = await requestAiAssist({
        prompt: query,
        context: 'TermuxXCoder Modular Android & C++ IDE Studio',
        configOverride: config
      });

      const replyText = result.reply || 'No output generated.';
      setResponse(replyText);

      const codeMatch = replyText.match(/```(?:kotlin|java|cpp|yaml|groovy|json|kts|bash|sh|xml)?\n([\s\S]*?)```/);
      if (codeMatch) {
        setExtractedCode(codeMatch[1].trim());
        setActiveOutputTab('code');
      } else {
        setActiveOutputTab('response');
      }
    } catch (err: any) {
      setResponse(`AI Copilot (${currentProviderMeta.shortName}): ${err.message || 'Please check your API key or use Local AI (Qwen 1.5).'}`);
      setActiveOutputTab('response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const contentToCopy = activeOutputTab === 'code' && extractedCode ? extractedCode : response;
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportAsFile = () => {
    if (!extractedCode) return;
    const isCpp = extractedCode.includes('#include') || extractedCode.includes('JNIEXPORT');
    const isYml = extractedCode.includes('name:') || extractedCode.includes('runs-on:');
    const filename = isCpp
      ? `native-bridge-${Date.now().toString().slice(-4)}.cpp`
      : isYml
      ? `ci-workflow-${Date.now().toString().slice(-4)}.yml`
      : `AiGeneratedModule_${Date.now().toString().slice(-4)}.kt`;

    const newFile: ProjectFile = {
      name: filename,
      path: `workspace/generated/${filename}`,
      content: extractedCode,
      category: 'generated',
      language: isCpp ? 'cpp' : isYml ? 'yaml' : 'kotlin',
      module: 'customizer'
    };

    onAddFile(newFile);
    setExportedSuccess(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setExportedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-1 sm:px-2 pb-12">
      {/* Header Bento Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#1f6feb] via-[#a371f7] to-[#238636] p-0.5 shadow-md flex-shrink-0">
            <div className="h-full w-full bg-[#161b22] rounded-[14px] flex items-center justify-center">
              <Bot className="h-5 w-5 text-[#58a6ff]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] truncate">
                UmaKraft AI Copilot Hub
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30 font-semibold">
                Local + Multi-Cloud
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5 line-clamp-2">
              Free offline Qwen 1.5 Coder or bring your keys for Gemini, Groq, OpenAI, OpenRouter & Ollama.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#30363d]/60">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] text-xs font-semibold rounded-xl border border-[#30363d] transition-all disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={handleSaveConfig}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold rounded-xl border border-[#3fb950]/30 shadow-md transition-transform active:scale-95"
          >
            <Check className="h-4 w-4" />
            <span>{savedBanner ? 'Saved!' : 'Save Config'}</span>
          </button>
        </div>
      </div>

      {/* App Rule: Immutable Edit Scope Lock Banner */}
      <div className="bg-[#161b22] border border-[#1f6feb]/30 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-start gap-3 bg-gradient-to-r from-[#1f6feb]/10 via-[#161b22] to-[#161b22]">
        <div className="p-2 rounded-xl bg-[#1f6feb]/20 text-[#58a6ff] shrink-0 mt-0.5">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-[#f0f6fc]">
              Workspace Isolation Active
            </h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30 font-semibold">
              IMMUTABLE
            </span>
          </div>
          <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
            AI code generation and modifications strictly apply to files inside the <strong>Sandbox</strong> and <strong>project workspaces</strong>. Internal system architectures and settings remain safely protected.
          </p>
        </div>
      </div>

      {/* Turso Memory & RAG Status Banner */}
      <div className="bg-[#161b22] border border-[#30363d] hover:border-[#00eb87]/40 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00eb87] to-[#0094f7] p-0.5 flex-shrink-0">
            <div className="h-full w-full bg-[#0d1117] rounded-[10px] flex items-center justify-center">
              <Database className="h-5 w-5 text-[#00eb87]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white font-mono">TURSO SQLite RAG MEMORY</h4>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#00eb87]/20 text-[#00eb87] border border-[#00eb87]/40 font-bold uppercase">
                Active
              </span>
            </div>
            <p className="text-[11px] text-[#8b949e] mt-0.5">
              Long-term memory automatically indexes symbols & architectural rules into prompt queries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="text-[11px] font-mono text-[#8b949e] px-2.5 py-1 rounded-lg bg-[#0d1117] border border-[#30363d]">
            {MemoryService.getKnowledge().length} rules • {MemoryService.getFileIndex().length} files indexed
          </div>
        </div>
      </div>

      {/* Provider Selector Cards Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">
            1. Select Copilot Engine
          </h3>
          <span className="text-[11px] text-[#8b949e]">
            Active: <strong className="text-[#58a6ff]">{currentProviderMeta.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
          {(Object.keys(AI_PROVIDERS) as AiProviderType[]).map((provKey) => {
            const prov = AI_PROVIDERS[provKey];
            const isSelected = config.provider === provKey;
            return (
              <button
                key={provKey}
                type="button"
                onClick={() => handleProviderSelect(provKey)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[96px] active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#1f6feb]/15 border-[#58a6ff] text-[#f0f6fc] shadow-lg shadow-[#1f6feb]/10 ring-1 ring-[#58a6ff]'
                    : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-[#58a6ff]' : 'text-[#c9d1d9]'
                      }`}
                    >
                      {prov.shortName}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-mono font-medium whitespace-nowrap shrink-0 ${prov.badgeColor}`}
                    >
                      {prov.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8b949e] line-clamp-2 leading-relaxed">
                    {prov.tagline}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#30363d]/50 flex items-center justify-between text-[10px]">
                  <span className="text-[#8b949e]">{prov.requiresKey ? 'API Key Required' : 'Offline / Free'}</span>
                  {isSelected ? (
                    <span className="text-[#3fb950] font-bold flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider Details & Key Input Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#30363d]">
          <div>
            <h4 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#d2a8ff]" />
              <span>{currentProviderMeta.name}</span>
            </h4>
            <p className="text-xs text-[#8b949e] mt-0.5">{currentProviderMeta.description}</p>
          </div>
          <a
            href={currentProviderMeta.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1 shrink-0 py-1"
          >
            <span>Get API Key & Docs</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* API Key Box */}
          {currentProviderMeta.requiresKey ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#f0f6fc] flex items-center justify-between">
                <span>Manual API Key</span>
                <span className="text-[10px] text-[#3fb950] font-mono flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Stored Locally
                </span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value.trim() })}
                  placeholder={currentProviderMeta.keyPlaceholder}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff] pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 text-[#8b949e] hover:text-[#f0f6fc] min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-[#238636]/10 border border-[#238636]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#3fb950]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <div>
                <strong>Local Engine Active:</strong> No API key required for Qwen 1.5 Coder. Fast on-device inference with zero cloud latency.
              </div>
            </div>
          )}

          {/* Model Selector Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#f0f6fc]">
              Model Selection
            </label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff]"
            >
              {currentProviderMeta.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.contextWindow})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Endpoint (OpenCode or Ollama) */}
        {(config.provider === 'opencode' || config.provider === 'qwen_local') && (
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-[#f0f6fc] flex items-center justify-between">
              <span>Endpoint Base URL</span>
              <span className="text-[10px] text-[#8b949e]">
                Ollama (`http://localhost:11434/v1`), Together.ai, or LMStudio
              </span>
            </label>
            <input
              type="text"
              value={config.customEndpoint || ''}
              onChange={(e) => setConfig({ ...config, customEndpoint: e.target.value.trim() })}
              placeholder={currentProviderMeta.defaultEndpoint}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff]"
            />
          </div>
        )}

        {/* Test Result Alert */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in ${
              testResult.success
                ? 'bg-[#238636]/15 border-[#3fb950]/40 text-[#3fb950]'
                : 'bg-[#f85149]/15 border-[#f85149]/40 text-[#f85149]'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{testResult.message}</p>
              {testResult.latencyMs && (
                <span className="text-[10px] font-mono opacity-80 mt-0.5 block">
                  Ping latency: {testResult.latencyMs}ms
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preset Prompts Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">
            2. Quick Action Prompts
          </h3>
          <span className="text-[11px] text-[#8b949e]">1-Tap Fill & Run</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {quickPromptChips.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(preset.query);
                handleSendPrompt(preset.query);
              }}
              className="text-left p-3.5 rounded-2xl bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff]/50 text-xs transition-all group shadow-sm flex flex-col justify-between active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-[#c9d1d9] group-hover:text-[#58a6ff] transition-colors">
                  {preset.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[#8b949e] group-hover:text-[#58a6ff] transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="text-[11px] text-[#8b949e] line-clamp-2 leading-relaxed">{preset.query}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive AI Prompt Studio Box */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#58a6ff]" />
            <span>3. Ask {currentProviderMeta.shortName} Copilot</span>
          </h3>
          {prompt && (
            <button
              onClick={() => setPrompt('')}
              className="text-[11px] text-[#8b949e] hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Multi-line Prompt Textarea */}
        <div className="relative">
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSendPrompt(prompt);
              }
            }}
            placeholder={`Ask ${currentProviderMeta.shortName} about Android Kotlin, C++ JNI bridge, Sora Editor, Termux PTY, Gradle, or GitHub CI... (Ctrl+Enter to send)`}
            className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs sm:text-sm text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#58a6ff] font-mono leading-relaxed resize-y min-h-[90px]"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2.5 pt-1">
          <div className="text-[11px] text-[#8b949e] font-mono flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3fb950]" />
            <span>Target: Workspace Files</span>
          </div>

          <button
            onClick={() => handleSendPrompt(prompt)}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-[#1f6feb] hover:bg-[#388bfd] text-white font-semibold text-xs rounded-xl transition-all border border-[#388bfd]/50 disabled:opacity-40 shadow-md active:scale-95"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Generate Solution</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Copilot Response Output */}
      {response && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-lg animate-in fade-in">
          {/* Header Strip with Tabs */}
          <div className="bg-[#161b22] px-3.5 py-2.5 border-b border-[#30363d] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d]">
                <button
                  onClick={() => setActiveOutputTab('response')}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${
                    activeOutputTab === 'response' ? 'bg-[#1f6feb] text-white shadow-sm' : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  Explanation
                </button>
                {extractedCode && (
                  <button
                    onClick={() => setActiveOutputTab('code')}
                    className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors flex items-center gap-1 ${
                      activeOutputTab === 'code' ? 'bg-[#238636] text-white shadow-sm' : 'text-[#8b949e] hover:text-[#3fb950]'
                    }`}
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    <span>Extracted Code</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {extractedCode && (
                <button
                  onClick={handleExportAsFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold rounded-xl shadow-sm transition-transform active:scale-95"
                >
                  {exportedSuccess ? <Check className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
                  <span>{exportedSuccess ? 'Exported!' : 'Export to Workspace'}</span>
                </button>
              )}
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 min-h-[36px] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white text-xs font-semibold rounded-xl border border-[#30363d] flex items-center gap-1.5 transition-colors active:scale-95"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#3fb950]" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-3.5 sm:p-5 bg-[#0d1117] font-mono text-xs sm:text-[13px] text-[#c9d1d9] whitespace-pre-wrap leading-relaxed max-h-[550px] overflow-y-auto select-text">
            {activeOutputTab === 'code' && extractedCode ? extractedCode : response}
          </div>
        </div>
      )}
    </div>
  );
};
