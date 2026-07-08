import { useState } from 'react'
import { cn } from '@/lib/cn'

interface NavProps {
  repoUrl: string
}

/** 顶部导航：固定吸顶，锚点跳转区块，右侧行为按钮 */
export function Nav({ repoUrl }: NavProps) {
  const [open, setOpen] = useState(false)

  const links = [
    { href: '#features', label: '能做什么' },
    { href: '#quickstart', label: '怎么用' },
    { href: '#credibility', label: '为什么放心' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-6 w-6 rounded-sm bg-primary" aria-hidden />
          HuHaa
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-body-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-primary px-3 py-1.5 text-body-sm text-primary-foreground transition-opacity hover:opacity-90"
          >
            GitHub
          </a>
        </div>

        {/* 移动端菜单按钮 */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-sm border border-border px-2 py-1 text-body-sm md:hidden"
          aria-label="切换菜单"
        >
          菜单
        </button>
      </nav>

      {/* 移动端展开菜单 */}
      <div className={cn('border-t border-border bg-card md:hidden', open ? 'block' : 'hidden')}>
        <div className="flex flex-col gap-1 px-6 py-3">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-sm px-2 py-2 text-body-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm px-2 py-2 text-body-sm text-primary"
          >
            GitHub 仓库 →
          </a>
        </div>
      </div>
    </header>
  )
}
