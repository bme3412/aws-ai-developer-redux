'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calculator,
  DollarSign,
  Zap,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';

// Model pricing data (per 1K tokens, on-demand)
const models = [
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    inputPrice: 0.003,
    outputPrice: 0.015,
    contextWindow: 200000,
    speedTier: 'medium',
    qualityTier: 'high',
    useCase: 'Complex reasoning, code generation, analysis',
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    inputPrice: 0.0008,
    outputPrice: 0.004,
    contextWindow: 200000,
    speedTier: 'fast',
    qualityTier: 'medium',
    useCase: 'Chat, quick tasks, high-volume processing',
  },
  {
    id: 'nova-pro',
    name: 'Nova Pro',
    provider: 'Amazon',
    inputPrice: 0.0008,
    outputPrice: 0.0032,
    contextWindow: 300000,
    speedTier: 'fast',
    qualityTier: 'medium',
    useCase: 'General purpose, cost-effective',
  },
  {
    id: 'nova-lite',
    name: 'Nova Lite',
    provider: 'Amazon',
    inputPrice: 0.00006,
    outputPrice: 0.00024,
    contextWindow: 300000,
    speedTier: 'very-fast',
    qualityTier: 'basic',
    useCase: 'Simple tasks, summarization, classification',
  },
  {
    id: 'nova-micro',
    name: 'Nova Micro',
    provider: 'Amazon',
    inputPrice: 0.000035,
    outputPrice: 0.00014,
    contextWindow: 128000,
    speedTier: 'very-fast',
    qualityTier: 'basic',
    useCase: 'Text-only, lowest latency tasks',
  },
  {
    id: 'llama-3-1-70b',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    inputPrice: 0.00099,
    outputPrice: 0.00099,
    contextWindow: 128000,
    speedTier: 'medium',
    qualityTier: 'high',
    useCase: 'Open-weight alternative, customizable',
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    inputPrice: 0.004,
    outputPrice: 0.012,
    contextWindow: 128000,
    speedTier: 'medium',
    qualityTier: 'high',
    useCase: 'Multilingual, code, reasoning',
  },
];

// Optimization strategies
const optimizationStrategies = [
  {
    id: 'prompt-caching',
    name: 'Prompt Caching',
    savings: '90% on cached input',
    description: 'Cache repeated system prompts and examples. Cached tokens cost ~10% of regular input tokens.',
    applicability: 'High-volume apps with consistent system prompts',
    examTip: 'Prompt caching reduces cost for repeated prefixes. Know when it applies.',
  },
  {
    id: 'model-tiering',
    name: 'Model Tiering',
    savings: '60-90% on simple queries',
    description: 'Route simple queries to cheaper models (Nova Micro/Lite), complex ones to capable models (Sonnet).',
    applicability: 'Mixed workloads with varying complexity',
    examTip: 'Exam tests understanding of when to use different model tiers.',
  },
  {
    id: 'response-streaming',
    name: 'Response Streaming',
    savings: 'Time-to-first-token',
    description: 'Stream responses to improve perceived latency. Same cost, better UX.',
    applicability: 'User-facing chat applications',
    examTip: 'Streaming doesn\'t reduce cost but improves user experience metrics.',
  },
  {
    id: 'batch-inference',
    name: 'Batch Inference',
    savings: '50% cost reduction',
    description: 'Process non-urgent workloads in batches. Lower priority = lower cost.',
    applicability: 'Background processing, bulk analysis',
    examTip: 'Batch inference offers 50% discount but has higher latency.',
  },
  {
    id: 'provisioned-throughput',
    name: 'Provisioned Throughput',
    savings: 'Predictable costs at scale',
    description: 'Reserve capacity for consistent pricing. Better for high, predictable volumes.',
    applicability: 'Production workloads with predictable traffic',
    examTip: 'Provisioned = committed capacity. On-demand = pay per use. Know the trade-offs.',
  },
];

export default function CostCalculatorPage() {
  const [inputTokens, setInputTokens] = useState(1000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [requestsPerDay, setRequestsPerDay] = useState(1000);
  const [selectedModel, setSelectedModel] = useState('claude-3-5-haiku');
  const [showStrategies, setShowStrategies] = useState(true);
  const [promptCachingEnabled, setPromptCachingEnabled] = useState(false);
  const [cachedTokenPercent, setCachedTokenPercent] = useState(50);

  const selectedModelData = models.find(m => m.id === selectedModel)!;

  const costs = useMemo(() => {
    const inputCostPer1K = selectedModelData.inputPrice;
    const outputCostPer1K = selectedModelData.outputPrice;

    // Calculate with/without caching
    let effectiveInputCost = inputCostPer1K;
    if (promptCachingEnabled) {
      const cachedRatio = cachedTokenPercent / 100;
      effectiveInputCost = (inputCostPer1K * 0.1 * cachedRatio) + (inputCostPer1K * (1 - cachedRatio));
    }

    const costPerRequest = (inputTokens / 1000) * effectiveInputCost + (outputTokens / 1000) * outputCostPer1K;
    const dailyCost = costPerRequest * requestsPerDay;
    const monthlyCost = dailyCost * 30;

    // Compare with other models
    const comparisons = models.map(m => {
      let modelInputCost = m.inputPrice;
      if (promptCachingEnabled) {
        const cachedRatio = cachedTokenPercent / 100;
        modelInputCost = (m.inputPrice * 0.1 * cachedRatio) + (m.inputPrice * (1 - cachedRatio));
      }
      const cost = (inputTokens / 1000) * modelInputCost + (outputTokens / 1000) * m.outputPrice;
      return {
        ...m,
        costPerRequest: cost,
        dailyCost: cost * requestsPerDay,
        monthlyCost: cost * requestsPerDay * 30,
      };
    }).sort((a, b) => a.monthlyCost - b.monthlyCost);

    return {
      perRequest: costPerRequest,
      daily: dailyCost,
      monthly: monthlyCost,
      comparisons,
    };
  }, [inputTokens, outputTokens, requestsPerDay, selectedModelData, promptCachingEnabled, cachedTokenPercent]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/labs" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-amber-500" />
            Cost Calculator
          </h1>
          <p className="text-gray-600 text-sm">
            Estimate Bedrock costs and explore optimization strategies.
          </p>
        </div>
      </div>

      {/* Exam Context */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-700 mb-2">Exam Relevance: Domain 4</h3>
        <p className="text-sm text-gray-700">
          This lab covers <strong>Task 4.1</strong>: Cost optimization strategies including token economics,
          model selection, prompt caching, batch inference, and provisioned throughput decisions.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="space-y-6">
          {/* Model Selection */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Select Model</h2>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Input:</span>
                <span className="font-mono">${selectedModelData.inputPrice}/1K tokens</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">Output:</span>
                <span className="font-mono">${selectedModelData.outputPrice}/1K tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Context:</span>
                <span className="font-mono">{(selectedModelData.contextWindow / 1000)}K tokens</span>
              </div>
              <p className="mt-2 text-gray-600 italic">{selectedModelData.useCase}</p>
            </div>
          </div>

          {/* Token Inputs */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Request Parameters</h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-gray-600">Input Tokens (per request)</label>
                  <span className="text-xs font-mono text-gray-700">{inputTokens.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="50000"
                  step="100"
                  value={inputTokens}
                  onChange={(e) => setInputTokens(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>100</span>
                  <span>50K</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-gray-600">Output Tokens (per request)</label>
                  <span className="text-xs font-mono text-gray-700">{outputTokens.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="4000"
                  step="50"
                  value={outputTokens}
                  onChange={(e) => setOutputTokens(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>50</span>
                  <span>4K</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-gray-600">Requests per Day</label>
                  <span className="text-xs font-mono text-gray-700">{requestsPerDay.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100000"
                  step="10"
                  value={requestsPerDay}
                  onChange={(e) => setRequestsPerDay(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>10</span>
                  <span>100K</span>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt Caching Toggle */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Prompt Caching</h2>
              <button
                onClick={() => setPromptCachingEnabled(!promptCachingEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  promptCachingEnabled ? 'bg-amber-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  promptCachingEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {promptCachingEnabled && (
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-gray-600">Cached Token %</label>
                  <span className="text-xs font-mono text-gray-700">{cachedTokenPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={cachedTokenPercent}
                  onChange={(e) => setCachedTokenPercent(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Cached tokens cost ~10% of regular input tokens.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cost Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
              <DollarSign className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                ${costs.perRequest.toFixed(4)}
              </div>
              <div className="text-xs text-gray-500">per request</div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
              <Zap className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                ${costs.daily.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">per day</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-center">
              <TrendingDown className="w-5 h-5 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-700">
                ${costs.monthly.toFixed(0)}
              </div>
              <div className="text-xs text-amber-600">per month</div>
            </div>
          </div>

          {/* Model Comparison Table */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Model Cost Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-600 font-medium">Model</th>
                    <th className="text-right py-2 px-2 text-gray-600 font-medium">Per Request</th>
                    <th className="text-right py-2 px-2 text-gray-600 font-medium">Monthly</th>
                    <th className="text-center py-2 px-2 text-gray-600 font-medium">Speed</th>
                    <th className="text-center py-2 px-2 text-gray-600 font-medium">Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.comparisons.map((m, i) => (
                    <tr
                      key={m.id}
                      className={`border-b border-gray-100 ${m.id === selectedModel ? 'bg-amber-50' : ''}`}
                    >
                      <td className="py-2 px-2">
                        <div className="font-medium text-gray-800">{m.name}</div>
                        <div className="text-xs text-gray-500">{m.provider}</div>
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-gray-700">
                        ${m.costPerRequest.toFixed(4)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        <span className={i === 0 ? 'text-green-600 font-semibold' : 'text-gray-700'}>
                          ${m.monthlyCost.toFixed(0)}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          m.speedTier === 'very-fast' ? 'bg-green-100 text-green-700' :
                          m.speedTier === 'fast' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {m.speedTier}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          m.qualityTier === 'high' ? 'bg-purple-100 text-purple-700' :
                          m.qualityTier === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {m.qualityTier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Prices shown are on-demand rates. Batch inference is 50% less. Provisioned throughput varies.
            </p>
          </div>

          {/* Optimization Strategies */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={() => setShowStrategies(!showStrategies)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-white">Cost Optimization Strategies</span>
              </div>
              {showStrategies ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showStrategies && (
              <div className="p-4 pt-0 space-y-3">
                {optimizationStrategies.map(strategy => (
                  <div key={strategy.id} className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-white">{strategy.name}</h4>
                      <span className="text-xs text-green-400">{strategy.savings}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{strategy.description}</p>
                    <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                      <span className="text-blue-400 text-xs font-semibold shrink-0">EXAM:</span>
                      <p className="text-xs text-gray-300">{strategy.examTip}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
