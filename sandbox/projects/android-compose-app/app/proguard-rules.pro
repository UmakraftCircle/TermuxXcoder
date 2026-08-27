# UmaKraft Android Compose App ProGuard Rules
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes SourceFile,LineNumberTable

# Keep Kotlin Coroutines and Reflection Metadata
-keepclassmembers class * {
    @kotlin.jvm.JvmField *;
}

# Keep AndroidX Security Crypto components
-keep class androidx.security.crypto.** { *; }

# Compose rules
-keep class androidx.compose.material3.** { *; }
-dontwarn okio.**
-dontwarn javax.annotation.**
