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
}

export interface Skill {
  id: string;
  description: string;
  services: string[];
}

export interface Progress {
  articlesRead: Record<string, { completedAt: string; timeSpentMinutes: number }>;
  labsCompleted: Record<string, { completedAt: string; score?: number }>;
  reviewScores: Record<string, { score: number; total: number; date: string }[]>;
  weakAreas: string[];
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
