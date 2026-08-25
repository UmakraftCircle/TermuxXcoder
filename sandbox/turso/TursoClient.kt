package com.umakraft.coder.memory.turso

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * TursoClient - High-performance SQLite-compatible cloud database client for Android.
 * Communicates with Turso LibSQL HTTP v2 Pipeline API.
 */
class TursoClient(
    private var databaseUrl: String,
    private var authToken: String
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    fun updateCredentials(url: String, token: String) {
        this.databaseUrl = url
        this.authToken = token
    }

    private fun normalizeEndpoint(): String {
        var url = databaseUrl.trim()
        if (url.startsWith("libsql://")) {
            url = url.replace("libsql://", "https://")
        } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://$url"
        }
        return url.removeSuffix("/")
    }

    /**
     * Test connection to Turso database
     */
    suspend fun testConnection(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val endpoint = normalizeEndpoint()
            val payload = JSONObject().apply {
                put("requests", JSONArray().apply {
                    put(JSONObject().apply {
                        put("type", "execute")
                        put("stmt", JSONObject().apply {
                            put("sql", "SELECT 1 AS status, sqlite_version() AS version;")
                        })
                    })
                    put(JSONObject().put("type", "close"))
                })
            }

            val request = Request.Builder()
                .url("$endpoint/v2/pipeline")
                .addHeader("Authorization", "Bearer $authToken")
                .post(payload.toString().toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val errorBody = response.body?.string() ?: "HTTP ${response.code}"
                    return@withContext Result.failure(Exception("Turso Connection Failed: $errorBody"))
                }
                Result.success("Connected to Turso SQLite Cloud successfully")
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Execute parameterized SQL statement on Turso
     */
    suspend fun execute(sql: String, args: List<Any?> = emptyList()): Result<TursoResult> = withContext(Dispatchers.IO) {
        try {
            val endpoint = normalizeEndpoint()
            val jsonArgs = JSONArray()
            for (arg in args) {
                val argObj = JSONObject()
                when (arg) {
                    null -> argObj.put("type", "null")
                    is Int, is Long, is Short -> {
                        argObj.put("type", "integer")
                        argObj.put("value", arg.toString())
                    }
                    is Float, is Double -> {
                        argObj.put("type", "float")
                        argObj.put("value", arg.toString())
                    }
                    is Boolean -> {
                        argObj.put("type", "integer")
                        argObj.put("value", if (arg) "1" else "0")
                    }
                    else -> {
                        argObj.put("type", "text")
                        argObj.put("value", arg.toString())
                    }
                }
                jsonArgs.put(argObj)
            }

            val payload = JSONObject().apply {
                put("requests", JSONArray().apply {
                    put(JSONObject().apply {
                        put("type", "execute")
                        put("stmt", JSONObject().apply {
                            put("sql", sql)
                            put("args", jsonArgs)
                        })
                    })
                    put(JSONObject().put("type", "close"))
                })
            }

            val request = Request.Builder()
                .url("$endpoint/v2/pipeline")
                .addHeader("Authorization", "Bearer $authToken")
                .post(payload.toString().toRequestBody(jsonMediaType))
                .build()

            client.newCall(request).execute().use { response ->
                val bodyStr = response.body?.string() ?: ""
                if (!response.isSuccessful) {
                    return@withContext Result.failure(Exception("Turso SQL Error (${response.code}): $bodyStr"))
                }

                val jsonResponse = JSONObject(bodyStr)
                val resultsArr = jsonResponse.optJSONArray("results")
                val firstResult = resultsArr?.optJSONObject(0)?.optJSONObject("response")?.optJSONObject("result")

                val rows = mutableListOf<Map<String, Any?>>()
                val cols = mutableListOf<String>()

                if (firstResult != null) {
                    val colsArr = firstResult.optJSONArray("cols")
                    if (colsArr != null) {
                        for (i in 0 until colsArr.length()) {
                            cols.add(colsArr.getJSONObject(i).optString("name", "col_$i"))
                        }
                    }

                    val rowsArr = firstResult.optJSONArray("rows")
                    if (rowsArr != null) {
                        for (r in 0 until rowsArr.length()) {
                            val rowArr = rowsArr.getJSONArray(r)
                            val rowMap = mutableMapOf<String, Any?>()
                            for (c in 0 until rowArr.length()) {
                                val colName = if (c < cols.size) cols[c] else "col_$c"
                                val cellObj = rowArr.optJSONObject(c)
                                rowMap[colName] = cellObj?.opt("value")
                            }
                            rows.add(rowMap)
                        }
                    }
                }

                Result.success(
                    TursoResult(
                        rows = rows,
                        rowsAffected = firstResult?.optInt("affected_row_count") ?: 0,
                        columns = cols
                    )
                )
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Create all memory schema tables
     */
    suspend fun initializeSchema(): Result<Unit> = withContext(Dispatchers.IO) {
        val tables = listOf(
            """
            CREATE TABLE IF NOT EXISTS project_summaries (
                id TEXT PRIMARY KEY,
                project_name TEXT NOT NULL,
                overview TEXT NOT NULL,
                modules_json TEXT NOT NULL,
                tech_stack_json TEXT NOT NULL,
                key_highlights_json TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                sync_status TEXT DEFAULT 'synced'
            );
            """.trimIndent(),
            """
            CREATE TABLE IF NOT EXISTS file_index (
                id TEXT PRIMARY KEY,
                file_path TEXT UNIQUE NOT NULL,
                file_name TEXT NOT NULL,
                category TEXT NOT NULL,
                module TEXT,
                language TEXT NOT NULL,
                summary TEXT NOT NULL,
                symbols_json TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                checksum TEXT,
                last_modified TEXT NOT NULL,
                sync_status TEXT DEFAULT 'synced'
            );
            """.trimIndent(),
            """
            CREATE TABLE IF NOT EXISTS build_logs (
                id TEXT PRIMARY KEY,
                build_type TEXT NOT NULL,
                status TEXT NOT NULL,
                error_summary TEXT,
                diagnostics_json TEXT NOT NULL,
                terminal_output_preview TEXT NOT NULL,
                recommended_fix TEXT,
                timestamp TEXT NOT NULL,
                sync_status TEXT DEFAULT 'synced'
            );
            """.trimIndent(),
            """
            CREATE TABLE IF NOT EXISTS ai_knowledge (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL,
                topic TEXT NOT NULL,
                content TEXT NOT NULL,
                confidence REAL DEFAULT 0.9,
                tags_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                sync_status TEXT DEFAULT 'synced'
            );
            """.trimIndent(),
            """
            CREATE TABLE IF NOT EXISTS coding_preferences (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL,
                key_name TEXT UNIQUE NOT NULL,
                preference_value TEXT NOT NULL,
                scope TEXT DEFAULT 'global',
                updated_at TEXT NOT NULL,
                sync_status TEXT DEFAULT 'synced'
            );
            """.trimIndent()
        )

        for (sql in tables) {
            val res = execute(sql)
            if (res.isFailure) {
                return@withContext Result.failure(res.exceptionOrNull() ?: Exception("Failed to create table"))
            }
        }
        Result.success(Unit)
    }
}

data class TursoResult(
    val rows: List<Map<String, Any?>>,
    val rowsAffected: Int,
    val columns: List<String>
)
