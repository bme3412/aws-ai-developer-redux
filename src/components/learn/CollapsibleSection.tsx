'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { extractSkillId } from '@/lib/markdown-utils';
import { formatSkillCompletedAt } from '@/lib/progress';
import SkillCheckbox from './SkillCheckbox';
import { useSkillProgress } from './SkillProgressContext';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

const CollapsibleSection = React.memo(function CollapsibleSection({
  id,
  title,
  isExpanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const skillId = extractSkillId(title);
  const progress = useSkillProgress();
  const completedAt = skillId && progress ? progress.completed[skillId] : undefined;

  return (
    <section
      id={id}
      data-skill-id={skillId ?? undefined}
      className={`scroll-mt-24 mb-2 ${completedAt ? 'skill-section-done' : ''}`}
    >
      <div className="flex items-center gap-2 sm:gap-3 py-3 border-b border-gray-200">
        {progress && skillId && <SkillCheckbox skillId={skillId} />}
        <button
          type="button"
          onClick={() => onToggle(id)}
          className="min-w-0 flex-1 flex items-center gap-3 group text-left hover:border-gray-300 transition-colors"
          aria-expanded={isExpanded}
          aria-controls={`section-content-${id}`}
        >
          <ChevronDown
            className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 flex-shrink-0 ${
              isExpanded ? 'rotate-0' : '-rotate-90'
            }`}
          />
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors min-w-0 break-words">
            {title}
          </h2>
        </button>
        {skillId && completedAt && (
          <span className="hidden sm:inline text-[11px] text-emerald-700 font-medium tabular-nums whitespace-nowrap skill-time-in">
            {formatSkillCompletedAt(completedAt)}
          </span>
        )}
      </div>

      <div
        id={`section-content-${id}`}
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pt-4">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
});

export default CollapsibleSection;
