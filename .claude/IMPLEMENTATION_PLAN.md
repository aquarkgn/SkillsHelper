# 📋 HuHaa-MySkills 页面布局改版 — 详细实施计划

**目标**: 将 Sidebar 从 200px 扩展到 240px，List 从受限空间扩展到 1680px，Detail Panel 改为浮层。

**现状**: 
- Sidebar: 200px (grid-template-columns: 200px 1fr)
- List Section: 120px (flex: 0 0 120px)
- Detail Section: 固定占用主区域右侧

---

## 📐 改版对比表

| 组件 | 原布局 | 新布局 | 改动 |
|------|--------|--------|------|
| **Sidebar 宽度** | 200px | 240px | +40px (+20%) |
| **Grid 列** | 200px 1fr | 240px 1fr | 调整第1列 |
| **List 宽度** | ~600px | 1680px | +300% |
| **Detail 形式** | 固定右侧 | 浮层 | 改为 modal |
| **顶部栏** | 60px | 140px | +Search Chips |
| **卡片尺寸** | 不明确 | 200×140px | 标准化 |
| **卡片/行** | 2 个 | 3-4 个 | +100% 显示 |

---

## 🔧 实施步骤（分 5 个阶段）

### **Phase 1: CSS 基础改动** (30 min)
**目标**: 调整网格布局，从 200px 改为 240px

**文件**: `src/styles.css`

**改动列表**:
```css
/* 第 19 行 */
.shell {
  grid-template-columns: 200px 1fr;  /* ❌ 旧 */
  /* 改为 */
  grid-template-columns: 240px 1fr;  /* ✅ 新 */
}

/* 第 35-36 行 */
.sidebar {
  min-width: 200px;  /* ❌ 旧 */
  max-width: 200px;  /* ❌ 旧 */
  /* 改为 */
  min-width: 240px;  /* ✅ 新 */
  max-width: 240px;  /* ✅ 新 */
}
```

**验证**:
```bash
# 检查 Sidebar 宽度是否生效
npm run dev
# 在浏览器开发者工具检查 .sidebar 的计算宽度
```

---

### **Phase 2: 搜索条件芯片显示** (45 min)
**目标**: 在 SearchBar 下添加活跃过滤条件的芯片显示

**修改文件**: `src/App.vue`

**现状分析**:
- L52-60: 已有 `activeFilterChips` computed
- L303-321: TopBar 已有搜索框和按钮
- **问题**: 没有显示 chips 的 UI 元素

**新增 HTML**:
在 `<header class="topbar">` 后添加：

```vue
<!-- NEW: FILTER CHIPS ROW -->
<div class="filter-chips-row" v-if="activeFilterChips.length">
  <div class="chips-container">
    <span 
      v-for="chip in activeFilterChips" 
      :key="`${chip.key}-${chip.value}`"
      class="chip"
    >
      {{ chip.label }}: {{ chip.value }}
      <button 
        class="chip-remove" 
        @click="removeFilter(chip.key)"
        :aria-label="`Remove ${chip.label} filter`"
      >
        ×
      </button>
    </span>
  </div>
</div>
```

**新增 CSS** (styles.css 末尾):
```css
/* FILTER CHIPS ROW - 新增 */
.filter-chips-row {
  flex: 0 0 40px;  /* 新增行高 */
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  padding: 8px 16px;
  overflow-x: auto;
  display: flex;
  align-items: center;
}

.chips-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.chip {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
  color: #374151;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.chip-remove {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  margin-left: 4px;
}

.chip-remove:hover {
  color: #ef4444;
}
```

**新增方法** (App.vue script):
```javascript
function removeFilter(key) {
  switch(key) {
    case 'editor': store.filters.editor = ''; break;
    case 'kind': store.filters.kind = ''; break;
    case 'source': store.filters.source = ''; break;
    case 'product': store.filters.product = ''; break;
    case 'brand': store.filters.brand = ''; break;
    case 'query': store.query = ''; break;
  }
}
```

**TopBar 高度调整** (styles.css):
```css
/* 原来 60px，保持不变 */
.topbar {
  flex: 0 0 60px;  /* 保持 */
}

/* 新增 filter chips 行 */
.filter-chips-row {
  flex: 0 0 40px;  /* 新增 */
}

/* 总高度变为 60 + 40 = 100px (原 60px) */
```

---

### **Phase 3: Detail Panel 改为浮层** (60 min)
**目标**: 将固定的 Detail Section 改为模态对话框

**现状分析**:
- L380-466: Detail Section 是固定的右侧部分
- 占用大量空间，应改为浮层

**修改方案**:

1. **移除 Detail Section 的固定布局**
   - 原 L380: `<section class="detail-section">`
   - 改为浮层对话框 (Teleport)

2. **新增 HTML** (App.vue template 最后):
```vue
<!-- NEW: DETAIL PANEL MODAL -->
<Teleport to="body" v-if="store.selected">
  <div class="detail-modal-overlay" @click.self="store.selectedId = null">
    <div class="detail-modal" @click.stop>
      <!-- 关闭按钮 -->
      <button 
        class="modal-close" 
        @click="store.selectedId = null"
        aria-label="Close detail panel"
      >
        ✕
      </button>

      <!-- 内容（原 Detail Section 的内容） -->
      <div class="detail-modal-content">
        <!-- ... 复制原 Detail Section 的全部内容 ... -->
      </div>
    </div>
  </div>
</Teleport>
```

3. **新增 CSS** (styles.css):
```css
/* DETAIL MODAL OVERLAY */
.detail-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 100;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.detail-modal {
  background: white;
  border-radius: 12px 12px 0 0;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* Desktop: 位置调整 */
@media (min-width: 1024px) {
  .detail-modal-overlay {
    align-items: center;
    justify-content: center;
  }

  .detail-modal {
    border-radius: 12px;
    max-height: 70vh;
  }
}

.modal-close {
  position: sticky;
  top: 12px;
  right: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal-close:hover {
  background: #f3f4f6;
}

.detail-modal-content {
  padding: 24px;
}
```

4. **移除原 Detail Section CSS**:
```css
/* 删除或注释掉这些行 */
/* 
.detail-section {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  ...
}
*/
```

---

### **Phase 4: 响应式设计** (90 min)
**目标**: 添加 5 个响应式断点

**媒体查询** (styles.css 末尾添加):

#### Tablet (768px - 1023px)
```css
@media (max-width: 1023px) {
  /* Sidebar 缩小到 160px */
  .shell {
    grid-template-columns: 160px 1fr;
  }

  .sidebar {
    min-width: 160px;
    max-width: 160px;
  }

  /* Filter 字体缩小 */
  .filter-select-compact {
    font-size: 10px;
    padding: 4px 2px;
  }

  /* 卡片调整 - 2 列 */
  .skill-card-mini {
    width: 150px;  /* 原 200px */
    height: 120px;  /* 调整高度 */
  }
}
```

#### Mobile (< 768px)
```css
@media (max-width: 767px) {
  /* 隐藏 Sidebar，改为抽屉 */
  .shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 240px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 50;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  /* 添加菜单按钮 */
  .topbar-left::before {
    content: '☰';
    cursor: pointer;
    margin-right: 12px;
  }

  /* 卡片调整 - 1 列 */
  .skill-card-mini {
    width: 100%;
  }

  /* Detail Modal 全屏 */
  .detail-modal {
    max-width: 100%;
  }
}
```

#### Ultra-wide (> 1920px)
```css
@media (min-width: 1921px) {
  /* 加大 Sidebar */
  .shell {
    grid-template-columns: 280px 1fr;
  }

  .sidebar {
    min-width: 280px;
    max-width: 280px;
  }

  /* 卡片稍微加大 - 5 列 */
  .skill-card-mini {
    width: 220px;  /* 增大 */
  }
}
```

---

### **Phase 5: 卡片网格优化** (60 min)
**目标**: 标准化卡片尺寸，实现均匀网格

**卡片样式** (styles.css - 查找并修改):

**原代码**:
```css
.skill-card-mini {
  /* 可能的不一致 */
}
```

**新代码**:
```css
/* SKILL CARD - 标准化 200×140px */
.list-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, 200px);
  gap: 16px;
  padding: 16px;
  overflow-y: auto;
}

.skill-card-mini {
  width: 200px;
  height: 140px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  overflow: hidden;
}

.skill-card-mini:hover {
  border-color: #9ca3af;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.skill-card-mini.selected {
  border-color: #8b5cf6;
  background: #f3f0ff;
}

.skill-card-mini-name {
  font-weight: 600;
  font-size: 14px;
  color: #182033;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skill-card-mini-desc {
  font-size: 12px;
  color: #6b7280;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.skill-card-mini-size {
  font-size: 11px;
  color: #9ca3af;
}
```

---

## 🧪 测试计划

### 单元测试 (15 min)
```bash
# 1. 检查 Sidebar 宽度
npm run dev
# → 浏览器检查：.sidebar 宽度 = 240px ✓

# 2. 检查 Filter Chips 显示
# → 搜索或过滤后，应显示 chips ✓

# 3. 检查 Detail Modal
# → 点击卡片，Detail 应以浮层形式显示 ✓

# 4. 检查响应式
# → F12 → Responsive Design Mode
#   - 1920px: 4 列卡片 ✓
#   - 1024px: 2 列卡片 ✓
#   - 768px: 1 列卡片 ✓
```

### 集成测试 (20 min)
- [ ] 搜索 + 过滤 + chips 显示
- [ ] Detail Modal 可关闭
- [ ] Modal 外部点击可关闭
- [ ] Escape 键可关闭 Modal
- [ ] 宽度变化时 Layout 自适应

### 浏览器兼容性 (10 min)
- [ ] Chrome 最新版
- [ ] Firefox 最新版
- [ ] Safari 最新版

---

## 📋 文件修改清单

| 文件 | 行数 | 改动 | 状态 |
|------|------|------|------|
| `src/styles.css` | 19, 35-36 | Grid 列宽改 240px | 待做 |
| `src/styles.css` | 末尾 | 新增 Chips + Modal CSS | 待做 |
| `src/styles.css` | 末尾 | 新增响应式媒体查询 | 待做 |
| `src/App.vue` | L380-466 | 改 Detail 为浮层 | 待做 |
| `src/App.vue` | L321 后 | 新增 Filter Chips HTML | 待做 |
| `src/App.vue` | L236 后 | 新增 removeFilter 方法 | 待做 |
| `src/App.vue` | 末尾 | 新增 Detail Modal Teleport | 待做 |

---

## ⏱️ 时间估算

| 阶段 | 任务 | 预计时间 |
|------|------|---------|
| Phase 1 | CSS 基础改动 (240px) | 30 min |
| Phase 2 | Filter Chips 显示 | 45 min |
| Phase 3 | Detail Modal 浮层化 | 60 min |
| Phase 4 | 响应式设计 (5 断点) | 90 min |
| Phase 5 | 卡片网格优化 | 60 min |
| **测试** | 单元 + 集成 + 兼容性 | 45 min |
| **提交** | Code Review + PR | 15 min |
| **总计** | | **345 min (5.75h)** |

**优化后**: 约 **3-4 小时** (并行一些工作)

---

## ✅ 验收标准

### 功能验收
- [ ] Sidebar 240px ✓
- [ ] List 1680px ✓
- [ ] Filter Chips 可见且可移除 ✓
- [ ] Detail Panel 浮层显示 ✓
- [ ] 一屏显示 24 个卡片 (Desktop) ✓
- [ ] 响应式 5 断点完整 ✓

### 性能验收
- [ ] 首屏加载 < 2s ✓
- [ ] 搜索响应 < 100ms ✓
- [ ] 无布局抖动 ✓

### 兼容性验收
- [ ] Chrome ✓
- [ ] Firefox ✓
- [ ] Safari ✓

### 代码质量
- [ ] TypeScript strict ✓
- [ ] ESLint 无警告 ✓
- [ ] 无 console.error ✓

---

## 🚀 执行顺序

```
Phase 1 (30min)
    ↓
Phase 2 (45min)
    ↓
Phase 3 (60min)
    ↓
Phase 4 (90min) ← 可与 Phase 5 并行
    ↓
Phase 5 (60min)
    ↓
测试 (45min)
    ↓
提交 (15min)
```

---

## 📝 提交信息模板

```
feat(layout): 页面布局改版 - Sidebar 扩展 + Detail Modal 浮层

🎨 UI/UX 改进
- Sidebar 200px → 240px (+20% 过滤条件空间)
- Detail Panel 固定 → 浮层 (零占用主区域)
- Filter Chips 行 (SearchBar 下可见过滤条件)
- 一屏显示卡片 12 → 24 个 (+100% 信息密度)

📱 响应式设计
- Desktop (1920px): Sidebar 240px + List 1680px (4列)
- Tablet (1024px): Sidebar 160px + List 864px (2列)
- Mobile (< 768px): Sidebar 浮层 + List 全宽 (1列)

✅ 验证
- npm run dev (本地测试)
- 响应式 5 断点 (390/768/1024/1200/1920)
- 无性能回退 (<2s 首屏, <100ms 搜索)

📊 指标
- Sidebar: 200→240px (+20%)
- List: 600→1680px (+180%)
- 卡片: 12→24个/屏 (+100%)
- 过滤条件可见: 1-3→5+ (+200%)
```

---

**下一步**: 确认此计划，即可开始 Phase 1 实施。
