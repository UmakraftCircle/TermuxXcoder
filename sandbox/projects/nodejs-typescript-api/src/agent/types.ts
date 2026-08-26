/**
 * UmaKraft Autonomous Agent Core Engine
 * 
 * Implements:
 * 1. ReAct Loop (Reasoning + Action + Observation)
 * 2. Standardized Tool Calling Registry
 * 3. Self-Correction & Compiler/Linter Verification Loop
 * 4. RAG / AST Semantic Workspace Indexer
 * 5. High-Risk Human-in-the-Loop Confirmation Barrier
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      items?: { type: string };
    }>;
    required: string[];
  };
}

export interface ToolCall {
  id: string;
  toolName: string;
  arguments: Record<string, any>;
}

export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
  durationMs: number;
}

export interface AgentStep {
  stepNumber: number;
  thought: string;
  action?: ToolCall;
  observation?: ToolExecutionResult;
  status: 'planning' | 'executing' | 'evaluating' | 'completed' | 'failed';
}

export interface AgentTaskRun {
  taskId: string;
  objective: string;
  maxIterations: number;
  currentIteration: number;
  steps: AgentStep[];
  status: 'running' | 'completed' | 'failed' | 'paused_for_human_approval';
  finalSummary?: string;
  pendingApprovalAction?: ToolCall;
}

export type ToolHandler = (args: Record<string, any>, context: AgentExecutionContext) => Promise<{
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
}>;

export interface AgentExecutionContext {
  workspaceRoot: string;
  activeModel: string;
  environmentVariables: Record<string, string>;
  isAutonomous: boolean;
}
