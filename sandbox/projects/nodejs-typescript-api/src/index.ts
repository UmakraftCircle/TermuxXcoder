import express, { Request, Response } from 'express';
import cors from 'cors';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { AgentExecutor } from './agent/AgentExecutor.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const workspaceRoot = path.resolve(process.cwd(), '..');
const agentExecutor = new AgentExecutor(workspaceRoot);

// In-memory model & project registry
interface ProjectItem {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'archived' | 'building';
  createdAt: string;
}

const projects: ProjectItem[] = [
  { id: '1', name: 'android-compose-app', category: 'Android / Kotlin', status: 'active', createdAt: new Date().toISOString() },
  { id: '2', name: 'python-automation-worker', category: 'Python / Worker', status: 'active', createdAt: new Date().toISOString() },
  { id: '3', name: 'dev-tools-workspace', category: 'DevOps / Shell', status: 'active', createdAt: new Date().toISOString() }
];

const CreateProjectSchema = z.object({
  name: z.string().min(2),
  category: z.string().default('General'),
  status: z.enum(['active', 'archived', 'building']).default('active')
});

const AgentTaskSchema = z.object({
  objective: z.string().min(3),
  maxIterations: z.number().min(1).max(20).default(6),
  autonomous: z.boolean().default(true)
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    runtime: 'Node.js ' + process.version,
    agentEngine: 'UmaKraft Autonomous ReAct 1.0',
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// ==================== AUTONOMOUS AGENT ENDPOINTS ====================

// 1. Get available agent tools
app.get('/api/agent/tools', (_req: Request, res: Response) => {
  const tools = agentExecutor.getToolRegistry().getToolDefinitions();
  res.json({ success: true, count: tools.length, tools });
});

// 2. Query workspace semantic symbols (RAG)
app.get('/api/agent/symbols', async (req: Request, res: Response) => {
  const q = String(req.query.q || '');
  const rag = agentExecutor.getRagIndexer();
  await rag.buildIndex();
  const symbols = rag.querySymbols(q);
  res.json({ success: true, count: symbols.length, symbols });
});

// 3. Launch autonomous agent task run
app.post('/api/agent/tasks', async (req: Request, res: Response) => {
  const parse = AgentTaskSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ success: false, errors: parse.error.flatten() });
  }

  const { objective, maxIterations, autonomous } = parse.data;

  try {
    const taskRun = await agentExecutor.startAutonomousTask(
      objective,
      {
        workspaceRoot,
        activeModel: 'qwen_local',
        environmentVariables: {},
        isAutonomous: autonomous
      },
      maxIterations
    );

    res.status(201).json({ success: true, data: taskRun });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Inspect active agent task run
app.get('/api/agent/tasks/:taskId', (req: Request, res: Response) => {
  const taskRun = agentExecutor.getTaskRun(req.params.taskId);
  if (!taskRun) {
    return res.status(404).json({ success: false, error: 'Agent task not found' });
  }
  res.json({ success: true, data: taskRun });
});

// 5. Approve paused high-risk tool call
app.post('/api/agent/tasks/:taskId/approve', async (req: Request, res: Response) => {
  try {
    const taskRun = await agentExecutor.approveAndResumeTask(
      req.params.taskId,
      {
        workspaceRoot,
        activeModel: 'qwen_local',
        environmentVariables: {},
        isAutonomous: true
      }
    );
    res.json({ success: true, data: taskRun });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==================== PROJECT ENDPOINTS ====================

app.get('/api/projects', (_req: Request, res: Response) => {
  res.json({ success: true, count: projects.length, data: projects });
});

app.get('/api/projects/:id', (req: Request, res: Response) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }
  res.json({ success: true, data: project });
});

app.post('/api/projects', (req: Request, res: Response) => {
  const parseResult = CreateProjectSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ success: false, errors: parseResult.error.flatten() });
  }

  const newProject: ProjectItem = {
    id: String(Date.now()),
    name: parseResult.data.name,
    category: parseResult.data.category,
    status: parseResult.data.status,
    createdAt: new Date().toISOString()
  };

  projects.push(newProject);
  res.status(201).json({ success: true, data: newProject });
});

// AI Core Engine Status check
app.get('/api/ai/status', (_req: Request, res: Response) => {
  const defaultModelPath = path.resolve(process.cwd(), '../models/default.gguf');
  const exists = fs.existsSync(defaultModelPath);

  res.json({
    engine: 'qwen_local',
    model: 'default.gguf',
    verified: exists,
    path: '/models/default.gguf',
    format: 'GGUF (Q4_K_M)',
    tursoRag: 'Active'
  });
});

app.listen(PORT, () => {
  console.log(`[UmaKraft API & Agent] Server running on http://localhost:${PORT}`);
  console.log(`[UmaKraft API & Agent] Health endpoint ready at http://localhost:${PORT}/health`);
});
