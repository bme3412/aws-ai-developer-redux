import { Progress } from '@/types/domain';
import { Question } from '@/types/review';
import { getDomains } from './domains';

// ---------- Types ----------

export interface OverallStats {
  totalAttempted: number;
  totalCorrect: number;
  accuracyRate: number;
  uniqueQuestionsAttempted: number;
  totalQuestions: number;
  coveragePercent: number;
  sessionsCompleted: number;
  estimatedReadiness: number;
}

export interface DomainStat {
  domainId: number;
  domainName: string;
  weight: number;
  attempted: number;
  correct: number;
  accuracy: number;
  totalQuestions: number;
  coverage: number;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient-data';
}

export interface TaskStat {
  taskId: string;
  taskName: string;
  domainId: number;
  attempted: number;
  correct: number;
  accuracy: number;
  totalQuestions: number;
}

export interface DifficultyBreakdown {
  easy: { attempted: number; correct: number; accuracy: number };
  medium: { attempted: number; correct: number; accuracy: number };
  hard: { attempted: number; correct: number; accuracy: number };
}

export interface AccuracyDataPoint {
  date: string;
  accuracy: number;
  count: number;
}

export interface Recommendation {
  type: 'weak-domain' | 'weak-task' | 'uncovered' | 'difficulty-gap';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: { label: string; href: string };
}

// ---------- Helpers ----------

function questionDomain(qId: string): number {
  const match = qId.match(/^d(\d+)-/);
  return match ? parseInt(match[1]) : 0;
}

function latestAttemptMap(progress: Progress): Map<string, boolean> {
  const map = new Map<string, boolean>();
  if (progress.questionsCompleted) {
    for (const [id, data] of Object.entries(progress.questionsCompleted)) {
      map.set(id, data.correct);
    }
  }
  return map;
}

// ---------- Core Analytics ----------

export function getOverallStats(progress: Progress, allQuestions: Question[]): OverallStats {
  const completed = latestAttemptMap(progress);
  const uniqueQuestionsAttempted = completed.size;
  const totalCorrect = [...completed.values()].filter(Boolean).length;
  const totalQuestions = allQuestions.length;
  const coveragePercent = totalQuestions > 0 ? Math.round((uniqueQuestionsAttempted / totalQuestions) * 100) : 0;
  const accuracyRate = uniqueQuestionsAttempted > 0 ? Math.round((totalCorrect / uniqueQuestionsAttempted) * 100) : 0;
  const sessionsCompleted = (progress.practiceSessions ?? []).filter(s => s.completedAt).length;

  // Readiness: 60% weighted accuracy + 30% coverage + 10% session experience
  const domains = getDomains();
  let weightedAccuracy = 0;
  for (const domain of domains) {
    const domainQuestions = allQuestions.filter(q => q.domain === domain.id);
    const domainCompleted = domainQuestions.filter(q => completed.has(q.id));
    const domainCorrect = domainCompleted.filter(q => completed.get(q.id)).length;
    const domainAccuracy = domainCompleted.length > 0 ? domainCorrect / domainCompleted.length : 0;
    weightedAccuracy += domainAccuracy * (domain.weight / 100);
  }

  const sessionFactor = Math.min(sessionsCompleted / 10, 1);
  const estimatedReadiness = Math.round(
    weightedAccuracy * 60 + (coveragePercent / 100) * 30 + sessionFactor * 10
  );

  return {
    totalAttempted: uniqueQuestionsAttempted,
    totalCorrect,
    accuracyRate,
    uniqueQuestionsAttempted,
    totalQuestions,
    coveragePercent,
    sessionsCompleted,
    estimatedReadiness,
  };
}

export function getDomainStats(progress: Progress, allQuestions: Question[]): DomainStat[] {
  const completed = latestAttemptMap(progress);
  const domains = getDomains();
  const attempts = progress.questionAttempts ?? [];

  return domains.map(domain => {
    const domainQuestions = allQuestions.filter(q => q.domain === domain.id);
    const domainAttempted = domainQuestions.filter(q => completed.has(q.id));
    const correct = domainAttempted.filter(q => completed.get(q.id)).length;
    const attempted = domainAttempted.length;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const coverage = domainQuestions.length > 0 ? Math.round((attempted / domainQuestions.length) * 100) : 0;

    // Trend: compare last 10 vs previous 10 attempts for this domain
    const domainAttemptLog = attempts.filter(a => questionDomain(a.questionId) === domain.id);
    let trend: DomainStat['trend'] = 'insufficient-data';
    if (domainAttemptLog.length >= 10) {
      const recent = domainAttemptLog.slice(-10);
      const previous = domainAttemptLog.slice(-20, -10);
      const recentAcc = recent.filter(a => a.correct).length / recent.length;
      if (previous.length >= 5) {
        const prevAcc = previous.filter(a => a.correct).length / previous.length;
        const diff = recentAcc - prevAcc;
        trend = diff > 0.05 ? 'improving' : diff < -0.05 ? 'declining' : 'stable';
      }
    }

    return {
      domainId: domain.id,
      domainName: domain.name,
      weight: domain.weight,
      attempted,
      correct,
      accuracy,
      totalQuestions: domainQuestions.length,
      coverage,
      trend,
    };
  });
}

export function getTaskStats(progress: Progress, allQuestions: Question[], domainId: number): TaskStat[] {
  const completed = latestAttemptMap(progress);
  const domain = getDomains().find(d => d.id === domainId);
  if (!domain) return [];

  return domain.tasks.map(task => {
    const taskQuestions = allQuestions.filter(q =>
      q.domain === domainId && (q.task === task.id || q.skills.includes(task.id))
    );
    const attempted = taskQuestions.filter(q => completed.has(q.id));
    const correct = attempted.filter(q => completed.get(q.id)).length;

    return {
      taskId: task.id,
      taskName: task.name,
      domainId,
      attempted: attempted.length,
      correct,
      accuracy: attempted.length > 0 ? Math.round((correct / attempted.length) * 100) : 0,
      totalQuestions: taskQuestions.length,
    };
  });
}

export function getDifficultyStats(progress: Progress, allQuestions: Question[]): DifficultyBreakdown {
  const completed = latestAttemptMap(progress);
  const qMap = new Map(allQuestions.map(q => [q.id, q]));

  const buckets = { easy: { attempted: 0, correct: 0 }, medium: { attempted: 0, correct: 0 }, hard: { attempted: 0, correct: 0 } };
  for (const [id, correct] of completed) {
    const q = qMap.get(id);
    if (q && buckets[q.difficulty]) {
      buckets[q.difficulty].attempted++;
      if (correct) buckets[q.difficulty].correct++;
    }
  }

  return {
    easy: { ...buckets.easy, accuracy: buckets.easy.attempted > 0 ? Math.round((buckets.easy.correct / buckets.easy.attempted) * 100) : 0 },
    medium: { ...buckets.medium, accuracy: buckets.medium.attempted > 0 ? Math.round((buckets.medium.correct / buckets.medium.attempted) * 100) : 0 },
    hard: { ...buckets.hard, accuracy: buckets.hard.attempted > 0 ? Math.round((buckets.hard.correct / buckets.hard.attempted) * 100) : 0 },
  };
}

export function getAccuracyTrend(progress: Progress): AccuracyDataPoint[] {
  const attempts = progress.questionAttempts ?? [];

  // Fall back to questionsCompleted if no questionAttempts exist
  const dataSource = attempts.length > 0
    ? attempts.map(a => ({ timestamp: a.timestamp, correct: a.correct }))
    : Object.values(progress.questionsCompleted ?? {}).map(q => ({
        timestamp: q.completedAt,
        correct: q.correct,
      }));

  if (dataSource.length === 0) return [];

  const byDate = new Map<string, { correct: number; total: number }>();
  for (const a of dataSource) {
    const date = a.timestamp.slice(0, 10);
    const entry = byDate.get(date) || { correct: 0, total: 0 };
    entry.total++;
    if (a.correct) entry.correct++;
    byDate.set(date, entry);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { correct, total }]) => ({
      date,
      accuracy: Math.round((correct / total) * 100),
      count: total,
    }));
}

export function getRecommendations(
  domainStats: DomainStat[],
  difficultyStats: DifficultyBreakdown,
  overallStats: OverallStats
): Recommendation[] {
  const recs: Recommendation[] = [];

  // No data yet
  if (overallStats.totalAttempted === 0) {
    recs.push({
      type: 'uncovered',
      priority: 'high',
      title: 'Start practicing',
      description: 'Answer some practice questions to get personalized recommendations.',
      action: { label: 'Start Practice', href: '/review?mode=practice' },
    });
    return recs;
  }

  // Weak high-weight domains
  const sorted = [...domainStats].sort((a, b) => (b.weight - a.weight));
  for (const ds of sorted) {
    if (ds.attempted >= 5 && ds.accuracy < 70) {
      recs.push({
        type: 'weak-domain',
        priority: ds.weight >= 20 ? 'high' : 'medium',
        title: `Strengthen Domain ${ds.domainId}`,
        description: `${ds.accuracy}% accuracy on a domain worth ${ds.weight}% of the exam.`,
        action: { label: 'Practice Domain', href: `/review?domain=${ds.domainId}&mode=practice` },
      });
    }
    if (recs.length >= 4) break;
  }

  // Uncovered domains
  for (const ds of sorted) {
    if (ds.attempted === 0 && recs.length < 4) {
      recs.push({
        type: 'uncovered',
        priority: ds.weight >= 20 ? 'high' : 'medium',
        title: `Start Domain ${ds.domainId}`,
        description: `You haven't practiced any questions in this ${ds.weight}%-weight domain yet.`,
        action: { label: 'Start Practice', href: `/review?domain=${ds.domainId}&mode=practice` },
      });
    }
  }

  // Difficulty gap
  if (difficultyStats.easy.attempted >= 5 && difficultyStats.hard.attempted >= 3) {
    const gap = difficultyStats.easy.accuracy - difficultyStats.hard.accuracy;
    if (gap > 25 && recs.length < 4) {
      recs.push({
        type: 'difficulty-gap',
        priority: 'medium',
        title: 'Try Hard Mode',
        description: `Easy: ${difficultyStats.easy.accuracy}% vs Hard: ${difficultyStats.hard.accuracy}%. Challenge yourself with harder questions.`,
        action: { label: 'Hard Mode', href: '/review?mode=hard' },
      });
    }
  }

  return recs.slice(0, 4);
}

// ---------- Smart Practice Helpers ----------

export function getWeakAreaQuestions(progress: Progress, allQuestions: Question[]): Question[] {
  const completed = latestAttemptMap(progress);

  // Per-domain accuracy
  const domainAccuracy = new Map<number, { correct: number; total: number }>();
  for (const [id, correct] of completed) {
    const d = questionDomain(id);
    const entry = domainAccuracy.get(d) || { correct: 0, total: 0 };
    entry.total++;
    if (correct) entry.correct++;
    domainAccuracy.set(d, entry);
  }

  const weakDomains = new Set<number>();
  for (const [d, stats] of domainAccuracy) {
    if (stats.total >= 3 && (stats.correct / stats.total) < 0.7) {
      weakDomains.add(d);
    }
  }

  // Also include unattempted domains
  const domains = getDomains();
  for (const domain of domains) {
    if (!domainAccuracy.has(domain.id)) {
      weakDomains.add(domain.id);
    }
  }

  // If no weak areas found, fall back to all questions
  if (weakDomains.size === 0) return allQuestions;

  return allQuestions.filter(q => weakDomains.has(q.domain));
}

export function selectAdaptiveQuestions(
  allQuestions: Question[],
  progress: Progress,
  count: number
): Question[] {
  const attempts = progress.questionAttempts ?? [];
  const recent = attempts.slice(-20);
  const recentAccuracy = recent.length > 0 ? recent.filter(a => a.correct).length / recent.length : 0.5;

  // Set difficulty distribution based on recent performance
  let easyPct: number, medPct: number, hardPct: number;
  if (recentAccuracy > 0.8) {
    easyPct = 0.15; medPct = 0.35; hardPct = 0.5;
  } else if (recentAccuracy > 0.6) {
    easyPct = 0.25; medPct = 0.5; hardPct = 0.25;
  } else {
    easyPct = 0.5; medPct = 0.35; hardPct = 0.15;
  }

  const easy = shuffleArray(allQuestions.filter(q => q.difficulty === 'easy'));
  const medium = shuffleArray(allQuestions.filter(q => q.difficulty === 'medium'));
  const hard = shuffleArray(allQuestions.filter(q => q.difficulty === 'hard'));

  const easyCount = Math.round(count * easyPct);
  const hardCount = Math.round(count * hardPct);
  const medCount = count - easyCount - hardCount;

  const selected = [
    ...easy.slice(0, easyCount),
    ...medium.slice(0, medCount),
    ...hard.slice(0, hardCount),
  ];

  // Fill remaining if any bucket was short
  const selectedIds = new Set(selected.map(q => q.id));
  const remaining = shuffleArray(allQuestions.filter(q => !selectedIds.has(q.id)));
  while (selected.length < count && remaining.length > 0) {
    selected.push(remaining.pop()!);
  }

  return shuffleArray(selected).slice(0, count);
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
