import React, { useState, useEffect } from 'react';
import {
  Search,
  Globe,
  ExternalLink,
  BookOpen,
  Code2,
  Sparkles,
  Copy,
  Check,
  Zap,
  ArrowRight,
  RefreshCw,
  Sliders,
  Bot,
  Layers,
  Terminal,
  ShieldCheck,
  Cpu,
  FileCode2,
  BookmarkPlus,
  Send,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { ProjectFile } from '../types';
import confetti from 'canvas-confetti';

interface WebDocsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCodeSnippet?: (snippet: string, filename?: string) => void;
  onInsertCodeIntoActiveFile?: (snippet: string) => void;
  activeFileName?: string;
}

export interface WebSearchResultItem {
  id: string;
  title: string;
  source: string;
  url: string;
  badge: string;
  category: 'android' | 'kotlin' | 'ndk' | 'gradle' | 'termux' | 'gemini';
  snippet: string;
  codeBlock?: string;
  codeLanguage?: string;
  verifiedVersion?: string;
}

const PRESET_TOPICS = [
  { label: '🤖 Android 14 Scoped Storage', query: 'Android 14 Scoped Storage MediaStore Kotlin' },
  { label: '⚙️ NDK POSIX forkpty / openpty', query: 'POSIX forkpty openpty termios Android NDK C++' },
  { label: '🐘 AGP 8.8 & Gradle 8.7', query: 'Android Gradle Plugin 8.8 version catalog Kotlin DSL' },
  { label: '✍️ Sora Editor 0.23.5', query: 'io.github.rosemoe.sora editor syntax highlight Android' },
  { label: '✨ Gemini 3.7 Flash SDK', query: '@google/genai GoogleGenAI SDK TypeScript generateContent' },
  { label: '🛡️ Kotlin Coroutines I/O', query: 'withContext Dispatchers.IO safe IO operations Kotlin' }
];

export const WebDocsSearchModal: React.FC<WebDocsSearchModalProps> = ({
  isOpen,
  onClose,
  onApplyCodeSnippet,
  onInsertCodeIntoActiveFile,
  activeFileName
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<WebSearchResultItem[]>([]);
  const [aiGroundedSummary, setAiGroundedSummary] = useState<string | null>(null);

  // Initial popular search results
  useEffect(() => {
    if (isOpen && searchResults.length === 0) {
      handlePerformSearch('Android 14 Scoped Storage & NDK PTY');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePerformSearch = async (searchQueryText?: string) => {
    const q = (searchQueryText || query).trim();
    if (!q) return;

    setIsLoading(true);
    setAiGroundedSummary(null);

    try {
      const res = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, category: selectedCategory })
      });

      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        setSearchResults(data.results);
        setAiGroundedSummary(data.groundedSummary || null);
      }
    } catch (err) {
      console.error('Web search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    confetti({ particleCount: 15, spread: 35 });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (code: string, id: string) => {
    if (onInsertCodeIntoActiveFile) {
      onInsertCodeIntoActiveFile(code);
    } else if (onApplyCodeSnippet) {
      onApplyCodeSnippet(code, activeFileName);
    }
    setInsertedId(id);
    confetti({ particleCount: 25, spread: 45 });
    setTimeout(() => setInsertedId(null), 2000);
  };

  const filteredResults = searchResults.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      id="web-search-docs-modal"
    >
      <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30 shadow-inner">
              <Globe className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  AI Web Search & Live Docs Explorer
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30 font-semibold">
                  Live Grounding
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e] truncate">
                Search official Android, Kotlin, C++ NDK, Gradle & AI SDK documentation with 1-tap code insertion.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] transition-all text-xs font-mono"
          >
            ✕ Close
          </button>
        </div>

        {/* Search Bar & Category Filter Strip */}
        <div className="p-3 bg-[#161b22]/50 border-b border-[#30363d] space-y-2.5 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePerformSearch();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Android 14 APIs, Kotlin coroutines, C++ NDK openpty, Gradle 8.8, Gemini SDK..."
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#6e7681] focus:outline-none transition-colors font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              <span>{isLoading ? 'Searching...' : 'Web Search'}</span>
            </button>
          </form>

          {/* Quick Preset Topics */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            <span className="text-[10px] text-[#8b949e] font-mono shrink-0 mr-1">Trending:</span>
            {PRESET_TOPICS.map((topic, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(topic.query);
                  handlePerformSearch(topic.query);
                }}
                className="px-2 py-0.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-[#58a6ff] border border-[#30363d] text-[10px] font-mono whitespace-nowrap transition-all"
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 font-sans">
          {/* AI Grounded Summary Box */}
          {aiGroundedSummary && (
            <div className="bg-[#161b22] border border-[#1f6feb]/40 rounded-2xl p-3.5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-[#58a6ff]">
                  <Sparkles className="h-4 w-4" />
                  AI Grounded Documentation Synthesis
                </span>
                <span className="text-[10px] font-mono text-[#3fb950] bg-[#238636]/20 px-2 py-0.5 rounded-full border border-[#238636]/30">
                  Verified Sources
                </span>
              </div>
              <p className="text-xs text-[#c9d1d9] leading-relaxed font-mono whitespace-pre-wrap">
                {aiGroundedSummary}
              </p>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 space-y-2 text-[#58a6ff]">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xs font-mono">Searching official web documentation & extracting verified snippets...</span>
            </div>
          )}

          {/* Result Cards */}
          {!isLoading && filteredResults.length === 0 && (
            <div className="text-center p-8 text-[#8b949e] space-y-2">
              <BookOpen className="h-8 w-8 mx-auto opacity-50 text-[#58a6ff]" />
              <p className="text-xs font-bold text-white">No search results found</p>
              <p className="text-[11px] text-[#8b949e]">Try searching for terms like "Android Scoped Storage", "openpty NDK", or "AGP 8.8".</p>
            </div>
          )}

          {!isLoading &&
            filteredResults.map((item) => (
              <div
                key={item.id}
                className="bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/40 rounded-2xl p-3.5 space-y-2.5 transition-all shadow-sm group"
              >
                {/* Result Top Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded-lg bg-[#21262d] text-[#58a6ff] border border-[#30363d] text-[10px] font-mono font-bold shrink-0">
                      {item.badge}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#58a6ff] transition-colors truncate">
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#8b949e] shrink-0">
                    <span className="text-[#3fb950]">{item.source}</span>
                    {item.verifiedVersion && <span>• {item.verifiedVersion}</span>}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#58a6ff] hover:underline flex items-center gap-0.5 ml-1"
                    >
                      <span>Docs</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>

                {/* Snippet Description */}
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  {item.snippet}
                </p>

                {/* Code Block if available */}
                {item.codeBlock && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8b949e]">
                      <span className="flex items-center gap-1 text-[#58a6ff]">
                        <Code2 className="h-3 w-3" />
                        Verified Code Snippet ({item.codeLanguage || 'kotlin'})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(item.codeBlock!, item.id)}
                          className="px-2 py-0.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white font-semibold text-[10px] flex items-center gap-1 border border-[#30363d] transition-all"
                        >
                          {copiedId === item.id ? <Check className="h-3 w-3 text-[#3fb950]" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => handleInsert(item.codeBlock!, item.id)}
                          className="px-2.5 py-0.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-[10px] flex items-center gap-1 active:scale-95 transition-all shadow"
                        >
                          {insertedId === item.id ? <Check className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                          <span>{insertedId === item.id ? 'Inserted!' : '1-Tap Insert'}</span>
                        </button>
                      </div>
                    </div>

                    <pre className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl overflow-x-auto text-[11px] font-mono text-[#79c0ff] leading-relaxed">
                      <code>{item.codeBlock}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Footer info bar */}
        <div className="bg-[#161b22] px-4 py-2.5 border-t border-[#30363d] flex items-center justify-between text-xs text-[#8b949e] font-mono shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#3fb950]" />
            <span>Active File Target: {activeFileName || 'sandbox/active_file'}</span>
          </div>
          <span>Tip: Tap "1-Tap Insert" to immediately apply code snippets to your active sandbox buffer.</span>
        </div>
      </div>
    </div>
  );
};
