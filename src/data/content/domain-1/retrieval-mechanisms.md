# Retrieval Mechanisms

**Domain 1 | Task 1.5 | ~40 minutes**

---

## Why This Matters

Here's the thing about RAG: your AI is only as good as what it retrieves. Hand it irrelevant documents and even the smartest model in the world will give garbage answers—it's synthesizing from the wrong sources. Hand it exactly the right context and the same model looks like magic, providing accurate, grounded responses that cite real information.

This asymmetry is profound. A mediocre model with excellent retrieval outperforms a brilliant model with poor retrieval. The model can only work with what you give it, and retrieval determines what that is.

Retrieval is where RAG applications succeed or fail. Everything we cover in this article—chunking strategies, embedding models, hybrid search, reranking—exists to solve one problem: getting the right documents in front of the model when it needs them. Master retrieval and you've mastered 80% of what makes RAG work.

---

## Document Chunking Strategies

Chunking sounds boring until you realize it's where most RAG failures originate. Chunk your documents wrong and your retrieval breaks in ways that are maddeningly difficult to debug. The model gives wrong answers, you check its reasoning, the reasoning looks fine, but the source documents are irrelevant—and nobody notices until users complain.

### The Fundamental Tension

Every chunking decision navigates a fundamental trade-off between precision and context.

**Small chunks** match queries precisely because they contain focused information. A 100-token chunk about "password reset procedures" matches password-related queries beautifully. But small chunks might lack surrounding context—references to "the previous step" or "as mentioned above" become meaningless when that context isn't included.

**Large chunks** preserve context because they include more of the document. You get the full section, the complete thought, the surrounding discussion. But large chunks dilute the semantic signal. A 2000-token chunk covering "everything in Chapter 5" won't match as strongly as a focused chunk containing "exactly the paragraph answering the user's question." The embedding for the large chunk averages across too much content, becoming a vague representation that doesn't match specific queries well.

Neither extreme is right. The art is finding the granularity where chunks are specific enough to match queries but complete enough to be useful when retrieved.

### Fixed-Size Chunking

Fixed-size chunking is the blunt instrument: split every 512 tokens, done. It's predictable, simple, and guarantees chunks fit neatly into embedding model limits and context windows.

The implementation is trivial:

```python
def fixed_chunk(text, size=512, overlap=50):
    tokens = tokenize(text)
    chunks = []
    start = 0
    while start < len(tokens):
        chunk_tokens = tokens[start:start + size]
        chunks.append(detokenize(chunk_tokens))
        start += size - overlap
    return chunks
```

The problem with fixed-size chunking is that it's blind to document structure. It might slice a sentence right in half. A chunk that starts with "However, this approach fails when..." is nearly useless without knowing what "this approach" refers to. A chunk that ends with "See the following example:" contains a promise without the fulfillment.

Use fixed-size chunking when your content is relatively homogeneous without clear structural boundaries, when you need predictable chunk sizes for downstream processing, or when you're prototyping and want simplicity. For documents with clear structure—technical documentation, policies, legal documents—semantic approaches usually work better.

### Semantic Chunking

Semantic chunking respects the document's natural structure by splitting at boundaries the author created: paragraph breaks, section headings, sentence endings, topic transitions.

```python
def semantic_chunk(text, max_size=1000):
    # Split at paragraph boundaries
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ''

    for paragraph in paragraphs:
        # If adding this paragraph exceeds max, start new chunk
        if len(current_chunk) + len(paragraph) > max_size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = paragraph + '\n\n'
        else:
            current_chunk += paragraph + '\n\n'

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks
```

This produces coherent chunks because paragraphs tend to be about one thing. Section boundaries mark topic transitions. By respecting these signals, each chunk becomes a self-contained unit of information that can stand alone and match queries meaningfully.

The trade-off is variable chunk sizes. Some paragraphs are tiny; some are enormous. Dense technical sections might exceed your size limits even as single paragraphs. You need logic to handle oversized chunks (split further at sentence boundaries) and undersized chunks (merge with adjacent content).

Bedrock Knowledge Bases supports semantic chunking with configurable parameters. You specify maximum token size (20-8,192), breakpoint threshold (how similar adjacent sentences must be to stay together), and buffer size (how much surrounding context to consider). The service analyzes text relationships and splits at natural meaning boundaries.

### Hierarchical Chunking

Hierarchical chunking is the clever solution that gives you both precision and context by creating parent-child relationships between chunks:

**Hierarchical Structure:**
- Document
  - Section (parent chunk, ~1000 tokens)
    - Paragraph 1 (child chunk, ~300 tokens)
    - Paragraph 2 (child chunk, ~300 tokens)
    - Paragraph 3 (child chunk, ~300 tokens)

The child chunks are small and specific—they match queries precisely. The parent chunk provides context—the broader topic that the specific paragraphs belong to.

During retrieval, you can search against child chunks for precision, then include their parent chunks when generating context. A query matches a specific paragraph, and you pull both that paragraph and the containing section. The model gets the specific answer and the surrounding context that makes it meaningful.

Bedrock Knowledge Bases supports hierarchical chunking with configurable parameters. The recommended defaults are parent chunks of ~1000 tokens, child chunks of ~500 tokens, with ~70 tokens of overlap between parent and child levels. Experiment with these values for your content—technical documentation might benefit from different ratios than conversational FAQ content.

This pattern is particularly powerful for technical documentation, legal documents, and anything with nested structure. A question about a specific contract clause retrieves that clause precisely, while the parent section provides context about what the clause relates to.

### Overlapping Chunks

Overlap adds redundancy at chunk boundaries, ensuring information that spans two chunks appears in both:

```
Chunk 1: "...quarterly revenue reached $50M. The primary growth driver"
Chunk 2: "$50M. The primary growth driver was the new product line..."
```

The phrase "The primary growth driver" appears in both chunks. A query about revenue drivers can match either chunk because neither cuts off the relevant content mid-thought.

Without overlap, information at boundaries might not match queries well. Neither chunk would strongly match a query about growth drivers because Chunk 1 cuts off before explaining what the driver was, and Chunk 2 lacks the revenue context that makes the driver significant.

Typical overlap is 10-20% of chunk size. A 512-token chunk might have 50-100 tokens of overlap with adjacent chunks. Too much overlap wastes storage and can cause the same information to be retrieved multiple times. Too little overlap risks the boundary problems we're trying to solve.

---

## Embedding Model Selection

Embeddings are the translation layer between human language and mathematical search. They convert text into vectors where semantic similarity becomes geometric proximity. Pick a bad embedding model and your retrieval is doomed before it starts—queries won't match relevant documents no matter how well you've chunked them.

### Amazon Titan Text Embeddings V2

Titan Embeddings V2 is the AWS default for Bedrock, with meaningful improvements over the original:

- **1024 dimensions** by default (V1 was 1536—a 33% storage reduction)
- **Flexible dimensions**: Choose 256, 512, or 1024 based on your accuracy/cost trade-off
- **100+ languages** supported
- **8,192 tokens** maximum input length

The flexible dimensions feature is particularly clever. Amazon measured retrieval accuracy at different dimension levels and found that the drop-off is surprisingly gentle. Using 512 dimensions instead of 1024 retains approximately 99% of retrieval accuracy while halving storage and accelerating search. Using 256 dimensions retains approximately 97% accuracy while quartering storage.

For most applications, this means you can use 512 dimensions and barely notice any quality difference while significantly reducing costs. Reserve 1024 dimensions for applications where every percentage point of accuracy matters.

```typescript
async function generateEmbedding(text: string, dimensions = 1024): Promise<number[]> {
  const client = new BedrockRuntimeClient({ region: 'us-east-1' });

  const response = await client.send(new InvokeModelCommand({
    modelId: 'amazon.titan-embed-text-v2:0',
    body: JSON.stringify({
      inputText: text,
      dimensions,     // 256, 512, or 1024
      normalize: true // Unit length vectors for cosine similarity
    }),
    contentType: 'application/json'
  }));

  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.embedding;
}
```

The `normalize: true` parameter produces unit-length vectors, making cosine similarity calculations simpler (it becomes a dot product) and ensuring scores fall in the expected -1 to 1 range.

### Cohere Embed

Cohere's embedding models are available through Bedrock and often outperform Titan for multilingual content. If your documents span multiple languages—support documentation in English, German, Japanese, and Portuguese—Cohere might retrieve more consistently across all of them.

The trade-off is cost: Cohere embeddings run approximately $0.10 per million tokens versus Titan's $0.02 per million tokens. That's a 5x difference that compounds quickly at scale. For English-only content where Titan performs well, the cost savings are significant.

### The Critical Rule

**All documents and all queries must use the same embedding model.**

This isn't optional or a best practice—it's a hard requirement. Different embedding models produce different vector spaces. A Titan embedding and a Cohere embedding for the same text won't be close to each other because the models learned different representations.

Embedding documents with Titan V1 and querying with Titan V2 won't work reliably. They're different models with different training, producing vectors that don't align. The query vector lives in V2's space; the document vectors live in V1's space; cosine similarity between them is meaningless.

This means switching embedding models requires re-embedding all your documents. The switching cost is significant—potentially hours of processing and compute expense for large corpora. Factor this into your model evaluation: choosing the right embedding model upfront saves pain later.

### Domain Matters More Than Benchmarks

An embedding model that crushes general benchmarks might struggle with your specific content. Medical terminology, legal jargon, financial acronyms, internal company vocabulary—specialized domains can confuse general-purpose models that never saw this vocabulary during training.

The word "discovery" means something different in legal contexts (a litigation phase) than in software contexts (service discovery) than in general conversation (finding something). A general-purpose embedding might not capture these distinctions, placing legal and software documents near each other when they're actually unrelated.

Evaluate with YOUR queries on YOUR documents before committing. Build a test set of queries with known relevant documents, generate embeddings with candidate models, measure recall@k, and compare. This domain-specific evaluation predicts real performance far better than benchmark scores.

---

## Vector Search Techniques

Basic vector search finds documents whose embeddings are closest to your query embedding. You compute the query embedding, search your vector database for the nearest vectors, and return the associated chunks. This works remarkably well for semantic queries—questions about concepts, natural language questions, paraphrased inquiries.

But pure vector search has blind spots that matter in production.

### Hybrid Search: The Production Default

Hybrid search combines vector similarity with traditional keyword matching (typically BM25, the algorithm behind Elasticsearch's relevance scoring).

Consider this scenario: a user searches for error code "E-1042". Pure vector search might return documents about "errors" generally—the embedding for "E-1042" lands somewhere in "error-related" vector space, matching documents about error handling, error messages, and debugging. But those documents don't mention E-1042 specifically.

Keyword search catches the exact match. The document containing "Error E-1042 occurs when..." scores highly because it literally contains the search term. Combined with vector similarity, you get both the exact match AND semantically related content.

Enable HYBRID mode in Bedrock Knowledge Bases:

```typescript
const response = await client.send(new RetrieveCommand({
  knowledgeBaseId: 'KB12345',
  retrievalQuery: { text: 'How do I handle error code E-1042?' },
  retrievalConfiguration: {
    vectorSearchConfiguration: {
      numberOfResults: 10,
      overrideSearchType: 'HYBRID'  // Both vector and keyword
    }
  }
}));
```

For most production RAG applications, HYBRID mode should be your default. Pure semantic search misses exact matches; pure keyword search misses conceptual relevance. Hybrid gives you both, and the fusion algorithms handle combining the results intelligently.

### Reranking: The Precision Lever

Reranking is the secret weapon for high-stakes retrieval where precision matters more than latency.

Bedrock provides the Rerank API with two model options:
- **Amazon Rerank 1.0**: Good accuracy, lower cost, English-focused
- **Cohere Rerank 3.5**: Slightly better accuracy, multilingual (100+ languages), higher cost

The pattern is simple: retrieve broadly, rerank narrowly.

1. Vector search retrieves top-N candidates (perhaps 20-50 documents)
2. Reranker scores each query-document pair for relevance
3. Return the top-K reranked results (perhaps 5-10)

Why does this work better than embedding similarity alone? The answer lies in how these systems process information.

**Bi-encoders** (like Titan Embeddings) encode query and document separately. Each becomes a vector independently, and you measure similarity between these pre-computed vectors. This is fast—you can pre-compute document embeddings and store them—but it has a limitation: the model can't see query and document together. Subtle relevance signals that depend on their interaction get missed.

**Cross-encoders** (rerankers) process query and document together as a single input. The model sees both simultaneously and can identify relevance that isolated embeddings miss. A document might be highly relevant because of how a specific phrase relates to the query—but that relationship isn't captured when you embed them separately.

The cost-speed-accuracy trade-off is clear:

| Approach | Speed | Cost | Accuracy |
|----------|-------|------|----------|
| Embedding similarity only | Fastest | Cheapest | Good |
| Embedding + Rerank top-20 | Slower | Medium | Better |
| Embedding + Rerank top-50 | Slowest | Higher | Best |

Use embeddings to narrow millions of documents to a manageable candidate set, then use reranking to select the truly relevant ones from that set. The combination is powerful: vector search handles scale efficiently; reranking handles precision accurately.

### Using the Rerank API

The Rerank API is straightforward to call directly:

```python
import boto3

bedrock = boto3.client('bedrock-runtime')

response = bedrock.rerank(
    modelId='cohere.rerank-v3-5:0',  # or 'amazon.rerank-v1:0'
    query='What is the maximum file size for Textract sync APIs?',
    documents=[
        {'textContent': {'text': 'Textract sync APIs support files up to 10 MB...'}},
        {'textContent': {'text': 'Async APIs handle documents up to 500 MB...'}},
        {'textContent': {'text': 'Textract is a document analysis service from AWS...'}},
        {'textContent': {'text': 'For large documents, use async processing...'}},
    ],
    topN=3  # Return only the top 3 after reranking
)

# Results include relevance scores
for result in response['results']:
    score = result['relevanceScore']
    text = result['document']['textContent']['text']
    print(f"Score {score:.3f}: {text[:80]}...")
```

The response includes the reranked documents with relevance scores, letting you apply additional thresholds if desired.

### Reranking Within Knowledge Base Retrieval

Bedrock Knowledge Bases support built-in reranking, combining retrieval and reranking in a single API call:

```python
response = bedrock_agent.retrieve(
    knowledgeBaseId='KB_ID',
    retrievalQuery={'text': 'What is the refund policy for annual subscriptions?'},
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

This retrieves using hybrid search, then reranks the results automatically. The API handles the orchestration, returning the final ranked list without you managing the intermediate steps.

### Amazon Rerank vs Cohere Rerank

Both models are capable; the choice depends on your specific requirements:

| Aspect | Amazon Rerank 1.0 | Cohere Rerank 3.5 |
|--------|-------------------|-------------------|
| Accuracy | Good | Slightly better on benchmarks |
| Speed | Faster | Comparable |
| Max documents | 100 per request | 100 per request |
| Languages | English-focused | Multilingual (100+ languages) |
| Cost | Lower | Higher |

**Choose Amazon Rerank** for English-only content, when cost matters, or when you want slightly lower latency.

**Choose Cohere Rerank** for multilingual content, when you need maximum accuracy, or when your content spans many languages.

### MMR (Maximal Marginal Relevance)

Pure relevance ranking can produce redundant results. If five chunks from the same document all discuss the same topic, they might all rank highly—but including all five provides no additional information after the first.

MMR penalizes redundancy by balancing relevance against diversity. Each successive result is chosen to be both relevant to the query and different from already-selected results:

```
MMR_score = λ * relevance(doc, query) - (1-λ) * max_similarity(doc, selected_docs)
```

The λ parameter controls the trade-off. Higher λ emphasizes relevance; lower λ emphasizes diversity. A typical value of 0.5 balances both considerations.

With MMR, you get documents that cover different aspects of the topic rather than redundant repetitions of the same information. This is particularly valuable when you're retrieving chunks for context: diverse chunks give the model more information to synthesize.

### Filtering

Metadata filtering constrains results before or after vector search:

**Pre-filtering** applies constraints before the vector search. You're searching a smaller subset of documents:

```python
results = search(
    query_embedding,
    filter={
        'department': 'engineering',
        'document_type': 'policy',
        'last_updated': {'$gte': '2024-01-01'}
    }
)
```

This is efficient because you never even consider irrelevant documents. The vector index only searches the filtered subset.

**Post-filtering** applies constraints after the vector search. You retrieve the top-N by similarity, then filter out documents that don't match your criteria.

Post-filtering is simpler to implement but risky: if your filters eliminate many of the top results, you might return fewer documents than expected or miss relevant content entirely. Pre-filtering is generally preferred when your vector database supports it.

### The Production Pattern

For production RAG systems handling diverse queries, the most robust default is:

**Hierarchical chunking + Hybrid search + Reranking**

Hierarchical chunking gives you precision (child chunks) with context (parent chunks). Hybrid search catches both semantic relevance and exact matches. Reranking ensures the final results are the truly relevant ones from your candidate set.

This pattern handles the widest variety of queries: conceptual questions, specific term searches, multi-part queries, ambiguous phrasing. Start here, then simplify if your specific use case allows it.

---

## Query Handling Techniques

Users type messy queries. They're ambiguous, use different terminology than your documents, include typos, and sometimes ask three questions at once. Query optimization bridges the gap between what users type and what documents contain.

### Query Expansion

Query expansion adds related terms to catch documents that use different vocabulary for the same concepts.

A user asks about "AWS compute options"—but your documents use specific service names. Expand the query to include "EC2," "Lambda," "Fargate," "ECS," and suddenly you retrieve documentation about all these services.

```python
def expand_query(original_query):
    # Use an FM to suggest related terms
    expansion_prompt = f"""Given this query: "{original_query}"
    List 5-10 related terms or synonyms that might appear in relevant documents.
    Output only the terms, comma-separated."""

    related_terms = invoke_model(expansion_prompt)

    # Combine original query with expansions
    expanded = f"{original_query} {related_terms}"
    return expanded
```

You can also build synonym dictionaries for your domain. If users frequently search for "refund" but your policies use "reimbursement," mapping these terms improves retrieval without requiring an FM call.

### Query Decomposition

Complex multi-part questions often retrieve poorly because they don't match any single document well. The query embedding averages across multiple concepts, landing in a vector space region that's close to nothing relevant.

"Compare the cost and performance of EC2 vs Lambda for batch processing" is really several questions:
1. What does EC2 cost?
2. What does Lambda cost?
3. How does EC2 perform for batch processing?
4. How does Lambda perform for batch processing?

```python
def decompose_query(complex_query):
    decomposition_prompt = f"""Break this question into simple sub-questions:
    "{complex_query}"

    Output each sub-question on a new line."""

    sub_queries = invoke_model(decomposition_prompt).strip().split('\n')

    # Retrieve for each sub-query
    all_results = []
    for sub_q in sub_queries:
        results = retrieve(sub_q)
        all_results.extend(results)

    # Deduplicate and return
    return deduplicate(all_results)
```

By retrieving for each sub-query separately, you find documents about EC2 costs, documents about Lambda performance, and so on. The generation model receives all relevant context and can synthesize a comprehensive answer.

### HyDE (Hypothetical Document Embeddings)

HyDE is a clever technique for difficult queries that don't match document vocabulary well.

Instead of embedding the query directly, you ask a foundation model to write a hypothetical answer—what a document answering this question might say. Then you embed that hypothetical document and use it for retrieval.

```python
def hyde_retrieval(query):
    # Generate a hypothetical answer
    hyde_prompt = f"""Write a paragraph that would be found in a document
    answering this question: "{query}"

    Write as if you're quoting from the source document."""

    hypothetical_doc = invoke_model(hyde_prompt)

    # Embed the hypothetical document
    hyde_embedding = embed(hypothetical_doc)

    # Search using the hypothetical embedding
    results = vector_search(hyde_embedding)

    return results
```

Why does this work? The hypothetical document is written in "document style," using vocabulary and phrasing similar to your actual documents. A terse query like "pricing for enterprise tier" becomes a paragraph using terms like "enterprise pricing," "per-user cost," "annual subscription"—terms that appear in actual pricing documentation.

The query embedding might not be close to pricing documents, but the hypothetical answer embedding lands right next to them.

### Query Reformulation

User queries often need cleanup before they'll retrieve well:

```
User types: "how 2 setup vpc peering???"
Reformulated: "How do I configure VPC peering in AWS?"
```

A foundation model can handle this transformation:

```python
def reformulate_query(messy_query):
    reformulation_prompt = f"""Reformulate this query as a clear,
    well-formed question: "{messy_query}"

    Fix any typos, remove unnecessary characters, and make it grammatically correct."""

    clean_query = invoke_model(reformulation_prompt)
    return clean_query.strip()
```

The reformulated query produces better embeddings and retrieves more relevant documents. This preprocessing step costs a model invocation but often pays for itself in improved retrieval quality.

### Conversational Context

In multi-turn conversations, queries often refer to previous context:

"What about the pricing?" doesn't retrieve well alone—"the pricing" of what? Without conversation context, the query is ambiguous and will retrieve documents about pricing generally.

Include relevant conversation history when building retrieval queries:

```python
def contextualize_query(current_query, conversation_history):
    context_prompt = f"""Given this conversation:
    {format_history(conversation_history)}

    The user now asks: "{current_query}"

    Rewrite this as a standalone query that includes necessary context."""

    standalone_query = invoke_model(context_prompt)
    return standalone_query
```

"What about the pricing?" becomes "What is the pricing for the enterprise AWS support plan?" when the conversation context establishes that enterprise support is the topic.

---

## Document Segmentation

Different document types benefit from different chunking approaches. The right segmentation strategy depends on your content structure.

### Structured Documents

Technical documentation, legal contracts, policies, and specifications have clear structural elements: sections, subsections, numbered clauses, headings. Semantic chunking works well here because you can split at these boundaries and each chunk is a coherent unit.

Use headings as metadata for filtering. A chunk from "Section 5.2: Security Requirements" can be tagged with section information, enabling filtered retrieval that scopes to specific parts of the document.

### Unstructured Content

Emails, chat logs, transcripts, and free-form text lack clear structural boundaries. Fixed-size chunking with overlap might work better here since there are no natural break points to respect.

For transcripts, consider speaker turn boundaries as potential split points. For emails, consider threading structure. The best approach depends on how users will query this content.

### Bedrock Knowledge Bases Defaults

Bedrock Knowledge Bases provides automatic chunking with sensible defaults:
- Target chunk size around 300 tokens
- Overlap percentage around 10%
- Automatic detection of document structure (when possible)

These defaults work for many use cases. When they don't, you can configure chunking parameters or implement custom chunking pipelines.

### Custom Chunking Pipelines

Lambda functions triggered by S3 uploads can implement domain-specific chunking logic. When a document lands in your source bucket, the Lambda processes it with your custom rules:

- Split code files by function or class
- Split legal documents by clause
- Split procedures by step
- Split conversations by topic shift

This requires more implementation effort but gives you precise control over how documents are segmented for your specific use case.

---

## Embedding Generation

Quality embeddings are foundational—no amount of sophisticated search can fix embeddings that don't capture semantic relationships well.

### Evaluate on Your Domain

Create a test set: queries with known relevant documents. Generate embeddings with your candidate model and measure recall@k—how often does the relevant document appear in the top-k results?

Compare multiple embedding models on YOUR data. A model that dominates general benchmarks might struggle with your medical terminology, legal jargon, or internal acronyms. Domain-specific evaluation predicts real performance better than benchmark scores.

```python
def evaluate_recall_at_k(test_set, embedding_model, k=5):
    correct = 0
    for item in test_set:
        query_embedding = embedding_model.embed(item['query'])
        results = vector_search(query_embedding, k=k)
        retrieved_ids = [r.doc_id for r in results]

        if item['relevant_doc_id'] in retrieved_ids:
            correct += 1

    return correct / len(test_set)
```

Run this evaluation before committing to an embedding model. Run it again when you're considering switching models.

### Batch Embedding

Processing thousands of documents with individual API calls is slow and expensive. Batch inference dramatically improves throughput and cost.

Bedrock batch inference processes large input datasets from S3, returning results to S3. You prepare a JSONL file with all your texts, submit a batch job, and retrieve the results when complete.

For initial indexing of large document collections, batch processing is essential. Real-time embedding is fine for individual queries; batch processing is necessary for bulk operations.

### Cache Embeddings

Store embeddings alongside document IDs in your vector database. When documents update, only re-embed what changed.

Track document versions or content hashes. When you detect a change, re-embed that specific document and update its vector. Don't re-embed your entire corpus because one document changed.

For frequently-queried queries, consider caching query embeddings as well. If users repeatedly search for the same terms, caching saves embedding latency.

---

## Vector Search Implementation

### OpenSearch k-NN

OpenSearch provides scalable vector search with HNSW (Hierarchical Navigable Small World) indexes. HNSW builds a graph structure that enables approximate nearest neighbor search in logarithmic time—you can search millions of vectors in milliseconds.

"Approximate" means HNSW might not find the mathematically exact nearest neighbors, but it finds very good matches very fast. The accuracy trade-off is configurable and usually negligible.

```python
# OpenSearch k-NN search
search_body = {
    'size': 10,
    'query': {
        'knn': {
            'embedding': {
                'vector': query_embedding,
                'k': 10
            }
        }
    }
}
results = os_client.search(index='documents', body=search_body)
```

### Aurora pgvector

pgvector adds vector operations to PostgreSQL. If you're already using Aurora PostgreSQL, querying vectors with familiar SQL syntax is a significant convenience:

```sql
-- Create a vector column
ALTER TABLE documents ADD COLUMN embedding vector(1024);

-- Create an HNSW index for fast search
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- Search for similar documents
SELECT id, content, 1 - (embedding <=> $1) AS similarity
FROM documents
WHERE department = 'engineering'
ORDER BY embedding <=> $1
LIMIT 10;
```

The `<=>` operator computes cosine distance. pgvector supports both exact search (scan all vectors) and approximate search (using IVFFlat or HNSW indexes).

### Bedrock Knowledge Bases

Bedrock Knowledge Bases abstracts the vector storage and search layer completely. You call the Retrieve API; Bedrock handles vector search internally using its managed infrastructure.

```python
response = bedrock_agent.retrieve(
    knowledgeBaseId='YOUR_KB_ID',
    retrievalQuery={'text': 'What is the password policy?'},
    retrievalConfiguration={
        'vectorSearchConfiguration': {
            'numberOfResults': 5
        }
    }
)
```

This is the simplest option—no vector database to manage, no indexes to tune. The trade-off is less control over search parameters and index configuration.

### Tuning HNSW Parameters

For OpenSearch and pgvector, HNSW index parameters affect the accuracy-speed trade-off:

**ef_construction**: How many candidates to consider when building the index. Higher values produce better-connected graphs but slower index builds.

**ef_search**: How many candidates to consider during search. Higher values improve recall but slow queries.

**m**: Number of connections per node in the graph. Higher values improve recall at the cost of memory.

Start with defaults, then tune based on measured performance. Increase `ef_search` if recall is too low; decrease it if queries are too slow. There's no universal "right" value—it depends on your data characteristics and performance requirements.

---

## Advanced Search Techniques

### Hybrid Search Fusion

Combining vector and keyword search produces two result lists with incompatible scores. Vector similarity returns cosine scores from 0 to 1. BM25 keyword matching returns scores that might range from 0 to 15 or higher. Simply adding these scores would let keyword scores dominate.

**Reciprocal Rank Fusion (RRF)** solves this by using ranks instead of raw scores:

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

Documents that rank well in both lists score highest. Documents that rank well in only one list score lower. The raw score magnitudes don't matter—only relative positions.

**Weighted Combination** is an alternative approach that normalizes scores to a common scale, then applies weights:

```python
def hybrid_score(doc, alpha=0.7):
    # Normalize both scores to 0-1 range
    vector_norm = (doc.vector_score - min_vec) / (max_vec - min_vec)
    keyword_norm = (doc.keyword_score - min_kw) / (max_kw - min_kw)

    # Weighted combination
    return alpha * vector_norm + (1 - alpha) * keyword_norm
```

The α parameter controls the balance. α=1.0 is pure semantic search; α=0.0 is pure keyword search; α=0.7 emphasizes semantics while including keyword relevance.

**When to weight toward keywords**: Searching for exact identifiers (error codes, product SKUs), technical documentation with precise terminology, when users expect exact phrase matching.

**When to weight toward semantics**: Conceptual questions ("how does X work?"), natural language queries from non-experts, when terminology varies across documents.

Bedrock Knowledge Bases' HYBRID mode handles fusion automatically. You enable HYBRID search type and the service manages score combination. For most applications, this automatic fusion works well.

---

## Access Mechanisms

Retrieval systems need standardized interfaces to connect with foundation models. Several patterns enable this connection.

### Function Calling

Modern FMs support function calling—the ability to invoke external tools when they need information. You define a retrieval function with parameters (query, filters, top_k), and the FM calls it when it needs to search your knowledge base.

```python
tools = [{
    'name': 'search_knowledge_base',
    'description': 'Search the company knowledge base for information',
    'input_schema': {
        'type': 'object',
        'properties': {
            'query': {'type': 'string', 'description': 'The search query'},
            'department': {'type': 'string', 'description': 'Optional department filter'},
            'max_results': {'type': 'integer', 'default': 5}
        },
        'required': ['query']
    }
}]
```

The FM decides when to call this function based on the user's question. It might search multiple times with different queries, or not search at all if it can answer from context.

### Converse API with Tools

Bedrock's Converse API supports tools natively, providing a consistent interface across different foundation models:

```typescript
const response = await client.send(new ConverseCommand({
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  messages: [...],
  toolConfig: {
    tools: [{
      toolSpec: {
        name: 'searchDocs',
        description: 'Search the knowledge base for relevant documents',
        inputSchema: {
          json: {
            type: 'object',
            properties: {
              query: { type: 'string' }
            },
            required: ['query']
          }
        }
      }
    }]
  }
}));
```

When the model wants to search, it returns a `tool_use` block specifying the function and arguments. Your application executes the search, then continues the conversation with the results.

### Lambda as Retrieval API

A common pattern wraps retrieval in a Lambda function that the FM invokes via tool calling:

1. FM decides it needs to search
2. FM returns tool_use with search parameters
3. Your application invokes Lambda with those parameters
4. Lambda executes the search (against OpenSearch, Knowledge Bases, etc.)
5. Lambda returns results
6. Your application continues the conversation with results in context

This pattern is flexible—the Lambda can implement any retrieval logic, combine multiple sources, apply business rules, and format results for the model.

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
| "precision" or "high accuracy retrieval" | **Rerank API** |
| "multilingual retrieval" | **Cohere Rerank** (100+ languages) |
| "exact identifiers" or "error codes" | Hybrid search weighted toward **keywords** |
| "combining search results" | **Reciprocal Rank Fusion (RRF)** |
| "retrieve broadly, rerank narrowly" | Embedding search top-N → Rerank to top-K |
| "reduce redundancy in results" | **MMR (Maximal Marginal Relevance)** |
| "Titan Embeddings dimensions" | **256, 512, or 1024** (flexible) |

---

## Key Takeaways

> **1. Chunking is where RAG succeeds or fails.**
> Test different sizes with your content. Too big dilutes semantic signal, too small loses context. Hierarchical chunking gives you both precision and context.

> **2. Titan Embeddings V2 is the default.**
> Flexible dimensions (256/512/1024) let you trade accuracy for cost. The drop-off is gentle—512 dimensions retains ~99% accuracy. Evaluate on YOUR domain.

> **3. Hybrid search is the production default.**
> Combining keyword matching (BM25) with vector similarity catches both exact matches and semantic relevance. Enable HYBRID mode in Bedrock Knowledge Bases.

> **4. Reranking is the precision lever.**
> Retrieve broadly with embeddings (top-20), rerank narrowly (top-5). Cross-encoders catch relevance signals that separate embeddings miss. Worth the latency for high-stakes queries.

> **5. Optimize queries, not just retrieval.**
> Query expansion, decomposition, HyDE, and reformulation bridge the gap between messy user input and clean document text. These preprocessing steps often have outsized impact.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Vector search only** | Pure semantic search misses exact keyword matches. Error code "E-1042" might retrieve general "error" docs instead of the specific match. Use hybrid search. |
| **Wrong chunk size** | Too large and embeddings become semantic mush. Too small and context is lost. Test with your actual content and queries. |
| **Skipping domain evaluation** | An embedding model dominating general benchmarks might struggle with your medical/legal/technical terminology. Evaluate with YOUR data. |
| **No query preprocessing** | Users type messy queries with typos and ambiguity. Query expansion and reformulation dramatically improve retrieval quality. |
| **Assuming retrieval works** | Without measuring recall@k on test queries, you're flying blind. Silent retrieval failures cause wrong answers downstream. |
| **Mixing embedding models** | Documents embedded with Titan V1 won't match queries embedded with Titan V2. Same model everywhere, always. |
