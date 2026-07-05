/**
 * TierGroup.tsx
 * 单个分组组件（Tier 1/2/3）
 * Tier 1: 支持内部按编辑器品牌分组
 * Tier 2/3: 直接列出技能
 */

'use client';

import { useMemo } from 'react';
import { SkillItem } from '@/types';
import SkillItemComponent from './SkillItem';
import { OfficialBrandIcon } from '@/components/ui/OfficialBrandIcon';

interface TierGroupProps {
  title: string;
  icon: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  skills: SkillItem[];
  tier: 'tier-1' | 'tier-2' | 'tier-3';
  collapsedBrands?: Set<string>;
  onToggleBrand?: (brand: string) => void;
  onSelectSkill?: (skillId: string) => void;
}

export default function TierGroup({
  title,
  icon,
  count,
  expanded,
  onToggle,
  skills,
  tier,
  collapsedBrands = new Set(),
  onToggleBrand,
  onSelectSkill,
}: TierGroupProps) {
  // Tier 1: 按 editorBrand 分组
  const groupedByBrand = useMemo(() => {
    if (tier !== 'tier-1') return {};
    const groups: Record<string, SkillItem[]> = {};
    skills.forEach(skill => {
      const brand = skill.editorBrand || 'other';
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(skill);
    });
    return groups;
  }, [skills, tier]);

  return (
    <div className="border border-divider rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-hover transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">{icon}</span>
          <span className="font-semibold text-sm truncate">{title}</span>
        </div>
        <span className="text-xs bg-badge text-badge-text px-2 py-1 rounded ml-2 flex-shrink-0">
          {count}
        </span>
        <span className="text-xs ml-2 flex-shrink-0">{expanded ? '▼' : '▶'}</span>
      </button>

      {/* Content */}
      {expanded && (
        <div className="border-t border-divider">
          {tier === 'tier-1' ? (
            // Tier 1: 编辑器工具品牌分组
            <div className="divide-y divide-divider">
              {Object.entries(groupedByBrand).map(([brand, brandSkills]) => (
                <BrandGroup
                  key={brand}
                  brand={brand}
                  skills={brandSkills}
                  collapsed={collapsedBrands?.has(brand) ?? false}
                  onToggle={() => onToggleBrand?.(brand)}
                  onSelectSkill={onSelectSkill}
                />
              ))}
            </div>
          ) : (
            // Tier 2 / 3: 直接列出技能
            <div className="divide-y divide-divider">
              {skills.map(skill => (
                <SkillItemComponent
                  key={skill.id}
                  skill={skill}
                  onSelectSkill={onSelectSkill}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface BrandGroupProps {
  brand: string;
  skills: SkillItem[];
  collapsed: boolean;
  onToggle: () => void;
  onSelectSkill?: (skillId: string) => void;
}

function BrandGroup({ brand, skills, collapsed, onToggle, onSelectSkill }: BrandGroupProps) {
  return (
    <div className="bg-tier1-bg">
      {/* 品牌 header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 pl-6 hover:bg-hover transition-colors text-sm"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <OfficialBrandIcon brand={brand} size={16} label={brand} className="rounded" />
          <span className="capitalize truncate">{brand}</span>
          <span className="text-xs text-muted flex-shrink-0">({skills.length})</span>
        </div>
        <span className="text-xs flex-shrink-0">{collapsed ? '▶' : '▼'}</span>
      </button>

      {/* 品牌内的技能列表 */}
      {!collapsed && (
        <div className="divide-y divide-divider bg-white">
          {skills.map(skill => (
            <SkillItemComponent
              key={skill.id}
              skill={skill}
              indent
              onSelectSkill={onSelectSkill}
            />
          ))}
        </div>
      )}
    </div>
  );
}
