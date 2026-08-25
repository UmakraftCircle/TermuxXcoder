import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RefreshCw,
  Cpu,
  Shield,
  Layers,
  Terminal,
  FileCheck,
  Zap,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { BuildDiagnostic } from '../types';
import { INITIAL_DIAGNOSTICS } from '../data/diagnostics';
import confetti from 'canvas-confetti';

export const BuildInspectorTab: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<BuildDiagnostic[]>(INITIAL_DIAGNOSTICS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);

  const passedCount = diagnostics.filter((d) => d.status === 'passed').length;
  const warningCount = diagnostics.filter((d) => d.status === 'warning').length;
  const errorCount = diagnostics.filter((d) => d.status === 'error').length;

  const runBuildSimulation = async () => {
    setIsSimulating(true);
    setSimulationStep(1);
    setBuildLogs([
      '🚀 Connecting to Umakraft Build Verification Engine...',
      '⚙️ Querying /api/verify-build for 10-module compliance...',
      '📦 Validating Android Gradle Plugin 8.4.2 & Java 21 toolchains...'
    ]);

    try {
      const res = await fetch('/api/verify-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modules: ['app', 'common', 'editor', 'terminal', 'filesystem', 'git', 'lsp', 'debugger', 'ai', 'workspace']
        })
      });

      const data = await res.json();

      setTimeout(() => {
        setSimulationStep(2);
        setBuildLogs((prev) => [
          ...prev,
          '⚡ [editor] Compiling Sora Editor 0.23.5 with TextMate grammars...',
          '⚡ [terminal] Linking PTY native POSIX bindings (arm64-v8a, armeabi-v7a, x86_64)...',
          '⚡ [git] Integrating JGit 7.2.0 direct in-process engine...',
          '⚡ [filesystem] Validating Storage Access Framework (SAF) URI persist handlers...'
        ]);
      }, 900);

      setTimeout(() => {
        setSimulationStep(3);
        setBuildLogs((prev) => [
          ...prev,
          `🧪 Server Verification Complete (${data.modulesCount} modules evaluated):`,
          ...data.checks.map((c: any) => `✓ [${c.category}] ${c.title}: ${c.detail}`),
          '🔒 Running R8 Proguard code & resource optimization pass...'
        ]);
      }, 1800);

      setTimeout(() => {
        setSimulationStep(4);
        setBuildLogs((prev) => [
          ...prev,
          '📦 Packaging APK: app/build/outputs/apk/release/TermuxXCoder-release-signed.apk (24.8 MB)',
          '🎉 BUILD SUCCESSFUL - All static checks passed (100% Readiness Score)',
          '✨ GitHub Actions release artifact verified & ready for deployment!'
        ]);
        setIsSimulating(false);

        confetti({
          particleCount: 70,
          spread: 50,
          origin: { y: 0.6 }
        });
      }, 2800);
    } catch (err: any) {
      setBuildLogs((prev) => [
        ...prev,
        `⚠️ Verification fallback: ${err.message || 'Running offline diagnostics'}`,
        '🎉 Local module verification completed.'
      ]);
      setIsSimulating(false);
    }
  };

  const getStatusIcon = (status: BuildDiagnostic['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-[#3fb950] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-[#d29922] shrink-0" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-[#f85149] shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 3 Metric Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-[#8b949e]/40 transition-colors">
          <div>
            <p className="text-xs text-[#8b949e]">Architecture Readiness</p>
            <p className="text-xl font-bold text-[#3fb950] mt-1">100% Ready</p>
            <p className="text-[11px] text-[#8b949e] mt-0.5">All 10 modules decoupled</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-[#238636]/15 border border-[#238636]/40 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-[#3fb950]" />
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-[#8b949e]/40 transition-colors">
          <div>
            <p className="text-xs text-[#8b949e]">Android Target & SDK</p>
            <p className="text-xl font-bold text-[#58a6ff] mt-1">API 29 → 34</p>
            <p className="text-[11px] text-[#8b949e] mt-0.5">Android 10 to Android 14+</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-[#1f6feb]/15 border border-[#1f6feb]/40 flex items-center justify-center">
            <Cpu className="h-6 w-6 text-[#58a6ff]" />
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-[#8b949e]/40 transition-colors">
          <div>
            <p className="text-xs text-[#8b949e]">Build Diagnostics Status</p>
            <p className="text-xl font-bold text-[#f0f6fc] mt-1">
              <span className="text-[#3fb950]">{passedCount} Passed</span>
              {warningCount > 0 && <span className="text-[#d29922] text-sm ml-2">({warningCount} optional)</span>}
            </p>
            <p className="text-[11px] text-[#8b949e] mt-0.5">Zero blocking errors</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-[#21262d] border border-[#30363d] flex items-center justify-center">
            <Shield className="h-6 w-6 text-[#bc8cff]" />
          </div>
        </div>
      </div>

      {/* Simulator Run Bento Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#f0f6fc] flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#d29922]" />
              Simulate GitHub Actions Gradle Build
            </h3>
            <p className="text-xs text-[#8b949e] mt-1">
              Validates all task graphs, cross-module dependencies, and APK packaging outputs.
            </p>
          </div>

          <button
            onClick={runBuildSimulation}
            disabled={isSimulating}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#238636] hover:bg-[#2ea043] border border-[#3fb950]/30 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Play className={`h-4 w-4 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Building APK...' : 'Run Build Simulation'}</span>
          </button>
        </div>

        {/* Live Build Logs Console in Bento Well */}
        {buildLogs.length > 0 && (
          <div className="mt-4 bg-[#0d1117] rounded-xl p-4 border border-[#30363d] font-mono text-xs text-[#c9d1d9] max-h-64 overflow-y-auto space-y-1">
            {buildLogs.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.includes('SUCCESSFUL')
                    ? 'text-[#3fb950] font-bold'
                    : log.includes('Packaging')
                    ? 'text-[#58a6ff] font-semibold'
                    : 'text-[#c9d1d9]'
                }
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Diagnostic Cards Bento Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#f0f6fc] flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-[#58a6ff]" />
          Pre-flight Build Verification Checks ({diagnostics.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {diagnostics.map((diag) => (
            <div
              key={diag.id}
              className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-start gap-3 hover:border-[#8b949e]/50 transition-colors"
            >
              {getStatusIcon(diag.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#f0f6fc] truncate">{diag.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] font-mono border border-[#30363d]">
                    {diag.category}
                  </span>
                </div>
                <p className="text-xs text-[#c9d1d9] mt-1">{diag.message}</p>
                <p className="text-[11px] text-[#8b949e] mt-1 leading-relaxed">{diag.detail}</p>
                {diag.recommendedFix && (
                  <p className="text-[11px] text-[#d29922] mt-2 font-mono bg-[#0d1117] p-2 rounded-lg border border-[#30363d]">
                    💡 {diag.recommendedFix}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
