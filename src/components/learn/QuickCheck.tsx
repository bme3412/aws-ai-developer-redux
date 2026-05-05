'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuickCheckProps {
  question: string;
  options: { label: string; text: string }[];
  correctLabel: string;
  feedback?: string;
}

export default function QuickCheck({ question, options, correctLabel, feedback }: QuickCheckProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (label: string) => {
    if (selected) return;
    setSelected(label);
  };

  return (
    <div className="my-6 rounded-lg border border-amber-200 bg-amber-50/50 p-5 not-prose">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-amber-700 text-xs font-bold">&#10003;</span>
        </div>
        <div className="flex-1">
          <p className="text-gray-800 font-medium text-sm leading-relaxed mb-3">{question}</p>
          <div className="space-y-2">
            {options.map((opt) => {
              const isCorrect = opt.label === correctLabel;
              const isSelected = opt.label === selected;
              let optionClasses = 'border border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50 cursor-pointer';

              if (selected) {
                if (isCorrect) {
                  optionClasses = 'border-green-300 bg-green-50';
                } else if (isSelected && !isCorrect) {
                  optionClasses = 'border-red-300 bg-red-50';
                } else {
                  optionClasses = 'border-gray-200 bg-gray-50 opacity-60';
                }
              }

              return (
                <button
                  key={opt.label}
                  onClick={() => handleSelect(opt.label)}
                  disabled={!!selected}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${optionClasses}`}
                >
                  <span className="font-mono text-xs font-bold text-gray-400 w-5">{opt.label})</span>
                  <span className="text-gray-700 flex-1">{opt.text}</span>
                  {selected && isCorrect && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                  {selected && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
          {selected && feedback && (
            <p className="mt-3 text-sm text-gray-600 italic">{feedback}</p>
          )}
        </div>
      </div>
    </div>
  );
}
