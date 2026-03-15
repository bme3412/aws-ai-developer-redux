import { ExamStrategy as ExamStrategyType } from '@/types/article';
import { MarkdownText } from '@/lib/markdown';

interface ExamStrategyProps {
  strategy: ExamStrategyType;
}

export default function ExamStrategy({ strategy }: ExamStrategyProps) {
  return (
    <div className="border-l-2 border-gray-200 pl-4 py-2">
      <div className="font-medium text-gray-900 mb-1">
        &ldquo;{strategy.questionPattern}&rdquo;
      </div>
      <p className="text-gray-600 text-sm leading-relaxed mb-2">
        <MarkdownText>{strategy.approach}</MarkdownText>
      </p>
      {strategy.keywords.length > 0 && (
        <div className="text-xs text-gray-400">
          Keywords: {strategy.keywords.join(' · ')}
        </div>
      )}
    </div>
  );
}
