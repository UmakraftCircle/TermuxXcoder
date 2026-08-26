package com.umakraft.app.storage

import android.content.Context
import android.os.Build
import android.os.Environment
import android.os.StatFs
import java.io.File

data class StorageSpaceInfo(
    val path: String,
    val totalBytes: Long,
    val freeBytes: Long,
    val isExternal: Boolean
) {
    val totalGbFormatted: String
        get() = String.format("%.2f GB", totalBytes.toDouble() / (1024 * 1024 * 1024))

    val freeGbFormatted: String
        get() = String.format("%.2f GB", freeBytes.toDouble() / (1024 * 1024 * 1024))

    val usedPercent: Int
        get() = if (totalBytes > 0) (((totalBytes - freeBytes).toDouble() / totalBytes) * 100).toInt() else 0
}

data class WorkspaceFileInfo(
    val name: String,
    val path: String,
    val isDirectory: Boolean,
    val sizeBytes: Long,
    val lastModified: Long
) {
    val formattedSize: String
        get() = when {
            sizeBytes >= 1024 * 1024 * 1024 -> String.format("%.2f GB", sizeBytes.toDouble() / (1024 * 1024 * 1024))
            sizeBytes >= 1024 * 1024 -> String.format("%.2f MB", sizeBytes.toDouble() / (1024 * 1024))
            sizeBytes >= 1024 -> String.format("%.1f KB", sizeBytes.toDouble() / 1024)
            else -> "$sizeBytes B"
        }
}

/**
 * Robust Multi-Tier Storage Manager for UmaKraft IDE & AI Model Storage:
 * 1. App-Private Files: `context.filesDir` (No permissions required, completely isolated)
 * 2. External App Storage: `context.getExternalFilesDir(null)` (High capacity, no permission required on Android 4.4+)
 * 3. Shared Global Storage: `/sdcard/UmaKraft/` (Requires MANAGE_EXTERNAL_STORAGE for cross-app & Termux access)
 */
class WorkspaceStorageManager(private val context: Context) {

    enum class StorageLocationType {
        APP_INTERNAL,       // /data/user/0/com.umakraft.app/files/
        APP_EXTERNAL_SCOPED, // /storage/emulated/0/Android/data/com.umakraft.app/files/
        SHARED_EXTERNAL     // /storage/emulated/0/UmaKraft/
    }

    var currentLocationType: StorageLocationType = StorageLocationType.APP_INTERNAL
        private set

    init {
        // Initialize default storage folders
        initializeStorageDirectories()
    }

    fun setLocationType(type: StorageLocationType) {
        currentLocationType = type
        initializeStorageDirectories()
    }

    /**
     * Returns the base directory for active storage type
     */
    fun getBaseDir(): File {
        return when (currentLocationType) {
            StorageLocationType.APP_INTERNAL -> context.filesDir
            StorageLocationType.APP_EXTERNAL_SCOPED -> context.getExternalFilesDir(null) ?: context.filesDir
            StorageLocationType.SHARED_EXTERNAL -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && Environment.isExternalStorageManager()) {
                    File(Environment.getExternalStorageDirectory(), "UmaKraft")
                } else if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
                    File(Environment.getExternalStorageDirectory(), "UmaKraft")
                } else {
                    // Safe fallback if shared permissions aren't granted
                    context.getExternalFilesDir(null) ?: context.filesDir
                }
            }
        }
    }

    val workspaceDir: File
        get() = File(getBaseDir(), "workspace")

    val modelsDir: File
        get() = File(getBaseDir(), "models")

    val logsDir: File
        get() = File(getBaseDir(), "logs")

    val tempDir: File
        get() = File(getBaseDir(), "temp")

    /**
     * Creates all essential workspace and AI model storage folders
     */
    fun initializeStorageDirectories(): Boolean {
        return try {
            val base = getBaseDir()
            if (!base.exists()) base.mkdirs()

            if (!workspaceDir.exists()) workspaceDir.mkdirs()
            if (!modelsDir.exists()) modelsDir.mkdirs()
            if (!logsDir.exists()) logsDir.mkdirs()
            if (!tempDir.exists()) tempDir.mkdirs()

            // Create initial placeholder / README in workspace if empty
            val welcomeFile = File(workspaceDir, "README.md")
            if (!welcomeFile.exists()) {
                welcomeFile.writeText(
                    "# UmaKraft Local Workspace\n\n" +
                    "Files created here are managed by the AI Agent and the UmaKraft IDE.\n" +
                    "- Models Directory: `models/` (Store GGUF/ONNX/Tensor models here)\n" +
                    "- Projects Directory: `workspace/`\n" +
                    "- Storage Root: `${base.absolutePath}`\n"
                )
            }

            // Create models catalog info
            val modelsReadme = File(modelsDir, "README_MODELS.txt")
            if (!modelsReadme.exists()) {
                modelsReadme.writeText(
                    "Store offline AI LLM models (e.g. Qwen2.5, DeepSeek-R1-GGUF, Llama-3-GGUF) in this folder.\n" +
                    "Path: ${modelsDir.absolutePath}\n"
                )
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    /**
     * Reads storage disk space information (Total GB, Free GB)
     */
    fun getStorageSpaceInfo(): StorageSpaceInfo {
        return try {
            val base = getBaseDir()
            val stat = StatFs(base.absolutePath)
            val totalBytes = stat.totalBytes
            val freeBytes = stat.availableBytes
            StorageSpaceInfo(
                path = base.absolutePath,
                totalBytes = totalBytes,
                freeBytes = freeBytes,
                isExternal = currentLocationType != StorageLocationType.APP_INTERNAL
            )
        } catch (e: Exception) {
            StorageSpaceInfo(
                path = getBaseDir().absolutePath,
                totalBytes = 0L,
                freeBytes = 0L,
                isExternal = false
            )
        }
    }

    /**
     * List all workspace files and directories
     */
    fun listWorkspaceFiles(subDirRelativePath: String = ""): List<WorkspaceFileInfo> {
        val targetDir = if (subDirRelativePath.isBlank()) workspaceDir else File(workspaceDir, subDirRelativePath)
        if (!targetDir.exists() || !targetDir.isDirectory) return emptyList()

        return targetDir.listFiles()?.map { file ->
            WorkspaceFileInfo(
                name = file.name,
                path = file.absolutePath,
                isDirectory = file.isDirectory,
                sizeBytes = if (file.isDirectory) calculateDirectorySize(file) else file.length(),
                lastModified = file.lastModified()
            )
        }?.sortedWith(compareBy({ !it.isDirectory }, { it.name.lowercase() })) ?: emptyList()
    }

    /**
     * List all AI models in models directory
     */
    fun listModels(): List<WorkspaceFileInfo> {
        if (!modelsDir.exists() || !modelsDir.isDirectory) return emptyList()
        return modelsDir.listFiles()?.map { file ->
            WorkspaceFileInfo(
                name = file.name,
                path = file.absolutePath,
                isDirectory = file.isDirectory,
                sizeBytes = if (file.isDirectory) calculateDirectorySize(file) else file.length(),
                lastModified = file.lastModified()
            )
        }?.sortedByDescending { it.sizeBytes } ?: emptyList()
    }

    fun createFile(relativePath: String, content: String): Boolean {
        return try {
            val file = File(workspaceDir, relativePath)
            file.parentFile?.mkdirs()
            file.writeText(content)
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    fun createDirectory(relativePath: String): Boolean {
        return try {
            val dir = File(workspaceDir, relativePath)
            dir.mkdirs()
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    fun deleteItem(file: File): Boolean {
        return try {
            if (file.isDirectory) file.deleteRecursively() else file.delete()
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    fun readFileContent(file: File): String {
        return try {
            if (file.exists() && file.isFile) file.readText() else ""
        } catch (e: Exception) {
            "Error reading file: ${e.localizedMessage}"
        }
    }

    fun testStorageWriteRead(): Pair<Boolean, String> {
        return try {
            val testFile = File(tempDir, "storage_test_${System.currentTimeMillis()}.tmp")
            val sampleData = "UmaKraft Storage Test Write Verification - " + System.currentTimeMillis()
            testFile.writeText(sampleData)
            val readData = testFile.readText()
            testFile.delete()
            if (readData == sampleData) {
                Pair(true, "Storage read/write verified on ${getBaseDir().absolutePath}")
            } else {
                Pair(false, "Storage verification mismatch")
            }
        } catch (e: Exception) {
            Pair(false, "Storage test failed: ${e.localizedMessage}")
        }
    }

    private fun calculateDirectorySize(dir: File): Long {
        var size = 0L
        dir.listFiles()?.forEach { f ->
            size += if (f.isDirectory) calculateDirectorySize(f) else f.length()
        }
        return size
    }
}
