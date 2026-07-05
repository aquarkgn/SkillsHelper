import { describe, expect, it } from 'vitest'

import {
  getSubcommandHelp,
  getSubcommandHelpList,
  getSubcommandHelpSearchText,
  hasSubcommandHelp,
} from './commandHelp'

describe('lib/commandHelp 子命令帮助数据', () => {
  it('按品牌返回已采集的子命令帮助', () => {
    const codexHelp = getSubcommandHelpList('codex')
    expect(codexHelp.length).toBeGreaterThanOrEqual(5)
    expect(codexHelp.map((help) => help.subcommand)).toContain('exec')
  })

  it('支持 plugin|plugins 这类别名子命令查找', () => {
    const help = getSubcommandHelp('claude', 'plugin|plugins')
    expect(help?.subcommand).toBe('plugin')
    expect(hasSubcommandHelp('claude', 'plugin|plugins')).toBe(true)
  })


  it('支持 gstack list 子命令帮助与历史 gstach 品牌别名', () => {
    const help = getSubcommandHelp('gstack', 'list')
    expect(help?.brand).toBe('gstack')
    expect(help?.subcommand).toBe('list')
    expect(help?.usage).toContain('npx @garrytan/gstack list')
    expect(hasSubcommandHelp('gstach', 'list')).toBe(true)
  })

  it('生成搜索文本时包含 usage、flag 与原始说明', () => {
    const help = getSubcommandHelp('codex', 'exec')
    expect(help).toBeDefined()
    if (!help) return

    const text = getSubcommandHelpSearchText(help)
    expect(text).toContain('codex exec')
    expect(text).toContain('--sandbox')
  })
})
