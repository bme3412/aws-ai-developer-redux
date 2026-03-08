import { CheckCircle, AlertTriangle } from 'lucide-react';

interface KeyTakeawaysProps {
  takeaways: string[];
  commonMistakes: string[];
}

export default function KeyTakeaways({ takeaways, commonMistakes }: KeyTakeawaysProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Key Takeaways */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Key Takeaways
        </h3>
        <ul className="space-y-2">
          {takeaways.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-500 mt-1">✓</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Common Mistakes */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Common Mistakes
        </h3>
        <ul className="space-y-2">
          {commonMistakes.map((mistake, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-red-500 mt-1">✗</span>
              <span>{mistake}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
