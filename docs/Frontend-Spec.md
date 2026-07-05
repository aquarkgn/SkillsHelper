# 🎨 HuHaa-MySkills 前端工程完整规范 v2.0

> **一站式前端文档** — 工程规范、设计系统、框架说明、重构计划、实现指南
>
> 本文整合了所有前端规范、约束、设计、主题和实现细节。
>
> **最后更新** — 2026-07-01  
> **版本** — v2.0（Vite + React + Tailwind 重构）

---

## 📋 快速导航

- **§I** — 工程规范（技术栈、版本、目录、代码质量）
- **§II** — 设计系统（色彩、排版、间距、组件、响应式）
- **§III** — 框架说明（Vite、React、配置、构建模型）
- **§IV** — 重构计划（路线决策、分阶段路线、执行清单）
- **§V** — 实现指南（Sidebar、状态管理、API 集成）
- **§VI** — 快速启动（环境、命令、验证）

---

# 一、工程规范

## I.1 核心原则

1. **一致性优先** — 全项目统一技术栈、风格、规范
2. **可维护性优先** — 代码结构清晰，易于扩展和迭代
3. **质量优先** — 类型安全、测试覆盖、性能达标
4. **自动化优先** — CI/CD、代码审查、构建验证自动化
5. **文档优先** — 规范文档是代码基础，所有决策可追溯

---

## I.2 技术栈选型标准

### 必选

```
Language:     TypeScript (strict 模式)
Runtime:      Node.js >= 20.0.0
Format:       ESLint + Prettier
VCS:          Git + GitHub
CI/CD:        GitHub Actions
```

### 前端框架（已定型）

```
选型: Vite + React 18
理由: 快速开发体验、轻量级 SPA、直接落地设计系统
输出: 纯静态 SPA (packages/web/dist)
部署: Fastify 后端托管 (localhost:11520)
```

### UI 库标准

```
基础组件：   shadcn/ui 风格（cva + cn 手写，不跑官方 CLI）
CSS 方案：   Tailwind CSS 3.4 + CSS 变量驱动主题
图标库：     lucide-react
表单验证：   React Hook Form + Zod
搜索：       Fuse.js（客户端模糊搜索）
```

### 禁止项

```
❌ CSS Module / Styled Components（与 Tailwind 重复）
❌ 商业 UI 库硬依赖（Ant Design Pro、Material UI）
❌ jQuery / 大型 jQuery 插件
❌ 未经 Review 的重型依赖
❌ 自建重复轮子（按钮、输入框等）
```

---

## I.3 版本管理规范

### 语义化版本

```
MAJOR.MINOR.PATCH-pre+build

MAJOR：破坏性改动（API 变更、升级迁移）
MINOR：新功能（向后兼容）
PATCH：修复（Bug 修复、性能优化）
pre：预发版（alpha/beta/rc）
build：构建元数据
```

### package.json 版本策略

```json
{
  "version": "1.0.0",
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "dependencies": {
    "react": "^18.2.0"
  },
  "devDependencies": {}
}
```

**版本锁定规则**：
- 生产依赖：使用 `^` 范围（允许小版本更新）
- 开发依赖：使用 `^` 或 `~`
- `package-lock.json` 必须提交

---

## I.4 目录结构

```
HuHaa-MySkills/
├── packages/web/                        # Vite + React 前端 SPA
│   ├── index.html                       # 入口 (<div id="app"> + 防暗色闪烁脚本)
│   ├── vite.config.ts                   # React 插件 / @ 别名 / dev 代理 /api→11520
│   ├── tsconfig.json                    # strict 模式
│   ├── tailwind.config.ts               # 主题 token
│   ├── postcss.config.js
│   ├── vitest.config.ts                 # 单测配置（P1 接入）
│   ├── public/                          # favicon / manifest
│   └── src/
│       ├── main.tsx                     # 入口，挂载到 #app
│       ├── index.css                    # 主题 CSS 变量 + 三栏布局类
│       ├── types.ts                     # SkillItem / Stats（镜像后端 IR）
│       ├── lib/
│       │   ├── cn.ts                    # clsx + tailwind-merge
│       │   ├── api.ts                   # 类型化 API 客户端
│       │   └── editors.ts               # editor → {label, color, icon}（P3）
│       ├── hooks/
│       │   └── useTheme.ts              # 亮/暗主题切换 + 持久化
│       ├── components/
│       │   ├── ui/                      # button / card / select（shadcn 风格）
│       │   ├── layout/                  # Sidebar / Topbar / DashboardView
│       │   └── views/                   # SkillsView / SettingsView
│       └── App.tsx                      # 状态机 + 三区外壳
│
├── docs/
│   ├── Frontend-Spec.md                 # 本文件（完整规范）
│   └── hermes_docs_project_plan.md      # 项目需求
│
└── ...
```

---

## I.5 代码质量标准

### TypeScript Strict

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**规则**：
- ✅ 所有变量、函数参数都有完整类型
- ✅ 禁止 `any`、`@ts-ignore`
- ✅ 返回值必须标注
- ✅ 对象字面量属性必须有类型

### 代码风格

**ESLint + Prettier**：
```bash
npm run lint        # 检查
npm run lint:fix    # 自动修复
npm run format      # 格式化
```

**命名约定**：
```typescript
// 组件：PascalCase
export function SkillListItem() {}

// 函数/变量：camelCase
const fetchSkills = () => {}
let selectedId = ''

// 常量：UPPER_SNAKE_CASE
const MAX_ITEMS = 100
const DEFAULT_THEME = 'light'

// 私有/内部：_前缀
const _internal = () => {}
```

### 单测覆盖

```bash
npm test                    # 运行 scanner + server 单测
cd packages/web && npm test # 前端单测（P1 接入 vitest）
```

**目标**：
- 关键路径 ≥ 80% 覆盖
- 组件单测 + 集成测试
- API 单测（mocked 请求）

---

## I.6 Git 工作流

### 分支命名

```
feature/xxx          # 新功能
fix/xxx              # bug 修复
refactor/xxx         # 重构
docs/xxx             # 文档
chore/xxx            # 配置/依赖
```

### Conventional Commits

```bash
feat(web): 添加技能详情 markdown 渲染
fix(theme): 修复暗色模式对比度
refactor(web): 抽取列表卡片组件
docs(spec): 补充设计系统文档
```

### 代码审查

**PR 前检查**：
```bash
npm run lint:fix && npm run build && npm run test
cd packages/web && ../../node_modules/.bin/tsc --noEmit
```

**审查清单**：
- ✅ 功能正确性 — 逻辑无误、满足需求
- ✅ 代码质量 — 易读、无冗余、遵循规范
- ✅ 类型安全 — 无 any、类型完整
- ✅ 性能 — 无明显瓶颈、无不必要重渲染
- ✅ 测试覆盖 — 关键路径有测试
- ✅ 文档 — 复杂逻辑有注释

---

# 二、设计系统 v2.0

## II.1 设计来源与参考

### 核心参考

本设计系统基于两份参考图（见 `docs/assets/`）：
1. **布局蓝图** — 信息架构（顶部模块栏 + 左侧图标导航 + 三态内容区）
2. **视觉参考** — 配色风格（干净浅色、柔和投影、品牌色图标）

### 设计理念

- **干净留白** — 大量留白、柔和投影、克制描边，信息密度适中
- **柔和现代** — 浅色基底 + 柔和蓝点缀，避免高饱和大色块
- **品牌可辨** — 平台/来源以品牌色图标标识，一眼可辨
- **一致性** — 统一的圆角、间距、卡片语言与状态色
- **可扩展** — CSS 变量主题系统，亮/暗双主题，易于定制

---

## II.2 配色系统

> 颜色以 **HSL 通道值** 存储于 CSS 变量，配合 `tailwind.config.ts` 的 `hsl(var(--x) / <alpha-value>)` 使用。

### 亮色模式（Light — 默认）

| 颜色类型 | 16进制 | HSL 通道 | CSS 变量 | 用途 |
|---------|--------|---------|---------|------|
| **Background** | `#F7F8FA` | `220 20% 98%` | `--color-background` | 页面画布（点阵纹理底） |
| **Foreground** | `#1F2937` | `220 9% 12%` | `--color-foreground` | 正文 / 大号数字 |
| **Card** | `#FFFFFF` | `0 0% 100%` | `--color-card` | 卡片 / 面板底 |
| **Card-FG** | `#1F2937` | `220 9% 12%` | `--color-card-foreground` | 卡片内文本 |
| **Sidebar** | `#FBFCFD` | `210 20% 99%` | `--color-sidebar` | 左侧图标导航底 |
| **Border** | `#EDF0F3` | `220 16% 94%` | `--color-border` | 极淡描边 / 分隔线 |
| **Input** | `#F3F4F6` | `220 13% 96%` | `--color-input` | 搜索框 / 输入底 |
| **Ring** | `#3B82F6` | `215 100% 46%` | `--color-ring` | Focus 环 |
| **Primary** | `#3B82F6` | `215 100% 46%` | `--color-primary` | 主操作 / 选中文字 |
| **Primary-FG** | `#FFFFFF` | `0 0% 100%` | `--color-primary-foreground` | 主按钮文字 |
| **Primary-Soft** | `#EAF2FE` | `215 100% 96%` | `--color-primary-soft` | 选中态胶囊柔和底 |
| **Muted** | `#F1F3F5` | `220 13% 95%` | `--color-muted` | 二级面 / 悬停底 |
| **Muted-FG** | `#6B7280` | `217 11% 45%` | `--color-muted-foreground` | 副标题 / 说明文字 |
| **Accent** | `#F59E0B` | `38 92% 50%` | `--color-accent` | 高亮 / 提示（如 `+1` 角标） |
| **Destructive** | `#EF4444` | `0 84% 60%` | `--color-destructive` | 删除 / 危险操作 |

### 暗色模式（Dark）

| 颜色类型 | 16进制 | HSL 通道 | CSS 变量 | 用途 |
|---------|--------|---------|---------|------|
| **Background** | `#0F172A` | `222 47% 11%` | `--color-background` | 页面画布 |
| **Foreground** | `#F8FAFC` | `210 40% 96%` | `--color-foreground` | 正文 |
| **Card** | `#1A2336` | `217 33% 14%` | `--color-card` | 卡片 / 面板 |
| **Sidebar** | `#151D2E` | `222 33% 13%` | `--color-sidebar` | 左侧导航底 |
| **Border** | `#26324A` | `217 33% 20%` | `--color-border` | 描边 / 分隔 |
| **Primary** | `#3B82F6` | `215 100% 46%` | `--color-primary` | 主操作 |
| **Primary-Soft** | `#1E2A45` | `217 40% 20%` | `--color-primary-soft` | 选中态底 |
| **Muted-FG** | `#94A3B8` | `215 14% 65%` | `--color-muted-foreground` | 副标题 |
| **Accent** | `#F59E0B` | `38 92% 50%` | `--color-accent` | 高亮 |

### Editor 色图标（数据驱动）

| 平台 | 主色（参考） | 平台 | 主色（参考） |
|------|------------|------|--------------|
| Claude / Anthropic | 珊瑚橙 `#D97757` | Codex / OpenAI | 墨黑 `#10A37F` |
| 中转站 (AK) | 橙 `#F97316` | Antigravity | 黑 `#111827` |
| Windsurf | 青 `#10B6C4` | Kiro | 紫 `#8B5CF6` |
| Cursor | 深灰 `#1F2937` | Gemini Cli | 蓝紫 `#4285F4` |
| CodeBuddy | 蓝 `#2563EB` | Qoder | 绿 `#22C55E` |
| GitHub Copilot | 灰黑 `#24292F` | Zed / Trae | 黑 `#0B0B0B` |

**实现**：维护 `src/lib/editors.ts` 映射表（`editor → { label, color, icon }`），含 unknown/缺失兜底。

### CSS 变量实现

```css
:root {
  --color-background: 220 20% 98%;
  --color-foreground: 220 9% 12%;
  --color-card: 0 0% 100%;
  --color-sidebar: 210 20% 99%;
  --color-border: 220 16% 94%;
  --color-primary: 215 100% 46%;
  --color-primary-soft: 215 100% 96%;
  --color-muted-foreground: 217 11% 45%;
  --color-accent: 38 92% 50%;
}

.dark {
  --color-background: 222 47% 11%;
  --color-sidebar: 222 33% 13%;
  --color-primary-soft: 217 40% 20%;
  /* … 其余见 packages/web/src/index.css */
}
```

### 画布点阵纹理

参考图画布带细点阵。用 `radial-gradient` 实现，仅作用于主内容画布：

```css
.canvas-dotted {
  background-color: hsl(var(--color-background));
  background-image: radial-gradient(hsl(var(--color-border)) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

---

## II.3 字体系统

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
--font-mono: 'SF Mono', 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;
```

| 级别 | 字号 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| **H1** | 32px | 40px | 700 | 页面标题 |
| **H2** | 28px | 36px | 700 | 板块标题 |
| **H3** | 24px | 32px | 600 | 小节标题 / 详情标题 |
| **H4** | 20px | 28px | 600 | 卡片标题 |
| **Stat** | 28–32px | — | 700 | 统计卡大号数字 |
| **Body** | 16px | 24px | 400 | 正文 |
| **Body-sm** | 14px | 20px | 400 | 列表项 / 设置项标题 |
| **Caption** | 12px | 18px | 400 | 副标题 / 角标 / 路径 |
| **Code** | 14px | 20px | 500 (mono) | 路径 / 代码 |

---

## II.4 间距系统（4px 网格）

| 值 | 用途 |
|-----|------|
| **px-3 py-2** | 导航项 / 列表项内间距 |
| **gap-4** | 卡片网格间距 |
| **p-5 / p-6** | 卡片 / 面板内容区 |
| **px-6** | 顶栏 / 内容区水平内边距 |
| **gap-2** | 图标与文字间距 |

---

## II.5 圆角系统

```ts
borderRadius: { lg: '12px', md: '8px', sm: '4px' }
```

| 半径 | 用途 |
|------|------|
| **rounded-lg (12px)** | 卡片、详情面板、统计卡、品牌图标 |
| **rounded-md (8px)** | 按钮、输入框、导航胶囊 |
| **rounded-sm (4px)** | 标签、徽章、角标 |
| **rounded-full** | 分段标签页选中胶囊 / 头像 |

---

## II.6 阴影系统

参考图整体投影**很轻**，以「浮起感」为度，避免重阴影。

```
shadow-sm   // 卡片默认（柔和浮起）
shadow      // 悬停 / 选中卡片
shadow-md   // 下拉菜单 / 弹层
shadow-lg   // 模态框
```

层级：`0 扁平` → `sm 卡片` → `md 浮层` → `lg 顶层`。

---

## II.7 布局规范（核心）

整体为「**顶部模块标签栏 + 左侧图标导航栏 + 内容区**」三区结构。

```
┌──────────────────────────────────────────────────────────┐
│ [Logo]   技能(Skills)   命令(待开发)   编辑器(待开发)        │ ← 顶部模块标签栏 (topbar)
├──────────┬───────────────────────────────────────────────┤
│ ◎ 仪表盘  │                                               │
│ ◍ Claude  │              内容区 (main)                     │
│ ◍ Hermes  │   · 仪表盘 → 卡片网格                          │
│ ◍ Codex   │   · 技能   → 搜索栏 + 列表 + 详情面板           │ ← 左侧栏 (sidebar)
│           │   · 设置   → 分页设置                           │
│ ⚙ 设置    │                                               │ ← 设置固定底部
└──────────┴───────────────────────────────────────────────┘
```

### 7.1 顶部模块标签栏（topbar）

- 左：品牌 logo + 名称
- 中/左：模块标签 `技能(Skills)` / `命令(待开发)` / `编辑器(待开发)`
- 选中态：高亮底（参考蓝图配色），未开发模块带「待开发」灰字 + 禁用样式
- 高度 56px

### 7.2 左侧图标导航栏（sidebar）

- 图标 + 文字的纵向导航项：`仪表盘`、按 `editor` 数据驱动（`Claude Code`/`Hermes Agent`/`Cursor`/`Codex`…，**过滤 `(none)`**）
- 选中态：`bg-primary-soft` + `text-primary` 圆角胶囊
- 悬停态：`hover:bg-muted`
- **底部固定**：`设置` 项（`mt-auto` 推到底部）
- 宽度 280px，底为 `--color-sidebar`

### 7.3 内容区（main）三态

| 模块/选择 | 形态 | 说明 |
|-----------|------|------|
| **仪表盘** | 卡片网格 | 响应式 grid（`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`），每卡 = editor 图标 + 标签 + 技能聚合数字 |
| **技能** | 三段主从 | 搜索栏 + kind chip 次筛选 + 列表（项=名称+描述+来源标签） + 右侧详情面板 |
| **设置** | 分页设置 | 右上分段标签页（通用/网络服务/数据管理/关于）+ 设置项行 |

---

## II.8 组件设计规范

### 统计卡（StatCard，仪表盘）

```tsx
<Card className="flex items-center gap-3 p-5 rounded-lg shadow-sm">
  <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: editor.color + '1A', color: editor.color }}>
    <BrandIcon size={20} />
  </span>
  <div>
    <p className="text-body-sm text-muted-foreground">{label}</p>
    <p className="text-h3 font-bold tabular-nums">{count}</p>
  </div>
  {delta && <span className="ml-auto rounded-sm bg-accent/15 px-1.5 text-caption text-accent">+{delta}</span>}
</Card>
```

### 搜索栏（技能模块顶部）

```tsx
<input
  type="search"
  placeholder="搜索账号 / 技能…"
  className="h-10 w-full rounded-md border border-border bg-input px-3 text-body-sm
             placeholder:text-muted-foreground
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
/>
```

### 列表项（SkillListItem）

```tsx
<button className={cn(
  'flex w-full flex-col gap-1 rounded-md border border-border bg-card p-3 text-left transition-colors',
  selected ? 'border-primary bg-primary-soft' : 'hover:bg-muted'
)}>
  <span className="text-body-sm font-medium text-foreground">{name}</span>
  <span className="line-clamp-2 text-caption text-muted-foreground">{description}</span>
  <span className="mt-1 w-fit rounded-sm bg-muted px-1.5 py-0.5 text-caption text-muted-foreground">{source}</span>
</button>
```

### 详情面板（detail）

```tsx
<section className="detail">
  <h2 className="text-h3 text-foreground">{title}</h2>
  <p className="mt-2 text-body-sm text-muted-foreground">{description}</p>
  <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body-sm">
    <dt className="text-muted-foreground">类型</dt><dd>{kind}</dd>
    <dt className="text-muted-foreground">来源</dt><dd>{source}</dd>
    <dt className="text-muted-foreground">路径</dt>
    <dd className="break-all font-mono text-caption">{path}</dd>
  </dl>
</section>
```

### 设置项行（SettingRow）+ 分段标签页

```tsx
{/* 分段标签页 */}
<div className="inline-flex rounded-md bg-muted p-1 text-body-sm">
  {tabs.map(t => (
    <button className={cn('rounded-sm px-3 py-1', active === t && 'bg-card text-primary shadow-sm')}>{t}</button>
  ))}
</div>

{/* 设置项行 */}
<div className="flex items-center justify-between border-b border-border py-4">
  <div>
    <p className="text-body-sm text-foreground">{title}</p>
    <p className="text-caption text-muted-foreground">{subtitle}</p>
  </div>
  <Select value={value} options={options} />
</div>
```

---

## II.9 响应式设计

| 前缀 | 宽度 | 行为 |
|------|------|------|
| **sm** | 640px | 卡片网格 1 列 |
| **md** | 768px | 卡片网格 2 列；技能三段可折叠详情为抽屉 |
| **lg** | 1024px | 卡片网格 4 列；技能列表+详情并列 |
| **xl** | 1280px | 内容区最大化 |

---

## II.10 动画系统

```ts
animation: {
  'fade-in': 'fadeIn 200ms ease-in',
  'slide-up': 'slideUp 300ms ease-out',
}
```

| 类型 | 时长 |
|------|------|
| 微交互（hover/选中） | 150–200ms |
| 模块/页面切换 | 300ms |
| Toast / 弹层 | 300ms |

---

## II.11 深浅主题切换

```ts
// src/hooks/useTheme.ts（已实现）
document.documentElement.classList.toggle('dark', next === 'dark')
localStorage.setItem('theme', next)
```

`index.html` 内联防闪烁脚本在首屏前读取 `localStorage.theme` 应用 `.dark`。

---

## II.12 无障碍性（A11y · WCAG AA）

- 色彩对比度 ≥ 4.5:1（正文）、≥ 3:1（大文本与图标）
- 所有导航/标签/设置项为可聚焦交互元素，`:focus-visible` 可见环（`--color-ring`）
- 键盘可达：模块标签、侧栏、列表、设置下拉
- 语义化：`<nav>` / `<aside>` / `<button>` / `<dl>`，图标按钮带 `aria-label`

---

## II.13 设计与代码的映射

| 设计项 | 落地位置 |
|--------|---------|
| 颜色 token（CSS 变量） | `packages/web/src/index.css` |
| Tailwind 颜色/字号/圆角 | `packages/web/tailwind.config.ts` |
| 三区布局类（sidebar/topbar/detail/main-pane） | `packages/web/src/index.css`（`@layer components`） |
| 主题切换 | `packages/web/src/hooks/useTheme.ts` |
| editor 色映射 | `packages/web/src/lib/editors.ts` |
| 官方品牌图标（Skill + Command） | `packages/scanner/src/icon/icon-extractor.mjs` + `packages/scanner/src/icon/brand-map.mjs`（后端 `/api/icons/:brand`） |
| 前端官方图标组件 | `packages/web/src/components/ui/OfficialBrandIcon.tsx` |
| verify 断言约束 | `build/verify.mjs`（`#app`；CSS 子串 OR 含 `topbar`/`sidebar`/`detail` 任一） |

### 官方品牌 icon 资源策略

Skill 与 Command 模块统一通过 `/api/icons/:brand` 读取官方 icon，前端不再打包自制品牌 SVG，也不使用 emoji / lucide 品牌图标伪装官方 icon：

1. **本机官方 `.app` 图标优先**：后端按 `brand-map.mjs` 中的 Bundle ID / App 名称扫描并提取系统应用图标。
2. **官方远程 URL 兜底**：本机无图标时，仅从 `brand-map.mjs` 登记的 HTTPS 官方 URL 下载；结果缓存到 `~/.config/huhaa-myskills/icon-cache/`。
3. **中性占位**：没有本机图标且没有可确认官方远程 URL（如 `hermes` / `gstack`）时，前端显示中性占位。
4. **禁用联网**：`HUHAA_ICON_REMOTE=0` 时不触发远程下载，但仍可读取已有本地缓存。

---

# 三、框架说明

## III.1 技术栈定型

| 维度 | 选型 | 说明 |
|------|------|------|
| 构建工具 | **Vite 6** | 输出纯静态 SPA，由后端 Fastify 托管 |
| 运行时 | **React 18.3** | 函数组件 + Hooks |
| 语言 | **TypeScript 5.x (strict)** | 禁 `any` / `@ts-ignore` |
| 样式 | **Tailwind CSS 3.4** | CSS 变量驱动主题 |
| 组件 | **shadcn 风格**（`cva + cn` 手写） | 不跑官方 CLI，按需手写 |
| 图标 | **lucide-react** | — |
| 搜索 | **Fuse.js** | 客户端模糊搜索 |
| 取数 | **fetch** → Fastify `/api/*` | 同源，dev 由 vite 代理 |

---

## III.2 服务与构建模型

```
huhaa-myskills start
  └─ Fastify(packages/server) :11520
       ├─ /api/*               # skills/stats/events/copy/open/translate/reload
       ├─ /            → packages/web/dist/index.html
       └─ /assets/*    → packages/web/dist/assets/*

npm run build:web → build/build-web.mjs → (packages/web) vite build → dist/
```

- 前端 `base='/'`、`assetsDir='assets'`，与服务器静态路由约定一致。
- 服务器侧（`packages/server/src/index.mjs`）无需为前端改动。

---

## III.3 核心配置

### TypeScript Strict

`tsconfig.json` 开启 `strict`、`noUnusedLocals`、`noUnusedParameters`；路径别名 `@/* → src/*`。

### Tailwind 主题 token

颜色全部走 CSS 变量；`darkMode: 'class'`；扩展了 `fontSize`(h1~caption)、`borderRadius`、`fontFamily`。

### 三栏布局类（重要约束）

`src/index.css` 的 `.sidebar` / `.topbar` / `.detail` 同时被 `build/verify.mjs` 的 CSS 冒烟断言引用，**重命名需同步改 verify**。

---

## III.4 快速启动

```bash
# 本机 NODE_ENV=production，需显式带 dev 依赖安装构建工具链
NODE_ENV=development npm install --include=dev

# 生产方式：构建 + 启动后端托管
npm run build:web
npm start                     # → http://localhost:11520

# 开发方式：前后端分离
npm start                     # 终端 A：后端 API(11520)
cd packages/web && npm run dev # 终端 B：前端 dev(11521)，/api 代理到 11520
```

### 质量检查

```bash
npm run verify                                  # 构建 + 单测 + HTTP/API/静态冒烟
cd packages/web && ../../node_modules/.bin/tsc --noEmit   # TS strict 类型检查
```

---

# 四、重构计划 v2.0

## IV.1 背景与现状

仓库已从「两套并存空壳前端」收敛为单一 **Vite + React + Tailwind + shadcn 风格** 前端（P0 已完成）。

### 与新蓝图的差距

| 维度 | 现状（P0） | 新蓝图目标 |
|------|-----------|-----------|
| **顶部** | Topbar 只放搜索 + 主题/刷新按钮 | **模块标签栏**：Logo + 技能 / 命令(待开发) / 编辑器(待开发) |
| **左侧栏** | 按 `kind`（skill/plugin/mcp/instruction）过滤的按钮 | **图标导航**：仪表盘 + 按 **`editor`**（Claude Code/Hermes Agent/Cursor/Codex…） + 底部固定「设置」 |
| **内容区** | 固定为「列表 + 详情」两栏 | **三态**：仪表盘卡片网格 / 技能三段主从(搜索+列表+详情) / 设置分页 |
| **新页面** | 无 | **仪表盘**（技能聚合统计卡网格）、**设置**（分段标签页 + 设置项） |
| **视觉** | 蓝/琥珀、白底 | 柔和浅色、点阵画布、品牌色图标、`primary-soft` 选中胶囊 |

---

## IV.2 架构约束（务必遵守）

1. **挂载节点 id 必须为 `app`** — `verify.mjs:91` 断言 `index.html` 含 `<div id="app"></div>`。
2. **保留 `topbar`/`sidebar`/`detail` 三个类名中至少其一** — `verify.mjs:103` 仅做子串冒烟（OR）。本计划保留全部三者。
3. **资源走 `/assets/*`，`base='/'`** — 与服务器 `/assets/*` 路由（`index.mjs:293`）一致。
4. **TypeScript strict、禁 `any`/`@ts-ignore`** — P1 起 `tsc --noEmit` 进 `verify` 门禁。
5. **前端 `types.ts` 与 `packages/scanner/src/types.d.ts` 同步** — 现有漂移（缺 `mcp-tool`）P1 一并修。

---

## IV.3 评审锁定决策（2026-06-30）

| # | 决策 | 结论 |
|---|------|------|
| **D2** | 侧栏/筛选的规范轴 | **用 `editor`**（`Stats.byEditor` 已预算），`kind` 降为列表内 chip 次筛选 |
| **D3** | 仪表盘语义 | **技能聚合指标**（`total / byKind / byEditor / bySource / byCategory / parseError`），复用卡片视觉、**不照搬账号管理器** |
| **D4** | 阶段顺序 + 测试 | **P2 与 P4 合并**（换外壳同时重建技能三段，零回退窗口）；**P1 接入 vitest + 把 `tsc --noEmit` 纳入 `verify`/CI** |
| **D5** | dist 发布 | **P0 阻塞项**：`prepare`/`prepublishOnly` 构建钩子，保证 npm 用户装后即见新 UI |

---

## IV.4 分阶段路线

| 阶段 | 内容 | 关键产出 | 状态 |
|------|------|---------|------|
| **P0** | 清理旧栈 + Vite/React + 主题 token + 两栏外壳 + 列表/详情 + 搜索 | — | ✅ 已完成 |
| **P1** | v2.0 token + 接入 vitest + `tsc --noEmit` 纳入 `verify` + 修 types 漂移 | `index.css`/`tailwind.config.ts`/`vitest.config.ts`/`verify.mjs` | ⏳ 待办 |
| **P2+P4** | topbar→模块标签栏；sidebar→`editor` 图标导航；App 状态机；**同步重建** SkillsView | 新 Topbar/Sidebar/App/SkillsView + 单测 | ⏳ 待办 |
| **P3** | `DashboardView` + `StatCard` + `lib/editors.ts` | 统计卡网格 + 单测 | ⏳ 待办 |
| **P5** | `SettingsView`：分段标签页 + `SettingRow` | 设置分页 + 单测 | ⏳ 待办 |
| **P6** | 命令 / 编辑器模块占位 + 禁用态 | `ComingSoon` 组件 | ⏳ 待办 |
| **P7** | 消费 `/api/skills/:id` raw，markdown-it 渲染 + 代码高亮 | 富文本详情 | ⏳ 待办 |
| **P8** | 接 `/api/copy`、`/api/open`、`/api/events`(SSE)；修契约 | 实时刷新 + 复制/打开 | ⏳ 待办 |
| **P9** | 覆盖率补齐 + A11y + 响应式 + 分包 | 测试 + 优化 | ⏳ 待办 |

---

## IV.5 P1 执行清单（视觉系统 + 测试门禁）

- [ ] `index.css`：新增 `--color-sidebar`、`--color-primary-soft`（亮/暗），背景 `220 20% 98%`，border `220 16% 94%`
- [ ] `tailwind.config.ts`：补 `sidebar` / `primary-soft` 颜色映射
- [ ] 新增 `.canvas-dotted` 点阵纹理类（仅 main 画布）；卡片阴影 `shadow-sm`
- [ ] **安装并配置 vitest + @testing-library/react**；`package.json` `test` 脚本纳入前端
- [ ] **`verify.mjs` 增加 `tsc --noEmit`**（前端 strict 类型门禁）
- [ ] **修 `types.ts`**：`SkillKind` 补 `mcp-tool`，与 `scanner/types.d.ts` 对齐

---

# 五、实现指南

## V.1 Sidebar 架构升级

### 问题背景

Phase 2 实现时，Tier 过滤逻辑设计为：
1. Backend: 返回 tier/brand/dirName 字段 ✅
2. Frontend Hook: useSkillIcons 映射 icon ✅
3. SkillsView 内部: Tier filter chips 和过滤 ✅
4. **Sidebar 菜单**: 未实现 ← **遗漏**

导致用户体验割裂：Sidebar 只能通过"技能来源"(Editor) 过滤，页面内有 Tier 过滤 chips，但无法通过 Sidebar 一级菜单访问。

### 修复方案

#### 5.1.1 Sidebar 组件升级

```typescript
// 前: 仅支持 editor 过滤
interface SidebarProps {
  view: 'dashboard' | 'skills' | 'settings'
  editorFilter: string | null
  stats: Stats | null
  onDashboard: () => void
  onSettings: () => void
  onEditor: (key: string | null) => void
}

// 后: 新增 tier 过滤支持
interface SidebarProps {
  view: 'dashboard' | 'skills' | 'settings'
  editorFilter: string | null
  tierFilter: 'tool' | 'directory' | 'other' | null  // NEW
  stats: Stats | null
  onDashboard: () => void
  onSettings: () => void
  onEditor: (key: string | null) => void
  onTier: (tier: 'tool' | 'directory' | 'other' | null) => void  // NEW
}
```

**菜单结构变更**：

```
前:
├─ 仪表盘
├─ 技能来源            ← 仅此分类
│  ├─ 全部技能
│  ├─ Claude Code
│  ├─ Hermes
│  └─ Cursor
└─ 设置

后:
├─ 仪表盘
├─ 技能分类            ← NEW: 一级分类
│  ├─ 全部分类
│  ├─ 🔧 Official Tools
│  ├─ 📁 Custom Skills
│  └─ ⚙️ Other Sources
├─ 技能来源            ← 二级分类（保留）
│  ├─ 全部来源
│  ├─ Claude Code
│  ├─ Hermes
│  └─ Cursor
└─ 设置
```

**关键代码片段**：

```typescript
const tierIcons = [
  { tier: 'tool' as const, icon: '🔧', label: 'Official Tools' },
  { tier: 'directory' as const, icon: '📁', label: 'Custom Skills' },
  { tier: 'other' as const, icon: '⚙️', label: 'Other Sources' },
]

{tierIcons.map(({ tier, icon, label }) => {
  const count = byTier[tier] ?? 0
  const active = view === 'skills' && tierFilter === tier
  return (
    <button key={tier} onClick={() => onTier(tier)} className={rowCls(active)}>
      <span className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span>{label}</span>
      </span>
      <span className="text-caption opacity-80">{count}</span>
    </button>
  )
})}
```

#### 5.1.2 App.tsx 状态管理升级

```typescript
// UIState 接口
export interface UIState {
  module: ModuleKey
  view: View
  editorFilter: string | null
  tierFilter: 'tool' | 'directory' | 'other' | null  // NEW
  kindFilter: string | null
  query: string
  selectedId: string | null
}

// Action 类型新增
export type Action =
  | { type: 'module'; module: ModuleKey }
  | { type: 'dashboard' }
  | { type: 'settings' }
  | { type: 'editor'; key: string | null }
  | { type: 'tier'; tier: 'tool' | 'directory' | 'other' | null }  // NEW
  | { type: 'query'; query: string }
  | { type: 'kind'; kind: string | null }
  | { type: 'select'; id: string }

// Reducer 处理新增
case 'tier':
  return { ...state, view: 'skills', tierFilter: action.tier, kindFilter: null, selectedId: null }
```

#### 5.1.3 SkillsView 调整

```typescript
// Props 接口更新
interface SkillsViewProps {
  items: SkillItem[]
  editorFilter: string | null
  tierFilter: 'tool' | 'directory' | 'other' | null  // NEW: 从外部传入
  query: string
  onQuery: (q: string) => void
  kindFilter: string | null
  onKind: (k: string | null) => void
  selectedId: string | null
  onSelect: (id: string) => void
}

// Tier 过滤逻辑（从 Sidebar 通过 props 传入）
const byTier = useMemo(() => {
  if (tierFilter === null) return byEditor
  return byEditor.filter((it) => (it.tier || 'other') === tierFilter)
}, [byEditor, tierFilter])
```

---

## V.2 API 集成

### 类型化 API 客户端（`src/lib/api.ts`）

```typescript
export const api = {
  async getSkills(): Promise<SkillItem[]> {
    const res = await fetch('/api/skills')
    if (!res.ok) throw new Error(`GET /api/skills: ${res.status}`)
    return res.json()
  },

  async getStats(): Promise<Stats> {
    const res = await fetch('/api/stats')
    if (!res.ok) throw new Error(`GET /api/stats: ${res.status}`)
    return res.json()
  },

  async getSkillDetail(id: string): Promise<SkillItem> {
    const res = await fetch(`/api/skills/${id}`)
    if (!res.ok) throw new Error(`GET /api/skills/${id}: ${res.status}`)
    return res.json()
  },

  async copy(skillId: string, type: 'path' | 'dir' | 'rel' | 'name' | 'raw' | 'prompt'): Promise<void> {
    const res = await fetch('/api/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, type }),
    })
    if (!res.ok) throw new Error(`POST /api/copy: ${res.status}`)
  },

  async open(skillId: string): Promise<void> {
    const res = await fetch('/api/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId }),
    })
    if (!res.ok) throw new Error(`POST /api/open: ${res.status}`)
  },

  // SSE: 监听实时 skill reload 事件
  events(): EventSource {
    return new EventSource('/api/events')
  },

  async translate(skillId: string, targetLang: string): Promise<SkillItem> {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, targetLang }),
    })
    if (!res.ok) throw new Error(`POST /api/translate: ${res.status}`)
    return res.json()
  },
}
```

---

## V.3 数据流与状态管理

```
Fastify /api/{skills,stats}
  ↓
App useReducer state
  │  module × view × {tierFilter, editorFilter, kindFilter, query, selectedId}
  │
  ├─ DashboardView (Stats 聚合)
  ├─ SkillsView (Fuse 搜索 + tier/editor filter + kind chip + 列表 + 详情)
  └─ SettingsView (本地配置)
```

### 事件流示例

```
1. 用户点击 Sidebar "Official Tools" Tier
   ↓
2. dispatch({ type: 'tier', tier: 'tool' })
   ↓
3. reducer 更新: UIState.tierFilter = 'tool', view = 'skills'
   ↓
4. Sidebar 高亮 "Official Tools" 按钮
   ↓
5. SkillsView 接收 tierFilter prop
   ↓
6. 列表按 tier 重新过滤并重渲染
```

---

# 六、快速启动指南

## VI.1 环境设置

```bash
# 第一次克隆后，本机 NODE_ENV=production，需显式带 dev 依赖
NODE_ENV=development npm install --include=dev

# 验证环境
node --version  # >= 20.0.0
npm --version   # >= 10.0.0
```

## VI.2 构建与运行

### 生产模式（完整构建 + 后端托管）

```bash
# 构建前端 → packages/web/dist
npm run build:web

# 启动后端服务（:11520）
npm start

# 浏览器访问
# → http://localhost:11520
```

### 开发模式（前后端分离）

```bash
# 终端 A：启动后端 API（:11520）
npm start

# 终端 B：启动前端 dev 服务（:11521）
cd packages/web
npm run dev

# 浏览器访问
# → http://localhost:11521
# （/api/* 自动代理到 http://localhost:11520）
```

## VI.3 代码检查

```bash
# 构建 + 单测 + HTTP/API/静态冒烟
npm run verify

# 前端 TypeScript strict 检查
cd packages/web && ../../node_modules/.bin/tsc --noEmit

# 前端代码风格检查与修复
cd packages/web && npm run lint
cd packages/web && npm run lint:fix

# 前端单测（P1 接入 vitest）
cd packages/web && npm test
```

## VI.4 常见命令速查

```bash
# 安装
NODE_ENV=development npm install --include=dev

# 构建与运行
npm run build:web        # 构建前端 → packages/web/dist
npm start                # 启动后端托管 → http://localhost:11520
npm stop                 # 停止服务

# 前端开发（前后端分离）
cd packages/web && npm run dev    # 前端 dev(11521)，/api 代理到 11520

# 检查
npm run verify                                  # 构建 + 单测 + HTTP/API/静态冒烟
npm test                                        # scanner + server 单测
cd packages/web && ../../node_modules/.bin/tsc --noEmit   # 前端 TS strict 检查

# 提交
git commit -m "feat(web): 添加仪表盘"
git commit -m "fix(theme): 修复暗色对比度"
```

---

## VI.5 验证清单

启动后，按以下步骤验证系统正常运行：

```bash
# 1. 后端启动检查
curl -s http://localhost:11520/api/stats | jq .

# 2. 技能列表加载
curl -s http://localhost:11520/api/skills | jq 'length'

# 3. 前端页面加载（访问浏览器）
# http://localhost:11520
# → 应显示仪表盘 / 技能列表（Phase 3+ 后完全UI）

# 4. 构建验证
npm run verify
# → ✅ 1669 modules 构建通过
# → ✅ 单测全绿
# → ✅ 冒烟断言通过
```

---

## VI.6 项目结构一览

```
HuHaa-MySkills/
├── packages/
│   ├── web/                          # 前端 Vite + React SPA
│   │   ├── index.html                # 入口
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       ├── App.tsx               # 状态机 + 三区外壳
│   │       ├── index.css             # 主题 token + 布局类
│   │       ├── types.ts              # SkillItem / Stats
│   │       ├── lib/
│   │       │   ├── cn.ts
│   │       │   ├── api.ts            # API 客户端
│   │       │   └── editors.ts        # editor 色映射
│   │       ├── hooks/useTheme.ts
│   │       └── components/
│   │           ├── ui/               # button / card / select
│   │           └── layout/           # Sidebar / Topbar
│   ├── server/                       # Fastify 后端（:11520）
│   ├── scanner/                      # 技能扫描
│   └── ...
│
├── docs/
│   ├── Frontend-Spec.md              # 本文件
│   └── hermes_docs_project_plan.md
│
├── build/verify.mjs                  # 冒烟断言
├── README.md
├── CLAUDE.md
└── package.json
```

---

## VI.7 发布流程（npm 发布，唯一权威方式）

**发布完全由 GitHub Actions 自动完成，本地不执行 `npm publish`。**

### 触发方式

```bash
# 1. 在 main 分支 bump 版本号并推送（脚本已封装）
npm run release          # = npm version patch && git push

# 2. 推送到 main 后，.github/workflows/release.yml 自动：
#    读 package.json 版本 → 若远程无对应 tag → 构建 → npm publish → 打 tag → 建 GitHub Release
```

### 关键设计（release.yml）

- **触发条件**：`push` 到 `main` 分支（不是 tag 触发）
- **幂等**：先检查远程是否已存在 `v<version>` tag，存在则整体跳过，重复推送 main 不会重复发布
- **顺序**：`npm publish` 成功 **之后** 才创建 tag。publish 失败不会遗留僵尸 tag，修复后重推即可重试
- **发布说明**：`generate_release_notes: true` 自动生成，不依赖 CHANGELOG.md

### 凭证配置（NPM_TOKEN，一次性）

发布身份由 GitHub 仓库 Secret `NPM_TOKEN` 提供，对应 npm 账号 `huhaaonline`（包 owner）。

```bash
# token 失效/轮换时，用有 publish 权限的 Automation token 更新 secret：
gh secret set NPM_TOKEN --body '<npm token>'

# 验证 token 有效且身份正确：
printf '//registry.npmjs.org/:_authToken=%s\n' '<token>' > /tmp/v.npmrc
npm whoami --userconfig /tmp/v.npmrc      # 应输出 huhaaonline
rm -f /tmp/v.npmrc
```

**故障对照**：CI 中 `npm publish` 报 `E404 PUT .../huhaa-myskills` = token 已注入但身份无该包写权限（npm 用 404 伪装 403），即 `NPM_TOKEN` 失效或非 owner，需按上面重配。

### 发布后验证

```bash
gh run watch                                    # CI 全绿
npm view huhaa-myskills version                 # 应为新版本
npm install -g huhaa-myskills@latest && huhaa-myskills -v
```

---

# 七、相关资源

- **[Vite 官方文档](https://vite.dev)**
- **[React 官方文档](https://react.dev)**
- **[Tailwind CSS 文档](https://tailwindcss.com/docs)**
- **[TypeScript Handbook](https://www.typescriptlang.org/docs)**
- **[shadcn/ui 组件库](https://ui.shadcn.com)**

---

**最后更新** — 2026-07-01  
**版本** — v2.0 (完整规范整合)  
**状态** — ✅ 规范锁定，P0 已落地，可迭代业务功能
