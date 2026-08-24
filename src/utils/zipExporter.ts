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
