'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  Loader2,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface PromptResult {
  technique: string;
  response: string;
  latencyMs: number;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

const techniques = [
  {
    id: 'zero-shot',
    name: 'Zero-Shot',
    description: 'Direct prompting without examples',
  },
  {
    id: 'few-shot',
    name: 'Few-Shot',
    description: 'Provide examples to guide the response format',
  },
  {
    id: 'chain-of-thought',
    name: 'Chain-of-Thought',
    description: 'Ask the model to reason step by step',
  },
  {
    id: 'structured-output',
    name: 'Structured Output',
    description: 'Request response in a specific JSON format',
  },
];

const defaultExamples = [
  { input: 'Classify: "I love this product!"', output: 'positive' },
  { input: 'Classify: "This is terrible."', output: 'negative' },
];

const defaultSchema = {
  sentiment: 'positive | negative | neutral',
  confidence: 'number between 0 and 1',
  keywords: ['array of key terms'],
};

export default function PromptLabPage() {
  const [prompt, setPrompt] = useState('What are the main differences between Amazon Bedrock and Amazon SageMaker?');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AWS solutions architect.');
  const [technique, setTechnique] = useState('zero-shot');
  const [temperature, setTemperature] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PromptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Few-shot examples
  const [examples] = useState(defaultExamples);

  // Structured output schema
  const [schema] = useState(defaultSchema);

  const handleRun = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const params: Record<string, unknown> = {
        temperature,
        maxTokens: 1024,
      };

      if (technique === 'few-shot') {
        params.examples = examples;
      }

      if (technique === 'structured-output') {
        params.schema = schema;
      }

      const response = await fetch('/api/bedrock/prompt-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemPrompt: systemPrompt || undefined,
          technique,
          params,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute prompt');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.response) {
      navigator.clipboard.writeText(result.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/labs" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prompt Engineering Lab</h1>
          <p className="text-gray-600 text-sm">
            Experiment with different prompting techniques.
          </p>
        </div>
      </div>

      {/* Exam Context */}
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h3 className="font-semibold text-purple-700 mb-2">Exam Relevance: Task 1.6</h3>
        <p className="text-sm text-gray-700">
          This lab covers <strong>prompt engineering strategies</strong>. Master zero-shot, few-shot,
          chain-of-thought, and structured output techniques — all tested on the exam.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Technique Selection */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Technique</h2>
            <div className="space-y-2">
              {techniques.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTechnique(t.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    technique === t.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Parameters</h2>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-600">Temperature</label>
                <span className="text-xs text-gray-700">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-2">
                Lower = more deterministic, Higher = more creative
              </p>
            </div>
          </div>

          {/* Technique Info */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h2 className="text-sm font-semibold text-indigo-700 mb-3">
              {techniques.find(t => t.id === technique)?.name} Details
            </h2>
            <div className="text-xs text-gray-600 space-y-2">
              {technique === 'zero-shot' && (
                <p>Direct prompting without examples. Good for simple, well-defined tasks where the model&apos;s general knowledge is sufficient.</p>
              )}
              {technique === 'few-shot' && (
                <p>Provide input-output examples to guide the model. Useful for classification, formatting, or style matching tasks.</p>
              )}
              {technique === 'chain-of-thought' && (
                <p>Ask the model to reason step-by-step before answering. Improves accuracy on complex reasoning tasks.</p>
              )}
              {technique === 'structured-output' && (
                <p>Request response in a specific format (JSON, XML). Enables reliable parsing for downstream processing.</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Prompt */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              System Prompt <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-800 text-sm focus:border-purple-500 focus:outline-none"
              placeholder="Set the assistant's role and behavior..."
            />
          </div>

          {/* User Prompt */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Prompt</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-800 text-sm focus:border-purple-500 focus:outline-none resize-none"
              placeholder="Enter your prompt..."
            />

            {/* Technique-specific preview */}
            {technique === 'chain-of-thought' && (
              <p className="text-xs text-gray-500 mt-2">
                Will add: &quot;Think through this step-by-step before providing your final answer.&quot;
              </p>
            )}
            {technique === 'structured-output' && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Expected output format:</p>
                <pre className="text-xs bg-gray-50 p-2 rounded text-gray-600 overflow-x-auto">
                  {JSON.stringify(schema, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-end mt-3">
              <button
                onClick={handleRun}
                disabled={isLoading || !prompt.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Run
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
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  Response
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">
                    {result.latencyMs}ms • {result.usage.input_tokens}/{result.usage.output_tokens} tokens
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
                {result.response}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !result && !error && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Ready to Experiment
              </h3>
              <p className="text-sm text-gray-500">
                Select a technique, enter a prompt, and click &quot;Run&quot; to see the response.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
