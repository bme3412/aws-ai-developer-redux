'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { generatePracticeExam, analyzeQuestionCoverage } from '@/lib/content';
import { addReviewScore, markQuestionCompleted } from '@/lib/progress';
import { Question } from '@/types/review';
import QuestionCard from '@/components/review/QuestionCard';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  Flag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Target,
  BookOpen,
  AlertCircle,
} from 'lucide-react';

const EXAM_TIME_MINUTES = 75;

interface ExamState {
  status: 'intro' | 'running' | 'paused' | 'completed' | 'coverage';
  questions: Question[];
  breakdown: { domainId: number; count: number; weight: number }[];
  currentIndex: number;
  answers: Record<string, string[]>;
  showResults: Record<string, boolean>;
  flagged: Set<string>;
  timeRemaining: number; // seconds
  startTime: number | null;
}

interface CoverageData {
  domains: {
    domainId: number;
    name: string;
    weight: number;
    totalQuestions: number;
    targetQuestions: number;
    tasks: {
      taskId: string;
      taskName: string;
      questionCount: number;
      skills: { skillId: string; description: string; hasQuestions: boolean }[];
    }[];
    gaps: string[];
  }[];
  summary: {
    totalQuestions: number;
    coveragePercent: number;
    criticalGaps: string[];
  };
}

export default function PracticeExamPage() {
  const [examState, setExamState] = useState<ExamState>({
    status: 'intro',
    questions: [],
    breakdown: [],
    currentIndex: 0,
    answers: {},
    showResults: {},
    flagged: new Set(),
    timeRemaining: EXAM_TIME_MINUTES * 60,
    startTime: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [coverageData, setCoverageData] = useState<CoverageData | null>(null);

  // Timer effect
  useEffect(() => {
    if (examState.status !== 'running') return;

    const interval = setInterval(() => {
      setExamState(prev => {
        if (prev.timeRemaining <= 0) {
          return { ...prev, status: 'completed' };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examState.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startExam = async () => {
    setIsLoading(true);
    try {
      const { questions, breakdown } = await generatePracticeExam(65);
      setExamState({
        status: 'running',
        questions,
        breakdown,
        currentIndex: 0,
        answers: {},
        showResults: {},
        flagged: new Set(),
        timeRemaining: EXAM_TIME_MINUTES * 60,
        startTime: Date.now(),
      });
    } catch (error) {
      console.error('Failed to generate exam:', error);
    }
    setIsLoading(false);
  };

  const loadCoverage = async () => {
    setIsLoading(true);
    try {
      const data = await analyzeQuestionCoverage();
      setCoverageData(data);
      setExamState(prev => ({ ...prev, status: 'coverage' }));
    } catch (error) {
      console.error('Failed to analyze coverage:', error);
    }
    setIsLoading(false);
  };

  const togglePause = () => {
    setExamState(prev => ({
      ...prev,
      status: prev.status === 'running' ? 'paused' : 'running',
    }));
  };

  const handleAnswer = (selectedIds: string[]) => {
    const question = examState.questions[examState.currentIndex];
    if (!question) return;

    const isCorrect = JSON.stringify(selectedIds.sort()) === JSON.stringify(question.correctAnswers.sort());
    markQuestionCompleted(question.id, isCorrect);

    setExamState(prev => ({
      ...prev,
      answers: { ...prev.answers, [question.id]: selectedIds },
      showResults: { ...prev.showResults, [question.id]: true },
    }));
  };

  const goToQuestion = (index: number) => {
    setExamState(prev => ({ ...prev, currentIndex: index }));
  };

  const toggleFlag = () => {
    const questionId = examState.questions[examState.currentIndex]?.id;
    if (!questionId) return;

    setExamState(prev => {
      const newFlagged = new Set(prev.flagged);
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId);
      } else {
        newFlagged.add(questionId);
      }
      return { ...prev, flagged: newFlagged };
    });
  };

  const submitExam = useCallback(() => {
    // Calculate and save scores
    const { questions, answers } = examState;
    const correct = questions.filter(q => {
      const selected = answers[q.id] || [];
      return JSON.stringify(selected.sort()) === JSON.stringify(q.correctAnswers.sort());
    }).length;

    addReviewScore('practice-exam', correct, questions.length);
    setExamState(prev => ({ ...prev, status: 'completed' }));
  }, [examState]);

  const currentQuestion = examState.questions[examState.currentIndex];
  const answeredCount = Object.keys(examState.answers).length;
  const isTimeWarning = examState.timeRemaining < 600; // Less than 10 minutes

  // Calculate results
  const getResults = () => {
    const { questions, answers, breakdown } = examState;

    const domainResults = breakdown.map(({ domainId, count, weight }) => {
      const domainQuestions = questions.filter(q => q.domain === domainId);
      const correct = domainQuestions.filter(q => {
        const selected = answers[q.id] || [];
        return JSON.stringify(selected.sort()) === JSON.stringify(q.correctAnswers.sort());
      }).length;

      return {
        domainId,
        weight,
        total: domainQuestions.length,
        correct,
        percent: domainQuestions.length > 0 ? Math.round((correct / domainQuestions.length) * 100) : 0,
      };
    });

    const totalCorrect = questions.filter(q => {
      const selected = answers[q.id] || [];
      return JSON.stringify(selected.sort()) === JSON.stringify(q.correctAnswers.sort());
    }).length;

    return {
      domainResults,
      totalCorrect,
      totalQuestions: questions.length,
      overallPercent: Math.round((totalCorrect / questions.length) * 100),
      passed: (totalCorrect / questions.length) >= 0.72, // 72% passing score
    };
  };

  // Intro screen
  if (examState.status === 'intro') {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AWS GenAI Developer Practice Exam</h1>
          <p className="text-gray-600">Simulate the real exam experience</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Start Exam Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Full Practice Exam</h2>
                <p className="text-sm text-gray-500">65 questions, 75 minutes</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Timed: 75 minutes (same as real exam)</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Weighted by domain (31%, 26%, 20%, 12%, 11%)</span>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                <span>Flag questions for review</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Passing score: 72%</span>
              </div>
            </div>

            <button
              onClick={startExam}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Start Practice Exam
            </button>
          </div>

          {/* Coverage Analysis Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Coverage Analysis</h2>
                <p className="text-sm text-gray-500">Check for gaps in question coverage</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Analyze the question bank to identify topics and skills that may need more practice questions.
              This helps ensure comprehensive exam preparation.
            </p>

            <button
              onClick={loadCoverage}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              Analyze Coverage Gaps
            </button>
          </div>
        </div>

        {/* Exam Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Exam Format</h3>
          <div className="grid md:grid-cols-5 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">31%</div>
              <div className="text-gray-600">Domain 1</div>
              <div className="text-xs text-gray-500">~20 questions</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">26%</div>
              <div className="text-gray-600">Domain 2</div>
              <div className="text-xs text-gray-500">~17 questions</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">20%</div>
              <div className="text-gray-600">Domain 3</div>
              <div className="text-xs text-gray-500">~13 questions</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-rose-600">12%</div>
              <div className="text-gray-600">Domain 4</div>
              <div className="text-xs text-gray-500">~8 questions</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-violet-600">11%</div>
              <div className="text-gray-600">Domain 5</div>
              <div className="text-xs text-gray-500">~7 questions</div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/review" className="text-blue-600 hover:text-blue-500 text-sm">
            ← Back to Practice Questions
          </Link>
        </div>
      </div>
    );
  }

  // Coverage Analysis View
  if (examState.status === 'coverage' && coverageData) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Question Coverage Analysis</h1>
            <p className="text-gray-600">Identifying gaps in exam preparation</p>
          </div>
          <button
            onClick={() => setExamState(prev => ({ ...prev, status: 'intro' }))}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Summary Card */}
        <div className={`rounded-xl p-6 mb-6 ${
          coverageData.summary.coveragePercent >= 80
            ? 'bg-green-50 border border-green-200'
            : coverageData.summary.coveragePercent >= 50
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Overall Coverage</h2>
              <p className="text-gray-600">{coverageData.summary.totalQuestions} questions in bank</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${
                coverageData.summary.coveragePercent >= 80 ? 'text-green-600' :
                coverageData.summary.coveragePercent >= 50 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {coverageData.summary.coveragePercent}%
              </div>
              <div className="text-sm text-gray-500">of target coverage</div>
            </div>
          </div>

          {coverageData.summary.criticalGaps.length > 0 && (
            <div className="mt-4 p-3 bg-white rounded-lg">
              <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                Critical Gaps (High-Weight Domains)
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                {coverageData.summary.criticalGaps.map((gap, i) => (
                  <li key={i}>• {gap}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Domain Breakdown */}
        <div className="space-y-4">
          {coverageData.domains.map(domain => (
            <div key={domain.domainId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Domain {domain.domainId}: {domain.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {domain.weight}% of exam • {domain.totalQuestions} questions (target: {domain.targetQuestions})
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  domain.totalQuestions >= domain.targetQuestions
                    ? 'bg-green-100 text-green-700'
                    : domain.totalQuestions >= domain.targetQuestions * 0.5
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {Math.round((domain.totalQuestions / domain.targetQuestions) * 100)}% coverage
                </div>
              </div>

              {domain.gaps.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="text-sm font-medium text-amber-700 mb-2">Gaps Identified:</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {domain.gaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="px-4 py-3 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-700 mb-2">Tasks:</div>
                <div className="grid md:grid-cols-2 gap-2">
                  {domain.tasks.map(task => (
                    <div
                      key={task.taskId}
                      className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                        task.questionCount >= 5 ? 'bg-green-50' :
                        task.questionCount >= 1 ? 'bg-amber-50' : 'bg-red-50'
                      }`}
                    >
                      <span className="text-gray-700">{task.taskId}: {task.taskName}</span>
                      <span className={`font-medium ${
                        task.questionCount >= 5 ? 'text-green-600' :
                        task.questionCount >= 1 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {task.questionCount} Q
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Paused screen
  if (examState.status === 'paused') {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <Pause className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Paused</h2>
        <p className="text-gray-600 mb-6">Time remaining: {formatTime(examState.timeRemaining)}</p>
        <button
          onClick={togglePause}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
        >
          Resume Exam
        </button>
      </div>
    );
  }

  // Completed screen
  if (examState.status === 'completed') {
    const results = getResults();

    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
            results.passed ? 'bg-green-100 border-4 border-green-500' : 'bg-red-100 border-4 border-red-500'
          }`}>
            {results.passed ? (
              <CheckCircle className="w-12 h-12 text-green-600" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {results.passed ? 'Congratulations!' : 'Keep Practicing'}
          </h1>
          <p className="text-gray-600">
            You scored {results.totalCorrect}/{results.totalQuestions} ({results.overallPercent}%)
          </p>
          <p className={`text-sm mt-1 ${results.passed ? 'text-green-600' : 'text-red-600'}`}>
            {results.passed ? 'You passed! (72% required)' : `You need 72% to pass (${Math.ceil(results.totalQuestions * 0.72)} correct answers)`}
          </p>
        </div>

        {/* Domain Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Score by Domain</h2>
          <div className="space-y-3">
            {results.domainResults.map(({ domainId, weight, total, correct, percent }) => (
              <div key={domainId} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">Domain {domainId}</div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent >= 72 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right">
                  <span className={`font-medium ${
                    percent >= 72 ? 'text-green-600' : percent >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {correct}/{total}
                  </span>
                  <span className="text-gray-400 text-sm ml-1">({percent}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review Questions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Questions</h2>
          <div className="grid grid-cols-10 gap-2">
            {examState.questions.map((q, idx) => {
              const selected = examState.answers[q.id] || [];
              const isCorrect = JSON.stringify(selected.sort()) === JSON.stringify(q.correctAnswers.sort());
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setExamState(prev => ({
                      ...prev,
                      status: 'running',
                      currentIndex: idx,
                    }));
                  }}
                  className={`w-full aspect-square rounded-lg text-sm font-medium transition-colors ${
                    isCorrect
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setExamState(prev => ({ ...prev, status: 'intro' }))}
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
      </div>
    );
  }

  // Running exam
  return (
    <div className="max-w-4xl mx-auto px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePause}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Pause exam"
          >
            <Pause className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <span className="text-sm text-gray-500">Question</span>
            <span className="ml-2 font-semibold text-gray-900">
              {examState.currentIndex + 1} / {examState.questions.length}
            </span>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          isTimeWarning ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
        }`}>
          <Clock className={`w-5 h-5 ${isTimeWarning ? 'animate-pulse' : ''}`} />
          <span className="font-mono font-semibold">{formatTime(examState.timeRemaining)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {answeredCount} answered
          </span>
          <button
            onClick={submitExam}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
          >
            Submit Exam
          </button>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
        {examState.questions.map((q, idx) => {
          const isAnswered = examState.answers[q.id] !== undefined;
          const isFlagged = examState.flagged.has(q.id);
          const isCurrent = idx === examState.currentIndex;

          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(idx)}
              className={`relative w-8 h-8 rounded text-xs font-medium transition-colors flex-shrink-0 ${
                isCurrent
                  ? 'bg-blue-600 text-white'
                  : isAnswered
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {idx + 1}
              {isFlagged && (
                <Flag className="absolute -top-1 -right-1 w-3 h-3 text-amber-500 fill-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Domain {currentQuestion.domain} • Task {currentQuestion.task}
            </span>
            <button
              onClick={toggleFlag}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                examState.flagged.has(currentQuestion.id)
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Flag className={`w-4 h-4 ${examState.flagged.has(currentQuestion.id) ? 'fill-amber-500' : ''}`} />
              {examState.flagged.has(currentQuestion.id) ? 'Flagged' : 'Flag'}
            </button>
          </div>

          <QuestionCard
            question={currentQuestion}
            questionNumber={examState.currentIndex + 1}
            totalQuestions={examState.questions.length}
            onAnswer={handleAnswer}
            showResult={examState.showResults[currentQuestion.id] || false}
            selectedAnswers={examState.answers[currentQuestion.id] || []}
          />
        </>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => goToQuestion(examState.currentIndex - 1)}
          disabled={examState.currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        <button
          onClick={() => goToQuestion(examState.currentIndex + 1)}
          disabled={examState.currentIndex === examState.questions.length - 1}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
