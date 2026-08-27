import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Code2,
  FileCode,
  Check,
  Copy,
  Download,
  CheckCircle2,
  Edit3,
  X,
  Settings,
  Folder,
  FolderTree,
  Sliders,
  Bot,
  UploadCloud,
  FileArchive,
  FolderPlus,
  Plus,
  FilePlus2,
  HardDrive,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Replace,
  CaseSensitive,
  Clock,
  ShieldCheck,
  History,
  LayoutGrid,
  List,
  Eye,
  Trash2,
  Camera,
  ScanLine,
  Image as ImageIcon,
  BookOpen,
  Columns2,
  Rows,
  Maximize2,
  FileText,
  Zap,
  Wand2,
  AlignLeft,
  FileSearch,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import { ProjectFile, AiCopilotConfig, CopilotLayoutMode } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import confetti from 'canvas-confetti';
import { formatCode } from '../utils/codeFormatter';
import {
  getSavedAiConfig,
  saveAiConfig,
  requestAiAssist,
  AI_PROVIDERS,
  getIsUnrestrainedMode,
  setIsUnrestrainedMode
} from '../utils/aiCopilotService';
import { AiRagMemoryService } from '../utils/aiRagMemoryService';
import { AiProviderSettingsModal } from './AiProviderSettingsModal';
import { CameraCodeScannerModal } from './CameraCodeScannerModal';
import { MarkdownPreview } from './MarkdownPreview';
import { UmakraftAiCopilotPanel } from './UmakraftAiCopilotPanel';
import { WebDocsSearchModal } from './WebDocsSearchModal';
import { UndoRedoHistoryModal } from './UndoRedoHistoryModal';
import { sandboxUndoRedoManager } from '../utils/undoRedoManager';
import {
  parseUploadedFiles,
  parseZipArchive,
  parseZstdArchive,
  createNewSandboxFile
} from '../utils/sandboxFileManager';

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export interface FileVisualInfo {
  extLabel: string;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  typeDesc: string;
}

export function getFileVisualInfo(filename: string, language?: string): FileVisualInfo {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.kt') || lower.endsWith('.kts') || language === 'kotlin') {
    return {
      extLabel: 'KT',
      color: 'text-[#a371f7]',
      borderColor: 'border-[#a371f7]/40',
      bgColor: 'bg-[#a371f7]/15',
      textColor: 'text-[#d2a8ff]',
      typeDesc: 'Kotlin'
    };
  }
  if (lower.endsWith('.cpp') || lower.endsWith('.c') || lower.endsWith('.h') || lower.endsWith('.hpp') || lower.endsWith('.cc') || language === 'cpp') {
    return {
      extLabel: 'C++',
      color: 'text-[#58a6ff]',
      borderColor: 'border-[#58a6ff]/40',
      bgColor: 'bg-[#1f6feb]/15',
      textColor: 'text-[#79c0ff]',
      typeDesc: 'C++ NDK'
    };
  }
  if (lower.endsWith('.json') || language === 'json') {
    return {
      extLabel: '{ }',
      color: 'text-[#e3b341]',
      borderColor: 'border-[#e3b341]/40',
      bgColor: 'bg-[#e3b341]/15',
      textColor: 'text-[#f0e6c8]',
      typeDesc: 'JSON'
    };
  }
  if (lower.endsWith('.yaml') || lower.endsWith('.yml') || language === 'yaml') {
    return {
      extLabel: 'YML',
      color: 'text-[#ff7b72]',
      borderColor: 'border-[#ff7b72]/40',
      bgColor: 'bg-[#ff7b72]/15',
      textColor: 'text-[#ffa198]',
      typeDesc: 'YAML'
    };
  }
  if (lower.endsWith('.gradle') || lower.endsWith('.groovy') || language === 'groovy') {
    return {
      extLabel: 'GR',
      color: 'text-[#3fb950]',
      borderColor: 'border-[#3fb950]/40',
      bgColor: 'bg-[#238636]/15',
      textColor: 'text-[#7ee787]',
      typeDesc: 'Gradle'
    };
  }
  if (lower.endsWith('.sh') || lower.endsWith('.bash') || lower.endsWith('.zsh') || language === 'bash') {
    return {
      extLabel: '>_',
      color: 'text-[#39c5bb]',
      borderColor: 'border-[#39c5bb]/40',
      bgColor: 'bg-[#39c5bb]/15',
      textColor: 'text-[#56d4dd]',
      typeDesc: 'Shell Script'
    };
  }
  if (lower.endsWith('.xml') || language === 'xml') {
    return {
      extLabel: '< >',
      color: 'text-[#ffa657]',
      borderColor: 'border-[#ffa657]/40',
      bgColor: 'bg-[#ffa657]/15',
      textColor: 'text-[#ffc680]',
      typeDesc: 'XML Layout'
    };
  }
  if (lower.endsWith('.md') || lower.endsWith('.markdown') || language === 'markdown') {
    return {
      extLabel: 'MD',
      color: 'text-[#79c0ff]',
      borderColor: 'border-[#79c0ff]/40',
      bgColor: 'bg-[#79c0ff]/15',
      textColor: 'text-[#a5d6ff]',
      typeDesc: 'Markdown'
    };
  }
  return {
    extLabel: 'SRC',
    color: 'text-[#8b949e]',
    borderColor: 'border-[#30363d]',
    bgColor: 'bg-[#21262d]',
    textColor: 'text-[#c9d1d9]',
    typeDesc: 'Source File'
  };
}

interface UmakraftAiCoderProps {
  files: ProjectFile[]; // Sandbox files
  appFiles?: ProjectFile[]; // Internal App System files
  activeFilePath?: string;
  onUpdateFileContent: (path: string, newContent: string) => void;
  onAddSandboxFile?: (newFile: ProjectFile) => void;
  onAddMultipleSandboxFiles?: (newFiles: ProjectFile[]) => void;
  onDeleteSandboxFile?: (path: string) => void;
  onClearSandbox?: () => void;
  onLoadSampleSandbox?: () => void;
  onGoToStorage?: () => void;
  onOpenSettings: () => void;
  isAiModalOpen?: boolean;
  onCloseAiModal?: () => void;
  onOpenAiModal?: () => void;
  onSelectFile?: (file: ProjectFile) => void;
  onOpenGlobalSearch?: () => void;
  onRestoreFilesSnapshot?: (files: ProjectFile[], targetPath?: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  codeSnippet?: string;
  providerBadge?: string;
  timestamp: string;
}

// Workspace Scope: Isolated User Sandbox
export const UmakraftAiCoder: React.FC<UmakraftAiCoderProps> = ({
  files: sandboxFiles,
  appFiles = [],
  activeFilePath,
  onUpdateFileContent,
  onAddSandboxFile,
  onAddMultipleSandboxFiles,
  onDeleteSandboxFile,
  onLoadSampleSandbox,
  isAiModalOpen = false,
  onCloseAiModal,
  onOpenAiModal,
  onOpenGlobalSearch,
  onRestoreFilesSnapshot,
}) => {
  // Active Workspace Files strictly isolated to user sandbox files
  const activeFileList = sandboxFiles;

  const [selectedFilePath, setSelectedFilePath] = useState<string>(() => {
    if (activeFilePath) return activeFilePath;
    return sandboxFiles[0]?.path || '';
  });

  const [editorContent, setEditorContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeLine, setActiveLine] = useState<number>(1);

  // Undo/Redo and Sandbox Version Timeline History State
  const [historyState, setHistoryState] = useState(() => sandboxUndoRedoManager.getState());
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    return sandboxUndoRedoManager.subscribe((state) => {
      setHistoryState(state);
    });
  }, []);

  // Initialize history baseline on mount if not yet initialized
  useEffect(() => {
    if (sandboxFiles && sandboxFiles.length > 0) {
      sandboxUndoRedoManager.init(sandboxFiles, activeFilePath || selectedFilePath);
    }
  }, []);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Search & Replace state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isMatchCase, setIsMatchCase] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Drag & Drop / Import state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [, setIsImporting] = useState(false);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);

  // New File & Folder Creation Modal state
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<'file' | 'folder'>('file');
  const [newFileName, setNewFileName] = useState('');
  const [newFileFolder, setNewFileFolder] = useState('');
  const [newFileTemplate, setNewFileTemplate] = useState<'kotlin' | 'cpp' | 'bash' | 'markdown' | 'json' | 'xml'>('kotlin');

  // New Folder Creation state
  const [newFolderName, setNewFolderName] = useState('');
  const [parentFolder, setParentFolder] = useState('');
  const [folderInitType, setFolderInitType] = useState<'gitkeep' | 'kotlin' | 'cpp' | 'bash' | 'markdown' | 'json'>('gitkeep');
  const [folderFirstFileName, setFolderFirstFileName] = useState('');

  // Discover existing folder hierarchy from sandbox files
  const existingFolders = useMemo(() => {
    const folders = new Set<string>();
    sandboxFiles.forEach((file) => {
      const cleanPath = file.path.replace(/^sandbox\//, '');
      const parts = cleanPath.split('/');
      if (parts.length > 1) {
        let acc = '';
        for (let i = 0; i < parts.length - 1; i++) {
          acc = acc ? `${acc}/${parts[i]}` : parts[i];
          folders.add(acc);
        }
      }
    });
    return Array.from(folders).sort();
  }, [sandboxFiles]);

  // AI Copilot Provider & Settings State
  const [aiConfig, setAiConfig] = useState<AiCopilotConfig>(getSavedAiConfig());
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);

  // Copilot Layout Mode: 'split' (side-by-side no overlap) | 'bottom' (docked below) | 'full' (overlay)
  const [copilotLayoutMode, setCopilotLayoutMode] = useState<CopilotLayoutMode>(() => {
    try {
      const saved = localStorage.getItem('umakraft_copilot_layout_mode');
      if (saved === 'split' || saved === 'bottom' || saved === 'full') return saved;
    } catch {}
    return 'split';
  });

  // AI Unrestrained Sandbox File Modification Mode State
  const [isUnrestrainedMode, setIsUnrestrainedModeState] = useState<boolean>(() => getIsUnrestrainedMode());
  const [aiAutonomousToast, setAiAutonomousToast] = useState<string | null>(null);

  // Recent Files Tracking
  const [recentFilePaths, setRecentFilePaths] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('umakraft_recent_files');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isRecentDropdownOpen, setIsRecentDropdownOpen] = useState(false);
  const recentDropdownRef = useRef<HTMLDivElement>(null);

  // Tab Display Mode: 'icon_only' (recommended default to fit many files) vs 'full'
  const [tabViewMode, setTabViewMode] = useState<'icon_only' | 'full'>(() => {
    return (localStorage.getItem('umakraft_tab_mode') as any) || 'icon_only';
  });

  // Tapped File Name Floating Notification
  const [activeFileToast, setActiveFileToast] = useState<{
    name: string;
    path: string;
    extLabel: string;
    color: string;
    bgColor: string;
    borderColor: string;
    typeDesc: string;
  } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Camera / Image Vision Code Scanner Modal
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isWebDocsSearchOpen, setIsWebDocsSearchOpen] = useState(false);

  // Editor View Mode: 'code' (raw syntax-highlighted editor) | 'preview' (rendered Markdown) | 'split' (side-by-side)
  const [editorViewMode, setEditorViewMode] = useState<'code' | 'preview' | 'split'>('code');

  // AI Chat & Assistance State
  const [prompt, setPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [, setLastSuggestedCode] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeViewerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const importMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (recentDropdownRef.current && !recentDropdownRef.current.contains(event.target as Node)) {
        setIsRecentDropdownOpen(false);
      }
      if (importMenuRef.current && !importMenuRef.current.contains(event.target as Node)) {
        setIsImportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected file when external activeFilePath or activeFileList changes
  useEffect(() => {
    if (activeFilePath && activeFileList.some((f) => f.path === activeFilePath)) {
      setSelectedFilePath(activeFilePath);
    } else if (activeFileList.length > 0 && !activeFileList.some((f) => f.path === selectedFilePath)) {
      setSelectedFilePath(activeFileList[0].path);
    }
  }, [activeFilePath, activeFileList, selectedFilePath]);

  const currentFile =
    activeFileList.find((f) => f.path === selectedFilePath) ||
    activeFileList[0] ||
    null;

  // Dedicated File Selection Handler with Toast Notification & Recent History Tracking
  const handleSelectFileWithToast = useCallback(
    (file: ProjectFile) => {
      setSelectedFilePath(file.path);

      // Track in recent files history
      setRecentFilePaths((prev) => {
        const filtered = prev.filter((p) => p !== file.path);
        const updated = [file.path, ...filtered].slice(0, 15);
        try {
          localStorage.setItem('umakraft_recent_files', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Auto-set view mode based on file type
      const isMd = file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.markdown') || file.language === 'markdown';
      if (isMd) {
        setEditorViewMode('preview');
      } else {
        setEditorViewMode('code');
      }

      // Show floating tapped notification banner
      const meta = getFileVisualInfo(file.name, file.language);
      setActiveFileToast({
        name: file.name,
        path: file.path,
        extLabel: meta.extLabel,
        color: meta.color,
        bgColor: meta.bgColor,
        borderColor: meta.borderColor,
        typeDesc: meta.typeDesc
      });

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setActiveFileToast(null);
      }, 2500);
    },
    []
  );

  // Load content when currentFile changes & sync to recents
  useEffect(() => {
    if (currentFile) {
      setEditorContent(currentFile.content);
      setIsEditing(false);
      setLastSuggestedCode(null);

      const isMd = currentFile.name.toLowerCase().endsWith('.md') || currentFile.name.toLowerCase().endsWith('.markdown') || currentFile.language === 'markdown';
      if (isMd) {
        setEditorViewMode('preview');
      } else {
        setEditorViewMode('code');
      }

      setSaveStatus('saved');
      setLastSavedTime('Just now');

      // Sync recent file
      setRecentFilePaths((prev) => {
        if (prev[0] === currentFile.path) return prev;
        const filtered = prev.filter((p) => p !== currentFile.path);
        const updated = [currentFile.path, ...filtered].slice(0, 15);
        try {
          localStorage.setItem('umakraft_recent_files', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } else {
      setEditorContent('');
    }
  }, [currentFile?.path]);

  // Automatic Debounced Auto-Save Engine for sandbox files
  const triggerAutoSave = useCallback(
    (newContent: string) => {
      if (!currentFile) return;

      setSaveStatus('saving');
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        onUpdateFileContent(currentFile.path, newContent);
        setSaveStatus('saved');
        setLastSavedTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );

        // Push snapshot to Undo/Redo stack manager
        const updatedFiles = sandboxFiles.map((f) =>
          f.path === currentFile.path ? { ...f, content: newContent } : f
        );
        sandboxUndoRedoManager.pushSnapshot({
          actionType: 'manual_edit',
          filePath: currentFile.path,
          fileName: currentFile.name,
          description: `Edit saved in ${currentFile.name}`,
          files: updatedFiles,
          activeFilePath: currentFile.path
        });
      }, 700);
    },
    [currentFile, onUpdateFileContent, sandboxFiles]
  );

  // Intelligent Code Auto-Formatter Engine
  const handleAutoFormatCode = useCallback(() => {
    if (!editorContent || !currentFile) return;

    const result = formatCode(editorContent, currentFile.language, currentFile.name);

    if (result.changed) {
      setEditorContent(result.formatted);
      onUpdateFileContent(currentFile.path, result.formatted);
      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Record in undo/redo stack
      const updatedFiles = sandboxFiles.map((f) =>
        f.path === currentFile.path ? { ...f, content: result.formatted } : f
      );
      sandboxUndoRedoManager.pushSnapshot({
        actionType: 'auto_format',
        filePath: currentFile.path,
        fileName: currentFile.name,
        description: `Auto-formatted ${result.stats.description} in ${currentFile.name}`,
        files: updatedFiles,
        activeFilePath: currentFile.path,
        force: true
      });

      setActiveFileToast({
        name: currentFile.name,
        path: currentFile.path,
        extLabel: 'FORMAT',
        color: 'text-[#3fb950]',
        bgColor: 'bg-[#238636]/15',
        borderColor: 'border-[#3fb950]/40',
        typeDesc: `Auto-formatted ${result.stats.description} (${result.stats.formattedLines} lines)`
      });

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setActiveFileToast(null);
      }, 2800);

      confetti({ particleCount: 25, spread: 45, origin: { y: 0.3 } });
    } else {
      setActiveFileToast({
        name: currentFile.name,
        path: currentFile.path,
        extLabel: 'CLEAN',
        color: 'text-[#58a6ff]',
        bgColor: 'bg-[#1f6feb]/15',
        borderColor: 'border-[#1f6feb]/40',
        typeDesc: 'Code is already cleanly formatted'
      });

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setActiveFileToast(null);
      }, 2000);
    }
  }, [editorContent, currentFile, onUpdateFileContent, sandboxFiles]);

  // Undo & Redo Handlers
  const handleUndo = useCallback(() => {
    const snapshot = sandboxUndoRedoManager.undo();
    if (snapshot) {
      if (onRestoreFilesSnapshot) {
        onRestoreFilesSnapshot(snapshot.files, snapshot.activeFilePath || snapshot.filePath);
      }
      const targetFile =
        snapshot.files.find((f) => f.path === (snapshot.activeFilePath || snapshot.filePath)) ||
        snapshot.files[0];
      if (targetFile) {
        setSelectedFilePath(targetFile.path);
        setEditorContent(targetFile.content);
      }

      setActiveFileToast({
        name: snapshot.fileName,
        path: snapshot.filePath,
        extLabel: 'UNDO',
        color: 'text-[#58a6ff]',
        bgColor: 'bg-[#1f6feb]/20',
        borderColor: 'border-[#1f6feb]/50',
        typeDesc: `⏪ Undid: ${snapshot.description}`
      });

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setActiveFileToast(null);
      }, 2800);
    }
  }, [onRestoreFilesSnapshot]);

  const handleRedo = useCallback(() => {
    const snapshot = sandboxUndoRedoManager.redo();
    if (snapshot) {
      if (onRestoreFilesSnapshot) {
        onRestoreFilesSnapshot(snapshot.files, snapshot.activeFilePath || snapshot.filePath);
      }
      const targetFile =
        snapshot.files.find((f) => f.path === (snapshot.activeFilePath || snapshot.filePath)) ||
        snapshot.files[0];
      if (targetFile) {
        setSelectedFilePath(targetFile.path);
        setEditorContent(targetFile.content);
      }

      setActiveFileToast({
        name: snapshot.fileName,
        path: snapshot.filePath,
        extLabel: 'REDO',
        color: 'text-[#3fb950]',
        bgColor: 'bg-[#238636]/20',
        borderColor: 'border-[#3fb950]/50',
        typeDesc: `⏩ Redid: ${snapshot.description}`
      });

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setActiveFileToast(null);
      }, 2800);
    }
  }, [onRestoreFilesSnapshot]);

  const handleJumpToSnapshot = useCallback(
    (index: number) => {
      const snapshot = sandboxUndoRedoManager.jumpToIndex(index);
      if (snapshot) {
        if (onRestoreFilesSnapshot) {
          onRestoreFilesSnapshot(snapshot.files, snapshot.activeFilePath || snapshot.filePath);
        }
        const targetFile =
          snapshot.files.find((f) => f.path === (snapshot.activeFilePath || snapshot.filePath)) ||
          snapshot.files[0];
        if (targetFile) {
          setSelectedFilePath(targetFile.path);
          setEditorContent(targetFile.content);
        }

        setActiveFileToast({
          name: snapshot.fileName,
          path: snapshot.filePath,
          extLabel: 'RESTORE',
          color: 'text-[#d2a8ff]',
          bgColor: 'bg-[#8957e5]/20',
          borderColor: 'border-[#8957e5]/50',
          typeDesc: `🕒 Restored snapshot: ${snapshot.description}`
        });

        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
          setActiveFileToast(null);
        }, 2800);
      }
    },
    [onRestoreFilesSnapshot]
  );

  const handleClearHistory = useCallback(() => {
    sandboxUndoRedoManager.clear();
    if (sandboxFiles.length > 0) {
      sandboxUndoRedoManager.init(sandboxFiles, currentFile?.path);
    }
  }, [sandboxFiles, currentFile]);

  // Global Keyboard Shortcuts
  // - Ctrl+Z (Cmd+Z): Undo
  // - Ctrl+Y or Ctrl+Shift+Z (Cmd+Shift+Z): Redo
  // - Ctrl+Alt+H (Cmd+Alt+H): Version Timeline & History
  // - Ctrl+Shift+F (Cmd+Shift+F): Global Search Index Modal
  // - Ctrl+F (Cmd+F): In-Editor Find & Replace
  // - Shift+Alt+F or Ctrl+Shift+I: Auto-Format Current Code
  // - Ctrl+S (Cmd+S): Manual Save Immediate
  // - Esc: Close Find & Replace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global Search shortcut: Ctrl+Shift+F or Cmd+Shift+F
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (onOpenGlobalSearch) {
          onOpenGlobalSearch();
        }
        return;
      }

      // History timeline modal shortcut: Ctrl+Alt+H or Cmd+Alt+H
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsHistoryModalOpen((prev) => !prev);
        return;
      }

      // Redo shortcut: Ctrl+Y or Ctrl+Shift+Z (Cmd+Shift+Z)
      if (
        ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (historyState.canRedo) {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      // Undo shortcut: Ctrl+Z (Cmd+Z)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z') {
        // If not in standard active input that has native undo, or if user wants sandbox undo
        const isOutsideEditorTextarea =
          document.activeElement !== textareaRef.current &&
          (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA');

        if (!isOutsideEditorTextarea && historyState.canUndo) {
          e.preventDefault();
          handleUndo();
          return;
        }
      }

      // Auto-format shortcut: Shift+Alt+F or Ctrl+Shift+I
      if (
        (e.shiftKey && e.altKey && e.key.toLowerCase() === 'f') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i')
      ) {
        e.preventDefault();
        handleAutoFormatCode();
        return;
      }

      // In-Editor Search shortcut: Ctrl+F or Cmd+F
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (currentFile) {
          onUpdateFileContent(currentFile.path, editorContent);
          setSaveStatus('saved');
          setLastSavedTime(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isSearchOpen,
    currentFile,
    editorContent,
    onUpdateFileContent,
    onOpenGlobalSearch,
    handleAutoFormatCode,
    handleUndo,
    handleRedo,
    historyState.canUndo,
    historyState.canRedo
  ]);

  const handleEditorChange = (newContent: string) => {
    setEditorContent(newContent);
    triggerAutoSave(newContent);
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I am your Umakraft AI Copilot (running ${
        AI_PROVIDERS[aiConfig.provider]?.shortName || 'Qwen 1.5 Local'
      }). Ask me to write, refactor, explain, search, or debug code in your workspace. All changes auto-save in real-time!`,
      providerBadge: AI_PROVIDERS[aiConfig.provider]?.shortName,
      timestamp: 'Just now'
    }
  ]);

  // Search Logic & Matching Indices
  const lines = editorContent.split('\n');
  const matchedLineIndices: number[] = [];

  if (searchQuery.trim()) {
    const q = isMatchCase ? searchQuery : searchQuery.toLowerCase();
    lines.forEach((line, idx) => {
      const target = isMatchCase ? line : line.toLowerCase();
      if (target.includes(q)) {
        matchedLineIndices.push(idx + 1); // 1-indexed line numbers
      }
    });
  }

  const totalMatches = matchedLineIndices.length;

  const handleNextMatch = () => {
    if (totalMatches === 0) return;
    const nextIdx = (currentMatchIndex + 1) % totalMatches;
    setCurrentMatchIndex(nextIdx);
    setActiveLine(matchedLineIndices[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (totalMatches === 0) return;
    const prevIdx = (currentMatchIndex - 1 + totalMatches) % totalMatches;
    setCurrentMatchIndex(prevIdx);
    setActiveLine(matchedLineIndices[prevIdx]);
  };

  const handleReplaceOne = () => {
    if (!searchQuery || totalMatches === 0 || !currentFile) return;
    const currentLineNum = matchedLineIndices[currentMatchIndex] || matchedLineIndices[0];
    if (!currentLineNum) return;

    const lineIdx = currentLineNum - 1;
    const currentLine = lines[lineIdx];
    const regex = new RegExp(
      searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      isMatchCase ? '' : 'i'
    );
    const updatedLine = currentLine.replace(regex, replaceQuery);
    lines[lineIdx] = updatedLine;
    const newContent = lines.join('\n');
    setEditorContent(newContent);
    onUpdateFileContent(currentFile.path, newContent);
    setSaveStatus('saved');
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    const updatedFiles = sandboxFiles.map((f) =>
      f.path === currentFile.path ? { ...f, content: newContent } : f
    );
    sandboxUndoRedoManager.pushSnapshot({
      actionType: 'replace_find',
      filePath: currentFile.path,
      fileName: currentFile.name,
      description: `Replaced match in ${currentFile.name}`,
      files: updatedFiles,
      activeFilePath: currentFile.path,
      force: true
    });
  };

  const handleReplaceAll = () => {
    if (!searchQuery || !currentFile) return;
    const regex = new RegExp(
      searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      isMatchCase ? 'g' : 'gi'
    );
    const newContent = editorContent.replace(regex, replaceQuery);
    setEditorContent(newContent);
    onUpdateFileContent(currentFile.path, newContent);
    setSaveStatus('saved');
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    const updatedFiles = sandboxFiles.map((f) =>
      f.path === currentFile.path ? { ...f, content: newContent } : f
    );
    sandboxUndoRedoManager.pushSnapshot({
      actionType: 'replace_find',
      filePath: currentFile.path,
      fileName: currentFile.name,
      description: `Replaced all "${searchQuery}" with "${replaceQuery}" in ${currentFile.name}`,
      files: updatedFiles,
      activeFilePath: currentFile.path,
      force: true
    });

    confetti({ particleCount: 30, spread: 40, origin: { y: 0.5 } });
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles: File[] = Array.from(e.dataTransfer.files);
      setIsImporting(true);

      const zipFile = droppedFiles.find((f) => f.name.endsWith('.zip'));
      if (zipFile && droppedFiles.length === 1) {
        try {
          const parsed = await parseZipArchive(zipFile);
          if (parsed.length > 0) {
            const nextFiles = [
              ...parsed,
              ...sandboxFiles.filter((f) => !parsed.some((p) => p.path === f.path))
            ];
            sandboxUndoRedoManager.pushSnapshot({
              actionType: 'file_import',
              filePath: parsed[0].path,
              fileName: zipFile.name,
              description: `Imported ${parsed.length} files from ${zipFile.name}`,
              files: nextFiles,
              activeFilePath: parsed[0].path,
              force: true
            });

            if (onAddMultipleSandboxFiles) onAddMultipleSandboxFiles(parsed);
            else if (onAddSandboxFile) parsed.forEach(onAddSandboxFile);
            setSelectedFilePath(parsed[0].path);
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
          }
        } catch (err) {
          console.error('Failed to parse dropped zip:', err);
        } finally {
          setIsImporting(false);
        }
        return;
      }

      try {
        const parsed = await parseUploadedFiles(droppedFiles);
        if (parsed.length > 0) {
          const nextFiles = [
            ...parsed,
            ...sandboxFiles.filter((f) => !parsed.some((p) => p.path === f.path))
          ];
          sandboxUndoRedoManager.pushSnapshot({
            actionType: 'file_import',
            filePath: parsed[0].path,
            fileName: `${parsed.length} files`,
            description: `Dropped & imported ${parsed.length} sandbox files`,
            files: nextFiles,
            activeFilePath: parsed[0].path,
            force: true
          });

          if (onAddMultipleSandboxFiles) onAddMultipleSandboxFiles(parsed);
          else if (onAddSandboxFile) parsed.forEach(onAddSandboxFile);
          setSelectedFilePath(parsed[0].path);
          confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 } });
        }
      } catch (err) {
        console.error('Failed to parse dropped files:', err);
      } finally {
        setIsImporting(false);
      }
    }
  };

  // Upload Single / Multiple Files
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsImporting(true);
      try {
        const parsed = await parseUploadedFiles(e.target.files);
        if (parsed.length > 0) {
          const nextFiles = [
            ...parsed,
            ...sandboxFiles.filter((f) => !parsed.some((p) => p.path === f.path))
          ];
          sandboxUndoRedoManager.pushSnapshot({
            actionType: 'file_import',
            filePath: parsed[0].path,
            fileName: `${parsed.length} files`,
            description: `Uploaded ${parsed.length} sandbox files`,
            files: nextFiles,
            activeFilePath: parsed[0].path,
            force: true
          });

          if (onAddMultipleSandboxFiles) onAddMultipleSandboxFiles(parsed);
          else if (onAddSandboxFile) parsed.forEach(onAddSandboxFile);
          setSelectedFilePath(parsed[0].path);
          confetti({ particleCount: 40, spread: 50, origin: { y: 0.5 } });
        }
      } catch (err) {
        console.error('Failed to upload files:', err);
      } finally {
        setIsImporting(false);
        setIsImportMenuOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  // Import ZIP / Zstandard Archive
  const handleZipInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsImporting(true);
      try {
        const archiveFile = e.target.files[0];
        const isZstd = archiveFile.name.toLowerCase().endsWith('.zst') || archiveFile.name.toLowerCase().endsWith('.zstandard');
        const parsed = isZstd
          ? await parseZstdArchive(archiveFile)
          : await parseZipArchive(archiveFile);

        if (parsed.length > 0) {
          const nextFiles = [
            ...parsed,
            ...sandboxFiles.filter((f) => !parsed.some((p) => p.path === f.path))
          ];
          sandboxUndoRedoManager.pushSnapshot({
            actionType: 'file_import',
            filePath: parsed[0].path,
            fileName: archiveFile.name,
            description: `Imported ${parsed.length} files from ${archiveFile.name}`,
            files: nextFiles,
            activeFilePath: parsed[0].path,
            force: true
          });

          if (onAddMultipleSandboxFiles) onAddMultipleSandboxFiles(parsed);
          else if (onAddSandboxFile) parsed.forEach(onAddSandboxFile);
          setSelectedFilePath(parsed[0].path);
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.4 } });
        }
      } catch (err: any) {
        console.error('Failed to import archive:', err);
      } finally {
        setIsImporting(false);
        setIsImportMenuOpen(false);
        if (zipInputRef.current) zipInputRef.current.value = '';
      }
    }
  };

  // Upload Directory Folder
  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsImporting(true);
      try {
        const parsed = await parseUploadedFiles(e.target.files);
        if (parsed.length > 0) {
          const nextFiles = [
            ...parsed,
            ...sandboxFiles.filter((f) => !parsed.some((p) => p.path === f.path))
          ];
          sandboxUndoRedoManager.pushSnapshot({
            actionType: 'file_import',
            filePath: parsed[0].path,
            fileName: 'Folder import',
            description: `Uploaded folder containing ${parsed.length} files`,
            files: nextFiles,
            activeFilePath: parsed[0].path,
            force: true
          });

          if (onAddMultipleSandboxFiles) onAddMultipleSandboxFiles(parsed);
          else if (onAddSandboxFile) parsed.forEach(onAddSandboxFile);
          setSelectedFilePath(parsed[0].path);
          confetti({ particleCount: 45, spread: 60, origin: { y: 0.5 } });
        }
      } catch (err) {
        console.error('Failed to upload folder:', err);
      } finally {
        setIsImporting(false);
        setIsImportMenuOpen(false);
        if (folderInputRef.current) folderInputRef.current.value = '';
      }
    }
  };

  // Create New File
  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    let rawName = newFileName.trim().replace(/^[\/\\]+/, '');
    const chosenFolder = newFileFolder.trim().replace(/^[\/\\]+|[\/\\]+$/g, '');
    if (chosenFolder && !rawName.includes('/')) {
      rawName = `${chosenFolder}/${rawName}`;
    }

    let finalName = rawName;
    if (!finalName.includes('.')) {
      if (newFileTemplate === 'kotlin') finalName += '.kt';
      else if (newFileTemplate === 'cpp') finalName += '.cpp';
      else if (newFileTemplate === 'bash') finalName += '.sh';
      else if (newFileTemplate === 'markdown') finalName += '.md';
      else if (newFileTemplate === 'json') finalName += '.json';
      else if (newFileTemplate === 'xml') finalName += '.xml';
    }

    const shortName = finalName.split('/').pop() || finalName;
    let initialTemplate = `// ${shortName}\n// Path: ${finalName}\n// Umakraft User Sandbox\n\n`;
    if (newFileTemplate === 'kotlin' || finalName.endsWith('.kt')) {
      initialTemplate += `fun main() {\n    println("Hello from ${shortName}!")\n}\n`;
    } else if (newFileTemplate === 'cpp' || finalName.endsWith('.cpp')) {
      initialTemplate = `#include <iostream>\n\nint main() {\n    std::cout << "Hello from ${shortName}!" << std::endl;\n    return 0;\n}\n`;
    } else if (newFileTemplate === 'bash' || finalName.endsWith('.sh')) {
      initialTemplate = `#!/usr/bin/env bash\necho "Running ${shortName}..."\n`;
    } else if (newFileTemplate === 'json' || finalName.endsWith('.json')) {
      initialTemplate = `{\n  "name": "${shortName}",\n  "version": "1.0.0"\n}\n`;
    } else if (newFileTemplate === 'markdown' || finalName.endsWith('.md')) {
      initialTemplate = `# ${shortName}\n\nDocumentation for user sandbox.\n`;
    } else if (newFileTemplate === 'xml' || finalName.endsWith('.xml')) {
      initialTemplate = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <!-- ${shortName} -->\n</resources>\n`;
    }

    const created = createNewSandboxFile(finalName, initialTemplate);
    const nextFiles = [created, ...sandboxFiles.filter((f) => f.path !== created.path)];
    sandboxUndoRedoManager.pushSnapshot({
      actionType: 'file_create',
      filePath: created.path,
      fileName: created.name,
      description: `Created new file ${created.name}`,
      files: nextFiles,
      activeFilePath: created.path,
      force: true
    });

    if (onAddSandboxFile) {
      onAddSandboxFile(created);
    }
    setSelectedFilePath(created.path);
    setIsNewItemModalOpen(false);
    setNewFileName('');
    setSaveStatus('saved');
    setLastSavedTime('Just now');

    setActiveFileToast({
      name: created.name,
      path: created.path,
      extLabel: 'FILE',
      color: 'text-[#3fb950]',
      bgColor: 'bg-[#238636]/20',
      borderColor: 'border-[#3fb950]/50',
      typeDesc: `📄 File created: ${created.path}`
    });

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setActiveFileToast(null);
    }, 2500);

    confetti({ particleCount: 30, spread: 45, origin: { y: 0.5 } });
  };

  // Create New Folder
  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const rawFolderName = newFolderName.trim().replace(/^[\/\\]+|[\/\\]+$/g, '');
    const targetParent = parentFolder.trim().replace(/^[\/\\]+|[\/\\]+$/g, '');
    const fullFolderPath = targetParent ? `${targetParent}/${rawFolderName}` : rawFolderName;

    // Determine what initial file to create inside the new folder
    let firstFileName = folderFirstFileName.trim();
    let content = '';

    if (!firstFileName) {
      if (folderInitType === 'gitkeep') {
        firstFileName = '.gitkeep';
        content = `# Directory: ${fullFolderPath}\n# Umakraft User Sandbox Directory\n`;
      } else if (folderInitType === 'kotlin') {
        firstFileName = `${rawFolderName.split('/').pop() || 'Module'}.kt`;
        content = `package com.umakraft.${rawFolderName.replace(/[^a-zA-Z0-9]/g, '_')}\n\n// ${firstFileName}\n// Module: ${fullFolderPath}\n\nfun init${rawFolderName.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'Module'}() {\n    println("Initialized module ${fullFolderPath}")\n}\n`;
      } else if (folderInitType === 'cpp') {
        firstFileName = `${rawFolderName.split('/').pop() || 'native'}.cpp`;
        content = `// Native C++ module for ${fullFolderPath}\n#include <iostream>\n\nvoid run${rawFolderName.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'Module'}() {\n    std::cout << "[${fullFolderPath}] Native module ready." << std::endl;\n}\n`;
      } else if (folderInitType === 'bash') {
        firstFileName = 'script.sh';
        content = `#!/usr/bin/env bash\necho "Running workflow in ${fullFolderPath}..."\n`;
      } else if (folderInitType === 'markdown') {
        firstFileName = 'README.md';
        content = `# ${rawFolderName.split('/').pop() || fullFolderPath}\n\nDocumentation and specifications for the \`${fullFolderPath}\` folder in Umakraft User Sandbox.\n`;
      } else if (folderInitType === 'json') {
        firstFileName = 'config.json';
        content = `{\n  "folder": "${fullFolderPath}",\n  "version": "1.0.0",\n  "enabled": true\n}\n`;
      }
    }

    const fullFilePath = `${fullFolderPath}/${firstFileName}`;
    const created = createNewSandboxFile(fullFilePath, content);

    const nextFiles = [created, ...sandboxFiles.filter((f) => f.path !== created.path)];
    sandboxUndoRedoManager.pushSnapshot({
      actionType: 'folder_create',
      filePath: created.path,
      fileName: rawFolderName,
      description: `Created folder "${fullFolderPath}/" with ${firstFileName}`,
      files: nextFiles,
      activeFilePath: created.path,
      force: true
    });

    if (onAddSandboxFile) {
      onAddSandboxFile(created);
    }
    setSelectedFilePath(created.path);
    setIsNewItemModalOpen(false);
    setNewFolderName('');
    setFolderFirstFileName('');
    setSaveStatus('saved');
    setLastSavedTime('Just now');

    setActiveFileToast({
      name: `${fullFolderPath}/`,
      path: created.path,
      extLabel: 'DIR',
      color: 'text-[#58a6ff]',
      bgColor: 'bg-[#1f6feb]/20',
      borderColor: 'border-[#1f6feb]/50',
      typeDesc: `📁 Folder created: ${fullFolderPath}/ (${firstFileName})`
    });

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setActiveFileToast(null);
    }, 3000);

    confetti({ particleCount: 45, spread: 60, origin: { y: 0.4 } });
  };

  // Dedicated Code Diagnostic Action
  const handleCheckCodeAndDiagnose = (customDiagnosticPrompt?: string) => {
    if (onOpenAiModal) onOpenAiModal();
    const promptToRun =
      customDiagnosticPrompt ||
      "Check this code thoroughly. Tell me what's wrong, why it's an issue, how it should be done correctly, and provide the fully fixed code.";
    handleSendAiPrompt(promptToRun);
  };

  // AI Prompt Dispatcher (With Camera and Image Vision Support & Web Grounding)
  const handleSendAiPrompt = async (
    customPrompt?: string,
    imageAttachment?: { data: string; mimeType?: string },
    useWebSearch?: boolean
  ) => {
    const textToSend = (customPrompt || prompt).trim() || (imageAttachment ? 'Analyze and extract code from this image' : '');
    if (!textToSend || isAiLoading) return;

    if (onOpenAiModal) onOpenAiModal();

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: imageAttachment ? `📷 [Photo/Image Code Scan]\n${textToSend}` : textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setPrompt('');
    setIsAiLoading(true);

    try {
      const activeMeta = AI_PROVIDERS[aiConfig.provider];
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text
      }));

      // Execute workspace RAG search across project files
      const allProjectFiles = [...sandboxFiles, ...appFiles];
      const ragResults = AiRagMemoryService.searchProjectRag(textToSend, allProjectFiles, 3);
      
      // Auto-learn user pattern from prompt
      AiRagMemoryService.autoLearnFromInteraction(textToSend);

      const result = await requestAiAssist({
        prompt: textToSend,
        currentFile: currentFile?.path || undefined,
        context: currentFile
          ? `File: ${currentFile.path} (${currentFile.language})\n\nCode:\n\`\`\`${currentFile.language}\n${editorContent.slice(0, 8000)}\n\`\`\``
          : 'Workspace (No file currently selected)',
        ragContext: ragResults.contextPromptBlock,
        memoryContext: ragResults.memoryBlock,
        history: historyPayload,
        configOverride: aiConfig,
        image: imageAttachment,
        useWebSearch
      });

      const replyText = result.reply || 'No code generated.';
      const codeMatch = replyText.match(/```(?:kotlin|java|cpp|c|yaml|groovy|json|bash|sh|xml|kts)?\n([\s\S]*?)```/);
      const extractedCode = codeMatch ? codeMatch[1].trim() : null;

      let wasAutoApplied = false;
      if (extractedCode) {
        setLastSuggestedCode(extractedCode);
        if (isUnrestrainedMode && currentFile) {
          // Autonomous unrestrained sandbox modification
          handleApplySuggestedCode(extractedCode);
          wasAutoApplied = true;
          setAiAutonomousToast(`⚡ AI Unrestrained: Auto-updated ${currentFile.name}`);
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
          setTimeout(() => setAiAutonomousToast(null), 4500);
        }
      }

      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'ai',
        text: replyText,
        codeSnippet: extractedCode || undefined,
        providerBadge: `${activeMeta?.shortName || 'Qwen 1.5'} (${result.model || aiConfig.model})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const fallbackAiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender: 'ai',
        text: `AI Assistant (${AI_PROVIDERS[aiConfig.provider]?.shortName || 'Local AI'}):\n\n${err.message || 'Check your API key in settings or use Local AI (Qwen 1.5) for free offline execution.'}`,
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
      setSaveStatus('saved');
      setLastSavedTime('Just now (AI Patch)');

      const updatedFiles = sandboxFiles.map((f) =>
        f.path === currentFile.path ? { ...f, content: code } : f
      );
      sandboxUndoRedoManager.pushSnapshot({
        actionType: 'ai_patch',
        filePath: currentFile.path,
        fileName: currentFile.name,
        description: `Applied AI code patch to ${currentFile.name}`,
        files: updatedFiles,
        activeFilePath: currentFile.path,
        force: true
      });
    }
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.4 } });
  };

  const handleSaveManualEdit = () => {
    if (currentFile) {
      onUpdateFileContent(currentFile.path, editorContent);
      setSaveStatus('saved');
      setLastSavedTime('Just now');

      const updatedFiles = sandboxFiles.map((f) =>
        f.path === currentFile.path ? { ...f, content: editorContent } : f
      );
      sandboxUndoRedoManager.pushSnapshot({
        actionType: 'manual_edit',
        filePath: currentFile.path,
        fileName: currentFile.name,
        description: `Manual save on ${currentFile.name}`,
        files: updatedFiles,
        activeFilePath: currentFile.path,
        force: true
      });
    }
    setIsEditing(false);
  };

  const handleCopyCode = () => {
    copyToClipboard(editorContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    const blob = new Blob([editorContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile?.name || 'source-code.txt';
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
      handleEditorChange(newText);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + symbol.length;
          textareaRef.current.focus();
        }
      }, 50);
    } else {
      handleEditorChange(editorContent + symbol);
    }
  };

  // Syntax highlighting parser
  const renderHighlightedLine = (line: string) => {
    const lang = currentFile?.language?.toLowerCase() || '';

    if (line.trim().startsWith('#') || line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
      return <span className="text-[#8b949e] italic">{line}</span>;
    }

    if (lang === 'yaml' || currentFile?.name.endsWith('.yml') || currentFile?.name.endsWith('.yaml')) {
      const parts = line.split(/(:|\s+-\s+|\[|\]|{|}|\(|\)|"|')/);
      return (
        <span>
          {parts.map((part, pIdx) => {
            if (part === ':') return <span key={pIdx} className="text-[#ff7b72] font-bold">:</span>;
            if (/^\s*[\w.-]+:?$/.test(part)) return <span key={pIdx} className="text-[#79c0ff] font-semibold">{part}</span>;
            if (/^".*"$/.test(part) || /^'.*'$/.test(part)) return <span key={pIdx} className="text-[#a5d6ff]">{part}</span>;
            if (/^(true|false|yes|no|null)$/i.test(part.trim())) return <span key={pIdx} className="text-[#ffa657] font-semibold">{part}</span>;
            if (/^\d+$/.test(part.trim())) return <span key={pIdx} className="text-[#d2a8ff]">{part}</span>;
            return <span key={pIdx} className="text-[#c9d1d9]">{part}</span>;
          })}
        </span>
      );
    }

    const tokens = line.split(/(\s+|[(),;{}[\]<>!&|=+\-*/%.:"'])/);
    return (
      <span>
        {tokens.map((token, tIdx) => {
          if (/^(fun|class|interface|val|var|override|import|package|public|private|protected|internal|return|if|else|when|for|while|try|catch|finally|throw|object|companion|data|enum|sealed|open|abstract|const|lateinit|suspend|inline|reified|typealias|include|int|bool|void|char|double|float|auto|nullptr|namespace|using|struct|template|typename|echo|export|source|alias|set)$/.test(token)) {
            return <span key={tIdx} className="text-[#ff7b72] font-semibold">{token}</span>;
          }
          if (/^(String|Int|Boolean|Float|Double|Long|List|Map|Set|Array|File|Process|Thread|Context|Activity|View|Task|std|cout|cin|endl|vector|string|map|pair)$/.test(token)) {
            return <span key={tIdx} className="text-[#ffa657] font-semibold">{token}</span>;
          }
          if (/^".*"$/.test(token) || /^'.*'$/.test(token)) {
            return <span key={tIdx} className="text-[#a5d6ff]">{token}</span>;
          }
          if (/^\d+$/.test(token)) {
            return <span key={tIdx} className="text-[#79c0ff]">{token}</span>;
          }
          if (/^(@\w+|#\w+)/.test(token)) {
            return <span key={tIdx} className="text-[#d2a8ff] font-semibold">{token}</span>;
          }
          if (/^[A-Z][a-zA-Z0-9_]*$/.test(token)) {
            return <span key={tIdx} className="text-[#ffa657]">{token}</span>;
          }
          return <span key={tIdx} className="text-[#c9d1d9]">{token}</span>;
        })}
      </span>
    );
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="h-full flex flex-col relative w-full select-none"
    >
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={zipInputRef}
        onChange={handleZipInputChange}
        accept=".zip,.zst,.tar.zst,.zstandard"
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderInputChange}
        {...({ webkitdirectory: '', directory: '' } as any)}
        className="hidden"
      />

      {/* Drag & Drop Overlay Indicator */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-[#1f6feb]/25 border-2 border-dashed border-[#58a6ff] z-50 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <UploadCloud className="h-16 w-16 text-[#58a6ff] animate-bounce" />
          <h3 className="text-base font-bold text-white mt-2">
            Drop Source Files or ZIP Here
          </h3>
          <p className="text-xs text-[#c9d1d9]">
            Instantly imports files directly into your workspace
          </p>
        </div>
      )}

      {/* Primary IDE Container */}
      <div className="flex-1 min-h-0 bg-[#0d1117] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl flex flex-col relative">
        {/* Top Header Strip: Scope Switcher + File Tabs + Auto-Save Status & Breadcrumbs */}
        <div className="bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-2.5 pt-1.5 pb-1 gap-2 flex-shrink-0 relative">
          {/* Left: Scope Toggle + File Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0 pr-1">
            {/* Workspace Isolation Indicator */}
            <div className="flex items-center gap-1.5 bg-[#0d1117] px-2.5 py-1 rounded-xl border border-[#30363d] shrink-0 mr-1 text-xs font-mono">
              <Code2 className="h-3.5 w-3.5 text-[#58a6ff]" />
              <span className="text-white font-bold">Workspace</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30 font-semibold">
                {sandboxFiles.length}
              </span>
            </div>

            {/* Visual File Tabs */}
            {activeFileList.length === 0 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono text-[#8b949e] italic">
                <span>(No files in workspace)</span>
              </div>
            ) : (
              activeFileList.map((file) => {
                const isSelected = file.path === currentFile?.path;
                const meta = getFileVisualInfo(file.name, file.language);

                if (tabViewMode === 'icon_only') {
                  return (
                    <div
                      key={file.path}
                      className={`relative group flex items-center justify-center h-7 min-w-[34px] px-1 rounded-lg transition-all font-mono shrink-0 border ${
                        isSelected
                          ? `bg-[#0d1117] ${meta.borderColor} text-[#f0f6fc] font-bold shadow-md ring-1 ring-[#58a6ff]/30`
                          : 'bg-[#161b22] border-transparent text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
                      }`}
                    >
                      <button
                        onClick={() => handleSelectFileWithToast(file)}
                        title={`${file.name} • ${meta.typeDesc}\nTap to open (Path: ${file.path})`}
                        className="flex items-center justify-center p-0.5 rounded transition-all active:scale-95"
                      >
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                            isSelected
                              ? `${meta.bgColor} ${meta.borderColor} ${meta.color} shadow-sm`
                              : `bg-[#0d1117] border-[#30363d] ${meta.color} group-hover:border-[#58a6ff]/40`
                          }`}
                        >
                          {meta.extLabel}
                        </span>
                      </button>

                      {/* Active Indicator Underline Bar */}
                      {isSelected && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#58a6ff] shadow-sm shadow-[#58a6ff]" />
                      )}

                      {/* Delete button only for sandbox files on hover */}
                      {onDeleteSandboxFile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSandboxFile(file.path);
                          }}
                          title={`Remove ${file.name}`}
                          className="hidden group-hover:flex absolute -top-1 -right-1 p-0.5 rounded-full bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-[#f85149] shadow-sm"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  );
                }

                // Full Tab Layout (Expanded)
                return (
                  <div
                    key={file.path}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 border ${
                      isSelected
                        ? `bg-[#0d1117] ${meta.borderColor} text-[#f0f6fc] font-bold shadow-sm ring-1 ring-[#58a6ff]/20`
                        : 'bg-[#161b22] text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectFileWithToast(file)}
                      title={`${file.name} (${file.path})`}
                      className="flex items-center gap-1.5 truncate text-left"
                    >
                      <span
                        className={`px-1 py-0.2 rounded text-[9px] font-bold border ${meta.bgColor} ${meta.borderColor} ${meta.color}`}
                      >
                        {meta.extLabel}
                      </span>
                      <span className="truncate max-w-[110px] sm:max-w-[140px]">
                        {file.name}
                      </span>
                    </button>

                    {/* Delete button only for sandbox files */}
                    {onDeleteSandboxFile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSandboxFile(file.path);
                        }}
                        title={`Remove ${file.name}`}
                        className="p-0.5 rounded hover:bg-[#30363d] text-[#8b949e] hover:text-[#f85149] transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {/* Quick Add Tab Button (+ File or Folder) */}
            <button
              type="button"
              onClick={() => {
                setCreateModalTab('file');
                setIsNewItemModalOpen(true);
              }}
              title="Create New File or Folder in Workspace (+)"
              className="h-7 px-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#3fb950] hover:text-white border border-[#30363d] hover:border-[#3fb950]/50 flex items-center gap-1 text-[11px] font-mono font-bold transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>

          {/* Right Header Status: Format, Undo/Redo, Timeline, Unrestrained Switch, Auto-Save Status Badge & File Details */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 text-[11px] font-mono">
            {/* Quick Auto-Format Button */}
            {currentFile && (
              <button
                type="button"
                onClick={handleAutoFormatCode}
                title="Auto-Format current file (Shift+Alt+F / Ctrl+Shift+I)"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#30363d] hover:border-[#39c5bb]/50 bg-[#0d1117] hover:bg-[#21262d] text-[#39c5bb] hover:text-[#56d4dd] text-[10px] font-mono font-bold transition-all active:scale-95 shadow-sm"
              >
                <Wand2 className="h-3 w-3" />
                <span className="hidden md:inline">Format</span>
              </button>
            )}

            {/* Quick Header Undo Button */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={!historyState.canUndo}
              title={`Undo last sandbox action (Ctrl+Z) - ${historyState.pastCount} step(s) available`}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold transition-all active:scale-95 ${
                historyState.canUndo
                  ? 'border-[#30363d] hover:border-[#58a6ff]/50 bg-[#0d1117] hover:bg-[#21262d] text-[#58a6ff] hover:text-[#79c0ff] shadow-sm'
                  : 'border-[#21262d] bg-[#0d1117]/50 text-[#484f58] cursor-not-allowed'
              }`}
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden lg:inline">Undo</span>
              {historyState.pastCount > 0 && (
                <span className="text-[9px] opacity-75">({historyState.pastCount})</span>
              )}
            </button>

            {/* Quick Header Redo Button */}
            <button
              type="button"
              onClick={handleRedo}
              disabled={!historyState.canRedo}
              title={`Redo sandbox action (Ctrl+Y / Ctrl+Shift+Z) - ${historyState.futureCount} step(s) available`}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold transition-all active:scale-95 ${
                historyState.canRedo
                  ? 'border-[#30363d] hover:border-[#3fb950]/50 bg-[#0d1117] hover:bg-[#21262d] text-[#3fb950] hover:text-[#56d4dd] shadow-sm'
                  : 'border-[#21262d] bg-[#0d1117]/50 text-[#484f58] cursor-not-allowed'
              }`}
            >
              <RotateCw className="h-3 w-3" />
              <span className="hidden lg:inline">Redo</span>
            </button>

            {/* History Version Timeline Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              title={`Sandbox Version History & Snapshots (${historyState.snapshots.length} total) (Ctrl+Alt+H)`}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#30363d] hover:border-[#d2a8ff]/50 bg-[#0d1117] hover:bg-[#21262d] text-[#d2a8ff] hover:text-[#e2c5ff] text-[10px] font-mono font-bold transition-all active:scale-95 shadow-sm"
            >
              <History className="h-3 w-3" />
              <span className="hidden sm:inline">Timeline</span>
              <span className="text-[9px] px-1 rounded-full bg-[#8957e5]/20 text-[#d2a8ff]">
                {historyState.snapshots.length}
              </span>
            </button>

            {/* Quick Unrestrained Mode Toggle Button */}
            <button
              type="button"
              onClick={() => {
                const nextState = !isUnrestrainedMode;
                setIsUnrestrainedModeState(nextState);
                setIsUnrestrainedMode(nextState);
                if (nextState) {
                  confetti({ particleCount: 25, spread: 40, origin: { y: 0.2 } });
                }
              }}
              title={
                isUnrestrainedMode
                  ? '⚡ Unrestrained Mode Active: AI modifications are automatically applied to sandbox files. Click to disable.'
                  : '🛡️ Guarded Mode: Manual review before applying code. Click to enable Unrestrained Mode.'
              }
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold transition-all active:scale-95 ${
                isUnrestrainedMode
                  ? 'bg-[#ffa657]/15 text-[#ffa657] border-[#ffa657]/40 shadow-sm'
                  : 'bg-[#0d1117] text-[#8b949e] hover:text-[#c9d1d9] border-[#30363d]'
              }`}
            >
              <Zap className={`h-3 w-3 ${isUnrestrainedMode ? 'text-[#ffa657] fill-[#ffa657]' : ''}`} />
              <span className="hidden xs:inline">{isUnrestrainedMode ? 'Unrestrained' : 'Guarded'}</span>
            </button>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0d1117] border border-[#30363d] text-[10px]">
              {saveStatus === 'saving' ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#e3b341] animate-pulse" />
                  <span className="text-[#e3b341] font-semibold hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-[#3fb950]" />
                  <span className="text-[#3fb950] font-semibold hidden sm:inline">Auto-Saved</span>
                </>
              )}
            </div>

            {currentFile && (
              <span className="text-[10px] text-[#8b949e] hidden xl:inline truncate max-w-[140px]">
                {currentFile.name} &bull; {lines.length} lines
              </span>
            )}
          </div>
        </div>

        {/* Autonomous Unrestrained AI Toast Banner */}
        {aiAutonomousToast && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-[#161b22] border border-[#ffa657]/60 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs text-[#ffa657] font-mono animate-in slide-in-from-top-4 duration-150">
            <Zap className="h-4 w-4 text-[#ffa657] fill-[#ffa657] animate-pulse" />
            <span className="font-bold">{aiAutonomousToast}</span>
            <button
              onClick={() => setAiAutonomousToast(null)}
              className="p-0.5 rounded text-[#8b949e] hover:text-white ml-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Main Body Container: Split Side-by-Side vs Bottom Dock vs Code Alone */}
        <div className={`flex-1 min-h-0 flex ${copilotLayoutMode === 'bottom' && isAiModalOpen ? 'flex-col' : 'flex-col lg:flex-row'} overflow-hidden relative`}>
          {/* Work Area: Left Rail + Main Code Viewer */}
          <div className="flex-1 min-h-0 min-w-0 flex flex-col sm:flex-row overflow-hidden relative">
            {/* TOP-LEFT RESPONSIVE ACTION TOOLBAR (Horizontal ribbon on mobile, vertical rail on sm+) */}
            <div className="w-full sm:w-12 h-auto sm:h-full bg-[#161b22] border-b sm:border-b-0 sm:border-r border-[#30363d] flex flex-row sm:flex-col items-center py-1.5 sm:py-2 px-2 sm:px-0 gap-1.5 shrink-0 z-20 overflow-x-auto sm:overflow-y-auto scrollbar-none shadow-sm select-none">
            {/* 1. Edit / Check Mark Toggle Button */}
            {currentFile && (
              <button
                onClick={() => {
                  if (isEditing) {
                    handleSaveManualEdit();
                  } else {
                    setIsEditing(true);
                  }
                }}
                title={isEditing ? 'Done Editing (Auto-Saved)' : 'Edit File (Click to edit code directly)'}
                className={`p-2 rounded-xl text-xs flex items-center justify-center transition-all active:scale-95 border ${
                  isEditing
                    ? 'bg-[#238636] hover:bg-[#2ea043] text-white border-[#3fb950] ring-2 ring-[#3fb950]/30 shadow-lg shadow-[#238636]/30'
                    : 'bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-white border-[#30363d]'
                }`}
              >
                {isEditing ? <Check className="h-4 w-4 text-white" /> : <Edit3 className="h-4 w-4" />}
              </button>
            )}

            {/* 2. Auto-Format Code Button */}
            <button
              onClick={handleAutoFormatCode}
              title="Auto-Format Code (Shift+Alt+F / Ctrl+Shift+I)"
              className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#39c5bb] hover:text-[#56d4dd] border border-[#39c5bb]/40 text-xs flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              <Wand2 className="h-4 w-4 text-[#39c5bb]" />
            </button>

            {/* 3. Quick Undo Sandbox Action */}
            <button
              onClick={handleUndo}
              disabled={!historyState.canUndo}
              title={`Undo Sandbox Action (Ctrl+Z) - ${historyState.pastCount} step(s)`}
              className={`p-2 rounded-xl border text-xs flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                historyState.canUndo
                  ? 'bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-[#79c0ff] border-[#58a6ff]/40'
                  : 'bg-[#161b22] text-[#484f58] border-[#21262d] cursor-not-allowed opacity-50'
              }`}
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* 4. Quick Redo Sandbox Action */}
            <button
              onClick={handleRedo}
              disabled={!historyState.canRedo}
              title={`Redo Sandbox Action (Ctrl+Y / Ctrl+Shift+Z) - ${historyState.futureCount} step(s)`}
              className={`p-2 rounded-xl border text-xs flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                historyState.canRedo
                  ? 'bg-[#21262d] hover:bg-[#30363d] text-[#3fb950] hover:text-[#56d4dd] border-[#3fb950]/40'
                  : 'bg-[#161b22] text-[#484f58] border-[#21262d] cursor-not-allowed opacity-50'
              }`}
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {/* 5. Version History & Snapshot Timeline */}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              title={`Version Timeline & History Snapshots (${historyState.snapshots.length}) (Ctrl+Alt+H)`}
              className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#d2a8ff] hover:text-[#e2c5ff] border border-[#8957e5]/40 text-xs flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              <History className="h-4 w-4 text-[#d2a8ff]" />
            </button>

            {/* 6. Global Search Index */}
            {onOpenGlobalSearch && (
              <button
                onClick={onOpenGlobalSearch}
                title="Global Search Index across all files (Ctrl+Shift+F)"
                className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-[#79c0ff] border border-[#58a6ff]/40 text-xs flex items-center justify-center transition-all active:scale-95 shadow-sm"
              >
                <FileSearch className="h-4 w-4 text-[#58a6ff]" />
              </button>
            )}

            {/* 7. AI Check Code & Diagnose Button */}
            <button
              onClick={() => handleCheckCodeAndDiagnose()}
              title="AI Code Inspector: Analyze code for bugs, errors & recommended fixes"
              className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#e3b341] hover:text-[#f0e6c8] border border-[#e3b341]/40 text-xs flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              <ShieldCheck className="h-4 w-4 text-[#e3b341]" />
            </button>

            {/* 8. In-Editor Search & Replace (Find) */}
            <button
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (!isSearchOpen) {
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }
              }}
              title="Search and Replace in Current File (Ctrl+F)"
              className={`p-2 rounded-xl text-xs flex items-center justify-center border transition-all active:scale-95 shadow-sm ${
                isSearchOpen
                  ? 'bg-[#1f6feb] text-white border-[#388bfd] ring-2 ring-[#1f6feb]/30'
                  : 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white border-[#30363d]'
              }`}
            >
              <Search className="h-4 w-4" />
            </button>

            {/* 6. Unified Import Flyout Dropdown */}
            <div className="relative" ref={importMenuRef}>
              <button
                onClick={() => setIsImportMenuOpen((prev) => !prev)}
                title="Import files, folder or project ZIP"
                className={`p-2 rounded-xl border text-xs flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                  isImportMenuOpen
                    ? 'bg-[#1f6feb] text-white border-[#388bfd]'
                    : 'bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-white border-[#30363d]'
                }`}
              >
                <UploadCloud className="h-4 w-4" />
              </button>

              {/* Flyout Menu Content */}
              {isImportMenuOpen && (
                <div className="absolute left-0 sm:left-full top-full sm:top-0 mt-1.5 sm:mt-0 sm:ml-1.5 w-52 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsImportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-[#c9d1d9] hover:text-white hover:bg-[#21262d] transition-colors text-left"
                  >
                    <UploadCloud className="h-4 w-4 text-[#58a6ff]" />
                    <div>
                      <div className="font-semibold">Upload File(s)</div>
                      <div className="text-[10px] text-[#8b949e]">Individual code files</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      folderInputRef.current?.click();
                      setIsImportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-[#c9d1d9] hover:text-white hover:bg-[#21262d] transition-colors text-left"
                  >
                    <FolderPlus className="h-4 w-4 text-[#3fb950]" />
                    <div>
                      <div className="font-semibold">Upload Whole Folder</div>
                      <div className="text-[10px] text-[#8b949e]">Preserves directory paths</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      zipInputRef.current?.click();
                      setIsImportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-[#c9d1d9] hover:text-white hover:bg-[#21262d] transition-colors text-left"
                  >
                    <FileArchive className="h-4 w-4 text-[#e3b341]" />
                    <div>
                      <div className="font-semibold">Import Project ZIP</div>
                      <div className="text-[10px] text-[#8b949e]">Unpacks entire repo</div>
                    </div>
                  </button>

                  {onLoadSampleSandbox && (
                    <div className="border-t border-[#30363d] mt-1 pt-1">
                      <button
                        onClick={() => {
                          onLoadSampleSandbox();
                          setIsImportMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#79c0ff] hover:bg-[#21262d] transition-colors text-left"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Load Sample Files</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. Create New File or Folder */}
            <button
              onClick={() => {
                setCreateModalTab('file');
                setIsNewItemModalOpen(true);
              }}
              title="Create New File or Folder in Workspace (+)"
              className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#3fb950] hover:text-white border border-[#30363d] hover:border-[#3fb950]/50 text-xs flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              <Plus className="h-4 w-4" />
            </button>

            {/* 6. Scan Code Photo (Camera Vision) */}
            <button
              onClick={() => setIsCameraScannerOpen(true)}
              title="Camera Vision: Scan handwritten or printed code photo"
              className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#a371f7] hover:text-white border border-[#a371f7]/30 text-xs flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              <Camera className="h-4 w-4 text-[#a371f7]" />
            </button>

            {/* 7. Copy File Content */}
            {currentFile && (
              <button
                onClick={handleCopyCode}
                title="Copy Entire File to Clipboard"
                className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#58a6ff] border border-[#30363d] text-xs flex items-center justify-center transition-all active:scale-95"
              >
                {copiedCode ? <Check className="h-4 w-4 text-[#3fb950]" /> : <Copy className="h-4 w-4" />}
              </button>
            )}

            {/* 8. Download File */}
            {currentFile && (
              <button
                onClick={handleDownloadSingleFile}
                title={`Download ${currentFile.name}`}
                className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#58a6ff] border border-[#30363d] text-xs flex items-center justify-center transition-all active:scale-95"
              >
                <Download className="h-4 w-4" />
              </button>
            )}

            {/* 9. AI Copilot Model & Settings */}
            <button
              onClick={() => setIsAiSettingsOpen(true)}
              title={`Configure AI Models (${AI_PROVIDERS[aiConfig.provider]?.shortName || 'Qwen 1.5'})`}
              className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs text-[#bc8cff] hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
            >
              <Bot className="h-4 w-4 text-[#bc8cff]" />
            </button>

            {/* 10. Recent Files Flyout History */}
            <div className="relative" ref={recentDropdownRef}>
              <button
                onClick={() => setIsRecentDropdownOpen((prev) => !prev)}
                title={`Recent Files History (${recentFilePaths.length})`}
                className={`p-2 rounded-xl border text-xs flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                  isRecentDropdownOpen
                    ? 'bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff]/50'
                    : 'bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] border-[#30363d]'
                }`}
              >
                <History className="h-4 w-4" />
              </button>

              {/* Flyout Menu for Recent Files */}
              {isRecentDropdownOpen && (
                <div className="absolute left-0 sm:left-full top-full sm:top-0 mt-1.5 sm:mt-0 sm:ml-1.5 w-64 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-[#30363d] mb-1">
                    <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[#58a6ff]" /> Recent Files
                    </span>
                    {recentFilePaths.length > 0 && (
                      <button
                        onClick={() => {
                          setRecentFilePaths([]);
                          try {
                            localStorage.removeItem('umakraft_recent_files');
                          } catch {}
                        }}
                        className="text-[10px] text-[#8b949e] hover:text-[#f85149] transition-colors flex items-center gap-0.5"
                        title="Clear recent list"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {recentFilePaths.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[#8b949e] italic">
                      No recent files yet
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-0.5 scrollbar-thin">
                      {recentFilePaths.map((path) => {
                        const fileObj = sandboxFiles.find((f) => f.path === path);

                        const displayName = fileObj ? fileObj.name : path.split('/').pop() || path;
                        const meta = getFileVisualInfo(displayName, fileObj?.language);
                        const isCurrent = currentFile?.path === path;

                        return (
                          <button
                            key={path}
                            onClick={() => {
                              if (fileObj) {
                                handleSelectFileWithToast(fileObj);
                              } else {
                                setSelectedFilePath(path);
                              }
                              setIsRecentDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-mono text-left transition-colors ${
                              isCurrent
                                ? 'bg-[#1f6feb]/20 text-[#58a6ff] font-bold'
                                : 'text-[#c9d1d9] hover:bg-[#21262d] hover:text-white'
                            }`}
                          >
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 border ${meta.bgColor} ${meta.borderColor} ${meta.color}`}
                            >
                              {meta.extLabel}
                            </span>
                            <div className="truncate flex-1 min-w-0">
                              <div className="truncate font-semibold">{displayName}</div>
                              <div className="text-[9px] text-[#8b949e] truncate">{path}</div>
                            </div>
                            {isCurrent && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[#1f6feb] text-white">
                                Active
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 11. Load Demo Sample Files */}
            {onLoadSampleSandbox && (
              <button
                onClick={onLoadSampleSandbox}
                title="Load Sample Demo Files"
                className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#79c0ff] hover:text-white border border-[#30363d] text-xs flex items-center justify-center transition-all active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}

            {/* 12. Tab View Mode Toggle */}
            <button
              onClick={() => {
                const nextMode = tabViewMode === 'icon_only' ? 'full' : 'icon_only';
                setTabViewMode(nextMode);
                try {
                  localStorage.setItem('umakraft_tab_mode', nextMode);
                } catch {}
              }}
              title={
                tabViewMode === 'icon_only'
                  ? 'Currently in Icon Tab Mode. Click to Expand.'
                  : 'Currently in Expanded Mode. Click for Icon-Only.'
              }
              className={`p-2 rounded-xl text-xs flex items-center justify-center border transition-all active:scale-95 ${
                tabViewMode === 'icon_only'
                  ? 'bg-[#21262d] text-[#e3b341] border-[#e3b341]/40 hover:bg-[#30363d]'
                  : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white'
              }`}
            >
              {tabViewMode === 'icon_only' ? (
                <LayoutGrid className="h-4 w-4 text-[#e3b341]" />
              ) : (
                <List className="h-4 w-4 text-[#8b949e]" />
              )}
            </button>
          </div>

          {/* MAIN CODE VIEWER & CANVAS CONTAINER (Right of the left icon rail) */}
          <div ref={codeViewerRef} className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-[#0d1117]">
            {/* Real-time In-Editor Search & Replace Toolbar */}
            {isSearchOpen && (
              <div className="bg-[#161b22] border-b border-[#30363d] px-3 py-2 flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-100 shadow-md flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Search className="h-3.5 w-3.5 text-[#58a6ff] shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentMatchIndex(0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (e.shiftKey) handlePrevMatch();
                          else handleNextMatch();
                        } else if (e.key === 'Escape') {
                          setIsSearchOpen(false);
                        }
                      }}
                      placeholder="Search code (e.g. function, class, variable)..."
                      className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1 text-xs font-mono text-[#f0f6fc] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] flex-1 max-w-sm"
                    />

                    {/* Match Counter */}
                    <span className="text-[11px] font-mono text-[#8b949e] px-1.5 whitespace-nowrap">
                      {searchQuery ? `${totalMatches === 0 ? '0' : currentMatchIndex + 1} of ${totalMatches}` : 'No search'}
                    </span>

                    {/* Prev / Next Buttons */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={handlePrevMatch}
                        disabled={totalMatches === 0}
                        title="Previous Match (Shift+Enter)"
                        className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] disabled:opacity-40"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={handleNextMatch}
                        disabled={totalMatches === 0}
                        title="Next Match (Enter)"
                        className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] disabled:opacity-40"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Case Sensitive Toggle */}
                    <button
                      onClick={() => setIsMatchCase((prev) => !prev)}
                      title="Match Case"
                      className={`p-1 rounded text-xs font-mono border ${
                        isMatchCase
                          ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]'
                          : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-white'
                      }`}
                    >
                      <CaseSensitive className="h-3.5 w-3.5" />
                    </button>

                    {/* Toggle Replace */}
                    <button
                      onClick={() => setShowReplace((prev) => !prev)}
                      title="Toggle Replace"
                      className={`p-1 px-1.5 rounded text-[11px] font-mono flex items-center gap-1 border ${
                        showReplace
                          ? 'bg-[#238636]/20 text-[#3fb950] border-[#238636]'
                          : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-white'
                      }`}
                    >
                      <Replace className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Replace</span>
                    </button>

                    {/* Quick Link to Global Search */}
                    {onOpenGlobalSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          onOpenGlobalSearch();
                        }}
                        title="Search across all files in workspace (Ctrl+Shift+F)"
                        className="p-1 px-1.5 rounded text-[11px] font-mono flex items-center gap-1 bg-[#1f6feb]/20 text-[#58a6ff] hover:text-white hover:bg-[#1f6feb]/35 border border-[#1f6feb]/40 transition-colors"
                      >
                        <FileSearch className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">Global (Ctrl+Shift+F)</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setIsSearchOpen(false)}
                    title="Close Search (Esc)"
                    className="p-1 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Replace Input Row */}
                {showReplace && (
                  <div className="flex items-center gap-1.5 pt-1 border-t border-[#21262d]">
                    <Replace className="h-3.5 w-3.5 text-[#3fb950] shrink-0" />
                    <input
                      type="text"
                      value={replaceQuery}
                      onChange={(e) => setReplaceQuery(e.target.value)}
                      placeholder="Replace with..."
                      className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1 text-xs font-mono text-[#f0f6fc] placeholder-[#484f58] focus:outline-none focus:border-[#3fb950] flex-1 max-w-sm"
                    />
                    <button
                      onClick={handleReplaceOne}
                      disabled={totalMatches === 0}
                      className="px-2 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-mono text-[#c9d1d9] hover:text-white border border-[#30363d] disabled:opacity-40"
                    >
                      Replace
                    </button>
                    <button
                      onClick={handleReplaceAll}
                      disabled={totalMatches === 0}
                      className="px-2 py-1 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-xs font-mono text-white font-semibold disabled:opacity-40 shadow-sm"
                    >
                      Replace All
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Breadcrumb Info Strip with Markdown & Code View Mode Switcher */}
            <div className="px-3 py-1.5 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between gap-2 text-[11px] font-mono text-[#8b949e] flex-shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="px-1.5 py-0.2 rounded font-bold text-[9px] bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30">
                  WORKSPACE
                </span>
                {currentFile && (
                  (() => {
                    const meta = getFileVisualInfo(currentFile.name, currentFile.language);
                    return (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${meta.bgColor} ${meta.borderColor} ${meta.color}`}>
                        {meta.extLabel}
                      </span>
                    );
                  })()
                )}
                <FolderTree className="h-3 w-3 text-[#58a6ff] shrink-0" />
                <span className="truncate text-[#c9d1d9] font-medium">
                  {currentFile ? currentFile.path : '(empty)'}
                </span>
              </div>

              {/* Center / Right Controls: Markdown View Mode Switcher & Stats */}
              <div className="flex items-center gap-2 shrink-0">
                {currentFile && (
                  <div className="flex items-center bg-[#161b22] p-0.5 rounded-lg border border-[#30363d]">
                    <button
                      onClick={() => setEditorViewMode('code')}
                      title="Raw Code / Line Editor View"
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1 transition-all ${
                        editorViewMode === 'code'
                          ? 'bg-[#1f6feb] text-white font-bold shadow-sm'
                          : 'text-[#8b949e] hover:text-[#c9d1d9]'
                      }`}
                    >
                      <Code2 className="h-3 w-3" />
                      <span>Code</span>
                    </button>
                    <button
                      onClick={() => setEditorViewMode('preview')}
                      title="Rendered Markdown Preview (GFM & Styled)"
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1 transition-all ${
                        editorViewMode === 'preview'
                          ? 'bg-[#1f6feb] text-white font-bold shadow-sm'
                          : 'text-[#8b949e] hover:text-[#c9d1d9]'
                      }`}
                    >
                      <BookOpen className="h-3 w-3 text-[#79c0ff]" />
                      <span>Markdown Preview</span>
                    </button>
                    <button
                      onClick={() => setEditorViewMode('split')}
                      title="Side-by-Side: Code Editor + Live Markdown Preview"
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono hidden sm:flex items-center gap-1 transition-all ${
                        editorViewMode === 'split'
                          ? 'bg-[#1f6feb] text-white font-bold shadow-sm'
                          : 'text-[#8b949e] hover:text-[#c9d1d9]'
                      }`}
                    >
                      <Columns2 className="h-3 w-3" />
                      <span>Split</span>
                    </button>
                  </div>
                )}

                {currentFile && (
                  <span className="text-[10px] text-[#8b949e] shrink-0 font-mono hidden md:inline">
                    {lines.length} lines &bull; UTF-8
                  </span>
                )}
              </div>
            </div>

            {/* Permanent Code Canvas Area */}
            {activeFileList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#8b949e]">
                <Code2 className="h-10 w-10 text-[#58a6ff]/40 mb-3" />
                <h3 className="text-sm font-bold text-[#f0f6fc] font-mono">
                  No files in this workspace yet
                </h3>
                <p className="text-xs text-[#8b949e] max-w-sm mt-1 mb-4 font-mono">
                  Create a new file or upload code to start developing in your workspace.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCreateModalTab('file');
                      setIsNewItemModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#1f6feb] hover:bg-[#1158c7] text-white text-xs font-semibold transition-all shadow-md"
                  >
                    + Create First File or Folder
                  </button>
                  {onLoadSampleSandbox && (
                    <button
                      onClick={onLoadSampleSandbox}
                      className="px-3.5 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] border border-[#30363d] text-xs font-semibold transition-all"
                    >
                      Load Sample Files
                    </button>
                  )}
                </div>
              </div>
            ) : editorViewMode === 'preview' ? (
              /* Full Rendered Markdown Preview View */
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <MarkdownPreview content={editorContent} fileName={currentFile?.name} />
              </div>
            ) : editorViewMode === 'split' ? (
              /* Side-by-Side Split View: Code on Left, Live Markdown Preview on Right */
              <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#30363d] overflow-hidden">
                {/* Left: Code Editor */}
                <div className="min-h-0 overflow-y-auto overflow-x-auto font-mono text-xs text-[#c9d1d9] leading-relaxed select-text relative flex flex-col bg-[#0d1117]">
                  <div className="bg-[#161b22] px-3 py-1.5 border-b border-[#30363d] flex items-center justify-between text-[11px] text-[#8b949e]">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Code2 className="h-3.5 w-3.5 text-[#58a6ff]" />
                      <span>Code Source</span>
                    </span>
                    <span className="text-[10px] text-[#3fb950] font-bold">Live Synced</span>
                  </div>
                  {isEditing ? (
                    <div className="h-full flex flex-1">
                      <div className="select-none py-3 px-2 text-right text-[#484f58] font-mono text-xs border-r border-[#21262d] bg-[#0d1117] flex-shrink-0">
                        {lines.map((_, i) => (
                          <div key={i} className="leading-relaxed">
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      <textarea
                        ref={textareaRef}
                        value={editorContent}
                        onChange={(e) => handleEditorChange(e.target.value)}
                        className="w-full h-full min-h-full p-3 bg-transparent text-[#f0f6fc] font-mono text-xs focus:outline-none resize-none leading-relaxed"
                        spellCheck={false}
                      />
                    </div>
                  ) : (
                    <div className="flex min-w-full py-2 flex-1">
                      <div className="select-none px-2 text-right text-[#484f58] font-mono text-xs border-r border-[#21262d] bg-[#0d1117] flex-shrink-0">
                        {lines.map((_, i) => (
                          <div key={i} className="leading-relaxed">
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 overflow-x-auto px-3 select-text">
                        {lines.map((line, i) => (
                          <div key={i} className="leading-relaxed whitespace-pre font-mono">
                            {renderHighlightedLine(line)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Rendered Markdown View */}
                <div className="min-h-0 overflow-hidden flex flex-col bg-[#0d1117]">
                  <MarkdownPreview content={editorContent} fileName={currentFile?.name} />
                </div>
              </div>
            ) : (
              /* Standard Code Canvas View */
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

                    {/* Textarea Editor with live keystroke auto-save */}
                    <textarea
                      ref={textareaRef}
                      value={editorContent}
                      onChange={(e) => handleEditorChange(e.target.value)}
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

                    {/* Code Lines with Syntax Highlighting & Search Match Highlights */}
                    <div className="flex-1 overflow-x-auto px-3 select-text">
                      {lines.map((line, i) => {
                        const lineNum = i + 1;
                        const isMatch = searchQuery && (isMatchCase ? line.includes(searchQuery) : line.toLowerCase().includes(searchQuery.toLowerCase()));
                        const isCurrentMatchLine = matchedLineIndices[currentMatchIndex] === lineNum;
                        const isSelected = activeLine === lineNum;

                        return (
                          <div
                            key={i}
                            onClick={() => setActiveLine(lineNum)}
                            className={`leading-relaxed whitespace-pre font-mono transition-colors rounded px-1 -mx-1 ${
                              isCurrentMatchLine
                                ? 'bg-[#1f6feb]/35 text-white ring-1 ring-[#58a6ff]'
                                : isMatch
                                ? 'bg-[#d29922]/25 text-white'
                                : isSelected
                                ? 'bg-[#1f6feb]/10'
                                : 'hover:bg-[#21262d]/40'
                            }`}
                          >
                            {renderHighlightedLine(line)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Programmer Soft-Key Symbol Helper Strip */}
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
          </div>
        </div>

          {/* DOCKED SIDE-BY-SIDE SPLIT COPILOT (No overlap with workspace editor!) */}
          {isAiModalOpen && copilotLayoutMode === 'split' && (
            <div className="w-full lg:w-[380px] xl:w-[440px] 2xl:w-[480px] border-t lg:border-t-0 lg:border-l border-[#30363d] h-[45vh] lg:h-full flex flex-col shrink-0 bg-[#0d1117] z-20 shadow-2xl animate-in slide-in-from-right-4 duration-150">
              <UmakraftAiCopilotPanel
                isOpen={isAiModalOpen}
                onClose={() => {
                  if (onCloseAiModal) onCloseAiModal();
                }}
                layoutMode="split"
                onChangeLayoutMode={(mode) => {
                  setCopilotLayoutMode(mode);
                  try {
                    localStorage.setItem('umakraft_copilot_layout_mode', mode);
                  } catch {}
                }}
                currentFile={currentFile}
                allFiles={sandboxFiles}
                onSelectSnippetFile={(path) => {
                  setSelectedFilePath(path);
                }}
                workspaceScope="sandbox"
                messages={messages}
                onSendMessage={(customPrompt, img, useWebSearch) => handleSendAiPrompt(customPrompt, img, useWebSearch)}
                isAiLoading={isAiLoading}
                aiConfig={aiConfig}
                onOpenAiSettings={() => setIsAiSettingsOpen(true)}
                onApplyCode={(code) => handleApplySuggestedCode(code)}
                onOpenScanner={() => setIsCameraScannerOpen(true)}
                onOpenWebSearchModal={() => setIsWebDocsSearchOpen(true)}
                editorContent={editorContent}
                unrestrainedMode={isUnrestrainedMode}
                onToggleUnrestrainedMode={(enabled) => {
                  setIsUnrestrainedModeState(enabled);
                  setIsUnrestrainedMode(enabled);
                }}
              />
            </div>
          )}

          {/* DOCKED BOTTOM COPILOT (Code on top, Copilot on bottom - No overlap!) */}
          {isAiModalOpen && copilotLayoutMode === 'bottom' && (
            <div className="h-72 sm:h-80 md:h-96 w-full border-t border-[#30363d] flex flex-col shrink-0 bg-[#0d1117] z-20 shadow-2xl animate-in slide-in-from-bottom-4 duration-150">
              <UmakraftAiCopilotPanel
                isOpen={isAiModalOpen}
                onClose={() => {
                  if (onCloseAiModal) onCloseAiModal();
                }}
                layoutMode="bottom"
                onChangeLayoutMode={(mode) => {
                  setCopilotLayoutMode(mode);
                  try {
                    localStorage.setItem('umakraft_copilot_layout_mode', mode);
                  } catch {}
                }}
                currentFile={currentFile}
                allFiles={sandboxFiles}
                onSelectSnippetFile={(path) => {
                  setSelectedFilePath(path);
                }}
                workspaceScope="sandbox"
                messages={messages}
                onSendMessage={(customPrompt, img, useWebSearch) => handleSendAiPrompt(customPrompt, img, useWebSearch)}
                isAiLoading={isAiLoading}
                aiConfig={aiConfig}
                onOpenAiSettings={() => setIsAiSettingsOpen(true)}
                onApplyCode={(code) => handleApplySuggestedCode(code)}
                onOpenScanner={() => setIsCameraScannerOpen(true)}
                onOpenWebSearchModal={() => setIsWebDocsSearchOpen(true)}
                editorContent={editorContent}
                unrestrainedMode={isUnrestrainedMode}
                onToggleUnrestrainedMode={(enabled) => {
                  setIsUnrestrainedModeState(enabled);
                  setIsUnrestrainedMode(enabled);
                }}
              />
            </div>
          )}
        </div>
      </div>

        {/* FULLSCREEN FOCUS OVERLAY COPILOT (Only active when in full mode) */}
        {isAiModalOpen && copilotLayoutMode === 'full' && (
          <UmakraftAiCopilotPanel
            isOpen={isAiModalOpen}
            onClose={() => {
              if (onCloseAiModal) onCloseAiModal();
            }}
            layoutMode="full"
            onChangeLayoutMode={(mode) => {
              setCopilotLayoutMode(mode);
              try {
                localStorage.setItem('umakraft_copilot_layout_mode', mode);
              } catch {}
            }}
            currentFile={currentFile}
            allFiles={sandboxFiles}
            onSelectSnippetFile={(path) => {
              setSelectedFilePath(path);
            }}
            workspaceScope="sandbox"
            messages={messages}
            onSendMessage={(customPrompt, img, useWebSearch) => handleSendAiPrompt(customPrompt, img, useWebSearch)}
            isAiLoading={isAiLoading}
            aiConfig={aiConfig}
            onOpenAiSettings={() => setIsAiSettingsOpen(true)}
            onApplyCode={(code) => handleApplySuggestedCode(code)}
            onOpenScanner={() => setIsCameraScannerOpen(true)}
            onOpenWebSearchModal={() => setIsWebDocsSearchOpen(true)}
            editorContent={editorContent}
            unrestrainedMode={isUnrestrainedMode}
            onToggleUnrestrainedMode={(enabled) => {
              setIsUnrestrainedModeState(enabled);
              setIsUnrestrainedMode(enabled);
            }}
          />
        )}

      {/* Camera & Image AI Code Scanner Modal */}
      <CameraCodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        isAiProcessing={isAiLoading}
        onScanComplete={({ code }) => {
          if (code) {
            handleApplySuggestedCode(code);
          }
        }}
        onAnalyzeImage={async (image, customPromptText) => {
          if (onOpenAiModal) onOpenAiModal();
          await handleSendAiPrompt(customPromptText, image);
        }}
      />

      {/* Web Docs Search Explorer Modal */}
      <WebDocsSearchModal
        isOpen={isWebDocsSearchOpen}
        onClose={() => setIsWebDocsSearchOpen(false)}
        onApplyCodeSnippet={(code) => {
          handleApplySuggestedCode(code);
          setIsWebDocsSearchOpen(false);
        }}
      />

      {/* Create New File or Folder Modal */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                {createModalTab === 'file' ? (
                  <FilePlus2 className="h-5 w-5 text-[#58a6ff]" />
                ) : (
                  <FolderPlus className="h-5 w-5 text-[#3fb950]" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    {createModalTab === 'file' ? 'Create New File' : 'Create New Directory / Folder'}
                  </h3>
                  <p className="text-[10px] text-[#8b949e] font-mono">
                    User Sandbox Workspace Scope &bull; Auto-saved
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewItemModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 bg-[#0d1117] border border-[#30363d] rounded-xl mt-3.5 mb-4">
              <button
                type="button"
                onClick={() => setCreateModalTab('file')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                  createModalTab === 'file'
                    ? 'bg-[#1f6feb] text-white shadow-md'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <FilePlus2 className="h-4 w-4" />
                <span>New File</span>
              </button>
              <button
                type="button"
                onClick={() => setCreateModalTab('folder')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                  createModalTab === 'folder'
                    ? 'bg-[#238636] text-white shadow-md'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <FolderPlus className="h-4 w-4" />
                <span>New Folder</span>
              </button>
            </div>

            {/* TAB 1: CREATE NEW FILE */}
            {createModalTab === 'file' && (
              <form onSubmit={handleCreateFileSubmit} className="space-y-4">
                {/* File Location / Folder */}
                <div>
                  <label className="block text-xs font-mono text-[#8b949e] mb-1">
                    Folder Location (Optional)
                  </label>
                  <select
                    value={newFileFolder}
                    onChange={(e) => setNewFileFolder(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#58a6ff]"
                  >
                    <option value="">/ (Workspace Root)</option>
                    {existingFolders.map((fld) => (
                      <option key={fld} value={fld}>
                        📁 {fld}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Name */}
                <div>
                  <label className="block text-xs font-mono text-[#8b949e] mb-1">
                    File Name (e.g. <span className="text-[#58a6ff]">MyService.kt</span>, <span className="text-[#3fb950]">script.sh</span>, <span className="text-[#e3b341]">config.json</span>)
                  </label>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="MyComponent.kt"
                    autoFocus
                    required
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
                  />
                </div>

                {/* Starter Template */}
                <div>
                  <label className="block text-xs font-mono text-[#8b949e] mb-1.5">
                    Starter Template
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    {(['kotlin', 'cpp', 'bash', 'json', 'markdown', 'xml'] as const).map((tmpl) => (
                      <button
                        type="button"
                        key={tmpl}
                        onClick={() => setNewFileTemplate(tmpl)}
                        className={`p-2 rounded-xl border text-center transition-all capitalize ${
                          newFileTemplate === tmpl
                            ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb] font-bold shadow-sm'
                            : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-white'
                        }`}
                      >
                        {tmpl === 'cpp' ? 'C++ NDK' : tmpl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Path Preview */}
                <div className="p-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-[11px] font-mono text-[#8b949e] flex items-center gap-2">
                  <FileCode className="h-3.5 w-3.5 text-[#58a6ff] shrink-0" />
                  <div className="truncate">
                    <span className="text-[#8b949e]">Target: </span>
                    <span className="text-[#3fb950] font-bold">
                      sandbox/{newFileFolder ? `${newFileFolder}/` : ''}{newFileName || 'file.kt'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#30363d]">
                  <button
                    type="button"
                    onClick={() => setIsNewItemModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-[#21262d] text-[#8b949e] hover:text-white text-xs font-mono transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-mono font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <FilePlus2 className="h-3.5 w-3.5" />
                    <span>Create File</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: CREATE NEW FOLDER */}
            {createModalTab === 'folder' && (
              <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
                {/* Folder Location / Parent Folder */}
                <div>
                  <label className="block text-xs font-mono text-[#8b949e] mb-1">
                    Parent Directory (Optional)
                  </label>
                  <select
                    value={parentFolder}
                    onChange={(e) => setParentFolder(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#3fb950]"
                  >
                    <option value="">/ (Workspace Root)</option>
                    {existingFolders.map((fld) => (
                      <option key={fld} value={fld}>
                        📁 {fld}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Folder Name */}
                <div>
                  <label className="block text-xs font-mono text-[#8b949e] mb-1">
                    Folder / Directory Name (e.g. <span className="text-[#3fb950]">components</span>, <span className="text-[#58a6ff]">utils/network</span>, <span className="text-[#e3b341]">models</span>)
                  </label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="components"
                    autoFocus
                    required
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-[#484f58] focus:outline-none focus:border-[#3fb950]"
                  />
                </div>

                {/* Quick Suggestion Chips */}
                <div>
                  <label className="block text-[11px] font-mono text-[#8b949e] mb-1.5">
                    Quick Suggestions
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['components', 'utils', 'network', 'models', 'services', 'scripts', 'helpers', 'ui', 'docs'].map(
                      (sugg) => (
                        <button
                          type="button"
                          key={sugg}
                          onClick={() => setNewFolderName(sugg)}
                          className="px-2 py-0.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#79c0ff] hover:text-white border border-[#30363d] text-[10px] font-mono transition-all active:scale-95"
                        >
                          + {sugg}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Starter File to initialize folder */}
                <div>
                  <label className="block text-xs font-mono text-[#8b949e] mb-1.5">
                    Initialize Folder With
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    {[
                      { id: 'gitkeep', label: '.gitkeep', desc: 'Empty Folder' },
                      { id: 'kotlin', label: 'Module.kt', desc: 'Kotlin' },
                      { id: 'cpp', label: 'native.cpp', desc: 'C++ NDK' },
                      { id: 'bash', label: 'script.sh', desc: 'Shell' },
                      { id: 'markdown', label: 'README.md', desc: 'Docs' },
                      { id: 'json', label: 'config.json', desc: 'Config' }
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
                        <div className="font-bold">{item.label}</div>
                        <div className="text-[9px] opacity-75">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Custom First File Name */}
                <div>
                  <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                    Custom First File Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={folderFirstFileName}
                    onChange={(e) => setFolderFirstFileName(e.target.value)}
                    placeholder={folderInitType === 'gitkeep' ? '.gitkeep' : 'Leave blank for default starter file'}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-1.5 text-xs font-mono text-white placeholder-[#484f58] focus:outline-none focus:border-[#3fb950]"
                  />
                </div>

                {/* Live Directory Path Preview */}
                <div className="p-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-[11px] font-mono text-[#8b949e] flex items-center gap-2">
                  <Folder className="h-3.5 w-3.5 text-[#3fb950] shrink-0" />
                  <div className="truncate">
                    <span className="text-[#8b949e]">Folder Path: </span>
                    <span className="text-[#3fb950] font-bold">
                      sandbox/{parentFolder ? `${parentFolder}/` : ''}{newFolderName || 'my_folder'}/
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#30363d]">
                  <button
                    type="button"
                    onClick={() => setIsNewItemModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-[#21262d] text-[#8b949e] hover:text-white text-xs font-mono transition-colors"
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
            )}
          </div>
        </div>
      )}

      {/* AI Provider & Settings Modal */}
      <AiProviderSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
        currentConfig={aiConfig}
        onSaveConfig={(newCfg) => {
          setAiConfig(newCfg);
          saveAiConfig(newCfg);
        }}
      />

      {/* Sandbox File System Undo/Redo & Version Timeline History Modal */}
      <UndoRedoHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        snapshots={historyState.snapshots}
        currentIndex={historyState.currentIndex}
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onJumpToSnapshot={handleJumpToSnapshot}
        onClearHistory={handleClearHistory}
        currentFileContent={editorContent}
      />
    </div>
  );
};
