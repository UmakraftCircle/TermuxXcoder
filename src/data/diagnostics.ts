import { BuildDiagnostic, GitSecretItem, EngineeringVolume } from '../types';

export const INITIAL_DIAGNOSTICS: BuildDiagnostic[] = [
  {
    id: 'jdk-21',
    name: 'Java Development Kit (JDK)',
    category: 'jdk',
    status: 'passed',
    message: 'JDK 21 (Temurin) configured for Kotlin 2.0 & AGP 8.4+',
    detail: 'Configured in build.gradle.kts and .github/workflows/android.yml with JVM target 21.',
    recommendedFix: 'Keep distribution set to temurin with java-version 21.'
  },
  {
    id: 'ndk-pty',
    name: 'Android NDK for Termux PTY',
    category: 'ndk',
    status: 'passed',
    message: 'NDK r26b with arm64-v8a, armeabi-v7a, x86_64 ABI filters',
    detail: 'Embedded Termux PTY requires native C/POSIX bindings for pseudo-terminal allocation.',
    recommendedFix: 'Ensure abiFilters include arm64-v8a for high performance 64-bit Android devices.'
  },
  {
    id: 'multi-module',
    name: '10-Module Architecture',
    category: 'gradle',
    status: 'passed',
    message: 'All 10 modules registered in settings.gradle.kts and linked to :app',
    detail: ':app, :common, :editor, :terminal, :filesystem, :git, :lsp, :debugger, :ai, :workspace, :plugins are decoupled.',
    recommendedFix: 'Always route inter-module calls through ServiceHub to avoid circular dependencies.'
  },
  {
    id: 'sora-version',
    name: 'Sora Editor Engine',
    category: 'dependencies',
    status: 'passed',
    message: 'io.github.Rosemoe.sora-editor:editor:0.23.5 pinned in version catalog',
    detail: 'TextMate grammar & code editor widgets bound via Jetpack Compose AndroidView.',
  },
  {
    id: 'jgit-version',
    name: 'JGit Native Engine',
    category: 'dependencies',
    status: 'passed',
    message: 'org.eclipse.jgit:7.2.0 configured with Android ProGuard rules',
    detail: 'Direct in-process Git operations for clone, commit, diff, and push without external shell dependency.',
  },
  {
    id: 'saf-permissions',
    name: 'Storage Access Framework (SAF)',
    category: 'permissions',
    status: 'passed',
    message: 'Scoped storage compliant; no legacy external storage flags required',
    detail: 'Persists URI tree grants via ContentResolver, fully compliant with Android 10+ (API 29 to 34+).',
  },
  {
    id: 'keystore-secret',
    name: 'Production APK Signing Keystore',
    category: 'keystore',
    status: 'warning',
    message: 'GitHub Secret RELEASE_KEYSTORE_BASE64 is optional for debug APK, required for signed release',
    detail: 'Debug APK builds automatically on GitHub without secrets. For signed release APK, upload base64 keystore.',
    recommendedFix: 'Use the Keystore Wizard tab to generate keytool command and base64 string.'
  },
  {
    id: 'r8-shrinking',
    name: 'R8 Code & Resource Shrinking',
    category: 'r8',
    status: 'passed',
    message: 'ProGuard rules preserve JGit, Sora Editor, and JNI Termux symbols',
    detail: 'isMinifyEnabled and isShrinkResources active in release build type.',
  }
];

export const GITHUB_SECRETS_LIST: GitSecretItem[] = [
  {
    key: 'RELEASE_KEYSTORE_BASE64',
    description: 'Base64 encoded string of release.keystore file',
    requiredFor: 'Signing',
    sampleValue: 'MIIDdzCCAl+gAwIBAgIEAgAA...==',
    isConfigured: false
  },
  {
    key: 'KEYSTORE_PASSWORD',
    description: 'Password used when generating the keystore',
    requiredFor: 'Signing',
    sampleValue: 'MySecurePass123!',
    isConfigured: false
  },
  {
    key: 'KEY_ALIAS',
    description: 'Alias name of the signing key inside the keystore',
    requiredFor: 'Signing',
    sampleValue: 'termuxxcoder_key',
    isConfigured: false
  },
  {
    key: 'KEY_PASSWORD',
    description: 'Password for the specific key alias',
    requiredFor: 'Signing',
    sampleValue: 'MySecurePass123!',
    isConfigured: false
  },
  {
    key: 'GEMINI_API_KEY',
    description: 'Optional API key for Cloud AI reasoning (Local GGUF works fully offline)',
    requiredFor: 'AI Cloud Inference',
    sampleValue: 'AIzaSy...',
    isConfigured: false
  }
];

export const ENGINEERING_VOLUMES: EngineeringVolume[] = [
  {
    volume: 1,
    title: 'Architecture & Bootstrap',
    subtitle: 'Modular Gradle, Clean Architecture & ServiceHub',
    summary: 'Establishes the 10 decoupled Gradle modules, Settings catalog, and root dependencies for Jetpack Compose.',
    keyModules: [':app', ':common'],
    chapters: [
      { title: 'Chapter 1', desc: 'Engineering Principles & Decoupled Rules' },
      { title: 'Chapter 2', desc: 'Android Studio Bootstrap & settings.gradle.kts' },
      { title: 'Chapter 3', desc: 'ServiceHub Dependency Injection Locator' },
      { title: 'Chapter 4', desc: 'Build Order from Bootstrap to Production' }
    ]
  },
  {
    volume: 2,
    title: 'Sora Editor Integration',
    subtitle: 'Code Editing Engine & TextMate Registry',
    summary: 'Integrates Rosemoe Sora Editor 0.23.5 with syntax coloring, tab preservation, multi-cursor, and undo stack.',
    keyModules: [':editor'],
    chapters: [
      { title: 'Chapter 1', desc: 'Module Structure & Zero-leak design' },
      { title: 'Chapter 2', desc: 'Gradle Configuration & TextMate grammars' },
      { title: 'Chapter 3', desc: 'CodeEditorFactory for Monospace rendering' },
      { title: 'Chapter 4', desc: 'Tab and Selection Engine for AI operations' }
    ]
  },
  {
    volume: 3,
    title: 'Embedded Termux & PTY Runtime',
    subtitle: 'In-Process Linux Shell & Foreground Service',
    summary: 'Runs a native PTY process inside TermuxXCoder with 256-color ANSI rendering and foreground persistence.',
    keyModules: [':terminal'],
    chapters: [
      { title: 'Chapter 1', desc: 'In-process PTY vs external app boundaries' },
      { title: 'Chapter 2', desc: 'ShellEnvironment & xterm-256color ANSI' },
      { title: 'Chapter 3', desc: 'RuntimeService foreground keep-alive' },
      { title: 'Chapter 4', desc: 'Scrollback buffer and workspace state restore' }
    ]
  },
  {
    volume: 4,
    title: 'Filesystem (SAF) & Workspace',
    subtitle: 'Storage Access Framework & URI Persistence',
    summary: 'Direct DocumentFile tree operations with persistent permissions, dirty buffer autosave, and crash recovery.',
    keyModules: [':filesystem', ':workspace'],
    chapters: [
      { title: 'Chapter 1', desc: 'Storage Access Framework (SAF) URI flow' },
      { title: 'Chapter 2', desc: 'FileManager API with ContentResolver' },
      { title: 'Chapter 3', desc: 'Session Serializer & JSON workspace layout' },
      { title: 'Chapter 4', desc: 'Crash recovery log and auto-save daemon' }
    ]
  },
  {
    volume: 5,
    title: 'Git Integration & Package Manager',
    subtitle: 'JGit 7.2.0 & One-Tap Dev Packages',
    summary: 'Native JGit clone, commit, diff, push, and one-tap package installation queue for Python, Node, Clang, Pyright.',
    keyModules: [':git'],
    chapters: [
      { title: 'Chapter 1', desc: 'JGit Native Engine Integration' },
      { title: 'Chapter 2', desc: 'Status Engine & Diff Hunk Visualizer' },
      { title: 'Chapter 3', desc: 'Android Keystore Token Storage' },
      { title: 'Chapter 4', desc: 'Developer Package Catalog & Terminal Queue' }
    ]
  },
  {
    volume: 6,
    title: 'LSP Intelligence & DAP Debugger',
    subtitle: 'Language Server Protocol & Debugpy/LLDB',
    summary: 'JSON-RPC client communicating with Pyright and clangd; DAP client managing breakpoints, stack frames, and watches.',
    keyModules: [':lsp', ':debugger'],
    chapters: [
      { title: 'Chapter 1', desc: 'LSP JSON-RPC Architecture over stdio' },
      { title: 'Chapter 2', desc: 'Diagnostics, Completion, and Markdown Hover' },
      { title: 'Chapter 3', desc: 'DAP Debugger Session with debugpy/lldb' },
      { title: 'Chapter 4', desc: 'Breakpoint Gutter, Variables, and Watch expressions' }
    ]
  },
  {
    volume: 7,
    title: 'AI Engine & Patch System',
    subtitle: 'Cursor-Style Reversible Patch Transactions',
    summary: 'AI workspace context builder, token budgeting, multi-file code patch transactions, and hunk reviewer.',
    keyModules: [':ai'],
    chapters: [
      { title: 'Chapter 1', desc: 'AI Architecture & Non-destructive Patching' },
      { title: 'Chapter 2', desc: 'WorkspaceContext model & priority ordering' },
      { title: 'Chapter 3', desc: 'PatchTransaction validator and reverse application' },
      { title: 'Chapter 4', desc: 'Hunk review UI with selective apply/reject' }
    ]
  },
  {
    volume: 8,
    title: 'Offline GGUF Runtime & Local AI',
    subtitle: 'llama.cpp Q4/Q5 Quantized Inference',
    summary: 'Offline GGUF coding models (3B, 7B, 8B) running in Android/media storage with memory controller and streaming.',
    keyModules: [':ai'],
    chapters: [
      { title: 'Chapter 1', desc: 'llama.cpp GGUF Runtime Architecture' },
      { title: 'Chapter 2', desc: 'Model Registry & Resumable Download Pipeline' },
      { title: 'Chapter 3', desc: 'MemoryController & OOM Safe RAM allocation' },
      { title: 'Chapter 4', desc: 'Cloud/Local Provider Routing Parity' }
    ]
  },
  {
    volume: 9,
    title: 'Plugin SDK & Collaboration',
    subtitle: 'Sandboxed Extensions & CRDT Multi-user',
    summary: 'Plugin manifest loader, permission engine, IDE API, and real-time CRDT multi-user editing with remote cursors.',
    keyModules: [':plugins'],
    chapters: [
      { title: 'Chapter 1', desc: 'Plugin Lifecycle & Dex ClassLoader' },
      { title: 'Chapter 2', desc: 'Permission Engine & Command Palette Registry' },
      { title: 'Chapter 3', desc: 'CRDT Operation Sync & Colored Remote Cursors' },
      { title: 'Chapter 4', desc: 'Shared PTY Terminal with Host Ownership' }
    ]
  },
  {
    volume: 10,
    title: 'DevOps, Security & CI/CD Release',
    subtitle: 'GitHub Actions APK Pipeline & Release Engineering',
    summary: 'Deterministic Gradle builds, JDK 21 CI pipeline, Keystore encryption, R8 rules, and GitHub Release automation.',
    keyModules: [':app', '.github/workflows'],
    chapters: [
      { title: 'Chapter 1', desc: 'CI/CD Architecture from Commit to APK' },
      { title: 'Chapter 2', desc: 'GitHub Actions Android CI & Release Workflows' },
      { title: 'Chapter 3', desc: 'R8 Shrinking, ProGuard Rules, and Keystore Secrets' },
      { title: 'Chapter 4', desc: 'Definition of Version 1.0 Release Checklist' }
    ]
  }
];
