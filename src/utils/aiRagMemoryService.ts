import { ProjectFile } from '../types';

export interface AiMemoryItem {
  id: string;
  category: 'rule' | 'preference' | 'architecture' | 'learning';
  key: string;
  value: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface RagDocumentSnippet {
  filePath: string;
  fileName: string;
  module?: string;
  score: number;
  matchedLines: string;
  totalTokensApprox: number;
}

export interface RagContextResult {
  snippets: RagDocumentSnippet[];
  contextPromptBlock: string;
  memoryBlock: string;
  totalFilesSearched: number;
}

const MEMORY_STORAGE_KEY = 'umakraft_ai_copilot_memory_v1';
const LEARNING_PREFERENCES_KEY = 'umakraft_ai_learning_prefs_v1';

export const DEFAULT_INITIAL_MEMORIES: AiMemoryItem[] = [
  {
    id: 'mem-1',
    category: 'architecture',
    key: 'Modular Android Architecture',
    value: 'Android project is organized into 10 decoupled modules: app, common, editor (Sora Editor 0.23.5), terminal (POSIX PTY JNI), filesystem (Scoped Storage), git (JGit), lsp, debugger, ai, and workspace.',
    confidence: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mem-2',
    category: 'rule',
    key: 'Target SDK & Scoped Storage',
    value: 'Min SDK is 29 (Android 10), Target SDK is 34 (Android 14). Always use Scoped Storage & MediaStore URI APIs instead of raw /sdcard paths.',
    confidence: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mem-3',
    category: 'rule',
    key: 'Native NDK POSIX Standards',
    value: 'Native C++ code uses POSIX forkpty() with Bionic libc in CMake 3.22.1, supporting arm64-v8a, armeabi-v7a, and x86_64.',
    confidence: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mem-4',
    category: 'preference',
    key: 'Code Style & Formatting',
    value: 'Prefer Kotlin Coroutines (Dispatchers.IO / Dispatchers.Main) with structured concurrency, clean Kotlin DSL (build.gradle.kts), and clean error handling via Result<T>.',
    confidence: 0.95,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class AiRagMemoryService {
  /**
   * Load stored persistent AI memory items
   */
  static getMemories(): AiMemoryItem[] {
    try {
      const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (!raw) {
        this.saveMemories(DEFAULT_INITIAL_MEMORIES);
        return DEFAULT_INITIAL_MEMORIES;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_INITIAL_MEMORIES;
    }
  }

  /**
   * Save persistent AI memory items
   */
  static saveMemories(memories: AiMemoryItem[]): void {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
    } catch (e) {
      console.error('Failed to save AI memories:', e);
    }
  }

  /**
   * Add or update a memory rule / learned preference
   */
  static remember(key: string, value: string, category: 'rule' | 'preference' | 'architecture' | 'learning' = 'learning'): AiMemoryItem {
    const list = this.getMemories();
    const existingIdx = list.findIndex(m => m.key.toLowerCase() === key.toLowerCase());
    
    const now = new Date().toISOString();
    let item: AiMemoryItem;

    if (existingIdx >= 0) {
      item = {
        ...list[existingIdx],
        value,
        category,
        confidence: Math.min(1.0, list[existingIdx].confidence + 0.1),
        updatedAt: now
      };
      list[existingIdx] = item;
    } else {
      item = {
        id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        category,
        key,
        value,
        confidence: 0.9,
        createdAt: now,
        updatedAt: now
      };
      list.push(item);
    }

    this.saveMemories(list);
    return item;
  }

  /**
   * Remove a specific memory item
   */
  static forget(id: string): void {
    const list = this.getMemories().filter(m => m.id !== id);
    this.saveMemories(list);
  }

  /**
   * Clear all memories back to defaults
   */
  static resetToDefault(): void {
    this.saveMemories(DEFAULT_INITIAL_MEMORIES);
  }

  /**
   * Auto-learn from user prompts and feedback
   */
  static autoLearnFromInteraction(prompt: string, acceptedCode?: string): void {
    const p = prompt.toLowerCase();
    
    // Auto-detect style preferences
    if (p.includes('use compose') || p.includes('jetpack compose')) {
      this.remember('UI Framework Preference', 'User prefers Jetpack Compose over XML layouts.', 'preference');
    } else if (p.includes('use coroutines') || p.includes('flow')) {
      this.remember('Async Paradigm', 'User prefers Kotlin Coroutines & StateFlow for asynchronous logic.', 'preference');
    } else if (p.includes('c++20') || p.includes('modern c++')) {
      this.remember('C++ Standard', 'User prefers Modern C++20 with std::span and concepts.', 'preference');
    }
  }

  /**
   * RAG Vector / TF-IDF Search across all project files
   * Matches keywords, symbols, module names, and function declarations
   */
  static searchProjectRag(query: string, allFiles: ProjectFile[], maxSnippets: number = 4): RagContextResult {
    const qTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);

    if (qTokens.length === 0 || allFiles.length === 0) {
      return {
        snippets: [],
        contextPromptBlock: '',
        memoryBlock: this.formatMemoriesForPrompt(),
        totalFilesSearched: allFiles.length
      };
    }

    const scoredFiles: { file: ProjectFile; score: number; matchedLines: string }[] = [];

    for (const file of allFiles) {
      const content = file.content || '';
      const lines = content.split('\n');
      let score = 0;
      const matchedLineList: string[] = [];

      // Path & filename relevance
      const lowerPath = file.path.toLowerCase();
      const lowerName = file.name.toLowerCase();

      for (const token of qTokens) {
        if (lowerName.includes(token)) score += 8;
        if (lowerPath.includes(token)) score += 5;
        if (file.module && file.module.toLowerCase().includes(token)) score += 6;
      }

      // Content scanning
      lines.forEach((line, idx) => {
        const lowerLine = line.toLowerCase();
        let lineHits = 0;

        for (const token of qTokens) {
          if (lowerLine.includes(token)) {
            lineHits++;
          }
        }

        if (lineHits > 0) {
          score += lineHits * 2;
          if (matchedLineList.length < 8) {
            matchedLineList.push(`  L${idx + 1}: ${line.trim()}`);
          }
        }
      });

      if (score > 0) {
        // Boost if file matches common code keywords
        if (file.name.endsWith('.kt') || file.name.endsWith('.cpp') || file.name.endsWith('.gradle.kts')) {
          score += 3;
        }
        scoredFiles.push({
          file,
          score,
          matchedLines: matchedLineList.join('\n')
        });
      }
    }

    // Sort by relevance score descending
    scoredFiles.sort((a, b) => b.score - a.score);
    const topMatches = scoredFiles.slice(0, maxSnippets);

    const snippets: RagDocumentSnippet[] = topMatches.map(m => {
      // Extract representative snippet
      const content = m.file.content || '';
      const lines = content.split('\n');
      const snippetSlice = lines.slice(0, 35).join('\n');

      return {
        filePath: m.file.path,
        fileName: m.file.name,
        module: m.file.module,
        score: m.score,
        matchedLines: m.matchedLines,
        totalTokensApprox: Math.ceil(snippetSlice.length / 4)
      };
    });

    // Build RAG Context Block
    const ragContextLines: string[] = [
      '### 📚 RAG RETRIEVED WORKSPACE CONTEXT (Knowledge Base & Indexed Files):'
    ];

    topMatches.forEach((match, idx) => {
      const f = match.file;
      const snippetPreview = (f.content || '').split('\n').slice(0, 30).join('\n');
      ragContextLines.push(
        `\n[File ${idx + 1}: ${f.path} (Relevance Score: ${match.score})]`,
        '```' + (f.language || 'code'),
        snippetPreview + (f.content.split('\n').length > 30 ? '\n... (more lines in file)' : ''),
        '```'
      );
    });

    const memoryBlock = this.formatMemoriesForPrompt();

    return {
      snippets,
      contextPromptBlock: ragContextLines.join('\n'),
      memoryBlock,
      totalFilesSearched: allFiles.length
    };
  }

  /**
   * Format long-term memories into system instructions
   */
  static formatMemoriesForPrompt(): string {
    const memories = this.getMemories();
    if (memories.length === 0) return '';

    return [
      '### 🧠 ACTIVE AI MEMORY & ARCHITECTURAL RULES (Learned Preferences & Constraints):',
      ...memories.map(m => `- [${m.category.toUpperCase()}] **${m.key}**: ${m.value}`)
    ].join('\n');
  }
}
