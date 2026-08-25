import { TursoConfig } from './types';

export interface TursoQueryResult<T = any> {
  rows: T[];
  rowsAffected: number;
  lastInsertRowid?: number | string;
  columns: string[];
}

export class TursoClient {
  private config: TursoConfig;

  constructor(config: TursoConfig) {
    this.config = { ...config };
  }

  public setConfig(config: TursoConfig) {
    this.config = { ...config };
  }

  public getConfig(): TursoConfig {
    return { ...this.config };
  }

  /**
   * Normalize database URL to https standard endpoint
   */
  private getEndpointUrl(): string {
    let url = this.config.databaseUrl.trim();
    if (!url) return '';

    if (url.startsWith('libsql://')) {
      url = url.replace('libsql://', 'https://');
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    // Ensure trailing slash removed
    url = url.replace(/\/+$/, '');
    return url;
  }

  /**
   * Test connection to Turso database
   */
  public async testConnection(): Promise<{
    success: boolean;
    message: string;
    latencyMs: number;
    dbName?: string;
  }> {
    const startTime = Date.now();
    const endpoint = this.getEndpointUrl();

    if (!endpoint) {
      return {
        success: false,
        message: 'Turso database URL is empty. Please enter your database URL.',
        latencyMs: 0
      };
    }

    try {
      // First try server proxy to avoid browser CORS issues
      const proxyRes = await fetch('/api/turso-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          databaseUrl: endpoint,
          authToken: this.config.authToken
        })
      });

      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        return {
          success: proxyData.success,
          message: proxyData.message || 'Connected to Turso SQLite database successfully',
          latencyMs: Date.now() - startTime,
          dbName: proxyData.dbName || this.config.databaseName
        };
      }

      // Direct fallback request using LibSQL Pipeline API
      const directRes = await fetch(`${endpoint}/v2/pipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.authToken}`
        },
        body: JSON.stringify({
          requests: [
            { type: 'execute', stmt: { sql: 'SELECT 1 AS health_check, datetime("now") AS server_time;' } },
            { type: 'close' }
          ]
        })
      });

      const latencyMs = Date.now() - startTime;

      if (!directRes.ok) {
        const errorText = await directRes.text();
        return {
          success: false,
          message: `Turso HTTP ${directRes.status}: ${errorText || 'Authentication failed'}`,
          latencyMs
        };
      }

      return {
        success: true,
        message: 'Direct connection to Turso cloud SQLite database successful!',
        latencyMs,
        dbName: this.config.databaseName
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to reach Turso database endpoint',
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * Execute single SQL statement
   */
  public async execute<T = any>(sql: string, args: any[] = []): Promise<TursoQueryResult<T>> {
    const endpoint = this.getEndpointUrl();

    // Use backend proxy for reliable CORS & token handling
    try {
      const res = await fetch('/api/turso-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          databaseUrl: endpoint,
          authToken: this.config.authToken,
          sql,
          args
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return {
            rows: data.rows || [],
            rowsAffected: data.rowsAffected || 0,
            lastInsertRowid: data.lastInsertRowid,
            columns: data.columns || []
          };
        }
        throw new Error(data.error || 'SQL execution failed');
      }
    } catch (proxyErr) {
      // Direct pipeline fallback
      const payload = {
        requests: [
          {
            type: 'execute',
            stmt: {
              sql,
              args: args.map((arg) => {
                if (arg === null || arg === undefined) return { type: 'null' };
                if (typeof arg === 'number') return { type: 'integer', value: String(arg) };
                if (typeof arg === 'boolean') return { type: 'integer', value: arg ? '1' : '0' };
                return { type: 'text', value: String(arg) };
              })
            }
          },
          { type: 'close' }
        ]
      };

      const res = await fetch(`${endpoint}/v2/pipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Turso Error (${res.status}): ${txt}`);
      }

      const responseData = await res.json();
      const execResult = responseData?.results?.[0]?.response?.result;

      if (!execResult) {
        return { rows: [], rowsAffected: 0, columns: [] };
      }

      const columns: string[] = execResult.cols?.map((c: any) => c.name) || [];
      const rows: T[] = (execResult.rows || []).map((rowArr: any[]) => {
        const obj: any = {};
        rowArr.forEach((valObj, idx) => {
          const colName = columns[idx] || `col_${idx}`;
          obj[colName] = valObj?.value !== undefined ? valObj.value : null;
        });
        return obj as T;
      });

      return {
        rows,
        rowsAffected: execResult.affected_row_count || 0,
        lastInsertRowid: execResult.last_insert_rowid,
        columns
      };
    }

    return { rows: [], rowsAffected: 0, columns: [] };
  }

  /**
   * Execute batch of SQL statements in sequence
   */
  public async batch(statements: { sql: string; args?: any[] }[]): Promise<any[]> {
    const results = [];
    for (const stmt of statements) {
      const res = await this.execute(stmt.sql, stmt.args || []);
      results.push(res);
    }
    return results;
  }

  /**
   * Initialize all memory schema tables in Turso SQLite
   */
  public async initializeTables(): Promise<{ success: boolean; initializedTables: string[] }> {
    const tableDefinitions = [
      {
        name: 'project_summaries',
        sql: `
          CREATE TABLE IF NOT EXISTS project_summaries (
            id TEXT PRIMARY KEY,
            project_name TEXT NOT NULL,
            overview TEXT NOT NULL,
            modules_json TEXT NOT NULL,
            tech_stack_json TEXT NOT NULL,
            key_highlights_json TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            sync_status TEXT DEFAULT 'synced'
          );
        `
      },
      {
        name: 'file_index',
        sql: `
          CREATE TABLE IF NOT EXISTS file_index (
            id TEXT PRIMARY KEY,
            file_path TEXT UNIQUE NOT NULL,
            file_name TEXT NOT NULL,
            category TEXT NOT NULL,
            module TEXT,
            language TEXT NOT NULL,
            summary TEXT NOT NULL,
            symbols_json TEXT NOT NULL,
            token_count INTEGER DEFAULT 0,
            checksum TEXT,
            last_modified TEXT NOT NULL,
            sync_status TEXT DEFAULT 'synced'
          );
        `
      },
      {
        name: 'build_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS build_logs (
            id TEXT PRIMARY KEY,
            build_type TEXT NOT NULL,
            status TEXT NOT NULL,
            error_summary TEXT,
            diagnostics_json TEXT NOT NULL,
            terminal_output_preview TEXT NOT NULL,
            recommended_fix TEXT,
            timestamp TEXT NOT NULL,
            sync_status TEXT DEFAULT 'synced'
          );
        `
      },
      {
        name: 'ai_knowledge',
        sql: `
          CREATE TABLE IF NOT EXISTS ai_knowledge (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            topic TEXT NOT NULL,
            content TEXT NOT NULL,
            confidence REAL DEFAULT 0.9,
            tags_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            sync_status TEXT DEFAULT 'synced'
          );
        `
      },
      {
        name: 'coding_preferences',
        sql: `
          CREATE TABLE IF NOT EXISTS coding_preferences (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            key_name TEXT UNIQUE NOT NULL,
            preference_value TEXT NOT NULL,
            scope TEXT DEFAULT 'global',
            updated_at TEXT NOT NULL,
            sync_status TEXT DEFAULT 'synced'
          );
        `
      }
    ];

    const initialized: string[] = [];

    for (const table of tableDefinitions) {
      await this.execute(table.sql);
      initialized.push(table.name);
    }

    return {
      success: true,
      initializedTables: initialized
    };
  }
}
