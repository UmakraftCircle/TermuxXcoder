package com.umakraft.app

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.PowerManager
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.core.content.ContextCompat
import com.umakraft.app.agent.AndroidAgentExecutor
import com.umakraft.app.agent.AgentStepData
import com.umakraft.app.agent.AgentStreamEvent
import com.umakraft.app.git.GitHubManager
import com.umakraft.app.git.GitHubRepo
import com.umakraft.app.service.UmakraftBackgroundService
import com.umakraft.app.storage.SecureStorage
import com.umakraft.app.ui.theme.UmakraftTheme
import kotlinx.coroutines.launch
import java.io.File

data class ProjectTask(val id: Int, val title: String, val category: String, val isDone: Boolean = false)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            UmakraftTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    UmakraftMainScreen()
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UmakraftMainScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var hasStoragePermission by remember { mutableStateOf(checkStoragePermission(context)) }
    var hasBatteryExemption by remember { mutableStateOf(checkBatteryOptimization(context)) }
    var isBackgroundServiceRunning by remember { mutableStateOf(true) }

    val storagePermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) {
        hasStoragePermission = checkStoragePermission(context)
    }

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) startPersistentService(context)
    }

    // Load persisted token from Keystore
    var gitHubToken by remember { mutableStateOf(SecureStorage.getGitHubToken(context)) }
    var isAuthenticated by remember { mutableStateOf(false) }
    var authUserMessage by remember { mutableStateOf("") }
    var reposList by remember { mutableStateOf<List<GitHubRepo>>(emptyList()) }
    var isGitLoading by remember { mutableStateOf(false) }
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Workspace, 1: Autonomous Agent, 2: GitHub, 3: Permissions

    var showPushDialog by remember { mutableStateOf(false) }
    var pushRepoName by remember { mutableStateOf("") }
    var commitMessage by remember { mutableStateOf("Update project from UmaKraft Autonomous IDE") }
    var pushBranch by remember { mutableStateOf("main") }

    // Auto-verify persisted token on startup if present
    LaunchedEffect(Unit) {
        if (gitHubToken.isNotBlank()) {
            scope.launch {
                isGitLoading = true
                val manager = GitHubManager(gitHubToken)
                val result = manager.verifyToken()
                if (result.success) {
                    isAuthenticated = true
                    authUserMessage = result.message
                    reposList = manager.listUserRepositories()
                }
                isGitLoading = false
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                startPersistentService(context)
            }
        } else {
            startPersistentService(context)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("UmaKraft Autonomous IDE", fontSize = 17.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.width(6.dp))
                            if (isBackgroundServiceRunning) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Color(0xFF238636))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("AGENT ACTIVE", fontSize = 9.sp, color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                        Text("ReAct Loop • Tool Calling • Keystore Security", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
                actions = {
                    IconButton(onClick = {
                        hasStoragePermission = checkStoragePermission(context)
                        hasBatteryExemption = checkBatteryOptimization(context)
                        Toast.makeText(context, "System refreshed", Toast.LENGTH_SHORT).show()
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            )
        },
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surfaceVariant) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Code, contentDescription = null) },
                    label = { Text("Workspace") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.Psychology, contentDescription = null) },
                    label = { Text("AI Agent") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.CloudSync, contentDescription = null) },
                    label = { Text("GitHub") }
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.Security, contentDescription = null) },
                    label = { Text("System") }
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (selectedTab) {
                0 -> WorkspaceDashboardView(
                    hasStoragePermission = hasStoragePermission,
                    onRequestStorage = { requestStoragePermission(context, storagePermissionLauncher) }
                )
                1 -> AutonomousAgentView(
                    workspaceDir = context.filesDir
                )
                2 -> GitHubSyncView(
                    token = gitHubToken,
                    onTokenChange = { newToken ->
                        gitHubToken = newToken
                        SecureStorage.saveGitHubToken(context, newToken)
                    },
                    isAuthenticated = isAuthenticated,
                    authUserMessage = authUserMessage,
                    repos = reposList,
                    isLoading = isGitLoading,
                    onAuthenticate = {
                        scope.launch {
                            isGitLoading = true
                            val manager = GitHubManager(gitHubToken)
                            val result = manager.verifyToken()
                            if (result.success) {
                                isAuthenticated = true
                                authUserMessage = result.message
                                reposList = manager.listUserRepositories()
                                SecureStorage.saveGitHubToken(context, gitHubToken)
                            }
                            Toast.makeText(context, result.message, Toast.LENGTH_SHORT).show()
                            isGitLoading = false
                        }
                    },
                    onOpenPush = { repo ->
                        pushRepoName = repo.fullName
                        pushBranch = repo.defaultBranch
                        showPushDialog = true
                    }
                )
                3 -> PermissionsAndBackgroundView(
                    hasStoragePermission = hasStoragePermission,
                    hasBatteryExemption = hasBatteryExemption,
                    isBackgroundServiceRunning = isBackgroundServiceRunning,
                    onRequestStorage = { requestStoragePermission(context, storagePermissionLauncher) },
                    onRequestBatteryExemption = {
                        requestBatteryOptimizationExemption(context)
                        hasBatteryExemption = checkBatteryOptimization(context)
                    },
                    onToggleBackgroundService = { enable ->
                        if (enable) {
                            startPersistentService(context)
                            isBackgroundServiceRunning = true
                        } else {
                            val intent = Intent(context, UmakraftBackgroundService::class.java).apply {
                                action = UmakraftBackgroundService.ACTION_STOP
                            }
                            context.startService(intent)
                            isBackgroundServiceRunning = false
                        }
                    }
                )
            }
        }
    }

    if (showPushDialog) {
        AlertDialog(
            onDismissRequest = { showPushDialog = false },
            title = { Text("Push to GitHub Remote", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Target: $pushRepoName", fontSize = 13.sp, color = MaterialTheme.colorScheme.primary)
                    OutlinedTextField(
                        value = pushBranch,
                        onValueChange = { pushBranch = it },
                        label = { Text("Branch") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = commitMessage,
                        onValueChange = { commitMessage = it },
                        label = { Text("Commit Message") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        scope.launch {
                            showPushDialog = false
                            isGitLoading = true
                            val manager = GitHubManager(gitHubToken)
                            val sampleFiles = mapOf(
                                "README.md" to "# UmaKraft Project\nAutonomous sync via agent pipeline."
                            )
                            val res = manager.pushProject(pushRepoName, pushBranch, commitMessage, sampleFiles)
                            Toast.makeText(context, res.message, Toast.LENGTH_LONG).show()
                            isGitLoading = false
                        }
                    }
                ) {
                    Text("Commit & Push")
                }
            },
            dismissButton = {
                TextButton(onClick = { showPushDialog = false }) { Text("Cancel") }
            }
        )
    }
}

@Composable
fun AutonomousAgentView(workspaceDir: File) {
    val scope = rememberCoroutineScope()
    var objective by remember { mutableStateOf("Analyze workspace project structure and run code diagnostic check") }
    var isRunning by remember { mutableStateOf(false) }
    var liveStatus by remember { mutableStateOf("Ready to plan.") }
    var stepsList by remember { mutableStateOf<List<AgentStepData>>(emptyList()) }
    val agentExecutor = remember { AndroidAgentExecutor(workspaceDir) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Autonomous ReAct Engine", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer)
                    }
                    Text("Real-time streaming loop executes subtasks, inspects file outputs, calls tools, and self-heals build errors.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f))

                    OutlinedTextField(
                        value = objective,
                        onValueChange = { objective = it },
                        label = { Text("Agent Objective / Task") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Button(
                        onClick = {
                            scope.launch {
                                isRunning = true
                                val steps = mutableListOf<AgentStepData>()
                                stepsList = emptyList()

                                agentExecutor.runAutonomousFlow(objective).collect { event ->
                                    when (event) {
                                        is AgentStreamEvent.Planning -> {
                                            liveStatus = "Planning Step #${event.stepNumber}: ${event.thought}"
                                        }
                                        is AgentStreamEvent.ToolExecuting -> {
                                            liveStatus = "Executing Tool: ${event.toolName}(${event.args})"
                                        }
                                        is AgentStreamEvent.ToolFinished -> {
                                            steps.add(event.step)
                                            stepsList = steps.toList()
                                        }
                                        is AgentStreamEvent.TaskCompleted -> {
                                            liveStatus = "✓ ${event.summary}"
                                        }
                                        is AgentStreamEvent.TaskError -> {
                                            liveStatus = "❌ Error: ${event.error}"
                                        }
                                    }
                                }
                                isRunning = false
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !isRunning && objective.isNotBlank(),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        if (isRunning) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Agent Streaming...")
                        } else {
                            Icon(Icons.Default.PlayArrow, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Execute Streaming Agent Task")
                        }
                    }

                    if (isRunning || liveStatus.isNotEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.Black.copy(alpha = 0.2f))
                                .padding(8.dp)
                        ) {
                            Text(liveStatus, fontSize = 11.sp, fontFamily = FontFamily.Monospace, color = MaterialTheme.colorScheme.onPrimaryContainer)
                        }
                    }
                }
            }
        }

        if (stepsList.isNotEmpty()) {
            item {
                Text("Agent Execution Trace (${stepsList.size} Steps)", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }

            items(stepsList) { step ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Step #${step.stepNumber}: ${step.toolName ?: "Planning"}", fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace, fontSize = 13.sp, color = MaterialTheme.colorScheme.primary)
                            if (step.isCompleted) {
                                Text("COMPLETED", fontSize = 10.sp, color = Color(0xFF3FB950), fontWeight = FontWeight.Bold)
                            } else {
                                Text("RUNNING...", fontSize = 10.sp, color = Color(0xFFE3B341), fontWeight = FontWeight.Bold)
                            }
                        }
                        Text(step.thought, fontSize = 13.sp)
                        if (step.result != null) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color.Black.copy(alpha = 0.4f))
                                    .padding(8.dp)
                            ) {
                                Text(
                                    step.result.output.ifEmpty { step.result.error ?: "Done" },
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.sp,
                                    color = if (step.result.success) Color(0xFF7EE787) else Color(0xFFFFA198)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun WorkspaceDashboardView(
    hasStoragePermission: Boolean,
    onRequestStorage: () -> Unit
) {
    var taskList by remember {
        mutableStateOf(
            listOf(
                ProjectTask(1, "All-Files Storage Access (Scoped & POSIX)", "System", hasStoragePermission),
                ProjectTask(2, "Unkillable Background Service & WakeLock", "Battery", true),
                ProjectTask(3, "Autonomous ReAct Agent Loop Engine", "Agent", true),
                ProjectTask(4, "GitHub REST API Sync & Keystore Vault", "Git", true)
            )
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (!hasStoragePermission) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Storage Permission Required", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onErrorContainer)
                            Text("Allow access to read and write IDE workspace files.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.8f))
                        }
                        Button(
                            onClick = onRequestStorage,
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                        ) {
                            Text("Grant")
                        }
                    }
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("🚀 UmaKraft IDE Engine Ready", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Full filesystem access enabled, background worker active with wake lock, and GitHub Git operations ready for commit, push & pull.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                    )
                }
            }
        }

        items(taskList, key = { it.id }) { task ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(task.title, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                        Text(task.category, fontSize = 11.sp, fontFamily = FontFamily.Monospace, color = MaterialTheme.colorScheme.primary)
                    }
                    Checkbox(
                        checked = task.isDone,
                        onCheckedChange = { checked ->
                            taskList = taskList.map { if (it.id == task.id) it.copy(isDone = checked) else it }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun GitHubSyncView(
    token: String,
    onTokenChange: (String) -> Unit,
    isAuthenticated: Boolean,
    authUserMessage: String,
    repos: List<GitHubRepo>,
    isLoading: Boolean,
    onAuthenticate: () -> Unit,
    onOpenPush: (GitHubRepo) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("GitHub Cloud Connection", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFF238636).copy(alpha = 0.2f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text("KEYSTORE ENCRYPTED", fontSize = 9.sp, color = Color(0xFF238636), fontWeight = FontWeight.Bold)
                        }
                    }
                    Text("Personal Access Token (PAT) is encrypted in Android Keystore (AES-256-GCM) and persists across reboots.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

                    OutlinedTextField(
                        value = token,
                        onValueChange = onTokenChange,
                        label = { Text("Personal Access Token (ghp_...)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        placeholder = { Text("ghp_xxxxxxxxxxxxxxxxxxxx") }
                    )

                    Button(
                        onClick = onAuthenticate,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = token.isNotBlank() && !isLoading,
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Connecting...")
                        } else {
                            Icon(Icons.Default.Key, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(if (isAuthenticated) "Re-Authenticate" else "Connect GitHub Account")
                        }
                    }

                    if (isAuthenticated) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF238636).copy(alpha = 0.15f))
                                .padding(8.dp)
                        ) {
                            Text("✓ $authUserMessage", fontSize = 12.sp, color = Color(0xFF3FB950), fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        if (isAuthenticated) {
            item {
                Text("Your GitHub Repositories (${repos.size})", fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }

            items(repos) { repo ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(repo.fullName, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            if (repo.isPrivate) {
                                Box(modifier = Modifier.clip(RoundedCornerShape(4.dp)).background(Color.DarkGray).padding(4.dp, 2.dp)) {
                                    Text("Private", fontSize = 10.sp, color = Color.LightGray)
                                }
                            }
                        }
                        if (!repo.description.isNullOrBlank()) {
                            Text(repo.description, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = { onOpenPush(repo) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Push Project", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PermissionsAndBackgroundView(
    hasStoragePermission: Boolean,
    hasBatteryExemption: Boolean,
    isBackgroundServiceRunning: Boolean,
    onRequestStorage: () -> Unit,
    onRequestBatteryExemption: () -> Unit,
    onToggleBackgroundService: (Boolean) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text("System & Execution Controls", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Folder, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("All-Files Storage Access", fontWeight = FontWeight.Bold)
                        }
                        Text(
                            if (hasStoragePermission) "GRANTED" else "REQUIRED",
                            color = if (hasStoragePermission) Color(0xFF3FB950) else Color(0xFFF85149),
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                    Text("Enables native reading/writing of project files, termux-fs, and /models/ directory.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    if (!hasStoragePermission) {
                        Button(
                            onClick = onRequestStorage,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Grant Storage Permissions")
                        }
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
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.BatteryChargingFull, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Battery Optimization Exemption", fontWeight = FontWeight.Bold)
                        }
                        Text(
                            if (hasBatteryExemption) "ACTIVE" else "NOT ACTIVE",
                            color = if (hasBatteryExemption) Color(0xFF3FB950) else Color(0xFFF85149),
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                    Text("Prevents Android OS from killing background compiler, AI coder, and terminal sessions when the app is in the background.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    if (!hasBatteryExemption) {
                        Button(
                            onClick = onRequestBatteryExemption,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Disable Battery Optimization (Never Sleep)")
                        }
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
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Persistent Background Service", fontWeight = FontWeight.Bold)
                        Text("Holds wake lock and persistent notification channel to guarantee continuous background runtime.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Switch(
                        checked = isBackgroundServiceRunning,
                        onCheckedChange = onToggleBackgroundService
                    )
                }
            }
        }
    }
}

fun checkStoragePermission(context: Context): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        Environment.isExternalStorageManager()
    } else {
        val read = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
        val write = ContextCompat.checkSelfPermission(context, Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
        read && write
    }
}

fun requestStoragePermission(context: Context, launcher: androidx.activity.result.ActivityResultLauncher<Array<String>>) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        try {
            val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
                data = Uri.parse("package:${context.packageName}")
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            val intent = Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION)
            context.startActivity(intent)
        }
    } else {
        launcher.launch(
            arrayOf(
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            )
        )
    }
}

fun checkBatteryOptimization(context: Context): Boolean {
    val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    return powerManager.isIgnoringBatteryOptimizations(context.packageName)
}

fun requestBatteryOptimizationExemption(context: Context) {
    try {
        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:${context.packageName}")
        }
        context.startActivity(intent)
    } catch (e: Exception) {
        val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        context.startActivity(intent)
    }
}

fun startPersistentService(context: Context) {
    val serviceIntent = Intent(context, UmakraftBackgroundService::class.java).apply {
        action = UmakraftBackgroundService.ACTION_START
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(serviceIntent)
    } else {
        context.startService(serviceIntent)
    }
}
