# Model Selection for GenAI

**Domain 1 | Task 1.2 | ~35 minutes**

---

## Why This Matters

Picking the wrong model is like using a sledgehammer to hang a picture frame. You'll get it done, but you'll pay way too much and probably break something.

Knowing when to use a small, fast model versus when you actually need the big guns is one of the most important skills in GenAI development. Get this right and you'll save money while getting better results.

---

## Understanding Model Capabilities

Not all AI models are created equal. Some are quick and cheap; others are slow and expensive but brilliant. Knowing the difference is half the battle.

### Context Window

How much text the model can see at once.

- **Claude 3**: 200K tokens—that's an entire book
- **Smaller models**: Might only see 4K tokens—a few pages

If you're analyzing long documents, context window size matters a lot. Too small, and you'll need to chop your content into pieces.

### Speed vs. Smarts

The fundamental trade-off.

**Big models** (Claude Opus):
- Incredibly capable—complex reasoning, nuanced writing, catching subtle errors
- Slower (seconds, not milliseconds)
- Cost 10-20x more per token

**Small models** (Claude Haiku):
- Blazing fast and dirt cheap
- Struggle with complex logic

### The Key Insight

**Most tasks don't need the big model.**

- Classifying an email as spam? Small model.
- Extracting a name from text? Small model.
- Summarizing a paragraph? Small model.

Save the big guns for legal document analysis, complex coding tasks, or nuanced customer communications.

Think of it like hiring: you don't need a PhD to answer the phone, but you do need one to design the rocket.

---

## Evaluating and Comparing Models

Don't pick a model because it sounds impressive or because marketing said it's great. Test it with YOUR data and YOUR use cases.

### Bedrock Model Evaluations

Create a test dataset—examples of inputs you'll actually send to the model, with expected outputs (JSONL format).

Pick metrics:
- **Automatic metrics**: ROUGE, BERTScore, F1 (for text similarity/summarization)
- **Human evaluation**: Likert scales, thumbs up/down, ranking
- **LLM-as-a-judge**: Use a foundation model to evaluate another model's outputs
- **RAG-specific**: Context relevance, groundedness, answer correctness

Run evaluations across multiple models and compare results side-by-side.

### The Real Comparison

Model A might be 95% accurate but cost $0.01 per request.
Model B might be 97% accurate but cost $0.10.

Is that 2% worth 10x the price? Usually not.

### Check Latency

Average response time is one thing, but what about the worst case?

A model that averages 500ms but occasionally takes 8 seconds will frustrate users. Look at **p95 latency** (the 95th percentile) to catch these outliers.

### Re-evaluate Regularly

New models drop constantly. What was best-in-class last month might be outdated tomorrow. Build evaluation into your workflow.

---

## Model Evaluation Jobs in Depth

Bedrock Model Evaluation isn't just a feature—it's a systematic approach to comparing models objectively. Understanding how to set up and interpret evaluations is critical for both real projects and the exam.

### Creating a Test Dataset

Your evaluation is only as good as your test data. The format is **JSONL** (JSON Lines)—one JSON object per line:

```json
{"prompt": "Summarize: The quick brown fox...", "referenceResponse": "A fox jumped over a dog."}
{"prompt": "Summarize: In 1969, Neil Armstrong...", "referenceResponse": "Armstrong walked on the moon in 1969."}
{"prompt": "Summarize: The mitochondria is...", "referenceResponse": "Mitochondria produce cellular energy."}
```

For RAG evaluations, include the retrieved context:

```json
{"prompt": "What is the refund policy?", "context": "Our refund policy allows returns within 30 days...", "referenceResponse": "Returns are accepted within 30 days."}
```

**Dataset Requirements**:
- Minimum 10 examples, recommended 100+
- Must include `prompt` field
- `referenceResponse` required for accuracy metrics
- Upload to S3 before starting evaluation

### Evaluation Types

**Automatic Evaluation**

Uses metrics computed without human involvement:

| Metric | Best For | How It Works |
|--------|----------|--------------|
| **ROUGE** | Summarization | Measures n-gram overlap with reference |
| **BERTScore** | Semantic similarity | Uses embeddings to compare meaning |
| **F1 Score** | Classification | Precision/recall balance |
| **Exact Match** | Extraction tasks | Binary—did it match exactly? |

Automatic metrics are fast and cheap but can miss nuance. A response might be correct but phrased differently, scoring poorly on ROUGE.

**Human Evaluation**

Humans rate responses on criteria you define:

- **Likert scales** (1-5): "Rate helpfulness from 1 to 5"
- **Binary**: "Is this response accurate? Yes/No"
- **Ranking**: "Which response is better, A or B?"
- **Thumbs up/down**: Simple preference signal

Human evaluation catches subtleties that metrics miss but is slower and more expensive. Use for high-stakes applications where quality really matters.

**LLM-as-a-Judge**

Use a foundation model to evaluate another model's outputs. You define criteria, and the judge model scores responses.

```json
{
  "evaluationCriteria": "Rate the response on accuracy (1-5), helpfulness (1-5), and safety (1-5)."
}
```

LLM-as-judge is faster than human evaluation and more nuanced than automatic metrics. The tradeoff: judges can have biases and may favor responses similar to their own style.

### RAG-Specific Metrics

When evaluating RAG systems, standard metrics aren't enough. Bedrock provides RAG-specific metrics:

**Context Relevance**: Are the retrieved documents relevant to the query? High relevance means your retrieval is working.

**Faithfulness (Groundedness)**: Is the response supported by the retrieved context? Low faithfulness indicates hallucination—the model is making things up instead of using the provided documents.

**Answer Relevance**: Does the response actually answer the question? A response might be faithful to context but miss the point.

**Answer Correctness**: Is the response factually correct? Requires reference answers in your dataset.

### Running an Evaluation Job

1. **Create your dataset** in JSONL format and upload to S3
2. **Configure the evaluation job**:
   - Select models to evaluate (can compare multiple)
   - Choose metrics (automatic, human, LLM-as-judge)
   - Specify the S3 location for results
3. **Start the job** via console or API
4. **Review results** in the Bedrock console or download from S3

```typescript
const response = await bedrockClient.createEvaluationJob({
  jobName: 'claude-comparison-eval',
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
      { modelIdentifier: 'anthropic.claude-3-sonnet-20240229-v1:0' }
    ]
  },
  outputDataConfig: {
    s3Uri: 's3://my-bucket/eval-results/'
  }
});
```

### Interpreting Results

Evaluation jobs produce detailed reports showing:

- **Per-model scores** for each metric
- **Per-example breakdowns** showing where models succeed or fail
- **Statistical comparisons** between models

Look for patterns:
- Does one model consistently fail on certain types of inputs?
- Is the accuracy difference worth the cost difference?
- Are failures correlated with input length, complexity, or topic?

### Evaluation Best Practices

**Representative data**: Your test set should mirror real usage. If 80% of production queries are simple and 20% are complex, your test set should reflect that.

**Include edge cases**: Add the weird inputs that break things—very long prompts, unusual formatting, ambiguous questions.

**Version your datasets**: When you improve your test set, keep the old version. You'll want to track performance over time with consistent baselines.

**Automate regular evaluation**: Build evaluation into your CI/CD pipeline. When prompts change or new models release, automatically re-evaluate.

---

## Dynamic Model Selection Patterns

Smart systems don't hardcode model choices—they adapt.

### Configuration-Driven Selection

Store model IDs in **AWS AppConfig**, not in code.

```typescript
import { AppConfigClient, GetConfigurationCommand } from '@aws-sdk/client-appconfig';

async function getModelId(): Promise<string> {
  const client = new AppConfigClient({});
  const config = await client.send(new GetConfigurationCommand({
    Application: 'GenAIApp',
    Environment: 'Production',
    Configuration: 'ModelConfig'
  }));
  return JSON.parse(config.Content).modelId;
}
```

Want to switch models? Update the config. No deployment needed.

This also enables gradual rollouts: send 10% of traffic to a new model, watch the metrics, then ramp up if it works.

### Cascading

A clever cost-saver. Send every request to a cheap, fast model first. If it's confident in its answer, use it. If not, escalate.

```typescript
async function cascadeRequest(prompt: string) {
  // Try fast/cheap model first
  const fastResponse = await invokeModel('haiku', prompt);

  // Check if response indicates low confidence
  if (fastResponse.includes('I'm not certain') || fastResponse.length < 50) {
    // Escalate to more capable model
    return await invokeModel('sonnet', prompt);
  }
  return fastResponse;
}
```

Think of it like customer support tiers—most questions get handled by the first line; only tough cases reach the experts.

**Can cut costs by 60-80%** while maintaining quality for hard questions.

### A/B Testing

Compare models in production. Route a percentage of real users to each model and measure what matters: satisfaction ratings, task completion, complaints.

Benchmarks don't capture everything—real users reveal the truth.

### Fallback Patterns

Handle failures gracefully:
- Primary model down? Automatically route to a backup.
- Latency spiking? Switch to a faster alternative.
- Cache common responses to serve when everything fails.

Your app should degrade gracefully, not crash spectacularly.

---

## Model Customization Lifecycle

Sometimes base models aren't quite right. Before customizing, exhaust prompt engineering—it's free.

Still not working? Here are your options.

### Fine-Tuning

Teaches a model new tricks through examples.

Want responses in a specific JSON format? Show it 100+ examples. Need a particular tone? Demonstrate it.

Fine-tuning adjusts behavior without adding new knowledge. In Bedrock, you upload training data (JSONL format), configure the job, and get a custom model version.

### Continued Pre-Training

Adds new knowledge.

If your company has proprietary terminology or processes the model has never seen, continued pre-training incorporates that knowledge.

This requires more data and compute than fine-tuning—we're talking thousands of documents.

### LoRA Adapters

The efficient option.

Instead of updating millions of parameters, LoRA trains small adapter layers. They're faster to train, smaller to store, and can be swapped at inference time.

One base model, multiple personalities.

### Model Registry

Tracks your custom models:
- Which training data produced each version?
- How did performance compare?
- If the new version is worse, roll back instantly.

### Golden Rule

**Prompt engineering first, always.**

Many "I need to fine-tune" situations are actually "I need better prompts." Fine-tuning costs time and money. Prompts are free to iterate.

---

## Assessing Model Requirements

Model assessment isn't guessing—it's measuring.

1. **Build a test dataset** that represents real usage. Include typical cases, edge cases, and your hardest examples.

2. **Define what 'good' means** with metrics. For summarization, use ROUGE scores. For Q&A, measure accuracy against ground truth.

3. **Run Bedrock Model Evaluations** across multiple models. Get a comparison report showing which models perform best on YOUR data.

4. **Factor in cost and latency**. A model that's 3% better but costs 5x more might not be worth it.

---

## Implementing Dynamic Model Selection

Hardcoding model IDs is amateur hour. Production systems need flexibility.

**AWS AppConfig** unlocks powerful patterns:
- Gradual rollout: Send 10% of traffic to a new model, then 50%, then 100%
- Automatic rollback: If error rates spike, revert automatically
- Environment-specific: Use cheaper models in dev, premium in prod

**Parameter Store** works for simpler cases. It stores model IDs securely with IAM access control, but lacks AppConfig's fancy rollout features.

This flexibility matters operationally:
- Model deprecated? Switch instantly.
- Costs too high? Downgrade seamlessly.
- New model released? Test it without code changes.

---

## Designing Failover and Resilience

Models fail. Regions go down. Latency spikes. Your app needs to handle it.

### Cross-Region Inference

The easy button for regional resilience—and one of the most exam-relevant topics for high availability.

Cross-Region Inference automatically routes requests to available regions when your primary region has capacity constraints or issues. Instead of specifying a model ID, you use an **inference profile ARN**.

**How Inference Profiles Work**

An inference profile abstracts the model from the region. Here's the ARN format:

```
arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-sonnet-20240229-v1:0
```

Notice the **`us.`** prefix on the model identifier—this indicates a US-based profile that can route across US regions. When you invoke with this ARN instead of a model ID, Bedrock:

1. Checks capacity in your specified region
2. If constrained, routes to another region in the same geography
3. Returns the response transparently—your code doesn't know the difference

**Geographic Data Residency**

Cross-Region Inference respects compliance boundaries:

| Your Region | Routes To |
|-------------|-----------|
| US regions (us-east-1, us-west-2, etc.) | Other US regions only |
| EU regions (eu-west-1, eu-central-1, etc.) | Other EU regions only |
| AP regions | Other AP regions only |

Data never leaves its geographic area. This is critical for **GDPR**, **data sovereignty**, and compliance requirements.

**When Cross-Region Inference Helps**

- **Capacity constraints**: High demand in one region
- **Regional outages**: Service disruptions in your primary region
- **Latency optimization**: Can route to the region with best current performance

**When It Doesn't Help**

Cross-Region Inference doesn't change:
- **Model quotas** (still per-account, per-region)
- **Pricing** (same cost regardless of actual region)
- **Model availability** (model must be available in target regions)

**Using Inference Profiles in Code**

```typescript
// Instead of this (model ID):
const response = await client.invokeModel({
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  body: payload
});

// Use this (inference profile ARN):
const response = await client.invokeModel({
  modelId: 'arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-sonnet-20240229-v1:0',
  body: payload
});
```

**System-Defined vs Application Inference Profiles**

- **System-defined profiles**: AWS-managed, automatically route across regions. Use the `us.`, `eu.`, or `ap.` prefix.
- **Application inference profiles**: You create these to customize routing behavior or associate with specific configurations.

For the exam, remember: **inference profile ARN = Cross-Region Inference = automatic regional failover**.

### Circuit Breakers

Stop cascade failures.

When error rates spike, stop sending requests (open the circuit). Periodically test if the service recovered. Once it's healthy, resume normal traffic.

Step Functions can implement this pattern with state tracking.

### Graceful Degradation

Keep your app useful when AI is unavailable:
- Serve cached responses for common queries (ElastiCache or CloudFront)
- Fall back to simpler, rule-based logic
- Use a smaller/faster backup model
- Show a friendly message explaining reduced functionality

### Retry Logic

Use **exponential backoff with jitter**.

If 1000 requests fail and all retry simultaneously, you'll cause another failure. Spread retries randomly over time to let the system recover.

---

## Managing Custom Model Lifecycle

Custom models need lifecycle management just like traditional software.

### Training Data

**Garbage in, garbage out.** Store training datasets in S3 with versioning so you know exactly what data produced each model version.

### Fine-Tuning Bedrock Models

1. Prepare a JSONL file with input/output pairs
2. Configure the training job (learning rate, epochs)
3. Bedrock handles the infrastructure
4. Your custom model version appears alongside base models

### Evaluation

Run your test dataset against the custom model and compare to the base model. Customization should show measurable improvement—if it doesn't, your prompts might just need work.

### Blue-Green Deployment

Minimizes risk:
- Run old and new models simultaneously
- Gradually shift traffic
- If problems appear, shift back
- Your users never notice

---

## Model Size Selection Guide

| Criterion | Large Models (Opus/Sonnet) | Small Models (Haiku/Llama 8B) | Custom Fine-tuned |
|-----------|---------------------------|------------------------------|-------------------|
| Best for | Complex reasoning, nuanced writing, code | Classification, extraction, simple Q&A | Domain terminology, specific formats |
| Latency | 1-10+ seconds | 100-500ms | Depends on base model |
| Relative cost | 10-20x more expensive | Cheapest per token | Training + inference costs |

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "MOST cost-effective" | Start small. Classification, extraction, simple summarization → cheap models. Consider cascading. |
| "change models without deployment" | AWS AppConfig (or Parameter Store for simpler cases) |
| "high availability or resilience" | Cross-Region Inference with **inference profile ARN** |
| "complex reasoning" or "nuanced analysis" | Larger models |
| "specific format" or "consistent style" | Fine-tuning |
| "domain knowledge" or "proprietary terminology" | Continued pre-training |
| "compare models objectively" | Bedrock Model Evaluation with **JSONL test dataset** |
| "RAG quality" or "hallucination detection" | RAG metrics: **context relevance**, **faithfulness**, **groundedness** |
| "data residency" or "compliance" | Cross-Region Inference respects geographic boundaries (US→US, EU→EU) |
| "evaluate at scale" | **LLM-as-a-judge** for faster evaluation than human review |

---

## Key Takeaways

> **1. Match model size to task complexity.**
> Big models for simple tasks waste money. Classification, extraction, and simple Q&A don't need Opus-level reasoning.

> **2. Test with YOUR data.**
> Bedrock Model Evaluations compares models objectively using your actual use cases, not generic benchmarks.

> **3. Use configuration, not code.**
> AWS AppConfig enables model switching without deployment. Gradual rollouts, automatic rollback, environment-specific configs.

> **4. Cross-Region Inference is free resilience.**
> Use inference profile ARNs instead of model IDs and get automatic failover without architectural complexity.

> **5. Prompt engineering before fine-tuning.**
> Many "I need to fine-tune" situations are actually "I need better prompts." Prompts are free to iterate; fine-tuning costs time and money.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Defaulting to the biggest model** | Haiku handles most classification and extraction tasks. Using Opus costs 60x more for no benefit. |
| **Fine-tuning before exhausting prompt options** | Fine-tuning takes weeks and costs thousands. Better prompts often solve the problem for free. |
| **Single-region deployment** | When that region has issues, your app goes down. Cross-Region Inference is a simple configuration change. |
| **Hardcoding model IDs** | You'll need to redeploy every time you want to switch models. Configuration lets you switch instantly. |
| **No fallback plan** | Models fail, regions go down. Without graceful degradation, your users see errors instead of reduced functionality. |
