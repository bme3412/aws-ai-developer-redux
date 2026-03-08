import servicesData from '@/data/services.json';
import { ServiceInfo } from '@/types/article';

export function getServices(): ServiceInfo[] {
  return servicesData.services as ServiceInfo[];
}

export function getService(name: string): ServiceInfo | undefined {
  return getServices().find(s => s.name === name);
}

export function getServicesByCategory(category: string): ServiceInfo[] {
  return getServices().filter(s => s.category === category);
}

export function getServicesForTask(taskId: string): ServiceInfo[] {
  return getServices().filter(s => s.relatedTasks.includes(taskId));
}

export function getCategories(): string[] {
  const categories = new Set(getServices().map(s => s.category));
  return Array.from(categories);
}

export function getServiceIcon(category: string): string {
  const icons: Record<string, string> = {
    'AI/ML': 'brain',
    'Compute': 'cpu',
    'Containers': 'box',
    'Storage': 'database',
    'Database': 'table',
    'Analytics': 'bar-chart',
    'App Integration': 'git-merge',
    'Networking': 'globe',
    'Security': 'shield',
    'DevOps': 'git-branch',
    'Hybrid': 'cloud',
  };
  return icons[category] || 'box';
}
