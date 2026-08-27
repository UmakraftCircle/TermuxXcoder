import JSZip from 'jszip';
import { ProjectFile } from '../types';

export async function exportProjectToZip(files: ProjectFile[], projectName: string = 'TermuxXCoder'): Promise<Blob> {
  const zip = new JSZip();

  // Add all project files
  files.forEach((file) => {
    zip.file(file.path, file.content);
  });

  // Add standard Gradle Wrapper files if not present
  if (!files.find((f) => f.path === 'gradlew')) {
    zip.file(
      'gradlew',
      `#!/bin/sh
# Gradle start up script for POSIX systems
exec gradle "$@"
`
    );
  }

  if (!files.find((f) => f.path === 'gradlew.bat')) {
    zip.file(
      'gradlew.bat',
      `@rem Gradle start up script for Windows
@gradle "%*"
`
    );
  }

  if (!files.find((f) => f.path === 'gradle/wrapper/gradle-wrapper.properties')) {
    zip.file(
      'gradle/wrapper/gradle-wrapper.properties',
      `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
`
    );
  }

  // Add standard Git Hooks if not present
  if (!files.find((f) => f.path === '.git/hooks/pre-commit')) {
    zip.file(
      '.git/hooks/pre-commit',
      `#!/bin/sh
# TermuxXCoder pre-commit hook: runs lint and secret scan
echo "🔍 Running pre-commit static analysis..."
./gradlew lintDebug --no-daemon || { echo "❌ Lint check failed"; exit 1; }
`
    );
  }

  if (!files.find((f) => f.path === '.git/hooks/commit-msg')) {
    zip.file(
      '.git/hooks/commit-msg',
      `#!/bin/sh
# TermuxXCoder commit-msg hook: verifies Conventional Commits format
MSG=$(cat "$1")
PATTERN="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\\(.+\\))?!?: .+"
if ! echo "$MSG" | grep -qE "$PATTERN"; then
  echo "❌ Error: Commit message does not follow Conventional Commits standard (e.g., 'feat: add build cache')"
  exit 1
fi
`
    );
  }

  if (!files.find((f) => f.path === '.git/hooks/pre-push')) {
    zip.file(
      '.git/hooks/pre-push',
      `#!/bin/sh
# TermuxXCoder pre-push hook: runs unit tests before push
echo "🧪 Running unit tests before remote push..."
./gradlew testDebugUnitTest --no-daemon || { echo "❌ Unit tests failed"; exit 1; }
`
    );
  }

  // Add build helper scripts if not present
  if (!files.find((f) => f.path === 'scripts/generate_release_notes.sh')) {
    zip.file(
      'scripts/generate_release_notes.sh',
      `#!/usr/bin/env bash
set -euo pipefail
VERSION="\${1:-v1.0.0}"
echo "# Release Notes for TermuxXCoder $VERSION"
echo "### 🚀 Key Highlights"
echo "- Native POSIX PTY Terminal Bridge"
echo "- AGP 8.4.2 & Java 21 Toolchain"
echo "- Real-time Build Cache Diagnostics"
`
    );
  }

  // Add .gitignore
  if (!files.find((f) => f.path === '.gitignore')) {
    zip.file(
      '.gitignore',
      `*.iml
.gradle
/local.properties
/.idea/
.DS_Store
/build
/captures
.externalNativeBuild
.cxx
local.properties
secure/
*.apk
*.aab
`
    );
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
