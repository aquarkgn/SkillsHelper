/**
 * SidebarMenu.tsx
 * 左侧菜单，按 Tier 分组显示技能
 * Tier 1: 编辑器工具技能
 * Tier 2: 自定义技能
 * Tier 3: 其它技能（可选）
 */

'use client';

import { SkillItem } from '@/types';
import { useSidebarMenu } from '@/hooks/useSidebarMenu';
import TierGroup from './TierGroup';

interface SidebarMenuProps {
  skills: SkillItem[];
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  onSelectSkill?: (skillId: string) => void;
}

export default function SidebarMenu({
  skills,
  tier1Count,
  tier2Count,
  tier3Count,
  onSelectSkill,
}: SidebarMenuProps) {
  const { menuState, toggleTier1, toggleTier2, toggleTier3, toggleBrand } =
    useSidebarMenu();

  // 按 tier 分组
  const tier1Skills = skills.filter(s => s.tierId === 'tier-1');
  const tier2Skills = skills.filter(s => s.tierId === 'tier-2');
  const tier3Skills = skills.filter(s => s.tierId === 'tier-3');

  return (
    <nav className="w-64 bg-sidebar border-r border-divider overflow-y-auto">
      <div className="p-4 space-y-2">
        {/* Tier 1: 编辑器工具技能 */}
        <TierGroup
          title="编辑器工具技能"
          icon="📦"
          count={tier1Count}
          expanded={menuState.tier1Expanded}
          onToggle={toggleTier1}
          skills={tier1Skills}
          tier="tier-1"
          collapsedBrands={menuState.collapsedBrands}
          onToggleBrand={toggleBrand}
          onSelectSkill={onSelectSkill}
        />

        {/* Tier 2: 自定义技能（仅在有技能时显示） */}
        {tier2Count > 0 && (
          <TierGroup
            title="自定义技能"
            icon="👤"
            count={tier2Count}
            expanded={menuState.tier2Expanded}
            onToggle={toggleTier2}
            skills={tier2Skills}
            tier="tier-2"
            onSelectSkill={onSelectSkill}
          />
        )}

        {/* Tier 3: 其它技能（仅在有技能时显示） */}
        {tier3Count > 0 && (
          <TierGroup
            title="其它技能"
            icon="🔍"
            count={tier3Count}
            expanded={menuState.tier3Expanded}
            onToggle={toggleTier3}
            skills={tier3Skills}
            tier="tier-3"
            onSelectSkill={onSelectSkill}
          />
        )}
      </div>
    </nav>
  );
}
