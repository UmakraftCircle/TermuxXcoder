# UmaKraft Production Workspace Projects

This directory contains complete starter projects across Android, Node.js, Python, and POSIX DevOps automation.

## Directory Structure

```
sandbox/projects/
├── android-compose-app/         # 1. Android Kotlin + Jetpack Compose starter app
│   ├── app/src/main/java/       #    - MainActivity.kt, Material 3 Theme, Color, Type
│   ├── app/src/main/            #    - AndroidManifest.xml
│   ├── app/build.gradle.kts     #    - Compose dependencies & build configuration
│   └── settings.gradle.kts      #    - Project resolution management
│
├── nodejs-typescript-api/       # 2. Node.js / TypeScript REST API & CLI tool
│   ├── package.json             #    - Express, Zod, CORS, tsx
│   ├── tsconfig.json            #    - ES2022 / NodeNext config
│   ├── src/index.ts             #    - REST API (CRUD, health, diagnostics)
│   └── src/cli.ts               #    - Interactive terminal CLI tool
│
├── python-automation-worker/    # 3. Python Automation & Data Worker
│   ├── main.py                  #    - CLI argument parser and mode dispatcher
│   ├── worker.py                #    - Async worker, telemetry collector, SHA-256 integrity
│   └── requirements.txt         #    - Dependency manifest
│
└── dev-tools-workspace/         # 4. Terminal / Git & Makefile automation
    ├── Makefile                 #    - Build, test, run, clean, and status targets
    └── setup.sh                 #    - POSIX toolchain checker and git setup script
```

## Quick Start via Terminal

```bash
# Run environment check and initialize git
cd sandbox/projects/dev-tools-workspace
chmod +x setup.sh && ./setup.sh

# Run Python Worker Telemetry
python3 ../python-automation-worker/main.py --mode telemetry

# Run Node.js API (or CLI)
cd ../nodejs-typescript-api && npm install && npm start
```
