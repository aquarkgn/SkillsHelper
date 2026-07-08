import { useState } from 'react'

interface HeroProps {
  repoUrl: string
}

const INSTALL_CMD = 'npm install -g huhaa-myskills@latest'

/** Hero：中英主定位 + 安装命令 + CTA + 截图占位 */
export function Hero({ repoUrl }: HeroProps) {
  const [copied, setCopied] = useState(false)

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 剪贴板不可用（如非 HTTPS / 旧浏览器）：静默，用户可手动选中复制
    }
  }

  return (
    <section id="top" className="canvas-dotted border-b border-border">
      <div className="section flex flex-col items-center gap-8 py-20 text-center md:py-28">
        {/* 品牌标识徽章 */}
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-caption text-muted-foreground shadow-sm">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          本地 AI 助手 · 技能 / 工具 / 命令 整理与翻译
        </span>

        {/* 标题：多色霓虹效果，问句冷色调、答案暖色调形成层次 */}
        <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight md:text-5xl">
          <span className="neon-cool">本机技能、工具、命令散落各处、看不懂英文？</span>
          <br className="hidden md:inline" />
          <span className="neon-warm">这里一次性整理好。</span>
        </h1>

        {/* 副标：长句拆短，重点词高亮 */}
        <p className="max-w-2xl text-body text-muted-foreground md:text-lg">
          自动扫描本机技能、插件、命令行帮助，
          <span className="text-foreground">统一查看、搜索、分类、筛选</span>；
          英文描述自动翻译成中文并本地缓存，
          <span className="text-foreground">中英对照，命令名不误译</span>。
        </p>

        {/* 安装命令 */}
        <div className="code-block w-full max-w-xl text-left">
          <span className="select-none text-muted-foreground">$</span>
          <code>{INSTALL_CMD}</code>
          <button type="button" onClick={copyInstall}>
            {copied ? '已复制' : '复制'}
          </button>
        </div>

        {/* CTA：主按钮加阴影加大，次按钮弱化 */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-primary px-6 py-3 text-body font-medium text-primary-foreground shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
          >
            GitHub 仓库
          </a>
          <a
            href="#quickstart"
            className="rounded-md border border-border bg-card px-6 py-3 text-body text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            快速开始
          </a>
        </div>

        {/* 截图占位：诚实标注待录制，加产品特征暗示 */}
        <div className="mt-4 w-full max-w-4xl">
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            {/* 浏览器窗口示意：顶部三点 */}
            <div className="absolute left-4 top-4 flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary/50" />
            </div>
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <span className="text-body-sm">产品截图待录制</span>
              <span className="text-caption">
                本机技能列表 · 中英对照 · 搜索 / 分类 / 筛选
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
