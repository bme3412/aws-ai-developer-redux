import Link from 'next/link';
import { getDomains } from '@/lib/domains';
import { DomainBadge } from '@/components/layout/DomainBadge';
import { BookOpen, ArrowRight } from 'lucide-react';

export default function LearnPage() {
  const domains = getDomains();

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Learn</h1>
          <p className="text-gray-600 mt-1">
            Concept articles organized by exam domain. Focus on D1 and D2 for maximum impact.
          </p>
        </div>

        {/* Domain Cards */}
        <div className="space-y-8">
          {domains.map(domain => (
            <div key={domain.id} className="rounded-lg border border-gray-200 overflow-hidden">
              {/* Domain Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <DomainBadge
                    domainId={domain.id}
                    name={domain.name}
                    weight={domain.weight}
                    priority={domain.priority}
                    compact
                  />
                  <span className="text-sm text-gray-500">
                    {domain.tasks.length} topics • ~{domain.estimatedQuestions} questions
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mt-3">{domain.name}</h2>
              </div>

              {/* Task List */}
              <div className="divide-y divide-gray-200 bg-white">
                {domain.tasks.map(task => (
                  <Link
                    key={task.id}
                    href={`/learn/${domain.id}/${task.articleSlug}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-100 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">Task {task.id}</span>
                        {task.labSlug && (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded">
                            Lab
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-gray-800 truncate">
                        {task.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {task.skills.length} skills • {task.skills.flatMap(s => s.services).filter((v, i, a) => a.indexOf(v) === i).length} services
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
