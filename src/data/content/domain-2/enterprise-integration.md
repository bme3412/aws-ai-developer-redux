# Enterprise Integration Architectures

**Domain 2 | Task 2.3 | ~35 minutes**

---

## Why This Matters

GenAI applications don't exist in isolation. They integrate with **existing systems**: CRMs, ERPs, databases, legacy applications. A brilliant AI capability that can't connect to your customer data, authenticate your users, or fit into your deployment processes is ultimately useless in an enterprise context.

Understanding enterprise integration patterns is essential for building production GenAI systems that work within real organizational constraints. This means connecting to systems that were built before anyone imagined foundation models, working within existing security frameworks, deploying to environments where cloud-only isn't an option, and fitting into CI/CD pipelines that need GenAI-specific testing.

The patterns in this section bridge the gap between "it works in a demo" and "it works in production at scale within our enterprise."

---

## Enterprise Integration Patterns for GenAI

GenAI integrations follow two fundamental patterns that determine how systems communicate:

### Synchronous (API-Based) Integration

The calling system sends a request to your GenAI service, **waits** while the model processes, and receives the response directly.

```
┌────────────┐     Request     ┌────────────┐     Invoke     ┌────────────┐
│  Legacy    │────────────────►│    API     │───────────────►│  Bedrock   │
│  System    │                 │  Gateway   │                │            │
│            │◄────────────────│            │◄───────────────│            │
└────────────┘     Response    └────────────┘     Result     └────────────┘
                (waits 2-15s)
```

**API Gateway** exposes your GenAI capabilities as REST or HTTP APIs that any system can call. Backend Lambda functions invoke Bedrock and return results.

**Works well for:**
- Interactive applications where users expect immediate responses
- Systems that can tolerate seconds of latency
- Simple request-response patterns

**Challenges specific to foundation models:**
- Inference times of **10+ seconds** are common for complex prompts
- API Gateway imposes a **29-second timeout**
- Tightly coupled systems cascade failures: if GenAI slows, everything backs up

### Asynchronous (Event-Driven) Integration

Systems communicate through **events** without direct coupling. Producers publish events; consumers process them in the background.

```
┌────────────┐     Event       ┌────────────┐     Trigger    ┌────────────┐
│  Source    │────────────────►│ EventBridge│───────────────►│  Lambda    │
│  System    │                 │            │                │  (GenAI)   │
└────────────┘                 └────────────┘                └─────┬──────┘
                                                                   │
                                    ┌──────────────────────────────┘
                                    │ Results stored or event published
                                    ▼
                              ┌────────────┐
                              │   S3 /     │
                              │  DynamoDB  │
                              └────────────┘
```

**Amazon EventBridge** serves as the integration hub:
- Producers publish events when things happen (document uploaded, feedback submitted)
- GenAI processors subscribe to relevant events
- Results flow back through events or are stored for later retrieval

**Advantages:**
- Temporary failures don't block callers
- Handles bursty workloads through natural queuing
- Systems evolve independently
- Better suited for long-running inference

### Data Synchronization

**AWS AppFlow** provides managed data transfer from SaaS applications like Salesforce, ServiceNow, and SAP to S3 or other AWS services. This data can:

- Feed **knowledge bases** for RAG
- Provide **context** for inference
- Populate **training datasets**

AppFlow handles the complexity of connecting to diverse APIs, managing authentication, and scheduling transfers.

### Choosing Sync vs Async

| Factor | Synchronous | Asynchronous |
|--------|-------------|--------------|
| User experience | Immediate response | Background processing |
| Latency tolerance | Seconds acceptable | Minutes acceptable |
| Coupling | Tight | Loose |
| Failure handling | Caller blocks | Queue absorbs |
| Best for | Interactive UIs | Batch processing, integrations |

**Rule of thumb**: If users are staring at a loading spinner, consider whether async with status updates would be better.

---

## Security for Enterprise GenAI

Enterprise GenAI systems must integrate with existing security frameworks rather than creating parallel authentication and authorization systems.

### Identity Federation

Users authenticate through their **existing systems**—Okta, Azure AD, corporate LDAP—rather than creating new credentials.

```
┌────────────┐     SAML/OIDC   ┌────────────┐     AWS Creds   ┌────────────┐
│ Enterprise │────────────────►│  Cognito   │────────────────►│  Bedrock   │
│    IdP     │                 │            │                 │  Access    │
└────────────┘                 └────────────┘                 └────────────┘
```

**Amazon Cognito** federates identities through SAML or OIDC:
- Maintains existing security posture
- Enables single sign-on
- Avoids proliferation of AI-specific accounts
- Issues AWS credentials for accessing GenAI services

### Role-Based Access Control (RBAC)

Different user groups need different access levels:

| Group | Access Level |
|-------|--------------|
| Sales Representatives | Customer-facing AI features for proposals |
| Analysts | Data exploration tools, knowledge base queries |
| Administrators | Prompt and guardrail configuration |

**IAM roles** corresponding to these groups with permissions scoped to specific needs. **Cognito user pool groups** can map to these roles automatically.

### Least Privilege for GenAI

Least privilege applies doubly to GenAI systems because **both models and data present risks**:

- Users should only access the **Bedrock models** they need—not every model in the account
- They should only query **knowledge bases** relevant to their function
- Over-permissioned access risks:
  - **Cost overruns** (users invoking expensive models unnecessarily)
  - **Data exposure** (accessing documents outside their scope)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": [
        "arn:aws:bedrock:*:*:foundation-model/anthropic.claude-3-haiku*"
      ]
    },
    {
      "Effect": "Deny",
      "Action": ["bedrock:InvokeModel"],
      "Resource": [
        "arn:aws:bedrock:*:*:foundation-model/anthropic.claude-3-opus*"
      ]
    }
  ]
}
```

### VPC Integration

**VPC endpoints** keep GenAI traffic within your network perimeter:

```
┌─────────────────────────────────────────────────┐
│                    Your VPC                      │
│                                                  │
│  ┌──────────┐        ┌────────────────┐         │
│  │  Lambda  │───────►│ VPC Endpoint   │         │
│  │          │        │ (Bedrock)      │─────────┼────► Bedrock
│  └──────────┘        └────────────────┘         │     (AWS backbone)
│                                                  │
│  ┌──────────┐        ┌────────────────┐         │
│  │  EC2     │───────►│ VPC Endpoint   │         │
│  │  App     │        │ (SageMaker)    │─────────┼────► SageMaker
│  └──────────┘        └────────────────┘         │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- Traffic never traverses public internet
- Meets compliance requirements
- Reduces attack surface
- Can eliminate NAT Gateway costs

---

## Cross-Environment Deployments

Not all GenAI workloads can run in standard AWS regions. Some organizations have data that cannot leave their data centers. Some applications require ultra-low latency that standard regions cannot provide.

### AWS Outposts: On-Premises AWS

**Outposts** brings AWS infrastructure to your data center. Run SageMaker endpoints locally, keeping sensitive data on-premises while using familiar AWS APIs and tools.

**Use cases:**
- Regulations prohibit certain data from leaving premises
- Latency to nearest AWS region is unacceptable
- Process data alongside on-premises systems without transfer delays

**Trade-offs:**
- Requires physical hardware installation
- Limited model selection compared to full AWS
- Higher operational responsibility

### AWS Wavelength: Edge Inference

**Wavelength** delivers inference at the **network edge** for applications requiring single-digit millisecond latency. Wavelength zones exist within carrier (5G) networks, putting compute physically close to mobile and IoT devices.

**Use cases:**
- Real-time translation requiring sub-10ms response
- Augmented reality applications
- Autonomous systems where network latency is critical

### Hybrid Routing

Combine deployment options based on request characteristics:

| Route requests based on... | To... |
|----------------------------|-------|
| Data sensitivity (regulated data) | On-premises Outposts |
| Latency requirements (real-time) | Edge Wavelength |
| Capacity (burst overflow) | Cloud regions |

API Gateway can implement this routing based on request attributes, geographic origin, or custom logic.

### Secure Connectivity

Link on-premises systems to cloud GenAI services:

| Option | Use Case |
|--------|----------|
| **AWS Direct Connect** | Dedicated connections, consistent performance |
| **Site-to-Site VPN** | Lower bandwidth needs, backup to Direct Connect |

Both encrypt traffic and keep it off the public internet.

---

## CI/CD for GenAI Applications

GenAI applications require CI/CD pipelines that address challenges beyond traditional application deployment. Code changes are only part of the picture—**prompt changes**, **model updates**, **guardrail configurations**, and **knowledge base refreshes** all need deployment workflows.

### Pipeline Architecture

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Source  │───►│  Build   │───►│   Test   │───►│  Deploy  │
│  Commit  │    │          │    │          │    │          │
└──────────┘    └──────────┘    └────┬─────┘    └──────────┘
                                     │
                              ┌──────▼──────┐
                              │ Quality Gate│
                              └──────┬──────┘
                                ┌────┴────┐
                               Pass      Fail
                                │         │
                                ▼         ▼
                            Deploy    Alert &
                             Prod     Rollback
```

**CodePipeline** orchestrates the workflow:
- Stages for source, build, test, deploy
- Staging environments for verification
- Approval gates for sensitive changes
- Automatic rollbacks when issues detected

**CodeBuild** executes validation:
- Traditional unit and integration tests
- GenAI-specific test suites

### GenAI-Specific Testing

Beyond traditional tests, GenAI applications need:

**Prompt Regression Testing**
- Given known inputs, does the system produce acceptable outputs?
- Maintain golden datasets of input-output pairs
- Evaluate new outputs against expected results

**Quality Metrics**
- BLEU scores for translation
- ROUGE for summarization
- Custom metrics for your domain
- Track changes over deployments

**Safety Checks**
- Run outputs through guardrails before deployment
- Catch regressions in content safety
- Verify harmful content is filtered

**Security Scanning**
- Test for **prompt injection vulnerabilities**
- Automated scans for common injection patterns
- Verify guardrails catch manipulation attempts
- Static analysis of prompt templates

### Rollback Strategies

GenAI outputs are **probabilistic**—quality degradation might not be immediately obvious. Outputs might still look reasonable while being subtly worse.

**Monitoring for rollback:**
- Track output quality metrics over time
- Alert when quality drops below thresholds
- Automatic rollback triggers

**Deployment strategies:**
- **Blue-green deployments** for quick switches between versions
- **Feature flags** for gradual GenAI feature rollout
- **Canary deployments** to test on subset of traffic first

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "integrate GenAI with legacy systems" | API Gateway for sync, EventBridge for async |
| "identity federation" or "enterprise IdP" | Cognito (SAML/OIDC) |
| "RBAC" or "access control" for GenAI | IAM policies with least privilege |
| "on-premises" or "data can't leave" | AWS Outposts |
| "edge" or "ultra-low latency" | AWS Wavelength |
| "CI/CD for GenAI" | CodePipeline + GenAI-specific testing |
| "data sync from SaaS" | AWS AppFlow |
| "keep traffic off public internet" | VPC endpoints |

---

## Key Takeaways

> **1. API Gateway for synchronous integration, EventBridge for async, loosely coupled integration.**
> Choose based on latency tolerance. Sync for interactive; async for background processing and long-running inference.

> **2. Cognito federates enterprise identities; IAM enforces RBAC for GenAI resources.**
> Users authenticate through existing IdPs. Role-based permissions control which models and knowledge bases users can access.

> **3. Outposts for on-premises GenAI, Wavelength for edge inference.**
> When data can't leave or latency requirements are extreme, AWS extends to your data center or the carrier edge.

> **4. CI/CD pipelines need GenAI-specific testing.**
> Prompt regression, quality metrics, safety checks, and prompt injection scanning—beyond traditional application testing.

> **5. VPC endpoints keep GenAI traffic off public internet.**
> Meet compliance requirements and reduce attack surface by keeping Bedrock/SageMaker traffic on AWS backbone.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Building synchronous APIs for async-suitable workloads** | Unnecessary blocking, cascading failures. Use EventBridge for background processing. |
| **Over-permissioned IAM policies for GenAI access** | Cost overruns from unnecessary model usage, data exposure risks. |
| **Forgetting GenAI-specific tests in CI/CD** | Prompt regressions and quality degradation slip into production undetected. |
| **Not using VPC endpoints for production** | GenAI traffic crosses public internet unnecessarily, compliance risk. |
| **Ignoring prompt injection in security scans** | Vulnerability to manipulation attacks goes undetected. |
| **Tight coupling to specific models** | Can't switch models without application changes. Use abstraction layers. |
