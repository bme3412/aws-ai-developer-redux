#!/usr/bin/env node

/**
 * insert-official-batch3.js
 *
 * Inserts 20 additional official-style AWS practice exam questions (op-41 through op-60)
 * into official-practice.json. Each question includes full strategicBreakdown.
 *
 * Usage: node scripts/insert-official-batch3.js
 */

const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'src', 'data', 'questions', 'official-practice.json');

const newQuestions = [
  // ─── op-41 ── Domain 1 — Continued pre-training ───────────────────
  {
    id: "op-41",
    domain: 1,
    task: "1.3",
    skills: ["1.3.2"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A biotech company wants to use an FM for analyzing proprietary genomics research papers. The base FM performs poorly on domain-specific terminology and concepts because its original training data contained very little genomics content. The company has a large corpus of internal genomics papers but they are unlabeled.",
    question: "Which model customization technique is MOST appropriate for improving the FM's understanding of genomics terminology?",
    options: [
      { id: "a", text: "Fine-tune the model using the genomics papers with manually created question-answer pairs." },
      { id: "b", text: "Use continued pre-training on Amazon Bedrock to expose the FM to the unlabeled genomics corpus so it learns domain vocabulary and concepts." },
      { id: "c", text: "Create a RAG pipeline that retrieves relevant genomics papers at inference time." },
      { id: "d", text: "Increase the context window size so the model can process longer genomics documents." }
    ],
    correctAnswers: ["b"],
    explanation: "Continued pre-training exposes the FM to a large volume of unlabeled domain-specific text, allowing it to learn new vocabulary, terminology patterns, and domain concepts. This is ideal when the base model lacks fundamental domain knowledge and you have unlabeled data — no labeled examples are required.",
    incorrectExplanations: {
      a: "Fine-tuning requires labeled data (input-output pairs), but the company's corpus is unlabeled. Creating labels for a large corpus would be extremely time-consuming and expensive.",
      c: "RAG provides relevant context at inference time but doesn't improve the model's fundamental understanding of domain terminology. The model may still misinterpret retrieved genomics content.",
      d: "A larger context window allows processing longer inputs but doesn't teach the model genomics terminology. The model would still misunderstand domain-specific concepts."
    },
    parseStrategy: {
      keyPhrase: "poorly on domain-specific terminology … large corpus … unlabeled",
      eliminationHints: [
        "Fine-tuning = needs labeled data, corpus is unlabeled",
        "RAG = retrieval, not comprehension improvement",
        "Context window = length, not understanding",
        "Continued pre-training = learns from unlabeled text"
      ],
      decisionFramework: "Unlabeled domain corpus + need to learn domain vocabulary = continued pre-training. Labeled data + task-specific behavior = fine-tuning."
    },
    services: ["Amazon Bedrock"],
    examTip: "Continued pre-training vs fine-tuning: CPT uses unlabeled data to learn domain knowledge. Fine-tuning uses labeled data to learn task behavior. Know the difference.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you teach an FM to understand a specialized domain when you have lots of unlabeled domain text?",
      testedConcepts: ["Continued pre-training", "Fine-tuning vs CPT", "Unlabeled vs labeled data", "Domain adaptation"],
      servicesInPlay: [
        { service: "Amazon Bedrock (Continued Pre-Training)", role: "Learns domain vocabulary and concepts from unlabeled text", isCorrectAnswer: true },
        { service: "Amazon Bedrock (Fine-Tuning)", role: "Requires labeled data — not available here", isCorrectAnswer: false },
        { service: "Amazon Bedrock Knowledge Bases (RAG)", role: "Retrieval at inference — doesn't improve model understanding", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Key detail: data is unlabeled. 2. Fine-tuning needs labeled pairs — can't use it — eliminate A. 3. RAG retrieves but doesn't teach — eliminate C. 4. Context window is about length, not understanding — eliminate D. 5. Continued pre-training learns from unlabeled text.",
      commonMistakes: [
        "Confusing continued pre-training (unlabeled) with fine-tuning (labeled)",
        "Thinking RAG solves domain comprehension problems — it only provides context",
        "Assuming larger context windows improve domain understanding"
      ],
      timeManagementTip: "Unlabeled data + domain knowledge gap = continued pre-training. Labeled data + task behavior = fine-tuning. Quick decision tree."
    }
  },

  // ─── op-42 ── Domain 2 — Lambda action groups ─────────────────────
  {
    id: "op-42",
    domain: 2,
    task: "2.2",
    skills: ["2.2.1"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A developer is configuring an Amazon Bedrock Agent to look up customer orders from an existing REST API. The agent needs to call the API with specific parameters (customer ID, date range) based on the user's natural language request. The developer must define how the agent interacts with this API.",
    question: "Which configuration is required to enable the agent to call the order lookup API?",
    options: [
      { id: "a", text: "Create an Action Group with an OpenAPI schema defining the API operations and parameters, backed by a Lambda function that calls the REST API." },
      { id: "b", text: "Embed the REST API URL directly in the agent's system prompt and instruct the model to make HTTP calls." },
      { id: "c", text: "Configure an Amazon API Gateway integration that the agent accesses automatically through its IAM role." },
      { id: "d", text: "Store the API response format in a Knowledge Base so the agent knows how to parse API responses." }
    ],
    correctAnswers: ["a"],
    explanation: "Bedrock Agent Action Groups define the actions an agent can take. Each action is specified by an OpenAPI schema that describes the operation, parameters, and expected responses. A Lambda function serves as the execution layer, receiving the agent's parsed parameters and calling the actual REST API.",
    incorrectExplanations: {
      b: "FMs cannot make HTTP calls. They generate text — they don't execute code or make network requests. The agent framework uses Action Groups and Lambda to bridge this gap.",
      c: "API Gateway is not automatically integrated with Bedrock Agents. The agent needs an Action Group definition to know what operations are available and how to invoke them.",
      d: "Knowledge Bases are for document retrieval (RAG), not for API interaction. Storing API documentation in a KB doesn't enable the agent to call the API."
    },
    parseStrategy: {
      keyPhrase: "call the order lookup API … define how the agent interacts",
      eliminationHints: [
        "System prompt URL = FMs can't make HTTP calls",
        "API Gateway alone = no agent awareness of operations",
        "Knowledge Base = document retrieval, not API calling",
        "Action Group + OpenAPI + Lambda = agent API integration pattern"
      ],
      decisionFramework: "Bedrock Agent + external API = Action Group (OpenAPI schema) + Lambda (execution). This is the standard pattern."
    },
    services: ["Amazon Bedrock Agents", "AWS Lambda"],
    examTip: "Action Groups are how Bedrock Agents interact with external systems. OpenAPI schema defines the interface, Lambda provides the execution.",
    strategicBreakdown: {
      whatIsBeingAsked: "What's the correct architecture for a Bedrock Agent to call an external REST API?",
      testedConcepts: ["Bedrock Agent Action Groups", "OpenAPI schema definitions", "Lambda execution for agents", "Agent-API integration patterns"],
      servicesInPlay: [
        { service: "Amazon Bedrock Agents (Action Groups)", role: "Defines available API operations via OpenAPI schema", isCorrectAnswer: true },
        { service: "AWS Lambda", role: "Executes the actual API call with parsed parameters", isCorrectAnswer: true },
        { service: "Amazon API Gateway", role: "API management — not directly integrated with agent framework", isCorrectAnswer: false },
        { service: "Amazon Bedrock Knowledge Bases", role: "Document retrieval — not API interaction", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Agent needs to call an API. 2. FMs can't make HTTP calls — eliminate B. 3. Knowledge Base = retrieval, not action — eliminate D. 4. API Gateway alone has no agent awareness — eliminate C. 5. Action Group + OpenAPI schema + Lambda = standard agent pattern.",
      commonMistakes: [
        "Thinking the FM can make HTTP requests directly — it generates text, not network calls",
        "Confusing Knowledge Bases (retrieval) with Action Groups (actions)",
        "Missing that both OpenAPI schema AND Lambda are needed for Action Groups"
      ],
      timeManagementTip: "Agent + external API = Action Group. Fundamental Bedrock Agent concept — instant recognition."
    }
  },

  // ─── op-43 ── Domain 3 — Guardrails: denied topics ────────────────
  {
    id: "op-43",
    domain: 3,
    task: "3.1",
    skills: ["3.1.1"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A financial advisory firm's GenAI chatbot must never provide specific investment recommendations or tax advice, as this could create legal liability. The chatbot should redirect users to licensed advisors when these topics arise. The team needs this policy enforced consistently regardless of how users phrase their requests.",
    question: "Which Amazon Bedrock Guardrails feature should be configured to enforce this policy?",
    options: [
      { id: "a", text: "Configure content filters with high sensitivity to block all financial-related content." },
      { id: "b", text: "Create denied topic policies that define 'investment recommendations' and 'tax advice' as prohibited topics with custom messaging to redirect users to licensed advisors." },
      { id: "c", text: "Add word filters to block keywords like 'invest,' 'stock,' and 'tax' from all inputs and outputs." },
      { id: "d", text: "Use the system prompt to instruct the model to decline investment and tax questions." }
    ],
    correctAnswers: ["b"],
    explanation: "Denied topic policies in Bedrock Guardrails use natural language descriptions to define prohibited topics. They understand the semantic intent of requests regardless of phrasing, and can return custom messaging directing users to appropriate resources. This provides reliable, consistent enforcement.",
    incorrectExplanations: {
      a: "Content filters block harmful content categories (violence, hate speech, etc.), not business-specific topics like investment advice. They would also block legitimate financial discussions the chatbot should handle.",
      c: "Keyword filters are too blunt — they would block legitimate uses of words like 'invest' or 'tax' in general conversation. They also fail when users rephrase to avoid the exact keywords.",
      d: "System prompt instructions can be bypassed through prompt injection. For legal compliance, enforcement cannot rely solely on model behavior — it needs a guardrail layer."
    },
    parseStrategy: {
      keyPhrase: "never provide … regardless of how users phrase",
      eliminationHints: [
        "Content filters = harmful content categories, not business topics",
        "Word filters = too blunt, easily bypassed by rephrasing",
        "System prompt = can be bypassed via prompt injection",
        "Denied topics = semantic understanding of prohibited topics"
      ],
      decisionFramework: "Business-specific topic prohibition + phrasing-agnostic = denied topic policies. Content filters = harmful content. Word filters = exact matches."
    },
    services: ["Amazon Bedrock Guardrails"],
    examTip: "Know the three Guardrails filter types: content filters (harmful categories), denied topics (business-specific prohibitions), word filters (exact keyword blocking).",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you prevent a chatbot from discussing specific business topics regardless of how users phrase the question?",
      testedConcepts: ["Bedrock Guardrails denied topics", "Content filters vs denied topics vs word filters", "Semantic topic detection", "Legal compliance enforcement"],
      servicesInPlay: [
        { service: "Amazon Bedrock Guardrails (Denied Topics)", role: "Semantically detects and blocks prohibited business topics with custom redirect messaging", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Need = block specific business topics, not general harmful content. 2. Content filters = wrong scope (harmful categories) — eliminate A. 3. Word filters = too brittle, easily bypassed — eliminate C. 4. System prompt = can be jailbroken — eliminate D. 5. Denied topics = semantic understanding of business-specific prohibitions.",
      commonMistakes: [
        "Confusing content filters (harmful content categories) with denied topics (business-specific prohibitions)",
        "Using word filters when semantic understanding is needed",
        "Relying on system prompt for compliance-critical topic blocking"
      ],
      timeManagementTip: "Specific business topic blocking = denied topics. Harmful content = content filters. Exact words = word filters. Quick categorization."
    }
  },

  // ─── op-44 ── Domain 2 — Chain of thought prompting ───────────────
  {
    id: "op-44",
    domain: 2,
    task: "2.1",
    skills: ["2.1.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A developer is building an application that uses an FM to solve multi-step math word problems. The model frequently produces incorrect final answers even though it seems to understand the individual concepts. The developer suspects the model is skipping intermediate reasoning steps.",
    question: "Which prompt engineering technique is MOST likely to improve accuracy on multi-step problems?",
    options: [
      { id: "a", text: "Increase the max tokens parameter to give the model more space to generate a longer answer." },
      { id: "b", text: "Use chain-of-thought prompting by instructing the model to show its reasoning step by step before providing the final answer." },
      { id: "c", text: "Lower the temperature to 0 to eliminate variability in the output." },
      { id: "d", text: "Use a system prompt that says 'You are an expert mathematician.'" }
    ],
    correctAnswers: ["b"],
    explanation: "Chain-of-thought (CoT) prompting instructs the model to break down its reasoning into explicit intermediate steps. For multi-step problems, this prevents the model from skipping logic steps and significantly improves accuracy by making the reasoning process visible and sequential.",
    incorrectExplanations: {
      a: "More tokens allow longer output but don't change the model's reasoning approach. Without CoT, the model may still skip steps regardless of available token space.",
      c: "Temperature 0 makes output deterministic but doesn't change the reasoning strategy. If the model skips steps at any temperature, it will consistently skip them at temperature 0.",
      d: "Persona prompts can influence tone and style but don't provide a reasoning methodology. The model still needs explicit instruction to show step-by-step work."
    },
    parseStrategy: {
      keyPhrase: "multi-step … skipping intermediate reasoning steps",
      eliminationHints: [
        "Max tokens = output length, not reasoning strategy",
        "Temperature 0 = deterministic, same flawed approach",
        "Expert persona = style, not methodology",
        "Chain of thought = explicit step-by-step reasoning"
      ],
      decisionFramework: "Multi-step reasoning failures = chain-of-thought prompting. Make the model show its work."
    },
    services: ["Amazon Bedrock"],
    examTip: "Chain-of-thought is the standard technique for improving multi-step reasoning. 'Think step by step' or 'Show your reasoning' are common CoT triggers.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you get an FM to stop skipping reasoning steps on complex, multi-step problems?",
      testedConcepts: ["Chain-of-thought prompting", "Multi-step reasoning", "Prompt engineering techniques", "Reasoning improvement strategies"],
      servicesInPlay: [
        { service: "Amazon Bedrock", role: "FM inference with chain-of-thought prompting", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Problem = model skips intermediate steps. 2. Max tokens = more space but same behavior — eliminate A. 3. Temperature 0 = deterministic but same reasoning flaw — eliminate C. 4. Persona = style change, not reasoning methodology — eliminate D. 5. Chain-of-thought = explicitly requests step-by-step reasoning.",
      commonMistakes: [
        "Thinking more tokens automatically improves reasoning quality",
        "Confusing determinism (temperature 0) with accuracy",
        "Thinking persona prompts change the model's reasoning methodology"
      ],
      timeManagementTip: "Multi-step reasoning + skipping steps = chain of thought. Core prompt engineering concept."
    }
  },

  // ─── op-45 ── Domain 4 — Invocation logging ───────────────────────
  {
    id: "op-45",
    domain: 4,
    task: "4.2",
    skills: ["4.2.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A compliance team requires that all Amazon Bedrock model invocations — including the full input prompts and model responses — be logged and stored for audit purposes. Logs must be retained for seven years and be searchable for compliance investigations.",
    question: "Which solution meets these logging and retention requirements?",
    options: [
      { id: "a", text: "Enable AWS CloudTrail to capture Bedrock API calls and store them in an S3 bucket with a lifecycle policy." },
      { id: "b", text: "Enable Amazon Bedrock model invocation logging to deliver full request and response data to an S3 bucket configured with a 7-year retention lifecycle policy." },
      { id: "c", text: "Use Amazon CloudWatch Logs to capture model invocation data with a 7-year log retention period." },
      { id: "d", text: "Implement application-level logging in the client code to capture prompts and responses and write them to a database." }
    ],
    correctAnswers: ["b"],
    explanation: "Amazon Bedrock model invocation logging captures the complete request and response payloads (including prompts and model outputs) and delivers them to S3. An S3 lifecycle policy can enforce the 7-year retention requirement, and the data can be queried using Amazon Athena for compliance investigations.",
    incorrectExplanations: {
      a: "CloudTrail logs API call metadata (who called what API, when, from where) but does not capture the full request/response payloads — it doesn't log the actual prompts and model outputs.",
      c: "CloudWatch Logs can store invocation logs but has a maximum retention period of 10 years. However, invocation logging to S3 is more cost-effective for long-term storage and better suited for large payload retention and ad-hoc querying.",
      d: "Application-level logging requires custom code in every client, is difficult to enforce consistently across teams, and creates compliance gaps if any application bypasses the logging."
    },
    parseStrategy: {
      keyPhrase: "full input prompts and model responses … seven years … searchable",
      eliminationHints: [
        "CloudTrail = API metadata only, not full payloads",
        "CloudWatch = works but less cost-effective for 7-year storage",
        "Application logging = inconsistent, hard to enforce",
        "Bedrock invocation logging to S3 = full payloads, lifecycle, queryable"
      ],
      decisionFramework: "Full prompt/response logging + long retention + searchable = Bedrock invocation logging → S3 + Athena."
    },
    services: ["Amazon Bedrock", "Amazon S3", "AWS CloudTrail"],
    examTip: "CloudTrail = who called what API. Bedrock invocation logging = what was in the request and response. Know the difference for audit questions.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you log complete Bedrock prompts and responses for long-term compliance retention?",
      testedConcepts: ["Bedrock model invocation logging", "CloudTrail vs invocation logging", "S3 lifecycle policies", "Compliance data retention"],
      servicesInPlay: [
        { service: "Amazon Bedrock Invocation Logging", role: "Captures full request/response payloads", isCorrectAnswer: true },
        { service: "Amazon S3", role: "Long-term storage with lifecycle retention policies", isCorrectAnswer: true },
        { service: "AWS CloudTrail", role: "API call metadata only — no payload content", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Need full payloads, not just API metadata. 2. CloudTrail = metadata only — eliminate A. 3. Application logging = inconsistent — eliminate D. 4. CloudWatch works but S3 is better for long-term cost and querying — eliminate C. 5. Bedrock invocation logging → S3 = complete solution.",
      commonMistakes: [
        "Thinking CloudTrail captures full request/response payloads — it only logs API call metadata",
        "Not knowing that Bedrock has a dedicated invocation logging feature separate from CloudTrail",
        "Choosing application-level logging for compliance — it's inconsistent and unenforceable"
      ],
      timeManagementTip: "Full prompts/responses + audit = Bedrock invocation logging. CloudTrail = metadata. Quick distinction."
    }
  },

  // ─── op-46 ── Domain 2 — Tool use / function calling ──────────────
  {
    id: "op-46",
    domain: 2,
    task: "2.1",
    skills: ["2.1.3"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A developer is building an application where the FM needs to check real-time weather data and perform currency conversions during a conversation. The developer wants the model to decide when to use these capabilities and provide the results naturally within its responses. The application uses the Amazon Bedrock Converse API.",
    question: "Which implementation approach enables the model to use external tools during a conversation?",
    options: [
      { id: "a", text: "Pre-fetch weather and currency data before each conversation turn and include it in the system prompt." },
      { id: "b", text: "Define tool specifications in the Converse API request, handle tool use requests from the model by executing the tools, and return results in subsequent conversation turns." },
      { id: "c", text: "Train the model to output API call strings that the application parses and executes." },
      { id: "d", text: "Create a Bedrock Agent with Action Groups for weather and currency operations." }
    ],
    correctAnswers: ["b"],
    explanation: "The Converse API supports tool use (function calling) by accepting tool definitions in the request. When the model determines it needs external data, it returns a tool use request with the tool name and parameters. The application executes the tool and sends the results back, allowing the model to incorporate the data into its response.",
    incorrectExplanations: {
      a: "Pre-fetching all possible data is wasteful, may include irrelevant information, and cannot anticipate every possible query. Real-time data should be fetched on demand when the model determines it's needed.",
      c: "Training the model to output API call strings is fragile, requires fine-tuning, and lacks the structured tool use protocol that the Converse API provides natively.",
      d: "A Bedrock Agent is a managed solution for agentic workflows. If the developer is building with the Converse API directly, tool use is the appropriate mechanism — it provides more control and is part of the same API."
    },
    parseStrategy: {
      keyPhrase: "model to decide when to use … Converse API",
      eliminationHints: [
        "Pre-fetch = wasteful, can't anticipate queries",
        "Trained API strings = fragile, requires fine-tuning",
        "Bedrock Agent = separate managed service, not Converse API",
        "Tool use in Converse API = native function calling"
      ],
      decisionFramework: "Model-driven external data access via Converse API = tool use / function calling. Define tools, handle requests, return results."
    },
    services: ["Amazon Bedrock", "Amazon Bedrock Converse API"],
    examTip: "Tool use in the Converse API follows a request-execute-return loop. The model requests tool invocation, your code executes it, and you pass results back.",
    strategicBreakdown: {
      whatIsBeingAsked: "How does a Converse API application let the model call external tools like weather APIs during a conversation?",
      testedConcepts: ["Converse API tool use", "Function calling", "Tool definition and execution loop", "Model-driven tool invocation"],
      servicesInPlay: [
        { service: "Amazon Bedrock Converse API (Tool Use)", role: "Native function calling protocol — define tools, handle requests, return results", isCorrectAnswer: true },
        { service: "Amazon Bedrock Agents", role: "Managed agentic service — different from Converse API tool use", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Using Converse API explicitly — not Bedrock Agents. 2. Pre-fetching = wasteful — eliminate A. 3. Trained API strings = fragile — eliminate C. 4. Bedrock Agent = wrong service for Converse API context — eliminate D. 5. Converse API tool use = native solution.",
      commonMistakes: [
        "Confusing Converse API tool use (developer-managed) with Bedrock Agents (managed agentic service)",
        "Pre-fetching data instead of using on-demand tool invocation",
        "Not understanding the tool use request-execute-return loop"
      ],
      timeManagementTip: "Converse API + external tools = tool use. The question specifies Converse API, so Bedrock Agents is a distractor."
    }
  },

  // ─── op-47 ── Domain 3 — Content provenance / watermarking ────────
  {
    id: "op-47",
    domain: 3,
    task: "3.2",
    skills: ["3.2.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A news organization uses a GenAI application to generate article summaries and image thumbnails. To maintain trust and transparency, the organization wants all AI-generated content to be identifiable as machine-generated. Readers and other platforms should be able to verify whether content was produced by AI.",
    question: "Which approach provides verifiable identification of AI-generated content?",
    options: [
      { id: "a", text: "Add a text disclaimer at the bottom of each AI-generated article stating 'This content was generated by AI.'" },
      { id: "b", text: "Use Amazon Bedrock's built-in watermarking capabilities to embed imperceptible markers in AI-generated images that can be detected by verification tools." },
      { id: "c", text: "Store metadata about AI-generated content in a separate database that readers can query." },
      { id: "d", text: "Use a different font style for AI-generated content so it is visually distinguishable." }
    ],
    correctAnswers: ["b"],
    explanation: "Amazon Bedrock supports watermarking for AI-generated images, embedding imperceptible markers that persist through common modifications. Verification tools can detect these markers to confirm AI origin, providing a tamper-resistant, machine-verifiable solution for content provenance.",
    incorrectExplanations: {
      a: "Text disclaimers can be easily removed, copied, or added to non-AI content. They provide no verifiable proof of AI generation and are not machine-readable.",
      c: "A separate metadata database requires users to actively look up content — it's not embedded in the content itself. It also doesn't survive content redistribution across platforms.",
      d: "Visual styling is superficial and easily changed. It doesn't provide any verifiable provenance and is lost when content is copied or reformatted."
    },
    parseStrategy: {
      keyPhrase: "identifiable as machine-generated … verify whether content was produced by AI",
      eliminationHints: [
        "Text disclaimer = easily removed, not verifiable",
        "Separate database = not embedded, doesn't survive redistribution",
        "Font styling = superficial, easily changed",
        "Watermarking = embedded, persistent, machine-verifiable"
      ],
      decisionFramework: "Verifiable AI content identification = watermarking. Embedded in content, survives redistribution, machine-detectable."
    },
    services: ["Amazon Bedrock"],
    examTip: "Watermarking is the responsible AI answer for content provenance. It embeds proof of AI origin directly in the content, unlike disclaimers or metadata.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you make AI-generated content verifiably identifiable as AI-produced in a tamper-resistant way?",
      testedConcepts: ["AI content watermarking", "Content provenance", "Responsible AI transparency", "Machine-verifiable identification"],
      servicesInPlay: [
        { service: "Amazon Bedrock (Watermarking)", role: "Embeds imperceptible, verifiable markers in AI-generated images", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Need = verifiable, tamper-resistant AI identification. 2. Disclaimers = removable — eliminate A. 3. Separate DB = not embedded, doesn't travel with content — eliminate C. 4. Styling = superficial — eliminate D. 5. Watermarking = embedded, persistent, machine-verifiable.",
      commonMistakes: [
        "Thinking text disclaimers are sufficient for content provenance — they're easily removed",
        "Confusing human-readable labels with machine-verifiable provenance",
        "Not knowing that Bedrock supports watermarking for generated images"
      ],
      timeManagementTip: "Verifiable AI identification = watermarking. The only tamper-resistant option."
    }
  },

  // ─── op-48 ── Domain 5 — Batch inference ──────────────────────────
  {
    id: "op-48",
    domain: 5,
    task: "5.2",
    skills: ["5.2.1"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A marketing team needs to generate personalized email subject lines for 500,000 customers using an FM on Amazon Bedrock. The task is not time-sensitive — results are needed within 24 hours. The team wants to minimize cost compared to real-time inference.",
    question: "Which approach is MOST cost-effective for this large-scale, non-time-sensitive workload?",
    options: [
      { id: "a", text: "Use the InvokeModel API in a loop to process each customer sequentially." },
      { id: "b", text: "Use Amazon Bedrock batch inference to submit all requests as a batch job, which processes them asynchronously at a lower per-request cost." },
      { id: "c", text: "Provision dedicated throughput to process all requests quickly, then release the capacity." },
      { id: "d", text: "Distribute the requests across multiple Lambda functions running in parallel to maximize throughput." }
    ],
    correctAnswers: ["b"],
    explanation: "Bedrock batch inference processes large volumes of requests asynchronously at a discounted rate compared to real-time inference. Since the workload is not time-sensitive, batch processing provides significant cost savings while handling the full volume without managing infrastructure.",
    incorrectExplanations: {
      a: "Sequential InvokeModel calls would take extremely long for 500,000 requests and cost the full on-demand rate. No cost savings and very slow.",
      c: "Provisioned Throughput is designed for consistent, real-time workloads. Provisioning capacity just to process a batch is more expensive than batch inference and wastes the guaranteed capacity model.",
      d: "Parallel Lambda functions increase throughput but still pay the full on-demand per-request rate. There's no cost discount for parallelism — batch inference provides the actual cost reduction."
    },
    parseStrategy: {
      keyPhrase: "500,000 … not time-sensitive … minimize cost",
      eliminationHints: [
        "Sequential InvokeModel = slow + full price",
        "Provisioned Throughput = expensive for one-time batch",
        "Parallel Lambda = full on-demand price, no discount",
        "Batch inference = discounted rate for async processing"
      ],
      decisionFramework: "Large volume + not time-sensitive + cost optimization = batch inference. Always cheaper than on-demand for qualifying workloads."
    },
    services: ["Amazon Bedrock"],
    examTip: "Batch inference = lower cost per request for non-real-time workloads. On-demand = real-time but full price. Provisioned = consistent throughput guarantee.",
    strategicBreakdown: {
      whatIsBeingAsked: "What's the cheapest way to process a large batch of FM requests when you don't need immediate results?",
      testedConcepts: ["Bedrock batch inference", "Cost optimization for large workloads", "On-demand vs batch pricing", "Asynchronous processing"],
      servicesInPlay: [
        { service: "Amazon Bedrock (Batch Inference)", role: "Discounted asynchronous processing for large request volumes", isCorrectAnswer: true },
        { service: "Amazon Bedrock (Provisioned Throughput)", role: "Guaranteed capacity — expensive for one-time batch jobs", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Large volume + no urgency + cost focus. 2. Sequential on-demand = slow + expensive — eliminate A. 3. Provisioned Throughput = overkill for one-time batch — eliminate C. 4. Parallel Lambda = same on-demand price — eliminate D. 5. Batch inference = discounted rate for async processing.",
      commonMistakes: [
        "Thinking parallelism reduces per-request cost — it only reduces wall-clock time",
        "Using Provisioned Throughput for one-time batch jobs — it's for consistent workloads",
        "Not knowing batch inference exists and defaulting to on-demand API calls"
      ],
      timeManagementTip: "Large volume + not urgent + cost = batch inference. Three keywords, instant answer."
    }
  },

  // ─── op-49 ── Domain 4 — Data residency / compliance ──────────────
  {
    id: "op-49",
    domain: 4,
    task: "4.1",
    skills: ["4.1.3"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A European company must comply with GDPR requirements that all customer data processing stays within the EU. The company wants to use Amazon Bedrock for processing customer inquiries that contain personal data. They need to ensure that model invocation data never leaves EU boundaries.",
    question: "Which approach ensures GDPR data residency compliance when using Amazon Bedrock?",
    options: [
      { id: "a", text: "Enable cross-Region inference to distribute requests across all available Regions for best performance." },
      { id: "b", text: "Deploy the application in an EU Region (such as eu-west-1) and invoke Bedrock models in the same EU Region, ensuring all data processing stays within EU boundaries." },
      { id: "c", text: "Use a VPN connection to encrypt data in transit so it is protected regardless of which Region processes it." },
      { id: "d", text: "Sign a Data Processing Agreement (DPA) with AWS, which exempts the company from data residency requirements." }
    ],
    correctAnswers: ["b"],
    explanation: "Using Amazon Bedrock in an EU Region ensures that all data processing — including model invocation, input prompts, and output responses — stays within EU boundaries. AWS Regions are physically isolated, so data in eu-west-1 (Ireland) or eu-central-1 (Frankfurt) remains in the EU, satisfying GDPR data residency requirements.",
    incorrectExplanations: {
      a: "Cross-Region inference routes requests to other Regions for capacity, which may include non-EU Regions. This could violate GDPR data residency requirements by processing data outside the EU.",
      c: "VPN encryption protects data in transit but doesn't control where data is processed. GDPR data residency is about processing location, not encryption in transit.",
      d: "A DPA is required for GDPR compliance but does not exempt a company from data residency requirements. Data must still be processed in compliant locations."
    },
    parseStrategy: {
      keyPhrase: "data processing stays within the EU … GDPR",
      eliminationHints: [
        "Cross-Region = may route to non-EU Regions",
        "VPN = encryption, not processing location",
        "DPA = contractual, doesn't override residency requirements",
        "EU Region deployment = data stays in EU"
      ],
      decisionFramework: "GDPR data residency = deploy and invoke in EU Regions only. Avoid cross-Region features that may route outside EU."
    },
    services: ["Amazon Bedrock"],
    examTip: "Data residency = Region selection. Cross-Region inference can violate residency requirements. Always match deployment Region to compliance jurisdiction.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you ensure Bedrock data processing stays in the EU for GDPR compliance?",
      testedConcepts: ["Data residency compliance", "AWS Region selection", "GDPR requirements", "Cross-Region inference risks"],
      servicesInPlay: [
        { service: "Amazon Bedrock (EU Region)", role: "All processing stays within EU boundaries", isCorrectAnswer: true },
        { service: "Amazon Bedrock (Cross-Region Inference)", role: "May route to non-EU Regions — violates residency", isCorrectAnswer: false }
      ],
      approachStrategy: "1. GDPR = data must stay in EU. 2. Cross-Region inference may route outside EU — eliminate A. 3. VPN = encryption, not location — eliminate C. 4. DPA doesn't override residency — eliminate D. 5. EU Region deployment = data stays in EU.",
      commonMistakes: [
        "Enabling cross-Region inference when data residency is required — it may route outside the jurisdiction",
        "Thinking encryption (VPN) satisfies data residency — residency is about location, not encryption",
        "Believing a DPA removes the need for data residency controls"
      ],
      timeManagementTip: "Data residency = Region selection. GDPR + EU = deploy in EU Region. Cross-Region = risk. Quick logic."
    }
  },

  // ─── op-50 ── Domain 2 — Prompt management ───────────────────────
  {
    id: "op-50",
    domain: 2,
    task: "2.1",
    skills: ["2.1.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A development team manages dozens of prompts across multiple GenAI applications. They frequently update prompts to improve quality and need to track which prompt versions are in production. When a new prompt version causes issues, they need to quickly revert to a previous working version.",
    question: "Which Amazon Bedrock feature provides centralized prompt lifecycle management?",
    options: [
      { id: "a", text: "Store prompts as environment variables in each application's deployment configuration." },
      { id: "b", text: "Use Amazon Bedrock Prompt Management to create, version, and manage prompts centrally, with the ability to reference specific prompt versions from applications." },
      { id: "c", text: "Store prompts in an S3 bucket with versioning enabled and have applications read prompts from S3 at runtime." },
      { id: "d", text: "Maintain prompts in a Git repository and deploy them through CI/CD pipelines." }
    ],
    correctAnswers: ["b"],
    explanation: "Amazon Bedrock Prompt Management provides a centralized service for creating, versioning, and managing prompts. Applications reference specific prompt versions via ARNs, enabling controlled rollouts and instant rollbacks without application redeployment.",
    incorrectExplanations: {
      a: "Environment variables require application redeployment for each prompt change and provide no versioning, rollback, or centralized management capabilities.",
      c: "S3 versioning provides file-level versioning but lacks prompt-specific features like testing, variable substitution, and integration with Bedrock APIs. It's a generic storage solution, not a prompt management system.",
      d: "Git provides version control but requires CI/CD pipeline runs for each prompt change. This adds deployment latency and complexity compared to a managed prompt service with instant version switching."
    },
    parseStrategy: {
      keyPhrase: "centralized prompt lifecycle management … version … revert",
      eliminationHints: [
        "Environment variables = no versioning, requires redeployment",
        "S3 versioning = generic storage, no prompt-specific features",
        "Git + CI/CD = deployment overhead for prompt changes",
        "Bedrock Prompt Management = purpose-built, versioned, instant rollback"
      ],
      decisionFramework: "Centralized prompt versioning with rollback = Bedrock Prompt Management. Don't build custom solutions."
    },
    services: ["Amazon Bedrock Prompt Management"],
    examTip: "Bedrock Prompt Management is the managed solution for prompt versioning and lifecycle. Applications reference prompt ARNs for version control.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you manage, version, and roll back prompts across multiple applications without custom infrastructure?",
      testedConcepts: ["Amazon Bedrock Prompt Management", "Prompt versioning", "Prompt lifecycle management", "Centralized vs distributed prompt storage"],
      servicesInPlay: [
        { service: "Amazon Bedrock Prompt Management", role: "Centralized prompt creation, versioning, and lifecycle management", isCorrectAnswer: true },
        { service: "Amazon S3", role: "Generic file storage — lacks prompt-specific management features", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Need: centralized, versioned, rollback-capable prompt management. 2. Env vars = no versioning — eliminate A. 3. S3 = generic, no prompt features — eliminate C. 4. Git = deployment overhead — eliminate D. 5. Bedrock Prompt Management = purpose-built solution.",
      commonMistakes: [
        "Using S3 or Git for prompt management instead of the purpose-built Bedrock feature",
        "Storing prompts in environment variables — no versioning or rollback",
        "Building custom prompt management systems when a managed service exists"
      ],
      timeManagementTip: "Prompt versioning + rollback + centralized = Bedrock Prompt Management. Managed service, instant answer."
    }
  },

  // ─── op-51 ── Domain 1 — Model benchmarks ────────────────────────
  {
    id: "op-51",
    domain: 1,
    task: "1.1",
    skills: ["1.1.1"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A company is evaluating multiple foundation models for a complex reasoning and analysis application. The team needs to compare models objectively using industry-standard benchmarks. They want to assess general knowledge, common-sense reasoning, and language understanding across candidates.",
    question: "Which set of benchmarks is MOST relevant for evaluating general reasoning and language capabilities?",
    options: [
      { id: "a", text: "BLEU, ROUGE, and METEOR — metrics that measure text generation quality against reference translations." },
      { id: "b", text: "MMLU, HellaSwag, and ARC — benchmarks that evaluate knowledge breadth, common-sense reasoning, and science understanding." },
      { id: "c", text: "Precision, recall, and F1-score — classification metrics measured on the company's custom test set." },
      { id: "d", text: "Tokens per second and time to first token — performance benchmarks measuring inference speed." }
    ],
    correctAnswers: ["b"],
    explanation: "MMLU (Massive Multitask Language Understanding) tests broad knowledge across 57 subjects. HellaSwag evaluates common-sense reasoning. ARC (AI2 Reasoning Challenge) tests science reasoning. Together, these benchmarks comprehensively assess an FM's general reasoning and language capabilities.",
    incorrectExplanations: {
      a: "BLEU, ROUGE, and METEOR are text similarity metrics designed for machine translation and summarization. They measure output overlap with references, not reasoning or knowledge.",
      c: "Precision, recall, and F1 are classification metrics. While useful for specific tasks, they don't measure general reasoning capabilities and require a labeled test set for a specific use case.",
      d: "Tokens per second and time to first token measure inference performance (speed), not model capability for reasoning and language understanding."
    },
    parseStrategy: {
      keyPhrase: "general knowledge, common-sense reasoning, and language understanding",
      eliminationHints: [
        "BLEU/ROUGE/METEOR = translation/summarization similarity",
        "Precision/recall/F1 = classification metrics",
        "Speed metrics = performance, not capability",
        "MMLU/HellaSwag/ARC = reasoning and knowledge benchmarks"
      ],
      decisionFramework: "General reasoning evaluation = MMLU, HellaSwag, ARC. Text similarity = BLEU, ROUGE. Classification = precision, recall, F1."
    },
    services: ["Amazon Bedrock"],
    examTip: "Know the benchmark categories: MMLU/HellaSwag/ARC for reasoning, BLEU/ROUGE for text similarity, precision/recall/F1 for classification.",
    strategicBreakdown: {
      whatIsBeingAsked: "Which benchmarks measure how well an FM reasons and understands language broadly?",
      testedConcepts: ["FM evaluation benchmarks", "MMLU", "HellaSwag", "ARC", "Benchmark categorization"],
      servicesInPlay: [
        { service: "Amazon Bedrock", role: "FM hosting — models evaluated against standard benchmarks", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Need: general reasoning + knowledge + language understanding. 2. BLEU/ROUGE = text similarity, not reasoning — eliminate A. 3. Classification metrics = task-specific, not general — eliminate C. 4. Speed metrics = performance, not capability — eliminate D. 5. MMLU/HellaSwag/ARC = designed for reasoning evaluation.",
      commonMistakes: [
        "Confusing text similarity metrics (BLEU/ROUGE) with reasoning benchmarks (MMLU/ARC)",
        "Using classification metrics to evaluate general language capabilities",
        "Mixing up performance metrics (speed) with capability metrics (reasoning)"
      ],
      timeManagementTip: "General reasoning = MMLU/HellaSwag/ARC. Text similarity = BLEU/ROUGE. Know the categories."
    }
  },

  // ─── op-52 ── Domain 2 — Multi-agent collaboration ───────────────
  {
    id: "op-52",
    domain: 2,
    task: "2.2",
    skills: ["2.2.2"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A company is building a complex customer service system where different tasks require specialized capabilities: one agent handles order management, another handles product recommendations, and a third handles complaint resolution. A supervisory agent must route customer requests to the appropriate specialist and combine their results.",
    question: "Which Amazon Bedrock feature supports this multi-agent architecture?",
    options: [
      { id: "a", text: "Create a single Bedrock Agent with multiple Action Groups — one for each specialized task." },
      { id: "b", text: "Use Amazon Bedrock multi-agent collaboration, where a supervisor agent orchestrates multiple sub-agents, each with its own specialized instructions, tools, and knowledge." },
      { id: "c", text: "Build separate Bedrock Agents and use Step Functions to route requests between them based on intent classification." },
      { id: "d", text: "Deploy multiple independent agents behind an Application Load Balancer with path-based routing." }
    ],
    correctAnswers: ["b"],
    explanation: "Amazon Bedrock multi-agent collaboration enables a supervisor agent to orchestrate multiple specialized sub-agents. Each sub-agent has independent instructions, Action Groups, and Knowledge Bases. The supervisor determines which sub-agent(s) to invoke based on the request, coordinates their work, and synthesizes results.",
    incorrectExplanations: {
      a: "A single agent with multiple Action Groups doesn't provide the separation of concerns, independent instructions, or specialized knowledge that separate sub-agents offer. Complex systems benefit from modular agent design.",
      c: "Step Functions orchestration requires predefined workflows and doesn't provide the dynamic, AI-driven routing that a supervisor agent offers. It also adds infrastructure complexity.",
      d: "ALB routing is a network-level solution that can't understand natural language intent. It requires explicit path definitions and doesn't support the dynamic orchestration multi-agent collaboration provides."
    },
    parseStrategy: {
      keyPhrase: "supervisory agent … route … specialized … combine results",
      eliminationHints: [
        "Single agent = no separation of concerns for complex tasks",
        "Step Functions = predefined workflows, not dynamic AI routing",
        "ALB = network routing, not intent-based",
        "Multi-agent collaboration = supervisor + specialized sub-agents"
      ],
      decisionFramework: "Supervisor + specialized agents = Bedrock multi-agent collaboration. Single agent for simple, multi-agent for complex."
    },
    services: ["Amazon Bedrock Agents"],
    examTip: "Multi-agent collaboration is for complex systems where different tasks need specialized agents. A supervisor routes and coordinates. Know when single vs multi-agent is appropriate.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you build a system where a supervisor agent dynamically routes to and coordinates multiple specialized agents?",
      testedConcepts: ["Bedrock multi-agent collaboration", "Supervisor-sub-agent pattern", "Agent specialization", "Dynamic orchestration"],
      servicesInPlay: [
        { service: "Amazon Bedrock Multi-Agent Collaboration", role: "Supervisor orchestrates specialized sub-agents dynamically", isCorrectAnswer: true },
        { service: "AWS Step Functions", role: "Workflow orchestration — predefined, not dynamic AI routing", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Need: supervisor + specialized sub-agents + dynamic routing. 2. Single agent = insufficient separation — eliminate A. 3. Step Functions = predefined, not AI-driven — eliminate C. 4. ALB = network routing, not intent — eliminate D. 5. Multi-agent collaboration = purpose-built for this.",
      commonMistakes: [
        "Trying to handle everything in a single agent with many Action Groups instead of using specialized sub-agents",
        "Using Step Functions for dynamic AI routing — it's for predefined workflows",
        "Not knowing Bedrock supports native multi-agent collaboration"
      ],
      timeManagementTip: "Supervisor + specialized agents = multi-agent collaboration. The architecture description maps directly to the feature."
    }
  },

  // ─── op-53 ── Domain 5 — CloudWatch metrics for Bedrock ──────────
  {
    id: "op-53",
    domain: 5,
    task: "5.2",
    skills: ["5.2.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "An operations team needs to set up automated alerts for their Amazon Bedrock application. They want to be notified when model invocation errors exceed a threshold, when latency spikes beyond acceptable limits, and when token consumption patterns change unexpectedly.",
    question: "Which monitoring setup provides automated alerting for these operational metrics?",
    options: [
      { id: "a", text: "Parse application logs with a Lambda function to detect errors and send SNS notifications." },
      { id: "b", text: "Use Amazon CloudWatch metrics for Amazon Bedrock to monitor invocation counts, errors, and latency, and create CloudWatch Alarms to trigger SNS notifications when thresholds are breached." },
      { id: "c", text: "Enable AWS CloudTrail and create EventBridge rules to detect Bedrock API call patterns." },
      { id: "d", text: "Build a custom dashboard that polls the Bedrock API for health status every minute." }
    ],
    correctAnswers: ["b"],
    explanation: "Amazon Bedrock publishes operational metrics to Amazon CloudWatch, including invocation count, invocation errors, invocation latency, and token counts. CloudWatch Alarms can be configured on these metrics with thresholds to automatically trigger SNS notifications, providing automated operational alerting without custom infrastructure.",
    incorrectExplanations: {
      a: "Custom Lambda log parsing adds development and maintenance overhead. CloudWatch already provides the metrics natively — no need to build custom extraction logic.",
      c: "CloudTrail tracks API calls for audit purposes but doesn't provide real-time operational metrics like latency and error rates. EventBridge rules on CloudTrail are for API call events, not performance metrics.",
      d: "Custom polling adds infrastructure, doesn't scale, and the Bedrock API doesn't have a dedicated health status endpoint for this purpose. CloudWatch provides this natively."
    },
    parseStrategy: {
      keyPhrase: "automated alerts … errors … latency … token consumption",
      eliminationHints: [
        "Custom Lambda parsing = unnecessary, metrics exist natively",
        "CloudTrail = audit events, not operational metrics",
        "Custom polling = doesn't scale, no native health endpoint",
        "CloudWatch metrics + Alarms = native operational monitoring"
      ],
      decisionFramework: "Bedrock operational monitoring = CloudWatch metrics + Alarms. Native integration, no custom code needed."
    },
    services: ["Amazon Bedrock", "Amazon CloudWatch", "Amazon SNS"],
    examTip: "Bedrock publishes metrics to CloudWatch automatically. Use CloudWatch Alarms for automated alerting — don't build custom monitoring.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you set up automated operational alerts for a Bedrock application without building custom monitoring?",
      testedConcepts: ["CloudWatch metrics for Bedrock", "CloudWatch Alarms", "Operational monitoring", "SNS notifications"],
      servicesInPlay: [
        { service: "Amazon CloudWatch", role: "Native Bedrock metrics (errors, latency, tokens) + Alarms for thresholds", isCorrectAnswer: true },
        { service: "Amazon SNS", role: "Notification delivery from CloudWatch Alarms", isCorrectAnswer: true },
        { service: "AWS CloudTrail", role: "API audit logging — not operational metrics", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Need: automated alerts for errors, latency, tokens. 2. Custom Lambda = unnecessary when native metrics exist — eliminate A. 3. CloudTrail = audit, not ops metrics — eliminate C. 4. Custom polling = fragile — eliminate D. 5. CloudWatch metrics + Alarms + SNS = native solution.",
      commonMistakes: [
        "Building custom log parsing when CloudWatch metrics already exist for Bedrock",
        "Confusing CloudTrail (audit) with CloudWatch (operational monitoring)",
        "Creating custom health check polling instead of using native metrics"
      ],
      timeManagementTip: "Operational metrics + alerts = CloudWatch + Alarms. Standard AWS monitoring pattern."
    }
  },

  // ─── op-54 ── Domain 3 — Guardrails: contextual grounding ────────
  {
    id: "op-54",
    domain: 3,
    task: "3.1",
    skills: ["3.1.3"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A RAG application retrieves relevant documents and passes them as context to the FM. Despite receiving correct source documents, the model sometimes generates statements that are not supported by the provided context — it adds information from its own training data that contradicts or goes beyond the source material.",
    question: "Which Amazon Bedrock Guardrails feature specifically addresses this grounding problem?",
    options: [
      { id: "a", text: "Content filters that block harmful or inappropriate responses." },
      { id: "b", text: "Denied topics that prevent the model from discussing certain subjects." },
      { id: "c", text: "Contextual grounding checks that verify model responses are supported by the provided reference context and flag or block ungrounded claims." },
      { id: "d", text: "Word filters that block specific terms from appearing in responses." }
    ],
    correctAnswers: ["c"],
    explanation: "Contextual grounding checks in Bedrock Guardrails evaluate whether each claim in the model's response is supported by the provided reference context. Claims not grounded in the source material are flagged or blocked, preventing the model from adding unsupported information from its parametric memory.",
    incorrectExplanations: {
      a: "Content filters address harmful content categories (violence, hate, etc.), not factual grounding against source documents. A response can be safe but still ungrounded.",
      b: "Denied topics prevent discussion of specific subjects entirely. The problem here isn't the topic — it's that the model adds unsupported details to an otherwise valid topic.",
      d: "Word filters block specific terms but can't evaluate whether a claim is supported by source documents. Grounding is a semantic check, not a keyword check."
    },
    parseStrategy: {
      keyPhrase: "not supported by the provided context … adds information from its own training data",
      eliminationHints: [
        "Content filters = harmful content, not factual grounding",
        "Denied topics = topic blocking, not claim verification",
        "Word filters = keyword matching, not semantic verification",
        "Contextual grounding = verifies claims against source context"
      ],
      decisionFramework: "Model adds unsupported claims beyond source context = contextual grounding checks. It's the Guardrails feature specifically for RAG faithfulness."
    },
    services: ["Amazon Bedrock Guardrails"],
    examTip: "Contextual grounding checks are specifically for RAG faithfulness — ensuring the model's response is actually supported by the retrieved documents.",
    strategicBreakdown: {
      whatIsBeingAsked: "Which Guardrails feature ensures an FM doesn't add unsupported information beyond what the source documents say?",
      testedConcepts: ["Contextual grounding checks", "RAG faithfulness", "Guardrails feature differentiation", "Grounded vs ungrounded responses"],
      servicesInPlay: [
        { service: "Amazon Bedrock Guardrails (Contextual Grounding)", role: "Verifies each response claim is supported by provided reference context", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Problem = model adds info not in source context. 2. Content filters = safety, not grounding — eliminate A. 3. Denied topics = blocks topics entirely — eliminate B. 4. Word filters = keyword, not semantic — eliminate D. 5. Contextual grounding = purpose-built for this.",
      commonMistakes: [
        "Confusing content filters (safety) with grounding checks (factual faithfulness)",
        "Thinking denied topics can solve grounding problems — they block topics, not verify claims",
        "Not knowing that contextual grounding is a distinct Guardrails feature"
      ],
      timeManagementTip: "Response not grounded in context = contextual grounding checks. The feature name matches the problem description directly."
    }
  },

  // ─── op-55 ── Domain 2 — Knowledge Base metadata filtering ───────
  {
    id: "op-55",
    domain: 2,
    task: "2.3",
    skills: ["2.3.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A company's Amazon Bedrock Knowledge Base contains product documentation for 50 different products across 10 categories. When users ask about a specific product, the retrieval often returns documents from unrelated products that happen to share similar terminology. The team needs to improve retrieval precision.",
    question: "Which approach will MOST effectively improve retrieval precision for product-specific queries?",
    options: [
      { id: "a", text: "Increase the number of retrieved chunks (top-K) to ensure the correct product's documents are included in the results." },
      { id: "b", text: "Apply metadata filters on product name or category during retrieval to restrict results to the relevant product's documents." },
      { id: "c", text: "Re-embed all documents with a larger embedding model that has higher dimensional vectors." },
      { id: "d", text: "Reduce the chunk size to create more specific text segments that are less likely to share terminology across products." }
    ],
    correctAnswers: ["b"],
    explanation: "Metadata filtering restricts the vector search to only documents tagged with specific metadata values (e.g., product name or category). This eliminates irrelevant results from other products before semantic similarity is evaluated, dramatically improving precision for product-specific queries.",
    incorrectExplanations: {
      a: "Increasing top-K returns more results but doesn't improve precision — it may include even more irrelevant documents. Higher recall doesn't help when the problem is precision.",
      c: "A larger embedding model doesn't solve the terminology overlap problem. If two products use similar language, their embeddings will still be similar regardless of vector dimensions.",
      d: "Smaller chunks may reduce some cross-product noise but don't eliminate it. Products sharing terminology will still have similar embeddings at any chunk size."
    },
    parseStrategy: {
      keyPhrase: "unrelated products … similar terminology … retrieval precision",
      eliminationHints: [
        "Higher top-K = more results, same precision problem",
        "Larger embeddings = same terminology overlap",
        "Smaller chunks = still share terminology",
        "Metadata filters = restricts to relevant product only"
      ],
      decisionFramework: "Cross-category contamination in retrieval = metadata filtering. Pre-filter by category/product before semantic search."
    },
    services: ["Amazon Bedrock Knowledge Bases"],
    examTip: "Metadata filtering is the go-to solution when retrieval returns results from the wrong category/product/department. Filter first, then search semantically.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you prevent a Knowledge Base from returning documents from the wrong product when products share similar language?",
      testedConcepts: ["Knowledge Base metadata filtering", "Retrieval precision", "Pre-filtering vs post-filtering", "Metadata-augmented retrieval"],
      servicesInPlay: [
        { service: "Amazon Bedrock Knowledge Bases (Metadata Filtering)", role: "Restricts vector search to documents matching product/category metadata", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Problem: wrong product docs returned due to similar language. 2. Higher top-K = more noise — eliminate A. 3. Bigger embeddings = same similarity problem — eliminate C. 4. Smaller chunks = terminology still overlaps — eliminate D. 5. Metadata filters = restrict by product before search.",
      commonMistakes: [
        "Increasing top-K to improve precision — it increases recall but may reduce precision",
        "Thinking embedding dimensions solve semantic overlap between different products",
        "Not using metadata filtering for multi-category knowledge bases"
      ],
      timeManagementTip: "Wrong category in results = metadata filter. Classic retrieval precision pattern."
    }
  },

  // ─── op-56 ── Domain 1 — Model selection: cost vs quality ────────
  {
    id: "op-56",
    domain: 1,
    task: "1.2",
    skills: ["1.2.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A company is building a GenAI feature that generates brief, templated email replies for customer service agents. The replies follow predictable patterns (order confirmations, shipping updates, return acknowledgments) and require minimal creative reasoning. The company processes 2 million emails per month and is highly cost-sensitive.",
    question: "Which model selection strategy BEST balances cost and quality for this use case?",
    options: [
      { id: "a", text: "Use the most capable FM available to ensure the highest quality email replies." },
      { id: "b", text: "Use Amazon Bedrock model distillation to create a smaller, task-specific model from a larger teacher model, optimizing for this narrow use case." },
      { id: "c", text: "Use Provisioned Throughput with a mid-tier FM to get volume discounts." },
      { id: "d", text: "Use a traditional rule-based template system instead of an FM, since the replies are predictable." }
    ],
    correctAnswers: ["b"],
    explanation: "Model distillation creates a smaller, faster, cheaper model that is optimized for a specific task by learning from a larger teacher model. For a high-volume, narrow-scope task like templated email replies, a distilled model provides adequate quality at significantly lower per-invocation cost compared to using a full-size FM.",
    incorrectExplanations: {
      a: "The most capable FM is unnecessarily expensive for templated, predictable replies. At 2 million emails per month, the cost difference between a large and distilled model is enormous.",
      c: "Provisioned Throughput provides consistent capacity but doesn't reduce the per-token cost of using a mid-tier model to the level a distilled model achieves for a narrow task.",
      d: "Rule-based templates can't handle the natural language variation in customer emails. While the replies are predictable, the inputs vary, and an FM is needed to understand context and generate appropriate responses."
    },
    parseStrategy: {
      keyPhrase: "templated … predictable patterns … 2 million per month … cost-sensitive",
      eliminationHints: [
        "Most capable FM = overkill for templated replies",
        "Provisioned Throughput = capacity guarantee, not cost optimization",
        "Rule-based = can't handle input variation",
        "Distillation = smaller model optimized for narrow task"
      ],
      decisionFramework: "High volume + narrow task + cost sensitive = model distillation. Create a small, cheap, task-optimized model."
    },
    services: ["Amazon Bedrock"],
    examTip: "Model distillation is ideal for high-volume, narrow-scope tasks where a full-size FM is overkill. Smaller model = lower per-invocation cost at adequate quality.",
    strategicBreakdown: {
      whatIsBeingAsked: "What's the most cost-effective way to use an FM for a high-volume, narrow, predictable task?",
      testedConcepts: ["Model distillation", "Cost optimization for high volume", "Model right-sizing", "Task-specific model creation"],
      servicesInPlay: [
        { service: "Amazon Bedrock (Model Distillation)", role: "Creates a smaller, cheaper model optimized for the specific task", isCorrectAnswer: true },
        { service: "Amazon Bedrock (Provisioned Throughput)", role: "Capacity guarantee — doesn't minimize per-token cost like distillation", isCorrectAnswer: false }
      ],
      approachStrategy: "1. High volume + narrow scope + cost sensitive. 2. Most capable = too expensive — eliminate A. 3. Provisioned Throughput = capacity, not cost optimization — eliminate C. 4. Rule-based = can't understand varied inputs — eliminate D. 5. Distillation = task-optimized smaller model.",
      commonMistakes: [
        "Using full-size FMs for narrow tasks — wasteful at high volume",
        "Thinking Provisioned Throughput is primarily a cost optimization — it's a capacity guarantee",
        "Defaulting to rule-based systems when FM understanding of varied inputs is needed"
      ],
      timeManagementTip: "High volume + narrow task + cost = distillation. Model right-sizing at its most extreme."
    }
  },

  // ─── op-57 ── Domain 4 — Service Control Policies ─────────────────
  {
    id: "op-57",
    domain: 4,
    task: "4.1",
    skills: ["4.1.1"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "An enterprise with multiple AWS accounts in an AWS Organization wants to prevent any account from using Amazon Bedrock models outside of an approved list. The restriction must apply to all IAM principals in all member accounts, including account administrators, and cannot be overridden at the account level.",
    question: "Which mechanism enforces this organization-wide model restriction?",
    options: [
      { id: "a", text: "Create an IAM policy in each account that denies access to non-approved Bedrock models." },
      { id: "b", text: "Use AWS Organizations Service Control Policies (SCPs) to deny Bedrock InvokeModel actions for non-approved model ARNs across all member accounts." },
      { id: "c", text: "Disable non-approved models in the Bedrock console of each member account." },
      { id: "d", text: "Use AWS Config rules to detect and remediate usage of non-approved models." }
    ],
    correctAnswers: ["b"],
    explanation: "Service Control Policies (SCPs) set permission guardrails across an AWS Organization. An SCP denying InvokeModel for non-approved model ARNs applies to all principals in all member accounts — including administrators — and cannot be overridden at the account level. This provides the organization-wide, non-bypassable restriction required.",
    incorrectExplanations: {
      a: "Per-account IAM policies can be modified or removed by account administrators. They don't provide organization-wide enforcement that can't be overridden at the account level.",
      c: "Disabling models in the Bedrock console must be done per-account, can be re-enabled by account administrators, and doesn't provide centralized, non-overridable enforcement.",
      d: "AWS Config rules detect non-compliance after the fact but don't prevent usage. They are detective controls, not preventive controls."
    },
    parseStrategy: {
      keyPhrase: "all accounts … cannot be overridden at the account level",
      eliminationHints: [
        "Per-account IAM = can be overridden by account admins",
        "Bedrock console = per-account, admin can re-enable",
        "Config rules = detective, not preventive",
        "SCPs = organization-wide, non-overridable guardrails"
      ],
      decisionFramework: "Organization-wide restriction that can't be overridden by account admins = SCPs. They are the highest preventive control in AWS Organizations."
    },
    services: ["AWS Organizations", "Amazon Bedrock", "AWS IAM"],
    examTip: "SCPs are preventive guardrails that cannot be overridden by member accounts. For organization-wide restrictions, SCPs are the answer. Config rules are detective.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you prevent all accounts in an organization from using unauthorized Bedrock models in a way that account admins can't bypass?",
      testedConcepts: ["Service Control Policies", "AWS Organizations governance", "Preventive vs detective controls", "Organization-wide access restrictions"],
      servicesInPlay: [
        { service: "AWS Organizations SCPs", role: "Organization-wide, non-overridable permission guardrails", isCorrectAnswer: true },
        { service: "AWS Config", role: "Detective control — detects but doesn't prevent", isCorrectAnswer: false },
        { service: "AWS IAM", role: "Per-account policies — can be overridden by account admins", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Need: organization-wide, non-overridable. 2. Per-account IAM = overridable — eliminate A. 3. Bedrock console = per-account, re-enableable — eliminate C. 4. Config = detective, not preventive — eliminate D. 5. SCPs = organization-level, non-overridable guardrails.",
      commonMistakes: [
        "Thinking per-account IAM policies provide organization-wide enforcement — they can be removed by account admins",
        "Confusing detective controls (Config) with preventive controls (SCPs)",
        "Not knowing SCPs can restrict specific Bedrock model ARNs"
      ],
      timeManagementTip: "Organization-wide + non-overridable = SCPs. Core AWS governance concept."
    }
  },

  // ─── op-58 ── Domain 2 — Bedrock Flows ───────────────────────────
  {
    id: "op-58",
    domain: 2,
    task: "2.4",
    skills: ["2.4.1"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A developer needs to build a document processing pipeline that: (1) receives a PDF, (2) extracts text using Amazon Textract, (3) summarizes the content using an FM on Bedrock, (4) classifies the document type, and (5) stores the results in DynamoDB. The developer wants a visual, low-code way to define and manage this multi-step workflow.",
    question: "Which Amazon Bedrock feature provides visual, low-code workflow orchestration for this pipeline?",
    options: [
      { id: "a", text: "Amazon Bedrock Agents with multiple Action Groups chained together." },
      { id: "b", text: "Amazon Bedrock Flows, which allows visually designing multi-step workflows that connect prompts, models, knowledge bases, and AWS services." },
      { id: "c", text: "AWS Step Functions with Lambda functions for each processing step." },
      { id: "d", text: "A single complex prompt that instructs the FM to perform all steps sequentially." }
    ],
    correctAnswers: ["b"],
    explanation: "Amazon Bedrock Flows provides a visual, drag-and-drop interface for building multi-step GenAI workflows. Each step can be a prompt node, model invocation, knowledge base query, Lambda function, or conditional logic. This gives the developer a low-code way to define, test, and manage the entire pipeline.",
    incorrectExplanations: {
      a: "Agents with Action Groups are designed for autonomous, conversational task execution — not for predefined linear processing pipelines. They're agentic, not workflow-oriented.",
      c: "Step Functions provides workflow orchestration but requires coding Lambda functions and JSON state machine definitions. It's not low-code and not specifically designed for GenAI workflows.",
      d: "A single prompt can't invoke Textract, classify documents, and write to DynamoDB. FMs generate text — they can't execute external service calls within a single prompt."
    },
    parseStrategy: {
      keyPhrase: "visual, low-code … multi-step workflow",
      eliminationHints: [
        "Agents = autonomous conversational, not predefined pipelines",
        "Step Functions = code required, not GenAI-specific",
        "Single prompt = can't call external services",
        "Flows = visual, low-code GenAI workflow builder"
      ],
      decisionFramework: "Visual, low-code GenAI pipeline = Bedrock Flows. Autonomous conversation = Agents. Code-based orchestration = Step Functions."
    },
    services: ["Amazon Bedrock Flows", "Amazon Textract", "Amazon DynamoDB"],
    examTip: "Bedrock Flows = visual workflow builder for GenAI pipelines. Agents = autonomous conversational AI. Know when to use each.",
    strategicBreakdown: {
      whatIsBeingAsked: "What's the low-code way to build a multi-step document processing pipeline using Bedrock?",
      testedConcepts: ["Amazon Bedrock Flows", "Visual workflow orchestration", "Low-code GenAI pipelines", "Flows vs Agents vs Step Functions"],
      servicesInPlay: [
        { service: "Amazon Bedrock Flows", role: "Visual, low-code multi-step workflow builder for GenAI", isCorrectAnswer: true },
        { service: "Amazon Bedrock Agents", role: "Autonomous conversational AI — not for predefined pipelines", isCorrectAnswer: false },
        { service: "AWS Step Functions", role: "General workflow orchestration — requires code, not GenAI-specific", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Need: visual + low-code + multi-step GenAI workflow. 2. Agents = agentic, not predefined pipeline — eliminate A. 3. Step Functions = requires code — eliminate C. 4. Single prompt = can't call services — eliminate D. 5. Flows = visual, low-code GenAI workflow.",
      commonMistakes: [
        "Confusing Flows (predefined workflows) with Agents (autonomous AI)",
        "Choosing Step Functions when a GenAI-specific low-code tool exists",
        "Thinking a single prompt can orchestrate external service calls"
      ],
      timeManagementTip: "Visual + low-code + GenAI pipeline = Flows. Quick feature recognition."
    }
  },

  // ─── op-59 ── Domain 5 — Automated evaluation metrics ────────────
  {
    id: "op-59",
    domain: 5,
    task: "5.1",
    skills: ["5.1.1"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A team is evaluating a text summarization model and needs to measure how well the generated summaries capture the key information from the original documents. They need an automated metric that compares the overlap between generated summaries and human-written reference summaries.",
    question: "Which automated evaluation metric is MOST appropriate for measuring summarization quality?",
    options: [
      { id: "a", text: "Perplexity — a metric that measures how well the model predicts the next token in a sequence." },
      { id: "b", text: "ROUGE — a metric that measures the overlap of n-grams, word sequences, and word pairs between generated and reference summaries." },
      { id: "c", text: "Accuracy — the percentage of summaries that exactly match the reference summaries." },
      { id: "d", text: "Latency — the time taken to generate each summary." }
    ],
    correctAnswers: ["b"],
    explanation: "ROUGE (Recall-Oriented Understudy for Gisting Evaluation) measures the overlap between generated text and reference text using n-gram matching, longest common subsequences, and word pairs. It is the standard automated metric for summarization evaluation, capturing how much key content from reference summaries is present in generated ones.",
    incorrectExplanations: {
      a: "Perplexity measures a model's language modeling capability (how well it predicts next tokens) but doesn't evaluate the quality or content of generated summaries against references.",
      c: "Exact match accuracy is far too strict for summarization. Two summaries can capture the same information using different words. Partial overlap metrics like ROUGE are more appropriate.",
      d: "Latency measures generation speed, not summary quality. A fast summary can be poor quality and a slow summary can be excellent."
    },
    parseStrategy: {
      keyPhrase: "overlap between generated summaries and human-written reference summaries",
      eliminationHints: [
        "Perplexity = language modeling, not content comparison",
        "Exact accuracy = too strict for natural language",
        "Latency = speed, not quality",
        "ROUGE = n-gram overlap for summarization"
      ],
      decisionFramework: "Summarization quality vs reference = ROUGE. Translation quality = BLEU. Language modeling = perplexity."
    },
    services: ["Amazon Bedrock Model Evaluation"],
    examTip: "ROUGE = summarization. BLEU = translation. Perplexity = language modeling. BERTScore = semantic similarity. Know which metric matches which task.",
    strategicBreakdown: {
      whatIsBeingAsked: "Which metric measures how well a generated summary matches a reference summary?",
      testedConcepts: ["ROUGE metric", "Automated evaluation metrics", "Summarization evaluation", "Metric-task matching"],
      servicesInPlay: [
        { service: "Amazon Bedrock Model Evaluation", role: "Supports automated evaluation with standard metrics including ROUGE", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Task = summarization. 2. Need = overlap with reference. 3. Perplexity = next-token prediction, not comparison — eliminate A. 4. Exact accuracy = too strict — eliminate C. 5. Latency = speed — eliminate D. 6. ROUGE = designed for summarization overlap.",
      commonMistakes: [
        "Confusing ROUGE (summarization) with BLEU (translation)",
        "Using perplexity to evaluate generated output quality — it measures language modeling",
        "Expecting exact match for natural language generation tasks"
      ],
      timeManagementTip: "Summarization + reference comparison = ROUGE. Classic metric-matching question."
    }
  },

  // ─── op-60 ── Domain 2 — Prompt caching ──────────────────────────
  {
    id: "op-60",
    domain: 2,
    task: "2.5",
    skills: ["2.5.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A customer support application sends the same 5,000-token system prompt containing company policies, product catalog, and response guidelines with every API call to Amazon Bedrock. The application handles thousands of requests per hour, and the team wants to reduce both latency and cost for these repetitive requests.",
    question: "Which optimization technique reduces cost and latency for repeated large context?",
    options: [
      { id: "a", text: "Reduce the system prompt to under 500 tokens by removing less important content." },
      { id: "b", text: "Use Amazon Bedrock prompt caching to cache the static system prompt, so repeated requests reuse the cached context without reprocessing the same tokens." },
      { id: "c", text: "Move the system prompt content to a Knowledge Base and use RAG to retrieve relevant sections per query." },
      { id: "d", text: "Switch to a smaller model that processes tokens faster." }
    ],
    correctAnswers: ["b"],
    explanation: "Prompt caching in Amazon Bedrock allows caching of static prompt components (like system prompts) across requests. Cached tokens are processed at a reduced cost and with lower latency since they don't need to be reprocessed for each invocation. This is ideal for large, static prompts sent repeatedly.",
    incorrectExplanations: {
      a: "Reducing the system prompt may lose important context and degrade response quality. Prompt caching provides the cost and latency benefits without sacrificing content.",
      c: "RAG adds retrieval latency and may not return all relevant policy information for every query. The system prompt is needed in full for consistent behavior — RAG is for dynamic context, not static system prompts.",
      d: "A smaller model may be faster but processes tokens at the same per-token rate. Prompt caching reduces cost by not reprocessing cached tokens, which a smaller model can't do."
    },
    parseStrategy: {
      keyPhrase: "same 5,000-token system prompt … every API call … reduce latency and cost",
      eliminationHints: [
        "Reduce prompt = loses content, degrades quality",
        "RAG = retrieval latency, partial context",
        "Smaller model = faster but same per-token cost for repeated context",
        "Prompt caching = reuses cached static context"
      ],
      decisionFramework: "Large static prompt repeated across requests = prompt caching. Eliminates reprocessing of identical tokens."
    },
    services: ["Amazon Bedrock"],
    examTip: "Prompt caching is for static, repeated prompt components. It reduces both cost (cached tokens are cheaper) and latency (no reprocessing). Perfect for large system prompts.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you avoid paying to reprocess the same large system prompt on every single API call?",
      testedConcepts: ["Amazon Bedrock prompt caching", "Cost optimization for repetitive prompts", "Latency reduction", "Static vs dynamic prompt components"],
      servicesInPlay: [
        { service: "Amazon Bedrock (Prompt Caching)", role: "Caches static prompt components to reduce cost and latency on repeated calls", isCorrectAnswer: true },
        { service: "Amazon Bedrock Knowledge Bases", role: "Dynamic retrieval — wrong tool for static system prompts", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Problem: same large prompt on every call = wasted reprocessing. 2. Reducing content = quality loss — eliminate A. 3. RAG = adds latency, partial context — eliminate C. 4. Smaller model = same per-token processing — eliminate D. 5. Prompt caching = caches static tokens.",
      commonMistakes: [
        "Using RAG for static system prompt content — RAG is for dynamic context retrieval",
        "Thinking a smaller model eliminates the cost of reprocessing the same tokens",
        "Reducing prompt content instead of caching it — sacrifices quality unnecessarily"
      ],
      timeManagementTip: "Repeated large static prompt = prompt caching. The feature exists precisely for this scenario."
    }
  }
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  let fileContent;
  try {
    fileContent = fs.readFileSync(FILE, 'utf-8');
  } catch (err) {
    console.error(`Error reading ${FILE}: ${err.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fileContent);
  } catch (err) {
    console.error(`Error parsing JSON: ${err.message}`);
    process.exit(1);
  }

  const existingIds = new Set(data.questions.map(q => q.id));
  const toInsert = newQuestions.filter(q => {
    if (existingIds.has(q.id)) {
      console.log(`  Skipping ${q.id} (already exists)`);
      return false;
    }
    return true;
  });

  if (toInsert.length === 0) {
    console.log('All questions already exist. Nothing to insert.');
    return;
  }

  data.questions.push(...toInsert);
  data.description = `${data.questions.length} exam-style questions from the AWS Certified AI Practitioner / GenAI Developer official practice set`;

  try {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  } catch (err) {
    console.error(`Error writing ${FILE}: ${err.message}`);
    process.exit(1);
  }

  console.log(`Inserted ${toInsert.length} question(s): ${toInsert.map(q => q.id).join(', ')}`);
  console.log(`Total questions now: ${data.questions.length}`);
}

main();
