'use client';

import { getPriorityBgColor, getPriorityColor } from '@/lib/domains';

interface DomainBadgeProps {
  domainId: number;
  name: string;
  weight: number;
  priority: 'critical' | 'high' | 'medium';
  progress?: number;
  compact?: boolean;
}

export function DomainBadge({
  domainId,
  name,
  weight,
  priority,
  progress = 0,
  compact = false,
}: DomainBadgeProps) {
  const priorityColor = getPriorityColor(priority);
  const bgColor = getPriorityBgColor(priority);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${bgColor}`}>
        <span className="text-xs font-medium text-gray-700">D{domainId}</span>
        <span className={`text-xs font-bold ${priorityColor}`}>{weight}%</span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${bgColor} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-800">Domain {domainId}</span>
        <span className={`text-sm font-bold ${priorityColor}`}>{weight}%</span>
      </div>
      <h3 className="text-sm text-gray-700 mb-3 line-clamp-2">{name}</h3>

      {/* Progress Ring */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={`${progress * 1.005} 100.5`}
              className={priorityColor}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="text-xs text-gray-500">
          <div>Progress</div>
          <div className="font-medium text-gray-700">
            {priority === 'critical' ? '🔴 Critical' : priority === 'high' ? '🟡 High' : '🟢 Medium'}
          </div>
        </div>
      </div>
    </div>
  );
}
