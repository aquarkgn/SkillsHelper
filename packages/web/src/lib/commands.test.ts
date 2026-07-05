import { describe, it, expect } from 'vitest'
import {
  COMMANDS,
  COMMAND_BRAND_SUMMARIES,
  TOTAL_FLAG_COUNT,
  TOTAL_SUBCOMMAND_COUNT,
  getFlagCount,
  getSubcommandCount,
  getTotalFlagCount,
  getTotalSubcommandCount,
  getCommandBrandSummaries,
} from '@/lib/commands'

describe('lib/commands 数据汇总', () => {
  it('brand 列表与 commands.json 书写顺序一致', () => {
    expect(COMMANDS.map((c) => c.brand)).toEqual([
      'claude',
      'code',
      'codex',
      'gstack',
      'hermes',
    ])
  })

  it('单命令的 flag / 子命令计数正确', () => {
    const code = COMMANDS.find((c) => c.brand === 'code')
    expect(code).toBeDefined()
    if (!code) return
    expect(getFlagCount(code)).toBeGreaterThan(0)
    expect(getSubcommandCount(code)).toBeGreaterThan(0)
  })

  it('全量汇总：与数据手工一致', () => {
    let expectedFlags = 0
    let expectedSubs = 0
    for (const c of COMMANDS) {
      expectedFlags += getFlagCount(c)
      expectedSubs += getSubcommandCount(c)
    }
    expect(getTotalFlagCount()).toBe(expectedFlags)
    expect(getTotalSubcommandCount()).toBe(expectedSubs)
    expect(getTotalFlagCount()).toBeGreaterThan(0)
    expect(getTotalSubcommandCount()).toBeGreaterThan(0)
  })

  it('getCommandBrandSummaries 输出每个品牌的统计快照', () => {
    const summaries = getCommandBrandSummaries()
    expect(summaries).toHaveLength(COMMANDS.length)
    for (const summary of summaries) {
      expect(summary.brand).toBeTruthy()
      expect(summary.flagCount).toBeGreaterThan(0)
      expect(summary.subcommandCount).toBeGreaterThanOrEqual(0)
    }
  })

  it('预算常量与函数 API 一致', () => {
    expect(COMMAND_BRAND_SUMMARIES).toHaveLength(COMMANDS.length)
    for (let i = 0; i < COMMANDS.length; i++) {
      const precomputed = COMMAND_BRAND_SUMMARIES[i]
      const onDemand = getCommandBrandSummaries()[i]
      expect(precomputed).toEqual(onDemand)
    }
    expect(TOTAL_FLAG_COUNT).toBe(getTotalFlagCount())
    expect(TOTAL_SUBCOMMAND_COUNT).toBe(getTotalSubcommandCount())
  })

  it('COMMANDS 与预算常量均被冻结，防止运行时误改', () => {
    expect(Object.isFrozen(COMMANDS)).toBe(true)
    expect(Object.isFrozen(COMMAND_BRAND_SUMMARIES)).toBe(true)
  })
})
