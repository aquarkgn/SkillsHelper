import { useState } from 'react'

interface Step {
  cmd: string
  desc: string
}

// 命令来源已验证：
// - npm install -g huhaa-myskills@latest  -> docs/Frontend-Spec.md:1190
// - huhaa-myskills start                   -> bin/huhaa-myskills.mjs:121
const STEPS: Step[] = [
  { cmd: 'npm install -g huhaa-myskills@latest', desc: '全局安装 CLI' },
  { cmd: 'huhaa-myskills start', desc: '启动本地面板（默认端口 11520）' },
]

const DEV_STEPS: Step[] = [
  { cmd: 'git clone https://github.com/aquarkgn/HuHaa-MySkills.git', desc: '克隆仓库' },
  { cmd: 'npm install', desc: '安装依赖' },
  { cmd: 'npm start && npm run dev', desc: '启动后端 + 前端开发服务器' },
]

function CmdRow({ cmd, desc }: Step) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(cmd)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 静默：剪贴板不可用时用户可手动选中
    }
  }

  return (
    <div className="code-block">
      <span className="select-none text-muted-foreground">$</span>
      <code>{cmd}</code>
      <button type="button" onClick={copy}>
        {copied ? '已复制' : '复制'}
      </button>
    </div>
  )
}

/** 快速开始：终端用户安装 + 开发者本地启动，命令均可验证 */
export function QuickStart() {
  return (
    <section id="quickstart" className="border-b border-border">
      <div className="section">
        <div className="mb-10 text-center">
          <h2 className="text-h2 font-bold">装上就能用</h2>
          <p className="mt-2 text-body text-muted-foreground">
            本地运行，数据不出本机。一行安装，一行启动，浏览器打开就是整理好的面板。
          </p>
        </div>

        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {STEPS.map((s) => (
            <div key={s.cmd} className="flex flex-col gap-1.5">
              <CmdRow cmd={s.cmd} desc={s.desc} />
              <span className="px-1 text-caption text-muted-foreground">{s.desc}</span>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          <h3 className="mb-3 text-body-sm font-semibold text-muted-foreground">
            开发者本地启动
          </h3>
          <div className="flex flex-col gap-3">
            {DEV_STEPS.map((s) => (
              <div key={s.cmd} className="flex flex-col gap-1.5">
                <CmdRow cmd={s.cmd} desc={s.desc} />
                <span className="px-1 text-caption text-muted-foreground">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
