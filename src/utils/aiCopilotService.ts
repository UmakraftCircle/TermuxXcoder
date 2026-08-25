import { AiCopilotConfig, AiProviderType, AiModelOption } from '../types';

export type { AiProviderType };

export const AI_STORAGE_KEY = 'umakraft_ai_copilot_config_v2';

export interface ProviderMeta {
  id: AiProviderType;
  name: string;
  shortName: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  requiresKey: boolean;
  keyPlaceholder: string;
  defaultEndpoint?: string;
  defaultModel: string;
  models: AiModelOption[];
  docsUrl: string;
  description: string;
}

export const AI_PROVIDERS: Record<AiProviderType, ProviderMeta> = {
  qwen_local: {
    id: 'qwen_local',
    name: 'Local AI (Qwen 1.5 / 2.5 Coder)',
    shortName: 'Qwen 1.5 Local',
    tagline: '100% Offline & On-Device Local AI inference engine',
    badge: 'Offline / Free',
    badgeColor: 'bg-[#238636]/20 text-[#3fb950] border-[#238636]/40',
    requiresKey: false,
    keyPlaceholder: 'No API Key required (Offline local engine)',
    defaultEndpoint: 'http://localhost:11434/v1',
    defaultModel: 'qwen1.5-coder-1.8b',
    docsUrl: 'https://github.com/QwenLM/Qwen1.5',
    description:
      'Built-in offline Qwen 1.5 Coder engine and local Ollama / llama.cpp bridge. Generates and refactors Android Kotlin, C++ NDK, and Gradle scripts without internet.',
    models: [
      {
        id: 'qwen1.5-coder-1.8b',
        name: 'Qwen 1.5 Coder (1.8B Local Engine)',
        provider: 'qwen_local',
        description: 'Optimized high-speed on-device model for Android modular coding & refactoring.',
        contextWindow: '32k tokens',
        badge: 'Default / Instant',
        isLocal: true
      },
      {
        id: 'qwen1.5-coder-0.5b',
        name: 'Qwen 1.5 Coder (0.5B Ultra-Light)',
        provider: 'qwen_local',
        description: 'Ultra-low memory footprint for mobile & embedded Termux execution.',
        contextWindow: '16k tokens',
        badge: 'Lightweight',
        isLocal: true
      },
      {
        id: 'qwen2.5-coder-7b',
        name: 'Qwen 2.5 Coder (7B Ollama / PTY Bridge)',
        provider: 'qwen_local',
        description: 'Advanced reasoning and multi-file Android project architectural synthesis.',
        contextWindow: '32k tokens',
        badge: 'High Precision',
        isLocal: true
      },
      {
        id: 'qwen2.5-coder-32b',
        name: 'Qwen 2.5 Coder (32B Local Host)',
        provider: 'qwen_local',
        description: 'Full-capability coding model running on local workstation / Ollama endpoint.',
        contextWindow: '64k tokens',
        badge: 'Full Power',
        isLocal: true
      }
    ]
  },
  groq: {
    id: 'groq',
    name: 'Groq Cloud (Ultra-Fast LPU)',
    shortName: 'Groq',
    tagline: '500+ tokens/sec ultra-fast code generation on Groq LPUs',
    badge: 'Ultra Fast LPU',
    badgeColor: 'bg-[#f78166]/20 text-[#f78166] border-[#f78166]/40',
    requiresKey: true,
    keyPlaceholder: 'gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    defaultEndpoint: 'https://api.groq.com/openai/v1',
    defaultModel: 'qwen-2.5-coder-32b',
    docsUrl: 'https://console.groq.com/keys',
    description:
      'Supercharged inference using Groq LPUs. Supports fast Qwen 2.5 Coder, LLaMA 3.3 70B, and DeepSeek R1 models.',
    models: [
      {
        id: 'qwen-2.5-coder-32b',
        name: 'Qwen 2.5 Coder 32B (Groq LPU)',
        provider: 'groq',
        description: 'Ultra-fast Qwen coding engine with near-instant responses.',
        contextWindow: '32k tokens',
        badge: 'Recommended'
      },
      {
        id: 'llama-3.3-70b-versatile',
        name: 'LLaMA 3.3 70B Versatile',
        provider: 'groq',
        description: 'Meta flagship model with deep Android architecture comprehension.',
        contextWindow: '128k tokens',
        badge: '70B'
      },
      {
        id: 'deepseek-r1-distill-llama-70b',
        name: 'DeepSeek R1 Distill 70B',
        provider: 'groq',
        description: 'Reasoning model specialized in step-by-step logic and debugging.',
        contextWindow: '128k tokens',
        badge: 'Reasoning'
      },
      {
        id: 'gemma2-9b-it',
        name: 'Gemma 2 9B IT',
        provider: 'groq',
        description: 'Google efficient instruction-tuned model.',
        contextWindow: '8k tokens'
      }
    ]
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (GPT-4o & o3)',
    shortName: 'OpenAI',
    tagline: 'Industry-standard GPT-4o, GPT-4o-mini & reasoning models',
    badge: 'GPT-4o',
    badgeColor: 'bg-[#7ee787]/20 text-[#7ee787] border-[#7ee787]/40',
    requiresKey: true,
    keyPlaceholder: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx',
    defaultEndpoint: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    docsUrl: 'https://platform.openai.com/api-keys',
    description:
      'Direct integration with OpenAI APIs for state-of-the-art code generation, refactoring, and CI/CD workflow generation.',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o (Omni Flagship)',
        provider: 'openai',
        description: 'High intelligence flagship model for complex Android architectures.',
        contextWindow: '128k tokens',
        badge: 'Flagship'
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        description: 'Fast, cost-effective, and highly capable for everyday coding.',
        contextWindow: '128k tokens',
        badge: 'Fast & Smart'
      },
      {
        id: 'o3-mini',
        name: 'o3-mini (Reasoning)',
        provider: 'openai',
        description: 'Next-generation reasoning model optimized for deep coding & algorithms.',
        contextWindow: '200k tokens',
        badge: 'Reasoning'
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        description: 'Proven high-precision model for multi-file context.',
        contextWindow: '128k tokens'
      }
    ]
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (Multi-Model Hub)',
    shortName: 'OpenRouter',
    tagline: 'Access 200+ models (Claude 3.5, DeepSeek R1, Qwen 2.5 Coder) via one key',
    badge: '200+ Models',
    badgeColor: 'bg-[#a371f7]/20 text-[#d2a8ff] border-[#a371f7]/40',
    requiresKey: true,
    keyPlaceholder: 'sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx',
    defaultEndpoint: 'https://openrouter.ai/api/v1',
    defaultModel: 'qwen/qwen-2.5-coder-32b-instruct',
    docsUrl: 'https://openrouter.ai/keys',
    description:
      'Unified gateway connecting to Claude 3.5 Sonnet, DeepSeek R1, Qwen 2.5 Coder 32B, and hundreds of top open-source models.',
    models: [
      {
        id: 'qwen/qwen-2.5-coder-32b-instruct',
        name: 'Qwen 2.5 Coder 32B Instruct',
        provider: 'openrouter',
        description: 'One of the best coding models in the world via OpenRouter.',
        contextWindow: '32k tokens',
        badge: 'Top Coder'
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'openrouter',
        description: 'Highest coding benchmark performance and detailed explanations.',
        contextWindow: '200k tokens',
        badge: 'SOTA Coder'
      },
      {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1 (Full 671B Reasoning)',
        provider: 'openrouter',
        description: 'Open-weights reasoning frontier model for debugging difficult bugs.',
        contextWindow: '64k tokens',
        badge: 'Reasoning'
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        name: 'Meta LLaMA 3.3 70B Instruct',
        provider: 'openrouter',
        description: 'Reliable general-purpose coding and architectural model.',
        contextWindow: '128k tokens'
      }
    ]
  },
  opencode: {
    id: 'opencode',
    name: 'OpenCode / Custom Endpoint',
    shortName: 'OpenCode',
    tagline: 'Custom OpenAI-compatible URL, Together AI, DeepSeek, vLLM, or LMStudio',
    badge: 'Custom URL',
    badgeColor: 'bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff]/40',
    requiresKey: false,
    keyPlaceholder: 'Optional API Key for custom endpoint',
    defaultEndpoint: 'https://api.together.xyz/v1',
    defaultModel: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    docsUrl: 'https://github.com/vllm-project/vllm',
    description:
      'Connect any OpenAI-compatible API endpoint (Together.ai, DeepSeek API, Mistral, HuggingFace TGI, vLLM, or self-hosted server).',
    models: [
      {
        id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
        name: 'Qwen 2.5 Coder 32B (OpenCode / Together)',
        provider: 'opencode',
        description: 'Custom host Qwen coding pipeline.',
        contextWindow: '32k tokens',
        badge: 'Custom'
      },
      {
        id: 'deepseek-chat',
        name: 'DeepSeek V3 (deepseek-chat)',
        provider: 'opencode',
        description: 'Direct deepseek API compatible endpoint.',
        contextWindow: '64k tokens'
      },
      {
        id: 'codellama/CodeLlama-34b-Instruct',
        name: 'CodeLlama 34B Instruct',
        provider: 'opencode',
        description: 'Self-hosted or cloud CodeLlama endpoint.',
        contextWindow: '16k tokens'
      }
    ]
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini (3.7 / 2.5 Flash)',
    shortName: 'Gemini',
    tagline: 'Google DeepMind multimodal Gemini AI models',
    badge: 'Gemini 3.7',
    badgeColor: 'bg-[#bc8cff]/20 text-[#bc8cff] border-[#bc8cff]/40',
    requiresKey: true,
    keyPlaceholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-3.7-flash',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    description:
      'High-speed intelligence from Google AI Studio. Seamlessly handles large Android project context, C++ NDK, and Gradle scripts.',
    models: [
      {
        id: 'gemini-3.7-flash',
        name: 'Gemini 3.7 Flash',
        provider: 'gemini',
        description: 'Latest flagship speed & reasoning model with advanced code comprehension.',
        contextWindow: '1M tokens',
        badge: 'Latest 3.7'
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'gemini',
        description: 'Fast, efficient code generation for daily editing.',
        contextWindow: '1M tokens'
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'gemini',
        description: 'Deep reasoning for complex multi-module Android architectures.',
        contextWindow: '2M tokens',
        badge: 'Deep Pro'
      }
    ]
  }
};

export const DEFAULT_AI_CONFIG: AiCopilotConfig = {
  provider: 'qwen_local',
  model: 'qwen1.5-coder-1.8b',
  apiKey: '',
  customEndpoint: 'http://localhost:11434/v1',
  temperature: 0.2,
  maxTokens: 2048
};

export function getSavedAiConfig(): AiCopilotConfig {
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    if (!raw) return DEFAULT_AI_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AI_CONFIG,
      ...parsed
    };
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveAiConfig(config: AiCopilotConfig): void {
  try {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save AI config to localStorage:', e);
  }
}

export async function testAiConnection(config: AiCopilotConfig): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
  modelUsed?: string;
}> {
  const startTime = Date.now();
  try {
    const res = await fetch('/api/ai-test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: config.provider,
        model: config.model,
        apiKey: config.apiKey,
        customEndpoint: config.customEndpoint
      })
    });

    const latencyMs = Date.now() - startTime;
    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        success: false,
        message: data.error || 'Connection failed',
        latencyMs
      };
    }

    return {
      success: true,
      message: data.message || `Connected successfully to ${AI_PROVIDERS[config.provider].name}`,
      latencyMs,
      modelUsed: data.model || config.model
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error while testing connection',
      latencyMs: Date.now() - startTime
    };
  }
}

export async function requestAiAssist(params: {
  prompt: string;
  currentFile?: string;
  context?: string;
  configOverride?: Partial<AiCopilotConfig>;
  image?: { data: string; mimeType?: string };
}): Promise<{
  reply: string;
  provider: AiProviderType;
  model: string;
  fallback?: boolean;
}> {
  const config = {
    ...getSavedAiConfig(),
    ...(params.configOverride || {})
  };

  const res = await fetch('/api/ai-assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: params.prompt,
      currentFile: params.currentFile,
      context: params.context,
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      customEndpoint: config.customEndpoint,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      image: params.image
    })
  });

  const data = await res.json();

  if (!res.ok && !data.reply) {
    throw new Error(data.error || 'Failed to get response from AI provider');
  }

  return {
    reply: data.reply || 'No code generated.',
    provider: data.provider || config.provider,
    model: data.model || config.model,
    fallback: data.fallback
  };
}
