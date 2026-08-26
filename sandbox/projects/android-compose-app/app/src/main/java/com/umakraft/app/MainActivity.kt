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
import com.umakraft.app.storage.WorkspaceStorageManager
import com.umakraft.app.storage.WorkspaceFileInfo
import com.umakraft.app.storage.StorageSpaceInfo
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

    val storageManager = remember { WorkspaceStorageManager(context) }
    var storageInfo by remember { mutableStateOf(storageManager.getStorageSpaceInfo()) }

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
                    storageManager = storageManager,
                    hasStoragePermission = hasStoragePermission,
                    onRequestStorage = { requestStoragePermission(context, storagePermissionLauncher) }
                )
                1 -> AutonomousAgentView(
                    workspaceDir = storageManager.workspaceDir
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
    storageManager: WorkspaceStorageManager,
    hasStoragePermission: Boolean,
    onRequestStorage: () -> Unit
) {
    val context = LocalContext.current
    var subTab by remember { mutableIntStateOf(0) } // 0: Files, 1: AI Models, 2: Storage Tiers & Telemetry
    var storageInfo by remember { mutableStateOf(storageManager.getStorageSpaceInfo()) }
    var workspaceFiles by remember { mutableStateOf(storageManager.listWorkspaceFiles()) }
    var modelsList by remember { mutableStateOf(storageManager.listModels()) }

    var showNewFileDialog by remember { mutableStateOf(false) }
    var newFileName by remember { mutableStateOf("Main.kt") }
    var newFileTemplate by remember { mutableStateOf("// UmaKraft Kotlin Source\nfun main() {\n    println(\"Hello from UmaKraft IDE!\")\n}") }

    var showNewFolderDialog by remember { mutableStateOf(false) }
    var newFolderName by remember { mutableStateOf("src") }

    var viewEditFile by remember { mutableStateOf<File?>(null) }
    var editFileContent by remember { mutableStateOf("") }
    var isSavingFile by remember { mutableStateOf(false) }

    var showAddModelDialog by remember { mutableStateOf(false) }
    var newModelName by remember { mutableStateOf("qwen2.5-coder-1.5b-instruct-q4_k_m.gguf") }

    fun refreshAll() {
        storageInfo = storageManager.getStorageSpaceInfo()
        workspaceFiles = storageManager.listWorkspaceFiles()
        modelsList = storageManager.listModels()
    }

    LaunchedEffect(Unit) {
        refreshAll()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Storage Space Telemetry Banner
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Storage, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Disk & Workspace Storage", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(if (storageInfo.freeBytes > 1024 * 1024 * 1024) Color(0xFF238636).copy(alpha = 0.2f) else Color(0xFFE3B341).copy(alpha = 0.2f))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                "${storageInfo.freeGbFormatted} Free",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (storageInfo.freeBytes > 1024 * 1024 * 1024) Color(0xFF3FB950) else Color(0xFFE3B341)
                            )
                        }
                    }

                    LinearProgressIndicator(
                        progress = (storageInfo.usedPercent / 100f).coerceIn(0f, 1f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp)),
                        color = MaterialTheme.colorScheme.primary,
                        trackColor = MaterialTheme.colorScheme.surface
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            "Root: ${storageInfo.path}",
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1
                        )
                        Text(
                            "${storageInfo.usedPercent}% Used of ${storageInfo.totalGbFormatted}",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        // Sub Navigation Tabs
        item {
            TabRow(
                selectedTabIndex = subTab,
                containerColor = Color.Transparent,
                divider = {}
            ) {
                Tab(
                    selected = subTab == 0,
                    onClick = { subTab = 0; refreshAll() },
                    text = { Text("Workspace Files (${workspaceFiles.size})") },
                    icon = { Icon(Icons.Default.Folder, contentDescription = null, modifier = Modifier.size(18.dp)) }
                )
                Tab(
                    selected = subTab == 1,
                    onClick = { subTab = 1; refreshAll() },
                    text = { Text("AI Models (${modelsList.size})") },
                    icon = { Icon(Icons.Default.Memory, contentDescription = null, modifier = Modifier.size(18.dp)) }
                )
                Tab(
                    selected = subTab == 2,
                    onClick = { subTab = 2; refreshAll() },
                    text = { Text("Storage Tier") },
                    icon = { Icon(Icons.Default.Tune, contentDescription = null, modifier = Modifier.size(18.dp)) }
                )
            }
        }

        when (subTab) {
            0 -> {
                // Workspace Files Action Bar
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { showNewFileDialog = true },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("New File", fontSize = 12.sp)
                        }
                        OutlinedButton(
                            onClick = { showNewFolderDialog = true },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.CreateNewFolder, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("New Folder", fontSize = 12.sp)
                        }
                    }
                }

                if (workspaceFiles.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Default.FolderOpen, contentDescription = null, modifier = Modifier.size(36.dp), tint = MaterialTheme.colorScheme.primary)
                                Text("Workspace is empty", fontWeight = FontWeight.Medium)
                                Text("Create source files or run the AI Agent to build projects.", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                } else {
                    items(workspaceFiles) { fileInfo ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    val file = File(fileInfo.path)
                                    if (!fileInfo.isDirectory) {
                                        viewEditFile = file
                                        editFileContent = storageManager.readFileContent(file)
                                    }
                                },
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    modifier = Modifier.weight(1f),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        if (fileInfo.isDirectory) Icons.Default.Folder else Icons.Default.Description,
                                        contentDescription = null,
                                        tint = if (fileInfo.isDirectory) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(fileInfo.name, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                        Text(
                                            if (fileInfo.isDirectory) "Directory • ${fileInfo.formattedSize}" else fileInfo.formattedSize,
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                IconButton(
                                    onClick = {
                                        val file = File(fileInfo.path)
                                        storageManager.deleteItem(file)
                                        refreshAll()
                                        Toast.makeText(context, "Deleted ${fileInfo.name}", Toast.LENGTH_SHORT).show()
                                    }
                                ) {
                                    Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
            }

            1 -> {
                // AI Models Storage Hub
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Psychology, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Offline AI Model Storage Directory", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer)
                            }
                            Text(
                                "Place `.gguf`, `.bin`, or `.onnx` models inside this folder for on-device inference.",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                            )
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(Color.Black.copy(alpha = 0.15f))
                                    .padding(8.dp)
                            ) {
                                Text(
                                    storageManager.modelsDir.absolutePath,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                            Button(
                                onClick = { showAddModelDialog = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Register / Initialize Model File")
                            }
                        }
                    }
                }

                if (modelsList.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(20.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text("No AI model weights found in models/", fontWeight = FontWeight.Medium)
                                Text("Download or move GGUF models into ${storageManager.modelsDir.name}/", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                } else {
                    items(modelsList) { model ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    modifier = Modifier.weight(1f),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.Memory, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(model.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        Text(model.formattedSize, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                                IconButton(
                                    onClick = {
                                        val file = File(model.path)
                                        storageManager.deleteItem(file)
                                        refreshAll()
                                        Toast.makeText(context, "Deleted ${model.name}", Toast.LENGTH_SHORT).show()
                                    }
                                ) {
                                    Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                }
            }

            2 -> {
                // Storage Tiers & Benchmark
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text("Active Storage Location Tier", fontWeight = FontWeight.Bold)

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (storageManager.currentLocationType == WorkspaceStorageManager.StorageLocationType.APP_INTERNAL) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface)
                                    .clickable {
                                        storageManager.setLocationType(WorkspaceStorageManager.StorageLocationType.APP_INTERNAL)
                                        refreshAll()
                                    }
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("1. App Internal Sandbox", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                    Text("Isolated storage, zero permissions required.", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                if (storageManager.currentLocationType == WorkspaceStorageManager.StorageLocationType.APP_INTERNAL) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                }
                            }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (storageManager.currentLocationType == WorkspaceStorageManager.StorageLocationType.APP_EXTERNAL_SCOPED) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface)
                                    .clickable {
                                        storageManager.setLocationType(WorkspaceStorageManager.StorageLocationType.APP_EXTERNAL_SCOPED)
                                        refreshAll()
                                    }
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("2. External App Storage (High Capacity)", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                    Text("/Android/data/... (Gigabyte-ready, no permissions required)", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                if (storageManager.currentLocationType == WorkspaceStorageManager.StorageLocationType.APP_EXTERNAL_SCOPED) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                }
                            }

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (storageManager.currentLocationType == WorkspaceStorageManager.StorageLocationType.SHARED_EXTERNAL) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface)
                                    .clickable {
                                        if (hasStoragePermission) {
                                            storageManager.setLocationType(WorkspaceStorageManager.StorageLocationType.SHARED_EXTERNAL)
                                            refreshAll()
                                        } else {
                                            onRequestStorage()
                                        }
                                    }
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("3. Global Shared Storage (/sdcard/UmaKraft/)", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                    Text("Cross-app & Termux accessibility (Requires all-files access)", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                if (storageManager.currentLocationType == WorkspaceStorageManager.StorageLocationType.SHARED_EXTERNAL) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                }
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            Button(
                                onClick = {
                                    val (success, msg) = storageManager.testStorageWriteRead()
                                    Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                                },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(Icons.Default.Speed, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Run Storage Read/Write Test")
                            }
                        }
                    }
                }
            }
        }
    }

    // New File Dialog
    if (showNewFileDialog) {
        AlertDialog(
            onDismissRequest = { showNewFileDialog = false },
            title = { Text("Create New Workspace File", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = newFileName,
                        onValueChange = { newFileName = it },
                        label = { Text("File Name (e.g. Script.py, Main.kt)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = newFileTemplate,
                        onValueChange = { newFileTemplate = it },
                        label = { Text("Initial Content") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newFileName.isNotBlank()) {
                            storageManager.createFile(newFileName.trim(), newFileTemplate)
                            refreshAll()
                            showNewFileDialog = false
                            Toast.makeText(context, "Created $newFileName", Toast.LENGTH_SHORT).show()
                        }
                    }
                ) {
                    Text("Create")
                }
            },
            dismissButton = {
                TextButton(onClick = { showNewFileDialog = false }) { Text("Cancel") }
            }
        )
    }

    // New Folder Dialog
    if (showNewFolderDialog) {
        AlertDialog(
            onDismissRequest = { showNewFolderDialog = false },
            title = { Text("Create New Directory", fontWeight = FontWeight.Bold) },
            text = {
                OutlinedTextField(
                    value = newFolderName,
                    onValueChange = { newFolderName = it },
                    label = { Text("Folder Name") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newFolderName.isNotBlank()) {
                            storageManager.createDirectory(newFolderName.trim())
                            refreshAll()
                            showNewFolderDialog = false
                            Toast.makeText(context, "Created folder $newFolderName", Toast.LENGTH_SHORT).show()
                        }
                    }
                ) {
                    Text("Create")
                }
            },
            dismissButton = {
                TextButton(onClick = { showNewFolderDialog = false }) { Text("Cancel") }
            }
        )
    }

    // Add Model Dialog
    if (showAddModelDialog) {
        AlertDialog(
            onDismissRequest = { showAddModelDialog = false },
            title = { Text("Add / Register AI Model", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Enter model file name to create entry in models/ folder:", fontSize = 12.sp)
                    OutlinedTextField(
                        value = newModelName,
                        onValueChange = { newModelName = it },
                        label = { Text("Model File Name (.gguf / .onnx)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newModelName.isNotBlank()) {
                            val modelFile = File(storageManager.modelsDir, newModelName.trim())
                            modelFile.writeText("# UmaKraft AI Model Manifest: ${newModelName.trim()}\nDownloaded: true\n")
                            refreshAll()
                            showAddModelDialog = false
                            Toast.makeText(context, "Registered model: $newModelName", Toast.LENGTH_SHORT).show()
                        }
                    }
                ) {
                    Text("Register Model")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddModelDialog = false }) { Text("Cancel") }
            }
        )
    }

    // View / Edit File Dialog
    if (viewEditFile != null) {
        AlertDialog(
            onDismissRequest = { viewEditFile = null },
            title = { Text("Editing: ${viewEditFile?.name}", fontWeight = FontWeight.Bold, fontSize = 15.sp) },
            text = {
                OutlinedTextField(
                    value = editFileContent,
                    onValueChange = { editFileContent = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(280.dp),
                    textStyle = LocalTextStyle.current.copy(fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewEditFile?.let { file ->
                            file.writeText(editFileContent)
                            refreshAll()
                            Toast.makeText(context, "Saved ${file.name}", Toast.LENGTH_SHORT).show()
                        }
                        viewEditFile = null
                    }
                ) {
                    Text("Save Changes")
                }
            },
            dismissButton = {
                TextButton(onClick = { viewEditFile = null }) { Text("Close") }
            }
        )
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
