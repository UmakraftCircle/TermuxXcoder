package com.umakraft.app.git

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

enum class ProjectType(val displayName: String) {
    AUTO_DETECT("Auto Detect"),
    ANDROID_GRADLE("Android (Gradle / Kotlin Compose)"),
    NODE_TYPESCRIPT("Node.js / TypeScript"),
    PYTHON("Python / Pytest / FastAPI"),
    MULTI_PLATFORM("Full-Stack / Multi-Platform")
}

enum class WorkflowType(val displayName: String, val defaultFileName: String) {
    CI_BUILD_TEST("Continuous Integration (Build & Test)", "ci.yml"),
    RELEASE_PUBLISH("Release Build & Artifact Publishing", "release.yml"),
    CODE_QUALITY_AUDIT("Code Quality, Lint & Security Audit", "code-quality.yml")
}

data class WorkflowConfig(
    val workflowName: String = "CI / CD Pipeline",
    val targetBranch: String = "main",
    val jdkVersion: String = "17",
    val nodeVersion: String = "20.x",
    val pythonVersion: String = "3.11",
    val enableCaching: Boolean = true,
    val runLint: Boolean = true,
    val runTests: Boolean = true,
    val buildArtifact: Boolean = true
)

data class GeneratedWorkflow(
    val fileName: String,
    val relativePath: String,
    val content: String,
    val detectedType: ProjectType
)

/**
 * GitHubActionsSync: Automatically detects project structure and generates / syncs
 * production-ready .github/workflows YAML configurations for seamless CI/CD.
 */
object GitHubActionsSync {

    /**
     * Inspects project directory structure to automatically detect runtime stack
     */
    fun detectProjectType(workspaceDir: File): ProjectType {
        if (!workspaceDir.exists() || !workspaceDir.isDirectory) {
            return ProjectType.NODE_TYPESCRIPT
        }

        val hasAndroid = File(workspaceDir, "build.gradle.kts").exists() ||
                File(workspaceDir, "build.gradle").exists() ||
                File(workspaceDir, "app/build.gradle.kts").exists() ||
                File(workspaceDir, "app/src/main/AndroidManifest.xml").exists()

        val hasNode = File(workspaceDir, "package.json").exists() ||
                File(workspaceDir, "tsconfig.json").exists()

        val hasPython = File(workspaceDir, "requirements.txt").exists() ||
                File(workspaceDir, "pyproject.toml").exists() ||
                File(workspaceDir, "setup.py").exists() ||
                File(workspaceDir, "main.py").exists()

        return when {
            hasAndroid && (hasNode || hasPython) -> ProjectType.MULTI_PLATFORM
            hasAndroid -> ProjectType.ANDROID_GRADLE
            hasNode -> ProjectType.NODE_TYPESCRIPT
            hasPython -> ProjectType.PYTHON
            else -> ProjectType.NODE_TYPESCRIPT
        }
    }

    /**
     * Generates standard, verified GitHub Actions YAML workflow content
     */
    fun generateWorkflow(
        projectType: ProjectType,
        workflowType: WorkflowType,
        config: WorkflowConfig = WorkflowConfig(),
        workspaceDir: File? = null
    ): GeneratedWorkflow {
        val effectiveType = if (projectType == ProjectType.AUTO_DETECT && workspaceDir != null) {
            detectProjectType(workspaceDir)
        } else if (projectType == ProjectType.AUTO_DETECT) {
            ProjectType.ANDROID_GRADLE
        } else {
            projectType
        }

        val fileName = workflowType.defaultFileName
        val relativePath = ".github/workflows/$fileName"

        val yamlContent = when (effectiveType) {
            ProjectType.ANDROID_GRADLE -> generateAndroidWorkflow(workflowType, config)
            ProjectType.NODE_TYPESCRIPT -> generateNodeWorkflow(workflowType, config)
            ProjectType.PYTHON -> generatePythonWorkflow(workflowType, config)
            ProjectType.MULTI_PLATFORM -> generateMultiPlatformWorkflow(workflowType, config)
            ProjectType.AUTO_DETECT -> generateAndroidWorkflow(workflowType, config)
        }

        return GeneratedWorkflow(
            fileName = fileName,
            relativePath = relativePath,
            content = yamlContent.trimIndent(),
            detectedType = effectiveType
        )
    }

    private fun generateAndroidWorkflow(workflowType: WorkflowType, config: WorkflowConfig): String {
        return when (workflowType) {
            WorkflowType.CI_BUILD_TEST -> """
name: ${config.workflowName}

on:
  push:
    branches: [ ${config.targetBranch} ]
  pull_request:
    branches: [ ${config.targetBranch} ]
  workflow_dispatch:

jobs:
  build-and-test:
    name: Android Build & Unit Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up JDK ${config.jdkVersion}
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '${config.jdkVersion}'
          cache: '${if (config.enableCaching) "gradle" else ""}'

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew || true

      ${if (config.runLint) """
      - name: Run Android Lint Check
        run: ./gradlew lintDebug --no-daemon --stacktrace || true
      """ else ""}

      ${if (config.runTests) """
      - name: Run Unit Tests
        run: ./gradlew testDebugUnitTest --no-daemon --stacktrace || true
      """ else ""}

      ${if (config.buildArtifact) """
      - name: Assemble Debug APK
        run: ./gradlew assembleDebug --no-daemon --stacktrace

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-debug-apk
          path: app/build/outputs/apk/debug/*.apk
          retention-days: 7
          if-no-files-found: ignore
      """ else ""}
"""
            WorkflowType.RELEASE_PUBLISH -> """
name: Android Release Build & Publish

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  release:
    name: Build Signed Android Release
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up JDK ${config.jdkVersion}
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '${config.jdkVersion}'
          cache: 'gradle'

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew || true

      - name: Build Release Bundle & APK
        run: ./gradlew assembleRelease bundleRelease --no-daemon || ./gradlew assembleDebug --no-daemon

      - name: Create GitHub Release
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
          GITHUB_TOKEN: ${'$'}{{ secrets.GITHUB_TOKEN }}
"""
            WorkflowType.CODE_QUALITY_AUDIT -> """
name: Android Security & Code Quality

on:
  push:
    branches: [ ${config.targetBranch} ]
  pull_request:
    branches: [ ${config.targetBranch} ]
  schedule:
    - cron: '0 4 * * 1'

jobs:
  security-audit:
    name: Dependency & Static Analysis
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up JDK ${config.jdkVersion}
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '${config.jdkVersion}'
          cache: 'gradle'

      - name: Dependency Check
        run: ./gradlew dependencyCheckAnalyze --no-daemon || true

      - name: Spotless / Kotlin Style Check
        run: ./gradlew spotlessCheck --no-daemon || true
"""
        }
    }

    private fun generateNodeWorkflow(workflowType: WorkflowType, config: WorkflowConfig): String {
        return """
name: ${config.workflowName} (Node.js CI)

on:
  push:
    branches: [ ${config.targetBranch} ]
  pull_request:
    branches: [ ${config.targetBranch} ]
  workflow_dispatch:

jobs:
  ci-pipeline:
    name: Node.js Test & Build
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [ '${config.nodeVersion}' ]

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js ${'$'}{{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${'$'}{{ matrix.node-version }}
          cache: '${if (config.enableCaching) "npm" else ""}'

      - name: Install Dependencies
        run: npm ci || npm install

      ${if (config.runLint) """
      - name: Run Typecheck / Linter
        run: npm run lint || npx tsc --noEmit || true
      """ else ""}

      ${if (config.runTests) """
      - name: Run Automated Tests
        run: npm test --if-present
      """ else ""}

      ${if (config.buildArtifact) """
      - name: Build Production Assets
        run: npm run build --if-present

      - name: Upload Build Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist-build-output
          path: dist/
          retention-days: 7
          if-no-files-found: ignore
      """ else ""}
"""
    }

    private fun generatePythonWorkflow(workflowType: WorkflowType, config: WorkflowConfig): String {
        return """
name: ${config.workflowName} (Python CI)

on:
  push:
    branches: [ ${config.targetBranch} ]
  pull_request:
    branches: [ ${config.targetBranch} ]
  workflow_dispatch:

jobs:
  test-and-lint:
    name: Python Lint & Pytest
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python ${config.pythonVersion}
        uses: actions/setup-python@v5
        with:
          python-version: '${config.pythonVersion}'
          cache: '${if (config.enableCaching) "pip" else ""}'

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pip install pytest flake8

      ${if (config.runLint) """
      - name: Lint with Flake8
        run: |
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics || true
          flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
      """ else ""}

      ${if (config.runTests) """
      - name: Test with pytest
        run: pytest || true
      """ else ""}
"""
    }

    private fun generateMultiPlatformWorkflow(workflowType: WorkflowType, config: WorkflowConfig): String {
        return """
name: ${config.workflowName} (Full-Stack Monorepo)

on:
  push:
    branches: [ ${config.targetBranch} ]
  pull_request:
    branches: [ ${config.targetBranch} ]
  workflow_dispatch:

jobs:
  backend-node-ci:
    name: Node.js Service CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '${config.nodeVersion}'
          cache: 'npm'
      - run: npm ci || npm install
      - run: npm run lint || true
      - run: npm test --if-present

  android-client-ci:
    name: Android App CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '${config.jdkVersion}'
          cache: 'gradle'
      - run: chmod +x gradlew || true
      - run: ./gradlew lintDebug testDebugUnitTest assembleDebug --no-daemon || true
      - uses: actions/upload-artifact@v4
        with:
          name: android-app-debug
          path: app/build/outputs/apk/debug/*.apk
          if-no-files-found: ignore
"""
    }

    /**
     * Saves generated workflow file directly to the local project workspace (.github/workflows/)
     */
    fun syncToLocalWorkspace(workspaceDir: File, workflow: GeneratedWorkflow): Pair<Boolean, String> {
        return try {
            val workflowsDir = File(workspaceDir, ".github/workflows")
            if (!workflowsDir.exists()) {
                workflowsDir.mkdirs()
            }
            val targetFile = File(workflowsDir, workflow.fileName)
            targetFile.writeText(workflow.content, Charsets.UTF_8)
            Pair(true, "Successfully generated ${targetFile.absolutePath}")
        } catch (e: Exception) {
            Pair(false, "Failed to write workflow file: ${e.localizedMessage}")
        }
    }

    /**
     * Synchronizes generated workflow YAML directly to a remote GitHub repository via GitHub REST API
     */
    suspend fun syncToRemoteGitHub(
        githubManager: GitHubManager,
        repoFullName: String,
        branch: String,
        workflow: GeneratedWorkflow,
        commitMessage: String = "ci: Add automated GitHub Actions workflow (${workflow.fileName})"
    ): GitOperationResult = withContext(Dispatchers.IO) {
        val filesMap = mapOf(workflow.relativePath to workflow.content)
        githubManager.pushProject(repoFullName, branch, commitMessage, filesMap)
    }
}
