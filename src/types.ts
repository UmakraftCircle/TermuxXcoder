export interface ProjectFile {
  path: string;
  name: string;
  category: 'workflow' | 'gradle' | 'manifest' | 'kotlin' | 'config' | 'doc';
  module?: string;
  content: string;
  description?: string;
  language: 'kotlin' | 'yaml' | 'groovy' | 'properties' | 'xml' | 'json' | 'markdown' | 'bash';
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
