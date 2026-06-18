# 版本发布规范

本文档定义 HuHaa-MySkills 版本发布、更新日志、Issue 和 Pull Request 的标准格式。

## 版本号规则

遵循 Semantic Versioning：

- `v0.1.x` - Alpha 阶段（核心功能开发）
- `v1.0.0+` - 稳定版（计划 v0.1.9 之后）

### 版本发布清单

| 环节 | 检查项 |
|------|--------|
| 代码 | [ ] 所有测试通过 / [ ] 代码审查完成 / [ ] 无 TODO 注释 |
| 文档 | [ ] README 更新 / [ ] CHANGELOG 更新 / [ ] API 文档更新 |
| 发布 | [ ] git tag 创建 / [ ] GitHub Release 发布 / [ ] npm publish（如适用） |
| 验证 | [ ] 真实环境测试 / [ ] 向后兼容性检查 |

## CHANGELOG 格式

参考 [Keep a Changelog](https://keepachangelog.com/)：

```markdown
# Changelog

## [v0.1.2] - 2026-06-25

### Added
- Keyboard shortcuts support (/, Escape, arrow keys)
- Virtual scrolling for 800+ items
- `/api/search` endpoint with filter syntax

### Fixed
- Search performance optimization
- YAML frontmatter parsing robustness

### Changed
- Improved error handling in adapters

### Removed
- Legacy cache format

### Deprecated
- Old search API (use `/api/search` instead)

## [v0.1.1] - 2026-06-18

### Added
- npm global install support
- Normalized bin path for cross-platform compatibility
```

## Git Commit 格式

遵循 Conventional Commits：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型（type）

- **feat** - 新功能
- **fix** - Bug 修复
- **docs** - 文档变更
- **style** - 代码风格（不影响功能）
- **refactor** - 重构（不改变外部行为）
- **perf** - 性能优化
- **test** - 测试相关
- **chore** - 工具、依赖更新

### 范围（scope）

- `scanner` - 扫描器模块
- `server` - HTTP 服务器
- `web` - 前端界面
- `adapter` - 适配器系列
- `cli` - 命令行工具
- `docs` - 文档

### 示例

```bash
feat(web): add keyboard shortcuts support

- Implement / key to focus search box
- Implement Escape to clear search
- Implement arrow keys to navigate list

Closes #42
```

## GitHub Issues 模板

### Bug Report

```markdown
## 描述问题

清晰简洁的问题描述。

## 复现步骤

1. ...
2. ...
3. ...

## 期望行为

应该发生什么？

## 实际行为

实际发生了什么？

## 环境

- 操作系统：macOS / Linux / Windows
- Node.js 版本：20.x
- HuHaa-MySkills 版本：v0.1.1

## 额外信息

日志、截图等。
```

### Feature Request

```markdown
## 功能描述

这个功能要解决什么问题？

## 使用场景

什么时候会用到？

## 建议的实现方式

你有什么想法吗？

## 替代方案

有其他可能的实现吗？
```

## Pull Request 模板

```markdown
## 变更说明

这个 PR 做了什么？简要描述关键变更。

## 类型

- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 性能优化

## 相关 Issue

Fixes #123

## 测试

- [ ] 本地测试通过
- [ ] 新增单元测试
- [ ] 回归测试通过

## 检查清单

- [ ] 代码风格符合项目规范
- [ ] 无新的 linting 警告
- [ ] CHANGELOG 已更新
- [ ] 文档已更新
- [ ] 提交消息格式正确
```

## Release Notes 模板

```markdown
# v0.1.2: 搜索与交互优化

## 概览

这个版本改进了搜索体验和 UI 交互，支持键盘快捷键和高性能虚拟滚动。

## ✨ 新功能

### 键盘快捷键
- `/ ` - 聚焦搜索框
- `Esc` - 清空搜索
- `↑ ↓` - 导航列表

### 快速搜索 API
```
GET /api/search?q=...&source=hermes&brand=OpenAI
```

## 🐛 Bug 修复

- 修复 frontmatter 解析容错性 (#45)
- 改进 SSE 连接稳定性 (#48)

## 📊 性能

- 列表虚拟滚动：支持 800+ 条目无卡顿
- 搜索延迟：< 5ms（Fuse.js）
- 内存占用：保持 ~50MB

## 🔄 更新指南

```bash
# 从 npm 全局安装更新
npm update -g github:aquarkgn/HuHaa-MySkills

# 或从源码
cd ~/Project/HuHaa-MySkills
git pull origin main
npm install
```

## 🙏 贡献者

感谢 @contributor1 @contributor2 的贡献。

---

**完整变更日志** - [CHANGELOG.md](../CHANGELOG.md)
```

## GitHub Actions 工作流

### 验证工作流 (.github/workflows/verify.yml)

```yaml
name: Verify

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run verify
      - run: npm test
```

### 发布工作流 (.github/workflows/release.yml)

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run verify
      - run: npm publish  # 如果要发布到 npm
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 文档结构

```
docs/
├── README.md              # 项目总览
├── GUIDE.md              # 快速启动指南（本文件）
├── PLAN.md               # 架构和设计文档
├── RULES.md              # 本发布规范
├── CHANGELOG.md          # 变更日志
├── RUNBOOK-*.md          # 操作手册
├── ARCHITECTURE.md       # 详细架构（TODO）
├── API.md                # API 参考（TODO）
├── CONTRIBUTING.md       # 贡献指南（TODO）
└── todo/
    ├── v0.1.2.md
    ├── v0.1.3.md
    └── ...
```

## 标签（Labels）

推荐在 GitHub Issues 中使用以下标签：

| 标签 | 说明 |
|------|------|
| `bug` | 缺陷报告 |
| `enhancement` | 功能请求 |
| `documentation` | 文档改进 |
| `good first issue` | 适合新贡献者 |
| `help wanted` | 寻求帮助 |
| `question` | 提问 |
| `wontfix` | 无意修复 |
| `duplicate` | 重复问题 |
| `v0.1.x` | 版本标记 |

---

**相关文档** → [CONTRIBUTING.md（待完善）](./CONTRIBUTING.md)
