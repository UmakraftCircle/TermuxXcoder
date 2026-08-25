/**
 * Umakraft Intelligent Multi-Language Code Auto-Formatter
 * Supports: Kotlin, Java, XML/AndroidManifest, JSON, TypeScript/JavaScript,
 * Gradle/KTS, Groovy, C/C++, Shell/Bash, YAML, Markdown, Properties
 */

export interface FormatResult {
  formatted: string;
  changed: boolean;
  stats: {
    originalLines: number;
    formattedLines: number;
    language: string;
    description: string;
  };
}

export function formatCode(
  code: string,
  language?: string,
  filename?: string,
  indentSize = 4
): FormatResult {
  if (!code || code.trim() === '') {
    return {
      formatted: code,
      changed: false,
      stats: {
        originalLines: 0,
        formattedLines: 0,
        language: 'plain',
        description: 'Empty content'
      }
    };
  }

  const detectedLang = detectLanguage(language, filename, code);
  const originalLines = code.split('\n').length;
  let formatted = code;

  try {
    switch (detectedLang) {
      case 'json':
        formatted = formatJson(code, indentSize);
        break;
      case 'xml':
        formatted = formatXml(code, indentSize);
        break;
      case 'kotlin':
      case 'java':
      case 'groovy':
      case 'gradle':
      case 'cpp':
      case 'c':
      case 'csharp':
        formatted = formatCStyleLanguage(code, indentSize);
        break;
      case 'typescript':
      case 'javascript':
      case 'tsx':
      case 'jsx':
        formatted = formatJavaScriptTypeScript(code, indentSize);
        break;
      case 'shell':
      case 'bash':
        formatted = formatShellScript(code, indentSize);
        break;
      case 'markdown':
        formatted = formatMarkdown(code);
        break;
      case 'yaml':
      case 'properties':
      default:
        formatted = formatGeneric(code, indentSize);
        break;
    }
  } catch (err) {
    console.warn('Auto-formatter fallback applied:', err);
    formatted = formatGeneric(code, indentSize);
  }

  // Ensure trailing newline
  if (!formatted.endsWith('\n')) {
    formatted += '\n';
  }

  const changed = formatted !== code;
  const formattedLines = formatted.split('\n').length;

  return {
    formatted,
    changed,
    stats: {
      originalLines,
      formattedLines,
      language: detectedLang,
      description: getLanguageDisplayName(detectedLang)
    }
  };
}

function detectLanguage(language?: string, filename?: string, code?: string): string {
  const lang = (language || '').toLowerCase().trim();
  const file = (filename || '').toLowerCase().trim();

  if (lang === 'kotlin' || lang === 'kt' || lang === 'kts' || file.endsWith('.kt') || file.endsWith('.kts')) return 'kotlin';
  if (lang === 'java' || file.endsWith('.java')) return 'java';
  if (lang === 'xml' || file.endsWith('.xml') || file.endsWith('.axml')) return 'xml';
  if (lang === 'json' || file.endsWith('.json')) return 'json';
  if (lang === 'gradle' || file.endsWith('.gradle') || file.endsWith('.gradle.kts')) return 'gradle';
  if (lang === 'groovy' || file.endsWith('.groovy')) return 'groovy';
  if (lang === 'typescript' || lang === 'ts' || file.endsWith('.ts')) return 'typescript';
  if (lang === 'tsx' || file.endsWith('.tsx')) return 'tsx';
  if (lang === 'javascript' || lang === 'js' || file.endsWith('.js')) return 'javascript';
  if (lang === 'jsx' || file.endsWith('.jsx')) return 'jsx';
  if (lang === 'c' || lang === 'cpp' || file.endsWith('.c') || file.endsWith('.cpp') || file.endsWith('.h') || file.endsWith('.hpp')) return 'cpp';
  if (lang === 'bash' || lang === 'sh' || lang === 'shell' || file.endsWith('.sh') || file.endsWith('.bash')) return 'shell';
  if (lang === 'yaml' || lang === 'yml' || file.endsWith('.yaml') || file.endsWith('.yml')) return 'yaml';
  if (lang === 'markdown' || lang === 'md' || file.endsWith('.md')) return 'markdown';
  if (file.endsWith('.properties') || file.endsWith('.pro')) return 'properties';

  // Heuristic inspection from content
  const firstLines = code ? code.slice(0, 400).trim() : '';
  if (firstLines.startsWith('{') || firstLines.startsWith('[')) return 'json';
  if (firstLines.startsWith('<?xml') || firstLines.startsWith('<')) return 'xml';
  if (firstLines.includes('package ') || firstLines.includes('import ') || firstLines.includes('fun ') || firstLines.includes('val ') || firstLines.includes('var ')) return 'kotlin';
  if (firstLines.includes('#!/bin/') || firstLines.includes('#!/usr/bin/env bash')) return 'shell';

  return 'generic';
}

function getLanguageDisplayName(lang: string): string {
  const map: Record<string, string> = {
    kotlin: 'Kotlin / KTS',
    java: 'Java',
    xml: 'Android XML / Manifest',
    json: 'JSON',
    gradle: 'Gradle Groovy/KTS',
    groovy: 'Groovy',
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    tsx: 'TypeScript JSX',
    jsx: 'React JSX',
    cpp: 'C/C++',
    shell: 'Shell Script (Bash)',
    yaml: 'YAML',
    markdown: 'Markdown Document',
    properties: 'Properties File',
    generic: 'Code Formatter'
  };
  return map[lang] || 'Code Formatter';
}

/**
 * JSON Formatter
 */
function formatJson(code: string, indentSize: number): string {
  try {
    const parsed = JSON.parse(code);
    return JSON.stringify(parsed, null, indentSize);
  } catch {
    // If invalid JSON (e.g. trailing commas, comments), use bracket-indenting fallback
    return formatCStyleLanguage(code, indentSize);
  }
}

/**
 * XML / Android Layout / Manifest Formatter
 */
function formatXml(code: string, indentSize: number): string {
  const indentStr = ' '.repeat(indentSize);
  let formatted = '';
  let indent = 0;

  // Clean existing whitespace between tags
  const cleanXml = code
    .replace(/>\s*</g, '>\n<')
    .replace(/\r\n/g, '\n')
    .trim();

  const lines = cleanXml.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // XML Declaration or comments
    if (rawLine.startsWith('<?xml') || rawLine.startsWith('<!--') || rawLine.startsWith('<!DOCTYPE')) {
      formatted += `${rawLine}\n`;
      continue;
    }

    // Closing tag </tag>
    if (rawLine.startsWith('</')) {
      indent = Math.max(0, indent - 1);
      formatted += `${indentStr.repeat(indent)}${rawLine}\n`;
      continue;
    }

    // Self-closing tag <tag ... />
    if (rawLine.endsWith('/>')) {
      formatted += `${indentStr.repeat(indent)}${rawLine}\n`;
      continue;
    }

    // Opening and closing on the same line <tag>text</tag>
    if (/<([^\s>/]+)[^>]*>.*<\/\1>/.test(rawLine)) {
      formatted += `${indentStr.repeat(indent)}${rawLine}\n`;
      continue;
    }

    // Opening tag <tag ...>
    if (rawLine.startsWith('<') && !rawLine.startsWith('</')) {
      formatted += `${indentStr.repeat(indent)}${rawLine}\n`;
      indent++;
      continue;
    }

    // Text content or attributes on new lines
    formatted += `${indentStr.repeat(indent)}${rawLine}\n`;
  }

  return formatted.trim();
}

/**
 * C-Style Formatter (Kotlin, Java, Groovy, C++, Gradle, etc.)
 */
function formatCStyleLanguage(code: string, indentSize: number): string {
  const indentStr = ' '.repeat(indentSize);
  const rawLines = code.replace(/\r\n/g, '\n').split('\n');
  const resultLines: string[] = [];

  let indentLevel = 0;
  let inBlockComment = false;
  let consecutiveBlankLines = 0;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();

    // Limit consecutive empty lines to 1
    if (line === '') {
      consecutiveBlankLines++;
      if (consecutiveBlankLines <= 1 && resultLines.length > 0) {
        resultLines.push('');
      }
      continue;
    }
    consecutiveBlankLines = 0;

    // Handle multiline comments
    if (inBlockComment) {
      resultLines.push(`${indentStr.repeat(indentLevel)} ${line}`);
      if (line.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (line.startsWith('/*')) {
      if (!line.includes('*/')) {
        inBlockComment = true;
      }
      resultLines.push(`${indentStr.repeat(indentLevel)}${line}`);
      continue;
    }

    // Single-line comment
    if (line.startsWith('//')) {
      resultLines.push(`${indentStr.repeat(indentLevel)}${line}`);
      continue;
    }

    // Normalize spacing around common tokens & operators when safe
    line = normalizeCStyleSpacing(line);

    // Count open and close brackets on this line
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;

    // If line starts with a closing brace, dedent before outputting
    if (line.startsWith('}') || line.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
      resultLines.push(`${indentStr.repeat(indentLevel)}${line}`);
      indentLevel = Math.max(0, indentLevel + openBraces - (closeBraces - 1));
    } else {
      resultLines.push(`${indentStr.repeat(indentLevel)}${line}`);
      indentLevel = Math.max(0, indentLevel + openBraces - closeBraces);
    }
  }

  return resultLines.join('\n');
}

/**
 * TypeScript / JavaScript Formatter
 */
function formatJavaScriptTypeScript(code: string, indentSize: number): string {
  return formatCStyleLanguage(code, indentSize);
}

/**
 * Shell Script Formatter
 */
function formatShellScript(code: string, indentSize: number): string {
  const indentStr = ' '.repeat(indentSize);
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  const result: string[] = [];
  let indent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      result.push('');
      continue;
    }

    // Dedent for fi, done, esac, '}'
    if (/^(fi|done|esac|\})\b/.test(line)) {
      indent = Math.max(0, indent - 1);
    } else if (/^(elif|else)\b/.test(line)) {
      indent = Math.max(0, indent - 1);
    }

    result.push(`${indentStr.repeat(indent)}${line}`);

    // Indent after then, do, case, '{', elif, else
    if (/\b(then|do)\s*$/.test(line) || /\{$/.test(line) || /^(elif|else)\b/.test(line) || /^case\s+.+\s+in$/.test(line)) {
      indent++;
    }
  }

  return result.join('\n');
}

/**
 * Markdown Formatter
 */
function formatMarkdown(code: string): string {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let blankCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(raw);
      blankCount = 0;
      continue;
    }

    if (inCodeBlock) {
      result.push(raw);
      continue;
    }

    if (trimmed === '') {
      blankCount++;
      if (blankCount <= 1 && result.length > 0) {
        result.push('');
      }
      continue;
    }
    blankCount = 0;

    // Format heading spacing (ensure space after #)
    let processed = raw;
    const headingMatch = raw.match(/^(#{1,6})([^\s#].*)$/);
    if (headingMatch) {
      processed = `${headingMatch[1]} ${headingMatch[2]}`;
    }

    // Clean trailing spaces
    processed = processed.replace(/\s+$/, '');
    result.push(processed);
  }

  return result.join('\n');
}

/**
 * Generic Fallback Formatter
 */
function formatGeneric(code: string, indentSize: number): string {
  const indentStr = ' '.repeat(indentSize);
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  const result: string[] = [];
  let indent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      result.push('');
      continue;
    }

    const openCount = (line.match(/[\{\[\(]/g) || []).length;
    const closeCount = (line.match(/[\}\]\)]/g) || []).length;

    if (line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) {
      indent = Math.max(0, indent - 1);
      result.push(`${indentStr.repeat(indent)}${line}`);
      indent = Math.max(0, indent + openCount - (closeCount - 1));
    } else {
      result.push(`${indentStr.repeat(indent)}${line}`);
      indent = Math.max(0, indent + openCount - closeCount);
    }
  }

  return result.join('\n');
}

/**
 * Safe spacing normalization helper for C-family languages
 */
function normalizeCStyleSpacing(line: string): string {
  // If string literal contains complex content, avoid aggressive replacement
  if (line.includes('"') || line.includes("'")) {
    return line;
  }

  let l = line;
  // Space after commas (e.g. `a,b` -> `a, b`)
  l = l.replace(/,([^\s\n])/g, ', $1');

  // Space before opening brace `if(x){` -> `if(x) {`
  l = l.replace(/([^\s])\{$/g, '$1 {');

  // Space for control structures: `if(`, `for(`, `while(`, `catch(` -> `if (`, `for (`, etc.
  l = l.replace(/\b(if|for|while|catch|when)\(/g, '$1 (');

  return l;
}
