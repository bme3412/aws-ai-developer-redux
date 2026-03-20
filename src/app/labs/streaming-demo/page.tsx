'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Radio,
  Play,
  Loader2,
  Clock,
  Zap,
  Server,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Pause,
  RotateCcw,
} from 'lucide-react';

// Simulated streaming text (would come from actual API in production)
const sampleResponse = `Amazon Bedrock is a fully managed service that makes foundation models from leading AI companies available through a unified API.

**Key Features:**

1. **Multi-Provider Access**: Access models from Anthropic (Claude), Meta (Llama), Amazon (Titan), Mistral, Cohere, and more through a single API.

2. **Security & Privacy**: Your data stays within your AWS account. Models don't learn from your data. VPC endpoints available for private connectivity.

3. **Customization Options**:
   - Fine-tuning: Train models on your specific data
   - RAG: Connect to knowledge bases for grounded responses
   - Prompt management: Version and manage prompts centrally

4. **Responsible AI**: Built-in guardrails for content filtering, PII detection, and topic restrictions.

5. **Cost Optimization**: On-demand pricing, provisioned throughput, and batch inference options.

The service integrates seamlessly with other AWS services like Lambda, S3, and CloudWatch for building production-ready GenAI applications.`;

export default function StreamingDemoPage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [batchText, setBatchText] = useState('');
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  const [batchStartTime, setBatchStartTime] = useState<number | null>(null);
  const [streamFirstTokenTime, setStreamFirstTokenTime] = useState<number | null>(null);
  const [streamCompleteTime, setStreamCompleteTime] = useState<number | null>(null);
  const [batchCompleteTime, setBatchCompleteTime] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(true);
  const streamIndexRef = useRef(0);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const prompt = "Explain Amazon Bedrock and its key features.";

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  const startStreaming = () => {
    setStreamedText('');
    setStreamFirstTokenTime(null);
    setStreamCompleteTime(null);
    streamIndexRef.current = 0;
    setIsStreaming(true);
    setStreamStartTime(Date.now());

    // Simulate streaming with character-by-character output
    streamIntervalRef.current = setInterval(() => {
      if (streamIndexRef.current < sampleResponse.length) {
        // First token timing
        if (streamIndexRef.current === 0) {
          setStreamFirstTokenTime(Date.now());
        }

        // Add characters in small chunks (simulating token streaming)
        const chunkSize = Math.floor(Math.random() * 3) + 1;
        const nextChunk = sampleResponse.slice(
          streamIndexRef.current,
          streamIndexRef.current + chunkSize
        );
        setStreamedText(prev => prev + nextChunk);
        streamIndexRef.current += chunkSize;
      } else {
        // Complete
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
        }
        setStreamCompleteTime(Date.now());
        setIsStreaming(false);
      }
    }, 20); // ~50 chars/second
  };

  const startBatch = async () => {
    setBatchText('');
    setBatchCompleteTime(null);
    setIsBatchLoading(true);
    setBatchStartTime(Date.now());

    // Simulate batch response delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    setBatchText(sampleResponse);
    setBatchCompleteTime(Date.now());
    setIsBatchLoading(false);
  };

  const reset = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
    }
    setIsStreaming(false);
    setIsBatchLoading(false);
    setStreamedText('');
    setBatchText('');
    setStreamStartTime(null);
    setBatchStartTime(null);
    setStreamFirstTokenTime(null);
    setStreamCompleteTime(null);
    setBatchCompleteTime(null);
    streamIndexRef.current = 0;
  };

  const streamTTFT = streamStartTime && streamFirstTokenTime
    ? streamFirstTokenTime - streamStartTime
    : null;
  const streamTotal = streamStartTime && streamCompleteTime
    ? streamCompleteTime - streamStartTime
    : null;
  const batchTotal = batchStartTime && batchCompleteTime
    ? batchCompleteTime - batchStartTime
    : null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/labs" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Radio className="w-6 h-6 text-green-500" />
            Streaming Demo
          </h1>
          <p className="text-gray-600 text-sm">
            Compare streaming vs batch responses. Understand time-to-first-token.
          </p>
        </div>
      </div>

      {/* Exam Context */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-700 mb-2">Exam Relevance: Domain 2 & 4</h3>
        <p className="text-sm text-gray-700">
          This lab covers <strong>Task 2.3</strong>: Integration patterns including streaming responses,
          and <strong>Task 4.2</strong>: Performance optimization with streaming for improved UX.
        </p>
      </div>

      {/* Prompt Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="text-xs text-gray-500 uppercase tracking-wide">Prompt</label>
        <div className="text-sm text-gray-800 mt-1">{prompt}</div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={startStreaming}
          disabled={isStreaming || isBatchLoading}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
        >
          {isStreaming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Streaming...
            </>
          ) : (
            <>
              <Radio className="w-4 h-4" />
              Start Streaming
            </>
          )}
        </button>

        <button
          onClick={startBatch}
          disabled={isStreaming || isBatchLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
        >
          {isBatchLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Server className="w-4 h-4" />
              Start Batch
            </>
          )}
        </button>

        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Side by Side Comparison */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Streaming Response */}
        <div className="p-4 bg-white rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-green-500" />
              <h2 className="font-semibold text-gray-800">Streaming Response</h2>
            </div>
            {isStreaming && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 bg-green-50 rounded text-center">
              <div className="text-xs text-gray-500">Time to First Token</div>
              <div className="text-lg font-mono text-green-700">
                {streamTTFT ? `${streamTTFT}ms` : '—'}
              </div>
            </div>
            <div className="p-2 bg-green-50 rounded text-center">
              <div className="text-xs text-gray-500">Total Time</div>
              <div className="text-lg font-mono text-green-700">
                {streamTotal ? `${streamTotal}ms` : isStreaming ? '...' : '—'}
              </div>
            </div>
          </div>

          {/* Response Text */}
          <div className="h-64 overflow-y-auto bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
            {streamedText || (
              <span className="text-gray-400 italic">Response will stream here...</span>
            )}
            {isStreaming && <span className="inline-block w-2 h-4 bg-green-500 animate-pulse ml-0.5" />}
          </div>
        </div>

        {/* Batch Response */}
        <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-gray-800">Batch Response</h2>
            </div>
            {isBatchLoading && (
              <span className="flex items-center gap-1 text-xs text-blue-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing
              </span>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 bg-blue-50 rounded text-center">
              <div className="text-xs text-gray-500">Time to First Token</div>
              <div className="text-lg font-mono text-blue-700">
                {batchTotal ? `${batchTotal}ms` : '—'}
              </div>
            </div>
            <div className="p-2 bg-blue-50 rounded text-center">
              <div className="text-xs text-gray-500">Total Time</div>
              <div className="text-lg font-mono text-blue-700">
                {batchTotal ? `${batchTotal}ms` : isBatchLoading ? '...' : '—'}
              </div>
            </div>
          </div>

          {/* Response Text */}
          <div className="h-64 overflow-y-auto bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
            {isBatchLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                  <span className="text-gray-400 italic">Waiting for complete response...</span>
                </div>
              </div>
            ) : batchText ? (
              batchText
            ) : (
              <span className="text-gray-400 italic">Response will appear here all at once...</span>
            )}
          </div>
        </div>
      </div>

      {/* Key Insight */}
      {(streamTTFT || batchTotal) && (
        <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-700">Key Insight</h3>
          </div>
          <p className="text-sm text-gray-700">
            {streamTTFT && batchTotal && (
              <>
                Streaming showed first content in <strong>{streamTTFT}ms</strong> vs batch at{' '}
                <strong>{batchTotal}ms</strong>. That&apos;s{' '}
                <strong>{((batchTotal - streamTTFT) / batchTotal * 100).toFixed(0)}% faster perceived response</strong>.
                Total generation time is similar, but streaming improves user experience significantly.
              </>
            )}
            {streamTTFT && !batchTotal && (
              <>
                Streaming delivered first token in <strong>{streamTTFT}ms</strong>.
                Try the batch response to compare the full wait time.
              </>
            )}
            {!streamTTFT && batchTotal && (
              <>
                Batch response took <strong>{batchTotal}ms</strong> before showing any content.
                Try streaming to see how time-to-first-token improves UX.
              </>
            )}
          </p>
        </div>
      )}

      {/* Under the Hood Explanation */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 overflow-hidden">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-white">How Streaming Works in Bedrock</span>
          </div>
          {showExplanation ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showExplanation && (
          <div className="p-4 pt-0 space-y-4">
            {/* API Comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-green-400 mb-2">InvokeModelWithResponseStream</h4>
                <pre className="text-xs text-gray-300 bg-slate-800 p-2 rounded overflow-x-auto">
{`const command = new InvokeModelWithResponseStreamCommand({
  modelId: 'anthropic.claude-3...',
  body: JSON.stringify({ ... })
});

const response = await client.send(command);

// Process stream chunks
for await (const chunk of response.body) {
  const text = JSON.parse(
    new TextDecoder().decode(chunk.chunk.bytes)
  );
  // Display immediately
}`}
                </pre>
              </div>

              <div className="p-3 bg-slate-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-400 mb-2">InvokeModel (Batch)</h4>
                <pre className="text-xs text-gray-300 bg-slate-800 p-2 rounded overflow-x-auto">
{`const command = new InvokeModelCommand({
  modelId: 'anthropic.claude-3...',
  body: JSON.stringify({ ... })
});

// Waits for complete response
const response = await client.send(command);

// All content at once
const result = JSON.parse(
  new TextDecoder().decode(response.body)
);`}
                </pre>
              </div>
            </div>

            {/* Key Concepts */}
            <div className="grid md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-1">Time-to-First-Token (TTFT)</h4>
                <p className="text-xs text-gray-400">
                  Time until the first response token appears. Streaming minimizes this, improving perceived speed.
                </p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-1">Same Total Cost</h4>
                <p className="text-xs text-gray-400">
                  Streaming doesn&apos;t change token count or pricing. Same input/output tokens = same cost.
                </p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-1">Use Cases</h4>
                <p className="text-xs text-gray-400">
                  Chat interfaces, real-time assistants, any user-facing app where perceived latency matters.
                </p>
              </div>
            </div>

            {/* Exam Tips */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-xs font-semibold shrink-0">EXAM TIPS:</span>
                <div className="text-xs text-gray-300 space-y-1">
                  <p>• Streaming improves UX but doesn&apos;t reduce total latency or cost</p>
                  <p>• Use <code className="px-1 bg-slate-700 rounded">InvokeModelWithResponseStream</code> for streaming</p>
                  <p>• TTFT is a key metric for chat applications</p>
                  <p>• Batch is better for background processing where UX doesn&apos;t matter</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
