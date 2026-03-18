# Production GenAI Patterns Deep Dive

**Domain 2 | Task 2.7 | ~50 minutes**

---

## Why This Matters

Building a GenAI proof-of-concept that impresses stakeholders is surprisingly easy. Building a production system that handles real traffic, fails gracefully, stays within budget, and maintains quality over time? That's where **90% of GenAI projects struggle**.

This deep dive bridges that gap. We'll explore the patterns that distinguish prototype code from production-grade systems, with specific AWS implementations for each.

**The Production Reality**: Most GenAI failures in production aren't model failures—they're **system failures**. Token limits hit unexpectedly, rate limits cause cascading timeouts, costs spiral due to retry storms, and users abandon apps waiting for responses. The patterns here address these operational challenges.

---

## Pattern 1: Resilient API Integration

Every interaction with a foundation model is an API call that can fail. Production systems need multiple layers of resilience.

### Circuit Breaker Pattern

When a model endpoint starts failing, continuing to send requests **makes things worse**. Circuit breakers prevent cascade failures by "opening" when failures exceed a threshold.

```
         ┌──────────────────────────────────────────┐
         │             Circuit Breaker              │
         │                                          │
         │  CLOSED ────► OPEN ────► HALF-OPEN      │
         │    │           │           │             │
         │  Normal     Fail fast   Test recovery   │
         │  operation  (no calls)  (allow one)     │
         │    │           │           │             │
         │    └───────────┴───────────┘             │
         │           (on failure)                   │
         └──────────────────────────────────────────┘
```

| State | Behavior |
|-------|----------|
| **Closed** | Normal operation, requests flow through |
| **Open** | Failures exceeded threshold, requests fast-fail |
| **Half-Open** | Testing if service recovered |

**Implementation options:**
- **Step Functions** with Choice states and DynamoDB for state tracking
- **Lambda with ElastiCache** for distributed circuit state
- **AWS App Mesh** for service mesh-level circuit breaking

### Exponential Backoff with Jitter

Retrying failed requests is essential, but naive retries create **retry storms** that overwhelm both your system and the model endpoint.

```python
import time
import random

def invoke_with_retry(operation, max_retries=3, base_delay=1.0):
    last_error = None

    for attempt in range(max_retries + 1):
        try:
            return operation()
        except Exception as e:
            last_error = e

            if not is_retryable(e):
                raise

            if attempt < max_retries:
                # Full jitter: random delay up to exponential backoff
                exponential_delay = base_delay * (2 ** attempt)
                jittered_delay = random.random() * exponential_delay
                print(f'Attempt {attempt + 1} failed, retrying in {jittered_delay:.2f}s')
                time.sleep(jittered_delay)

    raise last_error

def is_retryable(error):
    retryable = ['ThrottlingException', 'ServiceUnavailableException',
                 'ModelNotReadyException', 'ReadTimeoutError']
    return type(error).__name__ in retryable
```

**Key principles:**
- **Exponential delays**: 1s, 2s, 4s, 8s...
- **Jitter**: Random variance prevents synchronized retry waves
- **Maximum retries**: Don't retry forever—fail fast for UX
- **Idempotency**: Ensure retries don't duplicate actions

### Model Fallback Chain

Production systems shouldn't depend on a single model:

```
┌────────────────────────────────────────────────────┐
│                 Fallback Chain                      │
│                                                     │
│  1. Claude 3 Sonnet (primary - best quality/cost)  │
│            │                                        │
│            ▼ (on failure)                          │
│  2. Claude 3 Haiku (faster, cheaper)               │
│            │                                        │
│            ▼ (on failure)                          │
│  3. Amazon Titan (different provider)              │
│            │                                        │
│            ▼ (on failure)                          │
│  4. Cached response or graceful error              │
└────────────────────────────────────────────────────┘
```

**Bedrock Cross-Region Inference** automatically routes to healthy regions, but implement **application-level fallbacks** for complete outages.

---

## Pattern 2: Semantic Caching

LLM calls are expensive and slow. Traditional caching requires exact matches, but semantic caching recognizes when **different prompts have the same intent**.

### Why Semantic Caching?

These prompts all ask the same thing:
- "What's the weather in NYC?"
- "Tell me the weather in New York City"
- "NYC weather?"

**Exact caching** would miss the match. **Semantic caching** embeds prompts and finds cached responses for semantically similar queries.

### Implementation with OpenSearch

```python
SIMILARITY_THRESHOLD = 0.92  # Tune for your use case
CACHE_TTL_SECONDS = 3600    # 1 hour

async def invoke_with_semantic_cache(prompt, model_id):
    # Generate embedding for the prompt
    prompt_embedding = await generate_embedding(prompt)

    # Search for similar cached prompts
    search_result = opensearch.search(
        index='semantic-cache',
        body={
            'query': {
                'script_score': {
                    'query': {
                        'bool': {
                            'must': [
                                {'term': {'modelId': model_id}},
                                {'range': {'timestamp': {'gte': now - CACHE_TTL}}}
                            ]
                        }
                    },
                    'script': {
                        'source': "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                        'params': {'query_vector': prompt_embedding}
                    }
                }
            },
            'size': 1
        }
    )

    if hits and similarity >= SIMILARITY_THRESHOLD:
        return {'response': cached_response, 'cached': True}

    # Cache miss - invoke model and cache result
    response = await invoke_model(prompt, model_id)
    await cache_response(prompt, response, prompt_embedding, model_id)
    return {'response': response, 'cached': False}
```

### Caching Strategy Comparison

| Strategy | Hit Rate | Latency | Best For |
|----------|----------|---------|----------|
| **Exact (ElastiCache)** | Low | Very fast | Repeated identical queries |
| **Semantic (OpenSearch)** | High | Adds embedding time | Variable phrasing |
| **Prompt caching (Bedrock)** | Medium | Built-in | Repeated system prompts |
| **Edge (CloudFront)** | N/A | Fast | Static content only |

---

## Pattern 3: Token Budget Management

Token costs can spiral without proper guardrails. Production systems need token budget management at multiple levels.

### Request-Level Token Budgets

Estimate tokens before sending requests:

```python
def enforce_token_budget(user_prompt, system_prompt, context, budget):
    system_tokens = estimate_tokens(system_prompt)
    user_tokens = estimate_tokens(user_prompt)
    reserved_tokens = budget['reserved']

    # Calculate available for context
    available_for_context = (budget['max_input']
                           - system_tokens
                           - user_tokens
                           - reserved_tokens)

    if available_for_context < 0:
        raise ValueError('Prompt exceeds budget even without context')

    # Truncate context if needed
    context_tokens = estimate_tokens(context)
    if context_tokens > available_for_context:
        context = truncate_to_tokens(context, available_for_context)
        print(f'Context truncated from {context_tokens} to {available_for_context}')

    return {
        'prompt': user_prompt,
        'context': context,
        'output_tokens': min(budget['max_output'],
                            budget['max_input'] - total_input)
    }

def estimate_tokens(text):
    # Rough heuristic: ~4 characters per token for English
    return len(text) // 4
```

### User-Level Token Quotas

Prevent individual users from exhausting your budget:

```python
DEFAULT_QUOTAS = {
    'free': {'daily': 10_000, 'monthly': 100_000},
    'pro': {'daily': 100_000, 'monthly': 1_000_000},
    'enterprise': {'daily': 1_000_000, 'monthly': 10_000_000}
}

async def check_and_consume_quota(user_id, tier, tokens_to_consume):
    quota = DEFAULT_QUOTAS.get(tier, DEFAULT_QUOTAS['free'])

    # Atomic increment with condition check
    result = dynamodb.update_item(
        TableName='UserQuotas',
        Key={'pk': f'USER#{user_id}', 'sk': f'QUOTA#{today}'},
        UpdateExpression='ADD dailyTokens :tokens',
        ConditionExpression='attribute_not_exists(dailyTokens) OR dailyTokens < :limit',
        ExpressionAttributeValues={
            ':tokens': tokens_to_consume,
            ':limit': quota['daily']
        },
        ReturnValues='ALL_NEW'
    )

    new_daily = result['Attributes']['dailyTokens']
    return {
        'allowed': True,
        'remaining': quota['daily'] - new_daily
    }
```

---

## Pattern 4: Streaming for User Experience

Users perceive streaming responses as **significantly faster**, even when total time is similar. Production apps should always stream long-form responses.

```python
import boto3

def stream_response(prompt, model_id='anthropic.claude-3-sonnet-20240229-v1:0'):
    client = boto3.client('bedrock-runtime')

    response = client.invoke_model_with_response_stream(
        modelId=model_id,
        body=json.dumps({
            'anthropic_version': 'bedrock-2023-05-31',
            'max_tokens': 4096,
            'messages': [{'role': 'user', 'content': prompt}]
        })
    )

    for event in response['body']:
        if event.get('chunk', {}).get('bytes'):
            chunk = json.loads(event['chunk']['bytes'])
            if chunk['type'] == 'content_block_delta':
                yield chunk['delta']['text']
            elif chunk['type'] == 'message_stop':
                return

# Usage in API route - Server-Sent Events
def handle_request(prompt):
    for chunk in stream_response(prompt):
        yield f'data: {json.dumps({"text": chunk})}\n\n'
    yield 'data: [DONE]\n\n'
```

---

## Pattern 5: Observability Stack

You can't improve what you can't measure. Production GenAI systems need comprehensive observability.

### Key Metrics for GenAI

**Operational:**
- Request latency (p50, p95, p99)
- Error rates by type
- Token consumption rates
- Cache hit ratios

**Quality:**
- User feedback scores
- Guardrail intervention frequency
- Context relevance scores (RAG)

**Cost:**
- Token cost per request
- Cost per user/tenant
- Cost trend forecasting

### CloudWatch Custom Metrics

```python
import boto3

def record_genai_metrics(metrics):
    cloudwatch = boto3.client('cloudwatch')

    dimensions = [
        {'Name': 'ModelId', 'Value': metrics['model_id']},
        {'Name': 'Application', 'Value': 'genai-app'}
    ]

    cloudwatch.put_metric_data(
        Namespace='GenAI/Production',
        MetricData=[
            {
                'MetricName': 'RequestLatency',
                'Dimensions': dimensions,
                'Value': metrics['latency_ms'],
                'Unit': 'Milliseconds'
            },
            {
                'MetricName': 'InputTokens',
                'Dimensions': dimensions,
                'Value': metrics['input_tokens'],
                'Unit': 'Count'
            },
            {
                'MetricName': 'OutputTokens',
                'Dimensions': dimensions,
                'Value': metrics['output_tokens'],
                'Unit': 'Count'
            },
            {
                'MetricName': 'EstimatedCostCents',
                'Dimensions': dimensions,
                'Value': estimate_cost(metrics),
                'Unit': 'None'
            },
            {
                'MetricName': 'CacheHit',
                'Dimensions': dimensions,
                'Value': 1 if metrics['cached'] else 0,
                'Unit': 'Count'
            }
        ]
    )
```

### X-Ray Distributed Tracing

Trace complete request paths through GenAI workflows:

```python
import aws_xray_sdk
from aws_xray_sdk.core import xray_recorder

@xray_recorder.capture('ProcessRAGRequest')
def process_rag_request(query):
    # Trace embedding generation
    with xray_recorder.in_subsegment('GenerateEmbedding') as subsegment:
        subsegment.put_annotation('query_length', len(query))
        embedding = generate_embedding(query)

    # Trace vector search
    with xray_recorder.in_subsegment('VectorSearch') as subsegment:
        results = search_vector_store(embedding)
        subsegment.put_metadata('results_count', len(results))

    # Trace LLM invocation
    with xray_recorder.in_subsegment('LLMInvocation') as subsegment:
        subsegment.put_annotation('model', 'claude-3-sonnet')
        response = invoke_model(query, context)

    return response
```

---

## Pattern 6: Graceful Degradation

When systems fail—and they will—production apps should degrade gracefully rather than crash.

### Degradation Levels

| Level | State | Available Features |
|-------|-------|-------------------|
| **Normal** | All systems operational | Full RAG, streaming, citations |
| **Degraded** | RAG unavailable | Direct model response only |
| **Minimal** | Models unavailable | Cached responses |
| **Offline** | Complete failure | Static fallback messages |

```python
async def handle_query_with_degradation(query):
    # Try full-featured response
    try:
        response = await full_rag_response(query)
        return {'response': response, 'level': 'normal'}
    except Exception:
        pass

    # Try direct model (no RAG)
    try:
        response = await direct_model_response(query)
        return {
            'response': response + '\n\n*Note: Response without knowledge base.*',
            'level': 'degraded'
        }
    except Exception:
        pass

    # Try cached response
    cached = await find_similar_cached_response(query)
    if cached:
        return {
            'response': cached + '\n\n*Note: Cached response.*',
            'level': 'minimal'
        }

    # Static fallback
    return {
        'response': 'Technical difficulties. Please try again later.',
        'level': 'offline'
    }
```

---

## Pattern 7: Security in Production

Production GenAI systems face unique security challenges.

### Defense in Depth

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Network Security                       │
│  - VPC endpoints for Bedrock                    │
│  - Security groups limiting access               │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  Layer 2: Identity & Access                      │
│  - IAM roles with least privilege               │
│  - Resource-based policies on models            │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  Layer 3: Input Validation                       │
│  - Length limits, content type validation       │
│  - Prompt injection detection                   │
└─────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  Layer 4: Output Filtering                       │
│  - Bedrock Guardrails                           │
│  - PII detection and redaction                  │
└─────────────────────────────────────────────────┘
```

### Input Validation Pipeline

```python
async def validate_input(user_input):
    # Length check
    if len(user_input) > 10000:
        return {'valid': False, 'reason': 'Input exceeds maximum length'}

    # Injection pattern detection
    injection_patterns = [
        r'ignore\s+(all\s+)?previous\s+instructions',
        r'system\s*:\s*you\s+are',
        r'\[\s*INST\s*\]'
    ]

    for pattern in injection_patterns:
        if re.search(pattern, user_input, re.IGNORECASE):
            return {'valid': False, 'reason': 'Potentially malicious input'}

    # PII detection with Comprehend
    pii_result = comprehend.detect_pii_entities(
        Text=user_input,
        LanguageCode='en'
    )

    sensitive_types = ['SSN', 'CREDIT_DEBIT_NUMBER', 'BANK_ACCOUNT_NUMBER']
    if any(e['Type'] in sensitive_types for e in pii_result['Entities']):
        user_input = redact_sensitive_pii(user_input, pii_result)

    # Guardrail check
    guardrail_result = bedrock.apply_guardrail(
        guardrailIdentifier=GUARDRAIL_ID,
        source='INPUT',
        content=[{'text': {'text': user_input}}]
    )

    if guardrail_result['action'] == 'GUARDRAIL_INTERVENED':
        return {'valid': False, 'reason': 'Content policy violation'}

    return {'valid': True, 'sanitizedInput': user_input}
```

---

## Production Deployment Checklist

| Category | Checkpoint | AWS Service |
|----------|------------|-------------|
| **Resilience** | Circuit breakers | Step Functions / Custom |
| **Resilience** | Exponential backoff | SDK retry config |
| **Resilience** | Model fallback chain | Custom routing |
| **Performance** | Streaming enabled | Bedrock ResponseStream |
| **Performance** | Semantic caching | OpenSearch / ElastiCache |
| **Performance** | Token budgets | Custom / Bedrock limits |
| **Security** | VPC endpoints | VPC / PrivateLink |
| **Security** | Input validation | Comprehend + Guardrails |
| **Security** | Output filtering | Guardrails |
| **Observability** | CloudWatch metrics | CloudWatch |
| **Observability** | X-Ray tracing | X-Ray |
| **Observability** | Alerting thresholds | CloudWatch Alarms |
| **Cost** | Per-user quotas | DynamoDB + Custom |
| **Cost** | Anomaly detection | Cost Explorer |

---

## Exam Tips

| Scenario | Solution |
|----------|----------|
| "502 errors during peak load" | Caching + rate limiting + circuit breakers |
| "Users complain about slow responses" | Streaming |
| "Prevent single user consuming all resources" | Token quotas + rate limiting |
| "Cost-effective handling of repeated queries" | Semantic caching |
| "Graceful handling of model failures" | Fallback chain + degradation levels |

---

## Key Takeaways

> **1. Resilience is non-negotiable.**
> Implement circuit breakers, retries with jitter, and fallback chains from day one.

> **2. Cache aggressively.**
> Semantic caching dramatically reduces costs and latency for similar queries.

> **3. Observe everything.**
> You can't debug production without comprehensive metrics and X-Ray traces.

> **4. Degrade gracefully.**
> Every feature should have a fallback path. Plan for failure modes explicitly.

> **5. Secure at every layer.**
> Network, identity, input validation, and output filtering—defense in depth.

> **6. Budget defensively.**
> Token costs can spiral. Implement per-user quotas and cost monitoring early.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **No circuit breakers** | Failed services get hammered with retries, slowing recovery |
| **Missing retry jitter** | Synchronized retries create traffic spikes |
| **Single model dependency** | Complete outage when that model has issues |
| **No token budgets** | Costs spiral from runaway prompts or malicious users |
| **Skipping streaming** | Users perceive multi-second waits as broken |
| **Missing observability** | Can't debug or optimize production issues |
| **No graceful degradation** | Complete failure vs partial functionality |
