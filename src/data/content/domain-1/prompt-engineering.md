# Prompt Engineering

**Domain 1 | Task 1.6 | ~35 minutes**

---

## Why This Matters

Here's the best-kept secret in AI: before you fine-tune, before you switch models, before you add complexity—fix your prompts.

A well-crafted prompt can transform mediocre outputs into impressive ones at zero additional cost. This is often the highest-leverage optimization available.

---

## Core Prompting Techniques

The way you ask matters as much as what you ask. Small changes to prompt structure can dramatically change output quality.

### Zero-Shot Prompting

Give instructions without examples. The model uses its training to figure it out.

```
Summarize this article in three bullet points.
```

The model knows what summarization means. This works great for straightforward tasks where the model already understands the domain.

### Few-Shot Prompting

Show 2-5 examples before your actual request. Instead of explaining exactly how you want responses formatted, demonstrate it:

```
Example 1:
Customer: My order hasn't arrived.
Response: I understand how frustrating delayed orders can be. Let me look up your order #[ORDER_ID] and provide a status update.

Example 2:
Customer: I want a refund.
Response: I'd be happy to help with your refund. Could you share your order number so I can review the details?

Now respond to:
Customer: {{user_message}}
```

Few-shot is powerful when the format or style is hard to describe in words.

**Pro tip**: Include both positive AND negative examples—show what NOT to do.

### Chain-of-Thought (CoT)

Ask the model to reason step-by-step. This is a game-changer for complex reasoning—math problems, logic puzzles, multi-step analysis.

Just adding "Let's think through this step by step" before asking for an answer often **doubles accuracy**:

```
A store has 150 apples. They sell 40% on Monday and 30 more on Tuesday. How many remain?

Let's solve this step by step:
1. Monday sales: 150 x 0.40 = 60 apples
2. After Monday: 150 - 60 = 90 apples
3. Tuesday sales: 30 apples
4. Final count: 90 - 30 = 60 apples
```

### Structured Output

Request specific formats like JSON or XML.

Instead of "Extract the key information," specify:

```
Extract the following fields in JSON format: {name, date, amount}
```

This makes outputs parseable by downstream systems. Essential for integrating AI into larger workflows.

### Role Prompting

Set the model's persona:

```
You are an expert AWS solutions architect.
```

This primes domain knowledge and response style.

### Combining Techniques

These techniques combine naturally. Use few-shot to establish format, chain-of-thought for reasoning, role prompting for expertise, and structured output for parseability—all in one prompt.

---

## Prompt Management and Governance

Production AI needs more than prompts scattered in code. As complexity grows and teams iterate, you need systematic management.

### Bedrock Prompt Management

Your single source of truth. Store prompts centrally with version control.

- Every change is tracked—who modified what, when
- Roll back instantly if quality degrades
- Beats prompts buried in application code

### Parameterized Templates

Separate structure from content. Define templates with placeholders:

```
Analyze the following {{document_type}} and extract {{required_fields}}.
```

At runtime, fill in the blanks. This maintains quality while allowing flexibility—changing document type doesn't risk breaking the prompt structure.

### Approval Workflows

Ensure prompts meet standards before reaching production. In regulated industries or high-stakes apps, prompt changes should go through review.

- Prompt Management supports IAM access controls
- Build approval workflows with Step Functions for formal review processes

### Testing

Create evaluation datasets covering expected inputs and edge cases. Run prompts against test sets before deployment. Automated testing catches quality regressions.

### Audit Trail

**CloudTrail** logs prompt access and modifications for compliance:
- Who accessed this prompt?
- What changed?
- When?

Essential for regulated industries and debugging production issues.

---

## Prompt Flows and Chaining

Complex tasks often need multiple model calls, each building on the last. Prompt chaining breaks problems into stages.

### The Pattern

Consider document analysis:
1. First summarize
2. Then extract entities from the summary
3. Then generate recommendations based on those entities

Each stage uses a focused prompt. This often beats a monolithic prompt trying to do everything at once.

### Bedrock Prompt Flows

Visual, no-code orchestration. Design flows graphically, connecting prompts with data transformations and conditional logic.

Perfect for business users or rapid prototyping—build and test pipelines without writing code.

### Step Functions

More power for complex logic. When you need sophisticated branching, parallel execution, error handling with retries, or deep AWS integration, Step Functions delivers the control that visual tools can't match.

### Conditional Branching

Route to different prompts based on model output:
1. A classification stage determines input type (question, complaint, feedback)
2. Route to specialized prompts for each

This enables sophisticated, adaptive AI systems.

### Reusable Components

Extract common patterns—standard system messages, output format instructions—into shared components. Improve a component once, all flows using it benefit.

---

## Output Quality Assurance

Foundation model outputs are probabilistic. The same prompt can produce different outputs. Some might be wrong, harmful, or malformed.

Production systems must validate before delivering.

### Structured Output Validation

If you requested JSON, parse it and verify the schema:
- Missing fields?
- Invalid values?

Either retry with clarification or return an error. Don't pass malformed data downstream.

### Bedrock Guardrails

Built-in content filtering with multiple policy types:

| Policy Type | What It Does |
|-------------|--------------|
| Content filters | Block harmful content (hate, violence, sexual, misconduct) |
| Denied topics | Define specific topics the model should refuse |
| Word filters | Block specific words or phrases |
| PII filters | Detect and mask/block sensitive data |
| Contextual grounding | Check if responses are grounded in provided context |

Apply guardrails to both **inputs** (preventing prompt injection) AND **outputs** (filtering inappropriate responses):

```typescript
// Check input before sending to model
const inputCheck = await client.send(new ApplyGuardrailCommand({
  guardrailIdentifier: 'my-guardrail',
  guardrailVersion: 'DRAFT',
  source: 'INPUT',
  content: [{ text: { text: userMessage } }]
}));

if (inputCheck.action === 'GUARDRAIL_INTERVENED') {
  return { error: 'Request blocked by content policy' };
}
```

### Lambda Post-Processing

Implements custom business rules:
- "Never recommend competitor products"
- "Prices must be within valid ranges"

Business-specific logic that guardrails can't express.

### Quality Monitoring

Detect degradation over time:
- Log outputs with quality metrics
- Build CloudWatch dashboards tracking response quality
- Set alarms when metrics deviate from baselines

Model behavior can drift subtly—catching problems early prevents user impact.

---

## Managing Prompts with Bedrock

Bedrock Prompt Management centralizes prompt storage.

1. Create prompts in the console with clear names and descriptions
2. Define system messages establishing the AI's persona and constraints
3. Attach guardrails directly to prompts
4. Use templates with `{{placeholders}}` for dynamic content

**Versioning is automatic**—each save creates a new immutable version. A/B test different versions, gradually rolling out improvements.

**IAM policies** control access. Separate roles for prompt development and production deployment.

---

## Handling Interactive Conversations

Chatbots and assistants require context management across multiple turns.

### Conversation History

**DynamoDB** stores conversation history efficiently. Store turns with a session ID key for fast retrieval. TTL settings automatically expire old conversations.

### Context Window Limits

When conversation history exceeds model limits, you must either:
- **Summarize** older turns
- **Drop** the oldest
- **Retrieval**: Selectively include relevant history

Each approach trades off context preservation vs. relevance.

### Intent Classification

**Amazon Comprehend** can extract intent before FM processing. Classify user intent ('complaint,' 'question,' 'feedback') to route to specialized prompts.

This hybrid approach—traditional NLP for classification, FM for generation—is often more efficient.

### Clarification Workflows

When the FM detects unclear intent, generate clarifying questions rather than guessing. Step Functions can orchestrate multi-turn clarification flows.

---

## Implementing Prompt Governance

Prompt governance ensures quality, compliance, and consistency across your organization's AI applications.

### Parameterized Templates

The foundation. Define approved structures that teams customize through parameters, not by modifying prompt logic.

Store templates in Prompt Management with strict access controls.

### S3 for Templates

Can store approved prompt templates as version-controlled files. Combined with S3 versioning and object lock, this provides an immutable audit trail.

### CloudTrail

Logs all prompt access and modifications:
- Who modified this prompt?
- When?
- What was the previous version?

Essential for regulated industries.

### Approval Workflows

Step Functions formalizes review:
1. Someone submits a prompt change
2. Workflow routes to reviewers
3. Collects approvals
4. Promotes to production

Untested prompts can't reach users.

---

## Ensuring Output Quality

Quality assurance validates that FM outputs meet your standards before delivery.

### Lambda Post-Processing

Run custom validation:
- Check prices are positive
- Dates are valid
- Referenced products exist in your catalog
- Transform outputs into required formats

### CloudWatch Monitoring

Track quality over time:
- Format validity rate
- Business rule pass rate
- User satisfaction signals

Set alarms when metrics deviate.

### Step Functions Orchestration

Complex validation might require multiple checks:
1. Format validation
2. Business rules
3. Safety filtering
4. Manager approval for high-stakes outputs

### Feedback Loops

When validation catches systematic issues, that signal should feed back to prompt engineers for improvement.

---

## Advanced Prompting Techniques

Build on fundamentals for challenging tasks.

### Chain-of-Thought

Dramatically improves reasoning accuracy. For math, logic, or multi-step analysis:

```
Show your reasoning step by step.
```

The reasoning chain also aids debugging—you can see where logic went wrong.

### Structured Inputs

Provide consistent context:

```
Product: {name}
Price: {price}
Category: {category}
```

Predictability helps the model extract information reliably.

### Self-Critique

Ask the model to review its own output:

```
Review your response for accuracy and completeness. Are there any errors or omissions?
```

The critique often catches issues the initial generation missed.

---

## Orchestrating Complex Prompt Systems

Complex systems require orchestration—coordinating multiple prompts, managing data flow, handling errors.

### Bedrock Prompt Flows

Visual orchestration for prompt chains:
- Connect prompts graphically
- Define transformations between stages
- Add conditional branches based on FM outputs

Ideal for rapid development.

### Error Handling

What happens when the FM returns unexpected format? When a chain fails midway?

Build retry logic, fallback paths, and graceful degradation. Step Functions excels at this.

---

## Prompt Orchestration Comparison

| Criterion | Bedrock Prompt Flows | AWS Step Functions | Custom Lambda |
|-----------|---------------------|-------------------|---------------|
| Interface | Visual, no-code | JSON/YAML workflow | Full code control |
| Complexity | Simple to moderate chains | Complex branching, parallel, error handling | Unlimited flexibility |
| Best for | Rapid prototyping | Production workflows | Custom integrations |
| Error handling | Basic retry | Sophisticated retry, catch, timeout | You implement it |

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "improve reasoning or accuracy" | Chain-of-thought ("think step by step") |
| "consistent format" | Few-shot examples |
| "version control or governance" | Bedrock Prompt Management |
| "audit trail" | S3 + CloudTrail |
| "orchestrate prompts or chaining" | Prompt Flows (simple) or Step Functions (complex) |
| "without changing the model" | Prompting techniques |

---

## Key Takeaways

1. **Zero-shot for simple tasks; few-shot for format; chain-of-thought for reasoning**
2. **Chain-of-thought ('think step by step') dramatically improves complex reasoning**
3. **Bedrock Prompt Management provides centralized governance with versioning**
4. **Prompt Flows for visual orchestration; Step Functions for complex production**
5. **Always validate outputs**—don't trust FM responses without checking

---

## Common Mistakes

- Fine-tuning when prompt engineering would solve the problem at zero cost
- Not using few-shot examples when format consistency is required
- Skipping output validation in production pipelines
- Storing prompts in application code instead of managed services
- Building monolithic prompts when chaining simpler prompts would work better
