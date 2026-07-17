// 将 Node 扫描/翻译核心打包为目标平台的 Tauri sidecar。
// 输出位于 src-tauri/binaries/，是本机构建产物，禁止提交 Git。

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const tauriRoot = path.join(root, 'src-tauri');
const binariesDir = path.join(tauriRoot, 'binaries');
const triple = execFileSync('rustc', ['--print', 'host-tuple'], { encoding: 'utf8' }).trim();
const extension = process.platform === 'win32' ? '.exe' : '';
const outputPath = path.join(binariesDir, `skillhelper-core-${triple}${extension}`);
const bunTargetByTriple = {
  'aarch64-apple-darwin': 'bun-darwin-arm64',
  'x86_64-apple-darwin': 'bun-darwin-x64',
  'x86_64-unknown-linux-gnu': 'bun-linux-x64',
  'aarch64-unknown-linux-gnu': 'bun-linux-arm64',
  'x86_64-pc-windows-msvc': 'bun-windows-x64',
  'aarch64-pc-windows-msvc': 'bun-windows-arm64',
};
const bunTarget = bunTargetByTriple[triple];

if (!bunTarget) throw new Error(`当前 Rust target 不支持构建 SkillHelper sidecar：${triple}`);

fs.mkdirSync(binariesDir, { recursive: true });
fs.rmSync(outputPath, { force: true });
try {
  execFileSync('bun', [
    'build', 'scripts/desktop-core-sidecar.mjs', '--compile', '--minify',
    `--target=${bunTarget}`, `--outfile=${outputPath}`,
  ], { cwd: root, stdio: 'inherit' });
} catch (error) {
  throw new Error(`构建 SkillHelper sidecar 需要 Bun 1.2+：${error instanceof Error ? error.message : String(error)}`);
}
if (process.platform === 'darwin') {
  execFileSync('codesign', ['--sign', '-', outputPath], { stdio: 'inherit' });
}
fs.chmodSync(outputPath, 0o755);
console.log(`SkillHelper sidecar 已生成：${path.relative(root, outputPath)}`);
