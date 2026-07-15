import type { SkillItem, Stats } from '@/types'
import { idbGet, idbSet } from '@/lib/idb'

// 生产环境前端与 Fastify 同源（11520）；dev 模式由 vite proxy 转发 /api。
const API_BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} 失败: ${res.status}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`POST ${path} 失败: ${res.status}`)
  return res.json() as Promise<T>
}

/** 容忍非 2xx 的 POST：copy/open 在非法输入时返回 {ok:false,error}（4xx/5xx），需读取该 body */
async function postTolerant<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json() as Promise<T>
}

/** 列表：返回不含 raw 的 SkillItem[] */
export function fetchSkills(): Promise<SkillItem[]> {
  return get<SkillItem[]>('/skills')
}

/** 详情：返回含完整 raw 的 SkillItem */
export function fetchSkillDetail(id: string): Promise<SkillItem> {
  return get<SkillItem>(`/skills/${encodeURIComponent(id)}`)
}

/** 统计聚合 */
export function fetchStats(): Promise<Stats> {
  return get<Stats>('/stats')
}

/** 手动触发重新扫描 */
export function reload(): Promise<{ ok: boolean; items: number }> {
  return post('/reload')
}

/** 后端 pickCopyText 支持的 what 取值（packages/server/src/index.mjs:352） */
export type CopyWhat = 'path' | 'dir' | 'rel' | 'name' | 'raw' | 'prompt'
export type OpenWith = 'default' | 'cursor' | 'finder'

export interface CopyResult {
  ok: boolean
  bytes?: number
  what?: string
  error?: string
}
export interface OpenResult {
  ok: boolean
  opened?: string
  with?: string
  error?: string
}

/** 复制技能内容 / 路径到剪贴板（由后端执行） */
export function copy(id: string, what: CopyWhat = 'path'): Promise<CopyResult> {
  return postTolerant<CopyResult>('/copy', { id, what })
}

/** 用指定编辑器 / 访达打开技能文件 */
export function open(id: string, withApp: OpenWith = 'default'): Promise<OpenResult> {
  return postTolerant<OpenResult>('/open', { id, with: withApp })
}

// ── 正文段落级翻译（中文/原文 tab 切换用）───────────────────────────────
export interface TranslateSegment {
  /** 段落原文的 md5，前端用于缓存 key */
  md5: string
  /** 原文段落 */
  text: string
  /** 译文（代码块/中文段为原文本身） */
  translated: string
  /** 跳过原因（'code' 表示代码块未翻译） */
  skipped?: string
  /** 翻译状态；failed/timeout/unchanged 时 translated 为原文，不能当作中文译文展示。 */
  status?: 'source' | 'cached' | 'translated' | 'unchanged' | 'failed' | 'timeout'
  error?: string
}

export interface TranslateRawResult {
  ok: boolean
  partial?: boolean
  segments: TranslateSegment[]
}

/** 翻译进度（已完成段数 / 总段数） */
export interface TranslateProgress {
  done: number
  total: number
}

// 后端 /api/translate-raw 流式 NDJSON 消息类型
type TranslateStreamMsg =
  | { type: 'start'; total: number }
  | { type: 'segment'; index: number; done: number; total: number; segment: TranslateSegment }
  | { type: 'done'; ok: boolean; partial?: boolean; segments: TranslateSegment[] }
  | { type: 'error'; error: string }

// 模块级缓存：fetchTranslatedRaw 结果按技能 ID 与正文指纹缓存。
// 组件卸载重挂载时不丢失，避免重新打开技能时重复网络请求。
// 后端已有 md5 段落缓存（毫秒级），但前端缓存可省去网络往返。
// 页面刷新（重新加载 JS）时清空；正文变化时新指纹会自动失效旧浏览器缓存。
const translatedRawCache = new Map<string, TranslateRawResult>()

/** 仅用于浏览器加速缓存失效，不用于安全用途。 */
function contentFingerprint(text: string): string {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16)
}

/**
 * 拉取技能正文的段落级译文（流式 NDJSON，支持实时进度与取消）。
 *
 * 后端每翻译完一段就发送一行 NDJSON，前端通过 onProgress 回调实时
 * 更新 X/Y 段进度。切换技能时通过 AbortController 取消未完成请求，
 * 避免旧请求占用连接池、旧译文覆盖新技能状态。
 *
 * 三级缓存：内存 Map → IndexedDB 持久化 → 网络请求。
 * IndexedDB 让页面刷新后仍可毫秒级展示已翻译过的技能正文，离线时
 * （navigator.onLine === false）命中缓存直接返回，不发起网络请求。
 *
 * @param id  技能 id
 * @param sourceText 当前正文，用于生成浏览器缓存失效指纹
 * @param opts.signal      AbortSignal，切换技能时 abort 取消请求
 * @param opts.onProgress  进度回调（done/total）
 */
export async function fetchTranslatedRaw(
  id: string,
  sourceText: string,
  opts?: { signal?: AbortSignal; onProgress?: (p: TranslateProgress) => void },
): Promise<TranslateRawResult> {
  const cacheKey = `${id}:${contentFingerprint(sourceText)}`
  // 1. 内存缓存
  const cached = translatedRawCache.get(cacheKey)
  if (cached) {
    opts?.onProgress?.({ done: cached.segments.length, total: cached.segments.length })
    return cached
  }

  // 2. IndexedDB 持久化缓存（页面刷新后仍可用）
  const persisted = await idbGet<TranslateRawResult>(cacheKey)
  if (persisted) {
    translatedRawCache.set(cacheKey, persisted)
    opts?.onProgress?.({ done: persisted.segments.length, total: persisted.segments.length })
    return persisted
  }

  // 3. 离线模式：无缓存时不发起网络请求，抛错让调用方降级显示原文
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('offline')
  }

  const res = await fetch(`${API_BASE}/translate-raw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
    signal: opts?.signal,
  })
  if (!res.ok) throw new Error(`translate-raw 失败: ${res.status}`)
  if (!res.body) throw new Error('translate-raw 无响应体')

  // 流式读取 NDJSON（每行一个 JSON 消息）
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let segments: TranslateSegment[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const line of lines) {
      if (!line.trim()) continue
      let msg: TranslateStreamMsg
      try {
        msg = JSON.parse(line) as TranslateStreamMsg
      } catch {
        continue // 跳过解析失败的行（如不完整 chunk）
      }
      if (msg.type === 'start') {
        total = msg.total
        opts?.onProgress?.({ done: 0, total })
      } else if (msg.type === 'segment') {
        segments[msg.index] = msg.segment
        opts?.onProgress?.({ done: msg.done, total: msg.total })
      } else if (msg.type === 'done') {
        segments = msg.segments
      } else if (msg.type === 'error') {
        throw new Error(msg.error)
      }
    }
  }

  const result: TranslateRawResult = {
    ok: !segments.some((segment) =>
      segment.status === 'failed' || segment.status === 'timeout' || segment.status === 'unchanged',
    ),
    partial: segments.some((segment) =>
      segment.status === 'failed' || segment.status === 'timeout' || segment.status === 'unchanged',
    ),
    segments,
  }
  translatedRawCache.set(cacheKey, result)
  // 异步写入 IndexedDB（不阻塞返回）
  void idbSet(cacheKey, result)
  return result
}

/** 翻译单段文本（后端走中文短路 + md5 缓存 + Google） */
export function translateText(
  text: string,
  targetLang = 'zh-CN',
): Promise<{
  ok: boolean
  result: string
  targetLang: string
  status: 'source' | 'cached' | 'translated' | 'unchanged' | 'failed' | 'timeout'
  provider: string
  error?: string
}> {
  return postTolerant('/translate', { text, targetLang })
}
