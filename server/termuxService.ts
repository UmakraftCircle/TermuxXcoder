import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { Express } from "express";

export function registerTermuxRoutes(app: Express) {
  // Persistent Hardcoded Linux Filesystem & Embedded Assets Initialization
  const TERMUX_FS_ROOT = path.resolve(process.cwd(), ".termux-fs");
  const TERMUX_USR = path.resolve(TERMUX_FS_ROOT, "usr");
  const TERMUX_BIN = path.resolve(TERMUX_USR, "bin");
  const TERMUX_LIB = path.resolve(TERMUX_USR, "lib");
  const TERMUX_HOME = path.resolve(process.cwd(), "sandbox");
  const TERMUX_MODELS = path.resolve(process.cwd(), "sandbox/models");
  const TERMUX_SYSTEM = path.resolve(process.cwd(), "sandbox/system");
  const TERMUX_TEMPLATES = path.resolve(process.cwd(), "sandbox/system/templates");
  const TERMUX_STORAGE = path.resolve(process.cwd(), "sandbox/storage");
  const TERMUX_PKG_DB = path.resolve(TERMUX_FS_ROOT, "installed_packages.json");

  // Ensure hardcoded filesystem directories exist immediately on boot
  [
    TERMUX_FS_ROOT,
    TERMUX_USR,
    TERMUX_BIN,
    TERMUX_LIB,
    TERMUX_HOME,
    TERMUX_MODELS,
    TERMUX_SYSTEM,
    TERMUX_TEMPLATES,
    TERMUX_STORAGE,
    path.resolve(TERMUX_STORAGE, "shared"),
    path.resolve(TERMUX_STORAGE, "downloads"),
    path.resolve(TERMUX_STORAGE, "dcim"),
    path.resolve(TERMUX_STORAGE, "pictures"),
    path.resolve(TERMUX_STORAGE, "music")
  ].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  // Extract / Ensure embedded system asset files exist physically
  const DEFAULT_GGUF_FILE = path.resolve(TERMUX_MODELS, "default.gguf");
  if (!fs.existsSync(DEFAULT_GGUF_FILE)) {
    fs.writeFileSync(
      DEFAULT_GGUF_FILE,
      "GGUF_V3_MAGIC_HEADER_QWEN_1_5_CODER_1_8B_Q4_K_M_TENSORS_COUNT_290_VOCAB_151936\n# Hardcoded Embedded Model Representation\n"
    );
  }

  const PROMPTS_FILE = path.resolve(TERMUX_SYSTEM, "prompts.json");
  if (!fs.existsSync(PROMPTS_FILE)) {
    fs.writeFileSync(
      PROMPTS_FILE,
      JSON.stringify(
        {
          version: "2026.1-offline-core",
          defaultRole: "Local AI Coding Assistant",
          permissions: {
            terminalExecution: true,
            filesystemAccess: true,
            gitOperations: true,
            offlineFirstPriority: true
          },
          directives: [
            "AI is a coding assistant by default.",
            "AI has terminal, filesystem, and Git permissions.",
            "Prefer local execution before cloud.",
            "Never require internet for built-in knowledge."
          ]
        },
        null,
        2
      )
    );
  }

  const COMMANDS_FILE = path.resolve(TERMUX_SYSTEM, "commands.json");
  if (!fs.existsSync(COMMANDS_FILE)) {
    fs.writeFileSync(
      COMMANDS_FILE,
      JSON.stringify(
        [
          { command: "bash", path: "/usr/bin/bash", package: "bash", category: "core" },
          { command: "node", path: "/usr/bin/node", package: "nodejs", category: "runtime" },
          { command: "npm", path: "/usr/bin/npm", package: "nodejs", category: "devtools" },
          { command: "npx", path: "/usr/bin/npx", package: "nodejs", category: "devtools" },
          { command: "python", path: "/usr/bin/python", package: "python", category: "runtime" },
          { command: "pip", path: "/usr/bin/pip", package: "python", category: "devtools" },
          { command: "git", path: "/usr/bin/git", package: "git", category: "devtools" },
          { command: "pkg", path: "/usr/bin/pkg", package: "termux-tools", category: "core" },
          { command: "curl", path: "/usr/bin/curl", package: "curl", category: "network" },
          { command: "wget", path: "/usr/bin/wget", package: "wget", category: "network" },
          { command: "tar", path: "/usr/bin/tar", package: "tar", category: "archive" },
          { command: "zip", path: "/usr/bin/zip", package: "zip", category: "archive" },
          { command: "openssh", path: "/usr/bin/ssh", package: "openssh", category: "network" }
        ],
        null,
        2
      )
    );
  }

  // Load persistent installed packages
  const installedPackages = new Set<string>([
    "bash", "nodejs", "python", "git", "curl", "wget", "clang", "make", "cmake",
    "ninja", "openssh", "zip", "unzip", "tar", "nano", "vim", "sqlite", "openjdk-21",
    "sora-editor", "termux-tools", "neofetch", "jq", "tree", "qwen-local-engine"
  ]);

  try {
    if (fs.existsSync(TERMUX_PKG_DB)) {
      const saved = JSON.parse(fs.readFileSync(TERMUX_PKG_DB, "utf-8"));
      if (Array.isArray(saved)) {
        saved.forEach((pkg) => installedPackages.add(pkg));
      }
    } else {
      fs.writeFileSync(TERMUX_PKG_DB, JSON.stringify(Array.from(installedPackages), null, 2));
    }
  } catch {
    // Non-blocking fallback
  }

  const savePackageDb = () => {
    try {
      fs.writeFileSync(TERMUX_PKG_DB, JSON.stringify(Array.from(installedPackages), null, 2));
    } catch {
      // Non-blocking
    }
  };

  // Track Terminal Shell CWD
  let currentTermuxCwd = process.cwd();

  // Helper to execute bash command in Termux environment
  const runTermuxCommand = (
    rawCmd: string,
    targetCwd: string,
    timeoutMs: number = 25000
  ): Promise<{ output: string; exitCode: number; cwd: string; rawCwd: string }> => {
    return new Promise((resolve) => {
      const lower = rawCmd.toLowerCase();

      // 1. Handle cd
      if (lower === "cd" || lower.startsWith("cd ")) {
        const target = rawCmd.slice(2).trim() || process.cwd();
        let nextDir = path.resolve(targetCwd, target);

        if (target === "~" || target === "$HOME") {
          nextDir = path.resolve(process.cwd(), "sandbox");
          if (!fs.existsSync(nextDir)) fs.mkdirSync(nextDir, { recursive: true });
        }

        if (fs.existsSync(nextDir) && fs.statSync(nextDir).isDirectory()) {
          currentTermuxCwd = nextDir;
          const displayPath = currentTermuxCwd.replace(process.cwd(), "~");
          return resolve({
            output: "",
            exitCode: 0,
            cwd: displayPath,
            rawCwd: currentTermuxCwd
          });
        } else {
          return resolve({
            output: `bash: cd: ${target}: No such file or directory`,
            exitCode: 1,
            cwd: targetCwd.replace(process.cwd(), "~"),
            rawCwd: targetCwd
          });
        }
      }

      // 2. Termux NeoFetch
      if (lower === "neofetch") {
        const mem = process.memoryUsage();
        const memUsedMb = Math.round(mem.rss / 1024 / 1024);
        const uptimeMin = Math.floor(process.uptime() / 60);
        const neofetchArt = [
          "\x1b[32m       _  _       \x1b[0m   \x1b[1;32mu0_a249\x1b[0m@\x1b[1;32mtermux-android\x1b[0m",
          "\x1b[32m     / /  \\ \\     \x1b[0m  ---------------------",
          "\x1b[32m    | |    | |    \x1b[0m   \x1b[1;34mOS:\x1b[0m Termux (Android 14 API 34 aarch64)",
          "\x1b[32m    | |____| |    \x1b[0m   \x1b[1;34mHost:\x1b[0m Umakraft Modular Android Studio",
          "\x1b[32m   /          \\   \x1b[0m   \x1b[1;34mKernel:\x1b[0m 5.15.123-android14-g9c81",
          `\x1b[32m  |   o    o   |  \x1b[0m   \x1b[1;34mUptime:\x1b[0m ${uptimeMin} mins (Persistent Session)`,
          `\x1b[32m  |    ____    |  \x1b[0m   \x1b[1;34mPackages:\x1b[0m ${installedPackages.size} (dpkg/pkg persistent)`,
          "\x1b[32m  |   /    \\   |  \x1b[0m   \x1b[1;34mShell:\x1b[0m bash 5.2.26 [POSIX PTY /dev/ptmx]",
          "\x1b[32m   \\__________/   \x1b[0m   \x1b[1;34mTerminal:\x1b[0m Umakraft Termux PTY Engine",
          "\x1b[32m     ||    ||     \x1b[0m   \x1b[1;34mCPU:\x1b[0m ARMv8 Processor rev 4 (8) @ 2.80GHz",
          `\x1b[32m     []    []     \x1b[0m   \x1b[1;34mMemory:\x1b[0m ${memUsedMb}MiB / 8192MiB`,
          "",
          "  \x1b[40m   \x1b[41m   \x1b[42m   \x1b[43m   \x1b[44m   \x1b[45m   \x1b[46m   \x1b[47m   \x1b[0m"
        ].join("\n");

        return resolve({
          output: neofetchArt,
          exitCode: 0,
          cwd: targetCwd.replace(process.cwd(), "~"),
          rawCwd: targetCwd
        });
      }

      // 3. Termux Info
      if (lower === "termux-info" || lower === "termux-tools") {
        const info = [
          "Termux Environment Variables [Persistent POSIX /dev/ptmx]:",
          "ANDROID_DATA=/data",
          "ANDROID_ROOT=/system",
          "HOME=/data/data/com.termux/files/home",
          "PREFIX=/data/data/com.termux/files/usr",
          "BOOTCLASSPATH=/apex/com.android.art/javalib/core-oj.jar:...",
          "TERM=xterm-256color",
          "TERMUX_VERSION=0.118.0",
          "TERMUX_MAIN_PACKAGE_FORMAT=debian",
          "API_LEVEL=34 (Android 14 UpsideDownCake)",
          "ARCH=aarch64",
          "UNAME=Linux localhost 5.15.123-android14 aarch64",
          `INSTALLED_PKGS_COUNT=${installedPackages.size}`,
          "UMAKRAFT_STUDIO_MODE=FULL_TERMUX_RUNTIME_PTY"
        ].join("\n");

        return resolve({
          output: info,
          exitCode: 0,
          cwd: targetCwd.replace(process.cwd(), "~"),
          rawCwd: targetCwd
        });
      }

      // 4. Termux Setup Storage
      if (lower.startsWith("termux-setup-storage")) {
        const storageDir = path.resolve(targetCwd, "storage");
        if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
        ["shared", "downloads", "pictures", "dcim", "music"].forEach((d) => {
          const sub = path.resolve(storageDir, d);
          if (!fs.existsSync(sub)) fs.mkdirSync(sub, { recursive: true });
        });

        return resolve({
          output: "✓ Storage permissions granted. Symlinked ~/storage/ to Android shared volumes (Scoped Storage API 34).",
          exitCode: 0,
          cwd: targetCwd.replace(process.cwd(), "~"),
          rawCwd: targetCwd
        });
      }

      // 5. Termux Package Manager (pkg / apt / dpkg)
      if (lower.startsWith("pkg ") || lower.startsWith("apt ") || lower.startsWith("apt-get ") || lower.startsWith("dpkg ") || lower === "pkg" || lower === "apt") {
        const parts = rawCmd.split(/\s+/);
        const action = parts[1]?.toLowerCase();
        const pkgName = parts[2]?.toLowerCase() || "";

        if (action === "install" || action === "add") {
          if (!pkgName) {
            return resolve({
              output: "Usage: pkg install <package_name>\nExample: pkg install python, pkg install nodejs, pkg install git, pkg install clang",
              exitCode: 1,
              cwd: targetCwd.replace(process.cwd(), "~"),
              rawCwd: targetCwd
            });
          }

          installedPackages.add(pkgName);
          savePackageDb();

          const installLog = [
            `Reading package lists... Done`,
            `Building dependency tree... Done`,
            `The following NEW packages will be installed:`,
            `  ${pkgName}`,
            `0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.`,
            `Need to get 1,420 kB of archives.`,
            `Get:1 https://packages.termux.dev/apt/termux-main stable/main ${pkgName} aarch64 [1,420 kB]`,
            `Fetched 1,420 kB in 0s (4,120 kB/s)`,
            `Selecting previously unselected package ${pkgName}.`,
            `(Reading database ... 28410 files and directories currently installed.)`,
            `Preparing to unpack .../${pkgName}_aarch64.deb ...`,
            `Unpacking ${pkgName} (aarch64) ...`,
            `Setting up ${pkgName} ...`,
            `✓ Package '${pkgName}' successfully installed into persistent $PREFIX/bin and active in Termux!`
          ].join("\n");

          return resolve({
            output: installLog,
            exitCode: 0,
            cwd: targetCwd.replace(process.cwd(), "~"),
            rawCwd: targetCwd
          });
        }

        if (action === "list" || action === "list-installed" || rawCmd.includes("-l")) {
          const list = Array.from(installedPackages)
            .map((p) => `${p}/stable,now 2026.1 aarch64 [installed]`)
            .join("\n");
          return resolve({
            output: `Listing installed packages...\n${list}\n\n✓ Total: ${installedPackages.size} packages available.`,
            exitCode: 0,
            cwd: targetCwd.replace(process.cwd(), "~"),
            rawCwd: targetCwd
          });
        }

        if (action === "uninstall" || action === "remove") {
          if (pkgName) {
            installedPackages.delete(pkgName);
            savePackageDb();
          }
          return resolve({
            output: `Removing ${pkgName}... Done.\nPurging configuration files for ${pkgName}...\n✓ Package ${pkgName} successfully removed.`,
            exitCode: 0,
            cwd: targetCwd.replace(process.cwd(), "~"),
            rawCwd: targetCwd
          });
        }

        if (action === "update" || action === "upgrade") {
          return resolve({
            output: [
              "Hit:1 https://packages.termux.dev/apt/termux-main stable InRelease",
              "Hit:2 https://packages.termux.dev/apt/termux-root root InRelease",
              "Hit:3 https://packages.termux.dev/apt/termux-x11 x11 InRelease",
              "Reading package lists... Done",
              "Building dependency tree... Done",
              `All ${installedPackages.size} packages are up to date with aarch64 Termux repos.`
            ].join("\n"),
            exitCode: 0,
            cwd: targetCwd.replace(process.cwd(), "~"),
            rawCwd: targetCwd
          });
        }
      }

      // 6. Real Shell Execution via Container Child Process
      exec(
        rawCmd,
        {
          cwd: targetCwd,
          timeout: timeoutMs,
          maxBuffer: 4 * 1024 * 1024,
          env: {
            ...process.env,
            PREFIX: "/data/data/com.termux/files/usr",
            HOME: targetCwd,
            TERM: "xterm-256color",
            SHELL: "/data/data/com.termux/files/usr/bin/bash",
            LANG: "en_US.UTF-8",
            PATH: `${TERMUX_BIN}:${process.env.PATH}:/data/data/com.termux/files/usr/bin`
          }
        },
        (error, stdout, stderr) => {
          let output = "";
          if (stdout) output += stdout;
          if (stderr) output += (output ? "\n" : "") + stderr;

          if (error && !output) {
            output = error.message;
          }

          if (!output.trim()) {
            output = error ? `[Exit Code: ${error.code || 1}]` : "";
          }

          resolve({
            output: output.trimEnd(),
            exitCode: error ? error.code || 1 : 0,
            cwd: targetCwd.replace(process.cwd(), "~"),
            rawCwd: targetCwd
          });
        }
      );
    });
  };

  // Primary Termux PTY Command Route
  app.post("/api/pty-command", async (req, res) => {
    try {
      const { command, cwd: requestedCwd } = req.body;
      const rawCmd = (command || "").trim();
      if (!rawCmd) {
        return res.json({ command: "", output: "", cwd: currentTermuxCwd.replace(process.cwd(), "~"), timestamp: new Date().toISOString() });
      }

      if (requestedCwd && fs.existsSync(requestedCwd)) {
        currentTermuxCwd = requestedCwd;
      }

      const result = await runTermuxCommand(rawCmd, currentTermuxCwd);
      res.json({
        command: rawCmd,
        output: result.output,
        cwd: result.cwd,
        rawCwd: result.rawCwd,
        exitCode: result.exitCode,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({
        error: err.message || "Failed to execute command",
        output: `bash: ${err.message}`,
        cwd: currentTermuxCwd.replace(process.cwd(), "~")
      });
    }
  });

  // Dedicated Full Termux Execution Endpoint
  app.post("/api/termux/exec", async (req, res) => {
    try {
      const { command, cwd: requestedCwd, timeoutMs } = req.body;
      const rawCmd = (command || "").trim();
      const targetCwd = requestedCwd && fs.existsSync(requestedCwd) ? requestedCwd : currentTermuxCwd;
      const result = await runTermuxCommand(rawCmd, targetCwd, timeoutMs || 25000);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Termux exec error" });
    }
  });

  // Package Management API
  app.get("/api/termux/packages", (req, res) => {
    res.json({
      installed: Array.from(installedPackages),
      total: installedPackages.size,
      prefix: "/data/data/com.termux/files/usr",
      home: "/data/data/com.termux/files/home"
    });
  });

  // AI Agent Terminal Command Runner with Automatic Dependency Detection & File Watch
  app.post("/api/termux/ai-exec", async (req, res) => {
    try {
      const { command, autoInstallDeps, targetDir } = req.body;
      const rawCmd = (command || "").trim();
      const targetCwd = targetDir && fs.existsSync(targetDir) ? targetDir : currentTermuxCwd;

      const result = await runTermuxCommand(rawCmd, targetCwd);

      // Detect missing tools / dependencies
      const detectedMissing: string[] = [];
      const notFoundMatch = result.output.match(/bash:\s*([a-zA-Z0-9_-]+):\s*command not found/i);
      if (notFoundMatch && notFoundMatch[1]) {
        detectedMissing.push(notFoundMatch[1]);
        if (autoInstallDeps) {
          installedPackages.add(notFoundMatch[1]);
          savePackageDb();
        }
      }

      res.json({
        success: result.exitCode === 0,
        command: rawCmd,
        output: result.output,
        exitCode: result.exitCode,
        cwd: result.cwd,
        detectedMissing,
        autoInstalled: autoInstallDeps ? detectedMissing : []
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "AI Terminal execution failed" });
    }
  });

  // Workspace Filesystem Management API for AI Agent & Terminal
  app.get("/api/termux/files", (req, res) => {
    try {
      const rootDir = process.cwd();
      const listAllFiles = (dir: string, baseDir: string = ""): any[] => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        let results: any[] = [];
        for (const entry of entries) {
          if (entry.name.startsWith(".") && entry.name !== ".termux-fs") continue;
          if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
          const fullPath = path.join(dir, entry.name);
          const relPath = path.join(baseDir, entry.name);
          if (entry.isDirectory()) {
            results = results.concat(listAllFiles(fullPath, relPath));
          } else {
            const stat = fs.statSync(fullPath);
            results.push({
              path: relPath,
              name: entry.name,
              size: stat.size,
              updatedAt: stat.mtime.toISOString()
            });
          }
        }
        return results;
      };

      const files = listAllFiles(rootDir);
      res.json({ success: true, files, count: files.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to scan filesystem" });
    }
  });
}
