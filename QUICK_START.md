# HuHaa-MySkills 快速启动指南

## 🚀 30 秒快速开始

```bash
# 1. 后台启动（推荐）
npm run start

# 输出：
# ✓ HuHaa-MySkills running in background at http://localhost:11520
# 📝 Logs: /Users/mac/.config/huhaa-myskills/huhaa.log

# 2. 浏览器自动打开 http://localhost:11520
# 3. 开始浏览和搜索技能！
```

## ⚙️ 其他启动方式

### 前台启动（用于开发调试）
```bash
npm run start -- --foreground
# 按 Ctrl+C 停止
```

### 查看实时日志
```bash
tail -f ~/.config/huhaa-myskills/huhaa.log
```

### 停止后台服务
```bash
pkill -f "huhaa-myskills start"
```

## 🎯 主要功能

### 左侧 Sidebar
- **Editor Pills** - 选择编辑器快速过滤
- **筛选器** - Kind, Source, Product, Brand, Sort
- **视图切换** - 列表、分类、目录、应用视图
- **Collapse 按钮** - 折叠侧栏扩大主区域

### 顶部搜索栏
- 支持结构化查询：`kind:mcp source:claude-code`
- Clear 按钮清空所有筛选
- Reload 按钮重新扫描技能

### 中间列表面板
- 多个视图模式支持
- 实时搜索和过滤
- 点击技能查看详情

### 右侧详情面板
- 完整的技能信息和 Markdown 内容
- 快捷操作（复制路径、打开文件等）
- 使用说明和参数说明

## 💡 常见操作

### 查找技能
1. 在搜索框输入关键词或使用结构化查询
2. 按 Editor 快速过滤
3. 使用 Sidebar 筛选器精细化结果

### 浏览目录
1. 切换到"目录"视图
2. 展开目录树浏览结构
3. 或在 Sidebar 快速选择顶级目录

### 复制技能内容
1. 点击列表中的技能
2. 在右侧详情面板选择要复制的内容
3. 点击相应的"复制"按钮

## 📱 响应式支持

| 设备 | 体验 |
|------|------|
| 桌面 (≥1200px) | 完整 3 列布局 |
| 平板 (768-1199px) | Sidebar 收缩，List/Detail 动态调整 |
| 手机 (<768px) | Sidebar overlay，单列布局 |

## 🔧 配置

所有用户数据存储在：`~/.config/huhaa-myskills/`

- `sources.yaml` - 技能来源配置
- `huhaa.log` - 运行日志
- `state.json` - 应用状态
- `cache.json` - 扫描缓存

## ❓ 故障排除

### 无法打开浏览器？
手动打开：http://localhost:11520

### 获取完整日志
```bash
tail -100 ~/.config/huhaa-myskills/huhaa.log
```

### 重新扫描技能
点击 Topbar 的 Reload 按钮，或重启应用

### 清除所有数据
```bash
npm run purge
```

## 📚 更多信息

查看完整文档：
- `FINAL_COMPLETION_REPORT.md` - 项目完成报告
- `IMPLEMENTATION_SUMMARY.md` - 实现摘要
- `/Users/mac/.claude/plans/` - 详细的设计文档

