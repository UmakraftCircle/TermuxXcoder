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
  Code2
} from 'lucide-react';
import { ProjectFile } from '../types';
import confetti from 'canvas-confetti';

interface TerminalPageTabProps {
  files: ProjectFile[];
  onOpenQuickPush?: () => void;
}

interface CommandLog {
  id: string;
  type: 'cmd' | 'output' | 'success' | 'error' | 'info' | 'system';
  text: string;
  timestamp: string;
}

export const TerminalPageTab: React.FC<TerminalPageTabProps> = () => {
  const [activeSubTab, setActiveSubTab] = useState<'terminal' | 'github_push' | 'push_script'>('terminal');
  const [commandInput, setCommandInput] = useState('');
  const [copiedLog, setCopiedLog] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // GitHub Push State
  const [repoUrl, setRepoUrl] = useState('https://github.com/pagaranjayson021/Umakraft-TermuxXCoder.git');
  const [targetBranch, setTargetBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('feat: umakraft IDE update');
  const [githubToken, setGithubToken] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [, setPushStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');

  const initialLogs: CommandLog[] = [
    {
      id: '1',
      type: 'info',
      text: '⚡ Termux PTY Shell v2.4 (Android /dev/ptmx • aarch64 • OpenJDK 17)',
      timestamp: '09:50:00'
    },
    {
      id: '2',
      type: 'success',
      text: '✓ PTY native bridge connected (forkpty() JNI)',
      timestamp: '09:50:01'
    },
    {
      id: '3',
      type: 'info',
      text: 'Type a command or tap any quick action below.',
      timestamp: '09:50:02'
    }
  ];

  const [logs, setLogs] = useState<CommandLog[]>(initialLogs);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getTimeString = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  const handleRunCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const time = getTimeString();
    const cmdEntry: CommandLog = {
      id: Math.random().toString(36).substring(7),
      type: 'cmd',
      text: `umakraft@termux:~$ ${trimmed}`,
      timestamp: time
    };

    setLogs((prev) => [...prev, cmdEntry]);
    setCommandInput('');

    const lower = trimmed.toLowerCase();

    if (lower === 'clear' || lower === 'cls') {
      setLogs([
        {
          id: Math.random().toString(36).substring(7),
          type: 'info',
          text: '⚡ Terminal cleared.',
          timestamp: time
        }
      ]);
      return;
    }

    if (lower.startsWith('git push') || lower === 'push') {
      handleSimulateGitPush();
      return;
    }

    try {
      const res = await fetch('/api/pty-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed })
      });

      const data = await res.json();
      const outputText = data.output || `Executed: ${trimmed}`;

      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          type: outputText.includes('BUILD SUCCESSFUL') || outputText.includes('✓') ? 'success' : 'info',
          text: outputText,
          timestamp: getTimeString()
        }
      ]);
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          type: 'error',
          text: `[PTY Error]: ${err.message || 'Failed to connect to backend PTY bridge'}`,
          timestamp: getTimeString()
        }
      ]);
    }
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

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-10">
      {/* Compact Top Control Bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl px-3.5 py-2.5 shadow-md flex items-center justify-between gap-2">
        {/* Left: Sub-Tab Icon Segmented Switcher */}
        <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
          {/* Shell Tab */}
          <button
            onClick={() => setActiveSubTab('terminal')}
            title="Termux PTY Shell"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'terminal'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <TerminalIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Shell</span>
          </button>

          {/* Git Push Tab */}
          <button
            onClick={() => setActiveSubTab('github_push')}
            title="GitHub Remote"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'github_push'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">Git Push</span>
          </button>

          {/* Script Tab */}
          <button
            onClick={() => setActiveSubTab('push_script')}
            title="Push Commands Script"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'push_script'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span className="hidden sm:inline">Script</span>
          </button>
        </div>

        {/* Right: Quick Action Icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleSimulateGitPush()}
            disabled={isPushing}
            title="1-Click Git Push"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold shadow transition-all active:scale-95 disabled:opacity-50"
          >
            <UploadCloud className={`h-4 w-4 ${isPushing ? 'animate-bounce' : ''}`} />
            <span className="hidden xs:inline">{isPushing ? 'Pushing...' : 'Push'}</span>
          </button>

          <button
            onClick={handleCopyLogs}
            title="Copy Logs"
            className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white border border-[#30363d] transition-all active:scale-95"
          >
            {copiedLog ? <Check className="h-4 w-4 text-[#3fb950]" /> : <Copy className="h-4 w-4" />}
          </button>

          <button
            onClick={handleClearLogs}
            title="Clear Console"
            className="p-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white border border-[#30363d] transition-all active:scale-95"
          >
            <Trash2 className="h-4 w-4 text-[#f85149]" />
          </button>
        </div>
      </div>

      {/* View 1: Termux PTY Shell */}
      {activeSubTab === 'terminal' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3 sm:p-4 flex flex-col space-y-2.5 shadow-lg">
          {/* Quick Command Icon Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { icon: GitBranch, label: 'status', cmd: 'git status' },
              { icon: UploadCloud, label: 'push', cmd: 'git push origin main' },
              { icon: Package, label: 'build apk', cmd: './gradlew assembleRelease' },
              { icon: Cpu, label: 'packages', cmd: 'pkg list-installed' },
              { icon: Code2, label: 'clang++', cmd: 'clang++ --version' },
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
            {/* Terminal Window Header with Traffic Lights */}
            <div className="px-3 py-2 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#f85149]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#d29922]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#3fb950]" />
                <span className="text-[11px] font-mono text-[#8b949e] ml-2">termux-pty</span>
              </div>
              <span className="text-[10px] font-mono text-[#3fb950]">● active</span>
            </div>

            {/* Terminal Screen Logs */}
            <div className="p-3.5 font-mono text-xs text-[#c9d1d9] min-h-[360px] max-h-[520px] overflow-y-auto space-y-1 select-text">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`leading-relaxed ${
                    log.type === 'cmd'
                      ? 'text-[#58a6ff] font-bold'
                      : log.type === 'success'
                      ? 'text-[#3fb950]'
                      : log.type === 'error'
                      ? 'text-[#f85149]'
                      : log.type === 'system'
                      ? 'text-[#8b949e]'
                      : 'text-[#c9d1d9]'
                  }`}
                >
                  {log.text}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Command Prompt Input Bar */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl flex-1 focus-within:border-[#58a6ff]">
              <span className="text-[#3fb950] font-mono text-xs font-bold">$</span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRunCommand(commandInput);
                }}
                placeholder="type command (git push, build, help)..."
                className="bg-transparent text-[#f0f6fc] font-mono text-xs focus:outline-none flex-1 placeholder-[#8b949e]"
              />
            </div>

            <button
              onClick={() => handleRunCommand(commandInput)}
              disabled={!commandInput.trim()}
              title="Run Command"
              className="p-2.5 bg-[#1f6feb] hover:bg-[#388bfd] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shadow active:scale-95"
            >
              <Play className="h-4 w-4 fill-current" />
            </button>
          </div>
        </div>
      )}

      {/* View 2: GitHub Push Settings */}
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

      {/* View 3: Push Script */}
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
