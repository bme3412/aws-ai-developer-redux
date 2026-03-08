'use client';

import { SkillExplanation } from '@/types/article';
import { MarkdownParagraph } from '@/lib/markdown';

interface SkillCardProps {
  skill: SkillExplanation;
  skillDescription: string;
}

export default function SkillCard({ skill, skillDescription }: SkillCardProps) {
  return (
    <div className="mb-6 pb-6 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start gap-3 mb-3">
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono rounded flex-shrink-0">
          {skill.skillId}
        </span>
        <p className="text-gray-800 font-medium">{skillDescription}</p>
      </div>

      <MarkdownParagraph className="text-gray-700 leading-relaxed mb-4">
        {skill.explanation}
      </MarkdownParagraph>

      {skill.awsServices.length > 0 && (
        <div className="space-y-3">
          {skill.awsServices.map((service, i) => (
            <div key={i} className="pl-4 border-l-2 border-indigo-300">
              <p className="text-gray-700">
                <strong className="text-indigo-900">{service.serviceName}</strong>
                {' — '}
                {service.whenToUse}
              </p>
              {service.examKeywords.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Exam keywords:</span>{' '}
                  {service.examKeywords.map((kw, j) => (
                    <span key={j}>
                      <em>{kw}</em>
                      {j < service.examKeywords.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {skill.codeExample && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">
            {skill.codeExample.title}
          </h4>
          <pre className="p-3 bg-gray-900 text-gray-100 text-xs rounded-lg overflow-x-auto">
            <code>{skill.codeExample.code}</code>
          </pre>
          <p className="text-xs text-gray-500 mt-1">{skill.codeExample.explanation}</p>
        </div>
      )}
    </div>
  );
}
