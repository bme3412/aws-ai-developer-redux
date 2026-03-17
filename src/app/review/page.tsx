'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getDomains, getDomain } from '@/lib/domains';
import { getDomainQuestions, getAllQuestions, shuffleQuestions } from '@/lib/content';
import { addReviewScore } from '@/lib/progress';
import { Question } from '@/types/review';
import QuestionCard from '@/components/review/QuestionCard';
import {
  ClipboardCheck,
  RefreshCw,
  Target,
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
} from 'lucide-react';

interface TaskQuestionCount {
  taskId: string;
  taskName: string;
  count: number;
  articleSlug?: string;
}

interface DomainQuestionSummary {
  domainId: number;
  domainName: string;
  weight: number;
  totalQuestions: number;
  tasks: TaskQuestionCount[];
}

function ReviewContent() {
  const searchParams = useSearchParams();
  const domainFilter = searchParams.get('domain');
  const taskFilter = searchParams.get('task');
  const mode = searchParams.get('mode') || 'practice';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const domain = domainFilter ? getDomain(parseInt(domainFilter)) : null;
  const task = domain && taskFilter ? domain.tasks.find(t => t.id === taskFilter) : null;

  useEffect(() => {
    async function loadQuestions() {
      setIsLoading(true);
      try {
        let loadedQuestions: Question[] = [];

        if (domainFilter) {
          loadedQuestions = await getDomainQuestions(parseInt(domainFilter));
        } else {
          loadedQuestions = await getAllQuestions();
        }

        // Filter by task if specified
        if (taskFilter) {
          loadedQuestions = loadedQuestions.filter(q => q.task === taskFilter);
        }

        // Apply mode-based filtering
        if (mode === 'quick') {
          loadedQuestions = shuffleQuestions(loadedQuestions).slice(0, 10);
        } else if (mode === 'full') {
          loadedQuestions = shuffleQuestions(loadedQuestions).slice(0, 65);
        } else if (mode === 'all') {
          // Show all questions without shuffling limit
          loadedQuestions = shuffleQuestions(loadedQuestions);
        } else {
          // Default: shuffle and take up to 20 for practice
          loadedQuestions = shuffleQuestions(loadedQuestions).slice(0, 20);
        }

        setQuestions(loadedQuestions);
      } catch (error) {
        console.error('Failed to load questions:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestions();
  }, [domainFilter, taskFilter, mode]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (selectedIds: string[]) => {
    if (!currentQuestion) return;

    setAnswers(prev => ({ ...prev, [currentQuestion.id]: selectedIds }));
    setShowResults(prev => ({ ...prev, [currentQuestion.id]: true }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate and save score
      const correct = questions.filter(q => {
        const selected = answers[q.id] || [];
        return JSON.stringify(selected.sort()) === JSON.stringify(q.correctAnswers.sort());
      }).length;
      addReviewScore(domainFilter ? `domain-${domainFilter}` : 'general', correct, questions.length);
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResults({});
    setIsComplete(false);
    // Reshuffle questions
    setQuestions(shuffleQuestions(questions));
  };

  const isCorrect = (questionId: string, correctAnswers: string[]) => {
    const selected = answers[questionId] || [];
    return JSON.stringify(selected.sort()) === JSON.stringify(correctAnswers.sort());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-center">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Questions Available</h2>
        <p className="text-gray-600 mb-4">
          {taskFilter
            ? `No questions found for Task ${taskFilter}. Questions are being added.`
            : domainFilter
            ? `No questions found for Domain ${domainFilter}. Questions are being added.`
            : 'No questions available. Try selecting a specific domain.'}
        </p>
        <Link href="/review" className="text-blue-600 hover:text-blue-500">
          View all review options
        </Link>
      </div>
    );
  }

  if (isComplete) {
    const correctCount = questions.filter(q => isCorrect(q.id, q.correctAnswers)).length;
    const percentage = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
          percentage >= 70 ? 'bg-green-100 border-2 border-green-500' : 'bg-amber-100 border-2 border-amber-500'
        }`}>
          <span className={`text-3xl font-bold ${percentage >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
            {percentage}%
          </span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Complete</h2>
        <p className="text-gray-600 mb-4">
          You got {correctCount} out of {questions.length} questions correct.
        </p>

        {percentage >= 70 ? (
          <p className="text-green-600 mb-8">Great job! You&apos;re on track for this section.</p>
        ) : (
          <p className="text-amber-600 mb-8">Review the explanations and try again to improve your score.</p>
        )}

        <div className="flex justify-center gap-4">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          <Link
            href="/review"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            <Target className="w-5 h-5" />
            Back to Topics
          </Link>
        </div>

        {/* Review missed questions */}
        <div className="mt-12 text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Review Your Answers</h3>
          <div className="space-y-2">
            {questions.map((q, idx) => {
              const correct = isCorrect(q.id, q.correctAnswers);
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setIsComplete(false);
                    setCurrentIndex(idx);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                    correct
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <span className="text-sm">Question {idx + 1}: Task {q.task}</span>
                  <span className="text-xs">{correct ? '✓ Correct' : '✗ Incorrect'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Context Header */}
      {(domainFilter || taskFilter) && (
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/review" className="text-blue-600 hover:text-blue-500">
            All Topics
          </Link>
          {domainFilter && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Link
                href={`/review?domain=${domainFilter}`}
                className={taskFilter ? "text-blue-600 hover:text-blue-500" : "text-gray-700"}
              >
                Domain {domainFilter}
              </Link>
            </>
          )}
          {taskFilter && task && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">Task {taskFilter}: {task.name}</span>
            </>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>
            {Object.values(showResults).filter(Boolean).length} answered
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <QuestionCard
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        showResult={showResults[currentQuestion.id] || false}
        selectedAnswers={answers[currentQuestion.id] || []}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>

        {showResults[currentQuestion.id] && (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            {currentIndex < questions.length - 1 ? 'Next Question →' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
}

function DomainSection({ summary, isExpanded, onToggle }: {
  summary: DomainQuestionSummary;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Domain Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">
              Domain {summary.domainId}: {summary.domainName}
            </h3>
          </div>
        </div>
        <Link
          href={`/review?domain=${summary.domainId}&mode=all`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          Practice All
        </Link>
      </button>

      {/* Task List */}
      {isExpanded && (
        <div className="divide-y divide-gray-100">
          {summary.tasks.map((task) => (
            <div
              key={task.taskId}
              className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="w-12 text-sm font-medium text-gray-500">
                  {task.taskId}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{task.taskName}</p>
                  <p className="text-xs text-gray-500">{task.count} questions</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {task.articleSlug && (
                  <Link
                    href={`/learn/${summary.domainId}/${task.articleSlug}`}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    Read
                  </Link>
                )}
                <Link
                  href={`/review?domain=${summary.domainId}&task=${task.taskId}&mode=all`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <Play className="w-3 h-3" />
                  Practice
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  const domains = getDomains();
  const [questionSummaries, setQuestionSummaries] = useState<DomainQuestionSummary[]>([]);
  const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set([1]));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSummaries() {
      const summaries: DomainQuestionSummary[] = [];

      for (const domain of domains) {
        try {
          const questions = await getDomainQuestions(domain.id);

          // Count questions per task
          const taskCounts: Record<string, number> = {};
          questions.forEach(q => {
            taskCounts[q.task] = (taskCounts[q.task] || 0) + 1;
          });

          const tasks: TaskQuestionCount[] = domain.tasks.map(t => ({
            taskId: t.id,
            taskName: t.name,
            count: taskCounts[t.id] || 0,
            articleSlug: t.articleSlug,
          }));

          summaries.push({
            domainId: domain.id,
            domainName: domain.name,
            weight: domain.weight,
            totalQuestions: questions.length,
            tasks,
          });
        } catch {
          summaries.push({
            domainId: domain.id,
            domainName: domain.name,
            weight: domain.weight,
            totalQuestions: 0,
            tasks: [],
          });
        }
      }

      setQuestionSummaries(summaries);
      setIsLoading(false);
    }

    loadSummaries();
  }, [domains]);

  const toggleDomain = (domainId: number) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domainId)) {
        next.delete(domainId);
      } else {
        next.add(domainId);
      }
      return next;
    });
  };

  const totalQuestions = questionSummaries.reduce((sum, s) => sum + s.totalQuestions, 0);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-green-500" />
            Practice Questions
          </h1>
          <p className="text-gray-600 mt-2">
            {totalQuestions} exam-style questions organized by domain and task.
          </p>
        </div>

        {/* Domain Sections */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">By Domain & Task</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {questionSummaries.map((summary) => (
                <DomainSection
                  key={summary.domainId}
                  summary={summary}
                  isExpanded={expandedDomains.has(summary.domainId)}
                  onToggle={() => toggleDomain(summary.domainId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">Study Tips</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Read the article first, then practice questions for that task</li>
            <li>• Questions show which article section they test (after answering)</li>
            <li>• Focus on Domain 1 (31%) and Domain 2 (26%) for best ROI</li>
          </ul>
        </div>
      </div>

      {/* Question Interface */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      }>
        <ReviewContent />
      </Suspense>
    </div>
  );
}
