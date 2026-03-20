import { Progress } from '@/types/domain';
import { getDomains } from './domains';

const STORAGE_KEY = 'aws-genai-study-progress';

export function getProgress(): Progress {
  if (typeof window === 'undefined') {
    return getDefaultProgress();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading progress:', e);
  }

  return getDefaultProgress();
}

export function saveProgress(progress: Progress): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Error saving progress:', e);
  }
}

export function getDefaultProgress(): Progress {
  return {
    articlesRead: {},
    labsCompleted: {},
    reviewScores: {},
    weakAreas: [],
    questionsCompleted: {},
  };
}

export function markArticleRead(articleSlug: string, timeSpentMinutes: number): void {
  const progress = getProgress();
  progress.articlesRead[articleSlug] = {
    completedAt: new Date().toISOString(),
    timeSpentMinutes,
  };
  saveProgress(progress);
}

export function isArticleRead(articleSlug: string): boolean {
  const progress = getProgress();
  return articleSlug in progress.articlesRead;
}

export function getArticlesReadForDomain(domainId: number): string[] {
  const progress = getProgress();
  const prefix = `${domainId}-`;
  return Object.keys(progress.articlesRead).filter(slug => slug.startsWith(prefix));
}

export function markLabCompleted(labSlug: string, score?: number): void {
  const progress = getProgress();
  progress.labsCompleted[labSlug] = {
    completedAt: new Date().toISOString(),
    score,
  };
  saveProgress(progress);
}

export function addReviewScore(key: string, score: number, total: number): void {
  const progress = getProgress();
  if (!progress.reviewScores[key]) {
    progress.reviewScores[key] = [];
  }
  progress.reviewScores[key].push({
    score,
    total,
    date: new Date().toISOString(),
  });

  // Update weak areas based on recent scores
  updateWeakAreas(progress);
  saveProgress(progress);
}

function updateWeakAreas(progress: Progress): void {
  const weakThreshold = 0.7; // 70% correct
  const weakAreas: string[] = [];

  for (const [key, scores] of Object.entries(progress.reviewScores)) {
    const recentScores = scores.slice(-3); // Last 3 attempts
    const avgScore = recentScores.reduce((sum, s) => sum + s.score / s.total, 0) / recentScores.length;

    if (avgScore < weakThreshold) {
      weakAreas.push(key);
    }
  }

  progress.weakAreas = weakAreas;
}

export function getOverallProgress(): {
  totalArticles: number;
  readArticles: number;
  totalLabs: number;
  completedLabs: number;
  averageScore: number;
} {
  const progress = getProgress();
  const domains = getDomains();

  // Derive totals from actual domain data
  const totalArticles = domains.reduce((sum, d) => sum + d.tasks.length, 0);
  const totalLabs = domains.reduce(
    (sum, d) => sum + d.tasks.filter(t => t.labSlug).length,
    0
  );

  const readArticles = Object.keys(progress.articlesRead).length;
  const completedLabs = Object.keys(progress.labsCompleted).length;

  const allScores = Object.values(progress.reviewScores).flat();
  const averageScore = allScores.length > 0
    ? allScores.reduce((sum, s) => sum + s.score / s.total, 0) / allScores.length * 100
    : 0;

  return {
    totalArticles,
    readArticles,
    totalLabs,
    completedLabs,
    averageScore: Math.round(averageScore),
  };
}

export function resetProgress(): void {
  saveProgress(getDefaultProgress());
}

export function markQuestionCompleted(questionId: string, correct: boolean): void {
  const progress = getProgress();
  if (!progress.questionsCompleted) {
    progress.questionsCompleted = {};
  }
  progress.questionsCompleted[questionId] = {
    completedAt: new Date().toISOString(),
    correct,
  };
  saveProgress(progress);
}

export function isQuestionCompleted(questionId: string): boolean {
  const progress = getProgress();
  return !!(progress.questionsCompleted && questionId in progress.questionsCompleted);
}

export function getQuestionCompletion(questionId: string): { completedAt: string; correct: boolean } | null {
  const progress = getProgress();
  return progress.questionsCompleted?.[questionId] || null;
}

export function getCompletedQuestionsCount(): { total: number; correct: number } {
  const progress = getProgress();
  if (!progress.questionsCompleted) {
    return { total: 0, correct: 0 };
  }
  const questions = Object.values(progress.questionsCompleted);
  return {
    total: questions.length,
    correct: questions.filter(q => q.correct).length,
  };
}
