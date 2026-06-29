# E1 + E3 + E4 执行计划（2026-06-29）

## 📋 当前状态

- **已完成**: E2 (过滤器分离) + E-i18n (全中文翻译)
- **当前数据**: 183 项技能，5 个源（Hermes 146 + 其他 37）
- **元数据完整性**: source 100%, editor 99%, kind 98%, category 99%, brand 60%

## 🎯 剩余任务分解

### E1: 数据源恢复 (预计 2h)

**E1-1: 路径诊断** (20min) ✅ DONE
```
✓ Hermes: 146 文件 (~/.hermes/skills)
✓ skills: 22 文件 (~/skills)
✓ Cursor: 3 文件 (~/.cursor)
✓ Claude Code: 0 文件 (不存在)
✓ Project Runbook: 10 文件 (~/Project/HuHaa-MySkills/docs)
✓ MCP: 需验证
✓ Codex/Hermes-Plugin: 需验证
```

**E1-2: 品牌数据补全** (60min)
- 任务: 从 Hermes 技能元数据中提取并补全 `brand` 字段
- 方法: 扫描 ~/.hermes/skills/*/SKILL.md，从 frontmatter 获取 brand
- 输出: 补全至少 30% 的缺失品牌数据
- 影响: 从 60% → 80%+ 完整性

**E1-3: MCP/其他源激活** (40min)
- 检查 mcp-config 适配器是否正确解析
- 确认 ~/mcp, ~/MCP 目录
- 补充示例数据或引导用户配置

### E3: UI 优化 (预计 3h)

**E3-1: 左侧筛选栏增强** (60min)
- 按数据源分组显示 kind/brand
- 显示每个源的技能计数
- 添加可视化元素 (颜色/图标)

**E3-2: 详情面板品牌展示** (60min)
- 增强 source/editor/brand 徽章
- 为每个源分配颜色和图标
- 改进布局显示层级

**E3-3: branding.js 系统** (60min)
- 创建统一的品牌配置文件
- 定义所有源的 icon + color + label
- 定义所有已知品牌的配色映射

### E4: 测试验收 (预计 1.5h)

**E4-1: 单元测试** (30min)
- 验证过滤逻辑正确性
- 检查统计接口准确性
- 品牌映射完整性

**E4-2: 集成测试** (30min)
- npm run test 通过率
- npm run build 无错误
- 启动 npm run dev 验证

**E4-3: 手动验收** (30min)
- UI 显示清晰无破裂
- 所有过滤功能正常
- 品牌和来源识别清楚

---

## 🔄 并行执行策略

### Phase 1 (并行): E1-2 + E3 基础 (1.5h)
1. **主线**: 执行 E1-2 品牌数据补全
   - 扫描 Hermes SKILL.md
   - 提取 brand 字段
   - 更新元数据

2. **副线**: 创建 branding.js (E3-3)
   - 定义所有源的配置
   - 整理品牌映射表

### Phase 2 (顺序): E1-3 + E3-1 (1h)
1. E1-3 激活其他数据源
2. E3-1 更新筛选栏

### Phase 3 (顺序): E3-2 + E4 (2.5h)
1. E3-2 增强详情面板
2. E4 完整测试

---

## 📊 验收标准

### E1 验收
- [ ] 品牌数据完整性 >= 80%
- [ ] 至少 5 个源可见
- [ ] 总技能数 >= 200

### E3 验收
- [ ] 筛选栏显示所有源
- [ ] 详情面板品牌清晰显示
- [ ] 无 visual regression

### E4 验收
- [ ] npm run test 100% pass
- [ ] npm run build 无错误
- [ ] 功能测试全部通过

---

## 🚀 下一步行动

1. **立即**: 执行 E1-2 品牌数据补全
2. **并行**: 创建 branding.js 配置
3. **继续**: 按计划执行 E1-3 ~ E4

**预计完成时间**: 今天内 (4-6h)

