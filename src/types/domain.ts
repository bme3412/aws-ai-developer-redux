export interface Domain {
  id: number;
  name: string;
  shortName: string;
  weight: number;
  priority: 'critical' | 'high' | 'medium';
  estimatedQuestions: number;
  tasks: Task[];
}

export interface Task {
  id: string;
  name: string;
  skills: Skill[];
  articleSlug: string;
  labSlug?: string;
  /** Extra study article that is not an official AIP-C01 task ID. */
  supplemental?: boolean;
}

export interface Skill {
  id: string;
  description: string;
  services: string[];
}

export interface QuestionAttempt {
  questionId: string;
  correct: boolean;
  timestamp: string;
  sessionId: string;
}

export type PracticeMode = 'practice' | 'quick' | 'full' | 'all' | 'exam' | 'weak-areas' | 'hard' | 'adaptive';

export interface PracticeSession {
  id: string;
  mode: PracticeMode;
  startedAt: string;
  completedAt?: string;
  domainFilter?: number;
  taskFilter?: string;
  results: Record<string, boolean>;
  score?: number;
  total?: number;
}

export interface Progress {
  articlesRead: Record<string, { completedAt: string; timeSpentMinutes: number }>;
  labsCompleted: Record<string, { completedAt: string; score?: number }>;
  reviewScores: Record<string, { score: number; total: number; date: string }[]>;
  weakAreas: string[];
  questionsCompleted?: Record<string, { completedAt: string; correct: boolean }>;
  questionAttempts?: QuestionAttempt[];
  practiceSessions?: PracticeSession[];
}

export interface DomainProgress {
  domainId: number;
  articlesCompleted: number;
  articlesTotal: number;
  labsCompleted: number;
  labsTotal: number;
  averageReviewScore: number;
  lastStudied?: string;
}
