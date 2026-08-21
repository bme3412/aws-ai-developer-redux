'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getDomain } from '@/lib/domains';
import { countCompletedSkills, formatSkillCompletedAt } from '@/lib/progress';
import { useTaskStamps } from '@/hooks/useTaskStamps';
import StampCheckbox, { StampToast } from '@/components/learn/StampCheckbox';
import { ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';

const domainColors: Record<number, { bg: string; accent: string; text: string; border: string; progressBg: string }> = {
  1: { bg: 'from-blue-50 to-indigo-50', accent: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', progressBg: 'bg-blue-500' },
  2: { bg: 'from-emerald-50 to-teal-50', accent: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', progressBg: 'bg-emerald-500' },
  3: { bg: 'from-amber-50 to-orange-50', accent: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-200', progressBg: 'bg-amber-500' },
  4: { bg: 'from-rose-50 to-pink-50', accent: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-200', progressBg: 'bg-rose-500' },
  5: { bg: 'from-violet-50 to-purple-50', accent: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-200', progressBg: 'bg-violet-500' },
};

export default function DomainPage() {
  const params = useParams();
  const domainId = parseInt(params.domainId as string);
  const domain = getDomain(domainId);
  const colors = domainColors[domainId] || domainColors[1];
  const { completed, burstId, toast, toggleTask } = useTaskStamps();
  const [skillCounts, setSkillCounts] = useState<Record<string, number>>({});

  const domainTaskKeys = useMemo(
    () => domain?.tasks.map((task) => `${domainId}-${task.articleSlug}`) ?? [],
    [domain, domainId]
  );

  useEffect(() => {
    if (!domain) return;
    const counts: Record<string, number> = {};
    domain.tasks.forEach((task) => {
      counts[task.id] = countCompletedSkills(task.skills.map((s) => s.id));
    });
    setSkillCounts(counts);
  }, [domain]);

  if (!domain) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-gray-600">Domain not found.</p>
      </div>
    );
  }

  const completedCount = domainTaskKeys.filter((key) => completed[key]).length;
  const totalCount = domain.tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allStamped = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/learn" className="hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Learn
        </Link>
        <span>/</span>
        <span className="text-gray-700">Domain {domain.id}</span>
      </div>

      <div className={`rounded-xl bg-gradient-to-r ${colors.bg} border ${colors.border} p-6 mb-8 ${allStamped ? 'skill-task-glow' : ''}`}>
        <div className="flex items-center gap-4 mb-3">
          <div className={`w-14 h-14 rounded-xl ${colors.accent} flex items-center justify-center shadow-sm`}>
            <span className="text-2xl font-bold text-white">{domain.id}</span>
          </div>
          <div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors.text} bg-white shadow-sm`}>
              {domain.weight}% of exam
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{domain.name}</h1>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Reading Progress</span>
            <span className={`font-medium ${colors.text}`}>
              {completedCount}/{totalCount} topics completed
              {allStamped ? ' — all stamped' : ''}
            </span>
          </div>
          <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.progressBg} transition-all duration-500 ease-out rounded-full`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <BookOpen className={`w-5 h-5 ${colors.text}`} />
        <h2 className="text-lg font-semibold text-gray-900">Topics</h2>
      </div>
      <div className="space-y-3">
        {domain.tasks.map((task) => {
          const articleKey = `${domain.id}-${task.articleSlug}`;
          const completedAt = completed[articleKey];
          const skillCount = task.skills.length;
          return (
            <Link
              key={task.id}
              href={`/learn/${domain.id}/${task.articleSlug}`}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${
                task.supplemental
                  ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  : completedAt
                    ? 'bg-green-50/30 border-green-200 hover:border-green-300'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <StampCheckbox
                  completedAt={completedAt}
                  bursting={burstId === articleKey}
                  onToggle={() =>
                    toggleTask(articleKey, {
                      taskId: task.id,
                      domainTaskKeys,
                      domainId: domain.id,
                    })
                  }
                  ariaLabel={completedAt ? `Mark Task ${task.id} incomplete` : `Mark Task ${task.id} complete`}
                />
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  task.supplemental ? 'bg-slate-200' : `${colors.accent} bg-opacity-10`
                }`}>
                  <BookOpen className={`w-5 h-5 ${task.supplemental ? 'text-slate-500' : colors.text}`} />
                </div>
                <div className="min-w-0">
                  <h3 className={`font-medium ${
                    completedAt || task.supplemental ? 'text-gray-600' : 'text-gray-800 group-hover:text-gray-900'
                  }`}>
                    Task {task.id}: {task.name}
                  </h3>
                  <p className={`text-xs mt-0.5 ${task.supplemental ? 'text-gray-400' : 'text-gray-500'}`}>
                    {skillCounts[task.id] ? `${skillCounts[task.id]}/` : ''}
                    {skillCount} {skillCount === 1 ? 'skill' : 'skills'}
                    {task.supplemental ? ' · supplement — not an official exam task' : ''}
                    {completedAt ? ` · ${formatSkillCompletedAt(completedAt)}` : ''}
                  </p>
                </div>
              </div>
              <ArrowRight className={`w-5 h-5 shrink-0 text-gray-300 group-hover:${colors.text} group-hover:translate-x-1 transition-all`} />
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-10 pt-8 border-t border-gray-200">
        {domain.id > 1 ? (
          <Link
            href={`/learn/${domain.id - 1}`}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Domain {domain.id - 1}
          </Link>
        ) : (
          <div />
        )}
        {domain.id < 5 ? (
          <Link
            href={`/learn/${domain.id + 1}`}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Domain {domain.id + 1}
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
      <StampToast message={toast} />
    </div>
  );
}
