'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Loader2,
  Clock,
  DollarSign,
  Cpu,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Server,
  Globe,
  Key,
  Zap,
  BookOpen,
} from 'lucide-react';

interface ModelResult {
  model: string;
  modelId: string;
  text: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  error?: string;
}

const availableModels = [
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    color: 'amber',
    modelId: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
    inputPrice: '$0.003/1K',
    outputPrice: '$0.015/1K',
  },
  {
    id: 'claude-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    color: 'amber',
    modelId: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
    inputPrice: '$0.0008/1K',
    outputPrice: '$0.004/1K',
  },
  {
    id: 'nova-lite',
    name: 'Nova Lite',
    provider: 'Amazon',
    color: 'orange',
    modelId: 'us.amazon.nova-lite-v1:0',
    inputPrice: '$0.00006/1K',
    outputPrice: '$0.00024/1K',
  },
  {
    id: 'llama3',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    color: 'blue',
    modelId: 'us.meta.llama3-1-8b-instruct-v1:0',
    inputPrice: '$0.00022/1K',
    outputPrice: '$0.00022/1K',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    color: 'purple',
    modelId: 'us.deepseek.r1-v1:0',
    inputPrice: '$0.00135/1K',
    outputPrice: '$0.0054/1K',
  },
];

// AWS Under the Hood explanations
const awsExplanations = {
  idle: {
    title: 'How Bedrock Model Invocation Works',
    steps: [
      {
        icon: 'Key',
        title: 'Authentication',
        description: 'AWS SDK uses IAM credentials from environment variables or ~/.aws/credentials to sign requests with SigV4.',
      },
      {
        icon: 'Globe',
        title: 'Cross-Region Inference',
        description: 'Model IDs starting with "us." are inference profiles that route requests across multiple regions for better availability.',
      },
      {
        icon: 'Server',
        title: 'BedrockRuntimeClient',
        description: 'The SDK creates a client configured for your region. InvokeModel sends requests to the Bedrock Runtime API endpoint.',
      },
      {
        icon: 'Zap',
        title: 'On-Demand Pricing',
        description: 'You pay per token with no upfront commitment. Input tokens (your prompt) and output tokens (model response) are priced separately.',
      },
    ],
  },
  loading: {
    title: 'Request In Progress...',
    steps: [
      {
        icon: 'Key',
        title: '1. Signing Request',
        description: 'Adding AWS SigV4 signature to authenticate with Bedrock service.',
        active: true,
      },
      {
        icon: 'Globe',
        title: '2. Routing to Model',
        description: 'Cross-region inference profile selecting optimal endpoint.',
        active: true,
      },
      {
        icon: 'Cpu',
        title: '3. Model Processing',
        description: 'Foundation model tokenizing input and generating response.',
        active: true,
      },
      {
        icon: 'Zap',
        title: '4. Streaming Response',
        description: 'Receiving generated tokens and usage metrics.',
        active: false,
      },
    ],
  },
  results: {
    title: 'What Just Happened',
    apiCall: `// Actual AWS SDK call made:
const command = new InvokeModelCommand({
  modelId: 'us.anthropic.claude-3-5-haiku-...',
  contentType: 'application/json',
  accept: 'application/json',
  body: JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 512,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }]
  })
});

const response = await client.send(command);`,
    concepts: [
      {
        term: 'Input Tokens',
        explanation: 'Your prompt converted to tokens. ~4 characters per token on average. Billed at input rate.',
      },
      {
        term: 'Output Tokens',
        explanation: 'Model-generated tokens. Longer responses = more output tokens = higher cost.',
      },
      {
        term: 'Latency',
        explanation: 'Total round-trip time including network, queue wait, and model inference. Varies by model size and load.',
      },
      {
        term: 'Inference Profile',
        explanation: 'The "us." prefix enables cross-region routing. Bedrock automatically selects the best available endpoint.',
      },
    ],
  },
};

const samplePrompts = [
  'Explain the difference between semantic search and keyword search in 2-3 sentences.',
  'What are the key benefits of using Amazon Bedrock Knowledge Bases for RAG?',
  'Write a Python function to calculate the cosine similarity between two vectors.',
  'Compare provisioned throughput vs on-demand pricing for Bedrock.',
];

export default function BedrockPlaygroundPage() {
  const [prompt, setPrompt] = useState(samplePrompts[0]);
  const [selectedModels, setSelectedModels] = useState<string[]>(['claude-haiku', 'nova-lite']);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ModelResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUnderTheHood, setShowUnderTheHood] = useState(true);

  // Helper to get the right icon component
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Key: <Key className="w-4 h-4" />,
      Globe: <Globe className="w-4 h-4" />,
      Server: <Server className="w-4 h-4" />,
      Zap: <Zap className="w-4 h-4" />,
      Cpu: <Cpu className="w-4 h-4" />,
    };
    return icons[iconName] || <Server className="w-4 h-4" />;
  };

  // Determine which explanation state to show
  const getExplanationState = () => {
    if (isLoading) return 'loading';
    if (results.length > 0) return 'results';
    return 'idle';
  };

  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter(m => m !== modelId));
    } else if (selectedModels.length < 4) {
      setSelectedModels([...selectedModels, modelId]);
    }
  };

  const handleRun = async () => {
    if (!prompt.trim() || selectedModels.length === 0) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch('/api/bedrock/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          models: selectedModels,
          params: { temperature, maxTokens },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invoke models');
      }

      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/labs"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bedrock Playground</h1>
          <p className="text-gray-600 text-sm">
            Compare foundation models side-by-side. See latency, tokens, and cost differences.
          </p>
        </div>
      </div>

      {/* Exam Context */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-700 mb-2">Exam Relevance: Task 1.2</h3>
        <p className="text-sm text-gray-700">
          This lab helps you understand <strong>Skill 1.2.1</strong>: FM assessment including performance
          benchmarks, capability analysis, and limitation evaluation. Compare how different models
          respond to the same prompt to build intuition for model selection.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Model Selection */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Select Models (max 4)
            </h2>
            <div className="space-y-2">
              {availableModels.map(model => (
                <button
                  key={model.id}
                  onClick={() => toggleModel(model.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    selectedModels.includes(model.id)
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border ${
                    selectedModels.includes(model.id)
                      ? 'bg-amber-500 border-amber-500'
                      : 'border-gray-400'
                  } flex items-center justify-center`}>
                    {selectedModels.includes(model.id) && (
                      <Check className="w-3 h-3 text-gray-900" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-800">{model.name}</div>
                    <div className="text-xs text-gray-500">{model.provider}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Parameters</h2>

            <div className="space-y-4">
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
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-600">Max Tokens</label>
                  <span className="text-xs text-gray-700">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="128"
                  max="2048"
                  step="128"
                  value={maxTokens}
                  onChange={e => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Sample Prompts</h2>
            <div className="space-y-2">
              {samplePrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(p)}
                  className="w-full text-left p-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors line-clamp-2"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt Input */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Prompt</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-800 text-sm focus:border-amber-500 focus:outline-none resize-none"
              placeholder="Enter your prompt..."
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">
                {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleRun}
                disabled={isLoading || selectedModels.length === 0 || !prompt.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-semibold rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Run Comparison
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
                  Make sure AWS credentials are configured in .env.local and Bedrock model access is enabled.
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Results</h2>

              {/* Comparison Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Fastest</div>
                  <div className="text-sm font-medium text-green-600">
                    {results
                      .filter(r => !r.error)
                      .sort((a, b) => a.latencyMs - b.latencyMs)[0]?.model || '-'}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Cheapest</div>
                  <div className="text-sm font-medium text-green-600">
                    {results
                      .filter(r => !r.error)
                      .sort((a, b) => a.estimatedCost - b.estimatedCost)[0]?.model || '-'}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Most Tokens</div>
                  <div className="text-sm font-medium text-blue-600">
                    {results
                      .filter(r => !r.error)
                      .sort((a, b) => b.outputTokens - a.outputTokens)[0]?.model || '-'}
                  </div>
                </div>
              </div>

              {/* Individual Results */}
              <div className="grid md:grid-cols-2 gap-4">
                {results.map(result => {
                  const model = availableModels.find(m => m.id === result.model);

                  return (
                    <div
                      key={result.model}
                      className="p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">{model?.name || result.model}</h3>
                          <p className="text-xs text-gray-500">{model?.provider}</p>
                        </div>
                        {result.error ? (
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded">
                            Error
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded">
                            Success
                          </span>
                        )}
                      </div>

                      {result.error ? (
                        <p className="text-sm text-red-600">{result.error}</p>
                      ) : (
                        <>
                          {/* Metrics */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <Clock className="w-3.5 h-3.5 text-gray-500 mx-auto mb-1" />
                              <div className="text-xs text-gray-700">{result.latencyMs}ms</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <Cpu className="w-3.5 h-3.5 text-gray-500 mx-auto mb-1" />
                              <div className="text-xs text-gray-700">
                                {result.inputTokens}/{result.outputTokens}
                              </div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <DollarSign className="w-3.5 h-3.5 text-gray-500 mx-auto mb-1" />
                              <div className="text-xs text-gray-700">
                                ${result.estimatedCost.toFixed(5)}
                              </div>
                            </div>
                          </div>

                          {/* Response */}
                          <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 max-h-48 overflow-y-auto">
                            {result.text}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && results.length === 0 && !error && (
            <div className="text-center py-12">
              <Cpu className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Ready to Compare Models
              </h3>
              <p className="text-sm text-gray-500">
                Select models, enter a prompt, and click &quot;Run Comparison&quot; to see results.
              </p>
            </div>
          )}

          {/* Under the Hood - AWS Explanation Panel */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={() => setShowUnderTheHood(!showUnderTheHood)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-white">
                  Under the Hood: {awsExplanations[getExplanationState()].title}
                </span>
              </div>
              {showUnderTheHood ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showUnderTheHood && (
              <div className="p-4 pt-0 space-y-4">
                {/* Idle State - How it works */}
                {getExplanationState() === 'idle' && (
                  <div className="grid md:grid-cols-2 gap-3">
                    {awsExplanations.idle.steps.map((step, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400">
                          {getIcon(step.icon)}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">{step.title}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Loading State - Step by step */}
                {getExplanationState() === 'loading' && (
                  <div className="space-y-2">
                    {awsExplanations.loading.steps.map((step, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          step.active ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-slate-700/30'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          step.active ? 'bg-amber-500 text-slate-900' : 'bg-slate-600 text-gray-400'
                        }`}>
                          {step.active ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            getIcon(step.icon)
                          )}
                        </div>
                        <div>
                          <h4 className={`text-sm font-medium ${step.active ? 'text-amber-400' : 'text-gray-400'}`}>
                            {step.title}
                          </h4>
                          <p className="text-xs text-gray-500">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Results State - What happened + code */}
                {getExplanationState() === 'results' && (
                  <div className="space-y-4">
                    {/* API Call Code Block */}
                    <div>
                      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
                        AWS SDK Call
                      </h4>
                      <pre className="bg-slate-950 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto">
                        <code>{awsExplanations.results.apiCall}</code>
                      </pre>
                    </div>

                    {/* Concept Explanations */}
                    <div>
                      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
                        Key Concepts in Results
                      </h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {awsExplanations.results.concepts.map((concept, i) => (
                          <div key={i} className="p-2 bg-slate-700/50 rounded">
                            <span className="text-xs font-medium text-white">{concept.term}:</span>
                            <span className="text-xs text-gray-400 ml-1">{concept.explanation}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Selected Models Detail */}
                    {results.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
                          Models Used
                        </h4>
                        <div className="space-y-1">
                          {results.filter(r => !r.error).map(result => {
                            const model = availableModels.find(m => m.id === result.model);
                            return (
                              <div key={result.model} className="flex items-center justify-between p-2 bg-slate-700/50 rounded text-xs">
                                <div>
                                  <span className="text-white font-medium">{model?.name}</span>
                                  <span className="text-gray-500 ml-2">→</span>
                                  <code className="text-amber-400 ml-2">{model?.modelId}</code>
                                </div>
                                <div className="text-gray-400">
                                  {model?.inputPrice} in / {model?.outputPrice} out
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Exam Tip */}
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 text-xs font-semibold">EXAM TIP:</span>
                    <p className="text-xs text-gray-300">
                      {getExplanationState() === 'idle' &&
                        'Know the difference between BedrockClient (management operations) and BedrockRuntimeClient (model invocation). The exam tests API selection.'}
                      {getExplanationState() === 'loading' &&
                        'Cross-region inference profiles (us.* model IDs) provide higher availability but may have slightly higher latency. Use direct model IDs when you need region-specific deployment.'}
                      {getExplanationState() === 'results' &&
                        'Token counts determine cost. Understand that input and output tokens are priced differently—output tokens are typically 3-5x more expensive than input tokens.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
