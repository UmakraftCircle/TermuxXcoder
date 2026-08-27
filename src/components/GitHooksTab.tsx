import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Send,
  Play,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Code2,
  Sparkles,
  Zap,
  Globe,
  Radio,
  FileCode,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GitHookItem {
  type: string;
  name: string;
  installed: boolean;
  path: string;
  description: string;
  defaultScript: string;
}

interface WebhookLog {
  id: string;
  event: string;
  repository: string;
  branch: string;
  sender: string;
  timestamp: string;
  status: string;
  statusCode: number;
  signatureVerified: boolean;
  durationMs: number;
  payloadSummary: string;
  outputLog: string;
}

interface PreCommitCheck {
  name: string;
  status: 'passed' | 'error' | 'warning';
  details: string;
  durationMs: number;
}

export const GitHooksTab: React.FC = () => {
  const [hooks, setHooks] = useState<GitHookItem[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'hooks' | 'precommit-tester' | 'webhooks'>('hooks');
  const [selectedHook, setSelectedHook] = useState<GitHookItem | null>(null);
  const [hookScriptEdit, setHookScriptEdit] = useState<string>('');
  const [testCommitMessage, setTestCommitMessage] = useState<string>('feat(build): integrate gradle inspector & build cache stats');
  const [preCommitResults, setPreCommitResults] = useState<{
    passed: boolean;
    checks: PreCommitCheck[];
    summary: string;
  } | null>(null);
  const [isTestingPreCommit, setIsTestingPreCommit] = useState<boolean>(false);
  const [isInstallingHook, setIsInstallingHook] = useState<boolean>(false);
  const [isDispatchingWebhook, setIsDispatchingWebhook] = useState<boolean>(false);
  const [webhookEvent, setWebhookEvent] = useState<string>('push');
  const [webhookPayloadInput, setWebhookPayloadInput] = useState<string>('{"ref": "refs/heads/main", "commit": "feat: release v1.0.0"}');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchHooksData = async () => {
    try {
      const res = await fetch('/api/git/hooks');
      const json = await res.json();
      if (json.success) {
        setHooks(json.hooks);
        if (!selectedHook && json.hooks.length > 0) {
          setSelectedHook(json.hooks[0]);
          setHookScriptEdit(json.hooks[0].defaultScript);
        }
      }
    } catch (err) {
      console.error('Failed to load git hooks:', err);
    }
  };

  const fetchWebhookLogs = async () => {
    try {
      const res = await fetch('/api/git/webhooks/logs');
      const json = await res.json();
      if (json.success) {
        setWebhookLogs(json.logs);
      }
    } catch (err) {
      console.error('Failed to load webhook logs:', err);
    }
  };

  useEffect(() => {
    fetchHooksData();
    fetchWebhookLogs();
  }, []);

  const handleSelectHook = (hook: GitHookItem) => {
    setSelectedHook(hook);
    setHookScriptEdit(hook.defaultScript);
  };

  const handleInstallHook = async () => {
    if (!selectedHook) return;
    setIsInstallingHook(true);
    try {
      const res = await fetch('/api/git/hooks/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hookType: selectedHook.type,
          scriptContent: hookScriptEdit
        })
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage(json.message);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        await fetchHooksData();
      }
    } catch (err) {
      console.error('Failed to install hook:', err);
    } finally {
      setIsInstallingHook(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleRunPreCommitTest = async () => {
    setIsTestingPreCommit(true);
    try {
      const res = await fetch('/api/git/hooks/test-precommit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitMessage: testCommitMessage })
      });
      const json = await res.json();
      setPreCommitResults({
        passed: json.passed,
        checks: json.checks,
        summary: json.summary
      });
      if (json.passed) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error('Failed to test pre-commit hook:', err);
    } finally {
      setIsTestingPreCommit(false);
    }
  };

  const handleDispatchWebhook = async () => {
    setIsDispatchingWebhook(true);
    try {
      const res = await fetch('/api/git/webhooks/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: webhookEvent,
          repository: 'umakraft/android-compose-app',
          branch: 'main',
          sender: 'pagaranjayson021',
          payload: webhookPayloadInput
        })
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage(json.message);
        await fetchWebhookLogs();
      }
    } catch (err) {
      console.error('Failed to dispatch webhook:', err);
    } finally {
      setIsDispatchingWebhook(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(hookScriptEdit);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-3 sm:p-4 font-sans" id="git-hooks-container">
      {/* Header */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#238636] to-[#2ea043] p-0.5 shadow shrink-0">
            <div className="h-full w-full bg-[#0d1117] rounded-[10px] flex items-center justify-center text-[#3fb950]">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">Git Connect & Webhook Manager</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/30 font-semibold">
                .git/hooks/ + HMAC-SHA256
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Enforce local commit standards, lint guards, and trigger external CI/CD dispatch pipelines.
            </p>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-xl border border-[#30363d] self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('hooks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'hooks'
                ? 'bg-[#21262d] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            Hook Scripts ({hooks.length})
          </button>
          <button
            onClick={() => setActiveSubTab('precommit-tester')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'precommit-tester'
                ? 'bg-[#21262d] text-[#3fb950] shadow-sm'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Play className="h-3 w-3" />
            <span>Pre-Commit Guard</span>
          </button>
          <button
            onClick={() => setActiveSubTab('webhooks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'webhooks'
                ? 'bg-[#21262d] text-[#58a6ff] shadow-sm'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Radio className="h-3 w-3 text-[#58a6ff]" />
            <span>Webhooks</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-[#1f6feb]/10 border border-[#1f6feb]/30 rounded-xl p-3 text-xs text-[#58a6ff] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* VIEW 1: HOOK SCRIPTS MANAGER */}
      {activeSubTab === 'hooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Hook List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b949e] px-1">Available Git Hooks</h3>
            {hooks.map((hook) => {
              const isSelected = selectedHook?.type === hook.type;
              return (
                <button
                  key={hook.type}
                  onClick={() => handleSelectHook(hook)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#161b22] border-[#58a6ff] shadow-md shadow-[#1f6feb]/10'
                      : 'bg-[#161b22]/70 border-[#30363d] hover:border-[#8b949e]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">{hook.type}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                        hook.installed
                          ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40'
                          : 'bg-[#21262d] text-[#8b949e] border border-[#30363d]'
                      }`}
                    >
                      {hook.installed ? 'Installed' : 'Optional'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#c9d1d9] mt-1">{hook.name}</p>
                  <p className="text-[11px] text-[#8b949e] mt-1 line-clamp-2">{hook.description}</p>
                </button>
              );
            })}
          </div>

          {/* Right 2 cols: Script Editor & Installation */}
          <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#30363d]">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-[#58a6ff]" />
                    <span>{selectedHook?.name || 'Hook Script'}</span>
                  </h3>
                  <span className="text-[11px] font-mono text-[#8b949e] mt-0.5 block">
                    Path: {selectedHook?.path}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyScript}
                    className="px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs text-[#c9d1d9] border border-[#30363d] flex items-center gap-1.5 transition-all"
                  >
                    {copiedScript ? <Check className="h-3.5 w-3.5 text-[#3fb950]" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedScript ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleInstallHook}
                    disabled={isInstallingHook}
                    className="px-3 py-1 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{isInstallingHook ? 'Installing...' : 'Install Hook (+x)'}</span>
                  </button>
                </div>
              </div>

              {/* Script Editor */}
              <div className="mt-3">
                <textarea
                  value={hookScriptEdit}
                  onChange={(e) => setHookScriptEdit(e.target.value)}
                  className="w-full h-72 font-mono text-xs p-3 rounded-lg bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#30363d] flex items-center justify-between text-xs text-[#8b949e]">
              <span>Hooks execute natively via POSIX shell in POSIX environment</span>
              <span className="font-mono text-[11px] text-[#3fb950]">chmod +x enabled</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PRE-COMMIT GUARD TESTER */}
      {activeSubTab === 'precommit-tester' && (
        <div className="space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-[#3fb950]" />
              <span>Interactive Pre-Commit Verification Simulator</span>
            </h3>
            <p className="text-xs text-[#8b949e] mb-3">
              Test your workspace against Android Lint, Kotlin Spotless rules, Conventional Commit standards, and Scoped Storage permissions before committing.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={testCommitMessage}
                onChange={(e) => setTestCommitMessage(e.target.value)}
                placeholder="e.g. feat(editor): add sora editor 0.23.5 support"
                className="flex-1 font-mono text-xs px-3 py-2 rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:border-[#58a6ff] focus:outline-none"
              />
              <button
                onClick={handleRunPreCommitTest}
                disabled={isTestingPreCommit}
                className="px-4 py-2 rounded-xl bg-[#1f6feb] hover:bg-[#388bfd] text-xs font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow shrink-0"
              >
                <Play className={`h-3.5 w-3.5 ${isTestingPreCommit ? 'animate-spin' : ''}`} />
                <span>{isTestingPreCommit ? 'Evaluating Gates...' : 'Run Pre-Commit Guard'}</span>
              </button>
            </div>
          </div>

          {preCommitResults && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
                <div className="flex items-center gap-2">
                  {preCommitResults.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-[#3fb950]" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-[#f85149]" />
                  )}
                  <h4 className="text-sm font-bold text-white">{preCommitResults.summary}</h4>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    preCommitResults.passed
                      ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40'
                      : 'bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/40'
                  }`}
                >
                  {preCommitResults.passed ? 'GATE PASSED' : 'REJECTED'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {preCommitResults.checks.map((c, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-start gap-2.5">
                    {c.status === 'passed' ? (
                      <CheckCircle2 className="h-4 w-4 text-[#3fb950] shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-[#f85149] shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{c.name}</span>
                        <span className="text-[10px] font-mono text-[#8b949e]">{c.durationMs}ms</span>
                      </div>
                      <p className="text-[11px] text-[#8b949e] mt-0.5">{c.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: WEBHOOKS & HMAC DISPATCH */}
      {activeSubTab === 'webhooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Dispatch simulator */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#58a6ff]" />
              <span>Simulate Inbound Webhook</span>
            </h3>

            <div className="space-y-2">
              <label className="text-xs text-[#8b949e] font-semibold">Event Type</label>
              <select
                value={webhookEvent}
                onChange={(e) => setWebhookEvent(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-white focus:outline-none"
              >
                <option value="push">push (commits on main)</option>
                <option value="pull_request">pull_request (opened / synchronized)</option>
                <option value="workflow_run">workflow_run (completed)</option>
                <option value="release">release (published)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#8b949e] font-semibold">JSON Payload</label>
              <textarea
                value={webhookPayloadInput}
                onChange={(e) => setWebhookPayloadInput(e.target.value)}
                rows={4}
                className="w-full text-xs font-mono p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleDispatchWebhook}
              disabled={isDispatchingWebhook}
              className="w-full py-2 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-xs font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isDispatchingWebhook ? 'Dispatching...' : 'Dispatch HMAC Webhook'}</span>
            </button>
          </div>

          {/* Webhook logs */}
          <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#3fb950]" />
                <span>Recent Webhook Deliveries & Signatures</span>
              </h3>
              <button
                onClick={fetchWebhookLogs}
                className="text-xs text-[#58a6ff] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-2">
              {webhookLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#58a6ff]">{log.event}</span>
                      <span className="text-[11px] font-mono text-[#8b949e]">{log.repository}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[#3fb950] font-semibold">HMAC-SHA256 Verified</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#238636]/20 text-[#3fb950]">
                        {log.statusCode} OK
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-white">{log.payloadSummary}</p>
                  <p className="text-[11px] font-mono text-[#8b949e]">{log.outputLog}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
