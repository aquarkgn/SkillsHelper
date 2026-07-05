/**
 * SkillItem.tsx
 * 单个技能项组件
 */

'use client';

import { SkillItem } from '@/types';
import { OfficialBrandIcon } from '@/components/ui/OfficialBrandIcon';

interface SkillItemComponentProps {
  skill: SkillItem;
  indent?: boolean;
  onSelectSkill?: (skillId: string) => void;
}

export default function SkillItemComponent({
  skill,
  indent = false,
  onSelectSkill,
}: SkillItemComponentProps) {
  return (
    <button
      onClick={() => onSelectSkill?.(skill.id)}
      className={`w-full text-left px-4 py-2 hover:bg-hover transition-colors truncate ${
        indent ? 'pl-12' : ''
      }`}
      title={skill.name}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* 官方技能 icon；缺失时显示中性占位，不使用 emoji / 自制品牌图标兜底 */}
        <OfficialBrandIcon
          brand={skill.brand || skill.editorBrand}
          src={skill.iconUrl}
          size={16}
          label={skill.name}
          className="rounded"
        />
        {/* 技能名称 */}
        <span className="text-sm truncate">{skill.name}</span>
      </div>
    </button>
  );
}
