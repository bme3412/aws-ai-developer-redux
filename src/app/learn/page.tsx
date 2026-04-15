'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDomains } from '@/lib/domains';
import { isArticleRead, markArticleRead, unmarkArticleRead } from '@/lib/progress';
import { DomainBadge } from '@/components/layout/DomainBadge';
import { BookOpen, ArrowRight, CheckCircle, Circle } from 'lucide-react';

export default function LearnPage() {
  const domains = getDomains();
  const [completedArticles, setCompletedArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load completed articles from localStorage
    const completed = new Set<string>();
    domains.forEach(domain => {
      domain.tasks.forEach(task => {
        const articleKey = `${domain.id}-${task.articleSlug}`;
        if (isArticleRead(articleKey)) {
          completed.add(articleKey);
        }
      });
    });
    setCompletedArticles(completed);
  }, [domains]);

  const toggleComplete = (e: React.MouseEvent, domainId: number, articleSlug: string) => {
    e.preventDefault();
    e.stopPropagation();

    const articleKey = `${domainId}-${articleSlug}`;
    const newCompleted = new Set(completedArticles);

    if (completedArticles.has(articleKey)) {
      // Remove from completed
      unmarkArticleRead(articleKey);
      newCompleted.delete(articleKey);
    } else {
      // Mark as completed
      markArticleRead(articleKey, 1);
      newCompleted.add(articleKey);
    }

    setCompletedArticles(newCompleted);
  };

  const getDomainProgress = (domainId: number) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return { completed: 0, total: 0, percent: 0 };

    const total = domain.tasks.length;
    const completed = domain.tasks.filter(task =>
      completedArticles.has(`${domainId}-${task.articleSlug}`)
    ).length;

    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  const totalProgress = {
    completed: completedArticles.size,
    total: domains.reduce((sum, d) => sum + d.tasks.length, 0),
  };
  const overallPercent = totalProgress.total > 0
    ? Math.round((totalProgress.completed / totalProgress.total) * 100)
    : 0;

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Learn</h1>
          <p className="text-gray-600 mt-1">
            Concept articles organized by exam domain. Focus on D1 and D2 for maximum impact.
          </p>

          {/* Overall Progress */}
          <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-semibold text-gray-900">
                {totalProgress.completed}/{totalProgress.total} topics ({overallPercent}%)
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

        {/* Domain Cards */}
        <div className="space-y-8">
          {domains.map(domain => {
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
                {/* Domain Header */}
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

                  {/* Domain Progress Bar */}
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

                {/* Task List */}
                <div className="divide-y divide-gray-200 bg-white">
                  {domain.tasks.map(task => {
                    const articleKey = `${domain.id}-${task.articleSlug}`;
                    const isCompleted = completedArticles.has(articleKey);

                    return (
                      <Link
                        key={task.id}
                        href={`/learn/${domain.id}/${task.articleSlug}`}
                        className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group ${
                          isCompleted ? 'bg-green-50/40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={(e) => toggleComplete(e, domain.id, task.articleSlug)}
                          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-green-500 hover:text-green-600 transition-colors" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-300 hover:text-gray-400 transition-colors" />
                          )}
                        </button>

                        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                          <BookOpen className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">Task {task.id}</span>
                          </div>
                          <h3 className={`text-sm font-medium truncate ${
                            isCompleted ? 'text-gray-500' : 'text-gray-800'
                          }`}>
                            {task.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {task.skills.length} skills
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
    </div>
  );
}
