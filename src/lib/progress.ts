import { Progress, PracticeMode } from '@/types/domain';
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
    skillsCompleted: {},
  };
}

export function markArticleRead(articleSlug: string, timeSpentMinutes: number): string {
  const progress = getProgress();
  const completedAt = new Date().toISOString();
  progress.articlesRead[articleSlug] = {
    completedAt,
    timeSpentMinutes,
  };
  saveProgress(progress);
  return completedAt;
}

export function getArticleCompletion(articleKey: string): { completedAt: string; timeSpentMinutes: number } | null {
  return getProgress().articlesRead[articleKey] ?? null;
}

export function getArticleCompletionMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(getProgress().articlesRead)) {
    map[key] = value.completedAt;
  }
  return map;
}

export function isArticleRead(articleSlug: string): boolean {
  const progress = getProgress();
  return articleSlug in progress.articlesRead;
}

export function unmarkArticleRead(articleSlug: string): void {
  const progress = getProgress();
  delete progress.articlesRead[articleSlug];
  saveProgress(progress);
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

export function startPracticeSession(
  mode: PracticeMode,
  questionIds: string[],
  domainFilter?: number,
  taskFilter?: string
): string {
  const progress = getProgress();
  if (!progress.practiceSessions) progress.practiceSessions = [];

  const sessionId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  progress.practiceSessions.push({
    id: sessionId,
    mode,
    startedAt: new Date().toISOString(),
    domainFilter,
    taskFilter,
    results: {},
  });

  if (progress.practiceSessions.length > 100) {
    progress.practiceSessions = progress.practiceSessions.slice(-100);
  }

  saveProgress(progress);
  return sessionId;
}

export function recordQuestionAttempt(
  sessionId: string,
  questionId: string,
  correct: boolean
): void {
  const progress = getProgress();
  if (!progress.questionAttempts) progress.questionAttempts = [];

  progress.questionAttempts.push({
    questionId,
    correct,
    timestamp: new Date().toISOString(),
    sessionId,
  });

  const session = progress.practiceSessions?.find(s => s.id === sessionId);
  if (session) {
    session.results[questionId] = correct;
  }

  if (progress.questionAttempts.length > 5000) {
    progress.questionAttempts = progress.questionAttempts.slice(-5000);
  }

  saveProgress(progress);
}

export function completePracticeSession(sessionId: string): void {
  const progress = getProgress();
  const session = progress.practiceSessions?.find(s => s.id === sessionId);
  if (session) {
    session.completedAt = new Date().toISOString();
    const results = Object.values(session.results);
    session.total = results.length;
    session.score = results.filter(Boolean).length;
  }
  saveProgress(progress);
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

export function markSkillComplete(skillId: string): string {
  const progress = getProgress();
  if (!progress.skillsCompleted) progress.skillsCompleted = {};
  const completedAt = new Date().toISOString();
  progress.skillsCompleted[skillId] = { completedAt };
  saveProgress(progress);
  return completedAt;
}

export function unmarkSkillComplete(skillId: string): void {
  const progress = getProgress();
  if (!progress.skillsCompleted) return;
  delete progress.skillsCompleted[skillId];
  saveProgress(progress);
}

export function getSkillCompletion(skillId: string): { completedAt: string } | null {
  const progress = getProgress();
  return progress.skillsCompleted?.[skillId] ?? null;
}

export function isSkillComplete(skillId: string): boolean {
  return getSkillCompletion(skillId) !== null;
}

export function getSkillCompletionMap(): Record<string, string> {
  const progress = getProgress();
  const map: Record<string, string> = {};
  for (const [id, value] of Object.entries(progress.skillsCompleted ?? {})) {
    map[id] = value.completedAt;
  }
  return map;
}

export function countCompletedSkills(skillIds: string[]): number {
  const progress = getProgress();
  return skillIds.filter((id) => progress.skillsCompleted?.[id]).length;
}

export function formatSkillCompletedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
