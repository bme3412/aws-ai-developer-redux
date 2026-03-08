export interface ArticleFrontmatter {
  domain: number;
  task: string;
  title: string;
  skills: string[];
  services: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  prerequisites?: string[];
  examWeight: 'low' | 'medium' | 'high';
}

export interface Article {
  slug: string;
  frontmatter: ArticleFrontmatter;
  content: string;
}

export interface ServiceInfo {
  name: string;
  category: string;
  description: string;
  examRelevance: string;
  relatedTasks: string[];
}

// Topic Content Types for Enhanced Learning

export interface TopicContent {
  topicSlug: string;
  domainId: number;
  taskId: string;

  overview: {
    whyItMatters: string;
    estimatedMinutes: number;
  };

  concepts: ConceptSection[];
  skillExplanations: SkillExplanation[];
  serviceComparisons?: ServiceComparison[];
  examStrategies: ExamStrategy[];
  keyTakeaways: string[];
  commonMistakes: string[];
}

export interface ConceptSection {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  examTip?: string;
}

export interface SkillExplanation {
  skillId: string;
  explanation: string;
  awsServices: ServiceContext[];
  codeExample?: CodeExample;
}

export interface ServiceContext {
  serviceName: string;
  whenToUse: string;
  examKeywords: string[];
}

export interface ServiceComparison {
  title: string;
  services: string[];
  criteria: ComparisonCriterion[];
}

export interface ComparisonCriterion {
  criterion: string;
  values: Record<string, string>;
}

export interface ExamStrategy {
  questionPattern: string;
  approach: string;
  keywords: string[];
}

export interface CodeExample {
  language: string;
  title: string;
  code: string;
  explanation: string;
}
