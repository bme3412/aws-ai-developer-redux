import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDomain, getPriorityColor, getPriorityBgColor } from '@/lib/domains';
import { BookOpen, FlaskConical, ArrowRight, ArrowLeft } from 'lucide-react';

interface DomainPageProps {
  params: Promise<{ domainId: string }>;
}

export default async function DomainPage({ params }: DomainPageProps) {
  const { domainId } = await params;
  const domain = getDomain(parseInt(domainId));

  if (!domain) {
    notFound();
  }

  const priorityColor = getPriorityColor(domain.priority);
  const bgColor = getPriorityBgColor(domain.priority);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/learn" className="hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Learn
        </Link>
        <span>/</span>
        <span className="text-gray-700">Domain {domain.id}</span>
      </div>

      {/* Domain Header */}
      <div className={`rounded-lg border p-6 mb-8 ${bgColor}`}>
        <div className="flex items-center gap-4 mb-4">
          <span className={`text-3xl font-bold ${priorityColor}`}>D{domain.id}</span>
          <div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColor} bg-white`}>
              {domain.weight}% of exam
            </span>
            <span className="text-gray-600 text-sm ml-2">
              ~{domain.estimatedQuestions} questions
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{domain.name}</h1>
        <p className="text-gray-600">
          {domain.priority === 'critical' && 'Critical priority — focus heavily on this domain for your retake.'}
          {domain.priority === 'high' && 'High priority — solid understanding needed.'}
          {domain.priority === 'medium' && 'Medium priority — ensure foundational knowledge.'}
        </p>
      </div>

      {/* Tasks */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks & Topics</h2>
      <div className="space-y-4">
        {domain.tasks.map((task, index) => (
          <div
            key={task.id}
            className="rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors"
          >
            <Link
              href={`/learn/${domain.id}/${task.articleSlug}`}
              className="flex items-start gap-4 p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-gray-600">{index + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">Task {task.id}</span>
                  {task.labSlug && (
                    <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded flex items-center gap-1">
                      <FlaskConical className="w-3 h-3" />
                      Lab Available
                    </span>
                  )}
                </div>
                <h3 className="text-base font-medium text-gray-800 mb-2">
                  {task.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {task.skills.slice(0, 3).map(skill => (
                    <span
                      key={skill.id}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {skill.id}
                    </span>
                  ))}
                  {task.skills.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                      +{task.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
            </Link>

            {/* Skills Preview */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">Key skills covered:</p>
              <ul className="space-y-1">
                {task.skills.slice(0, 3).map(skill => (
                  <li key={skill.id} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span className="line-clamp-1">{skill.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
        {domain.id > 1 ? (
          <Link
            href={`/learn/${domain.id - 1}`}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Domain {domain.id - 1}
          </Link>
        ) : (
          <div />
        )}
        {domain.id < 5 ? (
          <Link
            href={`/learn/${domain.id + 1}`}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Domain {domain.id + 1}
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return [
    { domainId: '1' },
    { domainId: '2' },
    { domainId: '3' },
    { domainId: '4' },
    { domainId: '5' },
  ];
}
