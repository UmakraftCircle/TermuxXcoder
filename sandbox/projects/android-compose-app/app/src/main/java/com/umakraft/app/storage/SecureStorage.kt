package com.umakraft.app.storage

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Hardened Keystore-backed storage for sensitive tokens (GitHub PAT, Turso Auth Tokens).
 * Enforces AES-256-GCM / AES-256-SIV and fails closed to prevent plaintext leaks.
 */
object SecureStorage {
    private const val TAG = "SecureStorage"
    private const val PREFS_NAME = "umakraft_secure_vault"
    private const val KEY_GITHUB_TOKEN = "github_personal_access_token"
    private const val KEY_TURSO_URL = "turso_database_url"
    private const val KEY_TURSO_AUTH_TOKEN = "turso_auth_token"

    private var cachedEncryptedPrefs: SharedPreferences? = null

    private fun getEncryptedPrefs(context: Context): SharedPreferences? {
        if (cachedEncryptedPrefs != null) return cachedEncryptedPrefs

        return try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            val prefs = EncryptedSharedPreferences.create(
                context,
                PREFS_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
            cachedEncryptedPrefs = prefs
            prefs
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Android Keystore EncryptedSharedPreferences: ${e.message}", e)
            null
        }
    }

    fun isKeystoreReady(context: Context): Boolean {
        return getEncryptedPrefs(context) != null
    }

    fun saveGitHubToken(context: Context, token: String): Boolean {
        val prefs = getEncryptedPrefs(context) ?: return false
        return try {
            prefs.edit().putString(KEY_GITHUB_TOKEN, token.trim()).commit()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to securely save GitHub token", e)
            false
        }
    }

    fun getGitHubToken(context: Context): String {
        val prefs = getEncryptedPrefs(context) ?: return ""
        return try {
            prefs.getString(KEY_GITHUB_TOKEN, "") ?: ""
        } catch (e: Exception) {
            Log.e(TAG, "Failed to read GitHub token", e)
            ""
        }
    }

    fun clearGitHubToken(context: Context): Boolean {
        val prefs = getEncryptedPrefs(context) ?: return false
        return try {
            prefs.edit().remove(KEY_GITHUB_TOKEN).commit()
        } catch (e: Exception) {
            false
        }
    }

    fun saveTursoConfig(context: Context, url: String, token: String): Boolean {
        val prefs = getEncryptedPrefs(context) ?: return false
        return try {
            prefs.edit()
                .putString(KEY_TURSO_URL, url.trim())
                .putString(KEY_TURSO_AUTH_TOKEN, token.trim())
                .commit()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to securely save Turso config", e)
            false
        }
    }

    fun getTursoConfig(context: Context): Pair<String, String> {
        val prefs = getEncryptedPrefs(context) ?: return Pair("", "")
        return try {
            val url = prefs.getString(KEY_TURSO_URL, "") ?: ""
            val token = prefs.getString(KEY_TURSO_AUTH_TOKEN, "") ?: ""
            Pair(url, token)
        } catch (e: Exception) {
            Pair("", "")
        }
    }
}
