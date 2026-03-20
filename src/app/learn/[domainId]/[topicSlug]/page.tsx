'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getDomain } from '@/lib/domains';
import { getDomainQuestions } from '@/lib/content';
import { markArticleRead, isArticleRead } from '@/lib/progress';
import { Question } from '@/types/review';
import MarkdownArticle from '@/components/learn/MarkdownArticle';
import QuestionCard from '@/components/review/QuestionCard';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  FlaskConical,
  X,
  ClipboardCheck,
  CheckCircle,
} from 'lucide-react';

// Domain color schemes
const domainColors: Record<number, {
  bg: string;
  accent: string;
  text: string;
  border: string;
  gradientFrom: string;
  gradientTo: string;
  modalFrom: string;
  modalTo: string;
  modalSubtext: string;
}> = {
  1: { bg: 'bg-blue-100', accent: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', gradientFrom: 'from-blue-50', gradientTo: 'to-indigo-50', modalFrom: 'from-blue-600', modalTo: 'to-indigo-600', modalSubtext: 'text-blue-200' },
  2: { bg: 'bg-emerald-100', accent: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', gradientFrom: 'from-emerald-50', gradientTo: 'to-teal-50', modalFrom: 'from-emerald-600', modalTo: 'to-teal-600', modalSubtext: 'text-emerald-200' },
  3: { bg: 'bg-amber-100', accent: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-200', gradientFrom: 'from-amber-50', gradientTo: 'to-orange-50', modalFrom: 'from-amber-600', modalTo: 'to-orange-600', modalSubtext: 'text-amber-200' },
  4: { bg: 'bg-rose-100', accent: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-200', gradientFrom: 'from-rose-50', gradientTo: 'to-pink-50', modalFrom: 'from-rose-600', modalTo: 'to-pink-600', modalSubtext: 'text-rose-200' },
  5: { bg: 'bg-violet-100', accent: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-200', gradientFrom: 'from-violet-50', gradientTo: 'to-purple-50', modalFrom: 'from-violet-600', modalTo: 'to-purple-600', modalSubtext: 'text-violet-200' },
};

export default function TopicPage() {
  const params = useParams();
  const domainId = parseInt(params.domainId as string);
  const topicSlug = params.topicSlug as string;
  const colors = domainColors[domainId] || domainColors[1];

  const [markdown, setMarkdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [isMarkedComplete, setIsMarkedComplete] = useState(false);

  // Modal state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const domain = getDomain(domainId);
  const task = domain?.tasks.find(t => t.articleSlug === topicSlug);

  const currentTaskIndex = domain?.tasks.findIndex(t => t.articleSlug === topicSlug) ?? -1;
  const prevTask = currentTaskIndex > 0 ? domain?.tasks[currentTaskIndex - 1] : null;
  const nextTask = currentTaskIndex < (domain?.tasks.length ?? 0) - 1 ? domain?.tasks[currentTaskIndex + 1] : null;

  // Load completion state on mount
  useEffect(() => {
    const articleKey = `${domainId}-${topicSlug}`;
    if (isArticleRead(articleKey)) {
      setIsMarkedComplete(true);
    }
  }, [domainId, topicSlug]);

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/content/${domainId}/${topicSlug}`);
        if (response.ok) {
          const data = await response.json();
          setMarkdown(data.content);
        } else {
          setError('Content not found');
        }
      } catch (err) {
        setError('Failed to load content');
      }

      setIsLoading(false);
    }
    loadContent();
  }, [domainId, topicSlug]);

  const openQuizModal = async () => {
    setShowQuizModal(true);
    setQuestionsLoading(true);
    setCurrentIndex(0);
    setAnswers({});
    setShowResults({});

    try {
      const allQuestions = await getDomainQuestions(domainId);
      const taskQuestions = allQuestions.filter(q => q.task === task?.id);
      // Shuffle questions
      const shuffled = taskQuestions.sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }

    setQuestionsLoading(false);
  };

  const closeQuizModal = () => {
    setShowQuizModal(false);
  };

  const handleMarkComplete = () => {
    const timeSpent = Math.round((Date.now() - startTime) / 60000);
    markArticleRead(`${domainId}-${topicSlug}`, Math.max(timeSpent, 1));
    setIsMarkedComplete(true);
  };

  const handleAnswer = (selectedIds: string[]) => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    setAnswers(prev => ({ ...prev, [currentQuestion.id]: selectedIds }));
    setShowResults(prev => ({ ...prev, [currentQuestion.id]: true }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(showResults).length;
  const correctCount = questions.filter(q => {
    const selected = answers[q.id] || [];
    return JSON.stringify(selected.sort()) === JSON.stringify(q.correctAnswers.sort());
  }).length;

  if (!domain || !task) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-gray-600">Topic not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/learn" className="hover:text-gray-700">Learn</Link>
        <span>/</span>
        <Link href={`/learn/${domainId}`} className="hover:text-gray-700">
          Domain {domainId}
        </Link>
        <span>/</span>
        <span className="text-gray-700">Task {task.id}</span>
      </div>

      {/* Practice Questions Button - At Top */}
      <div className={`flex items-center justify-between p-4 bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} border ${colors.border} rounded-lg mb-6`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
            <ClipboardCheck className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <span className="font-medium text-gray-800">Practice Questions</span>
            <p className="text-sm text-gray-500">Test your knowledge of Task {task.id}</p>
          </div>
        </div>
        <button
          onClick={openQuizModal}
          className={`px-5 py-2.5 ${colors.accent} hover:opacity-90 text-white text-sm font-medium rounded-lg transition-colors shadow-sm`}
        >
          Start Practice
        </button>
      </div>

      {/* Lab link if available */}
      {task.labSlug && (
        <div className="mb-6">
          <Link
            href={`/labs/${task.labSlug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            Open Interactive Lab
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{error}</p>
        </div>
      ) : markdown ? (
        <MarkdownArticle content={markdown} />
      ) : null}

      {/* Mark Complete */}
      <div className="flex items-center justify-center my-8">
        <button
          onClick={handleMarkComplete}
          disabled={isMarkedComplete}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isMarkedComplete
              ? 'bg-green-100 text-green-600 cursor-default'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          <CheckCircle className={`w-5 h-5 ${isMarkedComplete ? 'text-green-600' : ''}`} />
          {isMarkedComplete ? 'Marked as Complete' : 'Mark as Complete'}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200">
        {prevTask ? (
          <Link
            href={`/learn/${domainId}/${prevTask.articleSlug}`}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <div className="text-left">
              <div className="text-xs text-gray-500">Previous</div>
              <div className="text-sm">{prevTask.name}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextTask ? (
          <Link
            href={`/learn/${domainId}/${nextTask.articleSlug}`}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <div className="text-right">
              <div className="text-xs text-gray-500">Next</div>
              <div className="text-sm">{nextTask.name}</div>
            </div>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href={`/learn/${domainId + 1}`}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <div className="text-right">
              <div className="text-xs text-gray-500">Next Domain</div>
              <div className="text-sm">Domain {domainId + 1}</div>
            </div>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={closeQuizModal} />
          <div className="relative min-h-screen flex items-start justify-center p-4 pt-16">
            <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[calc(100vh-8rem)] overflow-y-auto">
              {/* Modal Header */}
              <div className={`sticky top-0 bg-gradient-to-r ${colors.modalFrom} ${colors.modalTo} px-6 py-4 flex items-center justify-between`}>
                <div>
                  <h2 className="font-semibold text-white">Task {task.id} Practice</h2>
                  {questions.length > 0 && (
                    <p className={`text-sm ${colors.modalSubtext}`}>
                      Question {currentIndex + 1} of {questions.length}
                      {answeredCount > 0 && ` • ${correctCount}/{answeredCount} correct`}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeQuizModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {questionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No questions available for this task yet.</p>
                  </div>
                ) : currentQuestion ? (
                  <>
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

                      {showResults[currentQuestion.id] && currentIndex < questions.length - 1 && (
                        <button
                          onClick={handleNext}
                          className={`px-6 py-2 ${colors.accent} hover:opacity-90 text-white font-semibold rounded-lg transition-colors`}
                        >
                          Next Question →
                        </button>
                      )}

                      {showResults[currentQuestion.id] && currentIndex === questions.length - 1 && (
                        <button
                          onClick={closeQuizModal}
                          className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
                        >
                          Done
                        </button>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
