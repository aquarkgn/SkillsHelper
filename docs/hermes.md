Hermes CLI 中文帮助手册与 Next.js 项目开发计划书

第一部分：Hermes CLI 全中文帮助手册

Hermes 是由 Informal Systems 用 Rust 编写的开源 IBC（Inter-Blockchain Communication，跨链通信协议）中继器 CLI 工具。它是区块链网络架构中的核心组件，负责在多条链之间中继 IBC 数据报。

• 官方文档地址：https://hermes.informal.systems
• GitHub 仓库：https://github.com/informalsystems/hermes
• 推荐版本：v1.x+

1. 全局选项 (Global Options)

长选项

短选项

说明

--config <FILE>

-c

指定配置文件路径（默认：$HOME/.hermes/config.toml）

--help

-h

打印帮助信息

--json

-j

启用 JSON 格式输出

--version

-V

打印版本信息

--debug=profiling

—

启用性能分析调试模式（配合 time! 宏）

2. help 命令

官方推荐使用 hermes help <SUBCOMMAND> 而非 --help，因为前者会显示该子命令的完整长文本帮助。

3. 顶层子命令与工作流

start: 以多链模式启动中继器，监听配置链上的 IBC 事件并中继数据包。

config: 验证（config validate）或自动生成（config auto）配置文件。

keys: 密钥管理：keys add (添加/恢复密钥)、keys list (列出密钥)、keys delete (删除密钥)、keys balance (查询余额)。

health-check: 对配置中的所有链进行连接、RPC、gRPC 端口和版本兼容性的健康检查。

create: 在链上创建 IBC 对象：create client (客户端)、create connection (连接)、create channel (通道)。

query: 查询命令：支持查询 clients, connections, channels, 以及数据包状态（packet commitments, pending, pending-sends, pending-acks）。

tx: 发送交易：如 tx upgrade-chain 发送链升级计划（低级内部 tx raw 命令在 v1.x 已废弃集成）。

clear: clear packets 清理指定通道上未处理的数据包。

listen: 连接到指定链并实时打印 IBC 事件。

misbehaviour: 异常行为检测，监测轻客户端分叉并向链上提交证据。

update / upgrade: 更新或升级客户端。

completions: 生成 Shell (bash, zsh, fish) 的自动补全脚本。

4. 内部高级命令与调试

• 运行时动态调整日志级别：

hermes logs set-log-level --log-filter ibc --log-level debug
hermes logs set-log-level --log-level info

• 性能分析（Profiling）：通过 `--debug=profiling` 全局参数启动中继器，在控制台输出各阶段的耗时。

第二部分：Next.js 项目开发计划书

本计划旨在设计和构建一个高可用的 Next.js 官方版本号切换文档展示站，该网站将支持在多版本文档之间切换，并且深度集成对上游（如 Hermes CLI 手册）的自动同步与发布。

1. 技术选型

类别

选型

理由

前端框架

Next.js 15 (App Router)

出色的 SSG & ISR 静态生成和增量再生能力，天然适合多版本文档路由。

语言

TypeScript

严格定义文档的 frontmatter 和路由参数类型，确保多版本切换的安全性。

渲染引擎

next-mdx-remote / Contentlayer

支持强大的 MDX 交互式文档渲染、Shiki 代码高亮和目录自动解析。

样式框架

Tailwind CSS + shadcn/ui

极简现代风，原生暗黑模式支持，可无缝集成各种交互式UI组件。

版本路由

Dynamic Route [version]/[...slug]

通过动态参数实现优雅的 URL 版本隔离，如 /v1.10/commands。

全文搜索

Fuse.js (本地) / Algolia (生产)

支持多版本感知的智能分级检索（Command Palette 体验）。

2. 文档自动更新与同步方案 (Auto-Update)

为保持文档站与官方/上游软件发布的完全实时同步，项目设计了全自动化的发布流水线（CI/CD Pipeline），无需任何人工干预即可无感更新。

版本检测 (Version Checking): 通过 GitHub API 每天定时或在 Release 触发 Webhook 时，抓取最新的 Release tag_name（如 v1.10），并将其与本地 versions.json 配置文件比对。

文档抓取 (Document Fetching): 脚本自动 clone/pull 上游仓库中的 Markdown 文件，使用正则或脚本自动翻译/排版，并转化为对应的 MDX 格式保存至本地 content/[version] 路径。

增量静态再生 (ISR): 配合 Next.js 15 的 revalidatePath() API，无需重新构建整个站点，仅对更改的页面进行增量再生，页面更新延时低于 1 秒。

搜索索引同步 (Search Indexing): 更新文档后，自动调用脚本生成新的 Fuse.js 索引并提交到 Algolia 平台，确保用户搜索最新版本能立即得到准确结果。

3. 项目里程碑与交付计划 (28天)

时间节点

里程碑任务

核心交付物

第 1 周

项目初始化与版本路由搭建

Next.js 15 基础脚手架，实现 [version]/[...slug] 的优雅动态路由。

第 2 周

MDX 渲染与文档抓取脚本

支持代码 Shiki 高亮、TOC 自动生成和一键拉取上游文档脚本。

第 3 周

UI/UX 精细化与搜索集成

版本切换下拉组件、响应式侧边导航、Cmd+K 搜索面板。

第 4 周

自动更新流水线与生产部署

实现 GitHub Actions 自动更新闭环，项目正式发布上线至 Vercel。

