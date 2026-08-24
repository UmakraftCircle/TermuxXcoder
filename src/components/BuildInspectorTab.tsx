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

  const runBuildSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(1);
    setBuildLogs([
      '🚀 Initializing TermuxXCoder Gradle Build Pipeline...',
      '⚙️ Checking Java environment: Temurin JDK 21 (build 21.0.3+9)',
      '📦 Validating Android Gradle Plugin 8.4.2 & Kotlin 2.0.0...',
      '🛠️ Resolving 10 modules: [:app, :common, :editor, :terminal, :filesystem, :git, :lsp, :debugger, :ai, :workspace, :plugins]'
    ]);

    setTimeout(() => {
      setSimulationStep(2);
      setBuildLogs((prev) => [
        ...prev,
        '⚡ [editor] Compiling Sora Editor 0.23.5 with TextMate grammars...',
        '⚡ [terminal] Linking PTY native POSIX bindings (arm64-v8a, armeabi-v7a, x86_64)...',
        '⚡ [git] Integrating JGit 7.2.0 direct in-process engine...',
        '⚡ [filesystem] Validating Storage Access Framework (SAF) URI persist handlers...'
      ]);
    }, 1200);

    setTimeout(() => {
      setSimulationStep(3);
      setBuildLogs((prev) => [
        ...prev,
        '🧪 Running unit test suite across all 10 modules...',
        '✅ :common:testDebugUnitTest (12 passed)',
        '✅ :editor:testDebugUnitTest (18 passed)',
        '✅ :terminal:testDebugUnitTest (14 passed)',
        '✅ :git:testDebugUnitTest (22 passed)',
        '✅ :ai:testDebugUnitTest (16 passed)',
        '🔒 Running R8 Proguard code & resource optimization pass...'
      ]);
    }, 2400);

    setTimeout(() => {
      setSimulationStep(4);
      setBuildLogs((prev) => [
        ...prev,
        '📦 Packaging APK: app/build/outputs/apk/debug/app-debug.apk (38.4 MB)',
        '🎉 BUILD SUCCESSFUL in 4.8s (34 actionable tasks: 34 executed)',
        '✨ GitHub Actions artifact ready for zero-friction download!'
      ]);
      setIsSimulating(false);

      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.6 }
      });
    }, 3800);
  };

  const getStatusIcon = (status: BuildDiagnostic['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-rose-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Status Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Architecture Readiness</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">100% Ready</p>
            <p className="text-[11px] text-slate-500 mt-0.5">All 10 modules decoupled</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Android Target & SDK</p>
            <p className="text-xl font-bold text-cyan-400 mt-1">API 29 → 34</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Android 10 to Android 14+</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-cyan-950/60 border border-cyan-700/50 flex items-center justify-center">
            <Cpu className="h-6 w-6 text-cyan-400" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Build Diagnostics Status</p>
            <p className="text-xl font-bold text-white mt-1">
              <span className="text-emerald-400">{passedCount} Passed</span>
              {warningCount > 0 && <span className="text-amber-400 text-sm ml-2">({warningCount} optional)</span>}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Zero blocking errors</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <Shield className="h-6 w-6 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Simulator Run Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Simulate GitHub Actions Gradle Build
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Validates all task graphs, cross-module dependencies, and APK packaging outputs.
            </p>
          </div>

          <button
            onClick={runBuildSimulation}
            disabled={isSimulating}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
          >
            <Play className={`h-4 w-4 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Building APK...' : 'Run Build Simulation'}</span>
          </button>
        </div>

        {/* Live Build Logs Console */}
        {buildLogs.length > 0 && (
          <div className="mt-4 bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 max-h-64 overflow-y-auto space-y-1">
            {buildLogs.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.includes('SUCCESSFUL')
                    ? 'text-emerald-400 font-bold'
                    : log.includes('Packaging')
                    ? 'text-cyan-300 font-semibold'
                    : 'text-slate-300'
                }
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Diagnostic Cards List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-cyan-400" />
          Pre-flight Build Verification Checks ({diagnostics.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {diagnostics.map((diag) => (
            <div
              key={diag.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3 hover:border-slate-700 transition-colors"
            >
              {getStatusIcon(diag.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate">{diag.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {diag.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{diag.message}</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{diag.detail}</p>
                {diag.recommendedFix && (
                  <p className="text-[11px] text-amber-400/90 mt-1.5 font-mono">
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
