'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  BarChart3,
  FlaskConical,
  Play,
  Loader2,
  RefreshCw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Target,
  Scale,
  AlertTriangle,
} from 'lucide-react';

// Sample evaluation scenarios
const evaluationScenarios = [
  {
    id: 'factual-qa',
    name: 'Factual Q&A',
    query: 'What is the capital of France?',
    context: 'France is a country in Western Europe. Its capital and largest city is Paris.',
    responses: [
      { model: 'Model A', text: 'The capital of France is Paris.', isCorrect: true },
      { model: 'Model B', text: 'The capital of France is Paris, which is also known as the City of Light.', isCorrect: true },
      { model: 'Model C', text: 'France\'s capital is Lyon, a major city in the southeast.', isCorrect: false },
    ],
    groundTruth: 'Paris',
    metrics: {
      correctAnswer: 'Paris',
      evaluationCriteria: ['Factual accuracy', 'Conciseness', 'Groundedness'],
    },
  },
  {
    id: 'summarization',
    name: 'Summarization',
    query: 'Summarize the key points.',
    context: 'Amazon Bedrock is a fully managed service that offers leading foundation models through a single API. It provides security, privacy, and responsible AI capabilities. You can customize models with your data using fine-tuning and RAG.',
    responses: [
      { model: 'Model A', text: 'Bedrock offers FMs via API with security and customization options.', isCorrect: true },
      { model: 'Model B', text: 'Amazon Bedrock is a service. It has models. You can use it.', isCorrect: false },
      { model: 'Model C', text: 'Bedrock provides managed access to foundation models with security features, customization through fine-tuning and RAG, all via a unified API.', isCorrect: true },
    ],
    groundTruth: 'Key points: managed service, multiple FMs, single API, security, customization',
    metrics: {
      evaluationCriteria: ['Completeness', 'Accuracy', 'Conciseness', 'No hallucination'],
    },
  },
  {
    id: 'rag-faithfulness',
    name: 'RAG Faithfulness',
    query: 'What pricing models does Bedrock support?',
    context: 'Amazon Bedrock supports on-demand pricing where you pay per token, and provisioned throughput for predictable workloads. Batch inference is available at 50% discount.',
    responses: [
      { model: 'Model A', text: 'Bedrock supports on-demand (pay per token), provisioned throughput, and batch inference at 50% discount.', isCorrect: true },
      { model: 'Model B', text: 'Bedrock offers on-demand, provisioned, batch, and also a free tier for testing.', isCorrect: false },
      { model: 'Model C', text: 'Pricing includes on-demand and provisioned options.', isCorrect: true },
    ],
    groundTruth: 'On-demand, provisioned throughput, batch inference (50% discount)',
    metrics: {
      evaluationCriteria: ['Faithfulness to context', 'No hallucination', 'Completeness'],
    },
  },
];

// RAG evaluation metrics explained
const ragMetrics = [
  {
    name: 'Context Precision',
    description: 'What fraction of retrieved documents are relevant?',
    formula: 'Relevant retrieved / Total retrieved',
    examTip: 'High precision = less noise in context. Measures retrieval quality.',
    example: 'Retrieved 5 docs, 4 relevant → Precision = 0.8',
  },
  {
    name: 'Context Recall',
    description: 'Did we find all the relevant documents?',
    formula: 'Relevant retrieved / Total relevant in corpus',
    examTip: 'High recall = didn\'t miss important info. Trade-off with precision.',
    example: '4 relevant docs exist, retrieved 3 → Recall = 0.75',
  },
  {
    name: 'Faithfulness',
    description: 'Is the answer grounded in the retrieved context?',
    formula: 'Claims supported by context / Total claims',
    examTip: 'Faithfulness catches hallucination. Critical for RAG quality.',
    example: '5 facts in answer, 4 from context → Faithfulness = 0.8',
  },
  {
    name: 'Answer Relevance',
    description: 'Does the answer address the actual question?',
    formula: 'LLM-as-Judge or semantic similarity to expected answer',
    examTip: 'Relevant answer may still be wrong. Combine with faithfulness.',
    example: 'Question about pricing, answer about pricing → High relevance',
  },
];

export default function EvaluationLabPage() {
  const [selectedScenario, setSelectedScenario] = useState(evaluationScenarios[0]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<Record<string, {
    score: number;
    verdict: string;
    reasoning: string;
  }> | null>(null);
  const [showMetricsGuide, setShowMetricsGuide] = useState(true);

  const runEvaluation = async () => {
    setIsEvaluating(true);
    setEvaluationResults(null);

    // Simulate LLM-as-Judge evaluation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const results: Record<string, { score: number; verdict: string; reasoning: string }> = {};
    selectedScenario.responses.forEach(response => {
      const isGood = response.isCorrect;
      results[response.model] = {
        score: isGood ? Math.random() * 0.2 + 0.8 : Math.random() * 0.3 + 0.3,
        verdict: isGood ? 'PASS' : 'FAIL',
        reasoning: isGood
          ? 'Response is accurate, grounded in context, and addresses the query directly.'
          : 'Response contains inaccuracies or information not supported by the provided context.',
      };
    });

    setEvaluationResults(results);
    setIsEvaluating(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/labs" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-purple-500" />
            Evaluation Lab
          </h1>
          <p className="text-gray-600 text-sm">
            Understand model evaluation metrics, LLM-as-Judge, and RAG quality assessment.
          </p>
        </div>
      </div>

      {/* Exam Context */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-700 mb-2">Exam Relevance: Domain 5</h3>
        <p className="text-sm text-gray-700">
          This lab covers <strong>Task 5.1</strong>: Evaluation systems including automated metrics,
          LLM-as-Judge, human evaluation, RAG-specific metrics, and golden datasets for testing.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel - Scenario Selection */}
        <div className="space-y-6">
          {/* Scenario Selection */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Evaluation Scenario</h2>
            <div className="space-y-2">
              {evaluationScenarios.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => {
                    setSelectedScenario(scenario);
                    setEvaluationResults(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedScenario.id === scenario.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-800">{scenario.name}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{scenario.query}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Evaluation Criteria */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Evaluation Criteria</h2>
            <div className="space-y-2">
              {selectedScenario.metrics.evaluationCriteria.map(criterion => (
                <div key={criterion} className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-700">{criterion}</span>
                </div>
              ))}
            </div>
            {selectedScenario.groundTruth && (
              <div className="mt-4 p-2 bg-green-50 rounded border border-green-200">
                <div className="text-xs text-green-700 font-medium">Ground Truth:</div>
                <div className="text-sm text-green-800">{selectedScenario.groundTruth}</div>
              </div>
            )}
          </div>

          {/* Run Evaluation */}
          <button
            onClick={runEvaluation}
            disabled={isEvaluating}
            className="w-full flex items-center justify-center gap-2 p-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Evaluating with LLM-as-Judge...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Evaluation
              </>
            )}
          </button>
        </div>

        {/* Center Panel - Scenario Details & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Query and Context */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="mb-4">
              <label className="text-xs text-gray-500 uppercase tracking-wide">Query</label>
              <div className="text-sm text-gray-800 mt-1 p-2 bg-gray-50 rounded">
                {selectedScenario.query}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">Context (Retrieved Documents)</label>
              <div className="text-sm text-gray-700 mt-1 p-2 bg-blue-50 rounded border border-blue-100">
                {selectedScenario.context}
              </div>
            </div>
          </div>

          {/* Model Responses */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Model Responses</h2>
            <div className="space-y-3">
              {selectedScenario.responses.map(response => {
                const result = evaluationResults?.[response.model];
                return (
                  <div
                    key={response.model}
                    className={`p-3 rounded-lg border ${
                      result
                        ? result.verdict === 'PASS'
                          ? 'border-green-300 bg-green-50'
                          : 'border-red-300 bg-red-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800">{response.model}</span>
                      {result && (
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-mono ${
                            result.verdict === 'PASS' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(result.score * 100).toFixed(0)}%
                          </span>
                          {result.verdict === 'PASS' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">{response.text}</div>
                    {result && (
                      <div className="mt-2 text-xs text-gray-600 italic border-t border-gray-200 pt-2">
                        <strong>LLM Judge:</strong> {result.reasoning}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evaluation Summary */}
          {evaluationResults && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-700">Evaluation Summary</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {Object.values(evaluationResults).filter(r => r.verdict === 'PASS').length}
                    /{Object.keys(evaluationResults).length}
                  </div>
                  <div className="text-xs text-gray-600">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {(Object.values(evaluationResults).reduce((acc, r) => acc + r.score, 0) / Object.keys(evaluationResults).length * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-600">Avg Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.entries(evaluationResults).sort((a, b) => b[1].score - a[1].score)[0][0]}
                  </div>
                  <div className="text-xs text-gray-600">Best Model</div>
                </div>
              </div>
            </div>
          )}

          {/* RAG Metrics Guide */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={() => setShowMetricsGuide(!showMetricsGuide)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-white">RAG Evaluation Metrics Guide</span>
              </div>
              {showMetricsGuide ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {showMetricsGuide && (
              <div className="p-4 pt-0 space-y-3">
                {ragMetrics.map(metric => (
                  <div key={metric.name} className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-white">{metric.name}</h4>
                      <Scale className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{metric.description}</p>
                    <div className="text-xs font-mono text-purple-300 mb-2 p-1 bg-slate-800 rounded">
                      {metric.formula}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      <strong>Example:</strong> {metric.example}
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                      <span className="text-blue-400 text-xs font-semibold shrink-0">EXAM:</span>
                      <p className="text-xs text-gray-300">{metric.examTip}</p>
                    </div>
                  </div>
                ))}

                {/* LLM-as-Judge explanation */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-medium text-amber-400">LLM-as-Judge</h4>
                  </div>
                  <p className="text-xs text-gray-300 mb-2">
                    Uses a foundation model to evaluate other model outputs. Provides nuanced quality
                    assessment at scale. Calibrate with few-shot examples for consistency.
                  </p>
                  <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                    <span className="text-blue-400 text-xs font-semibold shrink-0">EXAM:</span>
                    <p className="text-xs text-gray-300">
                      LLM-as-Judge is scalable but has biases (prefers longer responses, certain styles).
                      Mitigate with calibration examples and explicit rubrics.
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
