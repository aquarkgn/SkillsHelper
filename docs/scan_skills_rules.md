# 技能扫描规则（Scan Rules）

> 本文档定义 HuHaa-MySkills 的技能扫描规范，是稳定的工程规则，供扫描器（`packages/scanner`）与服务端（`packages/server`）遵循。
> 版本：v3.0 · 上次更新：2026-07-01

设计参考开源项目 **Pearcleaner**（macOS 清理工具，Swift/SwiftUI）的「软件扫描逻辑」与「图标获取展示」，在 Node.js + Fastify + React 架构下等价落地。

---

## R1 扫描根目录

- 支持多个技能根目录：`roots: string[]`。
- `~` 展开为 `$HOME`。
- 每个 root 必须存在，否则返回 400。
- glob 返回精确且无重复的文件列表。

## R2 目录名称大小写不敏感 ⭐

- 技能目录可能命名为 `skills` / `Skills` / `SKILLS` / `sKiLLs`，扫描器接受所有变体。
- 按优先级返回第一个存在的目录。
- 文件名 `SKILL.md` 保持**大小写敏感**（`skill.md` 不匹配）。

## R3 文件匹配与递归扫描

- 使用 `fast-glob` 递归匹配 `**/SKILL.md`，文件名精确大小写。
- 每个文件仅读取一次；多个 root 命中同一文件时按 `filePath` 去重。
- 扫描采用分块并发（见 R7），但返回列表按路径字典序稳定排序，保证幂等。

## R4 Frontmatter 解析

- frontmatter 必须以 `---` 开始和结束；YAML 无效时返回 400。
- `name` / `description` 必填，缺失时返回 400。
- 其余字段缺失时用默认值或 null。

支持字段：

```yaml
---
name: string              # 必须
description: string       # 必须
category?: string
brand?: string            # 图标解析主要依据（如 cursor / vs-code / claude-code）
source?: string           # 图标解析次要依据
tier?: 'tool' | 'directory' | 'other'
tags?: string[]
icon?: string             # 可选：显式指定图标，优先级最高
                          #   - "app:com.todesktop.230313mzl4w4u92"（指定 Bundle ID）
                          #   - "emoji:🤖"（强制 emoji）
                          #   - "url:https://..."（远程/本地图标）
---
```

## R5 返回数据格式

```typescript
SkillItem {
  id, name, description, filePath,
  category?, brand?, tier?, tags?,
  iconUrl?,          // 真实图标端点，如 "/api/icons/cursor?size=64"；无真实图标时为空
  iconFallback?,     // emoji 兜底值，如 "🤖"
  createdAt?, updatedAt?
}

ScanResult {
  skills, total, limit, offset, roots, scannedAt, duration
}
```

排序：按 category 分组后按 name 字典序，同分类内 tier 优先。

---

## R6 真实工具/编辑器图标获取 ⭐

技能列表展示其所属工具/编辑器的**真实应用图标**，对标 Pearcleaner 的 `AppInfoUtils.fetchAppIcon(...)`。

### R6.1 品牌 → 应用映射表

维护 `brand/source → 候选 Bundle ID + 候选应用名` 的映射表（`packages/scanner/src/icon/brand-map.mjs`）。无对应 GUI 应用的品牌（如 `hermes`、`mcp`）按 R6.5 回退 emoji。

### R6.2 应用定位

按优先级定位 `.app`：

1. **Bundle ID 精确定位**（最快最准）：`mdfind "kMDItemCFBundleIdentifier == '<bundleId>'"`
2. **应用名扫描**：遍历 `/Applications`、`~/Applications`、`/System/Applications`，`.app` 目录名大小写不敏感匹配
3. 命中多个时取修改时间最新者

### R6.3 图标提取（Node.js 等价 `NSWorkspace.icon(forFile:)`）

对定位到的 `<App>.app`：

1. 读 `Contents/Info.plist` 的 `CFBundleIconFile`（`plutil -extract CFBundleIconFile raw`）
2. 拼出 `Contents/Resources/<IconFile>.icns`（缺省兜底：目录下首个 `.icns`，优先含 `icon` 的文件）
3. 用系统内置 `sips` 转 PNG：
   ```bash
   sips -s format png -Z 64 "<icns>" --out "<cachePng>"
   ```
   支持尺寸 `32 / 64 / 128` 三档。

### R6.4 图标缓存

- 缓存目录：`~/.config/huhaa-myskills/icon-cache/`（受 `HUHAA_HOME` / `XDG_CONFIG_HOME` 影响）
- 文件名：`{appSlug}-{size}.png`
- **失效策略**：源 `.app` 的 mtime 新于缓存 PNG 时重建
- 进程内维护 `brand → appPath` / `brand:size → pngPath` 内存索引，避免重复 `sips`

### R6.5 图标优先级与降级链

```
1. frontmatter.icon 显式指定（app:/emoji:/url:）  —— 最高优先级
2. 真实应用图标（R6.1–R6.4 成功）
3. emoji 映射表（BRAND_ICONS / CATEGORY_ICONS）    —— 兜底降级
4. 通用占位图标                                     —— 最终兜底
```

找不到 app 时静默降级，不报错。

### R6.6 图标服务 API

```
GET /api/icons/:brand?size=64
  → 200 image/png   （命中真实图标，cache-control: public, max-age=86400）
  → 404 JSON { ok:false, fallback:true, brand }   （无对应 app，前端回退 emoji）
```

`size` 会被 clamp 到 `[32, 128]`，非法值回退 64。

---

## R7 扫描性能优化 ⭐

对标 Pearcleaner 的「并发扫描 + 两阶段加载 + Spotlight 元数据」。

### R7.1 两阶段加载

- **阶段 1（mini，快）**：返回轻量行（`id / name / description / category / brand / iconUrl / iconFallback`），前端立即渲染列表。
- **阶段 2（full，补全）**：后台补齐 `tags / links / preview / frontmatter 全字段 / 时间戳`，前端合并升级。

服务端通过 `stage=mini|full` 区分；前端先取 mini 快速渲染，再后台取 full 升级。图标 `<img loading="lazy">` 惰性加载。

### R7.2 并发分块扫描

- `fast-glob` 拿到文件列表后，用有界并发池（默认 = CPU 核数，范围 `[4, 16]`）并发解析。
- 每个 worker 顺序读文件、解析 frontmatter，避免一次性打开过多文件句柄。
- 结果合并后按路径字典序排序（保证 R3 幂等）。

### R7.3 Spotlight 元数据（可选）

- 文件时间戳优先用 `mdls -name kMDItemFSCreationDate -name kMDItemFSContentChangeDate`（批量，每批 50）。
- Spotlight 不可用时回退 `fs.stat` 的 mtime。
- 默认关闭，通过 `useSpotlight=1` 开启，失败静默回退。

---

## 系统依赖与兼容性

- 依赖 macOS 内置命令：`sips` / `mdfind` / `plutil` / `mdls`（均无需额外安装）。
- 非 macOS 环境：图标提取直接按 R6.5 降级为 emoji，扫描功能不受影响。
- `iconUrl` / `iconFallback` 为可选字段，旧客户端不受影响；无真实图标时行为等同 emoji 模式。

---

## 附录：v2.0 规则原文（存档）

改版前 v2.0 的 R1–R5 定义，语义在 v3.0 中沿用：

- **R1 扫描根目录**：支持多个技能根目录，`~` 展开为 `$HOME`，每个 root 必须存在（否则 400），glob 返回精确且无重复的文件列表。
- **R2 目录名称大小写不敏感**：`Skills` / `SKILLS` / `skills` / `sKiLLs` 均可匹配，按优先级返回第一个存在的目录；文件名 `SKILL.md` 大小写敏感。
- **R3 文件匹配与递归扫描**：`fast-glob` 递归匹配 `**/SKILL.md`，每个文件仅读一次，返回按路径字典序排序。
- **R4 Frontmatter 解析**：frontmatter 以 `---` 开始和结束；YAML 无效时 400；`name`/`description` 必填。
- **R5 返回数据格式**：`SkillItem { id, name, description, filePath, category?, brand?, tier?, tags?, createdAt?, updatedAt? }`；`ScanResult { skills, total, limit, offset, roots, scannedAt, duration }`。
