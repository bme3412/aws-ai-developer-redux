import { MarkdownText } from '@/lib/markdown';

interface KeyTakeawaysProps {
  takeaways: string[];
  commonMistakes: string[];
}

export default function KeyTakeaways({ takeaways, commonMistakes }: KeyTakeawaysProps) {
  return (
    <div className="space-y-6">
      {/* Key Takeaways */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Key Takeaways
        </h3>
        <ul className="space-y-2">
          {takeaways.map((point, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-700">
              <span className="text-gray-400 font-mono text-sm mt-0.5">{i + 1}.</span>
              <MarkdownText>{point}</MarkdownText>
            </li>
          ))}
        </ul>
      </div>

      {/* Common Mistakes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Common Mistakes
        </h3>
        <ul className="space-y-2">
          {commonMistakes.map((mistake, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-700">
              <span className="text-gray-400 mt-1.5">—</span>
              <MarkdownText>{mistake}</MarkdownText>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
