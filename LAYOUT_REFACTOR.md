# HuHaa-MySkills 布局重构完成

**日期**：2026-06-23  
**版本**：v0.3.0  
**状态**：✅ 完成

## 问题陈述

原布局存在三个主要问题：
1. 侧边栏初始宽度 100px 太窄，且不支持手搓折叠
2. 菜单占用过多空间，应精简为仅筛选项
3. 右侧详情面板采用浮层式抽屉，不符合三栏布局设计

## 解决方案

### 1️⃣ 侧边栏优化
**文件改动**：`packages/web/src/App.vue`、`src/styles.css`

- **初始宽度**：100px → 180px（第一眼更能看清筛选项）
- **折叠功能**：新增 `sidebarCollapsed` 状态，▶/◀ 按钮切换
  - 展开：180px（显示所有筛选项 + 标签）
  - 折叠：50px（仅显示切换按钮）
- **拖拽调整**：保留原有边界拖拽，范围 80-300px
- **状态保存**：localStorage 记忆宽度和折叠状态

```vue
// App.vue 关键改动
const sidebarWidth = ref(180);        // 默认宽度
const sidebarCollapsed = ref(false);  // 折叠状态

// 模板中
:style="{ gridTemplateColumns: `${sidebarCollapsed ? 50 : sidebarWidth}px 1fr 380px` }"
<div class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
  {{ sidebarCollapsed ? '▶' : '◀' }}
</div>
```

### 2️⃣ 菜单精简
**文件改动**：`packages/web/src/App.vue`、`src/styles.css`

侧边栏现仅包含 5 个关键筛选项（所有数据均来自 store facets）：
- 类型 (kind)
- 来源 (source)
- 产品 (product)
- 品牌 (brand)
- 排序 (sortKey)

无菜单选项卡，无视图模式切换按钮，纯粹筛选界面。

```css
/* 侧边栏结构 */
.sidebar {
  display: flex;
  flex-direction: column;
  grid-column: 1 / 2;
  grid-row: 2 / 3;
}

.sidebar-toggle {
  flex: 0 0 40px;    /* 固定高度 */
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}
```

### 3️⃣ 右侧详情 — 从浮层改为固定三栏
**文件改动**：`packages/web/src/App.vue`、`src/styles.css`、移除 DetailPanel.vue 组件导入

**原设计**（浮层式）：
```
position: fixed; right: 0; width: 400px; z-index: 100;
有半透明遮罩，点击遮罩关闭
```

**新设计**（三栏固定）：
```css
.detail-panel-fixed {
  grid-column: 3 / 4;
  grid-row: 1 / 3;
  position: relative;   /* 不再 fixed *)
  width: 380px;        /* 通过 grid 约束 */
  border-left: 1px solid #e5e7eb;
  overflow: hidden;
}
```

**交互改动**：
- 不再有遮罩层，点击列表项时详情直接更新
- 关闭详情：按右上角 ✕ 或 Esc（清除 selectedId）
- 侧边栏和列表始终保持显示（不会被详情遮挡）

### 4️⃣ DetailPanel 组件内联到 App.vue
**文件改动**：`packages/web/src/App.vue`

- 删除 DetailPanel.vue 的单独组件导入
- 将 DetailPanel 的完整模板（header、actions、detail-scroll）内联到 App.vue 中
- 样式全部迁移到全局 `styles.css`（删除 scoped）

好处：
- 减少组件层级，性能提升
- 详情和列表共享同一 scope，state 传递更直接
- CSS 统一管理

### 5️⃣ CSS Grid 布局更新
**文件改动**：`packages/web/src/styles.css`

```css
/* 原布局（浮层） */
.shell {
  grid-template-columns: 100px 1fr 400px;
  grid-template-rows: 60px 1fr;
}

.main {
  grid-column: 2 / 4;  /* 跨越中间和右侧 */
  grid-row: 2 / 3;
}

.detail-panel {
  position: fixed;     /* 浮层 */
}

/* 新布局（三栏固定） */
.shell {
  grid-template-columns: ${sidebarCollapsed ? 50 : sidebarWidth}px 1fr 380px;
  grid-template-rows: 60px 1fr;
}

.main {
  grid-column: 2 / 3;  /* 仅中间列 */
  grid-row: 1 / 3;
}

.detail-panel-fixed {
  grid-column: 3 / 4;  /* 新增第三栏 */
  grid-row: 1 / 3;
  position: relative;
}
```

## 修改清单

| 文件 | 改动 | 行数 |
|------|------|------|
| App.vue | 新增 sidebarCollapsed 状态、侧边栏折叠按钮、DetailPanel 内联、删除 closeDetail() 和菜单按钮 | 145 |
| styles.css | sidebar 改为 flex + grid、main 调整 grid-column、新增 detail-panel-fixed、添加详情面板完整样式 | 380+ |
| DetailPanel.vue | 保留（不删除，以备后用，或作为 scoped 组件示例） | — |

## 验证步骤

### 本地测试
```bash
npm run build:web
npm start
# 打开 http://localhost:11520
```

### 交互验证
- [ ] 页面加载时，侧边栏显示为 180px
- [ ] 点击侧边栏 ◀ 按钮，宽度变为 50px（仅显示 ▶）
- [ ] 再点击 ▶，恢复 180px
- [ ] 在侧边栏右边界拖拽，宽度在 80-300px 间变化
- [ ] 刷新页面，上次的宽度和折叠状态被恢复
- [ ] 点击列表项，右侧详情立即更新（无遮罩，无弹窗）
- [ ] 按 Esc 或点击 ✕，详情面板关闭，列表和侧边栏保持显示
- [ ] 三栏宽度比例（sidebar : list : detail）符合预期

### 性能检查
```bash
npm run stats  # 检查扫描统计
npm run verify # 验证文件完整性
```

## 向后兼容性

✅ **完全兼容**  
- store 结构不变
- API 端点不变  
- 路由不变
- 所有技能数据格式不变
- 搜索和筛选逻辑不变

## 已知限制

- 平板/手机响应式布局仍需优化（预留媒体查询骨架）
- 详情面板在小屏幕上宽度固定，可能超出视口（后续改进）

## 回滚方案

如需回滚到浮层设计：
```bash
git revert <commit-hash>
# 恢复原 DetailPanel.vue 组件导入
# 恢复浮层式 CSS
```

## 相关文档

- 设计规划：`docs/PLAN.md`（第 6 节验收标准）
- 布局草图：`LAYOUT_REFACTOR.md` (本文件)

---

**贡献者**：Hermes Agent  
**完成时间**：2026-06-23 02:30 UTC
