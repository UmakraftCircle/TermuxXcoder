import JSZip from "jszip";

const MAX_COMPRESSED_BYTES = 50 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 200 * 1024 * 1024;
const MAX_ENTRIES = 5_000;
const MAX_RATIO = 100;

export interface SafeZipEntry {
  path: string;
  content: string;
  isBinary: boolean;
  sha256: string;
}

export interface SafeZipResult {
  entries: SafeZipEntry[];
  truncated: boolean;
  totalExpandedBytes: number;
}

function isBinary(bytes: Uint8Array): boolean {
  let suspicious = 0;
  const check = Math.min(bytes.length, 4096);
  for (let i = 0; i < check; i++) {
    if (bytes[i] === 0) return true;
    if (bytes[i] < 9 || (bytes[i] > 13 && bytes[i] < 32)) suspicious++;
  }
  return suspicious / check > 0.3;
}

function normalizePath(name: string): string | null {
  if (!name || name.includes("\\") || name.includes("\0")) return null;
  if (path.isAbsolute(name)) return null;
  const parts = name.split("/").filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      if (stack.length === 0) return null;
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  const result = stack.join("/");
  return result || null;
}

export async function safeExtractZip(
  data: ArrayBuffer,
): Promise<SafeZipResult> {
  if (data.byteLength > MAX_COMPRESSED_BYTES) {
    throw new Error(`Archive exceeds compressed size limit (${MAX_COMPRESSED_BYTES} bytes)`);
  }

  const zip = await JSZip.loadAsync(data);
  const entries: SafeZipEntry[] = [];
  let totalExpanded = 0;
  let count = 0;

  for (const [name, file] of Object.entries(zip.files)) {
    if (file.dir) continue;
    if (count >= MAX_ENTRIES) {
      return { entries, truncated: true, totalExpandedBytes: totalExpanded };
    }

    const safePath = normalizePath(name);
    if (!safePath) continue;

    const bytes = await file.async("uint8array");
    totalExpanded += bytes.length;
    if (totalExpanded > MAX_EXPANDED_BYTES) {
      return { entries, truncated: true, totalExpandedBytes: totalExpanded };
    }

    const ratio = bytes.length === 0 ? 1 : data.byteLength / bytes.length;
    if (ratio < 1 / MAX_RATIO) {
      throw new Error(`Entry "${name}" exceeds compression ratio limit (possible zip bomb)`);
    }

    const binary = isBinary(bytes);
    const content = binary
      ? `[binary file, ${bytes.length} bytes]`
      : new TextDecoder().decode(bytes);

    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = btoa(String.fromCharCode(...new Uint8Array(digest)));

    entries.push({ path: safePath, content, isBinary: binary, sha256 });
    count++;
  }

  return { entries, truncated: false, totalExpandedBytes: totalExpanded };
}
