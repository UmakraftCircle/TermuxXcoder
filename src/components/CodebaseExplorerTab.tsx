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
  Plus,
  Workflow,
  GitBranch,
  FolderTree,
  Cpu,
  Bug,
  Sparkles,
  Box
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
  // Hide all files related to the :app module so only core modular libraries are shown
  const nonAppFiles = files.filter(
    (file) => file.module !== 'app' && !file.path.startsWith('app/')
  );

  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    nonAppFiles[0]?.path || files[0]?.path || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const currentFile =
    nonAppFiles.find((f) => f.path === selectedFilePath) ||
    files.find((f) => f.path === selectedFilePath) ||
    nonAppFiles[0];

  const modules = [
    { id: 'all', label: 'All Modules', icon: Layers },
    { id: 'workflow', label: 'Workflows', icon: Workflow },
    { id: 'editor', label: 'Sora Editor', icon: Code2 },
    { id: 'terminal', label: 'PTY Terminal', icon: Terminal },
    { id: 'git', label: 'JGit', icon: GitBranch },
    { id: 'filesystem', label: 'Filesystem', icon: FolderTree },
    { id: 'lsp', label: 'LSP Core', icon: Cpu },
    { id: 'debugger', label: 'Debugger', icon: Bug },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles },
    { id: 'common', label: 'Common', icon: Box }
  ];

  const filteredFiles = nonAppFiles.filter((file) => {
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
        return 'bg-[#bc8cff]/15 text-[#bc8cff] border-[#bc8cff]/30';
      case 'yaml':
        return 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/30';
      case 'xml':
        return 'bg-[#3fb950]/15 text-[#3fb950] border-[#3fb950]/30';
      case 'properties':
        return 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30';
      default:
        return 'bg-[#21262d] text-[#8b949e] border-[#30363d]';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Module Filter Bento Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modular libraries & workflows..."
            className="w-full pl-9 pr-4 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff] transition-colors"
          />
        </div>

        {/* Module Filter Buttons with Icon and Name */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {modules.map((mod) => {
            const ModIcon = mod.icon;
            const isSelected = selectedModuleFilter === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setSelectedModuleFilter(mod.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border min-h-[40px] ${
                  isSelected
                    ? 'bg-[#1f6feb] text-white border-[#388bfd] shadow-sm'
                    : 'bg-[#161b22] text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] border-[#30363d]'
                }`}
              >
                <ModIcon className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-[#58a6ff]'}`} />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Bento Codebase Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Bento File Tree with Icon + Name List Buttons */}
        <div className="lg:col-span-4 bg-[#161b22] border border-[#30363d] rounded-2xl p-3 max-h-[640px] flex flex-col shadow-sm">
          <div className="px-2 py-2 border-b border-[#30363d] flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#f0f6fc] flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#58a6ff]" />
              Modular Files ({filteredFiles.length})
            </span>
            <span className="text-[10px] text-[#3fb950] font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 border border-[#3fb950]/30">
              Core Libs Only
            </span>
          </div>

          <div className="overflow-y-auto space-y-1.5 pr-1">
            {filteredFiles.map((file) => {
              const isSelected = file.path === selectedFilePath;
              return (
                <button
                  key={file.path}
                  onClick={() => {
                    setSelectedFilePath(file.path);
                    setIsEditing(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2.5 group border min-h-[44px] ${
                    isSelected
                      ? 'bg-[#21262d] border-[#58a6ff] text-[#f0f6fc] shadow-md shadow-[#1f6feb]/15 font-semibold'
                      : 'bg-[#0d1117]/60 border-[#30363d]/60 hover:bg-[#21262d] text-[#c9d1d9] hover:border-[#8b949e]/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected ? 'bg-[#1f6feb] text-white' : 'bg-[#161b22] text-[#58a6ff]'
                      }`}
                    >
                      <FileCode className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-[#f0f6fc] truncate">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-[#8b949e] font-mono truncate">
                        {file.path}
                      </div>
                    </div>
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
              <div className="text-center py-10 text-[#8b949e] text-xs">
                No files found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Bento Code Viewer / Editor */}
        <div className="lg:col-span-8 bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden flex flex-col max-h-[640px] shadow-sm">
          {/* Header */}
          <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-[#58a6ff] truncate">
                {currentFile?.path}
              </span>
              {currentFile?.module && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#c9d1d9] font-mono">
                  {currentFile.module}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 text-xs text-[#8b949e] hover:text-[#f0f6fc]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-xs bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg font-semibold border border-[#3fb950]/30 shadow-sm"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#c9d1d9] hover:text-[#f0f6fc] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg transition-colors"
                  >
                    <Edit3 className="h-3 w-3 text-[#58a6ff]" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#c9d1d9] hover:text-[#f0f6fc] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3 text-[#3fb950]" /> : <Copy className="h-3 w-3 text-[#8b949e]" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Description banner if present */}
          {currentFile?.description && (
            <div className="px-4 py-2 bg-[#0d1117] border-b border-[#30363d] text-xs text-[#8b949e]">
              💡 {currentFile.description}
            </div>
          )}

          {/* Code Viewer or Editor */}
          <div className="flex-1 overflow-auto p-4 bg-[#0d1117] font-mono text-xs text-[#c9d1d9]">
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full min-h-[480px] bg-transparent text-[#f0f6fc] font-mono text-xs focus:outline-none resize-none"
                spellCheck={false}
              />
            ) : (
              <pre className="whitespace-pre overflow-x-auto leading-relaxed font-mono selection:bg-[#1f6feb] selection:text-white">
                <code>{currentFile?.content || '// No file selected'}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
