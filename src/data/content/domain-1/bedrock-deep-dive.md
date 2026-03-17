# Amazon Bedrock Deep Dive

**Domain 1 | Task 1.1 | ~60 minutes**

---

## Why This Matters

Amazon Bedrock is the foundation of AWS GenAI. Understanding its architecture, APIs, and capabilities deeply is essential for both the exam and real-world implementation.

---

## How Bedrock Actually Works

Amazon Bedrock is a fully managed service that provides API access to foundation models from multiple providers.

**The key insight**: Bedrock is not hosting models in your account. It provides a managed API layer that routes your requests to model infrastructure AWS manages.

This means:
- No infrastructure to manage (no EC2, no containers)
- Pay-per-use pricing (tokens processed)
- Instant access to multiple model families
- AWS handles scaling, availability, and updates

### Request Flow

```
Your App → Bedrock API → Model Router → Foundation Model → Response
                ↓
         Guardrails (optional)
                ↓
         Logging (optional)
```

### Key Architecture Components

1. **Model Access Layer**: API endpoints that accept your requests
2. **Model Router**: Directs requests to the appropriate model
3. **Inference Engine**: Actually runs the model (managed by AWS)
4. **Guardrails Engine**: Optional content filtering
5. **Logging Service**: Optional invocation logging to S3/CloudWatch

### Regional Availability

Bedrock is available in specific AWS regions. Not all models are available in all regions. Cross-Region Inference can route requests to other regions for availability and latency optimization.

### VPC Integration

By default, Bedrock API calls go over the public internet (with TLS encryption). For private connectivity, create an **Interface VPC Endpoint**. This keeps traffic within AWS network.

### Authentication

All Bedrock API calls require IAM authentication. Use IAM roles for Lambda/EC2, or IAM users with credentials for local development. The principal must have `bedrock:InvokeModel` permission.

---

## The Bedrock APIs

Understanding when to use each API is crucial.

### InvokeModel (Synchronous)

```python
import boto3
import json

client = boto3.client('bedrock-runtime')

response = client.invoke_model(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    contentType='application/json',
    accept='application/json',
    body=json.dumps({
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 1024,
        'messages': [
            {'role': 'user', 'content': 'Explain quantum computing.'}
        ]
    })
)

result = json.loads(response['body'].read())
print(result['content'][0]['text'])
```

**Characteristics**:
- Synchronous: Request blocks until response is complete
- Best for: Short responses, simple integrations
- Timeout: Default 60 seconds, max varies by model
- Returns: Complete response in single payload

### InvokeModelWithResponseStream (Streaming)

```python
response = client.invoke_model_with_response_stream(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    contentType='application/json',
    body=json.dumps({
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 1024,
        'messages': [
            {'role': 'user', 'content': 'Write a story.'}
        ]
    })
)

for event in response['body']:
    chunk = json.loads(event['chunk']['bytes'])
    if chunk['type'] == 'content_block_delta':
        print(chunk['delta']['text'], end='')
```

**Characteristics**:
- Asynchronous streaming: Tokens arrive as generated
- Best for: Long responses, real-time UIs, chatbots
- Perceived latency: Much better (first token in ~500ms)
- Total time: Same as sync, but user sees progress

### Converse API (Multi-turn)

Simplified API for conversations:

```python
response = client.converse(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    messages=[
        {'role': 'user', 'content': [{'text': 'Hello!'}]},
        {'role': 'assistant', 'content': [{'text': 'Hi there!'}]},
        {'role': 'user', 'content': [{'text': 'Tell me a joke.'}]}
    ],
    inferenceConfig={'maxTokens': 512, 'temperature': 0.7}
)
```

**Characteristics**:
- Unified format across model families
- Handles conversation history
- Easier than model-specific payload formats

### ApplyGuardrail API

Apply guardrails without invoking a model:

```python
response = client.apply_guardrail(
    guardrailIdentifier='my-guardrail-id',
    guardrailVersion='1',
    source='INPUT',
    content=[{'text': {'text': 'User input to check'}}]
)
```

**Useful for**: Pre-checking user input, post-processing without re-running model.

---

## Model Families & Selection

Bedrock offers models from multiple providers. Each has different strengths, pricing, and use cases.

### Anthropic Claude Models

| Model | Best For | Context Window |
|-------|----------|----------------|
| Claude 3 Opus | Most capable, complex reasoning | 200K tokens |
| Claude 3 Sonnet | Balanced capability/cost, production use | 200K tokens |
| Claude 3 Haiku | Fastest, cheapest, simple tasks | 200K tokens |
| Claude 3.5 Sonnet | Latest, improved over Claude 3 Sonnet | 200K tokens |

**Best for**: Complex reasoning, analysis, code generation, long-form content.

### Amazon Titan Models

| Model | Best For |
|-------|----------|
| Titan Text | General-purpose text generation |
| Titan Embeddings | Text-to-vector for semantic search (critical for RAG) |
| Titan Multimodal Embeddings | Image + text embeddings |

**Note**: Titan models are optimized for AWS infrastructure.

### Meta Llama Models

- **Llama 3**: Open-source, good general performance
- **Llama 3.1**: Larger context, improved capabilities

**Best for**: When open-source alignment matters, cost-sensitive use cases.

### Cohere Models

- **Command**: Text generation
- **Embed**: Embeddings for search
- **Rerank**: Reranking search results

**Best for**: Enterprise search, RAG reranking.

### Model Selection Decision Tree

```
Need embeddings?
  → Yes: Titan Embeddings or Cohere Embed
  → No: Continue...

Need complex reasoning?
  → Yes: Claude 3 Opus or Claude 3.5 Sonnet
  → No: Continue...

Need fastest/cheapest?
  → Yes: Claude 3 Haiku or Mistral 7B
  → No: Claude 3 Sonnet (balanced default)
```

### Model IDs

These are required for API calls:
- `anthropic.claude-3-sonnet-20240229-v1:0`
- `anthropic.claude-3-haiku-20240307-v1:0`
- `amazon.titan-text-express-v1`
- `amazon.titan-embed-text-v1`

### Inference Profiles

Bedrock allows creating inference profiles that abstract model selection. Your code calls the profile; you can switch models without code changes.

---

## Knowledge Bases: Managed RAG

Knowledge Bases provide managed RAG without building your own pipeline.

### What Knowledge Bases Handle

1. **Document Ingestion**: Read documents from S3
2. **Chunking**: Split documents into processable pieces
3. **Embedding Generation**: Convert chunks to vectors
4. **Vector Storage**: Store in managed or your own vector DB
5. **Retrieval**: Find relevant chunks for queries
6. **Generation**: Send context to FM for response

### Data Sources

- Amazon S3 (documents, PDFs, text files)
- Web crawlers
- Confluence
- SharePoint
- Salesforce
- Custom via API

### Vector Store Options

| Option | Best For |
|--------|----------|
| Managed Vector Store | Getting started, small/medium scale |
| OpenSearch Serverless | Production, hybrid search needs |
| Aurora (pgvector) | Existing Aurora users, SQL queries |
| Pinecone / Redis Enterprise | Specific requirements |

### Chunking Strategies

- **Fixed-size**: chunk_size = 300 tokens, overlap = 50 tokens
- **Semantic**: Splits at natural boundaries (paragraphs, sections)
- **Hierarchical**: Parent-child relationships preserved

### APIs

**RetrieveAndGenerate** (Full RAG in one call):

```python
response = bedrock_agent.retrieve_and_generate(
    input={'text': 'What is our refund policy?'},
    retrieveAndGenerateConfiguration={
        'type': 'KNOWLEDGE_BASE',
        'knowledgeBaseConfiguration': {
            'knowledgeBaseId': 'KB_ID',
            'modelArn': 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet'
        }
    }
)
```

**Retrieve** (Retrieval only—you handle generation):

```python
response = bedrock_agent.retrieve(
    knowledgeBaseId='KB_ID',
    retrievalQuery={'text': 'refund policy'},
    retrievalConfiguration={
        'vectorSearchConfiguration': {
            'numberOfResults': 5
        }
    }
)
```

**When to use each**:
- **RetrieveAndGenerate**: Simple RAG, let AWS handle everything
- **Retrieve**: Need custom prompts, multi-step processing, or non-Bedrock FMs

---

## Agents: Autonomous AI Systems

Bedrock Agents enable autonomous AI that can reason, plan, and take actions using external tools.

### How Agents Work

```
User Query → Agent FM (Claude) → Reasoning
                    ↓
            Plan: Which actions needed?
                    ↓
            Execute: Call Action Groups
                    ↓
            Observe: Process results
                    ↓
            Iterate or Respond
```

This is the **ReAct pattern**: Reason → Act → Observe → Repeat

### Agent Components

1. **Instructions**: System prompt that defines agent behavior
2. **Action Groups**: Tools the agent can use
3. **Knowledge Bases**: Documents agent can query
4. **Guardrails**: Safety controls (optional)

### Action Groups

Each action is backed by a Lambda function:

**OpenAPI Schema**:
```yaml
openapi: 3.0.0
paths:
  /getWeather:
    get:
      summary: Get current weather
      operationId: getWeather
      parameters:
        - name: city
          in: query
          required: true
          schema:
            type: string
```

**Lambda function**:
```python
def handler(event, context):
    action = event['actionGroup']
    api_path = event['apiPath']
    parameters = event['parameters']

    city = next(p['value'] for p in parameters if p['name'] == 'city')
    weather_data = get_weather(city)

    return {
        'actionGroup': action,
        'apiPath': api_path,
        'httpMethod': 'GET',
        'httpStatusCode': 200,
        'responseBody': {
            'application/json': {
                'body': json.dumps(weather_data)
            }
        }
    }
```

### Invoking Agents

```python
response = bedrock_agent_runtime.invoke_agent(
    agentId='AGENT_ID',
    agentAliasId='ALIAS_ID',
    sessionId='unique-session-id',
    inputText='What\'s the weather in Seattle?'
)

for event in response['completion']:
    if 'chunk' in event:
        print(event['chunk']['bytes'].decode(), end='')
```

### Agent Tracing

Enable tracing to see the agent's reasoning:
- Which tools it considered
- Which tools it called
- What results it received
- How it formulated the response

Essential for debugging and understanding agent behavior.

---

## Guardrails: Safety and Control

Guardrails provide content filtering, topic control, and PII protection.

### Guardrail Components

**1. Content Filters**

Block harmful content categories:
- Hate speech
- Insults
- Sexual content
- Violence
- Misconduct

Each category has configurable strength (NONE, LOW, MEDIUM, HIGH).

**2. Denied Topics**

Block specific conversation topics:
```
Topic: Medical Diagnosis
Sample phrases:
- "What disease do I have?"
- "Should I take this medication?"
- "Diagnose my symptoms"
```

**3. Word Filters**

Block specific words/phrases:
- Profanity
- Competitor names
- Sensitive terms

**4. PII Detection**

Identify and handle personal information:
- Names, addresses, phone numbers
- SSN, credit cards, bank accounts
- Email addresses, IP addresses

Actions: BLOCK or ANONYMIZE

### Applying Guardrails

**With model invocation**:
```python
response = client.invoke_model(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    guardrailIdentifier='my-guardrail-id',
    guardrailVersion='DRAFT',
    body=json.dumps({...})
)
```

**Standalone (ApplyGuardrail API)**:
```python
response = client.apply_guardrail(
    guardrailIdentifier='my-guardrail-id',
    guardrailVersion='1',
    source='INPUT',  # or 'OUTPUT'
    content=[{'text': {'text': 'Check this content'}}]
)

if response['action'] == 'GUARDRAIL_INTERVENED':
    print('Content blocked:', response['outputs'])
```

### Defense in Depth

Guardrails are one layer. Combine with:
- Input validation (Lambda pre-processing)
- Output validation (Lambda post-processing)
- Prompt design (clear boundaries in system prompt)
- Monitoring (CloudWatch alerts on violations)

---

## Pricing and Cost Optimization

### On-Demand Pricing

Pay per token processed. No commitment required.

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude 3 Haiku | $0.25 | $1.25 |
| Claude 3 Sonnet | $3.00 | $15.00 |
| Claude 3 Opus | $15.00 | $75.00 |
| Titan Text | $0.20 | $0.60 |
| Titan Embeddings | $0.10 | — |

**Note**: Output tokens cost more because they require sequential generation.

### Provisioned Throughput

Commit to capacity for lower per-token costs.

- Purchase Model Units (capacity)
- 1-month or 6-month commitments
- Lower effective per-token cost at high utilization
- Break-even typically around 40-60% utilization

**When to use**:
- Predictable, sustained workloads
- Need guaranteed latency/throughput
- High volume (cost savings outweigh commitment)

### Batch Inference

Process large volumes asynchronously at reduced cost.

- Submit batch jobs (files of requests)
- Results delivered to S3
- ~50% cost reduction vs on-demand
- Not real-time (hours turnaround)

**Batch Inference Deep Dive**

When you have thousands of prompts to process and don't need real-time responses, batch inference is the most cost-effective approach.

**Input Format (JSONL)**

Create a JSONL file where each line is a separate request:

```json
{"recordId": "1", "modelInput": {"anthropic_version": "bedrock-2023-05-31", "max_tokens": 1024, "messages": [{"role": "user", "content": "Summarize: ..."}]}}
{"recordId": "2", "modelInput": {"anthropic_version": "bedrock-2023-05-31", "max_tokens": 1024, "messages": [{"role": "user", "content": "Summarize: ..."}]}}
{"recordId": "3", "modelInput": {"anthropic_version": "bedrock-2023-05-31", "max_tokens": 1024, "messages": [{"role": "user", "content": "Summarize: ..."}]}}
```

The `recordId` links outputs back to inputs.

**Submitting a Batch Job**

```python
response = bedrock.create_model_invocation_job(
    jobName='weekly-summarization-batch',
    modelId='anthropic.claude-3-haiku-20240307-v1:0',
    roleArn='arn:aws:iam::123456789012:role/BedrockBatchRole',
    inputDataConfig={
        's3InputDataConfig': {
            's3Uri': 's3://my-bucket/batch-input/requests.jsonl'
        }
    },
    outputDataConfig={
        's3OutputDataConfig': {
            's3Uri': 's3://my-bucket/batch-output/'
        }
    }
)

job_arn = response['jobArn']
```

**Monitoring and Retrieving Results**

```python
# Check job status
status = bedrock.get_model_invocation_job(jobIdentifier=job_arn)
print(status['status'])  # 'InProgress', 'Completed', 'Failed'

# When complete, results appear in S3 output location
# Output JSONL format:
# {"recordId": "1", "modelOutput": {"content": [{"text": "Summary: ..."}]}}
```

**When to Use Batch Inference**

| Use Case | Batch? |
|----------|--------|
| Process 50,000 support tickets | ✓ Yes |
| Generate product descriptions | ✓ Yes |
| Run monthly compliance reports | ✓ Yes |
| Real-time chatbot | ✗ No |
| Interactive code assistant | ✗ No |

**Batch Inference Limits**

- Max file size: 2 GB
- Max records per file: 100,000
- Max concurrent jobs: 3 (default, can request increase)
- Turnaround: Hours, not minutes

---

## Prompt Caching

Prompt caching reduces costs and latency when you reuse the same system prompts or context across requests.

### How Prompt Caching Works

When you send a request, Bedrock processes the entire prompt—system message, context, conversation history. This processing takes time and costs tokens.

With prompt caching enabled, Bedrock stores the processed representation of your **system prompt and any cached context**. Subsequent requests that use the same cached content skip reprocessing.

```
Request 1: System prompt (1000 tokens) + User message (50 tokens)
           → Process 1050 tokens, cache system prompt

Request 2: [Cached system prompt] + User message (60 tokens)
           → Process only 60 tokens (1000 tokens served from cache)
```

### Cost Savings

Cached tokens have different pricing:
- **Cache write**: Slightly higher than normal (you pay to populate cache)
- **Cache read**: Significantly lower (up to 90% savings)

For applications with long, consistent system prompts (multi-page instructions, detailed personas, extensive examples), savings compound quickly.

### What Can Be Cached

- **System prompts**: Instructions, personas, rules
- **Few-shot examples**: Demonstration inputs/outputs
- **Document context**: Retrieved documents for RAG (if consistent)

### What Can't Be Cached

- User messages (vary per request)
- Dynamic content that changes frequently
- Very short prompts (caching overhead outweighs benefit)

### Enabling Prompt Caching

Prompt caching behavior depends on the model and how you structure requests. The cache key is computed from the content—identical content hits the cache.

**Best Practices**:
1. Keep your system prompt **stable**—changes invalidate the cache
2. Put **variable content at the end** of the prompt
3. Structure prompts as: `[Cacheable system/context] + [Variable user input]`
4. Monitor cache hit rates in CloudWatch

### TTL and Invalidation

- Cache entries expire after a **time-to-live (TTL)** period
- Changing any cached content invalidates the entry
- New requests with identical content repopulate the cache

---

## Custom Model Import

Bring your own models to Bedrock for managed inference.

### What Custom Model Import Does

If you've trained or fine-tuned a model outside Bedrock (on SageMaker, another cloud, or on-premises), you can import it into Bedrock and use it through the same APIs as foundation models.

### Supported Formats

| Format | Description |
|--------|-------------|
| **Hugging Face** | Transformers-compatible models |
| **GGUF** | Quantized models (llama.cpp format) |
| **SafeTensors** | Secure tensor serialization |

### Import Workflow

1. **Package your model**: Ensure it's in a supported format with all required files (config, tokenizer, weights)

2. **Upload to S3**: Store model artifacts in an S3 bucket Bedrock can access

3. **Create import job**:
```python
response = bedrock.create_model_import_job(
    jobName='my-custom-model-import',
    importedModelName='my-legal-assistant-v1',
    roleArn='arn:aws:iam::123456789012:role/BedrockImportRole',
    modelDataSource={
        's3DataSource': {
            's3Uri': 's3://my-bucket/models/legal-assistant/'
        }
    }
)
```

4. **Wait for validation**: Bedrock validates the model format and compatibility

5. **Deploy on Provisioned Throughput**: Custom models require Provisioned Throughput—no on-demand option

### Requirements and Limitations

- **Provisioned Throughput required**: You must purchase capacity for custom models
- **Supported architectures**: Primarily Llama-family and compatible architectures
- **Size limits**: Check current limits for your region
- **Validation**: Models must pass Bedrock's compatibility checks

### When to Use Custom Import vs Bedrock Fine-Tuning

| Scenario | Custom Import | Bedrock Fine-Tuning |
|----------|---------------|---------------------|
| Model trained elsewhere | ✓ | ✗ |
| Custom architecture | ✓ (if supported) | ✗ |
| Quick customization | ✗ (more setup) | ✓ |
| Community models | ✓ | ✗ |
| Want managed fine-tuning | ✗ | ✓ |

### Cost Optimization Strategies

**1. Model Selection**
```
Simple FAQ → Haiku ($0.25/1M)
Complex analysis → Sonnet ($3/1M)
Critical reasoning → Opus ($15/1M)
```

**2. Token Optimization**
- Shorter prompts (remove redundancy)
- Limit output length (max_tokens)
- Summarize context instead of full history

**3. Caching**
- Prompt caching (reuse processed prefixes)
- Semantic caching (match similar queries)
- Edge caching (CloudFront for repeated responses)

**4. Model Cascading**
```
Query → Classifier (cheap)
         ↓
Simple → Haiku | Complex → Sonnet
```

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "managed FM access without infrastructure" | Amazon Bedrock |
| "improve response latency for chatbot" | InvokeModelWithResponseStream (streaming) |
| "content filtering or safety" | Bedrock Guardrails |
| "managed RAG" or "RAG without building pipeline" | Knowledge Bases |
| "autonomous" or "tool calling" | Bedrock Agents |
| "cost optimization" | Model selection, caching, provisioned throughput |
| "process thousands of documents" | **Batch Inference** (~50% cost savings) |
| "same system prompt across requests" | **Prompt Caching** (up to 90% savings on cached tokens) |
| "bring your own model" | **Custom Model Import** + Provisioned Throughput |
| "JSONL input file" | Batch Inference format |
| "hours turnaround acceptable" | Batch Inference |

---

## Key Takeaways

> **1. Bedrock is a managed API layer.**
> No infrastructure in your account. AWS handles scaling, availability, and model hosting entirely.

> **2. Choose the right invocation pattern.**
> InvokeModel for sync responses, InvokeModelWithResponseStream for streaming. Streaming is essential for chatbots and long outputs.

> **3. Knowledge Bases provide managed RAG.**
> Handle chunking, embedding generation, vector storage, and retrieval automatically. Use RetrieveAndGenerate for simple cases.

> **4. Agents enable autonomous tool calling.**
> The ReAct pattern (Reason → Act → Observe → Repeat) lets agents break down complex tasks and call external tools.

> **5. Guardrails are essential for production.**
> Filter harmful content, block sensitive topics, and protect PII. Apply to both inputs and outputs.

> **6. Model selection is a cost lever.**
> Haiku (cheap/fast) → Sonnet (balanced) → Opus (best reasoning). Match model capability to task complexity.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Using InvokeModel instead of streaming for long responses** | Users see nothing until the full response completes. Streaming provides immediate feedback and better perceived latency. |
| **Not enabling Guardrails for user-facing applications** | Without guardrails, the model may generate harmful, off-topic, or PII-revealing content. Defense in depth is critical. |
| **Using expensive models for simple tasks** | Opus costs 60x more than Haiku. Simple classification or FAQ tasks don't need complex reasoning capabilities. |
| **Forgetting VPC Endpoints** | Without them, API calls traverse the public internet. For compliance and security, private connectivity may be required. |
| **Not considering Provisioned Throughput** | On-demand pricing is convenient but expensive at scale. High-volume workloads benefit from capacity commitments. |
| **Real-time processing when batch would work** | Batch inference costs 50% less. If you can wait hours for results, use batch. |
| **Ignoring prompt caching for repetitive patterns** | Long system prompts processed repeatedly waste tokens. Caching can save up to 90%. |
| **Expecting on-demand for custom models** | Custom models require Provisioned Throughput. Budget for capacity commitment. |
