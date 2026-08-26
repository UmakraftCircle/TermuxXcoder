package com.umakraft.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF58A6FF),
    secondary = Color(0xFF3FB950),
    tertiary = Color(0xFFBC8CFF),
    background = Color(0xFF0D1117),
    surface = Color(0xFF161B22),
    surfaceVariant = Color(0xFF21262D),
    onPrimary = Color.Black,
    onSecondary = Color.Black,
    onBackground = Color(0xFFF0F6FC),
    onSurface = Color(0xFFF0F6FC),
    primaryContainer = Color(0xFF1F6FEB).copy(alpha = 0.2f),
    onPrimaryContainer = Color(0xFF58A6FF)
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF0969DA),
    secondary = Color(0xFF1A7F37),
    tertiary = Color(0xFF8250DF),
    background = Color(0xFFF6F8FA),
    surface = Color(0xFFFFFFFF),
    surfaceVariant = Color(0xFFEAEFF2),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFF1F2328),
    onSurface = Color(0xFF1F2328),
    primaryContainer = Color(0xFFDDF4FF),
    onPrimaryContainer = Color(0xFF0969DA)
)

@Composable
fun UmakraftTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
