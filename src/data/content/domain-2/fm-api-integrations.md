# FM API Integrations

**Domain 2 | Task 2.4 | ~35 minutes**

---

## Why This Matters

Calling foundation models correctly is fundamental. Understanding **synchronous vs asynchronous patterns**, **streaming responses**, **error handling**, and **intelligent routing** determines whether your application is reliable and performant or frustrating and flaky.

A simple API call to Bedrock might work perfectly in development. In production, that same call faces rate limits, timeouts, capacity constraints, and occasional failures. The patterns in this section ensure your application handles reality gracefully rather than crashing at the first sign of trouble.

---

## InvokeModel vs Converse: Choosing the Right API

Bedrock provides two distinct APIs for model invocation. Understanding when to use each is essential—the choice affects code portability, feature availability, and maintenance burden.

### InvokeModel API

**InvokeModel** is the original, model-native interface. You construct request bodies in the **exact format each model provider specifies**:

```python
import boto3
import json

client = boto3.client('bedrock-runtime')

# Claude format
claude_body = json.dumps({
    'anthropic_version': 'bedrock-2023-05-31',
    'max_tokens': 1024,
    'messages': [{'role': 'user', 'content': 'Hello'}]
})

# Titan format - completely different structure
titan_body = json.dumps({
    'inputText': 'Hello',
    'textGenerationConfig': {
        'maxTokenCount': 1024,
        'temperature': 0.7
    }
})

response = client.invoke_model(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    body=claude_body
)
```

**Advantages:**
- Access to **every parameter** each model supports
- Provider-specific features available

**Disadvantages:**
- Switching models requires **rewriting request construction code**
- Different error handling per provider

### Converse API

**Converse** provides a **unified interface** across all models. Same message structure regardless of which model you're calling:

```python
response = client.converse(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    messages=[
        {'role': 'user', 'content': [{'text': 'Hello'}]}
    ],
    inferenceConfig={
        'maxTokens': 1024,
        'temperature': 0.7
    }
)

# Same code works with different models - just change modelId
response = client.converse(
    modelId='meta.llama3-70b-instruct-v1:0',
    messages=[
        {'role': 'user', 'content': [{'text': 'Hello'}]}
    ],
    inferenceConfig={
        'maxTokens': 1024,
        'temperature': 0.7
    }
)
```

### Tool Calling with Converse

**Tool calling** shows where Converse excels. The API provides a **standardized `toolConfig` parameter** that works identically across models:

```python
tools = [{
    'toolSpec': {
        'name': 'get_weather',
        'description': 'Get current weather for a location',
        'inputSchema': {
            'json': {
                'type': 'object',
                'properties': {
                    'location': {'type': 'string', 'description': 'City name'}
                },
                'required': ['location']
            }
        }
    }
}]

response = client.converse(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    messages=[{'role': 'user', 'content': [{'text': 'What is the weather in Seattle?'}]}],
    toolConfig={'tools': tools}
)
```

### When to Use Each API

| Use Case | API | Reason |
|----------|-----|--------|
| Multi-model applications | **Converse** | Single code path for all models |
| Tool calling/agents | **Converse** | Standardized tool format |
| Model switching/testing | **Converse** | Change model ID only |
| Model-specific features | **InvokeModel** | Access all provider parameters |
| Image/multimodal features | **Converse** | Unified vision handling |

**Streaming equivalents**: `InvokeModelWithResponseStream` corresponds to `ConverseStream`.

---

## Synchronous and Asynchronous FM Calls

Foundation model APIs can operate in two fundamentally different modes. Understanding when to use each pattern is essential for building applications that perform well under real-world conditions.

```
┌─────────────────────────────────────────────────────────────────┐
│  SYNCHRONOUS           ASYNCHRONOUS           STREAMING        │
│                                                                 │
│  Request ────►         Submit ────►           Request ────►    │
│      │                     │                      │            │
│    WAIT...             job_id ◄────          Token 1 ◄────     │
│      │                     │                      │            │
│  Response ◄────        Poll/Callback          Token 2 ◄────    │
│                            │                      │            │
│                        Response ◄────         Token N ◄────    │
│                                                   │            │
│                                                 DONE           │
└─────────────────────────────────────────────────────────────────┘
```

### Synchronous Calls

Your application sends a request, the connection stays open while the model processes, and you receive the complete response when generation finishes.

**Works well for:**
- Interactive applications where users expect immediate responses
- Situations where users can tolerate seconds of latency

**Challenges:**
- Inference times of **10-30 seconds** are common for complex prompts
- API Gateway imposes a **29-second timeout**
- Users staring at loading spinners may abandon the application

### Asynchronous Patterns

Decouple request submission from response delivery when synchronous doesn't work.

**SQS + Lambda Architecture:**
```
┌──────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│ Producer │────►│   SQS   │────►│  Lambda  │────►│ Bedrock  │
└──────────┘     └─────────┘     └──────────┘     └────┬─────┘
                                                       │
                                       ┌───────────────┘
                                       ▼
                                 ┌──────────┐
                                 │  Output  │
                                 │  Queue/  │
                                 │  S3/SNS  │
                                 └──────────┘
```

**Advantages:**
- SQS absorbs bursts that would overwhelm synchronous processing
- Messages persist until successfully processed
- Failed messages return to queue for reprocessing

### Batch Inference

For bulk processing scenarios—document analysis, data enrichment, offline content generation:

1. Prepare input data in **JSONL format** in S3
2. Create batch job via `CreateModelInvocationJob`
3. Results appear in S3 when complete
4. **~50% cost savings** vs on-demand

---

## Streaming FM Responses

Streaming fundamentally changes the user experience. Instead of waiting for the entire response, users see text appear in **real-time** as the model produces it.

### Why Streaming Matters

Foundation models produce tokens **sequentially**—each word depends on the previous ones. A 500-token response might take several seconds to fully generate:

- **Without streaming**: Users see nothing during this entire time
- **With streaming**: Text appears character by character

Psychologically, this feels **dramatically faster** even though total time might be identical.

### Implementing Streaming

```python
import boto3
import json

client = boto3.client('bedrock-runtime')

response = client.invoke_model_with_response_stream(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    body=json.dumps({
        'anthropic_version': 'bedrock-2023-05-31',
        'messages': [{'role': 'user', 'content': 'Explain quantum computing'}],
        'max_tokens': 1024
    })
)

for event in response['body']:
    chunk = json.loads(event['chunk']['bytes'])
    if chunk['type'] == 'content_block_delta':
        print(chunk['delta']['text'], end='', flush=True)
    elif chunk['type'] == 'message_stop':
        print('\n[Stream complete]')
```

### Delivering Streams to Clients

| Transport | Direction | Complexity | Best For |
|-----------|-----------|------------|----------|
| **Server-Sent Events (SSE)** | Server → Client | Simple | FM responses to web clients |
| **WebSockets** | Bidirectional | Complex | Interactive chat with user input during streaming |
| **Polling** | Client pulls | Simplest | Legacy clients |

**SSE** is typically the best choice for foundation model responses—standard HTTP, works through proxies and load balancers, simple server-push model.

### When NOT to Stream

If you need to **validate, filter, or transform** the output before displaying it, you must wait for the complete response. Stream when you can display content directly; buffer when post-processing is required.

---

## Building Resilient FM Integrations

Foundation model APIs can experience failures. Models might be temporarily unavailable, requests might timeout, or rate limits might be exceeded. Production applications must handle these situations gracefully.

### Exponential Backoff with Jitter

When a request fails, wait before retrying—but wait **longer after each successive failure**:

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
                # Full jitter: random delay between 0 and exponential backoff
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
- **Maximum retries**: Don't retry forever—fail fast for user experience

### Circuit Breakers

When a service is consistently failing, **stop calling it**:

| State | Behavior |
|-------|----------|
| **Closed** | Normal operation, requests flow through |
| **Open** | Failures exceeded threshold, requests fast-fail |
| **Half-Open** | Testing if service recovered |

Circuit breakers prevent wasted effort and give failing services time to recover.

### Rate Limiting

API Gateway enforces application-level limits:
- **Usage plans** allocate capacity across clients
- Return **HTTP 429** with `Retry-After` header when limits exceeded
- Prevents any single user from consuming all available capacity

### Fallback Strategies

| Fallback | When to Use |
|----------|-------------|
| **Cached responses** | For queries similar to ones handled before |
| **Alternative model** | If Claude Sonnet unavailable, try Haiku |
| **Graceful degradation** | Return partial results or honest messages |
| **Queue for later** | Accept request, process when service recovers |

---

## Intelligent Request Routing

Not every request should go to the same model. Different queries have different requirements.

### Static Routing

Use predefined rules that don't change based on request content:

```
/api/simple  ────►  Claude Haiku (fast, cheap)
/api/complex ────►  Claude Sonnet (capable)
```

Simple to implement, but puts classification burden on the caller.

### Content-Based Dynamic Routing

Analyze request content to make routing decisions at runtime:

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│   Query    │────►│ Classifier │────►│  Choice    │
└────────────┘     └────────────┘     └─────┬──────┘
                                       ┌────┴────┐
                                    Simple    Complex
                                       │         │
                                       ▼         ▼
                                   ┌──────┐  ┌──────┐
                                   │Haiku │  │Sonnet│
                                   └──────┘  └──────┘
```

**Step Functions** provides clean orchestration for this pattern.

### Metric-Based Routing

Route based on **current system state** rather than request content:
- High latency on primary → shift to secondary
- Elevated error rates → automatic failover
- CloudWatch metrics drive routing through alarms

### Common Routing Use Cases

| Use Case | Routing Strategy |
|----------|------------------|
| **Cost optimization** | Simple queries to cheaper models |
| **Performance** | Latency-sensitive to provisioned throughput |
| **Compliance** | Sensitive data to specific regions |
| **A/B testing** | Percentage of traffic to experimental models |

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "model-agnostic" or "switch models easily" | Converse API |
| "model-specific parameters" | InvokeModel API |
| "real-time token streaming" | InvokeModelWithResponseStream + SSE |
| "handle FM API failures gracefully" | Exponential backoff + circuit breakers + fallbacks |
| "route requests to different models" | Step Functions for content-based routing |
| "distributed tracing" | AWS X-Ray |

---

## Key Takeaways

> **1. Converse API for model-agnostic code; InvokeModel for model-specific features.**
> Use Converse when you want to switch models easily or standardize tool calling. Use InvokeModel when you need provider-specific parameters.

> **2. InvokeModel for sync, SQS + Lambda for async, InvokeModelWithResponseStream for streaming.**
> Match the pattern to latency tolerance. Sync for simple interactive; async for background; streaming for user-facing long responses.

> **3. SSE is the standard for streaming FM responses to web clients.**
> Simpler than WebSockets, works through proxies, provides server-to-client push for generated tokens.

> **4. Exponential backoff + circuit breakers + fallbacks = resilient integration.**
> The AWS SDK handles retries automatically, but you need circuit breakers and fallbacks for complete resilience.

> **5. X-Ray traces requests across services for debugging.**
> Essential for understanding latency and failures in complex GenAI pipelines.

> **6. Step Functions orchestrates intelligent content-based routing.**
> Classify queries, route to appropriate models, handle complex decision logic.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Not using streaming for user-facing applications** | Poor UX—users stare at blank screens for seconds |
| **Missing timeout configuration** | Default timeouts may be too short for FM inference |
| **No fallback strategy when FM calls fail** | Application crashes instead of degrading gracefully |
| **Polling instead of SSE/WebSocket** | Inefficient, higher latency, more complex client code |
| **Hardcoding model selection** | Can't adapt to failures or optimize costs dynamically |
| **Ignoring X-Ray for debugging** | Can't trace latency or failures across services |
