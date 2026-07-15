/**
 * useLiveReload.test.ts — 短连接轮询测试
 *
 * 验证：
 * 1. 首次轮询只记录 lastReloadAt，不触发 onReload（避免启动时多余刷新）
 * 2. 后续轮询 lastReloadAt 变化时触发 onReload
 * 3. lastReloadAt 不变时不触发
 * 4. 轮询失败时静默，不抛错
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLiveReload } from '../useLiveReload'

function mockFetchResponse(lastReloadAt: string, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => ({ lastReloadAt }),
  })
}

describe('useLiveReload', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals() // 清理 vi.stubGlobal('fetch', ...)（对齐 api.test.ts 惯例）
    vi.restoreAllMocks()
  })

  it('首次轮询只记录 lastReloadAt，不触发 onReload', async () => {
    const onReload = vi.fn()
    vi.stubGlobal('fetch', mockFetchResponse('2026-01-01T00:00:00Z'))
    renderHook(() => useLiveReload(onReload))
    // useLiveReload 首次 render 立即调用一次 poll()
    await vi.advanceTimersByTimeAsync(0)
    expect(onReload).not.toHaveBeenCalled()
  })

  it('lastReloadAt 变化时触发 onReload', async () => {
    const onReload = vi.fn()
    let lastReloadAt = '2026-01-01T00:00:00Z'
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({ lastReloadAt }),
    })))
    renderHook(() => useLiveReload(onReload))
    await vi.advanceTimersByTimeAsync(0) // 首次 poll：只记录
    expect(onReload).not.toHaveBeenCalled()

    // 变更 lastReloadAt，推进 10s 触发下次 poll
    lastReloadAt = '2026-01-01T00:01:00Z'
    await vi.advanceTimersByTimeAsync(10000)
    expect(onReload).toHaveBeenCalledTimes(1)
  })

  it('lastReloadAt 不变时不触发 onReload', async () => {
    const onReload = vi.fn()
    vi.stubGlobal('fetch', mockFetchResponse('2026-01-01T00:00:00Z'))
    renderHook(() => useLiveReload(onReload))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(10000)
    await vi.advanceTimersByTimeAsync(10000)
    expect(onReload).not.toHaveBeenCalled()
  })

  it('翻译版本变化时静默刷新列表', async () => {
    const onReload = vi.fn()
    let revision = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({ lastReloadAt: '2026-01-01T00:00:00Z', translation: { revision } }),
    })))
    renderHook(() => useLiveReload(onReload))
    await vi.advanceTimersByTimeAsync(0)
    revision = 1
    await vi.advanceTimersByTimeAsync(10000)
    expect(onReload).toHaveBeenCalledTimes(1)
  })

  it('轮询失败时静默，不触发 onReload 也不抛错', async () => {
    const onReload = vi.fn()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    renderHook(() => useLiveReload(onReload))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(10000)
    expect(onReload).not.toHaveBeenCalled()
  })

  it('响应不 ok 时不触发 onReload', async () => {
    const onReload = vi.fn()
    vi.stubGlobal('fetch', mockFetchResponse('2026-01-01T00:00:00Z', false))
    renderHook(() => useLiveReload(onReload))
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(10000)
    expect(onReload).not.toHaveBeenCalled()
  })
})
