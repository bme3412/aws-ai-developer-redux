'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getDomain } from '@/lib/domains';
import { markArticleRead } from '@/lib/progress';
import MarkdownArticle from '@/components/learn/MarkdownArticle';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  FlaskConical,
} from 'lucide-react';

export default function TopicPage() {
  const params = useParams();
  const domainId = parseInt(params.domainId as string);
  const topicSlug = params.topicSlug as string;

  const [startTime] = useState(Date.now());
  const [isMarkedComplete, setIsMarkedComplete] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const domain = getDomain(domainId);
  const task = domain?.tasks.find(t => t.articleSlug === topicSlug);

  const currentIndex = domain?.tasks.findIndex(t => t.articleSlug === topicSlug) ?? -1;
  const prevTask = currentIndex > 0 ? domain?.tasks[currentIndex - 1] : null;
  const nextTask = currentIndex < (domain?.tasks.length ?? 0) - 1 ? domain?.tasks[currentIndex + 1] : null;

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/content/${domainId}/${topicSlug}`);
        if (response.ok) {
          const data = await response.json();
          setMarkdown(data.content);
        } else {
          setError('Content not found');
        }
      } catch (err) {
        setError('Failed to load content');
      }

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

      {/* Lab link if available */}
      {task.labSlug && (
        <div className="mb-6">
          <Link
            href={`/labs/${task.labSlug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            Open Interactive Lab
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{error}</p>
        </div>
      ) : markdown ? (
        <MarkdownArticle content={markdown} />
      ) : null}

      {/* Practice Questions Link */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg my-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-green-800 mb-1">
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
