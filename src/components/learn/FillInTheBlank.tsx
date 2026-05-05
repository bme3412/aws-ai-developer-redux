'use client';

import React, { useState } from 'react';

interface FillInTheBlankProps {
  textBefore: string;
  answer: string;
  textAfter: string;
}

export default function FillInTheBlank({ textBefore, answer, textAfter }: FillInTheBlankProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="my-6 rounded-lg border border-emerald-200 bg-emerald-50/50 p-5 not-prose">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-emerald-600 text-xs font-bold">_</span>
        </div>
        <p className="text-gray-800 text-sm leading-relaxed flex-1">
          {textBefore}{' '}
          {revealed ? (
            <span className="font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              {answer}
            </span>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="inline-flex items-center px-3 py-0.5 bg-emerald-200/60 border border-emerald-300 rounded text-emerald-700 text-sm font-medium hover:bg-emerald-200 transition-colors cursor-pointer"
            >
              tap to reveal
            </button>
          )}
          {textAfter ? ` ${textAfter}` : ''}
        </p>
      </div>
    </div>
  );
}
