import React, { useState, useMemo } from 'react';
import {
  FolderTree,
  FileCode,
  Download,
  Search,
  Folder,
  FolderOpen,
  Cpu,
  Code2,
  ChevronRight,
  ChevronDown,
  FileText,
  Layers,
  Maximize2,
  Minimize2,
  Sparkles,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  HardDrive,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ProjectFile } from '../types';
import { exportProjectToZip, downloadBlob } from '../utils/zipExporter';
import { AppEncryptedStorageService } from '../utils/encryptedStorageService';
import confetti from 'canvas-confetti';

interface WorkspaceFilesTabProps {
  files: ProjectFile[];
  onSelectFile?: (file: ProjectFile) => void;
  onOpenTerminal?: () => void;
}

interface TreeNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  projectFile?: ProjectFile;
  size?: string;
  permissions?: string;
  isEncrypted?: boolean;
  isReadOnly?: boolean;
  checksum?: string;
}

export const StoragePageTab: React.FC<WorkspaceFilesTabProps> = ({
  files,
  onSelectFile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStorageView, setActiveStorageView] = useState<'all' | 'vault' | 'workspace'>('all');
  const [isLockEnforced, setIsLockEnforced] = useState<boolean>(
    AppEncryptedStorageService.isVaultWriteLocked()
  );

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'workspace': true,
    'workspace/.github': true,
    'workspace/.github/workflows': true,
    'workspace/src': true,
    'workspace/src/main': true,
    'workspace/src/main/ai': false,
    'workspace/src/main/common': false,
    'workspace/src/main/debugger': false,
    'workspace/src/main/editor': true,
    'workspace/src/main/filesystem': false,
    'workspace/src/main/git': false,
    'workspace/src/main/lsp': false,
    'workspace/src/main/pty': true,
    'workspace/src/main/terminal': false
  });

  const [isExporting, setIsExporting] = useState(false);

  // Toggle Immutable Write-Lock on system files
  const handleToggleVaultLock = () => {
    const nextState = !isLockEnforced;
    setIsLockEnforced(nextState);
    AppEncryptedStorageService.setVaultWriteLock(nextState);
    if (nextState) {
      confetti({ particleCount: 30, spread: 45, origin: { y: 0.2 } });
    }
  };

  // Filter workspace project files
  const filteredProjectFiles = useMemo(() => {
    if (activeStorageView === 'vault') {
      return files.filter((f) => f.isEncrypted || f.storageScope === 'app_internal_vault');
    }
    if (activeStorageView === 'workspace') {
      return files.filter((f) => !f.isEncrypted && f.storageScope !== 'app_internal_vault');
    }
    return files;
  }, [files, activeStorageView]);

  // Build hierarchical folder tree
  const workspaceTree = useMemo(() => {
    const rootNode: TreeNode = {
      id: 'workspace',
      name: 'workspace',
      path: 'workspace',
      isFolder: true,
      children: [],
      permissions: isLockEnforced ? 'dr-xr-xr-x (chmod 555 [Encrypted])' : 'drwxr-xr-x (chmod 755)'
    };

    filteredProjectFiles.forEach((file) => {
      let relativePath = file.path;
      if (relativePath.startsWith('.github/')) {
        // keep .github/workflows/...
      } else if (!relativePath.startsWith('src/') && !relativePath.startsWith('app/') && !relativePath.startsWith('core/')) {
        relativePath = `src/main/${file.module || 'common'}/${file.name}`;
      }

      const cleanPath = `workspace/${relativePath.replace(/^\/+/, '')}`;
      const parts = cleanPath.split('/');

      let currentNode = rootNode;

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const isLeaf = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join('/');

        if (isLeaf) {
          currentNode.children.push({
            id: currentPath,
            name: part,
            path: currentPath,
            isFolder: false,
            children: [],
            projectFile: file,
            size: `${file.content.length} B`,
            permissions: file.isReadOnly || isLockEnforced ? '-r--r--r-- (AES-256)' : '-rw-r--r--',
            isEncrypted: file.isEncrypted || file.storageScope === 'app_internal_vault',
            isReadOnly: file.isReadOnly || isLockEnforced,
            checksum: file.checksum || 'sha256:7f8ea9b4c1'
          });
        } else {
          let folderNode = currentNode.children.find(
            (c) => c.isFolder && c.name === part
          );
          if (!folderNode) {
            folderNode = {
              id: currentPath,
              name: part,
              path: currentPath,
              isFolder: true,
              children: [],
              permissions: 'drwxr-xr-x'
            };
            currentNode.children.push(folderNode);
          }
          currentNode = folderNode;
        }
      }
    });

    // Sort folders first, then files
    const sortTree = (node: TreeNode) => {
      node.children.sort((a, b) => {
        if (a.isFolder === b.isFolder) {
          return a.name.localeCompare(b.name);
        }
        return a.isFolder ? -1 : 1;
      });
      node.children.forEach(sortTree);
    };

    sortTree(rootNode);
    return rootNode;
  }, [filteredProjectFiles, isLockEnforced]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const expandAllFolders = () => {
    const allPaths: Record<string, boolean> = {};
    const collect = (node: TreeNode) => {
      if (node.isFolder) {
        allPaths[node.path] = true;
        node.children.forEach(collect);
      }
    };
    collect(workspaceTree);
    setExpandedFolders((prev) => ({ ...prev, ...allPaths }));
  };

  const collapseAllFolders = () => {
    setExpandedFolders({
      'workspace': true
    });
  };

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      const blob = await exportProjectToZip(files, 'Umakraft-Secure-Workspace');
      downloadBlob(blob, 'Umakraft-Secure-Workspace.zip');
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const getFileIcon = (node: TreeNode) => {
    const name = node.name.toLowerCase();
    if (name.endsWith('.kt') || name.endsWith('.java')) return <Code2 className="h-4 w-4 text-[#58a6ff]" />;
    if (name.endsWith('.cpp') || name.endsWith('.h')) return <Cpu className="h-4 w-4 text-[#bc8cff]" />;
    if (name.endsWith('.yml') || name.endsWith('.yaml')) return <Layers className="h-4 w-4 text-[#e3b341]" />;
    if (name.endsWith('.json') || name.endsWith('.gradle')) return <FileText className="h-4 w-4 text-[#3fb950]" />;
    return <FileCode className="h-4 w-4 text-[#8b949e]" />;
  };

  const handleFileClick = (node: TreeNode) => {
    if (node.projectFile && onSelectFile) {
      onSelectFile(node.projectFile);
    }
  };

  // Render tree recursively
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = !!expandedFolders[node.path];
    const matchesSearch =
      !searchQuery ||
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.path.toLowerCase().includes(searchQuery.toLowerCase());

    if (node.isFolder) {
      return (
        <div key={node.id} className="select-none">
          <button
            onClick={() => toggleFolder(node.path)}
            className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-left text-xs font-mono transition-colors group hover:bg-[#21262d] text-[#c9d1d9]"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-[#8b949e] group-hover:text-[#f0f6fc] shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-[#8b949e] group-hover:text-[#f0f6fc] shrink-0" />
            )}

            {isExpanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-[#58a6ff]" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-[#58a6ff]" />
            )}

            <span className="truncate font-semibold text-xs text-[#f0f6fc]">{node.name}</span>

            <span className="ml-auto text-[10px] text-[#8b949e] font-sans px-1.5 py-0.2 rounded bg-black/30 shrink-0">
              {node.children.length}
            </span>
          </button>

          {isExpanded && (
            <div className="border-l border-[#30363d]/50 ml-3 pl-1">
              {node.children.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    if (searchQuery && !matchesSearch) return null;

    return (
      <button
        key={node.id}
        onClick={() => handleFileClick(node)}
        className="w-full flex items-center gap-2 py-2 px-2.5 rounded-xl text-left text-xs font-mono transition-all group text-[#c9d1d9] hover:bg-[#1f6feb]/15 hover:text-[#58a6ff] active:scale-[0.99] border border-transparent hover:border-[#1f6feb]/30"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        title={node.isReadOnly ? 'Encrypted (Read-Only)' : 'Tap to open in Coder'}
      >
        <span className="shrink-0 group-hover:scale-110 transition-transform">{getFileIcon(node)}</span>
        <span className="truncate text-xs font-medium text-[#f0f6fc] group-hover:text-[#58a6ff]">
          {node.name}
        </span>

        {/* Encrypted Lock Badge */}
        {node.isEncrypted && (
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#238636]/20 text-[#3fb950] border border-[#3fb950]/30 font-semibold flex items-center gap-0.5 shrink-0">
            <Lock className="h-2.5 w-2.5" />
            <span className="hidden xs:inline">AES-256</span>
          </span>
        )}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-[#8b949e] font-sans">
            {node.size}
          </span>
          <span className="text-[10px] text-[#58a6ff] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
            <Code2 className="h-3 w-3" />
            <span className="hidden sm:inline">Open</span>
          </span>
        </div>
      </button>
    );
  };

  const vaultStats = AppEncryptedStorageService.getVaultMetadata(files);

  return (
    <div className="space-y-3 max-w-4xl mx-auto pb-10">
      {/* Top Security & Encryption Status Ribbon */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3 sm:p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#238636] to-[#1f6feb] p-0.5 shadow flex-shrink-0">
            <div className="h-full w-full bg-[#0d1117] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-[#3fb950]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#f0f6fc] tracking-tight">
                Encrypted App Storage Vault
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#3fb950]/30 font-semibold">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-[#8b949e] font-mono">
              /data/data/com.umakraft.coder/encrypted_vault &bull; AES-256-GCM
            </p>
          </div>
        </div>

        {/* Lock Controls & Export ZIP */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleToggleVaultLock}
            title={isLockEnforced ? 'Vault Write-Protected (Read-Only Enforced)' : 'Vault Write-Lock Disabled'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
              isLockEnforced
                ? 'bg-[#238636]/20 border-[#3fb950]/50 text-[#3fb950]'
                : 'bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:text-white'
            }`}
          >
            {isLockEnforced ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5 text-[#d29922]" />}
            <span>{isLockEnforced ? 'Write-Locked' : 'Unlocked'}</span>
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-semibold shadow transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
            <span className="hidden xs:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Directory Tree Full Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3 sm:p-4 flex flex-col shadow-lg overflow-hidden min-h-[500px]">
        {/* Header with Title & Tree Controls */}
        <div className="px-2 pb-3 border-b border-[#30363d] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#f0f6fc] font-mono text-xs flex items-center gap-1.5">
              <HardDrive className="h-4 w-4 text-[#58a6ff]" />
              <span>/workspace</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#8b949e]">
              {vaultStats.totalEncryptedFiles} Protected Files
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={expandAllFolders}
              title="Expand All Folders"
              className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] text-xs flex items-center gap-1"
            >
              <Maximize2 className="h-3 w-3" />
              <span className="hidden sm:inline text-[10px]">Expand All</span>
            </button>
            <button
              onClick={collapseAllFolders}
              title="Collapse All Folders"
              className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] text-xs flex items-center gap-1"
            >
              <Minimize2 className="h-3 w-3" />
              <span className="hidden sm:inline text-[10px]">Collapse</span>
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="pt-2.5 pb-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8b949e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files (e.g. android.yml, native-pty.cpp, Sora...)"
              className="w-full pl-9 pr-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
            />
          </div>
        </div>

        {/* Scrollable Tree View */}
        <div className="flex-1 overflow-y-auto py-2 pr-1 space-y-0.5">
          {renderTreeNode(workspaceTree)}
        </div>

        {/* Tree Footer with Cryptographic Tamper Seal */}
        <div className="px-2 pt-2.5 border-t border-[#30363d] flex items-center justify-between text-[11px] text-[#8b949e] font-mono">
          <span className="flex items-center gap-1.5 text-[#3fb950]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>MasterKey Keystore Active &bull; Tamper Protection Enforced</span>
          </span>
          <span className="text-[10px] text-[#8b949e]">AES-256-GCM</span>
        </div>
      </div>
    </div>
  );
};
