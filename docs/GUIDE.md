# HuHaa-MySkills 快速启动指南

> 5 分钟内将 HuHaa-MySkills 部署到你的本地环境

## 前置条件

- **Node.js 20+** - 检查：`node --version`
- **npm** - 检查：`npm --version`
- **macOS/Linux/Windows** - 支持所有平台

## 安装方式

### 选项 A：快速启动（推荐）

```bash
# 1. 克隆到 Project 目录
cd ~/Project
git clone https://github.com/aquarkgn/HuHaa-MySkills.git
cd HuHaa-MySkills

# 2. 安装依赖
npm install

# 3. 启动（自动打开浏览器）
npm start
```

✓ 完成。浏览器会自动打开 `http://localhost:11520`

### 选项 B：全局 CLI

```bash
# 一次安装，到处使用
npm install -g github:aquarkgn/HuHaa-MySkills

# 任何目录启动
huhaa-myskills start
huhaa-myskills scan
huhaa-myskills stats
```

### 选项 C：从 Hermes 技能启动

在 Hermes 或 Claude Code 中调用技能 `huhaa-myskills-manager`：

```
"启动 huhaa" 或 "打开技能中心"
```

自动判断状态并启动。

## 首次配置

### 1. 自动生成配置文件

首次启动时，HuHaa 会在用户数据目录创建 `sources.yaml`：

```bash
# macOS / Linux
~/.config/huhaa-myskills/sources.yaml

# 或指定自定义路径
export HUHAA_HOME=/path/to/config
npm start
```

### 2. 默认扫描源

| 源 | 路径 | 说明 |
|----|------|------|
| **hermes** | `~/.hermes/skills/` | Hermes 技能库 |
| **claude-code** | `~/.claude/skills/` | Claude Code 技能 |
| **mcp-config** | 各配置文件 | MCP 服务器定义 |
| **cursor-rules** | `.cursorrules` 等 | Cursor 规则 |
| **project-runbook** | `docs/RUNBOOK-*.md` | 项目文档 |

### 3. 自定义扫描源

编辑 `sources.yaml` 添加新源：

```yaml
sources:
  hermes:
    enabled: true
    roots:
      - ~/.hermes/skills
  
  my-project-skills:
    enabled: true
    roots:
      - ~/Project/MyProject/skills
    glob: "**/*.md"

limits:
  maxFiles: 5000
  maxFileBytes: 1048576
```

## 核心命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动并打开浏览器 |
| `npm run scan` | 仅扫描，输出 JSON |
| `npm run stats` | 统计信息 |
| `npm run dev` | 开发模式（热重载） |
| `npm run verify` | 完整性检查 |
| `npm test` | 运行测试 |

## 使用场景

### 场景 1：查找技能

```bash
# 浏览器打开 localhost:11520
# ↓
# 搜索框输入关键词（支持中文）
# ↓
# 找到目标技能
# ↓
# 点击"复制原文" 或 "复制路径"
# ↓
# 粘贴到 Cursor 上下文使用
```

### 场景 2：浏览所有 MCP

```bash
# 主页左侧分组切换为 "source"
# ↓
# 选择 "mcp-config"
# ↓
# 查看所有已配置的 MCP 服务器和工具
# ↓
# 在详情页复制工具定义
```

### 场景 3：开发新技能

```bash
# 1. 在编辑器中创建 ~/.hermes/skills/my-skill/SKILL.md
# 2. HuHaa 会在 1 秒内自动检测并显示
# 3. 实时查看、测试、调试
```

## 故障排查

### 端口被占用

```bash
PORT=11521 npm start
```

### 依赖安装失败

```bash
rm -rf node_modules package-lock.json
npm install
```

### 某个源为 unavailable

```bash
# 检查源配置
cat ~/.config/huhaa-myskills/sources.yaml

# 或诊断
huhaa-myskills doctor  # v0.1.8+ 支持
```

### 搜索性能慢

```bash
# 编辑 sources.yaml，添加 exclude 规则
exclude:
  - "**/node_modules"
  - "**/.git"
  - "**/dist"
```

## 下一步

- 📖 [完整文档](../README.md)
- 🏗️ [架构设计](./PLAN.md)
- 📋 [版本计划](./todo/)
- 🚀 [Runbook](./RUNBOOK-myskills.md)

---

**需要帮助？** → [GitHub Issues](https://github.com/aquarkgn/HuHaa-MySkills/issues)
