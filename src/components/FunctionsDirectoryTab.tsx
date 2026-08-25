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
  ExternalLink,
  Search,
  Check,
  Copy,
  ChevronRight,
  ShieldAlert,
  Boxes,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Globe,
  Layout
} from 'lucide-react';
import { ProjectFile } from '../types';
import confetti from 'canvas-confetti';
import { WebDocsSearchModal } from './WebDocsSearchModal';

interface FunctionsDirectoryTabProps {
  files: ProjectFile[];
  onSelectFunction: (functionId: string) => void;
  onOpenQuickPush: () => void;
  onExportZip: () => void;
  onOpenWebSearch?: () => void;
}

interface BackendTestResult {
  endpoint: string;
  loading: boolean;
  response?: any;
  error?: string;
  timestamp?: string;
  latencyMs?: number;
}

export const FunctionsDirectoryTab: React.FC<FunctionsDirectoryTabProps> = ({
  files,
  onSelectFunction,
  onOpenQuickPush,
  onExportZip,
  onOpenWebSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'dense' | 'backend'>('grid');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [backendTestResults, setBackendTestResults] = useState<Record<string, BackendTestResult>>({});
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [activeSubAppInfo, setActiveSubAppInfo] = useState<any | null>(null);
  const [isWebSearchModalOpen, setIsWebSearchModalOpen] = useState(false);

  const fetchServerHealth = async () => {
    setIsHealthLoading(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const latency = Math.round(performance.now() - start);
      setServerHealth({ ...data, latency });
    } catch (e: any) {
      setServerHealth({ status: 'offline', error: e.message });
    } finally {
      setIsHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchServerHealth();
  }, []);

  const handleCopyEndpoint = (endpoint: string) => {
    navigator.clipboard.writeText(endpoint);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const testBackendEndpoint = async (endpoint: string, method: string, payload?: any) => {
    const startTime = performance.now();
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
      const latencyMs = Math.round(performance.now() - startTime);

      setBackendTestResults((prev) => ({
        ...prev,
        [endpoint]: {
          endpoint,
          loading: false,
          response: data,
          timestamp: new Date().toLocaleTimeString(),
          latencyMs
        }
      }));

      confetti({ particleCount: 15, spread: 40, origin: { y: 0.7 } });
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      setBackendTestResults((prev) => ({
        ...prev,
        [endpoint]: {
          endpoint,
          loading: false,
          error: err.message || 'Failed to connect',
          timestamp: new Date().toLocaleTimeString(),
          latencyMs
        }
      }));
    }
  };

  // Sub-Apps & Tools
  const subApps = [
    {
      id: 'coder',
      title: 'AI Coder & IDE',
      shortTitle: 'AI Coder',
      icon: Code2,
      iconColor: 'text-[#58a6ff]',
      bgColor: 'bg-[#58a6ff]/15 border-[#58a6ff]/30',
      badge: 'Core',
      category: 'Development',
      description: 'Full-screen code canvas with syntax coloring, live multi-tab buffer switching, and file imports.',
      onRun: () => onSelectFunction('coder')
    },
    {
      id: 'layout',
      title: 'UI Designer & Compose Studio',
      shortTitle: 'UI Designer',
      icon: Layout,
      iconColor: 'text-[#388bfd]',
      bgColor: 'bg-[#388bfd]/15 border-[#388bfd]/30',
      badge: 'Compose/XML',
      category: 'Development',
      description: 'Interactive visual layout builder for Jetpack Compose and Android XML with live mobile preview.',
      onRun: () => onSelectFunction('layout')
    },
    {
      id: 'ai-copilot',
      title: 'Multimodal AI Copilot',
      shortTitle: 'Copilot',
      icon: Sparkles,
      iconColor: 'text-[#bc8cff]',
      bgColor: 'bg-[#bc8cff]/15 border-[#bc8cff]/30',
      badge: 'Gemini 3.7',
      category: 'AI & Copilot',
      description: 'Understands complex codebases, reasons through errors, scans code screenshots, and speaks responses.',
      onRun: () => onSelectFunction('coder')
    },
    {
      id: 'web-search-docs',
      title: 'AI Web Search & Docs',
      shortTitle: 'Web Search',
      icon: Globe,
      iconColor: 'text-[#39c5bb]',
      bgColor: 'bg-[#39c5bb]/15 border-[#39c5bb]/30',
      badge: 'Live Grounding',
      category: 'AI & Copilot',
      description: 'Search official Android, Kotlin, C++ NDK, Gradle & Gemini SDK web documentation with 1-tap code inserts.',
      onRun: () => {
        if (onOpenWebSearch) onOpenWebSearch();
        else setIsWebSearchModalOpen(true);
      }
    },
    {
      id: 'terminal',
      title: 'Virtual Linux Shell',
      shortTitle: 'PTY Shell',
      icon: Terminal,
      iconColor: 'text-[#3fb950]',
      bgColor: 'bg-[#3fb950]/15 border-[#3fb950]/30',
      badge: 'Shell',
      category: 'Development',
      description: 'Termux-compatible terminal emulator with ANSI color pipelines, command history, and Gradle runner.',
      onRun: () => onSelectFunction('terminal')
    },
    {
      id: 'workflows',
      title: 'CI/CD Automation',
      shortTitle: 'CI/CD',
      icon: Workflow,
      iconColor: 'text-[#ffa657]',
      bgColor: 'bg-[#ffa657]/15 border-[#ffa657]/30',
      badge: 'Matrix',
      category: 'Build & Release',
      description: 'Configured workflows for automated Android APK artifact generation, lint passes, and binary distribution.',
      onRun: () => onSelectFunction('workflows')
    },
    {
      id: 'releasenotes',
      title: 'Release Notes & SHA-256',
      shortTitle: 'SHA & Notes',
      icon: FileText,
      iconColor: 'text-[#79c0ff]',
      bgColor: 'bg-[#79c0ff]/15 border-[#79c0ff]/30',
      badge: 'Crypto',
      category: 'Build & Release',
      description: 'Generates structured changelogs from git history and computes cryptographic fingerprints.',
      onRun: () => onSelectFunction('releasenotes')
    },
    {
      id: 'diagnostics',
      title: 'Pre-Flight Inspector',
      shortTitle: 'Inspector',
      icon: FileCheck2,
      iconColor: 'text-[#3fb950]',
      bgColor: 'bg-[#3fb950]/15 border-[#3fb950]/30',
      badge: 'Audit',
      category: 'Build & Release',
      description: 'Validates AGP 8.8, Java 21, R8 shrinking configurations, and Android 10+ (API 29–34) Scoped Storage rules.',
      onRun: () => onSelectFunction('diagnostics')
    },
    {
      id: 'keystore',
      title: 'Signing Keystore Vault',
      shortTitle: 'Keystore',
      icon: KeyRound,
      iconColor: 'text-[#e3b341]',
      bgColor: 'bg-[#e3b341]/15 border-[#e3b341]/30',
      badge: 'RSA-4096',
      category: 'Security',
      description: 'Generates self-signed release certificates, alias credentials, and GitHub Action secrets payload.',
      onRun: () => onSelectFunction('keystore')
    },
    {
      id: 'storage',
      title: 'Storage Vault Tree',
      shortTitle: 'Storage',
      icon: FolderTree,
      iconColor: 'text-[#58a6ff]',
      bgColor: 'bg-[#58a6ff]/15 border-[#58a6ff]/30',
      badge: `${files.length} Files`,
      category: 'Architecture',
      description: 'Secure browser and cloud workspace structure dividing user sandboxes from protected system architecture.',
      onRun: () => onSelectFunction('storage')
    },
    {
      id: 'zip-export',
      title: 'Full Workspace Packager',
      shortTitle: 'ZIP Export',
      icon: Download,
      iconColor: 'text-[#3fb950]',
      bgColor: 'bg-[#3fb950]/15 border-[#3fb950]/30',
      badge: 'Bundle',
      category: 'Export & Sync',
      description: 'Compiles and bundles the complete source code tree into a clean, GitHub-ready ZIP archive.',
      onRun: onExportZip
    },
    {
      id: 'github-push',
      title: 'GitHub Remote Push',
      shortTitle: 'Git Push',
      icon: Github,
      iconColor: 'text-[#f0f6fc]',
      bgColor: 'bg-[#30363d] border-[#484f58]',
      badge: 'Sync',
      category: 'Export & Sync',
      description: 'Directly pushes local commits, branch updates, and tags to remote GitHub repositories.',
      onRun: onOpenQuickPush
    },
    {
      id: 'docs',
      title: '10-Volume Blueprints',
      shortTitle: 'Blueprints',
      icon: BookOpen,
      iconColor: 'text-[#d2a8ff]',
      bgColor: 'bg-[#d2a8ff]/15 border-[#d2a8ff]/30',
      badge: 'Docs',
      category: 'Architecture',
      description: 'Modular engineering specifications, JNI bridge diagrams, and multi-module layout documentation.',
      onRun: () => onSelectFunction('docs')
    },
    {
      id: 'patch-apply',
      title: '1-Tap Code Patch',
      shortTitle: 'Auto Patch',
      icon: Zap,
      iconColor: 'text-[#ffa657]',
      bgColor: 'bg-[#ffa657]/15 border-[#ffa657]/30',
      badge: 'Patch',
      category: 'AI & Copilot',
      description: 'Applies AI-suggested code fixes straight into active files with automatic line-diff preview.',
      onRun: () => onSelectFunction('coder')
    }
  ];

  // Backend Microservices
  const backendFunctions = [
    {
      name: 'AI Inference Gateway (Gemini 3.7 & Local)',
      method: 'POST',
      endpoint: '/api/ai-assist',
      icon: Bot,
      category: 'AI Microservices',
      description: 'Handles code refactoring, image vision analysis, contextual dialogue, and speech formatting.',
      payload: {
        prompt: 'Optimize openpty buffer handling for Android 14',
        currentFile: 'terminal/src/main/cpp/pty_bridge.cpp',
        context: 'TermuxXCoder Native PTY'
      }
    },
    {
      name: 'Keystore & Certificate Generator',
      method: 'POST',
      endpoint: '/api/generate-keystore',
      icon: ShieldCheck,
      category: 'Security Services',
      description: 'Creates PKCS12 keystore parameter matrices, alias credentials, and SHA-256 fingerprints.',
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
      category: 'Runtime Microservices',
      description: 'Executes virtual shell scripts, gradle builds, and diagnostics through backend pipes.',
      payload: {
        command: './gradlew assembleRelease'
      }
    },
    {
      name: 'Pre-Flight Build & Module Inspector',
      method: 'POST',
      endpoint: '/api/verify-build',
      icon: CheckCircle2,
      category: 'Build Microservices',
      description: 'Runs static validation across all 10 modules, AGP 8.8, Java 21, and Android 10–14 SDK compliance.',
      payload: {
        modules: ['app', 'common', 'editor', 'terminal', 'filesystem', 'git', 'lsp', 'debugger', 'ai', 'workspace']
      }
    },
    {
      name: 'GitHub Remote Push Service',
      method: 'POST',
      endpoint: '/api/git-push',
      icon: Github,
      category: 'Export Services',
      description: 'Tests Git remote push pipelines, branch verification, and GitHub Actions CI triggers.',
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
      category: 'Build Microservices',
      description: 'Parses Git commit logs and computes cryptographic SHA-256 integrity checksums.',
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
      category: 'System Services',
      description: 'Provides real-time server runtime metrics, Node.js version, container uptime, and process memory.',
      payload: null
    },
    {
      name: 'Backend Functions Catalog Directory',
      method: 'GET',
      endpoint: '/api/backend-functions',
      icon: Server,
      category: 'System Services',
      description: 'Returns a structured JSON schema of all provisioned server-side endpoints and operational status.',
      payload: null
    }
  ];

  // Filtering
  const filteredSubApps = subApps.filter((app) => {
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSub = selectedSubCategory === 'all' || app.category === selectedSubCategory;
    return matchesSearch && matchesSub;
  });

  const filteredBackend = backendFunctions.filter((fn) => {
    const matchesSearch =
      fn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fn.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fn.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const categories = ['all', 'Development', 'AI & Copilot', 'Build & Release', 'Security', 'Architecture', 'Export & Sync'];

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-3 sm:p-4 font-sans" id="functions-registry-container">
      {/* 1. Ultra-Compact Sub-Con App Launcher Header */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3 sm:p-3.5 shadow-sm flex items-center justify-between gap-3">
        {/* Left Title & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#1f6feb] to-[#238636] p-0.5 shadow shrink-0">
            <div className="h-full w-full bg-[#0d1117] rounded-[9px] flex items-center justify-center text-[#58a6ff]">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-white tracking-tight truncate">
                UmaKraft Studio Hub
              </h2>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30 font-semibold shrink-0">
                12 Sub-Apps
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8b949e]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3fb950] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3fb950]"></span>
              </span>
              <span>Server Online</span>
              {serverHealth?.latency && (
                <span className="text-[10px] text-[#3fb950] font-mono">({serverHealth.latency}ms)</span>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher (App Grid | Dense List | Backend Sandbox) */}
        <div className="flex items-center bg-[#0d1117] p-1 rounded-xl border border-[#30363d] shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            title="App Icon Grid (Space-Optimized)"
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              viewMode === 'grid'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Icon Grid</span>
          </button>
          <button
            onClick={() => setViewMode('dense')}
            title="Compact List View"
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              viewMode === 'dense'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dense List</span>
          </button>
          <button
            onClick={() => setViewMode('backend')}
            title="Backend API Microservices (Isolated Sandbox)"
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              viewMode === 'backend'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Server className="h-3.5 w-3.5 text-[#bc8cff]" />
            <span className="hidden sm:inline">Backend API</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Search & Filter Chips */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Search Input Bar */}
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={viewMode === 'backend' ? 'Search API endpoints...' : 'Search sub-con apps & tools...'}
            className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#58a6ff] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#8b949e] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#8b949e] hover:text-white bg-[#21262d] px-1.5 py-0.5 rounded"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Category Pills (Only in Grid / List Mode) */}
        {viewMode !== 'backend' && (
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedSubCategory(cat)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all border ${
                  selectedSubCategory === cat
                    ? 'bg-[#21262d] border-[#58a6ff] text-[#58a6ff] font-bold shadow-sm'
                    : 'bg-[#161b22]/70 border-[#30363d] text-[#8b949e] hover:text-white'
                }`}
              >
                {cat === 'all' ? '✦ All' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. OPTION A: SPACE-OPTIMIZED SUB-APP ICON GRID (Springboard/Launcher) */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 sm:gap-3">
            {filteredSubApps.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  onClick={() => {
                    app.onRun();
                    confetti({ particleCount: 15, spread: 35 });
                  }}
                  className="bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff]/60 rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center group transition-all duration-150 active:scale-95 shadow-sm hover:shadow-md relative overflow-hidden"
                >
                  {/* Badge Top Right */}
                  <span className="absolute top-1.5 right-1.5 text-[8px] font-mono px-1 py-0.2 rounded bg-[#0d1117] text-[#8b949e] border border-[#30363d] group-hover:border-[#58a6ff]/40">
                    {app.badge}
                  </span>

                  {/* App Icon Tile */}
                  <div
                    className={`h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center mb-2 transition-transform duration-150 group-hover:scale-105 shadow-inner border ${app.bgColor} ${app.iconColor}`}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>

                  {/* App Title */}
                  <span className="text-[11px] sm:text-xs font-bold text-white group-hover:text-[#58a6ff] transition-colors leading-tight line-clamp-1">
                    {app.shortTitle}
                  </span>

                  {/* Sub-label */}
                  <span className="text-[9px] text-[#8b949e] font-mono mt-0.5 line-clamp-1">
                    {app.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Launchpad Strip */}
          <div className="p-3 bg-[#161b22]/60 border border-[#30363d] rounded-2xl flex items-center justify-between gap-3 text-xs text-[#8b949e]">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#3fb950]" />
              <span>Tap any icon above to instantly jump into that workspace module.</span>
            </div>
            <button
              onClick={() => setViewMode('backend')}
              className="text-[#bc8cff] hover:text-white font-mono text-[11px] font-bold flex items-center gap-1 shrink-0 bg-[#21262d] px-2 py-1 rounded-lg border border-[#30363d]"
            >
              <Server className="h-3 w-3" />
              <span>Open Backend APIs &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. OPTION B: DENSE LIST VIEW */}
      {viewMode === 'dense' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl divide-y divide-[#30363d] overflow-hidden shadow-sm">
          {filteredSubApps.map((app) => {
            const Icon = app.icon;
            return (
              <div
                key={app.id}
                onClick={app.onRun}
                className="p-3 hover:bg-[#21262d]/70 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl border ${app.bgColor} ${app.iconColor} shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-[#58a6ff] transition-colors">
                        {app.title}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#0d1117] text-[#8b949e] border border-[#30363d]">
                        {app.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8b949e] truncate mt-0.5">
                      {app.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-[#8b949e] hidden sm:inline">
                    {app.category}
                  </span>
                  <div className="p-1 rounded-lg bg-[#0d1117] text-[#8b949e] group-hover:text-white group-hover:bg-[#1f6feb] transition-colors">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. OPTION C: ISOLATED BACKEND API CONSOLE (Hidden by default unless toggled) */}
      {viewMode === 'backend' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-[#bc8cff]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Server-Side Microservices Sandbox ({filteredBackend.length} Endpoints)
              </span>
            </div>
            <button
              onClick={() => setViewMode('grid')}
              className="text-xs font-mono text-[#58a6ff] hover:underline flex items-center gap-1"
            >
              <span>Back to App Grid</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredBackend.map((fn) => {
              const Icon = fn.icon;
              const testResult = backendTestResults[fn.endpoint];

              return (
                <div
                  key={fn.endpoint}
                  className="bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/40 rounded-xl p-3 sm:p-3.5 transition-all space-y-2.5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-[#0d1117] border border-[#30363d] text-[#bc8cff] shrink-0 mt-0.5 sm:mt-0">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-white">{fn.name}</h4>
                          <span
                            className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded ${
                              fn.method === 'POST'
                                ? 'bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30'
                                : 'bg-[#238636]/20 text-[#3fb950] border border-[#3fb950]/30'
                            }`}
                          >
                            {fn.method}
                          </span>
                          <button
                            onClick={() => handleCopyEndpoint(fn.endpoint)}
                            title="Click to copy endpoint"
                            className="text-[10px] font-mono text-[#8b949e] hover:text-[#58a6ff] flex items-center gap-0.5"
                          >
                            <span>{fn.endpoint}</span>
                            {copiedEndpoint === fn.endpoint ? (
                              <Check className="h-2.5 w-2.5 text-[#3fb950]" />
                            ) : (
                              <Copy className="h-2.5 w-2.5 opacity-60" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-[#8b949e] mt-0.5">{fn.description}</p>
                      </div>
                    </div>

                    {/* Test Button */}
                    <button
                      onClick={() => testBackendEndpoint(fn.endpoint, fn.method, fn.payload)}
                      disabled={testResult?.loading}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-[#58a6ff]/50 text-xs font-bold text-white transition-all disabled:opacity-50 self-start sm:self-auto shrink-0 shadow-sm active:scale-95"
                    >
                      <Play className={`h-2.5 w-2.5 text-[#3fb950] ${testResult?.loading ? 'animate-spin' : ''}`} />
                      <span>{testResult?.loading ? 'Testing...' : 'Test API'}</span>
                    </button>
                  </div>

                  {/* Live JSON Response */}
                  {testResult && (
                    <div className="bg-[#090d13] border border-[#30363d] rounded-xl p-2.5 font-mono text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#8b949e] border-b border-[#21262d] pb-1">
                        <div className="flex items-center gap-1.5">
                          {testResult.error ? (
                            <span className="text-[#f85149] font-bold flex items-center gap-1">
                              <ShieldAlert className="h-2.5 w-2.5" />
                              Error
                            </span>
                          ) : (
                            <span className="text-[#3fb950] font-bold flex items-center gap-1">
                              <Check className="h-2.5 w-2.5" />
                              200 OK
                            </span>
                          )}
                          <span>({testResult.endpoint})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px]">
                          {testResult.latencyMs && (
                            <span className="text-[#3fb950] font-semibold">{testResult.latencyMs}ms</span>
                          )}
                          <span>{testResult.timestamp}</span>
                        </div>
                      </div>

                      <pre className="text-[#79c0ff] overflow-x-auto whitespace-pre-wrap max-h-36 scrollbar-none pt-1">
                        {testResult.error
                          ? JSON.stringify({ error: testResult.error }, null, 2)
                          : JSON.stringify(testResult.response, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Web Docs Search Explorer Modal */}
      <WebDocsSearchModal
        isOpen={isWebSearchModalOpen}
        onClose={() => setIsWebSearchModalOpen(false)}
        onApplyCodeSnippet={(code) => {
          setIsWebSearchModalOpen(false);
          onSelectFunction('coder');
        }}
      />
    </div>
  );
};
