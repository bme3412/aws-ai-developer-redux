# Prompt Engineering

**Domain 1 | Task 1.6 | ~35 minutes**

---

## Why This Matters

Here's the best-kept secret in AI development: before you fine-tune, before you switch to a more expensive model, before you add architectural complexity—fix your prompts.

The difference between a mediocre prompt and an excellent one can be the difference between outputs that embarrass your company and outputs that delight users. And here's the kicker: improving prompts costs nothing. You're already paying for model invocations. The prompt itself is free to iterate, test, and refine as many times as you need.

This is often the highest-leverage optimization available to any AI team. A well-crafted prompt can transform a $15/month Haiku deployment into something that rivals much more expensive models. Companies routinely spend thousands on fine-tuning when better prompts would have solved the problem for free. Understanding prompt engineering isn't just about getting better outputs—it's about building cost-effective, maintainable AI systems.

---

## Core Prompting Techniques

The way you ask matters as much as what you ask. Small changes to prompt structure can dramatically change output quality, and understanding these techniques gives you a toolkit for solving a wide variety of problems without touching model architecture.

### Zero-Shot Prompting: When the Model Already Knows

Zero-shot prompting means giving instructions without examples. You describe what you want, and the model uses its training to figure out how to do it.

```
Summarize this article in three bullet points.
```

This works because the model has seen countless examples of summarization during training. It knows what "summarize" means, it understands bullet points, and it can apply that knowledge to your specific article. Zero-shot is your starting point for any task—try it first, and only add complexity if needed.

The appeal of zero-shot is simplicity and efficiency. No examples means shorter prompts, which means faster responses and lower token costs. For straightforward tasks where the model already understands the domain—classification, simple extraction, basic summarization—zero-shot often performs brilliantly.

Where does zero-shot struggle? When the format or style you want is unusual, when the task requires domain-specific knowledge the model might not have, or when you need precise control over output structure. That's when you graduate to more sophisticated techniques.

### Few-Shot Prompting: Teaching by Example

Few-shot prompting shows the model 2-5 examples before your actual request. Instead of explaining exactly how you want responses formatted, you demonstrate it. The model pattern-matches from your examples and applies the same approach to new inputs.

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

Few-shot is powerful when the format or style is hard to describe in words. Try explaining exactly how you want customer service responses to balance empathy, professionalism, and brevity—it's surprisingly difficult. But show three examples that nail the tone, and the model picks it up immediately.

The technique also handles edge cases elegantly. By including examples that cover different scenarios—easy requests, difficult ones, ambiguous ones—you teach the model how to handle variety without writing extensive instructions.

**Pro tip**: Include both positive AND negative examples—show what NOT to do. If you have a specific format you want, showing a wrong example with a correction is often more instructive than showing only correct examples. The contrast makes the requirement explicit.

### Chain-of-Thought: Thinking Out Loud

Chain-of-thought (CoT) prompting asks the model to reason step-by-step before giving an answer. This technique is a genuine game-changer for complex reasoning tasks—math problems, logic puzzles, multi-step analysis, anything where the path to the answer matters as much as the answer itself.

The magic incantation is simple. Just adding "Let's think through this step by step" before asking for an answer often doubles accuracy on reasoning tasks:

```
A store has 150 apples. They sell 40% on Monday and 30 more on Tuesday. How many remain?

Let's solve this step by step:
1. Monday sales: 150 × 0.40 = 60 apples
2. After Monday: 150 - 60 = 90 apples
3. Tuesday sales: 30 apples
4. Final count: 90 - 30 = 60 apples
```

Why does this work? When you ask a model to output the final answer directly, it's essentially doing all the reasoning in one forward pass—the computational equivalent of solving a math problem in your head without writing anything down. For complex problems, this internal reasoning often goes wrong somewhere and the error propagates to the final answer.

Chain-of-thought forces the model to externalize its reasoning. Each intermediate step becomes part of the output, and the model can use that explicit working to inform the next step. The reasoning chain is now part of the context, available for the model to reference and verify. This mirrors how humans solve complex problems—we write things down, check our work, and build answers incrementally.

The debugging benefit is equally valuable. When the model gets something wrong with chain-of-thought, you can see exactly where the reasoning went off track. Maybe it misread the problem, made an arithmetic error, or applied the wrong formula. With a direct answer, you have no visibility into what went wrong.

### Chain-of-Thought Variants

CoT isn't just one technique—there are several variants, each with different trade-offs between cost, accuracy, and implementation complexity.

**Zero-Shot CoT** is the simplest form. Just append "Let's think step by step" to your prompt without providing any examples. No few-shot demonstrations needed. This works surprisingly well for many reasoning tasks because modern language models have internalized the pattern of step-by-step reasoning from their training data. They know what "think step by step" means and can apply it to novel problems.

```
Question: If John has 3 times as many apples as Mary, and Mary has 4 apples, how many do they have together?

Let's think step by step.
```

The model will reason through the steps—Mary has 4, John has 3×4=12, together they have 16—before stating the final answer. The quality of reasoning improves simply because you asked for it explicitly.

**Few-Shot CoT** provides examples that demonstrate the reasoning process you want. This outperforms zero-shot when the reasoning pattern is complex, domain-specific, or when you want a particular style of explanation:

```
Example 1:
Q: If a train travels 60 mph for 2 hours, how far does it go?
A: I need to find distance using the formula: distance = speed × time.
   Speed is 60 mph, time is 2 hours.
   Distance = 60 × 2 = 120 miles.
   The answer is 120 miles.

Example 2:
Q: If a recipe needs 2 cups of flour per batch and you want 3 batches, how much flour?
A: I need to multiply flour per batch by number of batches.
   Flour per batch = 2 cups, batches = 3.
   Total flour = 2 × 3 = 6 cups.
   The answer is 6 cups.

Now solve:
Q: If a car uses 4 gallons per 100 miles and travels 250 miles, how much gas?
```

Few-shot CoT teaches the model not just to reason, but to reason in your preferred style. Maybe you want reasoning that explicitly states formulas, or that always identifies what's being asked before computing, or that double-checks the answer. Your examples establish that pattern.

**Self-Consistency** takes chain-of-thought further by generating multiple reasoning chains and taking the majority answer. Different reasoning paths might lead to the same correct answer—or reveal which paths are flawed:

```
Path 1: 150 × 0.40 = 60, 150 - 60 = 90, 90 - 30 = 60 ✓
Path 2: 150 - (150 × 0.40) - 30 = 150 - 60 - 30 = 60 ✓
Path 3: 40% = 60, remaining = 90, minus 30 = 60 ✓

Consensus: 60 apples
```

If all paths agree, you have high confidence. If they disagree, the majority vote is usually right—or the disagreement reveals an ambiguity in the problem. Self-consistency costs more (multiple API calls per question) but dramatically improves accuracy on challenging problems where a single reasoning attempt might go wrong.

**Tree of Thoughts** is the most sophisticated variant, reserved for the most complex problems. Instead of linear reasoning chains, you explore multiple branches at each step, evaluate which branches seem promising, and backtrack when you hit dead ends. Think of it as depth-first search over the space of possible reasoning paths.

This is overkill for most applications—the cost and complexity are substantial. But for problems like multi-step planning, puzzle-solving, or optimization where wrong turns are expensive to recover from, Tree of Thoughts can find solutions that simpler approaches miss.

### Temperature and Top-p: Controlling Randomness

These parameters control how random or deterministic model outputs are. Understanding them prevents puzzling behavior and lets you tune models for specific use cases.

**Temperature** controls the probability distribution over possible next tokens. Mathematically, temperature divides the log-probabilities before the softmax function. Lower temperatures sharpen the distribution—the highest-probability tokens become much more likely, and unlikely tokens become even less likely. Higher temperatures flatten the distribution—more tokens become reasonable choices.

| Temperature | Effect | Best For |
|-------------|--------|----------|
| 0.0 | Deterministic—always picks highest probability token | Extraction, classification, factual Q&A |
| 0.3-0.5 | Low randomness—mostly consistent with some variation | General use, summaries |
| 0.7-0.9 | Medium randomness—more creative outputs | Creative writing, brainstorming |
| 1.0+ | High randomness—unpredictable, sometimes incoherent | Experimental, rarely useful |

At temperature 0, the model always picks the single most probable next token. This makes outputs completely deterministic—run the same prompt twice, get the exact same response. Perfect for tasks where consistency matters more than variety.

As temperature increases, the model becomes willing to choose less-probable tokens. This introduces variety—run the same prompt twice, get different phrasings, different ideas, different creative choices. Good for brainstorming or creative tasks where you want the model to surprise you.

Push temperature too high and outputs become random to the point of incoherence. The model might choose tokens that don't quite fit, leading to grammatically correct but semantically strange sentences. Above 1.0, you're in experimental territory.

**Top-p (Nucleus Sampling)** takes a different approach to controlling randomness. Instead of adjusting all token probabilities, top-p only considers tokens whose cumulative probability mass exceeds p:

| Top-p | Effect |
|-------|--------|
| 0.1 | Very constrained—only the most likely tokens considered |
| 0.5 | Moderate—top ~50% cumulative probability |
| 0.9 | Broad—most tokens except the very unlikely |
| 1.0 | All tokens considered (temperature alone controls selection) |

With top-p=0.9, the model looks at tokens in order of probability until their cumulative probability reaches 90%, then samples from that set. This automatically adapts to the situation—when the model is confident (one token dominates), the candidate set is small; when the model is uncertain (many tokens are plausible), the candidate set is large.

**Using Temperature and Top-p Together** requires understanding their interaction. Common patterns:

- **Deterministic**: temperature=0, top_p=1.0 (temperature=0 overrides top_p—always picks the top token)
- **Balanced**: temperature=0.7, top_p=0.9 (creative but coherent)
- **Constrained creative**: temperature=0.9, top_p=0.5 (creative within tight boundaries)

For tasks requiring consistent, reproducible outputs—extraction, classification, factual Q&A—use temperature=0. For creative tasks—brainstorming, writing, generating alternatives—increase temperature. When you need creativity but want to avoid truly bizarre outputs, combine moderate temperature with lower top-p.

### Structured Output: Parsing Made Easy

Requesting specific formats like JSON or XML makes model outputs parseable by downstream systems. This is essential for integrating AI into larger workflows where a human won't be reading the raw output.

Instead of "Extract the key information," specify exactly what you need:

```
Extract the following fields in JSON format:
{
  "customer_name": "string",
  "order_date": "YYYY-MM-DD",
  "total_amount": "number",
  "items": ["list of product names"]
}
```

The model will format its output to match your schema. You can then parse the JSON in your application code and use the values directly. No regex, no string parsing, no hoping the model remembered to include the date.

Be explicit about edge cases: What should the model output if a field is missing from the input? Should it use null, an empty string, or omit the field entirely? Clear instructions prevent surprises.

### Role Prompting: Setting the Persona

Role prompting sets the model's persona and primes domain knowledge:

```
You are an expert AWS solutions architect with 15 years of experience designing production systems.
```

This does more than add flavor. The model has been trained on content written by various types of experts, and role prompting activates the patterns associated with that expertise. An "expert AWS solutions architect" responds differently than a "helpful assistant"—more technical depth, more consideration of trade-offs, more awareness of production realities.

Role prompting also establishes response style. A "patient teacher" explains more thoroughly than a "busy consultant." A "creative copywriter" produces different prose than a "technical writer." Choose the role that matches both the expertise and the communication style you need.

### Combining Techniques

These techniques combine naturally, and sophisticated prompts often use several together. A production prompt might include:

- **Role prompting** to set expertise and style
- **System context** explaining constraints and goals
- **Few-shot examples** demonstrating format and edge cases
- **Chain-of-thought instructions** for complex reasoning steps
- **Structured output specification** for parseable responses

Each technique addresses a different aspect of the task, and they layer without conflicting. Start simple, add techniques as needed, and remove any that aren't pulling their weight.

---

## Prompt Management and Governance

Production AI needs more than prompts scattered across application code. As complexity grows and teams iterate, you need systematic management—version control, access control, audit trails, and governance processes that prevent poorly-tested prompts from reaching users.

### Bedrock Prompt Management: The Single Source of Truth

Bedrock Prompt Management centralizes prompt storage with built-in version control. Every change is tracked—who modified what, when, and what the previous version looked like. If a prompt update degrades quality, you can identify what changed and roll back instantly.

This beats the alternative of prompts embedded in application code, where changes require deployments, version history lives in git (mixed with unrelated code changes), and different environments might have subtly different prompts without anyone realizing it.

Create prompts in the console with clear names and descriptions. Define system messages that establish the AI's persona, constraints, and behavioral guidelines. Attach guardrails directly to prompts so content filtering travels with the prompt definition. Use templates with `{{placeholders}}` for dynamic content that varies per request.

Versioning is automatic—each save creates a new immutable version. This enables A/B testing different versions, gradually rolling out improvements while monitoring for regressions, and maintaining a complete history of how prompts evolved over time.

### Parameterized Templates

Parameterized templates separate structure from content, maintaining quality while allowing flexibility. Define templates with placeholders:

```
Analyze the following {{document_type}} and extract {{required_fields}}.

Context:
{{document_content}}

Instructions:
- Focus on {{analysis_focus}}
- Use {{output_format}} format
```

At runtime, fill in the blanks with request-specific values. This approach means changing document type doesn't risk breaking the prompt structure—the template stays stable while content varies. Teams can share templates, applying the same proven structure to different use cases.

### Approval Workflows

In regulated industries or high-stakes applications, prompt changes should go through review before reaching production. You wouldn't deploy untested code; prompt changes deserve similar scrutiny.

Prompt Management supports IAM access controls to separate development from production. Build formal approval workflows with Step Functions: someone submits a prompt change, the workflow routes to appropriate reviewers, collects approvals (or rejections with feedback), and only promotes to production after passing review.

This governance prevents well-meaning but poorly-tested prompt changes from causing production incidents. It also creates accountability—there's a record of who approved each change.

### Testing Prompts

Create evaluation datasets covering expected inputs and edge cases. Include typical requests that represent the bulk of traffic, unusual requests that stress-test the prompt, adversarial inputs designed to break things, and inputs related to previous production issues.

Run prompts against these test sets before deployment. Compare outputs to expected results. Automated testing catches quality regressions before users do—a prompt that seemed like an improvement might have subtle issues that only appear with certain inputs.

Build evaluation into your CI/CD pipeline. When prompts change, tests run automatically. If quality metrics drop, the change doesn't deploy.

### Audit Trails with CloudTrail

CloudTrail logs prompt access and modifications for compliance. Every action is recorded: who accessed this prompt, what changes were made, when they occurred, from what IP address.

For regulated industries, this audit trail is essential. When auditors ask "who had access to the AI system that made this decision?" you have a complete record. For debugging production issues, the trail reveals what changed and when, correlating prompt modifications with reported problems.

---

## Prompt Flows and Chaining

Complex tasks often need multiple model calls, each building on results from the previous step. Prompt chaining breaks problems into stages, where each stage uses a focused prompt rather than a monolithic prompt trying to do everything at once.

### The Power of Decomposition

Consider document analysis. You could write one massive prompt that summarizes, extracts entities, and generates recommendations all at once. Sometimes that works. But often, breaking it into stages produces better results:

1. First, summarize the document to capture key points
2. Then, extract specific entities from the summary
3. Finally, generate recommendations based on those entities

Each stage has a clear, focused objective. The summarization prompt doesn't need to worry about entity formats. The entity extraction prompt receives clean input (the summary) rather than raw, potentially messy document content. The recommendation prompt works with structured entities rather than trying to parse everything itself.

This decomposition also aids debugging. If recommendations are wrong, you can examine the intermediate outputs. Was the summary accurate? Were the entities extracted correctly? You can identify exactly where the pipeline failed and fix that specific stage.

### Bedrock Prompt Flows

Bedrock Prompt Flows provides visual, no-code orchestration for prompt chains. Design flows graphically, connecting prompts with data transformations and conditional logic. Drag nodes onto a canvas, connect them with edges that show data flow, and configure each node's behavior.

This is perfect for business users who understand the workflow but don't want to write code, or for developers rapidly prototyping pipelines before committing to a production implementation. Build and test pipelines visually, iterate quickly, and only move to code-based orchestration when the visual approach hits its limits.

### Prompt Flows Node Types

Understanding the available nodes helps you design effective flows.

**Input and Output Nodes** define the boundaries of your flow. The input node specifies what data your flow accepts—maybe a user query and a document to analyze. The output node specifies what the flow returns—maybe a structured response with specific fields.

**Prompt Nodes** are the core building blocks. Each prompt node invokes a foundation model with a configured prompt. You specify the model, the prompt template (with variables that receive data from previous nodes), inference parameters like temperature and max tokens, and optionally attach guardrails for content filtering.

**Condition Nodes** enable branching based on logic. Route to different paths based on model output content, confidence scores, or classification results:

```
IF sentiment == "negative" THEN escalation_path
ELSE standard_response_path
```

This creates adaptive flows that behave differently based on what the model produces. Negative sentiment routes to human escalation; positive sentiment gets automated response. Uncertain classifications trigger clarification workflows; confident classifications proceed directly.

**Iterator and Collector Nodes** handle arrays. If your input is a list of documents, the iterator processes each one individually—running the same prompt chain for each document—and the collector aggregates results back into a single list. This patterns lets you process variable-length inputs without writing loop logic.

**Lambda Nodes** provide an escape hatch for custom logic. When you need something Prompt Flows can't express visually—complex data transformations, external API calls, database lookups, custom validation—Lambda nodes let you invoke arbitrary code. The visual flow handles orchestration while Lambda handles the custom bits.

**Knowledge Base Nodes** retrieve from a Bedrock Knowledge Base. Input is a query; output is retrieved documents. Chain this with a Prompt Node for RAG: the Knowledge Base Node finds relevant context, then the Prompt Node generates a response grounded in that context.

**S3 Storage Nodes** read from or write to S3. Load context documents at the start of a flow, save intermediate results for debugging, or archive final outputs for compliance. S3 integration makes flows work with your existing data infrastructure.

### Building a RAG Flow

A typical RAG pattern in Prompt Flows follows a simple structure:

```
Input → Knowledge Base Node → Prompt Node → Output
          (retrieve docs)      (generate with context)
```

The user's question enters through the Input Node. The Knowledge Base Node takes that question and retrieves relevant document chunks. The Prompt Node receives both the original question and the retrieved context, then generates a grounded response. The Output Node returns that response to the caller.

This three-node flow replaces what would otherwise require significant custom code: embedding the query, searching the vector store, formatting results, constructing the prompt with context, invoking the model, and extracting the response. Prompt Flows handles all of it visually.

### When Prompt Flows vs Step Functions

Both tools orchestrate multi-step workflows, but they target different complexity levels.

| Criterion | Prompt Flows | Step Functions |
|-----------|--------------|----------------|
| Complexity | Simple to moderate chains | Complex orchestration |
| Error handling | Basic retry | Sophisticated retry, catch, timeout |
| Integration | Bedrock-focused | Any AWS service |
| Visual design | Yes, drag-and-drop | Yes, but more complex |
| Custom logic | Via Lambda nodes | Native support |
| Parallel execution | Limited | Full support |

**Use Prompt Flows** for straightforward prompt chains, RAG patterns, and workflows where the primary action is model invocation. The visual interface makes these fast to build and easy to understand.

**Use Step Functions** when you need sophisticated error handling (retry with backoff, catch specific exceptions, timeout management), parallel execution of multiple branches, or deep integration with non-Bedrock services. Step Functions is a general-purpose orchestration engine; Prompt Flows is purpose-built for prompt chains.

Many production systems use both: Prompt Flows for the AI-specific parts, embedded within a larger Step Functions workflow that handles the broader business logic.

### Conditional Branching

Smart flows route to different prompts based on model output. A classification stage determines input type—question, complaint, feedback—and subsequent stages use specialized prompts for each:

**Conditional Routing:**

User Input → Classification Prompt → Condition Node

| Path | Prompt Style |
|------|--------------|
| Question | Fact-finding prompt |
| Complaint | Empathy + resolution |
| Feedback | Acknowledge + thank |

This creates AI systems that adapt to user needs. A complaint receives empathetic acknowledgment before resolution steps. A question gets direct, informative answers. Feedback receives gratitude and confirmation. One-size-fits-all prompts can't match this sophistication.

### Reusable Components

Extract common patterns into shared components. Standard system messages, output format instructions, error handling prompts—these appear in many flows. Build them once as reusable components, improve them once, and all flows using them benefit.

This DRY principle applies to prompts just like code. When you discover that a particular phrasing works better, updating the shared component propagates that improvement everywhere it's used.

---

## Output Quality Assurance

Foundation model outputs are probabilistic. The same prompt can produce different outputs each time. Some outputs might be wrong, harmful, malformed, or simply off-brand. Production systems must validate before delivering to users.

### Structured Output Validation

If you requested JSON, parse it and verify the schema. Are required fields present? Are values in expected ranges? Do dates parse correctly? Are strings the right length?

```typescript
function validateResponse(response: string): ValidationResult {
  let parsed;
  try {
    parsed = JSON.parse(response);
  } catch (e) {
    return { valid: false, error: 'Invalid JSON' };
  }

  if (!parsed.customer_name || typeof parsed.customer_name !== 'string') {
    return { valid: false, error: 'Missing or invalid customer_name' };
  }

  if (parsed.total_amount && parsed.total_amount < 0) {
    return { valid: false, error: 'Negative total_amount' };
  }

  return { valid: true, data: parsed };
}
```

When validation fails, you have options. Retry with a clarifying prompt that emphasizes the correct format. Fall back to a default response. Return an error asking the user to try again. Don't pass malformed data downstream—it will break something eventually, and debugging will be harder because you won't know the AI produced garbage.

### Bedrock Guardrails

Guardrails provide built-in content filtering with multiple policy types that address different safety and compliance needs.

**Content filters** block harmful content across categories: hate speech, violence, sexual content, misconduct. You configure sensitivity levels—how aggressive should filtering be? Higher sensitivity catches more concerning content but may also block legitimate edge cases.

**Denied topics** define specific subjects the model should refuse to discuss. Maybe your customer service bot shouldn't discuss competitor products, or your healthcare assistant shouldn't provide specific medical diagnoses. List the topics, and Guardrails will detect and block relevant responses.

**Word filters** block specific words or phrases. Useful for brand compliance (block competitor names, profanity, internal code names that shouldn't leak), or for catching specific problematic patterns your content filters miss.

**PII filters** detect and handle sensitive data—names, addresses, phone numbers, social security numbers, credit card numbers. Configure whether to block entirely, mask the data (replace with asterisks), or allow with logging.

**Contextual grounding** checks whether responses are actually grounded in provided context. This catches hallucination—when the model makes things up instead of using the documents you provided. Critical for RAG applications where accuracy matters.

Apply guardrails to both inputs and outputs. Input filtering prevents prompt injection—malicious inputs designed to manipulate model behavior. Output filtering catches inappropriate responses before users see them:

```typescript
// Check input before sending to model
const inputCheck = await client.send(new ApplyGuardrailCommand({
  guardrailIdentifier: 'my-guardrail',
  guardrailVersion: '1',
  source: 'INPUT',
  content: [{ text: { text: userMessage } }]
}));

if (inputCheck.action === 'GUARDRAIL_INTERVENED') {
  return { error: 'Request blocked by content policy' };
}

// Invoke model...

// Check output before returning to user
const outputCheck = await client.send(new ApplyGuardrailCommand({
  guardrailIdentifier: 'my-guardrail',
  guardrailVersion: '1',
  source: 'OUTPUT',
  content: [{ text: { text: modelResponse } }]
}));

if (outputCheck.action === 'GUARDRAIL_INTERVENED') {
  return { response: 'I apologize, but I cannot provide that information.' };
}
```

### Lambda Post-Processing

Guardrails handle general safety, but business-specific rules need custom logic. Lambda functions implement validations that Guardrails can't express:

- "Never recommend competitor products"—check response against competitor name list
- "Prices must be within valid ranges"—verify numeric values against business constraints
- "Referenced products must exist in our catalog"—validate product IDs against database
- "Responses must not exceed 500 words"—enforce length limits for UI constraints

Lambda post-processing sits between model output and user delivery. It receives the raw response, applies your business rules, and either passes the response through, modifies it, or rejects it.

### Quality Monitoring

Model behavior can drift subtly over time, and prompt changes might have unintended effects. Build observability from the start:

- Log outputs with quality metrics (format validity, business rule pass rate, user feedback)
- Build CloudWatch dashboards tracking these metrics over time
- Set alarms when metrics deviate from baselines

When the format validity rate drops from 99% to 95%, you want to know immediately—not when users start complaining. Proactive monitoring catches problems early, before they impact significant numbers of users.

---

## Handling Interactive Conversations

Chatbots and assistants require special consideration for multi-turn interactions. Unlike single-shot API calls, conversations have history, state, and context that accumulates over time.

### Conversation History Management

DynamoDB stores conversation history efficiently. Design your table with a session ID as the partition key and turn number as the sort key. Each item contains the message content, role (user or assistant), timestamp, and any metadata.

```typescript
// Store a new turn
await dynamodb.put({
  TableName: 'Conversations',
  Item: {
    sessionId: 'abc123',
    turnNumber: 5,
    role: 'user',
    content: 'What about the pricing?',
    timestamp: Date.now()
  }
});

// Retrieve full history for a session
const history = await dynamodb.query({
  TableName: 'Conversations',
  KeyConditionExpression: 'sessionId = :sid',
  ExpressionAttributeValues: { ':sid': 'abc123' }
});
```

Set TTL on items to automatically expire old conversations. Users who don't return don't need their history preserved indefinitely. TTL keeps your table size manageable and respects privacy.

### Managing Context Window Limits

Conversations eventually exceed what fits in the model's context window. When you hit this limit, you have several options:

**Summarization** compresses older turns. After every N turns, summarize the conversation so far and replace detailed history with the summary. You lose some detail but preserve the essential context.

**Sliding window** drops the oldest turns. Keep the most recent N turns; older ones disappear. Simple to implement but loses potentially important early context (like the user's original question or stated preferences).

**Selective retrieval** uses embeddings to include only relevant history. When the user asks about "the pricing we discussed," retrieve turns that mentioned pricing rather than including everything. This is more complex but makes better use of limited context.

Each approach trades off context preservation against relevance. For simple chatbots, sliding window works fine. For complex assistants where early context matters, summarization or selective retrieval is worth the additional complexity.

### Intent Classification

Amazon Comprehend can extract intent before sending to the foundation model. Classify user intent—complaint, question, feedback, purchase intent—and route to specialized prompts or workflows.

```typescript
const comprehendResult = await comprehend.classifyDocument({
  Text: userMessage,
  EndpointArn: 'arn:aws:comprehend:...:custom-classifier/intent'
});

const intent = comprehendResult.Classes[0].Name; // 'complaint', 'question', etc.

// Route to specialized prompt based on intent
const prompt = intentPrompts[intent];
```

This hybrid approach—traditional NLP for classification, foundation model for generation—is often more efficient than having the FM do everything. Classification is fast and cheap; you only invoke the expensive FM for the generative parts.

### Clarification Workflows

When user intent is unclear, generating clarifying questions beats guessing. Step Functions can orchestrate multi-turn clarification:

1. User sends ambiguous request
2. FM detects ambiguity and generates clarifying question
3. User responds
4. FM incorporates clarification and proceeds

This creates better user experiences. Instead of making wrong assumptions and producing unhelpful responses, the system acknowledges uncertainty and asks for what it needs. Users appreciate being asked rather than receiving irrelevant answers.

---

## Implementing Prompt Governance

Prompt governance ensures quality, compliance, and consistency across your organization's AI applications. As more teams adopt AI and more prompts go into production, governance prevents chaos.

### The Foundation: Parameterized Templates

Define approved structures that teams customize through parameters, not by modifying prompt logic. The structure has been tested, reviewed, and proven. Teams fill in the blanks for their specific use case.

Store templates in Prompt Management with strict access controls. Development teams can use templates; only prompt engineers can modify them. This separation ensures that expertise goes into template design while teams retain flexibility for their specific needs.

### S3 for Template Storage

For templates that need additional versioning beyond Prompt Management, S3 provides version control at the file level. Combined with Object Lock, this creates an immutable audit trail—once a version is created, it cannot be modified or deleted.

This immutability matters for compliance. Auditors can verify exactly what template was used for a given time period. No one can claim "the prompt was different then"—the historical record is tamper-proof.

### Formal Approval Workflows

Step Functions formalizes the review process:

1. Someone submits a prompt change
2. Workflow routes to appropriate reviewers based on the prompt's risk level
3. Reviewers evaluate quality, safety, and compliance
4. Workflow collects approvals (or rejections with feedback)
5. Approved changes promote to production; rejected changes return to author

This process ensures untested prompts can't reach users. High-risk prompts (customer-facing, financial, regulated domains) might require multiple approvals. Low-risk prompts might need only automated testing. The workflow adapts to the stakes.

### Compliance Audit Trails

Combine CloudTrail logging with your approval workflows to create complete compliance records:

- Who created this prompt?
- What reviews did it go through?
- Who approved it?
- When did it reach production?
- What outputs did it produce?

For regulated industries, this trail demonstrates that AI governance exists and functions. When regulators ask "how do you control what your AI says?" you have documentation showing systematic oversight.

---

## Ensuring Output Quality

Quality assurance validates that foundation model outputs meet your standards before reaching users. This is especially important because models are probabilistic—the same input can produce different outputs, and some of those outputs might not be acceptable.

### Lambda Post-Processing

Run custom validation on every response:

```typescript
export async function validateOutput(response: string): Promise<ValidatedResponse> {
  const parsed = JSON.parse(response);

  // Validate prices are positive
  if (parsed.price && parsed.price < 0) {
    throw new ValidationError('Negative price detected');
  }

  // Validate dates are parseable
  if (parsed.date && isNaN(Date.parse(parsed.date))) {
    throw new ValidationError('Invalid date format');
  }

  // Validate referenced products exist
  for (const productId of parsed.productIds || []) {
    if (!await productExists(productId)) {
      throw new ValidationError(`Unknown product: ${productId}`);
    }
  }

  return { valid: true, data: parsed };
}
```

When validation fails, decide how to handle it. Retry with stronger instructions? Fall back to a canned response? Escalate to human review? The right choice depends on the stakes and the failure mode.

### CloudWatch Monitoring

Track quality metrics over time to catch degradation:

- **Format validity rate**: What percentage of responses parse correctly?
- **Business rule pass rate**: What percentage pass your custom validations?
- **Guardrail intervention rate**: How often does content filtering trigger?
- **User feedback signals**: Thumbs up/down, complaints, escalations

Set alarms when metrics deviate from baselines. A sudden spike in guardrail interventions might indicate a prompt change that's producing more problematic content. A drop in format validity might indicate a model update or configuration change that broke your expected outputs.

### Feedback Loops

When validation catches systematic issues, that signal should feed back to prompt engineers. If 5% of responses fail business rules, don't just retry and move on—investigate why. Maybe the prompt needs clearer instructions. Maybe examples would help. Maybe there's an edge case the prompt doesn't handle.

Build systems that surface these patterns. Aggregate validation failures by type, by prompt, by time period. Identify which prompts need improvement and what specific issues they're causing. Continuous improvement depends on continuous visibility.

---

## Prompt Orchestration Comparison

| Criterion | Bedrock Prompt Flows | AWS Step Functions | Custom Lambda |
|-----------|---------------------|-------------------|---------------|
| Interface | Visual, no-code | JSON/YAML workflow | Full code control |
| Complexity | Simple to moderate chains | Complex branching, parallel, error handling | Unlimited flexibility |
| Best for | Rapid prototyping, RAG | Production workflows | Custom integrations |
| Error handling | Basic retry | Sophisticated retry, catch, timeout | You implement it |
| Learning curve | Low | Medium | High |
| Vendor lock-in | Bedrock-specific | AWS-specific | Portable |

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "improve reasoning or accuracy" | Chain-of-thought ("let's think step by step") |
| "consistent format" | Few-shot examples showing the exact format you want |
| "version control or governance" | Bedrock Prompt Management |
| "audit trail" | S3 + CloudTrail |
| "orchestrate prompts" or "chaining" | Prompt Flows (simple) or Step Functions (complex) |
| "without changing the model" | Prompting techniques—zero-shot, few-shot, CoT |
| "deterministic output" or "reproducible" | **temperature=0** |
| "creative writing" | Higher temperature (0.7-0.9) |
| "multiple reasoning attempts" | **Self-consistency** (majority vote across paths) |
| "visual, no-code prompt chains" | **Bedrock Prompt Flows** |
| "RAG in Prompt Flows" | Knowledge Base Node → Prompt Node |
| "content filtering" | **Bedrock Guardrails** |
| "block specific topics" | Guardrails **denied topics** |
| "PII protection" | Guardrails **PII filters** |

---

## Key Takeaways

> **1. Match technique to task.**
> Zero-shot for simple tasks where the model already knows what to do. Few-shot when format or style is hard to describe in words. Chain-of-thought for complex reasoning. Each technique has its sweet spot.

> **2. Chain-of-thought doubles accuracy on reasoning.**
> Just adding "Let's think through this step by step" dramatically improves performance on math, logic, and multi-step analysis. It's nearly free and often the single most impactful change.

> **3. Temperature controls consistency.**
> Use temperature=0 for deterministic, reproducible outputs. Increase for creative variety. Understanding this parameter prevents puzzling inconsistencies in production.

> **4. Centralize prompt management.**
> Bedrock Prompt Management provides version control, audit trails, and governance. Prompts scattered in application code become impossible to track, test, and improve systematically.

> **5. Choose the right orchestration tool.**
> Prompt Flows for visual, no-code prototyping and RAG patterns. Step Functions when you need sophisticated branching, parallel execution, and error handling.

> **6. Always validate outputs.**
> FM responses are probabilistic. Check structure, verify business rules, filter content through guardrails before delivering to users. Hope is not a validation strategy.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Fine-tuning before exhausting prompt options** | Fine-tuning costs time and money. Prompt engineering is free to iterate and often solves the problem faster. |
| **Skipping few-shot examples** | When format consistency is required, showing examples beats describing format in words. Include both positive and negative examples. |
| **No output validation** | FM responses are probabilistic. Without validation, malformed or inappropriate content reaches users. |
| **Prompts scattered in application code** | Impossible to track versions, audit changes, or maintain governance. Centralize in Prompt Management. |
| **Monolithic prompts for complex tasks** | Chaining simpler, focused prompts often beats a single prompt trying to do everything. Decomposition aids debugging and quality. |
| **Ignoring temperature for consistency** | If you need reproducible outputs and you're getting variation, check temperature. It should probably be 0. |
