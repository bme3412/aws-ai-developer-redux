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
