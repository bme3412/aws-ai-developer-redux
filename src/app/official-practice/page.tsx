'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Loader2,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Shuffle,
  Bookmark,
} from 'lucide-react';
import { Question } from '@/types/review';
import { isAnswerCorrect } from '@/lib/content';
import { markQuestionCompleted, getQuestionCompletion, recordQuestionAttempt } from '@/lib/progress';
import QuestionCard from '@/components/review/QuestionCard';

const BOOKMARKS_KEY = 'aws-genai-bookmarked-questions';

function getBookmarks(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
}

function saveBookmarks(bookmarks: Set<string>) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...bookmarks]));
}

type Bank = 'official' | 'exam-style';
type DomainFilter = 'all' | 1 | 2 | 3 | 4 | 5;

function filterByDomain(qs: Question[], domain: DomainFilter): Question[] {
  if (domain === 'all') return [...qs];
  return qs.filter(q => q.domain === domain);
}

export default function OfficialPracticePage() {
  const [officialQuestions, setOfficialQuestions] = useState<Question[]>([]);
  const [examStyleQuestions, setExamStyleQuestions] = useState<Question[]>([]);
  const [bank, setBank] = useState<Bank>('exam-style');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [mode, setMode] = useState<'browse' | 'quiz'>('browse');
  const [previouslyCompleted, setPreviouslyCompleted] = useState<Record<string, { correct: boolean }>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all');

  useEffect(() => {
    async function load() {
      try {
        const [officialData, examData] = await Promise.all([
          import('@/data/questions/official-practice.json'),
          import('@/data/questions/exam-style.json'),
        ]);
        const official = officialData.default.questions as unknown as Question[];
        const examStyle = examData.default.questions as unknown as Question[];
        setOfficialQuestions(official);
        setExamStyleQuestions(examStyle);
        setQuestions(examStyle);

        const completed: Record<string, { correct: boolean }> = {};
        [...official, ...examStyle].forEach(q => {
          const c = getQuestionCompletion(q.id);
          if (c) completed[q.id] = { correct: c.correct };
        });
        setPreviouslyCompleted(completed);
        setBookmarks(getBookmarks());
      } catch (e) {
        console.error('Failed to load practice questions:', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const bankSource = bank === 'official' ? officialQuestions : examStyleQuestions;

  const switchBank = (next: Bank) => {
    if (next === bank) return;
    const source = next === 'official' ? officialQuestions : examStyleQuestions;
    setBank(next);
    setQuestions(filterByDomain(source, domainFilter));
    setCurrentIndex(0);
    setAnswers({});
    setShowResults({});
    setIsComplete(false);
    setIsShuffled(false);
    setShowBookmarkedOnly(false);
    setShowLanding(true);
  };

  const applyDomainFilter = (next: DomainFilter) => {
    if (next === domainFilter) return;
    setDomainFilter(next);
    setQuestions(filterByDomain(bankSource, next));
    setCurrentIndex(0);
    setAnswers({});
    setShowResults({});
    setIsComplete(false);
    setIsShuffled(false);
    setShowLanding(true);
  };

  const toggleBookmark = (questionId: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      saveBookmarks(next);
      return next;
    });
  };

  const handleShuffle = () => {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQuestions(shuffled);
    setCurrentIndex(0);
    setAnswers({});
    setShowResults({});
    setIsShuffled(true);
  };

  const handleUnshuffle = () => {
    setQuestions(filterByDomain(bankSource, domainFilter));
    setCurrentIndex(0);
    setIsShuffled(false);
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(showResults).filter(k => showResults[k]).length;

  const handleAnswer = (selectedIds: string[]) => {
    if (!currentQuestion) return;
    const correct = isAnswerCorrect(selectedIds, currentQuestion.correctAnswers, currentQuestion.type === 'ordering');
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: selectedIds }));
    setShowResults(prev => ({ ...prev, [currentQuestion.id]: true }));
    markQuestionCompleted(currentQuestion.id, correct);
    recordQuestionAttempt('official-practice', currentQuestion.id, correct);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (mode === 'quiz') {
      setIsComplete(true);
    } else {
      setShowLanding(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResults({});
    setIsComplete(false);
  };

  const domainCounts: Record<number, number> = {};
  bankSource.forEach(q => {
    domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Completed view (quiz mode)
  if (isComplete && mode === 'quiz') {
    const correctCount = questions.filter(q =>
      isAnswerCorrect(answers[q.id] || [], q.correctAnswers, q.type === 'ordering')
    ).length;
    const percentage = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
          percentage >= 72 ? 'bg-green-100 border-2 border-green-500' : 'bg-amber-100 border-2 border-amber-500'
        }`}>
          <span className={`text-3xl font-bold ${percentage >= 72 ? 'text-green-600' : 'text-amber-600'}`}>
            {percentage}%
          </span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {bank === 'exam-style' ? 'Exam Style Complete' : 'Official Practice Complete'}
        </h2>
        <p className="text-gray-600 mb-4">
          You got {correctCount} out of {questions.length} questions correct.
        </p>

        {percentage >= 72 ? (
          <p className="text-green-600 mb-8">Strong performance on official-style questions.</p>
        ) : (
          <p className="text-amber-600 mb-8">Review the strategic breakdowns for each question to understand the patterns.</p>
        )}

        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
          <Link
            href="/review"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            Practice by Topic
          </Link>
        </div>

        {/* Review all questions */}
        <div className="text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Review Your Answers</h3>
          <div className="space-y-2">
            {questions.map((q, idx) => {
              const correct = isAnswerCorrect(answers[q.id] || [], q.correctAnswers, q.type === 'ordering');
              return (
                <button
                  key={q.id}
                  onClick={() => { setIsComplete(false); setCurrentIndex(idx); }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border ${
                    correct
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <span className="text-sm">Q{idx + 1}: Domain {q.domain} • Task {q.task}</span>
                  <span className="text-xs">{correct ? '✓ Correct' : '✗ Incorrect'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Landing / question navigator view
  if (showLanding || !currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-teal-600" />
            <h1 className="text-3xl font-bold text-gray-900">Official Practice Questions</h1>
          </div>
          <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
            <button
              onClick={() => switchBank('exam-style')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                bank === 'exam-style' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Exam Style
            </button>
            <button
              onClick={() => switchBank('official')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                bank === 'official' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Official Practice
            </button>
          </div>
          <p className="text-gray-600">
            {bank === 'exam-style'
              ? 'Twenty-five items across Domain 1 and Domain 2 written in official AIP-C01 stem-and-option voice. No timer. Same stacked constraints and full-sentence answers as the official sample set.'
              : '100 exam-style questions for the AWS Certified Generative AI Developer - Professional (AIP-C01) exam. Each includes a strategic breakdown to help you understand what is being tested and how to approach it.'}
          </p>
        </div>

        {/* Mode selection */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => { setMode('browse'); setCurrentIndex(0); setAnswers({}); setShowResults({}); setShowLanding(false); }}
            className="p-5 bg-white border-2 border-teal-200 hover:border-teal-400 rounded-xl text-left transition-colors"
          >
            <h3 className="font-semibold text-gray-900 mb-1">Study Mode</h3>
            <p className="text-sm text-gray-600">Browse questions one by one. Review strategic breakdowns as you go. No time pressure.</p>
          </button>
          <button
            onClick={() => { setMode('quiz'); setCurrentIndex(0); setAnswers({}); setShowResults({}); setShowLanding(false); }}
            className="p-5 bg-white border-2 border-blue-200 hover:border-blue-400 rounded-xl text-left transition-colors"
          >
            <h3 className="font-semibold text-gray-900 mb-1">Quiz Mode</h3>
            <p className="text-sm text-gray-600">Answer all {questions.length} questions, then see your score. Review missed questions at the end.</p>
          </button>
        </div>

        {/* Domain filter + Shuffle + Bookmarked */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => applyDomainFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                domainFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            {([1, 2, 3, 4, 5] as const).map(d => {
              const count = domainCounts[d] || 0;
              return (
                <button
                  key={d}
                  onClick={() => applyDomainFilter(d)}
                  disabled={count === 0}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    domainFilter === d
                      ? 'bg-white text-gray-900 shadow-sm'
                      : count === 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  D{d}
                </button>
              );
            })}
          </div>
          <button
            onClick={isShuffled ? handleUnshuffle : handleShuffle}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isShuffled
                ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            {isShuffled ? 'Shuffled' : 'Shuffle'}
          </button>
          {bookmarks.size > 0 && (
            <button
              onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                showBookmarkedOnly
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Bookmarked ({bookmarks.size})
            </button>
          )}
        </div>

        {/* Question grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {showBookmarkedOnly
              ? `Bookmarked Questions (${bookmarks.size})`
              : domainFilter === 'all'
                ? 'All Questions'
                : `Domain ${domainFilter}`}
          </h2>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {questions.map((q, idx) => {
              if (showBookmarkedOnly && !bookmarks.has(q.id)) return null;
              const prev = previouslyCompleted[q.id];
              const isBookmarked = bookmarks.has(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => { setMode('browse'); setCurrentIndex(idx); setShowLanding(false); }}
                  className={`aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center relative ${
                    prev
                      ? prev.correct
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={`Q${idx + 1}: Domain ${q.domain}, Task ${q.task} (${q.type})${isBookmarked ? ' [Bookmarked]' : ''}`}
                >
                  {idx + 1}
                  {isBookmarked && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Active question view
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => { setCurrentIndex(0); setAnswers({}); setShowResults({}); setIsComplete(false); setShowLanding(true); }}
            className="text-teal-600 hover:text-teal-500"
          >
            {bank === 'exam-style' ? 'Exam Style' : 'Official Practice'}
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">Question {currentIndex + 1}</span>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => switchBank('exam-style')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              bank === 'exam-style' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Exam Style
          </button>
          <button
            onClick={() => switchBank('official')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              bank === 'official' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Official Practice
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <div className="flex items-center gap-3">
            {previouslyCompleted[currentQuestion.id] && !showResults[currentQuestion.id] && (
              <span className={`text-xs ${previouslyCompleted[currentQuestion.id].correct ? 'text-green-600' : 'text-amber-600'}`}>
                Previously {previouslyCompleted[currentQuestion.id].correct ? 'correct' : 'incorrect'}
              </span>
            )}
            <span>{answeredCount} answered this session</span>
            <button
              onClick={() => toggleBookmark(currentQuestion.id)}
              className={`p-1 rounded transition-colors ${
                bookmarks.has(currentQuestion.id)
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-gray-300 hover:text-gray-500'
              }`}
              title={bookmarks.has(currentQuestion.id) ? 'Remove bookmark' : 'Bookmark this question'}
            >
              <Bookmark className={`w-5 h-5 ${bookmarks.has(currentQuestion.id) ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question navigator (compact) */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
        {questions.map((q, idx) => {
          const isAnswered = showResults[q.id];
          const isCurrent = idx === currentIndex;
          const wasCorrect = isAnswered && isAnswerCorrect(answers[q.id] || [], q.correctAnswers, q.type === 'ordering');

          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded text-xs font-medium transition-colors flex-shrink-0 ${
                isCurrent
                  ? 'bg-teal-600 text-white'
                  : isAnswered
                  ? wasCorrect
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
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

        {showResults[currentQuestion.id] ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg transition-colors"
          >
            {currentIndex < questions.length - 1 ? 'Next Question →' : mode === 'quiz' ? 'See Results' : 'Back to Overview'}
          </button>
        ) : (
          <button
            onClick={() => {
              if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
            }}
            disabled={currentIndex >= questions.length - 1}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Skip →
          </button>
        )}
      </div>
    </div>
  );
}
