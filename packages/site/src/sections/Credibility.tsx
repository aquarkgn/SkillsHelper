interface Stat {
  value: string
  label: string
}

// 版本号来自 package.json（真实可查）。
const STATS: Stat[] = [
  { value: '中英对照', label: '翻译不丢原文' },
  { value: '命令名不译', label: '照抄就能用' },
  { value: '本地缓存', label: '翻译不重复请求' },
  { value: 'v0.3.7', label: '持续迭代 · MIT' },
]

/** 可信度区：用翻译与整理相关的真实能力做支撑，不堆空话 */
export function Credibility() {
  return (
    <section id="credibility" className="bg-muted/30">
      <div className="section">
        <div className="mb-10 text-center">
          <h2 className="text-h2 font-bold">为什么能放心用</h2>
          <p className="mt-2 text-body text-muted-foreground">
            翻译有缓存、有中英对照、不误译命令，整理全在本机完成。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border bg-card p-6 text-center"
              style={{ boxShadow: '0 1px 2px hsl(var(--color-foreground) / 0.04)' }}
            >
              <div className="text-h4 font-bold text-primary">{s.value}</div>
              <div className="mt-1 text-caption text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
