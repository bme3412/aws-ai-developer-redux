'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getDomains } from '@/lib/domains';
import { countCompletedSkills, formatSkillCompletedAt } from '@/lib/progress';
import { useTaskStamps } from '@/hooks/useTaskStamps';
import StampCheckbox, { StampToast } from '@/components/learn/StampCheckbox';
import { DomainBadge } from '@/components/layout/DomainBadge';
import { BookOpen, ArrowRight } from 'lucide-react';

export default function LearnPage() {
  const domains = getDomains();
  const { completed, burstId, toast, toggleTask } = useTaskStamps();
  const [skillCounts, setSkillCounts] = useState<Record<string, number>>({});

  const domainTaskKeys = useMemo(() => {
    const map: Record<number, string[]> = {};
    domains.forEach((domain) => {
      map[domain.id] = domain.tasks.map((task) => `${domain.id}-${task.articleSlug}`);
    });
    return map;
  }, [domains]);

  useEffect(() => {
    const counts: Record<string, number> = {};
    domains.forEach((domain) => {
      domain.tasks.forEach((task) => {
        counts[task.id] = countCompletedSkills(task.skills.map((s) => s.id));
      });
    });
    setSkillCounts(counts);
  }, [domains]);

  const getDomainProgress = (domainId: number) => {
    const domain = domains.find((d) => d.id === domainId);
    if (!domain) return { completed: 0, total: 0, percent: 0 };

    const keys = domainTaskKeys[domainId] ?? [];
    const done = keys.filter((key) => completed[key]).length;
    const total = domain.tasks.length;

    return {
      completed: done,
      total,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  };

  const totalTasks = domains.reduce((sum, d) => sum + d.tasks.length, 0);
  const totalCompleted = Object.keys(completed).length;
  const overallPercent = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <div className="flex">
      <div className="flex-1 max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Learn</h1>
          <p className="text-gray-600 mt-1">
            Concept articles organized by exam domain. Focus on D1 and D2 for maximum impact.
          </p>

          <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-semibold text-gray-900">
                {totalCompleted}/{totalTasks} topics ({overallPercent}%)
              </span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {domains.map((domain) => {
            const progress = getDomainProgress(domain.id);
            const domainColorClasses: Record<number, { progress: string; bg: string }> = {
              1: { progress: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50' },
              2: { progress: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
              3: { progress: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
              4: { progress: 'from-rose-500 to-pink-500', bg: 'bg-rose-50' },
              5: { progress: 'from-violet-500 to-purple-500', bg: 'bg-violet-50' },
            };
            const colors = domainColorClasses[domain.id] || domainColorClasses[1];

            return (
              <div key={domain.id} className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <DomainBadge
                      domainId={domain.id}
                      name={domain.name}
                      weight={domain.weight}
                      priority={domain.priority}
                      compact
                    />
                    <span className="text-sm text-gray-500">
                      {domain.tasks.length} topics
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mt-3">{domain.name}</h2>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-700">
                        {progress.completed}/{progress.total} ({progress.percent}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors.progress} transition-all duration-500 ease-out rounded-full`}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200 bg-white">
                  {domain.tasks.map((task) => {
                    const articleKey = `${domain.id}-${task.articleSlug}`;
                    const completedAt = completed[articleKey];

                    return (
                      <Link
                        key={task.id}
                        href={`/learn/${domain.id}/${task.articleSlug}`}
                        className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group ${
                          completedAt ? 'bg-green-50/40' : ''
                        }`}
                      >
                        <StampCheckbox
                          completedAt={completedAt}
                          bursting={burstId === articleKey}
                          onToggle={() =>
                            toggleTask(articleKey, {
                              taskId: task.id,
                              domainTaskKeys: domainTaskKeys[domain.id] ?? [],
                              domainId: domain.id,
                            })
                          }
                          ariaLabel={completedAt ? `Mark Task ${task.id} incomplete` : `Mark Task ${task.id} complete`}
                        />

                        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                          <BookOpen className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">Task {task.id}</span>
                            {task.supplemental && (
                              <span className="text-[10px] uppercase tracking-wide text-gray-400">Supplement</span>
                            )}
                          </div>
                          <h3 className={`text-sm font-medium truncate ${
                            completedAt ? 'text-gray-500' : 'text-gray-800'
                          }`}>
                            {task.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {skillCounts[task.id] ? `${skillCounts[task.id]}/` : ''}
                            {task.skills.length} skills
                            {completedAt ? ` · ${formatSkillCompletedAt(completedAt)}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <StampToast message={toast} />
    </div>
  );
}
