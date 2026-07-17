/**
 * @file tier1-editor-skills.mjs
 * 扫描第1层：编辑器工具的全局和项目技能目录
 * 支持 22 个编辑器，大小写不敏感的 skills 目录
 */

import path from 'node:path';
import fs from 'node:fs';
import fg from 'fast-glob';
import { expandTilde, readFileSafe, parseFrontmatter, sha1Id } from '../utils.mjs';
import { EDITOR_TIER_1_CONFIGS } from '../config/editor-tiers.mjs';
import { getPathHash, pathHashCache } from '../hash/path-hash.mjs';
import { ensureRegistered, getDescriptor } from '../core/registry.mjs';
import { computeConfidence } from '../core/descriptor.mjs';

/**
 * 扫描第1层：编辑器工具的全局和项目技能目录
 *
 * @param {Object} options
 * @param {string} [options.projectRoot] - 项目根目录（用于扫描 .hermes/skills 等）
 * @param {Object} [options.limits] - { maxFiles, maxFileBytes }
 * @returns {Promise<{items: SkillItem[], pathHashes: Set<string>}>}
 */
export async function scanTier1EditorSkills(options = {}) {
  const { projectRoot, limits = {} } = options;
  const mergedLimits = {
    maxFiles: limits.maxFiles ?? 5000,
    maxFileBytes: limits.maxFileBytes ?? 1024 * 1024,
  };

  // 确保 descriptor registry 已初始化（渐进迁移：registry 与现有配置并存）
  ensureRegistered();

  const items = [];
  const pathHashes = new Set();
  let fileCount = 0;

  for (const editor of EDITOR_TIER_1_CONFIGS) {
    if (fileCount >= mergedLimits.maxFiles) break;

    const desc = getDescriptor(`tier1:${editor.brand}`);

    // 尝试全局路径
    const globalPath = expandTilde(editor.globalPath);
    const globalResult = await scanEditorDirectory(
      globalPath,
      editor,
      desc,
      mergedLimits,
      mergedLimits.maxFiles - fileCount
    );
    items.push(...globalResult.items);
    fileCount += globalResult.items.length;
    globalResult.items.forEach(item => {
      const hash = pathHashCache.getOrCompute(item.paths.abs);
      pathHashes.add(hash);
      item.pathHash = hash;
    });

    if (fileCount >= mergedLimits.maxFiles) break;

    // 尝试项目路径
    if (projectRoot) {
      const projectPath = path.join(projectRoot, editor.projectPath);
      const projectResult = await scanEditorDirectory(
        projectPath,
        editor,
        desc,
        mergedLimits,
        mergedLimits.maxFiles - fileCount
      );
      items.push(...projectResult.items);
      fileCount += projectResult.items.length;
      projectResult.items.forEach(item => {
        const hash = pathHashCache.getOrCompute(item.paths.abs);
        pathHashes.add(hash);
        item.pathHash = hash;
      });
    }
  }

  return { items, pathHashes };
}

/**
 * 扫描单个编辑器目录
 * 支持大小写不敏感的 skills 目录名和 SKILL.md / skill.md 文件
 * glob 模式 / ignore / deep 从 descriptor 读取（registry 化），desc 为 null 时回退原值
 *
 * @private
 */
async function scanEditorDirectory(basePath, editor, desc, limits, maxRemaining) {
  const items = [];

  // 从 descriptor 读检测规则，回退到原硬编码值（渐进迁移期防御）
  const relPatterns = desc?.detect?.globPatterns || [
    `**/[sS][kK][iI][lL][lL][sS]/**/[sS][kK][iI][lL][lL].[mM][dD]`,
    `**/SKILL.md`,
    `**/skill.md`,
  ];
  const ignore = desc?.detect?.ignore || ['**/node_modules/**', '**/.git/**', '**/dist/**'];
  const deep = desc?.detect?.deep ?? 10;

  // 置信度统计
  const dirExists = safeDirExists(basePath);
  let matchedFiles = 0;
  let parsedValid = 0;
  let metadataComplete = 0;

  try {
    const patterns = relPatterns.map(p => `${basePath}/${p}`);

    for (const pattern of patterns) {
      if (items.length >= maxRemaining) break;

      try {
        const matches = await fg(pattern, {
          absolute: true,
          onlyFiles: true,
          dot: true,
          followSymbolicLinks: true,
          deep,
          ignore,
        });

        const seen = new Set(items.map(i => i.paths.abs));

        for (const filePath of matches) {
          if (items.length >= maxRemaining || seen.has(filePath)) continue;
          seen.add(filePath);
          matchedFiles++;

          try {
            const skill = parseSkillFile({
              abs: filePath,
              source: 'tier1-editor',
              editor,
              limits,
            });
            if (skill) {
              skill.tierId = 'tier-1';
              skill.editorBrand = editor.brand;
              // 置信度统计：L3 解析有效（name 非空），L4 元数据完整（name+description）
              if (skill.name) parsedValid++;
              if (skill.name && skill.description) metadataComplete++;
              items.push(skill);
            }
          } catch (e) {
            console.warn(`[scanTier1] parse failed: ${filePath}`, e.message);
          }
        }
      } catch (e) {
        // glob 模式失败，继续下一个
      }
    }
  } catch (e) {
    // 目录不存在或其他错误，静默跳过

  }

  // 计算置信度并注入到每个 skill（可选字段，向后兼容）
  const confidence = computeConfidence({ dirExists, matchedFiles, parsedValid, metadataComplete });
  if (confidence) {
    for (const item of items) item.confidence = confidence;
  }

  return { items, confidence };
}

function safeDirExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

/**
 * 解析单个技能文件
 * @private
 */
function parseSkillFile({ abs, source, editor, limits }) {
  const { text, error } = readFileSafe(abs, limits.maxFileBytes);
  if (error) return null;

  const id = sha1Id(abs);
  const dirName = path.basename(path.dirname(abs));

  let frontmatter = {};
  let body = text;
  let parseError = null;

  // 简单的 frontmatter 解析
  if (text.startsWith('---\n')) {
    const endIdx = text.indexOf('\n---\n', 4);
    if (endIdx > 0) {
      const fm = text.slice(4, endIdx);
      try {
        frontmatter = parseYAML(fm);
        body = text.slice(endIdx + 5);
      } catch (e) {
        parseError = `Frontmatter parse error: ${e.message}`;
      }
    }
  }

  const name = frontmatter.name || dirName;
  const description = frontmatter.description || '';
  const category = frontmatter.category;
  const brand = frontmatter.brand || editor.brand;

  return {
    id,
    kind: 'skill',
    source,
    name,
    description,
    category,
    brand,
    editor: editor.name,
    paths: {
      abs,
      rootKind: 'home',
    },
    preview: makePreview(body),
    raw: body,
    updatedAt: new Date().toISOString(),
    parseError,
  };
}

/**
 * 极简 YAML 解析（不依赖外部库）
 * @private
 */
function parseYAML(yamlStr) {
  const obj = {};
  const lines = yamlStr.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx <= 0) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();

    // 去掉引号
    const unquoted = value.startsWith('"')
      ? value.slice(1, -1)
      : value.startsWith("'")
        ? value.slice(1, -1)
        : value;

    obj[key] = unquoted || null;
  }

  return obj;
}

/**
 * 生成预览文本
 * @private
 */
function makePreview(text, maxLen = 200) {
  const lines = text.split('\n').filter(l => l.trim());
  let preview = '';
  for (const line of lines) {
    if ((preview + line).length > maxLen) {
      preview += '...';
      break;
    }
    preview += (preview ? ' ' : '') + line;
  }
  return preview;
}
