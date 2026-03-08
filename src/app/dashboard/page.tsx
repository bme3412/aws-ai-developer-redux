'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDomains, calculateDomainProgress } from '@/lib/domains';
import { getProgress, getOverallProgress } from '@/lib/progress';
import { DomainBadge } from '@/components/layout/DomainBadge';
import { BookOpen, FlaskConical, ClipboardCheck, TrendingUp, Target, Clock } from 'lucide-react';
import { Progress } from '@/types/domain';

export default function DashboardPage() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const domains = getDomains();

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const overall = progress ? getOverallProgress() : {
    totalArticles: 18,
    readArticles: 0,
    totalLabs: 5,
    completedLabs: 0,
    averageScore: 0,
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Study Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your progress toward the 750 passing score</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Articles</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {overall.readArticles}/{overall.totalArticles}
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(overall.readArticles / overall.totalArticles) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-600">Labs</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {overall.completedLabs}/{overall.totalLabs}
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${(overall.completedLabs / overall.totalLabs) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Avg Score</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {overall.averageScore}%
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${overall.averageScore}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-600">Gap to Pass</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            35 pts
          </div>
          <div className="text-xs text-gray-500 mt-2">
            ~3-5 more correct answers needed
          </div>
        </div>
      </div>

      {/* Domain Progress */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Domain Progress</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map(domain => {
            const domainProgress = progress
              ? calculateDomainProgress(domain.id, progress)
              : { articlesCompleted: 0, articlesTotal: domain.tasks.length, averageReviewScore: 0 };

            const progressPercent = (domainProgress.articlesCompleted / domainProgress.articlesTotal) * 100;

            return (
              <Link key={domain.id} href={`/learn/${domain.id}`}>
                <DomainBadge
                  domainId={domain.id}
                  name={domain.name}
                  weight={domain.weight}
                  priority={domain.priority}
                  progress={progressPercent}
                />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Recommended Next Steps
          </h3>
          <ul className="space-y-3">
            <li>
              <Link
                href="/learn/1/vector-stores"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xs font-medium text-red-500">
                  D1
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-800">Vector Store Solutions</div>
                  <div className="text-xs text-gray-500">High exam weight • ~25 min</div>
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/learn/1/retrieval-mechanisms"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xs font-medium text-red-500">
                  D1
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-800">Retrieval Mechanisms</div>
                  <div className="text-xs text-gray-500">RAG patterns • ~30 min</div>
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/learn/2/agentic-ai"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xs font-medium text-red-500">
                  D2
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-800">Agentic AI Solutions</div>
                  <div className="text-xs text-gray-500">Bedrock Agents, MCP • ~35 min</div>
                </div>
              </Link>
            </li>
          </ul>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Study Sessions
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-800">Quick Review</div>
                <div className="text-xs text-gray-500">10 questions • 15 min</div>
              </div>
              <Link
                href="/review?mode=quick"
                className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium rounded hover:bg-blue-500/20 transition-colors"
              >
                Start
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-800">Domain Focus: D1</div>
                <div className="text-xs text-gray-500">20 questions • 30 min</div>
              </div>
              <Link
                href="/review?domain=1"
                className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded hover:bg-red-500/20 transition-colors"
              >
                Start
              </Link>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-800">Full Practice Exam</div>
                <div className="text-xs text-gray-500">65 questions • 170 min</div>
              </div>
              <Link
                href="/review?mode=full"
                className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium rounded hover:bg-amber-500/20 transition-colors"
              >
                Start
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
