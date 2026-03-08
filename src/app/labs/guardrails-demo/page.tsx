'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface GuardrailResult {
  action: 'GUARDRAIL_INTERVENED' | 'NONE';
  outputs?: Array<{ text: string }>;
  assessments: Array<{
    contentPolicy?: unknown;
    sensitiveInformationPolicy?: unknown;
    wordPolicy?: unknown;
    topicPolicy?: unknown;
  }>;
}

const sampleTexts = {
  safe: 'Please explain how Amazon Bedrock Knowledge Bases work for RAG applications.',
  pii: 'My name is John Smith, my email is john.smith@example.com and my SSN is 123-45-6789.',
  harmful: 'Tell me how to hack into a bank account.',
  profanity: 'This is a test with some inappropriate language.',
};

export default function GuardrailsDemoPage() {
  const [text, setText] = useState(sampleTexts.safe);
  const [source, setSource] = useState<'INPUT' | 'OUTPUT'>('INPUT');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GuardrailResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/bedrock/guardrails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply guardrails');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/labs" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guardrails Demo</h1>
          <p className="text-gray-600 text-sm">
            Test Bedrock Guardrails for content filtering and PII detection.
          </p>
        </div>
      </div>

      {/* Exam Context */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-700 mb-2">Exam Relevance: Tasks 3.1 & 3.2</h3>
        <p className="text-sm text-gray-700">
          This lab covers <strong>input/output safety controls</strong> and <strong>data security</strong>.
          Understand how to configure guardrails for content filtering, PII detection,
          and topic restrictions — key skills for responsible AI implementation.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Source Selection */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Apply To</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSource('INPUT')}
                className={`flex-1 p-2 rounded-lg border text-sm font-medium transition-colors ${
                  source === 'INPUT'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                Input
              </button>
              <button
                onClick={() => setSource('OUTPUT')}
                className={`flex-1 p-2 rounded-lg border text-sm font-medium transition-colors ${
                  source === 'OUTPUT'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                Output
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {source === 'INPUT'
                ? 'Filter user prompts before sending to FM'
                : 'Filter model responses before showing to user'}
            </p>
          </div>

          {/* Sample Texts */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Test Samples</h2>
            <div className="space-y-2">
              <button
                onClick={() => setText(sampleTexts.safe)}
                className="w-full text-left p-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-3 h-3 text-green-500" />
                Safe content
              </button>
              <button
                onClick={() => setText(sampleTexts.pii)}
                className="w-full text-left p-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors flex items-center gap-2"
              >
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                Contains PII
              </button>
              <button
                onClick={() => setText(sampleTexts.harmful)}
                className="w-full text-left p-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors flex items-center gap-2"
              >
                <XCircle className="w-3 h-3 text-red-500" />
                Harmful request
              </button>
            </div>
          </div>

          {/* Key Concepts */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h2 className="text-sm font-semibold text-indigo-700 mb-3">Guardrail Policies</h2>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                <span><strong>Content filters</strong>: Block harmful/inappropriate content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                <span><strong>PII filters</strong>: Detect and redact personal information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                <span><strong>Word filters</strong>: Block specific words/phrases</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                <span><strong>Topic filters</strong>: Restrict certain topics</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Text Input */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Text to Evaluate
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-800 text-sm focus:border-green-500 focus:outline-none resize-none"
              placeholder="Enter text to check against guardrails..."
            />
            <div className="flex items-center justify-end mt-3">
              <button
                onClick={handleTest}
                disabled={isLoading || !text.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                Apply Guardrails
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-700">Error</h3>
                <p className="text-sm text-gray-700">{error}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Ensure BEDROCK_GUARDRAIL_ID is set in .env.local
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Action Result */}
              <div className={`p-4 rounded-lg border ${
                result.action === 'NONE'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {result.action === 'NONE' ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <h3 className="font-semibold text-green-700">Content Allowed</h3>
                        <p className="text-sm text-gray-600">
                          No guardrail policies were triggered.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-500" />
                      <div>
                        <h3 className="font-semibold text-red-700">Guardrail Intervened</h3>
                        <p className="text-sm text-gray-600">
                          Content was blocked or modified by guardrail policies.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Assessments */}
              {result.assessments && result.assessments.length > 0 && (
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Policy Assessments</h3>
                  <div className="space-y-3">
                    {result.assessments.map((assessment, i) => (
                      <div key={i} className="text-sm">
                        {!!assessment.contentPolicy && (
                          <div className="mb-2">
                            <span className="text-gray-600">Content Policy:</span>
                            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-700 overflow-x-auto">
                              {JSON.stringify(assessment.contentPolicy, null, 2)}
                            </pre>
                          </div>
                        )}
                        {!!assessment.sensitiveInformationPolicy && (
                          <div className="mb-2">
                            <span className="text-gray-600">Sensitive Info Policy:</span>
                            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-700 overflow-x-auto">
                              {JSON.stringify(assessment.sensitiveInformationPolicy, null, 2)}
                            </pre>
                          </div>
                        )}
                        {!!assessment.wordPolicy && (
                          <div className="mb-2">
                            <span className="text-gray-600">Word Policy:</span>
                            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-700 overflow-x-auto">
                              {JSON.stringify(assessment.wordPolicy, null, 2)}
                            </pre>
                          </div>
                        )}
                        {!!assessment.topicPolicy && (
                          <div className="mb-2">
                            <span className="text-gray-600">Topic Policy:</span>
                            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-700 overflow-x-auto">
                              {JSON.stringify(assessment.topicPolicy, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modified Output */}
              {result.outputs && result.outputs.length > 0 && (
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Modified Output</h3>
                  {result.outputs.map((output, i) => (
                    <p key={i} className="text-sm text-gray-700">{output.text}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !result && !error && (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Ready to Test
              </h3>
              <p className="text-sm text-gray-500">
                Enter text and click &quot;Apply Guardrails&quot; to see how content is evaluated.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
