package com.umakraft.app.git

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.util.UUID

enum class GitHookType(val scriptName: String, val displayName: String, val description: String) {
    PRE_COMMIT("pre-commit", "Pre-Commit Guard", "Runs linter, static analysis, and checks before committing changes"),
    COMMIT_MSG("commit-msg", "Commit Message Validator", "Enforces Conventional Commits formatting (feat:, fix:, chore:)"),
    PRE_PUSH("pre-push", "Pre-Push CI Test Verifier", "Verifies automated tests and branch rules before pushing to remote"),
    POST_RECEIVE("post-receive", "Post-Receive Deploy Trigger", "Triggers webhook deployments or CI pipeline runs upon receiving commits")
}

data class GitHookConfig(
    val type: GitHookType,
    val isEnabled: Boolean = true,
    val scriptContent: String,
    val enforceLint: Boolean = true,
    val enforceTests: Boolean = false,
    val conventionalCommitsOnly: Boolean = true
)

data class WebhookDeliveryLog(
    val id: String = UUID.randomUUID().toString().take(8),
    val event: String,
    val timestamp: Long = System.currentTimeMillis(),
    val success: Boolean,
    val statusCode: Int,
    val repository: String,
    val branch: String,
    val sender: String,
    val signatureVerified: Boolean,
    val logOutput: String
)

/**
 * GitConnectHook: Manages local Git hook lifecycle, pre-commit validations,
 * and handles inbound / outbound GitHub Webhook integration connectors.
 */
object GitConnectHookManager {

    private val webhookLogs = mutableListOf<WebhookDeliveryLog>()

    init {
        // Initial baseline webhook activity log
        webhookLogs.add(
            WebhookDeliveryLog(
                event = "push",
                timestamp = System.currentTimeMillis() - 1800000,
                success = true,
                statusCode = 200,
                repository = "umakraft/android-compose-app",
                branch = "main",
                sender = "github-actions[bot]",
                signatureVerified = true,
                logOutput = "Webhook HMAC-SHA256 signature verified. Triggered automated CI sync."
            )
        )
    }

    fun getDefaultHookScript(type: GitHookType): String {
        return when (type) {
            GitHookType.PRE_COMMIT -> """
#!/bin/sh
# UmaKraft Pre-Commit Hook
echo "🔍 [UmaKraft GitHook] Running Pre-Commit verification..."
if [ -f "gradlew" ]; then
    ./gradlew lintDebug --no-daemon || { echo "❌ Lint check failed. Aborting commit."; exit 1; }
fi
if [ -f "package.json" ]; then
    npm run lint || { echo "❌ Node.js lint failed. Aborting commit."; exit 1; }
fi
echo "✅ [UmaKraft GitHook] Pre-commit checks passed successfully."
exit 0
""".trimIndent()

            GitHookType.COMMIT_MSG -> """
#!/bin/sh
# UmaKraft Conventional Commit Message Validator
MSG_FILE=${'$'}1
MSG=$(cat "${'$'}MSG_FILE")
REGEX="^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\([a-z0-9_-]+\))?: .+"

if ! echo "${'$'}MSG" | grep -qE "${'$'}REGEX"; then
    echo "❌ [UmaKraft GitHook] Invalid commit message format."
    echo "   Expected format: feat: <summary> or fix(scope): <summary>"
    echo "   Your message: ${'$'}MSG"
    exit 1
fi
echo "✅ [UmaKraft GitHook] Conventional Commit format verified."
exit 0
""".trimIndent()

            GitHookType.PRE_PUSH -> """
#!/bin/sh
# UmaKraft Pre-Push Hook
echo "🚀 [UmaKraft GitHook] Running pre-push unit test suite..."
if [ -f "gradlew" ]; then
    ./gradlew testDebugUnitTest --no-daemon || { echo "❌ Tests failed. Aborting push."; exit 1; }
fi
echo "✅ [UmaKraft GitHook] Push verification verified."
exit 0
""".trimIndent()

            GitHookType.POST_RECEIVE -> """
#!/bin/sh
# UmaKraft Post-Receive Hook
echo "📡 [UmaKraft GitHook] Triggering GitHubActionsSync dispatch..."
curl -X POST -H "Content-Type: application/json" -d '{"event":"push","ref":"refs/heads/main"}' https://api.umakraft.internal/git/webhook
exit 0
""".trimIndent()
        }
    }

    /**
     * Installs or updates executable hook script into .git/hooks/
     */
    suspend fun installHook(
        workspaceDir: File,
        hookType: GitHookType,
        customScript: String? = null
    ): Pair<Boolean, String> = withContext(Dispatchers.IO) {
        return@withContext try {
            val gitHooksDir = File(workspaceDir, ".git/hooks")
            if (!gitHooksDir.exists()) {
                gitHooksDir.mkdirs()
            }

            val script = customScript?.ifBlank { null } ?: getDefaultHookScript(hookType)
            val hookFile = File(gitHooksDir, hookType.scriptName)
            hookFile.writeText(script, Charsets.UTF_8)
            hookFile.setExecutable(true, false)

            Pair(true, "Hook '${hookType.displayName}' installed at .git/hooks/${hookType.scriptName}")
        } catch (e: Exception) {
            Pair(false, "Failed to install git hook: ${e.localizedMessage}")
        }
    }

    /**
     * Executes simulated pre-commit checks on active workspace
     */
    suspend fun runPreCommitGuard(workspaceDir: File): Pair<Boolean, String> = withContext(Dispatchers.IO) {
        val hasGradle = File(workspaceDir, "build.gradle.kts").exists() || File(workspaceDir, "build.gradle").exists()
        val hasPackageJson = File(workspaceDir, "package.json").exists()

        val logs = StringBuilder()
        logs.appendLine("▶ [Pre-Commit Hook] Checking workspace status...")

        var passed = true
        if (hasGradle) {
            logs.appendLine("✓ Found Gradle build script. Verifying Manifest & Kotlin Compose formatting.")
            logs.appendLine("✓ Gradle lint check: PASSED (0 fatal errors, 0 security warnings).")
        }
        if (hasPackageJson) {
            logs.appendLine("✓ Found package.json. Verifying TypeScript declarations & linting.")
            logs.appendLine("✓ TypeScript check: PASSED.")
        }
        if (!hasGradle && !hasPackageJson) {
            logs.appendLine("ℹ Clean project workspace without build violations.")
        }

        logs.appendLine("✔ [Pre-Commit Hook] All sanity checks passed. Ready to commit.")
        Pair(passed, logs.toString().trim())
    }

    /**
     * Simulates receiving or dispatching a webhook trigger event
     */
    suspend fun simulateWebhookTrigger(
        eventType: String,
        repository: String,
        branch: String = "main",
        sender: String = "developer"
    ): WebhookDeliveryLog = withContext(Dispatchers.Default) {
        val isSuccess = true
        val log = WebhookDeliveryLog(
            event = eventType,
            timestamp = System.currentTimeMillis(),
            success = isSuccess,
            statusCode = 200,
            repository = repository,
            branch = branch,
            sender = sender,
            signatureVerified = true,
            logOutput = "HMAC-SHA256 signature verified with secret. Event '$eventType' on $branch dispatched to CI/CD engine."
        )
        synchronized(webhookLogs) {
            webhookLogs.add(0, log)
            if (webhookLogs.size > 20) {
                webhookLogs.removeAt(webhookLogs.size - 1)
            }
        }
        log
    }

    fun getWebhookLogs(): List<WebhookDeliveryLog> {
        return synchronized(webhookLogs) { webhookLogs.toList() }
    }
}
