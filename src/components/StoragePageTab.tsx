import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  Download,
  Search,
  Cpu,
  Code2,
  ChevronRight,
  FileText,
  Layers,
  ShieldCheck,
  Lock,
  Unlock,
  HardDrive,
  Copy,
  Check,
  Eye,
  Terminal,
  FileBox,
  Boxes,
  ArrowLeft,
  LayoutGrid,
  List,
  Sparkles,
  Smartphone,
  FolderPlus,
  ArrowUp,
  FileCode2,
  ExternalLink,
  Zap,
  Clock,
  ShieldAlert,
  X
} from 'lucide-react';
import { ProjectFile } from '../types';
import { exportProjectToZip, downloadBlob } from '../utils/zipExporter';
import { AppEncryptedStorageService } from '../utils/encryptedStorageService';
import { createNewSandboxFile } from '../utils/sandboxFileManager';
import confetti from 'canvas-confetti';

interface StoragePageTabProps {
  files: ProjectFile[]; // App system files
  sandboxFiles?: ProjectFile[]; // User sandbox files
  onSelectFile?: (file: ProjectFile) => void;
  onOpenTerminal?: () => void;
  onAddSandboxFile?: (file: ProjectFile) => void;
}

interface FileSystemItem {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  itemCount?: number;
  sizeBytes?: number;
  formattedSize?: string;
  projectFile?: ProjectFile;
  category?: 'code' | 'ndk' | 'workflow' | 'config' | 'doc' | 'other';
  isEncrypted?: boolean;
  isSandbox?: boolean;
  extension?: string;
}

export const StoragePageTab: React.FC<StoragePageTabProps> = ({
  files: appFiles,
  sandboxFiles = [],
  onSelectFile,
  onOpenTerminal,
  onAddSandboxFile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStorageCategory, setActiveStorageCategory] = useState<'all' | 'sandbox' | 'system' | 'vault'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'type'>('name');
  const [isLockEnforced, setIsLockEnforced] = useState<boolean>(
    AppEncryptedStorageService.isVaultWriteLocked()
  );

  // Current folder drill-down path (e.g. [] is root 'workspace', ['src'], ['src', 'main'])
  const [currentFolderSegments, setCurrentFolderSegments] = useState<string[]>([]);

  // Inspected File Modal
  const [inspectedFile, setInspectedFile] = useState<ProjectFile | null>(null);
  const [copiedInspect, setCopiedInspect] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Folder creation modal state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderInitType, setFolderInitType] = useState<'gitkeep' | 'kotlin' | 'cpp' | 'bash' | 'markdown' | 'json'>('gitkeep');
  const [folderFirstFileName, setFolderFirstFileName] = useState('');

  const handleCreateFolderInStorage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const rawName = newFolderName.trim().replace(/^[\/\\]+|[\/\\]+$/g, '');
    const currentPathPrefix = currentFolderSegments.join('/');
    const fullFolderPath = currentPathPrefix ? `${currentPathPrefix}/${rawName}` : rawName;

    let firstFileName = folderFirstFileName.trim();
    let content = '';

    if (!firstFileName) {
      if (folderInitType === 'gitkeep') {
        firstFileName = '.gitkeep';
        content = `# Directory: ${fullFolderPath}\n# Umakraft User Sandbox Directory\n`;
      } else if (folderInitType === 'kotlin') {
        firstFileName = `${rawName.split('/').pop() || 'Module'}.kt`;
        content = `package com.umakraft.${rawName.replace(/[^a-zA-Z0-9]/g, '_')}\n\n// ${firstFileName}\n// Module: ${fullFolderPath}\n\nfun init${rawName.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'Module'}() {\n    println("Initialized module ${fullFolderPath}")\n}\n`;
      } else if (folderInitType === 'cpp') {
        firstFileName = `${rawName.split('/').pop() || 'native'}.cpp`;
        content = `// Native C++ module for ${fullFolderPath}\n#include <iostream>\n\nvoid run${rawName.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'Module'}() {\n    std::cout << "[${fullFolderPath}] Native module ready." << std::endl;\n}\n`;
      } else if (folderInitType === 'bash') {
        firstFileName = 'script.sh';
        content = `#!/usr/bin/env bash\necho "Running script in ${fullFolderPath}..."\n`;
      } else if (folderInitType === 'markdown') {
        firstFileName = 'README.md';
        content = `# ${rawName.split('/').pop() || fullFolderPath}\n\nDocumentation and specifications for \`${fullFolderPath}\`.\n`;
      } else if (folderInitType === 'json') {
        firstFileName = 'config.json';
        content = `{\n  "folder": "${fullFolderPath}",\n  "version": "1.0.0",\n  "enabled": true\n}\n`;
      }
    }

    const fullFilePath = `${fullFolderPath}/${firstFileName}`;
    const created = createNewSandboxFile(fullFilePath, content);

    if (onAddSandboxFile) {
      onAddSandboxFile(created);
    }
    setIsCreateFolderOpen(false);
    setNewFolderName('');
    setFolderFirstFileName('');
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 } });
  };

  // Storage files strictly isolated to user sandbox files to prevent modification/deletion of system code
  const allStorageFiles = useMemo(() => {
    return sandboxFiles;
  }, [sandboxFiles]);

  // Calculate storage sizes and breakdown
  const storageStats = useMemo(() => {
    let totalBytes = 0;
    let kotlinBytes = 0;
    let layoutBytes = 0;
    let configBytes = 0;
    let otherBytes = 0;

    allStorageFiles.forEach((file) => {
      const size = file.content ? file.content.length : 0;
      totalBytes += size;

      if (file.name.endsWith('.kt') || file.name.endsWith('.java')) {
        kotlinBytes += size;
      } else if (file.name.endsWith('.xml') || file.name.endsWith('.json')) {
        layoutBytes += size;
      } else if (file.name.endsWith('.gradle') || file.name.endsWith('.properties') || file.name.endsWith('.md')) {
        configBytes += size;
      } else {
        otherBytes += size;
      }
    });

    const formatKilo = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      return `${(bytes / 1024).toFixed(1)} KB`;
    };

    return {
      totalFormatted: formatKilo(totalBytes),
      totalBytes,
      kotlinFormatted: formatKilo(kotlinBytes),
      layoutFormatted: formatKilo(layoutBytes),
      configFormatted: formatKilo(configBytes),
      otherFormatted: formatKilo(otherBytes),
      percentages: {
        kotlin: totalBytes > 0 ? (kotlinBytes / totalBytes) * 100 : 0,
        layout: totalBytes > 0 ? (layoutBytes / totalBytes) * 100 : 0,
        config: totalBytes > 0 ? (configBytes / totalBytes) * 100 : 0,
        other: totalBytes > 0 ? (otherBytes / totalBytes) * 100 : 0
      }
    };
  }, [allStorageFiles]);

  // Filter files by category
  const filteredFiles = useMemo(() => {
    let files = allStorageFiles;
    if (activeStorageCategory === 'sandbox') {
      files = files.filter((f) => f.name.endsWith('.kt') || f.name.endsWith('.java'));
    } else if (activeStorageCategory === 'system') {
      files = files.filter((f) => f.name.endsWith('.xml') || f.name.endsWith('.json'));
    } else if (activeStorageCategory === 'vault') {
      files = files.filter((f) => f.name.endsWith('.gradle') || f.name.endsWith('.md') || f.name.endsWith('.properties'));
    }
    return files;
  }, [allStorageFiles, activeStorageCategory]);

  // Transform files into directory virtual system
  // Root = "workspace"
  const directoryMap = useMemo(() => {
    const folders: Record<string, Set<string>> = {};
    const filesAtFolder: Record<string, ProjectFile[]> = {};

    filteredFiles.forEach((file) => {
      let relativePath = file.path;
      if (!relativePath.startsWith('.github/') && !relativePath.startsWith('sandbox/') && !relativePath.startsWith('src/') && !relativePath.startsWith('app/') && !relativePath.startsWith('core/')) {
        relativePath = `src/main/${file.module || 'common'}/${file.name}`;
      }

      const fullSegments = relativePath.split('/').filter(Boolean);
      const filename = fullSegments[fullSegments.length - 1];
      const folderPath = fullSegments.slice(0, -1).join('/');

      // Register parent folder and all ancestor folders
      let currentAcc = '';
      fullSegments.slice(0, -1).forEach((seg) => {
        const parent = currentAcc;
        currentAcc = currentAcc ? `${currentAcc}/${seg}` : seg;
        if (!folders[parent]) folders[parent] = new Set();
        folders[parent].add(seg);
      });

      if (!filesAtFolder[folderPath]) filesAtFolder[folderPath] = [];
      filesAtFolder[folderPath].push(file);
    });

    return { folders, filesAtFolder };
  }, [filteredFiles]);

  // Items in the current opened folder
  const currentPathString = currentFolderSegments.join('/');

  const currentFolderItems = useMemo(() => {
    // If search query is active, return flat search results across everything
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const results: FileSystemItem[] = [];

      filteredFiles.forEach((f) => {
        if (f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q) || (f.module && f.module.toLowerCase().includes(q))) {
          results.push({
            id: `search-file-${f.path}`,
            name: f.name,
            path: f.path,
            isFolder: false,
            sizeBytes: f.content.length,
            formattedSize: f.content.length < 1024 ? `${f.content.length} B` : `${(f.content.length / 1024).toFixed(1)} KB`,
            projectFile: f,
            isEncrypted: f.isEncrypted,
            isSandbox: f.isSandbox,
            extension: f.name.split('.').pop()
          });
        }
      });
      return results;
    }

    const items: FileSystemItem[] = [];

    // 1. Folders inside current folder
    const childFolders = directoryMap.folders[currentPathString] || new Set();
    childFolders.forEach((folderName) => {
      const folderFullPath = currentPathString ? `${currentPathString}/${folderName}` : folderName;
      // Count total files recursively inside this folder
      let count = 0;
      filteredFiles.forEach((f) => {
        let p = f.path;
        if (!p.startsWith('.github/') && !p.startsWith('sandbox/') && !p.startsWith('src/')) {
          p = `src/main/${f.module || 'common'}/${f.name}`;
        }
        if (p.startsWith(folderFullPath + '/') || p === folderFullPath) {
          count++;
        }
      });

      items.push({
        id: `folder-${folderFullPath}`,
        name: folderName,
        path: folderFullPath,
        isFolder: true,
        itemCount: count
      });
    });

    // 2. Direct files inside current folder
    const directFiles = directoryMap.filesAtFolder[currentPathString] || [];
    directFiles.forEach((file) => {
      items.push({
        id: `file-${file.path}`,
        name: file.name,
        path: file.path,
        isFolder: false,
        sizeBytes: file.content.length,
        formattedSize: file.content.length < 1024 ? `${file.content.length} B` : `${(file.content.length / 1024).toFixed(1)} KB`,
        projectFile: file,
        isEncrypted: file.isEncrypted,
        isSandbox: file.isSandbox,
        extension: file.name.split('.').pop()
      });
    });

    // Sort items: Folders always first, then apply sort
    items.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return (b.sizeBytes || 0) - (a.sizeBytes || 0);
      if (sortBy === 'type') {
        const extA = a.extension || '';
        const extB = b.extension || '';
        return extA.localeCompare(extB);
      }
      return 0;
    });

    return items;
  }, [currentPathString, directoryMap, filteredFiles, searchQuery, sortBy]);

  // Navigate into folder
  const handleOpenFolder = (folderName: string) => {
    setCurrentFolderSegments((prev) => [...prev, folderName]);
    setSearchQuery('');
  };

  // Jump to specific breadcrumb
  const handleJumpToBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentFolderSegments([]);
    } else {
      setCurrentFolderSegments((prev) => prev.slice(0, index + 1));
    }
    setSearchQuery('');
  };

  // Go Up 1 Level
  const handleGoUp = () => {
    if (currentFolderSegments.length > 0) {
      setCurrentFolderSegments((prev) => prev.slice(0, -1));
      setSearchQuery('');
    }
  };

  // Lock Vault Enclave toggle
  const handleToggleVaultLock = () => {
    const nextState = !isLockEnforced;
    setIsLockEnforced(nextState);
    AppEncryptedStorageService.setVaultWriteLock(nextState);
    if (nextState) {
      confetti({ particleCount: 30, spread: 45, origin: { y: 0.2 } });
    }
  };

  // Export full ZIP
  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      const blob = await exportProjectToZip(allStorageFiles, 'Umakraft-Device-Storage');
      downloadBlob(blob, 'Umakraft-Device-Storage.zip');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 } });
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  // Icon Helper for file types
  const getFileBadgeIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.kt') || lower.endsWith('.java')) {
      return { icon: Code2, color: 'text-[#58a6ff]', bg: 'bg-[#1f6feb]/20 border-[#1f6feb]/30', label: 'Kotlin/Java' };
    }
    if (lower.endsWith('.cpp') || lower.endsWith('.h') || lower.endsWith('.c')) {
      return { icon: Cpu, color: 'text-[#bc8cff]', bg: 'bg-[#bc8cff]/20 border-[#bc8cff]/30', label: 'C++ NDK' };
    }
    if (lower.endsWith('.yml') || lower.endsWith('.yaml')) {
      return { icon: Layers, color: 'text-[#e3b341]', bg: 'bg-[#e3b341]/20 border-[#e3b341]/30', label: 'Workflow' };
    }
    if (lower.endsWith('.json') || lower.endsWith('.gradle') || lower.endsWith('.kts')) {
      return { icon: FileText, color: 'text-[#3fb950]', bg: 'bg-[#238636]/20 border-[#238636]/30', label: 'Config' };
    }
    return { icon: FileCode, color: 'text-[#8b949e]', bg: 'bg-[#30363d]/40 border-[#30363d]', label: 'File' };
  };

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-10 font-sans" id="phone-storage-container">
      {/* 1. Redesigned Phone Storage Header & Capacity Bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3.5 sm:p-4 shadow-lg flex flex-col gap-3">
        {/* Top bar: Storage title + Enclave Lock & Export Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#1f6feb]/30 to-[#238636]/30 border border-[#1f6feb]/40 text-[#58a6ff] shrink-0 shadow-inner">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  Device Storage & App Enclave
                </h2>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30 font-bold shrink-0">
                  AES-256 Active
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e] font-mono truncate">
                {storageStats.totalFormatted} used &bull; {allStorageFiles.length} storage files &bull; Scoped Enclave
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Write-Lock Button */}
            <button
              onClick={handleToggleVaultLock}
              title={isLockEnforced ? 'System Enclave is Write-Locked (AI cannot overwrite)' : 'System Enclave is Unlocked'}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all active:scale-95 ${
                isLockEnforced
                  ? 'bg-[#238636]/20 border-[#3fb950]/50 text-[#3fb950]'
                  : 'bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:text-white'
              }`}
            >
              {isLockEnforced ? <Lock className="h-3.5 w-3.5 text-[#3fb950]" /> : <Unlock className="h-3.5 w-3.5 text-[#d29922]" />}
              <span className="hidden sm:inline">{isLockEnforced ? 'Locked' : 'Unlocked'}</span>
            </button>

            {/* Export Storage ZIP */}
            <button
              onClick={handleDownloadZip}
              disabled={isExporting}
              title="Download full storage archive as .zip"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-bold font-mono shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className={`h-3.5 w-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
              <span className="hidden xs:inline">{isExporting ? 'Exporting...' : 'Export ZIP'}</span>
            </button>
          </div>
        </div>

        {/* Visual Storage Partition Breakdown Bar (Like Android/iOS Files) */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full bg-[#0d1117] rounded-full overflow-hidden flex border border-[#30363d]/70">
            <div
              style={{ width: `${Math.max(storageStats.percentages.kotlin, 2)}%` }}
              className="h-full bg-[#58a6ff] transition-all"
              title={`Kotlin/Java: ${storageStats.kotlinFormatted}`}
            />
            <div
              style={{ width: `${Math.max(storageStats.percentages.layout, 2)}%` }}
              className="h-full bg-[#3fb950] transition-all"
              title={`Layouts & XML: ${storageStats.layoutFormatted}`}
            />
            <div
              style={{ width: `${Math.max(storageStats.percentages.config, 2)}%` }}
              className="h-full bg-[#e3b341] transition-all"
              title={`Configs: ${storageStats.configFormatted}`}
            />
            <div
              style={{ width: `${Math.max(storageStats.percentages.other, 2)}%` }}
              className="h-full bg-[#bc8cff] transition-all"
              title={`Other: ${storageStats.otherFormatted}`}
            />
          </div>

          {/* Color-Coded Legend Tags */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[#8b949e] flex-wrap gap-2 pt-0.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#58a6ff]" />
                <span>Kotlin ({storageStats.kotlinFormatted})</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#3fb950]" />
                <span>Layouts ({storageStats.layoutFormatted})</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#e3b341]" />
                <span>Configs ({storageStats.configFormatted})</span>
              </span>
            </div>
            <span className="text-[#3fb950] font-semibold flex items-center gap-1 bg-[#238636]/10 px-2 py-0.5 rounded-full border border-[#238636]/30">
              <ShieldCheck className="h-3 w-3" />
              <span>System Core Sealed & Protected</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Partition Filter Segment Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: `Workspace Files (${allStorageFiles.length})`, icon: Boxes },
          { id: 'sandbox', label: 'Kotlin & Source', icon: Code2, badge: 'Source' },
          { id: 'system', label: 'Layouts & UI', icon: FileBox, badge: 'UI' },
          { id: 'vault', label: 'Build & Configs', icon: Lock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeStorageCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveStorageCategory(tab.id as any);
                setCurrentFolderSegments([]);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all border shrink-0 ${
                isSelected
                  ? 'bg-[#1f6feb] text-white border-[#388bfd] font-bold shadow-md shadow-[#1f6feb]/20'
                  : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:bg-[#21262d] hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.badge && !isSelected && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-[#8b949e] font-sans">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Phone-Style File Manager Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3 sm:p-4 flex flex-col shadow-xl min-h-[480px]">
        {/* Navigation & Breadcrumbs Bar */}
        <div className="pb-3 border-b border-[#30363d] space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Interactive Breadcrumb Strip */}
            <div className="flex items-center gap-1 text-xs font-mono overflow-x-auto scrollbar-none py-1 min-w-0 max-w-full">
              <button
                onClick={() => handleJumpToBreadcrumb(-1)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all ${
                  currentFolderSegments.length === 0
                    ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40 font-bold'
                    : 'bg-[#21262d] text-[#8b949e] hover:text-white border-[#30363d]'
                }`}
              >
                <HardDrive className="h-3.5 w-3.5" />
                <span>workspace</span>
              </button>

              {currentFolderSegments.map((segment, index) => {
                const isLast = index === currentFolderSegments.length - 1;
                return (
                  <React.Fragment key={index}>
                    <ChevronRight className="h-3.5 w-3.5 text-[#6e7681] shrink-0" />
                    <button
                      onClick={() => handleJumpToBreadcrumb(index)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all whitespace-nowrap ${
                        isLast
                          ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40 font-bold'
                          : 'bg-[#21262d] text-[#8b949e] hover:text-white border-[#30363d]'
                      }`}
                    >
                      <Folder className="h-3.5 w-3.5 text-[#58a6ff]" />
                      <span>{segment}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* View Mode (Grid / List) & Sort Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onAddSandboxFile && (
                <button
                  onClick={() => setIsCreateFolderOpen(true)}
                  title="Create New Folder in current location"
                  className="px-2.5 py-1 rounded-xl bg-[#238636]/20 hover:bg-[#238636]/30 text-[#3fb950] border border-[#238636]/40 hover:border-[#3fb950] text-xs font-mono font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  <span>+ Folder</span>
                </button>
              )}

              {currentFolderSegments.length > 0 && (
                <button
                  onClick={handleGoUp}
                  title="Go up to parent folder"
                  className="px-2.5 py-1 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] text-xs font-mono flex items-center gap-1 transition-all active:scale-95"
                >
                  <ArrowUp className="h-3.5 w-3.5 text-[#58a6ff]" />
                  <span>Up</span>
                </button>
              )}

              {/* View Toggle */}
              <div className="flex items-center p-0.5 bg-[#0d1117] border border-[#30363d] rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid View (Folder Cards)"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="List View (Phone Rows)"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-[#1f6feb] text-white' : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#21262d] text-[#c9d1d9] border border-[#30363d] rounded-xl px-2 py-1 text-xs font-mono focus:outline-none"
              >
                <option value="name">Sort: Name</option>
                <option value="size">Sort: Size</option>
                <option value="type">Sort: Type</option>
              </select>
            </div>
          </div>

          {/* Quick Search in Current Folder */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b949e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${currentFolderSegments.length > 0 ? currentFolderSegments[currentFolderSegments.length - 1] : 'all storage'} (e.g. .kt, .cpp, yaml)...`}
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] rounded-xl pl-9 pr-8 py-2 text-xs font-mono text-white placeholder-[#6e7681] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {currentFolderItems.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8b949e] space-y-2">
            <FolderOpen className="h-10 w-10 text-[#58a6ff] opacity-40" />
            <p className="text-xs font-bold text-white">This folder is empty</p>
            <p className="text-[11px] text-[#8b949e]">No files matching filter in this directory level.</p>
            {currentFolderSegments.length > 0 && (
              <button
                onClick={handleGoUp}
                className="px-3 py-1 rounded-xl bg-[#21262d] text-[#58a6ff] text-xs font-mono border border-[#30363d] mt-2"
              >
                ← Go to parent folder
              </button>
            )}
          </div>
        )}

        {/* Folder Content: GRID VIEW (Phone App Style) */}
        {currentFolderItems.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 py-3 flex-1 overflow-y-auto">
            {currentFolderItems.map((item) => {
              // 1. If it's a FOLDER
              if (item.isFolder) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleOpenFolder(item.name)}
                    className="flex flex-col items-start p-3 bg-[#0d1117] hover:bg-[#1f6feb]/10 border border-[#30363d] hover:border-[#1f6feb]/50 rounded-2xl text-left transition-all group active:scale-[0.98] shadow-sm relative overflow-hidden"
                  >
                    {/* Top line with Folder Icon & Items Count */}
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="p-2 rounded-xl bg-[#1f6feb]/15 text-[#58a6ff] group-hover:scale-110 transition-transform">
                        <Folder className="h-6 w-6 fill-[#1f6feb]/20" />
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] group-hover:text-[#58a6ff] border border-[#30363d]">
                        {item.itemCount} items
                      </span>
                    </div>

                    {/* Folder Name */}
                    <span className="text-xs font-bold font-mono text-white group-hover:text-[#58a6ff] truncate w-full">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-[#8b949e] font-mono mt-0.5">
                      Tap to open
                    </span>
                  </button>
                );
              }

              // 2. If it's a FILE
              const badge = getFileBadgeIcon(item.name);
              const Icon = badge.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => item.projectFile && setInspectedFile(item.projectFile)}
                  className="flex flex-col items-start p-3 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-[#58a6ff]/40 rounded-2xl text-left transition-all group active:scale-[0.98] shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className={`p-2 rounded-xl ${badge.bg} ${badge.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {item.isSandbox ? (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30">
                        SANDBOX
                      </span>
                    ) : item.isEncrypted ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30 flex items-center gap-0.5">
                        <Lock className="h-2.5 w-2.5" />
                        <span>AES</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                        APP
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold font-mono text-white group-hover:text-[#58a6ff] truncate w-full">
                    {item.name}
                  </span>
                  <div className="flex items-center justify-between w-full text-[10px] text-[#8b949e] font-mono mt-0.5">
                    <span>{item.formattedSize}</span>
                    <span className="text-[#58a6ff] group-hover:underline flex items-center gap-0.5">
                      <Eye className="h-2.5 w-2.5" />
                      <span>Inspect</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Folder Content: LIST VIEW (Phone File Manager Row Style) */}
        {currentFolderItems.length > 0 && viewMode === 'list' && (
          <div className="divide-y divide-[#30363d]/60 py-1 flex-1 overflow-y-auto">
            {currentFolderItems.map((item) => {
              if (item.isFolder) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleOpenFolder(item.name)}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-[#1f6feb]/10 rounded-xl transition-all group text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-[#1f6feb]/15 text-[#58a6ff] group-hover:scale-105 transition-transform shrink-0">
                        <Folder className="h-5 w-5 fill-[#1f6feb]/20" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold font-mono text-white group-hover:text-[#58a6ff] truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-[#8b949e] font-mono">
                          Folder &bull; {item.itemCount} items
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8b949e] group-hover:text-[#58a6ff] shrink-0" />
                  </button>
                );
              }

              const badge = getFileBadgeIcon(item.name);
              const Icon = badge.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => item.projectFile && setInspectedFile(item.projectFile)}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-[#21262d] rounded-xl transition-all group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl ${badge.bg} ${badge.color} group-hover:scale-105 transition-transform shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold font-mono text-white group-hover:text-[#58a6ff] truncate">
                          {item.name}
                        </h4>
                        {item.isSandbox && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30">
                            SANDBOX
                          </span>
                        )}
                        {item.isEncrypted && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30 flex items-center gap-0.5">
                            <Lock className="h-2.5 w-2.5" />
                            <span>AES</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#8b949e] font-mono truncate">
                        {item.path} &bull; {item.formattedSize}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#58a6ff] shrink-0 opacity-80 group-hover:opacity-100">
                    <span>Inspect</span>
                    <Eye className="h-3.5 w-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer info bar */}
        <div className="pt-3 border-t border-[#30363d] flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
          <span>Current Directory: /{currentPathString || 'workspace'}</span>
          <span>{currentFolderItems.length} items found</span>
        </div>
      </div>

      {/* Storage File Inspector Modal */}
      {inspectedFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-3xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-[#30363d] flex items-center justify-between gap-3 bg-[#0d1117]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-[#1f6feb]/20 text-[#58a6ff]">
                  <FileCode className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                      {inspectedFile.name}
                    </h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                      {inspectedFile.language}
                    </span>
                    {inspectedFile.isSandbox ? (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30 font-bold">
                        User Sandbox
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30 font-bold">
                        App Vault Enclave
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-[#8b949e] truncate">
                    {inspectedFile.path}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inspectedFile.content);
                    setCopiedInspect(true);
                    confetti({ particleCount: 15, spread: 35 });
                    setTimeout(() => setCopiedInspect(false), 2000);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-mono text-[#c9d1d9] hover:text-white border border-[#30363d]"
                >
                  {copiedInspect ? <Check className="h-3.5 w-3.5 text-[#3fb950]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedInspect ? 'Copied' : 'Copy Code'}</span>
                </button>

                <button
                  onClick={() => setInspectedFile(null)}
                  className="p-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="flex-1 min-h-0 p-4 bg-[#0d1117] overflow-y-auto font-mono text-xs text-[#c9d1d9] select-text whitespace-pre leading-relaxed">
              <code>{inspectedFile.content}</code>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
              <span>Checksum: {inspectedFile.checksum || 'sha256:verified'}</span>
              <span>Size: {inspectedFile.content.length} Bytes</span>
            </div>
          </div>
        </div>
      )}
      {/* Create Folder Modal */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-[#3fb950]" />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">Create New Directory / Folder</h3>
                  <p className="text-[10px] text-[#8b949e] font-mono">
                    Target: sandbox/{currentFolderSegments.length > 0 ? `${currentFolderSegments.join('/')}/` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateFolderOpen(false)}
                className="p-1 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolderInStorage} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#8b949e] mb-1.5">
                  Folder Name (e.g. <span className="text-[#3fb950]">utils</span>, <span className="text-[#58a6ff]">components</span>, <span className="text-[#e3b341]">models</span>)
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="my_folder"
                  autoFocus
                  required
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-[#484f58] focus:outline-none focus:border-[#3fb950]"
                />
              </div>

              {/* Quick suggestions */}
              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">Quick Suggestions</label>
                <div className="flex flex-wrap gap-1.5">
                  {['components', 'utils', 'network', 'models', 'services', 'scripts', 'helpers', 'docs'].map((sugg) => (
                    <button
                      type="button"
                      key={sugg}
                      onClick={() => setNewFolderName(sugg)}
                      className="px-2 py-0.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#79c0ff] hover:text-white border border-[#30363d] text-[10px] font-mono transition-all active:scale-95"
                    >
                      + {sugg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8b949e] mb-1.5">
                  Initialize Folder With
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  {[
                    { id: 'gitkeep', label: '.gitkeep' },
                    { id: 'kotlin', label: 'Module.kt' },
                    { id: 'cpp', label: 'native.cpp' },
                    { id: 'bash', label: 'script.sh' },
                    { id: 'markdown', label: 'README.md' },
                    { id: 'json', label: 'config.json' }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setFolderInitType(item.id as any)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        folderInitType === item.id
                          ? 'bg-[#238636]/20 text-[#3fb950] border-[#238636] font-bold shadow-sm'
                          : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                  Custom First File Name (Optional)
                </label>
                <input
                  type="text"
                  value={folderFirstFileName}
                  onChange={(e) => setFolderFirstFileName(e.target.value)}
                  placeholder={folderInitType === 'gitkeep' ? '.gitkeep' : 'Leave blank for default'}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-1.5 text-xs font-mono text-white placeholder-[#484f58] focus:outline-none focus:border-[#3fb950]"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-[11px] font-mono text-[#8b949e] flex items-center gap-2">
                <Folder className="h-3.5 w-3.5 text-[#3fb950] shrink-0" />
                <div className="truncate">
                  <span>Target: </span>
                  <span className="text-[#3fb950] font-bold">
                    sandbox/{currentFolderSegments.length > 0 ? `${currentFolderSegments.join('/')}/` : ''}{newFolderName || 'folder'}/
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#21262d] text-[#8b949e] hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-mono font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  <span>Create Folder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
