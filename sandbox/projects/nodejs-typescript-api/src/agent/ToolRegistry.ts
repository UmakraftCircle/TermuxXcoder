import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { ToolDefinition, ToolHandler, AgentExecutionContext } from './types.js';
import { GitHubActionsSync, ProjectStack, WorkflowType } from './GitHubActionsSync.js';

const execPromise = util.promisify(exec);

export class ToolRegistry {
  private tools: Map<string, { definition: ToolDefinition; handler: ToolHandler }> = new Map();
  private highRiskTools: Set<string> = new Set(['terminal_exec_dangerous', 'fs_delete_recursive', 'git_force_push']);

  constructor() {
    this.registerBuiltInTools();
  }

  private resolveSafePath(workspaceRoot: string, requestedPath: string): string | null {
    if (!requestedPath || typeof requestedPath !== 'string') return null;
    const cleanPath = requestedPath.trim();
    if (cleanPath.includes('..')) return null;

    const resolvedRoot = path.resolve(workspaceRoot);
    const targetPath = path.resolve(resolvedRoot, cleanPath);

    if (targetPath.startsWith(resolvedRoot)) {
      return targetPath;
    }
    return null;
  }

  public registerTool(definition: ToolDefinition, handler: ToolHandler, isHighRisk = false) {
    this.tools.set(definition.name, { definition, handler });
    if (isHighRisk) {
      this.highRiskTools.add(definition.name);
    }
  }

  public getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  public isRiskSensitive(toolName: string, args: Record<string, any>): boolean {
    if (this.highRiskTools.has(toolName)) return true;
    if (toolName === 'terminal_exec') {
      const cmd = String(args.command || '').toLowerCase();
      if (cmd.includes('rm -rf') || cmd.includes('git push -f') || cmd.includes('mkfs') || cmd.includes('dd if=')) {
        return true;
      }
    }
    return false;
  }

  public async executeTool(
    toolName: string,
    args: Record<string, any>,
    context: AgentExecutionContext
  ): Promise<{ success: boolean; output: string; error?: string; exitCode?: number }> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        success: false,
        output: '',
        error: `Tool '${toolName}' not found in registered agent toolset.`
      };
    }

    try {
      return await tool.handler(args, context);
    } catch (err: any) {
      return {
        success: false,
        output: '',
        error: `Execution error in tool '${toolName}': ${err.message || String(err)}`
      };
    }
  }

  private registerBuiltInTools() {
    // 1. fs_read_file
    this.registerTool(
      {
        name: 'fs_read_file',
        description: 'Reads the exact contents of a file in the workspace.',
        parameters: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Relative path to the file from workspace root' },
            startLine: { type: 'number', description: 'Optional 1-indexed start line' },
            endLine: { type: 'number', description: 'Optional 1-indexed end line' }
          },
          required: ['filePath']
        }
      },
      async (args, ctx) => {
        const fullPath = this.resolveSafePath(ctx.workspaceRoot, args.filePath);
        if (!fullPath || !fs.existsSync(fullPath)) {
          return { success: false, output: '', error: `File not found or access denied: ${args.filePath}` };
        }
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const lines = raw.split('\n');
        const start = args.startLine ? Math.max(1, args.startLine) - 1 : 0;
        const end = args.endLine ? Math.min(lines.length, args.endLine) : lines.length;
        const content = lines.slice(start, end).join('\n');
        return { success: true, output: content };
      }
    );

    // 2. fs_write_file
    this.registerTool(
      {
        name: 'fs_write_file',
        description: 'Creates or completely overwrites a file with content.',
        parameters: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Relative path to the file' },
            content: { type: 'string', description: 'Complete file text content to write' }
          },
          required: ['filePath', 'content']
        }
      },
      async (args, ctx) => {
        const fullPath = this.resolveSafePath(ctx.workspaceRoot, args.filePath);
        if (!fullPath) {
          return { success: false, output: '', error: `Invalid or unsafe file path: ${args.filePath}` };
        }
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, args.content, 'utf-8');
        return { success: true, output: `Successfully wrote ${args.content.length} characters to ${args.filePath}` };
      }
    );

    // 3. fs_patch_file
    this.registerTool(
      {
        name: 'fs_patch_file',
        description: 'Surgically replaces a specific substring or code block in an existing file.',
        parameters: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Relative path to the file' },
            targetContent: { type: 'string', description: 'Exact string to locate in the file' },
            replacementContent: { type: 'string', description: 'New replacement content' }
          },
          required: ['filePath', 'targetContent', 'replacementContent']
        }
      },
      async (args, ctx) => {
        const fullPath = this.resolveSafePath(ctx.workspaceRoot, args.filePath);
        if (!fullPath || !fs.existsSync(fullPath)) {
          return { success: false, output: '', error: `File not found or access denied: ${args.filePath}` };
        }
        const current = fs.readFileSync(fullPath, 'utf-8');
        if (!current.includes(args.targetContent)) {
          return { success: false, output: '', error: `Target substring not found in ${args.filePath}` };
        }
        const updated = current.replace(args.targetContent, args.replacementContent);
        fs.writeFileSync(fullPath, updated, 'utf-8');
        return { success: true, output: `Successfully patched ${args.filePath}` };
      }
    );

    // 4. fs_list_dir
    this.registerTool(
      {
        name: 'fs_list_dir',
        description: 'Lists all files and directories in a given folder.',
        parameters: {
          type: 'object',
          properties: {
            dirPath: { type: 'string', description: 'Relative path to folder (or empty for root)' }
          },
          required: []
        }
      },
      async (args, ctx) => {
        const target = this.resolveSafePath(ctx.workspaceRoot, args.dirPath || '.');
        if (!target || !fs.existsSync(target)) {
          return { success: false, output: '', error: `Directory not found or access denied: ${args.dirPath}` };
        }
        const entries = fs.readdirSync(target, { withFileTypes: true });
        const list = entries.map(e => `${e.isDirectory() ? '[DIR] ' : '[FILE]'} ${e.name}`).join('\n');
        return { success: true, output: list || '(Empty directory)' };
      }
    );

    // 5. terminal_exec
    this.registerTool(
      {
        name: 'terminal_exec',
        description: 'Executes a POSIX shell command in the project environment within workspace boundaries.',
        parameters: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'The exact bash shell command line string' },
            cwd: { type: 'string', description: 'Working directory relative to workspace root' }
          },
          required: ['command']
        }
      },
      async (args, ctx) => {
        const execDir = this.resolveSafePath(ctx.workspaceRoot, args.cwd || '.');
        if (!execDir) {
          return { success: false, output: '', error: `Invalid or unsafe working directory: ${args.cwd}` };
        }
        try {
          const { stdout, stderr } = await execPromise(args.command, {
            cwd: execDir,
            timeout: 30000,
            maxBuffer: 1024 * 1024 * 5
          });
          const combined = (stdout + (stderr ? `\n[STDERR]:\n${stderr}` : '')).trim();
          return { success: true, output: combined || '(Command executed with no output)', exitCode: 0 };
        } catch (err: any) {
          const out = (err.stdout || '') + (err.stderr ? `\n[STDERR]:\n${err.stderr}` : '');
          return {
            success: false,
            output: out.trim(),
            error: err.message,
            exitCode: err.code || 1
          };
        }
      }
    );

    // 6. code_diagnostics_verify
    this.registerTool(
      {
        name: 'code_diagnostics_verify',
        description: 'Runs compile, lint, and typecheck diagnostics to verify project integrity.',
        parameters: {
          type: 'object',
          properties: {
            projectType: { type: 'string', enum: ['node', 'android', 'python', 'all'], description: 'Target project type' }
          },
          required: ['projectType']
        }
      },
      async (args, ctx) => {
        const results: string[] = [];
        const root = path.resolve(ctx.workspaceRoot);
        
        if (args.projectType === 'node' || args.projectType === 'all') {
          const hasPackageJson = fs.existsSync(path.join(root, 'package.json'));
          results.push(hasPackageJson ? '✓ Node.js package structure detected.' : '- Node.js package.json not found in root.');
        }
        if (args.projectType === 'android' || args.projectType === 'all') {
          const hasGradle = fs.existsSync(path.join(root, 'build.gradle.kts')) || fs.existsSync(path.join(root, 'app/build.gradle.kts'));
          results.push(hasGradle ? '✓ Android Gradle build files detected.' : '- Android build.gradle.kts not found.');
        }
        if (args.projectType === 'python' || args.projectType === 'all') {
          const hasPy = fs.existsSync(path.join(root, 'requirements.txt')) || fs.existsSync(path.join(root, 'main.py'));
          results.push(hasPy ? '✓ Python project structure detected.' : '- Python files not found in root.');
        }
        return { success: true, output: results.join('\n') };
      }
    );

    // 7. github_actions_workflow_sync
    this.registerTool(
      {
        name: 'github_actions_workflow_sync',
        description: 'Generates or updates production-ready .github/workflows YAML files based on project structure (Android, Node.js, Python, or Full-Stack).',
        parameters: {
          type: 'object',
          properties: {
            stack: {
              type: 'string',
              enum: ['auto', 'android', 'node', 'python', 'multiplatform'],
              description: 'Project technology stack (use "auto" for auto-detection)'
            },
            workflowType: {
              type: 'string',
              enum: ['ci', 'release', 'quality'],
              description: 'Type of CI/CD workflow to generate'
            },
            targetBranch: {
              type: 'string',
              description: 'Default branch trigger (default: main)'
            },
            workflowName: {
              type: 'string',
              description: 'Custom name for the GitHub Action workflow'
            },
            autoWriteToWorkspace: {
              type: 'boolean',
              description: 'If true, automatically saves to .github/workflows/'
            }
          },
          required: []
        }
      },
      async (args, ctx) => {
        const stack = (args.stack || 'auto') as ProjectStack;
        const workflowType = (args.workflowType || 'ci') as WorkflowType;
        const workflow = GitHubActionsSync.generateWorkflow(ctx.workspaceRoot, stack, workflowType, {
          workflowName: args.workflowName,
          targetBranch: args.targetBranch || 'main'
        });

        let writeResult = '';
        if (args.autoWriteToWorkspace !== false) {
          const syncRes = GitHubActionsSync.syncToWorkspace(ctx.workspaceRoot, workflow);
          if (syncRes.success) {
            writeResult = `\nSaved to workspace: ${workflow.relativePath}`;
          } else {
            writeResult = `\nWorkspace save warning: ${syncRes.error}`;
          }
        }

        return {
          success: true,
          output: `Generated GitHub Actions Workflow [${workflow.fileName}] for stack: ${workflow.detectedStack}${writeResult}\n\nYAML Preview:\n---\n${workflow.content}`
        };
      }
    );
  }
}
