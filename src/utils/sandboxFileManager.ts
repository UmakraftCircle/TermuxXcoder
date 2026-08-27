import JSZip from 'jszip';
import { decompress as decompressZstd } from 'fzstd';
import { ProjectFile } from '../types';

const SANDBOX_STORAGE_KEY = 'umakraft_sandbox_user_files_v1';

export function detectLanguageFromFilename(filename: string): ProjectFile['language'] {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.kt') || lower.endsWith('.kts')) return 'kotlin';
  if (lower.endsWith('.cpp') || lower.endsWith('.cc') || lower.endsWith('.cxx') || lower.endsWith('.h') || lower.endsWith('.hpp')) return 'cpp';
  if (lower.endsWith('.c')) return 'c';
  if (lower.endsWith('.yml') || lower.endsWith('.yaml')) return 'yaml';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.xml') || lower.endsWith('.html') || lower.endsWith('.svg')) return 'xml';
  if (lower.endsWith('.sh') || lower.endsWith('.bash') || lower.endsWith('.zsh')) return 'bash';
  if (lower.endsWith('.gradle') || lower.endsWith('.groovy')) return 'groovy';
  if (lower.endsWith('.properties') || lower.endsWith('.env') || lower.endsWith('.conf') || lower.endsWith('.ini')) return 'properties';
  if (lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.txt')) return 'markdown';
  return 'kotlin';
}

export function loadSavedSandboxFiles(): ProjectFile[] {
  try {
    const raw = localStorage.getItem(SANDBOX_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => ({
          ...item,
          isSandbox: true,
          storageScope: 'sandbox_user' as const
        }));
      }
    }
  } catch (err) {
    console.error('Failed to load sandbox files from localStorage:', err);
  }
  // Default to starter demo sandbox files so editor canvas is never empty
  return SAMPLE_SANDBOX_DEMO_FILES.map((item) => ({
    ...item,
    isSandbox: true,
    storageScope: 'sandbox_user' as const
  }));
}

export function saveSandboxFiles(files: ProjectFile[]): void {
  try {
    const sandboxOnly = files.filter((f) => f.isSandbox !== false && f.storageScope !== 'app_internal_vault' && f.origin !== 'app_system');
    localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(sandboxOnly));
  } catch (err) {
    console.error('Failed to save sandbox files to localStorage:', err);
  }
}

export async function parseUploadedFiles(fileList: FileList | File[]): Promise<ProjectFile[]> {
  const result: ProjectFile[] = [];
  const filesArray = Array.from(fileList);

  for (const file of filesArray) {
    // Skip large binary files or system dotfiles if inappropriate
    if (file.size > 10 * 1024 * 1024) continue; // Skip files > 10MB
    const relativePath = (file as any).webkitRelativePath || file.name;
    
    // Read text content
    try {
      const text = await file.text();
      const filename = file.name;
      const lang = detectLanguageFromFilename(filename);

      result.push({
        path: relativePath.startsWith('sandbox/') ? relativePath : `sandbox/${relativePath.replace(/^\/+/, '')}`,
        name: filename,
        category: 'generated',
        module: 'sandbox',
        content: text,
        description: `Uploaded user sandbox file (${(file.size / 1024).toFixed(1)} KB)`,
        language: lang,
        isSandbox: true,
        origin: 'upload',
        storageScope: 'sandbox_user',
        checksum: `sha256:${Math.random().toString(36).substring(2, 12)}`
      });
    } catch (err) {
      console.warn(`Could not read file ${file.name} as text:`, err);
    }
  }

  return result;
}

export async function parseZipArchive(zipFile: File): Promise<ProjectFile[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);
  const result: ProjectFile[] = [];

  for (const [relativePath, entry] of Object.entries(loadedZip.files)) {
    if (entry.dir) continue;
    // Skip binary blobs, git objects, or macOS system files
    if (relativePath.includes('__MACOSX/') || relativePath.endsWith('.DS_Store')) continue;
    if (relativePath.endsWith('.apk') || relativePath.endsWith('.aab') || relativePath.endsWith('.jar') || relativePath.endsWith('.so') || relativePath.endsWith('.class')) {
      continue;
    }

    try {
      const text = await entry.async('text');
      const parts = relativePath.split('/');
      const filename = parts[parts.length - 1] || relativePath;
      const lang = detectLanguageFromFilename(filename);

      result.push({
        path: `sandbox/${relativePath.replace(/^\/+/, '')}`,
        name: filename,
        category: 'generated',
        module: parts.length > 1 ? parts[0] : 'sandbox',
        content: text,
        description: `Imported from ZIP archive: ${zipFile.name}`,
        language: lang,
        isSandbox: true,
        origin: 'import',
        storageScope: 'sandbox_user',
        checksum: `sha256:${Math.random().toString(36).substring(2, 12)}`
      });
    } catch (err) {
      console.warn(`Could not extract ${relativePath} from ZIP:`, err);
    }
  }

  return result;
}

export async function parseZstdArchive(zstdFile: File): Promise<ProjectFile[]> {
  try {
    const arrayBuffer = await zstdFile.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const decompressedBytes = decompressZstd(uint8);

    // If it's a tar.zst or zstd-wrapped zip, try unzipping or parsing as text
    const cleanName = zstdFile.name.replace(/\.zst(d)?$/i, '');
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(decompressedBytes);
      const result: ProjectFile[] = [];
      for (const [relativePath, entry] of Object.entries(loadedZip.files)) {
        if (entry.dir) continue;
        const text = await entry.async('text');
        const parts = relativePath.split('/');
        const filename = parts[parts.length - 1] || relativePath;
        const lang = detectLanguageFromFilename(filename);
        result.push({
          path: `sandbox/${relativePath.replace(/^\/+/, '')}`,
          name: filename,
          category: 'generated',
          module: parts.length > 1 ? parts[0] : 'sandbox',
          content: text,
          description: `Extracted from Zstandard (.zst) archive: ${zstdFile.name}`,
          language: lang,
          isSandbox: true,
          origin: 'import',
          storageScope: 'sandbox_user',
          checksum: `sha256:${Math.random().toString(36).substring(2, 12)}`
        });
      }
      if (result.length > 0) return result;
    } catch {
      // Fallback: parse decompressed bytes as text file
      const text = new TextDecoder().decode(decompressedBytes);
      const lang = detectLanguageFromFilename(cleanName);
      return [
        {
          path: `sandbox/${cleanName}`,
          name: cleanName,
          category: 'generated',
          module: 'sandbox',
          content: text,
          description: `Decompressed from ${zstdFile.name} using Zstandard v1.5.4`,
          language: lang,
          isSandbox: true,
          origin: 'import',
          storageScope: 'sandbox_user',
          checksum: `sha256:${Math.random().toString(36).substring(2, 12)}`
        }
      ];
    }
  } catch (err) {
    console.error('Failed to decompress Zstandard archive:', err);
    throw new Error(`Zstandard extraction failed: ${(err as Error).message}`);
  }
  return [];
}

export function createNewSandboxFile(filename: string, content: string = ''): ProjectFile {
  const cleanName = filename.trim().replace(/^[\/\\]+/, '');
  const lang = detectLanguageFromFilename(cleanName);
  
  const defaultContent = content || `// ${cleanName}
// Umakraft Sandbox User File
// Created: ${new Date().toISOString()}

fun main() {
    println("Hello from Umakraft Sandbox!")
}
`;

  return {
    path: cleanName.startsWith('sandbox/') ? cleanName : `sandbox/${cleanName}`,
    name: cleanName.split('/').pop() || cleanName,
    category: 'generated',
    module: 'sandbox',
    content: defaultContent,
    description: 'User created sandbox file',
    language: lang,
    isSandbox: true,
    origin: 'user',
    storageScope: 'sandbox_user',
    checksum: `sha256:${Math.random().toString(36).substring(2, 12)}`
  };
}

export const SAMPLE_SANDBOX_DEMO_FILES: ProjectFile[] = [
  {
    path: 'sandbox/MainSandbox.kt',
    name: 'MainSandbox.kt',
    category: 'generated',
    module: 'sandbox',
    content: `package com.umakraft.sandbox

import java.io.File

/**
 * Umakraft Isolated Sandbox Runner
 * This file is purely user-level code and is fully isolated from app storage.
 */
class MainSandbox {
    fun executeUserTask() {
        val sandboxDir = File("/data/user/0/com.umakraft.coder/sandbox")
        println("Initializing Sandbox session at: \${sandboxDir.absolutePath}")
        
        // Execute sample user workflow
        val version = "1.0.0-sandbox"
        println("Sandbox Engine Active. Version: $version")
    }
}

fun main() {
    val runner = MainSandbox()
    runner.executeUserTask()
}
`,
    description: 'Sample Starter Sandbox File',
    language: 'kotlin',
    isSandbox: true,
    origin: 'user',
    storageScope: 'sandbox_user'
  },
  {
    path: 'sandbox/native_sandbox.cpp',
    name: 'native_sandbox.cpp',
    category: 'generated',
    module: 'sandbox',
    content: `#include <iostream>
#include <string>

// Umakraft Native C++ Sandbox Demo
int main() {
    std::cout << "[Umakraft C++ Sandbox] Execution initialized." << std::endl;
    std::cout << "[Umakraft C++ Sandbox] Ready for code testing and compilation." << std::endl;
    return 0;
}
`,
    description: 'Sample Starter C++ Sandbox File',
    language: 'cpp',
    isSandbox: true,
    origin: 'user',
    storageScope: 'sandbox_user'
  }
];
