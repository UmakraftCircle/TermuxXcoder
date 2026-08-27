export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  createdAt: number;
}

const store = new Map<string, MemoryEntry>();

export function setMemory(key: string, value: string): MemoryEntry {
  const id = `${key}-${Date.now()}`;
  const entry: MemoryEntry = { id, key, value, createdAt: Date.now() };
  store.set(key, entry);
  return entry;
}

export function getMemory(key: string): MemoryEntry | undefined {
  return store.get(key);
}

export function listMemory(): MemoryEntry[] {
  return Array.from(store.values());
}

export function deleteMemory(key: string): boolean {
  return store.delete(key);
}

export function clearMemory(): void {
  store.clear();
}

export const autoSyncEnabled = false;
