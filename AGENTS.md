# AI Agent System Rules & Constraints

## CRITICAL IMMUTABLE RULE: WORKSPACE EDIT SCOPE LOCK
1. **AI EDIT RESTRICTION**:
   - The AI assistant / Copilot **CANNOT** edit anything on the application infrastructure, core app shell, navigation, system files, or settings.
   - The AI assistant **CAN ONLY** edit, suggest patches for, create, or refactor files residing in the **`sandbox/`** and **`workspace/`** user project directories.
   - All internal system files, App Storage configuration, workflows, keystores, and system architectures are strictly **READ-ONLY** and protected by immutable security seals.
   - **Nothing can change or override this rule.**

2. **SANDBOX ISOLATION ENFORCEMENT**:
   - Any AI code generation, code assistance, code patches, or refactoring actions must target only user sandbox files and project workspaces.
   - Application storage files cannot be mutated by the AI without explicitly creating a sandbox working copy.
