'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getDomains } from '@/lib/domains';
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
} from 'lucide-react';

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
          {domainFilter
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
          <p className="text-green-600 mb-8">Great job! You're on track for this section.</p>
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
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            <Target className="w-5 h-5" />
            Dashboard
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

export default function ReviewPage() {
  const domains = getDomains();

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-green-500" />
            Practice Questions
          </h1>
          <p className="text-gray-600 mt-2">
            Exam-style scenario questions with detailed explanations and answer strategies.
          </p>
        </div>

        {/* Quick Start Options */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/review?mode=quick"
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-1">Quick Review</h3>
            <p className="text-sm text-gray-600">10 random questions • ~15 min</p>
          </Link>
          <Link
            href="/review?mode=full"
            className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-semibold text-blue-700 mb-1">Full Practice Exam</h3>
            <p className="text-sm text-gray-600">65 questions • ~170 min</p>
          </Link>
          <Link
            href="/review?domain=1"
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-1">Domain 1 Focus</h3>
            <p className="text-sm text-gray-600">FM Integration • 31% of exam</p>
          </Link>
        </div>

        {/* Domain Filters */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">By Domain</h2>
          <div className="grid md:grid-cols-5 gap-3">
            {domains.map(domain => (
              <Link
                key={domain.id}
                href={`/review?domain=${domain.id}`}
                className={`p-3 bg-white rounded-lg border hover:border-gray-400 transition-colors text-center ${
                  domain.id === 1 ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'
                }`}
              >
                <div className="text-lg font-bold text-gray-800">D{domain.id}</div>
                <div className="text-xs text-gray-500">{domain.weight}%</div>
                {domain.id === 1 && (
                  <div className="text-xs text-blue-600 mt-1">45 questions</div>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Question Strategies Info */}
        <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">Exam Question Strategies</h3>
          <p className="text-sm text-gray-700 mb-3">
            Each question includes a strategy reveal after you answer, teaching you how to parse verbose scenarios and identify key phrases.
          </p>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              <span className="text-gray-600">Look for key adjectives: &quot;MOST cost-efficient&quot;, &quot;simplest&quot;</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              <span className="text-gray-600">Extract requirements from scenarios as a checklist</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              <span className="text-gray-600">Use elimination: if an option fails one requirement, remove it</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              <span className="text-gray-600">Know default service patterns for common keywords</span>
            </div>
          </div>
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
