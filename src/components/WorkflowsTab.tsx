import React, { useState } from 'react';
import {
  Workflow,
  Download,
  Copy,
  Check,
  Play,
  FileCode,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Code2,
  Boxes,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  Terminal,
  Settings,
  KeyRound
} from 'lucide-react';
import { ProjectFile } from '../types';
import confetti from 'canvas-confetti';

interface WorkflowsTabProps {
  files: ProjectFile[];
  onSelectFile?: (file: ProjectFile) => void;
  onOpenInEditor?: (fileName: string) => void;
}

export const WorkflowsTab: React.FC<WorkflowsTabProps> = ({ files, onSelectFile, onOpenInEditor }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<'android' | 'release' | 'lint'>('android');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'yaml' | 'pipeline' | 'secrets'>('pipeline');

  const workflows = {
    android: {
      fileName: '.github/workflows/android.yml',
      title: 'CI Build & APK Matrix',
      badge: 'Main Trigger',
      badgeColor: 'text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/30',
      description: 'Triggered on push/PR to main. Builds debug & release APKs with Temurin JDK 21 and NDK r26b.',
      steps: [
        { name: '1. Checkout & JDK 21', detail: 'actions/checkout@v4 + temurin-21 with cache', time: '~45s' },
        { name: '2. Setup Android NDK r26b', detail: 'Configures native C++ toolchain for PTY bridge', time: '~30s' },
        { name: '3. Assemble Release APK', detail: './gradlew assembleRelease --no-daemon --stacktrace', time: '~2m 10s' },
        { name: '4. Upload APK Artifact', detail: 'actions/upload-artifact@v4 (retention: 30 days)', time: '~15s' }
      ]
    },
    release: {
      fileName: '.github/workflows/release.yml',
      title: 'Signed GitHub Release',
      badge: 'Tag Trigger',
      badgeColor: 'text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]/30',
      description: 'Triggered on tag push (v*). Signs release APK using RSA 4096-bit Keystore and creates GitHub Release.',
      steps: [
        { name: '1. Tag Event Trigger', detail: 'Fires automatically when Git tag v* is pushed', time: '~5s' },
        { name: '2. Restore PKCS12 Secrets', detail: 'Decodes ANDROID_KEYSTORE_BASE64 from GitHub Secrets', time: '~10s' },
        { name: '3. Sign APK with Apksigner', detail: 'v2/v3 APK signature scheme with SHA-256 digest', time: '~40s' },
        { name: '4. Publish GitHub Release', detail: 'softprops/action-gh-release with APK and SHA256 checksums', time: '~20s' }
      ]
    },
    lint: {
      fileName: '.github/workflows/lint.yml',
      title: 'Static Code Quality Pass',
      badge: 'PR Check',
      badgeColor: 'text-[#ffa657] bg-[#ffa657]/10 border-[#ffa657]/30',
      description: 'Runs ktlint, Android Lint, and Spotless formatter checks on all 10 modules before merging.',
      steps: [
        { name: '1. Matrix Lint Pass', detail: 'Parallel execution across all 10 workspace modules', time: '~35s' },
        { name: '2. AGP & NDK Lint', detail: 'Verifies C++ JNI bindings and AndroidManifest permissions', time: '~25s' },
        { name: '3. SARIF Report Export', detail: 'Uploads static analysis findings directly to GitHub Security', time: '~15s' }
      ]
    }
  };

  const currentWf = workflows[selectedWorkflow];
  const fileObj = files.find((f) => f.name === currentWf.fileName);
  const yamlContent =
    fileObj?.content ||
    `name: ${currentWf.title}\non:\n  push:\n    branches: [ main ]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4`;

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    confetti({ particleCount: 15, spread: 35, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto p-3 sm:p-4 font-sans" id="workflows-tab-container">
      {/* 1. Compact Hero Header Bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#ffa657] to-[#d2a8ff] p-0.5 shadow shrink-0">
            <div className="h-full w-full bg-[#0d1117] rounded-[10px] flex items-center justify-center text-[#ffa657]">
              <Workflow className="h-5 w-5" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                GitHub CI/CD Automation
              </h2>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30 font-semibold shrink-0">
                Zero-Config APK Pipeline
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5 truncate">
              Automated Temurin JDK 21 + NDK r26b builds, APK artifact publishing, and signing.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {(onOpenInEditor || onSelectFile) && (
            <button
              onClick={() => {
                if (onOpenInEditor) {
                  onOpenInEditor(currentWf.fileName);
                } else if (onSelectFile && fileObj) {
                  onSelectFile(fileObj);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-bold text-[#c9d1d9] hover:text-white border border-[#30363d] flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Code2 className="h-3.5 w-3.5 text-[#58a6ff]" />
              <span>Edit YAML</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-xs font-bold text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-white" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy YAML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Compact Segmented Workflow Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Left: Workflow Selection Tabs */}
        <div className="flex items-center bg-[#161b22] p-1 rounded-xl border border-[#30363d] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedWorkflow('android')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedWorkflow === 'android'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Play className="h-3 w-3 text-[#79c0ff]" />
            <span>android.yml (CI Build)</span>
          </button>
          <button
            onClick={() => setSelectedWorkflow('release')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedWorkflow === 'release'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Shield className="h-3 w-3 text-[#3fb950]" />
            <span>release.yml (Tag Release)</span>
          </button>
          <button
            onClick={() => setSelectedWorkflow('lint')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedWorkflow === 'lint'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <CheckCircle2 className="h-3 w-3 text-[#ffa657]" />
            <span>lint.yml (Code Quality)</span>
          </button>
        </div>

        {/* Right: Sub-View Mode Toggle (Pipeline Steps | Raw YAML | Secrets Vault) */}
        <div className="flex items-center bg-[#0d1117] p-1 rounded-xl border border-[#30363d] self-start sm:self-auto shrink-0">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'pipeline'
                ? 'bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/30 shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Pipeline Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('yaml')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'yaml'
                ? 'bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/30 shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <FileCode className="h-3 w-3" />
            <span>YAML Source</span>
          </button>
          <button
            onClick={() => setActiveTab('secrets')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'secrets'
                ? 'bg-[#21262d] text-[#ffa657] border border-[#ffa657]/30 shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <KeyRound className="h-3 w-3" />
            <span>Secrets</span>
          </button>
        </div>
      </div>

      {/* 3. Sub-View Contents */}

      {/* VIEW A: INTERACTIVE PIPELINE MATRIX */}
      {activeTab === 'pipeline' && (
        <div className="space-y-3">
          {/* Workflow Summary Header */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${currentWf.badgeColor}`}>
                {currentWf.badge}
              </span>
              <span className="text-xs text-[#c9d1d9] truncate">
                {currentWf.description}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#8b949e] shrink-0 bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
              {currentWf.fileName}
            </span>
          </div>

          {/* Pipeline Step Grid (Compact 4-column responsive) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {currentWf.steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-[#161b22] border border-[#30363d] hover:border-[#58a6ff]/50 rounded-xl p-3 flex flex-col justify-between transition-all group shadow-sm"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white group-hover:text-[#58a6ff] transition-colors">
                      {step.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#3fb950] bg-[#238636]/15 px-1.5 py-0.2 rounded">
                      {step.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8b949e] font-mono leading-relaxed">
                    {step.detail}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-[#30363d] flex items-center justify-between text-[10px] font-mono text-[#8b949e]">
                  <span className="flex items-center gap-1 text-[#3fb950]">
                    <CheckCircle2 className="h-3 w-3" />
                    Automated
                  </span>
                  <span>Step {idx + 1} of {currentWf.steps.length}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Push Trigger Banner */}
          <div className="p-3 bg-[#161b22]/70 border border-[#30363d] rounded-xl flex items-center justify-between gap-3 text-xs text-[#8b949e]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#ffa657]" />
              <span>When you push to GitHub, Actions automatically compiles the APK and attaches it to the run.</span>
            </div>
            <span className="text-[11px] font-mono text-[#79c0ff] shrink-0 font-semibold">
              Ubuntu 24.04 Runner
            </span>
          </div>
        </div>
      )}

      {/* VIEW B: YAML SOURCE VIEWER */}
      {activeTab === 'yaml' && (
        <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl overflow-hidden shadow-inner">
          <div className="bg-[#161b22] px-3.5 py-2 border-b border-[#30363d] flex items-center justify-between text-xs font-mono text-[#8b949e]">
            <div className="flex items-center gap-2 text-white font-bold">
              <FileCode className="h-3.5 w-3.5 text-[#58a6ff]" />
              <span>{currentWf.fileName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[11px] font-semibold text-white border border-[#30363d] flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="h-3 w-3 text-[#3fb950]" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
          <pre className="p-3 sm:p-4 text-xs font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed max-h-96">
            <code>{yamlContent}</code>
          </pre>
        </div>
      )}

      {/* VIEW C: GITHUB SECRETS VAULT GUIDE */}
      {activeTab === 'secrets' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <KeyRound className="h-4 w-4 text-[#ffa657]" />
            <span>Required GitHub Repository Secrets (Settings &rarr; Secrets and variables &rarr; Actions)</span>
          </div>
          <p className="text-xs text-[#8b949e]">
            To enable automated APK signing on tag releases, configure these secrets in your remote GitHub repository:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-[#58a6ff] font-bold">
                <span>ANDROID_KEYSTORE_BASE64</span>
                <span className="text-[10px] text-[#8b949e]">Secret</span>
              </div>
              <p className="text-[11px] text-[#8b949e]">Base64 encoded string of your release.keystore PKCS12 file.</p>
            </div>

            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-[#58a6ff] font-bold">
                <span>KEYSTORE_PASSWORD</span>
                <span className="text-[10px] text-[#8b949e]">Secret</span>
              </div>
              <p className="text-[11px] text-[#8b949e]">Password for unlocking the release keystore vault.</p>
            </div>

            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-[#58a6ff] font-bold">
                <span>KEY_ALIAS</span>
                <span className="text-[10px] text-[#8b949e]">Secret</span>
              </div>
              <p className="text-[11px] text-[#8b949e]">Alias identifier of the signing key (e.g. umakraft-key).</p>
            </div>

            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-[#58a6ff] font-bold">
                <span>KEY_PASSWORD</span>
                <span className="text-[10px] text-[#8b949e]">Secret</span>
              </div>
              <p className="text-[11px] text-[#8b949e]">Password for the private signing key certificate.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
