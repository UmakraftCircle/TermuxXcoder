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
      {/* Overview Bento Card */}
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/40">
                GitHub Actions Automated CI/CD
              </span>
              <span className="text-xs text-[#8b949e]">Zero-Config APK Pipeline</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#f0f6fc] tracking-tight">
              Push to GitHub → Get Downloadable APK
            </h2>
            <p className="text-sm text-[#8b949e] max-w-2xl mt-1">
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#30363d] transition-colors"
            >
              <FileCode className="h-4 w-4 text-[#58a6ff]" />
              <span>Edit YAML in Studio</span>
            </button>
            <button
              onClick={() => {
                const currentContent = workflowFiles[selectedWorkflow]?.content || '';
                handleCopy(currentContent, 'workflow-content');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-xs font-semibold text-white border border-[#3fb950]/30 shadow-sm transition-colors"
            >
              {copiedKey === 'workflow-content' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedKey === 'workflow-content' ? 'Copied YAML!' : 'Copy Workflow'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Tabs Selector in Bento Capsule */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2 p-1.5 bg-[#161b22] rounded-2xl border border-[#30363d] w-full sm:w-auto">
          <button
            onClick={() => setSelectedWorkflow('android')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all min-h-[44px] ${
              selectedWorkflow === 'android'
                ? 'bg-[#1f6feb] text-white shadow-md shadow-[#1f6feb]/20 font-bold'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Workflow className={`h-4 w-4 ${selectedWorkflow === 'android' ? 'text-white' : 'text-[#58a6ff]'}`} />
            <span>android.yml (CI Build)</span>
          </button>
          <button
            onClick={() => setSelectedWorkflow('release')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all min-h-[44px] ${
              selectedWorkflow === 'release'
                ? 'bg-[#1f6feb] text-white shadow-md shadow-[#1f6feb]/20 font-bold'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <Play className={`h-4 w-4 ${selectedWorkflow === 'release' ? 'text-white' : 'text-[#3fb950]'}`} />
            <span>release.yml (Tag Release)</span>
          </button>
          <button
            onClick={() => setSelectedWorkflow('lint')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all min-h-[44px] ${
              selectedWorkflow === 'lint'
                ? 'bg-[#1f6feb] text-white shadow-md shadow-[#1f6feb]/20 font-bold'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
            }`}
          >
            <CheckCircle2 className={`h-4 w-4 ${selectedWorkflow === 'lint' ? 'text-white' : 'text-[#d29922]'}`} />
            <span>lint.yml (Code Quality)</span>
          </button>
        </div>
      </div>

      {/* Workflow Architecture Pipeline Visualizer Bento Grid */}
      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-5">
        <h3 className="text-sm font-semibold text-[#f0f6fc] mb-4 flex items-center gap-2">
          <Workflow className="h-4 w-4 text-[#58a6ff]" />
          Pipeline Execution Stages ({selectedWorkflow === 'android' ? 'Android CI' : selectedWorkflow === 'release' ? 'Release Production' : 'Lint'})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-[#0d1117] rounded-xl p-3.5 border border-[#30363d] flex flex-col justify-between hover:border-[#8b949e]/50 transition-colors">
            <div>
              <div className="flex items-center justify-between text-xs text-[#8b949e] mb-1">
                <span>Stage 1</span>
                <span className="h-2 w-2 rounded-full bg-[#3fb950]"></span>
              </div>
              <p className="text-sm font-semibold text-[#f0f6fc]">Environment Setup</p>
              <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
                • Checkout recursive<br />
                • JDK 21 (Temurin + Cache)<br />
                • Android NDK r26b (PTY ABI)
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#30363d] text-[11px] text-[#58a6ff] font-mono">
              ubuntu-latest
            </div>
          </div>

          <div className="bg-[#0d1117] rounded-xl p-3.5 border border-[#30363d] flex flex-col justify-between hover:border-[#8b949e]/50 transition-colors">
            <div>
              <div className="flex items-center justify-between text-xs text-[#8b949e] mb-1">
                <span>Stage 2</span>
                <span className="h-2 w-2 rounded-full bg-[#3fb950]"></span>
              </div>
              <p className="text-sm font-semibold text-[#f0f6fc]">Lint & Tests</p>
              <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
                • ./gradlew lintDebug<br />
                • Unit tests across 10 modules<br />
                • JGit + Sora symbol checks
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#30363d] text-[11px] text-[#3fb950] font-mono">
              testDebugUnitTest
            </div>
          </div>

          <div className="bg-[#0d1117] rounded-xl p-3.5 border border-[#30363d] flex flex-col justify-between hover:border-[#8b949e]/50 transition-colors">
            <div>
              <div className="flex items-center justify-between text-xs text-[#8b949e] mb-1">
                <span>Stage 3</span>
                <span className="h-2 w-2 rounded-full bg-[#58a6ff]"></span>
              </div>
              <p className="text-sm font-semibold text-[#f0f6fc]">APK Assembly</p>
              <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
                • assembleDebug (Unsigned)<br />
                • assembleRelease (Signed via Secret)<br />
                • R8 code + resource shrink
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#30363d] text-[11px] text-[#58a6ff] font-mono">
              app/build/outputs/apk
            </div>
          </div>

          <div className="bg-[#0d1117] rounded-xl p-3.5 border border-[#30363d] flex flex-col justify-between hover:border-[#8b949e]/50 transition-colors">
            <div>
              <div className="flex items-center justify-between text-xs text-[#8b949e] mb-1">
                <span>Stage 4</span>
                <span className="h-2 w-2 rounded-full bg-[#bc8cff]"></span>
              </div>
              <p className="text-sm font-semibold text-[#f0f6fc]">Artifacts & Release</p>
              <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
                • Upload APK Artifacts (30 days)<br />
                • Checksums (SHA-256)<br />
                • Tag-based GitHub Release
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#30363d] text-[11px] text-[#bc8cff] font-mono">
              TermuxXCoder-apk
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer Bento Card for Active Workflow */}
      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] overflow-hidden">
        <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-[#58a6ff]" />
            <span className="text-xs font-mono font-medium text-[#f0f6fc]">
              {workflowFiles[selectedWorkflow]?.path}
            </span>
          </div>
          <span className="text-xs text-[#8b949e]">
            {workflowFiles[selectedWorkflow]?.description}
          </span>
        </div>

        <div className="p-4 bg-[#0d1117] overflow-x-auto max-h-96">
          <pre className="text-xs font-mono text-[#c9d1d9] leading-relaxed whitespace-pre">
            {workflowFiles[selectedWorkflow]?.content}
          </pre>
        </div>
      </div>

      {/* GitHub Repository Secrets Bento Grid */}
      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#d29922]" />
            <h3 className="text-sm font-semibold text-[#f0f6fc]">
              GitHub Repository Secrets for Production APK Signing
            </h3>
          </div>
          <span className="text-xs text-[#8b949e]">
            Configure in GitHub Repo &gt; Settings &gt; Secrets and variables &gt; Actions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {GITHUB_SECRETS_LIST.map((secret) => (
            <div
              key={secret.key}
              className="bg-[#0d1117] rounded-xl p-3.5 border border-[#30363d] flex flex-col justify-between hover:border-[#8b949e]/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono font-bold text-[#d29922]">{secret.key}</code>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#21262d] text-[#c9d1d9] border border-[#30363d]">
                    {secret.requiredFor}
                  </span>
                </div>
                <p className="text-xs text-[#8b949e] mt-1.5">{secret.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#30363d] flex items-center justify-between">
                <span className="text-[11px] text-[#8b949e] font-mono truncate max-w-[180px]">
                  Ex: {secret.sampleValue}
                </span>
                <button
                  onClick={() => handleCopy(secret.key, secret.key)}
                  className="text-xs text-[#58a6ff] hover:text-[#79c0ff] font-medium flex items-center gap-1"
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
