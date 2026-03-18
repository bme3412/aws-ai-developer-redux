# Application Integration Patterns

**Domain 2 | Task 2.5 | ~35 minutes**

---

## Why This Matters

Building GenAI into applications requires more than calling an API. You need **UI components** that handle streaming text, **business system integrations** that connect AI to where work happens, and **developer tooling** that accelerates building these systems.

AWS provides managed services for common integration patterns—from Amplify UI components to Q Business for enterprise knowledge to Q Developer for code assistance. Understanding when to use these managed services versus building custom solutions determines whether you ship in weeks or months.

---

## Building GenAI User Interfaces

User interfaces for GenAI applications have unique requirements that differ from traditional web applications.

### What Makes GenAI UIs Different

| Requirement | Why It Matters |
|-------------|----------------|
| **Streaming text display** | Show tokens as they arrive, not after completion |
| **Conversation history** | Maintain and display multi-turn context naturally |
| **Loading states** | Communicate that AI processing takes longer than typical APIs |
| **Source citations** | Connect RAG responses to underlying documents |
| **Confidence indicators** | Signal uncertainty for high-stakes outputs |
| **Regenerate options** | Let users request alternative responses |

### AWS Amplify for AI Interfaces

**AWS Amplify** provides React components specifically designed for AI interfaces:

- **Chat components** handle message rendering, streaming display, and conversation management
- **Amplify Gen2** includes AI capabilities that connect directly to Bedrock
- Pre-built patterns for common interactions

Rather than building complex streaming and state management from scratch, you configure components and focus on your application's unique features.

### Bedrock Prompt Flows

**Bedrock Prompt Flows** enables **non-developers** to build AI workflows visually:

- Create, test, and deploy prompt chains without writing code
- Business users can prototype AI workflows
- Validate with real data
- Hand off proven patterns for production implementation

This accelerates experimentation by removing the developer bottleneck for simple automation.

### OpenAPI for API Contracts

**OpenAPI specifications** define your GenAI API contracts:

- Generate client SDKs automatically
- Maintain type safety across the stack
- Document API behavior for consumers
- Single source of truth for frontend-backend integration

---

## Integrating with Business Systems

GenAI adds intelligence to business processes across the enterprise. The key is connecting AI capabilities to **where work actually happens** rather than creating separate AI applications.

### Amazon Q Business

**Q Business** provides enterprise knowledge assistance **without requiring you to build custom RAG pipelines**.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ SharePoint  │     │  Confluence │     │   S3 Docs   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │ Q Business  │
                    │  Ingest &   │
                    │   Embed     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Answer    │
                    │   Engine    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌────────┐  ┌────────┐  ┌────────┐
         │  Web   │  │ Slack  │  │ Teams  │
         └────────┘  └────────┘  └────────┘
```

**What Q Business handles:**
- Data source connectors (40+ integrations)
- Document chunking and indexing
- Retrieval and response generation
- Enterprise-grade access controls

**You configure:**
- Data sources and access controls
- User groups and permissions

### Q Business vs Custom RAG

| Aspect | Q Business | Custom RAG |
|--------|------------|------------|
| Setup effort | Low | High |
| Customization | Limited | Full control |
| Connectors | 40+ pre-built | Build your own |
| Best for | Enterprise internal knowledge | Unique requirements |

**When to use Q Business**: You want enterprise search across internal docs with minimal setup.

**When to build custom**: You need specific chunking strategies, custom embedding models, or integration with proprietary systems.

### Bedrock Data Automation

**Bedrock Data Automation** addresses document-heavy workflows:

- Extract data from invoices, contracts, forms
- Process and route documents based on content
- Integrate with Step Functions for orchestration

Transform manual document processing into automated pipelines.

### CRM Integration Pattern

Lambda functions call Bedrock from CRM triggers:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   CRM    │────►│  Lambda  │────►│ Bedrock  │────►│   CRM    │
│ (Event)  │     │          │     │          │     │ (Update) │
└──────────┘     └──────────┘     └──────────┘     └──────────┘

Events: New case created, email received, customer status change
Actions: Summarize history, draft response, analyze sentiment
```

The business system drives the workflow; AI enhances it without disrupting established processes.

### Document Processing Pipeline

Combine multiple AWS services for document workflows:

| Service | Role |
|---------|------|
| **Amazon Textract** | OCR for scanned documents |
| **Amazon Comprehend** | Classify documents by type |
| **Amazon Bedrock** | Summarize, extract key information |
| **Step Functions** | Orchestrate the pipeline |

---

## Developer Productivity with GenAI

GenAI transforms developer workflows just as it transforms end-user applications.

### Amazon Q Developer

**Q Developer** integrates AI coding assistance directly into IDEs:

| Capability | Description |
|------------|-------------|
| **Code generation** | Describe what you want, receive working implementations |
| **Refactoring** | Improve existing code quality |
| **Bug fixing** | Explain errors and suggest remediation |
| **Documentation** | Generate docstrings and README content |
| **AWS SDK assistance** | Navigate AWS service integration complexity |
| **Test generation** | Create unit tests for existing functions |

### What Distinguishes Q Developer

Q Developer understands your **codebase context**:

- Reads your files and project structure
- Understands your patterns and conventions
- Generates code that fits your existing style
- Accounts for imports, naming conventions, architectural patterns

### Error Pattern Recognition

Paste CloudWatch error logs, stack traces, or error messages into Q Developer:

- Recognizes common patterns
- Suggests fixes
- Particularly valuable for **AWS-specific errors** where service context matters

### Security Scanning

Q Developer scans for vulnerabilities **as developers write code**:

- Identifies common security issues
- Suggests remediation
- Shifts security **left** in the development process
- Integrates with CI/CD pipelines

---

## Advanced Application Patterns

Complex applications combine multiple AI capabilities into sophisticated workflows.

### Multi-Agent Systems

**Strands Agents SDK** combined with **Agent Squad** enables specialized agents collaborating:

```
                    ┌─────────────────┐
                    │  Agent Squad    │
                    │  (Coordinator)  │
                    └────────┬────────┘
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Customer │  │ Inventory│  │  Order   │
        │  Agent   │  │  Agent   │  │  Agent   │
        └──────────┘  └──────────┘  └──────────┘
```

Each agent optimized for its domain. Orchestration routes requests to appropriate specialists and aggregates results.

### Prompt Chaining

Sequence multiple model calls for complex tasks:

1. **Extract** entities from user input
2. **Classify** intent based on entities
3. **Generate** response appropriate to intent
4. **Validate** output before returning

Each step focuses on one job, making the process easier to **debug and improve incrementally**.

### Workflow Patterns

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **Sequential** | Each step depends on previous output | Multi-step analysis |
| **Parallel** | Independent steps run simultaneously | Reduce latency |
| **Conditional** | Branch based on intermediate results | Route by classification |
| **Loop** | Iterate until quality threshold met | Refine until acceptable |
| **Human-in-the-loop** | Pause for approval | Sensitive actions |

### Prompt Flows vs Step Functions

| Prompt Flows | Step Functions |
|--------------|----------------|
| Visual building and testing | Full orchestration capabilities |
| Accessible to non-developers | Error handling, retries, fallbacks |
| Simple workflows | Conditional logic, parallel execution |
| Experimentation | Human approval integration |
| | Complex production workflows |

---

## Troubleshooting GenAI Applications

GenAI applications have **unique failure modes** beyond traditional application troubleshooting.

### What Makes GenAI Debugging Different

- Model responses may be **subtly wrong** rather than explicitly failing
- Performance issues may stem from **token limits** rather than compute
- **Probabilistic nature** means issues may not reproduce consistently

### CloudWatch Logs Insights

Query logs to understand GenAI behavior:

```sql
-- Find slow requests with low user ratings
fields @timestamp, request_id, response_time, user_rating
| filter response_time > 10000 and user_rating < 3
| sort @timestamp desc
| limit 50
```

- Search for specific prompts
- Filter by response quality metrics
- Aggregate error patterns

### X-Ray Tracing

Visualize request flow through your GenAI pipeline:

```
API Gateway → Lambda → Knowledge Base → Bedrock → Post-processing
   100ms        50ms       800ms         3500ms       100ms
```

- Identify bottlenecks
- Understand latency contributors
- Debug failure origins

### Common Issues and Solutions

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Token limit exceeded | Prompts too long | Truncate input, summarize context |
| Rate limiting | Too many requests | Backoff, quota increase, caching |
| Low quality outputs | Prompt issues | Review prompts, add examples |
| Slow responses | Model choice | Smaller model, streaming, optimization |
| Retrieval misses | RAG config | Review chunking, embeddings, search |

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "enterprise knowledge assistant" | Amazon Q Business |
| "employee questions about internal docs" | Amazon Q Business |
| "developer productivity" or "code assistance" | Amazon Q Developer |
| "no-code AI workflow" | Bedrock Prompt Flows |
| "troubleshooting GenAI" | CloudWatch Logs Insights + X-Ray |
| "document processing automation" | Bedrock Data Automation + Step Functions |

---

## Key Takeaways

> **1. Amplify provides pre-built AI UI components for rapid development.**
> Don't build streaming chat interfaces from scratch. Use Amplify Gen2's AI components.

> **2. Q Business is the managed enterprise knowledge assistant with minimal setup.**
> 40+ data source connectors, enterprise access controls, no RAG pipeline to build.

> **3. Q Developer assists developers with code generation, debugging, and security.**
> Context-aware suggestions based on your codebase. AWS SDK assistance included.

> **4. Prompt Flows enables no-code AI workflow building for non-developers.**
> Accelerate experimentation without developer bottleneck.

> **5. CloudWatch Logs Insights + X-Ray = GenAI observability and debugging.**
> Query logs for patterns. Trace requests to identify bottlenecks.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Building custom RAG when Q Business would suffice** | Weeks of development for something that's managed |
| **Not using streaming for user-facing AI interfaces** | Poor user experience, feels slow |
| **Manual debugging instead of X-Ray and Logs Insights** | Can't trace issues across distributed services |
| **Over-engineering simple workflows** | Prompt Flows handles many use cases without code |
| **Ignoring Q Developer for AWS coding** | Missing context-aware AWS SDK assistance |
