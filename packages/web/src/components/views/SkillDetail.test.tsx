import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SkillDetail } from './SkillDetail'
import type { SkillItem } from '@/types'

// vi.mock 是 hoisted,工厂函数内不能引用外部变量。用 vi.hoisted 提升变量。
const { fetchSkillDetailMock, fetchTranslatedRawMock } = vi.hoisted(() => ({
  fetchSkillDetailMock: vi.fn(),
  fetchTranslatedRawMock: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  fetchSkillDetail: fetchSkillDetailMock,
  fetchTranslatedRaw: fetchTranslatedRawMock,
  translateText: vi.fn(async () => ({ ok: true, result: '', targetLang: 'zh-CN' })),
  copy: vi.fn(async () => ({ ok: true })),
  open: vi.fn(async () => ({ ok: true })),
}))
import { fetchSkillDetail, fetchTranslatedRaw } from '@/lib/api'

const item: SkillItem = {
  id: 'demo-1',
  kind: 'skill',
  source: 'claude-code',
  editor: 'Claude Code',
  name: 'autoplan',
  title: 'autoplan',
  description: 'Auto-review pipeline',
  paths: { abs: '/Users/x/.claude/skills/autoplan/SKILL.md', rootKind: 'home' },
  preview: '预览内容',
  updatedAt: '2026-01-01',
}

beforeEach(() => {
  vi.clearAllMocks()
  // 默认实现:空段落译文(被现有 3 个测试复用)
  fetchTranslatedRawMock.mockResolvedValue({ ok: true, segments: [] })
})

describe('SkillDetail（P7 markdown 正文）', () => {
  it('拉取 raw 并渲染 markdown 正文', async () => {
    vi.mocked(fetchSkillDetail).mockResolvedValue({
      ...item,
      raw: '## 正文标题\n\n正文段落内容',
    })
    render(<SkillDetail item={item} />)
    // 元数据
    expect(screen.getByText('Anthropic / Claude Code')).toBeInTheDocument()
    expect(screen.getByText((item.paths as NonNullable<typeof item.paths>).abs)).toBeInTheDocument()
    expect(screen.getByText('复制正文')).toBeInTheDocument()
    // markdown 渲染（异步加载后出现）
    expect(await screen.findByText('正文标题')).toBeInTheDocument()
    expect(screen.getByText('正文段落内容')).toBeInTheDocument()
    expect(fetchSkillDetail).toHaveBeenCalledWith('demo-1')
  })

  it('raw 为空显示占位', async () => {
    vi.mocked(fetchSkillDetail).mockResolvedValue({ ...item, raw: '' })
    render(<SkillDetail item={item} />)
    expect(await screen.findByText('（无正文内容）')).toBeInTheDocument()
  })

  it('拉取失败显示错误', async () => {
    vi.mocked(fetchSkillDetail).mockRejectedValue(new Error('boom'))
    render(<SkillDetail item={item} />)
    expect(await screen.findByText('正文加载失败')).toBeInTheDocument()
  })

  it('插件详情显示中文能力和安全清单路径', async () => {
    const pluginItem: SkillItem = {
      ...item,
      id: 'sites',
      kind: 'plugin',
      name: 'sites',
      title: 'Sites',
      plugin: {
        manifestPath: '/Users/x/.codex/plugins/cache/sites/.codex-plugin/plugin.json',
        version: '0.1.27',
        author: 'OpenAI',
        category: 'Productivity',
        capabilities: [
          { kind: 'skill', label: 'skills', count: 2 },
          { kind: 'mcp', label: 'mcpServers' },
          { kind: 'app', label: 'apps' },
          { kind: 'interactive', label: 'Interactive' },
          { kind: 'write', label: 'Write' },
        ],
      },
    }
    vi.mocked(fetchSkillDetail).mockResolvedValue({ ...pluginItem, raw: '# Sites' })

    render(<SkillDetail item={pluginItem} variant="reader" />)

    expect(await screen.findByText('插件能力')).toBeInTheDocument()
    expect(screen.getByText('技能 2')).toBeInTheDocument()
    expect(screen.getByText('MCP 服务')).toBeInTheDocument()
    expect(screen.getByText('效率工具')).toBeInTheDocument()
    expect(screen.getByText('/Users/x/.codex/plugins/cache/sites/.codex-plugin/plugin.json')).toBeInTheDocument()
  })
})

describe('SkillDetail 切换技能正文翻译', () => {
  // 模拟真实 fetch 对 AbortSignal 的响应:abort 时 reject AbortError,
  // 否则 50ms 后返回带译文的 segments。
  function setupAbortableTranslateMock() {
    fetchTranslatedRawMock.mockImplementation(
      (id: string, opts?: { signal?: AbortSignal }) =>
        new Promise<{ ok: boolean; segments: { md5: string; text: string; translated: string }[] }>(
          (resolve, reject) => {
            const onAbort = () => {
              const err = new Error('aborted') as Error & { name: string }
              err.name = 'AbortError'
              reject(err)
            }
            if (opts?.signal?.aborted) {
              onAbort()
              return
            }
            opts?.signal?.addEventListener('abort', onAbort, { once: true })
            setTimeout(() => {
              opts?.signal?.removeEventListener('abort', onAbort)
              resolve({
                ok: true,
                segments: [{ md5: 'x', text: '原文', translated: `译文-${id}` }],
              })
            }, 50)
          },
        ),
    )
  }

  // 回归测试:切换技能后,第二个技能的正文译文必须能正常拉取并显示。
  // 旧 bug:fetchedRawFor.current 在 fetchTranslatedRaw 调用前就被设为
  // item.id,切换技能时本 effect 会因旧 status/raw 先跑一次,发起的请求
  // 随即被 cleanup 的 ac.abort() 取消;等 fetchSkillDetail 完成、
  // status/raw 更新后,本 effect 因 fetchedRawFor.current===item.id 而
  // early return,翻译永远不发起,界面卡在"翻译中"。
  it('切换技能后,第二个技能的正文译文应被显示', async () => {
    setupAbortableTranslateMock()
    fetchSkillDetailMock.mockImplementation(async (id: string) => ({
      ...item,
      id,
      name: id,
      raw: `# ${id} 正文内容`,
    }))

    const { rerender } = render(<SkillDetail item={{ ...item, id: 'skill-1', name: 'skill-1' }} />)

    // 第一个技能翻译应正常显示
    expect(await screen.findByText('译文-skill-1', {}, { timeout: 2000 })).toBeInTheDocument()

    // 切换到第二个技能
    rerender(<SkillDetail item={{ ...item, id: 'skill-2', name: 'skill-2' }} />)

    // 第二个技能的译文应被显示 — 旧 bug 会卡在"翻译中"超时
    await waitFor(
      async () => {
        expect(screen.getByText('译文-skill-2')).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })
})
