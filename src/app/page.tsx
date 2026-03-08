import Link from 'next/link';
import { ArrowRight, BookOpen, FlaskConical, ClipboardCheck } from 'lucide-react';
import { DomainBadge } from '@/components/layout/DomainBadge';
import { getDomains } from '@/lib/domains';

export default function HomePage() {
  const domains = getDomains();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50" />
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-amber-100 border border-amber-200 rounded-full text-amber-700 text-sm font-medium">
              AIP-C01
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600 text-sm">Professional Level</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AWS Certified Generative AI Developer
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl">
            Master Amazon Bedrock, RAG architectures, agentic AI, and enterprise GenAI patterns.
            Interactive labs and exam-focused content.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              Start Studying
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/review"
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors border border-gray-300"
            >
              Practice Questions
            </Link>
          </div>

          {/* Exam Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-gray-900">65</div>
              <div className="text-sm text-gray-500">Questions</div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-gray-900">170</div>
              <div className="text-sm text-gray-500">Minutes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Domains Section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Exam Domains</h2>
            <p className="text-gray-600 mt-1">Focus on D1 + D2 for maximum impact (57% of exam)</p>
          </div>
          <Link
            href="/learn"
            className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1"
          >
            View All Topics <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map(domain => (
            <Link key={domain.id} href={`/learn/${domain.id}`}>
              <DomainBadge
                domainId={domain.id}
                name={domain.name}
                weight={domain.weight}
                priority={domain.priority}
                progress={0}
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-12 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Study Resources</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <BookOpen className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Concept Articles</h3>
            <p className="text-gray-600 text-sm mb-4">
              18 in-depth articles covering every task and skill in the exam guide.
              Exam tips and AWS service deep-dives included.
            </p>
            <Link href="/learn" className="text-blue-600 text-sm font-medium hover:text-blue-700">
              Start Learning →
            </Link>
          </div>

          <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <FlaskConical className="w-10 h-10 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Labs</h3>
            <p className="text-gray-600 text-sm mb-4">
              Hands-on labs with real Bedrock APIs. Compare models, build RAG,
              test guardrails, and create agents.
            </p>
            <Link href="/labs" className="text-amber-600 text-sm font-medium hover:text-amber-700">
              Open Labs →
            </Link>
          </div>

          <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <ClipboardCheck className="w-10 h-10 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Practice Questions</h3>
            <p className="text-gray-600 text-sm mb-4">
              Exam-style questions for each domain. Multiple choice, multiple response,
              ordering, and matching formats.
            </p>
            <Link href="/review" className="text-green-600 text-sm font-medium hover:text-green-700">
              Practice Now →
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
