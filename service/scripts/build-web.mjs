#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const webRoot = path.join(repoRoot, 'service', 'packages', 'web');
const viteBin = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');

if (!fs.existsSync(viteBin)) {
  console.error(`[build:web] vite not found at ${viteBin}`);
  console.error('[build:web] run npm install first; GitHub/npm prepare should install dev dependencies before this script runs.');
  process.exit(127);
}

const result = spawnSync(process.execPath, [viteBin, 'build'], {
  cwd: webRoot,
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
