# 数据源激活实施方案 (E1-3)

## 概述

本文档提供数据源完整性验证和激活的详细方案。

**目标**: 激活所有关键数据源，确保 Hermes 完整集成

---

## 数据源现状评估

| 数据源 | 状态 | 文件数 | 优先级 | 行动 |
|--------|------|--------|--------|------|
| Hermes Core | ✅ 完全启用 | 84,605 | - | 无需操作 |
| Hermes Skills | ✅ 完全启用 | 145 个技能 | - | 无需操作 |
| Codex 集成 | ✅ 完全启用 | 5,378 | - | 无需操作 |
| Claude 集成 | ✅ 完全启用 | 81 | - | 无需操作 |
| MCP (~/MCP) | 🟡 部分启用 | 2 个配置 | P1 | 激活 ~/.mcp |
| Cursor 集成 | ❌ 未启用 | - | P2 | 检查配置路径 |
| Hermes Plugins | ❌ 未启用 | - | P3 | 初始化目录 |

---

## P1: MCP 数据源激活 (高优先级)

### 现状分析

```
发现位置: ~/MCP/
├── dingtalk.mcp.json      (钉钉 MCP 配置)
└── gitnexus.mcp.json      (GitNexus MCP 配置)

期望位置: ~/.mcp/
(Hermes 标准 MCP 配置目录)

问题: 
- ~/.mcp 目录不存在
- 现有配置未在标准路径激活
- 可能导致 MCP 工具无法被 Hermes 发现
```

### 激活方案 A: 创建符号链接 (推荐)

```bash
#!/bin/bash
# Step 1: 创建 ~/.mcp 目录
mkdir -p ~/.mcp

# Step 2: 创建符号链接到 MCP 配置
ln -s ~/MCP/dingtalk.mcp.json ~/.mcp/dingtalk.mcp.json
ln -s ~/MCP/gitnexus.mcp.json ~/.mcp/gitnexus.mcp.json

# Step 3: 验证
ls -la ~/.mcp/
echo "✓ MCP 配置已激活"
```

**优点**:
- 维持单一真实数据源 (~/MCP)
- 便于同步和维护
- 支持将来动态添加新 MCP

**缺点**: 依赖符号链接（若 ~/MCP 移动需更新）

---

### 激活方案 B: 复制配置文件

```bash
#!/bin/bash
# Step 1: 创建 ~/.mcp 目录
mkdir -p ~/.mcp

# Step 2: 复制配置
cp ~/MCP/*.mcp.json ~/.mcp/

# Step 3: 验证
ls -la ~/.mcp/
echo "✓ MCP 配置已复制到 ~/.mcp"
```

**优点**:
- 独立可靠，不依赖符号链接
- 配置路径清晰

**缺点**: 需手动保持两处同步

---

### 激活方案 C: 配置中心管理 (最佳实践)

如果 Hermes 支持 MCP 路径配置，可设置环保变量或配置文件：

```bash
# ~/.hermes/config.json 或环境变量
export HERMES_MCP_PATH="~/MCP"
# 或在 Hermes 配置中指向该路径
```

**优点**: 灵活，支持自定义路径
**缺点**: 需检查 Hermes 是否支持此配置

---

### 执行步骤

#### 推荐: 方案 A (符号链接)

```bash
# 1. 备份现状
echo "Current MCP setup:"
ls -la ~/.mcp 2>/dev/null || echo "~/.mcp does not exist"
ls -la ~/MCP/

# 2. 创建并激活
mkdir -p ~/.mcp
cd ~/.mcp
ln -s ../MCP/*.mcp.json . 2>/dev/null || true
# 或显式创建
ln -sf ~/MCP/dingtalk.mcp.json .
ln -sf ~/MCP/gitnexus.mcp.json .

# 3. 验证
echo "✓ Symbolic links created:"
ls -la ~/.mcp/

# 4. 验证文件可访问
for f in ~/.mcp/*.mcp.json; do
  echo "Checking $f:"
  cat "$f" | head -2
done
```

---

## P2: Cursor 集成配置 (中优先级)

### 现状分析

```
搜索位置:
- ~/.config/Cursor/          ❌ 不存在
- ~/.cursor/                 ❌ 不存在
- ~/Library/Application Support/Cursor/  (未完全检查)

状态: Cursor 配置未在检查路径找到
原因可能:
1. Cursor 未安装或使用默认系统路径
2. Cursor 配置存储在应用程序支持目录
3. Cursor 配置在其他位置
```

### 诊断步骤

```bash
#!/bin/bash
# 1. 检查 Cursor 应用是否存在
if [ -d "/Applications/Cursor.app" ]; then
  echo "✓ Cursor 已安装"
else
  echo "✗ Cursor 未安装"
  exit 1
fi

# 2. 搜索 Cursor 配置目录
echo "搜索 Cursor 配置..."
find ~/ -name "*Cursor*" -type d 2>/dev/null | head -10
find ~/Library -name "*Cursor*" -type d 2>/dev/null

# 3. 检查环境变量
echo "Cursor 相关环保变量:"
env | grep -i cursor || echo "无 Cursor 相关环保变量"

# 4. 列出可能的位置
echo ""
echo "可能的配置位置:"
for path in \
  "~/.config/Cursor" \
  "~/.cursor" \
  "~/Library/Application Support/Cursor" \
  "~/Library/Caches/Cursor"; do
  expanded_path="${path/\~/$HOME}"
  if [ -d "$expanded_path" ]; then
    echo "  ✓ $path ($(find "$expanded_path" -type f | wc -l) 文件)"
  else
    echo "  ✗ $path (不存在)"
  fi
done
```

### 激活方案

如果找到 Cursor 配置:

```bash
# 选项1: 创建链接到标准位置
mkdir -p ~/.config
ln -s ~/Library/Application\ Support/Cursor ~/.config/Cursor

# 选项2: 设置环保变量在 ~/.zshrc 或 ~/.bashrc
export CURSOR_CONFIG_PATH="~/Library/Application Support/Cursor"

# 选项3: 在 Hermes 配置中显式指向 Cursor 路径
# (参考 Hermes 文档的 cursor 集成方式)
```

---

## P3: Hermes 插件系统初始化 (可选)

### 现状

```
~/.hermes/plugins/          ❌ 目录不存在

如需使用 Hermes 插件系统:
```

### 初始化步骤

```bash
#!/bin/bash
# 1. 创建目录结构
mkdir -p ~/.hermes/plugins

# 2. 创建标准子目录
mkdir -p ~/.hermes/plugins/{local,remote,community}

# 3. 创建 README
cat > ~/.hermes/plugins/README.md << 'EOF'
# Hermes Plugins

存储位置:
- local/     本地开发插件
- remote/    远程/API 集成
- community/ 社区插件

使用文档: https://hermes-agent.nousresearch.com/docs
EOF

# 4. 验证
echo "✓ Hermes 插件系统已初始化:"
ls -la ~/.hermes/plugins/
```

---

## 执行清单

### 必执行项

- [ ] **P1: MCP 激活** (高优先级)
  - [ ] 创建 ~/.mcp 目录
  - [ ] 激活 ~/MCP 配置 (符号链接或复制)
  - [ ] 验证 ~/.mcp/*.mcp.json 可访问
  - [ ] 检查 MCP 工具是否被 Hermes 发现

### 可选项

- [ ] **P2: Cursor 集成** (如需要)
  - [ ] 诊断 Cursor 配置位置
  - [ ] 创建配置链接或设置环保变量
  
- [ ] **P3: 插件系统** (如计划使用)
  - [ ] 初始化 ~/.hermes/plugins 目录

---

## 完整激活脚本

```bash
#!/bin/bash
set -e

echo "=================================================================================="
echo "Hermes 数据源激活脚本"
echo "=================================================================================="

# P1: MCP 激活
echo ""
echo "【P1】 激活 MCP 数据源..."

if [ ! -d ~/.mcp ]; then
  mkdir -p ~/.mcp
  echo "  ✓ 创建 ~/.mcp 目录"
else
  echo "  ℹ ~/.mcp 已存在"
fi

# 创建符号链接
if [ -d ~/MCP ]; then
  cd ~/.mcp
  for mcp_file in ~/MCP/*.mcp.json; do
    filename=$(basename "$mcp_file")
    if [ -L "$filename" ]; then
      echo "  ℹ $filename 符号链接已存在"
    else
      ln -s "$mcp_file" .
      echo "  ✓ 激活 $filename"
    fi
  done
else
  echo "  ⚠️ ~/MCP 目录不存在，跳过 MCP 激活"
fi

echo "  验证 MCP 配置:"
ls -la ~/.mcp/*.mcp.json 2>/dev/null | awk '{print "    ", $NF}'

# P2: 诊断 Cursor
echo ""
echo "【P2】 诊断 Cursor 集成..."

if [ -d "/Applications/Cursor.app" ]; then
  echo "  ✓ Cursor 已安装"
  cursor_configs=$(find ~/Library -path "*Cursor*" -type d 2>/dev/null | head -1)
  if [ -n "$cursor_configs" ]; then
    echo "  ✓ 找到 Cursor 配置: $cursor_configs"
  else
    echo "  ℹ 未找到 Cursor 配置目录"
  fi
else
  echo "  ⚠️ Cursor 未安装"
fi

# P3: 插件系统
echo ""
echo "【P3】 插件系统状态..."

if [ -d ~/.hermes/plugins ]; then
  echo "  ✓ Hermes 插件目录已存在"
  ls -la ~/.hermes/plugins/
else
  echo "  ⚠️ ~/.hermes/plugins 不存在"
  echo "  如需启用插件系统，运行:"
  echo "    mkdir -p ~/.hermes/plugins"
fi

# 最终验证
echo ""
echo "=================================================================================="
echo "✅ 数据源激活完成"
echo "=================================================================================="
echo ""
echo "数据源状态:"
echo "  Hermes Core:      ✅ ($(find ~/.hermes -type f | wc -l) 文件)"
echo "  MCP:              $([ -d ~/.mcp ] && echo '✅' || echo '❌')"
echo "  Codex:            ✅ ($(find ~/.codex -type f 2>/dev/null | wc -l) 文件)"
echo "  Claude:           ✅ ($(find ~/.claude -type f 2>/dev/null | wc -l) 文件)"
echo "  Plugins:          $([ -d ~/.hermes/plugins ] && echo '✅' || echo '⚠️')"
echo ""
```

---

## 验证步骤

### 验证 MCP 激活

```bash
# 1. 检查目录结构
ls -la ~/.mcp/

# 2. 验证符号链接
ls -L ~/.mcp/*.mcp.json

# 3. 检查 MCP 配置内容
for f in ~/.mcp/*.mcp.json; do
  echo "=== $(basename $f) ==="
  head -10 "$f"
  echo ""
done

# 4. 测试 MCP 工具可用性
# (根据 Hermes 的 MCP 测试命令，参考官方文档)
```

### 最终数据源完整性检查

```bash
#!/bin/bash
echo "=== 最终数据源完整性报告 ==="
echo ""
echo "Hermes 核心:"
echo "  主目录: $(find ~/.hermes -type f | wc -l) 文件"
echo "  技能数: $(find ~/.hermes/skills -name SKILL.md | wc -l) 个"
echo ""
echo "已启用数据源:"
[ -d ~/.mcp ] && echo "  ✅ MCP"
[ -d ~/.codex ] && echo "  ✅ Codex ($(find ~/.codex -type f | wc -l) 文件)"
[ -d ~/.claude ] && echo "  ✅ Claude ($(find ~/.claude -type f | wc -l) 文件)"
[ -d ~/.hermes/plugins ] && echo "  ✅ Plugins" || echo "  ⚠️ Plugins (未初始化)"
```

---

## 故障排除

### Q: MCP 激活后 Hermes 仍未识别？
```bash
# 1. 验证符号链接
ls -l ~/.mcp/*.mcp.json

# 2. 检查文件权限
stat ~/.mcp/*.mcp.json

# 3. 验证 JSON 格式
jq . ~/.mcp/*.mcp.json

# 4. 检查 Hermes 日志
# 根据需要查阅 ~/.hermes/logs 或运行日志
```

### Q: Cursor 配置未找到？
```bash
# 查找所有 Cursor 相关目录
find ~/ -iname "*cursor*" -type d 2>/dev/null

# 检查隐藏目录
ls -la ~/Library/Preferences/ | grep -i cursor
ls -la ~/Library/Caches/ | grep -i cursor
```

### Q: 如何撤销 MCP 激活？
```bash
# 移除符号链接
rm ~/.mcp/*.mcp.json

# 或删除整个目录 (需谨慎)
rm -rf ~/.mcp

# 恢复到仅 ~/MCP
echo "MCP 配置仍在 ~/MCP 中，可重新激活"
```

---

## 相关文档

- 诊断报告: `DIAGNOSTIC_REPORT.md`
- 品牌补全方案: `BRAND_COMPLETION_PLAN.md`
- Hermes 官方文档: https://hermes-agent.nousresearch.com/docs
- MCP 文档: https://modelcontextprotocol.io/

---

**文档版本**: 1.0  
**最后更新**: 2026-06-29 10:15 UTC  
**状态**: 就绪，可执行
