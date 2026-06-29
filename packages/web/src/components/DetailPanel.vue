<script setup>
import { useSkillsStore } from '../stores/skills.js';
import { useI18nStore } from '../stores/i18n.js';
import { getSourceBranding, getBrandColor } from '../lib/branding.js';

const props = defineProps({
  detailHtml: String,
  detailMeta: Array,
  detailBadges: Array,
  usagePrompt: String,
});

const emit = defineEmits(['close']);

const store = useSkillsStore();
const i18n = useI18nStore();
const t = i18n.t;

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

function handleEscape(e) {
  if (e.key === 'Escape') {
    emit('close');
  }
}
</script>

<template>
  <div class="detail-panel-wrapper">
    <div class="detail-panel-overlay" @click="emit('close')"></div>
    <div class="detail-panel" role="dialog" @keydown="handleEscape" tabindex="0">
      <!-- CLOSE BUTTON -->
      <button class="detail-close" @click="emit('close')" title="Close (Esc)">✕</button>

      <!-- HEADER -->
      <div class="detail-head">
        <div>
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
      </div>

      <!-- ACTIONS -->
      <div class="actions">
        <button @click="store.copySelected('path', { copied: t('copied'), bytes: t('bytes') })" class="action-btn">💬 {{ t('copyPath') }}</button>
        <button @click="store.copySelected('dir', { copied: t('copied'), bytes: t('bytes') })" class="action-btn">📂 {{ t('copyDir') }}</button>
        <button @click="store.copySelected('rel', { copied: t('copied'), bytes: t('bytes') })" class="action-btn">🔗 {{ t('copyRel') }}</button>
        <button @click="store.copySelected('prompt', { copied: t('copied'), bytes: t('bytes') })" class="action-btn">📋 {{ t('copyPrompt') }}</button>
        <button @click="store.openSelected('cursor', { opened: t('opened') })" class="action-btn">🎯 {{ t('openCursor') }}</button>
        <button @click="store.openSelected('finder', { opened: t('opened') })" class="action-btn">🔍 {{ t('reveal') }}</button>
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
    </div>
  </div>
</template>

<style scoped>
.detail-panel-wrapper {
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  z-index: 100;
  pointer-events: none;
}

.detail-panel-overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.25);
  pointer-events: auto;
  animation: fadeIn 0.2s ease-out;
}

.detail-panel {
  position: absolute;
  right: 0;
  top: 0;
  height: 100vh;
  width: 380px;
  background: white;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.detail-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 18px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
}

.detail-close:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.detail-head {
  flex: 0 0 auto;
  padding: 16px 16px 0;
  border-bottom: 1px solid #e5e7eb;
}

.detail-head > div > div:first-child {
  margin-bottom: 8px;
}

.detail-kicker {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 11px;
  margin-bottom: 4px;
}

.detail-kicker span {
  padding: 2px 6px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
}

.detail-kicker .src {
  background: none;
  font-weight: 600;
}

.detail-head h2 {
  margin: 0;
  font-size: 18px;
  margin-bottom: 8px;
}

.badge-row {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: #e0e7ff;
  color: #3730a3;
}

.badge.danger {
  background: #fee2e2;
  color: #b91c1c;
}

.badge.warn {
  background: #fef3c7;
  color: #b45309;
}

.detail-head p {
  margin: 0;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
}

.actions {
  flex: 0 0 auto;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.action-btn {
  padding: 8px 12px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.notice {
  flex: 0 0 auto;
  padding: 8px 16px;
  background: #fef3c7;
  border-bottom: 1px solid #fcd34d;
  font-size: 12px;
  color: #92400e;
}

.detail-scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 16px;
}

.usage-card {
  margin-bottom: 24px;
}

.usage-head {
  margin-bottom: 12px;
}

.usage-head span {
  display: block;
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.usage-head h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.usage-prompt {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f3f4f6;
  border-radius: 8px;
  border-left: 3px solid #8b5cf6;
}

.usage-prompt code {
  font-size: 11px;
  color: #374151;
  word-break: break-word;
}

.usage-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.usage-grid > div {
  padding: 8px 10px;
  background: #f9fafb;
  border-radius: 6px;
}

.usage-grid strong {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.usage-grid p {
  margin: 0;
  font-size: 12px;
  color: #374151;
  line-height: 1.4;
}

.usage-block {
  margin-bottom: 12px;
}

.usage-block strong {
  display: block;
  font-size: 12px;
  margin-bottom: 6px;
}

.tag {
  display: inline-block;
  padding: 3px 8px;
  margin: 2px 4px 2px 0;
  border-radius: 4px;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 11px;
}

.param-table {
  display: grid;
  gap: 8px;
  font-size: 12px;
}

.param-table > div {
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
}

.param-table code {
  display: block;
  font-size: 11px;
  color: #dc2626;
  margin-bottom: 2px;
}

.param-table b {
  display: inline-block;
  padding: 1px 4px;
  background: #fef3c7;
  color: #b45309;
  border-radius: 2px;
  font-size: 10px;
  margin-left: 4px;
}

.usage-link {
  display: block;
  padding: 6px 0;
  font-size: 12px;
  color: #0ea5e9;
  text-decoration: none;
  border-bottom: 1px solid #e0e7ff;
  word-break: break-word;
}

.usage-link:hover {
  color: #0284c7;
}

.kv {
  margin-bottom: 24px;
}

.kv > div {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 12px;
}

.kv dt {
  font-weight: 600;
  color: #6b7280;
  word-break: break-word;
}

.kv dd {
  margin: 0;
  color: #374151;
  word-break: break-word;
}

.kv code {
  display: block;
  padding: 6px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 11px;
  color: #374151;
  overflow-x: auto;
}

.kv-error dd {
  color: #b91c1c;
}

.markdown {
  margin-bottom: 20px;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
}

.markdown h1, .markdown h2, .markdown h3 {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.markdown p {
  margin: 8px 0;
}

.markdown code {
  background: #f3f4f6;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 11px;
  color: #dc2626;
}

.markdown pre {
  background: #1f2937;
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

.markdown pre code {
  background: none;
  color: #e5e7eb;
  padding: 0;
}

/* 响应式 - 平板 */
@media (max-width: 1199px) {
  .detail-panel {
    width: 320px;
  }
}

/* 响应式 - 手机 */
@media (max-width: 767px) {
  .detail-panel {
    width: 100%;
  }

  .actions {
    grid-template-columns: repeat(2, 1fr);
  }

  .usage-grid {
    grid-template-columns: 1fr;
  }

  .kv > div {
    grid-template-columns: 1fr;
  }
}
</style>
