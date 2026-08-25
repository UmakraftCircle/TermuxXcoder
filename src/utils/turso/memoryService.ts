import {
  TursoConfig,
  ProjectSummaryRecord,
  FileIndexRecord,
  BuildLogRecord,
  AiKnowledgeRecord,
  CodingPreferenceRecord,
  TursoRagQueryResult,
  TursoSyncState
} from './types';
import { TursoClient } from './tursoClient';
import { ProjectFile } from '../../types';

const TURSO_CONFIG_KEY = 'umakraft_turso_config_v1';
const LOCAL_PROJECT_SUMMARY_KEY = 'umakraft_turso_project_summary_v1';
const LOCAL_FILE_INDEX_KEY = 'umakraft_turso_file_index_v1';
const LOCAL_BUILD_LOGS_KEY = 'umakraft_turso_build_logs_v1';
const LOCAL_AI_KNOWLEDGE_KEY = 'umakraft_turso_ai_knowledge_v1';
const LOCAL_CODING_PREFS_KEY = 'umakraft_turso_coding_prefs_v1';

export const DEFAULT_TURSO_CONFIG: TursoConfig = {
  databaseUrl: 'https://umakraft-memory-db-sample.turso.io',
  authToken: '',
  databaseName: 'umakraft-agent-memory',
  autoSyncEnabled: true,
  syncIntervalSeconds: 60
};

export const INITIAL_KNOWLEDGE_SEED: AiKnowledgeRecord[] = [
  {
    id: 'k-1',
    category: 'architecture',
    topic: '10-Module Decoupled Architecture',
    content: 'Modular Android architecture divided into app, common, editor (Sora Editor 0.23.5), terminal (POSIX PTY JNI), filesystem (Scoped Storage API 29-34), git (JGit), lsp, debugger, ai, and workspace.',
    confidence: 1.0,
    tags: ['android', 'modules', 'architecture', 'sora-editor'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced'
  },
  {
    id: 'k-2',
    category: 'rule',
    topic: 'Target SDK & Scoped Storage Compliance',
    content: 'Min SDK is 29 (Android 10), Target SDK is 34 (Android 14). Raw /sdcard file access is prohibited; use SAF DocumentTree and MediaStore ContentResolver.',
    confidence: 1.0,
    tags: ['storage', 'saf', 'api34', 'android14'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced'
  },
  {
    id: 'k-3',
    category: 'ndk_posix',
    topic: 'Native PTY Forkpty Subprocess',
    content: 'Bionic libc POSIX forkpty() handles terminal emulation. Compiled with CMake 3.22.1 for arm64-v8a, armeabi-v7a, and x86_64 architectures with raw termios configuration.',
    confidence: 0.98,
    tags: ['ndk', 'c++', 'pty', 'posix', 'cmake'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced'
  },
  {
    id: 'k-4',
    category: 'troubleshooting',
    topic: 'ProGuard R8 JGit & Sora Rules',
    content: 'Ensure proguard-rules.pro keeps org.eclipse.jgit.** and io.github.rosemoe.sora.** reflection symbols to prevent release APK crash during minification.',
    confidence: 0.95,
    tags: ['proguard', 'r8', 'release', 'jgit'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced'
  }
];

export const INITIAL_PREFERENCES_SEED: CodingPreferenceRecord[] = [
  {
    id: 'p-1',
    category: 'code_style',
    keyName: 'Language Paradigm',
    preferenceValue: 'Strict Kotlin Coroutines with StateFlow and structured concurrency. No blocking Thread.sleep in UI thread.',
    scope: 'global',
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced'
  },
  {
    id: 'p-2',
    category: 'framework',
    keyName: 'UI Toolkit',
    preferenceValue: 'Jetpack Compose for new components; XML ViewBinding with Sora Editor for high-performance text viewports.',
    scope: 'global',
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced'
  },
  {
    id: 'p-3',
    category: 'build_tool',
    keyName: 'Gradle Scripting',
    preferenceValue: 'Kotlin DSL (build.gradle.kts) with Gradle Version Catalogs (libs.versions.toml).',
    scope: 'global',
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced'
  }
];

export const INITIAL_PROJECT_SUMMARY_SEED: ProjectSummaryRecord = {
  id: 'proj-umakraft',
  projectName: 'Umakraft TermuxXCoder IDE',
  overview: 'Full-featured on-device Android IDE featuring native PTY terminal, Sora code editor, JGit integration, Scoped Storage SAF file manager, and local/cloud AI copilot.',
  modules: ['app', 'common', 'editor', 'terminal', 'filesystem', 'git', 'lsp', 'debugger', 'ai', 'workspace'],
  techStack: ['Kotlin 2.0', 'Android SDK 34', 'Sora Editor 0.23.5', 'JGit 6.8', 'CMake 3.22 NDK r26b', 'Turso SQLite LibSQL', 'Gemini 3.7 Flash'],
  keyHighlights: [
    '10 decoupled Gradle modules for fast parallel builds',
    'Posix forkpty native terminal bridge supporting arm64 & x86_64',
    'Offline-first Turso SQLite memory database with RAG retrieval',
    'GitHub Actions CI/CD matrix for automated release APK signing'
  ],
  updatedAt: new Date().toISOString(),
  syncStatus: 'synced'
};

export class MemoryService {
  private static client: TursoClient | null = null;
  private static listeners: Set<() => void> = new Set();
  private static syncIntervalTimer: any = null;

  private static syncState: TursoSyncState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    error: null,
    connectedDb: null
  };

  /**
   * Subscribe to memory updates
   */
  public static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static notify() {
    this.updatePendingCount();
    this.listeners.forEach((l) => l());
  }

  /**
   * Load and initialize Turso Client configuration
   */
  public static getConfig(): TursoConfig {
    try {
      const raw = localStorage.getItem(TURSO_CONFIG_KEY);
      if (!raw) return DEFAULT_TURSO_CONFIG;
      return { ...DEFAULT_TURSO_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_TURSO_CONFIG;
    }
  }

  public static saveConfig(cfg: TursoConfig): void {
    try {
      localStorage.setItem(TURSO_CONFIG_KEY, JSON.stringify(cfg));
      if (this.client) {
        this.client.setConfig(cfg);
      } else {
        this.client = new TursoClient(cfg);
      }
      this.notify();
    } catch (e) {
      console.error('Failed to save Turso config:', e);
    }
  }

  public static getClient(): TursoClient {
    if (!this.client) {
      this.client = new TursoClient(this.getConfig());
    }
    return this.client;
  }

  public static getSyncState(): TursoSyncState {
    return { ...this.syncState };
  }

  private static updatePendingCount() {
    const kPending = this.getKnowledge().filter((k) => k.syncStatus !== 'synced').length;
    const pPending = this.getPreferences().filter((p) => p.syncStatus !== 'synced').length;
    const fPending = this.getFileIndex().filter((f) => f.syncStatus !== 'synced').length;
    const bPending = this.getBuildLogs().filter((b) => b.syncStatus !== 'synced').length;
    const proj = this.getProjectSummary();
    const projPending = proj && proj.syncStatus !== 'synced' ? 1 : 0;

    this.syncState.pendingCount = kPending + pPending + fPending + bPending + projPending;
  }

  // ==========================================
  // 1. PROJECT SUMMARY MANAGEMENT
  // ==========================================

  public static getProjectSummary(): ProjectSummaryRecord {
    try {
      const raw = localStorage.getItem(LOCAL_PROJECT_SUMMARY_KEY);
      if (!raw) {
        this.saveProjectSummary(INITIAL_PROJECT_SUMMARY_SEED, true);
        return INITIAL_PROJECT_SUMMARY_SEED;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_PROJECT_SUMMARY_SEED;
    }
  }

  public static saveProjectSummary(summary: ProjectSummaryRecord, isInitial = false): void {
    try {
      const updated: ProjectSummaryRecord = {
        ...summary,
        updatedAt: new Date().toISOString(),
        syncStatus: isInitial ? 'synced' : 'pending_upload'
      };
      localStorage.setItem(LOCAL_PROJECT_SUMMARY_KEY, JSON.stringify(updated));
      this.notify();

      if (!isInitial && this.getConfig().autoSyncEnabled) {
        this.syncProjectSummaryWithTurso(updated).catch(console.warn);
      }
    } catch (e) {
      console.error('Failed to save project summary:', e);
    }
  }

  // ==========================================
  // 2. FILE INDEX METADATA MANAGEMENT (NO CODE STORED)
  // ==========================================

  public static getFileIndex(): FileIndexRecord[] {
    try {
      const raw = localStorage.getItem(LOCAL_FILE_INDEX_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveFileIndex(index: FileIndexRecord[]): void {
    try {
      localStorage.setItem(LOCAL_FILE_INDEX_KEY, JSON.stringify(index));
      this.notify();
    } catch (e) {
      console.error('Failed to save file index:', e);
    }
  }

  /**
   * Scan and index workspace / sandbox files
   * CRITICAL: Extracts symbols, tokens, metadata, but STRICTLY EXCLUDES full source code
   */
  public static indexWorkspaceFiles(files: ProjectFile[]): {
    indexedCount: number;
    totalTokens: number;
    records: FileIndexRecord[];
  } {
    const existingIndex = this.getFileIndex();
    const map = new Map<string, FileIndexRecord>(existingIndex.map((f) => [f.filePath, f]));
    let totalTokens = 0;

    const newRecords: FileIndexRecord[] = files.map((file) => {
      const content = file.content || '';
      const lines = content.split('\n');
      const tokenCount = Math.ceil(content.length / 4);
      totalTokens += tokenCount;

      // Extract symbols (functions, classes, interfaces, objects)
      const symbols: string[] = [];
      lines.forEach((l) => {
        const line = l.trim();
        const classMatch = line.match(/(?:class|interface|object|enum class)\s+([A-Za-z0-9_]+)/);
        if (classMatch && symbols.length < 15) symbols.push(classMatch[1]);

        const funMatch = line.match(/fun\s+([A-Za-z0-9_]+)/);
        if (funMatch && symbols.length < 15) symbols.push(`${funMatch[1]}()`);

        const cppMatch = line.match(/(?:void|int|bool|JNIEXPORT|auto)\s+([A-Za-z0-9_]+)\s*\(/);
        if (cppMatch && symbols.length < 15) symbols.push(`${cppMatch[1]}()`);
      });

      // Generate brief 1-2 sentence structural summary
      let summary = file.description || '';
      if (!summary) {
        if (file.path.endsWith('.gradle.kts')) {
          summary = `Gradle build configuration for ${file.module || 'root'} module`;
        } else if (file.path.endsWith('.kt')) {
          summary = `Kotlin module source with ${lines.length} lines, declaring [${symbols.slice(0, 4).join(', ')}]`;
        } else if (file.path.endsWith('.cpp') || file.path.endsWith('.h')) {
          summary = `NDK C++ native POSIX terminal integration with ${lines.length} lines`;
        } else if (file.path.endsWith('.yml') || file.path.endsWith('.yaml')) {
          summary = `CI/CD workflow automation pipeline`;
        } else {
          summary = `Workspace file in ${file.category} category`;
        }
      }

      const existing = map.get(file.path);
      const record: FileIndexRecord = {
        id: existing?.id || `idx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        filePath: file.path,
        fileName: file.name,
        category: file.category,
        module: file.module,
        language: file.language,
        summary,
        symbols,
        tokenCount,
        checksum: file.checksum || `chk-${content.length}-${lines.length}`,
        lastModified: new Date().toISOString(),
        syncStatus: 'pending_upload'
      };

      map.set(file.path, record);
      return record;
    });

    const fullIndexList = Array.from(map.values());
    this.saveFileIndex(fullIndexList);

    if (this.getConfig().autoSyncEnabled) {
      this.syncFileIndexWithTurso(fullIndexList).catch(console.warn);
    }

    return {
      indexedCount: newRecords.length,
      totalTokens,
      records: newRecords
    };
  }

  // ==========================================
  // 3. BUILD LOGS & DIAGNOSTICS MANAGEMENT
  // ==========================================

  public static getBuildLogs(): BuildLogRecord[] {
    try {
      const raw = localStorage.getItem(LOCAL_BUILD_LOGS_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveBuildLogs(logs: BuildLogRecord[]): void {
    try {
      localStorage.setItem(LOCAL_BUILD_LOGS_KEY, JSON.stringify(logs));
      this.notify();
    } catch (e) {
      console.error('Failed to save build logs:', e);
    }
  }

  public static recordBuildLog(params: {
    buildType: BuildLogRecord['buildType'];
    status: 'success' | 'failed' | 'warning';
    errorSummary?: string;
    diagnostics?: string[];
    terminalOutputPreview: string;
    recommendedFix?: string;
  }): BuildLogRecord {
    const list = this.getBuildLogs();
    const newLog: BuildLogRecord = {
      id: `build-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      buildType: params.buildType,
      status: params.status,
      errorSummary: params.errorSummary,
      diagnostics: params.diagnostics || [],
      terminalOutputPreview: params.terminalOutputPreview.slice(0, 1500),
      recommendedFix: params.recommendedFix,
      timestamp: new Date().toISOString(),
      syncStatus: 'pending_upload'
    };

    const updated = [newLog, ...list].slice(0, 50); // Keep last 50
    this.saveBuildLogs(updated);

    if (this.getConfig().autoSyncEnabled) {
      this.syncBuildLogsWithTurso([newLog]).catch(console.warn);
    }

    return newLog;
  }

  // ==========================================
  // 4. AI KNOWLEDGE BASE MANAGEMENT
  // ==========================================

  public static getKnowledge(): AiKnowledgeRecord[] {
    try {
      const raw = localStorage.getItem(LOCAL_AI_KNOWLEDGE_KEY);
      if (!raw) {
        this.saveKnowledge(INITIAL_KNOWLEDGE_SEED);
        return INITIAL_KNOWLEDGE_SEED;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_KNOWLEDGE_SEED;
    }
  }

  public static saveKnowledge(items: AiKnowledgeRecord[]): void {
    try {
      localStorage.setItem(LOCAL_AI_KNOWLEDGE_KEY, JSON.stringify(items));
      this.notify();
    } catch (e) {
      console.error('Failed to save AI knowledge:', e);
    }
  }

  public static addOrUpdateKnowledge(params: {
    id?: string;
    category: AiKnowledgeRecord['category'];
    topic: string;
    content: string;
    confidence?: number;
    tags?: string[];
  }): AiKnowledgeRecord {
    const list = this.getKnowledge();
    const now = new Date().toISOString();

    const existingIdx = params.id
      ? list.findIndex((k) => k.id === params.id)
      : list.findIndex((k) => k.topic.toLowerCase() === params.topic.toLowerCase());

    let record: AiKnowledgeRecord;

    if (existingIdx >= 0) {
      record = {
        ...list[existingIdx],
        category: params.category,
        topic: params.topic,
        content: params.content,
        confidence: params.confidence !== undefined ? params.confidence : list[existingIdx].confidence,
        tags: params.tags || list[existingIdx].tags,
        updatedAt: now,
        syncStatus: 'pending_upload'
      };
      list[existingIdx] = record;
    } else {
      record = {
        id: params.id || `k-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        category: params.category,
        topic: params.topic,
        content: params.content,
        confidence: params.confidence || 0.9,
        tags: params.tags || [],
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending_upload'
      };
      list.unshift(record);
    }

    this.saveKnowledge(list);

    if (this.getConfig().autoSyncEnabled) {
      this.syncKnowledgeWithTurso([record]).catch(console.warn);
    }

    return record;
  }

  public static deleteKnowledge(id: string): void {
    const list = this.getKnowledge().filter((k) => k.id !== id);
    this.saveKnowledge(list);

    // Delete remotely on Turso if configured
    const client = this.getClient();
    client.execute('DELETE FROM ai_knowledge WHERE id = ?', [id]).catch(console.warn);
  }

  // ==========================================
  // 5. CODING PREFERENCES MANAGEMENT
  // ==========================================

  public static getPreferences(): CodingPreferenceRecord[] {
    try {
      const raw = localStorage.getItem(LOCAL_CODING_PREFS_KEY);
      if (!raw) {
        this.savePreferences(INITIAL_PREFERENCES_SEED);
        return INITIAL_PREFERENCES_SEED;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_PREFERENCES_SEED;
    }
  }

  public static savePreferences(items: CodingPreferenceRecord[]): void {
    try {
      localStorage.setItem(LOCAL_CODING_PREFS_KEY, JSON.stringify(items));
      this.notify();
    } catch (e) {
      console.error('Failed to save coding preferences:', e);
    }
  }

  public static addOrUpdatePreference(params: {
    id?: string;
    category: CodingPreferenceRecord['category'];
    keyName: string;
    preferenceValue: string;
    scope?: 'global' | 'module' | 'user';
  }): CodingPreferenceRecord {
    const list = this.getPreferences();
    const now = new Date().toISOString();

    const existingIdx = params.id
      ? list.findIndex((p) => p.id === params.id)
      : list.findIndex((p) => p.keyName.toLowerCase() === params.keyName.toLowerCase());

    let record: CodingPreferenceRecord;

    if (existingIdx >= 0) {
      record = {
        ...list[existingIdx],
        category: params.category,
        keyName: params.keyName,
        preferenceValue: params.preferenceValue,
        scope: params.scope || list[existingIdx].scope,
        updatedAt: now,
        syncStatus: 'pending_upload'
      };
      list[existingIdx] = record;
    } else {
      record = {
        id: params.id || `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        category: params.category,
        keyName: params.keyName,
        preferenceValue: params.preferenceValue,
        scope: params.scope || 'global',
        updatedAt: now,
        syncStatus: 'pending_upload'
      };
      list.unshift(record);
    }

    this.savePreferences(list);

    if (this.getConfig().autoSyncEnabled) {
      this.syncPreferencesWithTurso([record]).catch(console.warn);
    }

    return record;
  }

  public static deletePreference(id: string): void {
    const list = this.getPreferences().filter((p) => p.id !== id);
    this.savePreferences(list);

    const client = this.getClient();
    client.execute('DELETE FROM coding_preferences WHERE id = ?', [id]).catch(console.warn);
  }

  // ==========================================
  // 6. RAG RETRIEVAL-AUGMENTED GENERATION ENGINE
  // ==========================================

  /**
   * Search all Turso SQLite memory domains using semantic keyword and tag scoring
   */
  public static queryRagMemory(query: string, maxItems: number = 6): TursoRagQueryResult {
    const qTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2);

    const projectSummary = this.getProjectSummary();
    const knowledgeList = this.getKnowledge();
    const prefsList = this.getPreferences();
    const fileIndexList = this.getFileIndex();
    const buildLogsList = this.getBuildLogs();

    if (qTokens.length === 0) {
      return {
        knowledge: knowledgeList.slice(0, 3),
        preferences: prefsList.slice(0, 3),
        fileIndexMatches: fileIndexList.slice(0, 3),
        projectSummary,
        recentBuildLogs: buildLogsList.slice(0, 2),
        formattedContextBlock: this.formatRagContextForPrompt(
          knowledgeList.slice(0, 3),
          prefsList.slice(0, 3),
          fileIndexList.slice(0, 3),
          projectSummary,
          buildLogsList.slice(0, 2)
        ),
        matchScore: 1.0,
        retrievedCount: knowledgeList.length + prefsList.length + fileIndexList.length
      };
    }

    // 1. Score AI Knowledge
    const scoredKnowledge = knowledgeList.map((item) => {
      let score = 0;
      const lowerTopic = item.topic.toLowerCase();
      const lowerContent = item.content.toLowerCase();
      const lowerTags = item.tags.map((t) => t.toLowerCase());

      for (const token of qTokens) {
        if (lowerTopic.includes(token)) score += 8;
        if (lowerContent.includes(token)) score += 4;
        if (lowerTags.some((t) => t.includes(token))) score += 6;
      }
      return { item, score: score * item.confidence };
    });

    const topKnowledge = scoredKnowledge
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems)
      .map((s) => s.item);

    // 2. Score Coding Preferences
    const scoredPrefs = prefsList.map((item) => {
      let score = 0;
      const lowerKey = item.keyName.toLowerCase();
      const lowerVal = item.preferenceValue.toLowerCase();

      for (const token of qTokens) {
        if (lowerKey.includes(token)) score += 7;
        if (lowerVal.includes(token)) score += 3;
      }
      return { item, score };
    });

    const topPrefs = scoredPrefs
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((s) => s.item);

    // 3. Score File Index (Metadata & Symbols, NO source code)
    const scoredFiles = fileIndexList.map((item) => {
      let score = 0;
      const lowerName = item.fileName.toLowerCase();
      const lowerPath = item.filePath.toLowerCase();
      const lowerSum = item.summary.toLowerCase();
      const lowerSymbols = item.symbols.map((s) => s.toLowerCase());

      for (const token of qTokens) {
        if (lowerName.includes(token)) score += 8;
        if (lowerPath.includes(token)) score += 5;
        if (lowerSum.includes(token)) score += 3;
        if (lowerSymbols.some((s) => s.includes(token))) score += 6;
      }
      return { item, score };
    });

    const topFiles = scoredFiles
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((s) => s.item);

    // 4. Recent relevant build logs
    const topBuilds = buildLogsList
      .filter((b) => {
        const text = `${b.buildType} ${b.status} ${b.errorSummary || ''} ${b.diagnostics.join(' ')}`.toLowerCase();
        return qTokens.some((t) => text.includes(t));
      })
      .slice(0, 2);

    const formattedBlock = this.formatRagContextForPrompt(
      topKnowledge.length > 0 ? topKnowledge : knowledgeList.slice(0, 3),
      topPrefs.length > 0 ? topPrefs : prefsList.slice(0, 2),
      topFiles,
      projectSummary,
      topBuilds
    );

    const totalRetrieved = topKnowledge.length + topPrefs.length + topFiles.length + topBuilds.length;

    return {
      knowledge: topKnowledge.length > 0 ? topKnowledge : knowledgeList.slice(0, 3),
      preferences: topPrefs.length > 0 ? topPrefs : prefsList.slice(0, 2),
      fileIndexMatches: topFiles,
      projectSummary,
      recentBuildLogs: topBuilds,
      formattedContextBlock: formattedBlock,
      matchScore: totalRetrieved > 0 ? 1.0 : 0.5,
      retrievedCount: totalRetrieved
    };
  }

  /**
   * Format retrieved Turso memories for LLM system prompt injection
   */
  public static formatRagContextForPrompt(
    knowledge: AiKnowledgeRecord[],
    preferences: CodingPreferenceRecord[],
    fileIndex: FileIndexRecord[],
    projectSummary: ProjectSummaryRecord | null,
    buildLogs: BuildLogRecord[]
  ): string {
    const blocks: string[] = [];

    // Project summary section
    if (projectSummary) {
      blocks.push(
        `### 🏛️ PROJECT ARCHITECTURE (Turso Long-Term Memory):`,
        `- **Project:** ${projectSummary.projectName}`,
        `- **Overview:** ${projectSummary.overview}`,
        `- **Active Modules (${projectSummary.modules.length}):** ${projectSummary.modules.join(', ')}`,
        `- **Tech Stack:** ${projectSummary.techStack.join(' • ')}`
      );
    }

    // AI Knowledge & Constraints
    if (knowledge.length > 0) {
      blocks.push(
        `\n### 🧠 VERIFIED ARCHITECTURAL RULES & KNOWLEDGE BASE:`,
        ...knowledge.map(
          (k) =>
            `- [${k.category.toUpperCase()}] **${k.topic}** (Confidence: ${(k.confidence * 100).toFixed(0)}%): ${k.content}`
        )
      );
    }

    // Coding preferences
    if (preferences.length > 0) {
      blocks.push(
        `\n### ⚙️ USER CODING PREFERENCES & CONVENTIONS:`,
        ...preferences.map((p) => `- **${p.keyName}** (${p.category}): ${p.preferenceValue}`)
      );
    }

    // File Index & Symbols (Metadata only)
    if (fileIndex.length > 0) {
      blocks.push(
        `\n### 📂 INDEXED WORKSPACE FILE METADATA (Turso File Index):`,
        ...fileIndex.map(
          (f) =>
            `- **${f.filePath}** (${f.language}) — ${f.summary} [Symbols: ${f.symbols.slice(0, 5).join(', ')}]`
        )
      );
    }

    // Build diagnostics & past errors
    if (buildLogs.length > 0) {
      blocks.push(
        `\n### 🛠️ HISTORICAL BUILD DIAGNOSTICS & FIXES:`,
        ...buildLogs.map(
          (b) =>
            `- [${b.buildType} | ${b.status.toUpperCase()}] ${b.errorSummary || 'Build log'} (Fix: ${b.recommendedFix || 'Resolved'})`
        )
      );
    }

    return blocks.join('\n');
  }

  // ==========================================
  // 7. TURSO CLOUD SYNC & RECONCILIATION
  // ==========================================

  public static async syncAll(): Promise<{
    success: boolean;
    message: string;
    syncedCounts: {
      knowledge: number;
      preferences: number;
      files: number;
      buildLogs: number;
      summary: boolean;
    };
  }> {
    const config = this.getConfig();
    const client = this.getClient();

    this.syncState.isSyncing = true;
    this.syncState.error = null;
    this.notify();

    try {
      // Step 1: Check connectivity and initialize tables if needed
      const test = await client.testConnection();
      if (!test.success) {
        throw new Error(test.message || 'Cannot reach Turso database');
      }

      await client.initializeTables();
      this.syncState.connectedDb = test.dbName || config.databaseName || 'turso-cloud';

      // Step 2: Sync Project Summary
      const summary = this.getProjectSummary();
      await this.syncProjectSummaryWithTurso(summary);

      // Step 3: Sync AI Knowledge
      const kList = this.getKnowledge();
      const kCount = await this.syncKnowledgeWithTurso(kList);

      // Step 4: Sync Coding Preferences
      const pList = this.getPreferences();
      const pCount = await this.syncPreferencesWithTurso(pList);

      // Step 5: Sync File Index (Metadata only)
      const fList = this.getFileIndex();
      const fCount = await this.syncFileIndexWithTurso(fList);

      // Step 6: Sync Build Logs
      const bList = this.getBuildLogs();
      const bCount = await this.syncBuildLogsWithTurso(bList);

      this.syncState.isSyncing = false;
      this.syncState.lastSyncTime = new Date().toLocaleTimeString();
      this.syncState.error = null;
      this.notify();

      return {
        success: true,
        message: 'Successfully synchronized long-term memory with Turso SQLite database',
        syncedCounts: {
          knowledge: kCount,
          preferences: pCount,
          files: fCount,
          buildLogs: bCount,
          summary: true
        }
      };
    } catch (err: any) {
      this.syncState.isSyncing = false;
      this.syncState.error = err.message || 'Sync failed';
      this.notify();

      return {
        success: false,
        message: err.message || 'Sync failed',
        syncedCounts: {
          knowledge: 0,
          preferences: 0,
          files: 0,
          buildLogs: 0,
          summary: false
        }
      };
    }
  }

  private static async syncProjectSummaryWithTurso(summary: ProjectSummaryRecord): Promise<void> {
    const client = this.getClient();
    await client.execute(
      `
      INSERT OR REPLACE INTO project_summaries 
      (id, project_name, overview, modules_json, tech_stack_json, key_highlights_json, updated_at, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'synced')
    `,
      [
        summary.id,
        summary.projectName,
        summary.overview,
        JSON.stringify(summary.modules),
        JSON.stringify(summary.techStack),
        JSON.stringify(summary.keyHighlights),
        summary.updatedAt
      ]
    );

    summary.syncStatus = 'synced';
    localStorage.setItem(LOCAL_PROJECT_SUMMARY_KEY, JSON.stringify(summary));
  }

  private static async syncKnowledgeWithTurso(items: AiKnowledgeRecord[]): Promise<number> {
    const client = this.getClient();
    let synced = 0;

    for (const item of items) {
      await client.execute(
        `
        INSERT OR REPLACE INTO ai_knowledge 
        (id, category, topic, content, confidence, tags_json, created_at, updated_at, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')
      `,
        [
          item.id,
          item.category,
          item.topic,
          item.content,
          item.confidence,
          JSON.stringify(item.tags),
          item.createdAt,
          item.updatedAt
        ]
      );
      item.syncStatus = 'synced';
      synced++;
    }

    localStorage.setItem(LOCAL_AI_KNOWLEDGE_KEY, JSON.stringify(items));
    return synced;
  }

  private static async syncPreferencesWithTurso(items: CodingPreferenceRecord[]): Promise<number> {
    const client = this.getClient();
    let synced = 0;

    for (const item of items) {
      await client.execute(
        `
        INSERT OR REPLACE INTO coding_preferences 
        (id, category, key_name, preference_value, scope, updated_at, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, 'synced')
      `,
        [item.id, item.category, item.keyName, item.preferenceValue, item.scope, item.updatedAt]
      );
      item.syncStatus = 'synced';
      synced++;
    }

    localStorage.setItem(LOCAL_CODING_PREFS_KEY, JSON.stringify(items));
    return synced;
  }

  private static async syncFileIndexWithTurso(items: FileIndexRecord[]): Promise<number> {
    const client = this.getClient();
    let synced = 0;

    for (const item of items) {
      await client.execute(
        `
        INSERT OR REPLACE INTO file_index 
        (id, file_path, file_name, category, module, language, summary, symbols_json, token_count, checksum, last_modified, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
      `,
        [
          item.id,
          item.filePath,
          item.fileName,
          item.category,
          item.module || '',
          item.language,
          item.summary,
          JSON.stringify(item.symbols),
          item.tokenCount,
          item.checksum,
          item.lastModified
        ]
      );
      item.syncStatus = 'synced';
      synced++;
    }

    localStorage.setItem(LOCAL_FILE_INDEX_KEY, JSON.stringify(items));
    return synced;
  }

  private static async syncBuildLogsWithTurso(items: BuildLogRecord[]): Promise<number> {
    const client = this.getClient();
    let synced = 0;

    for (const item of items) {
      await client.execute(
        `
        INSERT OR REPLACE INTO build_logs 
        (id, build_type, status, error_summary, diagnostics_json, terminal_output_preview, recommended_fix, timestamp, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')
      `,
        [
          item.id,
          item.buildType,
          item.status,
          item.errorSummary || '',
          JSON.stringify(item.diagnostics),
          item.terminalOutputPreview,
          item.recommendedFix || '',
          item.timestamp
        ]
      );
      item.syncStatus = 'synced';
      synced++;
    }

    localStorage.setItem(LOCAL_BUILD_LOGS_KEY, JSON.stringify(items));
    return synced;
  }
}
