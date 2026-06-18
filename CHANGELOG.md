# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/) 规范。

版本号遵循 [Semantic Versioning](https://semver.org/)。

完整的版本发布说明详见 [docs/releases/](./docs/releases/)

---

## [Unreleased]

### Planned
- **v0.1.4** (TBD): 分组与筛选增强 → [计划](./docs/todo/v0.1.4.md)
- **v0.1.5** (TBD): 导出与分享 → [计划](./docs/todo/v0.1.5.md)
- **v0.1.6** (TBD): 增量扫描与缓存 → [计划](./docs/todo/v0.1.6.md)
- **v0.1.7** (TBD): 跨平台完整支持 → [计划](./docs/todo/v0.1.7.md)
- **v0.1.8** (TBD): 开发者工具 → [计划](./docs/todo/v0.1.8.md)
- **v0.1.9** (TBD): 完成度冲刺 → [计划](./docs/todo/v0.1.9.md)

详见 [版本计划总汇](./docs/releases/)

---

## [v0.1.3] - 2026-06-18

全球 20+ 编辑器支持 | [详细说明](./docs/releases/v0.1.3.md)

### Added
- ✅ 扩展编辑器支持：从 6 个增至 20+ 个
- ✅ 新增编辑器支持：VS Code Insiders、Zed、Vim、Emacs、Sublime 4、TextMate、BBEdit、Atom、Kate、Gedit、JetBrains IDEs、Openclaw、Herems
- ✅ 优化编辑器检测逻辑，支持多个版本
- ✅ 改进交互界面，支持 1-based 编号和更好的格式化
- ✅ 完整的 macOS 和 Linux 平台支持

### Changed
- 更新版本号从 0.1.2 → 0.1.3
- 改进 `sync-skills.sh` 脚本的易读性和可维护性
- 优化编辑器检测流程

---

## [v0.1.2] - 2026-06-18

编辑器技能自动同步 | [详细说明](./docs/releases/v0.1.2.md)

### Added
- ✅ 编辑器技能自动同步脚本 (`service/scripts/sync-skills.sh`)
- ✅ 支持 6 种编辑器 (Cursor、VS Code、Helix、Neovim、Sublime、Windsurf)
- ✅ 交互式多选界面（全选、部分选择）
- ✅ curl 远程安装入口脚本 (`install-and-sync.sh`)
- ✅ 跨平台支持 (macOS, Linux, WSL)
- ✅ bash 3.2+ 兼容性
- ✅ 完整的使用文档 (`docs/SYNC-SKILLS.md`)
- ✅ npm 命令支持 (`npm run sync`, `npm run sync:remote`)

### Changed
- 更新版本计划，v0.1.2-v0.1.9 标记为 TBD

---

## [v0.1.1] - 2026-06-18

npm 全局安装支持 | [详细说明](./docs/releases/v0.1.1.md)

### Added
- ✅ npm 全局安装支持 (`npm install -g github:aquarkgn/HuHaa-MySkills`)
- ✅ 完整的验证流程 (`npm run verify`)
- ✅ 稳定的二进制生成和跨平台支持

### Fixed
- 规范化 npm bin 路径，支持跨平台安装
- 修复 Git install 的 web 资产分发
- 优化 npm 依赖安装流程

### Changed
- 改进了启动流程的鲁棒性

---

## [v0.1.0] - 2026-06-17

首个可用版本 | [详细说明](./docs/releases/v0.1.0.md)

### Added
- 🎉 多源技能聚合（Hermes、Claude Code、Cursor、MCP）
- 本地 SPA 浏览器（localhost:11520）
- 搜索、分组、筛选、一键复制
- 热更新（chokidar watch）
- 完整的验证和测试套件

---

## 📖 版本导航

### 快速查看
- **简明版本历史** ← 当前文档
- **详细版本说明** → [docs/releases/](./docs/releases/)
- **开发计划** → [docs/todo/](./docs/todo/)

### 每个版本的完整说明包含
- 版本目标和主题
- 新增功能列表
- Bug 修复详情
- 性能对比数据
- 测试覆盖情况
- 安装升级指南
- Breaking Changes 说明

---

[Unreleased]: https://github.com/aquarkgn/HuHaa-MySkills/compare/v0.1.3...HEAD
[v0.1.3]: https://github.com/aquarkgn/HuHaa-MySkills/compare/v0.1.2...v0.1.3
[v0.1.2]: https://github.com/aquarkgn/HuHaa-MySkills/compare/v0.1.1...v0.1.2
[v0.1.1]: https://github.com/aquarkgn/HuHaa-MySkills/compare/v0.1.0...v0.1.1
[v0.1.0]: https://github.com/aquarkgn/HuHaa-MySkills/releases/tag/v0.1.0
