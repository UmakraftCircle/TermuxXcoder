# UmaKraft POSIX Makefile
# Unified project automation runner for Android, Node.js, and Python

.PHONY: all help init test run-node run-python status clean

all: help

help:
	@echo "\033[36m====================================================\033[0m"
	@echo "\033[1;32m  ⚡ UMAKRAFT UNIFIED POSIX WORKSPACE AUTOMATION    \033[0m"
	@echo "\033[36m====================================================\033[0m"
	@echo "Available Targets:"
	@echo "  make init         - Check dependencies and initialize workspace"
	@echo "  make run-node     - Run Node.js API in CLI diagnostic mode"
	@echo "  make run-python   - Run Python background telemetry worker"
	@echo "  make status       - Inspect sandbox and git repository status"
	@echo "  make clean        - Clean temporary build artifacts"

init:
	@echo "==> Verifying POSIX environment..."
	@chmod +x ./setup.sh
	@./setup.sh

run-node:
	@echo "==> Running Node.js CLI Diagnostics..."
	@cd ../nodejs-typescript-api && node -e "console.log('Node Runtime:', process.version)"

run-python:
	@echo "==> Running Python Worker Telemetry..."
	@python3 ../python-automation-worker/main.py --mode telemetry --iterations 3

status:
	@echo "==> Workspace Projects Status:"
	@ls -la ../
	@echo ""
	@echo "==> Git Status:"
	@git status --short || echo "Not inside git repo or clean"

clean:
	@echo "==> Cleaning cache and temporary files..."
	@find ../ -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@find ../ -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "Clean complete."
