package com.umakraft.app.ui

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.umakraft.app.termux.TermuxBridge

@Composable
fun TermuxBridgeTab(
    workspacePath: String
) {
    val context = LocalContext.current
    var isInstalled by remember { mutableStateOf(TermuxBridge.isTermuxInstalled(context)) }
    var customCommand by remember { mutableStateOf("pkg list-installed | grep -E 'gradle|openjdk|git'") }
    var executionStatus by remember { mutableStateOf("") }
    var isExecuting by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isInstalled) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer
                )
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(
                                if (isInstalled) Icons.Default.Terminal else Icons.Default.Warning,
                                contentDescription = null,
                                tint = if (isInstalled) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onErrorContainer
                            )
                            Text(
                                if (isInstalled) "Real Termux Engine Detected" else "Termux Not Found",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        }
                        IconButton(onClick = { isInstalled = TermuxBridge.isTermuxInstalled(context) }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Refresh Status")
                        }
                    }

                    if (isInstalled) {
                        Text(
                            "Termux (com.termux) is installed. You can dispatch real Linux commands, compile code with Java 17/Gradle, and manage git packages directly on Android.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = { TermuxBridge.openTermux(context) },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                Icon(Icons.Default.OpenInNew, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Open Termux Terminal")
                            }
                        }
                    } else {
                        Text(
                            "To run real bash commands and build APKs locally on your phone:\n1. Install Termux from F-Droid or GitHub\n2. Open Termux and configure ~/.termux/termux.properties\n3. Add: allow-external-apps = true",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
            }
        }

        if (isInstalled) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("🚀 Quick One-Tap Real Toolchains", fontWeight = FontWeight.Bold, fontSize = 15.sp)

                        Button(
                            onClick = {
                                isExecuting = true
                                executionStatus = "Dispatched: pkg update && pkg install openjdk-17 gradle git..."
                                val ok = TermuxBridge.installDevToolchain(context)
                                if (ok) {
                                    Toast.makeText(context, "Command sent to Termux!", Toast.LENGTH_SHORT).show()
                                } else {
                                    executionStatus = "Failed to dispatch intent. Check allow-external-apps=true in Termux."
                                }
                                isExecuting = false
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.Build, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Install OpenJDK 17 + Gradle in Termux")
                        }

                        Button(
                            onClick = {
                                isExecuting = true
                                executionStatus = "Dispatched: Real Gradle build in $workspacePath"
                                val ok = TermuxBridge.buildApkInTermux(context, workspacePath)
                                if (ok) {
                                    Toast.makeText(context, "Build started in Termux!", Toast.LENGTH_SHORT).show()
                                } else {
                                    executionStatus = "Failed to dispatch build intent."
                                }
                                isExecuting = false
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2EA043)),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Build Real Android APK (Gradle assembleDebug)")
                        }
                    }
                }
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("💻 Dispatch Custom Bash Command", fontWeight = FontWeight.Bold, fontSize = 15.sp)

                        OutlinedTextField(
                            value = customCommand,
                            onValueChange = { customCommand = it },
                            label = { Text("Bash Command / Pipeline") },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp),
                            textStyle = androidx.compose.ui.text.TextStyle(
                                fontFamily = FontFamily.Monospace,
                                fontSize = 13.sp
                            )
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    isExecuting = true
                                    executionStatus = "Executing in Termux (Interactive Session): $customCommand"
                                    val ok = TermuxBridge.runBashScript(
                                        context = context,
                                        script = customCommand,
                                        inBackground = false
                                    )
                                    if (!ok) executionStatus = "Failed to send command."
                                    isExecuting = false
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Run in Termux UI")
                            }

                            OutlinedButton(
                                onClick = {
                                    isExecuting = true
                                    executionStatus = "Executing in Termux Background Service: $customCommand"
                                    val ok = TermuxBridge.runBashScript(
                                        context = context,
                                        script = customCommand,
                                        inBackground = true
                                    )
                                    if (!ok) executionStatus = "Failed to send background command."
                                    isExecuting = false
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Run Silent")
                            }
                        }

                        if (executionStatus.isNotEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color.Black.copy(alpha = 0.5f))
                                    .padding(10.dp)
                            ) {
                                Text(
                                    executionStatus,
                                    fontSize = 12.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = Color(0xFF58A6FF)
                                )
                            }
                        }
                    }
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("⚙️ Setup Guide for allow-external-apps", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(
                        "In Termux, Android requires external apps permission to send commands via RUN_COMMAND. Run this once inside Termux:\n\n" +
                        "mkdir -p ~/.termux\n" +
                        "echo 'allow-external-apps = true' >> ~/.termux/termux.properties\n" +
                        "termux-reload-settings",
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
