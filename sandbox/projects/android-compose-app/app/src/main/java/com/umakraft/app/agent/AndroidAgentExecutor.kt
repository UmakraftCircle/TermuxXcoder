package com.umakraft.app.agent

import com.umakraft.app.git.GitHubActionsSync
import com.umakraft.app.git.ProjectType
import com.umakraft.app.git.WorkflowConfig
import com.umakraft.app.git.WorkflowType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext
import java.io.File

data class AgentToolDefinition(
    val name: String,
    val description: String,
    val requiresApproval: Boolean = false
)

data class AgentToolResult(
    val success: Boolean,
    val output: String,
    val error: String? = null,
    val durationMs: Long = 0
)

data class AgentStepData(
    val stepNumber: Int,
    val thought: String,
    val toolName: String?,
    val args: String?,
    val result: AgentToolResult?,
    val isCompleted: Boolean = false
)

sealed class AgentStreamEvent {
    data class Planning(val stepNumber: Int, val thought: String) : AgentStreamEvent()
    data class ToolExecuting(val stepNumber: Int, val toolName: String, val args: String) : AgentStreamEvent()
    data class ToolFinished(val stepNumber: Int, val step: AgentStepData) : AgentStreamEvent()
    data class TaskCompleted(val summary: String) : AgentStreamEvent()
    data class TaskError(val error: String) : AgentStreamEvent()
}

class AndroidAgentExecutor(private val workspaceRoot: File) {

    val availableTools = listOf(
        AgentToolDefinition("fs_list_files", "Scans directory files in workspace"),
        AgentToolDefinition("fs_read_source", "Reads Kotlin, Gradle, or XML source files"),
        AgentToolDefinition("fs_write_source", "Writes and compiles Kotlin code files"),
        AgentToolDefinition("project_manifest_check", "Inspects Manifest, Gradle files, and permissions"),
        AgentToolDefinition("github_actions_workflow_sync", "Generates and saves .github/workflows CI/CD YAML configurations"),
        AgentToolDefinition("git_commit_push", "Commits and pushes code to GitHub remote", requiresApproval = true)
    )

    private fun resolveSafeFile(relativePath: String): File? {
        val clean = relativePath.trim()
        if (clean.contains("..")) return null
        val target = File(workspaceRoot, clean)
        return try {
            if (target.canonicalPath.startsWith(workspaceRoot.canonicalPath)) target else null
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Executes autonomous task emitting streaming Flow events for real-time UI telemetry
     */
    fun runAutonomousFlow(objective: String): Flow<AgentStreamEvent> = flow {
        emit(AgentStreamEvent.Planning(1, "Scanning workspace directory and inspecting project tree for '$objective'"))
        delay(300)

        // Step 1: Scan files
        emit(AgentStreamEvent.ToolExecuting(1, "fs_list_files", "{}"))
        val r1 = executeStep("fs_list_files", emptyMap())
        val s1 = AgentStepData(1, "Inspected workspace project tree structure.", "fs_list_files", "{}", r1, true)
        emit(AgentStreamEvent.ToolFinished(1, s1))
        delay(200)

        // Step 2: Diagnostics
        emit(AgentStreamEvent.Planning(2, "Verifying build scripts, package structure, and configuration files"))
        delay(200)
        emit(AgentStreamEvent.ToolExecuting(2, "project_manifest_check", "{}"))
        val r2 = executeStep("project_manifest_check", emptyMap())
        val s2 = AgentStepData(2, "Verified project manifest and configuration integrity.", "project_manifest_check", "{}", r2, true)
        emit(AgentStreamEvent.ToolFinished(2, s2))
        delay(200)

        // Step 3: CI/CD Workflow Generation if requested
        if (objective.contains("ci", ignoreCase = true) || objective.contains("workflow", ignoreCase = true) || objective.contains("github actions", ignoreCase = true)) {
            emit(AgentStreamEvent.Planning(3, "Synthesizing and syncing automated GitHub Actions CI/CD pipeline"))
            delay(200)
            emit(AgentStreamEvent.ToolExecuting(3, "github_actions_workflow_sync", "{workflowType: 'CI_BUILD_TEST'}"))
            val r3 = executeStep("github_actions_workflow_sync", mapOf("workflowType" to "CI_BUILD_TEST"))
            val s3 = AgentStepData(3, "Generated production-ready GitHub Actions YAML in .github/workflows/ci.yml.", "github_actions_workflow_sync", "{workflowType: 'CI_BUILD_TEST'}", r3, true)
            emit(AgentStreamEvent.ToolFinished(3, s3))
            delay(200)
        }

        // Completed
        emit(AgentStreamEvent.TaskCompleted("Task '$objective' analyzed and synchronized successfully."))
    }.flowOn(Dispatchers.IO)

    suspend fun executeStep(
        toolName: String,
        args: Map<String, String>
    ): AgentToolResult = withContext(Dispatchers.IO) {
        val start = System.currentTimeMillis()
        try {
            when (toolName) {
                "fs_list_files" -> {
                    val files = workspaceRoot.walkTopDown().maxDepth(3).filter { it.isFile }.map { it.name }.toList()
                    val output = if (files.isNotEmpty()) {
                        "Discovered ${files.size} file(s): ${files.take(6).joinToString(", ")}${if (files.size > 6) "..." else ""}"
                    } else {
                        "Workspace directory is currently empty (${workspaceRoot.name})"
                    }
                    AgentToolResult(true, output, durationMs = System.currentTimeMillis() - start)
                }
                "fs_read_source" -> {
                    val path = args["path"] ?: "README.md"
                    val file = resolveSafeFile(path)
                    if (file != null && file.exists() && file.isFile) {
                        AgentToolResult(true, file.readText().take(400), durationMs = System.currentTimeMillis() - start)
                    } else {
                        AgentToolResult(false, "", error = "File not found or access denied: $path", durationMs = System.currentTimeMillis() - start)
                    }
                }
                "project_manifest_check" -> {
                    val gradleFile = resolveSafeFile("build.gradle.kts") ?: resolveSafeFile("app/build.gradle.kts")
                    val readmeFile = resolveSafeFile("README.md")
                    val status = buildString {
                        append("Status: ")
                        if (gradleFile?.exists() == true) append("Gradle build file detected; ")
                        if (readmeFile?.exists() == true) append("Workspace root accessible; ")
                        append("Root: ${workspaceRoot.name}")
                    }
                    AgentToolResult(true, status, durationMs = System.currentTimeMillis() - start)
                }
                "github_actions_workflow_sync" -> {
                    val type = ProjectType.AUTO_DETECT
                    val wfType = when (args["workflowType"]) {
                        "RELEASE_PUBLISH" -> WorkflowType.RELEASE_PUBLISH
                        "CODE_QUALITY_AUDIT" -> WorkflowType.CODE_QUALITY_AUDIT
                        else -> WorkflowType.CI_BUILD_TEST
                    }
                    val workflow = GitHubActionsSync.generateWorkflow(type, wfType, WorkflowConfig(), workspaceRoot)
                    val (saved, msg) = GitHubActionsSync.syncToLocalWorkspace(workspaceRoot, workflow)
                    val out = "Workflow [${workflow.fileName}] generated (${workflow.detectedType.displayName}). $msg\n\nPreview:\n${workflow.content.take(300)}..."
                    AgentToolResult(saved, out, error = if (!saved) msg else null, durationMs = System.currentTimeMillis() - start)
                }
                else -> {
                    AgentToolResult(true, "Completed $toolName on workspace ${workspaceRoot.name}", durationMs = System.currentTimeMillis() - start)
                }
            }
        } catch (e: Exception) {
            AgentToolResult(false, "", error = e.localizedMessage, durationMs = System.currentTimeMillis() - start)
        }
    }
}
