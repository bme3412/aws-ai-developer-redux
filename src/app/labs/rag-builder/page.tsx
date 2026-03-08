'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Loader2,
  Database,
  FileText,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface RetrievalChunk {
  text: string;
  score: number;
  source: string;
  metadata?: Record<string, unknown>;
}

interface RAGResult {
  mode: string;
  chunks?: RetrievalChunk[];
  answer?: string;
  citations?: Array<{
    generatedText: string;
    references: Array<{ text: string; source: string }>;
  }>;
}

export default function RAGBuilderPage() {
  const [query, setQuery] = useState('What is the company policy on remote work?');
  const [mode, setMode] = useState<'retrieve-only' | 'retrieve-and-generate'>('retrieve-and-generate');
  const [numberOfResults, setNumberOfResults] = useState(5);
  const [searchType, setSearchType] = useState<'SEMANTIC' | 'HYBRID'>('SEMANTIC');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RAGResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/bedrock/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          mode,
          retrievalConfig: {
            numberOfResults,
            overrideSearchType: searchType,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to query knowledge base');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-900">RAG Builder</h1>
          <p className="text-gray-600 text-sm">
            Explore retrieval-augmented generation with Bedrock Knowledge Bases.
          </p>
        </div>
      </div>

      {/* Exam Context */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h3 className="font-semibold text-amber-700 mb-2">Exam Relevance: Tasks 1.4 & 1.5</h3>
        <p className="text-sm text-gray-700">
          This lab covers <strong>vector store solutions</strong> and <strong>retrieval mechanisms</strong>.
          Understand how semantic vs. hybrid search works, how relevance scores are calculated,
          and how citations connect generated responses to source documents.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mode Selection */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Mode</h2>
            <div className="space-y-2">
              <button
                onClick={() => setMode('retrieve-only')}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  mode === 'retrieve-only'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-800">Retrieve Only</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  See raw chunks returned from the vector store
                </p>
              </button>
              <button
                onClick={() => setMode('retrieve-and-generate')}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  mode === 'retrieve-and-generate'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-800">Retrieve & Generate</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Full RAG pipeline with FM synthesis
                </p>
              </button>
            </div>
          </div>

          {/* Search Configuration */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Search Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-600 block mb-2">Search Type</label>
                <select
                  value={searchType}
                  onChange={e => setSearchType(e.target.value as 'SEMANTIC' | 'HYBRID')}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm text-gray-800"
                >
                  <option value="SEMANTIC">Semantic (Vector Only)</option>
                  <option value="HYBRID">Hybrid (Vector + Keyword)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {searchType === 'SEMANTIC'
                    ? 'Uses embedding similarity for semantic matching'
                    : 'Combines semantic and BM25 keyword matching'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-600">Results to Retrieve</label>
                  <span className="text-xs text-gray-700">{numberOfResults}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={numberOfResults}
                  onChange={e => setNumberOfResults(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Key Concepts */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h2 className="text-sm font-semibold text-indigo-700 mb-3">Key Exam Concepts</h2>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                <span><strong>Chunking</strong> splits documents into retrievable segments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                <span><strong>Embeddings</strong> convert text to vectors for similarity search</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                <span><strong>Relevance scores</strong> indicate how well chunks match the query</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500">•</span>
                <span><strong>Citations</strong> link generated text to source documents</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Query Input */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Query</label>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              rows={3}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-800 text-sm focus:border-amber-500 focus:outline-none resize-none"
              placeholder="Enter your query..."
            />
            <div className="flex items-center justify-end mt-3">
              <button
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-semibold rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
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
                  Ensure BEDROCK_KNOWLEDGE_BASE_ID is set in .env.local
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Retrieve-only results */}
              {mode === 'retrieve-only' && result.chunks && (
                <>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Retrieved Chunks ({result.chunks.length})
                  </h2>
                  <div className="space-y-3">
                    {result.chunks.map((chunk, i) => (
                      <div
                        key={i}
                        className="p-4 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500">Chunk {i + 1}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            chunk.score > 0.7 ? 'bg-green-50 text-green-600' :
                            chunk.score > 0.4 ? 'bg-amber-50 text-amber-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                            Score: {chunk.score?.toFixed(3) || 'N/A'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{chunk.text}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">{chunk.source || 'Unknown source'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Retrieve-and-generate results */}
              {mode === 'retrieve-and-generate' && result.answer && (
                <>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      Generated Answer
                    </h2>
                    <p className="text-gray-700">{result.answer}</p>
                  </div>

                  {result.citations && result.citations.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Citations</h3>
                      <div className="space-y-2">
                        {result.citations.map((citation, i) => (
                          <div
                            key={i}
                            className="p-3 bg-gray-50 rounded-lg"
                          >
                            {citation.references?.map((ref, j) => (
                              <div key={j} className="text-sm">
                                <p className="text-gray-600 mb-1">&quot;{ref.text}...&quot;</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {ref.source || 'Unknown source'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !result && !error && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Ready to Search
              </h3>
              <p className="text-sm text-gray-500">
                Enter a query to retrieve relevant documents from the knowledge base.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
