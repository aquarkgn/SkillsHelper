# Cockpit 对齐加固完成说明

> 版本: v1.0
> 日期: 2026-07-08
> 状态: 已完成全部四阶段，待提交
> 关联计划: `docs/迭代计划/cockpit-对齐加固-迭代计划.md`
> 证据基准: commit 43f6c6f 起始，本机代码实测

---

## 一、总览

按 `cockpit-tools` 深度调研报告的五条工程加固方法论，对 HuHaa-MySkills 现有代码做质量加固。性质是加固，不是功能扩展。红线是核心功能不动，实测扫描产出与加固前逐条零差异。

| 阶段 | 内容 | 风险 | 状态 |
|------|------|------|------|
| 零 | 公共模块抽离（atomic-write + path-hash 迁入 core/） | 低 | 完成 |
| 一 | 扫描 registry 化 + 置信度分级 | 中 | 完成 |
| 二 | 品牌 logo provider fingerprint 加固 | 低 | 完成 |
| 三 | 写链路轻量加固（原子写） | 低 | 完成 |
| 四 | 回归与文档收尾 | 无 | 完成 |

代码量：9 个已有文件修改 + 8 个新增文件，净增 323 行，删 152 行。零新增依赖。

---

## 二、各阶段实际改动

### 阶段零：公共模块抽离

| 文件 | 动作 | 说明 |
|------|------|------|
| `packages/scanner/src/core/atomic-write.mjs` | 新增（后改为 re-export） | 原子写工具，阶段三迁到 bin/lib，此处保留 re-export |
| `packages/scanner/src/core/path-hash.mjs` | 从 hash/ 迁入 | 实现不变 |
| `packages/scanner/src/hash/path-hash.mjs` | 改为 re-export | 保留 `getPathHash`/`PathHashCache`/`pathHashCache` 三导出，7 处现有引用未破坏 |
| `packages/scanner/test/atomic-write.test.mjs` | 新增 | 7 个测试 |

### 阶段一：扫描 registry 化 + 置信度分级

| 文件 | 动作 | 说明 |
|------|------|------|
| `packages/scanner/src/core/descriptor.mjs` | 新增 | ScannerDescriptor 类型 + registry + validateDescriptor + computeConfidence 四级 |
| `packages/scanner/src/core/registry.mjs` | 新增 | 从 editor-tiers.mjs 派生 26 个 descriptor 并注册 |
| `packages/scanner/src/adapters/tier1-editor-skills.mjs` | 重构 | scanEditorDirectory 从 descriptor 读 glob/ignore/deep + 置信度注入 |
| `packages/scanner/src/adapters/tier2-user-skills.mjs` | 重构 | 同上 |
| `packages/scanner/src/adapters/tier3-other-skills.mjs` | 重构 | 同上 |
| `packages/scanner/src/types.d.ts` | 扩展 | SkillItem 加 `confidence?: 'L1'\|'L2'\|'L3'\|'L4'` |
| `packages/scanner/test/descriptor.test.mjs` | 新增 | 12 个测试 |

### 阶段二：品牌 logo provider fingerprint 加固

| 文件 | 动作 | 说明 |
|------|------|------|
| `packages/scanner/src/icon/brand-map.mjs` | 扩展 | 9 个品牌加 `fingerprints`；新增 `extractHostname()` + `resolveBrandByFingerprint()` |
| `packages/scanner/src/icon/icon-extractor.mjs` | 改 | 远程图标写盘改用 atomicWriteBytes/atomicWriteText |
| `packages/scanner/test/icon.test.mjs` | 扩展 | 新增 6 个 fingerprint 测试 |

### 阶段三：写链路轻量加固

| 文件 | 动作 | 说明 |
|------|------|------|
| `bin/lib/atomic-write.mjs` | 新增 | 从 scanner/core 迁入，作为底层公共原子写模块 |
| `bin/lib/paths.mjs` | 改 | `writeJson` 改调 `atomicWriteJson`，消除裸 writeFileSync |
| `packages/scanner/src/core/atomic-write.mjs` | 改为 re-export | 实现迁到 bin/lib，scanner 包内引用不变 |

受益写点：翻译缓存（`translate-cache.mjs:106`）、state.json（`bin/huhaa-myskills.mjs:543`）、图标缓存（阶段二已改）。三处真实写全部原子化。

### 阶段四：回归与文档

| 文件 | 动作 | 说明 |
|------|------|------|
| `docs/迭代计划/cockpit-对齐加固-完成说明.md` | 新增 | 本文档 |
| `docs/scan_skills_rules.md` | 扩展 | 新增 R10 节（registry + confidence），R5 补 confidence/tierId/editorBrand 字段 |

---

## 三、验证结果

### 验证命令（来自项目 package.json）

```
npm test                      # scanner + server Node test
npm run test:web              # web vitest
npm run typecheck:web         # web tsc --noEmit
npm run verify                # build/verify.mjs 综合校验
```

### 实测结果

| 验证项 | 结果 |
|--------|------|
| 全量 test（scanner + server） | 82/82 通过 |
| test:web | 167/167 通过（20 个测试文件） |
| typecheck:web | 零错误 |
| verify（build + HTTP/API/static/package smoke） | PASS |
| 新增测试 | atomic-write 7 + descriptor 12 + fingerprint 6 = 25 个全过 |

### 扫描产出零差异验证（核心功能不动红线）

加固前后同机同目录扫描对比：

| 指标 | 加固前基线 | 加固后 | 差异 |
|------|-----------|--------|------|
| item 总数 | 265 | 265 | 零 |
| tierId 分布 | tier-1:243, tier-2:22 | tier-1:243, tier-2:22 | 零 |
| editorBrand 数 | 5 | 5 | 零 |
| pathHash 覆盖 | 265/265 有效 | 265/265 有效 | 零 |
| confidence 覆盖 | 无此字段 | 265/265（全 L4） | 新增可选字段，向后兼容 |

sample item 字段：除新增 `confidence` 外，其余字段与加固前完全一致。

### 阶段性验证记录

- 阶段零：re-export 后 7 处现有 import 解析正常，pathHash 计算结果与 core 原实现完全相同（同一引用断言）
- 阶段一：每迁一个 tier adapter 跑零差异验证，三个 tier 全迁后 265 items 不变，26 个 descriptor 正确派生
- 阶段二：现有 19 个品牌图标解析零差异，fingerprint 功能验证 `claude.ai`/`api.anthropic.com` 命中 claude，`unknown.com` 回退 null
- 阶段三：translate-cache 写盘原子性实测，不残留 tmp 文件、内容完整、readJson 正常解析

---

## 四、架构决策记录

### 决策 1：descriptor 只管检测，不管解析

原计划考虑顺带收拢三份重复的 `parseSkillFile`/`parseYAML`/`makePreview`。但发现它们与 `utils.mjs` 的 `parseFrontmatter`/`makePreview` 行为不同（简易 YAML vs 完整 YAML 库，截断长度 200 vs 600），收拢会改变解析行为、影响扫描产出，违反核心功能不动红线。

故 descriptor 只管"去哪扫、用什么 glob"，不管"怎么解析"。解析逻辑的 DRY 收拢留作后续建议单独评估。

### 决策 2：atomic-write 提到 bin/lib，scanner/core 改 re-export

采用计划方案 A。`bin/lib/` 是底层公共位置（paths.mjs/port.mjs），scanner 已有 `import ... from '../../../bin/lib/paths.mjs'` 的依赖（index.mjs:12）。把 atomic-write 提到 bin/lib 统一单一实现，scanner/core/atomic-write.mjs 改 re-export 保持包内引用不变。未引入新的跨包耦合方向。

### 决策 3：不上完整审计链

按计划 2.3 判断，HuHaa-MySkills 是只读扫描工具，三处真实写频率低风险低。阶段三只做原子写 + 失败回退，不上完整审计日志和回读校验。价值不匹配。

### 决策 4：零新增依赖

用户确认"允许必要依赖"，但实测后 better-sqlite3 场景不匹配（不读 SQLite），zod 与现有 JSDoc 风格冲突（手写 validateDescriptor 代替）。全计划用 Node 内置模块 + 现有依赖。

### 决策 5：provider fingerprint 保持 brand-map 纯函数

`resolveBrandByFingerprint` 不读文件，用户手动覆写由调用方注入 overrides 参数。保持 brand-map.mjs 纯数据/纯函数，便于测试。

---

## 五、已知限制

1. **confidence 当前未在 UI 展示**。字段已注入 SkillItem 但前端未消费。属功能增强，不在加固范围，单独立项。

2. **provider fingerprint 仅覆盖 9 个有明确域名的品牌**。无 officialIconPages 的品牌（hermes/gstack/mcp 等）未配 fingerprints，`resolveBrandByFingerprint` 对它们返回 null。这是预期行为，这些品牌本就无 URL 来源。

3. **scanLegacy 双路径仍并存**。`index.mjs` 的 scanLegacy + ADAPTERS 与 tier 路径并行存在，是维护负担。但收敛涉及核心功能风险，不在本次加固范围（见后续建议）。

4. **atomic-write 跨文件系统回退**。`HUHAA_HOME` 被设到跨挂载点时 rename 失败，回退为直接写（保留原行为，不比现状更差）。默认 `~/.config/huhaa-myskills` 不触发此情况。

5. **atomic-write.test.mjs 一处注释循环引用**。测试注释提"与 bin/lib/paths.mjs 原 writeJson 格式一致"，但 paths.writeJson 现已改调 atomicWriteJson。断言本身正确（格式确实一致），仅注释措辞略绕，不影响功能。

---

## 六、回滚预案

每阶段独立可回滚：

| 阶段 | 回滚方式 | 影响 |
|------|----------|------|
| 零 | 还原 hash/path-hash.mjs 原内容，删 core/path-hash.mjs | atomic-write 仍可独立工作 |
| 一 | 删 core/descriptor.mjs + core/registry.mjs，adapter 还原硬编码 | confidence 字段消失，扫描产出不变 |
| 二 | 删 brand-map fingerprints 字段和 resolveBrandByFingerprint | 回退到 alias 精确匹配 |
| 三 | paths.mjs writeJson 还原裸 writeFileSync | 写盘回到非原子 |
| 四 | 删完成说明，还原 scan_skills_rules.md | 无代码影响 |

最简单回滚：`git revert` 本次提交即可全部还原。

---

## 七、后续建议

1. **scanLegacy 双路径收敛**。阶段一 registry 化稳定后，可评估把 scanLegacy 也接到 registry，消除 index.mjs 的 ADAPTERS 重复定义。涉及核心功能，需单独验证。

2. **confidence UI 化**。前端详情面板显示"检测置信度"，帮用户区分"确认安装"和"候选目录"。属功能增强。

3. **provider fingerprint 扩展**。当前只覆盖有 URL 的品牌。未来若技能 frontmatter 带 `homepage` 字段，可用 fingerprint 自动归品牌。

4. **解析逻辑 DRY 收拢**。三份 `parseSkillFile`/`parseYAML`/`makePreview` 重复，可统一到 `utils.mjs` 的 `parseFrontmatter`/`makePreview`。但会改变解析行为（简易 YAML -> 完整 YAML），需单独评估产出影响。

5. **原子写回读校验**。若未来写链路变高频或高风险（如支持用户编辑技能元数据回写），再补回读校验和审计。当前三处写不值得。

---

## 八、核心功能不动确认

按用户红线，本次加固不动产品核心功能链（扫描-聚合-展示-搜索翻译）。实测确认：

- 扫描产出 265 items 与基线逐条一致
- SkillItem IR 结构不变（仅新增可选 confidence 字段）
- API 契约不变（`/api/icons/:brand` 等行为不变）
- CLI 入口不变
- 前端用户可见行为不变（167 个 web 测试全过）

加固只提升内部质量：检测规则显式化、品牌识别更抗脏、写盘更抗中断、通用能力更可复用。

---

## GSTACK REVIEW REPORT

| 项 | 内容 |
|---|---|
| Runs | 代码实测：4 阶段全部实现并验证，25 个新测试 + 82 全量 + 167 web + verify 全过 |
| Status | 全部四阶段完成，待提交 |
| Scope | 四加固方向 + 核心功能红线 + 零新增依赖，全部达成 |
| Complexity | 阶段一 9 文件触发阈值，已用渐进迁移降险，实测零差异 |
| Completeness | 完整版本，四级置信度 + 三处原子写 + 9 品牌 fingerprint，无捷径 |
| Risk | 最高风险阶段一已通过扫描 diff 把关，无回归 |

VERDICT: 加固完成可交付。扫描产出零差异，核心功能不动。建议提交后进入后续建议 1（scanLegacy 收敛）的单独评估。

NO UNRESOLVED DECISIONS
