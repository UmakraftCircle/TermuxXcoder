package com.umakraft.coder.memory.turso

import android.content.Context
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONArray
import java.util.UUID

/**
 * MemoryService - Android Long-Term Memory Service orchestrating:
 * 1. Project Summaries
 * 2. File Index (Metadata ONLY - NO source code stored)
 * 3. Build Logs & Diagnostics
 * 4. AI Knowledge Base
 * 5. Coding Preferences
 * 6. Offline Local Cache & Background Cloud Sync
 */
class MemoryService(
    private val context: Context,
    private val tursoClient: TursoClient,
    private val scope: CoroutineScope
) {
    private val _syncStatusFlow = MutableStateFlow(SyncStatus.IDLE)
    val syncStatusFlow: StateFlow<SyncStatus> = _syncStatusFlow.asStateFlow()

    private val localDb = TursoMemoryDatabase.getInstance(context)

    // =========================================================================
    // 1. AI Knowledge Base Management
    // =========================================================================

    suspend fun addKnowledge(
        category: String,
        topic: String,
        content: String,
        tags: List<String> = emptyList(),
        confidence: Float = 0.95f
    ): AiKnowledgeEntity {
        val entity = AiKnowledgeEntity(
            id = "k-${UUID.randomUUID()}",
            category = category,
            topic = topic,
            content = content,
            confidence = confidence,
            tagsJson = JSONArray(tags).toString(),
            createdAt = System.currentTimeMillis().toString(),
            updatedAt = System.currentTimeMillis().toString(),
            syncStatus = "pending_upload"
        )

        localDb.memoryDao().insertKnowledge(entity)
        triggerAutoSync()
        return entity
    }

    suspend fun getKnowledgeList(): List<AiKnowledgeEntity> {
        return localDb.memoryDao().getAllKnowledge()
    }

    // =========================================================================
    // 2. Coding Preferences Management
    // =========================================================================

    suspend fun setPreference(
        category: String,
        keyName: String,
        preferenceValue: String,
        scope: String = "global"
    ): CodingPreferenceEntity {
        val entity = CodingPreferenceEntity(
            id = "p-${UUID.randomUUID()}",
            category = category,
            keyName = keyName,
            preferenceValue = preferenceValue,
            scope = scope,
            updatedAt = System.currentTimeMillis().toString(),
            syncStatus = "pending_upload"
        )

        localDb.memoryDao().insertPreference(entity)
        triggerAutoSync()
        return entity
    }

    suspend fun getPreferencesList(): List<CodingPreferenceEntity> {
        return localDb.memoryDao().getAllPreferences()
    }

    // =========================================================================
    // 3. File Index Metadata Management (CRITICAL: NO SOURCE CODE STORED)
    // =========================================================================

    /**
     * Index metadata of a workspace file into Turso Memory.
     * Note: We extract token counts, symbols, and language metadata, but
     * STRICTLY DO NOT store the file content in the memory database.
     */
    suspend fun indexFileMetadata(
        filePath: String,
        fileName: String,
        category: String,
        module: String?,
        language: String,
        summary: String,
        symbols: List<String>,
        tokenCount: Int,
        checksum: String
    ): FileIndexEntity {
        val entity = FileIndexEntity(
            id = "idx-${UUID.randomUUID()}",
            filePath = filePath,
            fileName = fileName,
            category = category,
            module = module,
            language = language,
            summary = summary,
            symbolsJson = JSONArray(symbols).toString(),
            tokenCount = tokenCount,
            checksum = checksum,
            lastModified = System.currentTimeMillis().toString(),
            syncStatus = "pending_upload"
        )

        localDb.memoryDao().insertFileIndex(entity)
        return entity
    }

    // =========================================================================
    // 4. Build Logs & Error Resolutions
    // =========================================================================

    suspend fun recordBuildLog(
        buildType: String,
        status: String,
        errorSummary: String?,
        diagnostics: List<String>,
        terminalOutputPreview: String,
        recommendedFix: String?
    ): BuildLogEntity {
        val entity = BuildLogEntity(
            id = "b-${UUID.randomUUID()}",
            buildType = buildType,
            status = status,
            errorSummary = errorSummary,
            diagnosticsJson = JSONArray(diagnostics).toString(),
            terminalOutputPreview = terminalOutputPreview.take(1000),
            recommendedFix = recommendedFix,
            timestamp = System.currentTimeMillis().toString(),
            syncStatus = "pending_upload"
        )

        localDb.memoryDao().insertBuildLog(entity)
        triggerAutoSync()
        return entity
    }

    // =========================================================================
    // 5. Cloud Turso Sync & Offline Queue
    // =========================================================================

    fun triggerAutoSync() {
        scope.launch(Dispatchers.IO) {
            syncWithCloud()
        }
    }

    suspend fun syncWithCloud(): Result<SyncReport> {
        _syncStatusFlow.value = SyncStatus.SYNCING
        try {
            // Test Turso connectivity
            val connResult = tursoClient.testConnection()
            if (connResult.isFailure) {
                _syncStatusFlow.value = SyncStatus.OFFLINE
                return Result.failure(connResult.exceptionOrNull() ?: Exception("Offline"))
            }

            // Sync Knowledge
            val pendingKnowledge = localDb.memoryDao().getPendingKnowledge()
            for (k in pendingKnowledge) {
                tursoClient.execute(
                    """
                    INSERT OR REPLACE INTO ai_knowledge (id, category, topic, content, confidence, tags_json, created_at, updated_at, sync_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced')
                    """.trimIndent(),
                    listOf(k.id, k.category, k.topic, k.content, k.confidence, k.tagsJson, k.createdAt, k.updatedAt)
                )
                localDb.memoryDao().updateKnowledgeStatus(k.id, "synced")
            }

            // Sync Preferences
            val pendingPrefs = localDb.memoryDao().getPendingPreferences()
            for (p in pendingPrefs) {
                tursoClient.execute(
                    """
                    INSERT OR REPLACE INTO coding_preferences (id, category, key_name, preference_value, scope, updated_at, sync_status)
                    VALUES (?, ?, ?, ?, ?, ?, 'synced')
                    """.trimIndent(),
                    listOf(p.id, p.category, p.keyName, p.preferenceValue, p.scope, p.updatedAt)
                )
                localDb.memoryDao().updatePreferenceStatus(p.id, "synced")
            }

            _syncStatusFlow.value = SyncStatus.SYNCED
            return Result.success(SyncReport(knowledgeSynced = pendingKnowledge.size, prefsSynced = pendingPrefs.size))
        } catch (e: Exception) {
            _syncStatusFlow.value = SyncStatus.ERROR
            return Result.failure(e)
        }
    }
}

enum class SyncStatus {
    IDLE, SYNCING, SYNCED, OFFLINE, ERROR
}

data class SyncReport(
    val knowledgeSynced: Int,
    val prefsSynced: Int
)
