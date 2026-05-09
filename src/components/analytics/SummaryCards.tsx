'use client';

import { Target, CheckCircle, Layers, TrendingUp } from 'lucide-react';
import { OverallStats } from '@/lib/analytics';

const cards = [
  { key: 'attempted', label: 'Questions Attempted', icon: Target, color: 'text-blue-600 bg-blue-50', getValue: (s: OverallStats) => `${s.uniqueQuestionsAttempted}`, getSub: (s: OverallStats) => `of ${s.totalQuestions} total` },
  { key: 'accuracy', label: 'Accuracy', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50', getValue: (s: OverallStats) => `${s.accuracyRate}%`, getSub: (s: OverallStats) => `${s.totalCorrect} correct` },
  { key: 'coverage', label: 'Coverage', icon: Layers, color: 'text-amber-600 bg-amber-50', getValue: (s: OverallStats) => `${s.coveragePercent}%`, getSub: (s: OverallStats) => `${s.sessionsCompleted} sessions` },
  { key: 'readiness', label: 'Est. Readiness', icon: TrendingUp, color: 'text-violet-600 bg-violet-50', getValue: (s: OverallStats) => `${s.estimatedReadiness}%`, getSub: () => 'composite score' },
] as const;

export default function SummaryCards({ stats }: { stats: OverallStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, color, getValue, getSub }) => (
        <div key={key} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-medium text-gray-600">{label}</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{getValue(stats)}</div>
          <div className="text-xs text-gray-500 mt-1">{getSub(stats)}</div>
        </div>
      ))}
    </div>
  );
}
