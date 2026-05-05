'use client';

import React, { useState } from 'react';
import { Eye } from 'lucide-react';

interface RecallCardProps {
  question: string;
  answer: string;
}

export default function RecallCard({ question, answer }: RecallCardProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="my-6 rounded-lg border border-indigo-200 bg-indigo-50/50 p-5 not-prose">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-indigo-600 text-xs font-bold">?</span>
        </div>
        <div className="flex-1">
          <p className="text-gray-800 font-medium text-sm leading-relaxed">{question}</p>
          {revealed ? (
            <div className="mt-3 pt-3 border-t border-indigo-200">
              <p className="text-indigo-900 text-sm font-medium leading-relaxed">{answer}</p>
            </div>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <Eye className="w-4 h-4" />
              Reveal answer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
