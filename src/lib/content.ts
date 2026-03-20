import { TopicContent } from '@/types/article';
import { Question } from '@/types/review';

// Content cache to avoid re-importing
const contentCache = new Map<string, TopicContent>();
const questionCache = new Map<number, Question[]>();

export async function getTopicContent(
  domainId: number,
  topicSlug: string
): Promise<TopicContent | null> {
  const cacheKey = `${domainId}-${topicSlug}`;

  if (contentCache.has(cacheKey)) {
    return contentCache.get(cacheKey)!;
  }

  try {
    // Dynamic import from content directory
    const content = await import(`@/data/content/domain-${domainId}/${topicSlug}.json`);
    const topicContent = content.default as TopicContent;
    contentCache.set(cacheKey, topicContent);
    return topicContent;
  } catch {
    // Content not yet created for this topic
    return null;
  }
}

export async function getDomainQuestions(domainId: number): Promise<Question[]> {
  if (questionCache.has(domainId)) {
    return questionCache.get(domainId)!;
  }

  try {
    const data = await import(`@/data/questions/domain-${domainId}.json`);
    const questions = data.default.questions as Question[];
    questionCache.set(domainId, questions);
    return questions;
  } catch {
    return [];
  }
}

export async function getQuestionsByTask(
  domainId: number,
  taskId: string
): Promise<Question[]> {
  const questions = await getDomainQuestions(domainId);
  return questions.filter(q => q.task === taskId);
}

export async function getQuestionsBySkill(
  domainId: number,
  skillId: string
): Promise<Question[]> {
  const questions = await getDomainQuestions(domainId);
  return questions.filter(q => q.skills.includes(skillId));
}

export async function getAllQuestions(): Promise<Question[]> {
  const allQuestions: Question[] = [];

  for (let domainId = 1; domainId <= 5; domainId++) {
    const domainQuestions = await getDomainQuestions(domainId);
    allQuestions.push(...domainQuestions);
  }

  return allQuestions;
}

// Shuffle questions for practice sessions
export function shuffleQuestions(questions: Question[]): Question[] {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Filter questions by difficulty
export function filterByDifficulty(
  questions: Question[],
  difficulties: Array<'easy' | 'medium' | 'hard'>
): Question[] {
  return questions.filter(q => difficulties.includes(q.difficulty));
}

// Domain weights for exam simulation (must sum to 100)
const EXAM_WEIGHTS = {
  1: 31, // 31% - ~20 questions
  2: 26, // 26% - ~17 questions
  3: 20, // 20% - ~13 questions
  4: 12, // 12% - ~8 questions
  5: 11, // 11% - ~7 questions
};

// Generate a weighted practice exam (65 questions by default)
export async function generatePracticeExam(totalQuestions: number = 65): Promise<{
  questions: Question[];
  breakdown: { domainId: number; count: number; weight: number }[];
}> {
  const breakdown: { domainId: number; count: number; weight: number }[] = [];
  const examQuestions: Question[] = [];

  // Calculate questions per domain based on weights
  let remaining = totalQuestions;
  const domainCounts: Record<number, number> = {};

  for (let domainId = 1; domainId <= 5; domainId++) {
    const weight = EXAM_WEIGHTS[domainId as keyof typeof EXAM_WEIGHTS];
    // Round, but ensure at least 1 question per domain
    let count = Math.round((weight / 100) * totalQuestions);
    if (domainId === 5) {
      // Last domain gets the remainder to ensure exact total
      count = remaining;
    }
    domainCounts[domainId] = count;
    remaining -= count;
  }

  // Fetch and select questions from each domain
  for (let domainId = 1; domainId <= 5; domainId++) {
    const domainQuestions = await getDomainQuestions(domainId);
    const count = domainCounts[domainId];
    const weight = EXAM_WEIGHTS[domainId as keyof typeof EXAM_WEIGHTS];

    // Shuffle and take the required count
    const shuffled = shuffleQuestions(domainQuestions);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    examQuestions.push(...selected);
    breakdown.push({ domainId, count: selected.length, weight });
  }

  // Final shuffle of all exam questions
  return {
    questions: shuffleQuestions(examQuestions),
    breakdown,
  };
}

// Analyze question coverage gaps
export async function analyzeQuestionCoverage(): Promise<{
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
}> {
  const { getDomains } = await import('./domains');
  const domains = getDomains();
  const analysisResults = [];
  let totalQuestions = 0;
  const criticalGaps: string[] = [];

  for (const domain of domains) {
    const questions = await getDomainQuestions(domain.id);
    totalQuestions += questions.length;

    // Count questions per task
    const taskQuestionCounts: Record<string, number> = {};
    questions.forEach(q => {
      taskQuestionCounts[q.task] = (taskQuestionCounts[q.task] || 0) + 1;
    });

    // Analyze each task
    const taskAnalysis = domain.tasks.map(task => {
      const questionCount = taskQuestionCounts[task.id] || 0;

      // Check which skills have questions
      const skillAnalysis = task.skills.map(skill => {
        const hasQuestions = questions.some(q => q.skills.includes(skill.id));
        return {
          skillId: skill.id,
          description: skill.description,
          hasQuestions,
        };
      });

      return {
        taskId: task.id,
        taskName: task.name,
        questionCount,
        skills: skillAnalysis,
      };
    });

    // Identify gaps
    const gaps: string[] = [];
    taskAnalysis.forEach(task => {
      if (task.questionCount === 0) {
        gaps.push(`Task ${task.taskId}: No questions`);
        if (domain.priority === 'critical') {
          criticalGaps.push(`Domain ${domain.id} Task ${task.taskId}: ${task.taskName}`);
        }
      } else if (task.questionCount < 3) {
        gaps.push(`Task ${task.taskId}: Only ${task.questionCount} question(s)`);
      }

      // Check for skills without questions
      const missingSkills = task.skills.filter(s => !s.hasQuestions);
      if (missingSkills.length > 0) {
        gaps.push(`Task ${task.taskId}: ${missingSkills.length} skill(s) without questions`);
      }
    });

    // Target questions based on weight (65 exam questions * weight%)
    const targetQuestions = Math.round((domain.weight / 100) * 65 * 3); // 3x for good coverage

    analysisResults.push({
      domainId: domain.id,
      name: domain.name,
      weight: domain.weight,
      totalQuestions: questions.length,
      targetQuestions,
      tasks: taskAnalysis,
      gaps,
    });
  }

  // Calculate overall coverage
  const totalTarget = 65 * 3; // 3x coverage target
  const coveragePercent = Math.round((totalQuestions / totalTarget) * 100);

  return {
    domains: analysisResults,
    summary: {
      totalQuestions,
      coveragePercent: Math.min(coveragePercent, 100),
      criticalGaps,
    },
  };
}
