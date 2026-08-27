import React, { useState, useEffect } from 'react';
import {
  Layers,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Box,
  Cpu,
  Shield,
  FileCode,
  Sparkles,
  RefreshCw,
  FolderTree,
  Sliders,
  Check,
  Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GradleOverview {
  gradleVersion: string;
  agpVersion: string;
  kotlinVersion: string;
  composeCompilerVersion: string;
  kspVersion: string;
  jdkVersion: string;
  ndkVersion: string;
  sdkConfig: {
    compileSdk: number;
    minSdk: number;
    targetSdk: number;
    buildToolsVersion: string;
    ndkAbiFilters: string[];
  };
  buildVariants: Array<{
    name: string;
    isDebuggable: boolean;
    minifyEnabled: boolean;
    shrinkResources: boolean;
    signingConfig: string;
  }>;
  modulesCount: number;
  modules: Array<{
    name: string;
    path: string;
    type: string;
    dependenciesCount: number;
  }>;
  plugins: Array<{
    id: string;
    version: string;
    apply: boolean;
  }>;
  taskGraph: Array<{
    name: string;
    group: string;
    status: string;
    durationMs: number;
    description: string;
  }>;
  keyDependencies: Array<{
    group: string;
    artifact: string;
    version: string;
    scope: string;
  }>;
}

export const GradleInspectorTab: React.FC = () => {
  const [overview, setOverview] = useState<GradleOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<'tasks' | 'modules' | 'dependencies' | 'variants'>('tasks');
  const [runningTask, setRunningTask] = useState<string | null>(null);
  const [taskLogs, setTaskLogs] = useState<string[]>([]);
  const [selectedTaskName, setSelectedTaskName] = useState<string>('assembleDebug');
  const [copiedKts, setCopiedKts] = useState<boolean>(false);

  const fetchGradleData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gradle/inspect');
      const json = await res.json();
      if (json.success) {
        setOverview(json.overview);
      }
    } catch (err) {
      console.error('Failed to inspect gradle:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGradleData();
  }, []);

  const handleRunTask = async (taskName: string) => {
    setRunningTask(taskName);
    setTaskLogs([`> Starting Gradle execution for task :app:${taskName}...`]);
    try {
      const res = await fetch('/api/gradle/run-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskName })
      });
      const json = await res.json();
      if (json.success) {
        setTaskLogs(json.logs);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      }
    } catch (err) {
      console.error('Failed to run task:', err);
      setTaskLogs((prev) => [...prev, `❌ Task execution failed: ${err}`]);
    } finally {
      setRunningTask(null);
    }
  };

  const sampleKtsSnippet = `// Android Gradle Plugin 8.4.2 Configuration
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.jetbrains.kotlin.android)
    alias(libs.plugins.compose.compiler)
    alias(libs.plugins.google.ksp)
}

android {
    namespace = "com.umakraft.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.umakraft.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        ndk { abiFilters.addAll(listOf("arm64-v8a", "armeabi-v7a", "x86_64")) }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }
}`;

  const handleCopyKts = () => {
    navigator.clipboard.writeText(sampleKtsSnippet);
    setCopiedKts(true);
    setTimeout(() => setCopiedKts(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-3 sm:p-4 font-sans" id="gradle-inspector-container">
      {/* Header */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#02569B] to-[#0175C2] p-0.5 shadow shrink-0">
            <div className="h-full w-full bg-[#0d1117] rounded-[10px] flex items-center justify-center text-[#58a6ff]">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">Android Gradle Inspector & DAG Engine</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30 font-semibold">
                AGP 8.4.2 • Gradle 8.7 • Java 21
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Inspects task graphs, toolchain compatibility, dependencies, and build variants across 10 modules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={fetchGradleData}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-bold text-[#c9d1d9] border border-[#30363d] flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#58a6ff] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Toolchain & SDK Overview Bento Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] text-[#8b949e]">JVM Toolchain</span>
          <p className="text-sm font-mono font-bold text-white mt-1">{overview?.jdkVersion || 'Java 21 (Temurin)'}</p>
          <span className="text-[10px] text-[#3fb950] mt-1 block">Bytecode Target: 21</span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] text-[#8b949e]">Android SDK Standards</span>
          <p className="text-sm font-mono font-bold text-white mt-1">
            API {overview?.sdkConfig.minSdk || 26} → {overview?.sdkConfig.targetSdk || 34}
          </p>
          <span className="text-[10px] text-[#58a6ff] mt-1 block">Android 10 - Android 14</span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] text-[#8b949e]">Native NDK Toolchain</span>
          <p className="text-sm font-mono font-bold text-white mt-1">NDK {overview?.ndkVersion || 'r26b'}</p>
          <span className="text-[10px] text-[#e3b341] mt-1 block">arm64-v8a • x86_64</span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-sm">
          <span className="text-[11px] text-[#8b949e]">Kotlin & Compose</span>
          <p className="text-sm font-mono font-bold text-white mt-1">Kotlin {overview?.kotlinVersion || '2.0.0'}</p>
          <span className="text-[10px] text-[#bc8cff] mt-1 block">Compose Compiler 1.5.14</span>
        </div>
      </div>

      {/* Main Panel with Tabs */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm space-y-4">
        {/* Navigation Switcher */}
        <div className="flex items-center justify-between border-b border-[#30363d] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
            <button
              onClick={() => setActiveSection('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSection === 'tasks' ? 'bg-[#21262d] text-white shadow-sm' : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              Task Graph ({overview?.taskGraph.length || 10})
            </button>
            <button
              onClick={() => setActiveSection('modules')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSection === 'modules' ? 'bg-[#21262d] text-white shadow-sm' : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              Modules ({overview?.modules.length || 10})
            </button>
            <button
              onClick={() => setActiveSection('dependencies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSection === 'dependencies' ? 'bg-[#21262d] text-white shadow-sm' : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              Dependencies ({overview?.keyDependencies.length || 8})
            </button>
            <button
              onClick={() => setActiveSection('variants')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSection === 'variants' ? 'bg-[#21262d] text-white shadow-sm' : 'text-[#8b949e] hover:text-[#c9d1d9]'
              }`}
            >
              Build Variants
            </button>
          </div>

          <button
            onClick={handleCopyKts}
            className="px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs text-[#c9d1d9] border border-[#30363d] flex items-center gap-1.5 transition-all"
          >
            {copiedKts ? <Check className="h-3.5 w-3.5 text-[#3fb950]" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedKts ? 'Copied build.gradle.kts' : 'Copy build.gradle.kts'}</span>
          </button>
        </div>

        {/* SECTION 1: TASK GRAPH & LIVE RUNNER */}
        {activeSection === 'tasks' && (
          <div className="space-y-4">
            {/* Quick Task Runner Bar */}
            <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white">Execute Task:</span>
                {['assembleDebug', 'assembleRelease', 'lintDebug', 'testDebugUnitTest', 'kspDebugKotlin'].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleRunTask(t)}
                    disabled={runningTask !== null}
                    className="px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[11px] font-mono text-[#58a6ff] border border-[#30363d] flex items-center gap-1 transition-all active:scale-95"
                  >
                    <Play className="h-2.5 w-2.5" />
                    <span>:{t}</span>
                  </button>
                ))}
              </div>

              {runningTask && (
                <div className="flex items-center gap-2 text-xs text-[#e3b341]">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Executing :{runningTask}...</span>
                </div>
              )}
            </div>

            {/* Task Logs if any */}
            {taskLogs.length > 0 && (
              <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] font-mono text-xs text-[#c9d1d9] space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                <div className="text-[11px] text-[#8b949e] font-bold uppercase tracking-wider mb-1">Gradle Daemon Output</div>
                {taskLogs.map((log, idx) => (
                  <div key={idx} className={log.includes('SUCCESS') ? 'text-[#3fb950] font-bold' : ''}>
                    {log}
                  </div>
                ))}
              </div>
            )}

            {/* Task Graph Table */}
            <div className="space-y-2">
              {overview?.taskGraph.map((task) => (
                <div
                  key={task.name}
                  className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#8b949e]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{task.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e]">
                        group: {task.group}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8b949e] mt-0.5">{task.description}</p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <span className="text-[11px] font-mono text-[#8b949e] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{task.durationMs}ms</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        task.status === 'FROM-CACHE'
                          ? 'bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30'
                          : task.status === 'UP-TO-DATE'
                          ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30'
                          : task.status === 'SUCCESS'
                          ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40'
                          : 'bg-[#ffa657]/15 text-[#ffa657] border border-[#ffa657]/30'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: 10 SUBMODULES */}
        {activeSection === 'modules' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overview?.modules.map((mod) => (
              <div key={mod.name} className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-white">{mod.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#58a6ff] border border-[#30363d]">
                    {mod.type}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#8b949e]">
                  <span>Path: /{mod.path}</span>
                  <span>{mod.dependenciesCount} dependencies</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SECTION 3: DEPENDENCY GRAPH */}
        {activeSection === 'dependencies' && (
          <div className="space-y-2">
            {overview?.keyDependencies.map((dep, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-white">{dep.group}:{dep.artifact}</span>
                  <span className="text-[11px] font-mono text-[#8b949e] block">scope: {dep.scope}</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#3fb950] bg-[#21262d] px-2 py-1 rounded border border-[#30363d]">
                  v{dep.version}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* SECTION 4: BUILD VARIANTS */}
        {activeSection === 'variants' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {overview?.buildVariants.map((v) => (
              <div key={v.name} className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-white uppercase">{v.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f6feb]/20 text-[#58a6ff]">
                    {v.isDebuggable ? 'DEBUGGABLE' : 'PRODUCTION'}
                  </span>
                </div>
                <div className="text-xs text-[#8b949e] space-y-1">
                  <div>Minification: {v.minifyEnabled ? 'R8 / Proguard ON' : 'Disabled'}</div>
                  <div>Shrink Resources: {v.shrinkResources ? 'Enabled' : 'Disabled'}</div>
                  <div>Signing: {v.signingConfig}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
