import { useEffect, useRef } from 'react'

const POLL_INTERVAL = 10000 // 10s 轮询一次

/**
 * 短连接轮询 /api/reload-state，对比 lastReloadAt 判断是否需要刷新。
 *
 * 不用 SSE 长连接的原因：HTTP/1.1 同域名只有 6 个并发连接，SSE 占 1 个长连接；
 * 后端异常时长连接可能卡住，挤占连接池导致正文加载等请求排队。
 * 短连接轮询每次请求完成即释放连接，后端异常时仅单次请求失败，不影响其他请求。
 *
 * onReload 必须稳定（用 useCallback 包裹），否则每次渲染都会重订阅。
 */
export function useLiveReload(onReload: () => void) {
  const lastReloadAt = useRef<string>('')
  const translationRevision = useRef<number | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    const poll = async () => {
      try {
        const res = await fetch('/api/reload-state')
        if (!res.ok) return
        const data = await res.json()
        const reloadChanged = data.lastReloadAt && data.lastReloadAt !== lastReloadAt.current
        const nextTranslationRevision = typeof data.translation?.revision === 'number'
          ? data.translation.revision
          : null
        const translationChanged = nextTranslationRevision !== null
          && translationRevision.current !== null
          && nextTranslationRevision !== translationRevision.current
        if (reloadChanged || translationChanged) {
          // 首次只记录，不触发刷新（避免启动时多余刷新）
          if (lastReloadAt.current || translationRevision.current !== null) onReload()
        }
        if (data.lastReloadAt) lastReloadAt.current = data.lastReloadAt
        if (nextTranslationRevision !== null) translationRevision.current = nextTranslationRevision
      } catch {
        // 静默：轮询失败不打断界面
      }
    }
    poll()
    timer = setInterval(poll, POLL_INTERVAL)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [onReload])
}
