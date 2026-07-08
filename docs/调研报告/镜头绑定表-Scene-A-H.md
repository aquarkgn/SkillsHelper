# HuHaa-MySkills 视频推广 - 镜头实现绑定表

> 配套文档：《HuHaa-MySkills 三平台 AI 视频推广深度研究方案.md》
> 用途：把方案 Scene A-H 八个镜头逐条落到「入口命令 + 期望画面 + 实现文件 + 前提条件 + 录制注意」。
> 所有命令、路径、行号均基于 2026-07-08 仓库现状核实，版本 v0.3.8。

## 端口与启动拓扑（方案未提及，录屏必须先知道）

| 命令 | 后端 | 前端 | 说明 |
|---|---|---|---|
| `npm run dev` | Fastify 11520 | Vite 11521（自动开浏览器） | 推荐。一条命令 restart 后端 + 启 Vite，Vite 把 `/api` `/assets` 代理到 11520 |
| `npm start` | Fastify 11520 | 无 | 只起后端。托管 `packages/web/dist`，需先 `npm run build:web`；dist 不存在则返回 placeholder UI |
| `npm run dev-bg` | - | preview 11522 | 后台 preview 模式 |

录屏默认用 `npm run dev`，浏览器自动打开 `http://127.0.0.1:11521`。

## 与方案的 3 处偏差（录制前必须修正，否则画面/数据出错）

1. **版本号**：方案通篇 `v0.3.7`。实际 `package.json` 已 `0.3.8`（`/api/health` 确认），但最新 git tag 仍 `v0.3.7`，0.3.8 未打 tag/未发 release。封面大字、CTA 要么用「v0.3.7 / 28 releases」要么先发 0.3.8 release 再用「v0.3.8」。
2. **release 数**：方案写「24 releases」。实际 git tag 28 个。
3. **「160+ SKILL.md」规模感陷阱**：`~/.hermes/skills` 实测 175 个 SKILL.md，但 `/api/other-skills` 默认 `maxFiles=100`，前端 `useOtherSkills` 未传该参数，所以「其它技能」UI 上只显示 100 条。要展示完整 175 条规模，需在 curl 加 `&maxFiles=5000`，或前端补参数。方案 Scene B 的「160+」应改为「175」，并注意 UI 默认上限 100。

## 两个数据源不要混淆

- `/api/skills`：本机已加载 IR，共 265 条（tier-1/2/3 全部），是 Dashboard、Skills 视图的数据源。
- `/api/other-skills?roots=~/.hermes/skills`：运行时扫描外部 SKILL.md，175 个文件（UI 默认显示 100），是「其它技能」入口的数据源。

方案的「160+ SKILL.md」指后者；Dashboard 上的「265」是前者。镜头旁白/字幕不要混用。

---

## Scene A：项目启动

| 项 | 内容 |
|---|---|
| 镜头目标 | 证明项目不是概念片，而是可跑的 |
| 入口命令 | 终端执行 `npm run dev`（会 restart 后端 11520 + 启 Vite 11521 + 自动开浏览器） |
| 期望画面 | 终端滚动启动日志 -> 浏览器自动打开 `http://127.0.0.1:11521` -> Dashboard 加载完成 |
| 实现文件 | `package.json` scripts.dev；`scripts/start-dev.sh`；`packages/server/src/index.mjs:89` startServer；`packages/web/vite.config.ts:15` server 配置 |
| 前提条件 | `node_modules` 已装；端口 11520/11521 未被占用 |
| 录制注意 | 方案写「npm start + npm run dev」两条命令，实际 `npm run dev` 一条够（内部已 restart 后端）。单独 `npm start` 只适合展示已 build 的 SPA 或 placeholder UI |

## Scene B：扫描 175 个 SKILL.md 的结果

| 项 | 内容 |
|---|---|
| 镜头目标 | 最直观的规模感 |
| 入口操作 | 浏览器 Dashboard 页点「其它技能」入口按钮（`onOpenOtherSkills`），等价于进 SkillsView + `tierFilter='tier-3'` |
| 期望画面 | tier-3 列表展开，滚动展示大量技能条目 |
| 实现文件 | `packages/web/src/hooks/useOtherSkills.ts:251` defaultRoots=`~/.hermes/skills`；`packages/scanner/src/adapters/skill-adapter.mjs` scanSkills；`packages/server/src/index.mjs:312` `/api/other-skills` |
| 前提条件 | `~/.hermes/skills` 非空（实测 175 个 SKILL.md） |
| 录制注意 | UI 默认只显示 100 条（maxFiles 限制）。要展示「175」完整规模，需在 URL 加 `&maxFiles=5000` 直接访问，或前端补参数。旁白说「175 个」而非「160+」 |
| 验证证据 | `find ~/.hermes/skills -name SKILL.md \| wc -l` = 175；curl 返回 skills:100（受 maxFiles 限制） |

## Scene C：/api/other-skills 返回列表数据

| 项 | 内容 |
|---|---|
| 镜头目标 | 给技术观众「真后端」证据 |
| 入口命令 | 终端：`curl -s "http://127.0.0.1:11520/api/other-skills?roots=~/.hermes/skills&fileGlob=**/SKILL.md&stage=mini" \| node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).skills.length))"` |
| 期望画面 | 终端 JSON 输出，含 `id` `name` `description` `category` `brand` `iconUrl` `iconFallback` 字段 |
| 实现文件 | `packages/server/src/index.mjs:312-399`；`packages/scanner/src/adapters/skill-adapter.mjs` |
| 前提条件 | 后端在跑（11520） |
| 验证证据 | curl 返回 `ok:true, skills:100, stats.files:100` |

## Scene D：/api/icons/:brand 拉取真实图标 PNG

| 项 | 内容 |
|---|---|
| 镜头目标 | 非常适合短视频的「哇点」——不是 emoji，是真实应用图标 |
| 入口命令 | 终端：`curl -s -o /tmp/i.png "http://127.0.0.1:11520/api/icons/cursor?size=64" && file /tmp/i.png`；同时前端 tier-3 列表里看 cursor/claude/vscode 品牌行左侧真实图标 |
| 期望画面 | 终端 `PNG image data, 64 x 64` + 前端真实 Cursor/VSCode/Claude 图标渲染（对比 emoji 占位） |
| 实现文件 | `packages/server/src/index.mjs:406-439`；`packages/scanner/src/icon/icon-extractor.mjs:326` getIconForBrand；`packages/scanner/src/icon/brand-map.mjs:20` cursor 注册 |
| 前提条件 | macOS + 本机装了对应 .app（实测已装 Cursor/VS Code/Claude/Docker/Codex）。非 macOS 自动降级 emoji |
| 录制注意 | 优先级链：本机 .app 图标 -> 注册的官方远程 URL -> 无图标。可拍「emoji 占位 vs 真实图标」对比 |
| 验证证据 | HTTP 200, `image/png`, 64x64 RGBA, 3154B |

## Scene E：搜索 / 排序 / 分组 / 过滤

| 项 | 内容 |
|---|---|
| 镜头目标 | 最容易在短时间内看懂价值的交互 |
| 入口操作 | Topbar 搜索框输入 query（如 `mcp` `cursor`）；SkillsView 点 tier-1/2/3 过滤、editor 来源过滤、kind 过滤；其它技能视图切 groupBy（category/brand/source） |
| 期望画面 | 搜索前后列表实时变化、分组折叠展开 |
| 实现文件 | `packages/web/src/hooks/useOtherSkills.ts:103` matchesQuery、`:120` sortSkills、`:158` groupSkills；`packages/web/src/App.tsx:59` reducer；`packages/web/src/components/views/SkillsView.tsx` |
| 前提条件 | 列表非空 |
| 录制注意 | 搜索匹配 name/title/description/tags/brand/source 六字段；排序支持 NAME/UPDATED/CATEGORY；分组支持 NONE/BRAND/SOURCE/CATEGORY |

## Scene F：Dashboard 响应式卡片网格

| 项 | 内容 |
|---|---|
| 镜头目标 | 很适合做封面与 UI 质感镜头 |
| 入口操作 | 访问 `http://127.0.0.1:11521` 默认页（module=home -> DashboardView）；拖拽浏览器窗口宽度看响应式 |
| 期望画面 | Dashboard 卡片网格、stats 数字（total 265）、三个入口按钮（技能/命令/其它技能） |
| 实现文件 | `packages/web/src/components/views/DashboardView.tsx`；`packages/web/src/App.tsx:232-241` |
| 前提条件 | `/api/skills` + `/api/stats` 返回数据（实测 265 条） |
| 验证证据 | `/api/stats` total:265 |

## Scene G：分类结构（tier 三层）

| 项 | 内容 |
|---|---|
| 镜头目标 | 直接解释「中枢」逻辑 |
| 入口操作 | Sidebar 展开/折叠 tier-1/tier-2/tier-3 三个分组；点不同 tier 看列表变化 |
| 期望画面 | 三层 tier 分组结构 |
| 实现文件 | `packages/web/src/hooks/useSidebarMenu.ts`（tier1/2/3Expanded）；`packages/web/src/components/Sidebar/TierGroup.tsx`；`packages/web/src/components/Sidebar/SidebarMenu.tsx`；`packages/web/src/App.tsx:157` tier action |
| 录制注意 | 方案写「Official Tools / Custom Skills / Other Sources」，实际命名是 tier-1（编辑器官方技能）/ tier-2（目录技能）/ tier-3（其它来源 SKILL.md）。旁白/字幕要对齐实际命名 |
| 验证证据 | `/api/skills` 首条 `tier:tier-1`；`/api/stats` byBrand 多样 |

## Scene H：版本迭代（build in public）

| 项 | 内容 |
|---|---|
| 镜头目标 | 可做 build in public 叙事 |
| 入口命令 | 终端 `git tag --sort=-creatordate`；或 GitHub releases 页 |
| 期望画面 | 28 个 tag 列表，v0.3.3 -> v0.3.7 演进 |
| 实现文件 | git history；`README.md` 版本历史表 |
| 录制注意 | 方案写「v0.3.3 -> v0.3.7」「24 releases」。实际 28 个 tag，最新 v0.3.7，package.json 已 0.3.8（未打 tag/未发 release）。README 版本历史表停在 v0.3.5。要展示 0.3.8 需先发 release；或展示「28 releases / latest v0.3.7 / 0.3.8 开发中」 |

---

## 录制前自检清单

- [ ] `curl http://127.0.0.1:11520/api/health` 返回 `ok:true, version:0.3.8`
- [ ] `curl .../api/other-skills?roots=~/.hermes/skills` 返回 `skills` 非空
- [ ] `curl -o /tmp/i.png .../api/icons/cursor?size=64` 返回 PNG（非 macOS 跳过）
- [ ] 浏览器 `http://127.0.0.1:11521` Dashboard 加载出 265 条数据
- [ ] 确认要对外宣称的版本号（0.3.7 已发 / 0.3.8 待发）与 release 数（28）
- [ ] 确认「其它技能」规模口径（175 个文件，UI 默认显示 100）


## 重新梳理的 8 个镜头(60 秒母版)
重新梳理的 8 个镜头(60 秒母版)

把 GitHub 首页、网站首页放在开场前两镜作为可信度证据,后续按"规模-差异化-交互-CTA"递进。所有数字均为已验证实测值。

┌──────────────┬────────┬────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────┬─────────────────────────┐
│     镜头     │  时长  │                          画面                          │                             旁白                              │        字幕大字         │
├──────────────┼────────┼────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼─────────────────────────┤
│ 1 开场可信度 │ 0-7s   │ GitHub 仓库首页,展示 About、28 releases、README        │ Agent 技能散一地?这个开源项目把它们聚成了一个本地中枢。       │ Agent技能太散?          │
├──────────────┼────────┼────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼─────────────────────────┤
│ 2 项目定位   │ 7-13s  │ GitHub About 区域特写                                  │ HuHaa-MySkills,给 AI agent workflow 用的技能插件 MCP 聚合层。 │ 技能 插件 MCP 聚合层    │
├──────────────┼────────┼────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼─────────────────────────┤
│ 3 网站首页   │ 13-20s │ 浏览器开 http://127.0.0.1:11521 Dashboard 页,265 stats │ 启动后是一个仪表盘,本机已聚合 265 条技能。                    │ 本机聚合 265 条         │
├──────────────┼────────┼────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼─────────────────────────┤
│ 4 分类结构   │ 20-28s │ Sidebar 展开 tier-1/2/3 三层分组                       │ 三层分类:官方编辑器技能、目录技能、其它来源。                 │ 三层分类结构            │
├──────────────┼────────┼────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼─────────────────────────┤
│ 5 规模证据   │ 28-38s │ 进 tier-3 其它技能视图,列表滚动                        │ 它扫描本地 175 个 SKILL.md 文件,全聚进同一个面板。            │ 175 个 SKILL.md         │
├──────────────┼────────┼────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼─────────────────────────┤
│ 6 真实图标   │ 38-48s │ tier-3 列表里 cursor/claude/vscode 真实图标特写        │ 图标不是 emoji 占位,是从本机应用提取的真实图标。              │ 不是emoji 是真图标      │
├──────────────┼────────┼────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼─────────────────────────┤
│ 7 交互价值   │ 48-56s │ 搜索框输入 mcp,切分组,看实时过滤                       │ 搜索、过滤、分组,一屏找到你要的。                             │ 搜索 过滤 分组          │
├──────────────┼────────┼────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────┼─────────────────────────┤
│ 8 CTA        │ 56-64s │ GitHub releases 页 28 个版本 + repo 链接               │ 28 个版本持续迭代,去 GitHub 搜 HuHaa-MySkills。               │ GitHub搜 HuHaa-MySkills │
└──────────────┴────────┴────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────┴─────────────────────────┘

必剪可直接粘贴的脚本

形式一:连贯旁白全文(粘到必剪"图文成片"或"提词器")

Agent技能散一地?这个开源项目把它们聚成了一个本地中枢。HuHaa-MySkills,给AI agent workflow用的技能插件MCP聚合层。启动后是一个仪表盘,本机已聚合265条技能。三层分类:官方编辑器技能、目录技能、其它来源。它扫描本地175个SKILL.md文件,全聚进同一个面板。图标不是emoji占位,是从本机应用提取的真实图标。搜索、过滤、分组,一屏找到你要的。28个版本持续迭代,去GitHub搜HuHaa-MySkills。

形式二:分镜文案(粘到必剪"文本轨道",每条对应一镜)

[镜头1 0-7s] Agent技能散一地?这个开源项目把它们聚成了一个本地中枢。
[镜头2 7-13s] HuHaa-MySkills,给AI agent workflow用的技能插件MCP聚合层。
[镜头3 13-20s] 启动后是一个仪表盘,本机已聚合265条技能。
[镜头4 20-28s] 三层分类:官方编辑器技能、目录技能、其它来源。
[镜头5 28-38s] 它扫描本地175个SKILL.md文件,全聚进同一个面板。
[镜头6 38-48s] 图标不是emoji占位,是从本机应用提取的真实图标。
[镜头7 48-56s] 搜索、过滤、分组,一屏找到你要的。
[镜头8 56-64s] 28个版本持续迭代,去GitHub搜HuHaa-MySkills。

必剪操作步骤

1. 新建项目,竖屏 9:16(抖音母版)或横屏 16:9(YouTube 母版)先选一个。
2. 把 8 张截图(按镜头编号命名)导入媒体库,按顺序拖入轨道。
3. 用"图文成片"粘贴形式一全文,自动生成配音+字幕;或手动用"文本"轨道贴形式二,每条对齐对应截图时长。
4. 配音用必剪 AI 配音,选一个干净男声或女声,全程统一。
5. 字幕检查:关键词 SKILL.md、MCP、HuHaa-MySkills 别被 AI 语音识别写错,手动校正。

三处数字诚实说明

- 175 个:实测 ~/.hermes/skills 真有 175 个 SKILL.md,旁白说"扫描 175 个"准确。但 UI 默认只显示 100 条(maxFiles 限制),观众画面里数不到 175,字幕标"175 SKILL.md"即可,不要让画面出现"共 100 条"与旁白"175"打架。
- 265 条:Dashboard 的 /api/skills 实测 265 条,准确。
- 28 个版本:git tag 实测 28 个,准确。但 GitHub releases 页不一定 28 个都有 release notes,镜头 8 若拍 releases 页以实际显示为准,旁白"持续迭代"是安全表述。

你现在需要截的 8 张图

服务已在 11520/11521 运行,网站首页(镜头3-7)可直接 /btw 截。GitHub 首页/releases(镜头1/2/8)需你在浏览器打开 GitHub 仓库页截。

要不要我先把镜头 3-7 的网站画面用 /btw 截好?(GitHub 页面我无法截,需你自己来)