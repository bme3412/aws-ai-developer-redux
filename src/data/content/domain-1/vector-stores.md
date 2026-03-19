# Vector Stores

**Domain 1 | Task 1.4 | ~40 minutes**

---

## Why This Matters

Vector stores are the memory layer that makes RAG possible. Without them, your AI has no way to find relevant information from your documents—it's just a language model making things up based on training data. With the right vector store, your RAG system feels almost magical: users ask questions in natural language and get accurate answers grounded in your actual documentation.

But choosing the wrong vector store creates problems that compound over time. Pick something too simple and you'll hit walls when you need hybrid search or advanced filtering. Pick something too complex and you're managing infrastructure instead of building features. The choice matters, and it's harder to change later than most architectural decisions because your data is embedded in a specific format with specific metadata schemas.

Understanding how vector search actually works—not just which AWS service to use—helps you make better decisions about indexing strategies, chunking approaches, and performance tuning. The exam tests this conceptual understanding, not just service names.

---

## The Mathematics of Meaning

Traditional search engines match keywords. You search for "automobile repair" and they find documents containing those exact words. Vector search is fundamentally different: it finds documents with similar meaning, even when they use completely different vocabulary.

### How Embeddings Capture Meaning

When you pass text through an embedding model like Amazon Titan Embeddings V2, it converts that text into a list of numbers called a vector. Titan V2 produces vectors with up to 1024 dimensions—meaning each piece of text becomes a point in a 1024-dimensional mathematical space.

The magic happens because of how embedding models are trained. They process billions of documents, learning that "automobile repair" appears in similar contexts as "car mechanic," "vehicle maintenance," and "auto shop." During training, the model adjusts its internal weights so that semantically similar phrases produce similar vectors—they end up close together in that high-dimensional space.

This isn't keyword matching. The phrase "how do I fix my car" might share zero words with a document titled "Automotive Maintenance Guide: Engine Troubleshooting," but their embeddings could be very close because they're about the same concept. The embedding model learned these relationships implicitly from massive amounts of text.

### Distance Metrics: Measuring Similarity

Once you have vectors, you need a way to measure how "close" they are. Several distance metrics exist, each with different mathematical properties:

**Cosine Similarity** is the most common choice for text embeddings. It measures the angle between two vectors, ignoring their length. Two vectors pointing in the same direction have cosine similarity of 1.0, regardless of whether one is twice as long. This makes cosine similarity robust to variations in text length—a short question and a long document can still be highly similar if they're about the same topic. In most vector stores, you'll see this configured as `cosinesimil` or `cosine`.

**Euclidean Distance (L2)** measures the straight-line distance between two points in space. Unlike cosine similarity, it considers vector magnitude. This matters when the embedding model encodes information in the vector's length, not just its direction. L2 distance is often used for image embeddings but is less common for text. Smaller values mean more similar.

**Dot Product** is computationally efficient and works well when vectors are normalized (all the same length). It's essentially cosine similarity without the normalization step. If your embedding model already normalizes outputs, dot product gives identical rankings to cosine similarity but computes faster.

For Titan Embeddings V2, cosine similarity is the recommended default. The model outputs normalized vectors, so dot product would work identically, but cosine is the standard configuration in AWS documentation and examples.

### Dimension Trade-offs

Titan Embeddings V2 offers configurable dimensions: 256, 512, or 1024. This flexibility exists because embedding dimensions directly impact both quality and cost.

Higher dimensions capture more nuanced semantic relationships. A 1024-dimensional vector can represent subtle differences between concepts that might collapse together in 256 dimensions. Think of it like image resolution: more pixels capture more detail, but require more storage and processing.

But higher dimensions aren't free. Each vector requires 4 bytes per dimension (32-bit floats), so a 1024-dim vector uses 4KB of storage. With millions of documents, this adds up. More importantly, distance calculations scale with dimension count—comparing 1024-dimensional vectors takes four times longer than comparing 256-dimensional vectors.

AWS recommends 512 dimensions as a balanced default. Testing shows 512 dims retain about 99% of the semantic quality of 1024 dims for most use cases, while using half the storage. If you're memory-constrained or working with billions of vectors, 256 dimensions (which retain about 97% quality) might be worth the trade-off. If you're doing fine-grained semantic distinctions—say, differentiating between legal clauses with subtle differences—1024 dimensions might be worth the extra cost.

You configure dimensions when generating embeddings, not when storing them:

```python
import boto3
import json

bedrock = boto3.client('bedrock-runtime')

response = bedrock.invoke_model(
    modelId='amazon.titan-embed-text-v2:0',
    body=json.dumps({
        'inputText': 'How do I reset my password?',
        'dimensions': 512,  # Options: 256, 512, 1024
        'normalize': True   # Recommended for cosine similarity
    })
)

result = json.loads(response['body'].read())
embedding = result['embedding']  # List of 512 floats
```

---

## Approximate Nearest Neighbor Search

Finding the k most similar vectors to a query sounds simple, but becomes a computational nightmare at scale. With exact search, comparing a query against 10 million vectors requires 10 million distance calculations. Even if each calculation takes a microsecond, that's 10 seconds per query—completely unusable for real-time applications.

Approximate Nearest Neighbor (ANN) algorithms solve this by accepting a small accuracy trade-off for massive speed improvements. They might not find the mathematically perfect top-k matches, but they find very good matches in milliseconds instead of seconds. For RAG applications, this trade-off is almost always worth it—the difference between the "best" match and the "nearly best" match rarely affects answer quality.

### HNSW: The Default Choice

**HNSW** (Hierarchical Navigable Small World graphs) is the most popular ANN algorithm for production vector search. Understanding how it works helps you tune it properly.

HNSW builds a multi-layered graph structure. At the bottom layer (Layer 0), every vector exists as a node with connections to nearby vectors. Upper layers progressively thin out, keeping only some vectors but with longer-range connections. The structure looks like this:

| Layer | Nodes | Density | Connections |
|-------|-------|---------|-------------|
| Layer 2 | A, B | Sparse | Long jumps between distant nodes |
| Layer 1 | A, B, C, D | Medium | Moderate-range connections |
| Layer 0 | A-J (all vectors) | Dense | Short connections to nearest neighbors |

When searching for the nearest neighbors to a query vector:

1. Start at the highest layer with just a few widely-spaced nodes
2. Find the node closest to your query at this layer
3. Use that node's long-range connections to jump toward the query region
4. Drop down to the next layer, which has more nodes
5. Repeat: find closer nodes, use their connections to navigate
6. At the bottom layer, explore the local neighborhood thoroughly
7. Return the k nearest vectors found

This hierarchical navigation is why HNSW is so fast. For a million vectors, you might visit only a few thousand nodes to find excellent matches. The top layers let you quickly navigate to the right region; the bottom layer finds the precise matches.

### HNSW Parameters

Three parameters control HNSW behavior, each with important trade-offs:

**M** (connections per node) determines how many edges each node has. Higher M means more connections, which improves search accuracy because you have more paths to navigate. But it also increases memory usage (more edges to store) and slows down index building (more connections to create). Default values range from 12-16. Use higher M (32-64) for higher recall requirements; use lower M (8-12) for memory-constrained environments.

**ef_construction** controls how thoroughly the algorithm explores when building the index. Higher values create a better-connected graph that searches more accurately. But building takes longer. This is a one-time cost, so if you're not frequently rebuilding indexes, err toward higher values (256-512). For frequently updated indexes, lower values (128) reduce ingestion latency.

**ef_search** controls search-time thoroughness. Higher values explore more nodes, finding better matches but taking longer. This is the parameter you tune most often because it directly affects query latency. Start with ef_search roughly equal to k (the number of results you want), then increase until accuracy plateaus.

Here's how these parameters appear in an OpenSearch index mapping:

```json
{
  "settings": {
    "index.knn": true,
    "index.knn.algo_param.ef_search": 100
  },
  "mappings": {
    "properties": {
      "content_embedding": {
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
      },
      "content": { "type": "text" },
      "metadata": {
        "properties": {
          "department": { "type": "keyword" },
          "created_date": { "type": "date" }
        }
      }
    }
  }
}
```

### IVF: The Alternative

**IVF** (Inverted File Index) takes a different approach. Instead of building a graph, it clusters vectors into groups (called Voronoi cells or "lists"). Each cluster has a centroid, and vectors are assigned to the cluster whose centroid is closest.

During search, you first find the closest centroids to your query, then search only within those clusters. If you have 1000 clusters and search 10 of them, you've reduced your search space by 100x.

IVF has different trade-offs than HNSW:

| Aspect | HNSW | IVF |
|--------|------|-----|
| Query speed | Faster | Slower |
| Index build time | Slower | Faster |
| Memory usage | Higher | Lower |
| Update handling | Good (incremental) | Poor (requires retraining) |
| Best for | Real-time, dynamic data | Large static datasets |

The update handling difference is critical. HNSW can add new vectors incrementally—just insert them into the graph. IVF's clusters are based on the data distribution when the index was built. If you add many new vectors, the clusters become imbalanced and search quality degrades. You need to periodically rebuild the index (recompute centroids), which takes time.

**Use HNSW** (the default) for production RAG applications where documents are added, updated, and deleted regularly. **Consider IVF** for massive datasets (billions of vectors) that rarely change, or when memory is severely constrained.

Aurora pgvector supports both algorithms:

```sql
-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table with a vector column
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1024),
    department TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- IVF index: faster to build, lower memory, poor for updates
CREATE INDEX documents_ivf_idx ON documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- HNSW index: slower to build, higher memory, good for updates
CREATE INDEX documents_hnsw_idx ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### k-Nearest Neighbors

The "k" in k-NN is simply how many results you want. If k=5, you get the 5 vectors most similar to your query. For RAG applications, k typically ranges from 3 to 10—enough context to answer questions, but not so much that you overwhelm the language model's context window or include marginally relevant documents.

The right k depends on your use case. For straightforward factual questions, k=3 might be plenty. For complex questions requiring synthesis across multiple sources, k=10 gives the model more material to work with. Some systems dynamically adjust k based on query complexity or retrieve extra candidates for reranking (retrieve 20, rerank down to 5).

---

## AWS Vector Store Options

AWS offers three main paths for vector storage, each optimized for different scenarios. The right choice depends on your team's existing infrastructure, scale requirements, and feature needs.

### Bedrock Knowledge Bases

Bedrock Knowledge Bases is the fully managed option that handles the entire RAG pipeline. You point it at document sources (S3, Confluence, SharePoint, web pages), choose an embedding model, and it handles everything else: parsing documents, chunking them, generating embeddings, storing vectors, and keeping everything synchronized when sources change.

This is where most RAG projects should start. The service eliminates entire categories of operational work: you don't manage indexes, tune parameters, or build sync pipelines. It just works.

Behind the scenes, Bedrock KB uses OpenSearch Serverless as its default vector store (you can also bring your own OpenSearch, Aurora pgvector, or Pinecone). But you don't interact with the vector store directly—you use the Retrieve and RetrieveAndGenerate APIs:

```python
import boto3

bedrock_agent = boto3.client('bedrock-agent-runtime')

# Simple retrieval
response = bedrock_agent.retrieve(
    knowledgeBaseId='YOUR_KB_ID',
    retrievalQuery={'text': 'What is the return policy for electronics?'},
    retrievalConfiguration={
        'vectorSearchConfiguration': {
            'numberOfResults': 5,
            'overrideSearchType': 'HYBRID'  # Combine semantic + keyword
        }
    }
)

for result in response['retrievalResults']:
    print(f"Score: {result['score']:.3f}")
    print(f"Content: {result['content']['text'][:200]}...")
    print(f"Source: {result['location']['s3Location']['uri']}")
    print("---")
```

When to use Bedrock Knowledge Bases:
- You want minimal operational overhead
- Your document count is under a few million
- Standard chunking strategies work for your content
- You don't need custom index configurations

When to consider alternatives:
- You need fine-grained control over indexing parameters
- Your scale exceeds Bedrock KB's limits
- You need features Bedrock KB doesn't support (custom scoring, complex aggregations)

### OpenSearch Service

OpenSearch is the power-user option. It's a distributed search engine that happens to support vector search through its k-NN plugin. You get all of OpenSearch's capabilities: hybrid search combining keywords and vectors, complex boolean filtering, custom scoring functions, aggregations, and fine-grained sharding control.

This power comes with operational cost. You're managing a cluster (or paying for OpenSearch Serverless), tuning index settings, building ingestion pipelines, and handling the complexity that comes with distributed systems.

The vector search capabilities are excellent:

```python
from opensearchpy import OpenSearch

client = OpenSearch(
    hosts=[{'host': 'your-domain.us-east-1.es.amazonaws.com', 'port': 443}],
    http_auth=('username', 'password'),
    use_ssl=True
)

# Hybrid search: combine vector similarity with keyword matching
query = {
    "size": 10,
    "query": {
        "hybrid": {
            "queries": [
                {
                    "bool": {
                        "should": [
                            {"match": {"content": "password reset procedure"}},
                            {"match": {"title": "password reset"}}
                        ]
                    }
                },
                {
                    "knn": {
                        "content_embedding": {
                            "vector": query_vector,  # Your query embedding
                            "k": 10
                        }
                    }
                }
            ]
        }
    },
    # Filter results by metadata
    "post_filter": {
        "bool": {
            "must": [
                {"term": {"department": "IT"}},
                {"range": {"created_date": {"gte": "2024-01-01"}}}
            ]
        }
    }
}

results = client.search(index='documents', body=query)
```

### OpenSearch Serverless Collection Types

OpenSearch Serverless removes cluster management but requires choosing the right collection type. This is an exam favorite because the wrong choice causes real problems.

**VECTORSEARCH collections** are optimized specifically for k-NN operations. They use HNSW indexes with tuned settings, allocate resources appropriately for vector workloads, and integrate with Bedrock Knowledge Bases. If your use case involves embeddings and semantic search—which includes all RAG applications—this is the correct collection type.

**SEARCH collections** are optimized for traditional full-text and keyword search. They use standard inverted indexes. While you can technically store vectors here, performance will be poor because the infrastructure isn't optimized for high-dimensional similarity calculations. The exam loves questions where the wrong collection type is causing "slow vector queries"—the fix is switching to VECTORSEARCH.

**TIMESERIES collections** are optimized for time-stamped data like logs and metrics. They use time-based partitioning for efficient temporal queries. Not relevant for RAG or vector search.

```python
import boto3

aoss_client = boto3.client('opensearchserverless')

# Create a vector search collection for RAG
response = aoss_client.create_collection(
    name='product-knowledge-vectors',
    type='VECTORSEARCH',  # Critical for semantic search!
    description='Vector store for product documentation RAG'
)

# You also need security policies
aoss_client.create_security_policy(
    name='product-kb-encryption',
    type='encryption',
    policy=json.dumps({
        "Rules": [{"ResourceType": "collection", "Resource": ["collection/product-knowledge-vectors"]}],
        "AWSOwnedKey": True
    })
)

aoss_client.create_access_policy(
    name='product-kb-access',
    type='data',
    policy=json.dumps([{
        "Rules": [
            {"ResourceType": "index", "Resource": ["index/product-knowledge-vectors/*"], "Permission": ["aoss:*"]},
            {"ResourceType": "collection", "Resource": ["collection/product-knowledge-vectors"], "Permission": ["aoss:*"]}
        ],
        "Principal": ["arn:aws:iam::123456789012:role/KnowledgeBaseRole"]
    }])
)
```

OpenSearch Serverless uses **OCUs** (OpenSearch Compute Units) for capacity. You have separate indexing OCUs and search OCUs. The minimum is 2 total OCUs (1 indexing + 1 search), and the service scales automatically based on workload. Each OCU costs roughly $0.24/hour, so even minimum capacity runs about $350/month—factor this into cost planning.

For Bedrock Knowledge Bases using OpenSearch Serverless as the vector store, AWS manages the collection automatically. You don't configure OCUs or collection types; the service handles it.

### Aurora PostgreSQL with pgvector

If your team already runs PostgreSQL, adding vector search capabilities to your existing database is often simpler than introducing an entirely new data store. The pgvector extension adds vector types and similarity search to PostgreSQL, letting you query vectors with familiar SQL.

The appeal is integration with relational data. You can join vector similarity results with user tables, transaction history, or any other data in your database. This is powerful for applications where context depends on both semantic similarity and relational relationships:

```sql
-- Find similar products that are in stock and match user preferences
SELECT
    p.product_id,
    p.name,
    p.price,
    1 - (p.embedding <=> query_embedding) AS similarity
FROM products p
JOIN inventory i ON p.product_id = i.product_id
JOIN user_preferences up ON up.category = p.category
WHERE
    i.quantity > 0
    AND up.user_id = 12345
ORDER BY p.embedding <=> query_embedding
LIMIT 10;
```

The `<=>` operator computes cosine distance (1 - cosine similarity), `<->` computes L2 distance, and `<#>` computes negative inner product.

pgvector limitations:
- Scale is bounded by what PostgreSQL can handle (millions of vectors, not billions)
- No built-in hybrid search (you need to implement keyword matching separately)
- Fewer vector-specific optimizations than dedicated vector databases
- Index building for HNSW can be slow and memory-intensive

When to use Aurora pgvector:
- Your team already runs PostgreSQL and values operational simplicity
- You need joins between vector results and relational data
- Your scale is in the millions, not billions, of vectors
- You prefer SQL over specialized vector APIs

When to consider alternatives:
- You need hybrid search out of the box
- Your scale is approaching billions of vectors
- You need advanced features like multi-tenancy, filtering optimizations, or custom scoring

### The Selection Decision

For most new RAG projects, start with Bedrock Knowledge Bases. It handles the entire pipeline, integrates well with other Bedrock features, and requires minimal operational investment. You can always migrate later if you outgrow it.

Choose OpenSearch when you genuinely need its capabilities: hybrid search, complex filtering, custom scoring, or billion-vector scale. Don't choose it "just in case"—you're trading operational simplicity for features you might never use.

Choose Aurora pgvector when PostgreSQL is already central to your architecture and you want vector search without adding another data store. The SQL integration can be valuable, but you're giving up some vector-specific features.

---

## Document Chunking Strategies

You can't just embed entire documents. A single embedding for a 100-page manual would be too vague to match specific queries—it would represent the "average meaning" of all 100 pages, matching many queries weakly rather than specific queries strongly. Additionally, embedding models have token limits (typically 512-8192 tokens), so long documents literally can't be processed in one pass.

Chunking—splitting documents into smaller pieces—is essential. But how you chunk dramatically affects retrieval quality.

### Fixed-Size Chunking

The simplest approach: split documents every N tokens with some overlap between chunks. Bedrock Knowledge Bases defaults to 512 tokens maximum with 20% overlap (about 100 tokens).

The overlap ensures that concepts spanning chunk boundaries appear in at least one complete chunk. Without overlap, a sentence split across two chunks might not match queries about its topic in either chunk.

```python
# Conceptual fixed-size chunking
def fixed_size_chunk(text, max_tokens=512, overlap_percent=0.2):
    words = text.split()
    overlap = int(max_tokens * overlap_percent)
    chunks = []

    for i in range(0, len(words), max_tokens - overlap):
        chunk = ' '.join(words[i:i + max_tokens])
        chunks.append(chunk)

    return chunks
```

Fixed-size chunking is fast and predictable but naive. It ignores document structure completely—you might slice a sentence in half, separate a heading from its content, or split a code block across chunks. For simple documents or rapid prototyping, it works fine. For production with complex documents, you usually want something smarter.

### Semantic Chunking

Semantic chunking uses an embedding model to identify natural meaning boundaries. It computes embeddings for sentences or paragraphs, then splits where semantic similarity between adjacent segments drops significantly.

The intuition: within a coherent topic, adjacent sentences have similar embeddings. When the topic shifts, embeddings diverge. By detecting these divergence points, you split at natural boundaries rather than arbitrary token counts.

Bedrock Knowledge Bases supports semantic chunking with configurable parameters:
- **Buffer size**: How many surrounding sentences to consider when computing similarity
- **Max token size**: Maximum chunk size (range: 20-8,192 tokens)
- **Breakpoint threshold**: Similarity drop required to trigger a split (95% recommended)

Semantic chunking costs more because it runs the embedding model during ingestion, not just during retrieval. For large document collections, this adds significant cost and time. But for documents where structure varies (different authors, formats, or topics interleaved), semantic chunking often produces better retrieval quality.

### Hierarchical Chunking

Hierarchical chunking is the production-grade approach, often the recommended default for complex documents. It creates multiple chunk sizes simultaneously, maintaining parent-child relationships.

**Parent chunks** are larger (around 1000 tokens) and capture broader context. **Child chunks** are smaller (around 500 tokens) and capture specific details. During retrieval, the system searches child chunks (which are more specific) but can optionally return parent chunks (which provide more context).

This solves a fundamental tension: small chunks match specific queries precisely but lack context, while large chunks provide context but match imprecisely. Hierarchical chunking gives you both. When a child chunk matches, you know the specific passage *and* have the surrounding context available.

```python
# Conceptual hierarchical chunking structure
{
    "parent_chunk": {
        "id": "parent_001",
        "content": "Full section about password policies...",  # ~1000 tokens
        "children": ["child_001", "child_002", "child_003"]
    },
    "child_chunks": [
        {
            "id": "child_001",
            "content": "Password requirements: minimum 12 characters...",  # ~300 tokens
            "parent": "parent_001"
        },
        {
            "id": "child_002",
            "content": "Password expiration: passwords must be changed every 90 days...",
            "parent": "parent_001"
        }
    ]
}
```

Bedrock Knowledge Bases supports hierarchical chunking with configurable parent and child sizes. The default overlap between chunks is about 70 tokens, ensuring boundary concepts appear in multiple chunks.

### Choosing a Strategy

**For development and testing**: Fixed-size chunking is fast to iterate with. You're focused on other parts of the system; good-enough chunking is fine.

**For production with varied documents**: Hierarchical chunking is the robust default. It handles technical manuals, legal documents, and mixed-format content well.

**For uniformly dense prose**: Semantic chunking works well when documents don't have clear structural hierarchy—think dense paragraphs without headers or sections.

**The critical constraint**: You cannot change chunking strategy after creating a data source in Bedrock Knowledge Bases. The strategy is baked into how documents are processed and stored. If you want to try a different strategy, you create a new data source and re-ingest everything. Choose wisely upfront, or plan for potential re-ingestion.

---

## Metadata and Filtering

Pure vector search returns documents based solely on semantic similarity. But real applications need more constraints: results from a specific department, documents the user has permission to access, content from a particular date range. Metadata filtering adds these constraints.

### How Metadata Filtering Works

Each vector in your store can have associated metadata—key-value pairs describing attributes of the source document:

```json
{
    "embedding": [0.12, 0.45, 0.78, ...],
    "content": "Our refund policy allows returns within 30 days...",
    "metadata": {
        "department": "customer-service",
        "document_type": "policy",
        "last_updated": "2024-06-15",
        "access_level": "public",
        "region": "us-east"
    }
}
```

When querying, you can filter on these metadata fields, limiting which vectors are considered for similarity matching.

### Pre-Filtering vs Post-Filtering

**Pre-filtering** applies constraints before vector search. The system first narrows down to vectors matching your metadata criteria, then performs similarity search only on that subset.

Pre-filtering is efficient because you're searching a smaller set. If you filter to just "customer-service" documents (maybe 10% of your corpus), similarity search is 10x faster. However, if your filters are very selective and few documents match, you might not have enough candidates to find good semantic matches.

**Post-filtering** runs vector search first across all documents, then filters the results. This guarantees you consider all potentially relevant documents, but is inefficient—you compute similarity for vectors you'll discard.

Post-filtering has a dangerous failure mode: if most of your top semantic matches fail the filter, you end up with few or no results. Request k=10 results, find 8 great semantic matches that fail the filter, and you return only 2 results (or none).

Most production systems use pre-filtering because the efficiency gains outweigh the risks. If your filters are reasonable (not excluding 99% of documents), pre-filtering works well.

### Access Control Through Metadata

The killer use case for metadata filtering is access control. Tag documents with access levels, department ownership, or explicit user/group permissions. Then filter based on who's asking:

```python
# User from Engineering with "internal" clearance
user_metadata_filter = {
    "andAll": [
        {"equals": {"key": "access_level", "value": "internal"}},
        {"in": {"key": "department", "value": ["engineering", "company-wide"]}}
    ]
}

response = bedrock_agent.retrieve(
    knowledgeBaseId='KB_ID',
    retrievalQuery={'text': 'How do I access the internal API documentation?'},
    retrievalConfiguration={
        'vectorSearchConfiguration': {
            'numberOfResults': 5,
            'filter': user_metadata_filter
        }
    }
)
```

With this pattern, users can only retrieve documents they're authorized to access—even if unauthorized documents are perfect semantic matches for their query. The filtering happens in the vector store, before results return to the application.

This isn't optional for enterprise deployments. Without metadata-based access control, your RAG system becomes a security vulnerability—anyone who can query it can potentially extract information from any document in the corpus.

### Implementing Metadata in Bedrock Knowledge Bases

For Bedrock Knowledge Bases with S3 data sources, metadata comes from companion `.metadata.json` files:

```
my-docs/
  policies/
    refund-policy.pdf
    refund-policy.pdf.metadata.json
    shipping-policy.pdf
    shipping-policy.pdf.metadata.json
```

Each metadata file contains attributes for its associated document:

```json
{
    "metadataAttributes": {
        "department": "customer-service",
        "document_type": "policy",
        "effective_date": "2024-01-01",
        "access_level": "public"
    }
}
```

During ingestion, Bedrock KB associates this metadata with the document's chunks. During retrieval, you can filter on any of these attributes.

### Schema Design

Plan your metadata schema before bulk ingestion. Adding new filter fields later typically requires re-processing all documents—the new field doesn't exist on already-ingested vectors.

Think through:
- What filters will users need? (department, date range, document type)
- What access control constraints exist? (user roles, data classification levels)
- What operational filters help? (source system, ingestion batch, content version)

Design for the queries you'll run, but keep the schema manageable. Every additional metadata field increases storage and can complicate queries. Don't add fields "just in case"—add fields you know you'll filter on.

---

## Advanced Index Architecture

At scale, how you structure your vector indexes dramatically affects both performance and operational complexity.

### Sharding in OpenSearch

OpenSearch distributes vectors across shards—units of storage that can live on different nodes. Each shard handles part of the data and contributes to query processing.

The sharding strategy matters:
- **Too few shards**: Individual shards become large, slowing searches and limiting parallelism
- **Too many shards**: Overhead of managing many small shards, coordination costs during queries

A reasonable starting point is to keep shard size between 10-50GB. For a 100GB vector index, 5-10 shards works well. OpenSearch can query shards in parallel, so more shards (up to a point) means faster queries at the cost of coordination overhead.

For HNSW indexes, each shard maintains its own graph. When you query, OpenSearch searches all shards in parallel, then merges and re-ranks results. This means a query across 10 shards does 10 graph traversals, which is fast because HNSW is efficient, but still more work than querying a single shard.

### Multi-Index Strategies

Instead of one giant index, consider multiple smaller indexes organized by some logical dimension:
- **By document type**: Separate indexes for policies, procedures, FAQs, and product manuals
- **By department**: HR documents in one index, engineering docs in another
- **By time**: Monthly or yearly indexes for time-sensitive content

Multi-index architectures help because:
1. Queries route to relevant indexes only, shrinking the search space
2. Different indexes can have different settings (chunk sizes, refresh rates)
3. Access control can be implemented at the index level
4. Old indexes can be archived or deleted without affecting current content

OpenSearch lets you query across multiple indexes, so you can still do broad searches when needed.

### Index Lifecycle Management

Time-based indexes work well for content that becomes less relevant over time. Current year's documents in hot storage with aggressive refresh, previous years in cheaper storage with less frequent updates.

OpenSearch Index Lifecycle Management (ILM) automates transitions:

```json
{
    "policy": {
        "phases": {
            "hot": {
                "actions": {
                    "rollover": {
                        "max_size": "50gb",
                        "max_age": "30d"
                    }
                }
            },
            "warm": {
                "min_age": "30d",
                "actions": {
                    "shrink": { "number_of_shards": 1 },
                    "forcemerge": { "max_num_segments": 1 }
                }
            },
            "delete": {
                "min_age": "365d",
                "actions": {
                    "delete": {}
                }
            }
        }
    }
}
```

For Bedrock Knowledge Bases, lifecycle management is simpler—you manage the source documents, and the service handles the vectors. Delete a document from S3, sync the knowledge base, and its vectors are removed.

---

## Synchronization and Maintenance

Vector stores require ongoing maintenance to stay useful. Documents are added, modified, and deleted; your vectors must reflect these changes or your RAG system serves outdated information.

### Sync Strategies

**On-demand sync**: Trigger manually when you know content has changed. Simple but requires explicit action. Good for stable content with occasional updates.

**Scheduled sync**: Run hourly, daily, or weekly regardless of whether content changed. Ensures eventual consistency without manual intervention. Most production systems use scheduled sync.

**Event-driven sync**: Respond to changes immediately. S3 event notifications trigger Lambda functions that update vectors as soon as documents change. Lowest latency but most complex to implement.

Bedrock Knowledge Bases supports on-demand and scheduled sync. For event-driven architectures, you'd build a custom pipeline.

### Incremental Updates

Re-processing your entire document corpus for every sync is wasteful. Incremental updates process only what changed: new documents, modified documents, and deleted documents.

Bedrock Knowledge Bases handles this automatically—it tracks what's been processed and only handles changes since the last sync. For custom implementations, you need to track document versions or modification timestamps yourself.

The basic pattern:
1. Record document checksums or modification times during ingestion
2. During sync, compare current documents against recorded values
3. Process documents that are new or modified
4. Remove vectors for documents that no longer exist

### Handling Deletions

When a source document disappears, its vectors must go too. This sounds obvious but is easy to overlook. Without proper deletion handling, your RAG system returns information from documents that no longer exist—potentially showing outdated policies, deprecated procedures, or confidential information that was supposed to be removed.

Bedrock Knowledge Bases handles deletions during sync. For custom implementations, maintain a mapping between source documents and their vector IDs, and delete vectors when their source documents are removed.

### Monitoring Sync Health

Sync failures leave your vectors stale. Build observability from the start:

**CloudWatch metrics to watch**:
- Sync success/failure rate
- Documents processed per sync
- Sync duration trends
- Vector store size growth

**Alarms to configure**:
- Failed sync after N consecutive attempts
- Sync duration exceeding threshold (indicates growing content or processing issues)
- Growing backlog of unprocessed documents

```python
# CloudWatch alarm for sync failures
import boto3

cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_alarm(
    AlarmName='KnowledgeBaseSyncFailures',
    MetricName='SyncJobFailed',
    Namespace='AWS/Bedrock',
    Dimensions=[
        {'Name': 'KnowledgeBaseId', 'Value': 'YOUR_KB_ID'}
    ],
    Period=300,
    EvaluationPeriods=3,
    Threshold=1,
    ComparisonOperator='GreaterThanOrEqualToThreshold',
    Statistic='Sum',
    AlarmActions=['arn:aws:sns:us-east-1:123456789012:alerts']
)
```

---

## Performance Optimization

Vector search performance depends on many factors. Systematic optimization makes the difference between snappy sub-100ms queries and frustrating multi-second waits.

### Query Latency Optimization

**Reduce dimensions**: If you're using 1024-dim embeddings and latency is an issue, test 512-dim. You might sacrifice minimal accuracy for significant speed improvement. Profile with your actual queries.

**Tune ef_search**: This is the primary knob for HNSW query performance. Start with ef_search = k (the number of results you want), then increase until accuracy plateaus. Going higher adds latency without improving results.

**Use pre-filtering**: Metadata filters that run before vector search reduce the candidate set. Queries against 10% of your vectors are roughly 10x faster than queries against all vectors.

**Shard appropriately**: More shards = more parallelism during queries, up to a point. But too many shards add coordination overhead. Profile with your actual workload.

### Index Build Optimization

**Lower ef_construction for frequent updates**: If you're constantly adding documents and index build time matters, lower ef_construction. You sacrifice some index quality for faster builds.

**Batch insertions**: Instead of inserting vectors one at a time, batch them. Most vector stores handle batches much more efficiently.

**Consider IVF for static data**: If your corpus rarely changes, IVF builds faster than HNSW and uses less memory. The query speed penalty may be acceptable for batch/analytics use cases.

### Memory Optimization

**Lower dimensions**: 512-dim vectors use half the memory of 1024-dim vectors. Significant savings at scale.

**IVF over HNSW**: IVF uses less memory because it doesn't maintain a full graph structure. Trade-off is slower queries and poor update performance.

**Compression**: Some vector stores support vector quantization (storing vectors as integers instead of floats). This reduces memory by 4x with some accuracy loss. OpenSearch supports this via FAISS engine configurations.

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "SIMPLEST" or "minimal operational overhead" | Bedrock Knowledge Bases |
| "hybrid search" or "keyword + semantic" | OpenSearch or Bedrock KB with HYBRID mode |
| "existing PostgreSQL infrastructure" | Aurora pgvector |
| "production RAG" or "complex documents" | Hierarchical chunking |
| "cost-conscious" or "simple docs" | Fixed-size chunking |
| "OpenSearch Serverless" + "semantic search" | **VECTORSEARCH** collection type |
| "slow vector queries in OpenSearch Serverless" | Wrong collection type (should be VECTORSEARCH) |
| "tune search accuracy vs speed" | HNSW **ef_search** parameter |
| "memory-constrained" or "large static dataset" | **IVF** index over HNSW |
| "frequently updated vector index" | **HNSW** (IVF requires retraining) |
| "access control" or "security" with vectors | Metadata filtering with pre-filter |
| "documents processed but old results returned" | Sync not running or deletions not handled |
| "OCUs" or "capacity units" | OpenSearch Serverless billing (minimum 2 OCUs) |

---

## Key Takeaways

1. **Embeddings capture meaning, not keywords.** Vector search finds semantically similar content even when words don't match. This is the foundation of RAG—you can't do semantic search without embeddings.

2. **HNSW is the default algorithm for good reason.** It's fast, handles updates well, and provides excellent accuracy. Choose IVF only for massive static datasets or severe memory constraints.

3. **Bedrock Knowledge Bases eliminates operational complexity.** Parsing, chunking, embedding, storage, and sync—all handled for you. Most projects should start here and migrate only if they outgrow it.

4. **OpenSearch Serverless requires the right collection type.** VECTORSEARCH for embeddings and semantic search. SEARCH for traditional keyword search. Using the wrong type causes poor performance.

5. **Chunking strategy is permanent per data source.** You cannot change it after creation. Hierarchical chunking is the safest production default; fixed-size is fine for development.

6. **Metadata filtering enables access control.** Tag documents with permissions, filter based on who's asking. Without this, your RAG system is a security vulnerability.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Choosing OpenSearch "just in case"** | You're paying for complexity you don't need. Bedrock KB handles most use cases with minimal operational overhead. |
| **Using DynamoDB for vector similarity** | DynamoDB doesn't do vector math. It can store metadata alongside vector IDs, but the actual similarity search must happen in a proper vector store. |
| **Skipping metadata schema planning** | Adding filter fields after bulk ingestion means re-processing everything. Design the schema before you start loading data. |
| **Using SEARCH collection for embeddings** | OpenSearch Serverless SEARCH collections aren't optimized for k-NN. Queries work but perform poorly. VECTORSEARCH is required for RAG. |
| **Ignoring sync failures** | If syncs fail silently, your vectors drift from your documents. Users get outdated or deleted content. Build monitoring from day one. |
| **Fixed-size chunking in production** | Works for prototyping, but production systems usually benefit from hierarchical chunking that preserves document structure. |
