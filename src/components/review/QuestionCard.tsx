'use client';

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Lightbulb,
  Crosshair,
  Clock,
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
  const [orderedSelections, setOrderedSelections] = useState<string[]>(selectedAnswers);
  const [showStrategy, setShowStrategy] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [showStrategicBreakdown, setShowStrategicBreakdown] = useState(false);

  const isMultiple = question.type === 'multiple-response';
  const isOrdering = question.type === 'ordering';

  const effectiveSelected = isOrdering ? orderedSelections : selected;

  const isCorrect = showResult && (
    isOrdering
      ? JSON.stringify(orderedSelections) === JSON.stringify(question.correctAnswers)
      : effectiveSelected.length === question.correctAnswers.length &&
        effectiveSelected.every(s => question.correctAnswers.includes(s))
  );

  const handleOptionClick = (optionId: string) => {
    if (showResult) return;

    if (isOrdering) {
      setOrderedSelections(prev => {
        if (prev.includes(optionId)) {
          // Remove this and everything after it
          const idx = prev.indexOf(optionId);
          return prev.slice(0, idx);
        }
        return [...prev, optionId];
      });
    } else if (isMultiple) {
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
    const toSubmit = isOrdering ? orderedSelections : selected;
    if (toSubmit.length > 0) {
      onAnswer(toSubmit);
    }
  };

  // For ordering questions, get the step number of an option
  const getOrderStep = (optionId: string): number | null => {
    const idx = orderedSelections.indexOf(optionId);
    return idx >= 0 ? idx + 1 : null;
  };

  // For ordering results, get the correct step number
  const getCorrectStep = (optionId: string): number | null => {
    const idx = question.correctAnswers.indexOf(optionId);
    return idx >= 0 ? idx + 1 : null;
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
        {isOrdering && (
          <p className="text-sm text-gray-500 mb-4">
            Click options in the correct order ({question.correctAnswers.length} steps). Click a selected option to undo from that point.
          </p>
        )}
      </div>

      {/* Options */}
      <div className="px-4 pb-4 space-y-2">
        {question.options.map(option => {
          const isSelected = effectiveSelected.includes(option.id);
          const isCorrectOption = question.correctAnswers.includes(option.id);
          const orderStep = isOrdering ? getOrderStep(option.id) : null;
          const correctStep = isOrdering ? getCorrectStep(option.id) : null;

          let optionStyle = 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';

          if (showResult) {
            if (isOrdering) {
              // For ordering: highlight based on whether placement is correct
              if (isSelected && orderStep === correctStep) {
                optionStyle = 'border-green-500 bg-green-50';
              } else if (isSelected && orderStep !== correctStep) {
                optionStyle = 'border-red-500 bg-red-50';
              } else if (isCorrectOption) {
                optionStyle = 'border-green-300 bg-green-50/50';
              }
            } else {
              if (isCorrectOption) {
                optionStyle = 'border-green-500 bg-green-50';
              } else if (isSelected && !isCorrectOption) {
                optionStyle = 'border-red-500 bg-red-50';
              }
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
              {/* Option letter or step number */}
              {isOrdering && orderStep && !showResult ? (
                <span className="w-6 h-6 flex items-center justify-center rounded-full border text-sm font-medium flex-shrink-0 border-blue-500 bg-blue-500 text-white">
                  {orderStep}
                </span>
              ) : (
                <span className={`w-6 h-6 flex items-center justify-center rounded-full border text-sm font-medium flex-shrink-0 ${
                  isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-500'
                }`}>
                  {option.id.toUpperCase()}
                </span>
              )}
              <span className="text-sm text-gray-700 flex-1">{option.text}</span>

              {/* Result indicators */}
              {showResult && isOrdering && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {orderStep && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      orderStep === correctStep ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      You: #{orderStep}
                    </span>
                  )}
                  {correctStep && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                      Correct: #{correctStep}
                    </span>
                  )}
                </div>
              )}
              {showResult && !isOrdering && isCorrectOption && (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
              {showResult && !isOrdering && isSelected && !isCorrectOption && (
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
            disabled={effectiveSelected.length === 0}
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

            {/* Strategic Breakdown */}
            {question.strategicBreakdown && (
              <div>
                <button
                  onClick={() => setShowStrategicBreakdown(!showStrategicBreakdown)}
                  className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-800"
                >
                  <Crosshair className="w-4 h-4" />
                  {showStrategicBreakdown ? 'Hide' : 'Show'} Strategic Breakdown
                </button>
                {showStrategicBreakdown && (
                  <div className="mt-3 p-4 bg-teal-50 border border-teal-200 rounded-lg space-y-4">
                    {/* What is being asked */}
                    <div>
                      <h5 className="text-sm font-semibold text-teal-800 mb-1">What this is really asking</h5>
                      <p className="text-sm text-gray-700">{question.strategicBreakdown.whatIsBeingAsked}</p>
                    </div>

                    {/* Tested Concepts */}
                    <div>
                      <h5 className="text-sm font-semibold text-teal-800 mb-2">Concepts being tested</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {question.strategicBreakdown.testedConcepts.map((concept, i) => (
                          <span key={i} className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-md font-medium">
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Services in Play */}
                    <div>
                      <h5 className="text-sm font-semibold text-teal-800 mb-2">Services in play</h5>
                      <div className="space-y-1.5">
                        {question.strategicBreakdown.servicesInPlay.map((svc, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                              svc.isCorrectAnswer ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <div>
                              <span className="font-medium text-gray-800">{svc.service}</span>
                              <span className="text-gray-500"> — {svc.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" /> = part of correct answer
                      </p>
                    </div>

                    {/* Approach Strategy */}
                    <div>
                      <h5 className="text-sm font-semibold text-teal-800 mb-1">How to approach</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">{question.strategicBreakdown.approachStrategy}</p>
                    </div>

                    {/* Common Mistakes */}
                    <div>
                      <h5 className="text-sm font-semibold text-teal-800 mb-1">Mistakes to avoid</h5>
                      <ul className="space-y-1">
                        {question.strategicBreakdown.commonMistakes.map((mistake, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-red-400 flex-shrink-0">✗</span>
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Time Management Tip */}
                    {question.strategicBreakdown.timeManagementTip && (
                      <div className="flex items-start gap-2 p-2.5 bg-white border border-teal-200 rounded-md">
                        <Clock className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">{question.strategicBreakdown.timeManagementTip}</p>
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
