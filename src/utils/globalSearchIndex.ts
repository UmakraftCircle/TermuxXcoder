import { ProjectFile } from '../types';

export interface SearchMatch {
  lineNumber: number;
  lineContent: string;
  matchIndex: number;
  matchLength: number;
}

export interface FileSearchResult {
  file: ProjectFile;
  matches: SearchMatch[];
  totalMatches: number;
}

export interface GlobalSearchOptions {
  query: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
  scope?: 'all' | 'sandbox' | 'app' | 'library';
  filePattern?: string; // e.g. "*.kt", "*.xml", "build.gradle"
}

export interface GlobalIndexStats {
  totalFiles: number;
  totalLines: number;
  totalCharacters: number;
  buildTimeMs: number;
  lastIndexed: string;
}

export class GlobalSearchIndexService {
  private files: ProjectFile[] = [];
  private stats: GlobalIndexStats = {
    totalFiles: 0,
    totalLines: 0,
    totalCharacters: 0,
    buildTimeMs: 0,
    lastIndexed: 'Never'
  };

  public updateIndex(files: ProjectFile[]): GlobalIndexStats {
    const startTime = performance.now();
    this.files = files;

    let lines = 0;
    let chars = 0;

    for (const f of files) {
      if (f && f.content) {
        chars += f.content.length;
        lines += (f.content.match(/\n/g) || []).length + 1;
      }
    }

    const duration = Math.max(1, Math.round(performance.now() - startTime));

    this.stats = {
      totalFiles: files.length,
      totalLines: lines,
      totalCharacters: chars,
      buildTimeMs: duration,
      lastIndexed: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    return this.stats;
  }

  public getStats(): GlobalIndexStats {
    return this.stats;
  }

  public search(options: GlobalSearchOptions): { results: FileSearchResult[]; totalMatches: number; totalMatchedFiles: number } {
    const {
      query,
      caseSensitive = false,
      wholeWord = false,
      useRegex = false,
      scope = 'all',
      filePattern = ''
    } = options;

    if (!query || query.trim() === '') {
      return { results: [], totalMatches: 0, totalMatchedFiles: 0 };
    }

    let regex: RegExp | null = null;
    try {
      if (useRegex) {
        const flags = caseSensitive ? 'g' : 'gi';
        regex = new RegExp(query, flags);
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
        const flags = caseSensitive ? 'g' : 'gi';
        regex = new RegExp(pattern, flags);
      }
    } catch {
      // Invalid regex, fallback to plain escaped substring
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
    }

    const results: FileSearchResult[] = [];
    let grandTotalMatches = 0;

    // Filter files by scope
    const targetFiles = this.files.filter((file) => {
      // Scope filter
      if (scope === 'sandbox') {
        const isSandbox = Boolean(file.isSandbox || file.storageScope === 'sandbox_user' || file.path.startsWith('sandbox/'));
        if (!isSandbox) return false;
      } else if (scope === 'app') {
        const isApp = file.module === 'app' || file.path.startsWith('app/');
        if (!isApp) return false;
      } else if (scope === 'library') {
        const isLib = file.module !== 'app' && !file.path.startsWith('app/') && !file.path.startsWith('sandbox/');
        if (!isLib) return false;
      }

      // Extension / filePattern filter (e.g. "*.kt", "xml", "gradle")
      if (filePattern && filePattern.trim() !== '') {
        const cleanPattern = filePattern.trim().toLowerCase().replace(/^\*?\./, '');
        const filename = file.name.toLowerCase();
        const filepath = file.path.toLowerCase();
        if (!filename.includes(cleanPattern) && !filepath.includes(cleanPattern)) {
          return false;
        }
      }

      return true;
    });

    for (const file of targetFiles) {
      if (!file.content) continue;

      const lines = file.content.split('\n');
      const matches: SearchMatch[] = [];

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const lineText = lines[lineIdx];
        regex.lastIndex = 0;

        let match: RegExpExecArray | null = null;
        while ((match = regex.exec(lineText)) !== null) {
          matches.push({
            lineNumber: lineIdx + 1,
            lineContent: lineText,
            matchIndex: match.index,
            matchLength: match[0].length || 1
          });

          // Prevent infinite loop on empty match
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      }

      if (matches.length > 0) {
        results.push({
          file,
          matches,
          totalMatches: matches.length
        });
        grandTotalMatches += matches.length;
      }
    }

    // Sort files by match count descending
    results.sort((a, b) => b.totalMatches - a.totalMatches);

    return {
      results,
      totalMatches: grandTotalMatches,
      totalMatchedFiles: results.length
    };
  }

  /**
   * Performs a global replace operation across files
   */
  public replace(
    options: GlobalSearchOptions,
    replacementText: string,
    targetFilePaths?: string[]
  ): { updatedFiles: { path: string; newContent: string; replacementCount: number }[]; totalReplacements: number } {
    const { results } = this.search(options);
    const updatedFiles: { path: string; newContent: string; replacementCount: number }[] = [];
    let totalReplacements = 0;

    const {
      query,
      caseSensitive = false,
      wholeWord = false,
      useRegex = false
    } = options;

    let regex: RegExp;
    try {
      if (useRegex) {
        regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
        regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
      }
    } catch {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
    }

    for (const res of results) {
      if (targetFilePaths && !targetFilePaths.includes(res.file.path)) {
        continue;
      }

      const original = res.file.content;
      let count = 0;
      const replaced = original.replace(regex, (match) => {
        count++;
        return replacementText;
      });

      if (count > 0) {
        updatedFiles.push({
          path: res.file.path,
          newContent: replaced,
          replacementCount: count
        });
        totalReplacements += count;
      }
    }

    return { updatedFiles, totalReplacements };
  }
}

export const globalSearchIndex = new GlobalSearchIndexService();
