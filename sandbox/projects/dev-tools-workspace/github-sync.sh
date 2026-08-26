#!/usr/bin/env bash

# UmaKraft POSIX GitHub Sync & Remote Automation Script
# Supports cloning, pushing, pulling, committing, and GitHub PAT authentication

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}===================================================${NC}"
echo -e "${GREEN}  🐙 UMAKRAFT GITHUB SYNC & GIT REMOTE AUTOMATION  ${NC}"
echo -e "${BLUE}===================================================${NC}"

ACTION="${1:-status}"
REPO_URL="${2:-}"
BRANCH="${3:-main}"
COMMIT_MSG="${4:-Automated sync from UmaKraft Android IDE}"

case "$ACTION" in
    "status")
        echo -e "${YELLOW}[*] Git Workspace Status:${NC}"
        git status
        ;;
    "init")
        echo -e "${YELLOW}[*] Initializing local repository:${NC}"
        git init
        git branch -M main
        echo -e "${GREEN}✓ Local git initialized with default branch 'main'${NC}"
        ;;
    "clone")
        if [ -z "$REPO_URL" ]; then
            echo -e "${RED}Error: Repository URL required for clone!${NC}"
            echo "Usage: ./github-sync.sh clone <https://github.com/user/repo.git>"
            exit 1
        fi
        echo -e "${YELLOW}[*] Cloning repository: $REPO_URL${NC}"
        git clone "$REPO_URL"
        echo -e "${GREEN}✓ Clone successful!${NC}"
        ;;
    "push")
        echo -e "${YELLOW}[*] Staging all files...${NC}"
        git add -A
        echo -e "${YELLOW}[*] Creating commit: '$COMMIT_MSG'...${NC}"
        git commit -m "$COMMIT_MSG" || echo "No new changes to commit."
        if [ -n "$REPO_URL" ]; then
            git remote remove origin 2>/dev/null || true
            git remote add origin "$REPO_URL"
        fi
        echo -e "${YELLOW}[*] Pushing to branch $BRANCH...${NC}"
        git push -u origin "$BRANCH" || echo -e "${YELLOW}Notice: Set remote credentials or run 'git push' with Personal Access Token.${NC}"
        echo -e "${GREEN}✓ Push operation processed.${NC}"
        ;;
    "pull")
        echo -e "${YELLOW}[*] Pulling latest changes from branch $BRANCH...${NC}"
        git pull origin "$BRANCH"
        echo -e "${GREEN}✓ Pull completed.${NC}"
        ;;
    "help"|*)
        echo "Available Commands:"
        echo "  ./github-sync.sh status"
        echo "  ./github-sync.sh init"
        echo "  ./github-sync.sh clone <repo_url>"
        echo "  ./github-sync.sh push <repo_url> <branch> <commit_message>"
        echo "  ./github-sync.sh pull <branch>"
        ;;
esac
