package com.umakraft.app.git

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

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

    suspend fun verifyToken(): GitOperationResult = withContext(Dispatchers.IO) {
        try {
            val url = URL("https://api.github.com/user")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                setRequestProperty("Authorization", "Bearer $personalAccessToken")
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
                GitOperationResult(false, "Authentication failed with HTTP $code")
            }
        } catch (e: Exception) {
            GitOperationResult(false, "Network error: ${e.localizedMessage}")
        }
    }

    suspend fun listUserRepositories(): List<GitHubRepo> = withContext(Dispatchers.IO) {
        val repos = mutableListOf<GitHubRepo>()
        try {
            val url = URL("https://api.github.com/user/repos?sort=updated&per_page=30")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                setRequestProperty("Authorization", "Bearer $personalAccessToken")
                setRequestProperty("Accept", "application/vnd.github.v3+json")
                setRequestProperty("User-Agent", "UmaKraft-Android-IDE")
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
        try {
            // Push via GitHub Contents API
            for ((path, content) in filesMap) {
                val encodedContent = android.util.Base64.encodeToString(
                    content.toByteArray(Charsets.UTF_8),
                    android.util.Base64.NO_WRAP
                )

                // Check if file exists to get SHA for update
                val fileUrl = URL("https://api.github.com/repos/$repoFullName/contents/$path?ref=$branch")
                val getConn = (fileUrl.openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    setRequestProperty("Authorization", "Bearer $personalAccessToken")
                    setRequestProperty("Accept", "application/vnd.github.v3+json")
                    setRequestProperty("User-Agent", "UmaKraft-Android-IDE")
                }

                var sha: String? = null
                if (getConn.responseCode == 200) {
                    val res = getConn.inputStream.bufferedReader().use { it.readText() }
                    sha = JSONObject(res).optString("sha")
                }

                // Put file content
                val putConn = (fileUrl.openConnection() as HttpURLConnection).apply {
                    requestMethod = "PUT"
                    setRequestProperty("Authorization", "Bearer $personalAccessToken")
                    setRequestProperty("Accept", "application/vnd.github.v3+json")
                    setRequestProperty("User-Agent", "UmaKraft-Android-IDE")
                    setRequestProperty("Content-Type", "application/json")
                    doOutput = true
                }

                val payload = JSONObject().apply {
                    put("message", commitMessage)
                    put("content", encodedContent)
                    put("branch", branch)
                    if (sha != null) {
                        put("sha", sha)
                    }
                }

                OutputStreamWriter(putConn.outputStream).use { it.write(payload.toString()) }

                val putCode = putConn.responseCode
                if (putCode !in 200..201) {
                    val err = putConn.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                    return@withContext GitOperationResult(false, "Failed to push $path (HTTP $putCode): $err")
                }
            }
            GitOperationResult(true, "Successfully pushed ${filesMap.size} files to $repoFullName on branch '$branch'")
        } catch (e: Exception) {
            GitOperationResult(false, "Push failed: ${e.localizedMessage}")
        }
    }
}
