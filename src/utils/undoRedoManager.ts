import { ProjectFile } from '../types';

export type HistoryActionType =
  | 'manual_edit'
  | 'ai_patch'
  | 'ai_unrestrained'
  | 'auto_format'
  | 'global_replace'
  | 'file_create'
  | 'file_delete'
  | 'file_import'
  | 'replace_find'
  | 'symbol_insert'
  | 'reset_sample';

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  timeLabel: string;
  actionType: HistoryActionType;
  filePath: string;
  fileName: string;
  description: string;
  details?: string;
  files: ProjectFile[];
  activeFilePath?: string;
  linesDelta?: number;
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  currentIndex: number;
  history: HistorySnapshot[];
  snapshots: HistorySnapshot[];
  pastCount: number;
  futureCount: number;
}

export type HistoryListener = (state: HistoryState) => void;

class SandboxUndoRedoManager {
  private stack: HistorySnapshot[] = [];
  private pointer: number = -1; // -1 means no history
  private maxStackSize: number = 60;
  private listeners: Set<HistoryListener> = new Set();
  private lastPushedContentHash: Map<string, string> = new Map();

  constructor() {
    // Initial state will be seeded when first files are loaded
  }

  /**
   * Subscribe to history changes
   */
  public subscribe(listener: HistoryListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in undo/redo listener:', err);
      }
    });
  }

  public getState(): HistoryState {
    const pastCount = Math.max(0, this.pointer);
    const futureCount = this.pointer >= 0 ? Math.max(0, this.stack.length - 1 - this.pointer) : 0;
    const historyList = [...this.stack];

    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      currentIndex: this.pointer,
      history: historyList,
      snapshots: historyList,
      pastCount,
      futureCount
    };
  }

  public canUndo(): boolean {
    return this.pointer > 0;
  }

  public canRedo(): boolean {
    return this.pointer >= 0 && this.pointer < this.stack.length - 1;
  }

  /**
   * Initialize history with starting sandbox files
   */
  public init(files: ProjectFile[], activeFilePath?: string) {
    if (this.stack.length > 0) return; // already initialized

    const targetFile = files.find((f) => f.path === activeFilePath) || files[0];
    const initialSnapshot: HistorySnapshot = {
      id: `init-${Date.now()}`,
      timestamp: Date.now(),
      timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actionType: 'reset_sample',
      filePath: targetFile?.path || 'workspace',
      fileName: targetFile?.name || 'Workspace Initial State',
      description: 'Initial workspace baseline',
      files: JSON.parse(JSON.stringify(files)),
      activeFilePath: targetFile?.path
    };

    this.stack = [initialSnapshot];
    this.pointer = 0;
    this.notify();
  }

  /**
   * Push a new snapshot onto the stack
   */
  public pushSnapshot(params: {
    actionType: HistoryActionType;
    filePath: string;
    fileName: string;
    description: string;
    details?: string;
    files: ProjectFile[];
    activeFilePath?: string;
    linesDelta?: number;
    force?: boolean;
  }): void {
    const { actionType, filePath, fileName, description, details, files, activeFilePath, linesDelta, force } = params;

    // Check if duplicate of current top snapshot to avoid redundant spam
    if (!force && this.pointer >= 0 && this.pointer < this.stack.length) {
      const current = this.stack[this.pointer];
      const currentFileObj = current.files.find((f) => f.path === filePath);
      const newFileObj = files.find((f) => f.path === filePath);

      if (
        current.actionType === actionType &&
        current.filePath === filePath &&
        currentFileObj?.content === newFileObj?.content &&
        current.files.length === files.length
      ) {
        return; // Identical state, skip
      }
    }

    const snapshot: HistorySnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actionType,
      filePath,
      fileName,
      description,
      details,
      files: JSON.parse(JSON.stringify(files)),
      activeFilePath: activeFilePath || filePath,
      linesDelta
    };

    // If pointer is not at the end of stack, discard redo branch
    if (this.pointer < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.pointer + 1);
    }

    this.stack.push(snapshot);

    // Limit max stack size
    if (this.stack.length > this.maxStackSize) {
      this.stack = this.stack.slice(this.stack.length - this.maxStackSize);
    }

    this.pointer = this.stack.length - 1;
    this.notify();
  }

  /**
   * Undo to the previous state
   */
  public undo(): HistorySnapshot | null {
    if (!this.canUndo()) return null;

    this.pointer--;
    const snapshot = this.stack[this.pointer];
    this.notify();
    return snapshot;
  }

  /**
   * Redo to the next forward state
   */
  public redo(): HistorySnapshot | null {
    if (!this.canRedo()) return null;

    this.pointer++;
    const snapshot = this.stack[this.pointer];
    this.notify();
    return snapshot;
  }

  /**
   * Jump directly to any historical snapshot
   */
  public jumpToIndex(index: number): HistorySnapshot | null {
    if (index < 0 || index >= this.stack.length) return null;

    this.pointer = index;
    const snapshot = this.stack[this.pointer];
    this.notify();
    return snapshot;
  }

  /**
   * Get current active snapshot
   */
  public getCurrentSnapshot(): HistorySnapshot | null {
    if (this.pointer >= 0 && this.pointer < this.stack.length) {
      return this.stack[this.pointer];
    }
    return null;
  }

  /**
   * Clear all history and reset
   */
  public clear(): void {
    this.stack = [];
    this.pointer = -1;
    this.notify();
  }
}

export const sandboxUndoRedoManager = new SandboxUndoRedoManager();
