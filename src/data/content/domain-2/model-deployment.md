# Model Deployment Strategies

**Domain 2 | Task 2.2 | ~30 minutes**

---

## Why This Matters

Choosing the right deployment strategy determines your application's **cost**, **latency**, and **reliability** profile. The wrong choice means either overpaying for unused capacity or struggling with performance issues. A production chatbot on the wrong deployment model might cost 3x what it should—or fail under load when you need it most.

This isn't a decision you make once and forget. As your application evolves—traffic patterns change, usage grows, requirements shift—your deployment strategy should evolve too. Understanding the tradeoffs between Lambda with on-demand pricing, Bedrock provisioned throughput, SageMaker endpoints, and container-based deployments is a core skill for building production GenAI systems.

The decision framework is simpler than it might seem: match your deployment choice to your traffic patterns, latency requirements, cost constraints, and whether you're using managed models or custom ones you've trained yourself.

---

## Model Deployment Patterns

There is no universal deployment strategy that works for every situation. The right choice depends on several factors working together.

```
                    ┌─────────────────────────┐
                    │ Custom or fine-tuned    │
                    │ model?                  │
                    └───────────┬─────────────┘
                           ┌────┴────┐
                           │         │
                          Yes        No
                           │         │
                           ▼         ▼
              ┌─────────────────┐  ┌─────────────────┐
              │   SageMaker     │  │ Traffic         │
              │   Endpoints     │  │ predictable?    │
              └─────────────────┘  └───────┬─────────┘
                                      ┌────┴────┐
                                      │         │
                                  Variable   Predictable
                                      │         │
                                      ▼         ▼
                          ┌─────────────────┐  ┌─────────────────┐
                          │ Lambda +        │  │ Need <50ms      │
                          │ On-Demand       │  │ latency?        │
                          └─────────────────┘  └───────┬─────────┘
                                                  ┌────┴────┐
                                                  │         │
                                                 Yes        No
                                                  │         │
                                                  ▼         ▼
                                      ┌─────────────────┐ ┌─────────────────┐
                                      │ Provisioned     │ │ On-Demand       │
                                      │ Throughput      │ │ (cheaper)       │
                                      └─────────────────┘ └─────────────────┘
```

### Lambda + Bedrock On-Demand

The simplest deployment pattern combines **Lambda** with Bedrock's **on-demand pricing**. Your Lambda functions call Bedrock's `InvokeModel` API, and you pay only for the tokens you actually process.

This approach requires **zero infrastructure management**—no servers to maintain, no capacity to provision, no scaling policies to configure. It works well for:

- Applications with **variable traffic**
- Development and testing environments
- Any situation where cold starts are acceptable
- Early-stage applications where usage is unpredictable

The trade-off is that you pay a **premium per token** compared to committed capacity options. On-demand uses **shared capacity**, so during periods of high demand across AWS, your requests compete with everyone else's. Latency can spike, and in extreme cases requests may be throttled.

### Bedrock Provisioned Throughput

**Provisioned Throughput** reserves **dedicated capacity** for your workload. You pre-purchase model capacity by committing to a throughput level measured in **model units**. In exchange:

- **Guaranteed capacity** that's always available
- **Lower per-token costs** than on-demand
- **Consistent latency** since your requests don't compete with others

This makes sense for **production workloads with predictable, sustained traffic** where you can calculate expected usage and commit accordingly.

The key decision point is **utilization**: if you'll use the capacity consistently, provisioned throughput saves money. If your traffic is unpredictable, you'll pay for capacity that sits idle.

**Important**: Provisioned Throughput is **required for custom models**. If you've fine-tuned a model or done continued pre-training, you must deploy it on provisioned capacity—there's no on-demand option for custom models.

### SageMaker Endpoints

**SageMaker endpoints** become necessary when you need capabilities that Bedrock doesn't provide:

- **Fine-tuned models** you've trained yourself
- **Specific instance types**—particular GPU configurations, memory sizes, or compute profiles
- **Model version management** and gradual rollouts
- **A/B testing** between model versions
- **Multi-model endpoints** for hosting multiple models on shared infrastructure

The operational overhead is higher because you're managing infrastructure rather than just calling an API. But you gain flexibility that managed services can't provide.

### Container-Based Deployment (ECS/EKS)

Container-based deployment using **ECS** or **EKS** offers maximum flexibility for specialized requirements:

- Deploy **custom model serving frameworks**
- Use **specific GPU configurations**
- Integrate with **existing container orchestration infrastructure**

This approach has the **highest operational overhead**—you're responsible for container images, cluster management, networking, and scaling—but provides complete control over every aspect of the deployment.

### Deployment Comparison

| Aspect | Lambda + On-Demand | Provisioned Throughput | SageMaker |
|--------|-------------------|------------------------|-----------|
| Operational overhead | Lowest | Low | Medium |
| Cost model | Pay per token | Hourly commitment | Per-instance-hour |
| Best for | Variable traffic | Predictable production | Custom models |
| Model flexibility | Bedrock models only | Bedrock models only | Any model |
| Cold starts | Possible | No | No |

---

## Model Cascading for Cost Optimization

**Model cascading** is one of the most powerful cost optimization patterns available for foundation model applications. The core insight is simple: **not every query requires your most capable (and expensive) model**.

By routing simple queries to smaller, cheaper models and reserving larger models for queries that actually need sophisticated reasoning, you can dramatically reduce costs while maintaining quality.

### How Cascading Works

```
               ┌──────────────┐
               │ User Query   │
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │ Classify     │
               │ Complexity   │
               └──────┬───────┘
                 ┌────┴────┐
                 │         │
              Simple    Complex
                 │         │
                 ▼         ▼
          ┌──────────┐ ┌──────────┐
          │  Haiku   │ │  Sonnet  │
          │ ($0.25/M)│ │ ($3.00/M)│
          └────┬─────┘ └────┬─────┘
               │            │
               ▼            │
        ┌──────────────┐    │
        │ Confident?   │    │
        └──────┬───────┘    │
          ┌────┴────┐       │
          │         │       │
         Yes        No──────┤
          │                 │
          ▼                 ▼
    ┌──────────┐     ┌──────────┐
    │ Response │     │ Response │
    └──────────┘     └──────────┘
```

1. **Classify** incoming queries by complexity
2. Route **simple queries** to small models (Claude Haiku, Titan Express)
3. Route **complex queries** to large models (Claude Sonnet, Opus)
4. If small model response indicates uncertainty, **escalate** to larger model

### Why the Economics Work

Query complexity follows a **power law distribution**. In most applications:

- **70-80% of queries are simple**: FAQs, straightforward lookups, basic generations
- **20-30% require complex reasoning**: nuanced understanding, sophisticated generation

Small models handle simple queries perfectly well at **10-20x lower cost** than large models. Only the complex minority truly benefits from larger models.

### Cost Impact Example

Processing **100,000 queries per day** at 500 tokens each:

| Approach | Daily Cost | Monthly Cost |
|----------|------------|--------------|
| All Sonnet | $150 | ~$4,500 |
| 70% Haiku, 30% Sonnet | $54 | ~$1,620 |
| **Savings** | **$96/day** | **~$2,880/mo** |

That's a **64% reduction** just from intelligent routing.

### Implementation with Python

```python
import boto3
import json

client = boto3.client('bedrock-runtime')

def cascading_inference(query: str) -> dict:
    # Start with the cheapest model
    haiku_response = invoke_model('anthropic.claude-3-haiku-20240307-v1:0', query)

    if is_confident_response(haiku_response):
        return {'model': 'haiku', 'response': haiku_response, 'cost': 'low'}

    # Escalate to more capable model
    sonnet_response = invoke_model('anthropic.claude-3-sonnet-20240229-v1:0', query)
    return {'model': 'sonnet', 'response': sonnet_response, 'cost': 'medium'}

def is_confident_response(response: str) -> bool:
    uncertainty_phrases = ["I'm not sure", "I don't know", "unclear", "might be"]
    return not any(phrase in response.lower() for phrase in uncertainty_phrases)

def invoke_model(model_id: str, query: str) -> str:
    response = client.invoke_model(
        modelId=model_id,
        body=json.dumps({
            'anthropic_version': 'bedrock-2023-05-31',
            'messages': [{'role': 'user', 'content': query}],
            'max_tokens': 1024
        })
    )
    return json.loads(response['body'].read())['content'][0]['text']
```

Production implementations might use more sophisticated quality evaluation: semantic analysis, explicit confidence scores, or comparison against expected response patterns.

---

## Cross-Region Inference with Inference Profiles

**Inference profiles** enable cross-region inference, automatically routing requests to healthy regions when your primary region experiences capacity constraints or outages. This improves **availability** without requiring you to build custom failover logic.

### How Inference Profiles Work

An inference profile is an **ARN that references a model across multiple regions**. Instead of calling a specific model in a specific region, you call the inference profile, and Bedrock routes your request to an available region automatically.

```
arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-sonnet-20240229-v1:0
```

The prefix (`us.`) indicates the **geographic scope**. Requests using a US profile might route to us-east-1, us-west-2, or other US regions based on availability. This happens transparently—your code doesn't change based on which region ultimately serves the request.

### Data Residency

The routing **respects data residency**:
- US-based profiles route within the US
- EU-based profiles stay in EU regions

This maintains compliance with data sovereignty requirements while providing geographic redundancy.

### Using Inference Profiles

```python
import boto3
import json

client = boto3.client('bedrock-runtime')

# Using inference profile instead of direct model ID
response = client.invoke_model(
    modelId='arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-sonnet-20240229-v1:0',
    body=json.dumps({
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 1024,
        'messages': [{'role': 'user', 'content': 'Hello'}]
    })
)
```

### When to Use (and Not Use) Inference Profiles

| Use When | Don't Use When |
|----------|----------------|
| Production workloads requiring high availability | Data must stay in specific region for compliance |
| Applications that can't tolerate regional outages | Development/testing (consistent behavior matters more) |
| Global applications with variable latency | Using provisioned throughput (committed to specific region) |

**Key exam point**: Inference profiles are **NOT the same as provisioned throughput**. They serve different purposes—availability vs. committed capacity.

---

## Batch Inference for Bulk Processing

**Batch inference** processes large volumes of requests asynchronously, trading latency for cost efficiency. Instead of paying on-demand prices for each request, batch jobs process inputs at roughly **50% discount**—significant savings for bulk workloads.

### When to Use Batch Inference

- Processing **thousands of documents** for summarization
- **Bulk data enrichment** (sentiment analysis, classification)
- **Content generation at scale** (product descriptions, translations)
- **Offline evaluation** datasets
- Any workload where **real-time response isn't required**

### How It Works

1. **Prepare** input data in JSONL format in S3
2. **Create** a batch inference job via `CreateModelInvocationJob`
3. Bedrock **processes** inputs asynchronously
4. **Results** appear in S3 when complete

### Input Format (JSONL)

Each line is a complete JSON object with a unique `recordId` and `modelInput`:

```json
{"recordId": "1", "modelInput": {"anthropic_version": "bedrock-2023-05-31", "max_tokens": 256, "messages": [{"role": "user", "content": "Summarize this article: ..."}]}}
{"recordId": "2", "modelInput": {"anthropic_version": "bedrock-2023-05-31", "max_tokens": 256, "messages": [{"role": "user", "content": "Summarize this article: ..."}]}}
```

### Creating a Batch Job

```python
import boto3

client = boto3.client('bedrock')

response = client.create_model_invocation_job(
    jobName='document-summarization-batch',
    modelId='anthropic.claude-3-haiku-20240307-v1:0',
    roleArn='arn:aws:iam::123456789012:role/BedrockBatchRole',
    inputDataConfig={
        's3InputDataConfig': {
            's3Uri': 's3://my-bucket/input/',
            's3InputFormat': 'JSONL'
        }
    },
    outputDataConfig={
        's3OutputDataConfig': {
            's3Uri': 's3://my-bucket/output/'
        }
    }
)

job_arn = response['jobArn']

# Monitor job status
status = client.get_model_invocation_job(jobIdentifier=job_arn)
print(status['status'])  # InProgress, Completed, Failed, etc.
```

### Cost Comparison

| Method | Per 1K Input Tokens | Best For |
|--------|---------------------|----------|
| On-demand | $0.00025 | Real-time, interactive |
| Batch | ~$0.000125 | Bulk processing |
| Provisioned | Variable | Sustained high volume |

---

## Container-Based Deployment Optimization

When you deploy models in containers using ECS, EKS, or SageMaker, optimization becomes more hands-on. You're directly managing compute resources, which means understanding how LLMs consume memory, utilize GPUs, and process tokens.

### Memory Management

LLMs are **exceptionally memory-hungry**. A 7-billion parameter model requires approximately **14GB** just for model weights when using FP16 (16-bit floating point) precision. This doesn't include:

- Memory for **activations** during inference
- **Batch processing** overhead
- **Operating system** requirements

**Quantization** techniques like INT8 or INT4 reduce memory requirements—potentially halving or quartering the footprint—but come with quality trade-offs to evaluate for your use case.

### GPU Utilization

ML inference workloads often show surprisingly **low GPU utilization**—30-40% is common—because of:

- I/O bottlenecks between CPU and GPU memory
- Small batch sizes
- Sequential nature of token generation

**Improving utilization:**
- **Batch requests** so GPU processes multiple inputs simultaneously
- **Monitor both GPU memory and compute** to identify bottlenecks
- **Multi-model serving** to share GPU resources across models

### Token Processing Characteristics

- **Input tokens** process in parallel (fast)
- **Output tokens** generate sequentially—each depends on previous tokens (slow)
- Longer outputs **always take more time** regardless of hardware power
- **Streaming** improves perceived latency even though total time is same

### Scaling Policies

Scale on **token throughput**, not just request count. A handful of requests generating long outputs can saturate capacity that would handle hundreds of short-response requests.

CloudWatch custom metrics tracking **tokens per second** and **queue depth** provide better scaling signals than simple request-count metrics.

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "least operational overhead" + FM access | Bedrock (Lambda + on-demand) |
| "custom model" or "fine-tuned" | SageMaker endpoints |
| "high availability" or "cross-region failover" | Inference Profiles |
| "bulk processing" or "offline inference" | Batch Inference (~50% savings) |
| "cost optimization" with variable traffic | Model cascading + on-demand |
| "predictable production traffic" | Provisioned Throughput |
| "GPU utilization" or "container optimization" | Batch requests, monitor utilization |

---

## Key Takeaways

> **1. Lambda + Bedrock on-demand: simplest, pay-per-use, best for variable traffic.**
> Zero infrastructure management. Pay only for tokens processed. Accept potential cold starts and shared capacity variability.

> **2. Provisioned Throughput: committed capacity for predictable production workloads.**
> Guaranteed capacity, consistent latency, lower per-token costs. Required for custom models. Economics favor 40-60%+ utilization.

> **3. SageMaker: required for custom/fine-tuned models or specific hardware needs.**
> Full control over infrastructure. Higher operational overhead. Use when Bedrock doesn't offer what you need.

> **4. Model cascading routes simple queries to cheap models, saving 50-70% on costs.**
> Most queries don't need your most capable model. Classify complexity, route accordingly, escalate when needed.

> **5. Inference profiles enable cross-region failover for high availability.**
> Automatic routing to healthy regions. Geographic prefixes control routing scope. Not the same as provisioned throughput.

> **6. Batch inference saves ~50% for bulk processing via JSONL in S3.**
> Trade latency for cost efficiency. Use for any workload where real-time response isn't required.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Using provisioned throughput for variable traffic** | Overpaying for unused capacity. On-demand is better for unpredictable workloads. |
| **Using SageMaker when Bedrock would suffice** | Unnecessary operational overhead. Use managed services when they meet requirements. |
| **Not implementing model cascading** | Missing 50-70% cost savings when query complexity varies. |
| **Confusing inference profiles with provisioned throughput** | Different purposes: availability vs. committed capacity. |
| **Using on-demand for bulk processing** | Batch inference saves 50%. Always consider for non-real-time workloads. |
| **Under-provisioning container memory** | LLMs need substantial memory. OOM errors cause failed requests. |
| **Scaling on request count instead of token throughput** | A few long-output requests can saturate capacity. Scale on tokens/second. |
