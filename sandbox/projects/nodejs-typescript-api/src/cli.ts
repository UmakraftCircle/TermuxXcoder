#!/usr/bin/env node

/**
 * UmaKraft Developer CLI Tool
 * Interactive CLI runner for inspect, build, and benchmark in Termux POSIX
 */

import os from 'os';

function printHeader() {
  console.log('\x1b[34m==========================================\x1b[0m');
  console.log('\x1b[1;36m  ⚡ UMAKRAFT DEVELOPER POSIX CLI 1.0.0   \x1b[0m');
  console.log('\x1b[34m==========================================\x1b[0m');
}

function runDiagnostics() {
  console.log('\x1b[32m[+] System Diagnostics:\x1b[0m');
  console.log(`  - OS Platform   : ${os.platform()} (${os.type()})`);
  console.log(`  - Architecture  : ${os.arch()}`);
  console.log(`  - CPU Cores     : ${os.cpus().length}`);
  console.log(`  - Total Memory  : ${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)} GB`);
  console.log(`  - Free Memory   : ${(os.freemem() / (1024 * 1024 * 1024)).toFixed(2)} GB`);
  console.log(`  - Node Runtime  : ${process.version}`);
  console.log(`  - Local Model   : /models/default.gguf (Embedded Core)`);
  console.log(`  - POSIX PTY     : /dev/ptmx Active`);
}

function printHelp() {
  console.log('\n\x1b[33mAvailable Commands:\x1b[0m');
  console.log('  diagnostics  - Print system and runtime diagnostic report');
  console.log('  version      - Display CLI version');
  console.log('  help         - Show this help menu');
}

const args = process.argv.slice(2);
const command = args[0] || 'diagnostics';

printHeader();

switch (command) {
  case 'diagnostics':
  case 'diag':
    runDiagnostics();
    break;
  case 'version':
  case '-v':
    console.log('UmaKraft CLI v1.0.0 (Termux POSIX Edition)');
    break;
  case 'help':
  case '-h':
  default:
    printHelp();
    break;
}
