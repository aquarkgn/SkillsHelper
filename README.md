# 🎯 HuHaa-MySkills

**本地 AI 技能聚合中枢** — 一行命令发现、同步、管理你所有的 AI 技能和编辑器规则

> 把散落在 Hermes / Claude Code / Cursor / Codex / Obsidian / 各项目里的「技能、插件、MCP、规则」全部聚合到一个浏览器界面。搜索、复制、在编辑器中打开，一切就在本地。

---

## 🚀 一键启动（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/aquarkgn/HuHaa-MySkills/main/install-and-sync.sh | bash
```

**做了什么？**
1. 检查系统要求（Node.js 20+）
2. npm 全局安装 HuHaa-MySkills
3. 自动扫描已安装的编辑器（全球 20+ 款编辑器和开发工具）
4. 显示交互菜单，让你选择要同步的编辑器
5. 自动同步技能配置
6. 启动本地服务 `http://localhost:11520`

**支持的编辑器和工具：**
- **代码编辑器** — Cursor、VS Code、VS Code Insiders、Windsurf、Zed、Sublime Text、TextMate
- **终端编辑器** — Neovim、Vim、Emacs、Helix
- **其他编辑器** — Atom、Kate、Gedit、BBEdit、JetBrains IDEs
- **新兴工具** — Openclaw、Herems、Trae、Trae CN

**就这么简单！** 无需 git clone，无需手动配置，一条命令搞定。

---

## ✨ 核心功能

### 🔍 多源技能聚合

HuHaa-MySkills 自动扫描并统一展示：

- **Hermes Skills** - `~/.hermes/skills/*/SKILL.md`
- **Claude Code Skills** - `~/.claude/skills/*/SKILL.md`
- **Cursor Rules** - `~/.cursor/.cursorrules` 和 `.cursor/rules/*`
- **Codex Instructions** - `AGENTS.md` 和 `CLAUDE.md`
- **MCP Servers** - 自动识别所有配置的 MCP 服务和工具
- **Hermes Plugins** - `~/.hermes/plugins/*/manifest.*`
- **项目 Runbooks** - 项目根目录的 `docs/RUNBOOK-*.md`
- **Obsidian Notes** - 带 `#skill` 标签的笔记（可选）

### 💻 浏览器界面（localhost:11520）

```
┌─────────────────────────────────────────────────────┐
│ HuHaa-MySkills - 技能中心                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  左侧树状目录              右侧预览/详情             │
│  ├─ 按来源分组              ┌──────────────────┐   │
│  ├─ 按类别分组              │ skill: new-api   │   │
│  ├─ 按品牌分组              │ 部署优化技能      │   │
│  └─ 按产品分组              │                  │   │
│                             │ 📋 复制路径      │   │
│  🔍 搜索框                  │ 📝 复制原文      │   │
│  (支持快捷键 /)             │ 🔧 在 Cursor打开 │   │
│                             └──────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 🎯 功能特性

- **快速搜索** - Fuse.js 全文搜索，<5ms 延迟，支持 800+ 条目
- **多维度过滤** - 按来源、编辑器、品牌、类别、产品组合筛选
- **一键复制** - 复制路径、相对路径、原文本、调用 prompt
- **编辑器集成** - 在 Cursor / VS Code 中一键打开
- **热更新** - 文件变更自动刷新界面
- **智能同步** - 自动同步技能到 20+ 个编辑器配置（v0.1.3+）
- **本地优先** - 零上传，所有数据在本地，无云依赖

---

## 📖 使用流程

### 1️⃣ 安装 & 初始化（一键完成）

```bash
curl -fsSL https://raw.githubusercontent.com/aquarkgn/HuHaa-MySkills/main/install-and-sync.sh | bash
```

🎉 第一次运行会：
- 安装依赖
- 初始化配置 `~/.config/huhaa-myskills/sources.yaml`
- 自动启动浏览器打开 `http://localhost:11520`

### 2️⃣ 浏览器中探索

访问 **http://localhost:11520**：
- 搜索你的技能（例：输入 "deploy" 找部署相关技能）
- 点击任何技能查看详情
- 复制到剪贴板或在编辑器中打开

### 3️⃣ 同步到编辑器（可选）

如果要让技能配置与编辑器同步：

```bash
# 已全局安装的情况下
huhaa-myskills sync

# 或用 npm
npm run sync
```

交互选择要同步的编辑器，自动完成。

### 4️⃣ 后续启动

```bash
# 启动浏览器界面
huhaa-myskills start

# 查看统计信息
huhaa-myskills stats

# 扫描并输出 JSON（调试用）
huhaa-myskills scan
```

---

## 🔧 配置

### 默认配置位置

```bash
~/.config/huhaa-myskills/sources.yaml
```

### 添加更多扫描源

编辑 `sources.yaml`，例如添加项目 runbooks：

```yaml
sources:
  hermes:
    enabled: true
  claude-code:
    enabled: true
  mcp-config:
    enabled: true
  
  # 添加项目目录
  project-runbook:
    enabled: true
    roots:
      - ~/Project/HuHaa-AI-Platform
      - ~/Project/Another-Project
    glob: 'docs/RUNBOOK-*.md'
```

保存后浏览器会自动重新扫描。

### 自定义数据目录

```bash
HUHAA_HOME=/tmp/huhaa-myskills huhaa-myskills start
```

### 自定义端口

```bash
PORT=11530 huhaa-myskills start
```

---

## 📋 其他安装方式

### 方式 B：本地克隆（适合开发者）

```bash
git clone https://github.com/aquarkgn/HuHaa-MySkills.git
cd HuHaa-MySkills
npm install
npm start
```

### 方式 C：npm 全局安装（不含编辑器同步）

```bash
npm install -g github:aquarkgn/HuHaa-MySkills
huhaa-myskills init
huhaa-myskills start
```

---

## 🎮 v0.1.2 新增：编辑器技能同步

自动将项目技能同步到你的所有编辑器配置目录。

**支持的编辑器：**
- Cursor - 同步 `.cursorrules`
- VS Code - 同步代码片段
- Helix - 同步 `config.toml`
- Neovim - 生成 `init.lua`
- Sublime Text - 同步用户设置
- Windsurf - 同步编辑器配置

**使用：**

```bash
# 方式 1：交互选择
npm run sync

# 方式 2：远程执行
npm run sync:remote

# 选择要同步的编辑器
# [1] cursor
# [2] vscode
# ...
# 请输入选择: 0  # 全选
```

---

## 🔐 安全性

HuHaa-MySkills 是本地优先的设计：

- ✅ **零上传** - 所有数据在本地 `~/.config/huhaa-myskills/`
- ✅ **仅本地绑定** - 服务器只监听 `127.0.0.1`，不暴露到网络
- ✅ **路径白名单** - 复制/打开文件严格校验，防止路径穿越
- ✅ **配置隐蔽** - MCP 密钥等敏感信息在浏览器中被屏蔽
- ✅ **无云依赖** - 完全离线工作，无 telemetry

---

## 📊 了解更多

| 文档 | 链接 |
|------|------|
| 完整使用指南 | [docs/SYNC-SKILLS.md](./docs/SYNC-SKILLS.md) |
| 快速启动 | [docs/GUIDE.md](./docs/GUIDE.md) |
| 发布规范 | [docs/RULES.md](./docs/RULES.md) |
| 项目规划 | [docs/PLAN.md](./docs/PLAN.md) |
| API 文档 | 见下方 API 部分 |

---

## 🛠 命令参考（高级）

首次安装后自动配置完成。以下命令用于日常管理和调试：

| 命令 | 说明 |
|------|------|
| `huhaa-myskills start` | 启动服务，自动打开浏览器 |
| `huhaa-myskills init` | 重新初始化配置 |
| `huhaa-myskills scan` | 扫描并输出 JSON 到命令行 |
| `huhaa-myskills stats` | 显示扫描统计 |
| `huhaa-myskills duplicates` | 查找重复项目 |
| `huhaa-myskills sync` | 同步技能到编辑器（交互式） |
| `huhaa-myskills purge` | 删除所有数据和配置 |

对应 npm scripts：
```bash
npm start              # 启动
npm run init          # 初始化
npm run scan          # 扫描
npm run stats         # 统计
npm run sync          # 编辑器同步
npm run purge         # 删除数据
npm run dev           # 开发模式（热重载）
npm test              # 运行测试
```

---

## 🧪 验证安装

确保系统完整性：

```bash
npm run verify
```

预期输出：
```
[verify] PASS build + tests + HTTP/API/static smoke checks
```

---

## 🚮 卸载 & 清理

完全移除 HuHaa-MySkills 和相关数据：

```bash
# 删除所有配置和数据
npm run purge

# 删除全局安装（如已全局安装）
npm uninstall -g huhaa-myskills

# 删除项目代码
rm -rf HuHaa-MySkills
```

---

## 💻 系统要求

- **Node.js** 20+（自动检查）
- **npm** 8+
- **macOS** 或 **Linux**（Windows 需要 WSL 或类似环境）

macOS 额外支持：
- `pbcopy` 用于剪贴板操作
- Finder "显示文件" 功能
- Cursor 编辑器集成

---

## 🏗 项目结构（开发者）

```
service/bin/              CLI 入口
service/packages/
  ├─ scanner/            多源适配器 + IR 规范化
  ├─ server/             Fastify API 服务
  └─ web/                Vue 3 前端 SPA
service/scripts/          工具脚本（同步、验证等）
service/config/           配置模板
docs/                     文档和规划
```

---

## 🔗 API 参考（前端开发）

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/skills` | 获取所有技能列表 |
| GET | `/api/skills/:id` | 获取单个技能详情（含 raw） |
| GET | `/api/stats` | 获取扫描统计 |
| GET | `/api/reload-state` | 获取重载状态 |
| POST | `/api/reload` | 触发重新扫描 |
| GET | `/api/events` | SSE 事件流 |
| POST | `/api/copy` | 复制到剪贴板 |
| POST | `/api/open` | 在编辑器中打开 |

---

## 📈 版本历史

- **v0.1.4** (2026-06-18) - 多源扫描增强（~/skills、~/mcp、~/skill）
- **v0.1.3** (2026-06-18) - 全球 20+ 编辑器支持
- **v0.1.2** (2026-06-18) - 编辑器技能自动同步
- **v0.1.1** (2026-06-18) - npm 全局安装支持
- **v0.1.0** (2026-06-17) - 首个可用版本

[查看完整版本历史](./CHANGELOG.md)

---

## 📝 贡献指南

感谢你的贡献！请参考 [RULES.md](./docs/RULES.md) 了解：
- Conventional Commits 规范
- Pull Request 流程
- Issue 报告格式

---

## 📄 许可证

MIT

---

**问题反馈** → [GitHub Issues](https://github.com/aquarkgn/HuHaa-MySkills/issues)

**功能建议** → [Discussion](https://github.com/aquarkgn/HuHaa-MySkills/discussions)

**快速开始** → 回到上面的 [🚀 一键启动](#-一键启动推荐)
