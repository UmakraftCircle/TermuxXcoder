import { ProjectFile } from '../types';
import { MemoryService } from './turso/memoryService';

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
      const knowledge = MemoryService.getKnowledge();
      if (knowledge.length > 0) {
        return knowledge.map((k) => ({
          id: k.id,
          category: (k.category === 'rule' || k.category === 'architecture' || k.category === 'learning'
            ? k.category
            : 'rule') as any,
          key: k.topic,
          value: k.content,
          confidence: k.confidence,
          createdAt: k.createdAt,
          updatedAt: k.updatedAt
        }));
      }

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
   * Add or update a memory rule / learned preference in Turso & Local cache
   */
  static remember(
    key: string,
    value: string,
    category: 'rule' | 'preference' | 'architecture' | 'learning' = 'learning'
  ): AiMemoryItem {
    // Save to Turso memory service
    const savedRecord = MemoryService.addOrUpdateKnowledge({
      category: category as any,
      topic: key,
      content: value,
      confidence: 0.95,
      tags: [category, 'agent-learned']
    });

    const item: AiMemoryItem = {
      id: savedRecord.id,
      category,
      key: savedRecord.topic,
      value: savedRecord.content,
      confidence: savedRecord.confidence,
      createdAt: savedRecord.createdAt,
      updatedAt: savedRecord.updatedAt
    };

    const list = this.getMemories().filter((m) => m.id !== item.id);
    list.unshift(item);
    this.saveMemories(list);

    return item;
  }

  /**
   * Remove a specific memory item
   */
  static forget(id: string): void {
    MemoryService.deleteKnowledge(id);
    const list = this.getMemories().filter((m) => m.id !== id);
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

    // Auto-detect style preferences and save to Turso
    if (p.includes('use compose') || p.includes('jetpack compose')) {
      this.remember('UI Framework Preference', 'User prefers Jetpack Compose over XML layouts.', 'preference');
      MemoryService.addOrUpdatePreference({
        category: 'framework',
        keyName: 'UI Toolkit Preference',
        preferenceValue: 'Jetpack Compose components'
      });
    } else if (p.includes('use coroutines') || p.includes('flow')) {
      this.remember('Async Paradigm', 'User prefers Kotlin Coroutines & StateFlow for asynchronous logic.', 'preference');
      MemoryService.addOrUpdatePreference({
        category: 'concurrency',
        keyName: 'Async Architecture',
        preferenceValue: 'Kotlin Coroutines & StateFlow'
      });
    } else if (p.includes('c++20') || p.includes('modern c++')) {
      this.remember('C++ Standard', 'User prefers Modern C++20 with std::span and concepts.', 'preference');
      MemoryService.addOrUpdatePreference({
        category: 'code_style',
        keyName: 'NDK C++ Standard',
        preferenceValue: 'Modern C++20 with concepts'
      });
    }
  }

  /**
   * RAG Vector / TF-IDF & Turso Memory Search across workspace
   */
  static searchProjectRag(query: string, allFiles: ProjectFile[], maxSnippets: number = 4): RagContextResult {
    // 1. First query Turso Memory RAG (Knowledge, Preferences, File Index Metadata, Project Architecture)
    const tursoRag = MemoryService.queryRagMemory(query, maxSnippets);

    // 2. Scan file snippets locally if query has tokens
    const qTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (qTokens.length === 0 || allFiles.length === 0) {
      return {
        snippets: [],
        contextPromptBlock: tursoRag.formattedContextBlock,
        memoryBlock: tursoRag.formattedContextBlock,
        totalFilesSearched: allFiles.length
      };
    }

    const scoredFiles: { file: ProjectFile; score: number; matchedLines: string }[] = [];

    for (const file of allFiles) {
      const content = file.content || '';
      const lines = content.split('\n');
      let score = 0;
      const matchedLineList: string[] = [];

      const lowerPath = file.path.toLowerCase();
      const lowerName = file.name.toLowerCase();

      for (const token of qTokens) {
        if (lowerName.includes(token)) score += 8;
        if (lowerPath.includes(token)) score += 5;
        if (file.module && file.module.toLowerCase().includes(token)) score += 6;
      }

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

    scoredFiles.sort((a, b) => b.score - a.score);
    const topMatches = scoredFiles.slice(0, maxSnippets);

    const snippets: RagDocumentSnippet[] = topMatches.map((m) => {
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

    const ragContextLines: string[] = [
      tursoRag.formattedContextBlock,
      '\n### 📚 ACTIVE RELEVANT CODE SNIPPETS (Local Workspace):'
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

    return {
      snippets,
      contextPromptBlock: ragContextLines.join('\n'),
      memoryBlock: tursoRag.formattedContextBlock,
      totalFilesSearched: allFiles.length
    };
  }

  /**
   * Format long-term memories into system instructions
   */
  static formatMemoriesForPrompt(): string {
    const tursoRag = MemoryService.queryRagMemory('', 6);
    return tursoRag.formattedContextBlock;
  }
}
