# Agent Design Patterns Deep Dive

**Domain 2 | Task 2.6 | ~60 minutes**

---

## Why This Matters

Agentic AI represents the next evolution of GenAI—systems that can reason, plan, and act autonomously. Unlike simple chatbots that can only generate text based on their training, agents interact with the real world through tools, maintain memory across conversations, and coordinate with other agents to solve complex problems.

Understanding agent architecture patterns is essential for building sophisticated AI applications. The difference between a demo that impresses in a presentation and a system that reliably handles production traffic lies in how you design agent reasoning loops, manage memory, coordinate multiple agents, and implement safety controls.

This deep dive builds on foundational agent concepts to explore the patterns that make production agents robust, debuggable, and safe.

---

## What Makes an Agent an Agent

Agents are AI systems that can **autonomously decide what actions to take** to accomplish goals. The distinction becomes clear through a simple example.

When a user asks a chatbot about the weather in Seattle, it can only respond with what it knows from training—which doesn't include current conditions. An agent facing the same question thinks differently: it recognizes it needs weather data, remembers it has access to a weather API, calls that API, and returns the actual current weather. The agent **took an action in the world** rather than just generating text.

This capability emerges from several characteristics working together:

| Characteristic | Purpose |
|----------------|---------|
| **Reasoning** | Think about how to solve problems rather than jumping to answers |
| **Planning** | Break complex tasks into manageable sequential steps |
| **Tool use** | Interact with external systems—APIs, databases, services |
| **Observation** | Process action results and incorporate new information |
| **Iteration** | Take multiple actions when a single step isn't sufficient |
| **Goal-direction** | Keep all activity focused on completing the user's objective |

### The Agent Loop

The agent loop describes how these characteristics combine into a working system:

```
User Input
    │
    ▼
┌─────────┐
│ REASON  │◄──────────────┐
└────┬────┘               │
     │                    │
     ▼                    │
┌─────────┐               │
│  PLAN   │               │
└────┬────┘               │
     │                    │
     ▼                    │
┌─────────┐               │
│   ACT   │               │
└────┬────┘               │
     │                    │
     ▼                    │
┌─────────┐     ┌────┐    │
│ OBSERVE │────►│Done│────┴──► Response
└─────────┘     │ ?  │
                └────┘
```

Consider booking a meeting as a concrete example. The user asks to book a meeting with Sarah for next Tuesday at 2pm:

1. **Reason**: "I need to book a meeting but should first check availability"
2. **Act**: Call calendar availability tool for Sarah on Tuesday at 2pm
3. **Observe**: Sarah is available
4. **Reason**: "Availability confirmed, I should create the meeting"
5. **Act**: Call meeting creation tool
6. **Observe**: Success, meeting ID returned
7. **Respond**: Confirmation to user

---

## ReAct: Reasoning + Acting

**ReAct** stands for Reasoning + Acting, and it has become the dominant pattern for building effective agents. The core insight is that **interleaving reasoning traces with actions** produces better results than either alone.

- Reasoning without actions leaves the agent unable to gather new information
- Actions without reasoning lead to haphazard, uncoordinated behavior

### The ReAct Structure

The pattern follows a specific structure:

1. **Thought** — The agent explains what it's considering or needs to know
2. **Action** — The agent specifies a tool call
3. **Observation** — The agent receives the tool's result
4. **Repeat** — Until enough information exists to produce a final Answer

### Why ReAct Works

ReAct succeeds for several reasons:

- **Transparency**: Explicit reasoning traces reveal decision-making process
- **Grounding**: Actions gather real data rather than relying solely on training
- **Adaptability**: When things fail, the agent can observe and adjust
- **Debuggability**: Developers can trace reasoning to understand mistakes

### Bedrock Agents and ReAct

**Bedrock Agents implement ReAct automatically.** When you create a Bedrock Agent, you define:

1. **Instructions** — System prompt explaining the agent's role and capabilities
2. **Action Groups** — Tools available to the agent (OpenAPI + Lambda)
3. **Knowledge Bases** (optional) — RAG for grounded responses

The Bedrock service handles the ReAct loop itself—prompting the model for reasoning, parsing action requests, invoking Lambda functions, feeding results back, and continuing until task completion.

### ReAct Challenges and Mitigations

| Challenge | Mitigation |
|-----------|------------|
| Infinite loops | Maximum iteration limits |
| Hallucinated actions | Clear tool definitions via OpenAPI schemas |
| High latency | Efficient instructions, fewer reasoning steps |
| Lost context | Session ID management |

```python
# Agent instructions guide ReAct behavior
instructions = """
You are a helpful assistant that can:
- Search for product information
- Check inventory levels
- Process orders

Always check inventory before confirming an order.
If a product is out of stock, suggest alternatives.
Be concise. Only use tools when necessary.
"""

# Configure iteration limits to prevent runaway agents
max_iterations = 10
```

---

## Action Groups: Giving Agents Tools

**Action Groups** define what tools an agent can use, transforming it from a reasoning-only system into one that can interact with external services. Each action within a group maps to a Lambda function that performs the actual work.

### Structure of an Action Group

The structure reflects its role as an API the agent can call:

- **Order Management** action group might contain:
  - `getOrderStatus` — Look up order status
  - `cancelOrder` — Cancel an existing order
  - `listOrders` — List orders for a customer

Each action specifies:
- Required and optional parameters
- Descriptions that help the agent understand when to use it
- The Lambda function that handles the call

### OpenAPI Schema Definition

OpenAPI schemas define actions in a standardized format that both humans and Bedrock can understand:

```yaml
openapi: 3.0.0
info:
  title: Order Management API
  version: 1.0.0
paths:
  /orders/{orderId}/status:
    get:
      operationId: getOrderStatus
      summary: Get the status of an order
      description: >
        Retrieves current status, shipping info, and delivery estimate
        for a specific order. Use when customer asks about their order.
      parameters:
        - name: orderId
          in: path
          required: true
          schema:
            type: string
          description: The unique order identifier (e.g., "ORD-12345")
      responses:
        '200':
          description: Order status retrieved successfully
```

**Rich descriptions prove essential** because they guide the agent's decision about which action to use. "Retrieves current status, shipping info, and delivery estimate for an order" gives much more context than simply "Get order status."

### Lambda Handler Implementation

Lambda handlers implement the action logic:

```python
import json

def lambda_handler(event, context):
    action_group = event.get('actionGroup')
    api_path = event.get('apiPath')
    parameters = event.get('parameters', [])
    params = {p['name']: p['value'] for p in parameters}

    if api_path == '/orders/{orderId}/status':
        result = get_order_status(params['orderId'])
    elif api_path == '/orders/{orderId}/cancel':
        result = cancel_order(params['orderId'], params.get('reason'))
    else:
        result = {'error': 'Unknown action', 'code': 'UNKNOWN_ACTION'}

    return {
        'actionGroup': action_group,
        'apiPath': api_path,
        'httpMethod': event.get('httpMethod'),
        'httpStatusCode': 200,
        'responseBody': {
            'application/json': {
                'body': json.dumps(result)
            }
        }
    }

def get_order_status(order_id):
    # Your business logic here
    return {
        'orderId': order_id,
        'status': 'shipped',
        'trackingNumber': 'ABC123',
        'estimatedDelivery': '2024-03-15'
    }
```

### Action Group Best Practices

| Practice | Why It Matters |
|----------|----------------|
| Clear, detailed descriptions | Helps agent choose correct actions |
| Parameter validation | Catches errors early, returns useful messages |
| Idempotency | Protects against retried actions causing duplicates |
| Structured error responses | Gives agent info to recover or inform user |

---

## Multi-Agent Patterns

Complex problems often benefit from **multiple specialized agents** working together rather than a single agent trying to do everything. This mirrors how human organizations work: specialists handle specific domains while coordinators ensure collaboration.

### Why Multi-Agent Architecture?

| Advantage | Description |
|-----------|-------------|
| **Specialization** | Each agent excels at specific tasks with focused instructions |
| **Modularity** | Agents built and tested independently |
| **Scalability** | Add capabilities via new agents without modifying existing ones |
| **Separation of concerns** | Different security boundaries for different functions |

### Supervisor Pattern

A coordinating agent routes subtasks to appropriate specialists:

```
                    ┌─────────────────┐
                    │   Supervisor    │
                    │     Agent       │
                    └────────┬────────┘
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Research │  │ Analysis │  │ Writing  │
        │  Agent   │  │  Agent   │  │  Agent   │
        └──────────┘  └──────────┘  └──────────┘
```

The supervisor:
- Analyzes incoming requests
- Routes subtasks to specialists
- Synthesizes results into coherent responses
- **AWS Agent Squad** implements this pattern

### Sequential Pipeline Pattern

Agents arranged in sequence where each transforms output and passes it forward:

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Gather   │────►│ Process  │────►│ Format   │
│  Agent   │     │  Agent   │     │  Agent   │
└──────────┘     └──────────┘     └──────────┘
```

Works well when tasks naturally decompose into stages with clear handoffs.

### Debate/Consensus Pattern

Multiple agents analyze the same problem from different perspectives:

- **Optimistic Agent** — Best-case analysis
- **Conservative Agent** — Risk-focused analysis
- **Technical Agent** — Implementation feasibility
- **Synthesizer** — Combines views into balanced recommendation

Valuable when decisions benefit from considering multiple viewpoints.

### Implementation with Step Functions

Step Functions orchestrates any pattern with full control over sequencing, parallelism, and error handling:

```python
# Step Functions state machine for pipeline pattern
{
    "StartAt": "GatherInfo",
    "States": {
        "GatherInfo": {
            "Type": "Task",
            "Resource": "arn:aws:bedrock:...:agent/gather-agent",
            "Next": "ProcessInfo"
        },
        "ProcessInfo": {
            "Type": "Task",
            "Resource": "arn:aws:bedrock:...:agent/process-agent",
            "Next": "FormatOutput"
        },
        "FormatOutput": {
            "Type": "Task",
            "Resource": "arn:aws:bedrock:...:agent/format-agent",
            "End": True
        }
    }
}
```

---

## Peer-to-Peer Agent Collaboration

While the supervisor pattern centralizes control, **peer-to-peer collaboration distributes decision-making** across agents. Each agent independently determines when it needs assistance from others, creating emergent coordination rather than prescribed workflows.

### EventBridge for Agent Communication

Agents communicate through Amazon EventBridge—publishing events describing their state, needs, or findings, and subscribing to relevant event types:

```python
import boto3
import json

events = boto3.client('events')

def research_agent_handler(event, context):
    research_results = perform_research(event['query'])

    if needs_financial_analysis(research_results):
        # Request help from peer agents
        events.put_events(Entries=[{
            'Source': 'agent.research',
            'DetailType': 'AnalysisRequest',
            'Detail': json.dumps({
                'correlationId': event['correlationId'],
                'dataType': 'financial',
                'payload': research_results
            }),
            'EventBusName': 'agent-collaboration'
        }])

    return research_results

def finance_agent_handler(event, context):
    detail = json.loads(event['detail'])

    if detail['dataType'] == 'financial':
        analysis = perform_financial_analysis(detail['payload'])

        # Publish results back
        events.put_events(Entries=[{
            'Source': 'agent.finance',
            'DetailType': 'AnalysisComplete',
            'Detail': json.dumps({
                'correlationId': detail['correlationId'],
                'analysis': analysis
            }),
            'EventBusName': 'agent-collaboration'
        }])
```

### DynamoDB for Shared State

Alternatively, agents coordinate through shared state:

```python
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('AgentCollaboration')

def update_shared_state(task_id, agent_name, findings):
    table.update_item(
        Key={'taskId': task_id},
        UpdateExpression='SET findings.#agent = :data, lastUpdated = :ts',
        ExpressionAttributeNames={'#agent': agent_name},
        ExpressionAttributeValues={
            ':data': findings,
            ':ts': datetime.now().isoformat()
        }
    )

def check_for_peer_findings(task_id):
    response = table.get_item(Key={'taskId': task_id})
    return response.get('Item', {}).get('findings', {})
```

### Supervisor vs Peer-to-Peer

| Aspect | Supervisor | Peer-to-Peer |
|--------|------------|--------------|
| Coordination | Centralized | Distributed |
| Single point of failure | Yes (supervisor) | No |
| Debugging complexity | Lower | Higher |
| Latency | Higher (supervisor overhead) | Can be lower |
| Best for | Defined workflows | Exploratory tasks |

**Peer-to-peer excels for:**
- Research tasks where agents discover needs dynamically
- Creative collaboration where multiple perspectives emerge organically
- Resilient systems where supervisor failure would halt all work

---

## Agent Memory and Context

Agents need memory to maintain context across interactions. Without memory, every request starts fresh with no knowledge of what came before—frustrating for users who expect the system to remember what they just discussed.

### Memory Types

| Type | Scope | Implementation | Example Data |
|------|-------|----------------|--------------|
| **Session** | Single conversation | Bedrock session ID | Current conversation context |
| **Persistent** | Across all conversations | DynamoDB + retrieval | User preferences, past orders |
| **Semantic** | Shared knowledge | Knowledge Bases (RAG) | Product catalogs, policies |

### Session Memory with Bedrock

Bedrock Agents provide session memory through **session IDs**. Same session ID across turns maintains conversation context:

```python
session_id = 'user-123-session-456'

# First turn
response1 = bedrock_agent.invoke_agent(
    agentId='AGENT_ID',
    agentAliasId='ALIAS',
    sessionId=session_id,
    inputText='What products do you have under $50?'
)

# Second turn - agent remembers context
response2 = bedrock_agent.invoke_agent(
    agentId='AGENT_ID',
    agentAliasId='ALIAS',
    sessionId=session_id,
    inputText='Which of those are available in blue?'
)
# Agent understands "those" refers to products from previous response
```

### Persistent Memory with DynamoDB

Cross-session memory requires external storage:

```python
def get_user_context(user_id):
    item = dynamodb.get_item(
        TableName='agent-memory',
        Key={'userId': user_id}
    )
    return item.get('Item', {})

# Before invoking agent, retrieve and inject context
context = get_user_context(user_id)
agent_prompt = f"""
User context:
- Preferences: {context.get('preferences')}
- Past purchases: {context.get('pastPurchases')}
- Communication style: {context.get('style', 'professional')}

User message: {user_message}
"""
```

### Memory Management Challenges

| Challenge | Solution |
|-----------|----------|
| Context window limits | Summarize long histories to fit |
| Irrelevant history | Semantic search for pertinent memories |
| Stale information | TTL-based expiration |
| Large knowledge needs | Knowledge Bases for RAG retrieval |

---

## Agent Safety and Guardrails

Autonomous agents introduce safety concerns that don't exist with simple text generation. An agent that can take actions can also take **wrong actions**—booking incorrect flights, deleting important data, accessing unauthorized information, or producing harmful content.

### Defense in Depth

Production agents need multiple overlapping safety layers:

```
┌─────────────────────────────────────────────────┐
│               Bedrock Guardrails                │
│        (Content filtering input/output)         │
├─────────────────────────────────────────────────┤
│                 IAM Policies                    │
│          (Action-level permissions)             │
├─────────────────────────────────────────────────┤
│              Human-in-the-Loop                  │
│      (Approval for sensitive operations)        │
├─────────────────────────────────────────────────┤
│           Operational Controls                  │
│      (Timeouts, iteration limits, alerts)       │
└─────────────────────────────────────────────────┘
```

### Layer 1: Bedrock Guardrails

Configure guardrails for your agent to filter both inputs and outputs:

```python
agent_config = {
    'guardrailConfiguration': {
        'guardrailIdentifier': 'GUARDRAIL_ID',
        'guardrailVersion': '1'
    }
}
```

Catches prompt injection attempts, blocks harmful content, enforces content policies.

### Layer 2: IAM Policies

IAM controls what actions agents can actually perform. **Even if an agent tries to take an unauthorized action, IAM denies it.**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:Query"],
      "Resource": "arn:aws:dynamodb:*:*:table/products"
    },
    {
      "Effect": "Deny",
      "Action": ["dynamodb:DeleteItem", "dynamodb:UpdateItem"],
      "Resource": "*"
    }
  ]
}
```

### Layer 3: Human-in-the-Loop

Lambda functions can return control to the application for sensitive operations:

- Refunds above threshold
- Data modifications
- External communications
- Irreversible actions

### Layer 4: Operational Controls

| Control | Purpose |
|---------|---------|
| Session timeouts | Clean up abandoned conversations |
| Iteration limits | Prevent infinite loops |
| CloudWatch monitoring | Visibility into agent behavior |
| Anomaly alerting | Catch unusual patterns early |

### Testing Agent Safety

Create golden datasets with test cases that **should be refused**:
- Requests to delete all data
- Attempts to reveal PII
- Prompt injection attacks
- Out-of-scope requests

Run these tests to verify agents respond appropriately.

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "autonomous AI that calls tools" | Bedrock Agents with Action Groups |
| "coordinate multiple specialized agents" | Supervisor pattern via Agent Squad |
| "self-organizing agents" | Peer-to-peer via EventBridge |
| "maintain context across turns" | Session ID in Bedrock Agents |
| "remember across sessions" | DynamoDB + custom retrieval |
| "ReAct" or "reasoning with actions" | Bedrock Agents (automatic) |
| "agent safety" or "limit agent actions" | Guardrails + IAM + human-in-the-loop |
| "give agent tools" or "agent capabilities" | Action Groups with Lambda + OpenAPI |

---

## Key Takeaways

> **1. Agents reason, plan, and take actions—not just generate text.**
> The agent loop (Reason → Plan → Act → Observe → Repeat) enables autonomous problem-solving.

> **2. ReAct pattern interleaves reasoning with actions.**
> Bedrock Agents implement this automatically. Explicit thoughts provide transparency and debuggability.

> **3. Action Groups define tools via OpenAPI + Lambda.**
> Clear descriptions help agents choose correct actions. Structured error responses enable recovery.

> **4. Session IDs maintain conversation context.**
> Same session ID across turns preserves memory. DynamoDB enables cross-session persistence.

> **5. Multi-agent: Supervisor for control, peer-to-peer for resilience.**
> Agent Squad implements supervisor pattern. EventBridge enables decentralized collaboration.

> **6. Safety requires defense in depth.**
> Guardrails filter content. IAM enforces permissions. Human-in-the-loop for sensitive actions. Iteration limits prevent runaway agents.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Vague action descriptions** | Agent can't determine which tool to use, leading to wrong actions or hallucinations |
| **Missing iteration limits** | Agent loops infinitely, accumulating costs and taking repeated unintended actions |
| **No human-in-the-loop for sensitive actions** | Refunds, deletions, and communications happen without oversight |
| **Ignoring agent tracing** | Unable to debug why agent made wrong decisions |
| **Overly broad IAM permissions** | Compromised agent can access or modify resources beyond its purpose |
| **No session ID management** | Context lost between turns, degraded user experience |
