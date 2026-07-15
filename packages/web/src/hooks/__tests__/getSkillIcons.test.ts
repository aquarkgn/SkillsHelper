/**
 * getSkillIcons.test.ts — Unit tests for skill icon mapping system
 *
 * Tests cover:
 * 1. Tier 1 (tool) items return correct brand icon + display label
 * 2. Tier 2 (directory) items return folder icon + dirName
 * 3. Tier 3 (other) items return "other" icon
 * 4. Sorting and grouping utilities work correctly
 */

import { describe, it, expect } from 'vitest'
import {
  getSkillIcons,
  getBrandIconForTier1,
  getTierIconMap,
  sortByTier,
  groupByTier,
} from '@/hooks/getSkillIcons'
import type { SkillItem } from '@/types'

describe('getSkillIcons', () => {
  // Helper to create mock SkillItem
  const createSkill = (overrides: Partial<SkillItem>): SkillItem => ({
    id: 'test-id',
    kind: 'skill',
    source: 'hermes',
    name: 'test-skill',
    title: 'Test Skill',
    ...overrides,
  })

  describe('Tier 1: Official Tools', () => {
    it('should return brand icon + tool name for Tier 1 hermes', () => {
      const skill = createSkill({
        tier: 'tool',
        brand: 'hermes',
        name: 'some-hermes-skill',
      })

      const result = getSkillIcons(skill)

      expect(result.isTier1).toBe(true)
      expect(result.isTier2).toBe(false)
      expect(result.isTier3).toBe(false)
      expect(result.brandIcon).toBe('⚡') // Hermes icon
      expect(result.tierIcon).toBe('🔧') // Tool icon
      expect(result.displayLabel).toBe('⚡ some-hermes-skill')
      expect(result.tierSort).toBe(1)
    })

    it('should return brand icon + tool name for Tier 1 claude', () => {
      const skill = createSkill({
        tier: 'tool',
        brand: 'claude',
        name: 'claude-skill',
      })

      const result = getSkillIcons(skill)

      expect(result.brandIcon).toBe('🤖') // Claude icon
      expect(result.displayLabel).toBe('🤖 claude-skill')
    })

    it('should return cursor icon for Tier 1 cursor', () => {
      const skill = createSkill({
        tier: 'tool',
        brand: 'cursor',
        name: 'cursor-rule',
      })

      const result = getSkillIcons(skill)

      expect(result.brandIcon).toBe('📝') // Cursor icon
      expect(result.displayLabel).toBe('📝 cursor-rule')
    })

    it('should return codex icon for Tier 1 codex', () => {
      const skill = createSkill({
        tier: 'tool',
        brand: 'codex',
        name: 'codex-plugin',
      })

      const result = getSkillIcons(skill)

      expect(result.brandIcon).toBe('💡') // Codex icon
      expect(result.displayLabel).toBe('💡 codex-plugin')
    })
  })

  describe('Tier 2: Directory Skills', () => {
    it('should return folder icon + dirName for Tier 2', () => {
      const skill = createSkill({
        tier: 'directory',
        source: 'directory',
        name: 'auth-flow',
        dirName: 'auth-flow',
      })

      const result = getSkillIcons(skill)

      expect(result.isTier2).toBe(true)
      expect(result.tierIcon).toBe('📁') // Directory icon
      expect(result.tierLabel).toBe('其它技能')
      expect(result.displayLabel).toBe('📁 auth-flow')
      expect(result.tierSort).toBe(2)
    })

    it('should fallback to name if dirName not provided', () => {
      const skill = createSkill({
        tier: 'directory',
        source: 'directory',
        name: 'my-custom-skill',
      })

      const result = getSkillIcons(skill)

      expect(result.displayLabel).toBe('📁 my-custom-skill')
    })
  })

  describe('Tier 3: Other Sources', () => {
    it('should return other icon for Tier 3', () => {
      const skill = createSkill({
        tier: 'other',
        source: 'project-runbook',
        name: 'deployment-guide',
      })

      const result = getSkillIcons(skill)

      expect(result.isTier3).toBe(true)
      expect(result.tierIcon).toBe('⚙️') // Other icon
      expect(result.tierLabel).toBe('其它技能')
      expect(result.displayLabel).toBe('⚙️ deployment-guide')
      expect(result.tierSort).toBe(3)
    })

    it('should default to Tier 3 if tier is missing', () => {
      const skill = createSkill({
        // tier not set
        source: 'project-runbook',
      })

      const result = getSkillIcons(skill)

      expect(result.isTier3).toBe(true)
      expect(result.tierSort).toBe(3)
    })
  })

  describe('normalizeTier（tierId 优先于 tier）', () => {
    // v4.0 scanner 只输出 tierId（'tier-1'/'tier-2'/'tier-3'），旧字段 tier
    // 在不同接口口径不一致。normalizeTier 应优先读 tierId，回退 tier。
    it('tierId=tier-1 → Tier 1（tool）', () => {
      const skill = createSkill({ tierId: 'tier-1', brand: 'hermes', name: 'x' })
      const result = getSkillIcons(skill)
      expect(result.isTier1).toBe(true)
      expect(result.tierSort).toBe(1)
    })

    it('tierId=tier-2 → Tier 2（directory）', () => {
      const skill = createSkill({ tierId: 'tier-2', name: 'dir-skill', dirName: 'dir-skill' })
      const result = getSkillIcons(skill)
      expect(result.isTier2).toBe(true)
      expect(result.tierSort).toBe(2)
    })

    it('tierId=tier-3 → Tier 3（other）', () => {
      const skill = createSkill({ tierId: 'tier-3', name: 'other-skill' })
      const result = getSkillIcons(skill)
      expect(result.isTier3).toBe(true)
      expect(result.tierSort).toBe(3)
    })

    it('tierId 优先于 tier（两者冲突时以 tierId 为准）', () => {
      // tierId=tier-1 但 tier='other' —— 应归一化为 Tier 1
      const skill = createSkill({ tierId: 'tier-1', tier: 'other', brand: 'claude', name: 'x' })
      const result = getSkillIcons(skill)
      expect(result.isTier1).toBe(true)
      expect(result.isTier3).toBe(false)
    })

    it('无 tierId 时回退 tier 字段', () => {
      const skill = createSkill({ tier: 'directory', name: 'd', dirName: 'd' })
      const result = getSkillIcons(skill)
      expect(result.isTier2).toBe(true)
    })

    it('tier 为 tier-1/tier-2/tier-3 字符串时也应正确归一化', () => {
      expect(getSkillIcons(createSkill({ tier: 'tier-1' })).isTier1).toBe(true)
      expect(getSkillIcons(createSkill({ tier: 'tier-2' })).isTier2).toBe(true)
      expect(getSkillIcons(createSkill({ tier: 'tier-3' })).isTier3).toBe(true)
    })
  })

  describe('getBrandIconForTier1', () => {
    it('should return all brand icons for Tier 1', () => {
      const brands = getBrandIconForTier1()

      expect(brands.length).toBeGreaterThan(0)
      expect(brands).toContainEqual({
        brand: 'hermes',
        icon: '⚡',
        label: 'Hermes',
      })
      expect(brands).toContainEqual({
        brand: 'claude',
        icon: '🤖',
        label: 'Claude',
      })
      expect(brands).toContainEqual({
        brand: 'cursor',
        icon: '📝',
        label: 'Cursor',
      })
      expect(brands).toContainEqual({
        brand: 'codex',
        icon: '💡',
        label: 'Codex',
      })
    })
  })

  describe('getTierIconMap', () => {
    it('should return all tier icons', () => {
      const tiers = getTierIconMap()

      expect(tiers.length).toBe(3)
      expect(tiers).toContainEqual({
        tier: 'tool',
        icon: '🔧',
        label: '官方工具',
      })
      expect(tiers).toContainEqual({
        tier: 'directory',
        icon: '📁',
        label: '其它技能',
      })
      expect(tiers).toContainEqual({
        tier: 'other',
        icon: '⚙️',
        label: '其它技能',
      })
    })
  })

  describe('sortByTier', () => {
    it('should sort skills by tier order (tool → directory → other)', () => {
      const skills: SkillItem[] = [
        createSkill({ tier: 'other', name: 'c-other' }),
        createSkill({ tier: 'tool', name: 'a-tool' }),
        createSkill({ tier: 'directory', name: 'b-directory' }),
      ]

      const sorted = skills.sort(sortByTier)

      expect(sorted[0].tier).toBe('tool')
      expect(sorted[1].tier).toBe('directory')
      expect(sorted[2].tier).toBe('other')
    })

    it('should maintain stable sort within tier', () => {
      const skills: SkillItem[] = [
        createSkill({ tier: 'tool', name: 'z-tool' }),
        createSkill({ tier: 'tool', name: 'a-tool' }),
      ]

      const sorted = skills.sort(sortByTier)

      // Within same tier, order is stable
      expect(sorted[0].tier).toBe('tool')
      expect(sorted[1].tier).toBe('tool')
    })
  })

  describe('groupByTier', () => {
    it('should group skills by tier', () => {
      const skills: SkillItem[] = [
        createSkill({ tier: 'tool', name: 'hermes-skill' }),
        createSkill({ tier: 'tool', name: 'claude-skill' }),
        createSkill({ tier: 'directory', name: 'custom-skill' }),
        createSkill({ tier: 'other', name: 'project-doc' }),
      ]

      const grouped = groupByTier(skills)

      expect(grouped.tool.length).toBe(2)
      expect(grouped.directory.length).toBe(1)
      expect(grouped.other.length).toBe(1)
    })

    it('should sort within each tier by name', () => {
      const skills: SkillItem[] = [
        createSkill({ tier: 'tool', name: 'z-hermes' }),
        createSkill({ tier: 'tool', name: 'a-claude' }),
        createSkill({ tier: 'directory', name: 'z-custom' }),
        createSkill({ tier: 'directory', name: 'a-custom' }),
      ]

      const grouped = groupByTier(skills)

      expect(grouped.tool[0].name).toBe('a-claude')
      expect(grouped.tool[1].name).toBe('z-hermes')
      expect(grouped.directory[0].name).toBe('a-custom')
      expect(grouped.directory[1].name).toBe('z-custom')
    })

    it('should handle empty skills array', () => {
      const grouped = groupByTier([])

      expect(grouped.tool).toEqual([])
      expect(grouped.directory).toEqual([])
      expect(grouped.other).toEqual([])
    })
  })
})
