# Retrieval Mechanisms

**Domain 1 | Task 1.5 | ~40 minutes**

---

## Why This Matters

Here's the thing about RAG: your AI is only as good as what it retrieves. Hand it irrelevant documents and even the smartest model will give garbage answers. Hand it exactly the right context and it looks like magic.

Retrieval is where RAG applications succeed or fail.

---

## Document Chunking Strategies

Chunking sounds boring until you realize it's where most RAG failures happen. Chunk wrong and your retrieval breaks.

### The Fundamental Tension

**Precision vs. Context.**

- **Small chunks**: Match queries precisely but might lack surrounding context
- **Large chunks**: Preserve context but contain so much irrelevant text that semantic signal gets diluted

A 2000-token chunk about "everything in Chapter 5" won't match as well as a focused chunk about "exactly the paragraph answering the user's question."

### Fixed-Size Chunking

The blunt instrument: split every 512 tokens, done.

**Pros**: Predictable, simple, fits neatly into embedding model limits.

**Cons**: Might slice a sentence right in half. A chunk that starts with "However, this approach fails when..." is useless without knowing what "this approach" refers to.

### Semantic Chunking

Smarter—splits at natural boundaries like paragraph breaks and section headings.

**Pros**: Get coherent chunks that stand alone.

**Cons**: Sizes vary wildly. Some paragraphs are tiny; dense technical sections might exceed your limits.

### Hierarchical Chunking

The clever solution. Create parent chunks that summarize entire sections, and child chunks with the details.

```
Document
  └── Section (parent chunk)
        ├── Paragraph 1 (child chunk)
        └── Paragraph 2 (child chunk)
```

Search against parents to find relevant sections, then grab their children for specifics. You get both the forest and the trees.

### Overlapping Chunks

Add redundancy at boundaries. If your chunks are 512 tokens with 50-token overlap, adjacent chunks share content.

When an answer spans a boundary, both chunks contain it. Better recall, more storage.

---

## Embedding Model Selection

Embeddings are the translation layer between human language and mathematical search. Pick a bad embedding model and your retrieval is doomed before it starts.

### Amazon Titan Text Embeddings V2

The AWS default with key improvements over V1:
- **1024 dimensions** by default (V1 was 1536—33% storage reduction)
- **Flexible dimensions**: 256, 512, or 1024
- **100+ languages**
- **8,192 tokens** max input

The clever part about flexible dimensions:
- 512 dims = **99% retrieval accuracy**
- 256 dims = **97% accuracy**

```typescript
async function generateEmbedding(text: string, dimensions = 1024): Promise<number[]> {
  const client = new BedrockRuntimeClient({ region: 'us-east-1' });

  const response = await client.send(new InvokeModelCommand({
    modelId: 'amazon.titan-embed-text-v2:0',
    body: JSON.stringify({
      inputText: text,
      dimensions, // 256, 512, or 1024
      normalize: true
    }),
    contentType: 'application/json'
  }));

  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.embedding;
}
```

### Cohere Embed

Available through Bedrock, shines for multilingual content. Often outperforms Titan for documents spanning multiple languages.

**But**: Costs ~5x more ($0.10/1M tokens vs Titan's $0.02/1M tokens).

### The Critical Rule

**All documents and all queries must use the same embedding model.**

You can't embed docs with Titan and query with Cohere—the vector spaces are completely different. Switching models means re-embedding everything.

### Domain Matters

An embedding model that crushes general benchmarks might struggle with your specific content. Medical terminology, legal jargon, technical docs—specialized domains can confuse general-purpose models.

Evaluate with YOUR queries on YOUR documents before committing.

---

## Vector Search Techniques

Basic vector search finds documents whose embeddings are closest to your query embedding. Works great for semantic queries. But it has blind spots.

### Hybrid Search

Combines vector similarity with old-school keyword matching (BM25).

Think about it: if someone searches for error code 'E-1042', pure vector search might return docs about "errors" generally. Hybrid search nails the exact match AND understands context.

Enable HYBRID retrieval mode in Bedrock KB:

```typescript
const response = await client.send(new RetrieveCommand({
  knowledgeBaseId: 'KB12345',
  retrievalQuery: { text: 'How do I handle rate limiting?' },
  retrievalConfiguration: {
    vectorSearchConfiguration: {
      numberOfResults: 10,
      overrideSearchType: 'HYBRID'
    }
  }
}));
```

### Reranking

The secret weapon for high-stakes retrieval.

Bedrock provides the **Rerank API** with two models:
- Amazon Rerank 1.0
- Cohere Rerank 3.5

**The pattern**: Retrieve wide, rerank narrow.

1. Vector search grabs top-N candidates (say, 20)
2. Reranker scores each query-document pair
3. Return top-K (say, 5)

The reranker is slower but much more accurate—cross-encoders see query AND document together, catching relevance signals that separate embeddings miss.

### MMR (Maximal Marginal Relevance)

Solves the redundancy problem.

Without it, you might get five chunks from the same document all saying the same thing. MMR penalizes redundancy, selecting results that are both relevant AND diverse.

### Filtering

Constrain results by metadata:
- **Pre-filtering** (before search): Efficient—search a smaller pile
- **Post-filtering** (after search): Simpler but might return too few results

### Production Pattern

**Hierarchical chunking + Hybrid search + Reranking**

This is the most robust default for production RAG.

---

## Query Handling Techniques

Users type messy queries. They're ambiguous, use different words than your documents, and sometimes ask three questions at once.

Query optimization bridges the gap between what users type and what documents contain.

### Query Expansion

Add related terms to catch more relevant docs.

User asks about "AWS compute options"? Expand to include "EC2," "Lambda," "Fargate," "ECS."

You can build synonym dictionaries or ask an FM to suggest related terms.

### Query Decomposition

Handle complex multi-part questions.

"Compare the cost and performance of EC2 vs Lambda for batch processing" is really four questions:
1. EC2 cost
2. Lambda cost
3. EC2 performance
4. Lambda performance

Break it apart, retrieve for each sub-query, combine results. The FM gets all the relevant context instead of a muddled mix.

### HyDE (Hypothetical Document Embeddings)

A clever trick for difficult queries.

Instead of embedding the query directly, ask an FM to write a hypothetical answer document. Then embed THAT and use it for retrieval.

Why does this work? The hypothetical document is written in "document style," matching how your actual documents are written much better than a terse query.

### Query Reformulation

Clean up messy input:

Before: "how 2 setup vpc peering???"

After: "How do I set up VPC peering?"

An FM can turn that into a proper query that retrieves better.

### Conversational Context

"What about the pricing?" means nothing without knowing what "that" refers to from earlier.

Include relevant conversation history when building retrieval queries.

---

## Document Segmentation

For **structured documents** (manuals, legal docs, technical specs), semantic chunking works well. Split at section boundaries. Use headings as metadata for filtering.

For **unstructured content** (emails, chat logs, transcripts), fixed-size chunking with overlap may be better since natural boundaries are less clear.

Bedrock Knowledge Bases provides automatic chunking with configurable parameters:
- Target chunk size (~300 tokens is a good starting point)
- Overlap percentage (10% is common)

Custom chunking pipelines offer more control. Lambda functions triggered by S3 uploads can implement domain-specific logic—split code by function, legal docs by clause, procedures by step.

---

## Embedding Generation

Quality embeddings are foundational—no amount of fancy search can fix bad embeddings.

### Evaluate on Your Domain

Create a test set: queries with known relevant documents. Generate embeddings and measure recall@k.

Compare embedding models on YOUR data; benchmarks don't always predict domain-specific performance.

### Batch Embedding

Essential at scale. Processing thousands of documents with individual API calls is slow and expensive. Use batch inference.

### Cache Embeddings

Store embeddings alongside document IDs. When documents update, only re-embed what changed.

---

## Vector Search Implementation

### OpenSearch k-NN

Provides scalable vector search with HNSW indexes.

HNSW finds approximate nearest neighbors incredibly fast—it may not be mathematically perfect, but it's close enough and way faster than exact search.

### Aurora pgvector

Adds vector operations to PostgreSQL. If you already use PostgreSQL, querying vectors with familiar SQL is a big win.

Supports both exact search (accurate but slow) and approximate search (IVFFlat indexes).

### Bedrock Knowledge Bases

Abstracts the search layer completely. You call the retrieve API; Bedrock handles vector search internally.

Simplest option, least control.

### Tuning Parameters

In OpenSearch, the `ef_search` parameter controls how many candidates HNSW considers. Higher values = better recall, slower search.

Test different values with your actual queries.

---

## Advanced Search Techniques

### Hybrid Search Fusion

Combines vector and keyword scores. OpenSearch's neural plugin lets you tune weights:
- Emphasize keywords for precise technical queries
- Emphasize semantics for conceptual questions

Bedrock KB's HYBRID mode does this automatically.

### Cross-Encoder Reranking

Powerful because it jointly processes query and document, catching relevance signals that separate embeddings miss.

The downside? Can't be pre-computed—must run at query time. Use for precision-critical applications.

---

## Access Mechanisms

Standardized interfaces between FMs and retrieval systems.

### Function Calling

Let FMs invoke retrieval tools. Define a retrieval function with parameters (query, filters, top_k), and the FM calls it when it needs external information.

More flexible than always-retrieve approaches.

### Converse API with Tools

Bedrock's Converse API supports tools natively:

```typescript
const toolSchema = {
  name: 'searchDocs',
  description: 'Search the knowledge base',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' }
    }
  }
};
```

The FM returns `tool_use` blocks when it wants to invoke a tool.

### Lambda as Retrieval API

The FM invokes Lambda via tool calling, Lambda performs the retrieval, returns results to the FM.

---

## Search Technique Comparison

| Criterion | Pure Vector | Hybrid Search | Hybrid + Reranking |
|-----------|-------------|---------------|-------------------|
| Best for | Conceptual, semantic queries | Mixed queries with keywords + concepts | Precision-critical, complex queries |
| Precision | Good | Better | Highest |
| Latency | Lowest | Slightly higher | Highest |
| When to use | Latency-critical | Most production RAG (default) | High-stakes where accuracy > latency |

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "improve retrieval quality" | Hybrid search, reranking, query expansion |
| "complex or multi-part questions" | Query decomposition |
| "scale or performance" | OpenSearch with HNSW indexes |
| "context preservation" or "parent-child" | Hierarchical chunking |
| "simplest approach" | Fixed-size with Bedrock KB defaults |
| "precision" or "relevance" | Rerank API |

---

## Key Takeaways

1. **Chunking strategy directly impacts retrieval**—test different sizes with your content
2. **Titan Embeddings V2** is the default; evaluate alternatives on your specific domain
3. **Hybrid search (keyword + vector)** beats pure vector for most production RAG
4. **Reranking improves precision** significantly but adds latency—use for high-stakes
5. **Query optimization** (expansion, decomposition, HyDE) bridges the query-document gap

---

## Common Mistakes

- Using only vector search when hybrid would produce better results
- Chunks too large (diluted relevance) or too small (lost context)
- Not evaluating embedding models on domain-specific test queries
- Skipping query preprocessing for user-facing applications
- Assuming retrieval is "good enough" without measuring recall
