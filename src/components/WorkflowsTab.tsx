import React, { useState } from 'react';
import {
  Play,
  Copy,
  Check,
  CheckCircle2,
  Workflow,
  Sparkles,
  ArrowRight,
  Shield,
  FileCode,
  Terminal,
  Cpu,
  Package,
  Layers
} from 'lucide-react';
import { ProjectFile, GitSecretItem } from '../types';
import { GITHUB_SECRETS_LIST } from '../data/diagnostics';

interface WorkflowsTabProps {
  files: ProjectFile[];
  onSelectFile: (file: ProjectFile) => void;
}

export const WorkflowsTab: React.FC<WorkflowsTabProps> = ({ files, onSelectFile }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<'android' | 'release' | 'lint'>('android');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeBuildType, setActiveBuildType] = useState<'debug' | 'release' | 'all'>('all');

  const workflowFiles = {
    android: files.find((f) => f.path === '.github/workflows/android.yml'),
    release: files.find((f) => f.path === '.github/workflows/release.yml'),
    lint: files.find((f) => f.path === '.github/workflows/lint.yml')
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                GitHub Actions Automated CI/CD
              </span>
              <span className="text-xs text-slate-400">Zero-Config APK Pipeline</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Push to GitHub → Get Downloadable APK
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Deterministic Android builds using Temurin JDK 21, Android NDK r26b for the embedded PTY shell,
              Sora Editor TextMate engine, JGit 7.2.0, and automated artifact publishing.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                const target = workflowFiles[selectedWorkflow];
                if (target) onSelectFile(target);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
            >
              <FileCode className="h-4 w-4 text-cyan-400" />
              <span>Edit YAML in Studio</span>
            </button>
            <button
              onClick={() => {
                const currentContent = workflowFiles[selectedWorkflow]?.content || '';
                handleCopy(currentContent, 'workflow-content');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-slate-950 transition-colors"
            >
              {copiedKey === 'workflow-content' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedKey === 'workflow-content' ? 'Copied YAML!' : 'Copy Workflow'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Tabs Selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex p-1 bg-slate-900/80 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setSelectedWorkflow('android')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedWorkflow === 'android'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            android.yml (CI & Debug/Release APK)
          </button>
          <button
            onClick={() => setSelectedWorkflow('release')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedWorkflow === 'release'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            release.yml (Tag v*.*.* GitHub Release)
          </button>
          <button
            onClick={() => setSelectedWorkflow('lint')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedWorkflow === 'lint'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            lint.yml (Code Quality)
          </button>
        </div>
      </div>

      {/* Workflow Architecture Pipeline Visualizer */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Workflow className="h-4 w-4 text-cyan-400" />
          Pipeline Execution Stages ({selectedWorkflow === 'android' ? 'Android CI' : selectedWorkflow === 'release' ? 'Release Production' : 'Lint'})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Stage 1</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-sm font-semibold text-white">Environment Setup</p>
              <p className="text-xs text-slate-400 mt-1">
                • Checkout recursive<br />
                • JDK 21 (Temurin + Gradle Cache)<br />
                • Android NDK r26b (PTY ABI)
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-cyan-400 font-mono">
              ubuntu-latest
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Stage 2</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-sm font-semibold text-white">Lint & Tests</p>
              <p className="text-xs text-slate-400 mt-1">
                • ./gradlew lintDebug<br />
                • Unit tests across 10 modules<br />
                • JGit + Sora symbol checks
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-mono">
              testDebugUnitTest
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Stage 3</span>
                <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              </div>
              <p className="text-sm font-semibold text-white">APK Assembly</p>
              <p className="text-xs text-slate-400 mt-1">
                • assembleDebug (Unsigned)<br />
                • assembleRelease (Signed via Keystore Secret)<br />
                • R8 code + resource shrink
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-cyan-400 font-mono">
              app/build/outputs/apk
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Stage 4</span>
                <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
              </div>
              <p className="text-sm font-semibold text-white">Artifacts & Release</p>
              <p className="text-xs text-slate-400 mt-1">
                • Upload APK Artifacts (30 days)<br />
                • Checksums (SHA-256)<br />
                • Tag-based GitHub Release
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-indigo-400 font-mono">
              TermuxXCoder-apk
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer for Active Workflow */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-mono font-medium text-slate-200">
              {workflowFiles[selectedWorkflow]?.path}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {workflowFiles[selectedWorkflow]?.description}
          </span>
        </div>

        <div className="p-4 bg-slate-950/90 overflow-x-auto max-h-96">
          <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre">
            {workflowFiles[selectedWorkflow]?.content}
          </pre>
        </div>
      </div>

      {/* GitHub Repository Secrets Reference */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              GitHub Repository Secrets for Production APK Signing
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Configure in GitHub Repo &gt; Settings &gt; Secrets and variables &gt; Actions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {GITHUB_SECRETS_LIST.map((secret) => (
            <div
              key={secret.key}
              className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono font-bold text-amber-300">{secret.key}</code>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {secret.requiredFor}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{secret.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono truncate max-w-[180px]">
                  Ex: {secret.sampleValue}
                </span>
                <button
                  onClick={() => handleCopy(secret.key, secret.key)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                >
                  {copiedKey === secret.key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey === secret.key ? 'Copied' : 'Copy Secret Name'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
