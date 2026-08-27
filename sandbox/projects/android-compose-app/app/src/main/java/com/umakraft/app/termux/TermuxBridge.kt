package com.umakraft.app.termux

import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.util.Log

/**
 * TermuxBridge: Real Native Termux Integration using the official Termux RUN_COMMAND intent API.
 *
 * Requirements for Termux on device:
 * 1. Termux App (com.termux) installed from F-Droid / GitHub releases.
 * 2. In ~/.termux/termux.properties, set: allow-external-apps = true
 * 3. App requests `com.termux.permission.RUN_COMMAND` in AndroidManifest.xml.
 */
object TermuxBridge {
    private const val TAG = "TermuxBridge"
    const val TERMUX_PACKAGE_NAME = "com.termux"
    const val TERMUX_SERVICE_NAME = "com.termux.app.RunCommandService"
    const val ACTION_RUN_COMMAND = "com.termux.RUN_COMMAND"
    const val EXTRA_COMMAND_PATH = "com.termux.RUN_COMMAND_PATH"
    const val EXTRA_ARGUMENTS = "com.termux.RUN_COMMAND_ARGUMENTS"
    const val EXTRA_WORKDIR = "com.termux.RUN_COMMAND_WORKDIR"
    const val EXTRA_BACKGROUND = "com.termux.RUN_COMMAND_BACKGROUND"
    const val EXTRA_SESSION_ACTION = "com.termux.RUN_COMMAND_SESSION_ACTION"
    const val EXTRA_PENDING_INTENT = "com.termux.RUN_COMMAND_PENDING_INTENT"

    // Termux internal paths
    const val TERMUX_PREFIX = "/data/data/com.termux/files/usr"
    const val TERMUX_HOME = "/data/data/com.termux/files/home"
    const val TERMUX_BIN_BASH = "/data/data/com.termux/files/usr/bin/bash"
    const val TERMUX_BIN_SH = "/data/data/com.termux/files/usr/bin/sh"

    /**
     * Checks if Termux is installed on the Android device.
     */
    fun isTermuxInstalled(context: Context): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageInfo(
                    TERMUX_PACKAGE_NAME,
                    PackageManager.PackageInfoFlags.of(0)
                )
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(TERMUX_PACKAGE_NAME, 0)
            }
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }

    /**
     * Launches Termux UI directly.
     */
    fun openTermux(context: Context): Boolean {
        return try {
            val intent = context.packageManager.getLaunchIntentForPackage(TERMUX_PACKAGE_NAME)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open Termux", e)
            false
        }
    }

    /**
     * Executes a real command inside Termux using RUN_COMMAND.
     *
     * @param executable Full path to the executable (e.g. /data/data/com.termux/files/usr/bin/bash)
     * @param args Array of command arguments (e.g. arrayOf("-c", "pkg install -y openjdk-17 && gradle --version"))
     * @param workDir Working directory in Termux (defaults to home: /data/data/com.termux/files/home)
     * @param inBackground True to execute silently in background, False to open in a Termux terminal session tab.
     */
    fun executeCommand(
        context: Context,
        executable: String = TERMUX_BIN_BASH,
        args: Array<String>,
        workDir: String = TERMUX_HOME,
        inBackground: Boolean = false,
        resultReceiverIntent: PendingIntent? = null
    ): Boolean {
        if (!isTermuxInstalled(context)) {
            Log.w(TAG, "Termux is not installed.")
            return false
        }

        return try {
            val intent = Intent()
            intent.setClassName(TERMUX_PACKAGE_NAME, TERMUX_SERVICE_NAME)
            intent.action = ACTION_RUN_COMMAND
            intent.putExtra(EXTRA_COMMAND_PATH, executable)
            intent.putExtra(EXTRA_ARGUMENTS, args)
            intent.putExtra(EXTRA_WORKDIR, workDir)
            intent.putExtra(EXTRA_BACKGROUND, inBackground)
            // 0: default, 1: failsafe, 2: open new session, 3: fail if session exists
            intent.putExtra(EXTRA_SESSION_ACTION, "0")

            if (resultReceiverIntent != null) {
                intent.putExtra(EXTRA_PENDING_INTENT, resultReceiverIntent)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send RUN_COMMAND intent to Termux", e)
            false
        }
    }

    /**
     * Runs a bash script or one-liner directly inside Termux.
     */
    fun runBashScript(
        context: Context,
        script: String,
        workDir: String = TERMUX_HOME,
        inBackground: Boolean = false,
        resultReceiverIntent: PendingIntent? = null
    ): Boolean {
        return executeCommand(
            context = context,
            executable = TERMUX_BIN_BASH,
            args = arrayOf("-c", script),
            workDir = workDir,
            inBackground = inBackground,
            resultReceiverIntent = resultReceiverIntent
        )
    }

    /**
     * Helper to install developer toolchains into Termux:
     * - OpenJDK 17
     * - Gradle
     * - Git
     * - Python & Node.js
     */
    fun installDevToolchain(context: Context): Boolean {
        val setupScript = """
            echo "⚡ [TermuxXCoder] Updating packages and installing real dev toolchains..."
            pkg update -y && pkg install -y git openjdk-17 gradle python nodejs clang make
            echo "✅ [TermuxXCoder] Toolchain ready: Java $(java -version 2>&1 | head -n 1)"
        """.trimIndent()

        return runBashScript(context, setupScript, inBackground = false)
    }

    /**
     * Builds the real Android APK using Gradle inside Termux.
     */
    fun buildApkInTermux(context: Context, projectPath: String): Boolean {
        val buildScript = """
            cd "$projectPath" || exit 1
            echo "🚀 [TermuxXCoder] Starting real Gradle build inside Termux..."
            export JAVA_HOME="/data/data/com.termux/files/usr/lib/jvm/java-17-openjdk"
            if [ -f "./gradlew" ]; then
                chmod +x ./gradlew
                ./gradlew assembleDebug --stacktrace
            else
                gradle assembleDebug --stacktrace
            fi
            echo "📦 Build finished! Check app/build/outputs/apk/debug/"
        """.trimIndent()

        return runBashScript(context, buildScript, inBackground = false)
    }
}
