package com.umakraft.coder.memory.turso

import android.content.Context
import androidx.room.*

/**
 * Turso SQLite Memory Entity Definitions & Room Database
 */

@Entity(tableName = "project_summaries")
data class ProjectSummaryEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "project_name") val projectName: String,
    val overview: String,
    @ColumnInfo(name = "modules_json") val modulesJson: String,
    @ColumnInfo(name = "tech_stack_json") val techStackJson: String,
    @ColumnInfo(name = "key_highlights_json") val keyHighlightsJson: String,
    @ColumnInfo(name = "updated_at") val updatedAt: String,
    @ColumnInfo(name = "sync_status") val syncStatus: String
)

@Entity(tableName = "file_index")
data class FileIndexEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "file_path") val filePath: String,
    @ColumnInfo(name = "file_name") val fileName: String,
    val category: String,
    val module: String?,
    val language: String,
    val summary: String,
    @ColumnInfo(name = "symbols_json") val symbolsJson: String,
    @ColumnInfo(name = "token_count") val tokenCount: Int,
    val checksum: String,
    @ColumnInfo(name = "last_modified") val lastModified: String,
    @ColumnInfo(name = "sync_status") val syncStatus: String
)

@Entity(tableName = "build_logs")
data class BuildLogEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "build_type") val buildType: String,
    val status: String,
    @ColumnInfo(name = "error_summary") val errorSummary: String?,
    @ColumnInfo(name = "diagnostics_json") val diagnosticsJson: String,
    @ColumnInfo(name = "terminal_output_preview") val terminalOutputPreview: String,
    @ColumnInfo(name = "recommended_fix") val recommendedFix: String?,
    val timestamp: String,
    @ColumnInfo(name = "sync_status") val syncStatus: String
)

@Entity(tableName = "ai_knowledge")
data class AiKnowledgeEntity(
    @PrimaryKey val id: String,
    val category: String,
    val topic: String,
    val content: String,
    val confidence: Float,
    @ColumnInfo(name = "tags_json") val tagsJson: String,
    @ColumnInfo(name = "created_at") val createdAt: String,
    @ColumnInfo(name = "updated_at") val updatedAt: String,
    @ColumnInfo(name = "sync_status") val syncStatus: String
)

@Entity(tableName = "coding_preferences")
data class CodingPreferenceEntity(
    @PrimaryKey val id: String,
    val category: String,
    @ColumnInfo(name = "key_name") val keyName: String,
    @ColumnInfo(name = "preference_value") val preferenceValue: String,
    val scope: String,
    @ColumnInfo(name = "updated_at") val updatedAt: String,
    @ColumnInfo(name = "sync_status") val syncStatus: String
)

@Dao
interface MemoryDao {
    @Query("SELECT * FROM ai_knowledge ORDER BY created_at DESC")
    suspend fun getAllKnowledge(): List<AiKnowledgeEntity>

    @Query("SELECT * FROM ai_knowledge WHERE sync_status != 'synced'")
    suspend fun getPendingKnowledge(): List<AiKnowledgeEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertKnowledge(item: AiKnowledgeEntity)

    @Query("UPDATE ai_knowledge SET sync_status = :status WHERE id = :id")
    suspend fun updateKnowledgeStatus(id: String, status: String)

    @Query("SELECT * FROM coding_preferences ORDER BY updated_at DESC")
    suspend fun getAllPreferences(): List<CodingPreferenceEntity>

    @Query("SELECT * FROM coding_preferences WHERE sync_status != 'synced'")
    suspend fun getPendingPreferences(): List<CodingPreferenceEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPreference(item: CodingPreferenceEntity)

    @Query("UPDATE coding_preferences SET sync_status = :status WHERE id = :id")
    suspend fun updatePreferenceStatus(id: String, status: String)

    @Query("SELECT * FROM file_index ORDER BY file_path ASC")
    suspend fun getAllFileIndex(): List<FileIndexEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFileIndex(item: FileIndexEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBuildLog(item: BuildLogEntity)
}

@Database(
    entities = [
        ProjectSummaryEntity::class,
        FileIndexEntity::class,
        BuildLogEntity::class,
        AiKnowledgeEntity::class,
        CodingPreferenceEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class TursoMemoryDatabase : RoomDatabase() {
    abstract fun memoryDao(): MemoryDao

    companion object {
        @Volatile
        private var INSTANCE: TursoMemoryDatabase? = null

        fun getInstance(context: Context): TursoMemoryDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    TursoMemoryDatabase::class.java,
                    "umakraft_turso_memory.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
