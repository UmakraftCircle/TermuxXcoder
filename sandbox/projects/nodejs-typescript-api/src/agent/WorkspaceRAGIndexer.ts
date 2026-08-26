import fs from 'fs';
import path from 'path';

export interface CodeSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'variable' | 'endpoint';
  filePath: string;
  line: number;
}

export interface WorkspaceIndexResult {
  totalFiles: number;
  symbols: CodeSymbol[];
  indexedAt: string;
}

export class WorkspaceRAGIndexer {
  private workspaceRoot: string;
  private symbols: CodeSymbol[] = [];

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  public async buildIndex(): Promise<WorkspaceIndexResult> {
    this.symbols = [];
    const files = this.scanDir(this.workspaceRoot);

    for (const filePath of files) {
      this.extractSymbols(filePath);
    }

    return {
      totalFiles: files.length,
      symbols: this.symbols,
      indexedAt: new Date().toISOString()
    };
  }

  public querySymbols(query: string): CodeSymbol[] {
    const q = query.toLowerCase();
    return this.symbols.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.filePath.toLowerCase().includes(q) ||
      s.kind.toLowerCase().includes(q)
    ).slice(0, 15);
  }

  private scanDir(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      if (item.name === 'node_modules' || item.name === '.git' || item.name === 'dist' || item.name === 'build') {
        continue;
      }
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results = results.concat(this.scanDir(fullPath));
      } else if (item.isFile() && /\.(ts|tsx|kt|py|sh|json|gradle)$/.test(item.name)) {
        results.push(fullPath);
      }
    }
    return results;
  }

  private extractSymbols(filePath: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const relPath = path.relative(this.workspaceRoot, filePath);

      lines.forEach((line, index) => {
        const lineNum = index + 1;
        // TypeScript / Kotlin / Python regex matches
        const fnMatch = line.match(/(?:function|fun|def)\s+([A-Za-z0-9_]+)/);
        if (fnMatch) {
          this.symbols.push({ name: fnMatch[1], kind: 'function', filePath: relPath, line: lineNum });
        }

        const classMatch = line.match(/(?:class|interface)\s+([A-Za-z0-9_]+)/);
        if (classMatch) {
          this.symbols.push({ name: classMatch[1], kind: line.includes('interface') ? 'interface' : 'class', filePath: relPath, line: lineNum });
        }

        const endpointMatch = line.match(/app\.(get|post|put|delete)\(['"]([^'"]+)['"]/);
        if (endpointMatch) {
          this.symbols.push({ name: `${endpointMatch[1].toUpperCase()} ${endpointMatch[2]}`, kind: 'endpoint', filePath: relPath, line: lineNum });
        }
      });
    } catch {
      // Ignore read errors
    }
  }
}
