'use client';

import { DifficultyBreakdown as DifficultyBreakdownType } from '@/lib/analytics';

const levels = [
  { key: 'easy' as const, label: 'Easy', color: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-500', border: 'border-green-200' },
  { key: 'medium' as const, label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500', border: 'border-amber-200' },
  { key: 'hard' as const, label: 'Hard', color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500', border: 'border-red-200' },
];

export default function DifficultyBreakdown({ stats }: { stats: DifficultyBreakdownType }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Accuracy by Difficulty</h3>
      <div className="grid grid-cols-3 gap-4">
        {levels.map(({ key, label, color, bg, bar, border }) => {
          const s = stats[key];
          return (
            <div key={key} className={`${bg} border ${border} rounded-lg p-4 text-center`}>
              <div className={`text-xs font-medium ${color} mb-1`}>{label}</div>
              <div className={`text-2xl font-bold ${color}`}>
                {s.attempted > 0 ? `${s.accuracy}%` : '--'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {s.attempted > 0 ? `${s.correct}/${s.attempted}` : 'No data'}
              </div>
              {s.attempted > 0 && (
                <div className="h-1.5 bg-white/60 rounded-full overflow-hidden mt-2">
                  <div className={`h-full ${bar} rounded-full`} style={{ width: `${s.accuracy}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
