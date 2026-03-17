'use client';

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Lightbulb,
} from 'lucide-react';
import { Question } from '@/types/review';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (selectedIds: string[]) => void;
  showResult?: boolean;
  selectedAnswers?: string[];
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showResult = false,
  selectedAnswers = [],
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string[]>(selectedAnswers);
  const [showStrategy, setShowStrategy] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);

  const isMultiple = question.type === 'multiple-response';
  const isCorrect = showResult &&
    selected.length === question.correctAnswers.length &&
    selected.every(s => question.correctAnswers.includes(s));

  const handleOptionClick = (optionId: string) => {
    if (showResult) return;

    if (isMultiple) {
      setSelected(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelected([optionId]);
    }
  };

  const handleSubmit = () => {
    if (selected.length > 0) {
      onAnswer(selected);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded ${
            question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
            question.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {question.difficulty}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          Domain {question.domain} • Task {question.task}
        </span>
      </div>

      {/* Scenario (if present) */}
      {question.scenario && (
        <div className="px-4 py-4 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-gray-700 leading-relaxed">
            {question.scenario}
          </p>
        </div>
      )}

      {/* Question */}
      <div className="p-4">
        <p className="text-gray-900 font-medium mb-1">
          {question.question}
        </p>
        {isMultiple && (
          <p className="text-sm text-gray-500 mb-4">
            Select {question.correctAnswers.length} answers.
          </p>
        )}
      </div>

      {/* Options */}
      <div className="px-4 pb-4 space-y-2">
        {question.options.map(option => {
          const isSelected = selected.includes(option.id);
          const isCorrectOption = question.correctAnswers.includes(option.id);

          let optionStyle = 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';

          if (showResult) {
            if (isCorrectOption) {
              optionStyle = 'border-green-500 bg-green-50';
            } else if (isSelected && !isCorrectOption) {
              optionStyle = 'border-red-500 bg-red-50';
            }
          } else if (isSelected) {
            optionStyle = 'border-blue-500 bg-blue-50';
          }

          return (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              disabled={showResult}
              className={`w-full flex items-start gap-3 p-3 border rounded-lg text-left transition-colors ${optionStyle}`}
            >
              <span className={`w-6 h-6 flex items-center justify-center rounded-full border text-sm font-medium flex-shrink-0 ${
                isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-500'
              }`}>
                {option.id.toUpperCase()}
              </span>
              <span className="text-sm text-gray-700 flex-1">{option.text}</span>
              {showResult && isCorrectOption && (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
              {showResult && isSelected && !isCorrectOption && (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Submit Button */}
      {!showResult && (
        <div className="px-4 pb-4">
          <button
            onClick={handleSubmit}
            disabled={selected.length === 0}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Result Section */}
      {showResult && (
        <div className="border-t border-gray-200">
          {/* Result Banner */}
          <div className={`px-4 py-3 flex items-center gap-3 ${
            isCorrect ? 'bg-green-50' : 'bg-red-50'
          }`}>
            {isCorrect ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium text-green-700">Correct!</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-700">Incorrect</span>
              </>
            )}
          </div>

          {/* Explanation */}
          <div className="p-4 space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Explanation</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {question.explanation}
              </p>
            </div>

            {/* Incorrect Explanations Toggle */}
            {question.incorrectExplanations && Object.keys(question.incorrectExplanations).length > 0 && (
              <div>
                <button
                  onClick={() => setShowExplanations(!showExplanations)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {showExplanations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Why are the other options wrong?
                </button>
                {showExplanations && (
                  <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
                    {Object.entries(question.incorrectExplanations).map(([optionId, explanation]) => (
                      <div key={optionId} className="text-sm">
                        <span className="font-medium text-gray-600">{optionId.toUpperCase()}:</span>{' '}
                        <span className="text-gray-600">{explanation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Parse Strategy */}
            {question.parseStrategy && (
              <div>
                <button
                  onClick={() => setShowStrategy(!showStrategy)}
                  className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800"
                >
                  <Target className="w-4 h-4" />
                  {showStrategy ? 'Hide' : 'Show'} Question Strategy
                </button>
                {showStrategy && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                    <div>
                      <span className="text-sm font-semibold text-purple-800">Key phrase: </span>
                      <span className="text-sm text-purple-700">&quot;{question.parseStrategy.keyPhrase}&quot;</span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-purple-800">Decision framework: </span>
                      <span className="text-sm text-gray-700">{question.parseStrategy.decisionFramework}</span>
                    </div>
                    {question.parseStrategy.eliminationHints.length > 0 && (
                      <div>
                        <span className="text-sm font-semibold text-purple-800">Elimination hints:</span>
                        <ul className="mt-1 space-y-1">
                          {question.parseStrategy.eliminationHints.map((hint, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-purple-400">•</span>
                              {hint}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Article Reference */}
            {question.articleReference && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-blue-500 flex-shrink-0 mt-0.5">📖</span>
                <div>
                  <span className="text-sm font-semibold text-blue-700">From Reading: </span>
                  <span className="text-sm text-gray-700">{question.articleReference}</span>
                </div>
              </div>
            )}

            {/* Exam Tip */}
            {question.examTip && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-semibold text-amber-700">Exam Tip: </span>
                  <span className="text-sm text-gray-700">{question.examTip}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
