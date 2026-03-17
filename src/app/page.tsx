import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
              href="/learn"
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
        </div>
      </section>

      {/* Domains Section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Exam Domains</h2>

        <div className="space-y-2">
          {domains.map(domain => (
            <Link
              key={domain.id}
              href={`/learn/${domain.id}`}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-gray-400 w-8">D{domain.id}</span>
                <span className="text-gray-800">{domain.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-500">{domain.weight}%</span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
