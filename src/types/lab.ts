export interface Lab {
  id: string;
  title: string;
  description: string;
  domain: number;
  tasks: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  prerequisites?: string[];
  awsServicesUsed: string[];
}

export interface LabResult {
  labId: string;
  completedAt: string;
  score?: number;
  timeSpentMinutes: number;
  attempts: number;
}

export interface CodeExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  latencyMs: number;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
  estimatedCost?: number;
}
