export interface ParsedCommit {
  hash: string;
  author: string;
  date: string;
  rawMessage: string;
  category: 'feat' | 'fix' | 'perf' | 'refactor' | 'ci' | 'docs' | 'security' | 'chore';
  cleanMessage: string;
  scope?: string;
  prNumber?: string;
}

export interface ReleaseNotesConfig {
  version: string;
  versionCode: number;
  releaseDate: string;
  previousTag: string;
  currentRef: string;
  format: 'markdown' | 'text';
  apkName: string;
  apkSize: string;
  apkSha256: string;
  minSdk: string;
  targetSdk: string;
  includedSections: {
    features: boolean;
    fixes: boolean;
    performance: boolean;
    architecture: boolean;
    ci: boolean;
    security: boolean;
    docs: boolean;
    checksums: boolean;
  };
  customIntro?: string;
}

export const SAMPLE_COMMITS = `a4f89d1	Alex Rivera	2026-08-24	feat(editor): integrate Sora Editor 0.23.5 with custom Kotlin TextMate grammar
b9c12e4	Elena Rostova	2026-08-24	feat(pty): embed Termux PTY C-native bridge with openpty, forkpty, and JNI bindings
c3d55f0	Marcus Vance	2026-08-23	fix(lsp): resolve Kotlin language server stdio stream deadlock on Android 14
d7e88a2	Alex Rivera	2026-08-23	perf(syntax): optimize incremental syntax tokenizer cache for 50k+ LOC files
e1f99b3	Sara Chen	2026-08-22	feat(git): add JGit 7.2.0 local commit, branch staging, and SSH key manager
f2a00c4	Marcus Vance	2026-08-22	fix(dap): fix variable inspection breakpoint timeout in embedded debug server
09b11d5	Sara Chen	2026-08-21	refactor(modules): decouple core-editor and core-pty into standalone Gradle library modules
1a22e66	DevOps Bot	2026-08-21	ci(github): add automated APK signing and SHA-256 artifact verification pipeline
2b33f77	Elena Rostova	2026-08-20	sec(keystore): enforce Base64 encrypted secret ingestion in release workflow
3c44a88	Marcus Vance	2026-08-20	docs(specs): add Volume 1 to 10 architectural documentation suite
4d55b99	Alex Rivera	2026-08-19	feat(ai): integrate local GGUF on-device inference with prompt streaming
5e66c00	Elena Rostova	2026-08-18	fix(pty): fix pseudo-terminal ANSI color palette escape code rendering
6f77d11	Sara Chen	2026-08-18	perf(io): implement fast disk cache for file tree workspace exploration`;

export function parseGitLog(rawLog: string): ParsedCommit[] {
  const lines = rawLog.split('\n').map((l) => l.trim()).filter(Boolean);
  const commits: ParsedCommit[] = [];

  for (const line of lines) {
    // Try parsing tab-separated format: hash \t author \t date \t subject
    let hash = '';
    let author = 'Developer';
    let date = new Date().toISOString().split('T')[0];
    let message = line;

    if (line.includes('\t')) {
      const parts = line.split('\t');
      if (parts.length >= 4) {
        hash = parts[0];
        author = parts[1];
        date = parts[2];
        message = parts.slice(3).join('\t');
      } else if (parts.length === 2) {
        hash = parts[0];
        message = parts[1];
      }
    } else {
      // Try space or dash separated: "a4f89d1 - feat(editor): ..." or "a4f89d1 feat: ..."
      const match = line.match(/^([a-f0-9]{7,40})[\s\-:]+(.*)$/i);
      if (match) {
        hash = match[1];
        message = match[2];
      }
    }

    // Extract PR number if present e.g. (#42)
    let prNumber: string | undefined;
    const prMatch = message.match(/#(\d+)/);
    if (prMatch) {
      prNumber = prMatch[1];
    }

    // Categorize commit
    let category: ParsedCommit['category'] = 'chore';
    let scope: string | undefined;
    let cleanMessage = message;

    const lower = message.toLowerCase();

    // Check conventional commit syntax e.g. "feat(editor): add something" or "feat: add something"
    const convMatch = message.match(/^([a-z]+)(?:\(([^)]+)\))?!?:?\s+(.*)$/i);

    if (convMatch) {
      const type = convMatch[1].toLowerCase();
      scope = convMatch[2];
      cleanMessage = convMatch[3];

      if (type.startsWith('feat') || type === 'add' || type === 'new') {
        category = 'feat';
      } else if (type.startsWith('fix') || type === 'bug' || type === 'patch') {
        category = 'fix';
      } else if (type.startsWith('perf') || type === 'optimize') {
        category = 'perf';
      } else if (type.startsWith('refactor') || type === 'arch' || type === 'style') {
        category = 'refactor';
      } else if (type.startsWith('ci') || type === 'build' || type === 'deps') {
        category = 'ci';
      } else if (type.startsWith('doc')) {
        category = 'docs';
      } else if (type.startsWith('sec') || type === 'security' || type === 'auth') {
        category = 'security';
      } else {
        category = 'chore';
      }
    } else {
      // Keyword based categorization
      if (lower.includes('feat') || lower.includes('add') || lower.includes('implement') || lower.includes('support')) {
        category = 'feat';
      } else if (lower.includes('fix') || lower.includes('bug') || lower.includes('resolve') || lower.includes('crash')) {
        category = 'fix';
      } else if (lower.includes('perf') || lower.includes('speed') || lower.includes('fast') || lower.includes('cache')) {
        category = 'perf';
      } else if (lower.includes('refactor') || lower.includes('clean') || lower.includes('modular')) {
        category = 'refactor';
      } else if (lower.includes('ci') || lower.includes('workflow') || lower.includes('gradle') || lower.includes('action')) {
        category = 'ci';
      } else if (lower.includes('doc') || lower.includes('spec') || lower.includes('readme')) {
        category = 'docs';
      } else if (lower.includes('sec') || lower.includes('keystore') || lower.includes('sign') || lower.includes('protect')) {
        category = 'security';
      }
    }

    commits.push({
      hash: hash.substring(0, 7) || Math.random().toString(16).substring(2, 9),
      author,
      date,
      rawMessage: message,
      category,
      cleanMessage: cleanMessage || message,
      scope,
      prNumber
    });
  }

  return commits;
}

export function generateMarkdownReleaseNotes(commits: ParsedCommit[], config: ReleaseNotesConfig): string {
  const features = commits.filter((c) => c.category === 'feat');
  const fixes = commits.filter((c) => c.category === 'fix');
  const perfs = commits.filter((c) => c.category === 'perf');
  const refactors = commits.filter((c) => c.category === 'refactor');
  const cis = commits.filter((c) => c.category === 'ci');
  const secs = commits.filter((c) => c.category === 'security');
  const docs = commits.filter((c) => c.category === 'docs');
  const chores = commits.filter((c) => c.category === 'chore');

  let md = `# Release ${config.version} (Build ${config.versionCode})\n\n`;
  md += `> **Release Date:** ${config.releaseDate}  \n`;
  md += `> **Target Android:** ${config.minSdk} to ${config.targetSdk}  \n`;
  md += `> **Commit Range:** \`${config.previousTag}...${config.currentRef}\` (${commits.length} commits)\n\n`;

  if (config.customIntro) {
    md += `${config.customIntro}\n\n`;
  } else {
    md += `### 📱 Overview\n`;
    md += `This release of **TermuxXCoder** brings new features, architectural performance upgrades, and stability enhancements across the Sora Editor, embedded Termux PTY, JGit tooling, and language server protocols.\n\n`;
  }

  // Highlights / Key Features
  if (config.includedSections.features && features.length > 0) {
    md += `## 🚀 What's New & Features\n`;
    features.forEach((c) => {
      const scopeBadge = c.scope ? `**[${c.scope}]** ` : '';
      const prLink = c.prNumber ? ` (#${c.prNumber})` : '';
      md += `- ${scopeBadge}${c.cleanMessage}${prLink} (\`${c.hash}\` by @${c.author})\n`;
    });
    md += `\n`;
  }

  // Bug Fixes
  if (config.includedSections.fixes && fixes.length > 0) {
    md += `## 🐛 Bug Fixes & Stability\n`;
    fixes.forEach((c) => {
      const scopeBadge = c.scope ? `**[${c.scope}]** ` : '';
      const prLink = c.prNumber ? ` (#${c.prNumber})` : '';
      md += `- ${scopeBadge}${c.cleanMessage}${prLink} (\`${c.hash}\`)\n`;
    });
    md += `\n`;
  }

  // Performance Improvements
  if (config.includedSections.performance && perfs.length > 0) {
    md += `## ⚡ Performance & Optimization\n`;
    perfs.forEach((c) => {
      const scopeBadge = c.scope ? `**[${c.scope}]** ` : '';
      md += `- ${scopeBadge}${c.cleanMessage} (\`${c.hash}\`)\n`;
    });
    md += `\n`;
  }

  // Architecture & Refactoring
  if (config.includedSections.architecture && refactors.length > 0) {
    md += `## 🛠️ Architecture & Modules\n`;
    refactors.forEach((c) => {
      const scopeBadge = c.scope ? `**[${c.scope}]** ` : '';
      md += `- ${scopeBadge}${c.cleanMessage} (\`${c.hash}\`)\n`;
    });
    md += `\n`;
  }

  // Security & Keystore
  if (config.includedSections.security && secs.length > 0) {
    md += `## 🔒 Security & Signing\n`;
    secs.forEach((c) => {
      const scopeBadge = c.scope ? `**[${c.scope}]** ` : '';
      md += `- ${scopeBadge}${c.cleanMessage} (\`${c.hash}\`)\n`;
    });
    md += `\n`;
  }

  // CI/CD & Build
  if (config.includedSections.ci && cis.length > 0) {
    md += `## 📦 Build System & GitHub Actions\n`;
    cis.forEach((c) => {
      const scopeBadge = c.scope ? `**[${c.scope}]** ` : '';
      md += `- ${scopeBadge}${c.cleanMessage} (\`${c.hash}\`)\n`;
    });
    md += `\n`;
  }

  // Documentation
  if (config.includedSections.docs && docs.length > 0) {
    md += `## 📖 Documentation & Specs\n`;
    docs.forEach((c) => {
      md += `- ${c.cleanMessage} (\`${c.hash}\`)\n`;
    });
    md += `\n`;
  }

  // Maintenance / Other
  if (chores.length > 0) {
    md += `## 🔧 Maintenance & Dependencies\n`;
    chores.forEach((c) => {
      md += `- ${c.cleanMessage} (\`${c.hash}\`)\n`;
    });
    md += `\n`;
  }

  // APK Artifact & Checksums section
  if (config.includedSections.checksums) {
    md += `## 📦 APK Artifacts & Integrity Verification\n\n`;
    md += `| File Name | Architecture | Size | SHA-256 Checksum |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    md += `| \`${config.apkName}\` | Universal (arm64-v8a, armeabi-v7a, x86_64) | ~${config.apkSize} | \`${config.apkSha256}\` |\n\n`;
    md += `### 🔒 Verify Checksum on Terminal:\n`;
    md += `\`\`\`bash\n`;
    md += `echo "${config.apkSha256}  ${config.apkName}" | sha256sum -c\n`;
    md += `\`\`\`\n\n`;
  }

  // Installation instructions
  md += `## 📲 Installation Guide\n`;
  md += `1. Download \`${config.apkName}\` from GitHub Releases assets.\n`;
  md += `2. If Android prompts "Install unknown apps", grant permission for your browser or file manager.\n`;
  md += `3. Launch **TermuxXCoder** — Embedded PTY terminal bootstrap and Sora editor start instantly.\n\n`;

  md += `---\n`;
  md += `*Generated automatically by TermuxXCoder CI/CD Release Notes Suite.*`;

  return md;
}

export function generatePlainTextReleaseNotes(commits: ParsedCommit[], config: ReleaseNotesConfig): string {
  const features = commits.filter((c) => c.category === 'feat');
  const fixes = commits.filter((c) => c.category === 'fix');
  const perfs = commits.filter((c) => c.category === 'perf');
  const refactors = commits.filter((c) => c.category === 'refactor');
  const cis = commits.filter((c) => c.category === 'ci');
  const secs = commits.filter((c) => c.category === 'security');

  const sep = '='.repeat(70);
  const subSep = '-'.repeat(70);

  let txt = `${sep}\n`;
  txt += `  TERMUX XCODER APK RELEASE NOTES - ${config.version} (Build ${config.versionCode})\n`;
  txt += `  Release Date: ${config.releaseDate} | Android ${config.minSdk}-${config.targetSdk}\n`;
  txt += `${sep}\n\n`;

  if (features.length > 0) {
    txt += `[NEW FEATURES & ENHANCEMENTS]\n${subSep}\n`;
    features.forEach((c) => {
      const scope = c.scope ? `[${c.scope}] ` : '';
      txt += `* ${scope}${c.cleanMessage} (${c.hash})\n`;
    });
    txt += `\n`;
  }

  if (fixes.length > 0) {
    txt += `[BUG FIXES & STABILITY]\n${subSep}\n`;
    fixes.forEach((c) => {
      const scope = c.scope ? `[${c.scope}] ` : '';
      txt += `* ${scope}${c.cleanMessage} (${c.hash})\n`;
    });
    txt += `\n`;
  }

  if (perfs.length > 0) {
    txt += `[PERFORMANCE & OPTIMIZATIONS]\n${subSep}\n`;
    perfs.forEach((c) => {
      txt += `* ${c.cleanMessage} (${c.hash})\n`;
    });
    txt += `\n`;
  }

  if (refactors.length > 0) {
    txt += `[ARCHITECTURE & MODULE REFACTORING]\n${subSep}\n`;
    refactors.forEach((c) => {
      txt += `* ${c.cleanMessage} (${c.hash})\n`;
    });
    txt += `\n`;
  }

  if (secs.length > 0) {
    txt += `[SECURITY & KEYSTORE SIGNING]\n${subSep}\n`;
    secs.forEach((c) => {
      txt += `* ${c.cleanMessage} (${c.hash})\n`;
    });
    txt += `\n`;
  }

  if (cis.length > 0) {
    txt += `[BUILD & CI/CD PIPELINE]\n${subSep}\n`;
    cis.forEach((c) => {
      txt += `* ${c.cleanMessage} (${c.hash})\n`;
    });
    txt += `\n`;
  }

  if (config.includedSections.checksums) {
    txt += `[APK ARTIFACT INTEGRITY & CHECKSUM]\n${subSep}\n`;
    txt += `APK File   : ${config.apkName}\n`;
    txt += `Size       : ~${config.apkSize}\n`;
    txt += `SHA-256    : ${config.apkSha256}\n\n`;
    txt += `Verification command:\n`;
    txt += `echo "${config.apkSha256}  ${config.apkName}" | sha256sum -c\n\n`;
  }

  txt += `${sep}\n`;
  txt += `Generated automatically by TermuxXCoder Release Tool.\n`;
  txt += `${sep}\n`;

  return txt;
}
