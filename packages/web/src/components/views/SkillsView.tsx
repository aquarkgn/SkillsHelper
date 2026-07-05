'use client'

import { useEffect, useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SkillDetail } from './SkillDetail'
import { cn } from '@/lib/cn'
import { isNoneEditor, itemEditorKey } from '@/lib/editors'
import { kindLabel, displayDescription } from '@/lib/i18n'
import { getSkillIcons } from '@/hooks/getSkillIcons'
import { OfficialBrandIcon } from '@/components/ui/OfficialBrandIcon'
import type { SkillItem } from '@/types'

/**
 * 技能官方图标组件。
 * 优先使用后端列表返回的 iconUrl；没有时按 Tier 1 的 brand/editorBrand 请求 /api/icons。
 * 失败时统一显示中性占位，不再使用 lucide 品牌图标或 emoji 伪装官方 icon。
 */
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
  query: string
  onQuery: (q: string) => void
  kindFilter: string | null
  onKind: (k: string | null) => void
  selectedId: string | null
  onSelect: (id: string) => void
}

/** 单条目的 editor 归属 key，与 server buildStats 口径一致。 */
export { itemEditorKey }

export function SkillsView({
  items,
  editorFilter,
  query,
  onQuery,
  kindFilter,
  onKind,
  selectedId,
  onSelect,
}: SkillsViewProps) {
  // 1) editor 过滤
  const byEditor = useMemo(() => {
    if (editorFilter === null) return items
    if (isNoneEditor(editorFilter)) return items.filter((it) => isNoneEditor(itemEditorKey(it)))
    return items.filter((it) => itemEditorKey(it) === editorFilter)
  }, [items, editorFilter])

  // 2) kind chips 选项（来自当前 editor 子集）
  const kinds = useMemo(() => {
    const m = new Map<string, number>()
    for (const it of byEditor) m.set(it.kind, (m.get(it.kind) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [byEditor])

  // 3) Fuse 搜索（在 editor 子集上）—— keys 含 i18n 译文，中文关键词可命中
  const fuse = useMemo(
    () =>
      new Fuse(byEditor, {
        keys: ['name', 'title', 'description', 'i18n.zh.description', 'category', 'brand', 'dirName', 'tags'],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [byEditor],
  )

  const filtered = useMemo(() => {
    let list = query.trim() ? fuse.search(query).map((r) => r.item) : byEditor
    if (kindFilter) list = list.filter((it) => it.kind === kindFilter)
    return list
  }, [byEditor, fuse, query, kindFilter])

  const selected = useMemo(
    // selectedId 未匹配时回退 filtered[0]：保证默认加载第一个技能，
    // 且 SSE/轮询刷新导致 selectedId 失效时不会显示空详情。
    () => filtered.find((it) => it.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  )

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 搜索栏 */}
      <input
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="搜索技能、插件、自定义…"
        className="h-10 w-full rounded-md border border-border bg-input px-3 text-body-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {/* kind chips (secondary filter) */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onKind(null)}
          className={cn(
            'rounded-full px-2.5 py-0.5 text-caption transition-colors',
            kindFilter === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
        >
          全部类型
        </button>
        {kinds.map(([k, c]) => (
          <button
            key={k}
            onClick={() => onKind(k)}
            className={cn(
              'rounded-full px-2.5 py-0.5 text-caption transition-colors',
              kindFilter === k
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {kindLabel(k)} ({c})
          </button>
        ))}
      </div>

      {/* 列表 + 详情 */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
        <section className="flex min-h-0 flex-col gap-2 overflow-y-auto pr-1">
          <p className="text-caption text-muted-foreground">共 {filtered.length} 项</p>
          {filtered.length === 0 && (
            <p className="text-body-sm text-muted-foreground">没有匹配的条目</p>
          )}
          {filtered.map((it) => {
            const icons = getSkillIcons(it)
            return (
              <button key={it.id} onClick={() => onSelect(it.id)} className="text-left">
                <Card
                  className={cn(
                    'cursor-pointer transition-colors hover:border-primary',
                    it.id === selectedId ? 'border-primary bg-primary-soft' : '',
                  )}
                >
                  <CardHeader>
                    {/* 官方 icon：加载失败显示中性占位，不伪装品牌图标 */}
                    <CardTitle className="flex items-center gap-2">
                      <SkillIcon item={it} size={24} />
                      <span>
                        {it.title || it.name}
                        {it.i18n?.zh?.name &&
                          it.i18n.zh.name !== (it.title || it.name) && (
                            <span className="ml-1 text-caption font-normal text-muted-foreground">
                              （{it.i18n.zh.name}）
                            </span>
                          )}
                      </span>
                    </CardTitle>

                    {/* Tier 2 specific: show dirName as secondary label */}
                    {icons.isTier2 && it.dirName && (
                      <p className="text-caption text-muted-foreground">
                        目录: <code className="rounded bg-muted px-1.5 py-0.5">{it.dirName}</code>
                      </p>
                    )}

                    <CardDescription>
                      {displayDescription(it) || it.preview || '（无描述）'}
                    </CardDescription>

                    {/* Tags and metadata */}
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {/* Kind tag */}
                      <span className="rounded-sm bg-muted px-1.5 py-0.5 text-caption text-muted-foreground">
                        {kindLabel(it.kind)}
                      </span>

                      {/* Tier label (NEW) */}
                      <span
                        className={cn(
                          'rounded-sm px-1.5 py-0.5 text-caption font-medium',
                          icons.isTier1 && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
                          icons.isTier2 && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
                          icons.isTier3 && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                        )}
                      >
                        {icons.tierLabel}
                      </span>

                      {/* Editor/Source */}
                      <span className="rounded-sm bg-muted px-1.5 py-0.5 text-caption text-muted-foreground">
                        {itemEditorKey(it)}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              </button>
            )
          })}
        </section>

        <section className="min-h-0 overflow-y-auto">
          {selected ? (
            <SkillDetail item={selected} />
          ) : (
            <div className="detail text-muted-foreground">
              <p className="text-body-sm">从左侧选择一项查看详情</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
