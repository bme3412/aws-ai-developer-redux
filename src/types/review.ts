export type QuestionType = 'multiple-choice' | 'multiple-response' | 'ordering' | 'matching';

export interface Question {
  id: string;
  domain: number;
  task: string;
  skills: string[];
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';

  // Verbose scenario-based format (matching real exam)
  scenario?: string;              // Background context (50-100 words)
  question: string;               // Question stem

  options: QuestionOption[];
  correctAnswers: string[];

  // Enhanced explanations
  explanation: string;
  incorrectExplanations?: Record<string, string>;  // Why each wrong answer is wrong

  // Strategy guidance (revealed after answering)
  parseStrategy?: QuestionParseStrategy;

  services: string[];
  examTip?: string;

  // Article reference for article-specific questions
  articleReference?: string;
}

export interface QuestionParseStrategy {
  keyPhrase: string;              // What to look for in the question
  eliminationHints: string[];     // How to narrow down options
  decisionFramework: string;      // Mental model to apply
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface ReviewSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  domain?: number;
  task?: string;
  questions: string[];
  answers: Record<string, string[]>;
  score?: number;
}

export interface ReviewResult {
  questionId: string;
  correct: boolean;
  selectedAnswers: string[];
  correctAnswers: string[];
  timeSpentSeconds: number;
}
