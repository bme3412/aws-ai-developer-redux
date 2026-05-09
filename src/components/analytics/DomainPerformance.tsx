'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DomainStat, TaskStat } from '@/lib/analytics';

const domainColors: Record<number, string> = {
  1: 'bg-blue-500',
  2: 'bg-emerald-500',
  3: 'bg-amber-500',
  4: 'bg-rose-500',
  5: 'bg-violet-500',
};

const trendLabels: Record<string, { text: string; color: string }> = {
  improving: { text: 'Improving', color: 'text-green-600' },
  declining: { text: 'Declining', color: 'text-red-500' },
  stable: { text: 'Stable', color: 'text-gray-500' },
  'insufficient-data': { text: '', color: '' },
};

export default function DomainPerformance({
  domainStats,
  taskStatsByDomain,
}: {
  domainStats: DomainStat[];
  taskStatsByDomain: Record<number, TaskStat[]>;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Performance by Domain</h3>
      <div className="space-y-3">
        {domainStats.map(ds => {
          const isOpen = expanded === ds.domainId;
          const trend = trendLabels[ds.trend];
          const barColor = domainColors[ds.domainId] || 'bg-gray-400';

          return (
            <div key={ds.domainId}>
              <button
                onClick={() => setExpanded(isOpen ? null : ds.domainId)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-sm">
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                    <span className="font-medium text-gray-800">Domain {ds.domainId}</span>
                    <span className="text-gray-400">({ds.weight}%)</span>
                    {trend.text && (
                      <span className={`text-xs ${trend.color}`}>{trend.text}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {ds.attempted > 0 ? (
                      <>
                        <span className="font-semibold">{ds.accuracy}%</span>
                        <span className="text-gray-400 ml-1">({ds.correct}/{ds.attempted})</span>
                      </>
                    ) : (
                      <span className="text-gray-400">No data</span>
                    )}
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden ml-5">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${ds.accuracy}%` }}
                  />
                </div>
              </button>

              {isOpen && taskStatsByDomain[ds.domainId] && (
                <div className="ml-8 mt-2 space-y-2 pb-2">
                  {taskStatsByDomain[ds.domainId].map(ts => (
                    <div key={ts.taskId} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 truncate mr-4">
                        {ts.taskId}: {ts.taskName}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-full`}
                            style={{ width: `${ts.accuracy}%` }}
                          />
                        </div>
                        <span className="text-gray-500 w-16 text-right">
                          {ts.attempted > 0 ? `${ts.accuracy}% (${ts.correct}/${ts.attempted})` : '--'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
