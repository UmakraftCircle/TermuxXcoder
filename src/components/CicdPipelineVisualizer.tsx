import React, { useState, useEffect } from 'react';
import {
  GitFork,
  Play,
  CheckCircle2,
  Clock,
  Box,
  Layers,
  ArrowRight,
  Terminal,
  ShieldCheck,
  Download,
  Sparkles,
  RefreshCw,
  Cpu,
  Check,
  Copy,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PipelineNode {
  id: string;
  label: string;
  status: 'success' | 'running' | 'pending' | 'failed';
  duration: string;
  runner: string;
  cache?: string;
}

interface PipelineStage {
  id: string;
  name: string;
  type: string;
  status: 'success' | 'running' | 'pending';
  duration: string;
  nodes: PipelineNode[];
}

interface PipelineData {
  name: string;
  trigger: string;
  totalStages: number;
  stages: PipelineStage[];
}

export const CicdPipelineVisualizer: React.FC = () => {
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [selectedNode, setSelectedNode] = useState<PipelineNode | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<string>('android.yml');
  const [copiedYaml, setCopiedYaml] = useState<boolean>(false);

  const fetchPipeline = async () => {
    try {
      const res = await fetch('/api/cicd/pipeline');
      const json = await res.json();
      if (json.success) {
        setPipeline(json.pipeline);
        if (json.pipeline.stages.length > 0 && json.pipeline.stages[0].nodes.length > 0) {
          setSelectedNode(json.pipeline.stages[0].nodes[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load CI/CD pipeline:', err);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleSimulateRun = async () => {
    setIsSimulating(true);
    setSimulationLogs(['▶ Triggering automated GitHub Actions pipeline simulation...']);
    try {
      const res = await fetch('/api/cicd/simulate-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowName: activeWorkflow, branch: 'main' })
      });
      const json = await res.json();
      if (json.success) {
        setSimulationLogs(json.logs);
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error('Failed to simulate CI/CD run:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const sampleWorkflowYaml = `name: Android CI & Release Build
on:
  push:
    branches: [ "main", "develop" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build:
    name: Build & Package APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up JDK 21 (Temurin)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'
          cache: 'gradle'

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      - name: Run Lint and Unit Tests
        run: ./gradlew lintDebug testDebugUnitTest --no-daemon

      - name: Assemble Release APK
        run: ./gradlew assembleRelease --no-daemon

      - name: Sign APK Artifact
        uses: r0adkll/sign-android-release@v1
        id: sign_app
        with:
          releaseDirectory: app/build/outputs/apk/release
          signingKey: \${{ secrets.KEYSTORE_BASE64 }}
          alias: \${{ secrets.KEY_ALIAS }}
          keyStorePassword: \${{ secrets.KEYSTORE_PASSWORD }}
          keyPassword: \${{ secrets.KEY_PASSWORD }}

      - name: Upload Release APK
        uses: actions/upload-artifact@v4
        with:
          name: TermuxXCoder-release.apk
          path: \${{ steps.sign_app.outputs.signedReleaseFile }}`;

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(sampleWorkflowYaml);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-3 sm:p-4 font-sans" id="cicd-visualizer-container">
      {/* Header */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#8957e5] to-[#6e40c9] p-0.5 shadow shrink-0">
            <div className="h-full w-full bg-[#0d1117] rounded-[10px] flex items-center justify-center text-[#bc8cff]">
              <GitFork className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">CI/CD Pipeline DAG Visualizer</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8957e5]/20 text-[#bc8cff] border border-[#8957e5]/40 font-semibold">
                GitHub Actions Matrix
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Interactive node graph for workflows, JDK 21 build caches, and automated release packaging.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <select
            value={activeWorkflow}
            onChange={(e) => setActiveWorkflow(e.target.value)}
            className="text-xs font-mono px-2.5 py-1.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none"
          >
            <option value="android.yml">android.yml (Matrix Build)</option>
            <option value="release.yml">release.yml (APK Sign & Tag)</option>
            <option value="lint.yml">lint.yml (Spotless & ktlint)</option>
          </select>

          <button
            onClick={handleSimulateRun}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow active:scale-95"
          >
            <Play className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating Pipeline...' : 'Simulate Run'}</span>
          </button>
        </div>
      </div>

      {/* Visual DAG Pipeline Flowchart */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">Workflow Execution Stages</h3>
          <span className="text-[11px] font-mono text-[#3fb950] flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>All Stages Verified (Total: 2m 24s)</span>
          </span>
        </div>

        {/* Pipeline Stage Cards in Responsive Flow */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {pipeline?.stages.map((stage, idx) => (
            <div
              key={stage.id}
              className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 flex flex-col justify-between relative group hover:border-[#58a6ff]/50 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
                  <span className="text-[10px] font-mono text-[#8b949e] font-bold">STAGE {idx + 1}</span>
                  <span className="text-[10px] font-mono text-[#3fb950] font-semibold">{stage.duration}</span>
                </div>
                <h4 className="text-xs font-bold text-white mt-2 mb-2.5">{stage.name}</h4>

                {/* Nodes inside stage */}
                <div className="space-y-1.5">
                  {stage.nodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <button
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${
                          isSelected
                            ? 'bg-[#161b22] border-[#58a6ff] text-white shadow'
                            : 'bg-[#161b22]/60 border-[#30363d] text-[#c9d1d9] hover:border-[#8b949e]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate text-[11px]">{node.label}</span>
                          <CheckCircle2 className="h-3 w-3 text-[#3fb950] shrink-0 ml-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {idx < 4 && (
                <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 bg-[#21262d] border border-[#30363d] h-6 w-6 rounded-full items-center justify-center text-[#8b949e]">
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Execution Logs Stream & Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 cols: Live Execution Terminal Logs */}
        <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#3fb950]" />
              <span>GitHub Actions Runner Console</span>
            </h3>
            <span className="text-[11px] font-mono text-[#8b949e]">Runner: ubuntu-latest</span>
          </div>

          <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] font-mono text-xs text-[#c9d1d9] space-y-1.5 min-h-[160px] max-h-64 overflow-y-auto scrollbar-thin">
            {simulationLogs.length > 0 ? (
              simulationLogs.map((log, i) => (
                <div key={i} className={log.includes('SUCCESS') || log.includes('✓') ? 'text-[#3fb950]' : ''}>
                  {log}
                </div>
              ))
            ) : (
              <div className="text-[#8b949e]">
                ▶ Click &quot;Simulate Run&quot; to test workflow execution, Gradle caching, and APK signing.
              </div>
            )}
          </div>
        </div>

        {/* Right col: Node Details & Actions */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Box className="h-4 w-4 text-[#58a6ff]" />
                <span>Node Inspector</span>
              </h3>
              <button
                onClick={handleCopyYaml}
                className="px-2 py-0.5 rounded bg-[#21262d] text-[11px] text-[#c9d1d9] border border-[#30363d] flex items-center gap-1"
              >
                {copiedYaml ? <Check className="h-3 w-3 text-[#3fb950]" /> : <Copy className="h-3 w-3" />}
                <span>{copiedYaml ? 'Copied' : 'YAML'}</span>
              </button>
            </div>

            {selectedNode ? (
              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <span className="text-[#8b949e] block text-[11px]">Step Title:</span>
                  <span className="font-bold text-white">{selectedNode.label}</span>
                </div>
                <div>
                  <span className="text-[#8b949e] block text-[11px]">Execution Target:</span>
                  <span className="font-mono text-[#58a6ff]">{selectedNode.runner}</span>
                </div>
                {selectedNode.cache && (
                  <div>
                    <span className="text-[#8b949e] block text-[11px]">Cache Integration:</span>
                    <span className="font-mono text-[#3fb950]">{selectedNode.cache} (154 MB saved)</span>
                  </div>
                )}
                <div>
                  <span className="text-[#8b949e] block text-[11px]">Required Secrets:</span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#e3b341]">
                      KEYSTORE_BASE64
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#e3b341]">
                      GITHUB_TOKEN
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8b949e] mt-3">Select any node in the flowchart to inspect parameters.</p>
            )}
          </div>

          <div className="pt-3 border-t border-[#30363d] text-[11px] text-[#8b949e]">
            Configured in <span className="font-mono text-white">.github/workflows/{activeWorkflow}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
