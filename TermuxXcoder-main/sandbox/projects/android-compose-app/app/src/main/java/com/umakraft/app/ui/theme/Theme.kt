package com.umakraft.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

@Composable
fun TermuxXCoderTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFF4A9EFF),
            background = Color(0xFF0F1117),
            surface = Color(0xFF171A23),
        ),
        content = content,
    )
}
