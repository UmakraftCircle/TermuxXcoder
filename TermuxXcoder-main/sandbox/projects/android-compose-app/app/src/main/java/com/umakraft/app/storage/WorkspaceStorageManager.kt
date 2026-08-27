package com.umakraft.app.storage

import android.content.Context
import java.io.File

class WorkspaceStorageManager(context: Context) {

    private val root: File = context.filesDir.resolve("workspace")

    init {
        if (!root.exists()) root.mkdirs()
    }

    fun resolveSafePath(relativePath: String): File? {
        if (relativePath.isBlank()) return null
        if (relativePath.contains("\u0000")) return null
        val canonicalRoot = root.canonicalFile
        val target = File(canonicalRoot, relativePath).canonicalFile
        if (!target.path.startsWith(canonicalRoot.path + File.separator) && target != canonicalRoot) {
            return null
        }
        return target
    }

    fun writeFile(relativePath: String, content: String): Boolean {
        val target = resolveSafePath(relativePath) ?: return false
        target.parentFile?.mkdirs()
        return try {
            target.writeText(content)
            true
        } catch (e: Exception) {
            false
        }
    }

    fun readFile(relativePath: String): String? {
        val target = resolveSafePath(relativePath) ?: return null
        return if (target.isFile) target.readText() else null
    }

    fun listItems(relativePath: String): List<String>? {
        val target = resolveSafePath(relativePath) ?: return null
        return target.listFiles()?.map { it.name }
    }

    fun deleteItem(relativePath: String): Boolean {
        val target = resolveSafePath(relativePath) ?: return false
        return target.deleteRecursively()
    }
}
