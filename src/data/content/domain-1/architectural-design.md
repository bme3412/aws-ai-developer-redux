# Architectural Design for GenAI

**Domain 1 | Task 1.1 | ~45 minutes**

---

## Why This Matters

Think of architecture decisions like choosing the foundation for a house—get it wrong, and you'll pay for it later. The choices you make early about how to integrate AI into your application will determine whether it's fast, affordable, and scales smoothly, or becomes a constant headache. This isn't just about picking the right AWS services; it's about understanding the fundamental patterns that make GenAI applications work well in production.

The architectural decisions you make today will compound over time. A poorly designed system might work fine with 100 users but collapse at 10,000. A system that costs $50/month during development might cost $50,000/month in production if you chose the wrong model or integration pattern. And unlike traditional applications, GenAI systems have unique failure modes—they don't just crash, they can **silently degrade**, produce **harmful content**, or **leak sensitive information** in ways that are hard to detect.

This topic is foundational because everything else builds on these patterns. **RAG systems**, **agents**, **fine-tuning**, **prompt engineering**—they all assume you've got the basic architecture right. Master these concepts and the rest falls into place.

---

## Foundation Model Integration Patterns

When you're building an application that uses **foundation models**, you need to decide how your application code will communicate with those models. This isn't a trivial decision—it affects **latency**, **cost**, **reliability**, and how much **operational overhead** you'll carry. There are three fundamental patterns, each with distinct tradeoffs.

### Direct API Integration

The simplest approach is **direct integration**: your application code calls the **Bedrock API** directly. A **Lambda function** receives a request, constructs a prompt, invokes **Claude** or another model, and returns the response. There's no middleware, no queuing, no additional infrastructure.

```
User Request → Lambda → Bedrock InvokeModel → Response
```

This pattern is appealing because it's straightforward to implement and understand. You write a few dozen lines of code, configure **IAM permissions**, and you're making AI calls. For internal tools, prototypes, and applications where you control the traffic patterns, direct integration works beautifully.

But direct integration puts all the responsibility on your code. You need to handle **rate limiting** yourself—if you exceed Bedrock's **throttling limits**, your requests will fail and you need **retry logic**. You need to implement your own **caching** if you want to avoid paying for repeated identical queries. You need to build your own **monitoring** to track **token usage**, **latency percentiles**, and **error rates**. For a prototype, this is fine. For a production system serving external users, you're reinventing wheels that managed services already provide.

The direct pattern also creates **tight coupling** between your application logic and the model invocation. If you later want to add request validation, usage tracking, or **A/B testing** between models, you'll need to modify your application code. This becomes increasingly painful as your system grows.

### Gateway Pattern

The **gateway pattern** inserts **API Gateway** between your users and your AI logic. This might seem like unnecessary complexity, but API Gateway provides capabilities that would take significant engineering effort to build yourself.

```
Users → API Gateway → Lambda → Bedrock → Response
```

API Gateway handles **throttling** at the edge, preventing runaway costs from traffic spikes or abuse. It manages **API keys** and **usage plans**, so you can meter different customers or use cases separately. It provides **request/response transformation**, allowing you to present a clean API to consumers while handling Bedrock's specific payload formats internally. It integrates natively with **CloudWatch** for logging and metrics, **WAF** for security, and **Cognito** for authentication.

Most importantly, API Gateway **decouples** your external API contract from your internal implementation. You can change models, add preprocessing steps, or completely restructure your backend without changing what your consumers see. This flexibility becomes invaluable as your application evolves.

For production applications serving external users—whether that's a public API, a customer-facing chatbot, or an internal tool used by thousands of employees—the gateway pattern is almost always the right choice. The operational benefits far outweigh the minimal additional complexity.

The gateway pattern also enables sophisticated **deployment strategies**. You can use **canary deployments** to test new model versions on a small percentage of traffic. You can route different customers to different backends based on their plan or requirements. You can implement **circuit breakers** that redirect traffic during outages. These capabilities are essential for running reliable production systems.

### Event-Driven Pattern

Not every AI workload needs immediate responses. When you're processing a backlog of documents, generating reports, or running batch analysis, waiting for each request to complete before starting the next one is inefficient. The **event-driven pattern** decouples request submission from processing.

```
Requests → SQS Queue → Lambda (polling) → Bedrock → Results → S3/DynamoDB
```

In this pattern, requests go into a queue (**SQS**) and workers (**Lambda functions**) pull from the queue at their own pace. If a thousand documents arrive simultaneously, they queue up rather than overwhelming your system. Workers process them as capacity allows, and results go to a durable store for later retrieval.

This pattern excels for **batch workloads**. Need to summarize 50,000 customer support tickets? Queue them. Need to extract entities from a year's worth of contracts? Queue them. Need to generate product descriptions for your entire catalog? Queue them. The queue absorbs **traffic spikes**, provides natural **load leveling**, and makes your system resilient to temporary failures—if a worker fails, the message returns to the queue and another worker picks it up.

Event-driven architectures also enable cost optimization through **batch inference**. Bedrock's batch inference feature processes large volumes of requests asynchronously at significantly lower **per-token costs** than real-time inference. For workloads that can tolerate latency measured in hours rather than seconds, this can reduce costs by **50% or more**.

The tradeoff is complexity in handling **asynchronous results**. Your application needs to track which requests are pending, poll for or receive notifications when processing completes, and handle **partial failures** gracefully. For real-time user interactions, this overhead isn't worth it. For background processing at scale, it's essential.

### Streaming Responses

Foundation models generate text **token by token**, but the default synchronous API waits until the entire response is complete before returning anything. For short responses, this is fine. For longer responses—a detailed explanation, a multi-paragraph summary, a complex analysis—users might wait 10-30 seconds staring at a loading spinner. This feels broken, even when it's working correctly.

**Streaming** changes the user experience fundamentally. Instead of waiting for the complete response, users see text appear word by word as the model generates it. The first tokens arrive within a few hundred milliseconds, and the response builds progressively. This feels fast and responsive, even when the total generation time is identical.

Implementing streaming requires **WebSocket connections** rather than standard HTTP request-response. API Gateway supports **WebSocket APIs** that maintain persistent connections, and Bedrock's **`InvokeModelWithResponseStream`** API returns a stream of response chunks. Your frontend needs to handle these chunks incrementally, appending text as it arrives.

The technical complexity is higher than synchronous calls, but for any interactive AI application—**chatbots**, **writing assistants**, **coding tools**—streaming is essentially mandatory. Users have been trained by ChatGPT and similar products to expect this experience. A non-streaming chatbot feels sluggish and broken by comparison.

Streaming also enables **progressive rendering** of structured outputs. If you're generating JSON or another structured format, you can parse and display partial results as they arrive, giving users early feedback even before generation completes.

---

## Deployment Strategies and Capacity Planning

How you provision and pay for model capacity has dramatic effects on both costs and user experience. Bedrock offers several **deployment options**, each suited to different usage patterns.

### On-Demand Inference

**On-demand** is the default and simplest option: you pay **per token processed**, with no upfront commitment and no minimum usage. When your Lambda function calls **`InvokeModel`**, Bedrock processes the request using **shared capacity** and bills you for the **input and output tokens**.

This model is perfect for getting started and for workloads with **unpredictable or highly variable traffic**. A new application with ten users today and maybe ten thousand next month shouldn't commit to provisioned capacity—on-demand scales automatically and you only pay for actual usage.

The limitation is that on-demand uses **shared capacity**. During periods of high demand across AWS—say, when many customers are running batch jobs or a new model launches and everyone wants to try it—your requests compete with everyone else's. **Latency can spike**, and in extreme cases requests may be **throttled**. For applications where **consistent latency** is critical, this variability is problematic.

On-demand pricing varies significantly by model. **Claude 3 Haiku** costs **$0.25 per million input tokens** and **$1.25 per million output tokens**. **Claude 3 Sonnet** costs **$3.00** and **$15.00** respectively. **Claude 3 Opus** costs **$15.00** and **$75.00**. The **60x cost difference** between Haiku and Opus means **model selection** is one of your biggest cost levers.

### Provisioned Throughput

**Provisioned Throughput** reserves **dedicated capacity** for your workload. You purchase a specific number of **model units** for a **commitment period** (one month or six months), and that capacity is yours exclusively. Your requests don't compete with other customers, latency is consistent, and you're guaranteed that capacity regardless of overall demand.

Provisioned Throughput makes sense when you have **predictable, sustained workloads** and need **reliable performance**. A production chatbot serving thousands of daily active users, an enterprise application with **SLA requirements**, or a high-volume batch processing pipeline are all good candidates.

The math is straightforward: if your on-demand costs exceed the provisioned throughput cost at your expected utilization, provisioning saves money. The **breakeven is typically around 40-60% utilization**, depending on the specific model and commitment term. **Six-month commitments** offer better rates than one-month commitments.

**Provisioned Throughput is required for custom models.** If you've **fine-tuned** a model or done **continued pre-training**, you must deploy it on provisioned capacity—there's no on-demand option for custom models.

The risk is **commitment**. If your usage drops or your application pivots, you're still paying for that reserved capacity. Start with on-demand, understand your usage patterns, then consider provisioning once you have stable, predictable workloads.

### Batch Inference

For workloads that don't need real-time responses, **batch inference** offers the **lowest per-token costs**. You submit a file containing thousands of prompts, Bedrock processes them **asynchronously**, and results appear in **S3** when complete. Turnaround is measured in **hours**, not seconds.

Batch inference costs roughly **50% less than on-demand** for the same tokens. For large-scale processing—analyzing a document corpus, generating training data, running evaluations across test sets—this adds up quickly. A job that costs $1,000 on-demand might cost $500 in batch.

The tradeoff is **latency and complexity**. You need to structure your workload as files of requests, submit jobs, poll for completion, and handle results asynchronously. This doesn't fit interactive use cases, but for background processing at scale, it's the most cost-effective option.

### Cross-Region Inference

AWS regions occasionally have issues. **Capacity constraints**, **service disruptions**, or routine maintenance can affect availability in any single region. For applications that need **high availability**, depending on a single region is risky.

**Cross-Region Inference** automatically routes requests to other regions when your primary region is unavailable or constrained. Instead of specifying a **model ID**, you use an **inference profile ARN**. Bedrock handles the routing transparently—your code doesn't change, but your application gains resilience.

An important detail: Cross-Region Inference respects **data residency**. Requests from **US regions route only to other US regions**; EU requests stay in EU. This maintains compliance with **data sovereignty requirements** while providing geographic redundancy.

For any production application where downtime has significant business impact, Cross-Region Inference is a simple way to improve availability without architectural complexity.

---

## Well-Architected Framework for GenAI

AWS developed the **Well-Architected Framework** over years of observing what makes cloud architectures succeed or fail. The framework defines **five pillars**—**Operational Excellence**, **Security**, **Reliability**, **Performance Efficiency**, and **Cost Optimization**—and provides guidance for evaluating architectures against each pillar.

The **GenAI Lens** extends this framework with AI-specific considerations. Foundation models introduce unique challenges that traditional applications don't face: outputs are **non-deterministic**, quality can **degrade without obvious errors**, models can be **manipulated through adversarial inputs**, and costs scale with usage in ways that can surprise you. The GenAI Lens addresses these challenges systematically.

### Operational Excellence

Traditional applications either work or they don't—you get the right answer or an error. AI applications have a third state: they produce output that looks reasonable but is **subtly wrong**. A model might **hallucinate facts**, miss nuances, or gradually drift in quality as prompts evolve. Without active measurement, these problems go undetected until users complain or, worse, make decisions based on incorrect information.

Operational excellence for GenAI requires **treating prompts as code**. Store them in **Bedrock Prompt Management** with **version control**. Test changes against **evaluation datasets** before deployment. Track metrics that indicate quality—not just latency and errors, but **domain-specific measures** of output correctness.

**Logging and observability** take on new dimensions. You need to capture **prompts**, **responses**, and relevant **metadata** for debugging and improvement. When a user reports a bad response, you need to reproduce it. When you change a prompt, you need to compare before and after across representative inputs. **CloudWatch**, **X-Ray**, and Bedrock's built-in logging provide the raw data; you need dashboards and alerts that surface quality issues.

**Model cards** document what your models and prompts are designed to do, their limitations, and appropriate use cases. When another team wants to use your AI capability, the model card tells them whether it fits their needs and what to watch out for. This documentation becomes increasingly important as AI capabilities spread across an organization.

### Security

AI introduces **attack surfaces** that traditional applications don't have. The most significant is **prompt injection**: attackers craft inputs that manipulate the model into ignoring its instructions and doing something else. A customer support chatbot might be tricked into revealing **system prompts**, bypassing **content filters**, or providing information it shouldn't. Unlike **SQL injection**, which exploits a clear boundary between code and data, prompt injection exploits the fuzzy nature of natural language—there's no reliable way to syntactically separate user input from system instructions.

Defense requires **layers**. **Bedrock Guardrails** provide **content filtering** for both inputs and outputs, blocking **harmful content**, **sensitive topics**, and **PII**. But guardrails aren't foolproof—clever attackers find ways around them. **Application-level validation** should check inputs for known injection patterns and anomalies. **Output validation** should verify that responses meet expected constraints before delivery to users.

**Data exfiltration** is another concern. Models might be tricked into revealing their context—the documents retrieved for RAG, the conversation history, or other sensitive information included in prompts. Output guardrails should scan for **PII** and other sensitive patterns, even when the input seems benign.

Standard AWS security practices apply with particular importance. **IAM policies** should follow **least privilege**—not every service needs `bedrock:InvokeModel` on every model. **VPC endpoints** keep traffic between your application and Bedrock on the AWS network, avoiding exposure to the public internet. **CloudTrail** logs every Bedrock API call, providing **audit trails** for compliance and forensics.

### Reliability

AI systems fail in ways both familiar and novel. Familiar failures include **service unavailability**, **network issues**, and **throttling**. Novel failures include **model degradation**, **prompt sensitivity**, and **edge cases** where models produce garbage despite working correctly moments before.

**Cross-Region Inference** addresses geographic availability—if one region has issues, traffic routes elsewhere automatically. But reliability also requires handling failures gracefully within your application. **Circuit breakers** detect when a downstream service is failing and stop sending requests, preventing **cascade failures** and giving the service time to recover. **Step Functions** can implement sophisticated **retry logic** with **exponential backoff**, ensuring transient failures don't cause permanent errors.

**Graceful degradation** keeps your application useful even when AI capabilities are impaired. A chatbot might fall back to **cached responses** for common questions when the model is unavailable. A content moderation system might queue flagged content for **human review** rather than failing entirely. A recommendation engine might revert to **rule-based suggestions** when the model times out. These fallbacks prevent total failure and maintain user trust.

Testing reliability requires **chaos engineering**—deliberately injecting failures to verify your application handles them correctly. What happens when Bedrock returns 500 errors? What happens when latency spikes to 30 seconds? What happens when your model suddenly produces nonsense? If you haven't tested these scenarios, you'll discover the answers in production.

### Performance Efficiency

Users expect AI applications to feel fast, but foundation models are computationally expensive and generation takes time. **Perceived performance** matters as much as actual performance—users will tolerate longer waits if they see progress.

**Streaming responses** transform the experience. Instead of waiting 10 seconds for a complete response, users see text appearing immediately. The total time is unchanged, but the **perceived latency** drops dramatically. For any interactive AI application, streaming is essential.

**Caching** reduces both latency and cost. **Semantic caching** stores responses keyed by **query embeddings**—if a similar question was asked before, return the cached response rather than invoking the model again. This works well for common questions with stable answers. **ElastiCache** or **OpenSearch** can serve as the cache store, with **similarity thresholds** controlling how "similar" is similar enough.

**Prompt caching**, a Bedrock feature, reduces costs for repeated **system prompts**. If you use the same long system prompt across many requests, Bedrock can cache the processed representation and avoid recomputing it. This is particularly valuable for complex prompts with detailed instructions.

**Model selection** dramatically affects both cost and latency. **Claude 3 Haiku** responds in hundreds of milliseconds; **Claude 3 Opus** might take several seconds. For simple tasks—**classification**, **extraction**, **short completions**—Haiku is often sufficient and dramatically faster. Reserve larger models for tasks that genuinely require their capabilities.

### Cost Optimization

GenAI costs scale with usage in ways that can surprise teams accustomed to fixed infrastructure costs. A Lambda function costs the same whether it processes ten requests or ten million. A model invocation costs proportionally to the **tokens processed**—ten million requests cost a thousand times more than ten thousand.

**Model cascading** is the most powerful cost optimization technique. Route every request first to a fast, cheap model like **Haiku**. If Haiku's response indicates it handled the request confidently, use that response. If Haiku expresses uncertainty or the task seems too complex, escalate to **Sonnet** or **Opus**. For many workloads, **80% or more of requests** can be handled by the cheapest model, with significant cost savings.

**Batch inference** reduces per-token costs for workloads that tolerate latency. If you're processing documents overnight, generating training data, or running evaluations, batch inference costs roughly **half of on-demand**.

**Token efficiency** matters. Shorter prompts cost less than longer ones. Tighter **output limits** prevent the model from rambling. **Summarizing context** rather than including full documents reduces input tokens. These optimizations compound—a 50% reduction in average tokens processed is a 50% reduction in model costs.

**Dimension reduction** for embeddings cuts vector storage costs. **Titan Embeddings V2** supports configurable dimensions—**512 dimensions instead of 1024** retains **99% of retrieval accuracy** while halving storage costs. For large vector stores with millions of documents, this saves significant money.

**Monitoring token usage** by feature, user, and tenant enables informed decisions. You might discover that one feature accounts for 80% of your AI costs—that's where optimization efforts should focus. **Per-tenant tracking** enables accurate billing for multi-tenant applications.

---

## Network Architecture and Private Connectivity

By default, when your Lambda function or EC2 instance calls the Bedrock API, the traffic travels over the **public internet**. It's encrypted with TLS, so the content is protected, but the request leaves your VPC, traverses the internet, and enters AWS's public API endpoints. For many workloads, this is fine. For regulated industries, sensitive data, or security-conscious organizations, it's not acceptable.

### VPC Endpoints for Bedrock

**Interface VPC Endpoints** (powered by **AWS PrivateLink**) keep traffic entirely within the AWS network. When you create an interface endpoint for Bedrock in your VPC, AWS provisions elastic network interfaces (ENIs) in your specified subnets. Your applications connect to Bedrock through these private IP addresses rather than public endpoints.

The difference matters for several reasons:

1. **No internet gateway required** — Your private subnets can access Bedrock without NAT gateways or internet gateways
2. **Network isolation** — Traffic never leaves the AWS network, reducing exposure to internet-based threats
3. **Compliance** — Many security frameworks require private connectivity for sensitive workloads
4. **Predictable latency** — Eliminating internet hops can reduce latency variability

### Interface Endpoints vs Gateway Endpoints

AWS offers two types of VPC endpoints, and understanding the difference prevents costly mistakes:

**Gateway Endpoints** are free and work only for **S3** and **DynamoDB**. They add entries to your route tables, directing traffic to these services through AWS's network. You can't use gateway endpoints for Bedrock.

**Interface Endpoints** work for most other AWS services, including Bedrock. They create ENIs in your subnets with private IPs. They cost **$0.01/hour per AZ** plus **$0.01/GB** of data processed. For high-volume Bedrock usage, this adds up—but it's usually worth it for security-sensitive workloads.

### PrivateLink Architecture

When you create an interface endpoint for Bedrock, here's what happens:

```
Your VPC                          AWS Network
┌─────────────────────────┐      ┌─────────────────────────┐
│  Lambda/EC2             │      │                         │
│       │                 │      │    Bedrock Service      │
│       ▼                 │      │         ▲               │
│  ENI (10.0.1.x)    ─────┼──────┼─────────┘               │
│  (Interface Endpoint)   │      │                         │
└─────────────────────────┘      └─────────────────────────┘
```

The ENI appears in your VPC with a private IP. DNS resolution can be configured to automatically resolve `bedrock-runtime.us-east-1.amazonaws.com` to this private IP. Your application code doesn't change—it still calls the same endpoint, but traffic routes privately.

### Security Groups for Endpoints

Interface endpoints have security groups. You control which resources in your VPC can access Bedrock by configuring inbound rules. A typical pattern:

- Allow inbound HTTPS (port 443) from your application's security group
- Deny everything else

This creates an additional layer of access control beyond IAM—even if a compromised resource has valid IAM credentials, it can't reach Bedrock unless it's in an allowed security group.

### Multi-Account Architectures

Large organizations often centralize AI services in a shared account. **Resource Access Manager (RAM)** can share interface endpoints across accounts, or you can use **VPC peering** or **Transit Gateway** to route from spoke accounts to a central endpoint.

The **hub-and-spoke pattern** reduces endpoint costs (one set of endpoints instead of many) and centralizes security controls. The tradeoff is added network complexity and potential single points of failure.

---

## Service Quotas and Capacity Management

Bedrock has quotas that limit how many requests you can make and how much throughput you can consume. Understanding these limits prevents production surprises.

### Types of Quotas

**Requests per minute (RPM)** — How many API calls you can make per minute. Exceeding this returns **ThrottlingException**.

**Tokens per minute (TPM)** — Total tokens (input + output) processed per minute. Models have separate input and output token quotas.

**Model units** — For Provisioned Throughput, you purchase capacity in model units. Each unit provides a specific amount of throughput.

### Default Quotas

Default quotas vary by model and region. For on-demand Claude 3 Sonnet in us-east-1, typical defaults are:

- **RPM**: 100-400 requests/minute (varies)
- **Input TPM**: 40,000-200,000 tokens/minute
- **Output TPM**: 40,000-100,000 tokens/minute

These are **starting points**, not hard limits. You can request increases through the **Service Quotas** console or API.

### Quota Management Patterns

**Monitor before you need more**. CloudWatch metrics like `InvocationCount`, `InvocationLatency`, and `ThrottledCount` show how close you are to limits. Set alarms at 80% utilization so you can request increases proactively.

**Request increases before launch**. Quota increases aren't instant—they require AWS review and can take days. Don't wait until you're throttled in production.

**Use multiple models**. If you're hitting quotas on Sonnet, consider routing simpler requests to Haiku, which has separate quotas. This naturally load-balances across capacity pools.

**Implement backoff and retry**. When you hit quotas, requests fail with ThrottlingException. Proper exponential backoff with jitter spreads retries over time instead of hammering the API.

### Cross-Account Quota Considerations

Quotas are per-account, per-region. In multi-account architectures, each account has independent quotas. A central AI services account might need much higher quotas than spoke accounts that route through it.

**Dedicated accounts for AI** sometimes make sense—they isolate quota consumption, simplify cost tracking, and can have specialized IAM policies.

### Provisioned Throughput vs Quotas

Provisioned Throughput isn't about quotas—it's about **guaranteed capacity**. Even if you haven't hit your on-demand quota, during high-demand periods you might experience throttling because shared capacity is constrained. Provisioned Throughput reserves dedicated capacity that's always available.

Think of quotas as **permission to use capacity** and Provisioned Throughput as **reservation of capacity**. You need both: quota allows the request, and capacity processes it.

---

## Selecting the Right Integration Approach

Architecture decisions should flow from **requirements**, not preferences. Before choosing patterns and services, clarify what you're building and for whom.

**Interactive applications** serving end users have strict **latency requirements**. Users expect responses in seconds, not minutes. Streaming is essential. Provisioned Throughput may be necessary for consistent performance. The gateway pattern provides the operational controls needed for production.

**Batch processing applications** have different constraints. Latency is measured in hours, not seconds. **Throughput** and **cost efficiency** matter more than response time. Event-driven architectures with SQS and batch inference optimize for these priorities.

**Multi-tenant SaaS applications** need **isolation**. Each tenant's usage should be trackable for billing. Guardrails and prompts might vary by tenant. **Rate limiting** should prevent one tenant from impacting others. API Gateway **usage plans**, per-tenant configuration in your application layer, and careful prompt management address these needs.

**Regulated industries** add **compliance requirements**. Healthcare needs **HIPAA**. Finance needs **SOC 2**. Government might need **FedRAMP**. **Data residency** requirements might constrain which regions you can use. **Audit logging** becomes mandatory rather than optional.

Start every architecture discussion with questions: Who are the users? What does success look like? What's the budget? What happens if the system fails? What regulations apply? The answers constrain your options and make the right patterns obvious.

---

## Designing Proof of Concept Solutions

**Proof-of-concepts** exist to learn, not to impress. The goal is validating hypotheses with minimal investment, not building production-ready systems.

Start in **Bedrock's playground**. Before writing any code, test prompts interactively. Try different models. Explore how the model responds to variations in your inputs. Discover **edge cases** and **failure modes**. This learning costs nothing but time and grounds your development in real model behavior rather than assumptions.

Your first code should be **minimal**: a Lambda function that calls Bedrock and returns the response. No authentication (beyond IAM), no error handling beyond basic try/catch, no monitoring beyond CloudWatch's automatic Lambda logging. The goal is proving that your approach works at all, not building infrastructure.

**Document learnings** obsessively. Which prompts worked and which didn't? What surprised you about model behavior? Which edge cases caused problems? What questions remain unanswered? These observations guide the transition from PoC to production—and they're easily forgotten if not recorded.

The most common PoC mistake is **over-engineering**. Adding authentication, caching, monitoring, and error handling before validating the core hypothesis wastes effort and slows learning. If the fundamental approach doesn't work, all that infrastructure is useless. Prove the concept first, then add production capabilities.

**Time-box your PoC**. Set a deadline—one week, two weeks—and commit to a decision by then. Infinite exploration isn't useful. Decide whether to proceed, pivot, or abandon, and move on.

---

## Standardizing AI Practices Across Organizations

As AI usage spreads across an organization, chaos follows without standardization. Different teams write different prompts for similar tasks. Quality varies wildly. Best practices don't propagate. Costs spiral as each team reinvents wheels.

**Bedrock Prompt Management** provides a **single source of truth** for prompts. Teams reference shared prompts rather than copying and modifying them. When a prompt improves, everyone benefits immediately. **Version history** enables debugging when quality changes. **Access controls** ensure only authorized personnel can modify prompts affecting production systems.

**Organization-wide guardrails** establish a safety floor. Define **content filters**, **PII rules**, and **topic restrictions** that apply to all AI applications. Individual teams can add stricter rules for their use cases, but the baseline ensures nothing falls below acceptable standards.

**Shared Lambda layers** package common functionality: **token counting**, **error handling**, **logging**, **guardrail invocation**. When you fix a bug or improve performance, all applications using the layer benefit. This prevents the proliferation of subtly different implementations that diverge over time.

The **GenAI Lens** belongs in **design reviews**. Before any AI application reaches production, review it against the lens's questions. Does it address all five pillars? Are prompts versioned and tested? Are guardrails configured appropriately? Is cost monitoring in place? These reviews catch problems early, when they're cheap to fix.

**Centers of excellence** can accelerate adoption. A small team of GenAI experts who consult across the organization spreads knowledge faster than documentation alone. They review architectures, share patterns, debug problems, and train others. The investment in this team pays back through faster, better adoption across the organization.

---

## Service Comparison: Bedrock vs. SageMaker

AWS offers two primary services for machine learning and AI: **Bedrock** and **SageMaker**. Understanding when to use each is essential for making good architectural decisions.

**Amazon Bedrock** is a **fully managed service** for accessing **foundation models**. You make API calls; AWS handles everything else. There's no infrastructure to provision, no endpoints to manage, no scaling to configure. Bedrock offers models from **Anthropic (Claude)**, **Meta (Llama)**, **Amazon (Titan)**, and others through a unified API. For most GenAI use cases—chatbots, RAG, content generation, classification—Bedrock is the right choice.

**Amazon SageMaker** is a complete **machine learning platform**. You can **train custom models**, deploy them on managed infrastructure, run experiments, build pipelines, and manage the full **ML lifecycle**. SageMaker requires more expertise and operational effort, but provides capabilities Bedrock doesn't: **custom model training**, **specialized inference hardware**, fine-grained control over deployment configuration.

The decision framework is straightforward:

**Use Bedrock when:**
- You want to use **pre-trained foundation models** (Claude, Llama, Titan)
- You're doing standard GenAI tasks: generation, summarization, analysis, embedding
- You want **minimal operational overhead**
- You're fine-tuning foundation models (using Bedrock's fine-tuning)
- **Time to market** matters more than ultimate control

**Use SageMaker when:**
- You're **training models from scratch**
- You need **specialized model architectures** not available in Bedrock
- You need specific hardware (custom GPU configurations, **Inferentia**)
- You have ML engineering expertise and want **full control**
- Your use case requires capabilities Bedrock doesn't support

For the exam and for most real-world scenarios, **Bedrock is the default choice**. SageMaker comes into play for specialized requirements that Bedrock can't meet.

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "MOST operationally efficient" | Managed services. **Bedrock** over SageMaker. **Serverless** over containers. |
| "architect for scalability" | Serverless: **Lambda**, **Bedrock on-demand**, **API Gateway** |
| "production-ready" | **API Gateway** + **Guardrails** + **CloudWatch** + **IAM** |
| "decoupled" or "asynchronous" | **SQS**, **EventBridge**, event-driven pattern |
| "real-time chat" or "interactive" | **Streaming** with **WebSocket API Gateway** |
| "consistent latency" or "SLA" | **Provisioned Throughput** |
| "bulk processing" or "non-real-time" | **Batch Inference** |
| "fine-tuned model" or "custom model" | Requires **Provisioned Throughput** |
| "high availability" or "resilience" | **Cross-Region Inference** |
| "cost optimization" | **Model cascading**, **batch inference**, **token monitoring** |
| "private connectivity" or "no internet" | **Interface VPC Endpoint** with PrivateLink |
| "throttling" or "rate limits" | **Service Quotas**, request increases proactively |
| "compliance" or "data residency" | **VPC Endpoints** + **Cross-Region Inference** (respects geography) |

---

## Key Takeaways

> **1. Start with requirements, then pick patterns.**
> Architecture flows from use cases, not the other way around. Understand who your users are, what latency they expect, and what budget constraints exist before choosing services and patterns.

> **2. Bedrock is the default for GenAI.**
> SageMaker is for specialized needs. Unless you're training custom models or need specific capabilities Bedrock doesn't offer, Bedrock's managed approach saves significant operational effort.

> **3. The gateway pattern is production-ready.**
> Direct integration is fine for prototypes, but API Gateway provides throttling, caching, monitoring, and decoupling that production systems need.

> **4. Streaming transforms user experience.**
> For any interactive AI application, streaming responses are essentially mandatory. Users expect to see text appear progressively.

> **5. Cross-Region Inference provides easy resilience.**
> Use **inference profile ARNs** instead of model IDs and get automatic failover without architectural complexity.

> **6. Model selection is a cost lever.**
> The difference between Haiku and Opus is **60x in cost**. Match model capability to task requirements.

> **7. Standardize before scaling.**
> **Prompt Management**, shared guardrails, and common patterns prevent chaos as AI usage grows across an organization.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Using SageMaker when Bedrock would suffice** | SageMaker's flexibility comes with operational overhead. Bedrock is almost always the better choice for standard GenAI tasks. |
| **Over-engineering proof of concepts** | PoCs are for learning, not demonstrating engineering prowess. Every feature you add slows down the learning cycle. |
| **Forgetting Cross-Region Inference** | It's a simple configuration change that dramatically improves resilience for high-availability applications. |
| **Not streaming for chatbots** | Users expect **progressive text generation**. A non-streaming chatbot feels slow and broken. |
| **Teams building prompts independently** | Without centralized **Prompt Management**, quality varies and best practices don't propagate. |
| **Assuming on-demand is always available** | During high demand, requests may be **throttled**. Consider **Provisioned Throughput** for consistent latency. |
| **Ignoring the GenAI Lens in design reviews** | The lens captures lessons from many deployments. Skipping it means learning the hard way through incidents. |
| **Not requesting quota increases before launch** | Quota increases take time for AWS to review. Request proactively, not when you're already throttled. |
| **Using Gateway Endpoints for Bedrock** | Gateway endpoints only work for S3 and DynamoDB. Bedrock requires **Interface VPC Endpoints**. |
