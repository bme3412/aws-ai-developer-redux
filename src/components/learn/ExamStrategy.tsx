import { Target, Tag } from 'lucide-react';
import { ExamStrategy as ExamStrategyType } from '@/types/article';

interface ExamStrategyProps {
  strategy: ExamStrategyType;
}

export default function ExamStrategy({ strategy }: ExamStrategyProps) {
  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-start gap-3">
        <Target className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="font-semibold text-purple-900">
            When you see: &quot;{strategy.questionPattern}&quot;
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {strategy.approach}
          </p>
          {strategy.keywords.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <Tag className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-600 font-medium">Watch for:</span>
              {strategy.keywords.map((keyword, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-medium"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
