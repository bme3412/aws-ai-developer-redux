'use client';

import Link from 'next/link';
import { Target, AlertTriangle, Zap, BookOpen } from 'lucide-react';
import { Recommendation } from '@/lib/analytics';

const typeIcons: Record<Recommendation['type'], typeof Target> = {
  'weak-domain': Target,
  'weak-task': AlertTriangle,
  uncovered: BookOpen,
  'difficulty-gap': Zap,
};

const priorityStyles: Record<Recommendation['priority'], string> = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-amber-200 bg-amber-50',
  low: 'border-gray-200 bg-gray-50',
};

export default function Recommendations({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Recommended Next Steps</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations.map((rec, i) => {
          const Icon = typeIcons[rec.type];
          return (
            <div key={i} className={`border rounded-lg p-4 ${priorityStyles[rec.priority]}`}>
              <div className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{rec.title}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{rec.description}</div>
                  <Link
                    href={rec.action.href}
                    className="inline-block text-xs font-medium text-blue-600 hover:text-blue-500 mt-2"
                  >
                    {rec.action.label} &rarr;
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
