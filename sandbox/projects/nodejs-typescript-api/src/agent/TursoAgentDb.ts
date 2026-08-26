import fs from 'fs';
import path from 'path';
import { AgentTaskRun, AgentStep } from './types.js';

export interface TursoDbConfig {
  url?: string;
  authToken?: string;
  localDbPath: string;
}

export class TursoAgentDb {
  private config: TursoDbConfig;
  private isInitialized = false;

  constructor(localDbDir: string) {
    this.config = {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
      localDbPath: path.join(localDbDir, 'agent_memory.json')
    };
  }

  public async init(): Promise<void> {
    if (!fs.existsSync(path.dirname(this.config.localDbPath))) {
      fs.mkdirSync(path.dirname(this.config.localDbPath), { recursive: true });
    }
    if (!fs.existsSync(this.config.localDbPath)) {
      fs.writeFileSync(this.config.localDbPath, JSON.stringify({ tasks: [], steps: [], embeddings: [] }, null, 2));
    }
    this.isInitialized = true;
  }

  public async saveTask(taskRun: AgentTaskRun): Promise<void> {
    await this.init();
    try {
      const data = JSON.parse(fs.readFileSync(this.config.localDbPath, 'utf-8'));
      const existingIdx = data.tasks.findIndex((t: any) => t.taskId === taskRun.taskId);
      if (existingIdx >= 0) {
        data.tasks[existingIdx] = taskRun;
      } else {
        data.tasks.push(taskRun);
      }
      fs.writeFileSync(this.config.localDbPath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('[TursoDb] Failed to persist task run:', e);
    }
  }

  public async getRecentTasks(limit = 10): Promise<AgentTaskRun[]> {
    await this.init();
    try {
      const data = JSON.parse(fs.readFileSync(this.config.localDbPath, 'utf-8'));
      return (data.tasks || []).slice(-limit).reverse();
    } catch {
      return [];
    }
  }

  public async searchPastSolutions(query: string): Promise<{ step: AgentStep; taskObjective: string }[]> {
    await this.init();
    try {
      const data = JSON.parse(fs.readFileSync(this.config.localDbPath, 'utf-8'));
      const results: { step: AgentStep; taskObjective: string }[] = [];
      const q = query.toLowerCase();

      for (const task of (data.tasks as AgentTaskRun[])) {
        for (const step of task.steps) {
          if (
            step.thought.toLowerCase().includes(q) ||
            (step.observation?.output && step.observation.output.toLowerCase().includes(q))
          ) {
            results.push({ step, taskObjective: task.objective });
          }
        }
      }
      return results.slice(0, 5);
    } catch {
      return [];
    }
  }
}
