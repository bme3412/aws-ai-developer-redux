# Amazon Bedrock Deep Dive

**Domain 1 | Task 1.1 | ~60 minutes**

---

## Why This Matters

Amazon Bedrock is the foundation of everything else in AWS GenAI. Every other service—Knowledge Bases, Agents, Guardrails, Prompt Flows—builds on top of Bedrock's core capability: providing managed access to foundation models. If you understand Bedrock deeply, everything else becomes easier. If you treat it as a black box, you'll constantly bump into limitations you don't understand.

This isn't just about passing an exam. Bedrock's architecture affects latency, cost, reliability, and what's even possible. Understanding the difference between `InvokeModel` and `Converse` APIs might save you weeks of refactoring later. Knowing when Provisioned Throughput makes sense could save your company thousands of dollars. Grasping how Knowledge Bases chunk documents will determine whether your RAG system actually works.

The mental model to carry through this topic: **Bedrock is a managed API layer, not infrastructure in your account**. AWS hosts the models, handles scaling, manages availability—you just make API calls. This has profound implications for how you architect applications.

---

## How Bedrock Actually Works

When you call Bedrock, what actually happens? Understanding the request flow helps you debug problems, optimize performance, and make better architectural decisions.

### The Request Journey

Your application—whether it's a Lambda function, an EC2 instance, or a container running in ECS—makes an HTTPS request to a Bedrock endpoint. That request travels through several layers before a model ever sees it.

```
Your App → Bedrock API Endpoint → Authentication → Model Router
                                                        ↓
                                                 Guardrails (if configured)
                                                        ↓
                                                 Foundation Model
                                                        ↓
                                                 Response Processing
                                                        ↓
                                                 Logging (if enabled)
                                                        ↓
                                                 Back to Your App
```

The **Model Router** is particularly important. When you specify a model ID like `anthropic.claude-3-sonnet-20240229-v1:0`, the router directs your request to the appropriate model infrastructure. This infrastructure is **shared**—your requests run on the same hardware as other customers' requests (unless you've purchased Provisioned Throughput). This sharing is what enables pay-per-use pricing, but it also means your latency can vary based on overall system load.

**Guardrails**, when configured, add processing before and after model invocation. Input guardrails scan your prompt for policy violations before the model sees it. Output guardrails scan the response before it returns to you. This processing takes time—typically tens of milliseconds—but catches problems that would be much harder to handle after the fact.

**Logging** captures invocation details for compliance and debugging. When enabled, Bedrock can write prompt/response pairs to S3 or CloudWatch Logs. This happens asynchronously, so it doesn't block your response, but it does mean your data is being persisted—something to consider for sensitive applications.

### What "Managed" Really Means

The phrase "fully managed" gets thrown around a lot, but for Bedrock it has specific implications worth understanding.

**No infrastructure in your account** means you can't SSH into a Bedrock server, there's no EC2 instance to configure, no container to deploy. You interact purely through APIs. This dramatically simplifies operations—no patching, no scaling configuration, no capacity planning for the underlying compute. But it also means you can't tune low-level settings or access detailed performance metrics about the model infrastructure itself.

**Pay-per-token pricing** aligns costs with actual usage. If your application has 10 users today and 10,000 tomorrow, you don't need to provision capacity in advance. Costs scale linearly with tokens processed. This is perfect for variable workloads but can lead to bill shock if you're not monitoring token consumption carefully.

**Multi-provider access** through a single API means you can use Claude from Anthropic, Llama from Meta, Titan from Amazon, and models from other providers—all without separate integrations. Switching models is often as simple as changing a model ID string. This flexibility lets you optimize for different tasks without architectural changes.

### Regional Considerations

Bedrock is available in specific AWS regions, and **not all models are available in all regions**. Claude might be available in us-east-1 but not in ap-southeast-1. Before architecting your application, check model availability in your target region.

This regional variance creates interesting tradeoffs. You might choose a suboptimal region for latency because it has the model you need. Or you might design for multi-region deployment with different models in different regions. For applications requiring specific models, region selection becomes a constraint rather than purely a latency optimization.

**Cross-Region Inference** addresses some of these concerns by automatically routing requests to available regions within a geographic boundary. If us-east-1 is capacity-constrained, your request might route to us-west-2 automatically. But Cross-Region Inference only routes within geographic boundaries—US requests stay in US regions, EU requests stay in EU regions—maintaining data residency compliance.

### Authentication and Authorization

Every Bedrock API call requires **IAM authentication**. There's no API key option, no anonymous access. Your calling identity—whether it's a Lambda execution role, an EC2 instance profile, or user credentials from your local machine—must have explicit permission to invoke the model.

The minimum IAM permission is `bedrock:InvokeModel` on the specific model resource. But permissions can be much more granular. You can restrict which models a principal can invoke, limit access to specific APIs (streaming vs. non-streaming), or require specific conditions like VPC endpoint usage.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet*",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku*"
      ]
    }
  ]
}
```

This IAM integration means your existing AWS security practices apply directly. You can use Service Control Policies to restrict Bedrock access across an organization, use permission boundaries to limit what roles developers can create, and audit all Bedrock access through CloudTrail.

---

## The Bedrock APIs: Choosing the Right One

Bedrock provides multiple APIs for model invocation, and choosing the right one affects code complexity, user experience, and cost. The choice isn't always obvious, and understanding the tradeoffs prevents painful refactoring later.

### InvokeModel: The Synchronous Workhorse

**InvokeModel** is the simplest API: you send a request and wait for the complete response. The connection blocks until the model finishes generating all output tokens, then returns everything at once.

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
            {'role': 'user', 'content': 'Explain how photosynthesis works.'}
        ]
    })
)

result = json.loads(response['body'].read())
print(result['content'][0]['text'])
```

The request body format is **model-specific**. Claude expects `anthropic_version`, `messages`, and `max_tokens`. Titan expects `inputText` and `textGenerationConfig`. Llama uses yet another format. This is important—you're constructing payloads in each model's native format, which means switching models requires changing your request construction code.

InvokeModel excels for **short responses and backend processing**. When you're classifying text, extracting entities, or generating brief completions, the synchronous model is straightforward. Your Lambda function calls InvokeModel, processes the response, and returns. No streaming complexity, no partial state management.

The limitation becomes apparent with **longer outputs**. A detailed explanation, a multi-paragraph summary, or a comprehensive analysis might take 10-30 seconds to generate. During that entire time, your client sees nothing—just a spinning loader. The connection is open, waiting, but no content flows. For interactive applications, this creates a terrible user experience.

### InvokeModelWithResponseStream: Progressive Output

**Streaming** changes everything for user-facing applications. Instead of waiting for the complete response, you receive tokens as the model generates them. The first tokens arrive within hundreds of milliseconds, and content progressively appears while generation continues.

```python
response = client.invoke_model_with_response_stream(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    contentType='application/json',
    body=json.dumps({
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 1024,
        'messages': [
            {'role': 'user', 'content': 'Write a detailed analysis of climate change impacts.'}
        ]
    })
)

for event in response['body']:
    chunk = json.loads(event['chunk']['bytes'])
    if chunk['type'] == 'content_block_delta':
        print(chunk['delta']['text'], end='', flush=True)
    elif chunk['type'] == 'message_stop':
        print('\n[Generation complete]')
```

The streaming API returns an **event stream** rather than a single response body. Each event contains a chunk of the output—typically a few tokens—along with metadata indicating the event type. Your code processes these events as they arrive, typically by appending text to a display or buffer.

Why does streaming matter so much? Consider the psychology. When users see text appearing word by word, it feels like the system is actively working, thinking, responding. The same 15-second generation time feels much shorter when content is progressively revealed. Users can begin reading and processing information before generation completes. They can even interrupt if the response is going in the wrong direction.

For **any interactive AI application**—chatbots, writing assistants, coding tools—streaming is essentially mandatory. Users trained by ChatGPT and similar products expect this experience. A non-streaming interface feels slow and broken by comparison.

The complexity cost is real but manageable. You need to handle event iteration, parse different event types, manage connection interruptions, and potentially reassemble the complete response if you need it as a whole. But modern SDKs and frameworks handle most of this complexity.

### Converse API: The Model-Agnostic Option

The **Converse API** solves a different problem: portability across models. Instead of constructing model-specific request bodies, you use a unified format that works identically for Claude, Titan, Llama, and other models.

```python
response = client.converse(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    messages=[
        {'role': 'user', 'content': [{'text': 'Hello!'}]},
        {'role': 'assistant', 'content': [{'text': 'Hi there! How can I help you today?'}]},
        {'role': 'user', 'content': [{'text': 'Tell me about the weather.'}]}
    ],
    inferenceConfig={
        'maxTokens': 512,
        'temperature': 0.7
    }
)
```

The same code works with different models—just change the `modelId`. Converse handles translation to each model's native format internally. This is powerful for applications that need to support multiple models, perform A/B testing between models, or allow users to choose their preferred model.

**Tool calling** (function calling) is where Converse really shines. The API provides a standardized `toolConfig` parameter that works identically across models. Define your tools once using a consistent schema, and the API handles model-specific formatting.

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

With InvokeModel, you'd format tool definitions differently for each model provider—Claude's native format differs from Llama's differs from Titan's. Converse abstracts this away.

The tradeoff is that Converse may not expose every model-specific parameter. If you need fine-grained control over model-specific features, InvokeModel gives you access to the full native API. But for most applications, Converse's unified interface is worth the minor feature limitations.

**ConverseStream** is the streaming equivalent, providing the same unified format with progressive token delivery.

### ApplyGuardrail: Standalone Safety Checking

Sometimes you need to check content against guardrails **without invoking a model**. The **ApplyGuardrail** API does exactly this—it evaluates content against your configured guardrail policies and returns whether the content passes or fails.

```python
response = client.apply_guardrail(
    guardrailIdentifier='my-guardrail-id',
    guardrailVersion='1',
    source='INPUT',
    content=[{'text': {'text': 'User input to evaluate'}}]
)

if response['action'] == 'GUARDRAIL_INTERVENED':
    print('Content blocked:', response['outputs'])
else:
    print('Content passed guardrails')
```

This is useful for **pre-screening user input** before sending it to a model (saving costs if you're going to reject it anyway), **post-processing content** from sources other than Bedrock models, or building **custom pipelines** where guardrail evaluation is a separate step from generation.

### Choosing the Right API

The decision framework is straightforward:

**Use InvokeModel when:**
- You need short, quick responses
- The output is processed by code, not shown to users in real-time
- You need access to model-specific parameters not exposed by Converse
- You're building backend processing pipelines

**Use InvokeModelWithResponseStream when:**
- Users are waiting for responses
- Outputs are longer than a few sentences
- You're building chatbots, writing assistants, or any interactive experience
- Perceived latency matters

**Use Converse/ConverseStream when:**
- You want model portability—easy switching between models
- You're building with tool calling
- You prefer a unified API over model-specific formats
- You're building applications that support multiple models

---

## Model Families: Understanding Your Options

Bedrock provides access to models from multiple providers, each with different strengths, pricing, and appropriate use cases. Choosing the right model is one of your biggest **cost and quality levers**—the difference between Haiku and Opus is 60x in cost and substantial in capability.

### Anthropic Claude: The Reasoning Powerhouse

The Claude family from Anthropic has become the default choice for many Bedrock users, and for good reason. These models excel at complex reasoning, nuanced understanding, code generation, and maintaining coherent long-form outputs.

**Claude 3 Opus** represents the top of the capability range. It handles the most complex reasoning tasks—multi-step mathematical proofs, intricate code architecture decisions, nuanced legal or medical analysis. With a **200K token context window**, it can process entire codebases or lengthy documents. The tradeoff is cost ($15/million input tokens, $75/million output) and latency (responses can take several seconds to begin).

**Claude 3.5 Sonnet** is the current sweet spot for most production workloads. It offers capability improvements over Claude 3 Sonnet at the same price point, making it the natural choice for applications that previously used Sonnet. It's faster than Opus while maintaining strong reasoning capability, making it appropriate for customer-facing applications where both quality and responsiveness matter.

**Claude 3 Sonnet** remains available and is still excellent for many use cases. At $3/million input tokens and $15/million output tokens, it provides strong capability at reasonable cost. For applications that don't need the latest improvements, Sonnet continues to perform well.

**Claude 3 Haiku** is the speed and cost champion. At $0.25/million input tokens and $1.25/million output tokens, it's **60x cheaper than Opus**. Responses begin in hundreds of milliseconds rather than seconds. For classification, extraction, simple Q&A, and other tasks that don't require deep reasoning, Haiku delivers quality that's often indistinguishable from larger models at a fraction of the cost.

The Claude family shares a 200K token context window across all tiers, meaning you can process lengthy documents with any model—you just pay different rates and get different quality levels.

### Amazon Titan: AWS-Native Models

Amazon's own Titan models are optimized for AWS infrastructure and offer capabilities that complement the third-party models.

**Titan Text** provides general-purpose text generation. It's cost-competitive and works well for many standard tasks. Being an AWS-native model, it may have better availability and capacity characteristics than third-party models during high-demand periods.

**Titan Embeddings** is **critical for RAG applications**. It converts text into dense vector representations that capture semantic meaning. When you're building a knowledge base or semantic search system, Titan Embeddings (or Titan Embeddings V2 with dimension configuration) generates the vectors that enable similarity matching.

Titan Embeddings V2 introduces **configurable output dimensions**—you can choose 256, 512, or 1024 dimensions. Lower dimensions mean smaller vectors, which reduces storage costs and improves search speed. For many use cases, 512 dimensions provide **99% of the retrieval accuracy** at half the storage cost of 1024 dimensions.

**Titan Multimodal Embeddings** extends this capability to images, enabling visual similarity search and multimodal applications.

### Meta Llama: Open-Source Alignment

The Llama family from Meta offers strong general performance with an open-source philosophy. For organizations where open-source alignment matters—whether for philosophical reasons, customization potential, or avoiding vendor lock-in—Llama is an attractive option.

**Llama 3** models provide good general performance across tasks. **Llama 3.1** expanded context length and improved capability. These models work well for many standard tasks and are often more cost-effective than premium commercial models.

The open-source nature means you can also run Llama outside Bedrock if needed, on SageMaker or your own infrastructure, providing a potential escape hatch from managed service lock-in.

### Cohere: Enterprise Search Specialist

Cohere models are optimized for enterprise search and retrieval scenarios.

**Cohere Command** handles text generation with good quality for enterprise use cases. **Cohere Embed** provides embeddings optimized for search scenarios.

**Cohere Rerank** is particularly notable. In RAG pipelines, after initial retrieval returns candidate documents, Rerank re-orders them by relevance to the specific query. This second-pass ranking often dramatically improves the documents that actually reach the generation model, improving final answer quality.

### Model Selection: A Decision Framework

Given these options, how do you choose? Start with the task and work backward.

**Need embeddings?** → Titan Embeddings (V2 for dimension configuration) or Cohere Embed for search-optimized embeddings.

**Need reranking in RAG?** → Cohere Rerank or Amazon Rerank.

**Need complex reasoning, analysis, or code?** → Claude 3.5 Sonnet or Claude 3 Opus depending on complexity and cost tolerance.

**Need fast, cheap responses for simple tasks?** → Claude 3 Haiku or Mistral.

**Need balanced capability at reasonable cost?** → Claude 3 Sonnet or Claude 3.5 Sonnet.

**Need open-source alignment?** → Llama 3 or 3.1.

The model IDs you'll use in API calls look like:
- `anthropic.claude-3-5-sonnet-20241022-v2:0`
- `anthropic.claude-3-sonnet-20240229-v1:0`
- `anthropic.claude-3-haiku-20240307-v1:0`
- `amazon.titan-embed-text-v2:0`
- `meta.llama3-70b-instruct-v1:0`

---

## Knowledge Bases: Managed RAG Without the Headaches

Building a RAG (Retrieval-Augmented Generation) system from scratch is surprisingly complex. You need to parse documents, split them into chunks, generate embeddings, store vectors, handle retrieval, manage synchronization when documents change, and integrate everything with model invocation. Each step has tradeoffs to navigate and bugs to discover.

**Knowledge Bases** do all of this for you. Point it at your documents, configure some settings, and you have a working RAG system. For most use cases, this managed approach is dramatically simpler than building your own pipeline.

### The End-to-End Pipeline

When you create a Knowledge Base, Bedrock orchestrates an entire ingestion and retrieval pipeline:

**1. Document Ingestion** — Knowledge Bases read documents from configured data sources. S3 is the most common, but connectors exist for Confluence, SharePoint, Salesforce, and web crawling.

**2. Parsing** — Documents are parsed into text. PDFs are extracted. Word documents are processed. The service handles format diversity so you don't have to.

**3. Chunking** — Documents are split into smaller pieces that fit within embedding model context limits and provide focused semantic content. This chunking strategy significantly affects retrieval quality.

**4. Embedding Generation** — Each chunk is converted to a vector representation using an embedding model (typically Titan Embeddings). These vectors capture semantic meaning, enabling similarity-based retrieval.

**5. Vector Storage** — Vectors are stored in a vector database. Knowledge Bases can use a managed store or your own OpenSearch Serverless, Aurora pgvector, Pinecone, or Redis Enterprise deployment.

**6. Retrieval** — When you query, your question is embedded and compared against stored vectors. The most semantically similar chunks are retrieved.

**7. Generation** — Retrieved chunks are added to a prompt and sent to a foundation model, which generates an answer grounded in the retrieved context.

### Chunking Strategies: The Quality Lever

How documents are chunked dramatically affects retrieval quality. Chunks that are too large contain too much irrelevant content, diluting the semantic signal. Chunks that are too small lose context, making it hard to understand meaning. Chunks that split sentences or thoughts mid-stream create incoherent fragments.

**Fixed-size chunking** is the simplest approach. Split every N tokens with some overlap between chunks. Knowledge Bases default to approximately 300 tokens with 20% overlap. This works reasonably well for homogeneous content but can cut sentences awkwardly and doesn't respect document structure.

**Semantic chunking** uses an embedding model to identify natural meaning boundaries. Instead of splitting at arbitrary token counts, it splits where meaning shifts—at paragraph breaks, topic changes, or section boundaries. This produces more coherent chunks but adds complexity and cost (embedding model runs during ingestion).

**Hierarchical chunking** creates parent-child relationships. A parent chunk might be 1500 tokens covering a section; child chunks of ~300 tokens each cover subsections. During retrieval, you might match a child chunk but include the parent for broader context. This approach excels for structured technical documents, manuals, and legal texts.

For production systems, **hierarchical chunking is often the recommended default**. Combined with hybrid search (keyword + semantic) and reranking, it provides robust retrieval across document types.

**Important**: You cannot change chunking strategy after creating a data source. Choose carefully, or plan to delete and recreate with different settings.

### The Two Retrieval APIs

Knowledge Bases provide two APIs with different use cases.

**RetrieveAndGenerate** is the all-in-one RAG API. You provide a question; the API retrieves relevant chunks and generates an answer in a single call.

```python
response = bedrock_agent.retrieve_and_generate(
    input={'text': 'What is the return policy for electronics?'},
    retrieveAndGenerateConfiguration={
        'type': 'KNOWLEDGE_BASE',
        'knowledgeBaseConfiguration': {
            'knowledgeBaseId': 'YOUR_KB_ID',
            'modelArn': 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0'
        }
    }
)
```

This is the simplest path to a working RAG system. Let Bedrock handle the orchestration, retrieve appropriate chunks, construct the prompt, call the model, and return the answer.

**Retrieve** does only the retrieval step—it returns the relevant chunks but doesn't invoke a generation model.

```python
response = bedrock_agent.retrieve(
    knowledgeBaseId='YOUR_KB_ID',
    retrievalQuery={'text': 'electronics return policy'},
    retrievalConfiguration={
        'vectorSearchConfiguration': {
            'numberOfResults': 5
        }
    }
)

for chunk in response['retrievalResults']:
    print(chunk['content']['text'])
    print(f"Score: {chunk['score']}")
```

Use Retrieve when you need to:
- Build custom prompts with retrieved content
- Use a model not integrated with RetrieveAndGenerate
- Implement multi-step pipelines (retrieve → process → generate)
- Debug retrieval quality separately from generation

For straightforward RAG use cases, start with RetrieveAndGenerate. Reach for Retrieve when you need more control.

---

## Agents: Autonomous AI That Takes Action

Simple AI applications respond to prompts. **Agents** do much more—they reason about goals, decide what actions to take, execute those actions using tools, observe the results, and iterate until the task is complete. This autonomy enables AI to accomplish complex tasks that would otherwise require multiple manual steps.

### The ReAct Pattern: Thinking and Doing

Agents operate on the **ReAct pattern**: Reason → Act → Observe → Repeat. At each step, the agent thinks about what it knows and what it needs to know, decides on an action, executes that action through a tool, observes the result, and then reasons again.

```
User: "What's the status of order #12345 and when will it arrive?"

Agent Reasoning: "I need to look up order #12345 to check its status."
Agent Action: Call getOrderStatus(orderId="12345")
Observation: {status: "shipped", trackingNumber: "1Z999AA1012345"}

Agent Reasoning: "The order is shipped. I have a tracking number. I need delivery info."
Agent Action: Call getTrackingInfo(trackingNumber="1Z999AA1012345")
Observation: {estimatedDelivery: "March 20", currentLocation: "Distribution Center"}

Agent Reasoning: "I now have all the information needed to answer the user."
Agent Response: "Your order #12345 has shipped and is currently at the distribution
                center. It's expected to arrive by March 20."
```

This iterative approach handles complexity that single-shot generation can't. The agent can check availability before booking, search for information before answering, or retry with different parameters if an action fails.

### Building Agents: The Components

Bedrock Agents consist of several components working together.

**Instructions** are the system prompt that defines the agent's persona, capabilities, and behavioral guidelines. Good instructions tell the agent what it can and can't do, how to handle ambiguity, and when to ask for clarification versus proceeding with assumptions.

**Action Groups** define the tools the agent can use. Each action group contains one or more actions, each backed by a Lambda function that performs the actual work. Actions are defined using OpenAPI schemas that specify inputs, outputs, and descriptions.

```yaml
openapi: 3.0.0
info:
  title: Order Management API
  version: 1.0.0
paths:
  /orders/{orderId}/status:
    get:
      operationId: getOrderStatus
      summary: Get the current status of an order
      description: Retrieves order status, shipping info, and delivery estimates
      parameters:
        - name: orderId
          in: path
          required: true
          schema:
            type: string
          description: The order identifier (e.g., "12345")
      responses:
        '200':
          description: Order status retrieved successfully
```

The **descriptions matter**. They're how the agent understands when to use which action. Vague descriptions lead to wrong tool choices; clear descriptions help the agent select appropriately.

**Lambda functions** implement the action logic:

```python
def lambda_handler(event, context):
    action_group = event['actionGroup']
    api_path = event['apiPath']
    parameters = event.get('parameters', [])

    # Extract parameters
    params = {p['name']: p['value'] for p in parameters}

    if api_path == '/orders/{orderId}/status':
        order_id = params.get('orderId')
        status = get_order_status(order_id)  # Your business logic

        return {
            'actionGroup': action_group,
            'apiPath': api_path,
            'httpMethod': 'GET',
            'httpStatusCode': 200,
            'responseBody': {
                'application/json': {
                    'body': json.dumps(status)
                }
            }
        }

    return {
        'httpStatusCode': 400,
        'responseBody': {'application/json': {'body': '{"error": "Unknown action"}'}}
    }
```

**Knowledge Bases** can be attached to agents, giving them access to document retrieval. The agent can decide when to search the knowledge base as part of its reasoning.

### Agent Invocation and Sessions

Agents maintain context across multiple turns through **sessions**:

```python
response = bedrock_agent_runtime.invoke_agent(
    agentId='AGENT_ID',
    agentAliasId='ALIAS_ID',
    sessionId='user-session-123',  # Same session ID maintains context
    inputText="What's the status of order #12345?"
)

# Process streaming response
for event in response['completion']:
    if 'chunk' in event:
        print(event['chunk']['bytes'].decode(), end='')
```

The `sessionId` links turns together. The first message in a session establishes context; subsequent messages can reference previous turns. A user who asks "What about order #12346?" expects the agent to understand they're asking about status, not explaining what an order is.

### Agent Tracing: Understanding Agent Behavior

Enable **tracing** to see the agent's reasoning process:

- Which tools it considered using
- Which tools it actually called
- What parameters it passed
- What results it received
- How it formulated the final response

This visibility is essential for debugging. When an agent takes wrong actions or gives incorrect answers, tracing reveals where reasoning went astray. Without tracing, agent problems are black boxes.

---

## Guardrails: Safety That Scales

Foundation models can generate harmful content, reveal sensitive information, or be manipulated through adversarial inputs. **Guardrails** provide configurable safety controls that filter both inputs and outputs, blocking problems before they reach users.

### The Layers of Protection

Guardrails offer multiple overlapping protection mechanisms.

**Content Filters** block harmful content categories at configurable thresholds:

| Category | What It Catches |
|----------|-----------------|
| Hate | Discriminatory content targeting protected characteristics |
| Insults | Personal attacks and degrading language |
| Sexual | Sexually explicit or suggestive content |
| Violence | Graphic violence or violent threats |
| Misconduct | Illegal activities or harmful instructions |

Each category has strength settings: NONE, LOW, MEDIUM, HIGH. Higher settings catch more content but may also catch benign content that happens to mention sensitive topics. Tuning requires balancing safety against false positives for your specific use case.

**Denied Topics** block specific conversation areas entirely. You define topics with example phrases:

```
Topic Name: Medical Diagnosis
Sample phrases:
- "What disease do I have based on these symptoms?"
- "Should I take this medication?"
- "Diagnose my condition"
```

When guardrails detect a denied topic, they block the request entirely and return a configured response. This is useful for keeping AI within appropriate boundaries—a customer service bot shouldn't dispense medical advice.

**Word Filters** block specific words or phrases—profanity, competitor names, internal code names, or any terms you want to exclude.

**PII Detection** identifies personal information in content:
- Names, addresses, phone numbers
- Social Security numbers, credit cards, bank accounts
- Email addresses, IP addresses
- Custom patterns you define

PII can be **blocked** (request rejected) or **anonymized** (PII replaced with placeholders like `[SSN]`). For applications handling customer data, PII filtering prevents accidental data exposure even when models would otherwise include it.

### Applying Guardrails

Guardrails can be applied in two ways.

**Inline with model invocation** checks both input and output automatically:

```python
response = client.invoke_model(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    guardrailIdentifier='my-guardrail-id',
    guardrailVersion='1',
    body=json.dumps({...})
)
```

This is the simplest approach for most applications. Guardrails check the prompt before the model sees it, and check the response before it returns to you.

**Standalone ApplyGuardrail** evaluates content without model invocation:

```python
response = client.apply_guardrail(
    guardrailIdentifier='my-guardrail-id',
    guardrailVersion='1',
    source='INPUT',
    content=[{'text': {'text': 'Content to evaluate'}}]
)

if response['action'] == 'GUARDRAIL_INTERVENED':
    # Handle blocked content
    blocked_reasons = response['assessments']
```

Use standalone evaluation when you want to check content from sources other than Bedrock, pre-screen input before incurring model costs, or integrate guardrails into custom pipelines.

### Defense in Depth

Guardrails are one layer of protection, not a complete solution. Production applications combine multiple defenses:

- **Guardrails** filter known harmful patterns
- **Input validation** in application code catches malformed requests
- **Prompt engineering** structures prompts to resist manipulation
- **Output validation** verifies responses meet expected formats
- **Monitoring** detects anomalous patterns that might indicate attacks

No single layer catches everything. Attackers constantly probe for gaps. Defense in depth means that bypassing one layer doesn't compromise the entire system.

---

## Pricing and Cost Optimization

GenAI costs can surprise teams accustomed to fixed infrastructure costs. Model invocation costs scale with usage—tokens in, tokens out. Understanding pricing models and optimization strategies prevents bill shock and enables sustainable scaling.

### On-Demand: Pay-Per-Token Simplicity

On-demand pricing charges per token processed, with no commitment required. This is the default and simplest model.

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude 3 Haiku | $0.25 | $1.25 |
| Claude 3 Sonnet | $3.00 | $15.00 |
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3 Opus | $15.00 | $75.00 |
| Titan Text Express | $0.20 | $0.60 |
| Titan Embeddings V2 | $0.02 | — |

**Output tokens cost more than input tokens** because they require sequential generation. The model processes input tokens in parallel but generates output tokens one at a time, each depending on the previous ones. This asymmetry means verbose prompts cost less than verbose outputs.

On-demand excels for **variable workloads** and **getting started**. No commitment, no capacity planning, no risk of paying for unused resources. Costs scale linearly with actual usage.

The limitation is that on-demand uses **shared capacity**. During high-demand periods, latency can spike and requests may be throttled. For applications requiring consistent performance, this variability is problematic.

### Provisioned Throughput: Committed Capacity

**Provisioned Throughput** reserves dedicated capacity for your workload. You purchase **model units** for a commitment period (one or six months), and that capacity is exclusively yours.

The math is straightforward: calculate your expected token volume, compare on-demand cost to provisioned cost at that volume, and choose the cheaper option. The **breakeven is typically 40-60% utilization**, meaning if you'll use more than half your provisioned capacity, it's likely cheaper than on-demand.

Provisioned Throughput provides **consistent latency** because your requests don't compete with other customers. For production applications with SLA requirements, this consistency may matter more than the cost savings.

**Custom models require Provisioned Throughput**—there's no on-demand option for models you've fine-tuned or imported. Budget for capacity commitment when planning custom model deployments.

### Batch Inference: Half-Price Processing

For workloads that don't need real-time responses, **batch inference** offers approximately **50% cost savings** versus on-demand.

You prepare input as JSONL files in S3, submit a batch job, and results appear in S3 when processing completes. Turnaround is measured in hours, not seconds.

```json
{"recordId": "1", "modelInput": {"anthropic_version": "bedrock-2023-05-31", "max_tokens": 512, "messages": [{"role": "user", "content": "Summarize: ..."}]}}
{"recordId": "2", "modelInput": {"anthropic_version": "bedrock-2023-05-31", "max_tokens": 512, "messages": [{"role": "user", "content": "Summarize: ..."}]}}
```

Batch inference fits scenarios like:
- Processing document backlogs (summarization, extraction, analysis)
- Generating training data or evaluation datasets
- Running periodic reports or compliance checks
- Any task where "done by tomorrow morning" is fast enough

### Prompt Caching: Reusing Processed Context

When you send the same system prompt repeatedly, Bedrock reprocesses it each time—consuming tokens and adding latency. **Prompt caching** stores the processed representation of repeated content, dramatically reducing costs for subsequent requests.

```
Request 1: System prompt (1000 tokens) + User message (50 tokens)
           → Process 1050 tokens, cache system prompt

Request 2: [Cached system prompt] + User message (60 tokens)
           → Process only 60 tokens (1000 served from cache)
```

Cache reads cost up to **90% less** than processing fresh tokens. For applications with lengthy system prompts—detailed personas, extensive examples, complex instructions—the savings compound quickly.

**Best practices for prompt caching:**
- Keep system prompts **stable**—changes invalidate the cache
- Put **variable content at the end** of prompts
- Structure as: `[Cacheable context] + [Variable user input]`

### Model Cascading: Smart Routing for Savings

The 60x cost difference between Haiku and Opus creates an opportunity: route requests to the cheapest model that can handle them well.

```
User Query → Classifier (Haiku, very cheap)
                ↓
         Simple query? → Haiku ($0.25/M)
         Complex query? → Sonnet ($3.00/M)
         Very complex?  → Opus ($15.00/M)
```

If 80% of queries can be handled by Haiku, you pay Haiku prices for 80% of your volume—potentially reducing costs by 70% or more versus always using a premium model.

The classifier can be rule-based (query length, keyword presence) or model-based (Haiku classifies complexity). The key insight is that most queries don't need the most capable model, and correctly routing them saves substantial money.

---

## Custom Model Import

If you've trained or fine-tuned a model outside Bedrock—on SageMaker, another cloud, or on-premises—**Custom Model Import** lets you deploy it through Bedrock's managed infrastructure.

### When Custom Import Makes Sense

Custom import is appropriate when:
- You've trained a model elsewhere and want Bedrock's managed serving
- You want to use a community model not available natively in Bedrock
- You have specialized models for specific domains
- You need the same APIs for both custom and foundation models

### The Import Process

**1. Package your model** in a supported format:
- **Hugging Face Transformers** format (config.json, tokenizer files, model weights)
- **GGUF** format (quantized models from llama.cpp ecosystem)
- **SafeTensors** (secure tensor serialization)

**2. Upload to S3** where Bedrock can access it.

**3. Create an import job:**

```python
response = bedrock.create_model_import_job(
    jobName='my-custom-model-import',
    importedModelName='legal-assistant-v1',
    roleArn='arn:aws:iam::123456789012:role/BedrockImportRole',
    modelDataSource={
        's3DataSource': {
            's3Uri': 's3://my-bucket/models/legal-assistant/'
        }
    }
)
```

**4. Wait for validation.** Bedrock checks format compatibility and validates the model.

**5. Deploy on Provisioned Throughput.** Custom models require committed capacity—no on-demand option.

### Limitations to Understand

- **Provisioned Throughput required** — Budget for capacity commitment
- **Supported architectures** — Primarily Llama-family and compatible models
- **Size limits** — Check current limits for your region
- **Validation requirements** — Models must pass Bedrock's compatibility checks

### Custom Import vs. Bedrock Fine-Tuning

Both approaches customize models, but they serve different scenarios:

| Scenario | Custom Import | Bedrock Fine-Tuning |
|----------|---------------|---------------------|
| Model already trained elsewhere | ✓ | ✗ |
| Want managed training | ✗ | ✓ |
| Community/open-source models | ✓ | ✗ |
| Fastest path to customization | ✗ | ✓ |
| Maximum architecture control | ✓ | ✗ |

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "managed FM access" or "no infrastructure" | Amazon Bedrock |
| "improve perceived latency" or "chatbot" | Streaming (`InvokeModelWithResponseStream`) |
| "model-agnostic" or "switch models easily" | **Converse API** |
| "model-specific parameters" | **InvokeModel** with native format |
| "content filtering" or "safety" | Bedrock Guardrails |
| "managed RAG" or "document search" | Knowledge Bases |
| "autonomous" or "tool calling" or "multi-step" | Bedrock Agents |
| "bulk processing" or "50,000 documents" | **Batch Inference** (~50% savings) |
| "repeated system prompt" | **Prompt Caching** (up to 90% savings) |
| "bring your own model" or "custom model" | **Custom Model Import** + Provisioned Throughput |
| "consistent latency" or "SLA" | **Provisioned Throughput** |
| "cost optimization" for inference | Model selection, cascading, batching, caching |

---

## Key Takeaways

> **1. Bedrock is a managed API layer, not infrastructure in your account.**
> AWS handles scaling, availability, and model hosting entirely. You make API calls and pay per token.

> **2. The API choice shapes your application.**
> InvokeModel for sync backends, streaming for interactive UIs, Converse for model portability and tool calling.

> **3. Knowledge Bases provide managed RAG without the headaches.**
> Document parsing, chunking, embedding, vector storage, and retrieval—all handled. Use RetrieveAndGenerate for simple cases.

> **4. Agents enable autonomous multi-step reasoning.**
> The ReAct pattern (Reason → Act → Observe → Repeat) lets agents break down complex tasks and execute them through tools.

> **5. Guardrails are essential for production.**
> Content filters, denied topics, word filters, and PII detection create defense in depth. Apply to both inputs and outputs.

> **6. Model selection is your biggest cost lever.**
> 60x price difference between Haiku and Opus. Match model capability to task requirements. Consider cascading.

> **7. Batch inference and prompt caching reduce costs dramatically.**
> Batch saves ~50% for bulk processing. Caching saves up to 90% on repeated context.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Using InvokeModel for chatbots** | Users see nothing until full response completes. Streaming provides immediate feedback and dramatically better UX. |
| **Using InvokeModel when Converse would simplify** | If you're switching models or using tool calling, Converse's unified format saves significant code complexity. |
| **Skipping guardrails for user-facing apps** | Without guardrails, models may generate harmful content, reveal PII, or respond to prompt injection attacks. |
| **Using Opus for simple classification** | 60x cost difference. Simple tasks don't need complex reasoning—Haiku often produces identical quality at 1/60th the cost. |
| **Processing bulk workloads with on-demand** | Batch inference costs 50% less. If hours turnaround is acceptable, use batch. |
| **Ignoring prompt caching with long system prompts** | Reprocessing the same 5000-token system prompt on every request wastes tokens. Caching saves up to 90%. |
| **Expecting on-demand for custom models** | Custom models require Provisioned Throughput. There's no on-demand option—budget for capacity commitment. |
| **Not enabling agent tracing during development** | Without traces, debugging agents is guesswork. Enable tracing to see reasoning, actions, and observations. |
