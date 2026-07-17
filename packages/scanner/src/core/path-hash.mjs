/**
 * @file path-hash.mjs
 * 路径规范化 + MD5 哈希计算
 * 用于去重和菜单分层显示
 *
 * 2026-07 阶段零：从 hash/path-hash.mjs 迁入 core/。
 * 原 hash/path-hash.mjs 改为 re-export，保持现有 import 路径不变。
 */

import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';

/**
 * 规范化路径，然后计算 MD5 哈希
 * 规范化步骤：
 * 1. 展开 ~ 为 $HOME
 * 2. 转换为绝对路径（resolve 符号链接）
 * 3. 统一路径分隔符（使用 /）
 *
 * @param {string} filePath - 待处理路径
 * @returns {string} MD5 哈希值（32位十六进制）
 */
export function getPathHash(filePath) {
  // Step 1: 展开 ~
  const expanded = filePath.startsWith('~')
    ? path.join(os.homedir(), filePath.slice(1))
    : filePath;

  // Step 2: 转换为绝对路径
  const absolute = path.resolve(expanded);

  // Step 3: 统一分隔符（转为 POSIX 风格）
  const normalized = absolute.split(path.sep).join('/');

  // Step 4: 计算 MD5
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * LRU 缓存，避免重复计算哈希
 */
export class PathHashCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map(); // path -> hash
  }

  get(filePath) {
    return this.cache.get(filePath);
  }

  set(filePath, hash) {
    if (this.cache.size >= this.maxSize) {
      // 移除最旧的条目（第一个）
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(filePath, hash);
  }

  /**
   * 获取或计算哈希
   */
  getOrCompute(filePath) {
    let hash = this.cache.get(filePath);
    if (!hash) {
      hash = getPathHash(filePath);
      this.set(filePath, hash);
    }
    return hash;
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  get size() {
    return this.cache.size;
  }
}

export const pathHashCache = new PathHashCache();
