# Vector Stores

**Domain 1 | Task 1.4 | ~35 minutes**

---

## Why This Matters

Vector stores are the secret sauce behind RAG systems. Without a good one, your AI can't find the information it needs to give accurate answers.

Pick the right store and your RAG app feels magical. Pick the wrong one and you'll either drown in complexity or hit walls when you need advanced features.

---

## How Vector Search Works

Forget everything you know about traditional search. When you search Google for "best pizza near me," it's matching keywords. Vector search is completely different—it finds things with similar *meaning*, even if they use totally different words.

### The Magic: Embeddings

Your AI converts text into a list of numbers (1024 for Titan Embeddings V2). These numbers position your text in a massive mathematical space.

The phrase "automobile repair" ends up near "car mechanic" in this space—not because they share words, but because they mean similar things. The embedding model learned these relationships by reading billions of documents.

### How It Works

1. Convert the question into numbers (embedding)
2. Find the documents whose numbers are closest
3. These are your most semantically relevant matches

### Speed at Scale: HNSW

**HNSW** (Hierarchical Navigable Small World graphs) creates a layered graph structure that finds approximate nearest neighbors incredibly fast.

It might not find the mathematically *perfect* matches, but it finds very close matches in milliseconds instead of seconds. That trade-off is worth it.

### How HNSW Actually Works

Understanding the algorithm helps you tune it properly and choose the right index type.

HNSW builds a multi-layer graph:

```
Layer 2:  A -------- B              (sparse, long-range connections)
          |          |
Layer 1:  A --- C -- B --- D        (medium connections)
          |    |    |    |
Layer 0:  A-E-C-F-B-G-D-H           (dense, all vectors)
```

**Search Process**:
1. Start at the top layer with few nodes and long-range connections
2. Navigate greedily toward the query vector
3. Drop to the next layer when you can't get closer
4. At the bottom layer, explore the local neighborhood
5. Return the k nearest neighbors found

This hierarchical approach means you don't scan every vector. For a million vectors, you might visit only a few thousand nodes to find excellent matches.

**Key Parameters**:

| Parameter | Effect | Trade-off |
|-----------|--------|-----------|
| **M** (connections per node) | Higher = more accurate, slower build | Memory vs quality |
| **ef_construction** | Build-time search depth | Build speed vs index quality |
| **ef_search** | Query-time search depth | Query speed vs accuracy |

In OpenSearch, you configure these in the index mapping:

```json
{
  "settings": {
    "index.knn": true,
    "index.knn.algo_param.ef_search": 100
  },
  "mappings": {
    "properties": {
      "embedding": {
        "type": "knn_vector",
        "dimension": 1024,
        "method": {
          "name": "hnsw",
          "space_type": "cosinesimil",
          "engine": "nmslib",
          "parameters": {
            "ef_construction": 256,
            "m": 16
          }
        }
      }
    }
  }
}
```

### HNSW vs IVF: Choosing the Right Algorithm

**IVF** (Inverted File Index) is an alternative to HNSW with different trade-offs:

| Aspect | HNSW | IVF |
|--------|------|-----|
| Query speed | Faster | Slower |
| Index build time | Slower | Faster |
| Memory usage | Higher | Lower |
| Update performance | Better | Worse (requires retraining) |
| Best for | Real-time queries | Large, static datasets |

**When to use HNSW** (the default choice):
- Production RAG with real-time queries
- Frequently updated document collections
- When query latency matters most

**When to consider IVF**:
- Very large datasets (billions of vectors)
- Memory-constrained environments
- Mostly static datasets that rarely update

Aurora pgvector supports both `ivfflat` and `hnsw` indexes:

```sql
-- IVF index (faster to build, more memory-efficient)
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- HNSW index (faster queries, better for updates)
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);
```

### k-NN

**k-Nearest Neighbors** is the algorithm doing the matching—find the k documents most similar to the query.

If k=5, you get the 5 closest matches. Simple concept, powerful results.

---

## Vector Store Options in AWS

You have three main choices. Think of it like choosing a car: sometimes you need a minivan, sometimes a sports car, sometimes what you already have in the garage.

### Bedrock Knowledge Bases (The Minivan)

Does everything you need, zero maintenance.

Point it at your S3 bucket, pick an embedding model, and you're done. Bedrock handles:
- Parsing PDFs and Word docs
- Chunking them into pieces
- Generating embeddings
- Storing vectors
- Keeping everything synced when documents change

**Most RAG projects should start here.**

### OpenSearch Service (The Sports Car)

More power, more control, more work.

OpenSearch gives you:
- **Hybrid search**: Combining keyword matching with vector similarity
- Advanced filtering
- Custom scoring
- Fine control over sharding

Use OpenSearch when Bedrock KB's features aren't enough or when you're dealing with billions of vectors.

### OpenSearch Serverless: Collection Types

If you want OpenSearch without managing clusters, **OpenSearch Serverless** is the answer. But you need to choose the right **collection type**—and this is exam-critical:

**SEARCH Collection**
- Traditional full-text and keyword search
- Uses standard OpenSearch indexes
- NOT optimized for vector search
- Best for: Log analytics, traditional search applications

**VECTORSEARCH Collection**
- Optimized specifically for k-NN vector operations
- HNSW algorithm with tuned settings
- Required for RAG and semantic search
- Best for: Embeddings, similarity search, Knowledge Bases

**TIMESERIES Collection**
- Optimized for time-stamped data
- Best for: Logs, metrics, observability data

**The critical exam point**: If you see "semantic search" or "RAG" with OpenSearch Serverless, the answer is **VECTORSEARCH** collection type. Using a SEARCH collection for embeddings works but performs poorly.

```python
# Creating a vector search collection
response = aoss_client.create_collection(
    name='my-rag-vectors',
    type='VECTORSEARCH',  # Critical!
    description='Vector store for RAG application'
)
```

**Capacity Management**

OpenSearch Serverless uses **OCUs** (OpenSearch Compute Units):
- **Indexing OCUs**: Scale with data ingestion rate
- **Search OCUs**: Scale with query load

Minimum: 2 OCUs (1 indexing + 1 search). It scales automatically based on workload, but you pay for what you provision.

For Bedrock Knowledge Bases with OpenSearch Serverless, AWS manages the collection and OCU scaling automatically.

### Aurora pgvector (What's in the Garage)

If your team already uses PostgreSQL, adding vectors to the same database simplifies your architecture.

- Query vectors with familiar SQL syntax
- Join vector results with your relational data
- No new database to learn

But it lacks some bells and whistles that dedicated vector databases offer.

### The Most Common Mistake

Choosing OpenSearch "just in case" when Bedrock KB would be plenty. That's like buying a sports car for grocery runs—you're paying for complexity you don't need.

---

## Document Chunking Strategies

You can't just throw a 100-page document at an embedding model. Models have limits, and even if they didn't, a single embedding for an entire book would be too vague to match specific queries.

Solution? Chop documents into smaller chunks.

### Fixed-Size Chunking

The straightforward approach: split every N tokens with configurable overlap.

**Bedrock KB defaults**: 512 max tokens with 20% overlap.

**Good for**: Dev/testing where you want fast iteration.

**The downside**: You might slice a sentence in half.

### Semantic Chunking

Uses an embedding model to analyze relationships within text and splits at natural meaning boundaries.

**Configure**:
- Max buffer size (surrounding sentences to consider)
- Max token size (20-8,192 tokens per chunk)
- Breakpoint threshold (95% recommended)

**Important**: Semantic chunking costs extra because it runs an FM during ingestion.

**Best for**: Uniformly dense prose documents.

### Hierarchical Chunking

The production powerhouse—often the **recommended default**.

Creates **parent chunks** (~1000 tokens) and **child chunks** (~500 tokens) with overlap (~70 tokens).

During retrieval, the system finds relevant children but can substitute broader parent chunks for context.

**Best for**: Technical manuals, legal documents, anything with nested structure.

### Critical Point

**You cannot change chunking strategy after creating a data source.** Choose wisely upfront, or you'll re-ingest everything.

### Production Pattern

**Hierarchical + hybrid search + reranking**

It's the most robust default. Use SEMANTIC only for uniformly dense prose. Use FIXED_SIZE in dev for fast iteration.

---

## Metadata and Filtering

Pure vector search returns whatever's semantically similar. But what if you need results from a specific department? Or documents the user actually has permission to access?

That's where metadata filtering saves the day.

### What is Metadata?

Extra info attached to each vector—key-value pairs:

```json
{
  "department": "engineering",
  "date": "2024-01-15",
  "access_level": "confidential"
}
```

### Pre-Filtering

Apply constraints before vector search. User asks about engineering policies? First narrow to engineering documents, then find the semantically best matches.

Efficient because you're searching a smaller pile.

### Post-Filtering

Run vector search first, then filter results. Simpler to implement but risky—if many top matches fail the filter, you end up with few results.

### Access Control

The killer use case. Tag documents with access levels, then filter based on who's asking.

Users can't retrieve documents they shouldn't see—even if those docs are perfect semantic matches for their query.

**This isn't optional for most enterprise deployments.**

### Plan Your Schema

Design metadata fields before bulk ingestion. Adding fields later typically means re-processing all documents.

---

## Selecting Vector Databases

### When to Use Bedrock Knowledge Bases

Your starting point. It handles everything:
- Document parsing
- Chunking
- Embedding
- Storage
- Sync

Most RAG use cases don't need more than this.

### When to Use OpenSearch

When you genuinely need its superpowers:
- Hybrid search (keyword + vector)
- Advanced filtering with complex boolean logic
- Fine-grained sharding control for billion-vector scale

### When to Use Aurora pgvector

When your team already lives in PostgreSQL. Adding vector search to your existing database is simpler than introducing a new data store.

### The Anti-Pattern

Choosing OpenSearch "for future flexibility" when Bedrock KB handles your current needs. You're trading operational simplicity for hypothetical benefits.

---

## Implementing Metadata

### S3 Object Metadata

Your foundation for Bedrock Knowledge Bases.

When uploading documents, attach metadata properties: content type, author, department, creation date, access level.

Bedrock KB extracts this during ingestion and lets you filter on it during retrieval.

### Design Thoughtfully

Ask yourself:
- What filters will users need?
- Date ranges?
- Departments?
- Document types?
- Access control?

Each required filter needs a metadata field.

### For Custom Implementations

OpenSearch puts metadata in the document body with proper index mappings. Aurora uses relational columns next to the vector column.

---

## Indexing Strategies

When dealing with millions of vectors, indexing strategy determines whether searches take milliseconds or seconds.

### OpenSearch Sharding

Distributes vectors across multiple nodes. Each shard handles part of the data and query load.

Size shards based on your data volume—oversized shards hurt performance, too many small shards add complexity.

### Multi-Index Strategies

Separate different document types into their own indexes. HR docs get one index, technical docs get another.

Queries route to the right index based on the request, shrinking the search space.

### Hierarchical Indexing

Create parent-child relationships. Parents might be section summaries; children contain details.

Query parents to find relevant sections, then drill into children.

### For Bedrock Knowledge Bases

All this is handled automatically.

---

## Knowledge Base Integration

Connect your document sources to the vector store and keep everything synchronized.

### Data Sources

Bedrock Knowledge Bases supports:
- S3 buckets with documents
- Confluence spaces
- SharePoint sites
- Web crawlers

For each source, configure the connection, specify what to include, and set sync schedules.

### Sync Schedules

- **On-demand**: Trigger manually
- **Scheduled**: Hourly, daily, weekly

For rapidly changing content, sync often. For stable archives, weekly is fine.

### Document Structure

Well-organized documents with clear headings produce better chunks than walls of text.

Consider preprocessing documents to improve structure before ingestion.

### Custom Implementations

Lambda functions triggered by S3 events can process new documents, generate embeddings, and insert vectors into OpenSearch or Aurora.

Step Functions orchestrate complex multi-stage pipelines with error handling.

### Track Your Mappings

Maintain mapping between source documents and their vectors. When you update or delete a source document, update or remove its vectors too.

---

## Maintaining Vector Stores

Vector stores go stale without maintenance. Documents get added, modified, deleted—if your vectors don't keep up, your RAG system serves outdated information.

### Incremental Updates

Process only what changed, not the entire corpus. Essential for large knowledge bases.

Track document versions or modification timestamps to identify changes.

### S3 Event Notifications

Objects get created, modified, or deleted—S3 fires events. Lambda functions respond, processing affected documents.

### Bedrock KB Handles This

The service tracks what's been processed and only handles changes since last sync.

### Handle Deletions

When a source document disappears, its vectors must go too. Otherwise your RAG might return information from deleted documents.

### Monitor Sync Health

CloudWatch tracks:
- Failed syncs
- Processing delays
- Growing backlogs

Build observability from the start.

---

## Vector Store Selection Guide

| Criterion | Bedrock KB Managed | OpenSearch Service | Aurora pgvector |
|-----------|-------------------|-------------------|-----------------|
| Setup complexity | Lowest | Medium | Medium |
| Hybrid search | Yes (HYBRID mode) | Yes (Neural plugin) | Manual implementation |
| Operational burden | Minimal | Medium | Medium |
| Best fit | Most RAG apps | Advanced search, large scale | PostgreSQL teams |

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "SIMPLEST" or "minimal operational overhead" | Bedrock Knowledge Bases |
| "hybrid search" or "keyword + semantic" | OpenSearch or Bedrock KB HYBRID mode |
| "existing PostgreSQL infrastructure" | Aurora pgvector |
| "production RAG" or "complex documents" | Hierarchical chunking |
| "cost-conscious" or "simple docs" | Fixed-size chunking |
| "OpenSearch Serverless" + "semantic search" | **VECTORSEARCH** collection type |
| "tune search accuracy vs speed" | HNSW **ef_search** parameter |
| "memory-constrained" or "large static dataset" | **IVF** index over HNSW |
| "real-time updates" to vectors | **HNSW** (IVF requires retraining) |

---

## Key Takeaways

> **1. Bedrock KB is the starting point.**
> Handles parsing, chunking, embedding, and sync automatically. Most RAG projects don't need more than this.

> **2. OpenSearch for genuine requirements.**
> Hybrid search, advanced boolean filtering, billion-vector scale. Use when you actually need these features, not "just in case."

> **3. Aurora pgvector if you're already there.**
> Adding vectors to existing PostgreSQL is simpler than introducing a new database. But don't choose it as a default.

> **4. Chunking strategy matters enormously.**
> Hierarchical + hybrid search + reranking is the production default. Test different sizes with your actual content and queries.

> **5. Plan metadata schema upfront.**
> Adding fields later means re-processing all documents. Design filters before bulk ingestion.

> **6. Chunking is permanent per data source.**
> You cannot change chunking strategy after creating a data source. Choose wisely or prepare to re-ingest everything.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Choosing OpenSearch "just in case"** | Like buying a sports car for grocery runs. You're paying for complexity you don't need. Start with Bedrock KB. |
| **Reimplementing what Bedrock KB does** | The service handles parsing, chunking, embedding, and sync. Building this yourself wastes time. |
| **Vector search only** | When users search for exact terms like error code 'E-1042', pure semantic search fails. Enable hybrid mode. |
| **DynamoDB for vectors** | DynamoDB is for metadata, not vector similarity search. Use a proper vector store. |
| **No metadata planning** | Adding filter fields after ingestion means re-processing all documents. Design the schema before bulk loading. |
