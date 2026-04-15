'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, BookOpen, Book, Cloud, Calendar, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { getDomains, getPriorityColor } from '@/lib/domains';
import { Domain } from '@/types/domain';

const resourceLinks = [
  { href: '/glossary', label: 'Glossary', icon: Book },
  { href: '/services', label: 'AWS Services', icon: Cloud },
  { href: '/study-plan', label: 'Study Plan', icon: Calendar },
  { href: '/exam-tips', label: 'Exam Tips', icon: Lightbulb },
];

interface SidebarProps {
  progress?: Record<string, number>;
}

export function Sidebar({ progress = {} }: SidebarProps) {
  const pathname = usePathname();
  const domains = getDomains();
  const [expandedDomains, setExpandedDomains] = useState<number[]>([1, 2]);

  const toggleDomain = (domainId: number) => {
    setExpandedDomains(prev =>
      prev.includes(domainId)
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    );
  };

  return (
    <aside className="w-72 border-r border-gray-200 bg-gray-50 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Study Guide
        </h2>

        <div className="space-y-2">
          {domains.map(domain => (
            <DomainSection
              key={domain.id}
              domain={domain}
              isExpanded={expandedDomains.includes(domain.id)}
              onToggle={() => toggleDomain(domain.id)}
              currentPath={pathname}
              progress={progress[`domain-${domain.id}`] || 0}
            />
          ))}
        </div>

        {/* Resources Section */}
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-8 mb-3">
          Resources
        </h2>
        <div className="space-y-1">
          {resourceLinks.map(link => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white shadow-sm border border-gray-200 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

interface DomainSectionProps {
  domain: Domain;
  isExpanded: boolean;
  onToggle: () => void;
  currentPath: string;
  progress: number;
}

function DomainSection({
  domain,
  isExpanded,
  onToggle,
  currentPath,
  progress,
}: DomainSectionProps) {
  const priorityColor = getPriorityColor(domain.priority);

  return (
    <div className="rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">D{domain.id}</span>
            <span className={`text-xs font-bold ${priorityColor}`}>{domain.weight}%</span>
          </div>
          <p className="text-xs text-gray-500 truncate">{domain.shortName}</p>
        </div>

        {/* Mini progress */}
        <div className="w-8 h-8 relative">
          <svg className="w-8 h-8 transform -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              strokeDasharray={`${progress * 0.754} 75.4`}
              className={priorityColor}
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-4">
          {domain.tasks.map(task => {
            const taskPath = `/learn/${domain.id}/${task.articleSlug}`;
            const isActive = currentPath === taskPath;

            return (
              <Link
                key={task.id}
                href={taskPath}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white shadow-sm border border-gray-200 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="flex-1 truncate">{task.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
