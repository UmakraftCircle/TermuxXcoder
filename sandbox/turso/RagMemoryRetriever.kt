package com.umakraft.coder.memory.turso

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray

/**
 * RagMemoryRetriever - Android RAG Engine
 * Queries local SQLite memory cache & Turso cloud knowledge
 * to assemble structured context prompts for LLMs (Gemini / Qwen Coder / Groq).
 */
class RagMemoryRetriever(
    private val memoryService: MemoryService
) {
    suspend fun retrieveContextForPrompt(query: String, maxItems: Int = 5): String = withContext(Dispatchers.IO) {
        val qTokens = query.lowercase().split("\\s+".toRegex()).filter { it.length >= 2 }
        val knowledgeList = memoryService.getKnowledgeList()
        val preferencesList = memoryService.getPreferencesList()

        val matchingKnowledge = knowledgeList.map { k ->
            var score = 0
            val topicLower = k.topic.lowercase()
            val contentLower = k.content.lowercase()
            for (t in qTokens) {
                if (topicLower.contains(t)) score += 8
                if (contentLower.contains(t)) score += 4
            }
            Pair(k, (score * k.confidence).toInt())
        }.filter { it.second > 0 }
            .sortedByDescending { it.second }
            .take(maxItems)
            .map { it.first }

        val matchingPrefs = preferencesList.map { p ->
            var score = 0
            val keyLower = p.keyName.lowercase()
            val valLower = p.preferenceValue.lowercase()
            for (t in qTokens) {
                if (keyLower.contains(t)) score += 7
                if (valLower.contains(t)) score += 3
            }
            Pair(p, score)
        }.filter { it.second > 0 }
            .sortedByDescending { it.second }
            .take(3)
            .map { it.first }

        val builder = StringBuilder()
        builder.append("### 🧠 TURSO LONG-TERM MEMORY & RAG CONTEXT (Retrieved from SQLite):\n")

        if (matchingKnowledge.isNotEmpty()) {
            builder.append("\n**Architectural Rules & Verified Knowledge:**\n")
            for (k in matchingKnowledge) {
                builder.append("- [${k.category.uppercase()}] **${k.topic}**: ${k.content}\n")
            }
        }

        if (matchingPrefs.isNotEmpty()) {
            builder.append("\n**User Coding Preferences & Conventions:**\n")
            for (p in matchingPrefs) {
                builder.append("- **${p.keyName}**: ${p.preferenceValue}\n")
            }
        }

        builder.toString()
    }
}
