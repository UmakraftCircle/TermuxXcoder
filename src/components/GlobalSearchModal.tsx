import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  FileCode,
  Layers,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Replace,
  Sparkles,
  Zap,
  Check,
  Filter,
  RefreshCw,
  FolderTree,
  FileText,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProjectFile } from '../types';
import {
  globalSearchIndex,
  FileSearchResult,
  GlobalSearchOptions,
  GlobalIndexStats
} from '../utils/globalSearchIndex';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onSelectFileAndLine: (filePath: string, lineNumber?: number) => void;
  onBatchUpdateFiles?: (updates: { path: string; newContent: string }[]) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  files,
  onSelectFileAndLine,
  onBatchUpdateFiles
}) => {
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isReplaceMode, setIsReplaceMode] = useState(false);

  // Search Options
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [scope, setScope] = useState<'all' | 'sandbox' | 'app' | 'library'>('all');
  const [filePattern, setFilePattern] = useState('');

  // Expanded file sections
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  // Index Stats
  const [indexStats, setIndexStats] = useState<GlobalIndexStats>(() =>
    globalSearchIndex.updateIndex(files)
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update index whenever file list updates
  useEffect(() => {
    if (files.length > 0) {
      const stats = globalSearchIndex.updateIndex(files);
      setIndexStats(stats);
    }
  }, [files]);

  // Focus search input upon open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Perform search computation
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return { results: [], totalMatches: 0, totalMatchedFiles: 0 };
    }

    const options: GlobalSearchOptions = {
      query,
      caseSensitive,
      wholeWord,
      useRegex,
      scope,
      filePattern
    };

    return globalSearchIndex.search(options);
  }, [query, caseSensitive, wholeWord, useRegex, scope, filePattern, files]);

  // Auto-expand first 5 files when search results arrive
  useEffect(() => {
    if (searchResults.results.length > 0) {
      const initExpanded: Record<string, boolean> = {};
      searchResults.results.slice(0, 5).forEach((r) => {
        initExpanded[r.file.path] = true;
      });
      setExpandedFiles(initExpanded);
    }
  }, [searchResults.results]);

  const handleToggleFileExpand = (path: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    searchResults.results.forEach((r) => {
      all[r.file.path] = true;
    });
    setExpandedFiles(all);
  };

  const handleCollapseAll = () => {
    setExpandedFiles({});
  };

  const handleReindex = () => {
    const stats = globalSearchIndex.updateIndex(files);
    setIndexStats(stats);
    setToastMessage(`Re-indexed ${stats.totalFiles} files (${stats.totalLines.toLocaleString()} lines) in ${stats.buildTimeMs}ms`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExecuteReplace = () => {
    if (!onBatchUpdateFiles || !query.trim()) return;

    const options: GlobalSearchOptions = {
      query,
      caseSensitive,
      wholeWord,
      useRegex,
      scope,
      filePattern
    };

    const { updatedFiles, totalReplacements } = globalSearchIndex.replace(options, replaceText);

    if (updatedFiles.length === 0) {
      setToastMessage('No matches found to replace');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    onBatchUpdateFiles(updatedFiles);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.4 } });
    setToastMessage(`Replaced ${totalReplacements} occurrence(s) across ${updatedFiles.length} file(s)`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (!isOpen) return null;

  const popularExtensions = [
    { label: 'All', pattern: '' },
    { label: '.kt', pattern: '.kt' },
    { label: '.java', pattern: '.java' },
    { label: '.xml', pattern: '.xml' },
    { label: '.gradle', pattern: '.gradle' },
    { label: '.json', pattern: '.json' },
    { label: '.md', pattern: '.md' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        className="bg-[#0d1117] border border-[#30363d] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        id="global-search-index-modal"
      >
        {/* Header with Search Bar & Index Stats */}
        <div className="bg-[#161b22] border-b border-[#30363d] p-3 sm:p-4 space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#1f6feb] to-[#58a6ff] text-white shadow-md shrink-0">
                <Search className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-white font-mono tracking-tight">
                    GLOBAL SEARCH & INDEX
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30 font-semibold">
                    {indexStats.totalFiles} Files Indexed
                  </span>
                </div>
                <p className="text-[11px] text-[#8b949e] font-mono truncate">
                  Full-text instant regex & symbol indexer across workspace & sandbox
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleReindex}
                title="Re-scan and rebuild global index"
                className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#8b949e] hover:text-[#58a6ff] text-xs flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline font-mono text-[10px]">Re-index</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-[#21262d] hover:bg-[#da3633]/30 text-[#8b949e] hover:text-white border border-[#30363d] transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Primary Query Input Bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-[#58a6ff]" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symbols, functions, text, or regex across all project files..."
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-xl pl-10 pr-24 py-2.5 text-xs sm:text-sm text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#1f6feb]/30 font-mono transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-20 text-[#8b949e] hover:text-white p-1 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Quick Replace Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsReplaceMode((prev) => !prev)}
              title="Toggle Global Replace across workspace"
              className={`absolute right-2 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border transition-all ${
                isReplaceMode
                  ? 'bg-[#1f6feb] text-white border-[#388bfd]'
                  : 'bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] border-[#30363d]'
              }`}
            >
              <Replace className="h-3 w-3" />
              <span className="hidden xs:inline">Replace</span>
            </button>
          </div>

          {/* Optional Replace Bar */}
          {isReplaceMode && (
            <div className="flex items-center gap-2 bg-[#0d1117] p-2 rounded-xl border border-[#30363d] animate-in slide-in-from-top-2 duration-100">
              <Replace className="h-4 w-4 text-[#e3b341] ml-1 shrink-0" />
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replace matching text with..."
                className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={handleExecuteReplace}
                disabled={!query.trim() || searchResults.totalMatches === 0}
                className="px-3 py-1 rounded-lg bg-[#238636] hover:bg-[#2ea043] disabled:opacity-40 text-white text-[11px] font-mono font-bold shadow-md transition-all shrink-0 flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Replace All ({searchResults.totalMatches})</span>
              </button>
            </div>
          )}

          {/* Filters & Options Row */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            {/* Left: Scope Tabs */}
            <div className="flex items-center bg-[#0d1117] p-0.5 rounded-xl border border-[#30363d] gap-0.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  scope === 'all' ? 'bg-[#1f6feb] text-white font-bold' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                All Files
              </button>
              <button
                type="button"
                onClick={() => setScope('sandbox')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  scope === 'sandbox' ? 'bg-[#1f6feb] text-white font-bold' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                Sandbox
              </button>
              <button
                type="button"
                onClick={() => setScope('app')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  scope === 'app' ? 'bg-[#1f6feb] text-white font-bold' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                :app Module
              </button>
              <button
                type="button"
                onClick={() => setScope('library')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  scope === 'library' ? 'bg-[#1f6feb] text-white font-bold' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                Libraries
              </button>
            </div>

            {/* Right: Search Flags (Match Case, Whole Word, Regex) & Extensions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setCaseSensitive((prev) => !prev)}
                title="Match Case (Aa)"
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                  caseSensitive
                    ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/50'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white'
                }`}
              >
                Aa
              </button>
              <button
                type="button"
                onClick={() => setWholeWord((prev) => !prev)}
                title="Match Whole Word (\b)"
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                  wholeWord
                    ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/50'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white'
                }`}
              >
                \b
              </button>
              <button
                type="button"
                onClick={() => setUseRegex((prev) => !prev)}
                title="Use Regular Expression (.*)"
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                  useRegex
                    ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/50'
                    : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white'
                }`}
              >
                .*
              </button>

              {/* Extension Quick Filter Chips */}
              <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-[#30363d]">
                {popularExtensions.map((ext) => (
                  <button
                    key={ext.label}
                    type="button"
                    onClick={() => setFilePattern(ext.pattern)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border transition-colors ${
                      filePattern === ext.pattern
                        ? 'bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff]/50'
                        : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-[#c9d1d9]'
                    }`}
                  >
                    {ext.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notification if any */}
        {toastMessage && (
          <div className="bg-[#1f6feb]/15 border-y border-[#1f6feb]/30 px-4 py-2 flex items-center justify-between text-xs text-[#58a6ff] font-mono animate-in fade-in duration-100">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-[#8b949e] hover:text-white">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Results Summary Bar */}
        <div className="bg-[#161b22]/50 px-4 py-2 border-b border-[#30363d] flex items-center justify-between text-xs font-mono text-[#8b949e]">
          <div className="flex items-center gap-2">
            <span>
              Found <strong className="text-white">{searchResults.totalMatches}</strong> match
              {searchResults.totalMatches === 1 ? '' : 'es'} across{' '}
              <strong className="text-white">{searchResults.totalMatchedFiles}</strong> file
              {searchResults.totalMatchedFiles === 1 ? '' : 's'}
            </span>
          </div>

          {searchResults.results.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="hover:text-white transition-colors"
              >
                Expand all
              </button>
              <span>&bull;</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="hover:text-white transition-colors"
              >
                Collapse all
              </button>
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 font-mono">
          {!query.trim() ? (
            <div className="py-16 text-center text-[#8b949e] space-y-3">
              <Search className="h-10 w-10 mx-auto text-[#30363d] stroke-[1.5]" />
              <div className="text-sm font-semibold text-[#c9d1d9]">Type to search global index</div>
              <p className="text-xs max-w-sm mx-auto text-[#8b949e]">
                Search through {indexStats.totalFiles} files and {indexStats.totalLines.toLocaleString()} indexed lines of code. Supports regex, whole word, and case-sensitive matching.
              </p>
            </div>
          ) : searchResults.results.length === 0 ? (
            <div className="py-16 text-center text-[#8b949e] space-y-3">
              <AlertCircle className="h-10 w-10 mx-auto text-[#30363d] stroke-[1.5]" />
              <div className="text-sm font-semibold text-[#c9d1d9]">No matches found</div>
              <p className="text-xs max-w-sm mx-auto text-[#8b949e]">
                No files matched "{query}" with the current filters. Try relaxing the scope or pattern.
              </p>
            </div>
          ) : (
            searchResults.results.map((item) => {
              const isExpanded = expandedFiles[item.file.path] ?? false;
              const isSandbox = Boolean(item.file.isSandbox || item.file.storageScope === 'sandbox_user' || item.file.path.startsWith('sandbox/'));

              return (
                <div
                  key={item.file.path}
                  className="bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/40 rounded-xl overflow-hidden transition-all shadow-sm"
                >
                  {/* File Header */}
                  <div
                    onClick={() => handleToggleFileExpand(item.file.path)}
                    className="px-3 py-2.5 bg-[#161b22] flex items-center justify-between cursor-pointer select-none hover:bg-[#21262d] transition-colors border-b border-[#30363d]/60 gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-[#8b949e] shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[#8b949e] shrink-0" />
                      )}
                      <FileCode className="h-4 w-4 text-[#58a6ff] shrink-0" />
                      <div className="truncate flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-white truncate">
                          {item.file.name}
                        </span>
                        <span className="text-[10px] text-[#8b949e] truncate hidden md:inline">
                          {item.file.path}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSandbox && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30 uppercase">
                          Sandbox
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30">
                        {item.totalMatches} match{item.totalMatches === 1 ? '' : 'es'}
                      </span>
                    </div>
                  </div>

                  {/* Matching Lines Accordion Content */}
                  {isExpanded && (
                    <div className="divide-y divide-[#30363d]/40 bg-[#0d1117]">
                      {item.matches.map((m, idx) => (
                        <button
                          key={`${item.file.path}-${m.lineNumber}-${idx}`}
                          type="button"
                          onClick={() => {
                            onSelectFileAndLine(item.file.path, m.lineNumber);
                            onClose();
                          }}
                          className="w-full px-3 py-1.5 flex items-center gap-3 hover:bg-[#161b22] text-left transition-colors group cursor-pointer"
                        >
                          <span className="w-10 text-right text-[11px] text-[#8b949e] group-hover:text-[#58a6ff] shrink-0 font-mono">
                            L{m.lineNumber}
                          </span>
                          <div className="flex-1 min-w-0 text-xs text-[#c9d1d9] truncate font-mono">
                            {renderHighlightedLine(m.lineContent, m.matchIndex, m.matchLength)}
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-[#8b949e] group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Keyboard Hints & Indexed Totals */}
        <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-[#8b949e] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Indexed:{' '}
              <strong className="text-[#c9d1d9]">
                {indexStats.totalLines.toLocaleString()} lines
              </strong>{' '}
              ({(indexStats.totalCharacters / 1024).toFixed(1)} KB)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[10px] text-white">
              Esc
            </kbd>
            <span className="hidden sm:inline">to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function renderHighlightedLine(
  line: string,
  matchIndex: number,
  matchLength: number
): React.ReactNode {
  if (matchIndex < 0 || matchIndex >= line.length) {
    return line;
  }

  const before = line.slice(0, matchIndex);
  const match = line.slice(matchIndex, matchIndex + matchLength);
  const after = line.slice(matchIndex + matchLength);

  return (
    <span>
      <span className="text-[#8b949e]">{before}</span>
      <mark className="bg-[#ffa657]/30 text-[#ffa657] font-bold px-0.5 rounded border border-[#ffa657]/50">
        {match}
      </mark>
      <span>{after}</span>
    </span>
  );
}
