'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Loader2,
  Send,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Wrench,
  Brain,
} from 'lucide-react';

interface AgentTrace {
  type: string;
  data: unknown;
}

interface AgentResult {
  response: string;
  sessionId: string;
  traces: AgentTrace[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  traces?: AgentTrace[];
}

export default function AgentWorkshopPage() {
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTraces, setShowTraces] = useState(true);
  const [expandedTraces, setExpandedTraces] = useState<number[]>([]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bedrock/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText: userMessage,
          sessionId,
          enableTrace: true,
        }),
      });

      const data: AgentResult = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { error: string }).error || 'Failed to invoke agent');
      }

      setSessionId(data.sessionId);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response, traces: data.traces },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrace = (index: number) => {
    setExpandedTraces(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const resetSession = () => {
    setSessionId(null);
    setMessages([]);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/labs" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Workshop</h1>
            <p className="text-gray-600 text-sm">
              Interact with Bedrock Agents and view reasoning traces.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTraces(!showTraces)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              showTraces
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            {showTraces ? 'Hide Traces' : 'Show Traces'}
          </button>
          <button
            onClick={resetSession}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            New Session
          </button>
        </div>
      </div>

      {/* Exam Context */}
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-700 mb-2">Exam Relevance: Task 2.1</h3>
        <p className="text-sm text-gray-700">
          This lab covers <strong>agentic AI solutions</strong>. Understand how agents reason,
          call tools (action groups), and coordinate multi-step tasks. The trace viewer shows
          the agent&apos;s decision-making process.
        </p>
      </div>

      <div className="flex-1 grid lg:grid-cols-3 gap-6 min-h-0">
        {/* Chat Panel */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-lg border border-gray-200">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !error && (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Agent Ready
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  This agent can interact with tools and perform multi-step reasoning.
                  Send a message to start a conversation.
                </p>
              </div>
            )}

            {messages.map((message, i) => (
              <div key={i}>
                <div
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-red-50 text-gray-900'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>

                {/* Inline Traces */}
                {showTraces && message.traces && message.traces.length > 0 && (
                  <div className="mt-2 ml-4 space-y-1">
                    {message.traces.map((trace, j) => (
                      <div
                        key={j}
                        className="text-xs bg-gray-50 rounded border border-gray-200"
                      >
                        <button
                          onClick={() => toggleTrace(i * 100 + j)}
                          className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-100"
                        >
                          {expandedTraces.includes(i * 100 + j) ? (
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-500" />
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            trace.type === 'orchestration' ? 'bg-blue-50 text-blue-700' :
                            trace.type === 'preprocessing' ? 'bg-green-50 text-green-700' :
                            trace.type === 'postprocessing' ? 'bg-purple-50 text-purple-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {trace.type}
                          </span>
                        </button>
                        {expandedTraces.includes(i * 100 + j) && (
                          <pre className="p-2 text-gray-600 overflow-x-auto border-t border-gray-200">
                            {JSON.stringify(trace.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Agent is thinking...
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-700">Error</h3>
                  <p className="text-sm text-gray-700">{error}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Ensure BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID are set.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Send a message to the agent..."
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-800 text-sm focus:border-red-500 focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Session Info */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Session</h2>
            <p className="text-xs text-gray-500 font-mono break-all">
              {sessionId || 'No active session'}
            </p>
          </div>

          {/* Agent Concepts */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h2 className="text-sm font-semibold text-indigo-700 mb-3">Key Concepts</h2>
            <ul className="space-y-3 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span><strong>Orchestration</strong>: Agent reasoning and decision-making</span>
              </li>
              <li className="flex items-start gap-2">
                <Wrench className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span><strong>Action Groups</strong>: Tools the agent can call (Lambda functions)</span>
              </li>
              <li className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong>Traces</strong>: Show the agent&apos;s reasoning path</span>
              </li>
            </ul>
          </div>

          {/* Exam Tips */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h2 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Exam Tips
            </h2>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>• Agents use ReAct pattern (Reason + Act)</li>
              <li>• Action groups are backed by Lambda functions</li>
              <li>• Safeguards include max iterations and timeouts</li>
              <li>• Session IDs enable multi-turn conversations</li>
              <li>• Traces help debug agent behavior</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
