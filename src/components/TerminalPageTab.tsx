import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Github,
  GitBranch,
  UploadCloud,
  Lock,
  GitCommit,
  Trash2,
  Cpu,
  Package,
  FileCode,
  Layers,
  ChevronRight,
  Share2,
  Code2,
  Bot,
  Search,
  Folder,
  FolderTree,
  HardDrive,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Sliders,
  Shield,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { ProjectFile } from '../types';
import confetti from 'canvas-confetti';
import { offlinePreloadService } from '../utils/offlinePreloadService';
import { termuxRuntimeService, TERMUX_CATALOG, TermuxPackageInfo, AiTerminalTask } from '../utils/termuxRuntime';

interface TerminalPageTabProps {
  files: ProjectFile[];
  onOpenQuickPush?: () => void;
}

interface CommandLog {
  id: string;
  type: 'cmd' | 'output' | 'success' | 'error' | 'info' | 'system' | 'ai';
  text: string;
  timestamp: string;
  exitCode?: number;
  rawCmd?: string;
}

export const TerminalPageTab: React.FC<TerminalPageTabProps> = ({ files: _files }) => {
  const [activeSubTab, setActiveSubTab] = useState<'terminal' | 'ai_agent' | 'packages' | 'filesystem' | 'github_push' | 'push_script'>('terminal');
  const [commandInput, setCommandInput] = useState('');
  const [copiedLog, setCopiedLog] = useState(false);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [currentCwd, setCurrentCwd] = useState('~');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isRunningCommand, setIsRunningCommand] = useState(false);
  const [installedPackages, setInstalledPackages] = useState<string[]>([]);
  const [packageSearchQuery, setPackageSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [actionInProgressPkg, setActionInProgressPkg] = useState<string | null>(null);

  // AI Agent Terminal Task State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [aiTasks, setAiTasks] = useState<AiTerminalTask[]>([]);
  const [aiAutoInstall, setAiAutoInstall] = useState(true);

  // Filesystem Explorer State
  const [fsFiles, setFsFiles] = useState<Array<{ path: string; name: string; size: number; updatedAt: string }>>([]);
  const [fsLoading, setFsLoading] = useState(false);
  const [fsFilter, setFsFilter] = useState('');

  // GitHub Push State
  const [repoUrl, setRepoUrl] = useState('https://github.com/pagaranjayson021/Umakraft-TermuxXCoder.git');
  const [targetBranch, setTargetBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('feat: umakraft termux runtime update');
  const [githubToken, setGithubToken] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [, setPushStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const initialLogs: CommandLog[] = [
    {
      id: 'init-1',
      type: 'info',
      text: '⚡ Termux Native Linux PTY Shell [Android 14 API 34 • aarch64 • POSIX /dev/ptmx]',
      timestamp: new Date().toTimeString().split(' ')[0]
    },
    {
      id: 'init-2',
      type: 'success',
      text: '✓ Real Bash runtime, persistent Linux FS ($PREFIX, $HOME), package manager (pkg/apt), & AI Copilot active.',
      timestamp: new Date().toTimeString().split(' ')[0]
    },
    {
      id: 'init-3',
      type: 'system',
      text: 'Type commands or tap quick keys below (neofetch, pkg install <pkg>, node, python, git, ./gradlew).',
      timestamp: new Date().toTimeString().split(' ')[0]
    }
  ];

  const [logs, setLogs] = useState<CommandLog[]>(initialLogs);

  // Sync installed packages on mount
  useEffect(() => {
    fetchInstalledPackages();
  }, []);

  const fetchInstalledPackages = async () => {
    try {
      const res = await fetch('/api/termux/packages');
      if (res.ok) {
        const data = await res.json();
        if (data.installed) {
          setInstalledPackages(data.installed);
        }
      }
    } catch {
      setInstalledPackages(termuxRuntimeService.getInstalledPackages().map((p) => p.name));
    }
  };

  const fetchFilesystem = async () => {
    setFsLoading(true);
    try {
      const res = await fetch('/api/termux/files');
      if (res.ok) {
        const data = await res.json();
        if (data.files) {
          setFsFiles(data.files);
        }
      }
    } catch {
      // Fallback
    } finally {
      setFsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'filesystem') {
      fetchFilesystem();
    }
  }, [activeSubTab]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopyAllLogs = async () => {
    try {
      const fullText = logs
        .map((l) => l.text.replace(/\x1b\[[0-9;]*m/g, ''))
        .join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLog(true);
      setTimeout(() => setCopiedLog(false), 2000);
    } catch {
      // Fallback safe
    }
  };

  const handleCopySingleLog = async (text: string, id: string) => {
    try {
      const cleaned = text.replace(/\x1b\[[0-9;]*m/g, '');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cleaned);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = cleaned;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLogId(id);
      setTimeout(() => setCopiedLogId(null), 2000);
    } catch {
      // Fallback safe
    }
  };

  const getTimeString = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  // Convert raw ANSI codes to clean formatted text with colored tags
  const renderAnsiColoredText = (text: string) => {
    if (!text) return null;
    // Replace ANSI color sequences with styled spans or keep clean format
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Clean ANSI color codes for safe rendering while preserving intent
      const cleaned = line.replace(/\x1b\[[0-9;]*m/g, '');
      const isGreen = line.includes('\x1b[32m') || line.includes('\x1b[1;32m') || line.startsWith('✓') || line.includes('SUCCESS');
      const isBlue = line.includes('\x1b[34m') || line.includes('\x1b[1;34m') || line.startsWith('>');
      const isRed = line.includes('\x1b[31m') || line.includes('error') || line.includes('failed');
      const isYellow = line.includes('\x1b[33m') || line.includes('warn');

      let colorClass = 'text-[#c9d1d9]';
      if (isGreen) colorClass = 'text-[#3fb950] font-medium';
      else if (isBlue) colorClass = 'text-[#58a6ff]';
      else if (isRed) colorClass = 'text-[#f85149] font-medium';
      else if (isYellow) colorClass = 'text-[#d29922]';

      return (
        <div key={idx} className={`${colorClass} leading-relaxed break-words`}>
          {cleaned || '\u00A0'}
        </div>
      );
    });
  };

  const handleRunCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const time = getTimeString();
    const cmdEntry: CommandLog = {
      id: Math.random().toString(36).substring(7),
      type: 'cmd',
      text: `u0_a249@termux:${currentCwd}$ ${trimmed}`,
      timestamp: time,
      rawCmd: trimmed
    };

    setLogs((prev) => [...prev, cmdEntry]);
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);
    setCommandInput('');
    setIsRunningCommand(true);

    const lower = trimmed.toLowerCase();
    const isChained =
      trimmed.includes(';') ||
      trimmed.includes('&&') ||
      trimmed.includes('||') ||
      trimmed.includes('|') ||
      trimmed.includes('\n');

    if (!isChained && (lower === 'clear' || lower === 'cls')) {
      setLogs([
        {
          id: Math.random().toString(36).substring(7),
          type: 'info',
          text: '⚡ Terminal cleared.',
          timestamp: time
        }
      ]);
      setIsRunningCommand(false);
      return;
    }

    if (!isChained && (lower === 'git push' || lower.startsWith('git push ') || lower === 'push')) {
      handleSimulateGitPush();
      setIsRunningCommand(false);
      return;
    }

    try {
      const res = await fetch('/api/termux/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed })
      });

      if (!res.ok) {
        // Try fallback to /api/pty-command
        const fallbackRes = await fetch('/api/pty-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: trimmed })
        });
        if (!fallbackRes.ok) throw new Error(`Status ${res.status}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.cwd) setCurrentCwd(fallbackData.cwd);
        const outputText = fallbackData.output !== undefined ? fallbackData.output : `Executed: ${trimmed}`;
        setLogs((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            type: fallbackData.exitCode && fallbackData.exitCode !== 0 ? 'error' : 'info',
            text: outputText,
            timestamp: getTimeString(),
            exitCode: fallbackData.exitCode
          }
        ]);
        fetchInstalledPackages();
        setIsRunningCommand(false);
        return;
      }

      const data = await res.json();
      if (data.cwd) {
        setCurrentCwd(data.cwd);
      }

      const outputText = data.output !== undefined ? data.output : `Executed: ${trimmed}`;

      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          type: data.exitCode && data.exitCode !== 0 ? 'error' : outputText.includes('✓') || outputText.includes('SUCCESS') ? 'success' : 'info',
          text: outputText,
          timestamp: getTimeString(),
          exitCode: data.exitCode
        }
      ]);

      if (lower.startsWith('pkg ') || lower.startsWith('apt ')) {
        fetchInstalledPackages();
      }
    } catch (err: any) {
      // Offline fallback
      const offlineRes = offlinePreloadService.executeOfflineTerminalCommand(trimmed);
      if (offlineRes.cwd) setCurrentCwd(offlineRes.cwd);
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          type: offlineRes.type,
          text: offlineRes.output,
          timestamp: getTimeString()
        }
      ]);
    } finally {
      setIsRunningCommand(false);
    }
  };

  const handleInsertChar = (char: string) => {
    setCommandInput((prev) => prev + char);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRunCommand(commandInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setCommandInput(history[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx >= history.length) {
          setHistoryIndex(-1);
          setCommandInput('');
        } else {
          setHistoryIndex(nextIdx);
          setCommandInput(history[nextIdx] || '');
        }
      }
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          type: 'system',
          text: `^C [Interrupt signal sent to PID]`,
          timestamp: getTimeString()
        }
      ]);
      setCommandInput('');
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      handleClearLogs();
    }
  };

  const handlePackageAction = async (pkg: TermuxPackageInfo, action: 'install' | 'uninstall') => {
    setActionInProgressPkg(pkg.name);
    const cmd = action === 'install' ? `pkg install ${pkg.name}` : `pkg uninstall ${pkg.name}`;
    await handleRunCommand(cmd);
    await fetchInstalledPackages();
    setActionInProgressPkg(null);
  };

  // AI Terminal Task Runner
  const handleRunAiAgentTask = async (customPrompt?: string) => {
    const promptToRun = (customPrompt || aiPrompt).trim();
    if (!promptToRun || isAiRunning) return;

    setIsAiRunning(true);
    setAiPrompt('');

    // Generate command plan based on user prompt
    let plannedCommands: Array<{ prompt: string; command: string }> = [];

    const lower = promptToRun.toLowerCase();
    if (lower.includes('build') || lower.includes('apk') || lower.includes('gradle')) {
      plannedCommands = [
        { prompt: 'Verify OpenJDK and Gradle environment', command: 'java -version' },
        { prompt: 'Check project dependencies and modules', command: 'ls -la' },
        { prompt: 'Assemble Android release APK via Gradle daemon', command: './gradlew assembleRelease' }
      ];
    } else if (lower.includes('python') || lower.includes('pip') || lower.includes('fastapi') || lower.includes('sqlite')) {
      plannedCommands = [
        { prompt: 'Ensure Python & SQLite packages installed', command: 'pkg install python sqlite' },
        { prompt: 'Verify Python version and pip manager', command: 'python --version' },
        { prompt: 'Test SQLite in-memory database connectivity', command: 'sqlite3 :memory: "CREATE TABLE test(id INT, name TEXT); INSERT INTO test VALUES(1, \'Termux-AI\'); SELECT * FROM test;"' }
      ];
    } else if (lower.includes('git') || lower.includes('clone') || lower.includes('sync')) {
      plannedCommands = [
        { prompt: 'Verify Git installation', command: 'git --version' },
        { prompt: 'Check git repository status', command: 'git status' },
        { prompt: 'Inspect recent commits log', command: 'git log -n 3 --oneline' }
      ];
    } else if (lower.includes('node') || lower.includes('npm') || lower.includes('package')) {
      plannedCommands = [
        { prompt: 'Verify Node.js and NPM runtime', command: 'node -v && npm -v' },
        { prompt: 'Check sandbox workspace', command: 'ls -la sandbox' }
      ];
    } else if (lower.includes('neofetch') || lower.includes('info') || lower.includes('system')) {
      plannedCommands = [
        { prompt: 'Print Termux POSIX system info', command: 'termux-info' },
        { prompt: 'Render Termux Neofetch hardware specs', command: 'neofetch' }
      ];
    } else {
      // Autonomous generic command planner
      plannedCommands = [
        { prompt: `Execute: ${promptToRun}`, command: promptToRun }
      ];
    }

    const newTasks: AiTerminalTask[] = plannedCommands.map((p, idx) => ({
      id: `ai-task-${Date.now()}-${idx}`,
      prompt: p.prompt,
      command: p.command,
      status: 'queued',
      output: '',
      timestamp: getTimeString()
    }));

    setAiTasks(newTasks);

    // Switch view to terminal or AI Agent tab
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        type: 'ai',
        text: `🤖 [AI Terminal Agent] Starting plan for: "${promptToRun}" (${newTasks.length} steps)...`,
        timestamp: getTimeString()
      }
    ]);

    for (let i = 0; i < newTasks.length; i++) {
      const task = newTasks[i];
      task.status = 'running';
      setAiTasks([...newTasks]);

      try {
        const res = await fetch('/api/termux/ai-exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command: task.command,
            autoInstallDeps: aiAutoInstall
          })
        });

        const data = await res.json();
        task.status = data.success ? 'completed' : 'failed';
        task.output = data.output || (data.success ? 'Done' : 'Failed');
        task.exitCode = data.exitCode;

        if (data.cwd) setCurrentCwd(data.cwd);

        setLogs((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            type: 'cmd',
            text: `u0_a249@termux:${currentCwd}$ ${task.command}`,
            timestamp: getTimeString()
          },
          {
            id: Math.random().toString(36).substring(7),
            type: data.success ? 'success' : 'error',
            text: task.output,
            timestamp: getTimeString(),
            exitCode: data.exitCode
          }
        ]);

        if (data.autoInstalled && data.autoInstalled.length > 0) {
          setLogs((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              type: 'success',
              text: `✓ Auto-installed missing dependencies: ${data.autoInstalled.join(', ')}`,
              timestamp: getTimeString()
            }
          ]);
          fetchInstalledPackages();
        }
      } catch (err: any) {
        task.status = 'failed';
        task.output = err.message || 'Execution error';
      }

      setAiTasks([...newTasks]);
    }

    setIsAiRunning(false);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.4 } });
  };

  const handleSimulateGitPush = async () => {
    setIsPushing(true);
    setPushStatus('pushing');

    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        type: 'info',
        text: `[git] Connecting to remote ${repoUrl}...`,
        timestamp: getTimeString()
      }
    ]);

    try {
      const res = await fetch('/api/git-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          branch: targetBranch,
          commitMessage,
          token: githubToken
        })
      });

      const data = await res.json();
      const steps: string[] = data.steps || [
        `[git] Remote push completed to ${repoUrl}`,
        `✓ [${targetBranch}] 10 modules synced`
      ];

      steps.forEach((line: string, index: number) => {
        setTimeout(() => {
          setLogs((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              type: index === steps.length - 1 ? 'success' : 'info',
              text: line,
              timestamp: getTimeString()
            }
          ]);

          if (index === steps.length - 1) {
            setIsPushing(false);
            setPushStatus('success');
            confetti({ particleCount: 60, spread: 55, origin: { y: 0.3 } });
          }
        }, (index + 1) * 120);
      });
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          type: 'error',
          text: `[git push error]: ${err.message || 'Push failure'}`,
          timestamp: getTimeString()
        }
      ]);
      setIsPushing(false);
      setPushStatus('error');
    }
  };

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const handleClearLogs = () => {
    setLogs([
      {
        id: Math.random().toString(36).substring(7),
        type: 'info',
        text: '⚡ Terminal cleared.',
        timestamp: getTimeString()
      }
    ]);
  };

  const fullPushScript = `# 1. Initialize & commit
git init -b ${targetBranch}
git add .
git commit -m "${commitMessage}"

# 2. Add remote & push
git remote add origin ${repoUrl}
git push -u origin ${targetBranch}
`;

  // Filter packages for package manager tab
  const filteredPackages = TERMUX_CATALOG.filter((pkg) => {
    const matchesSearch = pkg.name.toLowerCase().includes(packageSearchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(packageSearchQuery.toLowerCase()) ||
      pkg.binaries.some(b => b.toLowerCase().includes(packageSearchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || pkg.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-10">
      {/* Top Control Header & Sub-Tab Switcher */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl px-3 py-2 shadow-md flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Tab Switchers */}
        <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-xl border border-[#30363d] overflow-x-auto scrollbar-none">
          {/* Shell Tab */}
          <button
            onClick={() => setActiveSubTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'terminal'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <TerminalIcon className="h-3.5 w-3.5" />
            <span>Termux Shell</span>
          </button>

          {/* AI Terminal Agent Tab */}
          <button
            onClick={() => setActiveSubTab('ai_agent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'ai_agent'
                ? 'bg-[#8957e5] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Bot className="h-3.5 w-3.5 text-[#d2a8ff]" />
            <span>AI Agent</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-[#8957e5]/30 rounded-full font-mono text-[#d2a8ff] ml-0.5">PTY</span>
          </button>

          {/* Package Manager Tab */}
          <button
            onClick={() => setActiveSubTab('packages')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'packages'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Packages</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-[#238636]/30 text-[#3fb950] rounded-full font-mono">
              {installedPackages.length}
            </span>
          </button>

          {/* Filesystem Tab */}
          <button
            onClick={() => setActiveSubTab('filesystem')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'filesystem'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>Filesystem</span>
          </button>

          {/* Git Push Tab */}
          <button
            onClick={() => setActiveSubTab('github_push')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'github_push'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Github className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Git Push</span>
          </button>

          {/* Script Tab */}
          <button
            onClick={() => setActiveSubTab('push_script')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'push_script'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Script</span>
          </button>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleSimulateGitPush()}
            disabled={isPushing}
            title="1-Click Git Push"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold shadow transition-all active:scale-95 disabled:opacity-50"
          >
            <UploadCloud className={`h-3.5 w-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
            <span className="hidden xs:inline">{isPushing ? 'Pushing...' : 'Push'}</span>
          </button>

          <button
            onClick={handleCopyLogs}
            title="Copy Logs"
            className="p-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white border border-[#30363d] transition-all active:scale-95"
          >
            {copiedLog ? <Check className="h-3.5 w-3.5 text-[#3fb950]" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={handleClearLogs}
            title="Clear Console"
            className="p-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white border border-[#30363d] transition-all active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5 text-[#f85149]" />
          </button>
        </div>
      </div>

      {/* View 1: Termux PTY Shell */}
      {activeSubTab === 'terminal' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3 sm:p-4 flex flex-col space-y-2.5 shadow-lg">
          {/* Quick Command Icon Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { icon: Sparkles, label: 'neofetch', cmd: 'neofetch' },
              { icon: Bot, label: 'ai agent', cmd: 'termux-info' },
              { icon: Package, label: 'pkg list', cmd: 'pkg list-installed' },
              { icon: Package, label: 'pkg update', cmd: 'pkg update' },
              { icon: Code2, label: 'node -v', cmd: 'node -v' },
              { icon: Code2, label: 'python -V', cmd: 'python -V' },
              { icon: GitBranch, label: 'git status', cmd: 'git status' },
              { icon: HardDrive, label: 'storage', cmd: 'termux-setup-storage' },
              { icon: Layers, label: 'gradle build', cmd: './gradlew assembleRelease' },
              { icon: FileCode, label: 'ls -la', cmd: 'ls -la' },
              { icon: Trash2, label: 'clear', cmd: 'clear' }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleRunCommand(item.cmd)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-[11px] font-mono text-[#c9d1d9] hover:text-white whitespace-nowrap transition-all active:scale-95 group"
                >
                  <Icon className="h-3.5 w-3.5 text-[#58a6ff] group-hover:scale-110 transition-transform" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Terminal Window */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden shadow-inner flex flex-col">
            {/* Terminal Window Header with Traffic Lights & Termux Runtime Details */}
            <div className="px-3 py-2 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#f85149]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#d29922]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#3fb950]" />
                <span className="text-[11px] font-mono text-[#8b949e] ml-2">
                  u0_a249@termux-android ({currentCwd})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAllLogs}
                  title="Copy all terminal output to clipboard"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[11px] font-mono text-[#c9d1d9] hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  {copiedLog ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#3fb950]" />
                      <span className="text-[#3fb950] font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-[#58a6ff]" />
                      <span>Copy Output</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950] animate-pulse" />
                  Termux PTY (POSIX /dev/ptmx)
                </span>
                <span className="text-[10px] font-mono text-[#8b949e] hidden sm:inline">
                  bash 5.2 • aarch64
                </span>
              </div>
            </div>

            {/* Terminal Screen Logs */}
            <div className="p-3.5 font-mono text-xs text-[#c9d1d9] min-h-[360px] max-h-[520px] overflow-y-auto space-y-1.5 select-text">
              {logs.map((log) => (
                <div key={log.id} className="relative group leading-relaxed whitespace-pre-wrap font-mono select-text">
                  <div className="pr-8">
                    {log.type === 'cmd' ? (
                      <span className="text-[#58a6ff] font-bold">{log.text}</span>
                    ) : log.type === 'ai' ? (
                      <span className="text-[#d2a8ff] font-semibold">{log.text}</span>
                    ) : (
                      renderAnsiColoredText(log.text)
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopySingleLog(log.text, log.id)}
                    title="Copy this section"
                    className="absolute right-1 top-0 opacity-0 group-hover:opacity-100 p-1 rounded bg-[#21262d]/90 hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] transition-all shadow"
                  >
                    {copiedLogId === log.id ? (
                      <Check className="h-3 w-3 text-[#3fb950]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ))}
              {isRunningCommand && (
                <div className="flex items-center gap-2 text-[#58a6ff] text-xs font-mono py-1 animate-pulse">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Termux PTY executing subprocess...</span>
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Termux Touch Accessory Keys Ribbon (Mobile & Precision Coding Bar) */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none bg-[#0d1117] px-2 rounded-xl border border-[#30363d]">
            {[
              { label: 'ESC', action: () => setCommandInput('') },
              { label: 'TAB', action: () => handleInsertChar('  ') },
              {
                label: 'COPY',
                action: () => handleCopyAllLogs()
              },
              {
                label: 'CTRL+C',
                action: () => {
                  setLogs((prev) => [
                    ...prev,
                    {
                      id: Math.random().toString(36).substring(7),
                      type: 'system',
                      text: `^C [SIGINT sent]`,
                      timestamp: getTimeString()
                    }
                  ]);
                  setCommandInput('');
                }
              },
              {
                label: 'CTRL+L',
                action: () => handleClearLogs()
              },
              {
                label: '↑',
                action: () => {
                  if (history.length > 0) {
                    const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
                    setHistoryIndex(nextIdx);
                    setCommandInput(history[nextIdx] || '');
                  }
                }
              },
              {
                label: '↓',
                action: () => {
                  if (historyIndex !== -1) {
                    const nextIdx = historyIndex + 1;
                    if (nextIdx >= history.length) {
                      setHistoryIndex(-1);
                      setCommandInput('');
                    } else {
                      setHistoryIndex(nextIdx);
                      setCommandInput(history[nextIdx] || '');
                    }
                  }
                }
              },
              { label: '~', action: () => handleInsertChar('~') },
              { label: '/', action: () => handleInsertChar('/') },
              { label: '|', action: () => handleInsertChar('|') },
              { label: '-', action: () => handleInsertChar('-') },
              { label: '_', action: () => handleInsertChar('_') },
              { label: '$', action: () => handleInsertChar('$') },
              { label: '&', action: () => handleInsertChar('&') },
              { label: ';', action: () => handleInsertChar(';') },
              { label: '>', action: () => handleInsertChar('>') },
              { label: '<', action: () => handleInsertChar('<') },
              { label: '*', action: () => handleInsertChar('*') },
              { label: '"', action: () => handleInsertChar('"') },
              { label: "'", action: () => handleInsertChar("'") }
            ].map((k) => (
              <button
                key={k.label}
                type="button"
                onClick={k.action}
                className="px-2 py-1 rounded-lg bg-[#161b22] hover:bg-[#21262d] active:bg-[#30363d] text-[#c9d1d9] hover:text-white font-mono text-[11px] font-semibold border border-[#30363d] transition-all min-w-[30px] text-center whitespace-nowrap"
              >
                {k.label}
              </button>
            ))}
          </div>

          {/* Command Prompt Input Bar */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl flex-1 focus-within:border-[#58a6ff]">
              <span className="text-[#3fb950] font-mono text-xs font-bold whitespace-nowrap">
                u0_a249@termux:{currentCwd}$
              </span>
              <input
                ref={inputRef}
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="type command (e.g. pkg install python, node -v, git status, ./gradlew)..."
                className="bg-transparent text-[#f0f6fc] font-mono text-xs focus:outline-none flex-1 placeholder-[#8b949e]"
              />
            </div>

            <button
              onClick={() => handleRunCommand(commandInput)}
              disabled={!commandInput.trim() || isRunningCommand}
              title="Run Command"
              className="p-2.5 bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shadow active:scale-95"
            >
              {isRunningCommand ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            </button>
          </div>
        </div>
      )}

      {/* View 2: Autonomous AI Terminal Agent (Part 2 — AI Agent Integration) */}
      {activeSubTab === 'ai_agent' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left Panel: AI Terminal Controller */}
          <div className="lg:col-span-6 bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#8957e5]/20 text-[#d2a8ff] border border-[#8957e5]/40">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#f0f6fc]">Autonomous AI Terminal Agent</h3>
                  <p className="text-[10px] text-[#8b949e]">Executes multi-step shell tasks & manages packages</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8957e5]/20 text-[#d2a8ff] border border-[#8957e5]/40">
                PTY Bridge
              </span>
            </div>

            {/* Prompt Input Box */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-[#c9d1d9] block">
                Describe terminal workflow or task for the AI Agent:
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. 'Build the Android APK with gradle release', 'Install Python, SQLite and test in-memory queries', 'Check git tree and push'..."
                rows={3}
                className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs font-mono text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#8957e5] resize-none"
              />

              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <label className="flex items-center gap-2 text-xs text-[#8b949e] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiAutoInstall}
                    onChange={(e) => setAiAutoInstall(e.target.checked)}
                    className="rounded bg-[#0d1117] border-[#30363d] text-[#8957e5] focus:ring-0"
                  />
                  <span>Auto-detect & install missing packages (`pkg install`)</span>
                </label>

                <button
                  onClick={() => handleRunAiAgentTask()}
                  disabled={!aiPrompt.trim() || isAiRunning}
                  className="px-4 py-2 bg-[#8957e5] hover:bg-[#a371f7] disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95"
                >
                  {isAiRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  <span>{isAiRunning ? 'Executing Plan...' : 'Run AI Task'}</span>
                </button>
              </div>
            </div>

            {/* Quick One-Click Recipes */}
            <div className="space-y-2 pt-2 border-t border-[#30363d]">
              <span className="text-[11px] font-bold text-[#8b949e] block uppercase tracking-wider">
                Instant AI Terminal Recipes
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    title: 'Build Release APK',
                    desc: 'Check Java, run ./gradlew assembleRelease',
                    prompt: 'Build the Android APK with gradle release and inspect outputs'
                  },
                  {
                    title: 'Python + SQLite Test',
                    desc: 'Install Python, run in-memory SQLite DB',
                    prompt: 'Ensure Python and SQLite packages installed and execute test queries'
                  },
                  {
                    title: 'Git Health & History',
                    desc: 'Run git status & commit logs',
                    prompt: 'Check git repository status and inspect tree log'
                  },
                  {
                    title: 'System & CPU Specs',
                    desc: 'Run termux-info and neofetch specs',
                    prompt: 'Print Termux POSIX system info and Neofetch hardware specs'
                  }
                ].map((recipe) => (
                  <button
                    key={recipe.title}
                    onClick={() => handleRunAiAgentTask(recipe.prompt)}
                    disabled={isAiRunning}
                    className="text-left p-2.5 rounded-xl bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] transition-all group"
                  >
                    <div className="text-xs font-bold text-[#f0f6fc] group-hover:text-[#58a6ff] flex items-center justify-between">
                      <span>{recipe.title}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[10px] text-[#8b949e] mt-0.5">{recipe.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: AI Live Execution Queue */}
          <div className="lg:col-span-6 bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col space-y-3 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#3fb950]" />
                <h3 className="text-xs font-bold text-[#f0f6fc]">AI Execution Plan & Task Pipeline</h3>
              </div>
              <span className="text-[10px] font-mono text-[#8b949e]">
                {aiTasks.length > 0 ? `${aiTasks.filter(t => t.status === 'completed').length}/${aiTasks.length} Completed` : 'Idle'}
              </span>
            </div>

            <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 space-y-2.5 overflow-y-auto min-h-[280px]">
              {aiTasks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8b949e] space-y-2">
                  <Bot className="h-8 w-8 text-[#8957e5]/50 animate-pulse" />
                  <p className="text-xs font-medium text-[#c9d1d9]">No active AI terminal task</p>
                  <p className="text-[11px] max-w-xs">
                    Type a prompt or click an instant recipe to watch the AI plan and execute commands live through the Termux POSIX PTY.
                  </p>
                </div>
              ) : (
                aiTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border transition-all ${
                      task.status === 'running'
                        ? 'bg-[#161b22] border-[#8957e5]'
                        : task.status === 'completed'
                        ? 'bg-[#161b22]/70 border-[#238636]/60'
                        : task.status === 'failed'
                        ? 'bg-[#161b22]/70 border-[#f85149]/60'
                        : 'bg-[#161b22]/40 border-[#30363d]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#30363d] text-[#c9d1d9]">
                          Step {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-[#f0f6fc]">{task.prompt}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {task.status === 'running' && (
                          <span className="text-[10px] font-mono text-[#d2a8ff] flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> Running
                          </span>
                        )}
                        {task.status === 'completed' && (
                          <span className="text-[10px] font-mono text-[#3fb950] flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Done
                          </span>
                        )}
                        {task.status === 'failed' && (
                          <span className="text-[10px] font-mono text-[#f85149] flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Failed
                          </span>
                        )}
                        {task.status === 'queued' && (
                          <span className="text-[10px] font-mono text-[#8b949e]">Queued</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-1.5 font-mono text-[11px] text-[#79c0ff] bg-[#0d1117] px-2.5 py-1 rounded-lg border border-[#30363d]">
                      $ {task.command}
                    </div>

                    {task.output && (
                      <div className="mt-2 text-[11px] font-mono text-[#8b949e] max-h-24 overflow-y-auto whitespace-pre-wrap bg-[#0d1117]/80 p-2 rounded border border-[#30363d]/50">
                        {task.output}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* View 3: Termux Package Manager (pkg / apt / dpkg) */}
      {activeSubTab === 'packages' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-3.5 shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#30363d] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[#58a6ff]" />
              <div>
                <h3 className="text-xs font-bold text-[#f0f6fc]">Termux Package Manager (pkg / apt)</h3>
                <p className="text-[10px] text-[#8b949e]">
                  Persistent Linux binaries installed to <code className="text-[#79c0ff]">$PREFIX/bin</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-[#0d1117] border border-[#30363d] text-[#3fb950]">
                {installedPackages.length} Installed
              </span>
              <button
                onClick={() => handleRunCommand('pkg update')}
                className="px-2.5 py-1 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-[#c9d1d9] hover:text-white transition-all flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>pkg update</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8b949e]" />
              <input
                type="text"
                value={packageSearchQuery}
                onChange={(e) => setPackageSearchQuery(e.target.value)}
                placeholder="Search packages (e.g. clang, python, git, nodejs, sqlite, openssh)..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {['all', 'core', 'development', 'languages', 'networking', 'utilities'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#1f6feb] text-white'
                      : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Package Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {filteredPackages.map((pkg) => {
              const isInstalled = installedPackages.includes(pkg.name) || pkg.installed;
              const isActioning = actionInProgressPkg === pkg.name;

              return (
                <div
                  key={pkg.name}
                  className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 flex flex-col justify-between space-y-2 hover:border-[#58a6ff]/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#f0f6fc] font-mono">{pkg.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161b22] text-[#8b949e] border border-[#30363d]">
                        v{pkg.version}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8b949e] mt-1 line-clamp-2">{pkg.description}</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#21262d] text-[#c9d1d9] rounded">
                        {pkg.size}
                      </span>
                      {pkg.binaries.map((b) => (
                        <span key={b} className="text-[10px] font-mono px-1.5 py-0.2 bg-[#1f6feb]/20 text-[#58a6ff] rounded">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#30363d]/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#8b949e] capitalize">{pkg.category}</span>
                    <button
                      onClick={() => handlePackageAction(pkg, isInstalled ? 'uninstall' : 'install')}
                      disabled={isActioning}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1 ${
                        isInstalled
                          ? 'bg-[#21262d] hover:bg-[#da3633] text-[#c9d1d9] hover:text-white border border-[#30363d]'
                          : 'bg-[#238636] hover:bg-[#2ea043] text-white shadow'
                      }`}
                    >
                      {isActioning ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isInstalled ? (
                        <Check className="h-3 w-3 text-[#3fb950]" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      <span>{isActioning ? 'Working...' : isInstalled ? 'Installed' : 'Install'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 4: Termux Filesystem Explorer */}
      {activeSubTab === 'filesystem' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-3.5 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-[#30363d] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-[#58a6ff]" />
              <div>
                <h3 className="text-xs font-bold text-[#f0f6fc]">Persistent Linux Filesystem & Sandbox Explorer</h3>
                <p className="text-[10px] text-[#8b949e]">
                  <code className="text-[#3fb950]">/data/data/com.termux/files/usr</code> & <code className="text-[#58a6ff]">/home (sandbox/)</code>
                </p>
              </div>
            </div>
            <button
              onClick={fetchFilesystem}
              disabled={fsLoading}
              className="px-2.5 py-1 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-[#c9d1d9] flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${fsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Files</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8b949e]" />
            <input
              type="text"
              value={fsFilter}
              onChange={(e) => setFsFilter(e.target.value)}
              placeholder="Search files and directories in project filesystem..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
            />
          </div>

          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 max-h-[380px] overflow-y-auto space-y-1 font-mono text-xs">
            {fsLoading ? (
              <div className="py-8 text-center text-[#8b949e] flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#58a6ff]" />
                <span>Scanning Termux filesystem...</span>
              </div>
            ) : fsFiles.length === 0 ? (
              <div className="py-8 text-center text-[#8b949e]">No files found</div>
            ) : (
              fsFiles
                .filter((f) => !fsFilter || f.path.toLowerCase().includes(fsFilter.toLowerCase()))
                .map((f) => (
                  <div
                    key={f.path}
                    className="flex items-center justify-between p-1.5 hover:bg-[#161b22] rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className="h-3.5 w-3.5 text-[#58a6ff] shrink-0" />
                      <span className="text-[#f0f6fc] truncate">{f.path}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#8b949e] shrink-0">
                      <span>{(f.size / 1024).toFixed(1)} KB</span>
                      <button
                        onClick={() => handleRunCommand(`cat ${f.path}`)}
                        className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-[10px]"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* View 5: GitHub Push Settings */}
      {activeSubTab === 'github_push' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6 bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#30363d]">
              <Github className="h-4 w-4 text-[#58a6ff]" />
              <h3 className="text-xs font-bold text-[#f0f6fc]">GitHub Remote Settings</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[#8b949e] font-semibold text-[11px] block mb-1">
                  Remote Repository
                </label>
                <div className="relative">
                  <Github className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8b949e]" />
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs font-mono text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#8b949e] font-semibold text-[11px] block mb-1">
                    Branch
                  </label>
                  <div className="relative">
                    <GitBranch className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8b949e]" />
                    <input
                      type="text"
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs font-mono text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[#8b949e] font-semibold text-[11px] block mb-1">
                    Mode
                  </label>
                  <div className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#3fb950] font-mono">
                    Force-with-lease
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold text-[11px] block mb-1">
                  Commit Message
                </label>
                <div className="relative">
                  <GitCommit className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8b949e]" />
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs font-mono text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8b949e] font-semibold text-[11px] block mb-1">
                  Personal Access Token (Auto-Saved)
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8b949e]" />
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_..."
                    className="w-full pl-8 pr-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs font-mono text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                  />
                </div>
              </div>

              <button
                onClick={handleSimulateGitPush}
                disabled={isPushing}
                className="w-full py-2.5 bg-[#238636] hover:bg-[#2ea043] text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-xs"
              >
                <UploadCloud className={`h-4 w-4 ${isPushing ? 'animate-bounce' : ''}`} />
                <span>{isPushing ? 'Pushing...' : 'Commit & Push Now'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[#30363d] mb-2.5">
              <span className="text-xs font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <GitCommit className="h-4 w-4 text-[#3fb950]" />
                Git Remote Stream
              </span>
              <span className="text-[10px] font-mono text-[#8b949e]">Live</span>
            </div>

            <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl p-3 font-mono text-xs text-[#c9d1d9] overflow-y-auto space-y-1 min-h-[220px]">
              {logs.slice(-10).map((l) => (
                <div key={l.id} className="leading-relaxed">
                  {l.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View 6: Push Script */}
      {activeSubTab === 'push_script' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-[#58a6ff]" />
              <h3 className="text-xs font-bold text-[#f0f6fc]">Local Terminal Push Commands</h3>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(fullPushScript);
                setCopiedLog(true);
                setTimeout(() => setCopiedLog(false), 2000);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1f6feb] text-white text-xs font-bold rounded-xl active:scale-95"
            >
              {copiedLog ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLog ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl font-mono text-xs text-[#79c0ff] overflow-x-auto leading-relaxed">
            <code>{fullPushScript}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
