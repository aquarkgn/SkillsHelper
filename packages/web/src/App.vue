<script setup>
import { computed, onMounted, ref } from 'vue';
import MarkdownIt from 'markdown-it';
import { useSkillsStore } from './stores/skills.js';
import { useI18nStore } from './stores/i18n.js';
import SkillTree from './components/SkillTree.vue';
import DirectoryTree from './components/DirectoryTree.vue';
import AppTree from './components/AppTree.vue';

const store = useSkillsStore();
const i18n = useI18nStore();
const t = i18n.t;
const md = new MarkdownIt({ html: false, linkify: true, typographer: true });
const viewMode = ref('list');

const viewModeLabel = computed(() => {
  const labels = {
    'list': '列表',
    'tree': '分类',
    'path-tree': '目录结构',
    'app-tree': '应用分组',
  };
  return labels[viewMode.value] || '列表';
});

onMounted(() => store.load());

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
  if (store.filters.editor) chips.push({ key: 'editor', label: t('editor'), value: store.filters.editor });
  if (store.filters.kind) chips.push({ key: 'kind', label: t('kind'), value: store.filters.kind });
  if (store.filters.source) chips.push({ key: 'source', label: t('source'), value: store.filters.source });
  if (store.filters.product) chips.push({ key: 'product', label: t('product'), value: store.filters.product });
  if (store.filters.brand) chips.push({ key: 'brand', label: t('brand'), value: store.filters.brand });
  if (store.query.trim()) chips.push({ key: 'query', label: 'q', value: store.query.trim() });
  return chips;
});

const detailMeta = computed(() => {
  const s = store.selected || {};
  return [
    [t('editor'), s.editor || s.source],
    [t('source'), s.source],
    [t('kind'), s.kind],
    [t('product'), s.product],
    [t('brand'), s.brand],
    [t('category'), s.category || t('uncategorized')],
    [t('rootKind'), s.paths?.rootKind],
    [t('relativePath'), s.paths?.rel],
    [t('fileSize'), formatBytes((s.raw || s.preview || '').length)],
    [t('updated'), s.updatedAt],
  ].filter(([, value]) => value);
});

const detailBadges = computed(() => {
  const s = store.selected || {};
  const badges = [s.kind, s.source, s.editor, s.product, s.brand].filter(Boolean);
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
    .map(part => part.replace(/^['"]|['"]$/g, ''));
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
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand-block">
        <div class="logo">H</div>
        <div>
          <h1>HuHaa-MySkills</h1>
          <p>{{ t('appSubtitle') }}</p>
        </div>
      </div>

      <div class="lang-switch">
        <span>{{ t('language') }}</span>
        <button :class="{ active: i18n.locale === 'zh' }" @click="i18n.setLocale('zh')">中文</button>
        <button :class="{ active: i18n.locale === 'en' }" @click="i18n.setLocale('en')">EN</button>
      </div>

      <div v-if="store.stats" class="stats-card">
        <div class="stat-main">{{ store.stats.total }}</div>
        <div class="stat-label">{{ t('skillsLoaded') }}</div>
      </div>

      <div class="selected-editor-card" v-if="store.filters.editor">
        <div>
          <span>{{ t('selectedEditor') }}</span>
          <strong>{{ store.filters.editor }}</strong>
        </div>
        <button @click="store.setFilter('editor', '')">×</button>
      </div>

      <section class="filter-section nav-section">
        <div class="section-head">
          <h2>{{ t('editor') }}</h2>
          <small>{{ t('frontSelect') }}</small>
        </div>
        <button
          class="pill"
          :class="{ active: !store.filters.editor }"
          @click="store.setFilter('editor', '')"
        >
          <span>{{ t('all') }}</span><b>{{ store.stats?.total || 0 }}</b>
        </button>
        <button
          v-for="e in store.editors"
          :key="e.name"
          class="pill"
          :class="{ active: store.filters.editor === e.name }"
          @click="store.setFilter('editor', e.name)"
        >
          <span>{{ e.name }}</span><b>{{ e.count }}</b>
        </button>
      </section>

    </aside>

    <main class="main">
      <header class="topbar">
        <div class="toolbar-card">
          <div class="toolbar-main">
            <div class="search-box">
              <span class="search-icon">⌕</span>
              <input
                v-model="store.query"
                type="search"
                :placeholder="t('searchPlaceholder')"
              />
            </div>
            <button class="btn soft" @click="store.clearFilters">{{ t('clear') }}</button>
            <button class="btn primary" :disabled="store.reloadState?.scanning" @click="store.reload({ done: t('reloadDone') })">
              {{ store.reloadState?.scanning ? t('reloading') : t('reload') }}
            </button>
          </div>

          <div class="toolbar-facets">
            <label class="facet">
              <span>{{ t('kind') }}</span>
              <select v-model="store.filters.kind">
                <option value="">{{ t('all') }}</option>
                <option v-for="o in store.kinds" :key="o.name" :value="o.name">{{ o.name }} ({{ o.count }})</option>
              </select>
            </label>
            <label class="facet">
              <span>{{ t('source') }}</span>
              <select v-model="store.filters.source">
                <option value="">{{ t('all') }}</option>
                <option v-for="o in store.filterSources" :key="o.name" :value="o.name">{{ o.name }} ({{ o.count }})</option>
              </select>
            </label>
            <label class="facet">
              <span>{{ t('product') }}</span>
              <select v-model="store.filters.product">
                <option value="">{{ t('all') }}</option>
                <option v-for="o in store.products" :key="o.name" :value="o.name">{{ o.name }} ({{ o.count }})</option>
              </select>
            </label>
            <label class="facet">
              <span>{{ t('brand') }}</span>
              <select v-model="store.filters.brand">
                <option value="">{{ t('all') }}</option>
                <option v-for="o in store.brands" :key="o.name" :value="o.name">{{ o.name }} ({{ o.count }})</option>
              </select>
            </label>
            <label class="facet compact">
              <span>{{ t('sort') }}</span>
              <select v-model="store.sortKey">
                <option value="default">{{ t('sortDefault') }}</option>
                <option value="name">{{ t('sortName') }}</option>
                <option value="updated">{{ t('sortUpdated') }}</option>
                <option value="kind">{{ t('sortKind') }}</option>
                <option value="source">{{ t('sortSource') }}</option>
                <option value="product">{{ t('sortProduct') }}</option>
              </select>
            </label>
          </div>

          <div class="toolbar-status">
            <span class="filter-chip" :class="{ active: store.activeFilterCount }">
              {{ store.activeFilterCount ? `${store.activeFilterCount} ${t('active')}` : t('noFilters') }}
            </span>
            <div v-if="activeFilterChips.length" class="active-chip-row" :title="activeFilterText">
              <button
                v-for="chip in activeFilterChips"
                :key="`${chip.key}:${chip.value}`"
                class="active-chip"
                @click="clearFilterChip(chip.key)"
              >
                <span>{{ chip.label }}</span>
                <strong>{{ chip.value }}</strong>
                <b>×</b>
              </button>
            </div>
            <span v-else class="active-filter">{{ t('searchHint') }}</span>
            <span v-if="store.reloadState?.lastReloadAt" class="reload-state">
              {{ t('lastReload') }} {{ new Date(store.reloadState.lastReloadAt).toLocaleTimeString() }}
            </span>
          </div>
        </div>
      </header>

      <div v-if="store.error" class="error">{{ store.error }}</div>
      <div v-if="store.loading" class="loading">{{ t('loading') }}</div>

      <div class="content">
        <section class="list-panel">
          <div class="list-head">
            <div class="list-view-label">{{ viewModeLabel }}</div>
            <div class="list-view-controls">
              <button
                :class="{ active: viewMode === 'list' }"
                class="view-btn"
                @click="viewMode = 'list'"
                :title="t('list')"
              >{{ t('list') }}</button>
              <button
                :class="{ active: viewMode === 'tree' }"
                class="view-btn"
                @click="viewMode = 'tree'"
                :title="t('category')"
              >{{ t('category') }}</button>
              <button
                :class="{ active: viewMode === 'path-tree' }"
                class="view-btn"
                @click="viewMode = 'path-tree'"
                title="按目录结构"
              >目录结构</button>
              <button
                :class="{ active: viewMode === 'app-tree' }"
                class="view-btn"
                @click="viewMode = 'app-tree'"
                title="按应用分组"
              >应用分组</button>
            </div>
            <div>
              <strong>{{ store.filtered.length }}</strong>
              <span>{{ t('items') }}</span>
            </div>
          </div>

          <!-- List View -->
          <template v-if="viewMode === 'list'">
          <button
            v-for="item in store.filtered"
            :key="item.id"
            class="skill-card"
            :class="{ selected: item.id === store.selectedId }"
            @click="store.loadDetail(item.id)"
          >
            <div class="skill-title">
              <span class="src" :class="`src-${item.source}`">{{ item.source }}</span>
              <strong v-html="highlighted(item.name)"></strong>
            </div>
            <div class="skill-chipline">
              <span>{{ item.editor || item.source }}</span>
              <span>{{ item.kind || '-' }}</span>
              <span v-if="item.product">{{ item.product }}</span>
            </div>
            <div class="skill-meta">
              <span>{{ item.category || '-' }}</span>
              <span v-if="item.brand">· {{ item.brand }}</span>
            </div>
            <p v-html="highlighted(item.description)"></p>
          </button>
          </template>

          <!-- Tree View (by Source) -->
          <SkillTree v-else-if="viewMode === 'tree'" />

          <!-- Directory Tree View -->
          <DirectoryTree v-else-if="viewMode === 'path-tree'" />

          <!-- App Tree View -->
          <AppTree v-else-if="viewMode === 'app-tree'" />
        </section>

        <section class="detail-panel" v-if="store.selected">
          <div class="detail-head">
            <div>
              <div class="detail-kicker">
                <span class="src" :class="`src-${store.selected.source}`">{{ store.selected.source }}</span>
                <span>{{ store.selected.editor || store.selected.source }}</span>
                <span>{{ store.selected.category || t('uncategorized') }}</span>
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
          </div>

          <div class="actions">
            <button @click="store.copySelected('path', { copied: t('copied'), bytes: t('bytes') })">{{ t('copyPath') }}</button>
            <button @click="store.copySelected('dir', { copied: t('copied'), bytes: t('bytes') })">{{ t('copyDir') }}</button>
            <button @click="store.copySelected('rel', { copied: t('copied'), bytes: t('bytes') })">{{ t('copyRel') }}</button>
            <button @click="store.copySelected('prompt', { copied: t('copied'), bytes: t('bytes') })">{{ t('copyPrompt') }}</button>
            <button @click="store.copySelected('name', { copied: t('copied'), bytes: t('bytes') })">{{ t('copyName') }}</button>
            <button @click="store.copySelected('raw', { copied: t('copied'), bytes: t('bytes') })">{{ t('copyRaw') }}</button>
            <button @click="store.openSelected('cursor', { opened: t('opened') })">{{ t('openCursor') }}</button>
            <button @click="store.openSelected('finder', { opened: t('opened') })">{{ t('reveal') }}</button>
          </div>

          <div v-if="store.notice" class="notice">{{ store.notice }}</div>

          <section class="usage-card">
            <div class="usage-head">
              <div>
                <span>{{ t('usage') }}</span>
                <h3>{{ t('howToUse') }}</h3>
              </div>
              <button @click="store.copySelected('prompt', { copied: t('copied'), bytes: t('bytes') })">{{ t('copyPrompt') }}</button>
            </div>
            <div class="usage-prompt"><code>{{ usagePrompt }}</code></div>
            <div class="usage-grid">
              <div>
                <strong>{{ t('appliesTo') }}</strong>
                <p>{{ store.selected.description || '-' }}</p>
              </div>
              <div>
                <strong>{{ t('quickFacts') }}</strong>
                <p>{{ store.selected.editor || store.selected.source }} · {{ store.selected.kind }}<span v-if="store.selected.product"> · {{ store.selected.product }}</span></p>
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
                <span class="tag" v-for="t in store.selected.triggers.slice(0, 8)" :key="t">{{ t }}</span>
              </dd>
            </div>
          </dl>

          <article class="markdown" v-html="detailHtml"></article>
        </section>
      </div>
    </main>
  </div>
</template>
