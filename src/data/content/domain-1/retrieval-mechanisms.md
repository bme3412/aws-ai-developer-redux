# Design Retrieval Mechanisms for FM Augmentation

**Domain 1 · Task 1.5 · Skills 1.5.1–1.5.6**

Task 1.5 answers one question: **how do you get the right evidence in front of a foundation model before you ask it to write?**

Imagine an internal technology-investing copilot. The corpus is earnings-call transcripts, 10-Ks and 10-Qs, investor decks, press releases, internal notes, and sell-side research. An analyst asks:

> “Why has our view on AMD become more cautious over the last two quarters?”

The FM does not know your current internal thesis or necessarily the latest AMD disclosures. **Retrieval-augmented generation (RAG)** finds relevant passages and places them in the model’s context. The model then reasons over *that* evidence instead of parametric memory alone.

```text
INGESTION                              QUERY
Source documents                       Analyst question
        │                                      │
1.5.1   Chunking                               │
        │                                      ▼
1.5.2   Embeddings                     1.5.5  Query handling
        │                              (rewrite / expand / decompose)
        ▼                                      │
        Index  (the shelf from 1.4)            ▼
                                       1.5.3  Vector search
                                               │
                                               ▼
                                       1.5.4  Hybrid + rerank
                                               │
                                               ▼
                                       Best evidence (context budget)
                                               │
                                               ▼
                                       1.5.6  Retrieval interface
                                               │
                                               ▼
                                       Foundation model → answer + citations
```

That sequence is how to remember **1.5.1 → 1.5.6**. Retriever question: *did I find the right evidence?* Generator question: *did the model use it?* Perfect retrieve can still hallucinate.

> **Exam tip:** If the stem is “cheapest shelf for 50 million infrequent vectors,” that is still store choice. If the stem is “misses `MI300X` but finds ‘accelerator’,” you are here.

---

## Skill 1.5.1 — Chunking: retrievable units, not 40-page filings

A 40-page NVIDIA transcript should not be **one** vector. Chunking turns the document into units you can actually search.

```text
NVIDIA Q2 transcript
        │
        ├── Chunk: Jensen opening remarks
        ├── Chunk: Data Center revenue
        ├── Chunk: Blackwell production
        ├── Chunk: China restrictions
        ├── Chunk: gross margins
        └── Chunk: analyst Q&A
```

The tradeoff is real. There is **no universally correct chunk size**. Treat size as an eval parameter. Bedrock Knowledge Bases **standard** (fixed-family) chunking is on the order of **~300 tokens** and respects sentence boundaries. “~500 tokens with overlap” is a common blog example, not AWS’s default. If you change corpus chunking and want the whole index on the new strategy, re-chunk and re-embed.

```text
VERY SMALL                              VERY LARGE
Precise                                 More surrounding context
Narrow meaning                          Fewer vectors
Lost context, fragmented ideas          Diluted embedding, extra prompt noise
```

### Fixed-size

N tokens, optional **overlap** so a fact that straddles a boundary is not split in half.

> AMD: “…demand for MI300 remains strong. We now expect data-center GPU revenue to exceed $5 billion…”  
> If the chunk ends after “strong” and the next starts at the guidance, you separated two related facts. Overlap reduces that.

**When:** documents are fairly homogeneous; structure is unreliable; you want a simple, predictable baseline. Bedrock KB configurable max tokens + overlap percentage lives here.

### Semantic

Not “every 500 tokens.” **Start a new chunk when the subject changes** (max tokens, buffer, breakpoint threshold). Lengths vary.

```text
AMD transcript
 ├── MI300 demand and customer adoption
 ├── Gaming weakness
 ├── Embedded inventory correction
 ├── Gross-margin outlook
 └── Capital allocation
```

“What is happening with AMD Embedded?” should retrieve one coherent Embedded section, not a 500-token window that is half Gaming.

### Hierarchical

Long structured filings. Search **small children**; send the FM the **parent** for context.

```text
PARENT    AMD Q2 Earnings Call — Data Center
  CHILD   MI300 revenue expectations
  CHILD   Hyperscaler adoption
  CHILD   Supply constraints
```

You might hit the child “MI300 revenue expected to exceed $X billion,” then give the model the surrounding parent that explains *why*. Precision at search time, completeness at generation time.

### None / custom

You already segmented (Lambda by exhibit heading). Each file is one retrieval unit.

```text
Fixed          → simple baseline
Semantic       → split by meaning
Hierarchical   → small pieces for search, large pieces for context
Custom / none  → you already cut
```

```quickcheck
Q: Retrieved children are on-topic but the FM lacks surrounding sentences. Which family?
A: Smaller fixed size
B: Hierarchical — retrieve child, send parent
C: Embed the whole 10-K as one vector
D: Raise temperature
correct: B
feedback: Parent-child is precision plus context. Whole-document vectors dilute. Temperature is generation, not retrieve.
```

---

## Skill 1.5.2 — Embeddings: meaning as numbers, evaluated on *your* corpus

An **embedding** converts text into a vector that stands in for meaning.

```text
"AMD AI accelerator demand is increasing"
        ↓ embedding model
[0.17, -0.41, 0.82, 0.03, ...]
```

“MI300 adoption by cloud customers is accelerating” uses different words. Similar meaning. Its vector should land nearby.

Keyword search looks for similar **words**. Vector search looks for similar **meaning**. That is why “AMD artificial intelligence chip demand” can still retrieve “MI300 accelerator adoption among hyperscale customers.”

Do not start from “we use Titan.” Pick an embedder the way you pick a writer FM: **your** queries, **your** corpus — domain fit, language, modality, dimensions, float vs binary, storage, latency, Recall@k.

**Titan Text Embeddings V2** (Bedrock) accepts up to **8,192** tokens and can emit **1,024, 512, or 256** dimensions. Higher dimensions can preserve more signal and cost more to store and search. Evaluate; do not assume bigger is always better.

```text
AMD retrieval benchmark (illustrative)
                Recall@10
Titan 256          84%
Titan 512          89%
Titan 1024         90%
```

If 512 nearly matches 1024 on *your* set, 512 can be the production call.

```python
import json, boto3

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")

def embed(text: str) -> list[float]:
    res = bedrock.invoke_model(
        modelId="amazon.titan-embed-text-v2:0",
        body=json.dumps({"inputText": text, "dimensions": 1024}),
    )
    return json.loads(res["body"].read())["embedding"]

index_vector = embed(chunk_from_10k)
query_vector = embed("What changed with MI300 demand?")
```

**Ingest and query must share an embedding space** — same model, dimensions, vector type. The query is **not** run through the corpus chunker.

```text
INGEST:  document → chunk → embedding model → vectors
QUERY:   question → same compatible model / config → query vector
```

Change the model, dimensions, or another incompatible setting → **rebuild the index**. A prompt prefix will not rotate the space. Picking the embedder is 1.5.2; executing the rebuild is index maintenance.

**float32** vs **binary** (where supported): float is more precise; binary is smaller and cheaper. Knowledge Bases can use either for supported combinations.

Thousands of research files: embedding is an **ingestion pipeline** (S3 → Lambda or a job → batch embed → store), not a human clicking one document at a time. You do not need Lambda syntax. You need to recognize that generation of embeddings is automated and batched.

```fillin
The query must be embedded with the {{same compatible embedding model and config}} as the corpus. Change the space → rebuild the index.
```

---

## Skill 1.5.3 — Search the index you already have

You now have a triple:

```text
Chunk     "AMD expects MI300 demand..."
Embedding [0.23, -0.16, ...]
Metadata  ticker=AMD  quarter=Q2  year=2026  document_type=earnings_call
```

That triple lives on a shelf chosen earlier. This skill is **how you query it**: embed the question in the same space, apply hard filters, run k-NN (or the store’s equivalent), take neighbors. It is not a second bake-off of S3 Vectors vs OpenSearch.

Whatever backend you have, the retrieve shape is the same:

1. Embed the query in the **same space**.
2. **Metadata-filter** the room (`ticker = AMD`, this year) when the stem is a hard constraint.
3. k-NN inside that room.
4. Return chunks + scores — then **budget** what the writer sees.

When you *operate* search, the spectrum is how much plumbing you own: a search engine that also does vectors (OpenSearch — keywords, filters, ranking, analytics), a database that also does vectors (Aurora / RDS + **pgvector** — embeddings beside `companies` / `positions`), or Bedrock Knowledge Bases abstracting chunk → embed → store → retrieve. More control versus more managed. The exam wants that operational tradeoff, not one universally superior database.

**Retrieve** returns chunks. You own the prompt, generation, and citations. **RetrieveAndGenerate** retrieves, calls an FM, and returns an answer with citations. Fully **managed** Knowledge Bases do not support RetrieveAndGenerate — use Retrieve or **AgenticRetrieveStream**. Conventional KBs still have both.

```recall
Q: Stem says “search the existing Knowledge Base / OpenSearch / pgvector index for nearest neighbors.” New store, or query the one you have?
A: Query the one you have (1.5.3). Picking the shelf was the previous task.
```

---

## Skill 1.5.4 — Search intelligently: semantic, keyword, hybrid, filter, rerank

Basic vector search: chunks whose meaning is close to the question. Production retrieval usually needs more.

**Semantic search.** “Why is the market worried about NVIDIA's next-generation GPU ramp?” can surface Blackwell delays, supply constraints, GB200 ramp, rack-scale issues — even when the wording differs.

**Keyword / lexical search.** Query `B200` or `MI300X` or `HBM3E`. Exact identifiers matter. Semantic search should not automatically replace lexical search.

**Hybrid** combines them, often fused (Reciprocal Rank Fusion) into one list.

```text
             QUERY
               │
       ┌───────┴───────┐
       ▼               ▼
 Keyword search    Vector search
       │               │
       └───────┬───────┘
               ▼
        Combined ranking
```

“What did AMD say about MI300X demand from Microsoft?” wants the **exact** tokens (AMD, MI300X, Microsoft) *and* the **concepts** (hyperscaler adoption, accelerator spend). Knowledge Bases support `HYBRID` only on some backends. Custom KBs currently need a supported store (RDS, OpenSearch Serverless, MongoDB with a filterable text field, …) or retrieval falls back to semantic only. “KB supports hybrid” does not mean *this* KB does.

**Metadata filter** is not ranking. Your index may hold 300 companies × years of quarters. The question is AMD AI revenue *this year* — do not search everything.

```text
QUERY   "What has AMD said about AI revenue this year?"
FILTER  ticker = AMD  AND  date >= 2026-01-01
          ↓
semantic / hybrid search inside that room
```

| Mechanism | Example | Job |
|-----------|---------|-----|
| **Metadata filter** | `ticker = AMD` | Where you are **allowed** to search |
| **Keyword / BM25** | `MI300X` | Lexical relevance |
| **Vector search** | “accelerator demand” | Semantic relevance |

Useful research labels: ticker, company, date, quarter, year, document_type, analyst, sector, source. Filter syntax is store-specific; *using* the filter on a query is this skill.

```python
agent = boto3.client("bedrock-agent-runtime")
out = agent.retrieve(
    knowledgeBaseId="KBID123",
    retrievalQuery={"text": "MI300X demand from hyperscalers"},
    retrievalConfiguration={
        "vectorSearchConfiguration": {
            "numberOfResults": 20,
            "overrideSearchType": "HYBRID",
            "filter": {
                "andAll": [
                    {"equals": {"key": "ticker", "value": "AMD"}},
                    {"equals": {"key": "fiscal_year", "value": 2026}},
                ]
            },
        }
    },
)
```

**Reranking.** Retrieval gets candidates. Reranking chooses the winners. Do not rerank 50 million documents. A second-stage model scores **query + candidate text** and reorders a shortlist. Bedrock rerankers do this. It is **not** OpenSearch Learning to Rank (you labeling judgments and training XGBoost).

```text
Retrieve broadly → 30 candidates → reranker → top 5 → context budget → FM
```

`numberOfResults` is a knob. **topK = 2** misses evidence. **topK = 100** dumps noise, tokens, and latency. Do not stuff the entire retrieve list into the prompt. **Cohere Rerank** is the usual multilingual cue (100+ languages). **MMR** when the stem is less repetition in the window.

```quickcheck
Q: Vector search finds “accelerator” but misses the SKU `MI300X`. Backend supports hybrid. What do you add?
A: A new vector bucket
B: Hybrid (keyword + vector)
C: Fine-tune the writer
D: Raise temperature
correct: B
feedback: Exact identifiers are lexical. Hybrid is 1.5.4. A new shelf is store choice. Fine-tune and temperature do not fix retrieve.
```

---

## Skill 1.5.5 — Fix the question before you search

Sometimes the database is fine. The question is not.

> “Why have we become more cautious on AMD?”

What is “we”? What window? Which segments? What would count as evidence?

**Rewrite** — one clearer search. “What about supply?” after an AMD MI300 turn becomes “What did AMD say about MI300 supply?”

**Expansion** — alternate wording of the **same** search. “AMD AI outlook” also tries MI300 / MI350 / Instinct / data-center GPU revenue / hyperscaler demand. Raises the chance the retriever meets the language in the corpus.

**Decomposition** — **multiple** searches, then synthesize. “Why did our AMD thesis become more cautious over the last two quarters?” becomes: prior thesis, current thesis, estimate changes, Data Center AI, Gaming, Embedded, new risks. Retrieve separately, then combine. Bedrock Knowledge Bases can split a prompt into multiple retrieval queries. Comparative, temporal, and multi-part investment questions live here.

```text
Complex question → FM splits → Q1 / Q2 / Q3 → search each → combined evidence → FM
```

**Step Functions** can coordinate a known multi-step graph (identify company → window → decompose → retrieve → rerank → generate). Do not memorize “decomposition = Step Functions.” Memorize: when query processing is an explicit workflow, a state machine can own it. **AgenticRetrieveStream** is the loop *inside* Bedrock’s retrieve path when the model must iterate. Simple question → one Retrieve. Complex multi-step → decompose or agentic retrieval.

```recall
Q: “Compare AMD and AVGO accelerator commentary” — rewrite, expand, or decompose?
A: Decompose. Two filtered retrieves, then a compare prompt. Rewrite is still one search. Expansion is synonyms for one intent.
```

---

## Skill 1.5.6 — Give retrieval an interface the FM can use

You built a retrieval system. Every app should not re-implement OpenSearch DSL, embedding dimensions, credentials, and reranker config.

**Standard retrieval API.** `retrieve(query, ticker, date_range, document_types, top_k)`. Web app, research copilot, agent, Excel plugin — same contract. Implementation can move later without rewriting consumers.

**Function / tool calling.** Give the FM `search_research_documents`. It decides *when* evidence is needed, calls the tool, then answers. The FM is not the search engine. It **uses** the search engine.

```text
Analyst → FM
            ├── can answer directly? → answer
            └── need evidence → search_documents() → results → FM → answer
```

**MCP (Model Context Protocol).** Named standard: AI app / agent is the **client**; a retrieval **server** exposes tools (`search_transcripts`, `search_notes`, `get_company_history`). Many clients, one protocol — instead of a special Claude integration, a special Cursor integration, and a special internal agent. Bedrock Knowledge Bases can be exposed as MCP tools (for example via AgentCore Gateway). You do not memorize packet layouts.

```text
API              software calls retrieve(...)
Function calling the FM decides to invoke a tool
MCP              AI clients discover and use tools through one protocol
```

```fillin
MCP: the app is the {{client}}; the retrieval service is the {{server}}. Agents share one contract instead of each embedding index DSL.
```

---

## The AMD copilot, end to end

Analyst: “What evidence suggests AMD's AI opportunity has strengthened or weakened over the last two quarters?”

1. **Chunk** Q1 and Q2 transcripts into AI revenue, MI300 customers, supply, guidance (1.5.1).
2. **Embed** each chunk with one Titan config (1.5.2).
3. **Search** the existing index — not a new product bake-off (1.5.3).
4. **Handle the query** — decompose into Q1 vs Q2 guidance, demand, customers (1.5.5).
5. **Retrieve intelligently** — ticker/date filters + hybrid + rerank to a short evidence list (1.5.4).
6. **Expose** `search_research` as API, tool, or MCP (1.5.6).
7. **Generate** only then, with cited Q1/Q2 passages and the internal note in context.

That is FM augmentation.

| Concept | Question it answers |
|---------|---------------------|
| Chunking | What pieces should I search? |
| Embedding | How do I represent meaning numerically? |
| Vector search | How do I find nearest neighbors on the index I have? |
| Semantic vs keyword | Similar meaning vs these exact terms? |
| Hybrid | How do I use both? |
| Metadata filter | Which subset am I allowed to search? |
| Reranking | Which candidates are actually best? |
| Expansion / decomposition | Better wording, or several searches? |
| Function calling / MCP | How does the FM invoke retrieval consistently? |

---

## When to use which

| Symptom / requirement | Fix |
|-----------------------|-----|
| Arbitrary cuts split a financial explanation | Semantic or hierarchical chunking |
| Small chunks retrieve well but lack context | Hierarchical (child → parent) |
| Weak embedding retrieval | Evaluate another embedder / dimensions on **your** set |
| Index too large / expensive | Fewer dimensions or binary vectors |
| New incompatible embedder | Re-embed / reindex |
| Must search only AMD this year | Metadata **filter** |
| Misses exact `MI300X` / `B200` | Keyword / hybrid if the backend supports it |
| Misses equivalent wording | Vector / semantic search |
| 30 vague hits, need the best five | Bedrock reranker, then cut the budget |
| Vague follow-up (“what about supply?”) | Rewrite |
| Vocabulary mismatch | Expansion |
| Multi-part / temporal compare | Decomposition |
| Known multi-step query graph | Step Functions |
| Complex iterative research | Agentic retrieval |
| Many apps, one search | API / tool / **MCP** |
| Evidence only | `Retrieve` |
| Managed retrieve + answer | `RetrieveAndGenerate` where supported |
| Cheap 50M archive shelf | Wrong task — store choice |

---

## AWS service glossary

### Data

#### Document chunking (Bedrock Knowledge Bases)

**What it is.** Split a source into embeddable passages: fixed, semantic, hierarchical, or none/custom.

**Problem it solves.** A 40-page transcript is not one useful vector.

**Where it sits.** First ingest stage, after the file is a valid payload.

**Typical use.** ~300-token standard chunks; hierarchical when you need child precision + parent context.

**Pricing.** Part of KB ingest / your Lambda.

**Exam cue.** Topic change → semantic. Parent-child → hierarchical. Simplest → fixed / KB default.

**Do not confuse with.** Store choice. Embedder choice.

### GenAI / AI

#### Amazon Titan Text Embeddings V2

**What it is.** Bedrock embedder, up to 8,192 input tokens, **256 / 512 / 1024** dimensions.

**Problem it solves.** Chunks and queries in one vector space.

**Where it sits.** 1.5.2. The writer FM is a different purchase.

**Typical use.** Evaluate 1024 vs 512 on a desk query set.

**Pricing.** Embedding tokens.

**Exam cue.** Same model+config on ingest and query. Rebuild on swap.

**Do not confuse with.** The chat model. Nova multimodal embeddings.

#### Amazon Bedrock Knowledge Bases — Retrieve / RetrieveAndGenerate

**What it is.** Managed RAG APIs over a store you already configured.

**Problem it solves.** k-NN + optional hybrid/filter without writing the DSL.

**Where it sits.** 1.5.3–1.5.5 query path.

**Typical use.** `Retrieve` when you own the prompt; `RetrieveAndGenerate` for a managed grounded answer (where supported).

**Pricing.** Query units + generation tokens.

**Exam cue.** Evidence only vs managed answer. Hybrid is backend-dependent.

**Do not confuse with.** Picking OpenSearch vs S3 Vectors.

#### Amazon Bedrock Reranker models

**What it is.** Second-stage model: query + candidate texts → new ranking.

**Problem it solves.** Neighbors are *close*, not always *best*.

**Where it sits.** After a broad retrieve, before the context budget.

**Typical use.** top-20 → rerank to top-5.

**Pricing.** Rerank units (query × documents).

**Exam cue.** Precision / high-stakes. Cohere Rerank for multilingual. Not OpenSearch LTR.

**Do not confuse with.** Hybrid fusion (first stage). Learning to Rank.

### Integration / orchestration

#### Hybrid search (keyword + vector)

**What it is.** Lexical plus k-NN, fused into one list.

**Problem it solves.** Exact `MI300X` *and* “accelerator demand.”

**Where it sits.** 1.5.4, on a backend that supports hybrid.

**Typical use.** `overrideSearchType: "HYBRID"` plus ticker filters.

**Pricing.** Store query charges.

**Exam cue.** Identifiers → keywords. Meaning → vectors. Both → hybrid.

**Do not confuse with.** Metadata filters. Rerank.

#### Query rewrite / expansion / decomposition

**What it is.** Lambda, Step Functions, or an FM that changes the *question* before retrieve.

**Problem it solves.** Vague, synonym-mismatched, or multi-part questions.

**Where it sits.** 1.5.5, in front of search.

**Typical use.** Decompose “AMD vs AVGO over two quarters” into several filtered retrieves.

**Pricing.** Extra FM or Lambda invocations.

**Exam cue.** One clearer search = rewrite. Synonyms = expand. Multiple searches = decompose.

**Do not confuse with.** Reranking results you already have.

#### Model Context Protocol (MCP)

**What it is.** Standard: AI app = **client**, retrieval tools = **server**.

**Problem it solves.** Cursor, an internal agent, and another client share `search_transcripts`.

**Where it sits.** 1.5.6.

**Typical use.** Knowledge Base exposed as an MCP tool.

**Pricing.** Your compute; not an AWS SKU by itself.

**Exam cue.** Portable tools / standardized retrieval interface.

**Do not confuse with.** Store choice. Guardrails. Prompt Flows.

### Security / operations

#### Metadata filters on retrieve

**What it is.** Hard constraints applied *before* ranking.

**Problem it solves.** NVDA paragraphs must not appear in an AMD answer.

**Where it sits.** Query time, using labels designed with the index.

**Typical use.** `andAll` ticker + fiscal_year + document_type.

**Pricing.** Included in the search.

**Exam cue.** Tickers / dates / ACLs are filters, not BM25 hopes.

**Do not confuse with.** Keyword relevance. Guardrail topic filters.

---

## Practice questions

Pick an answer on every stem. The explanation appears after you choose — later questions stay unspoiled until you answer them.

```practice
Q: Retrieval often cuts a financial explanation in half at an arbitrary token boundary. What should you investigate?
A: A larger writer FM
B: Semantic or hierarchical chunking
C: Higher temperature
D: A larger vector database
correct: B
feedback: Arbitrary cuts are a chunking problem. Temperature and model size are generation. A bigger store does not glue split sentences.

Q: Analysts search “AI accelerator demand”; documents say “MI300 hyperscaler adoption.” What is meant to handle the mismatch?
A: Vector / semantic search
B: Exact keyword search only
C: Temperature
D: Prompt caching
correct: A
feedback: Similar meaning, different words is the embedding value proposition. Keywords would miss it. Caching and temperature are not retrieve.

Q: Analysts search exact names (MI300X, B200) and also ask conceptual questions. Attractive architecture?
A: Keyword only
B: Vector only
C: Hybrid search
D: Remove embeddings
correct: C
feedback: Identifiers need lexical match; concepts need vectors. Hybrid is both, if the backend supports it.

Q: Vector retrieval returns 30 vaguely relevant passages; you want five for the FM. What do you add?
A: A reranker on the shortlist
B: Larger chunks
C: More generation tokens
D: Higher temperature
correct: A
feedback: Retrieval gets candidates; reranking chooses winners. Do not rerank the lake. Tokens and temperature are generation.

Q: “Compare AMD's AI outlook, gross margins, and customer adoption over the last three quarters.” First technique?
A: Query decomposition
B: Smaller embedding dimensions
C: Fixed chunking
D: Prompt caching
correct: A
feedback: Multi-part temporal compare → several searches, then synthesize. Dimensions and chunking do not split the question.

Q: Cursor, an internal agent, and another app must share transcript search through a common AI-tool protocol. What?
A: MCP
B: Larger embeddings
C: Semantic chunking
D: Reranking
correct: A
feedback: MCP is the named client/server tool protocol. The others improve retrieve quality, not the access contract.

Q: The team wants the cheapest place to store 50 million rarely searched paragraphs, and is debating hybrid vs rerank. Which task?
A: Task 1.5 — pick hybrid
B: Task 1.4 — pick the shelf
C: Task 1.2 — pick Sonnet
D: Task 1.6 — Prompt Flows
correct: B
feedback: Infrequent + cheap + huge is store choice. 1.5 assumes the shelf exists.

Q: Titan V2 at 1024-d is expensive; a 100-query desk set is almost as good at 512. Next?
A: Keep 1024 forever
B: Re-embed at 512 and rebuild the index
C: Change only the query embedder to 512
D: Fine-tune Sonnet
correct: B
feedback: Dimensions are part of the space. Mixed 1024/512 is incompatible. Fine-tune is the writer.

Q: Query embedder is Cohere; corpus was Titan V2. Retrieval is nonsense. Why?
A: Hybrid is off
B: Different embedding spaces
C: Temperature too high
D: Missing Prompt Management
correct: B
feedback: Same compatible model and config on ingest and query.

Q: Restrict search to AMD Q2 2026 before ranking. BM25 on the word AMD is proposed. Right mechanism?
A: Metadata filter on ticker + quarter
B: Reranker only
C: Decomposition
D: MCP
correct: A
feedback: Hard constraint = filter. BM25 hoping to notice the ticker is how NVDA leaks in.

Q: You need chunks only so Lambda can build the prompt. RetrieveAndGenerate is proposed on a path that does not support it. What API?
A: Retrieve
B: InvokeModel with no search
C: StartIngestionJob
D: CreateGuardrail
correct: A
feedback: Evidence only = Retrieve. Managed generate is RetrieveAndGenerate where the KB type allows it.
```

---

## Final compressed review

Six sentences:

1. **Chunk it** — useful retrieval units (fixed / semantic / hierarchical / custom).
2. **Embed it** — numerical meaning; evaluate on your domain; same space on query.
3. **Search it** — k-NN on the index you have, inside metadata filters.
4. **Search it intelligently** — semantic + keyword (hybrid) + rerank a shortlist; budget the prompt.
5. **Fix the question** — rewrite, expand, or decompose before retrieve.
6. **Expose it** — API, tool call, or MCP so the FM is a consumer, not a search engine.

If you can walk the AMD copilot out loud — cut the transcripts, embed with one Titan config, filter `AMD`+window, hybrid for `MI300X`, rerank to five, decompose the two-quarter compare, hide it behind `search_research` — you are doing Task 1.5.
