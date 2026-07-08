#!/usr/bin/env node
// 官网落地页构建/开发脚本，结构对齐 build/build-web.mjs。
// - 默认：vite build（生产构建，base='/HuHaa-MySkills/'）
// - --dev：vite（本地开发服务器，base='/'）
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'packages', 'site');
const viteBin = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');

if (!fs.existsSync(viteBin)) {
  console.error(`[build:site] vite not found at ${viteBin}`);
  console.error('[build:site] run npm install first.');
  process.exit(127);
}

const isDev = process.argv.includes('--dev');
const args = isDev ? [] : ['build'];

const result = spawnSync(process.execPath, [viteBin, ...args], {
  cwd: siteRoot,
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
