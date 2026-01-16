#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import App from './App';
import { handleCli } from './cli';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);

// Handle --version or -v flag
if (args.length > 0 && (args[0] === '--version' || args[0] === '-v')) {
  try {
    // In ESM, we need to construct __dirname ourselves
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageJsonPath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    console.log(`ritual-tui v${packageJson.version}`);
  } catch (error) {
    console.log('ritual-tui (version unavailable)');
  }
  process.exit(0);
}

// Handle --help or -h flag
if (args.length > 0 && (args[0] === '--help' || args[0] === '-h')) {
  console.log(`
ritual-tui - A TUI app for daily task logging and time tracking

Usage:
  ritual              Launch the interactive TUI application
  ritual export       Export your data to sync with another machine
  ritual import       Import data from another machine
  ritual --version    Show version information
  ritual --help       Show this help message

Options:
  -v, --version       Show version information
  -h, --help          Show this help message

Once in the TUI:
  - Press ? to see keyboard shortcuts
  - Press Tab to switch between panes
  - Press q to quit
`);
  process.exit(0);
}

console.clear();

if (args.length > 0 && (args[0] === 'export' || args[0] === 'import')) {
  handleCli(args).catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  const app = render(<App />, { exitOnCtrlC: false });
  // Make the app instance globally accessible for clean exit
  (global as any).__inkApp = app;
}
