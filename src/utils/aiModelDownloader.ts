import { AiProviderType } from '../types';

export interface DownloadableAiModel {
  id: string;
  name: string;
  provider: AiProviderType;
  format: 'GGUF' | 'ONNX' | 'TFLite' | 'SafeTensors' | 'Weights & Config';
  sizeString: string;
  sizeBytes: number;
  quantization: string;
  description: string;
  hfRepo: string;
  downloadUrl: string;
  filename: string;
  badge: string;
  badgeColor: string;
  recommendedFor: string;
  targetDir: string;
  runtimeInstructions: string;
  isDownloaded?: boolean;
}

export const OFFLINE_AI_MODELS: DownloadableAiModel[] = [
  {
    id: 'qwen1.5-coder-0.5b-q4',
    name: 'Qwen 1.5 Coder 0.5B (Q4_K_M)',
    provider: 'qwen_local',
    format: 'GGUF',
    sizeString: '380 MB',
    sizeBytes: 398458880,
    quantization: 'Q4_K_M',
    description: 'Ultra-lightweight on-device coding model. Fast inference on mobile Android Termux and low-memory machines.',
    hfRepo: 'Qwen/Qwen1.5-Coder-0.5B-GGUF',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen1.5-Coder-0.5B-GGUF/resolve/main/qwen1_5-coder-0_5b-chat-q4_k_m.gguf',
    filename: 'qwen1_5-coder-0_5b-chat-q4_k_m.gguf',
    badge: 'Mobile Recommended',
    badgeColor: 'bg-[#238636]/20 text-[#3fb950] border-[#238636]/40',
    recommendedFor: 'Mobile Termux / Fast Autocomplete',
    targetDir: 'sandbox/models/gguf',
    runtimeInstructions: './llama-cli -m sandbox/models/gguf/qwen1_5-coder-0_5b-chat-q4_k_m.gguf -p "Write Android Kotlin Compose button"'
  },
  {
    id: 'qwen1.5-coder-1.8b-q4',
    name: 'Qwen 1.5 Coder 1.8B (Q4_K_M)',
    provider: 'qwen_local',
    format: 'GGUF',
    sizeString: '1.18 GB',
    sizeBytes: 1267200000,
    quantization: 'Q4_K_M',
    description: 'Balanced Android & C++ NDK code generator with high syntax accuracy and Scoped Storage comprehension.',
    hfRepo: 'Qwen/Qwen1.5-Coder-1.8B-GGUF',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen1.5-Coder-1.8B-GGUF/resolve/main/qwen1_5-coder-1_8b-chat-q4_k_m.gguf',
    filename: 'qwen1_5-coder-1_8b-chat-q4_k_m.gguf',
    badge: 'Balanced Standard',
    badgeColor: 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40',
    recommendedFor: 'Android Studio / JNI NDK Code Refactoring',
    targetDir: 'sandbox/models/gguf',
    runtimeInstructions: './llama-cli -m sandbox/models/gguf/qwen1_5-coder-1_8b-chat-q4_k_m.gguf -c 4096 -cnv'
  },
  {
    id: 'qwen2.5-coder-1.5b-q4',
    name: 'Qwen 2.5 Coder 1.5B (Q4_K_M)',
    provider: 'qwen_local',
    format: 'GGUF',
    sizeString: '986 MB',
    sizeBytes: 1034000000,
    quantization: 'Q4_K_M',
    description: 'Latest generation Qwen 2.5 architecture supporting 32k context, complex multi-module Gradle and C++ JNI bridge logic.',
    hfRepo: 'Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf',
    filename: 'qwen2.5-coder-1.5b-instruct-q4_k_m.gguf',
    badge: 'Qwen 2.5 Latest',
    badgeColor: 'bg-[#bc8cff]/20 text-[#bc8cff] border-[#bc8cff]/40',
    recommendedFor: 'Full Gradle & Compose Multiplatform Synthesis',
    targetDir: 'sandbox/models/gguf',
    runtimeInstructions: 'ollama run qwen2.5-coder:1.5b OR llama-server -m sandbox/models/gguf/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf --port 8080'
  },
  {
    id: 'deepseek-coder-1.3b-q4',
    name: 'DeepSeek Coder 1.3B (Q4_K_M)',
    provider: 'qwen_local',
    format: 'GGUF',
    sizeString: '870 MB',
    sizeBytes: 912000000,
    quantization: 'Q4_K_M',
    description: 'Pre-trained on 2T tokens of source code. Specialized in C++, Kotlin, Java, POSIX terminal code, and unit test generation.',
    hfRepo: 'TheBloke/deepseek-coder-1.3b-instruct-GGUF',
    downloadUrl: 'https://huggingface.co/TheBloke/deepseek-coder-1.3b-instruct-GGUF/resolve/main/deepseek-coder-1.3b-instruct.Q4_K_M.gguf',
    filename: 'deepseek-coder-1.3b-instruct.Q4_K_M.gguf',
    badge: 'Code Specialist',
    badgeColor: 'bg-[#f78166]/20 text-[#f78166] border-[#f78166]/40',
    recommendedFor: 'C++ NDK / Linux POSIX PTY Bridge',
    targetDir: 'sandbox/models/gguf',
    runtimeInstructions: './llama-cli -m sandbox/models/gguf/deepseek-coder-1.3b-instruct.Q4_K_M.gguf -p "Fix segmentation fault in JNI"'
  },
  {
    id: 'tinyllama-1.1b-chat-q4',
    name: 'TinyLlama 1.1B Chat (Q4_K_M)',
    provider: 'qwen_local',
    format: 'GGUF',
    sizeString: '668 MB',
    sizeBytes: 700448768,
    quantization: 'Q4_K_M',
    description: 'Compact conversational companion for answering Android docs, Gradle questions, and explaining code line-by-line.',
    hfRepo: 'TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF',
    downloadUrl: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    filename: 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    badge: 'Chat & Docs',
    badgeColor: 'bg-[#d29922]/20 text-[#e3b341] border-[#d29922]/40',
    recommendedFor: 'Offline Documentation & Command Explanations',
    targetDir: 'sandbox/models/gguf',
    runtimeInstructions: './llama-cli -m sandbox/models/gguf/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf -p "Explain Scoped Storage"'
  },
  {
    id: 'llama-cpp-termux-runner',
    name: 'llama.cpp Termux Binary Bundle (aarch64)',
    provider: 'qwen_local',
    format: 'Weights & Config',
    sizeString: '18 MB',
    sizeBytes: 18874368,
    quantization: 'Native ARMv8.2 NEON / OpenCL',
    description: 'Precompiled llama-cli, llama-server, and libllama.so native binaries optimized for ARM64 Android Termux execution.',
    hfRepo: 'ggerganov/llama.cpp/releases',
    downloadUrl: 'https://github.com/ggerganov/llama.cpp/releases/download/b3000/llama-b3000-bin-android-arm64.zip',
    filename: 'llama-android-arm64-runtime.zip',
    badge: 'Engine Runtime',
    badgeColor: 'bg-[#00eb87]/20 text-[#00eb87] border-[#00eb87]/40',
    recommendedFor: 'Termux Native Terminal Execution',
    targetDir: 'sandbox/bin',
    runtimeInstructions: 'unzip sandbox/bin/llama-android-arm64-runtime.zip -d sandbox/bin/ && chmod +x sandbox/bin/llama-cli'
  }
];

const LOCAL_STORAGE_DOWNLOADED_KEY = 'umakraft_downloaded_ai_models_v1';

export function getDownloadedModelIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DOWNLOADED_KEY);
    return raw ? JSON.parse(raw) : ['qwen1.5-coder-0.5b-q4'];
  } catch {
    return ['qwen1.5-coder-0.5b-q4'];
  }
}

export function saveDownloadedModelIds(ids: string[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_DOWNLOADED_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save downloaded model IDs', e);
  }
}

export function triggerBrowserFileDownload(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
