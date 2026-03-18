# Model Selection for GenAI

**Domain 1 | Task 1.2 | ~35 minutes**

---

## Why This Matters

Picking the wrong model is like using a sledgehammer to hang a picture frame. You'll get it done, but you'll pay way too much and probably break something in the process. The difference between choosing wisely and choosing poorly can mean the difference between a GenAI project that costs $500 per month and one that costs $50,000—while delivering identical results to your users.

Knowing when to use a small, fast model versus when you actually need the heavy artillery is one of the most important skills in GenAI development. The companies that get this right build sustainable AI products. The ones that don't either bleed money or give up on GenAI entirely because "it's too expensive." Get this right and you'll save money while getting better results. Get it wrong and you'll wonder why your AWS bill looks like a phone number.

---

## Understanding Model Capabilities

Not all AI models are created equal, and understanding their differences goes far beyond reading marketing materials or comparing benchmark scores. Some models are quick and cheap, optimized for high-throughput scenarios where you need thousands of responses per minute. Others are slow and expensive but capable of reasoning that approaches human expert level. The art of model selection lies in matching capabilities to requirements—and resisting the temptation to always reach for the biggest hammer.

### Context Window: The Model's Working Memory

The context window determines how much text a model can see at once, and this constraint shapes everything about how you architect your application. When you send a request to a model, the context window is the total space available for your system prompt, your user's message, any retrieved documents or conversation history, and the model's response. Go over this limit and your request fails. Get close to it and you're paying for tokens you might not need.

Claude 3 models offer a 200,000 token context window—that's roughly 150,000 words, or an entire novel. You could paste a complete legal contract, a company's entire employee handbook, or a full technical specification document and still have room for a detailed question and response. This massive context window enables use cases that simply weren't possible with earlier models: analyzing entire codebases, comparing multiple long documents side-by-side, or maintaining extensive conversation histories without summarization.

Smaller models might only offer 4,000 to 8,000 tokens—a few pages at most. If you're analyzing long documents with these models, you'll need to implement chunking strategies, summarize previous content, or accept that the model simply can't see everything it needs to make informed decisions. This isn't necessarily a dealbreaker; many tasks don't require large contexts. But if your use case involves lengthy inputs, context window size becomes a primary selection criterion rather than an afterthought.

### Speed vs. Smarts: The Fundamental Trade-off

Every model sits somewhere on a spectrum between raw speed and cognitive capability, and understanding this trade-off is essential for cost-effective architecture.

Large models like Claude Opus represent the pinnacle of current AI capability. They excel at complex reasoning chains that require holding multiple concepts in mind simultaneously. They catch subtle errors that smaller models miss entirely. They write with nuance and style that feels genuinely thoughtful. They can debug intricate code, analyze legal documents for hidden implications, or craft customer communications that navigate delicate situations with appropriate sensitivity.

The cost of this capability? Opus responses typically take 5-15 seconds rather than milliseconds. And the per-token cost runs roughly 15x higher than the smallest models. For a simple classification task, you might pay $0.15 per thousand requests with Opus versus $0.01 with Haiku—a difference that compounds dramatically at scale.

Small models like Claude Haiku occupy the opposite end of this spectrum. They're blazing fast, often returning responses in 200-500 milliseconds. They cost a fraction of larger models. They're perfect for high-volume scenarios where you're processing thousands of requests per minute and even small per-request costs add up to significant monthly bills.

Where do small models struggle? Complex multi-step reasoning. Tasks that require understanding subtle implications. Situations where the "obvious" answer isn't quite right and the model needs to think more deeply. Ask Haiku to classify an email as spam or not-spam and it performs brilliantly. Ask it to analyze whether a customer's frustrated tone suggests they're about to churn and recommend a retention strategy—that's where you need the bigger models.

### The Key Insight Most Teams Miss

Here's the truth that saves companies thousands of dollars: **most tasks don't need the big model**. Development teams consistently over-provision because they're nervous about quality, but the data tells a different story.

Classifying an email as urgent or routine? A small model handles this with 95%+ accuracy, responding in under 300 milliseconds. Extracting a customer name and email from a support ticket? Small model, near-perfect accuracy. Summarizing a single paragraph into a bullet point? Small model, perfectly adequate results. Generating a simple SQL query from a natural language description? Small model, reliable output.

The pattern is clear: structured, well-defined tasks with clear success criteria are small-model territory. Save the large models for genuinely complex reasoning—legal document analysis where missing a clause has real consequences, code debugging where the bug could be anywhere, customer communications where tone and nuance matter, or creative tasks where the difference between "acceptable" and "excellent" actually impacts your business.

Think of it like staffing a company. You don't need a PhD to answer the phone, but you do need one to design the rocket engine. The same logic applies to model selection: match the capability to the complexity.

---

## Evaluating and Comparing Models

Don't pick a model because it sounds impressive in a press release or because marketing claims it's the best. Benchmarks are useful starting points, but they measure performance on standardized tasks that may bear little resemblance to your actual use cases. The only evaluation that matters is testing with YOUR data and YOUR specific requirements.

### Bedrock Model Evaluations: The Systematic Approach

Bedrock Model Evaluation transforms model comparison from guesswork into data-driven decision making. Instead of running informal tests and relying on gut feelings, you create a structured evaluation that produces quantifiable, reproducible results.

The process starts with building a test dataset—examples of real inputs you'll send to the model in production, paired with the expected outputs or reference answers. This dataset lives in S3 in JSONL format (one JSON object per line), making it easy to version, update, and reuse across evaluations.

For a summarization task, your dataset might look like this:

```json
{"prompt": "Summarize: The quick brown fox jumped over the lazy dog while the cat watched from the windowsill.", "referenceResponse": "A fox jumped over a dog while a cat observed."}
{"prompt": "Summarize: In 1969, Neil Armstrong became the first human to walk on the moon, marking a defining moment in space exploration history.", "referenceResponse": "Armstrong made history as the first person on the moon in 1969."}
{"prompt": "Summarize: The mitochondria, often called the powerhouse of the cell, generates most of the cell's supply of ATP through oxidative phosphorylation.", "referenceResponse": "Mitochondria produce cellular energy through ATP generation."}
```

For RAG evaluations, you'd include the retrieved context that the model should use when generating its response. This allows you to separately measure retrieval quality and generation quality:

```json
{"prompt": "What is the refund policy?", "context": "Our refund policy allows returns within 30 days of purchase. Items must be unused and in original packaging. Refunds are processed within 5-7 business days.", "referenceResponse": "Returns are accepted within 30 days for unused items in original packaging, with refunds processed in 5-7 business days."}
```

Your dataset should include at least 10 examples, though 100 or more provides much more reliable results. Include typical cases that represent the bulk of your traffic, edge cases that stress-test the model's capabilities, and adversarial examples designed to expose weaknesses.

### Choosing the Right Metrics

Bedrock supports three categories of evaluation metrics, each with different trade-offs between cost, speed, and nuance.

**Automatic metrics** compute scores without human involvement. ROUGE measures n-gram overlap between the model's output and your reference response—useful for summarization where you care about capturing key phrases. BERTScore uses embeddings to compare semantic similarity, catching cases where the model used different words to express the same meaning. F1 Score balances precision and recall for classification tasks. Exact Match provides binary feedback for extraction tasks where you need specific values.

The appeal of automatic metrics is obvious: they're fast, cheap, and consistent. Run them against a thousand examples and you get results in minutes. The limitation is equally obvious: they can miss nuance. A response might be perfectly correct but phrased differently than your reference, scoring poorly on ROUGE. A response might score well on BERTScore despite containing a subtle factual error.

**Human evaluation** brings judgment that metrics can't replicate. You define criteria—helpfulness, accuracy, tone, relevance—and human reviewers rate responses on Likert scales (1-5), binary judgments (yes/no), or comparative rankings (response A vs B). Human evaluation catches subtleties that automatic metrics miss entirely: Was the response appropriately empathetic? Did it address the user's underlying concern, not just their stated question? Would this response satisfy a customer or frustrate them?

The trade-off: human evaluation is slow and expensive. Each response needs human attention, which means either paying reviewers or diverting your team's time. Reserve human evaluation for high-stakes applications where quality differences have real business impact—customer-facing communications, medical information, legal advice, or anywhere that mistakes carry significant consequences.

**LLM-as-a-Judge** occupies an interesting middle ground. You use a foundation model to evaluate another model's outputs based on criteria you define. The judge model reads the prompt, the response, and your evaluation criteria, then provides scores and explanations.

```json
{
  "evaluationCriteria": "Rate the response on accuracy (1-5), helpfulness (1-5), and safety (1-5). Explain your reasoning for each score."
}
```

LLM-as-judge runs faster than human evaluation and provides more nuanced feedback than automatic metrics. It can explain why a response scored poorly, helping you improve prompts or identify patterns in failures. The limitation is that judge models have their own biases—they may favor responses that match their own style or make similar mistakes to the models being evaluated. Use LLM-as-judge as a screening layer, then validate surprising results with human review.

### RAG-Specific Metrics: Evaluating Retrieval-Augmented Generation

Standard metrics weren't designed for RAG systems, where failures can occur at multiple points in the pipeline. A RAG system might retrieve the wrong documents, or retrieve the right documents but ignore them, or faithfully use the documents but answer a different question than the user asked. Bedrock's RAG-specific metrics isolate these failure modes.

**Context Relevance** measures whether your retrieval actually found relevant documents. If this score is low, your vector search isn't working—maybe your embeddings don't capture the right semantics, your chunking is too coarse, or your knowledge base lacks the information users need. This is a retrieval problem, not a generation problem.

**Faithfulness** (also called Groundedness) measures whether the model's response is actually supported by the retrieved context. Low faithfulness indicates hallucination—the model is making things up rather than using the documents you provided. This is critical because hallucinated responses often sound confident and plausible while being completely wrong. High faithfulness means the model is quoting from and reasoning over the retrieved documents rather than falling back on its training data or imagination.

**Answer Relevance** measures whether the response actually addresses the user's question. A response might be perfectly faithful to the retrieved context but still miss the point. If someone asks "How do I reset my password?" and the model responds with accurate but off-topic information about password security best practices, answer relevance would be low.

**Answer Correctness** measures factual accuracy against your reference answers. This requires you to provide ground truth in your evaluation dataset, but when available, it provides the most direct measure of whether your RAG system is giving correct information.

### Running an Evaluation Job

The workflow is straightforward: prepare your dataset, configure the job, run it, and analyze results.

```typescript
const response = await bedrockClient.createEvaluationJob({
  jobName: 'claude-model-comparison',
  roleArn: 'arn:aws:iam::123456789012:role/BedrockEvalRole',
  evaluationConfig: {
    automated: {
      datasetMetricConfigs: [{
        taskType: 'Summarization',
        metricNames: ['Rouge', 'BertScore']
      }]
    }
  },
  inferenceConfig: {
    models: [
      { modelIdentifier: 'anthropic.claude-3-haiku-20240307-v1:0' },
      { modelIdentifier: 'anthropic.claude-3-sonnet-20240229-v1:0' },
      { modelIdentifier: 'anthropic.claude-3-5-sonnet-20241022-v2:0' }
    ]
  },
  outputDataConfig: {
    s3Uri: 's3://my-bucket/eval-results/'
  }
});
```

This configuration evaluates three Claude models on a summarization task using ROUGE and BERTScore metrics. Results land in S3 where you can download them for analysis or view them in the Bedrock console.

### Interpreting Results: Beyond the Numbers

Raw scores only tell part of the story. The real insights come from digging into patterns.

Look at per-example breakdowns: Does one model consistently fail on certain types of inputs? Maybe Haiku struggles with technical jargon but excels at conversational text. Maybe Sonnet handles ambiguous questions well but occasionally over-explains simple ones. These patterns inform not just model selection but prompt engineering—you might keep using a smaller model if you can adjust your prompts to avoid its weak spots.

Compare accuracy to cost: Model A scores 95% accuracy at $0.01 per request. Model B scores 97% accuracy at $0.10 per request. Is that 2% improvement worth 10x the price? For most applications, no. But for medical advice, legal analysis, or other high-stakes domains? Maybe. The right answer depends entirely on your use case.

Check failure modes: When a model gets something wrong, how wrong is it? A model that occasionally gives slightly imprecise answers might be fine. A model that occasionally gives confidently wrong answers is dangerous. Low-severity failures are tolerable; high-severity failures are not.

### Evaluation Best Practices

**Build representative datasets.** If 80% of your production traffic is simple queries and 20% is complex, your test set should reflect that ratio. Overweighting edge cases makes your evaluation look worse than real-world performance.

**Include adversarial examples.** Add inputs designed to break things—very long prompts, unusual formatting, ambiguous questions, prompts that try to extract system instructions. Models that handle adversarial cases gracefully are more robust in production.

**Version everything.** When you improve your test set, keep the old version. You'll want to track performance over time with consistent baselines. A model that scores 92% on v1 of your dataset and 88% on v2 might have improved—or v2 might just be harder.

**Automate regular evaluation.** Build evaluation into your CI/CD pipeline. When prompts change, when new models release, when you update your training data—run evaluations automatically. Catching regressions early is much cheaper than discovering them in production.

---

## Dynamic Model Selection Patterns

Smart systems don't hardcode model choices—they adapt based on context, cost constraints, and real-time conditions. The techniques in this section separate amateur implementations from production-grade systems.

### Configuration-Driven Selection

Storing model IDs in your source code creates a deployment dependency you don't need. Every time you want to switch models—whether for cost optimization, testing a new release, or responding to an outage—you have to modify code, go through CI/CD, and deploy. That's too slow for operational flexibility.

AWS AppConfig solves this by externalizing configuration. Your code reads the model ID at runtime, and changing models becomes a configuration update rather than a deployment.

```typescript
import { AppConfigDataClient, GetLatestConfigurationCommand, StartConfigurationSessionCommand } from '@aws-sdk/client-appconfigdata';

class ModelConfigProvider {
  private client: AppConfigDataClient;
  private sessionToken: string | undefined;

  constructor() {
    this.client = new AppConfigDataClient({});
  }

  async initialize() {
    const session = await this.client.send(new StartConfigurationSessionCommand({
      ApplicationIdentifier: 'GenAIApp',
      EnvironmentIdentifier: 'Production',
      ConfigurationProfileIdentifier: 'ModelConfig'
    }));
    this.sessionToken = session.InitialConfigurationToken;
  }

  async getModelId(): Promise<string> {
    const response = await this.client.send(new GetLatestConfigurationCommand({
      ConfigurationToken: this.sessionToken!
    }));
    this.sessionToken = response.NextPollConfigurationToken;
    const config = JSON.parse(new TextDecoder().decode(response.Configuration));
    return config.modelId;
  }
}
```

This pattern enables powerful operational capabilities. Want to test a new model with 10% of traffic? Update the configuration to route based on a random value. Want to use different models in different environments? Same code, different configuration values. Want to roll back instantly when something goes wrong? Configuration update, no deployment required.

AppConfig also supports deployment strategies—gradual rollouts where configuration changes propagate slowly, automatic rollback when CloudWatch alarms fire, and validation functions that verify new configurations before they take effect.

### Cascading: The Cost Optimization Pattern

Model cascading is a clever architecture that routes every request to a fast, cheap model first, then escalates only when needed. Most requests resolve at the first tier; only the genuinely difficult cases consume expensive model capacity.

The insight behind cascading is that simple requests don't benefit from more powerful models. If a user asks "What time is it in Tokyo?" or "Convert 100 USD to EUR," Haiku answers just as correctly as Opus—but at 1/15th the cost and 10x the speed. Sending these requests to Opus wastes money without improving outcomes.

```typescript
async function cascadeRequest(prompt: string): Promise<string> {
  // First tier: fast and cheap
  const tier1Response = await invokeModel('anthropic.claude-3-haiku-20240307-v1:0', prompt);

  // Check confidence signals
  const needsEscalation = detectLowConfidence(tier1Response);

  if (!needsEscalation) {
    return tier1Response;
  }

  // Second tier: more capable
  const tier2Response = await invokeModel('anthropic.claude-3-5-sonnet-20241022-v2:0', prompt);
  return tier2Response;
}

function detectLowConfidence(response: string): boolean {
  // Explicit uncertainty phrases
  const uncertaintyPhrases = [
    "I'm not certain",
    "I'm not sure",
    "it's unclear",
    "I don't have enough information",
    "this is ambiguous"
  ];

  for (const phrase of uncertaintyPhrases) {
    if (response.toLowerCase().includes(phrase)) {
      return true;
    }
  }

  // Very short responses might indicate the model struggled
  if (response.length < 50) {
    return true;
  }

  // You could add more sophisticated signals:
  // - Classifier confidence scores
  // - Response pattern matching
  // - Domain-specific heuristics

  return false;
}
```

The key to effective cascading is defining clear escalation criteria. Explicit uncertainty phrases are the most reliable signal—when the model says "I'm not sure," believe it. Very short responses can indicate the model didn't know what to say. Domain-specific patterns might indicate low confidence: hedging language, overly generic responses, or answers that don't quite address the question.

Well-tuned cascading can cut costs by 60-80% while maintaining quality on complex requests. The exact savings depend on your traffic mix—if most requests are complex, you won't save much. But most production workloads are dominated by straightforward requests that small models handle perfectly.

### A/B Testing: Learning from Production

Benchmarks measure performance on test data. A/B testing measures what actually matters: real user outcomes.

Route a percentage of production traffic to each model variant and measure business metrics. Which model produces higher user satisfaction ratings? Better task completion rates? Fewer escalations to human agents? Lower complaint rates?

These metrics reveal truths that benchmarks miss. A model might score lower on academic evaluations but produce more satisfying customer interactions. A model might seem equivalent in testing but show subtle differences at scale—maybe one model's errors cluster in a specific domain that matters to your users.

Implementation is straightforward: use AppConfig or feature flags to route traffic, then correlate model assignments with outcome metrics in your analytics pipeline.

### Fallback Patterns: Graceful Degradation

Models fail. Regions experience outages. Latency spikes during high-demand periods. Your application should handle these scenarios gracefully rather than crashing spectacularly.

The simplest fallback is a backup model. If your primary model times out or returns an error, retry with an alternative. This might mean falling from Sonnet to Haiku, accepting slightly lower quality in exchange for availability.

```typescript
async function invokeWithFallback(prompt: string): Promise<string> {
  const models = [
    'anthropic.claude-3-5-sonnet-20241022-v2:0',
    'anthropic.claude-3-haiku-20240307-v1:0',
    'amazon.titan-text-lite-v1'
  ];

  for (const modelId of models) {
    try {
      return await invokeModelWithTimeout(modelId, prompt, 10000);
    } catch (error) {
      console.warn(`Model ${modelId} failed, trying next fallback`);
      continue;
    }
  }

  // All models failed - return cached response or error
  return getCachedResponse(prompt) || "I'm temporarily unable to process your request. Please try again.";
}
```

Caching common responses in ElastiCache or CloudFront provides another fallback layer. If you know certain questions appear frequently, pre-compute responses and serve them instantly when models are unavailable.

For some applications, rule-based fallbacks make sense. If AI is unavailable, fall back to keyword matching, decision trees, or simple heuristics. The response won't be as good, but users get something rather than nothing.

---

## Model Customization Lifecycle

Sometimes base models aren't quite right for your use case. Before jumping to customization, exhaust prompt engineering—it's faster, cheaper, and often sufficient. But when prompts aren't enough, AWS provides several customization options with different trade-offs.

### Fine-Tuning: Teaching New Behaviors

Fine-tuning adjusts a model's behavior through examples. You show the model hundreds of input-output pairs that demonstrate exactly how you want it to respond, and it learns to generalize those patterns.

Common fine-tuning use cases include consistent output formatting—maybe you need responses in a specific JSON schema, or with particular section headers, or in a distinctive voice. Another use case is domain-specific behavior: legal responses that cite precedents appropriately, medical responses that use correct terminology, customer service responses that match your brand voice.

The mechanics are straightforward: prepare a JSONL file with input-output pairs, upload it to S3, configure the fine-tuning job with hyperparameters (learning rate, epochs, batch size), and let Bedrock handle the infrastructure. Your custom model version appears alongside base models, ready to use with the same APIs.

```json
{"prompt": "Respond to this customer complaint:", "completion": "[Your company's ideal response style]"}
{"prompt": "Summarize this legal document:", "completion": "[Your preferred summary format]"}
```

Fine-tuning requires hundreds to thousands of examples—the more complex the desired behavior, the more examples you need. Quality matters as much as quantity; inconsistent examples produce inconsistent models.

### Continued Pre-Training: Adding Knowledge

Fine-tuning adjusts behavior but doesn't add new knowledge. If your company has proprietary processes, specialized terminology, or domain expertise that doesn't exist in the model's training data, continued pre-training incorporates that knowledge into the model itself.

This approach requires significantly more data than fine-tuning—thousands of documents covering your domain. The model essentially reads your content and learns from it, updating its internal representations to understand your specific context.

Use cases include highly specialized industries (biotechnology, advanced manufacturing, niche legal areas), company-specific products and processes, or domains with terminology that has specialized meanings different from common usage.

### Custom Model Import: Bring Your Own Model

Bedrock Custom Model Import lets you deploy models trained outside AWS on Bedrock's infrastructure. You might have a model fine-tuned on Hugging Face, trained with your own infrastructure, or sourced from a specialized vendor.

Supported formats include Hugging Face models and GGUF (the format used by llama.cpp). The model goes through validation to ensure compatibility, then deploys on Provisioned Throughput—you pay for reserved capacity rather than per-token.

This matters because Provisioned Throughput is required for imported models. You can't use on-demand pricing with custom imports, which changes the economics. Custom import makes sense when you've invested significantly in model development and want to use Bedrock's infrastructure, or when you need a specialized model that isn't available through Bedrock's marketplace.

### LoRA Adapters: Efficient Customization

Low-Rank Adaptation (LoRA) provides an efficient alternative to full fine-tuning. Instead of updating millions of model parameters, LoRA trains small adapter layers that modify the model's behavior. These adapters are faster to train, smaller to store, and can be swapped at inference time.

The practical benefit: one base model, multiple personalities. You might have a customer service adapter, a technical writing adapter, and a legal review adapter—all using the same underlying model but optimized for different tasks. Switch adapters based on the request type without loading different models.

### The Model Registry: Version Control for Models

As you create custom model versions, tracking becomes critical. Which training data produced each version? How did performance compare across iterations? If the new version performs worse than expected, can you roll back instantly?

Bedrock maintains metadata about your custom models: training job details, evaluation results, deployment history. Combine this with your own documentation practices—detailed notes about what each version was intended to improve, what dataset changes were made, what the evaluation showed.

### The Golden Rule of Customization

**Prompt engineering first, always.**

Many teams jump to "we need to fine-tune" when the real problem is "we need better prompts." Fine-tuning requires collecting training data, running training jobs, evaluating results, potentially iterating multiple times—a process measured in weeks and thousands of dollars.

Good prompt engineering costs nothing but time. Adding few-shot examples, improving instructions, restructuring prompts, adjusting system messages—these changes deploy instantly and often solve the problem entirely.

Ask yourself: have we really exhausted prompt options? Have we tried ten different prompt formulations? Have we added examples? Have we broken the task into smaller steps? Only when the answer to all these questions is "yes, and it's still not working" should you consider fine-tuning.

---

## Designing Failover and Resilience

Models fail. Regions go down. Latency spikes during high-demand periods. Capacity runs out when everyone wants to use AI at once. Building resilient systems means planning for these scenarios before they happen.

### Cross-Region Inference: The Easy Button

Cross-Region Inference is one of the most important resilience features Bedrock offers, and it's surprisingly simple to use. Instead of specifying a model ID that locks you to a single region, you use an inference profile ARN that allows Bedrock to route requests to available capacity across regions.

Here's how it works. When you invoke a model using an inference profile, Bedrock checks capacity in your specified region. If that region is constrained—high demand, partial outage, maintenance—Bedrock automatically routes to another region with available capacity. Your code doesn't know the difference; the response comes back just like a normal invocation.

The inference profile ARN format tells you everything you need to know:

```
arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-sonnet-20240229-v1:0
```

Notice the `us.` prefix on the model identifier. This indicates a US-based profile that routes across US regions (us-east-1, us-west-2, us-east-2, etc.). EU profiles use the `eu.` prefix and route across EU regions. AP profiles use `ap.` and route across Asia-Pacific regions.

This geographic scoping matters enormously for compliance. Data never leaves its geographic area. A US profile will never route to EU regions, and vice versa. This makes Cross-Region Inference compatible with GDPR, data sovereignty requirements, and other regulatory constraints that mandate geographic data residency.

Using inference profiles in code requires minimal changes:

```typescript
// Without Cross-Region Inference (locked to one region)
const response = await client.invokeModel({
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  body: payload
});

// With Cross-Region Inference (automatic failover)
const response = await client.invokeModel({
  modelId: 'arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-sonnet-20240229-v1:0',
  body: payload
});
```

When does Cross-Region Inference help? Capacity constraints during high-demand periods, regional service issues, latency optimization (routing to the region with best current performance). When doesn't it help? It doesn't change model quotas (still per-account, per-region), pricing (same cost regardless of actual region), or model availability (model must be available in target regions).

**System-defined profiles** are AWS-managed and automatically handle cross-region routing. You just use the `us.`, `eu.`, or `ap.` prefix. **Application inference profiles** let you create custom routing behavior or associate profiles with specific configurations.

For the exam, this is critical: **inference profile ARN = Cross-Region Inference = automatic regional failover**. When you see questions about high availability, regional resilience, or failover for Bedrock, Cross-Region Inference is usually the answer.

### Circuit Breakers: Preventing Cascade Failures

When a model starts failing, continuing to send requests makes things worse. You're wasting time waiting for timeouts, potentially paying for requests that will fail, and putting additional load on an already-struggling system.

Circuit breakers detect failure patterns and temporarily stop sending requests, allowing the system to recover. The pattern has three states:

**Closed** (normal operation): Requests flow through normally. The breaker tracks failure rates.

**Open** (failure detected): When failures exceed a threshold, the breaker "opens" and requests fail immediately without even attempting the model call. This prevents cascade failures and gives the system time to recover.

**Half-open** (testing recovery): After a timeout period, the breaker allows a few test requests through. If they succeed, the breaker closes and normal operation resumes. If they fail, the breaker stays open.

Step Functions can implement circuit breakers with state tracking. Store the circuit state in DynamoDB or Parameter Store, check it before each invocation, and update it based on results.

### Retry Logic: The Right Way

When a request fails, retrying immediately is usually counterproductive. If a thousand requests failed and all retry simultaneously, you're creating a thundering herd that prevents recovery.

The right approach is **exponential backoff with jitter**. Each retry waits longer than the last (exponential backoff), and each wait time is randomized (jitter) to spread retries across time rather than clustering them.

```typescript
async function invokeWithRetry(modelId: string, payload: any, maxRetries: number = 3): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.invokeModel({ modelId, body: payload });
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Exponential backoff with jitter
      const baseDelay = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms...
      const jitter = Math.random() * baseDelay;
      await sleep(baseDelay + jitter);
    }
  }
}
```

---

## Managing Custom Model Lifecycle

Custom models need lifecycle management just like traditional software. Without proper processes, you end up with mystery models that nobody remembers how to reproduce.

### Training Data: The Foundation

Garbage in, garbage out applies doubly to model training. Store training datasets in S3 with versioning enabled, so you know exactly what data produced each model version. Tag datasets with metadata: creation date, source system, preprocessing steps applied, intended use case.

Document data provenance. Where did this data come from? How was it filtered? Who reviewed it for quality? What biases might exist? These questions matter when debugging model behavior months or years later.

### Evaluation: Proving Improvement

Run your standardized test dataset against every custom model version and compare to the base model. Customization should show measurable improvement on your specific metrics—if it doesn't, your prompts might just need work rather than model changes.

Track performance over time. Does the improvement hold as your use cases evolve? New types of queries might reveal gaps in your custom model's training that weren't apparent initially.

### Blue-Green Deployment: Risk Minimization

Deploy new model versions alongside existing ones. Route a small percentage of traffic to the new version while monitoring metrics closely. If problems appear, shift traffic back to the old version instantly. Only after extended observation with no issues do you fully cut over.

Your users never notice the transition because both versions remain available throughout. If the new version performs better, great—gradually increase its traffic share. If it performs worse, you discovered this with minimal user impact and can investigate without urgency.

---

## Model Size Selection Guide

| Criterion | Large Models (Opus/Sonnet) | Small Models (Haiku/Llama 8B) | Custom Fine-tuned |
|-----------|---------------------------|------------------------------|-------------------|
| Best for | Complex reasoning, nuanced writing, code generation, multi-step analysis | Classification, extraction, simple Q&A, high-volume tasks | Domain terminology, specific formats, consistent voice |
| Latency | 1-15 seconds | 100-500ms | Depends on base model |
| Relative cost | 10-20x more expensive | Cheapest per token | Training cost + inference costs |

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "MOST cost-effective" | Start with the smallest model that works. Classification, extraction, simple summarization → Haiku. Consider cascading for mixed workloads. |
| "change models without deployment" | AWS AppConfig (or Parameter Store for simpler cases). Configuration-driven selection. |
| "high availability" or "resilience" | Cross-Region Inference with **inference profile ARN**. Automatic regional failover. |
| "complex reasoning" or "nuanced analysis" | Larger models (Sonnet, Opus). These tasks justify the cost. |
| "specific format" or "consistent style" | Fine-tuning with example input-output pairs. |
| "domain knowledge" or "proprietary terminology" | Continued pre-training with domain documents. |
| "compare models objectively" | Bedrock Model Evaluation with **JSONL test dataset**. |
| "RAG quality" or "hallucination detection" | RAG metrics: **context relevance**, **faithfulness**, **groundedness**. |
| "data residency" or "compliance" | Cross-Region Inference respects geographic boundaries (US→US, EU→EU). |
| "evaluate at scale" | **LLM-as-a-judge** for faster evaluation than human review. |

---

## Key Takeaways

> **1. Match model size to task complexity.**
> Big models for simple tasks waste money. Classification, extraction, and simple Q&A don't need Opus-level reasoning. Most production workloads can use smaller models for 80%+ of requests.

> **2. Test with YOUR data.**
> Bedrock Model Evaluations compares models objectively using your actual use cases, not generic benchmarks. Build representative datasets and automate regular evaluation.

> **3. Use configuration, not code.**
> AWS AppConfig enables model switching without deployment. Gradual rollouts, automatic rollback, environment-specific configs. Never hardcode model IDs.

> **4. Cross-Region Inference is free resilience.**
> Use inference profile ARNs instead of model IDs and get automatic regional failover without architectural complexity. Data stays within geographic boundaries for compliance.

> **5. Prompt engineering before fine-tuning.**
> Many "I need to fine-tune" situations are actually "I need better prompts." Prompts iterate instantly and cost nothing; fine-tuning takes weeks and thousands of dollars.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Defaulting to the biggest model** | Haiku handles most classification and extraction tasks. Using Opus costs 15x more for no benefit on simple tasks. |
| **Fine-tuning before exhausting prompt options** | Fine-tuning takes weeks and costs thousands. Better prompts often solve the problem for free. |
| **Single-region deployment** | When that region has issues, your app goes down. Cross-Region Inference is a simple configuration change that adds automatic failover. |
| **Hardcoding model IDs** | You'll need to redeploy every time you want to switch models. Configuration-driven selection lets you switch instantly. |
| **No fallback plan** | Models fail, regions go down. Without graceful degradation, your users see errors instead of reduced functionality. |
