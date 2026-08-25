export interface ProjectFile {
  path: string;
  name: string;
  category: 'workflow' | 'gradle' | 'manifest' | 'kotlin' | 'config' | 'doc' | 'generated';
  module?: string;
  content: string;
  description?: string;
  language: 'kotlin' | 'yaml' | 'groovy' | 'properties' | 'xml' | 'json' | 'markdown' | 'bash' | 'cpp' | 'c';
  isEncrypted?: boolean;
  isReadOnly?: boolean;
  checksum?: string;
  isSandbox?: boolean;
  origin?: 'upload' | 'import' | 'user' | 'app_system';
  storageScope?: 'app_internal_vault' | 'app_system_storage' | 'sandbox_user' | 'workspace_user';
}

export interface BuildDiagnostic {
  id: string;
  name: string;
  category: 'jdk' | 'ndk' | 'gradle' | 'dependencies' | 'permissions' | 'keystore' | 'r8';
  status: 'passed' | 'warning' | 'error';
  message: string;
  detail: string;
  recommendedFix?: string;
}

export interface WorkflowJob {
  name: string;
  runsOn: string;
  steps: {
    name: string;
    usesOrRun: string;
    description: string;
  }[];
}

export interface GitSecretItem {
  key: string;
  description: string;
  requiredFor: 'Release APK' | 'Signing' | 'GitHub Releases' | 'AI Cloud Inference';
  sampleValue: string;
  isConfigured: boolean;
}

export interface EngineeringVolume {
  volume: number;
  title: string;
  subtitle: string;
  summary: string;
  keyModules: string[];
  chapters: { title: string; desc: string }[];
}

export type AiProviderType =
  | 'qwen_local'
  | 'groq'
  | 'openai'
  | 'openrouter'
  | 'opencode'
  | 'gemini';

export interface AiCopilotConfig {
  provider: AiProviderType;
  model: string;
  apiKey: string;
  customEndpoint?: string;
  temperature?: number;
  maxTokens?: number;
  customPromptPrefix?: string;
  autoSpeak?: boolean;
  speechRate?: number;
  speechPitch?: number;
  selectedVoiceURI?: string;
}

export interface AiModelOption {
  id: string;
  name: string;
  provider: AiProviderType;
  description: string;
  contextWindow?: string;
  badge?: string;
  isLocal?: boolean;
}
