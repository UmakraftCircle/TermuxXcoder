package com.umakraft.app.storage

import android.content.Context
import android.os.Build
import android.os.Environment
import android.os.StatFs
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException

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
 * Hardened Multi-Tier Storage Manager for UmaKraft IDE & AI Model Storage
 * Enforces Scoped Storage, Canonical Path Boundaries (Anti-Traversal), and Atomic Disk I/O.
 */
class WorkspaceStorageManager(private val context: Context) {

    enum class StorageLocationType {
        APP_INTERNAL,        // /data/user/0/com.umakraft.app/files/ (Private, zero permissions required)
        APP_EXTERNAL_SCOPED, // /storage/emulated/0/Android/data/com.umakraft.app/files/ (High-capacity scoped storage)
        SHARED_EXTERNAL      // /storage/emulated/0/UmaKraft/ (Requires explicit permissions or throws error)
    }

    var currentLocationType: StorageLocationType = StorageLocationType.APP_INTERNAL
        private set

    init {
        initializeStorageDirectories()
    }

    /**
     * Attempts to switch storage tier. Returns success/failure description.
     */
    fun setLocationType(type: StorageLocationType): Pair<Boolean, String> {
        if (type == StorageLocationType.SHARED_EXTERNAL) {
            val hasManagerPermission = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && Environment.isExternalStorageManager()
            if (!hasManagerPermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                return Pair(false, "Shared external storage requires MANAGE_EXTERNAL_STORAGE permission. Tier not switched.")
            }
        }
        currentLocationType = type
        val success = initializeStorageDirectories()
        return Pair(success, "Active storage set to ${getBaseDir().absolutePath}")
    }

    /**
     * Returns the base directory for active storage type
     */
    fun getBaseDir(): File {
        return when (currentLocationType) {
            StorageLocationType.APP_INTERNAL -> context.filesDir
            StorageLocationType.APP_EXTERNAL_SCOPED -> context.getExternalFilesDir(null) ?: context.filesDir
            StorageLocationType.SHARED_EXTERNAL -> {
                File(Environment.getExternalStorageDirectory(), "UmaKraft")
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
     * Safely resolves a relative path within workspace boundaries, preventing directory traversal
     */
    fun resolveSafeWorkspaceFile(relativePath: String): File? {
        val cleanPath = relativePath.trim()
        if (cleanPath.contains("..") || cleanPath.startsWith("/") || cleanPath.startsWith("\\")) {
            return null
        }
        val target = File(workspaceDir, cleanPath)
        return try {
            val canonicalRoot = workspaceDir.canonicalPath
            val canonicalTarget = target.canonicalPath
            if (canonicalTarget.startsWith(canonicalRoot)) {
                target
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Initializes storage hierarchy and templates
     */
    fun initializeStorageDirectories(): Boolean {
        return try {
            val base = getBaseDir()
            if (!base.exists()) base.mkdirs()

            if (!workspaceDir.exists()) workspaceDir.mkdirs()
            if (!modelsDir.exists()) modelsDir.mkdirs()
            if (!logsDir.exists()) logsDir.mkdirs()
            if (!tempDir.exists()) tempDir.mkdirs()

            val welcomeFile = File(workspaceDir, "README.md")
            if (!welcomeFile.exists()) {
                welcomeFile.writeText(
                    "# UmaKraft Local Workspace\n\n" +
                    "Files created here are managed by the AI Agent and the UmaKraft IDE.\n" +
                    "- Models Directory: `models/`\n" +
                    "- Projects Directory: `workspace/`\n" +
                    "- Storage Root: `${base.absolutePath}`\n"
                )
            }
            true
        } catch (e: Exception) {
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
     * List all workspace files and directories with path validation
     */
    fun listWorkspaceFiles(subDirRelativePath: String = ""): List<WorkspaceFileInfo> {
        val targetDir = if (subDirRelativePath.isBlank()) {
            workspaceDir
        } else {
            resolveSafeWorkspaceFile(subDirRelativePath) ?: return emptyList()
        }

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

    /**
     * Creates a file safely with anti-traversal check and atomic write
     */
    fun createFile(relativePath: String, content: String): Boolean {
        val file = resolveSafeWorkspaceFile(relativePath) ?: return false
        return try {
            file.parentFile?.mkdirs()
            val temp = File.createTempFile("uk_write_", ".tmp", tempDir)
            temp.writeText(content, Charsets.UTF_8)
            if (file.exists()) file.delete()
            temp.renameTo(file)
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Creates a directory safely with anti-traversal check
     */
    fun createDirectory(relativePath: String): Boolean {
        val dir = resolveSafeWorkspaceFile(relativePath) ?: return false
        return try {
            dir.mkdirs()
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Deletes a file or directory strictly inside workspace boundaries
     */
    fun deleteItem(file: File): Boolean {
        return try {
            val canonicalRoot = getBaseDir().canonicalPath
            val canonicalTarget = file.canonicalPath
            if (!canonicalTarget.startsWith(canonicalRoot)) {
                return false // Reject files outside base sandbox
            }
            if (file.isDirectory) file.deleteRecursively() else file.delete()
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Reads file content with validation
     */
    fun readFileContent(file: File): String {
        return try {
            val canonicalRoot = getBaseDir().canonicalPath
            val canonicalTarget = file.canonicalPath
            if (!canonicalTarget.startsWith(canonicalRoot)) {
                return "Error: Access denied (Outside workspace boundary)"
            }
            if (file.exists() && file.isFile) file.readText(Charsets.UTF_8) else ""
        } catch (e: Exception) {
            "Error reading file: ${e.localizedMessage}"
        }
    }

    suspend fun readFileContentAsync(file: File): String = withContext(Dispatchers.IO) {
        readFileContent(file)
    }

    fun testStorageWriteRead(): Pair<Boolean, String> {
        return try {
            val testFile = File(tempDir, "storage_test_${System.currentTimeMillis()}.tmp")
            val sampleData = "UmaKraft Verified Storage Test - ${System.currentTimeMillis()}"
            testFile.writeText(sampleData, Charsets.UTF_8)
            val readData = testFile.readText(Charsets.UTF_8)
            testFile.delete()
            if (readData == sampleData) {
                Pair(true, "Storage verified on ${getBaseDir().absolutePath}")
            } else {
                Pair(false, "Storage read/write mismatch")
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
