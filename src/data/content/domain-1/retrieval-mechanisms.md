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

### Rerank API Deep Dive

Understanding how to use the Rerank API is exam-critical and practically essential.

**Why Reranking Works Better Than Embeddings Alone**

Bi-encoders (like Titan Embeddings) encode query and document **separately**. They can't see both at once, so they miss subtle relevance signals. A document might be highly relevant because of how a specific phrase relates to the query—but that relationship isn't captured in isolated embeddings.

Cross-encoders (rerankers) process query AND document **together**. They see the full context and can identify relevance that embeddings miss.

**The Cost-Speed-Accuracy Trade-off**

| Approach | Speed | Cost | Accuracy |
|----------|-------|------|----------|
| Embedding similarity only | Fastest | Cheapest | Good |
| Embedding + Rerank top-20 | Slower | Medium | Better |
| Embedding + Rerank top-50 | Slowest | Higher | Best |

Retrieve broadly with fast/cheap embeddings, then rerank a smaller set with the expensive/accurate cross-encoder.

**Using the Rerank API**

```python
import boto3

bedrock = boto3.client('bedrock-runtime')

response = bedrock.rerank(
    modelId='cohere.rerank-v3-5:0',  # or 'amazon.rerank-v1:0'
    query='What is the maximum file size for Textract?',
    documents=[
        {'textContent': {'text': 'Textract supports files up to 10 MB for sync APIs...'}},
        {'textContent': {'text': 'The async APIs handle documents up to 500 MB...'}},
        {'textContent': {'text': 'Textract is an OCR service from AWS...'}},
        # ... more candidate documents
    ],
    topN=5  # Return only the top 5 after reranking
)

# Response includes ranked documents with relevance scores
for result in response['results']:
    print(f"Rank {result['index']}: Score {result['relevanceScore']}")
    print(f"Text: {result['document']['textContent']['text'][:100]}...")
```

**Amazon Rerank vs Cohere Rerank**

| Aspect | Amazon Rerank 1.0 | Cohere Rerank 3.5 |
|--------|-------------------|-------------------|
| Accuracy | Good | Slightly better on benchmarks |
| Speed | Faster | Comparable |
| Max documents | 100 per request | 100 per request |
| Languages | English-focused | Multilingual (100+ languages) |
| Cost | Lower | Higher |

**When to choose**:
- **Amazon Rerank**: English content, cost-sensitive, slightly lower latency
- **Cohere Rerank**: Multilingual content, maximum accuracy needed

**Reranking in Knowledge Base Retrieval**

Bedrock Knowledge Bases support built-in reranking:

```python
response = bedrock_agent.retrieve(
    knowledgeBaseId='KB_ID',
    retrievalQuery={'text': 'What is the refund policy?'},
    retrievalConfiguration={
        'vectorSearchConfiguration': {
            'numberOfResults': 10,
            'overrideSearchType': 'HYBRID',
            'rerankingConfiguration': {
                'type': 'BEDROCK_RERANKING_MODEL',
                'modelConfiguration': {
                    'modelArn': 'arn:aws:bedrock:us-east-1::foundation-model/cohere.rerank-v3-5:0'
                }
            }
        }
    }
)
```

This retrieves using hybrid search, then reranks the results—all in one API call.

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

Combines vector and keyword scores. But how do you combine scores from different systems with different scales?

**The Fusion Problem**

Vector similarity might return scores from 0.0-1.0 (cosine similarity), while BM25 keyword scores might range from 0-15. You can't just add them—the keyword scores would dominate.

**Reciprocal Rank Fusion (RRF)**

The most common solution. Instead of using raw scores, use **ranks**:

```
RRF_score = Σ 1/(k + rank_i)
```

Where `k` is a constant (typically 60) and `rank_i` is the document's position in each result list.

A document ranked #1 in both lists gets:
- From vector: 1/(60+1) = 0.0164
- From keyword: 1/(60+1) = 0.0164
- Combined: 0.0328

A document ranked #1 in one list and #10 in another:
- From list 1: 1/(60+1) = 0.0164
- From list 2: 1/(60+10) = 0.0143
- Combined: 0.0307

RRF naturally handles different score scales and rewards documents that rank well in multiple lists.

**Weighted Combination**

Alternatively, normalize scores to [0,1] then apply weights:

```python
def hybrid_score(doc, alpha=0.7):
    # Normalize both scores to 0-1
    vector_normalized = normalize(doc.vector_score)
    keyword_normalized = normalize(doc.keyword_score)

    # Weighted combination
    return alpha * vector_normalized + (1 - alpha) * keyword_normalized
```

- `alpha = 1.0`: Pure semantic search
- `alpha = 0.0`: Pure keyword search
- `alpha = 0.7`: Common default—emphasize semantics but include keywords

**When to Weight Toward Keywords**

- Searching for exact identifiers (error codes, product SKUs)
- Technical documentation with precise terminology
- When users expect exact phrase matching

**When to Weight Toward Semantics**

- Conceptual questions ("how does X work?")
- Natural language queries from non-experts
- When terminology varies across documents

**Bedrock KB HYBRID Mode**

In Bedrock Knowledge Bases, HYBRID mode handles fusion automatically. You can influence the balance with metadata filtering and search configuration, but the core fusion algorithm is managed.

```python
response = bedrock_agent.retrieve(
    knowledgeBaseId='KB_ID',
    retrievalQuery={'text': 'error code E-1042'},
    retrievalConfiguration={
        'vectorSearchConfiguration': {
            'overrideSearchType': 'HYBRID'  # Enables both vector and keyword
        }
    }
)
```

For most production RAG applications, **HYBRID mode is the default choice**. Pure semantic search misses exact matches; pure keyword search misses conceptual relevance.

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
| "multilingual retrieval" | **Cohere Rerank** (100+ languages) |
| "exact identifiers" or "error codes" | Hybrid search weighted toward **keywords** |
| "combining search results" | **Reciprocal Rank Fusion (RRF)** |
| "retrieve broadly, rerank narrowly" | Embedding search top-N → Rerank to top-K |

---

## Key Takeaways

> **1. Chunking is where RAG succeeds or fails.**
> Test different sizes with your content. Too big dilutes relevance, too small loses context. Hierarchical chunking gives you both.

> **2. Titan Embeddings V2 is the default.**
> Flexible dimensions (256/512/1024) let you trade accuracy for cost. Evaluate on YOUR domain—general benchmarks don't predict domain-specific performance.

> **3. Hybrid search is the production default.**
> Combining keyword (BM25) with vector similarity catches both exact matches and semantic relevance. Enable HYBRID mode in Bedrock KB.

> **4. Reranking is the precision lever.**
> Retrieve broadly (top-20), rerank narrowly (top-5). Cross-encoders catch relevance signals that separate embeddings miss. Worth the latency for high-stakes queries.

> **5. Optimize queries, not just retrieval.**
> Query expansion, decomposition, HyDE, and reformulation bridge the gap between messy user input and clean document text.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Vector search only** | Pure semantic search misses exact keyword matches. Error code 'E-1042' might retrieve general "error" docs instead of the specific match. |
| **Wrong chunk size** | Too large and embeddings become semantic mush. Too small and context is lost. Test with your actual content and queries. |
| **Skipping domain evaluation** | An embedding model crushing general benchmarks might struggle with your medical/legal/technical terminology. Evaluate with YOUR data. |
| **No query preprocessing** | Users type messy queries with typos and ambiguity. Query expansion and reformulation dramatically improve retrieval quality. |
| **Assuming retrieval works** | Without measuring recall@k on test queries, you're flying blind. Silent retrieval failures cause wrong answers downstream. |
