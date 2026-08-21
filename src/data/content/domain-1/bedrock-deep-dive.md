# Deep Dive: Amazon Bedrock

**Domain 1 · Task 1.7 (supplement) · Skill 1.7.1**

This is **not** an official AIP-C01 task. Official work already split Bedrock across 1.2 (pick and run a model), 1.3 (format the request), 1.4–1.5 (stores and retrieve), 1.6 (prompts and Guardrails), and 2.1 (agents and tools). Use this page when you need the **platform map**: what Bedrock actually is, which API you call, and which capacity SKU you are buying.

The desk still asks “What did AMD say about data-center outlook?” Bedrock is the managed API layer that hosts the FM. There is no EC2 to SSH, no container you patch. You authenticate with **IAM**, send a body, pay for tokens (or committed capacity), and optionally wrap Guardrails, a Knowledge Base, or an Agent around that call.

```text
Your app (Lambda / ECS / laptop)
        ↓ HTTPS + IAM
Bedrock API endpoint
        ↓
Auth → model router → Guardrails (if attached) → FM
        ↓
Response (+ async invocation logs if you opted in)
```

The **model router** sends `anthropic.claude-…` to Anthropic-hosted capacity in that Region. On-demand is **shared**. Provisioned Throughput is **yours**. That is why latency and price change with the SKU, not with “trying harder.”

> **Exam tip:** Bedrock is a managed API, not infrastructure in your account. If the stem wants GPUs you operate, that is SageMaker / JumpStart, not this page.

---

## What “managed” actually means

**No servers in the account.** You cannot tune the host, install a driver, or read hypervisor metrics. Operations collapse to IAM, quotas, CloudWatch on *your* calls, and CloudTrail on who invoked.

**Pay-per-token (on-demand)** scales with usage. Variable blotter traffic fits. Unwatched token burn does not.

**One API, many providers.** Claude, Llama, Titan, Nova, Cohere — change `modelId` (and, if you used InvokeModel, the native JSON). Not every model exists in every Region. Check the catalog for the Region the filings must stay in.

**Cross-Region inference (CRI)** can overflow capacity inside a **geographic** boundary (US stays US, EU stays EU). It is a capacity SKU, not a “smarter model.” Data-residency stems still want the right geography.

Every call needs IAM. There is **no Bedrock API key**. Minimum is `bedrock:InvokeModel` (and `InvokeModelWithResponseStream` if you stream) on the model ARN. SCPs and permission boundaries apply like any other AWS API.

```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
  "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-*"
}
```

---

## Which API you actually call

Three invocation shapes. Pick from the **job**, not from habit.

### InvokeModel — complete body, model-native JSON

Synchronous: wait until every token is done, then return. The **body is provider-specific**. Anthropic is not Titan. Switching models means switching JSON unless you wrap it.

Use when the consumer is **code** (classify, extract, short complete), or when you need a knob Converse does not expose (`additionalModelRequestFields` / native fields).

Bad fit: a chatbot that sits on a spinner for 20 seconds.

### InvokeModelWithResponseStream — same body, tokens as they land

First tokens in hundreds of milliseconds. Interactive UIs expect this. Same native JSON as InvokeModel. You iterate an event stream, not a single `body.read()`.

“Improve perceived latency” / chatbot / writing assistant → **stream**.

### Converse / ConverseStream — unified envelope

`system`, `messages[]` (role + content blocks), `inferenceConfig` (`maxTokens`, `temperature`, `topP`, `stopSequences`). Tool calling uses one `toolConfig` schema. Change `modelId` without rewriting the envelope. Model-specific extras still go in `additionalModelRequestFields`.

Converse standardizes the **request shape**. It does not give the model a hidden session (you still resend history) and it does not erase provider limits.

**ApplyGuardrail** evaluates content against a Guardrail **without** invoking an FM — pre-screen input (save tokens if you will block anyway), or check text that did not come from Bedrock.

```text
Short backend job, native knobs     → InvokeModel
User watching tokens appear         → *Stream
Portable chat + tools               → Converse / ConverseStream
Check policy, skip the model        → ApplyGuardrail
```

```quickcheck
Q: Interactive blotter UI; users hate a blank spinner. Which API family?
A: InvokeModel (wait for the full body)
B: InvokeModelWithResponseStream or ConverseStream
C: StartIngestionJob
D: Glue DQDL
correct: B
feedback: Perceived latency is streaming. Sync InvokeModel hides all tokens until the end. Ingest and DQDL are other tasks.
```

---

## Capacity and cost knobs (not “which model is smartest”)

Model **choice** is 1.2.1. These are how the **call runs**:

| Knob | When |
|------|------|
| **On-demand** | Spiky / unknown traffic. Shared capacity. Pay tokens. |
| **CRI / inference profile** | Same model, overflow across Regions in-geo when throttled. |
| **Provisioned Throughput** | Steady, committed, latency SLA. Custom imported models **require** this — no on-demand. |
| **Batch inference** | Offline bulk (tens of thousands of notes). ~50% vs on-demand. Hours of delay are OK. |
| **Prompt caching** | Long **stable** prefix (system + tools + evidence boilerplate) + changing question. Up to ~90% on the cached prefix. Not an answer cache. Put variable user text **last**. |

**Cascading** is routing: Haiku classifies “simple vs hard,” then Haiku / Sonnet / Opus. Most blotter lookups do not need Opus. 60× input-price gaps are real; match capability to the **task**, not the brand.

```fillin
Custom Model Import deploys a model you trained elsewhere onto Bedrock serving — and it requires {{Provisioned Throughput}}, not on-demand.
```

---

## Platform products (pointers, not second copies of 1.4–2.1)

**Knowledge Bases** — managed RAG: parse, chunk, embed, store, retrieve. `Retrieve` returns chunks (you own the prompt). `RetrieveAndGenerate` returns an answer with citations where the KB type supports it. Store *choice* is 1.4. Query recipe is 1.5.

**Agents** — managed ReAct loop, action groups (OpenAPI + Lambda), optional KB + Guardrail, `sessionId` for turns, `enableTrace` to see tool choice. Building the agent system is 2.1.

**Guardrails** — content filters, denied topics, word filters, PII block/anonymize, prompt-attack checks. Attach on invoke / Converse / Agent / Flow, or call **ApplyGuardrail** alone. Instructions are not a substitute (1.6).

**Prompt Management / Flows** — versioned templates and GenAI graphs (1.6). Flows have aliases; prompt versions do not.

**Custom Model Import** — Hugging Face / GGUF / SafeTensors on S3 → import job → **PT only**. Use when the weights already exist outside Bedrock. Bedrock fine-tune is when you want AWS to train.

---

## When to use which

| Stem | Pick |
|------|------|
| Managed FM access, no cluster | **Bedrock** |
| Chatbot / perceived latency | **Streaming** APIs |
| Switch models / standard tools | **Converse** |
| Native Anthropic vs Titan JSON | **InvokeModel** |
| Filter without spending FM tokens | **ApplyGuardrail** |
| 50k overnight summaries | **Batch** |
| Repeated 8k system prompt | **Prompt caching** |
| Steady SLA / imported custom model | **Provisioned Throughput** |
| Throttle in-Region, stay in-geo | **CRI** |
| Bring a GGUF you already trained | **Custom import + PT** |

---

## AWS service glossary

### GenAI / AI

#### Amazon Bedrock (platform)

**What it is.** Managed API to FMs in AWS. No model hosts in your VPC.

**Problem it solves.** Invoke Claude / Llama / Titan / Nova with IAM, quotas, and optional Guardrails / KB / Agents.

**Where it sits.** Under almost every official Domain 1–2 task.

**Typical use.** `converse` from a Lambda with an inference profile.

**Pricing.** Tokens, PT, batch, cache reads — SKU-dependent.

**Exam cue.** Managed FM access. Not SageMaker hosting.

**Do not confuse with.** JumpStart / DJL (you operate serving).

#### InvokeModel / Converse

**What it is.** Raw native JSON vs unified chat envelope (+ stream twins).

**Problem it solves.** Backend complete vs portable messages and tools.

**Where it sits.** Every inference call.

**Typical use.** Converse for the blotter; InvokeModel for Titan-specific bodies.

**Pricing.** Same model tokens either way.

**Exam cue.** Model-agnostic → Converse. Native knobs → InvokeModel. UX wait → stream.

**Do not confuse with.** A hidden session. CRI (capacity).

#### ApplyGuardrail

**What it is.** Guardrail evaluation API without model invocation.

**Problem it solves.** Cheap policy check before you spend tokens.

**Where it sits.** Beside Converse `guardrailConfig`.

**Typical use.** Reject PII-laden paste, then skip Sonnet.

**Pricing.** Guardrail units, no FM tokens.

**Exam cue.** Safety check without generate.

**Do not confuse with.** System-prompt “please never.”

#### Custom Model Import

**What it is.** Load external weights (HF / GGUF / SafeTensors) into Bedrock serving.

**Problem it solves.** Same invoke APIs for a model you trained elsewhere.

**Where it sits.** After SageMaker / on-prem training.

**Typical use.** Import → wait for validation → buy PT.

**Pricing.** PT (required).

**Exam cue.** BYO model + no on-demand.

**Do not confuse with.** Bedrock fine-tune (AWS trains).

### Security / operations

#### IAM for Bedrock

**What it is.** Identity-based access to invoke, stream, manage Guardrails/KB/agents.

**Problem it solves.** No anonymous Bedrock; least privilege per model ARN.

**Where it sits.** Every call.

**Typical use.** Lambda role with `bedrock:InvokeModel` on Claude*.

**Pricing.** Free.

**Exam cue.** IAM, not API keys.

**Do not confuse with.** SageMaker notebook tokens.

---

## Practice questions

Pick an answer on every stem. The explanation appears after you choose — later questions stay unspoiled until you answer them.

```practice
Q: The blotter UI shows a spinner until a 20-second summary finishes. Users think it is hung. First API change?
A: Switch to a streaming invoke (InvokeModelWithResponseStream or ConverseStream)
B: Buy Provisioned Throughput
C: Fine-tune Titan
D: Enable Glue Data Quality
correct: A
feedback: Perceived latency is streaming. PT may help tail latency but does not paint tokens. Fine-tune and Glue are other layers.

Q: You must A/B Claude and Llama with one tool schema. Which API?
A: InvokeModel with two handwritten native bodies
B: Converse + toolConfig
C: StartModelImportJob
D: Textract
correct: B
feedback: Converse is the portable envelope and standard tools. InvokeModel is the native-JSON kitchen.

Q: Overnight job: 50,000 note summaries, hours of delay OK, cost-sensitive.
A: On-demand Converse in a tight loop
B: Bedrock batch inference
C: Provisioned Throughput sized to the overnight peak, 24×7
D: Cross-Region inference
correct: B
feedback: Batch is the bulk SKU (~50% vs on-demand). PT 24×7 is the wrong shape. CRI is throttle overflow.

Q: Same 6k-token system+tool prefix every call; only the analyst question changes.
A: Prompt caching (stable prefix first, variable last)
B: DynamoDB as an answer cache
C: Custom Model Import
D: OpenSearch LTR
correct: A
feedback: Cache the repeated prefix. Not session memory and not a new model.

Q: Legal wants a PII check on pasted text before any FM spend.
A: ApplyGuardrail on INPUT
B: Higher temperature
C: S3 Vectors
D: Hierarchical chunking
correct: A
feedback: Guardrail without invoke. Temperature and retrieval do not replace the policy API.

Q: A Llama GGUF trained on-prem must be invoked through Bedrock APIs. After import, how does it run?
A: On-demand like Claude
B: Provisioned Throughput only
C: Glue jobs
D: Kendra
correct: B
feedback: Custom import has no on-demand path. Budget PT.

Q: Stem: “managed foundation-model access with no infrastructure to operate.” Service?
A: Amazon Bedrock
B: SageMaker Training
C: EC2 with vLLM
D: AWS Glue
correct: A
feedback: That is the Bedrock one-liner. Training and self-hosted vLLM are you operating GPUs.
```

---

## Final compressed review

Bedrock is the **API**. InvokeModel is native JSON. Stream is UX. Converse is the portable envelope. ApplyGuardrail is policy without tokens. On-demand / CRI / PT / batch / cache are **how it runs**. KB, Agents, Guardrails, Prompt Management are products that sit on that API — details live in the official tasks.

If you can say out loud which API, which SKU, and which wrap (Guardrail / KB / Agent) the AMD question needs, this supplement has done its job.

Official neighbors: [1.2 models](/learn/1/model-selection) · [1.6 prompts](/learn/1/prompt-engineering) · [2.1 agents](/learn/2/agentic-ai).
