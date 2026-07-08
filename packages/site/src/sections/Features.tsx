interface Feature {
  tag: string
  title: string
  desc: string
}

const FEATURES: Feature[] = [
  {
    tag: '核心',
    title: '英文描述翻译成中文，中英对照',
    desc: '技能/工具的英文帮助自动翻译成中文，本地缓存、不重复请求。中英对照切换查看，已是中文的直接跳过；代码块和命令名不翻译，照抄就能用。',
  },
  {
    tag: '核心',
    title: '识别本机已有的技能',
    desc: '自动扫描本机散落的技能、插件、命令行帮助，告诉你本机到底装了哪些能力、在哪里、能不能用。不用再翻磁盘、靠记忆。',
  },
  {
    tag: '整理',
    title: '统一查看、搜索、分类、筛选',
    desc: '散落各处的能力聚到一个面板。按来源分类（官方工具 / 自定义技能 / 其它来源），关键词搜索、排序、筛选，一眼找到要用的。',
  },
]

/** 功能区：核心价值点--英文翻译中英对照、识别本机技能、统一搜索筛选 */
export function Features() {
  return (
    <section id="features" className="border-b border-border bg-muted/30">
      <div className="section">
        <div className="mb-10 text-center">
          <h2 className="text-h2 font-bold">它帮你做什么</h2>
          <p className="mt-2 text-body text-muted-foreground">
            三件事，解决"散落没整理"和"看不懂英文"。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-elevated">
              <span
                className={
                  f.tag === '核心'
                    ? 'inline-block rounded-sm bg-primary px-2 py-0.5 text-caption text-primary-foreground'
                    : 'inline-block rounded-sm bg-muted px-2 py-0.5 text-caption text-muted-foreground'
                }
              >
                {f.tag}
              </span>
              <h3 className="mt-3 text-h4 font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-body-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
