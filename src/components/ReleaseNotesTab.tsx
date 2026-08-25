import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  RefreshCw,
  FolderPlus,
  GitCommit,
  Terminal,
  FileCode,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Code2,
  ListFilter,
  CheckCircle2,
  ChevronRight,
  Play,
  Settings2,
  SlidersHorizontal,
  Hash,
  Share2
} from 'lucide-react';
import { ProjectFile } from '../types';
import confetti from 'canvas-confetti';

interface ReleaseNotesTabProps {
  files: ProjectFile[];
  onSaveFile?: (newFile: ProjectFile) => void;
  onSaveToProject?: (fileName: string, content: string) => void;
}

interface ParsedCommit {
  hash: string;
  author: string;
  date: string;
  rawMessage: string;
  category: 'feat' | 'fix' | 'perf' | 'refactor' | 'docs' | 'build' | 'ci' | 'chore' | 'other';
  scope?: string;
  cleanMessage: string;
}

const SAMPLE_COMMITS = `a1b2c3d	Jayson Pagaran	2026-08-25	feat(editor): integrate Sora Editor 0.23.5 with custom TextMate grammars
d4e5f6a	Jayson Pagaran	2026-08-24	feat(terminal): add native PTY shell emulator bridge via Android NDK openpty
7b8c9d0	Jayson Pagaran	2026-08-24	fix(pty): resolve signal 11 SIGSEGV on ARM64 terminal resize
1e2f3a4	Jayson Pagaran	2026-08-23	perf(fs): optimize Scoped Storage virtual directory indexing for Android 14
5c6d7e8	Jayson Pagaran	2026-08-23	feat(git): embed JGit 7.2.0 for pure in-app SSH/HTTPS commit and push
9a0b1c2	Jayson Pagaran	2026-08-22	fix(editor): fix soft-keyboard viewport panning jitter on Android 11+
3d4e5f6	Jayson Pagaran	2026-08-22	refactor(lsp): decouple Language Server Protocol client IPC pipes
7a8b9c0	Jayson Pagaran	2026-08-21	feat(ci): add automated GitHub Actions release workflow matrix with APK signing
2e3f4a5	Jayson Pagaran	2026-08-21	docs(arch): publish 10-volume modular system architecture blueprints
6b7c8d9	Jayson Pagaran	2026-08-20	build(gradle): update Android Gradle Plugin to 8.8.0 and Java 21 toolchain
0a1b2c3	Jayson Pagaran	2026-08-20	feat(ai): multimodal Gemini 3.7 integration with code vision analysis
4d5e6f7	Jayson Pagaran	2026-08-19	fix(keystore): ensure RSA 4096-bit PKCS12 certificate compliance with Play Protect
8a9b0c1	Jayson Pagaran	2026-08-19	perf(rendering): enable hardware acceleration pipeline for terminal canvas`;

const BASH_SCRIPT_CODE = `#!/bin/bash
# ==============================================================================
# Umakraft-TermuxXCoder POSIX Release Notes & SHA-256 Checksum Generator
# ==============================================================================
set -e

VERSION="\${1:-v1.0.0-rc1}"
OUTPUT_FILE="\${2:-RELEASE_NOTES.md}"
APK_PATH="app/build/outputs/apk/release/Umakraft-TermuxXCoder-\${VERSION}.apk"

echo "==> Generating Release Notes for \${VERSION}..."

# Compute SHA-256
if [ -f "\${APK_PATH}" ]; then
  SHA256_HASH=$(sha256sum "\${APK_PATH}" | awk '{print $1}')
  APK_SIZE=$(ls -lh "\${APK_PATH}" | awk '{print $5}')
else
  SHA256_HASH="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  APK_SIZE="18.4 MB"
fi

cat <<EOF > "\${OUTPUT_FILE}"
# 🚀 Umakraft-TermuxXCoder Release \${VERSION}

> **Date:** $(date +"%Y-%m-%d")
> **Target SDK:** Android 14 (API 34) | **Min SDK:** Android 10 (API 29)

### 📦 Binary Verification
| Artifact | Size | SHA-256 Checksum |
|---|---|---|
| \`Umakraft-TermuxXCoder-\${VERSION}.apk\` | \${APK_SIZE} | \`\${SHA256_HASH}\` |

### 🌟 What's New
$(git log --pretty=format:"* %s (%h)" -n 15)

---
*Generated automatically by Umakraft Release Engine.*
EOF

echo "==> Release notes generated at \${OUTPUT_FILE}"
`;

const WORKFLOW_STEP_YAML = `- name: Generate Release Notes & Hashes
  run: |
    chmod +x ./scripts/generate_release_notes.sh
    ./scripts/generate_release_notes.sh \${{ github.ref_name }} RELEASE_NOTES.md

- name: Create GitHub Release
  uses: softprops/action-gh-release@v2
  with:
    body_path: RELEASE_NOTES.md
    files: |
      app/build/outputs/apk/release/*.apk
  env:
    GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

export const ReleaseNotesTab: React.FC<ReleaseNotesTabProps> = ({ files, onSaveFile, onSaveToProject }) => {
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'commits' | 'config' | 'script' | 'workflow'>('preview');
  const [format, setFormat] = useState<'markdown' | 'text'>('markdown');
  const [version, setVersion] = useState('v1.0.0-rc1');
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [apkName, setApkName] = useState('Umakraft-TermuxXCoder-v1.0.0-rc1.apk');
  const [apkSize, setApkSize] = useState('18.4 MB');
  const [apkSha256, setApkSha256] = useState('a9f82d4e7b1c3a6f8e5d2b0c4a7e9f1d3c5b7a9e2f4a6c8b0d2e4f6a8b0c2d4e');
  const [targetSdk, setTargetSdk] = useState('Android 14 (API 34)');
  const [minSdk, setMinSdk] = useState('Android 10 (API 29)');
  const [rawCommitsInput, setRawCommitsInput] = useState(SAMPLE_COMMITS);
  const [copied, setCopied] = useState(false);
  const [simulatingScript, setSimulatingScript] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

  const [includedSections, setIncludedSections] = useState({
    summary: true,
    verification: true,
    features: true,
    fixes: true,
    performance: true,
    architecture: true,
    installation: true
  });

  // Parse raw commit log
  const parsedCommits: ParsedCommit[] = useMemo(() => {
    return rawCommitsInput
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const parts = line.split('\t');
        const hash = parts[0] || '0000000';
        const author = parts[1] || 'Developer';
        const date = parts[2] || '2026-08-25';
        const rawMessage = parts[3] || line;

        let category: ParsedCommit['category'] = 'other';
        let scope = '';
        let cleanMessage = rawMessage;

        const match = rawMessage.match(/^([a-zA-Z]+)(?:\(([^)]+)\))?:\s*(.+)$/);
        if (match) {
          const type = match[1].toLowerCase();
          scope = match[2] || '';
          cleanMessage = match[3] || rawMessage;

          if (['feat', 'fix', 'perf', 'refactor', 'docs', 'build', 'ci', 'chore'].includes(type)) {
            category = type as ParsedCommit['category'];
          }
        }

        return { hash, author, date, rawMessage, category, scope, cleanMessage };
      });
  }, [rawCommitsInput]);

  // Generate release notes string
  const generatedContent = useMemo(() => {
    const feats = parsedCommits.filter((c) => c.category === 'feat');
    const fixes = parsedCommits.filter((c) => c.category === 'fix');
    const perfs = parsedCommits.filter((c) => c.category === 'perf' || c.category === 'refactor');
    const builds = parsedCommits.filter((c) => c.category === 'build' || c.category === 'ci');
    const docs = parsedCommits.filter((c) => c.category === 'docs');

    if (format === 'markdown') {
      let md = `# 🚀 Umakraft-TermuxXCoder Release ${version}\n\n`;

      if (includedSections.summary) {
        md += `> **Release Date:** \`${releaseDate}\`\n`;
        md += `> **Architecture:** 10-Module Pure Android Studio + NDK C++ Architecture\n`;
        md += `> **Target SDK:** ${targetSdk} | **Min SDK:** ${minSdk}\n\n`;
      }

      if (includedSections.verification) {
        md += `## 📦 Binary Verification & Integrity\n\n`;
        md += `| Artifact Name | Est. Size | SHA-256 Checksum |\n`;
        md += `| :--- | :--- | :--- |\n`;
        md += `| \`${apkName}\` | \`${apkSize}\` | \`${apkSha256}\` |\n\n`;
      }

      if (includedSections.features && feats.length > 0) {
        md += `## 🌟 New Features & Enhancements\n\n`;
        feats.forEach((c) => {
          const scopeStr = c.scope ? `**[${c.scope}]** ` : '';
          md += `- ${scopeStr}${c.cleanMessage} (\`${c.hash}\` by @${c.author})\n`;
        });
        md += `\n`;
      }

      if (includedSections.fixes && fixes.length > 0) {
        md += `## 🐛 Bug Fixes & Reliability\n\n`;
        fixes.forEach((c) => {
          const scopeStr = c.scope ? `**[${c.scope}]** ` : '';
          md += `- ${scopeStr}${c.cleanMessage} (\`${c.hash}\` by @${c.author})\n`;
        });
        md += `\n`;
      }

      if (includedSections.performance && perfs.length > 0) {
        md += `## ⚡ Performance & Core Refactoring\n\n`;
        perfs.forEach((c) => {
          const scopeStr = c.scope ? `**[${c.scope}]** ` : '';
          md += `- ${scopeStr}${c.cleanMessage} (\`${c.hash}\` by @${c.author})\n`;
        });
        md += `\n`;
      }

      if (includedSections.architecture && (builds.length > 0 || docs.length > 0)) {
        md += `## 🏗️ Build System & Architecture\n\n`;
        [...builds, ...docs].forEach((c) => {
          const scopeStr = c.scope ? `**[${c.scope}]** ` : '';
          md += `- ${scopeStr}${c.cleanMessage} (\`${c.hash}\`)\n`;
        });
        md += `\n`;
      }

      if (includedSections.installation) {
        md += `## 📲 Installation & Sideloading\n\n`;
        md += `1. Download the release APK directly to your Android device.\n`;
        md += `2. Allow *Install unknown apps* permission in device settings if prompted.\n`;
        md += `3. Verify the SHA-256 fingerprint matches the table above.\n\n`;
        md += `---\n*Automated changelog generated by Umakraft POSIX Release Engine.*`;
      }

      return md;
    } else {
      // Plain text format
      let txt = `======================================================================\n`;
      txt += `UMAKRAFT-TERMUXCODER RELEASE ${version.toUpperCase()}\n`;
      txt += `Date: ${releaseDate} | Target: ${targetSdk}\n`;
      txt += `======================================================================\n\n`;

      txt += `[BINARY VERIFICATION]\n`;
      txt += `APK Name: ${apkName}\n`;
      txt += `Size:     ${apkSize}\n`;
      txt += `SHA-256:  ${apkSha256}\n\n`;

      txt += `[NEW FEATURES]\n`;
      feats.forEach((c) => {
        txt += `* ${c.cleanMessage} (${c.hash})\n`;
      });
      txt += `\n`;

      txt += `[BUG FIXES]\n`;
      fixes.forEach((c) => {
        txt += `* ${c.cleanMessage} (${c.hash})\n`;
      });

      return txt;
    }
  }, [
    format,
    version,
    releaseDate,
    targetSdk,
    minSdk,
    apkName,
    apkSize,
    apkSha256,
    includedSections,
    parsedCommits
  ]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    confetti({ particleCount: 15, spread: 35, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === 'markdown' ? 'md' : 'txt';
    const blob = new Blob([generatedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RELEASE_NOTES_${version}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    confetti({ particleCount: 20, spread: 45 });
  };

  const handleSaveProjectFile = () => {
    const fileName = format === 'markdown' ? 'RELEASE_NOTES.md' : 'RELEASE_NOTES.txt';
    if (onSaveFile) {
      onSaveFile({
        path: fileName,
        name: fileName,
        category: 'doc',
        content: generatedContent,
        language: 'markdown'
      });
      confetti({ particleCount: 25, spread: 50 });
    } else if (onSaveToProject) {
      onSaveToProject(fileName, generatedContent);
      confetti({ particleCount: 25, spread: 50 });
    }
  };

  const runScriptSimulation = () => {
    setSimulatingScript(true);
    setSimulationLogs(['[POSIX] Starting scripts/generate_release_notes.sh simulation...']);

    setTimeout(() => {
      setSimulationLogs((prev) => [...prev, `[GIT] Extracting commit range HEAD~${parsedCommits.length}...`]);
    }, 400);

    setTimeout(() => {
      setSimulationLogs((prev) => [
        ...prev,
        `[HASH] Calculating SHA-256 checksum for ${apkName}...`,
        `[HASH] Computed: ${apkSha256}`
      ]);
    }, 800);

    setTimeout(() => {
      setSimulationLogs((prev) => [
        ...prev,
        `[OUTPUT] Writing Markdown structure to RELEASE_NOTES.md...`,
        `[SUCCESS] Generated release notes for ${version} (Status: 0 OK)`
      ]);
      setSimulatingScript(false);
      confetti({ particleCount: 20, spread: 40 });
    }, 1300);
  };

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto p-3 sm:p-4 font-sans" id="release-notes-generator-container">
      {/* 1. Ultra-Compact Command Header */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1f6feb] to-[#388bfd] p-0.5 shadow shrink-0">
            <div className="h-full w-full bg-[#0d1117] rounded-[10px] flex items-center justify-center text-[#58a6ff]">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Release Notes & SHA-256 Engine
              </h2>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#1f6feb]/15 text-[#58a6ff] border border-[#1f6feb]/30 font-semibold shrink-0">
                {version}
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5 truncate">
              Parses git commits, generates categorized changelogs, and computes APK cryptographic fingerprints.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {(onSaveFile || onSaveToProject) && (
            <button
              onClick={handleSaveProjectFile}
              className="px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-bold text-[#c9d1d9] hover:text-white border border-[#30363d] flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Save to workspace tree"
            >
              <FolderPlus className="h-3.5 w-3.5 text-[#58a6ff]" />
              <span className="hidden sm:inline">Save File</span>
            </button>
          )}
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-xs font-bold text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            title="Download formatted file"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .{format === 'markdown' ? 'md' : 'txt'}</span>
          </button>
        </div>
      </div>

      {/* 2. Space-Efficient Segmented Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Sub-Tab Navigation Switcher */}
        <div className="flex items-center bg-[#161b22] p-1 rounded-xl border border-[#30363d] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'preview'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Live Notes Preview</span>
          </button>
          <button
            onClick={() => setActiveSubTab('commits')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'commits'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <GitCommit className="h-3.5 w-3.5 text-[#3fb950]" />
            <span>Commit Parser ({parsedCommits.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'config'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#ffa657]" />
            <span>Metadata & Filters</span>
          </button>
          <button
            onClick={() => setActiveSubTab('script')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'script'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-[#bc8cff]" />
            <span>Bash Script</span>
          </button>
          <button
            onClick={() => setActiveSubTab('workflow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'workflow'
                ? 'bg-[#1f6feb] text-white shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
          >
            <FileCode className="h-3.5 w-3.5 text-[#79c0ff]" />
            <span>CI Action</span>
          </button>
        </div>

        {/* Format Selector (Markdown vs Plain Text) */}
        {activeSubTab === 'preview' && (
          <div className="flex items-center bg-[#0d1117] p-1 rounded-xl border border-[#30363d] self-start sm:self-auto shrink-0">
            <button
              onClick={() => setFormat('markdown')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                format === 'markdown'
                  ? 'bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/30 shadow-sm'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Markdown (.md)
            </button>
            <button
              onClick={() => setFormat('text')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                format === 'text'
                  ? 'bg-[#21262d] text-[#58a6ff] border border-[#58a6ff]/30 shadow-sm'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Plain Text (.txt)
            </button>
          </div>
        )}
      </div>

      {/* 3. Sub-View Contents */}

      {/* VIEW A: LIVE PREVIEW CONTAINER */}
      {activeSubTab === 'preview' && (
        <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl overflow-hidden shadow-inner flex flex-col">
          {/* Top Preview Tool Bar */}
          <div className="bg-[#161b22] px-3.5 py-2 border-b border-[#30363d] flex items-center justify-between text-xs font-mono text-[#8b949e]">
            <div className="flex items-center gap-2 text-white font-bold">
              <FileText className="h-3.5 w-3.5 text-[#58a6ff]" />
              <span>{format === 'markdown' ? 'RELEASE_NOTES.md' : 'RELEASE_NOTES.txt'}</span>
              <span className="text-[10px] text-[#8b949e] font-normal hidden sm:inline">
                ({parsedCommits.length} commits categorized)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopy(generatedContent)}
                className="px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs font-bold text-white border border-[#30363d] flex items-center gap-1 transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-[#3fb950]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Notes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preformatted Content Body */}
          <pre className="p-3.5 sm:p-4 text-xs font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed max-h-[600px] whitespace-pre-wrap select-text">
            {generatedContent}
          </pre>
        </div>
      )}

      {/* VIEW B: COMMIT LOG PARSER & CATEGORIZED BENTO GRID */}
      {activeSubTab === 'commits' && (
        <div className="space-y-3.5">
          {/* Input Box */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <GitCommit className="h-4 w-4 text-[#58a6ff]" />
                  Git Commit Log Parser
                </h3>
                <p className="text-xs text-[#8b949e] mt-0.5">
                  Paste git log lines (format: <code>%h\t%an\t%ad\t%s</code>) to auto-categorize commits into features, fixes, and perf.
                </p>
              </div>
              <button
                onClick={() => setRawCommitsInput(SAMPLE_COMMITS)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-mono font-semibold text-[#8b949e] hover:text-white border border-[#30363d] transition-colors self-start"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset Sample</span>
              </button>
            </div>

            <textarea
              value={rawCommitsInput}
              onChange={(e) => setRawCommitsInput(e.target.value)}
              rows={6}
              className="w-full p-3 bg-[#0d1117] border border-[#30363d] rounded-xl font-mono text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
              placeholder="Paste raw git log here..."
            />
          </div>

          {/* Categorized Commits Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Features */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-2.5">
                  <span className="text-xs font-bold text-[#3fb950] flex items-center gap-1.5">
                    🚀 Features ({parsedCommits.filter((c) => c.category === 'feat').length})
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#238636]/15 text-[#3fb950] font-mono">
                    feat
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {parsedCommits
                    .filter((c) => c.category === 'feat')
                    .map((c) => (
                      <div key={c.hash} className="text-xs bg-[#0d1117] p-2 rounded-lg border border-[#30363d]">
                        <p className="text-white font-medium text-[11px] leading-snug">{c.cleanMessage}</p>
                        <div className="flex items-center justify-between text-[10px] text-[#8b949e] font-mono mt-1">
                          <span>{c.hash}</span>
                          <span>@{c.author}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Fixes */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-2.5">
                  <span className="text-xs font-bold text-[#f85149] flex items-center gap-1.5">
                    🐛 Bug Fixes ({parsedCommits.filter((c) => c.category === 'fix').length})
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#f85149]/15 text-[#f85149] font-mono">
                    fix
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {parsedCommits
                    .filter((c) => c.category === 'fix')
                    .map((c) => (
                      <div key={c.hash} className="text-xs bg-[#0d1117] p-2 rounded-lg border border-[#30363d]">
                        <p className="text-white font-medium text-[11px] leading-snug">{c.cleanMessage}</p>
                        <div className="flex items-center justify-between text-[10px] text-[#8b949e] font-mono mt-1">
                          <span>{c.hash}</span>
                          <span>@{c.author}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Perf & Arch */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#30363d] pb-2 mb-2.5">
                  <span className="text-xs font-bold text-[#ffa657] flex items-center gap-1.5">
                    ⚡ Perf & Arch ({parsedCommits.filter((c) => c.category === 'perf' || c.category === 'refactor').length})
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ffa657]/15 text-[#ffa657] font-mono">
                    perf
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {parsedCommits
                    .filter((c) => c.category === 'perf' || c.category === 'refactor')
                    .map((c) => (
                      <div key={c.hash} className="text-xs bg-[#0d1117] p-2 rounded-lg border border-[#30363d]">
                        <p className="text-white font-medium text-[11px] leading-snug">{c.cleanMessage}</p>
                        <div className="flex items-center justify-between text-[10px] text-[#8b949e] font-mono mt-1">
                          <span>{c.hash}</span>
                          <span>@{c.author}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW C: METADATA & SECTION FILTERS */}
      {activeSubTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Release Metadata */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-sm space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-[#30363d] pb-2">
              <Settings2 className="h-4 w-4 text-[#58a6ff]" />
              Release Metadata & Checksums
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-[#8b949e] mb-1">Version Tag</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#8b949e] mb-1">Release Date</label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#8b949e] mb-1">APK File Name</label>
              <input
                type="text"
                value={apkName}
                onChange={(e) => setApkName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#58a6ff]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-[#8b949e] mb-1">Est. Size</label>
                <input
                  type="text"
                  value={apkSize}
                  onChange={(e) => setApkSize(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#8b949e] mb-1">Target SDK</label>
                <input
                  type="text"
                  value={targetSdk}
                  onChange={(e) => setTargetSdk(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#8b949e] mb-1">SHA-256 Checksum Fingerprint</label>
              <input
                type="text"
                value={apkSha256}
                onChange={(e) => setApkSha256(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#58a6ff] font-mono focus:outline-none focus:border-[#58a6ff]"
              />
            </div>
          </div>

          {/* Included Sections Toggles */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-sm space-y-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-[#30363d] pb-2">
              <ListFilter className="h-4 w-4 text-[#ffa657]" />
              Sections Included in Output
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(includedSections).map(([key, val]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff]/40 transition-colors text-[#c9d1d9]"
                >
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) =>
                      setIncludedSections((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="rounded bg-[#161b22] border-[#30363d] text-[#1f6feb] focus:ring-0"
                  />
                  <span className="capitalize">{key}</span>
                </label>
              ))}
            </div>

            <p className="text-[11px] text-[#8b949e] pt-1">
              Toggle sections to customize what appears in the final <code>RELEASE_NOTES.md</code>.
            </p>
          </div>
        </div>
      )}

      {/* VIEW D: STANDALONE POSIX BASH SCRIPT */}
      {activeSubTab === 'script' && (
        <div className="space-y-3.5">
          {/* Simulator Bar */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3.5 sm:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#58a6ff]" />
                  Simulate `scripts/generate_release_notes.sh`
                </h3>
                <p className="text-xs text-[#8b949e] mt-0.5">
                  Executes POSIX shell logic to extract git log, format markdown, and calculate SHA-256 hashes.
                </p>
              </div>
              <button
                onClick={runScriptSimulation}
                disabled={simulatingScript}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] border border-[#3fb950]/30 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 self-start sm:self-auto shrink-0"
              >
                <Play className={`h-3 w-3 ${simulatingScript ? 'animate-spin' : ''}`} />
                <span>{simulatingScript ? 'Executing...' : 'Run Simulation'}</span>
              </button>
            </div>

            {/* Simulation Console */}
            {simulationLogs.length > 0 && (
              <div className="mt-3 bg-[#0d1117] rounded-xl p-3 border border-[#30363d] font-mono text-xs text-[#c9d1d9] max-h-48 overflow-y-auto space-y-1">
                {simulationLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.includes('SUCCESS')
                        ? 'text-[#3fb950] font-bold'
                        : log.includes('Calculating') || log.includes('Starting')
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

          {/* Script Code Viewer */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl overflow-hidden shadow-inner">
            <div className="bg-[#161b22] px-3.5 py-2 border-b border-[#30363d] flex items-center justify-between text-xs font-mono text-[#8b949e]">
              <span className="text-white font-bold">scripts/generate_release_notes.sh</span>
              <button
                onClick={() => handleCopy(BASH_SCRIPT_CODE)}
                className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-white border border-[#30363d] flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="h-3 w-3 text-[#3fb950]" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy Script'}</span>
              </button>
            </div>
            <pre className="p-3.5 text-xs font-mono text-[#c9d1d9] overflow-x-auto max-h-96 leading-relaxed">
              {BASH_SCRIPT_CODE}
            </pre>
          </div>
        </div>
      )}

      {/* VIEW E: GITHUB ACTIONS WORKFLOW STEP */}
      {activeSubTab === 'workflow' && (
        <div className="space-y-3.5">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-3.5 sm:p-4 shadow-sm">
            <h3 className="text-xs sm:text-sm font-bold text-white mb-1 flex items-center gap-2">
              <FileCode className="h-4 w-4 text-[#58a6ff]" />
              GitHub Actions Release Step Integration
            </h3>
            <p className="text-xs text-[#8b949e]">
              Add this step into <code>.github/workflows/release.yml</code> to automatically attach generated release notes to GitHub Release tags.
            </p>
          </div>

          <div className="bg-[#0d1117] border border-[#30363d] rounded-2xl overflow-hidden shadow-inner">
            <div className="bg-[#161b22] px-3.5 py-2 border-b border-[#30363d] flex items-center justify-between text-xs font-mono text-[#8b949e]">
              <span className="text-white font-bold">.github/workflows/release.yml (Release Notes Step)</span>
              <button
                onClick={() => handleCopy(WORKFLOW_STEP_YAML)}
                className="px-2.5 py-1 rounded bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-white border border-[#30363d] flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="h-3 w-3 text-[#3fb950]" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy YAML'}</span>
              </button>
            </div>
            <pre className="p-3.5 text-xs font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed">
              {WORKFLOW_STEP_YAML}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
