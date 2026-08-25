import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  Sliders,
  Layers,
  Lightbulb,
  X,
  FileCode2,
  ArrowRight
} from 'lucide-react';
import { AiRagMemoryService, AiMemoryItem, RagDocumentSnippet } from '../utils/aiRagMemoryService';
import { ProjectFile } from '../types';

interface AiMemoryRagModalProps {
  isOpen: boolean;
  onClose: () => void;
  allFiles: ProjectFile[];
  onSelectSnippetFile?: (path: string) => void;
}

export const AiMemoryRagModal: React.FC<AiMemoryRagModalProps> = ({
  isOpen,
  onClose,
  allFiles,
  onSelectSnippetFile
}) => {
  const [activeTab, setActiveTab] = useState<'memory' | 'rag' | 'learning'>('memory');
  const [memories, setMemories] = useState<AiMemoryItem[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<'rule' | 'preference' | 'architecture' | 'learning'>('rule');
  
  // RAG Search state
  const [ragQuery, setRagQuery] = useState('');
  const [ragSnippets, setRagSnippets] = useState<RagDocumentSnippet[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen]);

  const loadMemories = () => {
    setMemories(AiRagMemoryService.getMemories());
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    AiRagMemoryService.remember(newKey.trim(), newValue.trim(), newCategory);
    setNewKey('');
    setNewValue('');
    loadMemories();
  };

  const handleDeleteMemory = (id: string) => {
    AiRagMemoryService.forget(id);
    loadMemories();
  };

  const handleResetMemories = () => {
    AiRagMemoryService.resetToDefault();
    loadMemories();
  };

  const handleRunRagSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ragQuery.trim()) return;
    const res = AiRagMemoryService.searchProjectRag(ragQuery, allFiles, 8);
    setRagSnippets(res.snippets);
    setHasSearched(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1117]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-[#1f6feb] to-[#a371f7] text-white shadow-md">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>AI MEMORY & RAG KNOWLEDGE</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40">
                  Active
                </span>
              </h3>
              <p className="text-[11px] text-[#8b949e]">
                Persistent project recall, vector indexed snippets, and continuous learning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#30363d] bg-[#0d1117]/60 px-4 pt-2 gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('memory')}
            className={`pb-2 px-3 border-b-2 font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'memory'
                ? 'border-[#58a6ff] text-[#58a6ff]'
                : 'border-transparent text-[#8b949e] hover:text-white'
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            <span>Persistent Memory ({memories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rag')}
            className={`pb-2 px-3 border-b-2 font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'rag'
                ? 'border-[#58a6ff] text-[#58a6ff]'
                : 'border-transparent text-[#8b949e] hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>RAG File Indexer</span>
          </button>

          <button
            onClick={() => setActiveTab('learning')}
            className={`pb-2 px-3 border-b-2 font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'learning'
                ? 'border-[#58a6ff] text-[#58a6ff]'
                : 'border-transparent text-[#8b949e] hover:text-white'
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Continuous Learning</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: PERSISTENT MEMORY */}
          {activeTab === 'memory' && (
            <div className="space-y-4">
              {/* Add Memory Form */}
              <form onSubmit={handleAddMemory} className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-white mb-1">
                  <span>Add Permanent Rule or Fact</span>
                  <button
                    type="button"
                    onClick={handleResetMemories}
                    className="text-[10px] text-[#8b949e] hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Reset Defaults</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Memory key (e.g. Scoped Storage)"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#58a6ff]"
                  />
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#58a6ff]"
                  >
                    <option value="rule">Rule (Mandatory)</option>
                    <option value="architecture">Architecture</option>
                    <option value="preference">Preference</option>
                    <option value="learning">Learned Fact</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!newKey.trim() || !newValue.trim()}
                    className="px-3 py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-1 disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Save to Memory</span>
                  </button>
                </div>
                <textarea
                  placeholder="Detailed rule/preference to always inject into AI prompts..."
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  rows={2}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-[#58a6ff]"
                />
              </form>

              {/* Memory List */}
              <div className="space-y-2">
                {memories.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl flex items-start justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          mem.category === 'rule'
                            ? 'bg-[#da3633]/20 text-[#ff7b72] border border-[#da3633]/40'
                            : mem.category === 'architecture'
                            ? 'bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40'
                            : 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40'
                        }`}>
                          {mem.category}
                        </span>
                        <span className="font-bold text-white">{mem.key}</span>
                        <span className="text-[10px] text-[#8b949e]">
                          (Confidence: {Math.round(mem.confidence * 100)}%)
                        </span>
                      </div>
                      <p className="text-[#c9d1d9] leading-relaxed">{mem.value}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      title="Forget this memory"
                      className="p-1 rounded text-[#8b949e] hover:text-[#ff7b72] hover:bg-[#21262d] transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: RAG FILE INDEXER */}
          {activeTab === 'rag' && (
            <div className="space-y-4">
              <form onSubmit={handleRunRagSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b949e]" />
                  <input
                    type="text"
                    value={ragQuery}
                    onChange={(e) => setRagQuery(e.target.value)}
                    placeholder="Search workspace files via RAG indexer (e.g. ScopedStorage, PTY JNI, keystore)..."
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#58a6ff]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!ragQuery.trim()}
                  className="px-4 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Index & Query</span>
                </button>
              </form>

              <div className="text-xs font-mono text-[#8b949e] flex items-center justify-between">
                <span>Total Project Files Indexed: <strong className="text-white">{allFiles.length}</strong></span>
                {hasSearched && (
                  <span>Matches Found: <strong className="text-[#58a6ff]">{ragSnippets.length}</strong></span>
                )}
              </div>

              {hasSearched && ragSnippets.length === 0 && (
                <div className="p-8 text-center text-[#8b949e] font-mono text-xs border border-dashed border-[#30363d] rounded-xl">
                  No direct code matches found in indexed files for "{ragQuery}".
                </div>
              )}

              <div className="space-y-2">
                {ragSnippets.map((snippet, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-1.5 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <FileCode2 className="h-3.5 w-3.5 text-[#58a6ff]" />
                        <span>{snippet.filePath}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-[#1f6feb]/20 text-[#58a6ff] text-[10px] font-bold">
                          Score: {snippet.score}
                        </span>
                        {onSelectSnippetFile && (
                          <button
                            onClick={() => {
                              onSelectSnippetFile(snippet.filePath);
                              onClose();
                            }}
                            className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-white text-[10px] flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {snippet.matchedLines && (
                      <pre className="p-2 bg-[#161b22] border border-[#30363d]/70 rounded-lg text-[10px] text-[#7ee787] overflow-x-auto">
                        {snippet.matchedLines}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CONTINUOUS LEARNING */}
          {activeTab === 'learning' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Lightbulb className="h-4 w-4 text-[#e3b341]" />
                  <span>How Continuous Learning Works in Umakraft</span>
                </div>
                <p className="text-[#8b949e] leading-relaxed text-[11px]">
                  Whenever you prompt the AI or accept code patches (e.g. Kotlin Coroutines, Jetpack Compose, Modern C++20), the engine analyzes your style and saves learned preferences to persistent storage.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px]">
                  <div className="p-2.5 bg-[#161b22] rounded-lg border border-[#30363d]">
                    <span className="text-[#3fb950] font-bold block mb-1">✓ Dynamic Context Injection</span>
                    <span className="text-[#8b949e]">Automatically adds your preferred libraries and coding rules into each prompt.</span>
                  </div>
                  <div className="p-2.5 bg-[#161b22] rounded-lg border border-[#30363d]">
                    <span className="text-[#58a6ff] font-bold block mb-1">✓ Automated RAG Retrieval</span>
                    <span className="text-[#8b949e]">Pulls relevant source code snippets across all 10 modules without overloading the context window.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between text-xs font-mono text-[#8b949e]">
          <span>Changes are auto-saved to local persistent storage</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg text-xs font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
