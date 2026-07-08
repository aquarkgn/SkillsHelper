/**
 * @file atomic-write.mjs
 * 原子写工具：临时文件 + rename，保证进程中断不产生半截文件。
 *
 * 对齐 cockpit-tools 报告的"结构化编辑 + 原子写回"原则。
 * HuHaa-MySkills 是只读扫描工具，真实写只有三处（翻译缓存、图标缓存、
 * state.json），频率低风险低，这里只提供原子写 + 失败回退，不上
 * 完整审计链（价值不匹配，见迭代计划 2.3）。
 *
 * rename 在同文件系统内原子有效。临时文件与目标文件在同一目录，
 * 必同文件系统。若目标路径被设到跨挂载点导致 rename 失败，
 * 回退为直接写（保留原行为，不比现状更差）。
 *
 * 2026-07 阶段三：从 packages/scanner/src/core/atomic-write.mjs 提到 bin/lib，
 * 作为底层公共模块。scanner/src/core/atomic-write.mjs 改为 re-export，保持
 * 现有 scanner 包内引用不变。paths.mjs 的 writeJson 改调本模块。
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * 原子写文本文件。
 * @param {string} file - 目标文件绝对路径
 * @param {string} content - 文本内容
 * @param {string} [encoding='utf8']
 * @returns {void}
 */
export function atomicWriteText(file, content, encoding = 'utf8') {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${file}.tmp.${process.pid}`;
  try {
    fs.writeFileSync(tmp, content, encoding);
    fs.renameSync(tmp, file);
  } catch (e) {
    // 回退：删除可能残留的临时文件，避免堆积
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    // rename 失败（如跨文件系统）回退为直接写，保留原行为
    fs.writeFileSync(file, content, encoding);
  }
}

/**
 * 原子写二进制文件（图标 png 等）。
 * @param {string} file - 目标文件绝对路径
 * @param {Buffer} bytes - 二进制内容
 * @returns {void}
 */
export function atomicWriteBytes(file, bytes) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${file}.tmp.${process.pid}`;
  try {
    fs.writeFileSync(tmp, bytes);
    fs.renameSync(tmp, file);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    fs.writeFileSync(file, bytes);
  }
}

/**
 * 原子写 JSON 文件（pretty 格式，与原 writeJson 输出一致）。
 * @param {string} file - 目标文件绝对路径
 * @param {unknown} obj - 可序列化对象
 * @param {number} [space=2] - JSON 缩进
 * @returns {void}
 */
export function atomicWriteJson(file, obj, space = 2) {
  atomicWriteText(file, JSON.stringify(obj, null, space));
}
