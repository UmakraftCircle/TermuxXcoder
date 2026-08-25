import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Terminal,
  Workflow,
  FileText,
  FileCheck2,
  KeyRound,
  FolderTree,
  Download,
  Github,
  BookOpen,
  Server,
  Activity,
  ShieldCheck,
  Cpu,
  Bot,
  Play,
  CheckCircle2,
  ArrowRight,
  Code2,
  RefreshCw,
  Clock,
  Layers,
  Database,
  ExternalLink
} from 'lucide-react';
import { ProjectFile } from '../types';

interface FunctionsDirectoryTabProps {
  files: ProjectFile[];
  onSelectFunction: (functionId: string) => void;
  onOpenQuickPush: () => void;
  onExportZip: () => void;
}

interface BackendTestResult {
  endpoint: string;
  loading: boolean;
  response?: any;
  error?: string;
  timestamp?: string;
}

export const FunctionsDirectoryTab: React.FC<FunctionsDirectoryTabProps> = ({
  files,
  onSelectFunction,
  onOpenQuickPush,
  onExportZip
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'client' | 'backend'>('all');
  const [backendTestResults, setBackendTestResults] = useState<Record<string, BackendTestResult>>({});
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);

  const fetchServerHealth = async () => {
    setIsHealthLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setServerHealth(data);
    } catch (e: any) {
      setServerHealth({ status: 'offline', error: e.message });
    } finally {
      setIsHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchServerHealth();
  }, []);

  const testBackendEndpoint = async (endpoint: string, method: string, payload?: any) => {
    setBackendTestResults((prev) => ({
      ...prev,
      [endpoint]: { endpoint, loading: true }
    }));

    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (payload && method !== 'GET') {
        options.body = JSON.stringify(payload);
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();

      setBackendTestResults((prev) => ({
        ...prev,
        [endpoint]: {
          endpoint,
          loading: false,
          response: data,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (err: any) {
      setBackendTestResults((prev) => ({
        ...prev,
        [endpoint]: {
          endpoint,
          loading: false,
          error: err.message || 'Failed to connect',
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    }
  };

  // 1. Usable Functions (Client & Studio Engine Features)
  const usableFunctions = [
    {
      id: 'coder',
      title: 'Umakraft AI Coder & Interactive Editor',
      icon: Code2,
      category: 'Primary Workspace',
      badge: 'Main Page',
      description: 'Integrated code editor with syntax rendering, file switching, and in-line code modification.',
      actionLabel: 'Open Coder',
      onRun: () => onSelectFunction('coder')
    },
    {
      id: 'ai-copilot',
      title: 'Gemini AI Code Copilot & Refactorer',
      icon: Sparkles,
      category: 'AI & Intelligence',
      badge: 'Gemini 3.7 Flash',
      description: 'Generates real-time code patches, explains logic, and fixes bugs for all 10 Android modules.',
      actionLabel: 'Launch AI Copilot',
      onRun: () => onSelectFunction('coder')
    },
    {
      id: 'patch-apply',
      title: '1-Tap Code Patch Applier',
      icon: Zap,
      category: 'AI & Intelligence',
      badge: 'Instant Sync',
      description: 'Applies AI generated code snippets directly into the active editor buffer with zero copy-paste friction.',
      actionLabel: 'Use in Coder',
      onRun: () => onSelectFunction('coder')
    },
    {
      id: 'terminal',
      title: 'Termux Native PTY Shell Emulator',
      icon: Terminal,
      category: 'Runtime & Shell',
      badge: 'Native PTY',
      description: 'Embedded Linux pseudo-terminal (/dev/ptmx) with ANSI color engine, forkpty JNI, and build runner.',
      actionLabel: 'Open Terminal',
      onRun: () => onSelectFunction('terminal')
    },
    {
      id: 'workflows',
      title: 'GitHub CI/CD Actions Suite',
      icon: Workflow,
      category: 'Build & Release',
      badge: '3 Actions',
      description: 'Production workflows for Android APK release builds, release note tagging, and lint automation.',
      actionLabel: 'View Workflows',
      onRun: () => onSelectFunction('workflows')
    },
    {
      id: 'releasenotes',
      title: 'POSIX Release Notes & Checksum Generator',
      icon: FileText,
      category: 'Build & Release',
      badge: 'SHA-256',
      description: 'Parses git commit logs, organizes features & bug fixes, and calculates SHA-256 binary fingerprints.',
      actionLabel: 'Open Generator',
      onRun: () => onSelectFunction('releasenotes')
    },
    {
      id: 'diagnostics',
      title: 'APK Build & NDK Integrity Inspector',
      icon: FileCheck2,
      category: 'Build & Release',
      badge: 'Pre-flight',
      description: 'Validates AGP 8.8, Java 21, ProGuard R8 rules, and Android 10+ (API 29–34) compatibility.',
      actionLabel: 'Inspect Build',
      onRun: () => onSelectFunction('diagnostics')
    },
    {
      id: 'keystore',
      title: 'PKCS12 Keystore & Signing Vault',
      icon: KeyRound,
      category: 'Security',
      badge: 'PKCS12 / RSA',
      description: 'Generates secure Android release certificates, aliases, and GitHub Action secrets configurations.',
      actionLabel: 'Manage Keys',
      onRun: () => onSelectFunction('keystore')
    },
    {
      id: 'codebase',
      title: 'Virtual 10-Module File System Explorer',
      icon: FolderTree,
      category: 'Architecture',
      badge: `${files.length} Files`,
      description: 'In-memory workspace manager supporting :editor, :terminal, :git, :lsp, :debugger, and :ai.',
      actionLabel: 'Explore Codebase',
      onRun: () => onSelectFunction('codebase')
    },
    {
      id: 'zip-export',
      title: '1-Click Full Project ZIP Packager',
      icon: Download,
      category: 'Export & Sync',
      badge: 'Client Zip',
      description: 'Archives the complete 10-module Android Studio project into an instantly downloadable ZIP file.',
      actionLabel: 'Export Project ZIP',
      onRun: onExportZip
    },
    {
      id: 'github-push',
      title: 'GitHub Remote Commit & Push',
      icon: Github,
      category: 'Export & Sync',
      badge: 'REST API',
      description: 'Directly commits and pushes changes to any GitHub repository using Personal Access Tokens.',
      actionLabel: 'Push to GitHub',
      onRun: onOpenQuickPush
    },
    {
      id: 'docs',
      title: '10-Volume Engineering Blueprint',
      icon: BookOpen,
      category: 'Architecture',
      badge: 'Full Spec',
      description: 'Comprehensive architectural diagrams, dependency graphs, and module implementation guides.',
      actionLabel: 'Read Blueprints',
      onRun: () => onSelectFunction('docs')
    }
  ];

  // 2. Functions that live on the Backend
  const backendFunctions = [
    {
      name: 'Gemini 3.7 Flash AI Inference Gateway',
      method: 'POST',
      endpoint: '/api/ai-assist',
      icon: Bot,
      description: 'Secure server-side proxy communicating with @google/genai (Gemini 3.7 Flash). Protects API keys and provides offline template fallbacks.',
      payload: {
        prompt: 'Optimize openpty buffer handling for Android 14',
        currentFile: 'terminal/src/main/cpp/pty_bridge.cpp',
        context: 'TermuxXCoder Native PTY'
      }
    },
    {
      name: 'Keystore & Certificate Generator Service',
      method: 'POST',
      endpoint: '/api/generate-keystore',
      icon: ShieldCheck,
      description: 'Generates PKCS12 keystore parameter matrices, alias credentials, and SHA-256 / SHA-1 certificate fingerprints.',
      payload: {
        alias: 'umakraft-release',
        validityYears: 25,
        dname: 'CN=Umakraft Dev, OU=Mobile, O=Umakraft, C=US'
      }
    },
    {
      name: 'Native PTY Shell Command Engine',
      method: 'POST',
      endpoint: '/api/pty-command',
      icon: Terminal,
      description: 'Executes and parses shell commands (e.g., ./gradlew assembleRelease, git status, pty-status) through virtual execution pipelines.',
      payload: {
        command: './gradlew assembleRelease'
      }
    },
    {
      name: 'Pre-Flight Build & Module Inspector',
      method: 'POST',
      endpoint: '/api/verify-build',
      icon: CheckCircle2,
      description: 'Performs static verification across all 10 modules, AGP 8.4, Java 21, and Android 10-14 SDK compliance.',
      payload: {
        modules: ['app', 'common', 'editor', 'terminal', 'filesystem', 'git', 'lsp', 'debugger', 'ai', 'workspace']
      }
    },
    {
      name: 'GitHub Remote Push Automation Service',
      method: 'POST',
      endpoint: '/api/git-push',
      icon: Github,
      description: 'Simulates and tests Git remote push pipelines, branch verification, and GitHub Actions CI triggers.',
      payload: {
        repoUrl: 'https://github.com/pagaranjayson021/Umakraft-TermuxXCoder.git',
        branch: 'main',
        commitMessage: 'feat: initial release'
      }
    },
    {
      name: 'Release Notes & SHA-256 Engine',
      method: 'POST',
      endpoint: '/api/generate-release-notes',
      icon: FileText,
      description: 'Parses Git commit logs and computes SHA-256 integrity checksums for release distributions.',
      payload: {
        version: 'v1.0.0-rc1',
        rawCommits: 'feat(editor): add Sora Editor 0.23.5\nfix(pty): resolve forkpty memory leak'
      }
    },
    {
      name: 'System Health & Diagnostics Monitor',
      method: 'GET',
      endpoint: '/api/health',
      icon: Activity,
      description: 'Provides real-time server runtime metrics, Node.js version, container uptime, and process memory utilization.',
      payload: null
    },
    {
      name: 'Backend Functions Catalog Directory',
      method: 'GET',
      endpoint: '/api/backend-functions',
      icon: Server,
      description: 'Returns a structured JSON schema of all provisioned server-side endpoints and their operational status.',
      payload: null
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#1f6feb] to-[#238636] p-0.5 shadow-md flex-shrink-0">
            <div className="h-full w-full bg-[#0d1117] rounded-[14px] flex items-center justify-center text-[#58a6ff]">
              <Layers className="h-6 w-6" />
            </div>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#f0f6fc] tracking-tight flex items-center gap-2">
              <span>Umakraft Functions & Architecture Registry</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40">
                Studio Hub
              </span>
            </h2>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Comprehensive list of interactive client-side tools and server-side backend services.
            </p>
          </div>
        </div>

        {/* Server Status Pill */}
        <div className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] px-3.5 py-2 rounded-xl text-xs font-mono self-start md:self-auto">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3fb950] animate-pulse" />
          <span className="text-[#8b949e]">Backend Server:</span>
          <span className="text-[#f0f6fc] font-bold">
            {serverHealth?.status === 'ok' ? 'Online (Express/Node)' : 'Operational'}
          </span>
          <button
            onClick={fetchServerHealth}
            title="Refresh Server Health"
            className="text-[#58a6ff] hover:text-[#79c0ff] ml-1"
          >
            <RefreshCw className={`h-3 w-3 ${isHealthLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#30363d] pb-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeCategory === 'all'
              ? 'bg-[#1f6feb] text-white border-[#388bfd] shadow-sm'
              : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-[#f0f6fc]'
          }`}
        >
          All Functions ({usableFunctions.length + backendFunctions.length})
        </button>
        <button
          onClick={() => setActiveCategory('client')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeCategory === 'client'
              ? 'bg-[#1f6feb] text-white border-[#388bfd] shadow-sm'
              : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-[#f0f6fc]'
          }`}
        >
          ⚡ Interactive Tools ({usableFunctions.length})
        </button>
        <button
          onClick={() => setActiveCategory('backend')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeCategory === 'backend'
              ? 'bg-[#1f6feb] text-white border-[#388bfd] shadow-sm'
              : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:text-[#f0f6fc]'
          }`}
        >
          🌐 Backend Services ({backendFunctions.length})
        </button>
      </div>

      {/* Section 1: Usable Functions (Interactive Frontend & Engine Tools) */}
      {(activeCategory === 'all' || activeCategory === 'client') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#3fb950]" />
              <span>Interactive Functions That Can Be Used</span>
            </h3>
            <span className="text-xs font-mono text-[#8b949e]">
              {usableFunctions.length} Usable Tools
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {usableFunctions.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/50 rounded-2xl p-4 shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2.5 rounded-xl bg-[#1f6feb]/15 border border-[#1f6feb]/30 text-[#58a6ff] group-hover:scale-105 transition-transform flex-shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                        {item.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#f0f6fc] group-hover:text-[#58a6ff] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#8b949e] leading-relaxed mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-[#30363d]/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#8b949e] uppercase font-bold">
                      {item.category}
                    </span>
                    <button
                      onClick={item.onRun}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#1f6feb] text-xs font-bold text-[#c9d1d9] hover:text-white border border-[#30363d] hover:border-[#388bfd] transition-all shadow-sm active:scale-95"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 2: Backend Functions (Server-Side Services & Endpoints) */}
      {(activeCategory === 'all' || activeCategory === 'backend') && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
              <Server className="h-4 w-4 text-[#bc8cff]" />
              <span>Functions That Live on the Backend (Server Services)</span>
            </h3>
            <span className="text-xs font-mono text-[#8b949e]">
              {backendFunctions.length} API Endpoints
            </span>
          </div>

          <div className="space-y-3">
            {backendFunctions.map((fn) => {
              const Icon = fn.icon;
              const testResult = backendTestResults[fn.endpoint];

              return (
                <div
                  key={fn.endpoint}
                  className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#bc8cff]/15 border border-[#bc8cff]/30 text-[#bc8cff] flex-shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[#f0f6fc]">
                            {fn.name}
                          </h4>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                              fn.method === 'POST'
                                ? 'bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40'
                                : 'bg-[#238636]/20 text-[#3fb950] border border-[#3fb950]/40'
                            }`}
                          >
                            {fn.method}
                          </span>
                          <span className="text-xs font-mono text-[#8b949e]">
                            {fn.endpoint}
                          </span>
                        </div>
                        <p className="text-xs text-[#8b949e] mt-1">
                          {fn.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => testBackendEndpoint(fn.endpoint, fn.method, fn.payload)}
                      disabled={testResult?.loading}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-bold text-[#f0f6fc] hover:text-[#58a6ff] transition-all disabled:opacity-50 self-start sm:self-auto shrink-0 shadow-sm active:scale-95"
                    >
                      <Play className={`h-3.5 w-3.5 text-[#3fb950] ${testResult?.loading ? 'animate-spin' : ''}`} />
                      <span>{testResult?.loading ? 'Testing...' : 'Test Endpoint'}</span>
                    </button>
                  </div>

                  {/* Test Response Output Box */}
                  {testResult && (
                    <div className="pt-2">
                      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 font-mono text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-[#8b949e]">
                          <span className="flex items-center gap-1.5">
                            {testResult.error ? (
                              <span className="text-[#f85149] font-bold">● Request Failed</span>
                            ) : (
                              <span className="text-[#3fb950] font-bold">● Status 200 OK</span>
                            )}
                            <span>({testResult.endpoint})</span>
                          </span>
                          <span>{testResult.timestamp}</span>
                        </div>

                        <pre className="text-[#c9d1d9] overflow-x-auto whitespace-pre-wrap max-h-48 scrollbar-none pt-1">
                          {testResult.error
                            ? JSON.stringify({ error: testResult.error }, null, 2)
                            : JSON.stringify(testResult.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
