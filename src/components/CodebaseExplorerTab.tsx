import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  Search,
  Copy,
  Check,
  Edit3,
  Layers,
  ChevronRight,
  Code2,
  FileText,
  Settings,
  ShieldAlert,
  Terminal,
  Plus
} from 'lucide-react';
import { ProjectFile } from '../types';

interface CodebaseExplorerTabProps {
  files: ProjectFile[];
  onSelectFile: (file: ProjectFile) => void;
  onUpdateFileContent: (path: string, content: string) => void;
}

export const CodebaseExplorerTab: React.FC<CodebaseExplorerTabProps> = ({
  files,
  onSelectFile,
  onUpdateFileContent
}) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(files[0]?.path || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const currentFile = files.find((f) => f.path === selectedFilePath) || files[0];

  const modules = [
    { id: 'all', label: 'All Files' },
    { id: 'workflow', label: '.github / CI' },
    { id: 'app', label: ':app' },
    { id: 'editor', label: ':editor (Sora)' },
    { id: 'terminal', label: ':terminal (PTY)' },
    { id: 'git', label: ':git (JGit)' },
    { id: 'filesystem', label: ':filesystem (SAF)' },
    { id: 'lsp', label: ':lsp' },
    { id: 'debugger', label: ':debugger' },
    { id: 'ai', label: ':ai' },
    { id: 'common', label: ':common' }
  ];

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (file.description && file.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedModuleFilter === 'all') return true;
    if (selectedModuleFilter === 'workflow') return file.category === 'workflow';
    return file.module === selectedModuleFilter;
  });

  const handleCopyCode = () => {
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartEdit = () => {
    if (currentFile) {
      setEditedContent(currentFile.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (currentFile) {
      onUpdateFileContent(currentFile.path, editedContent);
      setIsEditing(false);
    }
  };

  const getLanguageBadgeColor = (lang: string) => {
    switch (lang) {
      case 'kotlin':
        return 'bg-violet-950/80 text-violet-300 border-violet-700/50';
      case 'yaml':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/50';
      case 'xml':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50';
      case 'properties':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Module Filter bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files or modules (e.g. Sora, PTY, Git)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setSelectedModuleFilter(mod.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedModuleFilter === mod.id
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {mod.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Codebase Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: File Tree */}
        <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-3 max-h-[640px] flex flex-col">
          <div className="px-2 py-2 border-b border-slate-800/80 flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-cyan-400" />
              Repository Files ({filteredFiles.length})
            </span>
            <span className="text-[11px] text-slate-500 font-mono">10 Modules</span>
          </div>

          <div className="overflow-y-auto space-y-1 pr-1">
            {filteredFiles.map((file) => {
              const isSelected = file.path === selectedFilePath;
              return (
                <button
                  key={file.path}
                  onClick={() => {
                    setSelectedFilePath(file.path);
                    setIsEditing(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 group ${
                    isSelected
                      ? 'bg-slate-800 border border-cyan-500/40 text-white shadow-sm'
                      : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <FileCode className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span className="font-mono font-medium truncate text-slate-200 text-[11.5px]">
                        {file.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 pl-5 font-mono">
                      {file.path}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${getLanguageBadgeColor(
                      file.language
                    )}`}
                  >
                    {file.language}
                  </span>
                </button>
              );
            })}

            {filteredFiles.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs">
                No files found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Viewer / Editor */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col max-h-[640px]">
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-cyan-400 truncate">
                {currentFile?.path}
              </span>
              {currentFile?.module && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                  {currentFile.module}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Description banner if present */}
          {currentFile?.description && (
            <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/60 text-xs text-slate-400">
              💡 {currentFile.description}
            </div>
          )}

          {/* Code Area */}
          <div className="p-4 flex-1 overflow-y-auto bg-slate-950/90 font-mono text-xs text-slate-300">
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full min-h-[460px] bg-transparent text-slate-200 font-mono text-xs focus:outline-none resize-none"
                spellCheck={false}
              />
            ) : (
              <pre className="whitespace-pre leading-relaxed font-mono selection:bg-cyan-900 selection:text-white">
                {currentFile?.content}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
