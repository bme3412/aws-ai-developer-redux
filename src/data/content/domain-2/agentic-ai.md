# Agentic AI Solutions

**Domain 2 | Task 2.1 | ~40 minutes**

---

## Why This Matters

Agentic AI represents the next evolution of GenAI applications. Instead of simple request-response patterns where a user asks and the model answers, agents can autonomously plan, use tools, and take multi-step actions to complete complex tasks. This is where AI becomes genuinely useful for real-world business problems that require reasoning, tool use, and decision-making.

Think about the difference between asking a chatbot "What's the weather in Seattle?" versus asking "Book me the cheapest flight to Seattle next week, preferably in the morning." The first is a simple lookup. The second requires searching flight databases, comparing prices, understanding your preferences, considering constraints, and potentially making a purchase—all while handling the inevitable edge cases and failures that occur in real systems.

This topic matters because agents are how you build AI systems that actually *do* things rather than just *say* things. Every major AI capability being deployed in enterprises—from customer service automation to document processing to software development assistance—relies on agentic patterns. Master these concepts and you'll understand how production AI systems actually work.

---

## What Makes AI "Agentic"

Traditional AI applications are reactive. A user asks a question, the model responds, and the interaction ends. Agentic AI fundamentally changes this dynamic by introducing **autonomy** into the system. An agent doesn't just answer questions—it actively works to accomplish goals.

The defining characteristic of an agent is its ability to take **independent action**. When you ask an agent to "find the cheapest flight to Tokyo next week," it doesn't simply generate text about flights. Instead, it formulates a plan, searches flight databases, compares prices, considers your preferences, and returns with actual options. The agent makes decisions about what tools to use, what information to gather, and how to combine results—all without step-by-step human guidance.

This autonomy is powered by several key capabilities working together:

**Tool use** transforms agents from sophisticated chatbots into systems that can interact with the real world. An agent with access to APIs can check inventory, process payments, send emails, or query databases. Without tools, agents can only generate text. With tools, they can take action.

**Planning** enables agents to decompose complex goals into manageable steps. Rather than attempting everything at once, a well-designed agent breaks down "book a complete vacation package" into searching for flights, finding hotels, checking availability, and confirming reservations. Each step builds on the previous one.

**Reasoning** allows agents to evaluate their progress and adjust their approach. If a search returns no results, the agent can try alternative queries or ask for clarification. If an action fails, it can attempt recovery strategies. This adaptive behavior is what makes agents robust in the face of real-world complexity.

### Strands Agents SDK and Agent Squad

**Strands Agents SDK** is AWS's framework for building production-ready agents. Think of it as the scaffolding that handles the complexity of agent loops, tool definitions, memory management, and orchestration. You define what your agent should do and what tools it has access to; Strands handles how the agent executes its reasoning loop.

For scenarios requiring multiple specialized agents working together, **AWS Agent Squad** enables coordination between agents. One agent might handle customer inquiries while another manages inventory and a third processes orders—Agent Squad orchestrates their collaboration to solve problems no single agent could handle alone.

---

## The ReAct Pattern: Reasoning + Acting

ReAct stands for **Reasoning + Acting**, and it's the fundamental pattern behind most effective AI agents. The core insight is simple but powerful: instead of having an AI try to solve a problem in one shot, let it alternate between thinking about what to do and actually doing it. This creates a feedback loop where each action informs the next thought.

```
┌─────────────────────────────────────────────────────────────┐
│                    ReAct Agent Loop                          │
│                                                              │
│  THOUGHT ──→ ACTION ──→ OBSERVATION ──→ (repeat or respond) │
│  "I need     Call        Tool returns                        │
│   order      getOrder()   result                             │
│   status"                                                    │
└─────────────────────────────────────────────────────────────┘
```

The ReAct loop works through four repeating phases:

1. **Thought** — The agent reasons about the current state and decides what action would help achieve the goal
2. **Action** — The agent executes that action—typically calling a tool or API
3. **Observation** — The agent receives the result of that action, gaining new information
4. **Repeat or Respond** — The agent loops back to Thought, or if it has enough information, responds to the user

### A Concrete Example

A user asks: "What's the status of order #12345 and when will it arrive?"

The agent begins by thinking: "I need to look up order #12345 in the order system." It then acts by calling `getOrderStatus` with the order ID. The observation comes back: "Order shipped, tracking number ABC123."

The agent thinks again: "Now I need the delivery estimate from the tracking system." It acts by calling `getTrackingInfo` with the tracking number. The observation returns: "Estimated delivery March 15."

Finally, the agent thinks: "I have all the information needed" and responds to the user with a complete answer.

### Implementing ReAct with Bedrock Converse API

Here's how this translates to code using Python and the Bedrock Converse API:

```python
import boto3
import json

client = boto3.client('bedrock-runtime')

tools = [{
    'toolSpec': {
        'name': 'getOrderStatus',
        'description': 'Look up an order by ID',
        'inputSchema': {
            'json': {
                'type': 'object',
                'properties': {
                    'orderId': {'type': 'string', 'description': 'Order ID'}
                },
                'required': ['orderId']
            }
        }
    }
}]

messages = [{'role': 'user', 'content': [{'text': user_query}]}]

while True:
    response = client.converse(
        modelId='anthropic.claude-3-sonnet-20240229-v1:0',
        messages=messages,
        toolConfig={'tools': tools}
    )

    if response['stopReason'] == 'tool_use':
        tool_use = next(c['toolUse'] for c in response['output']['message']['content']
                       if 'toolUse' in c)
        result = execute_tool_call(tool_use)

        messages.append(response['output']['message'])
        messages.append({
            'role': 'user',
            'content': [{'toolResult': {
                'toolUseId': tool_use['toolUseId'],
                'content': [{'json': result}]
            }}]
        })
    else:
        return response['output']['message']['content'][0]['text']
```

The loop continues until `stopReason` is no longer `tool_use`, indicating the model is ready to respond.

### Step Functions for Production ReAct

**AWS Step Functions** provides an excellent foundation for implementing ReAct patterns in production. Each state in a Step Functions workflow can represent a phase of the reasoning cycle, with transitions based on observations. Step Functions adds critical production capabilities:

- **Built-in error handling** with retry policies and catch blocks
- **Automatic retries** with exponential backoff
- **Timeout management** to prevent runaway agents
- **Human approval workflows** for sensitive actions
- **Full execution history** for debugging and auditing

---

## Model Context Protocol (MCP)

The Model Context Protocol represents an important step toward **standardization** in the AI agent ecosystem. Before MCP, every AI system had its own way of connecting to tools. If you built a tool for one agent framework, you'd have to rebuild it for another. MCP changes this by providing a universal adapter that lets any MCP-compatible AI system talk to any MCP-compatible tool.

```
┌─────────────────────────────────────────────────────────────┐
│                Model Context Protocol                        │
│                                                              │
│  AI Agent ──→ MCP Client ──→ MCP Server ──→ Tool Execution  │
│  (Bedrock/    (SDK/         (Lambda/       (Your Logic)     │
│   Custom)      Library)      ECS)                           │
└─────────────────────────────────────────────────────────────┘
```

The architecture consists of three main components:

- **MCP Client** runs within the agent runtime—whether that's Bedrock Agents, a custom agent built with Strands, or another MCP-compatible system
- **MCP Server** exposes your tools and data sources through a standardized interface
- **Protocol** uses JSON-RPC for communication with well-defined message types for tool discovery, invocation, and response handling

### The Value of Standardization

Without MCP, changing AI providers means rewriting all your tool integrations. With MCP, tools are portable. Build a tool once, and it works with any agent that speaks MCP. This creates a growing ecosystem of pre-built MCP servers for common services, reducing the work required to give your agents new capabilities.

### Lambda vs ECS for MCP Servers

When deciding where to host MCP servers, consider the nature of your tools:

| Requirement | Lambda | ECS |
|------------|--------|-----|
| Stateless operations | Excellent | Overkill |
| API calls, database queries | Excellent | Works |
| Persistent connections | Not possible | Required |
| Operations > 15 minutes | Not possible | Required |
| Large memory needs | Limited | Flexible |
| Cost model | Pay per invocation | Pay for capacity |

**Lambda** excels for stateless operations like API calls, database queries, and calculations. The serverless model means you pay only for actual tool invocations, and Lambda scales instantly to handle traffic spikes.

**Amazon ECS** becomes necessary for more complex requirements—persistent connections to external systems, large memory needs, or long-running operations. ECS provides full control over your container environment while still integrating smoothly with AWS infrastructure.

---

## Agent Collaboration Patterns

When multiple agents work together, the collaboration pattern determines how they coordinate. Two primary patterns dominate: **hierarchical (supervisor)** and **peer-to-peer**. Understanding when to use each pattern is essential for designing multi-agent systems.

### Supervisor Pattern (Hierarchical)

A supervisor agent acts as the coordinator, receiving user requests and delegating to specialist agents. The supervisor decides which agent handles each subtask, aggregates results, and maintains conversation continuity.

```
              ┌──────────────────┐
              │  Supervisor      │
              │  Agent           │
              └────────┬─────────┘
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │Research │  │Analysis │  │Writing  │
    │ Agent   │  │ Agent   │  │ Agent   │
    └─────────┘  └─────────┘  └─────────┘
```

**Characteristics:**
- Single entry point for all requests
- Clear accountability—supervisor owns the outcome
- Specialists focus on narrow domains
- Natural fit for **AWS Agent Squad**

### Peer-to-Peer Pattern (Collaborative)

Agents communicate directly with each other without a central coordinator. Each agent decides when to involve others based on its assessment of the task.

```
    ┌─────────┐     ┌─────────┐
    │Agent A  │◄───►│Agent B  │
    └────┬────┘     └────┬────┘
         │               │
         └───────┬───────┘
                 │
         ┌───────▼───────┐
         │ Shared State  │
         │ (EventBridge) │
         └───────────────┘
```

**Characteristics:**
- Decentralized decision-making
- Agents self-organize based on capabilities
- More resilient—no single point of failure
- Implemented via **EventBridge** or shared state in **DynamoDB**

### When to Use Each Pattern

| Factor | Supervisor | Peer-to-Peer |
|--------|------------|--------------|
| Accountability | Clear single owner | Distributed |
| Complexity | Lower, predictable | Higher, emergent |
| Scalability | Supervisor bottleneck | Scales horizontally |
| Debugging | Easier to trace | Harder to follow |
| Best for | Customer service, workflows | Research, creative tasks |
| AWS implementation | Agent Squad | EventBridge + Lambda |

Many production systems use a **hybrid approach**: a supervisor handles routing at the top level, but specialist agents may collaborate peer-to-peer within their domain.

---

## Agent Safety and Guardrails

Autonomous agents introduce risks that don't exist in simpler AI applications. An agent that can take actions can also take **wrong actions** or **harmful actions**. When an agent has access to customer databases, payment systems, or communication tools, the consequences of errors or manipulation extend beyond bad text into the real world.

Production agents require robust safety mechanisms implemented in **depth**—multiple layers, each catching what others might miss.

### Layer 1: IAM Resource Boundaries

**Principle of least privilege** applies doubly for agents—they should only have access to the specific tools and resources they need for their defined purpose. An agent built to look up order status shouldn't have permissions to modify orders, issue refunds, or access other customer data.

Even if the agent's reasoning is manipulated through prompt injection, it cannot exceed its IAM permissions. IAM is your hard boundary.

### Layer 2: Operational Controls via Step Functions

Agents can get stuck in loops, repeatedly calling the same tools without making progress. They can encounter errors that cause them to retry indefinitely. Without controls, a malfunctioning agent can accumulate significant costs or take repeated unintended actions.

Step Functions provides the mechanisms to prevent this:
- **Maximum iteration limits** stop infinite loops
- **Timeouts** prevent runaway executions
- **Circuit breakers** halt operations when error rates exceed thresholds

### Layer 3: Human-in-the-Loop

Not every action should be autonomous. Refunds above a certain threshold, communications sent to customers, data deletions, and other irreversible or high-stakes actions warrant human oversight.

Step Functions integrates naturally with approval workflows—the workflow pauses at a designated state, sends a notification through SNS or triggers an API Gateway callback, and waits for human response. Upon approval, execution continues; on rejection, it routes to an alternative path.

### Layer 4: Tool Parameter Validation

Even when an agent has permission to call a tool, the specific parameters matter. Is the order ID in the correct format? Is the refund amount within reasonable bounds for this order?

Lambda functions implementing tools can include **business-rule validation** that catches problematic requests regardless of whether they originated from agent error or manipulation.

### Layer 5: Bedrock Guardrails

Bedrock Guardrails adds content filtering as a final layer, applying to both agent inputs and outputs. This helps catch prompt injection attempts designed to manipulate agent behavior, as well as ensuring agent responses meet content policies.

---

## Tool Design and Implementation

The tools available to an agent define its capabilities. A well-designed tool has three essential properties:

1. **Clear interface** that the agent can understand
2. **Predictable behavior** that produces consistent results
3. **Robust error handling** that provides useful information when things go wrong

### Standardized Function Definitions

Use **OpenAPI** or **JSON Schema** to describe exactly what inputs a tool expects, what outputs it produces, and what the tool does. These specifications serve multiple purposes:

- Help the model understand how to call the tool correctly
- Enable automatic validation of tool calls
- Generate documentation
- Support client code generation

```python
tool_spec = {
    'toolSpec': {
        'name': 'processRefund',
        'description': 'Process a refund for an order. Returns refund confirmation.',
        'inputSchema': {
            'json': {
                'type': 'object',
                'properties': {
                    'orderId': {
                        'type': 'string',
                        'description': 'The order ID to refund'
                    },
                    'amount': {
                        'type': 'number',
                        'description': 'Refund amount in dollars'
                    },
                    'reason': {
                        'type': 'string',
                        'description': 'Reason for the refund'
                    }
                },
                'required': ['orderId', 'amount']
            }
        }
    }
}
```

### Structured Error Responses

Error handling in tools should return structured information that helps the agent decide what to do next. Rather than returning a generic failure, return error codes and descriptions that the agent can reason about:

| Error Code | Meaning | Agent Should |
|------------|---------|--------------|
| `ORDER_NOT_FOUND` | Order doesn't exist | Ask user to verify order number |
| `SERVICE_UNAVAILABLE` | Temporary failure | Retry after delay |
| `PERMISSION_DENIED` | Cannot perform action | Inform user, don't retry |
| `INVALID_AMOUNT` | Amount exceeds order value | Ask for correct amount |

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "autonomous" or "multi-step" or "tool use" | Bedrock Agents or Strands SDK |
| "coordinate multiple specialized agents" | Supervisor pattern via Agent Squad |
| "self-organizing" or "decentralized agents" | Peer-to-peer via EventBridge |
| "standardized tool interface" or "portable tools" | Model Context Protocol (MCP) |
| "prevent agent from harmful actions" | IAM boundaries + Step Functions timeouts |
| "human approval for sensitive actions" | Step Functions callback pattern |
| "stateless tool hosting" | Lambda |
| "persistent connections" or "stateful tools" | ECS |
| "reasoning loop" or "thought-action-observation" | ReAct pattern |

---

## Key Takeaways

> **1. Agents are autonomous systems that plan, use tools, reason, and iterate to achieve goals.**
> This is fundamentally different from simple prompt-response interactions. Agents actively work toward objectives.

> **2. The ReAct pattern (Thought → Action → Observation → Repeat) is foundational.**
> Most effective agents alternate between reasoning about what to do and actually doing it, using observations to inform next steps.

> **3. MCP standardizes tool interfaces for portability across AI systems.**
> Build tools once, use them with any MCP-compatible agent. The ecosystem is growing.

> **4. Supervisor pattern for coordinated specialists; peer-to-peer for self-organizing collaboration.**
> Agent Squad implements supervisor; EventBridge enables peer-to-peer. Many systems use hybrid approaches.

> **5. Lambda for stateless tools, ECS for complex/stateful MCP servers.**
> Start with Lambda for simplicity. Move to ECS only when specific requirements demand it.

> **6. Agent safety requires defense in depth.**
> IAM boundaries, Step Functions timeouts and circuit breakers, human-in-the-loop for sensitive actions, parameter validation, and Guardrails content filtering.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Building agents when simple prompting would suffice** | Agents add complexity. If you just need a response to a question, you don't need an agent loop. |
| **Giving agents broader IAM permissions than needed** | Violates least privilege. If an agent is compromised, damage is limited to its permissions. |
| **No timeout or iteration limits on agent loops** | Agents can get stuck, accumulating costs and taking repeated unintended actions. |
| **Skipping human-in-the-loop for sensitive actions** | Some actions are too consequential for full autonomy. Build in approval workflows. |
| **Implementing custom tool protocols instead of MCP** | Reinventing the wheel. MCP provides standardization and portability. |
| **Ignoring tool parameter validation** | Just because an agent has permission to call a tool doesn't mean every parameter value is valid. |
