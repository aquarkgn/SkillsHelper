# 通用 GitHub 项目前端管理规范 v1.0

> 适用于所有 GitHub 前端项目的工程管理标准，基于最佳实践和 Next.js 后台系统经验。

---

## 核心原则

1. **一致性优先** — 全项目统一技术栈、风格、规范
2. **可维护性优先** — 代码结构清晰，易于扩展和迭代
3. **质量优先** — 类型安全、测试覆盖、性能达标
4. **自动化优先** — CI/CD、代码审查、构建验证自动化
5. **文档优先** — 规范文档是代码基础，所有决策可追溯

---

## I. 技术栈选型标准

### 必选
```
Language:     TypeScript (strict 模式)
Runtime:      Node.js >= 20.0.0
Format:       ESLint + Prettier
VCS:          Git + GitHub
CI/CD:        GitHub Actions
```

### 前端框架（二选一）
```
Option A: Next.js App Router + React
          → 全栈应用、Server Components、API routes
          → 生产部署：Vercel

Option B: Vite + React
          → 轻量级 SPA、快速开发体验
          → 生产部署：任意 CDN 或静态服务
```

### UI 库标准
```
基础组件：   shadcn/ui（Tailwind CSS 基础）
业务组件：   自建（基于 shadcn/ui 定制）
CSS 方案：   Tailwind CSS（禁止 CSS-in-JS）
图标库：     lucide-react
表单验证：   React Hook Form + Zod
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

## II. 版本管理规范

### 语义化版本

```
MAJOR.MINOR.PATCH-pre+build

MAJOR：破坏性改动（API 变更、升级迁移）
MINOR：新功能（向后兼容）
PATCH：修复（Bug 修复、性能优化）
pre：预发版（alpha/beta/rc）
build：构建元数据
```

### 版本 tag 格式

```bash
v1.2.3                    # 正式版
v1.2.3-alpha.1            # 预发版
v1.2.3+build.2026062401   # 构建版本
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
    "react": "^18.2.0",
    "next": "^15.0.0"
  },
  "devDependencies": {}
}
```

**版本锁定规则**：
- 生产依赖：使用 `^` 范围（允许小版本更新）
- 开发依赖：使用 `^` 或 `~`
- package-lock.json：严格锁定（必须提交）

---

## III. 项目目录规范

### 标准结构

```
my-project/
├── .github/
│   ├── workflows/           # CI/CD 工作流
│   ├── ISSUE_TEMPLATE/      # Issue 模板
│   ├── PULL_REQUEST_TEMPLATE/
│   └── pull_request_template.md
├── src/
│   ├── app/                 # 路由和页面
│   ├── components/
│   │   ├── ui/              # 基础 UI 组件
│   │   ├── common/          # 通用业务组件
│   │   └── layout/          # 布局组件
│   ├── features/            # 功能模块
│   ├── hooks/               # React Hooks
│   ├── lib/                 # 工具函数
│   ├── types/               # 全局类型
│   ├── constants/           # 常量
│   ├── config/              # 配置文件
│   ├── styles/              # 全局样式
│   └── providers.tsx        # 上下文提供者
├── public/
│   ├── images/
│   └── icons/
├── tests/                   # 测试文件
├── docs/                    # 文档
│   ├── ENGINEERING_STANDARDS.md
│   ├── API.md
│   └── ARCHITECTURE.md
├── scripts/                 # 构建和部署脚本
├── .env.example             # 环境变量模板
├── .env.local              # （忽略，本地私密）
├── .eslintrc.json          # ESLint 配置
├── .prettierrc              # Prettier 配置
├── tsconfig.json            # TypeScript 配置
├── package.json
├── README.md               # 项目概述
├── CLAUDE.md               # AI 协作规范
├── AGENT.md                # Claude 代理准则
└── CHANGELOG.md            # 版本更新日志
```

### 目录职责明确

```
app/          → 路由、页面布局、服务端逻辑
components/   → 可复用 React 组件
features/     → 业务功能模块（按功能分目录）
hooks/        → 自定义 React Hooks
lib/          → 工具函数、请求封装、数据转换
types/        → TypeScript 类型定义
config/       → 项目配置（主题、导航、API 地址）
constants/    → 常量和枚举
styles/       → 全局样式、主题变量
tests/        → 单元测试、集成测试
docs/         → 工程文档、架构设计
scripts/      → 构建和部署工具脚本
public/       → 静态资源
```

---

## IV. 代码质量标准

### TypeScript

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true
  }
}
```

**禁止**：`any` 类型、`@ts-ignore`、`// @ts-nocheck`

### ESLint + Prettier

```
Code Style:    Prettier 自动格式化
Lint Rule:     eslint:recommended + typescript-eslint
Plugins:       react, react-hooks, import
Line Length:   100 字符
Indent:        2 空格
Quotes:        单引号（除非冲突）
Semicolons:    必须
Trailing Comma: ES5 模式
```

### React 规范

```tsx
// ✅ 函数式组件 + 类型安全
import { ReactNode } from 'react'

interface UserCardProps {
  name: string
  avatar?: string
  onSelect?: (id: string) => void
}

export const UserCard = ({
  name,
  avatar,
  onSelect,
}: UserCardProps) => {
  const [expanded, setExpanded] = useState(false)
  
  const handleClick = () => {
    setExpanded(prev => !prev)
    onSelect?.(name)
  }

  return <div onClick={handleClick}>{name}</div>
}

// ❌ 禁止
// - Class 组件
// - Props 用 React.FC 或不声明
// - 任意 HTML 属性透传（必须明确）
```

### 代码行数限制

```
页面文件（page.tsx）     → < 120 行
组件文件              → < 200 行
复杂业务组件          → < 300 行
工具函数文件          → < 200 行
配置文件              → < 200 行
单函数               → < 40 行
单组件               → < 120 行
```

---

## V. Git 工作流规范

### 分支命名

```
main                # 正式分支（可部署）
dev                 # 开发分支（测试环境）
feature/name        # 功能分支
fix/name           # 修复分支
refactor/name      # 重构分支
docs/name          # 文档分支
perf/name          # 性能优化分支
chore/name         # 工程配置分支
```

### 提交规范（Conventional Commits）

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**：
- `feat`：新功能
- `fix`：修复 bug
- `refactor`：代码重构
- `perf`：性能优化
- `test`：测试相关
- `docs`：文档更新
- `style`：代码格式（不改逻辑）
- `chore`：依赖、构建、配置

**Scope**：
- 业务模块名（dashboard, settings）
- 技术层面（types, config）
- 文件名或组件名（缩写）

**Subject**：
- 命令式："add feature" 而非 "added feature"
- 首字母小写
- 无句号结尾
- < 50 字

**Body**（可选）：
- 说明 WHY 和 WHAT，不说 HOW
- 每行 < 72 字
- 可写多段，用空行分隔

**Footer**（可选）：
- 关闭 Issue：`Closes #123`
- Breaking Change：`BREAKING CHANGE: description`

### 提交示例

```
feat(dashboard): 添加实时数据更新

使用 WebSocket 替代轮询，性能提升 60%。
移动端数据量限制为 10 条。

Closes #456
BREAKING CHANGE: Dashboard API 返回格式变更
```

### Pull Request 流程

1. **分支拉取** — 从 main 或 dev 创建新分支
2. **本地开发** — 功能实现 + 类型检查 + 测试
3. **本地验证** — `npm run lint && npm run build && npm test`
4. **推送 PR** — 推送分支并创建 PR
5. **CI 检查** — 自动运行 lint、build、test、coverage
6. **代码审查** — 至少 1 人审核，提出改进意见
7. **修改优化** — 应用审查建议，更新 PR
8. **合并** — Squash & Merge 到 main

### 禁止

```
❌ 直接推送到 main
❌ git push --force 到共享分支
❌ 合并有 lint/test 失败的 PR
❌ 带有 .env.local、node_modules 的提交
❌ 提交消息模糊不清（"fix", "update", "changes"）
```

---

## VI. 测试规范

### 覆盖率目标

```
总体覆盖率              >= 80%
关键业务逻辑            >= 95%
工具函数               >= 90%
React 组件 (UI)        >= 60%
```

### 测试类型

```
单元测试：   工具函数、业务逻辑、数据转换
集成测试：   模块间协作、API 调用、组件间交互
E2E 测试：   完整用户流程、关键路径验证
```

### 测试框架选择

```
首选：Jest + React Testing Library
      → 标准、社区活跃、文档完善

可选：Vitest + React Testing Library
      → 快速开发体验（使用 Vite 项目）

E2E：  Playwright 或 Cypress
       → 完整浏览器测试
```

### 测试文件组织

```
src/components/Button/
├── Button.tsx
└── Button.test.tsx

src/lib/utils/
├── format.ts
└── format.test.ts
```

### 测试命名规范

```typescript
describe('UserCard 组件', () => {
  it('初次加载时显示骨架屏', () => {
    // ...
  })

  it('数据加载完成后隐藏骨架屏并显示内容', () => {
    // ...
  })

  it('网络错误时显示重试按钮', () => {
    // ...
  })

  describe('点击事件', () => {
    it('点击卡片时触发 onSelect 回调', () => {
      // ...
    })
  })
})
```

---

## VII. CI/CD 流程

### GitHub Actions 检查

```yaml
# 必须通过的检查
1. Lint        — ESLint 代码检查
2. Type Check  — TypeScript 类型检查
3. Test        — 单元测试（覆盖率 >= 80%）
4. Build       — 生产构建成功
5. Security    — npm audit 安全扫描
```

### 自动化脚本

```bash
# 本地提交前
npm run lint        # ESLint 检查
npm run format      # Prettier 格式化
npm run type-check  # 类型检查
npm test            # 运行测试
npm run build       # 生产构建

# 所有检查通过 ✅ 才能创建 PR
```

### 部署流程

```
feature 分支推送
    ↓
PR 创建（触发 CI）
    ↓
CI 检查通过 ✅ → 触发 Preview 部署
    ↓
Code Review ✅
    ↓
Squash & Merge 到 main
    ↓
main 部署（自动）→ 正式环境
    ↓
正式环境验证
    ↓
完成 ✅
```

---

## VIII. 代码审查标准

### 审查维度

```
✅ 功能正确性     → 逻辑无误、满足需求、覆盖边界情况
✅ 代码质量       → 易读、无冗余、遵循规范
✅ 类型安全       → 无 any、类型完整、类型逻辑正确
✅ 性能           → 无明显性能瓶颈、无不必要 re-render
✅ 安全           → 无 XSS/CSRF、无凭证泄露、输入验证
✅ 测试覆盖       → 关键路径有测试、覆盖率达标
✅ 文档完善       → 复杂逻辑有注释、API 有说明
✅ 兼容性         → 浏览器兼容、移动端适配、无 breaking change
```

### 审查提示

```
✅ 好的建议      → 具体、可行、有解释
❌ 不好的建议    → "这样不对"、"改成这样"（无解释）

✅ 好的讨论      → "为什么不用 X？"、"考虑过 Y 吗？"
❌ 坏的讨论      → "我不喜欢这样"、"这不对"
```

### 审查工具

建议使用 `/code-review` 自动化审查前，手动审查的关键点：
```
1. 业务逻辑正确性
2. 数据流向和状态管理
3. 错误处理的完善性
4. 性能的 critical path
5. 安全隐患（XSS, CSRF, injection）
```

---

## IX. 性能基准

### Web 指标（Lighthouse）

```
LCP (最大内容绘制)           <= 2.5s
FID (首次输入延迟)           <= 100ms
CLS (累积布局偏移)           <= 0.1
FCP (首次内容绘制)           <= 1.8s
TTFB (首字节时间)            <= 0.6s
```

### 包大小目标

```
Initial Bundle              <= 200KB (gzip)
Runtime Size                <= 500KB (总计)
Per-Route Code Split        <= 50KB (路由级)
```

### 性能检查清单

```
☑ 使用 next/image 优化图片
☑ 代码分割有效
☑ Tree-shaking 工作正常
☑ 无不必要的 polyfill
☑ 不再首屏加载不必要的依赖
☑ React Hooks 依赖数组正确
☑ 列表组件使用 key
☑ 没有 console.log/debugger
```

---

## X. 安全规范

### 代码安全

```
✅ 验证所有用户输入
✅ 防止 XSS（框架自动处理）
✅ 防止 CSRF（token 验证）
✅ 输入消毒（从不信任外部源）
✅ 避免 SQL 注入（使用 ORM 或参数化查询）
✅ 不硬编码 secrets
✅ API 授权检查（后端）
```

### 依赖安全

```bash
npm audit                   # 检查已知漏洞
npm audit fix              # 自动修复
npm outdated               # 检查过期版本
```

### 环境变量

```bash
# ✅ 公开环境变量（前端可用）
NEXT_PUBLIC_API_BASE_URL

# ❌ 私密环境变量（后端只用）
DATABASE_URL
API_SECRET_KEY

# 位置
.env.local                 # 本地（git 忽略）
.env.example               # 模板（git 追踪）
```

### 敏感数据

```
❌ 不在代码中硬编码 API Key、密码、token
❌ 不在日志中输出用户信息、凭证
❌ 不在错误消息中暴露系统信息
✅ 使用环境变量管理所有凭证
✅ 日志不记录敏感字段
```

---

## XI. 文档规范

### 必需文档

```
README.md                   # 项目总览和快速开始
CLAUDE.md                   # AI 协作规范
AGENT.md                    # Claude 代理准则
docs/ENGINEERING_STANDARDS.md
                            # 完整工程规范（本文件）
docs/API.md                 # API 文档（如果有后端）
docs/ARCHITECTURE.md        # 架构设计和决策记录
CHANGELOG.md                # 版本更新日志
.github/pull_request_template.md
                            # PR 模板
.github/ISSUE_TEMPLATE/*.md # Issue 模板（bug、feature、question）
```

### README.md 必含内容

```markdown
# 项目名称

简短描述

## 快速开始

### 系统要求
- Node.js >= 20
- npm >= 10

### 安装
```bash
npm install
```

### 启动开发
```bash
npm run dev
```

### 构建
```bash
npm run build
npm start
```

## 核心功能

- 功能 1
- 功能 2

## 项目结构

## 开发规范

- 参考 [CLAUDE.md](./CLAUDE.md) 和 [AGENT.md](./AGENT.md)

## 贡献指南

1. Fork 项目
2. 创建分支
3. 提交 PR
4. 等待审查

## License
```

### 代码注释规范

```
❌ 注释讲述代码做什么（代码已经说了）
❌ 过度注释（信噪比低）

✅ 注释解释为什么（非显而易见的原因）
✅ 注释标注怪异但必要的代码
✅ 复杂算法、边界情况、性能优化

好的注释：
// 需要 useCallback 包装，否则每次 render 会重新创建函数，
// 导致子组件不必要的 re-render（组件已优化）
const handleClick = useCallback(() => { ... }, [deps])

坏的注释：
const handleClick = () => { } // 处理点击事件
```

---

## XII. 发布规范

### 发布前检查清单

```
☑ lint 通过
☑ 类型检查通过
☑ 测试通过（覆盖率 >= 80%）
☑ 构建成功
☑ 无未提交的改动
☑ 远程分支已同步
☑ CHANGELOG 已更新
☑ 版本号已更新（package.json）
☑ 环境变量配置完成
☑ 核心功能人工验证
☑ 移动端验证
☑ 性能 Lighthouse 检查
```

### 发布流程

```
1. 创建 release 分支
   git checkout -b release/v1.2.3

2. 更新版本
   npm version minor (或 major/patch)

3. 更新 CHANGELOG
   记录新增、修复、破坏性改动

4. 合并到 main
   git checkout main
   git merge --no-ff release/v1.2.3

5. 标记版本
   git tag -a v1.2.3 -m "Release v1.2.3"

6. 推送并创建 Release
   git push origin main --tags
   GitHub UI 创建 Release

7. 发布 npm 包（如果需要）
   npm publish
```

### 回滚流程

```
1. 立即关闭部署
2. 恢复到上一个稳定版本
3. 记录问题详情
4. 新建 hotfix 分支
5. 修复并测试
6. 快速发布修复版本
```

---

## XIII. 禁止清单

```
❌ 硬编码 API 域名、凭证、配置
❌ 混用多个 UI 库或主题风格
❌ 未经审查的大型依赖引入
❌ 散乱的样式文件（必须统一主题系统）
❌ page.tsx 或组件超过 300 行
❌ 忽视移动端适配
❌ 没有 loading / empty / error 状态处理
❌ 忽略无障碍访问（a11y）
❌ 高优先级功能无测试
❌ 大范围重构修复小 Bug
❌ 模板假数据进入生产代码
❌ 提交 .env.local、node_modules、build
❌ 使用 @ts-ignore 和 any 逃避类型检查
```

---

## XIV. 最终质量检查

### 功能检查

```
☑ 所有功能按需求实现
☑ 所有路由都能访问
☑ 所有表单都能提交
☑ 所有 API 都返回正确数据
☑ 所有错误都有提示
☑ 所有异常都有恢复机制
☑ 没有控制台错误或警告
```

### 用户体验检查

```
☑ 响应速度符合基准
☑ 加载状态有反馈
☑ 操作结果有确认
☑ 错误信息清晰可读
☑ 操作流程直观
☑ 移动端完全可用
```

### 代码质量检查

```
☑ lint 和 format 通过
☑ 类型 100% 覆盖（无 any）
☑ 测试覆盖率 >= 80%
☑ 没有未使用的代码
☑ 没有重复逻辑
☑ 代码结构清晰
☑ 文档齐全
```

---

## XV. 项目初始化清单

新项目启动时：

```bash
1. 创建项目
   npx create-next-app@latest my-app --typescript --tailwind

2. 初始化 shadcn/ui
   npx shadcn@latest init

3. 添加基础组件
   npx shadcn@latest add button input card select table

4. 初始化 Git
   git init
   git remote add origin <repo-url>

5. 创建项目文档
   CLAUDE.md、AGENT.md、README.md、CHANGELOG.md

6. 设置 GitHub
   - 添加 CODEOWNERS
   - 配置分支保护规则
   - 启用 CI/CD Workflow
   - 设置 PR 模板

7. 本地验证
   npm run lint && npm run build && npm test
```

---

**版本**：1.0  
**最后更新**：2026-06-24  
**适用范围**：所有 GitHub 前端项目  
**维护者**：Team
