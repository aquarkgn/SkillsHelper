# 技能扫描规则（Scan Rules）

> 本文档定义 HuHaa-MySkills 的技能扫描规范，是稳定的工程规则，供扫描器（`packages/scanner`）与服务端（`packages/server`）遵循。
> 版本：v4.0 · 上次更新：2026-07-02

设计参考开源项目 **Pearcleaner**（macOS 清理工具，Swift/SwiftUI）的「软件扫描逻辑」与「图标获取展示」，在 Node.js + Fastify + React 架构下等价落地。

---

## R0 扫描优先级策略 ⭐⭐⭐

扫描器按以下**三层优先级**递进扫描技能。优先级高的层级命中的技能路径不能与低优先级层级重复，使用 MD5 哈希值标记技能路径实现去重。

### 第1层：编辑器工具全局和项目目录（最高优先级）

定位以下20+编辑器工具的技能/工作流目录，按以下优先级尝试：

#### 编辑器工具清单

| 排序 | 编辑器工具 | 全局路径 | 项目路径 | 品牌标识 |
|------|-----------|--------|--------|---------|
| 1 | **Hermes** | `~/.hermes/skills` | `.hermes/skills` | `hermes` |
| 2 | **Claude** | `~/.claude/skills` | `.claude/skills` | `claude` |
| 3 | **Cursor** | `~/.cursor/skills` | `.cursor/skills` | `cursor` |
| 4 | **VSCode** | `~/.vscode/skills` | `.vscode/skills` | `vscode` |
| 5 | **Codeium** | `~/.codeium/skills` | `.codeium/skills` | `codeium` |
| 6 | **Windsurf** | `~/.windsurf/skills` | `.windsurf/skills` | `windsurf` |
| 7 | **Continue** | `~/.continue/skills` | `.continue/skills` | `continue` |
| 8 | **Tauri** | `~/.tauri/skills` | `.tauri/skills` | `tauri` |
| 9 | **Trae** | `~/.trae/skills` | `.trae/skills` | `trae` |
| 10 | **Trae-CN** | `~/.trae-cn/skills` | `.trae-cn/skills` | `trae-cn` |
| 11 | **QoDer** | `~/.qoder/skills` | `.qoder/skills` | `qoder` |
| 12 | **Codex** | `~/.codex/skills` | `.codex/skills` | `codex` |
| 13 | **Vim** | `~/.vim/skills` | `.vim/skills` | `vim` |
| 14 | **Neovim** | `~/.config/nvim/skills` | `.nvim/skills` | `neovim` |
| 15 | **Emacs** | `~/.emacs.d/skills` | `.emacs.d/skills` | `emacs` |
| 16 | **Sublime** | `~/.config/sublime-text/skills` | `.sublime-text/skills` | `sublime` |
| 17 | **Jetbrains IDE** | `~/.config/JetBrains/skills` | `.jetbrains/skills` | `jetbrains` |
| 18 | **Nova** | `~/.nova/skills` | `.nova/skills` | `nova` |
| 19 | **Zed** | `~/.config/zed/skills` | `.zed/skills` | `zed` |
| 20 | **GitHub Copilot** | `~/.copilot/skills` | `.copilot/skills` | `copilot` |
| 21 | **Replit** | `~/.replit/skills` | `.replit/skills` | `replit` |
| 22 | **Glot.io** | `~/.glot/skills` | `.glot/skills` | `glot` |

**扫描规则**：
- 递归匹配 `**/SKILL.md` 或 `**/skill.md`（文件名**不区分大小写**）
- 目录名称：所有变体允许（`skills` / `Skills` / `SKILLS` 等，**不区分大小写**）
- **路径去重**：计算每个扫描到的 SKILL.md 的绝对路径 MD5 哈希值，存储在扫描结果中作为 `pathHash`

### 第2层：用户根目录技能库（中等优先级）

定位用户 HOME 目录下的技能库：

- 目录路径：`~/skills` 或任意大小写变体（`~/SKILLS` / `~/Skills` 等）
- **扫描规则**：递归匹配 `**/SKILL.md` 或 `**/skill.md`（文件名**不区分大小写**）
- **路径去重**：同样计算 MD5 哈希值，与第1层的 `pathHash` 集合对比，**如果已存在则跳过该技能**

### 第3层：其他所有位置（最低优先级）⭐

扫描范围外或通配位置，仅在开启专项扫描时激活：

- **扫描规则**：**仅** 递归匹配 `**/skill.md`（小写，**精确大小写敏感**）
- **路径去重**：计算 MD5 哈希值，与第1、2层的 `pathHash` 集合对比，**如果已存在则跳过该技能**
- **扫描范围**（可配置，默认仅包括标准系统路径）：
  - `/opt/` 及其子目录（自定义软件安装位置）
  - `/usr/local/` 及其子目录
  - `~/opt/` 及其子目录
  - 其他用户指定的自定义扫描路径

**激活条件**：
- 通过配置文件或 API 参数 `scanTier3=true` 显式启用
- 默认不扫描第3层，仅返回第1、2层结果

---

## R1 扫描根目录

- 支持多个技能根目录：`roots: string[]`，由 R0 的三层优先级策略动态生成。
- `~` 展开为 `$HOME`。
- 每个 root 必须存在，否则返回 400。
- glob 返回精确且无重复的文件列表。

---

## R2 目录和文件名大小写规则 ⭐

### 目录名称（所有层级都不敏感）

- 技能目录可能命名为 `skills` / `Skills` / `SKILLS` / `sKiLLs`，扫描器接受所有变体。
- 按存在性和优先级返回第一个匹配的目录。

### 文件名规则（按层级区分）

- **第1层（编辑器工具）& 第2层（用户根目录）**：`SKILL.md` 或 `skill.md` 均匹配（**不区分大小写**）
- **第3层（其他）**：仅匹配 `skill.md`（小写，**精确大小写敏感**）

---

## R3 文件匹配与递归扫描

- 使用 `fast-glob` 递归匹配对应层级的文件名规则（见 R2）。
- 每个文件仅读取一次；多个 root 命中同一文件时按 `filePath` 去重。
- 扫描采用分块并发（见 R7），但返回列表按路径字典序稳定排序，保证幂等。

---

## R4 Frontmatter 解析

- frontmatter 必须以 `---` 开始和结束；YAML 无效时返回 400。
- `name` / `description` 必填，缺失时返回 400。
- 其余字段缺失时用默认值或 null。

支持字段：

```yaml
---
name: string              # 必须
description: string       # 必填
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

---

## R5 返回数据格式

```typescript
SkillItem {
  id, name, description, filePath,
  pathHash,          // MD5(filePath)，用于去重和菜单分层显示
  tier,              // 'tier-1' | 'tier-2' | 'tier-3'，标记所属层级
  tierId,            // v4.0 同 tier，主路径字段名（tier 仅 scanLegacy 降级路径赋值）
  editorBrand,       // v4.0 Tier 1 编辑器品牌（cursor/claude/hermes 等），用于分组和图标
  confidence?,       // v0.4 检测置信度 'L1'|'L2'|'L3'|'L4'，见 R10
  category?, brand?, tier?, tags?,
  iconUrl?,          // 真实图标端点，如 "/api/icons/cursor?size=64"；无真实图标时为空
  iconFallback?,     // emoji 兜底值，如 "🤖"
  createdAt?, updatedAt?
}

ScanResult {
  skills,            // 按 tier 分组的技能列表
  total, limit, offset, roots, scannedAt, duration,
  pathHashes,        // 已扫描的所有 pathHash 集合，用于去重检测
  tier1Count, tier2Count, tier3Count  // 各层级技能数量统计
}
```

排序：按 tier（1 → 2 → 3）优先，同 tier 内按 category 分组后按 name 字典序。

---

## R6 真实工具/编辑器图标获取 ⭐

技能列表展示其所属工具/编辑器的**真实应用图标**，对标 Pearcleaner 的 `AppInfoUtils.fetchAppIcon(...)`。

### R6.1 品牌 → 应用映射表

维护 `brand/source → 候选 Bundle ID + 候选应用名` 的映射表（`packages/scanner/src/icon/brand-map.mjs`），包含 R0 列出的所有22个编辑器工具品牌。无对应 GUI 应用的品牌（如 `hermes`、`mcp`）按 R6.5 回退 emoji。

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

## R7 左侧菜单栏分层显示 ⭐⭐⭐

技能在左侧菜单栏中按 tier 分组显示，每个分组有独立的 icon 和分类标签。

### R7.1 菜单栏分组结构

前端左侧菜单栏采用**二级导航**结构：

```
左侧菜单栏
│
├─ 📦 编辑器工具技能（Tier 1）
│  ├─ Hermes
│  ├─ Claude
│  ├─ Cursor
│  └─ ... (其他编辑器工具)
│
├─ 👤 我的技能库（Tier 2）
│  ├─ skill-1
│  ├─ skill-2
│  └─ ...
│
└─ 🔍 其他技能（Tier 3）← 仅在 scanTier3=true 时显示
   ├─ skill-x
   ├─ skill-y
   └─ ...
```

### R7.2 分组 Icon 设计

| 分组 | 显示名称 | 建议 Icon | 说明 |
|-----|---------|---------|------|
| **Tier 1** | 编辑器工具技能 | `📦` 或 `⚙️` | 代表工具集合、生态环境 |
| **Tier 2** | 我的技能库 | `👤` 或 `⭐` | 代表个人、用户私有 |
| **Tier 3** | 其他技能 | `🔍` 或 `🌐` | 代表外部、探索发现 |

**优先选择**：使用 emoji（跨平台一致），或从设计系统中选择对应的 SVG icon。

### R7.3 展开/折叠行为

- **Tier 1 和 Tier 2**：默认展开（因为用户常用）
- **Tier 3**：默认折叠（降低视觉噪音，仅在需要时展开）
- 用户可手动点击分组 header 切换展开/折叠状态
- 展开/折叠状态持久化到本地存储（localStorage）

### R7.4 Tier 1 内部结构

Tier 1（编辑器工具技能）在菜单栏中进一步按**编辑器品牌分组**：

```
编辑器工具技能（Tier 1）
├─ 🔷 Hermes
│  ├─ skill-1
│  └─ skill-2
├─ 🔹 Claude
│  ├─ skill-3
│  └─ skill-4
├─ 🔶 Cursor
│  └─ skill-5
└─ ... (其他编辑器)
```

每个编辑器品牌使用 **R6 获取的真实应用 icon**（如 Cursor 的真实图标、VS Code 的真实图标）。

### R7.5 技能计数 Badge

菜单栏分组 header 显示该分组的技能计数：

```
编辑器工具技能（📦 125）
我的技能库（👤 42）
其他技能（🔍 18）
```

动态更新，基于 `ScanResult` 的 `tier1Count / tier2Count / tier3Count`。

---

## R8 扫描性能优化 ⭐

对标 Pearcleaner 的「并发扫描 + 两阶段加载 + Spotlight 元数据」。

### R8.1 两阶段加载

- **阶段 1（mini，快）**：返回轻量行（`id / name / description / category / brand / tier / iconUrl / iconFallback`），前端立即渲染列表。
- **阶段 2（full，补全）**：后台补齐 `tags / links / preview / frontmatter 全字段 / 时间戳 / pathHash`，前端合并升级。

服务端通过 `stage=mini|full` 区分；前端先取 mini 快速渲染，再后台取 full 升级。图标 `<img loading="lazy">` 惰性加载。

### R8.2 并发分块扫描

- `fast-glob` 拿到文件列表后，用有界并发池（默认 = CPU 核数，范围 `[4, 16]`）并发解析。
- 每个 worker 顺序读文件、解析 frontmatter，避免一次性打开过多文件句柄。
- 结果合并后按路径字典序排序（保证 R3 幂等）。

### R8.3 Spotlight 元数据（可选）

- 文件时间戳优先用 `mdls -name kMDItemFSCreationDate -name kMDItemFSContentChangeDate`（批量，每批 50）。
- Spotlight 不可用时回退 `fs.stat` 的 mtime。
- 默认关闭，通过 `useSpotlight=1` 开启，失败静默回退。

---

## R9 路径去重算法 ⭐⭐

确保第2、3层的技能不与第1层重复，防止同一技能在多个层级中出现。

### R9.1 MD5 哈希计算

```javascript
// 伪代码
const crypto = require('crypto');

function getPathHash(absolutePath) {
  // 规范化路径：展开 ~ 为 $HOME，统一为绝对路径，规范化 / 符号
  const normalized = path.resolve(path.expanduser(absolutePath));
  // 计算 MD5 哈希
  const hash = crypto.createHash('md5').update(normalized).digest('hex');
  return hash;
}
```

### R9.2 去重流程

```
Step 1: 扫描第1层（编辑器工具）
  → 收集所有 pathHash，存入集合 tier1Hashes
  → 返回所有第1层技能

Step 2: 扫描第2层（用户根目录）
  → 对每个扫描到的技能，计算 pathHash
  → 如果 pathHash ∈ tier1Hashes，则跳过（已在第1层存在）
  → 否则，加入 tier2Hashes，返回该技能

Step 3: 扫描第3层（其他，仅当 scanTier3=true）
  → 对每个扫描到的技能，计算 pathHash
  → 如果 pathHash ∈ (tier1Hashes ∪ tier2Hashes)，则跳过
  → 否则，返回该技能

Return: [tier1Skills, tier2Skills, tier3Skills] + { tier1Hashes, tier2Hashes }
```

### R9.3 缓存策略

- 扫描结果中包含 `pathHashes: { tier1: Set<string>, tier2: Set<string> }`，方便前端或后续请求快速判断。
- 内存中维护 LRU 缓存（最多 1000 条），避免重复计算同一路径的哈希值。

---

## R10 扫描规则 Registry 化与置信度分级 ⭐⭐

> v0.4 对标 cockpit-tools 报告第一、二建议落地。把散落在各 tier adapter 的检测规则抽成显式 `ScannerDescriptor` registry，并引入四级检测置信度。性质是工程加固，不改扫描产出。

### R10.1 ScannerDescriptor registry

检测规则（目录候选、glob 模式、ignore、deep、品牌 key）显式登记成 `ScannerDescriptor`，集中在 `packages/scanner/src/core/descriptor.mjs` 定义类型、`core/registry.mjs` 派生注册。

```
ScannerDescriptor {
  id: 'tier1:claude'              // 唯一标识
  tier: 'tier-1'                  // 所属层级
  brand: 'claude'                 // 品牌 key（用于图标映射）
  label: 'Claude'                 // 人类可读名称
  editorName: 'Claude'            // SkillItem.editor 字段值
  detect: {
    globalPath: '~/.claude/skills'
    projectPath: '.claude/skills'
    globPatterns: ['**/SKILL.md', ...]   // 相对模式，adapter 拼 basePath
    ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**']
    deep: 10
  }
}
```

registry 从 `config/editor-tiers.mjs` 现有配置派生，配置单一来源不变。tier1/2/3 adapter 改为从 registry 读 descriptor 的 glob/ignore/deep，替代硬编码。

注册总数：26 个 descriptor（22 tier1 + 1 tier2 + 3 tier3）。

### R10.2 检测置信度四级

对标 cockpit-tools 报告第二建议，把"只发现目录"与"已确认可解析完整技能"区分开，避免 UI 把候选目录误显示成已确认实例。

| 级别 | 含义 | 触发条件 |
|------|------|----------|
| **L1** | 只发现目录 | `detect.globalPath` 存在但未命中技能文件 |
| **L2** | 命中技能文件 | glob 匹配到至少 1 个 SKILL.md |
| **L3** | 解析出有效技能 | frontmatter 解析成功，name 非空 |
| **L4** | 完整元数据 | name + description 齐全 |

`confidence` 作为可选字段注入 SkillItem（向后兼容，不破坏 IR）。目录不存在时不注入（返回 null）。

### R10.3 渐进迁移原则

registry 与现有 `editor-tiers.mjs` 配置并存，adapter 逐个迁移。descriptor 只管"去哪扫、用什么 glob"，不管"怎么解析"（解析逻辑仍由各 adapter 自持，避免行为变化）。

---

## 系统依赖与兼容性

- 依赖 macOS 内置命令：`sips` / `mdfind` / `plutil` / `mdls`（均无需额外安装）。
- 非 macOS 环境：图标提取直接按 R6.5 降级为 emoji，扫描功能不受影响。
- `iconUrl` / `iconFallback` 为可选字段，旧客户端不受影响；无真实图标时行为等同 emoji 模式。

---

## 附录：v3.0 规则原文（存档）

改版前 v3.0 的 R1–R5 定义，语义已升级为 v4.0：

- **R1 扫描根目录**：支持多个技能根目录，`~` 展开为 `$HOME`，每个 root 必须存在（否则 400），glob 返回精确且无重复的文件列表。
- **R2 目录名称大小写不敏感**：`Skills` / `SKILLS` / `skills` / `sKiLLs` 均可匹配，按优先级返回第一个存在的目录；文件名 `SKILL.md` 大小写敏感。
- **R3 文件匹配与递归扫描**：`fast-glob` 递归匹配 `**/SKILL.md`，每个文件仅读一次，返回按路径字典序排序。
- **R4 Frontmatter 解析**：frontmatter 以 `---` 开始和结束；YAML 无效时 400；`name`/`description` 必填。
- **R5 返回数据格式**：`SkillItem { id, name, description, filePath, category?, brand?, tier?, tags?, createdAt?, updatedAt? }`；`ScanResult { skills, total, limit, offset, roots, scannedAt, duration }`。
