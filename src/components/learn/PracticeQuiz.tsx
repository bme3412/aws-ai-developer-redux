'use client';

import { useMemo, useState } from 'react';
import { CheckCircle, RotateCcw, XCircle } from 'lucide-react';
import { MarkdownText } from '@/lib/markdown';
import type { PracticeItem } from '@/lib/active-learning-parsers';

export default function PracticeQuiz({ items }: { items: PracticeItem[] }) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [version, setVersion] = useState(0);

  const answered = Object.keys(selected).length;
  const correct = useMemo(
    () => items.filter((item, i) => selected[i] === item.correctLabel).length,
    [items, selected]
  );
  const done = answered === items.length && items.length > 0;

  const handleSelect = (index: number, label: string) => {
    setSelected((prev) => {
      if (prev[index]) return prev;
      return { ...prev, [index]: label };
    });
  };

  const handleReset = () => {
    setSelected({});
    setVersion((v) => v + 1);
  };

  return (
    <div key={version} className="not-prose my-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-600 m-0">
          Pick an answer on each question. You will see whether you were right, and why, right away.
        </p>
        <p className="text-sm font-medium text-gray-800 m-0 shrink-0 tabular-nums">
          {done ? (
            <span className={correct === items.length ? 'text-green-700' : 'text-gray-800'}>
              {correct}/{items.length} correct
            </span>
          ) : (
            <span>
              {answered}/{items.length} answered
              {answered > 0 ? ` · ${correct} correct` : ''}
            </span>
          )}
        </p>
      </div>

      {items.map((item, index) => (
        <PracticeQuestionCard
          key={`${version}-${index}`}
          index={index}
          total={items.length}
          item={item}
          chosen={selected[index] ?? null}
          onSelect={handleSelect}
        />
      ))}

      {done ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4">
          <p className="text-sm text-gray-700 m-0">
            {correct === items.length
              ? 'All correct. Walk the same stems again if you want the distinctions to stick.'
              : `${correct} of ${items.length} correct. Reset and retry the ones you missed.`}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PracticeQuestionCard({
  index,
  total,
  item,
  chosen,
  onSelect,
}: {
  index: number;
  total: number;
  item: PracticeItem;
  chosen: string | null;
  onSelect: (index: number, label: string) => void;
}) {
  const locked = chosen !== null;
  const isCorrect = chosen === item.correctLabel;

  return (
    <article className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Question {index + 1} of {total}
        </span>
        {locked ? (
          isCorrect ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
              <CheckCircle className="w-3.5 h-3.5" />
              Correct
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
              <XCircle className="w-3.5 h-3.5" />
              Incorrect
            </span>
          )
        ) : null}
      </div>

      <div className="px-4 py-4">
        <p className="text-[15px] sm:text-base text-gray-900 font-medium leading-relaxed m-0">
          <MarkdownText>{item.question}</MarkdownText>
        </p>
      </div>

      <div className="px-4 pb-4 space-y-2">
        {item.options.map((opt) => {
          const isChosen = chosen === opt.label;
          const isAnswer = opt.label === item.correctLabel;
          let optionClasses = 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/60 cursor-pointer';

          if (locked) {
            if (isAnswer) {
              optionClasses = 'border-green-500 bg-green-50 cursor-default';
            } else if (isChosen) {
              optionClasses = 'border-red-400 bg-red-50 cursor-default';
            } else {
              optionClasses = 'border-gray-200 bg-gray-50 opacity-60 cursor-default';
            }
          } else if (isChosen) {
            optionClasses = 'border-blue-500 bg-blue-50';
          }

          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onSelect(index, opt.label)}
              disabled={locked}
              className={`w-full flex items-start gap-3 p-3 border rounded-lg text-left transition-colors ${optionClasses}`}
            >
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full border text-xs font-semibold shrink-0 mt-0.5 ${
                  locked && isAnswer
                    ? 'border-green-600 bg-green-600 text-white'
                    : locked && isChosen
                      ? 'border-red-500 bg-red-500 text-white'
                      : 'border-gray-300 text-gray-600'
                }`}
              >
                {opt.label}
              </span>
              <span className="text-sm text-gray-800 leading-relaxed flex-1 pt-0.5">
                <MarkdownText>{opt.text}</MarkdownText>
              </span>
              {locked && isAnswer ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-1" /> : null}
              {locked && isChosen && !isAnswer ? <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-1" /> : null}
            </button>
          );
        })}
      </div>

      {locked && item.feedback ? (
        <div className={`px-4 py-3 border-t ${isCorrect ? 'bg-green-50/70 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
          <p className="text-sm text-gray-800 leading-relaxed m-0">
            <span className="font-semibold text-gray-900">Why. </span>
            <MarkdownText>{item.feedback}</MarkdownText>
          </p>
        </div>
      ) : null}
    </article>
  );
}
