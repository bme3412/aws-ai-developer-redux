# Application Performance Optimization

**Domain 4 · Task 4.2 · Skills 4.2.1–4.2.6**

The easiest way to misunderstand this task is to treat “performance” as making the model respond faster.

A production GenAI application is a chain of components. The user experiences the combined performance of all of them.

```text
User request
  → application
  → retrieval
  → prompt construction
  → foundation model
  → post-processing
  → response
```

If the copilot feels slow, the foundation model may not even be the main problem. Retrieval could be taking too long. The prompt could contain far too many tokens. Several model calls might be running sequentially when they could run in parallel. The application might wait for an entire response before displaying anything. Or demand could exceed the capacity allocated to the workload.

Task 4.2 is about diagnosing and optimizing that entire pipeline while balancing three competing goals:

**Latency → Cost → Quality**

Improving one can hurt another. A larger model may produce better answers but cost more and respond more slowly. Retrieving more documents may improve recall but increase vector-search latency and prompt size. Generating fewer tokens may reduce latency and cost but produce less complete answers.

The goal is not “maximum performance.” It is the best performance for the requirements of the application.

Walk this scenario as you read:

> An internal investment-research copilot. An analyst asks “What changed in AMD management's outlook for AI accelerators over the last two quarters?” The request might take twelve seconds: one second of retrieval, one second of reranking, eight seconds of model processing, two seconds of application and network overhead. Someone will propose a faster model. Someone else will buy more OpenSearch nodes. Task 4.2 asks whether you profiled first.

> **Exam tip:** Do not optimize the model because the chatbot “feels slow.” Find the bottleneck. Retrieval, orchestration, token volume, and inference are different levers.

---

## The GenAI performance mental model

Traditional applications think about milliseconds of API or database latency. GenAI applications introduce another unit: **tokens**.

A model has to process the input tokens and then generate output tokens. Larger prompts mean more work before the first token. Longer requested responses mean more sequential generation. Output is produced one token at a time; input is processed as a block.

Think about latency roughly as:

```text
Total latency  =  application latency
               +  retrieval latency
               +  model input processing
               +  model output generation
               +  orchestration overhead
```

Each term needs a different optimization. If retrieval is 1s, reranking is 1s, the model is 8s, and overhead is 2s, cutting the vector index from 1s to 500ms is real work — and it will not fundamentally solve a twelve-second answer. The largest opportunity is probably the model call or the structure of the workflow.

That is why **profiling and benchmarking come before optimization**.

Adjacent tasks sit next door:

- **[4.1](/learn/4/cost-optimization)** asks about money. The same knobs (tokens, batch, capacity, cache) appear here as *time*.
- **[1.5](/learn/1/retrieval-mechanisms)** teaches how to find evidence. 4.2.2 asks whether that retrieve path is also *fast enough*.
- **[2.2](/learn/2/model-deployment)** is how you serve the model. 4.2 cares whether serving meets latency and throughput SLOs.
- **[4.3](/learn/4/monitoring-systems)** is the dashboard. 4.2.6 is using traces to decide *where* to optimize.

| Skill | Question it answers |
|-------|---------------------|
| **4.2.1** | Can the user *feel* a response quickly? |
| **4.2.2** | Is retrieval fast enough *and* relevant enough? |
| **4.2.3** | How much work can the system process over time? |
| **4.2.4** | Is the model itself configured for this task? |
| **4.2.5** | Is capacity sized to tokens and concurrency, not just request count? |
| **4.2.6** | Which hop on the path is actually the bottleneck? |

---

## Skill 4.2.1 — Create responsive AI systems

The first skill is largely about **user-perceived latency**.

A GenAI application does not necessarily need to complete everything faster to *feel* faster. Sometimes the best optimization is changing how the application presents or schedules work.

### Response streaming

Without streaming:

```text
Request → model generates the entire answer → user sees the answer
```

The analyst stares at a blank screen for eight seconds.

With streaming:

```text
Request → model begins generating → first tokens appear → remainder continues
```

Total generation time may still be eight seconds. The user might see the beginning of the answer after one second.

That introduces **time to first token (TTFT)**: how long the user waits before the first generated content appears. TTFT is not total response latency. For chatbots, coding assistants, research copilots, and customer-service assistants, TTFT often determines whether the application feels responsive.

On Bedrock this is `converse_stream` (or `InvokeModelWithResponseStream`). Put WebSocket or SSE in front so the browser can paint tokens as they arrive — that contract is [2.4](/learn/2/fm-api-integrations). Where Bedrock offers **latency-optimized inference**, opt in on interactive requests. Overnight jobs should not; they belong in batch.

```python
stream = bedrock.converse_stream(
    modelId="anthropic.claude-sonnet-4-20250514-v1:0",
    messages=[{"role": "user", "content": [{"text": "NVDA vs AVGO, four bullets."}]}],
    inferenceConfig={"maxTokens": 400, "temperature": 0.2},
)
for event in stream["stream"]:
    delta = event.get("contentBlockDelta", {}).get("delta", {}).get("text")
    if delta:
        print(delta, end="", flush=True)
```

> **Exam tip:** *Users wait too long before seeing anything*, and total generation time is acceptable → streaming / TTFT. Not batch. Not a bigger cluster.

### Pre-computation

Perform predictable work *before* the user asks.

Analysts repeatedly ask “What were NVIDIA's latest earnings?”, “What changed in Microsoft's guidance?”, “What were Apple's latest margins?” Instead of recomputing everything at request time, generate summaries when the 10-Q lands, cache them, and serve the precomputed result.

```text
New document arrives → process + summarize → cache
User asks later      → retrieve precomputed result
```

This trades storage or off-peak compute for lower request-time latency. It works when requests are predictable, repetitive, expensive to calculate, and based on information that does not change constantly. It is less useful for highly personalized or unpredictable questions. CloudFront belongs here when the precomputed asset is safe to put near the user.

Pre-computation and [4.1.4 caching](/learn/4/cost-optimization) overlap. 4.1 asks whether reuse saves money. 4.2.1 asks whether it saves *wait time*.

### Parallelization

AI applications frequently contain independent operations. The copilot may need earnings-transcript retrieval, SEC-filing retrieval, and internal-research retrieval.

Sequential:

```text
Transcript → Filing → Research note
```

If each takes one second, retrieval takes about three.

Concurrent:

```text
          ┌─ Transcript
Request ──┼─ Filing
          └─ Research
```

If they are independent, total retrieval time can fall toward one second.

**Parallelize independent operations. Do not parallelize operations that depend on one another.** If step B requires the output of step A, they stay sequential. Step Functions parallel states, concurrent Lambdas, or `asyncio.gather` are the usual AWS pictures — the exam is testing the *dependency*, not the SDK.

### Latency-optimized model selection

Not every request requires the most capable available model. Classifying a document as earnings call, filing, or research note does not need the same model as comparing management commentary across eight quarters.

Use the smallest / fastest model that reliably meets the quality requirement. [4.1.2](/learn/4/cost-optimization) said this as a cost rule. Here it is a latency rule. The routing architecture is the same.

### Performance benchmarking

Do not say “the application seems faster.” Measure it.

Useful numbers: average, p50, p95, and p99 latency; TTFT; total generation time; tokens processed and generated; cost per request; retrieval latency.

Percentiles matter. If p50 is 2 seconds and p95 is 12 seconds, the average user may be fine while a significant group has a terrible experience. Production optimization examines the **tail**, not just the mean.

```recall
Q: The chatbot takes eight seconds to finish. Users complain that nothing appears during those eight seconds. First lever?
A: Stream the response so TTFT drops. Total generation time may stay eight seconds. Batch inference and more retrieved chunks do not fix a blank screen.
```

---

## Skill 4.2.2 — Enhance retrieval performance

Retrieval is especially important for RAG. The path is:

```text
Question → query processing → search → ranking → selected chunks → model
```

The system needs retrieval to be **fast enough and relevant enough**. Returning only a few documents can be fast and miss evidence. Searching huge numbers of chunks may improve recall and inflate latency and prompt size. That tradeoff is the skill.

The *mechanics* of hybrid search, filters, and rerank live in [1.5](/learn/1/retrieval-mechanisms). Here the exam asks whether you treat that path as a performance surface you can tune and benchmark — not only as a quality surface.

### Index optimization

A vector database maintains an index so similar embeddings can be found without scanning every document. Parameters commonly trade **search speed ↔ search accuracy**. Searching more aggressively may improve recall and consume additional CPU, memory, and time.

You do not need the mathematics of HNSW `ef_search` on the exam. You need to recognize that vector search itself can be tuned and benchmarked, and that “the RAG app is slow” might be the index, not Bedrock.

### Metadata filtering

Metadata can dramatically reduce the search space.

“What did AMD say about MI300 during Q2 2025?” should not search every document in the knowledge base. Filter `ticker = AMD`, `document_type = earnings transcript`, `quarter = Q2 2025`, then run semantic search inside that subset.

Two benefits: better relevance, and less unnecessary search. Metadata filtering is therefore both a retrieval-quality technique and a performance optimization.

### Query preprocessing

Users do not always phrase questions in a search-friendly form.

“What changed in their AI outlook last quarter?” may need: “their” = NVIDIA, “last quarter” = Q2 2026, “AI outlook” = guidance, demand commentary, capacity, and product roadmap.

Preprocessing includes normalization, rewriting, entity extraction, abbreviation expansion, metadata extraction, and spell correction. A cleaner query often means the search system has less work to do and retrieves better candidates.

### Hybrid search

Vector search is good at semantic similarity. Keyword search is good at exact matches.

Semantic retrieval may find conceptually related passages for “Blackwell gross margin pressure.” If you specifically need `GB200 NVL72` or `MI300X`, exact keyword matching is extremely useful.

Hybrid search combines sparse/keyword search with dense/vector search. For financial research the corpus contains product names, tickers, numerical terms, accounting language, *and* paraphrases. Pure semantic search can miss exact-match signals. Pure keyword search can miss “accelerator demand” when the filing said “GPU ramp.”

Amazon OpenSearch Service and Bedrock Knowledge Bases (on backends that support `HYBRID`) are the named exam services. Rerank only a limited candidate set — reranking the lake is a latency defect.

> **Exam tip:** *Semantic search misses product codes and exact technical terminology* → hybrid search. *Irrelevant documents* → query preprocessing + metadata filters + hybrid + rerank *before* you blame the foundation model.

```recall
Q: Vector search returns conceptually related AMD passages but misses the string MI300X. What does 4.2.2 want?
A: Hybrid search — semantic plus keyword. Raising maxTokens or temperature does not find the product code.
```

---

## Skill 4.2.3 — Optimize FM throughput

**Latency** asks: how long does one request take?

**Throughput** asks: how much work can the system process over time? Requests per second, tokens per second, documents per hour.

A system can have good latency for one user and collapse when 1,000 users arrive simultaneously. Treat the two dimensions separately.

### Token processing optimization

Tokens are a resource. A 3,000-token prompt and a 50,000-token prompt that both contain enough information to answer the same question are not equivalent work. Unnecessary tokens increase input-processing time, cost, context-window usage, and often TTFT.

Retrieve fewer but better chunks. Remove duplicate context. Shorten system instructions. Summarize long histories. Limit irrelevant conversation. Limit output length.

**More context is not automatically better context.** [4.1.1](/learn/4/cost-optimization) said this as a bill. 4.2.3 says it as throughput: every extra token is capacity you cannot spend on another request.

### Batch inference

Interactive applications need immediate responses. Many AI workloads do not.

Summarizing 10,000 transcripts overnight through an interactive API is inefficient. **Batch inference** processes large numbers of offline requests together. Use it when an immediate response is unnecessary, volume is large, and work can be asynchronous.

```text
Interactive workload     →  real-time inference (stream if a human is waiting)
Large offline workload   →  batch inference
```

Do not use batch inference when a user expects a conversational response immediately. Bedrock Batch Inference and SageMaker Batch Transform are the two named paths; pick from whether you are on a managed FM or a hosted endpoint.

### Concurrent model invocation management

Five hundred users requesting inference at once does not mean you send 500 unbounded calls. Applications need concurrency limits, request queues, throttling, retry strategies, and backpressure.

Think of a restaurant. If 300 customers arrive at once, the solution is not necessarily to let all 300 into the kitchen. SQS, API Gateway usage plans, and SDK retries with backoff control the flow so the system keeps operating. `Too many requests` is a capacity/quota problem ([1.2](/learn/1/model-selection) CRI or Provisioned Throughput) — not a temperature problem, and not “add application servers.”

```recall
Q: 500,000 documents must be summarized by morning. Nobody is waiting on a chat bubble. Interactive streaming or batch?
A: Batch inference. Throughput matters more than TTFT. Streaming is for a human watching tokens.
```

---

## Skill 4.2.4 — Enhance foundation model performance

This skill is about how the model *behaves*, not about making infrastructure faster.

The important controls: temperature, top-p, top-k, maximum output tokens, model choice, prompt structure.

### Temperature, top-p, top-k

**Temperature** controls randomness in token selection. Low temperature is more deterministic and focused — extraction, classification, financial analysis, structured outputs, factual summarization. Higher temperature is more diverse — brainstorming, marketing copy, idea generation.

**Top-p** (nucleus sampling) limits selection to a subset of likely tokens whose cumulative probability reaches a threshold. **Top-k** restricts selection to the *k* most likely next tokens. Both control generation diversity.

Group them:

```text
Temperature + top-p + top-k  →  generation behavior
They are not substitutes for scaling infrastructure.
```

Do not confuse temperature with a performance setting. Raising it does not make Bedrock quicker. It does not fix throttling. Lowering it does not add GPUs. For the copilot's factual AMD outlook question, temperature near 0 is the quality control, not a latency hack.

> **Exam trap:** *We need more deterministic factual answers* → lower temperature / controlled sampling. Not additional infrastructure. Not streaming.

### Maximum output tokens

One of the easiest ways to reduce both cost and latency is to avoid generating unnecessarily long answers. A three-sentence classification explanation does not need 5,000 output tokens. Responses are generated token by token. Longer answers generally mean more generation → more time → more cost.

### A/B testing

Model optimization should be measured, not guessed.

Version A: large model + 10 retrieved chunks. Version B: smaller model + reranker + 5 retrieved chunks. Send representative evaluation questions through both and compare accuracy, hallucination rate, latency, token consumption, cost, and user satisfaction.

The winner is not necessarily the highest possible answer quality. If A is 92% accurate, 12 seconds, $0.20/request, and B is 91% accurate, 3 seconds, $0.04/request, B may be the better production architecture. Optimization means evaluating the complete objective function, not one metric.

```recall
Q: JSON extraction wobbles and someone proposes Provisioned Throughput “to stabilize decoding.” What is the actual knob?
A: Temperature near 0 (and stop sequences / a schema). PT is reserved capacity. Decoding knobs are personality, not throughput.
```

---

## Skill 4.2.5 — Efficient resource allocation

GenAI workloads behave differently from conventional web applications because resource demand is heavily affected by **token volume**.

Two requests may both count as one API request and have dramatically different computational cost: 500 input + 100 output versus 50,000 input + 4,000 output. Treating them as equivalent makes capacity planning unreliable.

### Capacity planning

Understand expected patterns: requests per minute, average and maximum prompt size, average completion length, peak concurrency, daily traffic shape.

The copilot may receive most traffic around market open, immediately after earnings releases, and following major news. Designing capacity around the daily average causes poor performance at precisely the moments users need the system most. That is the same peak-vs-average lesson as [4.1.3](/learn/4/cost-optimization), now framed as SLO miss rather than wasted spend.

### Utilization monitoring

Watch traditional metrics (CPU, memory, request count, network) *and* GenAI metrics: input tokens, output tokens, tokens per request, model latency, throttled requests, concurrent invocations.

Token patterns reveal application bugs. If average prompt length jumps from 5,000 to 30,000 tokens after a deployment, something went wrong with retrieval, conversation-history management, or prompt construction. Auto scaling will not fix a 40k-token prompt. CloudWatch is the instrument; [4.3](/learn/4/monitoring-systems) is the fuller dashboard.

### Auto scaling for GenAI traffic

More traffic → add capacity. Less traffic → remove unnecessary capacity. GenAI scaling should consider more than raw request count. Better signals: concurrent model calls, queue depth, token throughput, request latency, workload type.

Ten huge inference requests may consume more capacity than 100 very small ones. Configure scaling specifically for GenAI traffic patterns — SageMaker on invocations per instance or queue depth, not only CPU. Lambda **provisioned concurrency** warms *your* compute so cold starts do not dominate TTFT. It does not raise Bedrock's on-demand quota.

> **Exam tip:** *Traffic spikes during certain events* → capacity planning + utilization monitoring + auto scaling, using token-aware signals. *Prompt size exploded after a deploy* → inspect retrieval and prompt construction first, not the autoscaler.

```recall
Q: After a deploy, average prompts jump from 6,000 to 40,000 tokens and p95 latency follows. Scale out or inspect the prompt path?
A: Inspect retrieval and prompt construction. Scaling copies the waste. Token bloat is usually over-retrieval, duplicate context, or unbounded chat history.
```

---

## Skill 4.2.6 — Optimize the whole GenAI workflow

The final skill pulls everything together.

**Measure the complete request path before deciding where to optimize.**

System A:

```text
API             200 ms
Vector search   800 ms
Rerank          700 ms
Foundation model 8,000 ms
Post-process    300 ms
────────────────────────
Total           ~10 s
```

The model call dominates. A faster index will not save the SLO.

System B:

```text
API             200 ms
Retrieval       5,000 ms
Model           2,000 ms
Post-process    300 ms
```

Switching foundation models accomplishes very little. Retrieval is the bottleneck.

### Profiling

Profiling means measuring how much time each stage consumes. Instead of “the RAG application is slow,” you want: retrieval p95 is 1.8s, reranking is 400ms, TTFT is 900ms, generation is 4.2s, post-processing is 200ms. Then you know where to work.

The conventional loop still applies: **measure → identify bottleneck → optimize → benchmark again.**

**AWS X-Ray** is the named exam service. Trace API Gateway → Lambda → OpenSearch → Bedrock as subsegments. Annotate `model_id`, token counts, retrieval k. CloudWatch tells you *that* p95 is 12 seconds. X-Ray tells you *which hop*.

### Vector database query optimization

If retrieval is the bottleneck, candidates include metadata filtering, shrinking the search space, tuning index parameters, optimizing embedding dimensionality, retrieving fewer candidates, caching frequent searches, using hybrid search intelligently, and reranking only a limited candidate set.

Notice that retrieval optimization is not simply “return fewer documents.” That can cut latency and destroy answer quality. Balance speed and relevance. Benchmark both.

### Efficient service communication

Distributed AI applications may invoke many services: API Gateway → Lambda → retrieval → model → database → another Lambda. Every network hop adds overhead. A chain A → B → C → D → E can sometimes become independent work in parallel feeding a join. The fewer unnecessary sequential dependencies you create, the lower end-to-end latency can become. That is 4.2.1 parallelization applied to the *whole* graph, which is why 4.2.6 exists as its own skill.

```recall
Q: X-Ray shows OpenSearch p95 at 5s and Bedrock at 800ms. Buy Provisioned Throughput?
A: No. Retrieval is the bottleneck. Tune filters, hybrid, k, the index, or the candidate set. PT does not make k-NN faster.
```

---

## The AMD request, optimized end to end

The analyst asks: “What changed in AMD management's outlook for AI accelerators over the last two quarters?”

Query preprocessing extracts ticker = AMD, time range = previous two quarters, topic = AI accelerators. Retrieval applies metadata filters first. Hybrid search combines semantic similarity with exact terms such as MI300 or MI350. A manageable candidate set is reranked. Only the best passages enter the prompt.

Independent retrieval sources run in parallel. The application selects an appropriate Bedrock model rather than the most expensive one. Generation uses low temperature because this is factual research. Maximum response length is constrained. The response is streamed so the analyst sees output quickly.

Metrics capture retrieval latency, TTFT, total latency, prompt tokens, completion tokens, errors, and cost. During earnings season, resources scale on concurrent invocations and queue depth — not only on request count.

That is Task 4.2 in one architecture.

---

## Distinctions that will be tested

Several concepts in this domain sound similar. Keep them separate.

| Concept | Question it answers |
|---------|---------------------|
| **Latency** | How long does one request take? |
| **Throughput** | How much work can the system process? |
| **TTFT** | How quickly does the user see the first output? |
| **Streaming** | Can output appear while generation continues? |
| **Batch inference** | Can many non-urgent requests be processed together? |
| **Concurrency** | How many requests are executing simultaneously? |
| **Pre-computation** | Can predictable work be completed before it is requested? |
| **Caching** | Can previously computed work be reused? |
| **Hybrid search** | Can keyword and semantic search complement each other? |
| **Profiling** | Which component is actually causing the slowdown? |
| **Benchmarking** | How does performance compare across configurations? |
| **A/B testing** | Which configuration performs better empirically? |

Temperature / top-p / top-k control **generation behavior**. They are not capacity. Cross-Region inference and Provisioned Throughput are capacity. Streaming is perceived latency. Batch is throughput for work that can wait.

### Exam traps

| Stem | Do not immediately | Think instead |
|------|--------------------|---------------|
| The chatbot feels slow | A faster model | Profile: retrieval, orchestration, tokens, or inference? |
| Users wait too long before seeing anything | Batch, more GPUs | Streaming / TTFT |
| Process 100,000 documents overnight | Interactive Converse | Batch inference |
| Several independent retrievals run sequentially | A bigger model | Parallelize |
| Prompts contain huge context and the model is expensive | Scale the endpoint | Token optimization, better retrieval, smaller models |
| Semantic search misses product codes | Raise temperature | Hybrid search |
| RAG returns irrelevant documents | Blame the FM | Query preprocess + filters + hybrid + rerank |
| Traffic spikes around events | Decode knobs | Capacity planning, utilization, auto scaling |
| Need more deterministic factual answers | More infrastructure | Lower temperature / controlled sampling |

### A five-question loop for stems

1. **Where is the bottleneck?** Retrieval, model, network, application, sequential workflow?
2. **What dimension is failing?** Latency, TTFT, throughput, cost, retrieval relevance?
3. **Can unnecessary work be removed?** Tokens, context, hops, candidate set?
4. **Can work be performed differently?** Streaming, parallel, batch, pre-compute, cache?
5. **Did the change preserve quality?** Benchmark it. A/B test it.

That sequence is most of the reasoning AWS is testing.

---

## AWS service glossary

### Perceived latency

#### Amazon Bedrock streaming (`converse_stream`)

**What it is.** Token-by-token delivery of a completion instead of waiting for the full body.

**Problem it solves.** Blank-screen wait; TTFT, not total generation time.

**Where it sits.** 4.2.1, in front of a human. Pair with WebSocket / SSE in [2.4](/learn/2/fm-api-integrations).

**Typical use.** Research-copilot chat; first sentence appears in ~1s while generation continues.

**Pricing.** Same tokens as a non-streamed call.

**Exam cue.** “Nothing appears for eight seconds.” Not batch. Not PT.

**Do not confuse with.** Batch inference. Latency-optimized inference (a serving mode, not a stream).

#### Latency-optimized inference

**What it is.** A Bedrock request option, where offered, that prioritizes interactive TTFT on supported models.

**Problem it solves.** Lowest practical wait for a human at the desk.

**Where it sits.** 4.2.1 interactive path.

**Typical use.** Opt in on Converse for live Q&A; leave it off for overnight jobs.

**Pricing.** Still tokens; not a substitute for a smaller model.

**Exam cue.** Interactive Bedrock, lowest TTFT, when the feature is offered.

**Do not confuse with.** Provisioned Throughput (capacity). Streaming (how you *display* tokens).

#### Amazon CloudFront

**What it is.** CDN in front of reusable or precomputed GenAI outputs.

**Problem it solves.** Network wait for global users on content that does not need a fresh model call.

**Where it sits.** 4.2.1 pre-computation / edge. Cost framing in [4.1.4](/learn/4/cost-optimization).

**Typical use.** Daily AMD fact sheet generated at 6 a.m., served from edge.

**Pricing.** Requests and transfer.

**Exam cue.** Precomputed, geographically distributed, safe to cache.

**Do not confuse with.** ElastiCache (application cache). Streaming (live tokens).

### Retrieval path

#### Amazon OpenSearch Service

**What it is.** Search engine that can combine keyword, filters, and k-NN vectors.

**Problem it solves.** Retrieval latency and relevance: index tuning, hybrid search, metadata filters.

**Where it sits.** 4.2.2 and 4.2.6. How to *design* the retrieve path is [1.5](/learn/1/retrieval-mechanisms).

**Typical use.** Filter AMD + Q2, hybrid for `MI300X`, rerank a shortlist.

**Pricing.** Domain / collection hours.

**Exam cue.** RAG is slow *or* misses exact product names. Tune the index; do not buy PT.

**Do not confuse with.** Bedrock (generation). X-Ray (the trace, not the search).

#### Amazon Bedrock Knowledge Bases

**What it is.** Managed retrieve (and optionally retrieve-and-generate) over your corpus.

**Problem it solves.** Filters, hybrid (when the backend supports it), and a bounded candidate set without owning the cluster.

**Where it sits.** 4.2.2 when the stem is a managed RAG path.

**Typical use.** `overrideSearchType: HYBRID` plus ticker/date filter.

**Pricing.** Retrieve / embedding / FM tokens.

**Exam cue.** Managed retrieval performance. Hybrid is backend-dependent.

**Do not confuse with.** OpenSearch as the *shelf* you tuned yourself (1.4 / 1.5).

### Throughput and serving

#### Amazon Bedrock Batch Inference

**What it is.** Asynchronous JSONL inference for large offline jobs.

**Problem it solves.** Throughput when nobody is waiting on a token stream.

**Where it sits.** 4.2.3. Cost of the same lever is [4.1.3](/learn/4/cost-optimization).

**Typical use.** 500,000 overnight summaries.

**Pricing.** Batch token rates.

**Exam cue.** Large non-interactive workload. Not a chatbot.

**Do not confuse with.** Streaming. Provisioned Throughput.

#### Amazon SageMaker (throughput / autoscale)

**What it is.** Hosted endpoints and Batch Transform, with scaling on invocations or queue depth.

**Problem it solves.** Token-aware capacity for models you host.

**Where it sits.** 4.2.3 and 4.2.5 when the stem is not Bedrock on-demand.

**Typical use.** Scale the realtime variant after earnings; Batch Transform for the backfill.

**Pricing.** Instance hours.

**Exam cue.** Scale on GenAI metrics, not only CPU. Batch Transform for offline.

**Do not confuse with.** Bedrock Batch Inference. Lambda provisioned concurrency (warms Lambda, not the FM quota).

### Observe the path

#### AWS X-Ray

**What it is.** Distributed tracing across API Gateway, Lambda, OpenSearch, Bedrock.

**Problem it solves.** “The RAG app is slow” becomes a per-hop timeline.

**Where it sits.** 4.2.6 profiling. [4.3](/learn/4/monitoring-systems) is the broader monitor story.

**Typical use.** Subsegments for retrieve vs generate; annotations for k and model_id.

**Pricing.** Traces stored.

**Exam cue.** Identify the bottleneck before changing the model.

**Do not confuse with.** CloudWatch metrics (aggregates). CloudTrail (who called the API).

#### Amazon CloudWatch (performance)

**What it is.** Latency percentiles, token counts, throttles, concurrent invocations.

**Problem it solves.** p95/p99, token bloat after a deploy, utilization for autoscale.

**Where it sits.** 4.2.1 benchmarking and 4.2.5 allocation.

**Typical use.** Alarm on p95 end-to-end; graph input tokens per request after a prompt change.

**Pricing.** Metrics and logs.

**Exam cue.** Tail latency and token volume, not “it feels faster.”

**Do not confuse with.** X-Ray (which hop). Cost Anomaly Detection (the bill).

---

## Practice questions

Pick an answer on every stem. The explanation appears after you choose — later questions stay unspoiled until you answer them.

```practice
Q: A customer-service chatbot takes eight seconds to produce its full answer. Users complain because nothing appears during those eight seconds. First consideration?
A: Increase temperature
B: Response streaming
C: Batch inference
D: Increase retrieved document count
correct: B
feedback: Streaming reduces perceived latency by exposing tokens immediately. Total generation time may stay eight seconds. Batch makes wait worse. More chunks and higher temperature do not paint the screen.

Q: An organization needs to summarize 500,000 documents by tomorrow morning. Users do not need immediate responses. Most appropriate?
A: Streaming inference
B: Batch inference
C: Increase temperature
D: Sequential interactive API calls
correct: B
feedback: Large offline workload. Throughput matters more than TTFT. Streaming is for a human watching. Sequential Converse does not scale this job.

Q: A RAG system often misses exact product names even though semantically related results appear. Technique?
A: Increase maximum output tokens
B: Hybrid search
C: Increase temperature
D: Add more application servers
correct: B
feedback: Hybrid combines semantic retrieval with exact keyword matching. Output length, sampling, and app servers do not find MI300X.

Q: An application performs three independent retrieval operations sequentially. Each takes two seconds. Optimization?
A: Run them concurrently
B: Increase top-p
C: Increase embedding dimensionality
D: Increase output tokens
correct: A
feedback: Independent work can execute in parallel. Decoding knobs and embedding size are not orchestration.

Q: Model prompts suddenly grow from 6,000 to 40,000 tokens after a deployment. Investigate?
A: Retrieval and prompt construction
B: Temperature
C: Auto scaling only
D: Response streaming only
correct: A
feedback: Token bloat is usually over-retrieval, duplicate context, or unbounded history. Scaling copies the waste. Streaming hides it.

Q: Users wait too long before seeing anything, but they are willing to wait for a complete thorough answer. Dimension?
A: Throughput
B: Time to first token / streaming
C: Batch inference
D: Top-k
correct: B
feedback: The complaint is blank-screen wait, not documents per hour and not sampling.

Q: X-Ray shows retrieval p95 of 5 seconds and Bedrock of 700 ms. Next move?
A: Buy Provisioned Throughput
B: Raise temperature
C: Tune metadata filters, hybrid search, k, and the vector index
D: Switch the chat UI to batch inference
correct: C
feedback: Retrieval is the bottleneck. PT and temperature do not accelerate k-NN. Batch is the wrong interaction model.

Q: The desk needs deterministic extraction of AMD revenue into JSON. Someone proposes more GPUs “to stabilize output.” Actual knob?
A: Higher temperature
B: Lower temperature / controlled sampling (and a schema)
C: CloudFront
D: Increase retrieved chunk count
correct: B
feedback: Temperature + top-p + top-k are generation behavior. Infrastructure is not a decoder.

Q: Version A: 92% accurate, 12 s, $0.20/request. Version B: 91% accurate, 3 s, $0.04/request. The quality floor is 90%. Production choice?
A: Always A because quality is highest
B: B — A/B on the full objective, not one metric
C: Average A and B
D: Neither; buy Provisioned Throughput
correct: B
feedback: Optimization evaluates accuracy, latency, and cost together. The floor is already met.

Q: Ten huge 50k-token inferences consume more capacity than 100 small lookups, but autoscale tracks request count. What is wrong?
A: Nothing — one request is one request
B: Scale on GenAI signals (tokens, concurrent invocations, queue depth), not raw request count
C: Disable autoscale and buy PT sized to the daily average
D: Raise top-p
correct: B
feedback: Token volume is the real work. Request count under-counts large prompts. Daily-average PT misses the peak.

Q: Three independent research sources are fetched sequentially, then a single Bedrock call. Users feel the wait before generation even starts. 4.2.1 lever?
A: Parallelize the retrievals
B: Increase maxTokens
C: Use batch inference for the chat turn
D: Add a second OpenSearch domain for the model
correct: A
feedback: Independent retrievals can overlap. maxTokens lengthens generation. Batch and extra search clusters do not fix a sequential graph.

Q: Traffic is quiet overnight and spikes for three hours after NVIDIA reports. Capacity was sized to the daily average. What did 4.2.5 skip?
A: Temperature tuning
B: Peak-aware capacity planning and token-aware auto scaling
C: Hybrid search
D: Top-k
correct: B
feedback: Design for the earnings spike, not the 24-hour mean. Decoding knobs and hybrid search are other skills.
```

---

## Final compressed review

If you remember nothing else:

**Profile first. Optimize the bottleneck.** X-Ray for which hop; CloudWatch for the tail.

**4.2.1** — Streaming improves perceived responsiveness (TTFT). Pre-compute predictable work. Parallelize independent work. Use the fastest model that still meets the bar.

**4.2.2** — Retrieval must be fast *and* relevant. Filters shrink the room. Hybrid = semantic + keyword. Tune the index; rerank a shortlist.

**4.2.3** — Latency ≠ throughput. Shrink tokens. Batch large non-interactive workloads. Bound concurrency so 500 users do not storm the kitchen.

**4.2.4** — Temperature / top-p / top-k are generation behavior, not GPUs. Cap output tokens. A/B the whole objective function.

**4.2.5** — Plan and scale on tokens and concurrency, not request count. A 40k-token prompt after a deploy is a prompt bug, not a missing instance.

**4.2.6** — Measure the complete path. If retrieve is 5s and generate is 2s, do not buy a faster model.

A production GenAI system should be optimized as an **end-to-end pipeline**, not as a foundation model in isolation.
