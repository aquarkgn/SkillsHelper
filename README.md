# SkillHelper

SkillHelper 是一个本地桌面应用，用于统一发现和理解 AI 编辑器中的技能、MCP 工具、插件与 CLI 命令，并提供中文本地化能力。

首期聚焦：

- Claude：技能、Agent、插件、MCP 名称与 CLI 的只读扫描。
- ChatGPT Desktop：发现本地安装与数据目录，后续根据真实格式补齐技能、MCP 与插件适配器。
- 中文化：迁移语言识别、翻译缓存、代码段跳过和离线原文回退规则。

当前不提供模型代理、Provider 管理、请求转发、计费、测速或故障切换。

## 开发

```bash
pnpm install --frozen-lockfile
pnpm tauri dev
```

常用校验：

```bash
pnpm run typecheck
pnpm run build:renderer
cargo test --manifest-path src-tauri/Cargo.toml
```

推广页保留在 `packages/site/`，不承担本地扫描或主应用查看功能。

## 参考与许可

本项目的桌面工程基于 [cc-switch v3.9.1](https://github.com/farion1231/cc-switch/tree/v3.9.1) 进行改造。其原始代码按 MIT License 发布，版权声明与许可证保留在 [LICENSE](LICENSE)。SkillHelper 的品牌、产品范围、扫描模型与中文化功能由本项目单独维护。
