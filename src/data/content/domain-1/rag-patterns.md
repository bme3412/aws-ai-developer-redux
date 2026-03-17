# RAG Patterns

**Domain 1 | Task 1.4 | ~55 minutes**

---

## Why This Matters

RAG (Retrieval-Augmented Generation) is how you make foundation models knowledgeable about *your* data. Without it, Claude or any FM only knows what it learned during training—it can't answer questions about your company's policies, your product docs, or anything private.

This is the single most important pattern for building useful AI applications on real-world data.

---

## The Fundamental Problem

Let me start with why RAG exists at all.

Foundation models have two limitations:

1. **Knowledge cutoff** — They were trained on data up to a certain date. Ask about something that happened after that, and they don't know.

2. **No private knowledge** — They never saw your internal documents, your customer data, your product specs.

When you ask an FM something it doesn't know, it doesn't say "I don't know." It makes something up. This is called hallucination, and it's the core problem RAG solves.

### Why Not Just Fine-Tune?

You might think: "Just train the model on my data." That's fine-tuning, and here's why RAG usually wins:

| Aspect | RAG | Fine-Tuning |
|--------|-----|-------------|
| Updating knowledge | Re-index your docs (hours) | Re-train the model (days, expensive) |
| Cost | Storage + retrieval | GPU compute for training |
| Verifiability | Can cite sources | Knowledge buried in weights |
| Best for | Facts, documents, Q&A | Changing style or format |

Fine-tuning bakes knowledge into the model's weights. RAG keeps knowledge external and retrievable. For most enterprise use cases—policy questions, documentation search, customer support—RAG is the right choice.

---

## Understanding Hallucination

Hallucination isn't random—it follows patterns. Understanding why models hallucinate helps you prevent it.

### Types of Hallucination

| Type | Description | Example |
|------|-------------|---------|
| **Factual** | Confidently stating false facts | "The Eiffel Tower is 500 meters tall" (it's 330m) |
| **Fabricated citations** | Inventing sources that don't exist | Citing a paper that was never written |
| **Intrinsic** | Contradicting the provided context | Context says "refunds within 30 days", response says "14 days" |
| **Extrinsic** | Adding information not in context | Making up features not mentioned in product docs |

### Why Hallucination Happens

1. **Training objective**: Models are trained to predict likely next tokens, not to be accurate. Plausible-sounding text scores well even if false.

2. **No uncertainty calibration**: Models can't reliably express "I don't know." They'll generate something.

3. **Context overwhelm**: When provided too much context, models may miss relevant parts or blend information incorrectly.

4. **Prompt encouragement**: If the prompt implies there IS an answer, the model will find one—even if it has to make it up.

### Detecting Hallucination

RAG-specific metrics can flag likely hallucinations:

**Faithfulness/Groundedness**: Does every claim in the response have support in the retrieved context? Low faithfulness = high hallucination risk.

**Self-consistency**: Ask the same question multiple times. If answers vary significantly, the model is likely uncertain/hallucinating.

**Entailment checking**: Use an NLI (Natural Language Inference) model to verify if the context actually entails the response.

### Preventing Hallucination

1. **Better retrieval**: If you retrieve irrelevant docs, the model will either ignore them (and hallucinate) or misuse them. Fix retrieval first.

2. **Explicit instructions**: "Only answer based on the provided context. If the answer isn't there, say 'I don't have information about that.'"

3. **Citation requirements**: "Cite the specific document and section for each claim." This forces the model to ground responses.

4. **Shorter context**: Paradoxically, less context can improve accuracy. Only include highly relevant chunks.

5. **Lower temperature**: More deterministic generation reduces creative interpolation.

---

## How RAG Works

RAG has three steps. Two happen before your user ever asks a question, one happens at runtime.

### Step 1: Indexing (Offline)

Before anyone asks anything, you prepare your documents:

```
Documents → Split into chunks → Convert to embeddings → Store in vector database
```

This is a one-time setup (plus updates when docs change). Think of it like building a searchable index for a book—you do the work upfront so lookups are fast.

### Step 2: Retrieval (Runtime)

When a user asks a question:

```
User question → Convert to embedding → Search vector DB → Get relevant chunks
```

You're finding the pieces of your documents most likely to contain the answer.

### Step 3: Generation (Runtime)

Now you have context:

```
User question + Relevant chunks → Send to FM → Grounded response
```

The FM answers the question using the chunks you retrieved. Instead of making things up, it synthesizes an answer from your actual documents.

### The Quality Chain

Here's the critical insight: **each step can fail independently**.

- **Bad retrieval** → Wrong chunks → Wrong answer
- **Good retrieval, bad context** → Right chunks but answer not in them → "I don't know" or hallucination
- **Good context, bad generation** → FM ignores or misuses the context → Wrong answer

When debugging RAG, you need to check each link in this chain.

---

## Chunking: The Foundation

Chunking is how you split documents before embedding them. Get this wrong and nothing else matters—you'll never retrieve the right content.

### Why Chunking Matters

Embeddings have fixed dimensions. They can only capture so much meaning. If you try to embed an entire 50-page document into a single vector, you get semantic mush—a vague average of everything in the doc.

But if you chunk too small, you lose context. A sentence fragment doesn't carry enough meaning to match a user's question.

### The Three Approaches

**Fixed-Size Chunking**

Split every N characters (or tokens), with some overlap:

```python
def fixed_chunk(text, size=500, overlap=50):
    chunks = []
    start = 0
    while start < len(text):
        chunks.append(text[start:start + size])
        start += size - overlap
    return chunks
```

Simple and predictable. The problem: it splits mid-sentence, mid-paragraph, mid-thought. A fact might end up split across two chunks.

**Semantic Chunking**

Split at natural boundaries—paragraph breaks, section headers, sentence endings:

```python
def semantic_chunk(text, max_size=1000):
    paragraphs = text.split('\n\n')
    chunks, current = [], ''

    for para in paragraphs:
        if len(current) + len(para) < max_size:
            current += para + '\n\n'
        else:
            chunks.append(current.strip())
            current = para + '\n\n'

    if current:
        chunks.append(current.strip())
    return chunks
```

This preserves meaning because you're respecting the document's structure. Variable chunk sizes, but each chunk is a coherent unit.

**Hierarchical Chunking**

Create parent-child relationships:

```
Document
  └── Section (parent)
        ├── Paragraph 1 (child)
        └── Paragraph 2 (child)
```

When you retrieve a child chunk, you can include its parent for additional context. Great for technical docs and legal documents where structure matters.

### Chunk Size Guidelines

| Size | Good For |
|------|----------|
| 100-200 tokens | Specific facts, precise retrieval |
| 300-500 tokens | Balanced default for most cases |
| 500-1000 tokens | Complex topics needing more context |
| 1000+ tokens | Risk of diluted embeddings |

### The Overlap Trick

Overlap prevents losing context at boundaries:

```
Chunk 1: "...quarterly revenue was $50M. The main driver"
Chunk 2: "$50M. The main driver was the new product line..."
```

The phrase "The main driver" appears in both chunks, so a question about revenue drivers can match either one. Typical overlap: 10-20% of chunk size.

---

## Embeddings: Text as Vectors

Embeddings convert text into numbers—specifically, into vectors where **similar meanings are close together**.

### The Core Idea

```
"The cat sat on the mat"     → [0.23, -0.45, 0.12, ..., 0.89]
"A feline rested on a rug"   → [0.21, -0.43, 0.14, ..., 0.87]  ← similar!
"Stock prices rose sharply"  → [0.78, 0.34, -0.56, ..., 0.12]  ← different
```

Two sentences with similar meaning produce similar vectors. This is how semantic search works—you're not matching keywords, you're matching meaning.

### Using Amazon Titan Embeddings

```python
import boto3
import json

client = boto3.client('bedrock-runtime')

response = client.invoke_model(
    modelId='amazon.titan-embed-text-v1',
    body=json.dumps({'inputText': 'What is the refund policy?'})
)

result = json.loads(response['body'].read())
embedding = result['embedding']  # 1536-dimensional vector
```

### The Critical Rule

**Query and document embeddings MUST use the same model.**

If you index documents with Titan v1, you must query with Titan v1. Different models produce different vector spaces—a Titan embedding and a Cohere embedding for the same text won't be close to each other.

### Measuring Similarity

**Cosine similarity** is the standard measure. It calculates the angle between two vectors:

- 1.0 = identical direction (same meaning)
- 0.0 = perpendicular (unrelated)
- -1.0 = opposite (rare in practice)

A cosine similarity of 0.95+ means very similar meaning. Below 0.7, probably not relevant.

---

## Vector Stores: Where Embeddings Live

You need somewhere to store embeddings and search them efficiently. This is a vector database.

### How Vector Search Works

1. Store document chunks with their embeddings and metadata
2. Query comes in → convert to embedding
3. Find the k nearest vectors (most similar)
4. Return the associated documents

### AWS Options

**OpenSearch Service** — The production choice

```python
# Indexing
index_body = {
    'text': 'Original document text...',
    'embedding': [0.23, -0.45, ...],
    'metadata': {'source': 'policy.pdf', 'page': 5}
}
os_client.index(index='documents', body=index_body)

# Searching
search_body = {
    'query': {
        'knn': {
            'embedding': {
                'vector': query_embedding,
                'k': 5
            }
        }
    }
}
```

Pros: Scalable, supports hybrid search (keyword + vector), battle-tested.

**Bedrock Knowledge Bases (Managed Store)** — The simple choice

Fully managed, no configuration. Good for getting started, less flexibility.

**Aurora pgvector** — The SQL choice

```sql
CREATE EXTENSION vector;

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536)
);

SELECT content
FROM documents
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

Good if you're already on Aurora and want vectors alongside relational data.

### Which to Choose

- **Just starting?** → Knowledge Bases managed store
- **Production with scale?** → OpenSearch Service
- **Already using Aurora?** → pgvector

---

## Retrieval Optimization

Finding the right chunks is everything. Here's how to improve retrieval quality.

### The Two Metrics

**Precision**: Of the chunks you retrieved, how many were actually relevant?

**Recall**: Of all the relevant chunks that exist, how many did you retrieve?

There's a tradeoff. Retrieve more → higher recall, lower precision. Retrieve fewer → higher precision, lower recall.

### Improving Precision

**Similarity threshold** — Don't return low-quality matches:

```python
results = [r for r in results if r.score > 0.7]
```

**Metadata filtering** — Narrow the search space:

```python
results = search(
    query_embedding,
    filter={'department': 'legal', 'year': 2024}
)
```

### Improving Recall

**Query expansion** — Search multiple ways:

```python
queries = [
    original_query,
    rephrase_with_llm(original_query),
    expand_acronyms(original_query)
]
results = union([search(q) for q in queries])
```

**Hybrid search** — Combine vector + keyword:

```json
{
  "query": {
    "bool": {
      "should": [
        {"match": {"text": "refund policy"}},
        {"knn": {"embedding": {"vector": [...], "k": 10}}}
      ]
    }
  }
}
```

Sometimes the exact keyword match is what you need. Hybrid search gets both semantic similarity and keyword relevance.

### Reranking

Retrieve broadly, then re-score with a more sophisticated model:

```python
# Get top 20 (fast, approximate)
initial = vector_search(query, k=20)

# Rerank to top 5 (slower, more accurate)
final = bedrock.rerank(
    modelId='cohere.rerank-v3',
    query=query,
    documents=[r.text for r in initial],
    topN=5
)
```

Use reranking when precision matters more than latency.

---

## RAG Architecture Patterns

Different patterns for different needs.

### Basic RAG

```
Query → Embed → Search → Top-K Chunks → FM → Response
```

Use `RetrieveAndGenerate` from Knowledge Bases:

```python
response = bedrock_agent.retrieve_and_generate(
    input={'text': user_query},
    retrieveAndGenerateConfiguration={
        'type': 'KNOWLEDGE_BASE',
        'knowledgeBaseConfiguration': {
            'knowledgeBaseId': 'KB_ID',
            'modelArn': 'arn:aws:bedrock:...:anthropic.claude-3-sonnet'
        }
    }
)
```

**Best for**: Simple Q&A, documentation search.

### Agentic RAG

The agent decides when and what to search:

```
Query → Agent reasons → Decides to search → Retrieves → Reasons more → Maybe searches again → Response
```

**Best for**: Complex questions requiring multiple lookups, following up on partial answers.

### Conversational RAG

Incorporate conversation history into the search:

```python
def conversational_rag(query, history):
    # Make the follow-up question standalone
    contextualized = llm(
        f"Given this conversation: {history}\n"
        f"Reformulate this as a standalone question: {query}"
    )
    results = retrieve(contextualized)
    return generate(query, results, history)
```

**Best for**: Chatbots, multi-turn conversations where "it" or "that" refers to something earlier.

### Multi-Index RAG

Route queries to specialized knowledge bases:

```python
if 'policy' in query.lower():
    kb_id = 'POLICY_KB'
elif 'technical' in query.lower():
    kb_id = 'TECHNICAL_KB'
else:
    kb_id = 'GENERAL_KB'
```

**Best for**: Large organizations with distinct knowledge domains.

### Multi-Hop Reasoning in RAG

Some questions can't be answered with a single retrieval. They require finding information, reasoning about it, and then finding more information based on that reasoning.

**Example**: "What products does the CEO's previous company make?"

This requires:
1. Find who the CEO is
2. Find their previous company
3. Find what that company makes

Single-shot retrieval fails—you need multiple hops.

**Approaches**:

**Query Decomposition**: Break complex questions into sub-questions, retrieve for each, combine:

```python
def multi_hop_rag(complex_query):
    # Use FM to decompose
    sub_queries = fm_decompose(complex_query)
    # ["Who is the CEO?", "What company did they work at before?", "What does that company make?"]

    results = []
    for sub_q in sub_queries:
        context = retrieve(sub_q)
        partial_answer = generate(sub_q, context)
        results.append(partial_answer)
        # Feed partial answer into next retrieval

    return synthesize(results)
```

**Iterative Retrieval**: Let the agent decide when it needs more information:

```python
def iterative_rag(query, max_hops=3):
    context = []
    for hop in range(max_hops):
        response = generate_with_tools(query, context)

        if response.needs_more_info:
            new_context = retrieve(response.next_query)
            context.extend(new_context)
        else:
            return response.answer
```

**Agentic RAG**: Full agent pattern where the model reasons, retrieves, and iterates autonomously. Use Bedrock Agents for this.

**When multi-hop matters**:
- Questions about relationships ("Who does X's manager report to?")
- Comparisons requiring multiple lookups
- Questions with implicit prerequisites

---

## Knowledge Base Management

Managing your Knowledge Base is as important as designing the retrieval logic.

### Data Source Sync Modes

**On-Demand Sync**: You trigger syncs manually or via API. Best for:
- Development environments
- Infrequent document updates
- When you need precise control over when documents are indexed

```python
response = bedrock_agent.start_ingestion_job(
    knowledgeBaseId='KB_ID',
    dataSourceId='DS_ID'
)
```

**Scheduled Sync**: Automatic syncs at configured intervals (hourly, daily, weekly). Best for:
- Production environments with regular document updates
- When documents change on predictable schedules
- Set-and-forget management

### Incremental vs Full Sync

**Incremental**: Only processes new or modified documents. Faster and cheaper. The default behavior.

**Full resync**: Reprocesses all documents. Required when:
- You change chunking strategy (can't change in place—must create new data source)
- Embeddings need regeneration (model version change)
- You suspect sync corruption

### Monitoring Sync Health

Track these CloudWatch metrics:
- `IngestionJobsSucceeded` / `IngestionJobsFailed`
- `DocumentsIngested`
- `IngestionJobDuration`

Set alarms for failed syncs—stale knowledge bases serve outdated information.

### Citation and Attribution

Production RAG needs to show users where answers come from. This builds trust and enables verification.

**Bedrock Knowledge Base citations** are returned automatically with RetrieveAndGenerate:

```python
response = bedrock_agent.retrieve_and_generate(...)

# Access citations
for citation in response['citations']:
    print(f"Source: {citation['retrievedReferences'][0]['location']['s3Location']['uri']}")
    print(f"Content: {citation['generatedResponsePart']['textResponsePart']['text']}")
```

**Custom attribution** for retrieve-then-generate patterns:

```python
# In your prompt
prompt = f"""
Based on the following documents, answer the question. Cite each claim with [Doc X].

Documents:
[Doc 1] {doc1_content}
[Doc 2] {doc2_content}

Question: {user_question}
"""
```

**Why citation matters**:
- Users can verify accuracy
- Reduces perceived hallucination risk
- Required in many compliance contexts (legal, medical, financial)

---

## Evaluating and Debugging RAG

How do you know if your RAG system is working?

### The Three Quality Dimensions

1. **Retrieval quality** — Are you finding the right chunks?
2. **Groundedness** — Is the answer supported by the retrieved content?
3. **Generation quality** — Is the answer relevant, complete, and concise?

### Debugging Workflow

**Problem: Wrong answers**

```
1. Check retrieval → Were the right docs found?
   No → Chunking, embedding, or query issue
   Yes → Continue...

2. Check context → Is the answer in the retrieved docs?
   No → Retrieval precision issue
   Yes → Continue...

3. Check generation → Did the FM use the context correctly?
   No → Prompt engineering issue
```

**Problem: "I don't know" when the answer exists**

- Is the document indexed?
- Is the similarity score too low? (Adjust threshold)
- Is the answer split across chunk boundaries?
- Does the query language match the document language?

### Golden Dataset Testing

Maintain test cases with known answers:

```python
golden_dataset = [
    {'query': 'What is the refund policy?', 'expected': 'Within 30 days...'},
    {'query': 'How do I reset my password?', 'expected': 'Go to settings...'},
]

def regression_test():
    for item in golden_dataset:
        result = rag_pipeline(item['query'])
        score = evaluate(result, item['expected'])
        assert score > 0.8, f"Regression: {item['query']}"
```

Run this after any change to chunking, embeddings, or retrieval logic.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Wrong chunk size** | Too big and embeddings become semantic mush. Too small and you lose context. Match chunk size to your content structure. |
| **Mixing embedding models** | If you index with Titan v1 and query with Cohere, vectors won't be comparable. Same model everywhere, always. |
| **Semantic search only** | Sometimes users search for exact terms. Hybrid search (vector + keyword) catches both semantic similarity and keyword matches. |
| **Skipping evaluation** | Assuming retrieval "just works" leads to silent failures. Measure precision and recall systematically. |
| **No golden dataset** | Without regression tests, you won't know when changes break retrieval. Maintain test cases with known answers. |

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "Ground responses in documents" | RAG |
| "Reduce hallucination with company data" | RAG |
| "Improve retrieval quality" | Hybrid search, reranking, better chunking |
| "Semantic search" | Embeddings + vector similarity |
| "Vector database for production" | OpenSearch Service |
| "Simple RAG setup" | Knowledge Bases managed store |
| "response contradicts context" | **Intrinsic hallucination**—check faithfulness metric |
| "verify response is grounded" | **Faithfulness/groundedness** evaluation |
| "complex question requiring multiple lookups" | **Multi-hop RAG** or query decomposition |
| "show sources to users" | **Citations** from RetrieveAndGenerate |
| "keep knowledge base updated" | **Scheduled sync** vs on-demand |

---

## Key Takeaways

> **1. RAG stops hallucination.**
> Instead of making things up, the FM synthesizes answers from your actual documents. Grounded responses cite sources.

> **2. Chunking is foundational.**
> Match strategy to document structure. Too big loses precision, too small loses context. Use overlap to avoid losing information at boundaries.

> **3. Same embedding model everywhere.**
> Query and document embeddings MUST use the same model. Different models produce incompatible vector spaces.

> **4. Choose vector store by maturity.**
> Knowledge Bases managed store for prototyping. OpenSearch Service for production scale. Aurora pgvector if you're already on Aurora.

> **5. Debug systematically.**
> When answers are wrong: Check retrieval first (right chunks?), then context (answer in chunks?), then generation (FM used context?).

> **6. Test with golden datasets.**
> Maintain test cases with known answers. Run regression tests after any change to catch quality degradation before users do.
