interface Pain {
  tag: string
  title: string
  desc: string
}

const PAINS: Pain[] = [
  {
    tag: '痛点一',
    title: '本机技能散落各处，没整理',
    desc: '装了多少、在哪儿、能不能用，全靠记忆。想找一个得翻遍磁盘，根本不知道本机到底有哪些能力。',
  },
  {
    tag: '痛点二',
    title: '技能描述是英文，看不懂',
    desc: '帮助文档只有英文，整页机翻又混着术语更乱，连命令名都被硬翻译，照抄就报错。',
  },
]

/** 痛点区：两类核心痛点--散落无整理、英文看不懂 */
export function PainPoints() {
  return (
    <section className="border-b border-border">
      <div className="section">
        <div className="mb-10 text-center">
          <h2 className="text-h2 font-bold">两个最烦人的问题</h2>
          <p className="mt-2 text-body text-muted-foreground">
            用 AI 助手时，真正卡住你的往往不是模型，而是这些。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {PAINS.map((p) => (
            <div key={p.title} className="card-elevated">
              <span className="text-caption font-medium text-primary">{p.tag}</span>
              <h3 className="mt-2 text-h4 font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-body-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
