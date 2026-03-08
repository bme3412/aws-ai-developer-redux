import domainsData from '@/data/domains.json';
import { Domain, DomainProgress } from '@/types/domain';

export function getDomains(): Domain[] {
  return domainsData.domains as Domain[];
}

export function getDomain(id: number): Domain | undefined {
  return getDomains().find(d => d.id === id);
}

export function getTask(domainId: number, taskId: string) {
  const domain = getDomain(domainId);
  return domain?.tasks.find(t => t.id === taskId);
}

export function getAllTasks() {
  return getDomains().flatMap(d => d.tasks.map(t => ({ ...t, domainId: d.id })));
}

export function getSkill(domainId: number, skillId: string) {
  const domain = getDomain(domainId);
  for (const task of domain?.tasks || []) {
    const skill = task.skills.find(s => s.id === skillId);
    if (skill) return { ...skill, taskId: task.id };
  }
  return undefined;
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'text-red-600';
    case 'high': return 'text-amber-600';
    case 'medium': return 'text-green-600';
    default: return 'text-gray-600';
  }
}

export function getPriorityBgColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-red-50 border-red-200';
    case 'high': return 'bg-amber-50 border-amber-200';
    case 'medium': return 'bg-green-50 border-green-200';
    default: return 'bg-gray-50 border-gray-200';
  }
}

export function calculateDomainProgress(domainId: number, progress: any): DomainProgress {
  const domain = getDomain(domainId);
  if (!domain) {
    return {
      domainId,
      articlesCompleted: 0,
      articlesTotal: 0,
      labsCompleted: 0,
      labsTotal: 0,
      averageReviewScore: 0,
    };
  }

  const articlesTotal = domain.tasks.length;
  const labsTotal = domain.tasks.filter(t => t.labSlug).length;

  const articlesCompleted = domain.tasks.filter(t =>
    progress?.articlesRead?.[`${domainId}-${t.articleSlug}`]
  ).length;

  const labsCompleted = domain.tasks.filter(t =>
    t.labSlug && progress?.labsCompleted?.[t.labSlug]
  ).length;

  const domainScores = progress?.reviewScores?.[`domain-${domainId}`] || [];
  const averageReviewScore = domainScores.length > 0
    ? domainScores.reduce((sum: number, s: any) => sum + (s.score / s.total), 0) / domainScores.length * 100
    : 0;

  return {
    domainId,
    articlesCompleted,
    articlesTotal,
    labsCompleted,
    labsTotal,
    averageReviewScore: Math.round(averageReviewScore),
  };
}
