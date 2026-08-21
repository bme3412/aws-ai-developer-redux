'use client';

import { useSkillProgress } from './SkillProgressContext';
import StampCheckbox from './StampCheckbox';

interface SkillCheckboxProps {
  skillId: string;
  showTimestamp?: boolean;
  size?: 'sm' | 'md';
}

export default function SkillCheckbox({
  skillId,
  showTimestamp = false,
  size = 'md',
}: SkillCheckboxProps) {
  const progress = useSkillProgress();
  if (!progress) return null;
  const { completed, burstId, toggleSkill } = progress;
  const completedAt = completed[skillId];

  return (
    <StampCheckbox
      completedAt={completedAt}
      bursting={burstId === skillId}
      onToggle={() => toggleSkill(skillId)}
      ariaLabel={
        completedAt
          ? `Mark skill ${skillId} incomplete`
          : `Mark skill ${skillId} complete`
      }
      size={size}
      showTimestamp={showTimestamp}
    />
  );
}
