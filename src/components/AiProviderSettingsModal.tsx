import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  KeyRound,
  Zap,
  Server,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Cpu,
  RefreshCw,
  Sliders,
  HelpCircle,
  Bot,
  Terminal,
  ShieldCheck,
  Check,
  RotateCcw,
  Radio,
  Download,
  FolderDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AiProviderType, AiCopilotConfig } from '../types';
import {
  AI_PROVIDERS,
  DEFAULT_AI_CONFIG,
  getSavedAiConfig,
  saveAiConfig,
  testAiConnection
} from '../utils/aiCopilotService';

interface AiProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: AiCopilotConfig) => void;
  onSaveConfig?: (config: AiCopilotConfig) => void;
  currentConfig?: AiCopilotConfig;
}

export const AiProviderSettingsModal: React.FC<AiProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
  onSaveConfig,
  currentConfig
}) => {
  const [config, setConfig] = useState<AiCopilotConfig>(currentConfig || getSavedAiConfig());
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
  } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig || getSavedAiConfig());
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const currentProviderMeta = AI_PROVIDERS[config.provider];

  const handleProviderChange = (provider: AiProviderType) => {
    const meta = AI_PROVIDERS[provider];
    setConfig((prev) => ({
      ...prev,
      provider,
      model: meta.defaultModel,
      customEndpoint: meta.defaultEndpoint || prev.customEndpoint
    }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testAiConnection(config);
      setTestResult(res);
      if (res.success) {
        confetti({ particleCount: 35, spread: 45, origin: { y: 0.5 } });
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

  const handleSave = () => {
    saveAiConfig(config);
    setSavedSuccess(true);
    if (onConfigSaved) onConfigSaved(config);
    if (onSaveConfig) onSaveConfig(config);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.4 } });
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleResetToDefault = () => {
    setConfig(DEFAULT_AI_CONFIG);
    saveAiConfig(DEFAULT_AI_CONFIG);
    setTestResult({
      success: true,
      message: 'Reset to Local AI (Qwen 1.5 Coder) as default copilot.'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[#1f6feb] via-[#a371f7] to-[#238636] p-0.5 shadow-md shrink-0">
              <div className="h-full w-full bg-[#161b22] rounded-[10px] flex items-center justify-center">
                <Bot className="h-5 w-5 text-[#58a6ff]" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-[#f0f6fc] truncate">
                  AI Copilot Settings
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30 whitespace-nowrap inline-flex items-center">
                  Multi-Provider
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e] truncate hidden sm:block">
                Configure Local AI (Qwen 1.5) or load manual API keys for cloud providers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] flex items-center justify-center transition-colors shrink-0 ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          {/* App Rule: Sandbox & Workspace Edit Boundary Notice */}
          <div className="p-3 bg-[#1f6feb]/10 border border-[#1f6feb]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#58a6ff]">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-[#58a6ff]" />
            <div className="flex-1">
              <div className="font-bold text-[#f0f6fc] text-xs">App Rule Enforced: Sandbox Edit Scope</div>
              <p className="text-[11px] text-[#c9d1d9] mt-0.5 leading-relaxed">
                AI Copilot is restricted to editing files inside the <strong>Sandbox</strong> and <strong>project workspaces</strong>. App system files and settings are permanently protected.
              </p>
            </div>
          </div>

          {/* Feature: Unrestrained Sandbox AI Modification Mode */}
          <div className={`p-3 rounded-xl border transition-all ${
            config.unrestrainedMode
              ? 'bg-[#ffa657]/10 border-[#ffa657]/40 text-[#f0f6fc]'
              : 'bg-[#161b22] border-[#30363d] text-[#8b949e]'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${
                  config.unrestrainedMode ? 'bg-[#ffa657] text-black shadow-md' : 'bg-[#21262d] text-[#8b949e]'
                }`}>
                  <Zap className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">⚡ AI Unrestrained Sandbox Mode</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                      config.unrestrainedMode
                        ? 'bg-[#ffa657]/20 text-[#ffa657] border border-[#ffa657]/40'
                        : 'bg-[#21262d] text-[#8b949e] border border-[#30363d]'
                    }`}>
                      {config.unrestrainedMode ? 'ENABLED (AUTO-MODIFY)' : 'OFF (GUARDED REVIEW)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8b949e] mt-0.5 leading-relaxed">
                    When turned on, AI automatically writes, fixes, and applies generated code directly to your sandbox files without requiring manual confirmation. Can be toggled on/off anytime.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, unrestrainedMode: !config.unrestrainedMode })}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5 border ${
                  config.unrestrainedMode
                    ? 'bg-[#ffa657] border-[#ffa657]'
                    : 'bg-[#21262d] border-[#30363d]'
                }`}
                title={config.unrestrainedMode ? 'Click to turn off Unrestrained mode' : 'Click to turn on Unrestrained mode'}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                    config.unrestrainedMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Step 1: Select AI Copilot Provider (Streamlined Responsive Tiles) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">
                1. Select AI Engine
              </label>
              <span className="text-[10px] text-[#8b949e]">
                Active: <strong className="text-[#58a6ff]">{currentProviderMeta.shortName}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(Object.keys(AI_PROVIDERS) as AiProviderType[]).map((provKey) => {
                const prov = AI_PROVIDERS[provKey];
                const isSelected = config.provider === provKey;
                return (
                  <button
                    key={provKey}
                    type="button"
                    onClick={() => handleProviderChange(provKey)}
                    className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all relative flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-[#1f6feb]/15 border-[#58a6ff] text-[#f0f6fc] shadow-md shadow-[#1f6feb]/10 ring-1 ring-[#58a6ff]'
                        : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9] hover:border-[#8b949e]/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-[#58a6ff]' : 'text-[#c9d1d9]'
                          }`}
                        >
                          {prov.shortName}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium whitespace-nowrap ${prov.badgeColor}`}
                        >
                          {prov.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8b949e] truncate">{prov.tagline}</p>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="h-5 w-5 rounded-full bg-[#1f6feb] text-white flex items-center justify-center shadow-sm">
                          <Check className="h-3 w-3" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-[#30363d] bg-[#161b22]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider Overview Card */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-3.5 w-3.5 text-[#d2a8ff] shrink-0" />
                <span className="text-xs font-bold text-[#f0f6fc] truncate">
                  {currentProviderMeta.name}
                </span>
              </div>
              <a
                href={currentProviderMeta.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#58a6ff] hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <span>Docs / Keys</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-[11px] text-[#8b949e] leading-relaxed">
              {currentProviderMeta.description}
            </p>
          </div>

          {/* Step 2: API Key Configuration */}
          {currentProviderMeta.requiresKey ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">
                  2. {currentProviderMeta.shortName} API Key
                </label>
                <span className="text-[10px] text-[#3fb950] font-mono flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Local Storage</span>
                </span>
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value.trim() })}
                  placeholder={currentProviderMeta.keyPlaceholder}
                  className="w-full px-3.5 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] font-mono placeholder-[#6e7681] focus:outline-none focus:border-[#58a6ff] pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  {config.apiKey && (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, apiKey: '' })}
                      className="text-[10px] text-[#f85149] hover:underline px-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-[#238636]/10 border border-[#238636]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#3fb950]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="text-[11px]">
                <strong>No API Key Required:</strong> {currentProviderMeta.shortName} runs 100% free and offline inside the app.
              </span>
            </div>
          )}

          {/* Step 3: Model Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">
                3. Select Model
              </label>
              <span className="text-[10px] font-mono text-[#8b949e] truncate max-w-[180px]">
                {config.model}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {currentProviderMeta.models.map((modelOpt) => {
                const isModelSelected = config.model === modelOpt.id;
                return (
                  <button
                    key={modelOpt.id}
                    type="button"
                    onClick={() => setConfig({ ...config, model: modelOpt.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isModelSelected
                        ? 'bg-[#1f6feb]/20 border-[#58a6ff] text-[#f0f6fc]'
                        : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-[#f0f6fc]">{modelOpt.name}</span>
                      {modelOpt.badge && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-[#30363d] text-[#8b949e] font-mono">
                          {modelOpt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8b949e] mt-0.5 truncate">
                      {modelOpt.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom Model Override Input */}
            <div className="pt-0.5">
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value.trim() })}
                placeholder="Or enter custom model ID..."
                className="w-full px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-[#c9d1d9] font-mono focus:outline-none focus:border-[#58a6ff]"
              />
            </div>
          </div>

          {/* Step 4: Custom Endpoint (For OpenCode or Local Ollama) */}
          {(config.provider === 'opencode' || config.provider === 'qwen_local') && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#f0f6fc] flex items-center justify-between">
                <span className="uppercase tracking-wider">4. Base Endpoint URL</span>
                <span className="text-[10px] text-[#8b949e] font-normal">
                  (Ollama / vLLM / LMStudio)
                </span>
              </label>
              <input
                type="text"
                value={config.customEndpoint || ''}
                onChange={(e) => setConfig({ ...config, customEndpoint: e.target.value.trim() })}
                placeholder={currentProviderMeta.defaultEndpoint || 'http://localhost:11434/v1'}
                className="w-full px-3.5 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff]"
              />
            </div>
          )}

          {/* Test Connection Results Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in ${
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
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.latencyMs && (
                  <span className="text-[10px] font-mono opacity-80 mt-0.5 block">
                    Latency: {testResult.latencyMs}ms
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (Modern Responsive Layout) */}
        <div className="p-3 sm:p-4 border-t border-[#30363d] bg-[#0d1117] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] text-xs font-semibold rounded-xl border border-[#30363d] transition-colors whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-[#79c0ff] text-xs font-semibold rounded-xl border border-[#30363d] transition-all disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs font-semibold rounded-xl border border-[#30363d] transition-colors whitespace-nowrap text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold rounded-xl border border-[#3fb950]/30 shadow-md transition-all active:scale-95 whitespace-nowrap text-center"
            >
              {savedSuccess ? <Check className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
              <span>{savedSuccess ? 'Saved!' : 'Save & Set'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
