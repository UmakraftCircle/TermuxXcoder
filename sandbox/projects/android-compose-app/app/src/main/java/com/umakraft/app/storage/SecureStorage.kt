package com.umakraft.app.storage

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Secure Keystore-backed storage for sensitive tokens (GitHub PAT, Turso Auth Tokens)
 */
object SecureStorage {
    private const val PREFS_NAME = "umakraft_secure_prefs"
    private const val KEY_GITHUB_TOKEN = "github_personal_access_token"
    private const val KEY_TURSO_URL = "turso_database_url"
    private const val KEY_TURSO_AUTH_TOKEN = "turso_auth_token"

    private fun getEncryptedPrefs(context: Context): SharedPreferences {
        return try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            // Fallback for devices without complete hardware keystore
            context.getSharedPreferences(PREFS_NAME + "_fallback", Context.MODE_PRIVATE)
        }
    }

    fun saveGitHubToken(context: Context, token: String) {
        getEncryptedPrefs(context).edit().putString(KEY_GITHUB_TOKEN, token.trim()).apply()
    }

    fun getGitHubToken(context: Context): String {
        return getEncryptedPrefs(context).getString(KEY_GITHUB_TOKEN, "") ?: ""
    }

    fun clearGitHubToken(context: Context) {
        getEncryptedPrefs(context).edit().remove(KEY_GITHUB_TOKEN).apply()
    }

    fun saveTursoConfig(context: Context, url: String, token: String) {
        getEncryptedPrefs(context).edit()
            .putString(KEY_TURSO_URL, url.trim())
            .putString(KEY_TURSO_AUTH_TOKEN, token.trim())
            .apply()
    }

    fun getTursoConfig(context: Context): Pair<String, String> {
        val prefs = getEncryptedPrefs(context)
        val url = prefs.getString(KEY_TURSO_URL, "") ?: ""
        val token = prefs.getString(KEY_TURSO_AUTH_TOKEN, "") ?: ""
        return Pair(url, token)
    }
}
