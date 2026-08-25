import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Image as ImageIcon
} from 'lucide-react';
import { ProjectFile, AiCopilotConfig } from '../types';
import confetti from 'canvas-confetti';
import {
  getSavedAiConfig,
  saveAiConfig,
  requestAiAssist,
  AI_PROVIDERS
} from '../utils/aiCopilotService';
import { AiProviderSettingsModal } from './AiProviderSettingsModal';
import { CameraCodeScannerModal } from './CameraCodeScannerModal';
import {
  parseUploadedFiles,
  parseZipArchive,
  createNewSandboxFile
} from '../utils/sandboxFileManager';

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
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  codeSnippet?: string;
  providerBadge?: string;
  timestamp: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'protected';

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
}) => {
  // Workspace Scope: 'sandbox' (editable user files) or 'app' (system storage files)
  const [workspaceScope, setWorkspaceScope] = useState<'sandbox' | 'app'>('sandbox');

  const activeFileList = workspaceScope === 'sandbox' ? sandboxFiles : appFiles;

  const [selectedFilePath, setSelectedFilePath] = useState<string>(() => {
    if (activeFilePath) return activeFilePath;
    return sandboxFiles[0]?.path || appFiles[0]?.path || '';
  });

  const [editorContent, setEditorContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeLine, setActiveLine] = useState<number>(1);

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

  // New File Modal state
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileTemplate, setNewFileTemplate] = useState<'kotlin' | 'cpp' | 'bash' | 'markdown' | 'json'>('kotlin');

  // AI Copilot Provider & Settings State
  const [aiConfig, setAiConfig] = useState<AiCopilotConfig>(getSavedAiConfig());
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);

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
      if (workspaceScope === 'app') {
        setSaveStatus('protected');
      } else {
        setSaveStatus('saved');
        setLastSavedTime('Just now');
      }

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

  // Global Keyboard Shortcuts (Ctrl+F for Search, Ctrl+S for Save, Esc to close Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (currentFile && workspaceScope === 'sandbox') {
          onUpdateFileContent(currentFile.path, editorContent);
          setSaveStatus('saved');
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, currentFile, workspaceScope, editorContent, onUpdateFileContent]);

  // Automatic Debounced Auto-Save Engine for sandbox files
  const triggerAutoSave = useCallback(
    (newContent: string) => {
      if (!currentFile || workspaceScope !== 'sandbox') return;

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
      }, 700);
    },
    [currentFile, workspaceScope, onUpdateFileContent]
  );

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
    if (!searchQuery || workspaceScope !== 'sandbox' || totalMatches === 0) return;
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
    triggerAutoSave(newContent);
  };

  const handleReplaceAll = () => {
    if (!searchQuery || workspaceScope !== 'sandbox') return;
    const regex = new RegExp(
      searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      isMatchCase ? 'g' : 'gi'
    );
    const newContent = editorContent.replace(regex, replaceQuery);
    setEditorContent(newContent);
    triggerAutoSave(newContent);
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
      setWorkspaceScope('sandbox');

      const zipFile = droppedFiles.find((f) => f.name.endsWith('.zip'));
      if (zipFile && droppedFiles.length === 1) {
        try {
          const parsed = await parseZipArchive(zipFile);
          if (parsed.length > 0) {
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
      setWorkspaceScope('sandbox');
      try {
        const parsed = await parseUploadedFiles(e.target.files);
        if (parsed.length > 0) {
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

  // Import ZIP Archive
  const handleZipInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsImporting(true);
      setWorkspaceScope('sandbox');
      try {
        const zipFile = e.target.files[0];
        const parsed = await parseZipArchive(zipFile);
        if (parsed.length > 0) {
          if (onAddMultipleSandboxFiles) onAddMultipleSandboxFiles(parsed);
          else if (onAddSandboxFile) parsed.forEach(onAddSandboxFile);
          setSelectedFilePath(parsed[0].path);
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.4 } });
        }
      } catch (err) {
        console.error('Failed to import ZIP:', err);
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
      setWorkspaceScope('sandbox');
      try {
        const parsed = await parseUploadedFiles(e.target.files);
        if (parsed.length > 0) {
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

    let finalName = newFileName.trim();
    if (!finalName.includes('.')) {
      if (newFileTemplate === 'kotlin') finalName += '.kt';
      else if (newFileTemplate === 'cpp') finalName += '.cpp';
      else if (newFileTemplate === 'bash') finalName += '.sh';
      else if (newFileTemplate === 'markdown') finalName += '.md';
      else if (newFileTemplate === 'json') finalName += '.json';
    }

    let initialTemplate = `// ${finalName}\n// Umakraft User Sandbox\n\n`;
    if (newFileTemplate === 'kotlin' || finalName.endsWith('.kt')) {
      initialTemplate += `fun main() {\n    println("Hello from ${finalName}!")\n}\n`;
    } else if (newFileTemplate === 'cpp' || finalName.endsWith('.cpp')) {
      initialTemplate = `#include <iostream>\n\nint main() {\n    std::cout << "Hello from ${finalName}!" << std::endl;\n    return 0;\n}\n`;
    } else if (newFileTemplate === 'bash' || finalName.endsWith('.sh')) {
      initialTemplate = `#!/usr/bin/env bash\necho "Running ${finalName}..."\n`;
    } else if (newFileTemplate === 'json' || finalName.endsWith('.json')) {
      initialTemplate = `{\n  "name": "${finalName}",\n  "version": "1.0.0"\n}\n`;
    }

    const created = createNewSandboxFile(finalName, initialTemplate);
    if (onAddSandboxFile) {
      onAddSandboxFile(created);
    }
    setWorkspaceScope('sandbox');
    setSelectedFilePath(created.path);
    setIsNewFileModalOpen(false);
    setNewFileName('');
    setSaveStatus('saved');
    setLastSavedTime('Just now');
    confetti({ particleCount: 30, spread: 45, origin: { y: 0.5 } });
  };

  // Dedicated Code Diagnostic Action
  const handleCheckCodeAndDiagnose = (customDiagnosticPrompt?: string) => {
    if (onOpenAiModal) onOpenAiModal();
    const promptToRun =
      customDiagnosticPrompt ||
      "Check this code thoroughly. Tell me what's wrong, why it's an issue, how it should be done correctly, and provide the fully fixed code.";
    handleSendAiPrompt(promptToRun);
  };

  // AI Prompt Dispatcher (With Camera and Image Vision Support)
  const handleSendAiPrompt = async (
    customPrompt?: string,
    imageAttachment?: { data: string; mimeType?: string }
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
      const result = await requestAiAssist({
        prompt: textToSend,
        currentFile: currentFile?.path || undefined,
        context: currentFile
          ? `File: ${currentFile.path} (${currentFile.language})\n\nCode:\n\`\`\`${currentFile.language}\n${editorContent.slice(0, 8000)}\n\`\`\``
          : 'Workspace (No file currently selected)',
        configOverride: aiConfig,
        image: imageAttachment
      });

      const replyText = result.reply || 'No code generated.';
      const codeMatch = replyText.match(/```(?:kotlin|java|cpp|c|yaml|groovy|json|bash|sh|xml|kts)?\n([\s\S]*?)```/);
      const extractedCode = codeMatch ? codeMatch[1].trim() : null;

      if (extractedCode) {
        setLastSuggestedCode(extractedCode);
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
    if (currentFile && workspaceScope === 'sandbox') {
      onUpdateFileContent(currentFile.path, code);
      setSaveStatus('saved');
      setLastSavedTime('Just now (AI Patch)');
    }
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.4 } });
  };

  const handleSaveManualEdit = () => {
    if (currentFile && workspaceScope === 'sandbox') {
      onUpdateFileContent(currentFile.path, editorContent);
      setSaveStatus('saved');
      setLastSavedTime('Just now');
    }
    setIsEditing(false);
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
    a.download = currentFile?.name || 'source-code.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy app system file to sandbox for editing
  const handleCopyAppFileToSandbox = () => {
    if (!currentFile) return;
    const newPath = `sandbox/${currentFile.name}`;
    const copyFile: ProjectFile = {
      ...currentFile,
      path: newPath,
      isSandbox: true,
      origin: 'user',
      storageScope: 'sandbox_user'
    };
    if (onAddSandboxFile) {
      onAddSandboxFile(copyFile);
    }
    setWorkspaceScope('sandbox');
    setSelectedFilePath(newPath);
    setSaveStatus('saved');
    setLastSavedTime('Just now');
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.5 } });
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
        accept=".zip"
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
        {/* Top Header Strip: Scope Switcher + Recent List + Tab View Toggle + File Tabs + Consolidated Actions */}
        <div className="bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-2 pt-1.5 pb-0 gap-2 flex-shrink-0 relative">
          {/* Left: Scope Toggle + Recent List + View Mode & File Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0 pr-1">
            {/* Scope Switcher Pill: Sandbox vs App Files */}
            <div className="flex items-center bg-[#0d1117] p-0.5 rounded-xl border border-[#30363d] shrink-0 mr-0.5">
              <button
                onClick={() => {
                  setWorkspaceScope('sandbox');
                  if (sandboxFiles.length > 0) handleSelectFileWithToast(sandboxFiles[0]);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                  workspaceScope === 'sandbox'
                    ? 'bg-[#1f6feb] text-white shadow-sm'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
                title="User Sandbox Files"
              >
                <Code2 className="h-3 w-3" />
                <span className="hidden sm:inline">Sandbox</span>
                <span className="text-[10px] opacity-80 font-mono">({sandboxFiles.length})</span>
              </button>
              <button
                onClick={() => {
                  setWorkspaceScope('app');
                  if (appFiles.length > 0) handleSelectFileWithToast(appFiles[0]);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                  workspaceScope === 'app'
                    ? 'bg-[#238636] text-white shadow-sm'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
                title="App System Storage Files"
              >
                <HardDrive className="h-3 w-3" />
                <span className="hidden sm:inline">App Storage</span>
                <span className="text-[10px] opacity-80 font-mono">({appFiles.length})</span>
              </button>
            </div>

            {/* Recent List Dropdown Pill */}
            <div className="relative shrink-0" ref={recentDropdownRef}>
              <button
                onClick={() => setIsRecentDropdownOpen((prev) => !prev)}
                title="Recent files history"
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-all border ${
                  isRecentDropdownOpen
                    ? 'bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff]/40 shadow-sm'
                    : 'bg-[#0d1117] hover:bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] border-[#30363d]'
                }`}
              >
                <History className="h-3 w-3 text-[#58a6ff]" />
                <span className="text-[11px] hidden xs:inline">Recent</span>
                {recentFilePaths.length > 0 && (
                  <span className="text-[9px] px-1 rounded bg-[#21262d] text-[#58a6ff] font-bold">
                    {recentFilePaths.length}
                  </span>
                )}
                <ChevronDown className="h-2.5 w-2.5 text-[#8b949e]" />
              </button>

              {/* Recent Files Dropdown Popup */}
              {isRecentDropdownOpen && (
                <div className="absolute left-0 mt-1 w-64 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
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
                        const fileObj =
                          activeFileList.find((f) => f.path === path) ||
                          sandboxFiles.find((f) => f.path === path) ||
                          appFiles.find((f) => f.path === path);

                        const displayName = fileObj ? fileObj.name : path.split('/').pop() || path;
                        const meta = getFileVisualInfo(displayName, fileObj?.language);
                        const isCurrent = currentFile?.path === path;

                        return (
                          <button
                            key={path}
                            onClick={() => {
                              if (fileObj) {
                                if (sandboxFiles.some((f) => f.path === path)) {
                                  setWorkspaceScope('sandbox');
                                } else if (appFiles.some((f) => f.path === path)) {
                                  setWorkspaceScope('app');
                                }
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

            {/* View Mode Toggle: Icon Only (Fit All Files) vs Full */}
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
                  ? 'Currently in Icon-Only Mode (Fits All Files). Tap to expand names.'
                  : 'Currently in Expanded Mode. Tap to switch to Icon-Only to fit all files.'
              }
              className={`p-1 px-1.5 rounded-lg text-xs font-mono flex items-center gap-1 border shrink-0 transition-all active:scale-95 ${
                tabViewMode === 'icon_only'
                  ? 'bg-[#21262d] text-[#e3b341] border-[#e3b341]/40 hover:bg-[#30363d]'
                  : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white'
              }`}
            >
              {tabViewMode === 'icon_only' ? (
                <>
                  <LayoutGrid className="h-3 w-3 text-[#e3b341]" />
                  <span className="text-[10px] font-bold text-[#e3b341] hidden sm:inline">Icon Mode</span>
                </>
              ) : (
                <>
                  <List className="h-3 w-3 text-[#8b949e]" />
                  <span className="text-[10px] font-semibold hidden sm:inline">Expanded</span>
                </>
              )}
            </button>

            {/* Visual File Tabs */}
            {activeFileList.length === 0 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-xl text-xs font-mono text-[#8b949e] italic">
                <span>(No files in this scope)</span>
              </div>
            ) : (
              activeFileList.map((file) => {
                const isSelected = file.path === currentFile?.path;
                const meta = getFileVisualInfo(file.name, file.language);

                if (tabViewMode === 'icon_only') {
                  return (
                    <div
                      key={file.path}
                      className={`relative group flex items-center justify-center h-8 min-w-[36px] px-1 rounded-t-xl transition-all font-mono shrink-0 border-t border-x ${
                        isSelected
                          ? `bg-[#0d1117] ${meta.borderColor} text-[#f0f6fc] font-bold shadow-md ring-1 ring-[#58a6ff]/30`
                          : 'bg-[#161b22] border-transparent text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
                      }`}
                    >
                      <button
                        onClick={() => handleSelectFileWithToast(file)}
                        title={`${file.name} • ${meta.typeDesc}\nTap to open (Path: ${file.path})`}
                        className="flex items-center justify-center p-1 rounded-md transition-all active:scale-95"
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
                      {workspaceScope === 'sandbox' && onDeleteSandboxFile && (
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
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-t-xl text-xs font-mono transition-all shrink-0 border-t border-x ${
                      isSelected
                        ? `bg-[#0d1117] ${meta.borderColor} text-[#f0f6fc] border-b-0 font-bold shadow-sm ring-1 ring-[#58a6ff]/20`
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
                    {workspaceScope === 'sandbox' && onDeleteSandboxFile && (
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

            {/* Plus New File Button (Only in Sandbox) */}
            {workspaceScope === 'sandbox' && (
              <button
                onClick={() => setIsNewFileModalOpen(true)}
                title="Create New File"
                className="p-1 px-2 rounded-t-xl bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-white text-xs font-mono flex items-center gap-1 shrink-0 transition-all border border-b-0 border-[#30363d]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold hidden xs:inline">New</span>
              </button>
            )}
          </div>

          {/* Right: Consolidated Action Toolbar */}
          <div className="flex items-center gap-1.5 pb-1 flex-shrink-0">
            {/* AI Check Code & Diagnose Button */}
            <button
              onClick={() => handleCheckCodeAndDiagnose()}
              title="AI Code Inspector: Analyze code for bugs, errors & recommended fixes (Local & Cloud AI)"
              className="p-1.5 px-2.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#e3b341] hover:text-[#f0e6c8] border border-[#e3b341]/40 text-xs font-mono flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#e3b341]" />
              <span className="text-[11px] font-bold">Check Code</span>
            </button>

            {/* Search Toggle Button */}
            <button
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (!isSearchOpen) {
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }
              }}
              title="Search and Replace (Ctrl+F)"
              className={`p-1.5 px-2 rounded-xl text-xs font-mono flex items-center gap-1 border transition-all active:scale-95 shadow-sm ${
                isSearchOpen
                  ? 'bg-[#1f6feb] text-white border-[#388bfd]'
                  : 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white border-[#30363d]'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold hidden md:inline">Find</span>
            </button>

            {/* Unified Import Dropdown Menu */}
            <div className="relative" ref={importMenuRef}>
              <button
                onClick={() => setIsImportMenuOpen((prev) => !prev)}
                title="Import files, folder or ZIP"
                className="p-1.5 px-2.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-white border border-[#30363d] text-xs font-mono flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold hidden sm:inline">Import</span>
                <ChevronDown className="h-3 w-3 text-[#8b949e]" />
              </button>

              {/* Dropdown Menu Content */}
              {isImportMenuOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
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

            {/* Edit Mode Toggle Button (Sandbox) OR Copy to Sandbox Button (App Storage) */}
            {workspaceScope === 'sandbox' && currentFile && (
              <button
                onClick={() => {
                  if (isEditing) {
                    handleSaveManualEdit();
                  } else {
                    setIsEditing(true);
                  }
                }}
                title={isEditing ? 'Done Editing (Auto-Saved)' : 'Edit File'}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border active:scale-95 ${
                  isEditing
                    ? 'bg-[#238636] hover:bg-[#2ea043] text-white border-[#3fb950]/50 shadow-sm'
                    : 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white border-[#30363d]'
                }`}
              >
                {isEditing ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span className="text-[11px]">Done</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="h-3.5 w-3.5 text-[#58a6ff]" />
                    <span className="text-[11px] hidden xs:inline">Edit</span>
                  </>
                )}
              </button>
            )}

            {workspaceScope === 'app' && currentFile && (
              <button
                onClick={handleCopyAppFileToSandbox}
                title="Copy file to Sandbox for editing"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-white border border-[#30363d] text-xs font-semibold transition-all active:scale-95 shadow-sm"
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="text-[11px] hidden xs:inline">Copy to Edit</span>
              </button>
            )}

            {/* Single AI Engine Model Pill */}
            <button
              onClick={() => setIsAiSettingsOpen(true)}
              title="Configure AI Engine & Models"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[11px] font-mono text-[#c9d1d9] hover:text-white transition-all active:scale-95 shadow-sm"
            >
              <Bot className="h-3.5 w-3.5 text-[#bc8cff]" />
              <span className="font-semibold text-[#bc8cff] hidden sm:inline">
                {AI_PROVIDERS[aiConfig.provider]?.shortName || 'Qwen 1.5'}
              </span>
              <Sliders className="h-3 w-3 text-[#8b949e]" />
            </button>
          </div>
        </div>

        {/* Real-time In-Editor Search & Replace Toolbar */}
        {isSearchOpen && (
          <div className="bg-[#161b22] border-b border-[#30363d] px-3 py-2 flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-100 shadow-md">
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

                {/* Toggle Replace in Sandbox */}
                {workspaceScope === 'sandbox' && (
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
            {showReplace && workspaceScope === 'sandbox' && (
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

        {/* Secondary Info Ribbon: Scope, Visual Extension Badge, File Path & Auto-Save Indicator */}
        <div className="px-3 py-1.5 bg-[#0d1117] border-b border-[#21262d] flex items-center justify-between gap-2 text-[11px] font-mono text-[#8b949e]">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                workspaceScope === 'sandbox'
                  ? 'bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30'
                  : 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30'
              }`}
            >
              {workspaceScope === 'sandbox' ? 'USER SANDBOX' : 'APP STORAGE'}
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

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Real-time Auto-Save Status Badge */}
            {workspaceScope === 'sandbox' ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#161b22] border border-[#30363d] text-[10px]">
                {saveStatus === 'saving' ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-[#e3b341] animate-pulse" />
                    <span className="text-[#e3b341] font-semibold">Auto-saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-[#3fb950]" />
                    <span className="text-[#3fb950] font-semibold">Auto-Saved</span>
                    <span className="text-[#8b949e] hidden sm:inline">&bull; {lastSavedTime}</span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#161b22] border border-[#30363d] text-[10px] text-[#3fb950]">
                <ShieldCheck className="h-3 w-3" />
                <span className="font-semibold">System File</span>
              </div>
            )}

            {currentFile && (
              <>
                <span className="text-[10px] text-[#8b949e] hidden xs:inline">
                  {lines.length} lines &bull; UTF-8
                </span>
                <button
                  onClick={handleCopyCode}
                  title="Copy File Content"
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
              </>
            )}
          </div>
        </div>

        {/* Permanent Code Canvas Area */}
        <div ref={codeViewerRef} className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#0d1117]">
          {activeFileList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#8b949e]">
              <Code2 className="h-10 w-10 text-[#58a6ff]/40 mb-3" />
              <h3 className="text-sm font-bold text-[#f0f6fc] font-mono">
                No files in this workspace yet
              </h3>
              <p className="text-xs text-[#8b949e] max-w-sm mt-1 mb-4 font-mono">
                Create a new file, upload code, or switch to App Storage to view internal system files.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewFileModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1f6feb] hover:bg-[#1158c7] text-white text-xs font-semibold transition-all shadow-md"
                >
                  + Create First File
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
          ) : (
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

        {/* AI Copilot Drawer Overlay */}
        {isAiModalOpen && (
          <div className="absolute inset-0 bg-[#161b22]/98 backdrop-blur-md z-20 flex flex-col p-3 overflow-hidden border border-[#bc8cff]/30 shadow-2xl rounded-2xl animate-in fade-in duration-150">
            {/* AI Overlay Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#30363d] flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-xl bg-[#1f6feb]/20 border border-[#1f6feb]/40 text-[#58a6ff]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#f0f6fc]">Umakraft AI Copilot</h4>
                    <button
                      onClick={() => setIsAiSettingsOpen(true)}
                      className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#58a6ff] hover:text-[#79c0ff] flex items-center gap-1 transition-colors"
                      title="Switch AI Provider or update API Key"
                    >
                      <Bot className="h-2.5 w-2.5" />
                      <span>{AI_PROVIDERS[aiConfig.provider]?.shortName || 'Qwen 1.5 Local'}</span>
                      <Sliders className="h-2.5 w-2.5 text-[#8b949e]" />
                    </button>
                  </div>
                  <p className="text-[10px] text-[#8b949e] truncate flex items-center gap-1">
                    <span>Target: {currentFile?.name || 'Workspace'}</span>
                    <span>&bull;</span>
                    <span className={workspaceScope === 'sandbox' ? 'text-[#58a6ff] font-semibold' : 'text-[#d29922]'}>
                      {workspaceScope === 'sandbox' ? 'Sandbox (Editable)' : 'App System (Read-Only)'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsAiSettingsOpen(true)}
                  title="Configure AI Provider & API Keys"
                  className="p-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] min-h-[32px] min-w-[32px] flex items-center justify-center border border-[#30363d]"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (onCloseAiModal) onCloseAiModal();
                  }}
                  title="Close Copilot Panel"
                  className="p-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white min-h-[32px] min-w-[32px] flex items-center justify-center border border-[#30363d]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Action Prompt Chips (Code Checking, Camera Vision & Debugging) */}
            <div className="flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-none flex-shrink-0">
              <button
                onClick={() => setIsCameraScannerOpen(true)}
                disabled={isAiLoading}
                className="px-2.5 py-1 rounded-xl bg-[#58a6ff]/15 hover:bg-[#58a6ff]/25 text-[10px] font-mono text-[#58a6ff] hover:text-white border border-[#58a6ff]/40 shrink-0 active:scale-95 disabled:opacity-50 flex items-center gap-1 font-bold shadow-sm"
              >
                <Camera className="h-3 w-3 text-[#58a6ff]" />
                📷 Scan Code Photo
              </button>
              <button
                onClick={() => handleSendAiPrompt("Check this code thoroughly. Tell me what's wrong, why it's an issue, how it should be done correctly, and provide the fully fixed code.")}
                disabled={isAiLoading}
                className="px-2.5 py-1 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[10px] font-mono text-[#e3b341] hover:text-[#f0e6c8] border border-[#e3b341]/40 shrink-0 active:scale-95 disabled:opacity-50 flex items-center gap-1 font-bold shadow-sm"
              >
                <ShieldCheck className="h-3 w-3 text-[#e3b341]" />
                🔍 Check Code & Fix
              </button>
              <button
                onClick={() => handleSendAiPrompt("Review this code for Android 10+ (API 29-34) Scoped Storage compliance, main thread blocking, and memory leaks. Explain what's wrong and how to fix.")}
                disabled={isAiLoading}
                className="px-2.5 py-1 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[10px] font-mono text-[#3fb950] border border-[#30363d] shrink-0 active:scale-95 disabled:opacity-50 flex items-center gap-1"
              >
                ⚡ Android 10+ Audit
              </button>
              <button
                onClick={() => handleSendAiPrompt('Search and explain all functions, classes, and logic in this file.')}
                disabled={isAiLoading}
                className="px-2.5 py-1 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[10px] font-mono text-[#58a6ff] border border-[#30363d] shrink-0 active:scale-95 disabled:opacity-50 flex items-center gap-1"
              >
                <Search className="h-3 w-3" />
                AI Code Search
              </button>
              <button
                onClick={() => handleSendAiPrompt('Refactor and optimize this file for maximum execution speed, clean architecture, and thread safety.')}
                disabled={isAiLoading}
                className="px-2.5 py-1 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[10px] font-mono text-[#ffa657] border border-[#30363d] shrink-0 active:scale-95 disabled:opacity-50"
              >
                🚀 Optimize
              </button>
              <button
                onClick={() => handleSendAiPrompt('Explain line by line what this code does in clear detail.')}
                disabled={isAiLoading}
                className="px-2.5 py-1 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[10px] font-mono text-[#d2a8ff] border border-[#30363d] shrink-0 active:scale-95 disabled:opacity-50"
              >
                📖 Explain
              </button>
            </div>

            {/* Messages Chat Scroll Area */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-1 font-mono text-xs select-text">
              {messages.map((msg) => {
                const isDiagnostic = msg.text.includes("What's Wrong") || msg.text.includes("Identified");
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1 text-[10px] text-[#8b949e]">
                      <span>{msg.sender === 'user' ? 'You' : msg.providerBadge || 'AI Copilot'}</span>
                      <span>&bull;</span>
                      <span>{msg.timestamp}</span>
                      {isDiagnostic && msg.sender === 'ai' && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/30 text-[9px] font-bold">
                          Code Diagnosis & Fix
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[94%] p-3 rounded-2xl ${
                        msg.sender === 'user'
                          ? 'bg-[#1f6feb] text-white rounded-tr-sm'
                          : 'bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded-tl-sm shadow-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                      {msg.codeSnippet && (
                        <div className="mt-2.5 pt-2 border-t border-[#30363d]">
                          <div className="flex items-center justify-between pb-1.5 text-[10px] text-[#8b949e]">
                            <span className="font-semibold text-[#f0f6fc]">Suggested Code Patch:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.codeSnippet!);
                                  confetti({ particleCount: 15, spread: 30 });
                                }}
                                className="px-2 py-0.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white font-semibold text-[10px] flex items-center gap-1 border border-[#30363d] transition-all"
                                title="Copy code snippet to clipboard"
                              >
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </button>
                              <button
                                onClick={() => handleApplySuggestedCode(msg.codeSnippet!)}
                                className="px-2 py-0.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-[10px] flex items-center gap-1 active:scale-95 transition-all shadow"
                                title="Apply patch directly into active file & auto-save"
                              >
                                <Check className="h-3 w-3" />
                                <span>Apply & Auto-Save</span>
                              </button>
                            </div>
                          </div>
                          <pre className="p-2.5 bg-[#161b22] border border-[#30363d] rounded-xl overflow-x-auto text-[11px] text-[#79c0ff]">
                            <code>{msg.codeSnippet}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isAiLoading && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#0d1117] border border-[#30363d] text-[#58a6ff] w-fit">
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span className="text-xs">
                    {AI_PROVIDERS[aiConfig.provider]?.shortName || 'Local AI'} is thinking...
                  </span>
                </div>
              )}
            </div>

            {/* Prompt Input Box */}
            <div className="pt-2 border-t border-[#30363d] flex-shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                title="Scan Code with Camera or Upload Photo"
                className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-[#79c0ff] border border-[#30363d] transition-all active:scale-95 flex items-center justify-center shrink-0 min-h-[36px] min-w-[36px]"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendAiPrompt();
                  }
                }}
                placeholder={`Ask ${AI_PROVIDERS[aiConfig.provider]?.shortName || 'AI'} to search, edit, or explain...`}
                disabled={isAiLoading}
                className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs font-mono text-[#f0f6fc] placeholder-[#484f58] focus:outline-none focus:border-[#bc8cff]"
              />
              <button
                onClick={() => handleSendAiPrompt()}
                disabled={!prompt.trim() || isAiLoading}
                className="p-2 px-3 rounded-xl bg-[#bc8cff] hover:bg-[#a371f7] text-white disabled:opacity-40 transition-all font-semibold active:scale-95 shadow-md flex items-center gap-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">Ask</span>
              </button>
            </div>
          </div>
        )}
      </div>

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

      {/* Create New File Modal */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                <FilePlus2 className="h-5 w-5 text-[#58a6ff]" />
                <h3 className="text-sm font-bold text-white font-mono">Create New Sandbox File</h3>
              </div>
              <button
                onClick={() => setIsNewFileModalOpen(false)}
                className="p-1 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFileSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#8b949e] mb-1.5">
                  File Name (e.g. MyComponent.kt, script.sh, config.json)
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="MyCodeFile.kt"
                  autoFocus
                  required
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8b949e] mb-1.5">
                  Starter Template
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  {(['kotlin', 'cpp', 'bash', 'json', 'markdown'] as const).map((tmpl) => (
                    <button
                      type="button"
                      key={tmpl}
                      onClick={() => setNewFileTemplate(tmpl)}
                      className={`p-2 rounded-xl border text-center transition-all capitalize ${
                        newFileTemplate === tmpl
                          ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb] font-bold'
                          : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-white'
                      }`}
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setIsNewFileModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#21262d] text-[#8b949e] hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-mono font-bold shadow-md transition-all active:scale-95"
                >
                  Create File
                </button>
              </div>
            </form>
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
    </div>
  );
};
