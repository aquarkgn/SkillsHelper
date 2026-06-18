# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/) 规范。

版本号遵循 [Semantic Versioning](https://semver.org/)。

---

## [Unreleased]

### Planned
- v0.1.2: Hermes 技能集成 + 搜索优化
- v0.1.3: Obsidian Vault 与 Claude.md 支持
- v0.1.4: 分组与筛选增强
- v0.1.5: 导出与分享
- ...参见 [版本计划](docs/todo/)

---

## [v0.1.1] - 2026-06-18

### Added
- ✅ npm 全局安装支持 (`npm install -g github:aquarkgn/HuHaa-MySkills`)
- ✅ GitHub npm 安装 (`npm install -g github:aquarkgn/HuHaa-MySkills`)
- ✅ 完整的验证流程 (`npm run verify`)
- ✅ 稳定的二进制生成

### Fixed
- 规范化 npm bin 路径，支持跨平台安装
- 修复 Git install 的 web 资产分发
- 优化 npm 依赖安装流程

### Changed
- 改进了启动流程的鲁棒性

### Notes
- 本版本标志着 npm 全局安装支持完成
- 后续版本将专注于功能扩展和性能优化

---

## [v0.1.0] - 2026-06-17

### Added
- 🎉 首个可用版本
- 核心功能：
  - 多源技能聚合（Hermes、Claude Code、Cursor、MCP）
  - 本地 SPA 浏览器（localhost:11520）
  - 搜索、分组、筛选
  - 一键复制（路径、原文、在编辑器打开）
  - 热更新（chokidar watch）
  - 全 Node.js 实现（无外部依赖）
  
### Architecture
- Scanner：多源 → 统一 IR
- Server：Fastify + SSE
- Web：Vite + Vue3

### Testing
- 完整的单元测试套件
- 验证脚本和 smoke tests
- Node 20+ 兼容性检查

---

## 发布历史说明

### v0.1.0 初版
- P0-P7 完整实现（8 小时工作量）
- 本地聚合 Hermes 660+ 技能
- 完整的搜索和交互体验

### v0.1.1 npm 支持
- 重点：全局安装支持
- 支持 `npm install -g github:aquarkgn/HuHaa-MySkills`
- 优化启动和依赖处理

### 后续版本规划
详见 [版本计划](./docs/todo/)

---

[Unreleased]: https://github.com/aquarkgn/HuHaa-MySkills/compare/v0.1.1...HEAD
[v0.1.1]: https://github.com/aquarkgn/HuHaa-MySkills/compare/v0.1.0...v0.1.1
[v0.1.0]: https://github.com/aquarkgn/HuHaa-MySkills/releases/tag/v0.1.0
