<script setup>
import { computed, onMounted, ref } from 'vue';
import MarkdownIt from 'markdown-it';
import { useSkillsStore } from './stores/skills.js';
import { useI18nStore } from './stores/i18n.js';
import { translateText, getCacheStats } from './lib/translator.js';
import { getSourceBranding, getBrandColor } from './lib/branding.js';
import SkillTree from './components/SkillTree.vue';
import DirectoryTree from './components/DirectoryTree.vue';
import AppTree from './components/AppTree.vue';

const store = useSkillsStore();
const i18n = useI18nStore();
const t = i18n.t;
const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
const viewMode = ref('list');
const translating = ref(false);
const translatedFields = ref({}); // { skillId: { field: 'translated text', ... } }
const listCollapsed = ref(false); // 卡片列表是否折叠

const viewModeLabel = computed(() => {
  const labels = {
    'list': '列表',
    'tree': '分类',
    'path-tree': '目录结构',
    'app-tree': '应用分组',
  };
  return labels[viewMode.value] || '列表';
});

onMounted(() => {
  store.load();
  window.addEventListener('keydown', handleKeydown);
});

const detailHtml = computed(() => {
  const raw = store.selected?.raw || store.selected?.preview || '';
  return md.render(raw);
});

const activeFilterText = computed(() => {
  const parts = [];
  if (store.filters.editor) parts.push(`${t('editor')}:${store.filters.editor}`);
  if (store.filters.kind) parts.push(`${t('kind')}:${store.filters.kind}`);
  if (store.filters.source) parts.push(`${t('source')}:${store.filters.source}`);
  if (store.filters.product) parts.push(`${t('product')}:${store.filters.product}`);
  if (store.filters.brand) parts.push(`${t('brand')}:${store.filters.brand}`);
  if (store.query) parts.push(`q:${store.query}`);
  return parts.join(' · ');
});

const activeFilterChips = computed(() => {
  const chips = [];
  if (store.filters.editor) chips.push({ key: 'editor', label: t('editor'), value: getLabel('editor', store.filters.editor) });
  if (store.filters.kind) chips.push({ key: 'kind', label: t('kind'), value: getLabel('kind', store.filters.kind) });
  if (store.filters.source) chips.push({ key: 'source', label: t('source'), value: getLabel('source', store.filters.source) });
  if (store.filters.product) chips.push({ key: 'product', label: t('product'), value: store.filters.product });
  if (store.filters.brand) chips.push({ key: 'brand', label: t('brand'), value: getLabel('brand', store.filters.brand) });
  if (store.query.trim()) chips.push({ key: 'query', label: 'q', value: store.query.trim() });
  return chips;
});

const detailMeta = computed(() => {
  const s = store.selected || {};
  return [
    [t('editor'), getLabel('editor', s.editor || s.source)],
    [t('source'), getLabel('source', s.source)],
    [t('kind'), getLabel('kind', s.kind)],
    [t('product'), s.product],
    [t('brand'), getLabel('brand', s.brand)],
    [t('category'), getLabel('category', s.category || t('uncategorized'))],
    [t('rootKind'), s.paths?.rootKind],
    [t('relativePath'), s.paths?.rel],
    [t('fileSize'), formatBytes((s.raw || s.preview || '').length)],
    [t('updated'), s.updatedAt],
  ].filter(([, value]) => value);
});

const detailBadges = computed(() => {
  const s = store.selected || {};
  const badges = [
    getLabel('kind', s.kind),
    getLabel('source', s.source),
    getLabel('editor', s.editor),
    getLabel('product', s.product),
    getLabel('brand', s.brand),
  ].filter(Boolean);
  if (s.raw?.includes('[REDACTED]') || s.preview?.includes('[REDACTED]')) badges.push(t('redacted'));
  if (s.parseError) badges.push(t('parseError'));
  return [...new Set(badges)];
});

const usagePrompt = computed(() => buildUsagePrompt(store.selected));

function buildUsagePrompt(item) {
  if (!item) return '';

  const locale = i18n.locale;
  const name = i18n.skillText(item, 'name');
  const path = item.paths?.abs || '';
  const source = item.source || '';

  const templates = {
    zh: {
      hermes: `使用 Hermes 技能 ${name}：skill_view(name='${name}')`,
      'claude-code': `使用 Claude Code 技能 ${name}。本地路径：${path}`,
      codex: `使用 Codex 指令。路径：${path}`,
      cursor: `使用 Cursor 规则 ${name}。路径：${path}`,
      'mcp-config': `使用 MCP 工具 ${name}。配置：${path}`,
      'project-runbook': `使用项目手册 ${name}。路径：${path}`,
      'hermes-plugin': `使用 Hermes 插件 ${name}。路径：${path}`,
      'skills': `使用技能 ${name}。路径：${path}`,
      'mcp': `使用 MCP ${name}。路径：${path}`,
      default: `使用 ${name}。路径：${path}`,
    },
    en: {
      hermes: `Use Hermes skill ${name}: skill_view(name='${name}')`,
      'claude-code': `Use Claude Code skill ${name}. Local path: ${path}`,
      codex: `Use Codex instructions. Path: ${path}`,
      cursor: `Use Cursor rule ${name}. Path: ${path}`,
      'mcp-config': `Use MCP tool ${name}. Config: ${path}`,
      'project-runbook': `Use runbook ${name}. Path: ${path}`,
      'hermes-plugin': `Use Hermes plugin ${name}. Path: ${path}`,
      'skills': `Use skill ${name}. Path: ${path}`,
      'mcp': `Use MCP ${name}. Path: ${path}`,
      default: `Use ${name}. Path: ${path}`,
    },
  };

  const localizedTemplates = templates[locale] || templates.en;
  return localizedTemplates[source] || localizedTemplates.default;
}

function clearFilterChip(key) {
  if (key === 'query') {
    store.query = '';
    return;
  }
  store.setFilter(key, '');
}

function highlighted(text) {
  const source = String(text || '');
  const terms = searchTerms(store.query);
  if (!terms.length) return escapeHtml(source);
  const escapedTerms = terms
    .filter(term => term.length >= 2)
    .map(escapeRegExp);
  if (!escapedTerms.length) return escapeHtml(source);
  const re = new RegExp(`(${escapedTerms.join('|')})`, 'ig');
  return escapeHtml(source).replace(re, '<mark>$1</mark>');
}

function searchTerms(query) {
  return String(query || '')
    .split(/\s+/)
    .filter(Boolean)
    .filter(part => !/^(editor|kind|source|product|brand|trigger):/i.test(part))
    .map(part => part.replace(/^['""]|[""]$/g, ''));
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatBytes(n) {
  if (!Number.isFinite(n)) return '-';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function handleKeydown(e) {
  if (e.key === 'Escape' && store.selected) {
    store.selectedId = null;
  }
}

/**
 * 翻译当前选中技能的描述
 */
async function translateCurrentSkill() {
  if (!store.selected) return;

  translating.value = true;
  const skillId = store.selected.id;

  try {
    const translated = await translateText(store.selected.description || '', 'zh-CN');
    if (!translatedFields.value[skillId]) {
      translatedFields.value[skillId] = {};
    }
    translatedFields.value[skillId].description = translated;
    console.debug('[translate] skill description translated:', translated.slice(0, 30));
  } catch (e) {
    console.error('[translate] error:', e);
  } finally {
    translating.value = false;
  }
}

/**
 * 获取翻译后的描述文本，如果没有则返回原文本
 */
function getTranslatedDescription() {
  if (!store.selected) return '';
  const skillId = store.selected.id;
  return translatedFields.value[skillId]?.description || store.selected.description || '';
}

/**
 * 获取标签翻译
 * 根据标签类型和值，返回中文翻译的标签文本
 */
function getLabel(type, value) {
  if (!store.stats?.labels || !value) return value;
  const labels = store.stats.labels;
  switch(type) {
    case 'source': return labels.sources?.[value] || value;
    case 'editor': return labels.editors?.[value] || value;
    case 'kind': return labels.kinds?.[value] || value;
    case 'category': return labels.categories?.[value] || value;
    case 'brand': return labels.brands?.[value] || value;
    default: return value;
  }
}
</script>

<template>
  <div class="shell">
    <!-- LEFT SIDEBAR - 固定 200px 筛选栏 -->
    <aside class="sidebar">
      <div class="sidebar-content">
        <!-- 筛选项 -->
        <div class="filter-compact">
          <label class="filter-item">
            <span>{{ t('editor') }}</span>
            <select v-model="store.filters.editor" class="filter-select-compact">
              <option value="">{{ t('all') }}</option>
              <option v-for="o in store.editors" :key="o.name" :value="o.name">{{ getSourceBranding(o.name).icon }} {{ getLabel('editor', o.name) }} ({{ o.count }})</option>
            </select>
          </label>

          <label class="filter-item">
            <span>{{ t('kind') }}</span>
            <select v-model="store.filters.kind" class="filter-select-compact">
              <option value="">{{ t('all') }}</option>
              <option v-for="o in store.kinds" :key="o.name" :value="o.name">{{ getLabel('kind', o.name) }} ({{ o.count }})</option>
            </select>
          </label>

          <label class="filter-item">
            <span>{{ t('source') }}</span>
            <select v-model="store.filters.source" class="filter-select-compact">
              <option value="">{{ t('all') }}</option>
              <option v-for="o in store.filterSources" :key="o.name" :value="o.name">{{ getSourceBranding(o.name).icon }} {{ getLabel('source', o.name) }} ({{ o.count }})</option>
            </select>
          </label>

          <label class="filter-item">
            <span>{{ t('product') }}</span>
            <select v-model="store.filters.product" class="filter-select-compact">
              <option value="">{{ t('all') }}</option>
              <option v-for="o in store.products" :key="o.name" :value="o.name">{{ o.name }} ({{ o.count }})</option>
            </select>
          </label>

          <label class="filter-item">
            <span>{{ t('brand') }}</span>
            <select v-model="store.filters.brand" class="filter-select-compact">
              <option value="">{{ t('all') }}</option>
              <option v-for="o in store.brands" :key="o.name" :value="o.name">📦 {{ getLabel('brand', o.name) }} ({{ o.count }})</option>
            </select>
          </label>

          <label class="filter-item">
            <span>{{ t('sort') }}</span>
            <select v-model="store.sortKey" class="filter-select-compact">
              <option value="default">{{ t('sortDefault') }}</option>
              <option value="name">{{ t('sortName') }}</option>
              <option value="updated">{{ t('sortUpdated') }}</option>
              <option value="kind">{{ t('sortKind') }}</option>
              <option value="source">{{ t('sortSource') }}</option>
              <option value="product">{{ t('sortProduct') }}</option>
            </select>
          </label>
        </div>
      </div>
    </aside>

    <!-- RIGHT MAIN CONTENT AREA - 占据剩余全部空间 -->
    <main class="main-area">
      <!-- TOPBAR - 搜索和操作 -->
      <header class="topbar">
        <div class="topbar-left">
          <div class="search-box">
            <span class="search-icon">⌕</span>
            <input
              v-model="store.query"
              type="search"
              :placeholder="t('searchPlaceholder')"
            />
          </div>
        </div>

        <div class="topbar-right">
          <button class="btn soft" @click="store.clearFilters">{{ t('clear') }}</button>
          <button class="btn primary" :disabled="store.reloadState?.scanning" @click="store.reload({ done: t('reloadDone') })">
            {{ store.reloadState?.scanning ? t('reloading') : t('reload') }}
          </button>
        </div>
      </header>

      <!-- LIST SECTION - 上方 120px 固定（可 scroll） -->
      <section class="list-section" :class="{ collapsed: listCollapsed }">
        <div class="list-header">
          <div class="list-header-left">
            <button class="list-collapse-btn" @click="listCollapsed = !listCollapsed" :title="listCollapsed ? '展开' : '收起'">
              {{ listCollapsed ? '▼' : '▲' }} {{ viewModeLabel }} ({{ store.filtered.length }})
            </button>
          </div>
          <div class="list-header-right">
            <span v-if="activeFilterText" class="filter-text">{{ activeFilterText }}</span>
          </div>
        </div>

        <!-- LIST CONTENT - scrollable -->
        <div v-show="!listCollapsed" class="list-content">
          <div v-if="store.error" class="error">{{ store.error }}</div>
          <div v-if="store.loading" class="loading">{{ t('loading') }}</div>

          <!-- List View -->
          <template v-if="viewMode === 'list'">
            <button
              v-for="item in store.filtered"
              :key="item.id"
              class="skill-card-mini"
              :class="{ selected: item.id === store.selectedId }"
              @click="store.loadDetail(item.id)"
              :title="item.name"
            >
              <span class="src" :class="`src-${item.source}`">{{ getLabel('source', item.source) }}</span>
              <span class="name" v-html="highlighted(item.name)"></span>
              <span class="kind">{{ getLabel('kind', item.kind) || '-' }}</span>
            </button>
          </template>

          <!-- Tree Views -->
          <SkillTree v-else-if="viewMode === 'tree'" />
          <DirectoryTree v-else-if="viewMode === 'path-tree'" />
          <AppTree v-else-if="viewMode === 'app-tree'" />
        </div>
      </section>

      <!-- DETAIL SECTION - 下方占据剩余全部空间 -->
      <section class="detail-section" v-if="store.selected">
        <!-- DETAIL HEADER -->
        <div class="detail-header">
          <div class="detail-header-left">
            <div class="detail-kicker">
              <span class="src" :class="`src-${store.selected.source}`">{{ getSourceBranding(store.selected.source).icon }} {{ getLabel('source', store.selected.source) }}</span>
              <span>{{ getSourceBranding(store.selected.editor || store.selected.source).icon }} {{ getLabel('editor', store.selected.editor || store.selected.source) }}</span>
              <span>{{ getLabel('category', store.selected.category || t('uncategorized')) }}</span>
            </div>
            <h2>{{ i18n.skillText(store.selected, 'name') }}</h2>
            <div class="badge-row">
              <span
                v-for="badge in detailBadges"
                :key="badge"
                class="badge"
                :class="{ danger: badge === t('parseError'), warn: badge === t('redacted') }"
              >{{ badge }}</span>
            </div>
            <p>{{ i18n.skillText(store.selected, 'description') }}</p>
          </div>
          <button class="detail-close-btn" @click="store.selectedId = null" title="Close (Esc)">✕</button>
        </div>

        <!-- ACTIONS -->
        <div class="detail-actions">
          <button @click="store.copySelected('path', { copied: t('copied'), bytes: t('bytes') })" class="action-btn">💬 {{ t('copyPath') }}</button>
          <button @click="store.copySelected('dir', { copied: t('copied'), bytes: t('bytes') })" class="action-btn">📂 {{ t('copyDir') }}</button>
          <button @click="store.copySelected('rel', { copied: t('copied'), bytes: t('bytes') })" class="action-btn">🔗 {{ t('copyRel') }}</button>
          <button @click="store.copySelected('prompt', { copied: t('copied'), bytes: t('bytes') })" class="action-btn">📋 {{ t('copyPrompt') }}</button>
          <button @click="store.openSelected('cursor', { opened: t('opened') })" class="action-btn">🎯 {{ t('openCursor') }}</button>
          <button @click="store.openSelected('finder', { opened: t('opened') })" class="action-btn">🔍 {{ t('reveal') }}</button>
          <button @click="translateCurrentSkill" :disabled="translating || !store.selected" class="action-btn translate-btn" :class="{ loading: translating }">{{ translating ? '⏳...' : '🌐' }}</button>
        </div>

        <div v-if="store.notice" class="notice">{{ store.notice }}</div>

        <!-- SCROLLABLE CONTENT -->
        <div class="detail-scroll">
          <!-- USAGE CARD -->
          <section class="usage-card">
            <div class="usage-head">
              <span>{{ t('usage') }}</span>
              <h3>{{ t('howToUse') }}</h3>
            </div>
            <div class="usage-prompt"><code>{{ usagePrompt }}</code></div>
            <div class="usage-grid">
              <div>
                <strong>{{ t('appliesTo') }}</strong>
                <p>{{ getTranslatedDescription() || '-' }}</p>
              </div>
              <div>
                <strong>{{ t('quickFacts') }}</strong>
                <p>{{ getLabel('editor', store.selected.editor || store.selected.source) }} · {{ getLabel('kind', store.selected.kind) }}<span v-if="store.selected.product"> · {{ store.selected.product }}</span></p>
              </div>
            </div>
            <div class="usage-block" v-if="store.selected.params?.length">
              <strong>{{ t('params') }}</strong>
              <div class="param-table">
                <div v-for="p in store.selected.params" :key="p.name">
                  <code>{{ p.name }}</code>
                  <span>{{ p.type || '-' }}</span>
                  <b v-if="p.required">{{ t('required') }}</b>
                  <p>{{ p.description || p.default || '-' }}</p>
                </div>
              </div>
            </div>
            <div class="usage-block" v-if="store.selected.triggers?.length">
              <strong>{{ t('triggers') }}</strong>
              <span class="tag" v-for="tag in store.selected.triggers.slice(0, 12)" :key="tag">{{ tag }}</span>
            </div>
            <div class="usage-block" v-if="store.selected.links?.length">
              <strong>{{ t('links') }}</strong>
              <a class="usage-link" v-for="link in store.selected.links" :key="link.url" :href="link.url" target="_blank" rel="noreferrer">{{ link.label || link.url }}</a>
            </div>
          </section>

          <!-- METADATA -->
          <dl class="kv">
            <div>
              <dt>{{ t('path') }}</dt>
              <dd><code>{{ store.selected.paths?.abs }}</code></dd>
            </div>
            <div v-for="([label, value]) in detailMeta" :key="label">
              <dt>{{ label }}</dt>
              <dd>{{ value }}</dd>
            </div>
            <div v-if="store.selected.parseError" class="kv-error">
              <dt>{{ t('parseError') }}</dt>
              <dd>{{ store.selected.parseError }}</dd>
            </div>
            <div v-if="store.selected.triggers?.length">
              <dt>{{ t('triggers') }}</dt>
              <dd>
                <span class="tag" v-for="trig in store.selected.triggers.slice(0, 8)" :key="trig">{{ trig }}</span>
              </dd>
            </div>
          </dl>

          <!-- MARKDOWN CONTENT -->
          <article class="markdown" v-html="detailHtml"></article>
        </div>
      </section>

      <!-- 无选中时的空状态 -->
      <section v-else class="detail-section empty">
        <div class="empty-state">
          <p>{{ t('selectItem') || '选择一个技能查看详情' }}</p>
        </div>
      </section>
    </main>
  </div>
</template>
