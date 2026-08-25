import React, { useState, useEffect } from 'react';
import {
  Database,
  Brain,
  Sparkles,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileCode2,
  Layers,
  Sliders,
  Terminal,
  Activity,
  Zap,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  Lock,
  ArrowRight,
  Wifi,
  WifiOff,
  Cloud,
  FileCheck2,
  Eye,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProjectFile } from '../types';
import {
  MemoryService,
  DEFAULT_TURSO_CONFIG
} from '../utils/turso/memoryService';
import {
  TursoConfig,
  AiKnowledgeRecord,
  CodingPreferenceRecord,
  FileIndexRecord,
  BuildLogRecord,
  ProjectSummaryRecord,
  TursoRagQueryResult,
  TursoSyncState
} from '../utils/turso/types';

interface TursoMemoryTabProps {
  files: ProjectFile[];
  onOpenQuickPush?: () => void;
  onGoToCoder?: () => void;
  onAddFile?: (newFile: ProjectFile) => void;
}

export const TursoMemoryTab: React.FC<TursoMemoryTabProps> = ({
  files,
  onGoToCoder,
  onAddFile
}) => {
  const [config, setConfig] = useState<TursoConfig>(MemoryService.getConfig());
  const [syncState, setSyncState] = useState<TursoSyncState>(MemoryService.getSyncState());
  const [activeTab, setActiveTab] = useState<
    'knowledge' | 'preferences' | 'file_index' | 'project_summary' | 'build_logs' | 'rag_simulator' | 'android_native'
  >('knowledge');

  // Memory Records State
  const [knowledgeList, setKnowledgeList] = useState<AiKnowledgeRecord[]>([]);
  const [preferencesList, setPreferencesList] = useState<CodingPreferenceRecord[]>([]);
  const [fileIndexList, setFileIndexList] = useState<FileIndexRecord[]>([]);
  const [projectSummary, setProjectSummary] = useState<ProjectSummaryRecord | null>(null);
  const [buildLogsList, setBuildLogsList] = useState<BuildLogRecord[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals & Panels
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testConnResult, setTestConnResult] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
  } | null>(null);

  // Forms
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newKnowledgeCategory, setNewKnowledgeCategory] = useState<AiKnowledgeRecord['category']>('architecture');
  const [newTags, setNewTags] = useState('');

  const [isAddingPref, setIsAddingPref] = useState(false);
  const [newPrefKey, setNewPrefKey] = useState('');
  const [newPrefVal, setNewPrefVal] = useState('');
  const [newPrefCategory, setNewPrefCategory] = useState<CodingPreferenceRecord['category']>('code_style');

  // RAG Simulator
  const [ragTestQuery, setRagTestQuery] = useState('How is the POSIX terminal PTY implemented in NDK?');
  const [ragResult, setRagResult] = useState<TursoRagQueryResult | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Toast / Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Environment Variable Info
  const [envInfo, setEnvInfo] = useState<{
    hasEnvUrl: boolean;
    hasEnvToken: boolean;
    configuredInServer: boolean;
    maskedUrl?: string;
    databaseUrl?: string;
  }>({ hasEnvUrl: false, hasEnvToken: false, configuredInServer: false });

  useEffect(() => {
    refreshData();
    fetch('/api/turso-info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setEnvInfo(data);
          if (data.databaseUrl && (!config.databaseUrl || config.databaseUrl === DEFAULT_TURSO_CONFIG.databaseUrl)) {
            setConfig((prev) => ({ ...prev, databaseUrl: data.databaseUrl }));
          }
        }
      })
      .catch(() => {});

    const unsubscribe = MemoryService.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTab === 'rag_simulator') {
      runRagSimulation(ragTestQuery);
    }
  }, [activeTab]);

  const refreshData = () => {
    setConfig(MemoryService.getConfig());
    setSyncState(MemoryService.getSyncState());
    setKnowledgeList(MemoryService.getKnowledge());
    setPreferencesList(MemoryService.getPreferences());
    setFileIndexList(MemoryService.getFileIndex());
    setProjectSummary(MemoryService.getProjectSummary());
    setBuildLogsList(MemoryService.getBuildLogs());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveConfig = () => {
    MemoryService.saveConfig(config);
    showToast('Turso database configuration saved!');
    setIsConfigOpen(false);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setTestConnResult(null);
    try {
      const client = MemoryService.getClient();
      client.setConfig(config);
      const res = await client.testConnection();
      setTestConnResult(res);
      if (res.success) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }
    } catch (e: any) {
      setTestConnResult({ success: false, message: e.message, latencyMs: 0 });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSyncNow = async () => {
    const res = await MemoryService.syncAll();
    if (res.success) {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.5 } });
      showToast(res.message);
    } else {
      showToast(`Sync Failed: ${res.message}`);
    }
  };

  const handleIndexWorkspace = () => {
    const res = MemoryService.indexWorkspaceFiles(files);
    showToast(`Indexed ${res.indexedCount} files into Turso File Index (~${res.totalTokens} tokens metadata)`);
    confetti({ particleCount: 40, spread: 55, origin: { y: 0.6 } });
    setActiveTab('file_index');
  };

  const handleAddKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !newContent.trim()) return;

    const tagsArr = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    MemoryService.addOrUpdateKnowledge({
      category: newKnowledgeCategory,
      topic: newTopic.trim(),
      content: newContent.trim(),
      tags: tagsArr,
      confidence: 0.95
    });

    setNewTopic('');
    setNewContent('');
    setNewTags('');
    setIsAddingKnowledge(false);
    showToast('Knowledge item added to Turso long-term memory');
  };

  const handleAddPref = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrefKey.trim() || !newPrefVal.trim()) return;

    MemoryService.addOrUpdatePreference({
      category: newPrefCategory,
      keyName: newPrefKey.trim(),
      preferenceValue: newPrefVal.trim(),
      scope: 'global'
    });

    setNewPrefKey('');
    setNewPrefVal('');
    setIsAddingPref(false);
    showToast('Coding preference saved to Turso memory');
  };

  const runRagSimulation = (query: string) => {
    setRagTestQuery(query);
    const result = MemoryService.queryRagMemory(query, 5);
    setRagResult(result);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Filtered knowledge
  const filteredKnowledge = knowledgeList.filter((k) => {
    const matchesCat = categoryFilter === 'all' || k.category === categoryFilter;
    const matchesSearch =
      searchQuery === '' ||
      k.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Filtered file index
  const filteredFileIndex = fileIndexList.filter((f) => {
    return (
      searchQuery === '' ||
      f.filePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.symbols.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] text-[#c9d1d9] overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-[#1f6feb] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-[#388bfd] animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-mono font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Header / Turso Status Hero */}
      <div className="border-b border-[#30363d] bg-[#161b22]/90 backdrop-blur px-4 py-3 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00eb87] to-[#0094f7] p-0.5 shadow-md flex items-center justify-center">
              <div className="h-full w-full bg-[#0d1117] rounded-[10px] flex items-center justify-center">
                <Database className="h-5 w-5 text-[#00eb87]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight font-mono flex items-center gap-2">
                  <span>TURSO MEMORY</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00eb87]/20 text-[#00eb87] border border-[#00eb87]/40 font-bold uppercase">
                    SQLite Cloud
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-[#8b949e]">
                Long-Term Memory Database & Retrieval-Augmented Generation (RAG) for Android AI Agent
              </p>
            </div>
          </div>

          {/* Quick Action Controls & Status Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Online / Sync Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#21262d] border border-[#30363d] text-xs font-mono">
              <Cloud className="h-3.5 w-3.5 text-[#00eb87]" />
              <span className="text-[#8b949e] hidden sm:inline">Turso:</span>
              <span className="text-white font-medium truncate max-w-[140px]">
                {config.databaseName || 'Memory DB'}
              </span>
              {syncState.pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/40 text-[10px]">
                  {syncState.pendingCount} pending
                </span>
              )}
            </div>

            {/* Sync Now Button */}
            <button
              onClick={handleSyncNow}
              disabled={syncState.isSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                syncState.isSyncing
                  ? 'bg-[#21262d] text-[#8b949e] border-[#30363d] cursor-wait'
                  : 'bg-[#238636] hover:bg-[#2ea043] text-white border-[#2ea043] shadow-md shadow-[#238636]/20 active:scale-95'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              <span>{syncState.isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>

            {/* Index Workspace Files */}
            <button
              onClick={handleIndexWorkspace}
              title="Index current workspace files into Turso File Index (Metadata ONLY - NO source code)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-white border border-[#30363d] hover:border-[#58a6ff]/50 text-xs font-mono transition-all active:scale-95"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Index Workspace</span>
            </button>

            {/* Connection Config Button */}
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className={`p-1.5 rounded-xl border text-xs transition-all ${
                isConfigOpen
                  ? 'bg-[#1f6feb] text-white border-[#388bfd]'
                  : 'bg-[#21262d] text-[#c9d1d9] border-[#30363d] hover:bg-[#30363d]'
              }`}
              title="Turso Connection Settings"
            >
              <Sliders className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Database Config Drawer / Panel */}
        {isConfigOpen && (
          <div className="mt-3 pt-3 border-t border-[#30363d] grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#0d1117]/80 p-3 rounded-xl border border-[#30363d]/80 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="md:col-span-5 space-y-1">
              <label className="text-[11px] font-mono text-[#8b949e] flex items-center justify-between">
                <span>DATABASE URL (LibSQL / HTTPS)</span>
                <span className="text-[10px] text-[#00eb87]">SQLite Compatible</span>
              </label>
              <input
                type="text"
                value={config.databaseUrl}
                onChange={(e) => setConfig({ ...config, databaseUrl: e.target.value })}
                placeholder="https://my-memory-db-org.turso.io"
                className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#00eb87] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="text-[11px] font-mono text-[#8b949e]">AUTH TOKEN (TURSO BEARER JWT)</label>
              <input
                type="password"
                value={config.authToken}
                onChange={(e) => setConfig({ ...config, authToken: e.target.value })}
                placeholder="eyJhbGciOiJFZERTQ..."
                className="w-full bg-[#161b22] border border-[#30363d] focus:border-[#00eb87] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 flex items-end gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConn}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] text-xs font-mono font-medium flex items-center justify-center gap-1.5"
              >
                <Activity className={`h-3.5 w-3.5 text-[#00eb87] ${isTestingConn ? 'animate-pulse' : ''}`} />
                <span>{isTestingConn ? 'Testing...' : 'Test DB'}</span>
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-1.5 rounded-lg bg-[#00eb87] hover:bg-[#00c974] text-[#0d1117] font-bold text-xs font-mono shadow-md"
              >
                Save
              </button>
            </div>

            {/* Environment Variables Info Box */}
            <div className="md:col-span-12 p-2.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs font-mono flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-[#00eb87]" />
                <span className="text-[#8b949e]">Environment Variables:</span>
                <span className="text-white font-semibold">TURSO_DATABASE_URL</span>
                <span className="text-[#8b949e]">&amp;</span>
                <span className="text-white font-semibold">TURSO_AUTH_TOKEN</span>
              </div>
              <div className="flex items-center gap-2">
                {envInfo.configuredInServer ? (
                  <span className="px-2 py-0.5 rounded-md bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40 text-[10px] font-bold">
                    ✓ Configured on Server ({envInfo.maskedUrl || 'Active'})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-[#21262d] text-[#8b949e] border border-[#30363d] text-[10px]">
                    Available via Settings or .env
                  </span>
                )}
              </div>
            </div>

            {testConnResult && (
              <div
                className={`md:col-span-12 p-2 rounded-lg text-xs font-mono flex items-center gap-2 ${
                  testConnResult.success
                    ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40'
                    : 'bg-[#f85149]/20 text-[#ff7b72] border border-[#f85149]/40'
                }`}
              >
                {testConnResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>{testConnResult.message}</span>
                {testConnResult.latencyMs !== undefined && (
                  <span className="ml-auto text-[10px] opacity-75">({testConnResult.latencyMs}ms)</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Safety Banner: Strict Code Exclusion Proof */}
      <div className="px-4 py-2 bg-[#161b22]/50 border-b border-[#30363d] flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2 text-[#3fb950]">
          <ShieldCheck className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>TURSO SAFETY GUARANTEE:</strong> App source code is NEVER stored in Turso. Only project summaries,
            symbol indices, build logs, and learned preferences are persisted.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[#8b949e]">
          <span>Offline SQLite Cache: Active</span>
          <span>•</span>
          <span>RAG Retrieval: Active</span>
        </div>
      </div>

      {/* Sub-Tabs Bar */}
      <div className="px-4 py-2 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 flex-nowrap">
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap ${
              activeTab === 'knowledge'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            <span>AI Knowledge ({knowledgeList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Preferences ({preferencesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('file_index')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap ${
              activeTab === 'file_index'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            <span>File Index ({fileIndexList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('project_summary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap ${
              activeTab === 'project_summary'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Project Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('build_logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap ${
              activeTab === 'build_logs'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Build Logs ({buildLogsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rag_simulator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === 'rag_simulator'
                ? 'bg-gradient-to-r from-[#00eb87] to-[#0094f7] text-[#0d1117] shadow-md'
                : 'text-[#00eb87] hover:bg-[#21262d]'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>RAG Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('android_native')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap ${
              activeTab === 'android_native'
                ? 'bg-[#8957e5] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Android Native (Kotlin)</span>
          </button>
        </div>
      </div>

      {/* Main Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* =========================================================================
            TAB 1: AI KNOWLEDGE BASE
           ========================================================================= */}
        {activeTab === 'knowledge' && (
          <div className="space-y-4">
            {/* Knowledge Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b22] p-3 rounded-xl border border-[#30363d]">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b949e]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search AI architectural knowledge & rules..."
                    className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder-[#6e7681] focus:outline-none"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] text-xs font-mono text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="architecture">Architecture</option>
                  <option value="rule">Rules & Constraints</option>
                  <option value="ndk_posix">NDK POSIX</option>
                  <option value="android_api">Android APIs</option>
                  <option value="troubleshooting">Troubleshooting</option>
                  <option value="learning">Learned Insights</option>
                </select>
              </div>

              <button
                onClick={() => setIsAddingKnowledge(!isAddingKnowledge)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-mono font-bold transition-all shadow-sm active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Knowledge</span>
              </button>
            </div>

            {/* Add Knowledge Form */}
            {isAddingKnowledge && (
              <form
                onSubmit={handleAddKnowledge}
                className="p-4 bg-[#161b22] border border-[#30363d] rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 shadow-xl"
              >
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#58a6ff]" />
                  <span>Store New AI Long-Term Knowledge in Turso</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[11px] font-mono text-[#8b949e]">TOPIC / CONCEPT</label>
                    <input
                      type="text"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="e.g. Scoped Storage MediaStore Access Pattern"
                      required
                      className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-[#8b949e]">CATEGORY</label>
                    <select
                      value={newKnowledgeCategory}
                      onChange={(e) => setNewKnowledgeCategory(e.target.value as any)}
                      className="w-full bg-[#0d1117] border border-[#30363d] text-xs font-mono text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="architecture">Architecture</option>
                      <option value="rule">Rule / Constraint</option>
                      <option value="ndk_posix">NDK POSIX</option>
                      <option value="android_api">Android API</option>
                      <option value="troubleshooting">Troubleshooting</option>
                      <option value="learning">Learned</option>
                    </select>
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[11px] font-mono text-[#8b949e]">CONTENT & VERIFIED FACTS</label>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      rows={3}
                      placeholder="Detailed explanation, constraints, and best practices..."
                      required
                      className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[11px] font-mono text-[#8b949e]">TAGS (COMMA SEPARATED)</label>
                    <input
                      type="text"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="android, storage, api34, saf"
                      className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 px-4 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white font-mono font-bold text-xs transition-all shadow-md"
                    >
                      Save to Turso
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingKnowledge(false)}
                      className="py-1.5 px-3 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] font-mono text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Knowledge Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredKnowledge.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/40 rounded-xl p-3.5 space-y-2.5 transition-all shadow-sm group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30 font-semibold uppercase">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-white font-mono">{item.topic}</h4>
                    </div>

                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          MemoryService.deleteKnowledge(item.id);
                          showToast('Item removed from memory');
                        }}
                        title="Delete knowledge"
                        className="p-1 rounded-md hover:bg-[#da3633]/20 hover:text-[#f85149] text-[#8b949e] transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#c9d1d9] leading-relaxed font-sans">{item.content}</p>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#30363d]/60 text-[10px] font-mono text-[#8b949e]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.tags.map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e]">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span className="text-[#3fb950] font-medium">
                      {(item.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: CODING PREFERENCES
           ========================================================================= */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#161b22] p-3 rounded-xl border border-[#30363d]">
              <div>
                <h3 className="text-xs font-bold text-white font-mono">USER CODING PREFERENCES & CONVENTIONS</h3>
                <p className="text-[11px] text-[#8b949e]">
                  These style guidelines are injected into AI prompts to enforce consistent Kotlin and NDK patterns.
                </p>
              </div>

              <button
                onClick={() => setIsAddingPref(!isAddingPref)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-mono font-bold transition-all shadow-sm active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Preference</span>
              </button>
            </div>

            {isAddingPref && (
              <form
                onSubmit={handleAddPref}
                className="p-4 bg-[#161b22] border border-[#30363d] rounded-xl space-y-3 animate-in fade-in duration-150 shadow-xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-[#8b949e]">PREFERENCE NAME</label>
                    <input
                      type="text"
                      value={newPrefKey}
                      onChange={(e) => setNewPrefKey(e.target.value)}
                      placeholder="e.g. Async Library"
                      required
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-[#8b949e]">CATEGORY</label>
                    <select
                      value={newPrefCategory}
                      onChange={(e) => setNewPrefCategory(e.target.value as any)}
                      className="w-full bg-[#0d1117] border border-[#30363d] text-xs font-mono text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="code_style">Code Style</option>
                      <option value="framework">UI Framework</option>
                      <option value="library">Libraries</option>
                      <option value="concurrency">Concurrency</option>
                      <option value="build_tool">Build Tools</option>
                    </select>
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[11px] font-mono text-[#8b949e]">PREFERENCE VALUE / RULE</label>
                    <input
                      type="text"
                      value={newPrefVal}
                      onChange={(e) => setNewPrefVal(e.target.value)}
                      placeholder="e.g. Prefer Kotlin Coroutines (Dispatchers.IO) with StateFlow"
                      required
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white font-mono font-bold text-xs"
                    >
                      Save Preference
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingPref(false)}
                      className="px-3 py-1.5 rounded-lg bg-[#21262d] text-[#8b949e] font-mono text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {preferencesList.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8957e5]/20 text-[#d2a8ff] border border-[#8957e5]/30 uppercase font-semibold">
                        {p.category}
                      </span>
                      <span className="text-xs font-bold text-white font-mono">{p.keyName}</span>
                    </div>
                    <p className="text-xs text-[#c9d1d9]">{p.preferenceValue}</p>
                  </div>

                  <button
                    onClick={() => {
                      MemoryService.deletePreference(p.id);
                      showToast('Preference deleted');
                    }}
                    className="p-1 rounded-md hover:bg-[#da3633]/20 hover:text-[#f85149] text-[#8b949e] opacity-60 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: FILE INDEX METADATA (NO SOURCE CODE)
           ========================================================================= */}
        {activeTab === 'file_index' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161b22] p-3 rounded-xl border border-[#30363d]">
              <div>
                <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                  <span>TURSO WORKSPACE FILE INDEX (METADATA ONLY)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
                    Source Code Excluded
                  </span>
                </h3>
                <p className="text-[11px] text-[#8b949e]">
                  Index containing file paths, symbols, token metrics, and structural summaries used for RAG relevance.
                </p>
              </div>

              <button
                onClick={handleIndexWorkspace}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-mono font-bold transition-all shadow-md active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Re-index Workspace ({files.length} files)</span>
              </button>
            </div>

            {/* File Table */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0d1117] text-[#8b949e] border-b border-[#30363d]">
                    <tr>
                      <th className="px-3 py-2.5">FILE PATH & NAME</th>
                      <th className="px-3 py-2.5">CATEGORY</th>
                      <th className="px-3 py-2.5">LANGUAGE</th>
                      <th className="px-3 py-2.5">SUMMARY</th>
                      <th className="px-3 py-2.5">EXPORTED SYMBOLS</th>
                      <th className="px-3 py-2.5">TOKENS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30363d]/60">
                    {filteredFileIndex.map((item) => (
                      <tr key={item.id} className="hover:bg-[#21262d]/50 transition-colors">
                        <td className="px-3 py-2 text-white font-medium">
                          <div className="flex flex-col">
                            <span className="text-white font-bold">{item.fileName}</span>
                            <span className="text-[10px] text-[#8b949e] truncate max-w-[200px]">{item.filePath}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] text-[10px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[#58a6ff]">{item.language}</td>
                        <td className="px-3 py-2 text-[#c9d1d9] text-[11px] max-w-[260px] truncate">{item.summary}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                            {item.symbols.slice(0, 3).map((sym, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.2 rounded bg-[#00eb87]/15 text-[#00eb87] text-[9px] border border-[#00eb87]/30"
                              >
                                {sym}
                              </span>
                            ))}
                            {item.symbols.length > 3 && (
                              <span className="text-[9px] text-[#8b949e]">+{item.symbols.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-[#8b949e]">{item.tokenCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: PROJECT SUMMARY
           ========================================================================= */}
        {activeTab === 'project_summary' && projectSummary && (
          <div className="space-y-4">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#58a6ff]" />
                  <span>{projectSummary.projectName}</span>
                </h3>
                <span className="text-[10px] font-mono text-[#8b949e]">
                  Last Updated: {new Date(projectSummary.updatedAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-xs text-[#c9d1d9] leading-relaxed">{projectSummary.overview}</p>

              <div className="pt-3 border-t border-[#30363d] space-y-2">
                <h4 className="text-[11px] font-bold text-[#8b949e] font-mono uppercase">
                  ACTIVE DECOUPLED MODULES ({projectSummary.modules.length})
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {projectSummary.modules.map((mod, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30 text-xs font-mono font-medium"
                    >
                      :{mod}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#30363d] space-y-2">
                <h4 className="text-[11px] font-bold text-[#8b949e] font-mono uppercase">TECH STACK</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {projectSummary.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#21262d] text-white border border-[#30363d] text-xs font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#30363d] space-y-2">
                <h4 className="text-[11px] font-bold text-[#8b949e] font-mono uppercase">KEY HIGHLIGHTS</h4>
                <ul className="space-y-1 text-xs text-[#c9d1d9]">
                  {projectSummary.keyHighlights.map((hl, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#3fb950] flex-shrink-0" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: BUILD LOGS
           ========================================================================= */}
        {activeTab === 'build_logs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-[#161b22] p-3 rounded-xl border border-[#30363d]">
              <div>
                <h3 className="text-xs font-bold text-white font-mono">HISTORICAL BUILD LOGS & DIAGNOSTIC FIXES</h3>
                <p className="text-[11px] text-[#8b949e]">
                  Past build results, compiler warnings, and applied fixes recorded in Turso for RAG debugging.
                </p>
              </div>

              <button
                onClick={() => {
                  MemoryService.recordBuildLog({
                    buildType: 'release_apk',
                    status: 'success',
                    diagnostics: ['ProGuard R8 passed', 'Native PTY SO linked', 'APK signed'],
                    terminalOutputPreview: 'BUILD SUCCESSFUL in 3.48s (18 actionable tasks: 4 executed, 14 up-to-date)'
                  });
                  showToast('Recorded sample build log to Turso memory');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-mono border border-[#30363d]"
              >
                + Record Test Build
              </button>
            </div>

            <div className="space-y-2.5">
              {buildLogsList.map((log) => (
                <div key={log.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          log.status === 'success'
                            ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40'
                            : 'bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/40'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-xs font-bold text-white font-mono">{log.buildType}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8b949e]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {log.errorSummary && (
                    <p className="text-xs font-mono text-[#f85149] bg-[#da3633]/10 p-2 rounded-lg border border-[#da3633]/30">
                      {log.errorSummary}
                    </p>
                  )}

                  <pre className="text-[11px] font-mono text-[#8b949e] bg-[#0d1117] p-2.5 rounded-lg overflow-x-auto">
                    {log.terminalOutputPreview}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: LIVE RAG SIMULATOR
           ========================================================================= */}
        {activeTab === 'rag_simulator' && (
          <div className="space-y-4">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3 shadow-md">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#00eb87]" />
                <span>Turso RAG Query Simulator (Test Relevance Scoring)</span>
              </h3>

              <p className="text-xs text-[#8b949e]">
                Type a prompt to test how the Turso SQLite RAG engine retrieves architectural rules, user preferences,
                and file index metadata to inject into Gemini or Qwen AI Copilot before answering.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={ragTestQuery}
                  onChange={(e) => runRagSimulation(e.target.value)}
                  placeholder="e.g. How does PTY forkpty work in Android NDK?"
                  className="flex-1 bg-[#0d1117] border border-[#30363d] focus:border-[#00eb87] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
                <button
                  onClick={() => runRagSimulation(ragTestQuery)}
                  className="px-4 py-2 rounded-lg bg-[#00eb87] hover:bg-[#00c974] text-[#0d1117] font-mono font-bold text-xs shadow-md"
                >
                  Query RAG
                </button>
              </div>

              {/* Preset Sample Queries */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] font-mono text-[#8b949e]">Sample Queries:</span>
                {[
                  'What are the NDK POSIX standards?',
                  'How is Scoped Storage handled in Android 14?',
                  'What UI toolkit preferences are saved?',
                  'Where is Sora Editor configured in modules?'
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => runRagSimulation(sample)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] border border-[#30363d] transition-all"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* RAG Results Display */}
            {ragResult && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Retrieved Breakdown */}
                <div className="md:col-span-5 space-y-3">
                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-white font-mono flex items-center justify-between">
                      <span>RETRIEVED MEMORY DOMAINS</span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-[#00eb87]/20 text-[#00eb87] font-bold">
                        Score: {(ragResult.matchScore * 100).toFixed(0)}%
                      </span>
                    </h4>

                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between p-1.5 bg-[#0d1117] rounded border border-[#30363d]/50">
                        <span className="text-[#8b949e]">Knowledge Rules:</span>
                        <span className="text-white font-bold">{ragResult.knowledge.length} items</span>
                      </div>
                      <div className="flex justify-between p-1.5 bg-[#0d1117] rounded border border-[#30363d]/50">
                        <span className="text-[#8b949e]">Coding Preferences:</span>
                        <span className="text-white font-bold">{ragResult.preferences.length} items</span>
                      </div>
                      <div className="flex justify-between p-1.5 bg-[#0d1117] rounded border border-[#30363d]/50">
                        <span className="text-[#8b949e]">File Index Matches:</span>
                        <span className="text-white font-bold">{ragResult.fileIndexMatches.length} files</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formatted Prompt Preview */}
                <div className="md:col-span-7 space-y-2">
                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <Terminal className="h-3.5 w-3.5 text-[#58a6ff]" />
                        <span>PROMPT CONTEXT INJECTOR PREVIEW</span>
                      </h4>

                      <button
                        onClick={() => copyToClipboard(ragResult.formattedContextBlock)}
                        className="flex items-center gap-1 text-[11px] font-mono text-[#58a6ff] hover:underline"
                      >
                        {copiedPrompt ? <Check className="h-3.5 w-3.5 text-[#3fb950]" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <pre className="text-[11px] font-mono text-[#c9d1d9] bg-[#0d1117] p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[300px]">
                      {ragResult.formattedContextBlock}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 7: ANDROID NATIVE KOTLIN ARCHITECTURE
           ========================================================================= */}
        {activeTab === 'android_native' && (
          <div className="space-y-4">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#8957e5]" />
                <span>NATIVE ANDROID KOTLIN ARCHITECTURE FOR TURSO MEMORY</span>
              </h3>
              <p className="text-xs text-[#8b949e]">
                Clean `MemoryService` and `TursoClient` architecture implemented for the Android application:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  title: 'TursoClient.kt',
                  path: 'sandbox/turso/TursoClient.kt',
                  desc: 'High-performance OkHttp client communicating with Turso LibSQL v2 Pipeline HTTP API with parameterized execution.'
                },
                {
                  title: 'MemoryService.kt',
                  path: 'sandbox/turso/MemoryService.kt',
                  desc: 'High-level memory orchestrator handling Project Summaries, File Index metadata, Build Logs, AI Knowledge, and Offline Cloud Sync.'
                },
                {
                  title: 'TursoMemoryDatabase.kt',
                  path: 'sandbox/turso/TursoMemoryDatabase.kt',
                  desc: 'Android Room SQLite database caching memories locally with zero network latency when offline.'
                },
                {
                  title: 'RagMemoryRetriever.kt',
                  path: 'sandbox/turso/RagMemoryRetriever.kt',
                  desc: 'Retrieval-Augmented Generation query engine scoring token relevance and assembling LLM context blocks.'
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{item.title}</span>
                    <span className="text-[10px] font-mono text-[#8957e5] bg-[#8957e5]/20 px-2 py-0.5 rounded border border-[#8957e5]/30">
                      Kotlin
                    </span>
                  </div>
                  <p className="text-xs text-[#8b949e]">{item.desc}</p>
                  <div className="pt-2 text-[10px] font-mono text-[#58a6ff]">{item.path}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
