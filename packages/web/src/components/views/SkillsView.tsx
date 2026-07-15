'use client'

import { useMemo } from 'react'
import Fuse from 'fuse.js'
import {
  Copy,
  ExternalLink,
  FileText,
  FolderOpen,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Type as TypeIcon,
  X,
} from 'lucide-react'
import { ActionButton } from '@/components/ui/ActionButton'
import { SkillDetail } from './SkillDetail'
import { cn } from '@/lib/cn'
import { editorLabel, isNoneEditor, itemEditorKey, PINNED_SKILL_SOURCES } from '@/lib/editors'
import { copy, open } from '@/lib/api'
import {
  kindLabel,
  displayDescription,
  pluginCapabilityLabel,
  pluginSearchText,
} from '@/lib/i18n'
import { getSkillIcons } from '@/hooks/getSkillIcons'
import { OfficialBrandIcon } from '@/components/ui/OfficialBrandIcon'
import type { SkillItem } from '@/types'

type TierFilter = 'official' | 'other'

const TIER_OPTIONS: Array<{ key: TierFilter | null; label: string }> = [
  { key: null, label: '全部' },
  { key: 'official', label: '官方工具' },
  { key: 'other', label: '其它技能' },
]

function SkillIcon({ item, size = 20 }: { item: SkillItem; size?: number }) {
  const icons = getSkillIcons(item)
  const iconBrand = item.brand || item.editorBrand
  const officialBrand = icons.isTier1 ? iconBrand : null

  return (
    <OfficialBrandIcon
      brand={officialBrand}
      src={item.iconUrl}
      size={size}
      label={item.title || item.name}
      className="bg-transparent"
      fallbackClassName="bg-muted"
    />
  )
}

interface SkillsViewProps {
  items: SkillItem[]
  editorFilter: string | null
  onEditorFilter?: (key: string | null) => void
  tierFilter?: TierFilter | null
  onTier?: (tier: TierFilter | null) => void
  query: string
  onQuery: (q: string) => void
  kindFilter: string | null
  onKind: (k: string | null) => void
  selectedId: string | null
  onSelect: (id: string) => void
}

/** 单条目的 editor 归属 key，与 server buildStats 口径一致。 */
export { itemEditorKey }

function formatUpdatedAt(value?: string): string {
  if (!value) return '未记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未记录'
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

function categoriesOf(item: SkillItem): string[] {
  if (Array.isArray(item.category)) return item.category.filter(Boolean)
  return item.category ? [item.category] : []
}

function shouldShowSourceBadge(item: SkillItem): boolean {
  const icons = getSkillIcons(item)
  return editorLabel(itemEditorKey(item)) !== icons.tierLabel
}

function PluginCapabilityBadges({ item, compact = false }: { item: SkillItem; compact?: boolean }) {
  const capabilities = item.plugin?.capabilities ?? []
  if (!capabilities.length) return null

  return (
    <>
      {capabilities.map((capability) => (
        <span
          key={`${item.id}:${capability.kind}`}
          className={cn(
            'rounded-sm bg-sky-500/10 text-caption text-sky-700 dark:text-sky-300',
            compact ? 'px-1.5 py-0.5' : 'px-2 py-1',
          )}
        >
          {pluginCapabilityLabel(capability)}
        </span>
      ))}
    </>
  )
}

function tierKeyOf(item: SkillItem): TierFilter {
  if (item.tierId === 'tier-1') return 'official'
  if (item.tierId === 'tier-2' || item.tierId === 'tier-3') return 'other'
  switch (item.tier) {
    case 'tool':
    case 'tier-1':
      return 'official'
    case 'directory':
    case 'tier-2':
    case 'other':
    case 'tier-3':
      return 'other'
    default:
      return 'other'
  }
}

function filterByEditor(items: SkillItem[], editorFilter: string | null): SkillItem[] {
  if (editorFilter === null) return items
  if (isNoneEditor(editorFilter)) {
    return items.filter((it) => isNoneEditor(itemEditorKey(it)))
  }
  return items.filter((it) => itemEditorKey(it) === editorFilter)
}

function normalizedSearchValue(value?: string): string {
  return (value ?? '').trim().toLowerCase()
}

function searchableNames(item: SkillItem): string[] {
  return [item.title, item.name, item.i18n?.zh?.name].map(normalizedSearchValue).filter(Boolean)
}

function exactSearchRank(item: SkillItem, normalizedQuery: string): number | null {
  const names = searchableNames(item)
  if (names.some((name) => name === normalizedQuery)) return 0
  if (names.some((name) => name.startsWith(normalizedQuery))) return 1
  if (names.some((name) => name.includes(normalizedQuery))) return 2
  if (pluginSearchText(item).includes(normalizedQuery)) return 3
  return null
}

function titleForSort(item: SkillItem): string {
  return item.title || item.name
}

function SkillContextPanel({ item }: { item: SkillItem }) {
  const categories = categoriesOf(item)
  const tags = item.tags ?? []
  const sourceLabel = editorLabel(itemEditorKey(item))
  const showSource = sourceLabel !== '自定义技能' && sourceLabel !== '其它技能'
  const actionButtonClass = 'h-9 justify-start px-2.5'

  return (
    <section className="rounded-md border border-border bg-card text-card-foreground">
      <div className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(220px,0.9fr)_minmax(260px,1fr)_minmax(280px,1.1fr)] xl:items-start">
        <div className="min-w-0">
          <p className="text-caption font-semibold text-muted-foreground">当前条目</p>
          <div className="mt-2 flex items-start gap-3">
            <SkillIcon item={item} size={32} />
            <div className="min-w-0">
              <h3 className="truncate text-body font-semibold text-foreground">
                {item.title || item.name}
              </h3>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-body-sm">
          <dt className="text-muted-foreground">类型</dt>
          <dd>{kindLabel(item.kind)}</dd>
          {showSource && (
            <>
              <dt className="text-muted-foreground">来源</dt>
              <dd className="min-w-0 truncate">{sourceLabel}</dd>
            </>
          )}
          <dt className="text-muted-foreground">更新</dt>
          <dd className="font-mono text-caption">{formatUpdatedAt(item.updatedAt)}</dd>
          <dt className="text-muted-foreground">路径</dt>
          <dd className="min-w-0 break-all font-mono text-caption leading-relaxed text-muted-foreground">
            {item.paths?.abs ?? '未记录'}
          </dd>
        </dl>

        <div>
          <p className="mb-2 text-caption font-semibold text-muted-foreground">操作</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
            <ActionButton
              className={actionButtonClass}
              icon={<Copy size={14} />}
              label="复制路径"
              onAction={() => copy(item.id, 'path')}
            />
            <ActionButton
              className={actionButtonClass}
              icon={<TypeIcon size={14} />}
              label="复制名称"
              onAction={() => copy(item.id, 'name')}
            />
            <ActionButton
              className={actionButtonClass}
              icon={<FileText size={14} />}
              label="复制正文"
              onAction={() => copy(item.id, 'raw')}
            />
            <ActionButton
              className={actionButtonClass}
              icon={<MessageSquare size={14} />}
              label="调用提示"
              onAction={() => copy(item.id, 'prompt')}
            />
            <ActionButton
              className={actionButtonClass}
              icon={<ExternalLink size={14} />}
              label="打开"
              onAction={() => open(item.id, 'default')}
            />
            <ActionButton
              className={actionButtonClass}
              icon={<FolderOpen size={14} />}
              label="访达显示"
              onAction={() => open(item.id, 'finder')}
            />
          </div>
        </div>
      </div>

      {(categories.length > 0 || tags.length > 0) && (
        <div className="border-t border-border px-4 py-3">
          <p className="mb-2 text-caption font-semibold text-muted-foreground">分类与标签</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <span
                key={`category:${category}`}
                className="rounded-sm bg-primary-soft px-2 py-1 text-caption text-primary"
              >
                {category}
              </span>
            ))}
            {tags.map((tag) => (
              <span
                key={`tag:${tag}`}
                className="rounded-sm bg-muted px-2 py-1 text-caption text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export function SkillsView({
  items,
  editorFilter,
  onEditorFilter,
  tierFilter = null,
  onTier,
  query,
  onQuery,
  kindFilter,
  onKind,
  selectedId,
  onSelect,
}: SkillsViewProps) {
  const sourceOptions = useMemo(() => {
    const scoped = tierFilter ? items.filter((it) => tierKeyOf(it) === tierFilter) : items
    const counts = new Map<string, number>()
    for (const it of scoped) {
      const key = itemEditorKey(it)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const pinnedSourceSet = new Set<string>(PINNED_SKILL_SOURCES)
    const sortedSources = [...counts.entries()]
      .filter(([source]) => !pinnedSourceSet.has(source))
      .sort(
        (a, b) =>
          b[1] - a[1] ||
          editorLabel(a[0]).localeCompare(editorLabel(b[0]), 'zh-CN'),
      )
    const pinnedSources = PINNED_SKILL_SOURCES.map(
      (source) => [source, counts.get(source) ?? 0] as const,
    )
    return [...sortedSources, ...pinnedSources]
  }, [items, tierFilter])

  const byEditor = useMemo(() => {
    return filterByEditor(items, editorFilter)
  }, [items, editorFilter])

  const tierCounts = useMemo(() => {
    const counts = new Map<TierFilter, number>()
    for (const it of byEditor) {
      const tier = tierKeyOf(it)
      counts.set(tier, (counts.get(tier) ?? 0) + 1)
    }
    return counts
  }, [byEditor])

  const byTier = useMemo(() => {
    if (!tierFilter) return byEditor
    return byEditor.filter((it) => tierKeyOf(it) === tierFilter)
  }, [byEditor, tierFilter])

  const kinds = useMemo(() => {
    const m = new Map<string, number>()
    for (const it of byTier) m.set(it.kind, (m.get(it.kind) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [byTier])

  const fuse = useMemo(
    () =>
      new Fuse(byTier, {
        keys: [
          'name',
          'title',
          'description',
          'i18n.zh.description',
          'category',
          'brand',
          'dirName',
          'tags',
        ],
        threshold: 0.4,
        ignoreLocation: true,
        includeScore: true,
      }),
    [byTier],
  )

  const filtered = useMemo(() => {
    let list = byTier
    if (query.trim()) {
      const normalizedQuery = query.trim().toLowerCase()
      const ranks = new Map<string, { rank: number; score: number }>()

      for (const item of byTier) {
        const rank = exactSearchRank(item, normalizedQuery)
        if (rank !== null) ranks.set(item.id, { rank, score: 0 })
      }

      for (const result of fuse.search(query)) {
        const current = ranks.get(result.item.id)
        const fuzzyRank = { rank: 4, score: result.score ?? 1 }
        if (!current || fuzzyRank.rank < current.rank) ranks.set(result.item.id, fuzzyRank)
      }

      list = byTier
        .filter((item) => ranks.has(item.id))
        .sort((a, b) => {
          const aRank = ranks.get(a.id) ?? { rank: 99, score: 1 }
          const bRank = ranks.get(b.id) ?? { rank: 99, score: 1 }
          return (
            aRank.rank - bRank.rank ||
            aRank.score - bRank.score ||
            titleForSort(a).localeCompare(titleForSort(b), 'zh-CN')
          )
        })
    }
    if (kindFilter) list = list.filter((it) => it.kind === kindFilter)
    return list
  }, [byTier, fuse, query, kindFilter])

  const hasActiveFilters = Boolean(query.trim() || editorFilter || tierFilter || kindFilter)
  const clearFilters = () => {
    onQuery('')
    onEditorFilter?.(null)
    onTier?.(null)
    onKind(null)
  }

  const selected = useMemo(
    () => filtered.find((it) => it.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <section className="rounded-md border border-border bg-card px-4 py-4 shadow-sm shadow-border/30">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h1 className="text-h4 font-semibold text-foreground">技能库</h1>
            <p className="mt-1 text-body-sm text-muted-foreground">
              共 {filtered.length} 项，按来源、范围、类型和关键词快速定位可复用能力。
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 text-caption text-muted-foreground">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5">
              <SlidersHorizontal size={14} />
              {items.length} 项已索引
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={13} />
                清除筛选
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-md border border-border bg-background/60 p-3 lg:grid-cols-[minmax(240px,1.4fr)_minmax(160px,0.7fr)_minmax(140px,0.6fr)]">
          <label className="min-w-0">
            <span className="mb-1 block text-caption font-medium text-muted-foreground">搜索</span>
            <span className="relative block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                placeholder="搜索技能、插件、自定义能力…"
                className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-body-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </span>
          </label>

          <label className="min-w-0">
            <span className="mb-1 block text-caption font-medium text-muted-foreground">来源</span>
            <select
              value={editorFilter ?? ''}
              onChange={(event) => onEditorFilter?.(event.target.value || null)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">全部来源</option>
              {sourceOptions.map(([source, count]) => (
                <option key={source} value={source}>
                  {editorLabel(source)} {count}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-0">
            <span className="mb-1 block text-caption font-medium text-muted-foreground">类型</span>
            <select
              value={kindFilter ?? ''}
              onChange={(event) => onKind(event.target.value || null)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-body-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">全部类型</option>
              {kinds.map(([k, c]) => (
                <option key={k} value={k}>
                  {kindLabel(k)} {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1 text-caption text-muted-foreground">
            <SlidersHorizontal size={13} />
            范围
          </span>
          {TIER_OPTIONS.map((option) => {
            const count = option.key ? tierCounts.get(option.key) ?? 0 : byEditor.length
            const active = tierFilter === option.key
            return (
              <button
                key={option.key ?? 'all'}
                type="button"
                onClick={() => onTier?.(option.key)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-caption font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <span>{option.label}</span>
                <span
                  className={cn(
                    'font-mono text-[11px]',
                    active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
        <section className="min-h-0 overflow-y-auto rounded-md border border-border bg-card">
          {filtered.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-4 text-center text-body-sm text-muted-foreground">
              <FileText size={22} />
              <p>没有匹配的技能条目</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((it) => {
                const icons = getSkillIcons(it)
                const isSelected = selected?.id === it.id
                const sourceLabel = editorLabel(itemEditorKey(it))
                return (
                  <button
                    key={it.id}
                    type="button"
                    data-testid="skill-list-item"
                    data-skill-id={it.id}
                    onClick={() => onSelect(it.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex w-full items-start gap-3 px-3 py-3 text-left transition-colors',
                      isSelected
                        ? 'bg-primary-soft text-primary'
                        : 'bg-card text-foreground hover:bg-muted/70',
                    )}
                  >
                    <SkillIcon item={it} size={24} />
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate text-body-sm font-semibold">
                          {it.title || it.name}
                        </span>
                        {it.i18n?.zh?.name && it.i18n.zh.name !== (it.title || it.name) && (
                          <span className="truncate text-caption font-normal text-muted-foreground">
                            {it.i18n.zh.name}
                          </span>
                        )}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-caption text-muted-foreground">
                        {displayDescription(it) || it.preview || '无描述'}
                      </span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-sm bg-muted px-1.5 py-0.5 text-caption text-muted-foreground">
                          {kindLabel(it.kind)}
                        </span>
                        <span
                          className={cn(
                            'rounded-sm px-1.5 py-0.5 text-caption font-medium',
                            icons.isTier1
                              ? 'bg-primary-soft text-primary'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {icons.isTier1 ? '官方工具' : '其它技能'}
                        </span>
                        {shouldShowSourceBadge(it) && (
                          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-caption text-muted-foreground">
                            {sourceLabel}
                          </span>
                        )}
                        <PluginCapabilityBadges item={it} compact />
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section className="min-h-0 overflow-y-auto">
          {selected ? (
            <div className="space-y-4">
              <SkillContextPanel item={selected} />
              <SkillDetail item={selected} variant="reader" />
            </div>
          ) : (
            <div className="detail flex min-h-48 items-center justify-center text-muted-foreground">
              <p className="text-body-sm">从左侧选择一项查看详情</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
