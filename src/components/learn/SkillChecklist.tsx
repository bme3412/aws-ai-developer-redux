'use client';

import { Skill } from '@/types/domain';
import { formatSkillCompletedAt } from '@/lib/progress';
import SkillCheckbox from './SkillCheckbox';
import { useSkillProgress } from './SkillProgressContext';

interface SkillChecklistProps {
  skills: Skill[];
}

function scrollToSkill(skillId: string) {
  const el = document.querySelector(`[data-skill-id="${skillId}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function SkillChecklist({ skills }: SkillChecklistProps) {
  const progress = useSkillProgress();
  if (!progress || skills.length === 0) return null;
  const { completed, allComplete } = progress;

  const done = skills.filter((s) => completed[s.id]).length;

  return (
    <div
      className={`mb-6 rounded-xl border p-4 ${
        allComplete
          ? 'border-emerald-300 bg-emerald-50/70 skill-task-glow'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-gray-800">Skills in this task</h2>
        <p className={`text-xs font-medium ${allComplete ? 'text-emerald-700' : 'text-gray-500'}`}>
          {done} / {skills.length}
          {allComplete ? ' — all stamped' : ''}
        </p>
      </div>
      <ul className="space-y-2">
        {skills.map((skill) => {
          const isDone = Boolean(completed[skill.id]);
          return (
            <li key={skill.id} className="flex items-start gap-3">
              <div className="pt-0.5">
                <SkillCheckbox skillId={skill.id} size="sm" />
              </div>
              <button
                type="button"
                onClick={() => scrollToSkill(skill.id)}
                className="min-w-0 flex-1 text-left group"
              >
                <span className={`text-sm font-medium ${isDone ? 'text-gray-500' : 'text-gray-800'}`}>
                  {skill.id}
                </span>
                <span className={`block text-xs mt-0.5 ${isDone ? 'text-gray-400' : 'text-gray-500'} group-hover:text-gray-700`}>
                  {skill.description}
                </span>
              </button>
              {isDone && (
                <span className="pt-0.5 text-[11px] text-emerald-700 font-medium tabular-nums whitespace-nowrap skill-time-in">
                  {formatSkillCompletedAt(completed[skill.id])}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
