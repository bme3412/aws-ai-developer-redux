'use client';

import { Lightbulb } from 'lucide-react';
import { ConceptSection as ConceptSectionType } from '@/types/article';
import { MarkdownParagraph, MarkdownText } from '@/lib/markdown';

interface ConceptSectionProps {
  concept: ConceptSectionType;
}

export default function ConceptSection({ concept }: ConceptSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3">{concept.title}</h3>

      <MarkdownParagraph className="text-gray-700 leading-relaxed mb-4">
        {concept.content}
      </MarkdownParagraph>

      {concept.keyPoints.length > 0 && (
        <ul className="space-y-2 mb-4">
          {concept.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-700">
              <span className="text-blue-500 font-bold">•</span>
              <MarkdownText>{point}</MarkdownText>
            </li>
          ))}
        </ul>
      )}

      {concept.examTip && (
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-700">Exam Tip: </span>
            <MarkdownText className="text-gray-700">{concept.examTip}</MarkdownText>
          </div>
        </div>
      )}
    </div>
  );
}
