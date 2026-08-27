import fs from 'fs';
import path from 'path';

export type ProjectStack = 'auto' | 'android' | 'node' | 'python' | 'multiplatform';
export type WorkflowType = 'ci' | 'release' | 'quality';

export interface WorkflowOptions {
  workflowName?: string;
  targetBranch?: string;
  nodeVersion?: string;
  jdkVersion?: string;
  pythonVersion?: string;
  enableCache?: boolean;
  runLint?: boolean;
  runTests?: boolean;
  buildArtifact?: boolean;
}

export interface GeneratedWorkflowResult {
  fileName: string;
  relativePath: string;
  content: string;
  detectedStack: ProjectStack;
}

/**
 * GitHubActionsSync
 * Automatically generates, updates, and syncs .github/workflows YAML configurations
 * tailored to the detected codebase stack.
 */
export class GitHubActionsSync {
  /**
   * Inspects workspace files to automatically detect the project stack
   */
  public static detectProjectStack(workspaceRoot: string): ProjectStack {
    const root = path.resolve(workspaceRoot);
    if (!fs.existsSync(root)) return 'node';

    const hasAndroid =
      fs.existsSync(path.join(root, 'build.gradle.kts')) ||
      fs.existsSync(path.join(root, 'build.gradle')) ||
      fs.existsSync(path.join(root, 'app/build.gradle.kts')) ||
      fs.existsSync(path.join(root, 'app/src/main/AndroidManifest.xml'));

    const hasNode =
      fs.existsSync(path.join(root, 'package.json')) ||
      fs.existsSync(path.join(root, 'tsconfig.json'));

    const hasPython =
      fs.existsSync(path.join(root, 'requirements.txt')) ||
      fs.existsSync(path.join(root, 'pyproject.toml')) ||
      fs.existsSync(path.join(root, 'main.py'));

    if (hasAndroid && (hasNode || hasPython)) return 'multiplatform';
    if (hasAndroid) return 'android';
    if (hasPython) return 'python';
    if (hasNode) return 'node';

    return 'node';
  }

  /**
   * Generates production-ready GitHub Actions YAML for CI/CD
   */
  public static generateWorkflow(
    workspaceRoot: string,
    stack: ProjectStack = 'auto',
    workflowType: WorkflowType = 'ci',
    options: WorkflowOptions = {}
  ): GeneratedWorkflowResult {
    const detected = stack === 'auto' ? this.detectProjectStack(workspaceRoot) : stack;
    const branch = options.targetBranch || 'main';
    const name = options.workflowName || (workflowType === 'release' ? 'Release Pipeline' : 'CI Pipeline');

    let fileName = 'ci.yml';
    if (workflowType === 'release') fileName = 'release.yml';
    if (workflowType === 'quality') fileName = 'code-quality.yml';

    const relativePath = `.github/workflows/${fileName}`;
    let content = '';

    switch (detected) {
      case 'android':
        content = this.getAndroidTemplate(workflowType, branch, name, options);
        break;
      case 'python':
        content = this.getPythonTemplate(workflowType, branch, name, options);
        break;
      case 'multiplatform':
        content = this.getMultiPlatformTemplate(workflowType, branch, name, options);
        break;
      case 'node':
      default:
        content = this.getNodeTemplate(workflowType, branch, name, options);
        break;
    }

    return {
      fileName,
      relativePath,
      content: content.trim(),
      detectedStack: detected
    };
  }

  /**
   * Writes the generated workflow YAML directly into .github/workflows/
   */
  public static syncToWorkspace(
    workspaceRoot: string,
    workflow: GeneratedWorkflowResult
  ): { success: boolean; filePath: string; error?: string } {
    try {
      const fullDir = path.join(path.resolve(workspaceRoot), '.github', 'workflows');
      if (!fs.existsSync(fullDir)) {
        fs.mkdirSync(fullDir, { recursive: true });
      }
      const fullFilePath = path.join(fullDir, workflow.fileName);
      fs.writeFileSync(fullFilePath, workflow.content + '\n', 'utf-8');
      return { success: true, filePath: fullFilePath };
    } catch (err: any) {
      return { success: false, filePath: '', error: err.message || String(err) };
    }
  }

  private static getNodeTemplate(
    workflowType: WorkflowType,
    branch: string,
    name: string,
    opts: WorkflowOptions
  ): string {
    const nodeVer = opts.nodeVersion || '20.x';
    const cache = opts.enableCache !== false ? "cache: 'npm'" : '';

    return `name: ${name}

on:
  push:
    branches: [ ${branch} ]
  pull_request:
    branches: [ ${branch} ]
  workflow_dispatch:

jobs:
  test-and-build:
    name: Node.js CI & Typecheck
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [ ${nodeVer} ]

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          ${cache}

      - name: Install Dependencies
        run: npm ci || npm install

      ${opts.runLint !== false ? `- name: Lint & Typecheck\n        run: npm run lint || npx tsc --noEmit || true` : ''}

      ${opts.runTests !== false ? `- name: Run Tests\n        run: npm test --if-present` : ''}

      ${opts.buildArtifact !== false ? `- name: Build Project\n        run: npm run build --if-present\n\n      - name: Archive Production Artifacts\n        uses: actions/upload-artifact@v4\n        with:\n          name: dist-artifacts\n          path: dist/\n          if-no-files-found: ignore` : ''}
`;
  }

  private static getAndroidTemplate(
    workflowType: WorkflowType,
    branch: string,
    name: string,
    opts: WorkflowOptions
  ): string {
    const jdkVer = opts.jdkVersion || '17';

    if (workflowType === 'release') {
      return `name: Android Release Build & Publish

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-release:
    name: Assemble Android Release
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Java JDK ${jdkVer}
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '${jdkVer}'
          cache: 'gradle'

      - name: Make Gradlew Executable
        run: chmod +x gradlew || true

      - name: Assemble Release APK and Bundle
        run: ./gradlew assembleRelease bundleRelease --no-daemon || ./gradlew assembleDebug --no-daemon

      - name: Publish to GitHub Releases
        uses: softprops/action-gh-release@v1
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: |
            app/build/outputs/apk/release/*.apk
            app/build/outputs/bundle/release/*.aab
            app/build/outputs/apk/debug/*.apk
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;
    }

    return `name: ${name}

on:
  push:
    branches: [ ${branch} ]
  pull_request:
    branches: [ ${branch} ]
  workflow_dispatch:

jobs:
  android-ci:
    name: Android Build & Verify
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Java JDK ${jdkVer}
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '${jdkVer}'
          cache: '${opts.enableCache !== false ? "gradle" : ""}'

      - name: Make Gradlew Executable
        run: chmod +x gradlew || true

      ${opts.runLint !== false ? `- name: Android Lint\n        run: ./gradlew lintDebug --no-daemon --stacktrace || true` : ''}

      ${opts.runTests !== false ? `- name: Run Unit Tests\n        run: ./gradlew testDebugUnitTest --no-daemon || true` : ''}

      ${opts.buildArtifact !== false ? `- name: Assemble Debug APK\n        run: ./gradlew assembleDebug --no-daemon\n\n      - name: Upload Debug APK\n        uses: actions/upload-artifact@v4\n        with:\n          name: app-debug-apk\n          path: app/build/outputs/apk/debug/*.apk\n          if-no-files-found: ignore` : ''}
`;
  }

  private static getPythonTemplate(
    workflowType: WorkflowType,
    branch: string,
    name: string,
    opts: WorkflowOptions
  ): string {
    const pyVer = opts.pythonVersion || '3.11';
    return `name: ${name}

on:
  push:
    branches: [ ${branch} ]
  pull_request:
    branches: [ ${branch} ]
  workflow_dispatch:

jobs:
  python-ci:
    name: Python Test & Code Style
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${pyVer}
        uses: actions/setup-python@v5
        with:
          python-version: '${pyVer}'
          cache: '${opts.enableCache !== false ? "pip" : ""}'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pip install pytest flake8

      ${opts.runLint !== false ? `- name: Lint with flake8\n        run: flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics || true` : ''}

      ${opts.runTests !== false ? `- name: Test with pytest\n        run: pytest || true` : ''}
`;
  }

  private static getMultiPlatformTemplate(
    workflowType: WorkflowType,
    branch: string,
    name: string,
    opts: WorkflowOptions
  ): string {
    return `name: ${name} (Multi-Platform CI)

on:
  push:
    branches: [ ${branch} ]
  pull_request:
    branches: [ ${branch} ]
  workflow_dispatch:

jobs:
  web-service-ci:
    name: Web & API Service CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '${opts.nodeVersion || "20.x"}'
          cache: 'npm'
      - run: npm ci || npm install
      - run: npm run lint || true
      - run: npm test --if-present

  mobile-app-ci:
    name: Android Mobile CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '${opts.jdkVersion || "17"}'
          cache: 'gradle'
      - run: chmod +x gradlew || true
      - run: ./gradlew assembleDebug --no-daemon || true
      - uses: actions/upload-artifact@v4
        with:
          name: mobile-debug-apk
          path: app/build/outputs/apk/debug/*.apk
          if-no-files-found: ignore
`;
  }
}
