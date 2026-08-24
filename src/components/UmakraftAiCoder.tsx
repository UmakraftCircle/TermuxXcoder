import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Code2,
  FileCode,
  Check,
  Copy,
  Download,
  Terminal,
  Zap,
  CheckCircle2,
  Edit3,
  X,
  Settings,
  GitBranch,
  FolderTree,
  Play,
  RotateCcw,
  ShieldCheck,
  Bug,
  ListTree,
  ChevronRight,
  Maximize2,
  Minimize2,
  Search
} from 'lucide-react';
import { ProjectFile } from '../types';
import confetti from 'canvas-confetti';

interface UmakraftAiCoderProps {
  files: ProjectFile[];
  activeFilePath?: string;
  onUpdateFileContent: (path: string, newContent: string) => void;
  onOpenSettings: () => void;
  isAiModalOpen?: boolean;
  onCloseAiModal?: () => void;
  onOpenAiModal?: () => void;
  onSelectFile?: (file: ProjectFile) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  codeSnippet?: string;
  timestamp: string;
}

export const UmakraftAiCoder: React.FC<UmakraftAiCoderProps> = ({
  files,
  activeFilePath,
  onUpdateFileContent,
  onOpenSettings,
  isAiModalOpen = false,
  onCloseAiModal,
  onOpenAiModal
}) => {
  // Filter workspace sandbox files
  const sandboxFiles = files.filter(
    (file) =>
      file.module !== 'app' &&
      !file.path.startsWith('app/') &&
      !file.path.startsWith('src/') &&
      !file.path.startsWith('index.') &&
      !file.path.startsWith('server.')
  );

  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    activeFilePath || sandboxFiles[0]?.path || files[0]?.path || ''
  );
  const [editorContent, setEditorContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [internalAiOpen, setInternalAiOpen] = useState(false);
  const [activeLine, setActiveLine] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // AI Chat & Assistance State
  const [prompt, setPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [, setLastSuggestedCode] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update selected file when external activeFilePath prop changes
  useEffect(() => {
    if (activeFilePath) {
      setSelectedFilePath(activeFilePath);
    }
  }, [activeFilePath]);

  const currentFile =
    sandboxFiles.find((f) => f.path === selectedFilePath) ||
    files.find((f) => f.path === selectedFilePath) ||
    sandboxFiles[0] ||
    files[0];

  useEffect(() => {
    if (currentFile) {
      setEditorContent(currentFile.content);
      setIsEditing(false);
      setLastSuggestedCode(null);
    }
  }, [currentFile?.path, currentFile?.content]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I am your Umakraft AI Sandbox Copilot. Ask me to refactor, explain, debug, or generate code for ${
        currentFile?.name || 'your project'
      }. Tap 'Apply' on any generated patch to update the code instantly.`,
      timestamp: 'Just now'
    }
  ]);

  const getQuickAiPrompts = (filename: string) => {
    if (filename.includes('.cpp') || filename.includes('Pty')) {
      return [
        { label: '⚡ Optimize JNI C++', query: `Optimize the openpty and forkpty buffer handling in ${filename} for Android 14.` },
        { label: '🛡️ Audit Security', query: `Analyze ${filename} for memory leaks and termios security sanitization.` },
        { label: '📝 Explain PTY Bridge', query: `Explain line-by-line how ${filename} interacts with /dev/ptmx.` }
      ];
    }
    if (filename.includes('Editor') || filename.includes('Sora')) {
      return [
        { label: '🎨 Add Syntax Grammar', query: `Add custom TextMate grammar loader support to ${filename}.` },
        { label: '⚡ Auto-Complete Hook', query: `Add language server auto-complete listener hook inside ${filename}.` },
        { label: '📝 Explain Rendering', query: `Explain the rendering pipeline and gesture controls in ${filename}.` }
      ];
    }
    if (filename.includes('.yml')) {
      return [
        { label: '🚀 Add Matrix ABI Build', query: `Update this workflow to build separate APKs for arm64-v8a and x86_64.` },
        { label: '📦 Optimize Cache', query: `Enhance GitHub Actions Gradle build cache in ${filename}.` },
        { label: '📝 Explain Workflow', query: `Explain the GitHub Actions steps and triggers in ${filename}.` }
      ];
    }
    return [
      { label: '✨ Refactor & Clean', query: `Refactor ${filename} for better modularity, performance, and clean Kotlin patterns.` },
      { label: '🛡️ Bug & Null-Safety', query: `Check ${filename} for potential crashes, null-safety, and edge cases.` },
      { label: '🧪 Generate Unit Test', query: `Generate a comprehensive test suite for ${filename}.` }
    ];
  };

  const handleSendAiPrompt = async (textToSend?: string) => {
    const query = (textToSend || prompt).trim();
    if (!query || !currentFile) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          currentFile: currentFile.path,
          context: `Sandbox File Content:\n${editorContent.slice(0, 3000)}`
        })
      });

      const data = await res.json();
      const replyText = data.reply || 'Analysis completed.';

      const codeMatch = replyText.match(/```(?:kotlin|java|cpp|yaml|groovy|json|kts)?\n([\s\S]*?)```/);
      const extractedCode = codeMatch ? codeMatch[1].trim() : null;

      if (extractedCode) {
        setLastSuggestedCode(extractedCode);
      }

      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'ai',
        text: replyText,
        codeSnippet: extractedCode || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const fallbackAiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'ai',
        text: `AI Patch for ${currentFile.name}:\n\nEnsure Kotlin coroutines and background threads are used for I/O operations. Code structure complies with Android 10+ (API 29–34).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplySuggestedCode = (code: string) => {
    setEditorContent(code);
    if (currentFile) {
      onUpdateFileContent(currentFile.path, code);
    }
    setAppliedSuccess(true);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.4 } });
    setTimeout(() => setAppliedSuccess(false), 2500);
  };

  const handleSaveManualEdit = () => {
    if (currentFile) {
      onUpdateFileContent(currentFile.path, editorContent);
    }
    setIsEditing(false);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editorContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([editorContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile?.name || 'code.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Quick insertion of developer symbols
  const handleInsertSymbol = (symbol: string) => {
    if (!isEditing) setIsEditing(true);
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart || 0;
      const end = textareaRef.current.selectionEnd || 0;
      const newText = editorContent.substring(0, start) + symbol + editorContent.substring(end);
      setEditorContent(newText);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + symbol.length;
          textareaRef.current.focus();
        }
      }, 50);
    } else {
      setEditorContent((prev) => prev + symbol);
    }
  };

  // Syntax highlighting parser
  const renderHighlightedLine = (line: string, lineIndex: number) => {
    const lang = currentFile?.language?.toLowerCase() || '';

    // Comment highlight
    if (line.trim().startsWith('#') || line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
      return <span className="text-[#8b949e] italic">{line}</span>;
    }

    // YAML syntax highlighting
    if (lang === 'yaml' || currentFile?.name.endsWith('.yml') || currentFile?.name.endsWith('.yaml')) {
      const parts = line.split(/(:|\s+-\s+|\[|\]|{|}|\(|\)|"|')/);
      return (
        <span>
          {parts.map((part, pIdx) => {
            if (part === ':') return <span key={pIdx} className="text-[#ff7b72] font-bold">:</span>;
            if (/^\s*[\w.-]+:?$/.test(part)) return <span key={pIdx} className="text-[#79c0ff] font-semibold">{part}</span>;
            if (/^".*"$/.test(part) || /^'.*'$/.test(part)) return <span key={pIdx} className="text-[#a5d6ff]">{part}</span>;
            if (/^(true|false|yes|no|null|debug|release|all)$/i.test(part.trim())) return <span key={pIdx} className="text-[#ffa657] font-semibold">{part}</span>;
            if (/^\d+$/.test(part.trim())) return <span key={pIdx} className="text-[#d2a8ff]">{part}</span>;
            return <span key={pIdx} className="text-[#c9d1d9]">{part}</span>;
          })}
        </span>
      );
    }

    // Kotlin / Java syntax highlighting
    if (lang === 'kotlin' || lang === 'java' || currentFile?.name.endsWith('.kt') || currentFile?.name.endsWith('.java')) {
      const words = line.split(/(\s+|[(){}[\]:;,.+\-*/=><!&|])/);
      const keywords = new Set([
        'package', 'import', 'class', 'interface', 'object', 'fun', 'val', 'var',
        'override', 'private', 'public', 'protected', 'internal', 'return', 'if',
        'else', 'when', 'for', 'while', 'try', 'catch', 'finally', 'throw', 'null',
        'true', 'false', 'this', 'super', 'suspend', 'companion', 'data', 'sealed'
      ]);
      const types = new Set([
        'String', 'Int', 'Boolean', 'Long', 'Float', 'Double', 'List', 'Map', 'Set',
        'Unit', 'Any', 'File', 'Context', 'View', 'Activity', 'CoroutineScope', 'Job'
      ]);

      return (
        <span>
          {words.map((word, wIdx) => {
            if (keywords.has(word)) return <span key={wIdx} className="text-[#ff7b72] font-semibold">{word}</span>;
            if (types.has(word)) return <span key={wIdx} className="text-[#ffa657] font-semibold">{word}</span>;
            if (/^".*"$/.test(word)) return <span key={wIdx} className="text-[#a5d6ff]">{word}</span>;
            if (/^\d+$/.test(word)) return <span key={wIdx} className="text-[#79c0ff]">{word}</span>;
            if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) return <span key={wIdx} className="text-[#d2a8ff]">{word}</span>;
            if (/^[a-z][a-zA-Z0-9_]*\(/.test(word)) return <span key={wIdx} className="text-[#58a6ff]">{word}</span>;
            return <span key={wIdx} className="text-[#c9d1d9]">{word}</span>;
          })}
        </span>
      );
    }

    // C++ syntax highlighting
    if (lang === 'cpp' || currentFile?.name.endsWith('.cpp') || currentFile?.name.endsWith('.h')) {
      if (line.trim().startsWith('#include') || line.trim().startsWith('#define') || line.trim().startsWith('#ifdef')) {
        return <span className="text-[#ff7b72] font-semibold">{line}</span>;
      }
      return <span className="text-[#c9d1d9]">{line}</span>;
    }

    // Default clean code text
    return <span className="text-[#c9d1d9]">{line}</span>;
  };

  const isAiActive = isAiModalOpen || internalAiOpen;

  const lines = editorContent.split('\n');

  return (
    <div className="h-full w-full flex flex-col overflow-hidden select-none">
      {/* Primary Full-Screen IDE Window */}
      <div className="flex-1 min-h-0 bg-[#0d1117] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl flex flex-col relative">
        {/* Top IDE File Tabs Carousel Strip */}
        <div className="bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-2 pt-1.5 pb-0 gap-2 flex-shrink-0">
          {/* Scrollable File Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0 pr-1">
            {sandboxFiles.slice(0, 8).map((file) => {
              const isSelected = file.path === currentFile?.path;
              return (
                <button
                  key={file.path}
                  onClick={() => {
                    setSelectedFilePath(file.path);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-xl text-xs font-mono transition-all shrink-0 border-t border-x ${
                    isSelected
                      ? 'bg-[#0d1117] text-[#58a6ff] border-[#30363d] border-b-0 font-bold shadow-sm'
                      : 'bg-[#161b22] text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] border-transparent'
                  }`}
                >
                  <FileCode className={`h-3.5 w-3.5 ${isSelected ? 'text-[#58a6ff]' : 'text-[#8b949e]'}`} />
                  <span className="truncate max-w-[120px] sm:max-w-[160px]">{file.name}</span>
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#58a6ff] ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Right Action Icons */}
          <div className="flex items-center gap-1 pb-1 flex-shrink-0">
            {/* Search In File Button */}
            <button
              onClick={() => setIsSearchOpen((prev) => !prev)}
              title="Search File"
              className={`p-1.5 rounded-xl border transition-all active:scale-95 ${
                isSearchOpen
                  ? 'bg-[#1f6feb] text-white border-[#388bfd]'
                  : 'bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border-[#30363d]'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
            </button>

            {/* Edit / Save Button */}
            <button
              onClick={() => {
                if (isEditing) {
                  handleSaveManualEdit();
                } else {
                  setIsEditing(true);
                }
              }}
              title={isEditing ? 'Save Code' : 'Edit Code'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border active:scale-95 ${
                isEditing
                  ? 'bg-[#238636] hover:bg-[#2ea043] text-white border-[#3fb950]/50 shadow-sm'
                  : 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white border-[#30363d]'
              }`}
            >
              {isEditing ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span className="text-[11px]">Save</span>
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5 text-[#58a6ff]" />
                  <span className="text-[11px] hidden xs:inline">Edit</span>
                </>
              )}
            </button>

            {/* AI Copilot Sparkles Button */}
            <button
              onClick={() => {
                if (onOpenAiModal) {
                  onOpenAiModal();
                } else {
                  setInternalAiOpen((prev) => !prev);
                }
              }}
              title="AI Copilot Assistant"
              className={`p-1.5 rounded-xl border transition-all active:scale-95 ${
                isAiActive
                  ? 'bg-[#bc8cff] text-white border-[#d2a8ff] shadow-md shadow-[#bc8cff]/20'
                  : 'bg-[#21262d] hover:bg-[#30363d] border-[#30363d] text-[#bc8cff]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Secondary Info Ribbon: Breadcrumbs & Status */}
        <div className="px-3 py-1.5 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between gap-2 text-[11px] font-mono text-[#8b949e]">
          <div className="flex items-center gap-1.5 truncate">
            <FolderTree className="h-3 w-3 text-[#58a6ff] shrink-0" />
            <span className="truncate">{currentFile?.path || 'workspace/src'}</span>
            <span className="text-[#30363d]">&bull;</span>
            <span className="text-[#3fb950] font-semibold flex items-center gap-0.5 shrink-0">
              <GitBranch className="h-3 w-3" />
              main
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {appliedSuccess && (
              <span className="text-[10px] text-[#3fb950] font-bold flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </span>
            )}
            <span className="text-[10px] text-[#8b949e]">
              {lines.length} lines &bull; UTF-8
            </span>
            <button
              onClick={handleCopyCode}
              title="Copy Entire File"
              className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white"
            >
              {copiedCode ? <Check className="h-3 w-3 text-[#3fb950]" /> : <Copy className="h-3 w-3" />}
            </button>
            <button
              onClick={handleDownloadSingleFile}
              title="Download File"
              className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white"
            >
              <Download className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* In-File Search Bar (Conditional) */}
        {isSearchOpen && (
          <div className="px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] flex items-center gap-2 animate-in slide-in-from-top-2">
            <Search className="h-3.5 w-3.5 text-[#8b949e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find in file..."
              className="bg-transparent text-xs text-[#f0f6fc] font-mono focus:outline-none flex-1 placeholder-[#8b949e]"
              autoFocus
            />
            {searchQuery && (
              <span className="text-[10px] font-mono text-[#58a6ff]">
                {lines.filter((l) => l.toLowerCase().includes(searchQuery.toLowerCase())).length} matches
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="p-1 text-[#8b949e] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* AI Quick Prompt Chips Ribbon */}
        <div className="bg-[#161b22]/70 border-b border-[#21262d] px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
          <span className="text-[10px] font-semibold text-[#bc8cff] flex items-center gap-1 shrink-0 pr-1">
            <Sparkles className="h-3 w-3" />
            AI Actions:
          </span>
          {getQuickAiPrompts(currentFile?.name || '').map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (onOpenAiModal) onOpenAiModal();
                else setInternalAiOpen(true);
                handleSendAiPrompt(p.query);
              }}
              className="px-2 py-0.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[10px] text-[#c9d1d9] hover:text-white whitespace-nowrap shrink-0 transition-all active:scale-95 flex items-center gap-1"
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Code Canvas Area (Scrollable with Syntax Tokens & Active Line Highlighting) */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto font-mono text-xs text-[#c9d1d9] leading-relaxed select-text relative">
          {isEditing ? (
            <div className="h-full flex">
              {/* Line Numbers in Edit Mode */}
              <div className="select-none py-3 px-2.5 text-right text-[#484f58] font-mono text-xs border-r border-[#21262d] bg-[#0d1117] flex-shrink-0">
                {lines.map((_, i) => (
                  <div key={i} className="leading-relaxed">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Textarea Editor */}
              <textarea
                ref={textareaRef}
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                className="w-full h-full min-h-full p-3 bg-transparent text-[#f0f6fc] font-mono text-xs focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
                autoFocus
              />
            </div>
          ) : (
            <div className="flex min-w-full py-2">
              {/* Line Numbers & Gutter */}
              <div className="select-none px-2.5 text-right text-[#484f58] font-mono text-xs border-r border-[#21262d] bg-[#0d1117] flex-shrink-0">
                {lines.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveLine(i + 1)}
                    className={`leading-relaxed cursor-pointer transition-colors ${
                      activeLine === i + 1 ? 'text-[#58a6ff] font-bold' : 'hover:text-[#8b949e]'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Code Lines with Syntax Tokens */}
              <div className="flex-1 overflow-x-auto px-3 select-text">
                {lines.map((line, i) => {
                  const isMatch = searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase());
                  const isSelected = activeLine === i + 1;

                  return (
                    <div
                      key={i}
                      onClick={() => setActiveLine(i + 1)}
                      className={`leading-relaxed whitespace-pre font-mono transition-colors rounded px-1 -mx-1 ${
                        isMatch
                          ? 'bg-[#d29922]/20 text-white'
                          : isSelected
                          ? 'bg-[#1f6feb]/10'
                          : 'hover:bg-[#21262d]/40'
                      }`}
                    >
                      {renderHighlightedLine(line, i)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Programmer Soft-Key Symbol Helper Strip (Mobile Coding Toolbar) */}
        <div className="bg-[#161b22] border-t border-[#30363d] px-2 py-1 flex items-center gap-1 overflow-x-auto scrollbar-none flex-shrink-0">
          {['Tab', '{', '}', '(', ')', '[', ']', ':', '"', "'", '=', '>', '<', '_', '/', '$', ';', '#'].map(
            (sym) => (
              <button
                key={sym}
                onClick={() => handleInsertSymbol(sym === 'Tab' ? '  ' : sym)}
                className="px-2 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[11px] font-mono text-[#c9d1d9] hover:text-white border border-[#30363d] transition-all active:scale-95 shrink-0"
              >
                {sym}
              </button>
            )
          )}
        </div>

        {/* AI Copilot Drawer Overlay (Opens Cleanly Over Code on Mobile) */}
        {isAiActive && (
          <div className="absolute inset-0 bg-[#161b22]/98 backdrop-blur-md z-20 flex flex-col p-3 overflow-hidden border border-[#bc8cff]/30 shadow-2xl rounded-2xl animate-in fade-in duration-150">
            {/* AI Overlay Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#30363d] flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-xl bg-[#bc8cff]/20 border border-[#bc8cff]/40 text-[#bc8cff]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#f0f6fc] flex items-center gap-1.5">
                    <span>Umakraft AI Copilot</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#1f6feb]/20 text-[#58a6ff]">
                      Gemini
                    </span>
                  </h4>
                  <p className="text-[10px] text-[#8b949e] truncate">
                    Analyzing: {currentFile?.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onCloseAiModal) {
                    onCloseAiModal();
                  } else {
                    setInternalAiOpen(false);
                  }
                }}
                className="p-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] min-h-[36px] min-w-[36px] flex items-center justify-center border border-[#30363d]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* AI Messages Stream */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 p-1 py-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[95%] p-2.5 rounded-2xl text-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#1f6feb] text-white rounded-br-none shadow-md'
                        : 'bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    {msg.codeSnippet && (
                      <div className="mt-2 pt-2 border-t border-[#30363d]">
                        <div className="flex items-center justify-between pb-1.5">
                          <span className="text-[10px] font-mono text-[#58a6ff] font-semibold">
                            Generated Patch
                          </span>
                          <button
                            onClick={() => handleApplySuggestedCode(msg.codeSnippet!)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-[10px] font-bold text-white shadow transition-transform active:scale-95"
                          >
                            <Zap className="h-3 w-3" />
                            <span>Apply to File</span>
                          </button>
                        </div>
                        <pre className="p-2.5 rounded-xl bg-black/60 font-mono text-[10px] overflow-x-auto text-[#79c0ff] border border-[#30363d]/50">
                          <code>{msg.codeSnippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAiLoading && (
                <div className="flex items-center gap-2 p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#8b949e] w-fit">
                  <Sparkles className="h-3.5 w-3.5 text-[#bc8cff] animate-spin" />
                  <span>Gemini AI is analyzing code & generating patch...</span>
                </div>
              )}
            </div>

            {/* AI Prompt Input Bar */}
            <div className="pt-2 border-t border-[#30363d] flex items-center gap-1.5 flex-shrink-0">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendAiPrompt();
                }}
                placeholder={`Ask AI about ${currentFile?.name}...`}
                className="flex-1 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#bc8cff]"
              />
              <button
                onClick={() => handleSendAiPrompt()}
                disabled={isAiLoading || !prompt.trim()}
                className="h-9 w-9 rounded-xl bg-[#bc8cff] hover:bg-[#d2a8ff] text-black font-bold flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0 shadow active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
