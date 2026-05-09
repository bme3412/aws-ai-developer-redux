'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, Loader2 } from 'lucide-react';
import { getProgress } from '@/lib/progress';
import { getAllQuestions } from '@/lib/content';
import {
  getOverallStats,
  getDomainStats,
  getTaskStats,
  getDifficultyStats,
  getAccuracyTrend,
  getRecommendations,
  OverallStats,
  DomainStat,
  TaskStat,
  DifficultyBreakdown as DifficultyBreakdownType,
  AccuracyDataPoint,
  Recommendation,
} from '@/lib/analytics';
import { Question } from '@/types/review';
import SummaryCards from '@/components/analytics/SummaryCards';
import DomainPerformance from '@/components/analytics/DomainPerformance';
import DifficultyBreakdown from '@/components/analytics/DifficultyBreakdown';
import Recommendations from '@/components/analytics/Recommendations';

const AccuracyTrendChart = dynamic(
  () => import('@/components/analytics/AccuracyTrendChart'),
  { ssr: false }
);

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [overall, setOverall] = useState<OverallStats | null>(null);
  const [domainStatsData, setDomainStatsData] = useState<DomainStat[]>([]);
  const [taskStatsMap, setTaskStatsMap] = useState<Record<number, TaskStat[]>>({});
  const [diffStats, setDiffStats] = useState<DifficultyBreakdownType | null>(null);
  const [trendData, setTrendData] = useState<AccuracyDataPoint[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);

  useEffect(() => {
    async function load() {
      const progress = getProgress();
      const allQuestions: Question[] = await getAllQuestions();

      const overallStats = getOverallStats(progress, allQuestions);
      const domainStats = getDomainStats(progress, allQuestions);
      const difficulty = getDifficultyStats(progress, allQuestions);
      const trend = getAccuracyTrend(progress);
      const recommendations = getRecommendations(domainStats, difficulty, overallStats);

      const taskMap: Record<number, TaskStat[]> = {};
      for (const ds of domainStats) {
        taskMap[ds.domainId] = getTaskStats(progress, allQuestions, ds.domainId);
      }

      setOverall(overallStats);
      setDomainStatsData(domainStats);
      setTaskStatsMap(taskMap);
      setDiffStats(difficulty);
      setTrendData(trend);
      setRecs(recommendations);
      setIsLoading(false);
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-500" />
          Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          Track your practice performance and identify areas to improve.
        </p>
      </div>

      <div className="space-y-6">
        {overall && <SummaryCards stats={overall} />}
        <AccuracyTrendChart data={trendData} />
        <DomainPerformance domainStats={domainStatsData} taskStatsByDomain={taskStatsMap} />
        {diffStats && <DifficultyBreakdown stats={diffStats} />}
        <Recommendations recommendations={recs} />
      </div>
    </div>
  );
}
