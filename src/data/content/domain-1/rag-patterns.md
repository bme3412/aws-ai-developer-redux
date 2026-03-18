# RAG Patterns

**Domain 1 | Task 1.4 | ~55 minutes**

---

## Why This Matters

RAG (Retrieval-Augmented Generation) is how you make foundation models knowledgeable about *your* data. Without RAG, Claude or any foundation model only knows what it learned during training—it cannot answer questions about your company's policies, your product documentation, your customer data, or anything that wasn't in its training corpus.

This limitation isn't a bug; it's fundamental to how language models work. They compress the internet's knowledge into neural network weights, but that compression happened at a fixed point in time, using publicly available data. Your private information, by definition, wasn't included.

RAG solves this by giving the model access to your documents at query time. Instead of trying to remember everything, the model retrieves relevant information when it needs it—like consulting a reference library rather than memorizing every book. This is the single most important pattern for building useful AI applications on real-world data, and understanding it deeply separates production-quality implementations from toy demos.

---

## The Fundamental Problem

Let me start with why RAG exists at all, because understanding the problem explains why the solution takes the shape it does.

Foundation models have two fundamental limitations that create real business problems.

**Knowledge cutoff** means the model was trained on data up to a certain date—and that date is always in the past. Ask about something that happened after training completed, and the model genuinely doesn't know. It's not hiding information; that information simply isn't in its weights. Ask Claude about a product you launched last month, and it has no idea what you're talking about.

**No private knowledge** means the model never saw your internal documents during training. Your customer data, your product specifications, your company policies, your proprietary processes—none of this exists in the model's understanding of the world. The model knows how companies generally work, but it doesn't know how your company works.

When you ask a foundation model something it doesn't know, it doesn't say "I don't know." That would be the honest answer, but models aren't trained to admit uncertainty—they're trained to generate plausible text. So instead of acknowledging ignorance, the model makes something up. It generates text that sounds reasonable, that follows the patterns of how true statements are structured, but that has no basis in fact.

This is called hallucination, and it's the core problem RAG solves. By providing the model with relevant documents at query time, you give it the information it needs to generate accurate, grounded responses instead of plausible-sounding fabrications.

### Why Not Just Fine-Tune?

You might think: "Just train the model on my data." That's fine-tuning, and it's a valid approach for some problems. But for most enterprise use cases, RAG wins decisively.

| Aspect | RAG | Fine-Tuning |
|--------|-----|-------------|
| Updating knowledge | Re-index documents (hours) | Re-train model (days, expensive) |
| Cost | Storage + retrieval | GPU compute for training |
| Verifiability | Can cite sources | Knowledge buried in weights |
| Best for | Facts, documents, Q&A | Changing style or format |

The key difference is where knowledge lives. Fine-tuning bakes knowledge into the model's weights—it becomes part of the model itself. RAG keeps knowledge external and retrievable—the model consults documents rather than "remembering" information.

This distinction has profound practical implications. When your policies change, RAG lets you update the documents and immediately serve accurate information. Fine-tuning requires re-training the model, which takes days, costs money, and risks degrading performance on other tasks. When users need to verify information, RAG can cite specific documents and passages. Fine-tuned knowledge lives somewhere in billions of parameters with no attribution possible.

For most enterprise use cases—policy questions, documentation search, customer support, knowledge management—RAG is the right choice. Fine-tuning makes sense when you need to change how the model behaves (writing style, output format, domain-specific reasoning patterns) rather than what it knows.

---

## Understanding Hallucination

Hallucination isn't random noise—it follows patterns. Understanding why models hallucinate helps you prevent it, and understanding the different types helps you diagnose which mitigation strategies will work.

### Types of Hallucination

**Factual hallucination** is the most obvious type: the model confidently states something false. "The Eiffel Tower is 500 meters tall" sounds authoritative but is simply wrong (it's 330 meters). The model generates this because 500 is a plausible number for a tall structure, even though the correct number is different. Factual hallucinations are dangerous because they sound confident—there's no hedging, no uncertainty markers, just a wrong statement presented as fact.

**Fabricated citations** are particularly insidious. The model invents sources that don't exist—citing papers that were never written, quoting statistics from reports that were never published. This happens because the model has learned the pattern of how citations work (author names, journal titles, dates) and can generate syntactically correct citations without any connection to real publications. Users who trust the citation format may not realize the source is entirely fictional.

**Intrinsic hallucination** occurs when the model contradicts information you explicitly provided. You give it context saying "refunds are available within 30 days," and it responds "our refund policy allows returns within 14 days." The model has the correct information right in front of it but generates something different. This often happens when the model's training data conflicts with your context, or when the context is too long and the model loses track of specific details.

**Extrinsic hallucination** adds information that isn't in the provided context. You ask about a product based on its documentation, and the model invents features that were never mentioned. This is the model filling gaps with plausible information drawn from its training data rather than admitting the information isn't available.

### Why Hallucination Happens

Understanding the mechanisms helps you design mitigations.

**Training objective mismatch** is the root cause. Language models are trained to predict likely next tokens—they learn what text typically follows other text. Plausible-sounding text scores well in this objective even if it's false. The model isn't trying to be accurate; it's trying to be fluent. Accuracy correlates with fluency (true statements are common in training data), but the correlation isn't perfect.

**No uncertainty calibration** means models can't reliably express "I don't know." When trained to always generate something, they always generate something. The training process doesn't reward saying "I'm uncertain"—it rewards generating text that matches the patterns in the training data. So models generate with confidence even when that confidence is unwarranted.

**Context overwhelm** happens when you provide too much context. With thousands of tokens of documents, the model may miss relevant parts, blend information from different sections incorrectly, or simply lose track of what's where. Attention mechanisms have limits, and very long contexts strain those limits.

**Prompt encouragement** is subtle but powerful. If your prompt implies there IS an answer, the model will find one—even if it has to make it up. "What does our policy say about X?" implies the policy says something about X. "Does our policy address X?" is more neutral. Prompt phrasing influences hallucination rates.

### Detecting Hallucination

RAG-specific metrics can flag likely hallucinations before they reach users.

**Faithfulness (Groundedness)** measures whether every claim in the response has support in the retrieved context. You compute this by extracting individual claims from the response and checking whether each claim is entailed by the context. Low faithfulness scores indicate the model is generating claims that aren't supported by the documents—a strong signal of hallucination.

**Self-consistency** exploits the fact that hallucinated answers tend to be unstable. Ask the same question multiple times with slightly different prompts or temperatures. If the model gives consistent answers, it's probably drawing on real information. If answers vary significantly, the model is likely uncertain and generating plausible-sounding guesses.

**Entailment checking** uses a Natural Language Inference (NLI) model to verify whether the context actually entails the response. NLI models classify whether a premise entails, contradicts, or is neutral toward a hypothesis. Using your retrieved context as the premise and the model's response as the hypothesis, you can automatically flag responses that aren't entailed by the evidence.

### Preventing Hallucination

Prevention is better than detection, and several strategies significantly reduce hallucination rates.

**Better retrieval** is the first line of defense. If you retrieve irrelevant documents, the model will either ignore them (and hallucinate from training data) or misuse them (generating responses that don't answer the actual question). Fix retrieval quality first—the best prompt engineering can't save you from fundamentally broken retrieval.

**Explicit instructions** make the constraint clear: "Only answer based on the provided context. If the information isn't there, say 'I don't have information about that.'" This gives the model permission to admit uncertainty rather than forcing it to generate something. Simple but surprisingly effective.

**Citation requirements** force grounding by demanding accountability: "Cite the specific document and section for each claim you make." When the model must attribute every statement to a source, it can't easily generate unsupported claims. This also helps users verify accuracy.

**Shorter context** can paradoxically improve accuracy. Less context means fewer opportunities for the model to blend information incorrectly or lose track of what's where. Include only highly relevant chunks rather than everything that might possibly be related.

**Lower temperature** reduces the randomness in generation. Higher temperatures encourage creative interpolation; lower temperatures keep the model closer to the highest-probability next tokens. For factual RAG, temperature=0 or near-zero is usually appropriate.

---

## How RAG Works

RAG has three steps. Two happen before your user ever asks a question (the indexing phase), and one happens at query time (retrieval and generation). Understanding this separation clarifies why certain optimizations matter and where different problems originate.

### Step 1: Indexing (Offline)

Before anyone asks anything, you prepare your documents for retrieval. This is a batch process that runs whenever your source documents change.

```
Documents → Split into chunks → Convert to embeddings → Store in vector database
```

Think of it like building an index for a book. The book itself contains information, but without an index, finding specific information requires reading the entire book. The index lets you look up topics and find the relevant pages quickly. Vector indexing does the same thing, but for semantic meaning rather than keywords.

Splitting documents into chunks is necessary because embeddings have fixed dimensions—they can only capture so much meaning. Trying to embed an entire 50-page document into a single vector produces a vague average that doesn't match specific queries well. Chunks let you index at the granularity where meaningful retrieval happens.

Converting to embeddings transforms text into vectors where similar meanings are close together. "How do I request time off?" and "What's the PTO policy?" end up near each other in vector space even though they share few words, because they're semantically related.

Storing in a vector database enables fast approximate nearest-neighbor search. When a query comes in, you need to find the most similar vectors among potentially millions of indexed chunks. Specialized data structures (like HNSW graphs) make this feasible in milliseconds rather than seconds.

### Step 2: Retrieval (Runtime)

When a user asks a question, you find the relevant chunks:

```
User question → Convert to embedding → Search vector DB → Get relevant chunks
```

The user's question becomes a vector using the same embedding model you used for indexing. This is critical—different embedding models produce incompatible vector spaces. You search your vector database for the chunks whose embeddings are closest to the query embedding, typically returning the top-k most similar chunks.

This retrieval is what makes RAG "retrieval-augmented." Instead of relying on information in the model's weights, you're retrieving external knowledge at query time. The model will see this information in its context window, fresh and current.

### Step 3: Generation (Runtime)

Now you have context, and you can generate a grounded response:

```
User question + Relevant chunks → Send to FM → Grounded response
```

You construct a prompt that includes both the user's question and the retrieved chunks. The foundation model generates a response based on this combined input. Instead of making things up from its training data, it synthesizes an answer from your actual documents.

The prompt structure matters here. You're essentially saying: "Here are some documents. Based on these documents, answer this question." The model has been trained to follow instructions and use provided context, so it will (usually) base its response on what you've given it.

### The Quality Chain

Here's the critical insight: **each step can fail independently**, and diagnosing RAG problems requires checking each link in the chain.

**Bad retrieval** means you found the wrong chunks. Even if those chunks are high-quality and the model uses them perfectly, the answer will be wrong because it's based on irrelevant information. Symptoms: the response confidently discusses something related but not what the user asked about.

**Good retrieval, bad context** means you found relevant chunks, but the answer to the question isn't actually in them. Maybe the information exists elsewhere in your corpus but wasn't retrieved. Maybe it doesn't exist at all. The model either says "I don't know" (good) or hallucinates an answer (bad).

**Good context, bad generation** means the right information was in the chunks, but the model didn't use it correctly. Maybe it summarized poorly, missed a key detail, or blended information from different chunks in a misleading way. Symptoms: the retrieved chunks contain the answer, but the response gets it wrong.

When debugging RAG, always check retrieval first. If retrieval is broken, nothing downstream can fix it.

---

## Chunking: The Foundation

Chunking is how you split documents before embedding them. This decision is foundational—get it wrong and nothing else matters, because you'll never retrieve the right content. Invest time in getting chunking right for your specific documents and use cases.

### Why Chunking Matters

Embeddings have fixed dimensions—1536 for Titan v1, 1024 for Titan v2, etc. They can only capture so much meaning in those dimensions. If you try to embed an entire 50-page document into a single vector, you get semantic mush—a vague average of everything in the document that doesn't match specific queries well.

But if you chunk too small, you lose context. A sentence fragment doesn't carry enough meaning to match a user's question reliably. "Within 30 days" doesn't tell you what has to happen within 30 days. You need enough surrounding context for the chunk to be meaningful and matchable.

The art of chunking is finding the granularity where information is specific enough to match queries but complete enough to be useful when retrieved.

### Fixed-Size Chunking

The simplest approach splits text every N characters (or tokens), with some overlap between chunks:

```python
def fixed_chunk(text, size=500, overlap=50):
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks
```

Fixed-size chunking is predictable and easy to implement. You know exactly how many tokens each chunk contains, which helps with context window management. Every chunk is roughly the same size.

The problem is that it's blind to document structure. It splits mid-sentence, mid-paragraph, mid-thought. A fact might end up split across two chunks, with neither chunk containing the complete information. A question about that fact might partially match both chunks without getting a high score for either.

Use fixed-size chunking when your content is homogeneous (no clear structural boundaries), when you need predictable chunk sizes for downstream processing, or when you're prototyping and want simplicity.

### Semantic Chunking

Semantic chunking respects the document's natural structure—splitting at paragraph breaks, section headers, sentence endings:

```python
def semantic_chunk(text, max_size=1000):
    paragraphs = text.split('\n\n')
    chunks, current = [], ''

    for para in paragraphs:
        if len(current) + len(para) < max_size:
            current += para + '\n\n'
        else:
            if current:
                chunks.append(current.strip())
            current = para + '\n\n'

    if current:
        chunks.append(current.strip())
    return chunks
```

This preserves meaning because you're respecting boundaries the document author created. Paragraphs tend to be about one thing. Sections tend to cover one topic. By splitting at these boundaries, each chunk is a coherent unit of information.

The trade-off is variable chunk sizes. Some paragraphs are long; some are short. Some sections span many pages; others are just a few sentences. You need to handle this variability in your retrieval and context management.

Bedrock Knowledge Bases supports semantic chunking, which analyzes text relationships and splits at natural meaning boundaries. Configure maximum buffer size, token limits, and breakpoint thresholds to tune behavior for your content.

### Hierarchical Chunking

Hierarchical chunking creates parent-child relationships between chunks:

```
Document
  └── Section (parent chunk)
        ├── Paragraph 1 (child chunk)
        └── Paragraph 2 (child chunk)
```

When you retrieve a child chunk that matches the query, you can include its parent chunk for additional context. The child provides specificity (it's why this chunk matched the query), and the parent provides context (the broader topic this detail belongs to).

This pattern is powerful for technical documentation, legal documents, and anything with nested structure. A question about a specific clause can retrieve that clause's chunk for precision, while the parent section provides context about what that clause relates to.

Bedrock Knowledge Bases supports hierarchical chunking with configurable parent and child token sizes and overlap between levels. The recommended defaults are parent chunks of ~1000 tokens, child chunks of ~500 tokens, with ~70 tokens of overlap.

### Chunk Size Guidelines

There's no universal "correct" chunk size—it depends on your content, your queries, and your trade-offs. But here are guidelines:

| Size | Good For |
|------|----------|
| 100-200 tokens | Specific facts, precise retrieval, FAQ-style content |
| 300-500 tokens | Balanced default for most document types |
| 500-1000 tokens | Complex topics requiring context, technical explanations |
| 1000+ tokens | Risk of diluted embeddings, use with hierarchical approaches |

Smaller chunks give more precision—they match specific queries well but might lack context. Larger chunks provide more context but might dilute the embedding, making specific queries harder to match.

The best approach is empirical: try different chunk sizes with your actual content and queries, measure retrieval quality, and adjust. There's no substitute for testing with real data.

### The Overlap Trick

Overlap prevents losing context at chunk boundaries. Without overlap, information that spans two chunks might not match queries well because neither chunk has the complete picture.

```
Chunk 1: "...quarterly revenue was $50M. The main driver"
Chunk 2: "$50M. The main driver was the new product line..."
```

The phrase "The main driver" appears in both chunks, so a question about revenue drivers can match either one. If there were no overlap, a query about drivers might not strongly match Chunk 1 (which cuts off mid-thought) or Chunk 2 (which lacks the revenue context).

Typical overlap is 10-20% of chunk size. Too much overlap creates redundant storage and can cause the same information to be retrieved multiple times. Too little overlap risks the boundary problems. Find the balance for your content.

---

## Embeddings: Text as Vectors

Embeddings convert text into numbers—specifically, into high-dimensional vectors where **similar meanings are close together**. This mathematical representation is what enables semantic search.

### The Core Idea

When you embed text, you get a vector—a list of numbers representing that text's position in semantic space:

```
"The cat sat on the mat"     → [0.23, -0.45, 0.12, ..., 0.89]
"A feline rested on a rug"   → [0.21, -0.43, 0.14, ..., 0.87]  ← similar vectors!
"Stock prices rose sharply"  → [0.78, 0.34, -0.56, ..., 0.12]  ← different vector
```

The first two sentences have similar meanings, so their vectors are close together—the numbers are almost the same. The third sentence is semantically unrelated, so its vector points in a completely different direction.

This is how semantic search works. You're not matching keywords; you're matching meaning. "How do I request vacation time?" matches documents about "PTO policy" because those concepts live near each other in vector space, even though they share no words.

### Using Amazon Titan Embeddings

Titan Embeddings is Bedrock's native embedding model, optimized for retrieval:

```python
import boto3
import json

client = boto3.client('bedrock-runtime')

response = client.invoke_model(
    modelId='amazon.titan-embed-text-v2:0',
    body=json.dumps({
        'inputText': 'What is the refund policy?',
        'dimensions': 1024,  # or 512, 256 for smaller vectors
        'normalize': True    # unit length for cosine similarity
    })
)

result = json.loads(response['body'].read())
embedding = result['embedding']  # 1024-dimensional vector
```

Titan Embeddings V2 offers configurable dimensions—1024 (full precision), 512, or 256. Smaller dimensions trade some semantic precision for faster search and less storage. For most applications, 1024 or 512 works well; 256 is useful when you're storing millions of vectors and need to optimize costs.

### The Critical Rule

**Query and document embeddings MUST use the same model.**

If you index documents with Titan V1 and query with Titan V2, the vectors won't be comparable. Different models learn different vector spaces—what "close" means in one model's space has no relationship to closeness in another model's space. It's like comparing temperatures in Fahrenheit and Celsius without conversion.

This means changing embedding models requires re-indexing all your documents. Plan for this when evaluating embedding models—the switching cost is significant.

### Measuring Similarity

**Cosine similarity** is the standard measure for comparing embeddings. It calculates the cosine of the angle between two vectors, which ranges from -1 to 1:

- **1.0** = identical direction (same meaning)
- **0.0** = perpendicular (unrelated)
- **-1.0** = opposite direction (rare in practice for text embeddings)

When you hear "similarity score" in RAG contexts, it's usually cosine similarity. A score of 0.95+ indicates very similar meaning—the query and document are about the same thing. Below 0.7, the relationship is probably weak. These thresholds vary by embedding model and content type; calibrate with your data.

**Euclidean distance** is sometimes used instead, measuring the straight-line distance between vectors. For normalized embeddings (unit length), cosine similarity and Euclidean distance are mathematically related. Most vector databases support both.

---

## Vector Stores: Where Embeddings Live

You need somewhere to store embeddings and search them efficiently. This is a vector database—a specialized system optimized for similarity search over high-dimensional vectors.

### How Vector Search Works

The core operation is approximate nearest neighbor (ANN) search:

1. Store document chunks with their embedding vectors and metadata
2. Query comes in → convert to embedding using the same model
3. Find the k vectors closest to the query vector (most similar)
4. Return the associated document chunks

"Approximate" is key here. Finding the exact nearest neighbors among millions of vectors would require comparing against every vector—too slow for real-time queries. ANN algorithms like HNSW (Hierarchical Navigable Small World) build graph structures that find very good matches in milliseconds, accepting a small accuracy trade-off for massive speed gains.

### AWS Vector Store Options

**OpenSearch Service** is the production choice for most organizations. It's a managed Elasticsearch-compatible service with native vector search capabilities (k-NN plugin). You get:

```python
# Indexing a document
index_body = {
    'text': 'Original document text...',
    'embedding': [0.23, -0.45, ...],  # 1024 dimensions
    'metadata': {
        'source': 'policy.pdf',
        'page': 5,
        'department': 'hr'
    }
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
results = os_client.search(index='documents', body=search_body)
```

OpenSearch supports hybrid search (combining vector similarity with keyword matching), sophisticated filtering, and scales to billions of vectors. It's battle-tested for production workloads.

**Bedrock Knowledge Bases (Managed Store)** abstracts away the vector database entirely. You point it at S3 documents, configure chunking and embedding, and it handles storage, indexing, and search. Good for getting started quickly without infrastructure decisions:

```python
response = bedrock_agent.retrieve(
    knowledgeBaseId='YOUR_KB_ID',
    retrievalQuery={'text': 'What is the refund policy?'},
    retrievalConfiguration={
        'vectorSearchConfiguration': {
            'numberOfResults': 5
        }
    }
)
```

The trade-off is flexibility—you get less control over indexing strategies, filtering, and hybrid search options.

**Aurora PostgreSQL with pgvector** is the SQL choice. If you're already using Aurora and want vectors alongside relational data, pgvector adds vector operations to PostgreSQL:

```sql
-- Create the extension
CREATE EXTENSION vector;

-- Create a table with a vector column
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1024),
    department TEXT,
    created_at TIMESTAMP
);

-- Create an HNSW index for fast search
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- Search for similar vectors
SELECT content, 1 - (embedding <=> query_embedding) AS similarity
FROM documents
WHERE department = 'engineering'
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

The `<=>` operator computes cosine distance. The beauty of pgvector is SQL familiarity—you can join vector results with relational data, apply complex filters, and use existing PostgreSQL tooling.

### Choosing a Vector Store

**Just starting or prototyping?** → Bedrock Knowledge Bases managed store. Minimal setup, quick iteration.

**Production at scale?** → OpenSearch Service. Handles large vector collections, supports hybrid search, battle-tested.

**Already on Aurora, want integrated data?** → pgvector. Vectors alongside relational data, familiar SQL.

The anti-pattern is choosing OpenSearch "just in case" when managed Knowledge Bases would suffice. You're paying for complexity you don't need. Start simple, add complexity when requirements demand it.

---

## Retrieval Optimization

Finding the right chunks is everything in RAG. Perfect generation can't fix wrong retrieval—if the model doesn't have the information it needs, it will either say "I don't know" (best case) or hallucinate (worst case). Invest heavily in retrieval quality.

### Precision and Recall

These two metrics capture different failure modes.

**Precision** asks: of the chunks you retrieved, how many were actually relevant? If you retrieve 10 chunks and only 3 contain useful information, your precision is low. Low precision wastes context window space on irrelevant content and can confuse the model.

**Recall** asks: of all the relevant chunks that exist, how many did you retrieve? If 5 chunks in your corpus contain the answer but you only retrieved 2 of them, your recall is low. Low recall means you're missing information the model needs.

There's an inherent trade-off. Retrieve more chunks → higher recall (you're more likely to catch everything relevant) but lower precision (you're also including more noise). Retrieve fewer chunks → higher precision (only the best matches) but lower recall (you might miss something important).

Your application's tolerance for these errors should guide your retrieval configuration. For medical or legal applications, missing relevant information (low recall) might be dangerous. For concise Q&A, including too much irrelevant content (low precision) wastes tokens and can dilute answers.

### Improving Precision

**Similarity thresholds** filter out low-quality matches before they reach the model:

```python
results = vector_search(query_embedding, k=20)
filtered = [r for r in results if r.similarity_score > 0.75]
```

Instead of returning the top-k regardless of quality, you set a minimum threshold. Chunks below that threshold don't count as matches. This prevents the model from seeing marginally related content that would confuse more than help.

**Metadata filtering** narrows the search space before vector comparison:

```python
results = search(
    query_embedding,
    filter={
        'department': 'legal',
        'document_type': 'policy',
        'effective_date': {'$gte': '2024-01-01'}
    }
)
```

If you know the user is asking about legal policies, why search your entire corpus? Filter to legal documents first, then find the most similar vectors within that subset. This improves precision dramatically for queries with clear scope.

**Reranking** retrieves broadly then re-scores with a more sophisticated model:

```python
# Fast initial retrieval (approximate)
initial_results = vector_search(query, k=20)

# Slower, more accurate reranking
reranked = bedrock.rerank(
    modelId='cohere.rerank-v3-5:0',
    query=query,
    documents=[r.text for r in initial_results],
    topN=5
)
```

Reranking models read the full text of query and document, computing a relevance score that's more accurate than embedding similarity. You use vector search for speed (narrowing millions of documents to dozens), then reranking for precision (selecting the best handful).

### Improving Recall

**Query expansion** searches multiple ways to catch different phrasings:

```python
# Original query
queries = ['vacation policy']

# Expanded with synonyms and related terms
queries.append('PTO policy')      # Synonym
queries.append('time off rules')  # Related phrase
queries.append('annual leave')    # British English variant

# Search each, combine results
all_results = []
for q in queries:
    all_results.extend(search(embed(q), k=5))

# Deduplicate and take top results
final = deduplicate(all_results)[:10]
```

A user asking about "vacation" might not retrieve documents that use "PTO" exclusively. Query expansion catches these semantic equivalents.

**HyDE (Hypothetical Document Embeddings)** generates a hypothetical answer and searches for documents similar to it:

```python
# Generate a hypothetical answer
hypothetical = llm("Write a paragraph answering: " + query)

# Search for documents similar to the hypothetical answer
results = vector_search(embed(hypothetical), k=5)
```

The hypothetical answer uses vocabulary and concepts similar to what real answers would use, potentially retrieving documents that a direct query wouldn't match.

**Hybrid search** combines vector similarity with keyword matching:

```json
{
  "query": {
    "bool": {
      "should": [
        {"match": {"text": "error code E-1042"}},
        {"knn": {"embedding": {"vector": [...], "k": 10}}}
      ]
    }
  }
}
```

Sometimes users search for exact terms—error codes, product SKUs, specific names. Pure semantic search might not catch these because embeddings don't preserve exact strings. Hybrid search combines the precision of keyword matching with the flexibility of semantic similarity.

---

## RAG Architecture Patterns

Different use cases need different RAG architectures. Understanding these patterns helps you choose the right approach and recognize when simpler patterns won't suffice.

### Basic RAG

The simplest pattern: retrieve chunks, add them to the prompt, generate a response.

```
Query → Embed → Search → Top-K Chunks → FM → Response
```

With Bedrock Knowledge Bases, this is a single API call:

```python
response = bedrock_agent.retrieve_and_generate(
    input={'text': user_query},
    retrieveAndGenerateConfiguration={
        'type': 'KNOWLEDGE_BASE',
        'knowledgeBaseConfiguration': {
            'knowledgeBaseId': 'KB_ID',
            'modelArn': 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0'
        }
    }
)

answer = response['output']['text']
citations = response['citations']  # Sources for verification
```

Basic RAG works well for straightforward Q&A where a single retrieval finds everything needed. Documentation search, policy questions, FAQ systems—these are basic RAG territory.

**Best for**: Simple question-answering, documentation search, single-topic queries.

### Agentic RAG

The agent decides when and what to search, potentially making multiple retrieval calls based on what it learns:

```
Query → Agent reasons → Decides to search → Retrieves → Reasons more → Maybe searches again → Response
```

This pattern handles questions where the initial retrieval doesn't provide everything needed. The agent might retrieve information about a product, realize it needs pricing information too, make another search, and synthesize both results.

Bedrock Agents implements this pattern. You configure tools (including Knowledge Base retrieval as a tool), and the agent decides when to use them based on the conversation and its reasoning.

**Best for**: Complex questions requiring multiple lookups, research tasks, following up on partial answers.

### Conversational RAG

Multi-turn conversations require incorporating history into retrieval. When a user asks "What about the pricing?", you need context from earlier in the conversation to know what "the" refers to.

```python
def conversational_rag(query, history):
    # Transform the follow-up into a standalone question
    contextualized_query = llm(
        f"""Given this conversation history:
        {format_history(history)}

        Reformulate this question to be standalone: {query}"""
    )

    # Now search with the contextualized query
    results = retrieve(contextualized_query)

    # Generate with both conversation history and retrieved context
    return generate(query, results, history)
```

The key step is "query contextualization"—transforming "What about the pricing?" into "What is the pricing for the ProductX enterprise plan?" so the retrieval search makes sense without conversation context.

**Best for**: Chatbots, multi-turn interactions where pronouns and references need resolution.

### Multi-Index RAG

Route queries to specialized knowledge bases based on topic:

```python
def route_query(query):
    # Classify the query intent
    intent = classify(query)

    # Route to the appropriate knowledge base
    if intent == 'policy':
        return retrieve_from_kb('POLICY_KB', query)
    elif intent == 'technical':
        return retrieve_from_kb('TECHNICAL_KB', query)
    elif intent == 'product':
        return retrieve_from_kb('PRODUCT_KB', query)
    else:
        # Search all and combine
        return combine_results([
            retrieve_from_kb(kb, query)
            for kb in ['POLICY_KB', 'TECHNICAL_KB', 'PRODUCT_KB']
        ])
```

Specialized indexes can use chunking and embedding strategies optimized for their content type. Technical documentation might need larger chunks than FAQ content. Product descriptions might need different metadata than legal policies.

**Best for**: Large organizations with distinct knowledge domains, enterprises with specialized document types.

### Multi-Hop RAG

Some questions can't be answered with single retrieval because they require reasoning across multiple pieces of information.

**Example**: "What products does the CEO's previous company make?"

This requires:
1. Find who the CEO is
2. Find the CEO's employment history to identify their previous company
3. Find what that previous company makes

Single-shot retrieval fails because no single document contains all this information. You need multiple retrieval steps, each building on information from the previous step.

**Query decomposition** breaks the complex question into sub-questions:

```python
def multi_hop_rag(complex_query):
    # Use an FM to decompose into sub-questions
    sub_queries = decompose(complex_query)
    # ["Who is the CEO?", "What company did they work at previously?", ...]

    accumulated_context = []
    for sub_q in sub_queries:
        # Search for this sub-question
        chunks = retrieve(sub_q)
        # Generate partial answer
        partial = generate(sub_q, chunks, accumulated_context)
        # Add to context for next iteration
        accumulated_context.append(partial)

    # Synthesize final answer
    return synthesize(complex_query, accumulated_context)
```

**Iterative retrieval** lets the agent decide when it needs more information:

```python
def iterative_rag(query, max_hops=3):
    context = []
    for hop in range(max_hops):
        # Generate with current context
        response = generate_with_reflection(query, context)

        if response.has_complete_answer:
            return response.answer
        else:
            # Agent determined it needs more info
            new_chunks = retrieve(response.next_search_query)
            context.extend(new_chunks)

    return generate_final(query, context)
```

**When multi-hop matters**: Questions about relationships ("Who does X's manager report to?"), comparisons requiring multiple lookups ("How does our policy compare to industry standard?"), questions with implicit prerequisites ("What's the status of the project the new VP is leading?").

---

## Knowledge Base Management

Managing your Knowledge Base over time is as important as the initial design. Documents change, sources update, and stale information serves users poorly.

### Data Source Sync Modes

**On-demand sync** triggers ingestion manually or via API. You control exactly when documents are processed:

```python
response = bedrock_agent.start_ingestion_job(
    knowledgeBaseId='KB_ID',
    dataSourceId='DS_ID',
    description='Weekly policy update sync'
)

job_id = response['ingestionJob']['ingestionJobId']
```

Best for development environments where you're iterating on chunking settings, infrequent document updates where manual control is preferred, or scenarios requiring coordination with other systems.

**Scheduled sync** runs automatically at configured intervals—hourly, daily, or weekly. Set it and forget it:

Best for production environments with regular document updates, when documents change on predictable schedules, or when you want reduced operational overhead.

### Incremental vs Full Sync

**Incremental sync** only processes new or modified documents. It's faster and cheaper because it skips unchanged content. This is the default behavior—Knowledge Bases track what's been processed and only handle changes since the last sync.

**Full resync** reprocesses all documents from scratch. Required when:
- You change chunking strategy (can't change in place—must create a new data source)
- You switch embedding models (vectors aren't compatible)
- You suspect sync corruption or inconsistencies

Avoid full resyncs for large knowledge bases unless necessary—they're expensive in both time and compute.

### Monitoring Sync Health

Track these CloudWatch metrics to catch problems early:

- `IngestionJobsSucceeded` and `IngestionJobsFailed` — Are syncs completing?
- `DocumentsIngested` — How many documents processed?
- `IngestionJobDuration` — Are syncs taking longer over time?

Set alarms for failed syncs. A knowledge base that stops updating serves stale information without anyone knowing. Users get wrong answers, and there's no obvious error message.

### Citation and Attribution

Production RAG needs to show users where answers come from. Citations build trust (users can verify), enable compliance (auditors can trace decisions), and help debugging (you can see what the model used).

Bedrock Knowledge Bases returns citations automatically with `RetrieveAndGenerate`:

```python
response = bedrock_agent.retrieve_and_generate(
    input={'text': 'What is the return policy?'},
    retrieveAndGenerateConfiguration={...}
)

# Access citations
for citation in response['citations']:
    for ref in citation['retrievedReferences']:
        source = ref['location']['s3Location']['uri']
        excerpt = ref['content']['text']
        print(f"Source: {source}")
        print(f"Used content: {excerpt[:200]}...")
```

Each citation links a part of the response to the specific document passage that supported it. Users can click through to verify, and you can audit which documents influenced which answers.

For custom RAG implementations (not using Knowledge Bases), build citation into your prompt:

```python
prompt = f"""Based on the following documents, answer the question.
Cite each claim with [Doc N] where N is the document number.

Documents:
[Doc 1] {doc1_content}
[Doc 2] {doc2_content}
[Doc 3] {doc3_content}

Question: {user_question}

Include citations for every factual claim in your response.
"""
```

The model will cite sources inline, and you can parse these citations to build source links in your UI.

---

## Evaluating and Debugging RAG

How do you know if your RAG system is working well? Intuition isn't enough—you need systematic evaluation to catch problems before users do.

### The Three Quality Dimensions

RAG quality breaks into three independent dimensions, and problems in each require different fixes.

**Retrieval quality** asks: Are you finding the right chunks? If retrieval fails, everything downstream fails. Measure with precision (did you retrieve relevant documents?) and recall (did you miss any relevant documents?).

**Groundedness** asks: Is the answer actually supported by the retrieved content? High groundedness means the model is using the documents you provided. Low groundedness means hallucination—the model is generating claims not supported by evidence.

**Generation quality** asks: Is the answer relevant, complete, and concise? Even with perfect retrieval and perfect groundedness, the model might answer a different question, be incomplete, or bury the answer in verbosity.

### Debugging Workflow

When users report wrong answers, work through this systematic debugging process:

**Step 1: Check retrieval.** Were the right documents found?

Look at the retrieved chunks. Do they contain information relevant to the query? If not, your problem is retrieval—chunking strategy, embedding quality, or query formulation.

**Step 2: Check context.** Is the answer in the retrieved documents?

Read the retrieved chunks yourself. Can you, as a human, find the answer to the question in those chunks? If not, the answer might exist elsewhere in your corpus (retrieval recall problem) or might not exist at all.

**Step 3: Check generation.** Did the FM use the context correctly?

If the answer IS in the retrieved chunks but the response is wrong, you have a generation problem. Maybe the prompt needs improvement, the context is too long and the model lost track, or the model is overriding retrieved information with training data.

This systematic approach prevents wasted effort. Don't optimize prompts when retrieval is broken. Don't tune retrieval when the documents simply don't contain the answer.

### Common Problems and Solutions

**Problem: "I don't know" when the answer exists**

Possible causes:
- Document isn't indexed (check ingestion logs)
- Similarity threshold is too high (chunks exist but don't meet the threshold)
- Answer is split across chunk boundaries (chunking strategy issue)
- Query language doesn't match document language (vocabulary mismatch)

**Problem: Wrong answers from the wrong documents**

Possible causes:
- Retrieval precision is low (add metadata filters, increase threshold)
- Similar but irrelevant content exists (add reranking)
- Query is ambiguous (add query clarification)

**Problem: Contradicts the retrieved context**

Possible causes:
- Model is overriding context with training data (strengthen prompt instructions)
- Context is too long and model loses track (reduce number of chunks)
- Multiple conflicting chunks retrieved (add source quality filtering)

### Golden Dataset Testing

Maintain a test set with questions and known-correct answers:

```python
golden_dataset = [
    {
        'query': 'What is the refund policy?',
        'expected_answer_contains': ['30 days', 'original payment method'],
        'expected_sources': ['returns-policy.pdf']
    },
    {
        'query': 'How do I reset my password?',
        'expected_answer_contains': ['settings', 'security', 'email'],
        'expected_sources': ['account-help.pdf']
    },
]

def regression_test():
    results = []
    for item in golden_dataset:
        response = rag_pipeline(item['query'])

        # Check if expected content appears in response
        content_match = all(
            phrase.lower() in response.answer.lower()
            for phrase in item['expected_answer_contains']
        )

        # Check if expected sources were retrieved
        sources_match = any(
            expected in source
            for expected in item['expected_sources']
            for source in response.sources
        )

        results.append({
            'query': item['query'],
            'content_match': content_match,
            'sources_match': sources_match
        })

    return results
```

Run this after any change to chunking, embeddings, prompts, or retrieval logic. Catching regressions in automated testing is far better than catching them via user complaints.

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
| "Response contradicts context" | **Intrinsic hallucination**—check faithfulness metric |
| "Verify response is grounded" | **Faithfulness/groundedness** evaluation |
| "Complex question requiring multiple lookups" | **Multi-hop RAG** or query decomposition |
| "Show sources to users" | **Citations** from RetrieveAndGenerate |
| "Keep knowledge base updated" | **Scheduled sync** vs on-demand |
| "Chunk splitting mid-sentence" | Fixed-size chunking issue—use semantic chunking |
| "k-NN" or "approximate nearest neighbor" | **HNSW** algorithm in vector search |
| "Query and document vectors don't match" | **Same embedding model** required for both |

---

## Key Takeaways

> **1. RAG stops hallucination by grounding responses.**
> Instead of making things up from training data, the model synthesizes answers from your actual documents. This is the difference between a demo and a production system.

> **2. Chunking is foundational—get it right.**
> Match chunking strategy to your document structure. Too big creates semantic mush; too small loses context. Use overlap to prevent losing information at boundaries. Test with your actual content.

> **3. Same embedding model everywhere.**
> Query and document embeddings MUST use the same model. Different models produce incompatible vector spaces. Changing models requires re-indexing everything.

> **4. Debug systematically: retrieval → context → generation.**
> When answers are wrong, check retrieval first (right chunks?), then context (answer present?), then generation (model used it correctly?). Don't optimize downstream when upstream is broken.

> **5. Multi-hop RAG for complex questions.**
> Some questions require multiple retrieval steps. Query decomposition and iterative retrieval handle questions that single-shot retrieval can't answer.

> **6. Test with golden datasets.**
> Maintain test cases with known answers. Run regression tests after any change. Catch quality degradation before users do.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Wrong chunk size** | Too big and embeddings become semantic mush—vague averages that don't match specific queries. Too small and you lose context needed for meaningful retrieval. Match chunk size to your content structure. |
| **Mixing embedding models** | If you index with Titan V1 and query with Cohere, vectors aren't comparable. Same model everywhere, always. |
| **Semantic search only** | Sometimes users search for exact terms—error codes, product SKUs. Hybrid search (vector + keyword) catches both semantic similarity and exact matches. |
| **Skipping evaluation** | Assuming retrieval "just works" leads to silent failures. Measure precision and recall systematically. Build golden datasets and run regression tests. |
| **Ignoring citations** | Users can't verify answers without sources. Citations build trust and catch hallucinations. Use them in production. |
| **Over-retrieving chunks** | More context isn't always better. Too many chunks dilute relevant information and can overwhelm the model. Precision matters. |
