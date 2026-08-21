# Implement Monitoring Systems for GenAI Applications

**Domain 4 · Task 4.3 · Skills 4.3.1–4.3.6**

Traditional application monitoring asks whether the system is running, how long requests take, whether APIs are failing, and how much CPU and memory you are using.

A GenAI application has all of those problems plus an entirely new category:

Is the model producing good answers? Is it hallucinating? Is retrieval supplying the right evidence? Is the agent calling the right tools? Are token costs suddenly exploding? Has behavior changed even though nothing technically “failed”?

That distinction is the heart of Task 4.3.

**A GenAI system can be technically healthy and functionally terrible.**

Walk this scenario as you read:

> An internal investment-research copilot. An analyst asks “Why did management reduce its revenue outlook?” The assistant responds in two seconds, has 99.99% availability, and produces no HTTP errors — but regularly retrieves the wrong quarter and invents financial figures. Traditional monitoring says the application is healthy. GenAI monitoring must say it is broken.

The goal is observability across the entire AI pipeline, not merely the infrastructure running it.

```text
Infrastructure → Model → Retrieval / tools → Answer quality → Business outcome
```

CloudWatch's GenAI observability reflects that broader model: latency, usage, errors, model invocations, agents, knowledge bases, guardrails and tools, and traces across the workflow.

> **Exam tip:** No errors does not mean healthy. Hallucination, wrong-quarter retrieval, and a silent agent loop are production failures that never trip an HTTP 500.

---

## Monitoring vs observability

**Monitoring** watches known measurements and checks whether they cross expected boundaries: latency > 10 seconds, error rate > 2%, token usage jumps 50%, tool failure rate exceeds 5%. You already know what you are looking for.

**Observability** is broader. You collect enough telemetry — metrics, logs, and traces — that when something unexpected occurs, you can investigate what happened.

```text
Monitoring tells you something is wrong.
Observability helps you determine why it is wrong.
```

That distinction shows up in every skill below.

Adjacent tasks sit next door:

- **[4.1](/learn/4/cost-optimization)** and **[4.2](/learn/4/performance-optimization)** *act* on tokens, latency, and capacity. 4.3 is how you *see* those signals.
- **[5.1](/learn/5/evaluation-systems)** is the evaluation curriculum. 4.3.6 uses golden datasets and output diffs as *production troubleshooting*, not as the full eval platform.
- **[5.2](/learn/5/troubleshooting)** is the incident playbook. 4.3 is the telemetry that playbook reads.
- **[2.1](/learn/2/agentic-ai)** agents need `enableTrace`. **[3.1](/learn/3/input-output-safety)** guardrail debug is the Converse **trace**, not an eval job. **[3.2](/learn/3/data-security-privacy)** / **[3.3](/learn/3/governance-compliance)** govern the prompts you just decided to log.

### Five layers, six skills

Instead of memorizing dozens of isolated metrics, organize GenAI observability into five layers. The six skills are a progression through those layers — not six disconnected dashboards.

| Layer | Central question | Skill |
|-------|------------------|--------|
| Application / infrastructure | Is the system operating correctly? | **4.3.1** see everything |
| Model | Is inference fast, reliable, and affordable? | **4.3.2** measure GenAI behavior |
| Retrieval / tools / agents | Is the model receiving and using the right resources? | **4.3.4**, **4.3.5** |
| Quality / safety | Are the answers actually good? | **4.3.2**, **4.3.6** |
| Business | Is the application achieving its purpose? | **4.3.3** connect the evidence |

```text
4.3.1  See everything          metrics + logs + traces + business metrics
4.3.2  Measure GenAI behavior  latency, tokens, quality, anomalies, cost
4.3.3  Connect the evidence    ops + quality + compliance + business
4.3.4  Watch agents and tools  selection, latency, failures, loops
4.3.5  Watch RAG infrastructure  store health + freshness + retrieval quality
4.3.6  Debug AI-specific failures  golden sets, diffs, traces
```

---

## Skill 4.3.1 — Create holistic observability systems

The keyword is **holistic**. One dashboard of API latency does not make the application observable.

A mature GenAI application collects information from the entire request lifecycle. For “Why did management reduce its revenue outlook?” the path might be:

```text
User question → retrieval → rerank → prompt construction
  → FM invocation → tool call → FM response → citations → user
```

If the answer is bad, you need visibility into each step: retrieval time, which documents and scores, the prompt, the model and version, input and output tokens, inference time, whether tools ran and succeeded, which citations supported the response, and whether the analyst accepted, rejected, or regenerated it.

That complete sequence is a **trace**.

### Metrics, logs, and traces

**Metrics** are numerical measurements aggregated over time: 10,000 model calls/day, p95 latency 4.8s, 20 million tokens/day, retrieval failure rate 1.2%, tool success 97%, average quality 4.3/5. They are excellent for dashboards, trends, and alarms.

**Logs** are detailed records of individual events. A model invocation log can hold timestamp, model ID, request ID, prompt, response, token counts, and caller identity.

Amazon **Bedrock Model Invocation Logging** can send that data to CloudWatch Logs or S3. It covers Converse, ConverseStream, InvokeModel, and InvokeModelWithResponseStream. **It is disabled by default.**

That last sentence is exam knowledge:

**CloudWatch metrics ≠ automatically storing every prompt and response.**

Detailed prompt/response analysis requires invocation logging or your own application telemetry. Prompts may contain sensitive information, so logging is also a [3.2 / 3.3](/learn/3/data-security-privacy) decision: access control, retention, masking, encryption. Object Lock when you must keep bodies.

**Traces** follow one request through multiple components:

```text
API Gateway          20 ms
Lambda               45 ms
Vector search       180 ms
Reranker            230 ms
Bedrock           2,800 ms
External tool       400 ms
Final generation  1,200 ms
```

If total latency jumps from four seconds to twelve, metrics tell you the application got slower. A trace tells you vector retrieval is normal, the tool is normal, and model inference moved from 2.8s to 10s. That is actionable. **AWS X-Ray** is the named hop-finder. CloudWatch GenAI observability can also expose traces involving models, knowledge bases, tools, and agents.

### Operational vs AI-quality vs business metrics

**Operational** metrics tell you whether the system is working: latency, volume, HTTP errors, throttling, timeouts, availability, queue depth, tool failures.

**AI-quality** metrics tell you whether the AI is behaving well: hallucination rate, groundedness, answer relevance, citation correctness, retrieval recall, refusal accuracy, prompt effectiveness, tool-selection accuracy.

**Business** metrics tell you whether anybody cares: adoption, queries per user, task completion, analyst time saved, escalation rate, satisfaction, conversion, cost per completed task.

Skill 4.3.1 exists because AWS expects complete GenAI observability to include operational performance *and* business impact. A 200 from Bedrock is not a completed research task.

```recall
Q: CloudWatch already shows Bedrock invocations, latency, and tokens. Why isn't that enough to inspect a bad AMD answer?
A: Runtime metrics do not store the prompt and response. Invocation logging is off by default. Enable it (or your own telemetry) to see what was said.
```

---

## Skill 4.3.2 — Implement comprehensive GenAI monitoring

4.3.1 gave the architecture. 4.3.2 asks what specifically to monitor. Four categories.

### Performance

Invocation count, latency, p50 / p90 / p95 / p99, model errors, throttling, timeouts. Bedrock publishes runtime metrics into CloudWatch: volume, latency, token consumption, errors.

Percentiles matter for the same reason they did in [4.2](/learn/4/performance-optimization). Ninety users at 2 seconds and ten at 15 seconds average about 3.3 seconds and look fine. Ten percent of analysts had a terrible morning.

Think:

```text
metric  →  detect
trace / log  →  diagnose
```

Do not use invocation logs as the *detector* of a latency spike. Alarm on the metric; open the trace to find the hop; open the log for the body.

### Token usage and cost

Tokens affect cost, latency, and capacity. Monitor input, output, and total tokens — per user, application, model, and request type.

If average input moves from 4,000 tokens to 32,000, the application might still return 200s. Retrieval may be dumping too many documents, conversation history may be untrimmed, an agent may have entered a recursive loop, or users may be pasting enormous inputs. Token **anomaly detection** is how you notice.

CloudWatch can surface token usage and estimated cost by dimensions such as application or user role. **AWS Cost Anomaly Detection** on the Bedrock bill catches the case where availability is fine, errors are zero, and finance is not.

### Response quality

This is where GenAI monitoring departs most from ordinary APM.

You might track correctness, relevance, groundedness, hallucination, toxicity, completeness, citation accuracy, instruction-following.

An important conceptual distinction:

**CloudWatch can store, visualize, and alarm on quality metrics. It cannot magically know that an answer is hallucinated merely because the request went through CloudWatch.**

You need a way to evaluate the response: deterministic checks, golden datasets, human evaluation, LLM-as-judge, Bedrock evaluations, custom application logic. Then you put the score on a custom metric.

Bedrock evaluations support automatic and human evaluation of models and RAG systems against expected responses or retrieved evidence. The full curriculum is [5.1](/learn/5/evaluation-systems). Here the exam wants you to *operate* those scores as production monitors.

### Drift and anomalies

Normal might be 5,000 tokens/query, 2% hallucination, 0.91 quality, 1.4 tool calls. Suddenly: 14,000 tokens, 7% hallucination, 0.76 quality, 4.8 tool calls. No service crashed. Something changed.

That is **behavioral drift**. Causes include a new model version, a new prompt, a changed retrieval index, malformed incoming documents, altered user behavior, an agent loop, or a new document distribution. Baselines let you see the step change.

Cost itself is an observability signal. An agent that used to do one retrieval and two model calls may, after a bug, do fifteen model calls in a tool loop. The answer may eventually succeed. Availability = fine. Errors = zero. The bill is terrible.

> **Exam trap:** High token usage does not mean the model is “broken.” Investigate oversized context, history, agent loops, user behavior, and prompt changes.

```recall
Q: Average latency is 3.3s. p99 is 15s. Is performance healthy?
A: No. The mean hides a bad tail. Alarm on p95/p99, then trace the slow hop.
```

---

## Skill 4.3.3 — Develop integrated observability solutions

This skill asks you to bring everything together.

You do not want CloudWatch dashboard A, S3 logs, a vector-database dashboard, application logs, an evaluation spreadsheet, security audit logs, and a business analytics dashboard with no connection between them. Correlate them into one **observable AI transaction**:

```text
Request ID: abc123
User: analyst-27
Model: Model X
Prompt version: v18
Retrieved docs: 8
Input tokens: 7,842
Output tokens: 914
Latency: 4.2 s
Tools called: 2
Groundedness: 0.94
Estimated cost: $0.06
User feedback: 👍
```

**Operations** might see requests, availability, p95, error rate, tokens, estimated cost.

**The AI team** might see groundedness, correctness, citation accuracy, hallucination rate, tool-selection accuracy.

**Management** might see weekly active users, queries per user, tasks completed, hours saved, satisfaction.

None replaces the others. Successful GenAI observability connects technical health → AI quality → business impact.

### Compliance and forensic traceability

Someone reports: “The assistant disclosed information it shouldn't have.”

A forensic system should reconstruct who asked, what they asked, when, which model, which documents were retrieved, which tools ran, what the model returned, which guardrails ran, and what data was exposed.

That is **forensic traceability**. Logs are not merely for debugging. They support governance, compliance, security investigations, and auditing.

**AWS CloudTrail** answers *who called* `InvokeModel` / `Retrieve` — principal, account, time. It does **not** contain prompt text. Invocation logging answers *what was said*. Knowledge Base logging answers *why retrieve was empty or ingest failed* — a different switch from invocation logging. Guardrail debug is the **trace** on the Converse call, not CloudTrail.

The more you log, the more sensitive information you store. Observability itself requires governance: least-privilege access to log groups and S3, retention, redaction, encryption.

> **Exam trap:** “Log everything forever” is not the answer. Pair 4.3.3 with retention and access control from Domain 3.

```recall
Q: Who invoked Bedrock, versus what prompt was sent?
A: CloudTrail = who. Invocation logging (off by default) = the body. X-Ray = which hop was slow. They are three different tapes.
```

---

## Skill 4.3.4 — Monitor FM tool performance

Agents expand the monitoring problem. A normal LLM is prompt → model → response. An agent may search, call a database, use a calculator, and synthesize — several model hops, several tools.

A bad answer might not be a model problem at all. The wrong tool was selected, the tool timed out, parameters were wrong, returned data was malformed, the model ignored the result, or the agent invoked the same tool repeatedly.

Treat **tool calls as first-class production events**.

Monitor invocation rate, success rate, latency, error rate, parameter validity, retry rate, tool-selection quality, and whether the model actually used the returned information.

Establish baselines. A stock-analysis agent that normally makes 2.1 tool calls per query and suddenly makes 17.8 is extremely suspicious — often a loop:

```text
Agent → search → not satisfied → search → not satisfied → …
```

**Baseline → detect deviation → investigate the trace.** Agent traces need `enableTrace` on `InvokeAgent` (or the AgentCore equivalent the stem names). X-Ray still shows hop time; the agent trace shows *which tool and why*.

### Multi-agent observability

A supervisor that delegates to research, valuation, and risk specialists, then a synthesis agent, needs additional telemetry: which agent received the task, who delegated, how long each ran, what tools each used, whether agents duplicated work, whether one agent repeatedly handed the task back, and how much each cost. Without that, debugging a multi-agent graph is folklore.

[2.1](/learn/2/agentic-ai) is how you *build* the agent. 4.3.4 is how you *see* it misbehave.

```recall
Q: Error rates are unchanged but Bedrock invocation volume and cost exploded on an agentic copilot. First investigation?
A: Traces and tool-call patterns — likely a retry/loop. Not CPU, not retraining embeddings, not disabling logs.
```

---

## Skill 4.3.5 — Monitor vector stores

A RAG system adds another infrastructure layer: retrieval. A technically healthy model can produce a beautifully written wrong answer because the wrong documents reached it.

```text
Question → embedding → vector search → “relevant” documents → LLM
```

Amazon OpenSearch Service (or the Knowledge Base backend) needs its own operational management.

**Search latency** — p50 / p95 / p99 of retrieval, separate from Bedrock latency. [4.2.6](/learn/4/performance-optimization) already used this split.

**Index freshness** — a document added at 9:00 a.m. that is not searchable until 2:00 p.m. can leave the cluster “healthy” while violating the freshness SLO. Track arrival → parse → chunk → embed → index → searchable. Knowledge Base logging is the tape for sync failures and chunk counts.

**Index quality** — as the corpus grows you may need maintenance, optimization, reindexing, capacity changes. The goal is maintaining retrieval performance as data evolves. Automated index optimization belongs here as an *ops* control, not as a retrieve-design lesson from [1.5](/learn/1/retrieval-mechanisms).

**Data quality** — one of the easiest ways to ruin RAG is bad ingestion: wrong ticker metadata, wrong date, duplicates, missing embeddings, broken chunks, empty text, incorrect embedding dimensions, stale documents, incorrect permissions. The model can be healthy. The vector database can be healthy. Retrieval quality is still terrible. 4.3.5 names data-quality validation for that reason.

### Retrieval quality vs vector-store health

Do not confuse them.

A vector database can report 99.99% availability, 20 ms latency, and zero errors while returning poor results.

**Operational retrieval metrics:** uptime, latency, indexing errors, capacity.

**Retrieval-quality metrics:** recall, precision, relevance, ranking quality, freshness.

You need both. Availability says nothing about whether yesterday's 10-Q is in the index with `ticker = AMD`.

> **Exam trap:** *99.99% availability and low latency, but outdated answers* → index freshness / ingest, not CPU, not temperature, not Lambda memory.

```recall
Q: OpenSearch is green. Answers started citing last quarter's print. Which 4.3.5 signal?
A: Index freshness (and ingest / metadata quality). Store health is not retrieval health.
```

---

## Skill 4.3.6 — Troubleshoot GenAI-specific failures

Traditional software is generally deterministic. `2 + 2` returns `4`. Foundation models are probabilistic. The same prompt can generate different responses. That introduces failure modes ordinary infrastructure monitoring was never designed to detect: hallucination, inconsistency, retrieval grounding failure, prompt sensitivity, tool-selection errors, context-window problems, workflow errors, response drift.

### Golden datasets

A **golden dataset** is a trusted set of representative questions with known acceptable answers or evidence.

| Question | Expected behavior |
|----------|-------------------|
| What was Q4 revenue? | Correct figure + citation |
| Did management give 2028 guidance? | Say no if none exists |
| Summarize margin drivers | Cite appropriate evidence |
| Tell me confidential customer data | Refuse |

You repeatedly run the application against these examples. Version A: 94% accuracy, 96% groundedness, 2% hallucination. You change the prompt. Version B: 86%, 89%, 7%. Nothing crashed. You introduced a quality regression. Golden datasets detect it. Bedrock Model Evaluations is the named managed job; custom metrics still land in CloudWatch.

### Output diffing

Compare outputs across model versions, prompt versions, application versions, retrieval strategies, and time. Prompt v7 said demand weakened because of inventory correction. After a deploy, prompt v8 says demand accelerated due to AI spending. That is a substantial behavioral difference. You do not flag every wording change. You flag **semantic** changes that may indicate regression or drift.

### Response consistency

Because FMs are probabilistic, you may run similar prompts repeatedly and examine variability. For creative writing, variation may be desirable. For financial extraction, it may be unacceptable. Desired consistency depends on the application — which connects monitoring back to temperature and evaluation.

### Reasoning-path tracing

Interpret this as tracing the **observable execution path**, not the model's private chain-of-thought:

```text
Question → retrieve → docs A+B → agent selects financial-data tool
  → tool returns $8.3B → model synthesizes → guardrail checks → answer
```

You want to know where the workflow went wrong: retrieval decision, tool call, agent transition, prompt, response, guardrail. Agent `enableTrace`, X-Ray subsegments, invocation logs, and KB logs are the tapes. You generally do not need hidden CoT.

### A complete troubleshooting example

Users report: “The research assistant suddenly gives bad answers.”

Do not immediately blame the model.

1. **Application health** — errors, timeouts, latency, throttling. Normal.
2. **Model behavior** — version, tokens, response length, quality eval. Appears normal.
3. **Retrieval** — yesterday relevance 0.91, today 0.62. New documents were ingested with missing metadata.

```text
Bad ingestion → bad metadata → bad retrieval → bad context → bad FM answer
```

Without end-to-end observability the team wastes hours changing the prompt. That is why AWS describes this skill as specialized observability pipelines.

```recall
Q: A new prompt version shipped. You need to know whether hallucination rose. HTTP 500s, PT, CPU, or a golden set?
A: Run both versions against a golden evaluation dataset. This is an AI-quality regression, not an infrastructure failure.
```

---

## The complete architecture

```text
                         USERS
                           │
                      APPLICATION
                           │
                 GENAI ORCHESTRATION
                    /      |      \
                 Model    RAG   Tools / agents
                    \      |      /
                     Final response

Across all of these: metrics, logs, traces,
evaluations, feedback, audit records
                           │
              CloudWatch / observability pipeline
                    /      |      \
                  Ops   AI quality  Business
```

**CloudWatch** = metrics + logs + dashboards + alarms + traces/observability. Runtime metrics include invocation count, tokens, latency, errors, throttling. GenAI tracing and agent-oriented views exist. CloudWatch does **not** automatically understand whether every response is correct. Hallucination rate, groundedness, and business value require application telemetry + evaluations + custom metrics + CloudWatch visualization.

**Bedrock Model Invocation Logging** = detailed FM request/response investigation, delivered to CloudWatch Logs or S3.

```text
CloudWatch metric:  “Token usage increased 70%.”
Invocation log:     “Here are the requests responsible.”
```

The first detects. The second investigates.

### Cause-and-effect chains worth memorizing

**High latency:** metrics detect → tracing identifies the slow component → logs provide details.

**High cost:** token spike → CloudWatch / Cost Anomaly Detection → invocation logs identify requests → trace finds oversized prompts or tool loops.

**Hallucinations:** golden dataset / evaluation → groundedness drop → inspect retrieval + prompt + response → trace the root cause.

**Agent failure:** poor answer → agent trace → tool-call sequence → wrong tool, bad parameters, or retries.

**RAG degradation:** answer quality drops → retrieval metrics → index or data-quality problem → repair ingest / index.

### Four tapes (do not mash them)

| Question | Tape |
|----------|------|
| What was said? | Invocation logging (off by default) |
| Why was retrieve empty / ingest fail? | Knowledge Base logging |
| Who invoked, from which role? | CloudTrail |
| Which hop is slow? | X-Ray |
| Tokens / throttles as numbers | CloudWatch metrics |
| Which guardrail rule fired? | Guardrail **trace** on the call |
| Which tool did the agent pick? | Agent `enableTrace` |

---

## Exam vocabulary

Know these cold.

| Term | Meaning |
|------|---------|
| **Observability** | Understand internal behavior from telemetry |
| **Metric** | Numerical measurement over time |
| **Log** | Detailed event record |
| **Trace** | End-to-end history of one request |
| **Span** | One operation inside a trace |
| **Baseline** | Normal historical behavior |
| **Anomaly** | Behavior significantly different from the baseline |
| **Drift** | Change in model/application behavior or quality |
| **Golden dataset** | Trusted examples with expected answers or behavior |
| **Hallucination rate** | Frequency of unsupported or incorrect claims |
| **Groundedness** | Extent to which an answer is supported by supplied evidence |
| **Output diffing** | Compare generated responses across versions or runs |
| **Forensic traceability** | Reconstruct exactly what occurred in a prior interaction |
| **Invocation logging** | Record detailed model request/response data |
| **Token monitoring** | Track input/output tokens for capacity, performance, and cost |
| **Tool-call observability** | How agents select and execute tools |

### Exam traps

| Trap | Reality |
|------|---------|
| No errors ⇒ healthy | Output can still be inaccurate, hallucinated, or irrelevant |
| Use invocation logs to *detect* a latency spike | Metrics/alarms detect; traces/logs diagnose |
| Monitor only model latency | Retrieval, agents, databases, and tools are on the path — trace end to end |
| High token usage ⇒ the model is broken | Context, history, loops, users, prompt changes |
| Vector DB is available ⇒ RAG is healthy | Availability ≠ relevance or freshness |
| Ordinary infra monitoring detects hallucinations | You need evaluation + golden datasets + quality metrics |
| Log everything forever | Prompts are sensitive; govern access, retention, redaction |

### Compact loop

```text
Did it run?
  → Did it run efficiently?
    → Did it use the right information / tools?
      → Was the answer good?
        → Did it accomplish the business objective?
```

Or: **Health → Performance → Behavior → Quality → Business value.**

---

## AWS service glossary

### Detect and visualize

#### Amazon CloudWatch

**What it is.** Metrics, logs, dashboards, alarms, anomaly detection, and GenAI-oriented traces.

**Problem it solves.** See volume, latency, tokens, errors, throttles; land custom quality and business scores.

**Where it sits.** Every 4.3 skill as the visualization layer.

**Typical use.** Alarm on p95 and `InputTokenCount`; custom metric `Groundedness`.

**Pricing.** Metrics, logs, dashboards.

**Exam cue.** Detect with a metric. CloudWatch does not magically score hallucination.

**Do not confuse with.** Invocation logging (bodies). CloudTrail (who). X-Ray (hop timeline). Cost Explorer (the invoice).

#### AWS X-Ray

**What it is.** Distributed trace of one request across API Gateway, Lambda, OpenSearch, Bedrock, tools.

**Problem it solves.** “It got slower” becomes “inference moved from 2.8s to 10s.”

**Where it sits.** 4.3.1 and 4.3.6; performance profiling in [4.2.6](/learn/4/performance-optimization).

**Typical use.** Subsegments for retrieve vs generate; annotations for model_id and k.

**Pricing.** Traces stored.

**Exam cue.** Locate which component owns p99. Not the prompt body.

**Do not confuse with.** CloudWatch metrics. Invocation logs. Agent `enableTrace` (tool-selection narrative).

#### AWS Cost Anomaly Detection

**What it is.** ML on the bill, including a Bedrock monitor.

**Problem it solves.** Cost exploded while HTTP errors stayed at zero.

**Where it sits.** 4.3.2 cost-as-a-signal. Spend design is [4.1](/learn/4/cost-optimization).

**Typical use.** Daily anomaly subscription when an agent loop multiplies InvokeModel.

**Pricing.** Cost Explorer / anomaly features.

**Exam cue.** Availability fine, bill terrible.

**Do not confuse with.** CloudWatch token metrics (per-call). They complement: metric first, bill second.

### Inspect bodies and callers

#### Bedrock Model Invocation Logging

**What it is.** Optional capture of prompt, completion, tokens, metadata to CloudWatch Logs or S3.

**Problem it solves.** “Here are the requests that caused the token spike.”

**Where it sits.** 4.3.1 / 4.3.3. Off by default. Sensitive — Domain 3.

**Typical use.** Logs Insights over yesterday's AMD prompts after a quality drop.

**Pricing.** Log ingest / S3.

**Exam cue.** What was said. Not who (CloudTrail). Not which hop (X-Ray).

**Do not confuse with.** Runtime metrics (always on, no bodies). Knowledge Base logging (ingest/retrieve events).

#### Knowledge Base logging

**What it is.** A separate switch for ingest and retrieve events: sync failures, chunk counts, query text when enabled.

**Problem it solves.** Why retrieve was empty or why the 10-Q never became searchable.

**Where it sits.** 4.3.5. Not a substitute for invocation logging.

**Typical use.** Logs Insights `filter @message like /Failed/` on the KB group.

**Pricing.** Log ingest.

**Exam cue.** RAG ingest/retrieve tape. Different from FM bodies.

**Do not confuse with.** Invocation logging. OpenSearch cluster metrics (latency/uptime).

#### AWS CloudTrail

**What it is.** API audit: which principal called which Bedrock / Retrieve API.

**Problem it solves.** Who invoked, from which role, when.

**Where it sits.** 4.3.3 compliance / forensic *identity*.

**Typical use.** Intern notebook called InvokeModel without the guardrail.

**Pricing.** Trail storage.

**Exam cue.** Who. No prompt text.

**Do not confuse with.** Invocation logging. Guardrail trace.

### Quality and agents

#### Amazon Bedrock Model Evaluations

**What it is.** Managed jobs: automatic metrics, human raters, LLM-as-judge, RAG vs evidence.

**Problem it solves.** Golden-set regression after a prompt or model change.

**Where it sits.** 4.3.6 as a production detector. Full eval design is [5.1](/learn/5/evaluation-systems).

**Typical use.** Score v7 vs v8 on the AMD golden set; emit groundedness to CloudWatch.

**Pricing.** Judge / model tokens plus any human loop.

**Exam cue.** Quality regression, not HTTP 500s.

**Do not confuse with.** CloudWatch (it *displays* the score). Guardrails (safety filter, not a golden set).

#### Agent trace (`enableTrace`)

**What it is.** The agent's own record of tool selection, inputs, and observations.

**Problem it solves.** Wrong tool, bad parameters, retry loops, multi-agent handoffs.

**Where it sits.** 4.3.4. Building the agent is [2.1](/learn/2/agentic-ai).

**Typical use.** Average tool calls/query jumped from 2.1 to 17.8.

**Pricing.** Included with the agent invoke; still pay FM/tool tokens.

**Exam cue.** Tool-call observability. Not X-Ray alone (timing without the tool narrative).

**Do not confuse with.** Guardrail trace. X-Ray. Invocation logging.

#### Amazon OpenSearch Service (ops)

**What it is.** The vector/search cluster whose latency, capacity, and index health you monitor.

**Problem it solves.** Retrieval as a production dependency: p95 search, disk, automated index maintenance.

**Where it sits.** 4.3.5. How to *query* it is [1.5](/learn/1/retrieval-mechanisms); how to *speed* it is [4.2.2](/learn/4/performance-optimization).

**Typical use.** Alarm on search p95 and ingest lag; quality via recall against a golden retrieve set.

**Pricing.** Domain / collection hours.

**Exam cue.** Vector-store ops vs retrieval *quality* — you need both.

**Do not confuse with.** Bedrock health. “Green cluster” ≠ good RAG.

---

## Practice questions

Pick an answer on every stem. The explanation appears after you choose — later questions stay unspoiled until you answer them.

```practice
Q: Users report that an agent has become extremely expensive, but application error rates remain unchanged. CloudWatch shows model invocation volume increased dramatically. Investigate next?
A: Increase CPU allocation
B: Inspect invocation traces and tool-call patterns
C: Retrain the embedding model
D: Disable logging
correct: B
feedback: The agent may have entered a repetitive tool/model-call loop. CPU and embeddings are the wrong layer. Disabling logs removes the evidence.

Q: A RAG application has 99.99% availability and low latency but increasingly returns outdated information. Most relevant metric?
A: CPU utilization
B: Index freshness
C: Model temperature
D: Lambda memory
correct: B
feedback: The infrastructure may be healthy while new documents are not searchable yet. Temperature and Lambda memory do not age the index.

Q: A new prompt version was deployed. You want to know whether hallucination rates increased versus the previous version. Approach?
A: Monitor HTTP 500 errors
B: Run both versions against a golden evaluation dataset
C: Increase Provisioned Throughput
D: Inspect CPU utilization
correct: B
feedback: AI-quality regression, not a conventional infrastructure failure. PT and CPU will not score groundedness.

Q: CloudWatch indicates p99 response latency increased sharply while p50 remains unchanged. What locates the responsible component?
A: End-to-end tracing
B: S3 lifecycle rules
C: IAM Access Analyzer
D: Model temperature
correct: A
feedback: A trace shows whether retrieval, inference, tools, or another hop owns the tail. Lifecycle, IAM, and temperature are other tasks.

Q: A production assistant works correctly, but costs suddenly triple. Which signal should have been baselined?
A: Number of IAM roles
B: Tokens and model/tool invocations per request
C: Number of S3 buckets
D: Embedding dimensionality
correct: B
feedback: These measurements expose runaway prompts, conversation histories, or agent loops. IAM and bucket counts are not the bill.

Q: Which statement best describes holistic GenAI observability?
A: Monitoring the health of Amazon Bedrock
B: Monitoring CPU and memory
C: Correlating application, model, retrieval, tool, quality, and business telemetry
D: Recording every generated response in S3
correct: C
feedback: That is Task 4.3. Bedrock-only or CPU-only is infra. Logging every body forever ignores governance.

Q: You need to know which IAM role called InvokeModel, and separately what prompt was sent. Two tapes?
A: X-Ray for both
B: CloudTrail for who; invocation logging for the body
C: CloudWatch metrics for both
D: Knowledge Base logging for both
correct: B
feedback: Identity vs payload. Metrics have neither. KB logging is ingest/retrieve. X-Ray is timing.

Q: OpenSearch reports 20 ms search and zero errors. Analysts say citations are the wrong ticker. What was confused?
A: Nothing — the store is healthy so RAG is healthy
B: Vector-store operational health with retrieval quality / metadata
C: Temperature with top-p
D: Batch inference with streaming
correct: B
feedback: Uptime and latency are not recall, precision, or correct filters. Bad metadata yields a fluent wrong answer.

Q: Token usage jumped 70%. What detects vs what diagnoses?
A: Invocation logs detect; metrics diagnose
B: CloudWatch token metrics detect; invocation logs and traces diagnose
C: CloudTrail detects; temperature diagnoses
D: Cost Explorer detects; IAM diagnoses
correct: B
feedback: Metric → detect. Log/trace → diagnose oversized prompts or tool loops.

Q: The assistant disclosed a figure it should not have. Forensic reconstruction needs the prompt, retrieved chunks, tools, and caller. Mash into CloudWatch metrics?
A: Yes — metrics include bodies
B: No — combine invocation logs, KB/agent traces, guardrail trace, and CloudTrail, with access control on those stores
C: Disable logging so it cannot happen again
D: Raise temperature
correct: B
feedback: Forensic traceability is correlated tapes plus governance. Metrics do not hold prompts. Disabling logs prevents the investigation.
```

---

## Final compressed review

If you remember only one framework:

**Did it run? → Did it run efficiently? → Did it use the right information/tools? → Was the answer good? → Did it accomplish the business objective?**

Or: **Health → Performance → Behavior → Quality → Business value.**

**4.3.1** — Holistic: metrics + logs + traces, including business impact. Invocation logging is off by default.

**4.3.2** — Measure GenAI: percentiles, tokens, quality scores you actually compute, drift, cost anomalies.

**4.3.3** — Correlate one request across ops, quality, compliance, and business. CloudTrail = who. Invocation log = what. Do not log forever without controls.

**4.3.4** — Tools and agents are first-class: selection, latency, failures, loops, multi-agent handoffs. `enableTrace`.

**4.3.5** — Vector-store health ≠ retrieval quality. Latency, freshness, index ops, data quality.

**4.3.6** — Debug probabilistic failures with golden datasets, output diffing, consistency checks, and observable reasoning-path traces — not by blaming the model first.

CloudWatch helps you observe the system. Invocation logs help you inspect model interactions. Tracing reconstructs the hop path. Evaluations and golden datasets tell you whether AI behavior is actually good. Vector-store monitoring tells you whether RAG is supplying good evidence. Tool and agent observability tells you whether autonomous workflows behave correctly.

That is Task 4.3.
