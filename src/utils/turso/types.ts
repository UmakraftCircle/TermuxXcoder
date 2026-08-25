export interface TursoConfig {
  databaseUrl: string; // e.g. https://my-memory-db-org.turso.io or libsql://...
  authToken: string;
  databaseName?: string;
  autoSyncEnabled: boolean;
  syncIntervalSeconds: number;
  lastSyncedAt?: string;
}

export type MemorySyncStatus = 'synced' | 'pending_upload' | 'pending_delete' | 'conflict';

export interface ProjectSummaryRecord {
  id: string;
  projectName: string;
  overview: string;
  modules: string[];
  techStack: string[];
  keyHighlights: string[];
  updatedAt: string;
  syncStatus: MemorySyncStatus;
}

export interface FileIndexRecord {
  id: string;
  filePath: string;
  fileName: string;
  category: string;
  module?: string;
  language: string;
  summary: string;
  symbols: string[]; // functions, classes, interfaces
  tokenCount: number;
  checksum: string;
  lastModified: string;
  syncStatus: MemorySyncStatus;
  // NOTE: Full source code is strictly excluded from Turso as per requirements
}

export interface BuildLogRecord {
  id: string;
  buildType: 'release_apk' | 'debug_apk' | 'ndk_compile' | 'unit_test' | 'lint' | 'custom';
  status: 'success' | 'failed' | 'warning';
  errorSummary?: string;
  diagnostics: string[];
  terminalOutputPreview: string;
  recommendedFix?: string;
  timestamp: string;
  syncStatus: MemorySyncStatus;
}

export interface AiKnowledgeRecord {
  id: string;
  category: 'architecture' | 'rule' | 'android_api' | 'ndk_posix' | 'learning' | 'troubleshooting';
  topic: string;
  content: string;
  confidence: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  syncStatus: MemorySyncStatus;
}

export interface CodingPreferenceRecord {
  id: string;
  category: 'code_style' | 'framework' | 'library' | 'concurrency' | 'build_tool' | 'custom';
  keyName: string;
  preferenceValue: string;
  scope: 'global' | 'module' | 'user';
  updatedAt: string;
  syncStatus: MemorySyncStatus;
}

export interface TursoRagQueryResult {
  knowledge: AiKnowledgeRecord[];
  preferences: CodingPreferenceRecord[];
  fileIndexMatches: FileIndexRecord[];
  projectSummary: ProjectSummaryRecord | null;
  recentBuildLogs: BuildLogRecord[];
  formattedContextBlock: string;
  matchScore: number;
  retrievedCount: number;
}

export interface TursoSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  error: string | null;
  connectedDb: string | null;
}
