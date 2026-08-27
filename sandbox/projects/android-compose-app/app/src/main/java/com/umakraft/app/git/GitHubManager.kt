package com.umakraft.app.git

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

data class GitHubRepo(
    val name: String,
    val fullName: String,
    val description: String?,
    val cloneUrl: String,
    val isPrivate: Boolean,
    val defaultBranch: String,
    val stars: Int
)

data class GitOperationResult(
    val success: Boolean,
    val message: String,
    val log: String = ""
)

class GitHubManager(private val personalAccessToken: String) {

    private val repoPattern = Regex("^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$")
    private val branchPattern = Regex("^[a-zA-Z0-9_./-]+$")

    suspend fun verifyToken(): GitOperationResult = withContext(Dispatchers.IO) {
        val cleanToken = personalAccessToken.trim()
        if (cleanToken.isBlank()) {
            return@withContext GitOperationResult(false, "Personal access token is empty")
        }

        try {
            val url = URL("https://api.github.com/user")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                setRequestProperty("Authorization", "Bearer $cleanToken")
                setRequestProperty("Accept", "application/vnd.github.v3+json")
                setRequestProperty("User-Agent", "UmaKraft-Android-IDE")
                connectTimeout = 10000
                readTimeout = 10000
            }

            val code = conn.responseCode
            if (code == 200) {
                val response = conn.inputStream.bufferedReader().use { it.readText() }
                val json = JSONObject(response)
                val login = json.optString("login", "Unknown")
                GitOperationResult(true, "Authenticated as @$login", response)
            } else {
                val err = conn.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                GitOperationResult(false, "Authentication failed (HTTP $code): $err")
            }
        } catch (e: Exception) {
            GitOperationResult(false, "Network connection error: ${e.localizedMessage}")
        }
    }

    suspend fun listUserRepositories(): List<GitHubRepo> = withContext(Dispatchers.IO) {
        val cleanToken = personalAccessToken.trim()
        if (cleanToken.isBlank()) return@withContext emptyList()

        val repos = mutableListOf<GitHubRepo>()
        try {
            val url = URL("https://api.github.com/user/repos?sort=updated&per_page=30")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                setRequestProperty("Authorization", "Bearer $cleanToken")
                setRequestProperty("Accept", "application/vnd.github.v3+json")
                setRequestProperty("User-Agent", "UmaKraft-Android-IDE")
                connectTimeout = 10000
                readTimeout = 10000
            }

            if (conn.responseCode == 200) {
                val body = conn.inputStream.bufferedReader().use { it.readText() }
                val array = JSONArray(body)
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    repos.add(
                        GitHubRepo(
                            name = obj.getString("name"),
                            fullName = obj.getString("full_name"),
                            description = if (obj.isNull("description")) null else obj.getString("description"),
                            cloneUrl = obj.getString("clone_url"),
                            isPrivate = obj.getBoolean("private"),
                            defaultBranch = obj.optString("default_branch", "main"),
                            stars = obj.optInt("stargazers_count", 0)
                        )
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        repos
    }

    suspend fun pushProject(
        repoFullName: String,
        branch: String,
        commitMessage: String,
        filesMap: Map<String, String>
    ): GitOperationResult = withContext(Dispatchers.IO) {
        val cleanToken = personalAccessToken.trim()
        val cleanRepo = repoFullName.trim()
        val cleanBranch = branch.trim()

        if (!cleanRepo.matches(repoPattern)) {
            return@withContext GitOperationResult(false, "Invalid repository name format. Expected 'owner/repository'.")
        }

        if (!cleanBranch.matches(branchPattern)) {
            return@withContext GitOperationResult(false, "Invalid branch name format.")
        }

        if (filesMap.isEmpty()) {
            return@withContext GitOperationResult(false, "No files provided to push.")
        }

        try {
            for ((path, content) in filesMap) {
                val cleanFilePath = path.trim().replace("\\", "/").trimStart('/')
                if (cleanFilePath.contains("..")) {
                    return@withContext GitOperationResult(false, "Illegal relative path in file: $path")
                }

                val encodedContent = android.util.Base64.encodeToString(
                    content.toByteArray(Charsets.UTF_8),
                    android.util.Base64.NO_WRAP
                )

                val encodedPath = cleanFilePath.split("/").joinToString("/") { URLEncoder.encode(it, "UTF-8") }
                val fileUrl = URL("https://api.github.com/repos/$cleanRepo/contents/$encodedPath?ref=$cleanBranch")
                
                val getConn = (fileUrl.openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    setRequestProperty("Authorization", "Bearer $cleanToken")
                    setRequestProperty("Accept", "application/vnd.github.v3+json")
                    setRequestProperty("User-Agent", "UmaKraft-Android-IDE")
                    connectTimeout = 10000
                    readTimeout = 10000
                }

                var sha: String? = null
                if (getConn.responseCode == 200) {
                    val res = getConn.inputStream.bufferedReader().use { it.readText() }
                    sha = JSONObject(res).optString("sha")
                }

                val putConn = (fileUrl.openConnection() as HttpURLConnection).apply {
                    requestMethod = "PUT"
                    setRequestProperty("Authorization", "Bearer $cleanToken")
                    setRequestProperty("Accept", "application/vnd.github.v3+json")
                    setRequestProperty("User-Agent", "UmaKraft-Android-IDE")
                    setRequestProperty("Content-Type", "application/json")
                    connectTimeout = 10000
                    readTimeout = 10000
                    doOutput = true
                }

                val payload = JSONObject().apply {
                    put("message", commitMessage.ifBlank { "Update $cleanFilePath via UmaKraft IDE" })
                    put("content", encodedContent)
                    put("branch", cleanBranch)
                    if (sha != null && sha.isNotBlank()) {
                        put("sha", sha)
                    }
                }

                OutputStreamWriter(putConn.outputStream, Charsets.UTF_8).use { it.write(payload.toString()) }

                val putCode = putConn.responseCode
                if (putCode !in 200..201) {
                    val err = putConn.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                    return@withContext GitOperationResult(false, "Failed to write '$cleanFilePath' (HTTP $putCode): $err")
                }
            }
            GitOperationResult(true, "Successfully synchronized ${filesMap.size} files to $cleanRepo on branch '$cleanBranch'")
        } catch (e: Exception) {
            GitOperationResult(false, "Push failed: ${e.localizedMessage}")
        }
    }
}
