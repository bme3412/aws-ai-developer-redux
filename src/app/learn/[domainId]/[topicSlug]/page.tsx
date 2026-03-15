'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getDomain } from '@/lib/domains';
import { getTopicContent } from '@/lib/content';
import { getService } from '@/lib/services';
import { markArticleRead } from '@/lib/progress';
import { TopicContent } from '@/types/article';
import ConceptSection from '@/components/learn/ConceptSection';
import SkillCard from '@/components/learn/SkillCard';
import ServiceComparison from '@/components/learn/ServiceComparison';
import ExamStrategy from '@/components/learn/ExamStrategy';
import KeyTakeaways from '@/components/learn/KeyTakeaways';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  FlaskConical,
  CheckCircle,
  Lightbulb,
  Loader2,
} from 'lucide-react';

export default function TopicPage() {
  const params = useParams();
  const domainId = parseInt(params.domainId as string);
  const topicSlug = params.topicSlug as string;

  const [startTime] = useState(Date.now());
  const [isMarkedComplete, setIsMarkedComplete] = useState(false);
  const [content, setContent] = useState<TopicContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const domain = getDomain(domainId);
  const task = domain?.tasks.find(t => t.articleSlug === topicSlug);

  const currentIndex = domain?.tasks.findIndex(t => t.articleSlug === topicSlug) ?? -1;
  const prevTask = currentIndex > 0 ? domain?.tasks[currentIndex - 1] : null;
  const nextTask = currentIndex < (domain?.tasks.length ?? 0) - 1 ? domain?.tasks[currentIndex + 1] : null;

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true);
      const topicContent = await getTopicContent(domainId, topicSlug);
      setContent(topicContent);
      setIsLoading(false);
    }
    loadContent();
  }, [domainId, topicSlug]);

  const handleMarkComplete = () => {
    const timeSpent = Math.round((Date.now() - startTime) / 60000);
    markArticleRead(`${domainId}-${topicSlug}`, Math.max(timeSpent, 1));
    setIsMarkedComplete(true);
  };

  if (!domain || !task) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-gray-600">Topic not found.</p>
      </div>
    );
  }

  // Get unique services for this task
  const serviceNames = Array.from(new Set(task.skills.flatMap(s => s.services)));

  // Helper to find skill description by ID
  const getSkillDescription = (skillId: string) => {
    const skill = task.skills.find(s => s.id === skillId);
    return skill?.description || '';
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/learn" className="hover:text-gray-700">Learn</Link>
        <span>/</span>
        <Link href={`/learn/${domainId}`} className="hover:text-gray-700">
          Domain {domainId}
        </Link>
        <span>/</span>
        <span className="text-gray-700">Task {task.id}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
            Task {task.id}
          </span>
          <span className="flex items-center gap-1 text-gray-500 text-sm">
            <Clock className="w-4 h-4" />
            ~{content?.overview.estimatedMinutes || 25} min
          </span>
          {task.labSlug && (
            <Link
              href={`/labs/${task.labSlug}`}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 text-xs rounded hover:bg-amber-100 transition-colors"
            >
              <FlaskConical className="w-3 h-3" />
              Open Lab
            </Link>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.name}</h1>
        <p className="text-gray-600">
          Domain {domainId}: {domain.name}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : content ? (
        <article className="space-y-8">
          {/* Why It Matters */}
          <section>
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-blue-800 mb-2">Why This Matters</h2>
                <p className="text-gray-700 leading-relaxed">{content.overview.whyItMatters}</p>
              </div>
            </div>
          </section>

          {/* Core Concepts */}
          {content.concepts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Core Concepts</h2>
              {content.concepts.map((concept) => (
                <ConceptSection key={concept.id} concept={concept} />
              ))}
            </section>
          )}

          {/* Service Decision Guide - Tables */}
          {content.serviceComparisons && content.serviceComparisons.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Decision Guide</h2>
              <div className="space-y-6">
                {content.serviceComparisons.map((comparison, index) => (
                  <ServiceComparison key={index} comparison={comparison} />
                ))}
              </div>
            </section>
          )}

          {/* Skills Breakdown */}
          {content.skillExplanations.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills Breakdown</h2>
              {content.skillExplanations.map(skill => (
                <SkillCard
                  key={skill.skillId}
                  skill={skill}
                  skillDescription={getSkillDescription(skill.skillId)}
                />
              ))}
            </section>
          )}

          {/* Exam Question Strategies */}
          {content.examStrategies.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Exam Question Patterns
              </h3>
              <div className="space-y-4">
                {content.examStrategies.map((strategy, index) => (
                  <ExamStrategy key={index} strategy={strategy} />
                ))}
              </div>
            </section>
          )}

          {/* Key Takeaways & Common Mistakes */}
          <section>
            <KeyTakeaways
              takeaways={content.keyTakeaways}
              commonMistakes={content.commonMistakes}
            />
          </section>
        </article>
      ) : (
        <>
          {/* Fallback: Original placeholder content */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Skills Covered</h2>
            <ul className="space-y-2">
              {task.skills.map(skill => (
                <li key={skill.id} className="flex items-start gap-3">
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded font-mono">
                    {skill.id}
                  </span>
                  <span className="text-sm text-gray-700">{skill.description}</span>
                </li>
              ))}
            </ul>
          </div>

          <article className="prose max-w-none mb-8">
            <h2>Why This Matters</h2>
            <p>
              This section explains the importance of {task.name.toLowerCase()} in the context of
              AWS GenAI applications. Understanding these concepts is crucial for the exam,
              as this domain accounts for {domain.weight}% of the total score.
            </p>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg my-4">
              <p className="text-sm text-gray-700 m-0">
                <strong className="text-amber-700">Exam Tip:</strong> When encountering questions about {task.name.toLowerCase()}, pay close attention
                to the specific AWS services mentioned and the architectural patterns described.
                The exam often tests your ability to choose the right service for a given scenario.
              </p>
            </div>
          </article>

          {/* AWS Services Cards */}
          <h2 className="text-xl font-bold text-gray-900 mb-4">AWS Services</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {serviceNames.slice(0, 6).map(serviceName => {
              const service = getService(serviceName);
              return (
                <div
                  key={serviceName}
                  className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg"
                >
                  <h3 className="font-semibold text-indigo-900 mb-1">{serviceName}</h3>
                  {service ? (
                    <>
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      <p className="text-xs text-indigo-600">
                        <strong>Exam relevance:</strong> {service.examRelevance}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Service information loading...</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Review Questions Link */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-8 mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-green-800 mb-1 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Ready to Test Your Knowledge?
            </h3>
            <p className="text-sm text-gray-600">
              Practice with exam-style questions covering Task {task.id} skills.
            </p>
          </div>
          <Link
            href={`/review?domain=${domainId}&task=${task.id}`}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Practice Questions
          </Link>
        </div>
      </div>

      {/* Mark Complete */}
      <div className="flex items-center justify-center mb-8">
        <button
          onClick={handleMarkComplete}
          disabled={isMarkedComplete}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isMarkedComplete
              ? 'bg-green-100 text-green-600 cursor-default'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          <CheckCircle className={`w-5 h-5 ${isMarkedComplete ? 'text-green-600' : ''}`} />
          {isMarkedComplete ? 'Marked as Complete' : 'Mark as Complete'}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-8 border-t border-gray-200">
        {prevTask ? (
          <Link
            href={`/learn/${domainId}/${prevTask.articleSlug}`}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <div className="text-left">
              <div className="text-xs text-gray-500">Previous</div>
              <div className="text-sm">{prevTask.name}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextTask ? (
          <Link
            href={`/learn/${domainId}/${nextTask.articleSlug}`}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <div className="text-right">
              <div className="text-xs text-gray-500">Next</div>
              <div className="text-sm">{nextTask.name}</div>
            </div>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href={`/learn/${domainId + 1}`}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <div className="text-right">
              <div className="text-xs text-gray-500">Next Domain</div>
              <div className="text-sm">Domain {domainId + 1}</div>
            </div>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
