# Cockpit 对齐加固迭代计划

> 版本: v1.0
> 日期: 2026-07-08
> 状态: 待评审
> 评审框架: gstack `/plan-eng-review` 工程评审思维（scope challenge / 四维度评审 / ASCII 图 / opinionated recommendation / GSTACK REVIEW REPORT 收尾）
> 参考来源: `docs/调研报告/cockpit-tools 项目深度研究报告.md`
> 证据基准: commit 43f6c6f，本机代码实测

---

## 一、执行摘要

本计划把 `cockpit-tools` 调研报告里的五条工程加固方法论，落地到 HuHaa-MySkills 现有代码上。性质是**质量加固**，不是功能扩展：迭代完成后，扫描出来的技能列表、前端展示、API 响应与现在逐条一致，只是底层检测更可描述、品牌识别更抗脏、写盘更抗中断、通用能力更可复用。

四个加固方向（已与用户确认全面对齐）：

1. 工具扫描规则 registry 化 + 检测置信度分级
2. 品牌 logo provider fingerprint 加固
3. 写链路轻量加固（聚焦三处真实写，不上完整审计）
4. 通用能力模块公共化

一条红线（已与用户确认）：**产品核心功能不动**。

依赖策略（已与用户确认）：允许必要依赖，但本计划对每个候选依赖给出诚实判断，不因"允许"就硬引入。

---

## 二、背景与约束

### 2.1 核心功能边界（本次迭代不动）

HuHaa-MySkills 的核心功能链是 扫描 -> 聚合 -> 展示 -> 搜索/翻译，落在以下代码：

| 核心能力 | 代码位置 | 不动红线 |
|---|---|---|
| 三层扫描 | `packages/scanner/src/adapters/scan-tier.mjs` | 扫描产出 SkillItem 列表与现状逐条一致 |
| 技能解析 | `tier1-editor-skills.mjs` / `markdown-skill.mjs` 等 | SkillItem IR 字段结构不变 |
| 去重 | `packages/scanner/src/index.mjs` `dedupeSemantic` | 去重结果不变 |
| 聚合主入口 | `packages/scanner/src/index.mjs` `scan()` | API 契约不变 |
| 后端服务 | `packages/server/src/index.mjs` | HTTP 路由与响应格式不变 |
| 前端展示 | `packages/web/src/` | 用户可见行为不变 |
| 图标服务 | `packages/scanner/src/icon/` | `/api/icons/:brand` 行为不变 |
| 翻译 | `packages/server/src/translate-cache.mjs` 等 | 缓存命中语义不变 |
| CLI | `bin/huhaa-myskills.mjs` | 入口与参数不变 |

验收总则：每个阶段完成后，用同一台机器同一份技能目录扫描，产出与加固前做 diff，除新增的内部字段（如 `confidence`）外必须零差异。

### 2.2 参评框架性质

`cockpit-tools` 报告里的五条学习点，本质都是"如何让一个多工具配置工具长期可维护"的工程框架，不是功能特性。我们借鉴的是方法论，不是把 HuHaa-MySkills 往账号管理器方向改：

| Cockpit 学习点 | 性质 | 我们的对标动作 |
|---|---|---|
| 显式 registry + 置信度分级 | 工程加固 | 把散落检测规则抽成 ScannerDescriptor |
| provider fingerprint 回退 | 工程加固 | 补强已有 brand-map |
| 结构化编辑 + 原子写 + 审计 | 工程加固 | 见 2.3 诚实判断 |
| 通用能力公共模块化 | 工程加固 | atomic-write / path-hash / icon 抽公共模块 |

### 2.3 诚实判断：写回可靠性这一项价值打折

Cockpit 的"原子写 + 备份 + 审计"是为它的核心写操作服务：切号、写回账号配置到 SQLite/JSON/TOML，高频、高风险、要可回滚。

HuHaa-MySkills 本质是只读扫描 + 聚合展示。它真正有的写只有三处：

- 翻译缓存写盘 `packages/server/src/translate-cache.mjs:101` `flush()` -> `bin/lib/paths.mjs:51` `writeJson`
- 图标缓存写盘 `packages/scanner/src/icon/icon-extractor.mjs:167` 和 `:168`（png 与 remote.json 两处 `fs.writeFileSync`）
- sources.yaml 配置写（用户手动编辑为主，程序极少写）

实测证据：`bin/lib/paths.mjs:51-54` 的 `writeJson` 是裸 `fs.writeFileSync(file, JSON.stringify(obj, null, 2))`，无临时文件 + rename，进程中断会产生半截 JSON。这是真实缺陷，值得修。

但这些写频率低、风险低、损坏了重新扫描就恢复。照搬 Cockpit 完整写回加固链路（含审计日志、回读校验），投入产出比不高。

所以这一项的处理是：**对齐原则（原子写 + 备份），不照搬场景（不上完整审计链）**。聚焦三处真实写做轻量加固。这仍然是"全面对齐"原则下的实现，只是不硬塞一个价值不高的切号场景。

---

## 三、现状证据

### 3.1 扫描架构现状

```
scan()  packages/scanner/src/index.mjs:138
  |
  +-- 主路径: scanTierSkills()  scan-tier.mjs:23
  |     +-- scanTier1EditorSkills()  tier1-editor-skills.mjs:21
  |     |     读 EDITOR_TIER_1_CONFIGS  config/editor-tiers.mjs  (配置化雏形)
  |     |     但 glob/deep/ignore 硬编码在 scanEditorDirectory  :81-138
  |     +-- scanTier2UserSkills()  tier2-user-skills.mjs
  |     +-- scanTier3OtherSkills() tier3-other-skills.mjs  (默认关闭)
  |     +-- 合并 + 排序  scan-tier.mjs:67-80
  |
  +-- 降级路径: scanLegacy()  index.mjs:188
        走 ADAPTERS 字典  index.mjs:21-125  (与 tier 路径并行存在的第二套)
        读 sources.yaml 聚合多 source
```

关键问题：

- 检测规则半配置化。`EDITOR_TIER_1_CONFIGS` 是配置，但扫描启发式（glob 模式 `[sS][kK][iI][lL][lL][sS]`、`deep:10`、`ignore` 列表）硬编码在 `scanEditorDirectory`，见 `tier1-editor-skills.mjs:88-105`。
- 两套扫描路径并存。`scan()` 主路径走 tier，`scanLegacy()` 走 ADAPTERS 字典，二者对同一编辑器有重复定义（如 cursor 在 `index.mjs:68` 和 tier1 配置里各有一份）。
- 无置信度分级。目录不存在和目录存在但技能文件损坏，在 UI 上无法区分。

### 3.2 品牌图标现状

`packages/scanner/src/icon/brand-map.mjs` 已有较完整底子：

- `BRAND_APP_MAP` 静态枚举 19 个品牌，每项含 `bundleIds` / `appNames` / `aliases` / `officialIconUrls` / `remoteIconCache` / `emoji`，见 `brand-map.mjs:19-118`。
- `normalizeBrandKey()` 支持 alias 归一化，见 `:133`。
- `resolveBrandSpec()` 支持 bundle id 正则回退，见 `:145-154`。

`icon-extractor.mjs` 链路完整：`locateApp`（mdfind + /Applications 扫描）-> `extractIconPng`（sips 转 PNG + mtime 缓存失效）-> `readRemoteCache` -> `downloadOfficialIcon`（sha256 去重 + content-type 校验），见 `:324-362`。

缺口：

- 无 provider fingerprint。`resolveBrandSpec` 只做 alias 精确匹配和 bundle id 正则，没有 hostname suffix / 路径 prefix 多层匹配。Cockpit 的 `codexProviderPresets.ts` 有 `baseUrl` 规范化匹配，比我们多一层。
- 远程图标写盘非原子。`downloadOfficialIcon` 先写 png 再写 remote.json，见 `:167-176`，两步之间中断会留下无 meta 的 png 或无 png 的 meta。

### 3.3 写链路现状

| 写位置 | 代码 | 是否原子 | 风险 |
|---|---|---|---|
| 翻译缓存 | `translate-cache.mjs:101` flush -> `paths.mjs:51` writeJson | 否 | 中断产生半截 JSON，下次 load 走 readJson 容错丢弃，丢失未落盘条目 |
| 图标 png | `icon-extractor.mjs:167` | 否 | 中断产生半截 png，下次 extractIconPng 因 mtime 比对会重写，可自愈 |
| 图标 meta | `icon-extractor.mjs:168` | 否 | 中断产生半截 json，readRemoteCache 容错丢弃，触发重下载 |
| sources.yaml | 用户手编 | 不涉及 | 程序极少写 |

结论：三处写都非原子，但都有不同程度的自愈或容错兜底。原子写能消除半截文件，提升首次启动稳定性，价值真实但有限。

---

## 四、架构与数据流

### 4.1 现状数据流

```
+----------+     +-------------------+     +-----------------+
|  scan()  |---->| scanTierSkills()  |---->| tier1/2/3       |
| index.mjs|     | scan-tier.mjs     |     | adapters        |
+----------+     +-------------------+     +--------+--------+
     |                                              |
     | 降级                                          | SkillItem[]
     v                                              v
+------------+     +-----------+     +------------------+
| scanLegacy |---->| ADAPTERS  |---->| dedupeSemantic   |
+------------+     +-----------+     +------------------+
                                          |
                                          v
                                   +----------------+
                                   | server index   |
                                   | -> /api/*      |
                                   +----------------+
                                          |
                          +---------------+---------------+
                          v                               v
                   +-------------+                 +--------------+
                   | icon-extract|                 | translate-   |
                   | brand-map   |                 | cache        |
                   +-------------+                 +--------------+
```

### 4.2 目标数据流（加固后）

```
+----------+     +-----------------------+     +-----------------+
|  scan()  |---->| scanTierSkills()      |---->| tier1/2/3       |
| index.mjs|     | scan-tier.mjs         |     | adapters        |
+----------+     +-----------+-----------+     +--------+--------+
                             |                          |
                             | 读 registry              | SkillItem[]
                             v                          |  (+ confidence)
                   +-------------------+                |
                   | ScannerDescriptor |<---------------+
                   | registry (新)     |
                   | + confidence 判定 |
                   +-------------------+
                             |
                             v
                   +------------------+
                   | dedupeSemantic   |
                   +--------+---------+
                            |
                            v
                   +----------------+     +-------------------+
                   | server index   |---->| core/atomic-write |(新公共模块)
                   | -> /api/*      |     | core/path-hash    |
                   +----------------+     +-------------------+
                          |                        ^
                          |                        | 改写
             +------------+------------+           |
             v                         v           |
      +-------------+           +--------------+---+
      | icon-extract|           | translate-   |
      | brand-map   |           | cache        |
      | + provider  |           | (atomic flush|
      |   fingerprint|          |  )           |
      +-------------+           +--------------+
```

新增的公共能力（阶段零产出）：

```
packages/scanner/src/core/   (新目录)
  +-- atomic-write.mjs     atomicWriteJson / atomicWriteText (临时文件 + rename)
  +-- path-hash.mjs        从 hash/ 迁入
  +-- descriptor.mjs       ScannerDescriptor 类型与校验 (阶段一)
```

---

## 五、迭代阶段总览

```
阶段零  公共模块抽离        风险 低   无行为变化   纯搬位置 + 补 atomic-write
  |
  v
阶段一  扫描 registry 化    风险 中   最高价值     渐进迁移,逐 adapter 切换
        + 置信度分级
  |
  v
阶段二  品牌 logo 加固       风险 低   补强已有     provider fingerprint + 原子写
  |
  v
阶段三  写链路轻量加固       风险 低   价值有限但真 三处写改 atomic-write
  |
  v
阶段四  回归与文档           风险 无   收尾         全量 verify + 加固说明
```

每阶段独立可验证、可回滚，互不阻塞。任一阶段失败不影响已上线阶段。

---

## 六、阶段详述

### 阶段零：公共模块抽离

**目标**：把散落的通用能力收拢到 `packages/scanner/src/core/`，为后续阶段提供原子写和统一路径哈希入口。无行为变化。

**文件清单**：

| 文件 | 动作 | 说明 |
|---|---|---|
| `packages/scanner/src/core/atomic-write.mjs` | 新增 | `atomicWriteJson(file, obj)` / `atomicWriteText(file, text)`，临时文件 + `fs.renameSync` |
| `packages/scanner/src/core/path-hash.mjs` | 迁入 | 从 `hash/path-hash.mjs` 移入，原路径保留 re-export 兼容 |
| `packages/scanner/src/hash/path-hash.mjs` | 改为 re-export | `export * from '../core/path-hash.mjs'`，不破坏现有 import |
| `packages/scanner/test/atomic-write.test.mjs` | 新增 | 覆盖正常写、中断恢复、并发写 |

**改动点**：

1. 新增 `atomic-write.mjs`，实现：
   ```
   atomicWriteJson(file, obj)
     -> 写 file + '.tmp.' + process.pid
     -> fs.renameSync(tmp, file)   // 同文件系统原子
     -> 失败回滚: 删 tmp, 不动原文件
   ```
2. `hash/path-hash.mjs` 内容迁到 `core/path-hash.mjs`，原文件改为 re-export，保持 `import { pathHashCache } from '../hash/path-hash.mjs'` 等现有引用不变。
3. 不改任何调用方行为。

**验收标准**：

- `npm test`（scanner + server）全绿
- `node --test packages/scanner/test/atomic-write.test.mjs` 通过
- `grep -r "from.*hash/path-hash" packages/` 仍能解析（re-export 生效）
- 扫描产出 diff：零差异

**回滚预案**：删除 `core/` 目录，还原 `hash/path-hash.mjs` 原内容。`git revert` 单次提交即可。

**复杂度**：低。3 文件，0 新依赖（纯 Node fs）。

---

### 阶段一：扫描 registry 化 + 置信度分级

**目标**：把散落在 `tier1-editor-skills.mjs` 硬编码和 `index.mjs` ADAPTERS 里的检测规则，统一成显式 `ScannerDescriptor` registry，并引入四级检测置信度。对标 Cockpit 的 ToolDescriptor 思路和报告第二建议。

**文件清单**：

| 文件 | 动作 | 说明 |
|---|---|---|
| `packages/scanner/src/core/descriptor.mjs` | 新增 | ScannerDescriptor 类型 + registry 注册/查询 |
| `packages/scanner/src/config/editor-tiers.mjs` | 扩展 | EDITOR_TIER_1_CONFIGS 补全为完整 descriptor |
| `packages/scanner/src/adapters/tier1-editor-skills.mjs` | 重构 | scanEditorDirectory 读 descriptor 而非硬编码 |
| `packages/scanner/src/adapters/tier2-user-skills.mjs` | 重构 | 同上 |
| `packages/scanner/src/adapters/tier3-other-skills.mjs` | 重构 | 同上 |
| `packages/scanner/src/adapters/scan-tier.mjs` | 微调 | 注入 confidence 到 stats |
| `packages/scanner/src/types.d.ts` | 扩展 | SkillItem 加可选 `confidence` 字段 |
| `packages/scanner/test/descriptor.test.mjs` | 新增 | registry 查询、置信度判定 |
| `packages/scanner/test/tier-editor.test.mjs` | 扩展 | 断言 confidence 字段 + 产出 diff |

**ScannerDescriptor 设计**（参考 Cockpit ToolDescriptor）：

```
ScannerDescriptor {
  id: 'claude-code',
  tier: 'tier-1',
  brand: 'claude',
  label: 'Claude Code',
  detect: {
    globalPath: '~/.config/claude/skills',
    projectPath: '.claude/skills',        // 可选
    globPatterns: ['**/SKILL.md'],
    ignore: ['**/node_modules/**', '**/.git/**'],
    deep: 10,
  },
  parse: { adapter: 'markdown-skill', frontmatter: true },
  confidence: {
    L1: dirExists,
    L2: globMatchFound,
    L3: skillParsedValid,
    L4: metadataComplete,
  },
}
```

**置信度四级**（对标 Cockpit 报告第二建议）：

| 级别 | 含义 | 触发条件 |
|---|---|---|
| L1 | 只发现目录 | `detect.globalPath` 存在 |
| L2 | 目录 + 技能文件命中 | glob 匹配到至少 1 个 SKILL.md |
| L3 | 能解析出有效技能 | frontmatter 解析成功，name 非空 |
| L4 | 完整元数据 | name + description + category 齐全 |

`confidence` 作为可选字段注入 SkillItem，不破坏现有 IR（向后兼容）。UI 可选用，不强制。

**改动点**：

1. 新增 `descriptor.mjs`：定义类型、registry Map、`registerDescriptor()` / `getDescriptor(id)` / `listDescriptors()`。
2. 把 `editor-tiers.mjs` 现有配置补全为完整 descriptor（补 globPatterns/ignore/deep/confidence）。
3. `tier1-editor-skills.mjs` 的 `scanEditorDirectory` 把硬编码的 `:88-105` glob/deep/ignore 改为从 descriptor 读取。
4. tier2/tier3 同理迁移。
5. `scan-tier.mjs` 在 stats 里汇总各 tier 的 confidence 分布。
6. `types.d.ts` 给 SkillItem 加 `confidence?: 'L1'|'L2'|'L3'|'L4'`。

**渐进迁移降险**（应对复杂度超阈值，见第七节）：registry 先与现有硬编码并存，逐个 adapter 迁移。每迁移一个 adapter，跑全量 test + 扫描 diff，确认零差异再迁下一个。不一次性大改。

**验收标准**：

- `npm test` 全绿
- 扫描产出 diff：除新增 `confidence` 字段外零差异（用 `HUHAA_DEBUG` dump 两次结果做字段级比对）
- `descriptor.test.mjs` 覆盖：注册/查询/未注册 brand 回退
- `tier-editor.test.mjs` 断言：tier1 每个编辑器产出的 item 带 confidence

**回滚预案**：每个 adapter 迁移是独立提交，可逐个 revert。registry 文件删除不影响现有 adapter（它们仍能从 editor-tiers.mjs 读旧配置降级运行）。

**复杂度**：中。9 文件，触及核心扫描路径。这是本计划最高风险阶段，靠渐进迁移 + 扫描 diff 把关。

---

### 阶段二：品牌 logo provider fingerprint 加固

**目标**：给 `brand-map.mjs` 加 provider fingerprint 多层匹配，对标 Cockpit 的 `baseUrl` 规范化匹配 + 报告第三建议的可回退 fingerprint。同时把 `icon-extractor` 的远程图标写盘改原子写。

**文件清单**：

| 文件 | 动作 | 说明 |
|---|---|---|
| `packages/scanner/src/icon/brand-map.mjs` | 扩展 | 加 ProviderFingerprint + resolveByFingerprint() |
| `packages/scanner/src/icon/icon-extractor.mjs` | 改 | downloadOfficialIcon 改用 core/atomic-write |
| `packages/scanner/test/icon.test.mjs` | 扩展 | 覆盖 fingerprint 多层匹配 |

**ProviderFingerprint 设计**（对标 Cockpit provider preset）：

```
// 现有 BRAND_APP_MAP 每项可选加 fingerprints
claude: {
  bundleIds: [...],
  officialIconUrls: [...],
  fingerprints: [                    // 新增,多层匹配
    { hostnameSuffix: 'claude.ai' },
    { hostnameSuffix: 'anthropic.com' },
  ],
}
```

匹配层级（优先级从高到低）：

1. 精确 alias 匹配（现有 `normalizeBrandKey`）
2. bundle id 正则（现有 `resolveBrandSpec`）
3. hostname suffix 匹配（新增）
4. 路径 prefix 匹配（新增，可选）
5. 用户手动覆写（新增，读 `~/.config/huhaa-myskills/brand-overrides.json`）
6. 回退 custom（现有 null 行为）

新增 `resolveBrandByFingerprint(urlOrHost)`：输入 URL 或 hostname，按上述层级返回 brand key。供未来扩展（如从技能内引用的 URL 反推品牌）。

**改动点**：

1. `brand-map.mjs` 加 `fingerprints` 字段到需要的品牌项，加 `resolveBrandByFingerprint()` 函数。
2. `icon-extractor.mjs:167-176` 的两处 `fs.writeFileSync` 改用 `core/atomic-write.mjs` 的 `atomicWriteJson` / `atomicWriteBytes`（png 是二进制，atomic-write.mjs 补一个 `atomicWriteBytes`）。
3. 不改 `getIconForBrand` 对外签名。

**验收标准**：

- `npm test` 全绿，`icon.test.mjs` 覆盖 fingerprint 各层
- 现有 19 个品牌的图标解析结果 diff：零差异
- 新增 fingerprint 测试：`resolveBrandByFingerprint('https://claude.ai/foo')` 返回 `claude`
- 远程图标写盘中断模拟：不留半截文件（atomic-write.test.mjs 已覆盖底层，这里补集成断言）

**回滚预案**：`brand-map.mjs` 的 fingerprints 是新增可选字段，删除即回退到 alias 精确匹配。icon-extractor 的 atomic-write 改动可单独 revert。

**复杂度**：低。3 文件，补强性质，不碰核心扫描。

---

### 阶段三：写链路轻量加固

**目标**：把三处真实写改原子写 + 轻量备份。聚焦原则，不上完整审计。

**文件清单**：

| 文件 | 动作 | 说明 |
|---|---|---|
| `bin/lib/paths.mjs` | 改 | `writeJson` 改用 atomic-write（需跨包引用，见改动点） |
| `packages/server/src/translate-cache.mjs` | 微调 | flush 走新 writeJson，行为不变 |
| `packages/scanner/src/core/atomic-write.mjs` | 扩展 | 补 `atomicWriteBytes`（阶段二已需） |

**改动点**：

1. `paths.mjs:51` 的 `writeJson` 改为：写临时文件 -> rename。但 `paths.mjs` 在 `bin/lib/`，`atomic-write.mjs` 在 `packages/scanner/src/core/`，跨包引用需处理。两种方案：
   - 方案 A：把 `atomic-write.mjs` 提到 `bin/lib/atomic-write.mjs`（bin 是更底层公共位置，scanner 反过来引用 bin/lib，与 `translate-cache.mjs:9` 已引用 `bin/lib/paths.mjs` 的现有模式一致）。
   - 方案 B：scanner/core/atomic-write.mjs 保持，paths.mjs 自己实现一份原子写（重复代码）。
   - 推荐 A，与现有 `translate-cache.mjs -> bin/lib/paths.mjs` 的引用方向一致，不引入循环依赖。
2. translate-cache 的 flush 自动受益（它已调 writeJson），无需改。
3. 不加审计日志、不加回读校验（按 2.3 判断，价值不匹配）。

**验收标准**：

- `npm test` 全绿
- 翻译缓存写中断模拟：`translate-cache.json` 不留半截 JSON
- 翻译命中语义 diff：零差异（同 key 同结果）
- sources.yaml 程序写路径（若有）行为不变

**回滚预案**：`paths.mjs` writeJson 还原为裸 writeFileSync。单文件 revert。

**复杂度**：低。3 文件，改动集中在写盘函数。

---

### 阶段四：回归与文档

**目标**：全量验证 + 沉淀加固说明。

**文件清单**：

| 文件 | 动作 | 说明 |
|---|---|---|
| `docs/迭代计划/cockpit-对齐加固-完成说明.md` | 新增 | 实际改了什么、验证结果、已知限制 |
| `docs/scan_skills_rules.md` | 扩展 | 补 registry 和 confidence 说明 |

**验收标准**：

- `npm run verify`（build/verify.mjs）通过
- `npm run typecheck:web` 通过
- `npm run test:web` 通过
- `npm test` 通过
- 扫描产出与迭代前 diff：除 confidence 外零差异
- 完成说明文档含每阶段实际改动、验证命令输出、回滚记录

**复杂度**：无代码风险，纯收尾。

---

## 七、Step 0 Scope Challenge 自检

按 gstack `/plan-eng-review` Step 0 的六项检查逐条过。

### 7.1 复杂度检查（触发标注）

阶段一触及 9 文件，超过 8 文件阈值。按规则需 STOP 标注并 challenge。

挑战结论：**不缩减，但改渐进迁移**。理由：

- 这是必要的结构性重构（Beck 原则：make the change easy, then make the easy change）。registry 化是后续品牌/写回加固的地基，不可跳过。
- 不是 scope creep：每文件改动都是把硬编码搬进 descriptor，不引入新能力。
- 降险手段：registry 与现有硬编码并存，逐 adapter 迁移，每迁移一个跑全量 test + 扫描 diff，零差异才进下一个。把一次大重构拆成 N 次小提交。

其余阶段均低于阈值（阶段零 4 文件，阶段二 3 文件，阶段三 3 文件）。

### 7.2 完整性检查

AI 辅助下完整版本成本低。本计划按完整版本设计：

- 每阶段都配测试（不是只改主路径）
- 置信度四级全覆盖，不是只做 L1
- 原子写覆盖三处真实写，不是只做翻译缓存
- provider fingerprint 六层匹配，不是只做 hostname suffix

未走捷径。符合 boil the ocean 原则。

### 7.3 搜索检查

- **[Layer 1]** 原子写：Node fs.renameSync 同文件系统原子，是 tried-and-true，不自己造轮子。
- **[Layer 1]** path-hash MD5 去重：项目现有实现，复用。
- **[Layer 2]** registry 模式：Cockpit 的 ToolDescriptor 是新近流行的多工具配置范式，报告已证实有效。
- **[Layer 3]** 无 eureka。我们没有推翻常规做法的理由，老实对齐。

### 7.4 分发检查

不引入新 artifact 类型（无新 CLI binary / 容器 / 移动端）。现有 npm 发布 + GitHub Pages 流程不变。跳过。

### 7.5 TODOS 交叉引用

未发现 `TODOS.md`（gstack 的）。项目有 `docs/hermes_docs_project_plan.md` 项目规划，本计划与之不冲突，是并行加固轨道。

---

## 八、依赖引入说明

用户已确认"允许必要依赖"。但允许不等于必须。逐个诚实判断：

### 8.1 better-sqlite3（不建议引入）

Cockpit 用 `rusqlite` 是因为它要读写 VS Code 的 `state.vscdb`（SQLite 格式）。HuHaa-MySkills 扫描的是文件系统技能目录，**不读任何 SQLite**。

- 场景不匹配。
- better-sqlite3 是原生编译依赖，会增加 npm 安装时间和 CI 负担（需 prebuilt binary 或编译工具链）。
- 唯一可能的用途是未来持久化 confidence 状态，但当前 confidence 是扫描时实时计算，无需持久化。

**结论：不引入**。若未来真需要持久化状态再评估。

### 8.2 zod（可选，权衡 JSDoc 风格）

zod 可用于校验 ScannerDescriptor 和 SkillItem IR，防脏数据。

- 价值：运行时 schema 校验，比 JSDoc 类型更强。
- 代价：项目用 `.mjs` + JSDoc + `types.d.ts`（见 `packages/scanner/src/types.d.ts`），引入 zod 会和现有类型风格产生两套并存的维护负担。
- 替代：descriptor.mjs 里手写校验函数（validateDescriptor），成本更低，与现有风格一致。

**结论：阶段一先用手写校验函数**。若 descriptor 数量增长到 20+ 且脏数据频发，再引入 zod。这是可逆决策，先轻后重。

### 8.3 实际新增依赖

**零**。本计划全部用 Node 内置模块（fs / crypto / child_process）+ 现有依赖（fast-glob / yaml）。这是最稳的路径，符合"boring by default"。

---

## 九、风险与回滚总览

| 阶段 | 主要风险 | 影响 | 回滚成本 | 把控手段 |
|---|---|---|---|---|
| 零 | re-export 路径错 | import 解析失败 | 低（单 revert） | grep 验证现有 import |
| 一 | 改核心扫描路径，产出漂移 | 扫描结果变化 | 中（逐 adapter revert） | 渐进迁移 + 扫描 diff |
| 二 | fingerprint 误匹配 | 品牌识别错 | 低（删 fingerprints） | 19 品牌 diff + 新增测试 |
| 三 | rename 跨文件系统失败 | 写盘失败 | 低（还原 writeFileSync） | atomic-write 测试 + 同文件系统保证 |
| 四 | 文档与实际不符 | 误导 | 无 | 实测验证后写文档 |

跨文件系统 rename 风险补充：`HUHAA_HOME` 默认 `~/.config/huhaa-myskills`，临时文件与目标在同一目录，必同文件系统，rename 原子有效。若用户把 `HUHAA_HOME` 设到跨挂载点，rename 会失败，atomic-write.mjs 需 catch 并回退到直接写（保留原行为，不比现状更差）。

---

## 十、验证策略

### 10.1 验证命令（来自项目 package.json）

```
npm test                      # scanner + server Node test
npm run test:web              # web vitest
npm run typecheck:web         # web tsc --noEmit
npm run verify                # build/verify.mjs 综合校验
```

### 10.2 扫描产出 diff（核心功能不动红线）

每阶段前后各跑一次：

```
HUHAA_DEBUG=1 node bin/huhaa-myskills.mjs start   # 触发扫描
# dump 扫描结果到 json
# 用 jq 做字段级 diff（排除 confidence 新字段）
```

判定：除 `confidence` 外零差异。

### 10.3 真实 UI 验证

阶段一、二完成后，本地启动前端，确认技能列表、图标、分组、搜索、翻译与加固前一致。符合全局规则"前端功能报告完成前必须 UI 验证"。

---

## 十一、后续建议

1. **scanLegacy 双路径收敛**（阶段一后评估）：`index.mjs` 的 `scanLegacy` + `ADAPTERS` 与 tier 路径并行存在，是维护负担。但收敛涉及核心功能风险，建议阶段一 registry 化稳定后，单独评估是否把 legacy 也接到 registry，不在本计划内做。

2. **置信度 UI 化**（阶段一后）：`confidence` 字段已注入但 UI 未用。可在前端详情面板显示"检测置信度"，帮用户区分"确认安装"和"候选目录"。属功能增强，不在加固范围，单独立项。

3. **provider fingerprint 扩展**（阶段二后）：当前只覆盖有 URL 的品牌。未来若技能 frontmatter 带 `homepage` 字段，可用 fingerprint 自动归品牌。

4. **原子写回读校验**（视需求）：若未来写链路变高频或高风险（如支持用户编辑技能元数据回写），再补回读校验和审计。当前三处写不值得。

---

## 十二、已确认决策与待决项

### 已确认（用户拍板）

- 迭代范围：全面对齐 Cockpit 四方向
- 红线：核心功能不动
- 依赖策略：允许必要依赖（实际判断后零新增）
- 产出：本正式计划文档

### 待决（实施前需定）

- 阶段排期与时间预算（本计划未含工时估算，待用户定节奏）
- scanLegacy 是否在阶段一顺带收敛（建议否，见后续建议 1）
- zod 是否引入（建议否，见 8.2）

---

## GSTACK REVIEW REPORT

| 项 | 内容 |
|---|---|
| Runs | 代码实测：scan-tier.mjs / brand-map.mjs / icon-extractor.mjs / translate-cache.mjs / paths.mjs / tier1-editor-skills.mjs / index.mjs 全部 Read 核实；Cockpit 报告逐条对照 |
| Status | 计划文档产出完成，待用户评审 |
| Scope | 四加固方向 + 核心功能红线 + 零新增依赖 |
| Complexity | 阶段一 9 文件触发阈值，已改渐进迁移降险，不缩减 |
| Completeness | 完整版本，四级置信度 + 三处原子写 + 六层 fingerprint，无捷径 |
| Risk | 最高风险在阶段一核心扫描路径，靠扫描 diff 把关 |

Findings:

| # | 维度 | 发现 | 建议 |
|---|---|---|---|
| F1 | 架构 | scan() + scanLegacy() 双路径并存，同编辑器重复定义 | 阶段一后单独评估收敛，不在本计划内 |
| F2 | 代码质量 | writeJson 裸 writeFileSync，三处写非原子 | 阶段三 atomic-write 修复 |
| F3 | 测试 | descriptor/atomic-write 缺测试 | 阶段零、一补测试 |
| F4 | 性能 | 无性能回归风险，加固不增加热路径开销 | 无需额外动作 |

VERDICT: 计划可执行。最高风险阶段一已用渐进迁移 + 扫描 diff 双重把关。建议用户先确认排期，从阶段零（零风险）启动。

NO UNRESOLVED DECISIONS
