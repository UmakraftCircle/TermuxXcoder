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
  ArrowRight
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

interface AiCustomizerTabProps {
  files: ProjectFile[];
  onAddFile: (newFile: ProjectFile) => void;
}

export const AiCustomizerTab: React.FC<AiCustomizerTabProps> = ({ files, onAddFile }) => {
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

  const presets = [
    {
      title: '🔍 Check Code & Diagnose (What’s Wrong & How To Fix)',
      query: 'Check this Android Kotlin & C++ code for syntax errors, memory leaks, and Scoped Storage violations. Tell me what is wrong and how it should be done.'
    },
    {
      title: '🛠️ Android 10-14 Security & Scoped Storage Audit',
      query: 'Audit code for Android 10+ (API 29-34) Scoped Storage compliance, main thread blocking, and background coroutine dispatching.'
    },
    {
      title: 'Qwen 1.5 Local: Android 14 PTY Bridge',
      query: 'Generate an Android 10+ (API 29-34) POSIX forkpty JNI bridge in C++ with termios window size struct.'
    },
    {
      title: 'Sora Editor 0.23.5 TextMate Integration',
      query: 'How to implement TextMate grammar and Darcula color scheme loading in Sora Editor CodeEditor widget?'
    },
    {
      title: 'GitHub Actions Multi-ABI Matrix CI',
      query: 'Generate a GitHub Actions workflow to build release APKs in parallel for arm64-v8a, armeabi-v7a, and x86_64.'
    },
    {
      title: 'JGit Scoped Storage Access Framework',
      query: 'Write a Kotlin handler for DocumentFile SAF Uri resolution with JGit in-memory repository cloning.'
    }
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

      const codeMatch = replyText.match(/```(?:kotlin|java|cpp|yaml|groovy|json|kts)?\n([\s\S]*?)```/);
      if (codeMatch) {
        setExtractedCode(codeMatch[1].trim());
      }
    } catch (err: any) {
      setResponse(`AI Copilot (${currentProviderMeta.shortName}): ${err.message || 'Please check your API key or use Local AI (Qwen 1.5).'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response);
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bento Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#1f6feb] via-[#a371f7] to-[#238636] p-0.5 shadow-md flex-shrink-0">
            <div className="h-full w-full bg-[#161b22] rounded-[14px] flex items-center justify-center">
              <Bot className="h-5 w-5 text-[#58a6ff]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc]">
                UmaKraft AI Copilot Hub
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30">
                1.5 Qwen Local + Multi-Provider
              </span>
            </div>
            <p className="text-xs text-[#8b949e]">
              Default 100% offline Qwen 1.5 Coder or manually load API keys for Groq, OpenAI, OpenRouter, OpenCode & Gemini.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] text-xs font-semibold rounded-xl border border-[#30363d] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Pinging...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={handleSaveConfig}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold rounded-xl border border-[#3fb950]/30 shadow-md transition-transform active:scale-95"
          >
            <Check className="h-4 w-4" />
            <span>{savedBanner ? 'Saved!' : 'Save Config'}</span>
          </button>
        </div>
      </div>

      {/* App Rule: Immutable Edit Scope Lock Banner */}
      <div className="bg-[#161b22] border border-[#1f6feb]/30 rounded-2xl p-4 shadow-sm flex items-start gap-3 bg-gradient-to-r from-[#1f6feb]/10 via-[#161b22] to-[#161b22]">
        <div className="p-2 rounded-xl bg-[#1f6feb]/20 text-[#58a6ff] shrink-0 mt-0.5">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-[#f0f6fc]">
              App Rule Active: Sandbox & Workspace Isolation
            </h3>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30 font-semibold">
              IMMUTABLE
            </span>
          </div>
          <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
            The AI Copilot is strictly restricted to editing files inside the <strong>Sandbox</strong> and <strong>project workspaces</strong>. Internal app files, core system UI, storage vault, and app settings are permanently read-only and cannot be modified by AI under any circumstances.
          </p>
        </div>
      </div>

      {/* Provider Selector Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">
            1. Select Copilot Engine
          </h3>
          <span className="text-[11px] text-[#8b949e]">
            Active: <strong className="text-[#58a6ff]">{currentProviderMeta.name}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.keys(AI_PROVIDERS) as AiProviderType[]).map((provKey) => {
            const prov = AI_PROVIDERS[provKey];
            const isSelected = config.provider === provKey;
            return (
              <button
                key={provKey}
                type="button"
                onClick={() => handleProviderSelect(provKey)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
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
                  <p className="text-[11px] text-[#8b949e] truncate leading-relaxed">
                    {prov.tagline}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#30363d]/50 flex items-center justify-between text-[10px]">
                  <span className="text-[#8b949e] truncate">{prov.requiresKey ? 'API Key' : 'Free / Local'}</span>
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
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4 shadow-sm">
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
            className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Get API Key & Documentation</span>
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
                  className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff] pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8b949e] hover:text-[#f0f6fc]"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-[#238636]/10 border border-[#238636]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#3fb950]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <div>
                <strong>Local Engine Active:</strong> No API key required for Qwen 1.5 Coder. Fully executes on-device with zero network latency.
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
              className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff]"
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
              className="w-full px-3.5 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff]"
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
                  Ping round-trip: {testResult.latencyMs}ms
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preset Prompts Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">
          2. Quick Android & DevOps Code Prompts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(preset.query);
                handleSendPrompt(preset.query);
              }}
              className="text-left p-3.5 rounded-2xl bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff]/50 text-xs transition-all group shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-[#c9d1d9] group-hover:text-[#58a6ff] transition-colors">
                  {preset.title}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[#8b949e] group-hover:text-[#58a6ff] transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="text-[11px] text-[#8b949e] line-clamp-2">{preset.query}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Prompt Generator Box */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">
          3. Ask {currentProviderMeta.shortName} Copilot
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendPrompt(prompt);
            }}
            placeholder={`Ask ${currentProviderMeta.shortName} about Android Kotlin, C++ PTY, Sora Editor, or GitHub CI...`}
            className="flex-1 px-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] font-mono"
          />
          <button
            onClick={() => handleSendPrompt(prompt)}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white font-semibold text-xs rounded-xl transition-all border border-[#388bfd]/50 disabled:opacity-50 shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isLoading ? 'Synthesizing...' : 'Generate'}</span>
          </button>
        </div>
      </div>

      {/* AI Copilot Response Output */}
      {response && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-md animate-in fade-in">
          <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#58a6ff]" />
              <span className="text-xs font-bold text-[#f0f6fc]">
                {currentProviderMeta.shortName} Output ({config.model})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {extractedCode && (
                <button
                  onClick={handleExportAsFile}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold rounded-xl shadow-sm transition-transform active:scale-95"
                >
                  {exportedSuccess ? <Check className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
                  <span>{exportedSuccess ? 'Added to Files!' : 'Export into Workspace'}</span>
                </button>
              )}
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white text-xs font-semibold rounded-xl border border-[#30363d] flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#3fb950]" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-[#0d1117] font-mono text-xs text-[#c9d1d9] whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
            {response}
          </div>
        </div>
      )}
    </div>
  );
};
