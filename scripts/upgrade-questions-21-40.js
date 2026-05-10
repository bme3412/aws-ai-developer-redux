#!/usr/bin/env node

/**
 * upgrade-questions-21-40.js
 *
 * Replaces op-21 through op-40 with harder versions that match the AWS-sourced
 * difficulty of op-01 through op-20. Key changes:
 * - Longer scenarios with 3-6 embedded constraints
 * - ~35% converted to "Select TWO" with 5 options
 * - All distractors are plausible (no obviously wrong answers)
 * - Multi-service integration required
 * - Diagnostic reasoning and subtle distinctions
 */

const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'src', 'data', 'questions', 'official-practice.json');

const upgradedQuestions = [
  // ─── op-21 ── Domain 1 — Multimodal (UPGRADED) ─────────────────────
  {
    id: "op-21",
    domain: 1,
    task: "1.1",
    skills: ["1.1.2"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A large ecommerce company wants to build an automated product listing pipeline. When a seller uploads a product image, the system must generate a marketing description that includes the product's visual attributes, brand elements visible in the image, and persuasive sales copy. The company's existing pipeline already uses Amazon Rekognition to extract labels and detect text in product images for search indexing. The team wants to reuse this existing Rekognition integration. The solution must support processing 50,000 new listings per day with sub-3-second latency per listing. The company wants to minimize the number of API calls per listing to reduce costs and maintain the lowest possible latency.",
    question: "Which approach meets these requirements with the LEAST operational complexity?",
    options: [
      { id: "a", text: "Extend the existing Rekognition pipeline to extract detailed labels, then pass those labels along with a text prompt to a text-only FM on Amazon Bedrock to generate the marketing description." },
      { id: "b", text: "Invoke a multimodal FM on Amazon Bedrock, passing both the product image and a text prompt in a single API call to generate the marketing description. Continue using the existing Rekognition pipeline separately for search indexing." },
      { id: "c", text: "Fine-tune a text-only FM on Amazon Bedrock with a dataset of image-caption pairs so the model learns to generate descriptions that account for visual attributes." },
      { id: "d", text: "Use Amazon Bedrock Flows to create a multi-step pipeline that first calls Rekognition for label extraction, then enriches labels with Amazon Comprehend for entity detection, then generates the description with an FM." }
    ],
    correctAnswers: ["b"],
    explanation: "A multimodal FM processes the image and text prompt in a single API call, generating descriptions that capture visual nuance beyond what labels can convey. This minimizes API calls (one per listing vs two or three), meets latency requirements, and has the least operational complexity. The existing Rekognition pipeline continues independently for search indexing — it doesn't need to be integrated into the description generation path.",
    incorrectExplanations: {
      a: "Extending the Rekognition pipeline adds a second API call per listing (Rekognition + FM), doubling API costs. Labels also lose visual nuance — they can identify 'red dress' but miss styling details, fabric texture, and brand aesthetic that a multimodal FM captures directly from the image.",
      c: "Text-only FMs cannot be fine-tuned to accept image inputs. Fine-tuning changes the model's text behavior but doesn't add image processing capability. This approach is technically invalid.",
      d: "A multi-step Flow with Rekognition → Comprehend → FM adds three sequential API calls per listing, significantly increasing latency and cost. The orchestration overhead contradicts 'LEAST operational complexity.' A single multimodal call replaces the entire chain."
    },
    parseStrategy: {
      keyPhrase: "LEAST operational complexity … minimize API calls … sub-3-second latency",
      eliminationHints: [
        "Extending Rekognition = 2 API calls, labels lose visual nuance",
        "Fine-tuning text-only FM with images = technically invalid",
        "Multi-step Flow = 3 API calls, highest latency and complexity",
        "Single multimodal call = 1 API call, captures full visual context"
      ],
      decisionFramework: "When the task requires image understanding + text generation, a single multimodal FM call is simpler than chaining vision + text services. Don't be distracted by existing Rekognition infrastructure."
    },
    services: ["Amazon Bedrock", "Amazon Rekognition", "Amazon Comprehend"],
    examTip: "The existence of an existing service integration doesn't mean you should extend it. Evaluate whether a single multimodal call is simpler than chaining multiple services.",
    strategicBreakdown: {
      whatIsBeingAsked: "What's the simplest way to generate image-aware product descriptions at scale, given an existing Rekognition pipeline?",
      testedConcepts: ["Multimodal foundation models", "API call optimization", "Build-on-existing vs cleaner alternative", "Operational complexity trade-offs"],
      servicesInPlay: [
        { service: "Amazon Bedrock (Multimodal FM)", role: "Single API call for image + text → description generation", isCorrectAnswer: true },
        { service: "Amazon Rekognition", role: "Existing pipeline for search indexing — continues independently, not integrated into description path", isCorrectAnswer: false },
        { service: "Amazon Comprehend", role: "Entity detection — adds unnecessary step in the pipeline", isCorrectAnswer: false },
        { service: "Amazon Bedrock Flows", role: "Multi-step orchestration — adds complexity and latency", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Constraint: minimize API calls + sub-3s latency + least complexity. 2. Multi-step Flow = 3 calls, highest latency — eliminate D. 3. Fine-tuning text-only with images = invalid — eliminate C. 4. Extending Rekognition = 2 calls, labels lose nuance — eliminate A. 5. Single multimodal call = 1 call, full visual context, simplest.",
      commonMistakes: [
        "Feeling obligated to reuse the existing Rekognition pipeline for description generation — the question says it's already used for search indexing, not that it must be used for descriptions",
        "Thinking labels + text FM is equivalent to multimodal — labels lose significant visual context",
        "Not recognizing that text-only FMs cannot be fine-tuned to accept images"
      ],
      timeManagementTip: "The 'existing Rekognition pipeline' is a red herring. Focus on the constraints: minimize calls, minimize complexity. Single multimodal call wins."
    }
  },

  // ─── op-22 ── Domain 1 — Model selection (UPGRADED to Select TWO) ──
  {
    id: "op-22",
    domain: 1,
    task: "1.2",
    skills: ["1.2.1"],
    type: "multiple-response",
    difficulty: "hard",
    scenario: "A startup is building a real-time customer support chatbot that handles high volumes of simple, repetitive queries such as order status checks and return policies. The chatbot must maintain sub-500-millisecond response times. During business hours (8am-6pm), the chatbot handles 10,000 concurrent users with predictable traffic patterns. Outside business hours, traffic drops to near zero. The company has a limited budget and wants to optimize costs while maintaining consistent performance during business hours. The chatbot does not require complex reasoning capabilities for these queries.",
    question: "Which combination of strategies will meet these requirements? (Select TWO.)",
    options: [
      { id: "a", text: "Select a smaller, faster FM on Amazon Bedrock optimized for low latency and lower per-token cost for the simple query workload." },
      { id: "b", text: "Use Amazon Bedrock Provisioned Throughput during business hours to guarantee consistent sub-500ms response times for 10,000 concurrent users, and release the capacity outside business hours." },
      { id: "c", text: "Deploy a custom-trained model on Amazon SageMaker with GPU-optimized instances and an Auto Scaling group to handle traffic variations." },
      { id: "d", text: "Use the largest available FM on Amazon Bedrock with on-demand inference to ensure the highest quality responses regardless of query complexity." },
      { id: "e", text: "Enable cross-Region inference to distribute the 10,000 concurrent users across multiple Regions for lower latency." }
    ],
    correctAnswers: ["a", "b"],
    explanation: "Selecting a smaller FM (like Claude Haiku or Amazon Nova Micro) addresses the 'simple queries' and 'limited budget' requirements — these models are faster and cheaper for straightforward tasks. Provisioned Throughput during business hours guarantees the consistent sub-500ms latency for 10,000 concurrent users during the predictable peak period, and releasing it outside business hours avoids paying for idle capacity — addressing the cost optimization requirement.",
    incorrectExplanations: {
      c: "Custom SageMaker deployment adds significant operational overhead (managing instances, scaling policies, model serving) that contradicts cost optimization for a simple chatbot. Bedrock is the managed alternative.",
      d: "The largest FM adds unnecessary cost and latency for simple queries. At 10,000 concurrent users, the per-token cost difference between large and small FMs is enormous. The queries don't require complex reasoning.",
      e: "Cross-Region inference helps with throttling (capacity limits) but doesn't guarantee consistent latency SLAs. The problem is consistent performance during predictable peaks, not geographic distribution or throttling."
    },
    parseStrategy: {
      keyPhrase: "sub-500ms … 10,000 concurrent … predictable traffic … limited budget … simple queries",
      eliminationHints: [
        "Largest FM = expensive + slow for simple queries",
        "Custom SageMaker = operational overhead",
        "Cross-Region = capacity distribution, not latency guarantees",
        "Small FM = right-sized for simple queries",
        "Provisioned Throughput = consistent performance for predictable peaks"
      ],
      decisionFramework: "Two separate problems: (1) model right-sizing for simple tasks = small FM, (2) consistent performance at scale = Provisioned Throughput with time-based scheduling."
    },
    services: ["Amazon Bedrock", "Amazon Bedrock Provisioned Throughput"],
    examTip: "Select TWO questions often test two complementary strategies. Here: model selection (which FM) and capacity management (how to guarantee performance). Each solves a different constraint.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you optimize both cost and consistent performance for a high-volume, simple-query chatbot with predictable traffic?",
      testedConcepts: ["Model right-sizing", "Provisioned Throughput scheduling", "Cost optimization for predictable workloads", "Latency guarantees vs capacity distribution"],
      servicesInPlay: [
        { service: "Amazon Bedrock (Small FM)", role: "Right-sized model for simple queries — lower cost and latency", isCorrectAnswer: true },
        { service: "Amazon Bedrock Provisioned Throughput", role: "Guaranteed capacity during business hours, released off-hours", isCorrectAnswer: true },
        { service: "Amazon Bedrock Cross-Region Inference", role: "Capacity distribution — doesn't guarantee consistent latency SLAs", isCorrectAnswer: false },
        { service: "Amazon SageMaker", role: "Custom deployment — operational overhead contradicts managed approach", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Two constraints: simple queries (model selection) + consistent performance at scale (capacity). 2. Largest FM = overkill for simple queries — eliminate D. 3. Custom SageMaker = unnecessary ops — eliminate C. 4. Cross-Region = throttling solution, not SLA guarantee — eliminate E. 5. Small FM (A) + Provisioned Throughput (B) = each solves one constraint.",
      commonMistakes: [
        "Choosing cross-Region inference for latency when the problem is consistent throughput at scale",
        "Thinking Provisioned Throughput alone solves cost — you still need the right-sized model",
        "Assuming the largest FM handles everything better — it adds cost and latency for simple queries"
      ],
      timeManagementTip: "Identify the two separate problems first: model selection + capacity. Each answer maps to one problem. Quick pairing."
    }
  },

  // ─── op-23 ── Domain 2 — RAG chunking (UPGRADED) ───────────────────
  {
    id: "op-23",
    domain: 2,
    task: "2.3",
    skills: ["2.3.2"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A legal firm is building a RAG application to search through a corpus of 50,000 contracts and legal documents. The documents contain complex provisions where a single legal clause may span multiple paragraphs and reference other sections within the same document. Using the default fixed-size chunking strategy with 300-token chunks, the application frequently returns partial clauses that lack essential legal context. The team has tried increasing the chunk size to 1,000 tokens, which improved context completeness but significantly reduced retrieval precision — the larger chunks now include unrelated clauses, causing the FM to sometimes cite irrelevant provisions. The team needs to improve both context completeness and retrieval precision simultaneously.",
    question: "Which chunking strategy will MOST effectively address both requirements?",
    options: [
      { id: "a", text: "Increase the chunk overlap percentage to 50% so that clause boundaries are captured in at least one overlapping chunk." },
      { id: "b", text: "Implement hierarchical chunking that preserves document structure, keeping parent sections and child subsections together as semantic units while maintaining separate index entries for targeted retrieval." },
      { id: "c", text: "Use semantic chunking based on embedding similarity to detect natural topic boundaries, splitting documents where the semantic content shifts significantly." },
      { id: "d", text: "Implement a two-pass approach: first retrieve with small chunks for precision, then expand each result to include surrounding paragraphs for context completeness." }
    ],
    correctAnswers: ["b"],
    explanation: "Hierarchical chunking preserves the logical structure of legal documents by maintaining parent-child relationships between sections, subsections, and clauses. Each structural unit becomes a chunk, keeping related content together (solving completeness) while maintaining granular index entries for each subsection (solving precision). This directly addresses both problems because legal documents have explicit structural hierarchies that align with semantic meaning.",
    incorrectExplanations: {
      a: "50% chunk overlap doubles the index size and introduces redundant content in retrieval results. While overlapping chunks may capture some clause boundaries, they don't solve the fundamental problem of unrelated clauses appearing in the same chunk. The retrieval precision problem persists because overlap doesn't create structurally meaningful boundaries.",
      c: "Semantic chunking works well for unstructured text (blog posts, transcripts) but legal documents have explicit structural hierarchies (sections, subsections, clauses) that are more reliable than embedding-based topic detection. Semantic chunking may incorrectly split within a clause if the embedding similarity shifts, or fail to split between related but distinct clauses.",
      d: "A two-pass approach adds latency and complexity. The initial small-chunk retrieval may miss relevant clauses entirely if the clause spans multiple small chunks, and expanding surrounding paragraphs reintroduces the noise problem. This is a workaround, not a structural solution."
    },
    parseStrategy: {
      keyPhrase: "both context completeness AND retrieval precision … legal documents with structural hierarchy",
      eliminationHints: [
        "Chunk overlap = doubles index, doesn't fix structural boundaries",
        "Semantic chunking = unreliable for explicitly structured documents",
        "Two-pass = latency + workaround, not structural fix",
        "Hierarchical = uses document structure as chunk boundaries"
      ],
      decisionFramework: "When documents have explicit structural hierarchy (legal, technical, regulatory), use structure-aware chunking. When documents are unstructured (blogs, transcripts), consider semantic chunking."
    },
    services: ["Amazon Bedrock Knowledge Bases"],
    examTip: "The exam tests whether you understand different chunking strategies and when each is appropriate. Hierarchical for structured docs, semantic for unstructured, fixed-size as a baseline.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you simultaneously fix context completeness and retrieval precision for structured legal documents in a RAG pipeline?",
      testedConcepts: ["RAG chunking strategies", "Hierarchical vs semantic vs fixed-size chunking", "Precision-completeness trade-off", "Document structure awareness"],
      servicesInPlay: [
        { service: "Amazon Bedrock Knowledge Bases (Hierarchical Chunking)", role: "Uses document structure as chunk boundaries — preserves completeness while enabling granular retrieval", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Two simultaneous requirements: completeness + precision. 2. Larger fixed chunks = completeness but not precision (already tried). 3. Overlap = doesn't fix structural boundaries — eliminate A. 4. Semantic = unreliable for structured documents — eliminate C. 5. Two-pass = workaround with latency — eliminate D. 6. Hierarchical = document structure solves both.",
      commonMistakes: [
        "Choosing semantic chunking because it sounds sophisticated — it's for unstructured text, not structured legal documents",
        "Thinking chunk overlap solves boundary problems — it creates redundancy without meaningful boundaries",
        "Confusing a workaround (two-pass) with a structural solution (hierarchical)"
      ],
      timeManagementTip: "The scenario tells you fixed-size failed in both sizes. That eliminates A (still fixed-size with overlap). Focus on structure-aware vs semantic."
    }
  },

  // ─── op-24 ── Domain 2 — Agent session (UPGRADED) ──────────────────
  {
    id: "op-24",
    domain: 2,
    task: "2.2",
    skills: ["2.2.2"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A travel agency is building an Amazon Bedrock Agent that helps customers plan multi-day trips. A typical planning conversation spans 30-50 turns as the agent iterates on destination preferences, dates, hotel options, and activity bookings. During testing, the team discovers two problems: (1) the agent loses context from early turns when conversations exceed 20 turns, and (2) when a customer returns hours later to continue planning, the agent has no memory of the previous session. The team wants to maintain context across long conversations and enable session resumption without building custom infrastructure. The solution must work within the managed Bedrock Agent framework.",
    question: "Which solution addresses BOTH the long-conversation context loss and the session resumption requirement?",
    options: [
      { id: "a", text: "Store the full conversation history in an Amazon DynamoDB table and retrieve the last 50 turns as context with each new invocation. Pass the retrieved history in the prompt alongside the user's new message." },
      { id: "b", text: "Use the Amazon Bedrock Agent session management capability by passing a consistent sessionId across all invocations within a conversation. Configure the session timeout to accommodate multi-hour planning sessions so customers can resume later." },
      { id: "c", text: "Implement a conversation summarization step using a separate FM invocation after every 10 turns. Store the running summary in the agent's system prompt to compress the conversation history." },
      { id: "d", text: "Increase the foundation model's context window size by switching to a model with a 200K token context window to fit all 50 turns without losing early context." }
    ],
    correctAnswers: ["b"],
    explanation: "Amazon Bedrock Agents natively manage session state via the sessionId parameter. Passing the same sessionId across all InvokeAgent calls maintains conversation context, and configuring the session timeout (up to 24 hours) enables customers to resume planning sessions hours later. This solves both problems within the managed framework without custom infrastructure.",
    incorrectExplanations: {
      a: "Storing conversation history in DynamoDB and injecting it into prompts requires custom infrastructure (Lambda for retrieval, DynamoDB table management) and wastes context window tokens on raw conversation history. This contradicts 'without building custom infrastructure' and doesn't use the managed session capability.",
      c: "Conversation summarization loses detail from early turns — the summary may omit specific hotel preferences or date changes the customer mentioned early in the conversation. It also requires a separate FM invocation every 10 turns, adding latency and cost. This is custom infrastructure, not a managed solution.",
      d: "A larger context window accommodates more turns but doesn't solve session resumption (the context is lost when the session ends). It also doesn't address the fundamental issue — the agent framework manages context, not the model's raw context window. And 50 turns of conversation may still exceed even 200K tokens when including action group results."
    },
    parseStrategy: {
      keyPhrase: "BOTH long-conversation context AND session resumption … without custom infrastructure … managed framework",
      eliminationHints: [
        "DynamoDB = custom infrastructure, token waste",
        "Summarization = loses detail, custom infra, added latency",
        "Larger context window = doesn't solve resumption, doesn't use managed sessions",
        "sessionId + timeout config = managed, solves both"
      ],
      decisionFramework: "Bedrock Agent session management (sessionId + timeout) is the managed solution for both conversation continuity and resumption. Custom DynamoDB or summarization solutions are over-engineering."
    },
    services: ["Amazon Bedrock Agents", "Amazon DynamoDB"],
    examTip: "When the question says 'without custom infrastructure' or 'within the managed framework,' look for built-in features first. Bedrock Agents have native session management — don't build custom alternatives.",
    strategicBreakdown: {
      whatIsBeingAsked: "How does a Bedrock Agent handle both long conversations (30-50 turns) and session resumption (hours later) without custom code?",
      testedConcepts: ["Bedrock Agent session management", "sessionId parameter", "Session timeout configuration", "Managed vs custom state management"],
      servicesInPlay: [
        { service: "Amazon Bedrock Agents (sessionId + timeout)", role: "Native session state management with configurable timeout for resumption", isCorrectAnswer: true },
        { service: "Amazon DynamoDB", role: "Custom state store — unnecessary custom infrastructure", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Two problems: long conversation context + session resumption. 2. 'Without custom infrastructure' eliminates A (DynamoDB) and C (summarization). 3. Larger context window doesn't solve resumption — eliminate D. 4. sessionId with timeout configuration = managed solution for both.",
      commonMistakes: [
        "Building DynamoDB-based session management when Bedrock Agents handle it natively",
        "Thinking a larger context window solves session resumption — sessions are separate from context windows",
        "Over-engineering with summarization when the managed framework already handles long conversations"
      ],
      timeManagementTip: "'Without custom infrastructure' eliminates two options immediately. Then context window vs sessionId is a quick distinction."
    }
  },

  // ─── op-25 ── Domain 2 — Prompt engineering (UPGRADED) ─────────────
  {
    id: "op-25",
    domain: 2,
    task: "2.1",
    skills: ["2.1.2"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A developer is building a sentiment analysis feature using Amazon Bedrock for a product review platform. The FM correctly classifies obvious positive and negative reviews but struggles with sarcastic, ironic, and ambiguous reviews. The developer has already implemented few-shot prompting with 5 examples of sarcastic reviews, which improved accuracy from 60% to 78%. Adding more few-shot examples (up to 15) showed no further improvement and the additional examples consume a significant portion of the context window, leaving less room for the actual review text. The company requires 92%+ accuracy for production deployment. The team has 500 manually labeled sarcastic/ambiguous reviews available. The solution must minimize ongoing operational costs.",
    question: "Which approach is MOST likely to achieve the required accuracy?",
    options: [
      { id: "a", text: "Replace the few-shot examples with chain-of-thought prompting, instructing the model to analyze the review's literal meaning, then evaluate potential sarcasm indicators, then determine the true sentiment." },
      { id: "b", text: "Fine-tune the FM on Amazon Bedrock using the 500 labeled sarcastic and ambiguous reviews, training the model to recognize the specific sentiment patterns in the company's review domain." },
      { id: "c", text: "Switch to a larger, more capable FM on Amazon Bedrock that has stronger reasoning capabilities for handling nuanced language like sarcasm and irony." },
      { id: "d", text: "Implement a two-stage pipeline: use Amazon Comprehend to detect sentiment and sarcasm indicators first, then pass the Comprehend output along with the review to the FM for final classification." }
    ],
    correctAnswers: ["b"],
    explanation: "Fine-tuning on the 500 labeled examples directly teaches the model the specific sarcasm and ambiguity patterns in this domain. Few-shot has plateaued at 78% with diminishing returns, and 500 labeled examples is sufficient for effective fine-tuning. Fine-tuning also eliminates the context window overhead of few-shot examples, reduces per-request token costs (no examples in every prompt), and minimizes ongoing operational costs since the customized model runs at standard inference pricing.",
    incorrectExplanations: {
      a: "Chain-of-thought prompting improves multi-step reasoning but sarcasm detection is more about pattern recognition than step-by-step logic. CoT also increases output tokens (and cost) for every request by generating the reasoning chain. With few-shot already at 78%, CoT is unlikely to bridge the gap to 92% for this specific task.",
      c: "A larger FM may have marginally better sarcasm understanding but doesn't address the domain-specific patterns. It increases per-token cost significantly — at production scale, this contradicts 'minimize ongoing operational costs.' And larger models don't guarantee better accuracy on narrow classification tasks.",
      d: "Amazon Comprehend's sentiment analysis is a general-purpose NLP model that also struggles with sarcasm. Adding it as a preprocessing step introduces additional API calls, latency, and cost without addressing the core problem — the FM needs to learn the specific sarcasm patterns, not receive pre-processed sentiment scores."
    },
    parseStrategy: {
      keyPhrase: "few-shot plateaued at 78% … 500 labeled examples … 92% required … minimize operational costs",
      eliminationHints: [
        "CoT = reasoning technique, sarcasm is pattern recognition not step-by-step logic",
        "Larger FM = higher per-token cost, doesn't address domain patterns",
        "Comprehend = also struggles with sarcasm, adds cost and latency",
        "Fine-tuning = uses the 500 labeled examples directly, eliminates few-shot token overhead"
      ],
      decisionFramework: "When few-shot has plateaued and you have labeled data available, fine-tuning is the next step. The 500 examples are a clear signal for fine-tuning."
    },
    services: ["Amazon Bedrock", "Amazon Comprehend"],
    examTip: "The prompt engineering → fine-tuning escalation: try few-shot first, if it plateaus and you have labeled data, fine-tune. The existence of labeled data (500 examples) is the key signal.",
    strategicBreakdown: {
      whatIsBeingAsked: "When few-shot prompting plateaus and you have labeled domain data, what's the next step to reach production accuracy?",
      testedConcepts: ["Prompt engineering ceiling", "Fine-tuning with limited labeled data", "Cost optimization for classification", "Chain-of-thought vs fine-tuning trade-offs"],
      servicesInPlay: [
        { service: "Amazon Bedrock (Fine-Tuning)", role: "Trains on 500 labeled examples to learn domain-specific sarcasm patterns", isCorrectAnswer: true },
        { service: "Amazon Comprehend", role: "General-purpose NLP — also struggles with sarcasm, adds cost", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Few-shot plateaued (78%, no improvement with more examples). 2. 500 labeled examples available = fine-tuning signal. 3. CoT = wrong technique for pattern recognition — eliminate A. 4. Larger FM = cost increase, no domain-specific improvement — eliminate C. 5. Comprehend = also struggles with sarcasm — eliminate D. 6. Fine-tuning = uses the labeled data directly.",
      commonMistakes: [
        "Choosing CoT for sarcasm — CoT helps with multi-step reasoning, not language pattern recognition",
        "Thinking a larger model always improves accuracy on narrow tasks — it doesn't",
        "Adding Comprehend as preprocessing when it also struggles with the same problem (sarcasm)",
        "Not recognizing the 500 labeled examples as a signal for fine-tuning"
      ],
      timeManagementTip: "Few-shot plateau + labeled data available = fine-tuning. The scenario practically spells it out."
    }
  },

  // ─── op-26 ── Domain 3 — PII (UPGRADED to Select TWO) ─────────────
  {
    id: "op-26",
    domain: 3,
    task: "3.1",
    skills: ["3.1.2"],
    type: "multiple-response",
    difficulty: "hard",
    scenario: "A healthcare company's GenAI application processes patient inquiries across three AWS Regions to comply with data residency requirements. The application must ensure that personally identifiable information (PII) such as Social Security numbers, phone numbers, medical record numbers, and email addresses never appears in model responses. Regulatory auditors require evidence that PII filtering is actively enforced and must be able to verify which PII types were detected and blocked in any given response. The solution must work consistently across all three Regions without requiring application code changes when new PII types are added to the compliance policy.",
    question: "Which combination of steps will meet these requirements? (Select TWO.)",
    options: [
      { id: "a", text: "Configure Amazon Bedrock Guardrails with sensitive information filters to automatically detect and block the required PII types in model outputs. Deploy the same guardrail configuration across all three Regions." },
      { id: "b", text: "Implement a post-processing Lambda function that uses regex patterns to scan and redact PII from model responses before returning them to users." },
      { id: "c", text: "Enable Amazon Bedrock model invocation logging with guardrail trace data to capture which PII types were detected and blocked in each response, delivering logs to Amazon S3 for auditor access." },
      { id: "d", text: "Add instructions to the system prompt requiring the model to never include PII in responses, and log all prompts and responses for audit review." },
      { id: "e", text: "Use Amazon Comprehend PII detection as a pre-processing step to identify and mask PII in user inputs before they reach the FM." }
    ],
    correctAnswers: ["a", "c"],
    explanation: "Bedrock Guardrails sensitive information filters provide automated, configurable PII detection and blocking that works consistently across Regions without code changes — meeting the enforcement requirement. Enabling invocation logging with guardrail trace data captures which PII types were detected and blocked per response, providing the audit evidence regulators require. Together, these solve both enforcement and auditability.",
    incorrectExplanations: {
      b: "Lambda regex filtering requires maintaining pattern libraries in code, updating for each new PII type, and deploying across three Regions — violating the 'no code changes' requirement. It also doesn't provide structured audit logs showing which PII types were detected.",
      d: "Prompt-based PII prevention is unreliable — models can be manipulated to ignore instructions. Regulatory compliance cannot depend on model behavior. Logging prompts and responses captures what was said but doesn't prove PII was actively filtered.",
      e: "Comprehend PII detection on inputs addresses PII in what users send, not PII in what the model generates. The requirement is to prevent PII in model responses/outputs, not in user inputs. Even if inputs are clean, the model can generate PII from its training data."
    },
    parseStrategy: {
      keyPhrase: "PII never in responses … auditors verify detection … no code changes … three Regions",
      eliminationHints: [
        "Lambda regex = requires code changes per PII type, no structured audit",
        "System prompt = unreliable for compliance, no active enforcement proof",
        "Comprehend on inputs = wrong direction (filters inputs, not outputs)",
        "Guardrails PII filters = enforcement without code changes",
        "Invocation logging with trace = audit evidence of enforcement"
      ],
      decisionFramework: "Two problems: (1) PII enforcement = Guardrails, (2) audit evidence = invocation logging with trace. One enforces, the other proves enforcement."
    },
    services: ["Amazon Bedrock Guardrails", "Amazon Bedrock", "Amazon S3"],
    examTip: "Compliance questions often require two things: (1) enforcement mechanism and (2) audit trail. Look for the pair that covers both.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you both enforce PII blocking in model outputs AND provide audit evidence to regulators, across multiple Regions?",
      testedConcepts: ["Guardrails sensitive information filters", "Invocation logging with trace data", "Compliance enforcement + auditability", "Multi-Region consistency"],
      servicesInPlay: [
        { service: "Amazon Bedrock Guardrails (PII Filters)", role: "Enforces PII blocking across Regions without code changes", isCorrectAnswer: true },
        { service: "Amazon Bedrock Invocation Logging (Trace)", role: "Captures audit evidence of PII detection and blocking", isCorrectAnswer: true },
        { service: "Amazon Comprehend", role: "PII detection on inputs — wrong direction (need output filtering)", isCorrectAnswer: false },
        { service: "AWS Lambda", role: "Custom regex — requires code changes, no structured audit", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Two requirements: enforcement + audit trail. 2. System prompt = unreliable — eliminate D. 3. Comprehend = filters inputs, not outputs — eliminate E. 4. Lambda regex = requires code changes — eliminate B. 5. Guardrails (A) = enforcement. 6. Invocation logging with trace (C) = audit evidence.",
      commonMistakes: [
        "Choosing Comprehend for output filtering — it processes inputs, the question asks about model responses",
        "Thinking invocation logging alone is sufficient — logging captures evidence but doesn't actively block PII",
        "Missing the audit trail requirement and only choosing the enforcement mechanism"
      ],
      timeManagementTip: "Two requirements: enforce + prove. Map each answer to one requirement. Quick pairing."
    }
  },

  // ─── op-27 ── Domain 3 — Bias (UPGRADED to Select TWO) ────────────
  {
    id: "op-27",
    domain: 3,
    task: "3.2",
    skills: ["3.2.1"],
    type: "multiple-response",
    difficulty: "hard",
    scenario: "A financial institution uses a GenAI model to generate loan application summaries for underwriters. During a routine audit, the compliance team discovers that the model produces subtly different language when describing applicants from different demographic groups — using more positive framing for some groups and more cautious language for others, even when financial profiles are identical. The institution must address this bias before regulators review the system in 60 days. The team needs to both understand the scope of the bias and implement a measurable mitigation. The institution has 10,000 historical loan summaries with demographic labels and underwriter feedback scores.",
    question: "Which combination of steps should the team take FIRST? (Select TWO.)",
    options: [
      { id: "a", text: "Use Amazon SageMaker Clarify to run bias metrics (such as Demographic Parity and Conditional Demographic Disparity) on the model outputs across demographic groups, establishing a quantitative baseline of the bias." },
      { id: "b", text: "Remove all demographic information and proxy variables (names, ZIP codes) from the input data before sending it to the model, then re-evaluate the outputs." },
      { id: "c", text: "Switch to a different foundation model that has published fairness benchmarks showing lower bias scores on standardized tests." },
      { id: "d", text: "Configure Amazon Bedrock Guardrails with content filters to block any output that contains demographic references or potentially biased language." },
      { id: "e", text: "Fine-tune the model using the 10,000 historical summaries, re-balancing the training data to include equal representation across demographic groups with standardized language patterns." }
    ],
    correctAnswers: ["a", "b"],
    explanation: "First, measure the bias quantitatively using SageMaker Clarify to establish a baseline — you can't demonstrate mitigation to regulators without before/after metrics. Second, remove demographic data and proxy variables from inputs, then re-evaluate — this is the fastest, most direct mitigation that can show measurable improvement within the 60-day timeline. Together, these steps create a defensible narrative: 'We measured the bias, removed contributing factors, and can show quantitative improvement.'",
    incorrectExplanations: {
      c: "Switching models doesn't guarantee the new model won't exhibit similar biases in this specific domain. Published benchmarks test general bias, not loan-summary-specific bias. It also wastes time evaluating and integrating a new model when the timeline is 60 days.",
      d: "Guardrails content filters block harmful content categories, not subtle language framing differences. A summary saying 'the applicant has adequate income' vs 'the applicant has strong income' wouldn't trigger content filters — both are appropriate language. This is the wrong tool for subtle linguistic bias.",
      e: "Fine-tuning on re-balanced data is a valid long-term strategy but requires data preparation, training, evaluation, and validation — unlikely to complete within 60 days. It's also premature to fine-tune before measuring the baseline bias (you wouldn't know if the fine-tuning helped)."
    },
    parseStrategy: {
      keyPhrase: "FIRST … understand scope … implement measurable mitigation … 60-day deadline … regulators",
      eliminationHints: [
        "Switch models = no guarantee, wastes time, general benchmarks ≠ domain-specific bias",
        "Guardrails content filters = wrong tool for subtle language framing",
        "Fine-tuning = too slow for 60 days, premature without baseline",
        "Clarify bias metrics = establishes quantitative baseline",
        "Remove demographics = fastest direct mitigation with measurable results"
      ],
      decisionFramework: "Bias remediation: (1) measure first with Clarify, (2) implement quickest mitigation (data removal), (3) show before/after improvement. Fine-tuning and model switching are slower follow-ups."
    },
    services: ["Amazon SageMaker Clarify", "Amazon Bedrock Guardrails"],
    examTip: "Bias questions on the exam follow a pattern: measure → mitigate → verify. 'FIRST' always means measure. The fastest mitigation is removing problematic inputs, not retraining.",
    strategicBreakdown: {
      whatIsBeingAsked: "Under a 60-day regulatory deadline, what are the first two steps to address and demonstrate bias mitigation?",
      testedConcepts: ["Bias detection workflow", "SageMaker Clarify metrics", "Data debiasing", "Regulatory-defensible remediation", "Timeline-constrained decision making"],
      servicesInPlay: [
        { service: "Amazon SageMaker Clarify", role: "Quantifies bias with measurable metrics — establishes baseline for regulators", isCorrectAnswer: true },
        { service: "Input Data Modification", role: "Removing demographic data and proxies — fastest direct mitigation", isCorrectAnswer: true },
        { service: "Amazon Bedrock Guardrails", role: "Content filters — wrong tool for subtle linguistic bias", isCorrectAnswer: false }
      ],
      approachStrategy: "1. 'FIRST' + regulators = need measurable baseline before mitigation. 2. Guardrails = wrong tool for subtle framing — eliminate D. 3. New model = no guarantee, wastes time — eliminate C. 4. Fine-tuning = too slow for 60 days — eliminate E. 5. Clarify (A) = measurement. 6. Remove demographics (B) = fastest mitigation.",
      commonMistakes: [
        "Choosing fine-tuning as a first step — you need baseline measurements before training",
        "Thinking Guardrails can detect subtle language framing differences — they handle harmful content, not nuance",
        "Switching models without measuring — you'd just be guessing that a new model is better"
      ],
      timeManagementTip: "'FIRST' + bias = measure (Clarify) + fastest fix (data removal). The 60-day constraint eliminates fine-tuning immediately."
    }
  },

  // ─── op-28 ── Domain 2 — Embedding model (UPGRADED) ───────────────
  {
    id: "op-28",
    domain: 2,
    task: "2.3",
    skills: ["2.3.1"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A multinational pharmaceutical company is setting up an Amazon Bedrock Knowledge Base to enable RAG over their drug research documentation. The corpus includes 200,000 documents in English and Japanese, containing highly specialized pharmacological terminology, chemical compound names, and regulatory references. The team has evaluated three embedding models: Model A has 1,536 dimensions and was trained primarily on English biomedical literature. Model B has 1,024 dimensions and was trained on multilingual general-purpose text including both English and Japanese. Model C has 384 dimensions and was trained on multilingual scientific text including pharmacological terminology in both languages. The team needs the best semantic search accuracy for their domain-specific content across both languages.",
    question: "Which embedding model should the team select?",
    options: [
      { id: "a", text: "Model A (1,536 dimensions, English biomedical) because it has the highest dimensional representation and the closest domain alignment to pharmacological content." },
      { id: "b", text: "Model B (1,024 dimensions, multilingual general-purpose) because it supports both English and Japanese and has moderate dimensions for a balance of accuracy and efficiency." },
      { id: "c", text: "Model C (384 dimensions, multilingual scientific/pharmacological) because its training data most closely matches the company's domain and language requirements, despite having fewer dimensions." },
      { id: "d", text: "Use Model A for English documents and Model B for Japanese documents, creating separate vector indexes for each language to maximize per-language accuracy." }
    ],
    correctAnswers: ["c"],
    explanation: "Embedding model quality depends primarily on the alignment between the model's training data and the target domain. Model C, despite having fewer dimensions, was trained specifically on multilingual scientific text including pharmacological terminology — directly matching the company's domain and language mix. Domain-aligned training data produces more semantically meaningful vectors than higher dimensions trained on misaligned data.",
    incorrectExplanations: {
      a: "Model A has the highest dimensions but was trained only on English biomedical literature. It cannot produce meaningful embeddings for Japanese documents, making it unsuitable for a bilingual corpus. Higher dimensions don't compensate for missing language coverage.",
      b: "Model B supports both languages but its general-purpose training data lacks pharmacological domain knowledge. Embeddings for specialized terms like chemical compound names and regulatory references would be less semantically meaningful than a model trained on scientific/pharmaceutical text.",
      d: "Splitting into two indexes by language prevents cross-language retrieval (a Japanese query couldn't find relevant English research papers and vice versa). It also doubles index management complexity and prevents the unified multilingual search the company needs."
    },
    parseStrategy: {
      keyPhrase: "specialized pharmacological terminology … English and Japanese … best semantic search accuracy",
      eliminationHints: [
        "Model A = English only, can't embed Japanese documents",
        "Model B = multilingual but general-purpose, lacks domain knowledge",
        "Two separate indexes = prevents cross-language retrieval",
        "Model C = multilingual + domain-aligned, despite lower dimensions"
      ],
      decisionFramework: "Embedding model selection priority: (1) language coverage, (2) domain alignment, (3) dimensions. A model that doesn't cover your language is immediately disqualified, regardless of dimensions."
    },
    services: ["Amazon Bedrock Knowledge Bases"],
    examTip: "For embedding models: domain + language alignment > dimensions. A 384-dim model trained on your domain outperforms a 1,536-dim model trained on general text. Don't be fooled by higher numbers.",
    strategicBreakdown: {
      whatIsBeingAsked: "Which embedding model produces the best semantic search for bilingual pharmaceutical documents?",
      testedConcepts: ["Embedding model selection", "Domain alignment vs dimensions", "Multilingual embedding", "Cross-language retrieval"],
      servicesInPlay: [
        { service: "Amazon Bedrock Knowledge Bases", role: "RAG system using embedding models for semantic search", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Requirements: bilingual (EN+JP) + pharmacological domain. 2. Model A = English only — can't handle Japanese — eliminate A. 3. Split indexes = prevents cross-language search — eliminate D. 4. Model B vs C: both are multilingual, but C has domain-aligned training. 5. Domain alignment > dimensions — choose C.",
      commonMistakes: [
        "Choosing the highest-dimension model regardless of language coverage",
        "Thinking separate per-language indexes is a good practice — it prevents cross-language retrieval",
        "Assuming general-purpose multilingual models understand domain-specific terminology",
        "Equating more dimensions with better accuracy — training data alignment matters more"
      ],
      timeManagementTip: "First filter: must support both languages (eliminates A). Then: domain alignment > dimensions (eliminates B). Quick two-step."
    }
  },

  // ─── op-29 ── Domain 4 — Access control (UPGRADED) ────────────────
  {
    id: "op-29",
    domain: 4,
    task: "4.1",
    skills: ["4.1.1"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "An enterprise has multiple development teams across three AWS accounts within an AWS Organization. The security team requires that: (1) Only the ML platform team in the shared-services account can invoke expensive large language models (Claude Opus, GPT-4 class). (2) Application teams in the two application accounts should only access smaller, less expensive models (Claude Haiku, Amazon Nova Micro). (3) No account administrator should be able to override these restrictions. (4) The restrictions must be enforceable from a single central location. The organization uses AWS IAM Identity Center for federated access across accounts.",
    question: "Which approach provides the required level of control?",
    options: [
      { id: "a", text: "Create IAM policies in each account that deny access to non-approved Bedrock model ARNs for application team roles." },
      { id: "b", text: "Use AWS Organizations Service Control Policies (SCPs) attached to the application account OUs to deny bedrock:InvokeModel for the expensive model ARNs, while allowing them in the shared-services account OU." },
      { id: "c", text: "Configure Amazon Bedrock model access management in each application account to disable the expensive models, and enable them only in the shared-services account." },
      { id: "d", text: "Create IAM permission boundaries for all roles in the application accounts that exclude the expensive model ARNs from allowed actions." }
    ],
    correctAnswers: ["b"],
    explanation: "SCPs attached to Organizational Units (OUs) provide centrally managed, non-overridable permission guardrails. By attaching an SCP to the application accounts' OU that denies InvokeModel for expensive model ARNs, no principal in those accounts — including administrators — can invoke those models. The shared-services account in a different OU is unaffected. SCPs are managed from a single location (the Organizations management account), meeting the central management requirement.",
    incorrectExplanations: {
      a: "Per-account IAM policies can be modified or deleted by account administrators, violating requirement #3. They also must be maintained separately in each account, violating requirement #4 (single central location).",
      c: "Bedrock model access management is an account-level toggle that can be changed by account administrators, violating requirement #3. It also requires per-account configuration, violating the central management requirement.",
      d: "Permission boundaries are attached to individual IAM roles and must be configured per-role in each account. Account administrators can create new roles without the boundary. They don't provide central, non-overridable enforcement."
    },
    parseStrategy: {
      keyPhrase: "no administrator can override … single central location … multiple accounts … Organization",
      eliminationHints: [
        "Per-account IAM = admins can modify, not central",
        "Bedrock model access = admin can re-enable, not central",
        "Permission boundaries = per-role, admins can create unbounded roles",
        "SCPs = central, non-overridable, OU-scoped"
      ],
      decisionFramework: "Non-overridable + central + multi-account = SCPs. Per-account IAM and Bedrock model access can always be overridden by account admins."
    },
    services: ["Amazon Bedrock", "AWS IAM", "AWS Organizations"],
    examTip: "SCPs are the only AWS mechanism that cannot be overridden by account administrators. If the question says 'cannot be overridden,' the answer is SCPs.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you centrally restrict which Bedrock models specific accounts can use, in a way that account admins can't bypass?",
      testedConcepts: ["Service Control Policies", "OU-scoped restrictions", "Non-overridable guardrails", "Central governance", "Permission boundaries limitations"],
      servicesInPlay: [
        { service: "AWS Organizations SCPs", role: "OU-scoped, non-overridable, centrally managed permission guardrails", isCorrectAnswer: true },
        { service: "AWS IAM Policies", role: "Per-account, overridable by admins", isCorrectAnswer: false },
        { service: "AWS IAM Permission Boundaries", role: "Per-role, admins can create unbounded roles", isCorrectAnswer: false },
        { service: "Amazon Bedrock Model Access", role: "Account-level toggle, overridable by admins", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Non-overridable = eliminates IAM policies (A), Bedrock model access (C), permission boundaries (D) — all can be changed by admins. 2. Central location = only SCPs are managed from Organizations management account. 3. OU-scoped = different restrictions per OU (app accounts vs shared services).",
      commonMistakes: [
        "Thinking permission boundaries are non-overridable — admins can create new roles without boundaries",
        "Confusing Bedrock model access management (account-level, admin-changeable) with organization-level controls",
        "Choosing per-account IAM policies for central governance — they're decentralized by nature"
      ],
      timeManagementTip: "'Cannot be overridden by admins' = SCPs. Only one mechanism in AWS has this property. Instant answer."
    }
  },

  // ─── op-30 ── Domain 5 — Evaluation (UPGRADED) ────────────────────
  {
    id: "op-30",
    domain: 5,
    task: "5.1",
    skills: ["5.1.2"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A company has built a GenAI application that generates creative marketing copy for social media campaigns. The team runs automated evaluations using ROUGE and BERTScore against reference copies written by human marketers. Both metrics consistently score above 0.85, indicating strong textual and semantic similarity to the references. However, the marketing director reports that the generated copy 'reads like a Wikipedia article' — it's factually accurate and structurally similar to the references but lacks brand personality, emotional hooks, and the conversational tone that drives engagement. The team needs to add an evaluation method that captures these qualitative dimensions while keeping the existing automated metrics for factual accuracy monitoring.",
    question: "Which evaluation approach will BEST address the marketing director's concerns?",
    options: [
      { id: "a", text: "Replace ROUGE and BERTScore with a custom automated metric that weights style and tone more heavily than content overlap." },
      { id: "b", text: "Use Amazon Bedrock Model Evaluation with a human evaluation workflow where marketing experts rate each output on brand voice, emotional appeal, and engagement potential using a structured rubric." },
      { id: "c", text: "Use an LLM-as-judge approach by prompting a separate, larger FM to evaluate the generated copy on creativity, tone, and brand alignment, and average the scores with the existing automated metrics." },
      { id: "d", text: "Fine-tune the model on a curated dataset of high-engagement social media posts to align its output style with proven engagement patterns." }
    ],
    correctAnswers: ["b"],
    explanation: "Brand voice, emotional hooks, and conversational tone are subjective qualities that require domain expert judgment. Amazon Bedrock Model Evaluation's human evaluation workflow enables marketing experts to rate outputs on custom criteria using a structured rubric, providing the qualitative assessment that automated metrics cannot capture. The existing ROUGE and BERTScore metrics are kept for factual accuracy — human evaluation supplements, not replaces, automated evaluation.",
    incorrectExplanations: {
      a: "Replacing the existing metrics loses factual accuracy monitoring (the scenario says to keep them). Custom automated metrics for style and tone are extremely difficult to design — 'brand personality' and 'emotional hooks' don't have reliable algorithmic proxies.",
      c: "LLM-as-judge can approximate some qualitative assessments but introduces its own biases and doesn't truly understand the company's specific brand voice. For high-stakes marketing evaluation where the marketing director is the stakeholder, human expert judgment is more reliable and defensible.",
      d: "Fine-tuning on high-engagement posts changes the model's outputs, not the evaluation method. The question asks how to evaluate, not how to improve. Fine-tuning also doesn't tell you whether the new outputs actually have the desired brand voice — you still need the evaluation."
    },
    parseStrategy: {
      keyPhrase: "brand personality … emotional hooks … conversational tone … keep existing automated metrics",
      eliminationHints: [
        "Replace automated metrics = loses factual accuracy monitoring (contradicts 'keeping' them)",
        "Custom automated metric for style = extremely hard to design reliably",
        "LLM-as-judge = doesn't know company's specific brand voice",
        "Fine-tuning = changes outputs, doesn't address evaluation gap",
        "Human evaluation = domain experts assess subjective quality"
      ],
      decisionFramework: "Automated metrics measure textual properties. Subjective qualities (brand voice, emotion, engagement) require human expert evaluation. The best approach supplements automated with human, not replaces."
    },
    services: ["Amazon Bedrock Model Evaluation"],
    examTip: "When automated metrics are high but stakeholders are unsatisfied, the gap is qualitative — human evaluation fills it. Don't try to build automated metrics for subjective qualities.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you evaluate GenAI marketing copy on subjective brand qualities when automated metrics already cover factual accuracy?",
      testedConcepts: ["Human vs automated evaluation", "Evaluation metric limitations", "LLM-as-judge trade-offs", "Supplementary evaluation strategies"],
      servicesInPlay: [
        { service: "Amazon Bedrock Model Evaluation (Human)", role: "Marketing experts rate outputs on brand voice, emotion, engagement with structured rubrics", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Automated metrics high, stakeholder unsatisfied = qualitative gap. 2. Replace metrics = loses factual monitoring — eliminate A. 3. Fine-tuning = changes model, not evaluation — eliminate D. 4. LLM-as-judge = approximation, doesn't know company brand — eliminate C. 5. Human evaluation by domain experts = directly addresses the gap.",
      commonMistakes: [
        "Choosing LLM-as-judge over human experts — for company-specific brand voice, humans are more reliable",
        "Confusing 'improve the model' (fine-tuning) with 'improve the evaluation' (human review)",
        "Trying to replace existing metrics instead of supplementing them"
      ],
      timeManagementTip: "Automated metrics fine + stakeholder unhappy = add human evaluation. Classic supplementary pattern."
    }
  },

  // ─── op-31 ── Domain 2 — Streaming architecture (UPGRADED) ────────
  {
    id: "op-31",
    domain: 2,
    task: "2.1",
    skills: ["2.1.3"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A developer is building a conversational AI interface using Amazon Bedrock behind Amazon API Gateway and AWS Lambda. Users complain about long wait times because the application displays nothing until the entire response is generated. The developer wants to implement progressive text display where tokens appear as the model generates them. The current architecture uses a REST API endpoint in API Gateway that invokes a Lambda function, which calls the Bedrock InvokeModel API and returns the complete response. The developer must modify the architecture to support real-time token streaming to the browser while maintaining the API Gateway and Lambda layers.",
    question: "Which architectural changes are required to enable real-time token streaming?",
    options: [
      { id: "a", text: "Replace the REST API with a WebSocket API in API Gateway. Modify the Lambda function to call InvokeModelWithResponseStream and send each response chunk to the client through the WebSocket connection." },
      { id: "b", text: "Keep the REST API but enable Lambda response streaming by configuring the Lambda function URL with the RESPONSE_STREAM invoke mode. Call InvokeModelWithResponseStream from Lambda and pipe the chunks through the streaming response." },
      { id: "c", text: "Keep the REST API and enable API Gateway caching to reduce the perceived wait time. Modify the Lambda function to call InvokeModelWithResponseStream and buffer chunks, returning the assembled response when complete." },
      { id: "d", text: "Replace both API Gateway and Lambda with a direct Amazon Bedrock endpoint connection from the browser, using the AWS SDK's streaming client to receive tokens directly." }
    ],
    correctAnswers: ["a"],
    explanation: "REST APIs in API Gateway are synchronous request-response — they cannot stream partial responses to the client. WebSocket APIs support bidirectional communication, enabling the server to push individual token chunks to the client as they arrive. The Lambda function calls InvokeModelWithResponseStream and sends each chunk through the established WebSocket connection, achieving real-time progressive display.",
    incorrectExplanations: {
      b: "Lambda response streaming with function URLs bypasses API Gateway entirely — the question requires maintaining the API Gateway layer. Function URLs are a separate invocation mechanism that doesn't integrate with API Gateway's authorization, throttling, and routing features.",
      c: "Buffering stream chunks in Lambda and returning the assembled response defeats the purpose of streaming — the client still waits for the complete response. API Gateway caching only helps with repeated identical requests, not with progressive display of new responses.",
      d: "Direct browser-to-Bedrock connections expose AWS credentials in the client, creating a security vulnerability. The API Gateway and Lambda layers provide authorization, rate limiting, and credential isolation that the question requires maintaining."
    },
    parseStrategy: {
      keyPhrase: "real-time token streaming … REST API currently … must maintain API Gateway and Lambda",
      eliminationHints: [
        "REST API = synchronous, cannot stream partial responses",
        "Lambda function URL = bypasses API Gateway (violates constraint)",
        "Buffering + assembling = defeats purpose of streaming",
        "Direct browser-to-Bedrock = security vulnerability",
        "WebSocket API = bidirectional, supports server-push streaming"
      ],
      decisionFramework: "Real-time streaming through API Gateway requires WebSocket API (not REST). REST APIs are synchronous request-response by design."
    },
    services: ["Amazon Bedrock", "Amazon API Gateway", "AWS Lambda"],
    examTip: "REST API Gateway = synchronous. WebSocket API Gateway = real-time bidirectional. For streaming FM responses through API Gateway, WebSocket is the only option.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you architect real-time token streaming from Bedrock through API Gateway and Lambda to a browser?",
      testedConcepts: ["WebSocket vs REST API Gateway", "InvokeModelWithResponseStream", "Lambda response streaming", "Streaming architecture patterns"],
      servicesInPlay: [
        { service: "Amazon API Gateway (WebSocket)", role: "Bidirectional connection enabling server-push of token chunks", isCorrectAnswer: true },
        { service: "Amazon Bedrock (InvokeModelWithResponseStream)", role: "Streaming API that returns tokens as chunks", isCorrectAnswer: true },
        { service: "AWS Lambda", role: "Receives stream chunks and pushes through WebSocket", isCorrectAnswer: true },
        { service: "Amazon API Gateway (REST)", role: "Synchronous — cannot stream partial responses", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Current REST API = synchronous = can't stream. 2. Must maintain API Gateway = eliminates function URLs (B) and direct connections (D). 3. Buffering defeats purpose — eliminate C. 4. WebSocket API = bidirectional streaming through API Gateway.",
      commonMistakes: [
        "Thinking REST APIs can stream partial responses — they're strictly request-response",
        "Choosing Lambda function URLs without realizing they bypass API Gateway",
        "Buffering stream chunks in Lambda, which negates the streaming benefit",
        "Confusing InvokeModelWithResponseStream (the Bedrock API) with the delivery mechanism (WebSocket)"
      ],
      timeManagementTip: "REST = synchronous. Streaming = WebSocket. If 'maintain API Gateway' is a constraint, the answer is WebSocket API."
    }
  },

  // ─── op-32 ── Domain 4 — Encryption (UPGRADED to Select TWO) ──────
  {
    id: "op-32",
    domain: 4,
    task: "4.2",
    skills: ["4.2.1"],
    type: "multiple-response",
    difficulty: "hard",
    scenario: "A government agency is deploying an Amazon Bedrock Knowledge Base backed by Amazon OpenSearch Serverless to store classified documents. The security policy mandates: (1) All data stored in the vector database must be encrypted with encryption keys that the agency controls, rotates on a yearly schedule, and can revoke immediately if compromised. (2) All access to the encryption keys must be logged for security auditing, including which principal accessed which key and when. (3) The solution must integrate with the agency's existing AWS CloudTrail-based audit infrastructure.",
    question: "Which combination of steps meets these security requirements? (Select TWO.)",
    options: [
      { id: "a", text: "Use the default AWS-managed encryption provided by Amazon OpenSearch Serverless, which automatically handles key rotation and integrates with CloudTrail for API call logging." },
      { id: "b", text: "Create a customer-managed AWS KMS key with automatic yearly rotation enabled. Configure the Amazon OpenSearch Serverless collection to use this KMS key for encryption at rest." },
      { id: "c", text: "Enable AWS CloudTrail logging for the AWS KMS service to capture all key usage events, including which IAM principal performed which cryptographic operation on the key and when." },
      { id: "d", text: "Encrypt the documents at the application level before uploading to S3, using the agency's on-premises HSM for key management." },
      { id: "e", text: "Configure Amazon Macie to monitor the OpenSearch Serverless collection for unencrypted data and generate alerts if encryption is not applied." }
    ],
    correctAnswers: ["b", "c"],
    explanation: "A customer-managed KMS key gives the agency full control: they own the key, can configure automatic yearly rotation, and can revoke it (disable or schedule deletion) immediately if compromised. CloudTrail logging for the KMS service captures every cryptographic operation — who decrypted, when, and for which key — integrating with the agency's existing CloudTrail audit infrastructure.",
    incorrectExplanations: {
      a: "AWS-managed keys are controlled by AWS, not the agency. The agency cannot manage the rotation schedule, cannot revoke the key independently, and doesn't get granular per-operation audit logs. This violates the 'keys that the agency controls' requirement.",
      d: "Application-level encryption before S3 upload would prevent Bedrock from reading and processing the documents. The Knowledge Base needs to read plaintext to generate vector embeddings — application-level encryption makes the data unusable for RAG.",
      e: "Amazon Macie monitors for sensitive data exposure in S3, not encryption status in OpenSearch Serverless. It's a data privacy tool, not an encryption compliance tool. It also doesn't address key management or audit logging."
    },
    parseStrategy: {
      keyPhrase: "keys the agency controls … rotate yearly … revoke immediately … key access logged … CloudTrail",
      eliminationHints: [
        "AWS-managed keys = agency doesn't control rotation or revocation",
        "App-level encryption = Bedrock can't read the data for RAG",
        "Macie = data privacy monitoring, not encryption key management",
        "Customer-managed KMS = agency controls key lifecycle",
        "CloudTrail for KMS = captures all key usage events"
      ],
      decisionFramework: "Customer-controlled encryption = customer-managed KMS key. Audit of key usage = CloudTrail for KMS. Two complementary controls."
    },
    services: ["Amazon Bedrock Knowledge Bases", "Amazon OpenSearch Serverless", "AWS KMS", "AWS CloudTrail"],
    examTip: "Encryption compliance = two parts: (1) customer-managed KMS key for control, (2) CloudTrail for KMS for audit. They always come as a pair.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you encrypt a Bedrock KB vector store with agency-controlled keys AND log all key access for audit?",
      testedConcepts: ["Customer-managed KMS keys", "Key rotation and revocation", "CloudTrail for KMS auditing", "Encryption at rest for OpenSearch Serverless"],
      servicesInPlay: [
        { service: "AWS KMS (Customer-Managed Key)", role: "Agency-controlled key with rotation, revocation, and ownership", isCorrectAnswer: true },
        { service: "AWS CloudTrail (KMS Events)", role: "Captures all cryptographic operations for security audit", isCorrectAnswer: true },
        { service: "AWS-Managed Encryption", role: "AWS controls the key — agency has no management capability", isCorrectAnswer: false },
        { service: "Amazon Macie", role: "Data privacy monitoring — wrong tool for encryption key audit", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Two requirements: key control + key audit. 2. AWS-managed = no agency control — eliminate A. 3. App-level encryption = breaks RAG — eliminate D. 4. Macie = wrong scope — eliminate E. 5. Customer-managed KMS (B) = control. 6. CloudTrail for KMS (C) = audit.",
      commonMistakes: [
        "Thinking AWS-managed keys meet 'agency controls' requirements — they don't",
        "Choosing application-level encryption without realizing it breaks the RAG pipeline",
        "Confusing Macie (data privacy) with encryption key audit (CloudTrail for KMS)"
      ],
      timeManagementTip: "Two requirements: control + audit. Customer-managed KMS = control. CloudTrail for KMS = audit. Classic pair."
    }
  },

  // ─── op-33 ── Domain 2 — Agent ROC (UPGRADED) ─────────────────────
  {
    id: "op-33",
    domain: 2,
    task: "2.2",
    skills: ["2.2.3"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A banking application uses an Amazon Bedrock Agent with action groups to process fund transfer requests. Regulatory requirements mandate that before any transfer above $10,000 is executed, the application must: (1) Present the transfer details (amount, source account, destination account) to the user for explicit confirmation. (2) The agent must not proceed with the transfer action until the user confirms. (3) If the user does not confirm within 5 minutes, the transfer request must be cancelled. (4) The entire confirmation flow must be handled within the existing Bedrock Agent framework without building a separate approval workflow. The team has considered implementing a confirmation Lambda that polls for user input, but wants a cleaner solution.",
    question: "Which approach meets all requirements within the Bedrock Agent framework?",
    options: [
      { id: "a", text: "Configure the transfer Action Group with the Return of Control (ROC) feature. When the agent determines a transfer exceeds $10,000, it pauses execution and returns the proposed action parameters to the calling application. The application presents the details to the user, and on confirmation within the 5-minute window, sends the confirmation back to the agent to proceed." },
      { id: "b", text: "Add a confirmation step to the agent's system prompt instructing it to ask 'Do you confirm this transfer?' before executing. Parse the user's response in the next turn to determine whether to proceed." },
      { id: "c", text: "Create a separate 'confirmation' Action Group backed by a Lambda function that sends an SNS notification to the user and waits for a response callback before allowing the transfer action to execute." },
      { id: "d", text: "Implement a Bedrock Guardrail that blocks all transfer actions above $10,000 and returns a message asking the user to confirm, then re-submit the request with a confirmation token." }
    ],
    correctAnswers: ["a"],
    explanation: "Return of Control (ROC) is the Bedrock Agent feature designed for exactly this use case. When enabled on an Action Group, the agent pauses execution after determining the action parameters but before executing the Lambda. The proposed action and parameters are returned to the calling application, which can present them to the user, enforce the 5-minute timeout, and send confirmation back. This stays entirely within the Bedrock Agent framework.",
    incorrectExplanations: {
      b: "Prompt-based confirmation has no mechanism to actually pause execution — the agent may interpret 'yes' or 'no' incorrectly, and there's no enforcement preventing execution without confirmation. It also doesn't support the 5-minute timeout requirement. Regulatory compliance cannot depend on prompt instructions.",
      c: "A separate confirmation Lambda with SNS introduces an asynchronous approval workflow outside the agent framework. Lambda functions have a maximum execution timeout of 15 minutes, and polling for user input is operationally complex. This contradicts the 'within the existing Bedrock Agent framework' requirement.",
      d: "Guardrails are content filtering mechanisms, not workflow control tools. They can block content categories but cannot implement conditional execution flows with timeouts and confirmations. Using a guardrail for workflow control is an architectural mismatch."
    },
    parseStrategy: {
      keyPhrase: "agent must not proceed until confirmation … within Bedrock Agent framework … 5-minute timeout",
      eliminationHints: [
        "Prompt-based = no actual execution pause, no timeout enforcement",
        "Separate Lambda/SNS = outside agent framework, operationally complex",
        "Guardrails = content filtering, not workflow control",
        "Return of Control = built-in pause-and-confirm with application-managed timeout"
      ],
      decisionFramework: "Agent needs to pause before executing an action and wait for external confirmation = Return of Control. The application manages the timeout, the agent manages the pause."
    },
    services: ["Amazon Bedrock Agents"],
    examTip: "Return of Control (ROC) = human-in-the-loop for agent actions. Guardrails = content filtering. Don't confuse workflow control with content safety.",
    strategicBreakdown: {
      whatIsBeingAsked: "How does a Bedrock Agent implement a mandatory confirmation step with timeout before executing a sensitive action?",
      testedConcepts: ["Return of Control feature", "Human-in-the-loop agent workflows", "Agent vs Guardrails scope", "Application-managed confirmation flow"],
      servicesInPlay: [
        { service: "Amazon Bedrock Agents (Return of Control)", role: "Pauses agent execution, returns proposed action to application for confirmation", isCorrectAnswer: true },
        { service: "Amazon Bedrock Guardrails", role: "Content filtering — wrong tool for workflow control", isCorrectAnswer: false }
      ],
      approachStrategy: "1. 'Within agent framework' eliminates custom Lambda/SNS workflows (C). 2. Prompt-based = no real pause, no timeout enforcement — eliminate B. 3. Guardrails = content filtering, not workflow — eliminate D. 4. ROC = designed for this exact use case.",
      commonMistakes: [
        "Confusing Guardrails (content safety) with Return of Control (workflow control)",
        "Thinking prompt instructions can enforce execution pauses — the agent has no pause mechanism via prompts",
        "Building separate approval workflows when ROC provides this natively within the agent framework"
      ],
      timeManagementTip: "Pause agent + wait for confirmation = Return of Control. The feature name describes the behavior."
    }
  },

  // ─── op-34 ── Domain 1 — Fine-tuning (UPGRADED) ───────────────────
  {
    id: "op-34",
    domain: 1,
    task: "1.3",
    skills: ["1.3.1"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A healthcare company needs an FM to extract structured data (medication names, dosages, frequencies) from unstructured doctor's notes and output results in a specific JSON schema. The team has tried the following approaches in sequence: (1) Zero-shot prompting with detailed output format instructions: 52% accuracy. (2) Few-shot prompting with 5 examples: 71% accuracy. (3) Few-shot with 15 examples: 73% accuracy (diminishing returns, plus the examples consume 40% of the context window). The company has 200 manually labeled doctor's notes with correct JSON outputs. They need 95%+ accuracy for production and want to minimize ongoing per-request inference costs.",
    question: "Which approach is MOST likely to achieve the required accuracy while minimizing inference costs?",
    options: [
      { id: "a", text: "Continue increasing few-shot examples to 30 and use a model with a larger context window to accommodate them alongside the doctor's note." },
      { id: "b", text: "Fine-tune the FM on Amazon Bedrock using the 200 labeled examples, training the model to learn the extraction patterns and JSON output format specific to this domain." },
      { id: "c", text: "Use continued pre-training with a large unlabeled corpus of doctor's notes to teach the model medical terminology, then apply the 15-example few-shot prompt." },
      { id: "d", text: "Switch to a larger, more capable FM with stronger reasoning capabilities and use the existing 15-example few-shot prompt, relying on the model's improved comprehension." }
    ],
    correctAnswers: ["b"],
    explanation: "Fine-tuning on 200 labeled examples directly teaches the model the extraction patterns and JSON schema for this specific task. Few-shot has plateaued at 73% with diminishing returns, and the labeled data (input doctor's notes → output JSON) is exactly the format fine-tuning requires. Fine-tuning also eliminates the need for few-shot examples in every prompt, reducing per-request token costs by ~40% (the space previously consumed by examples).",
    incorrectExplanations: {
      a: "Few-shot already showed diminishing returns (71% → 73% going from 5 to 15 examples). Doubling to 30 is unlikely to bridge the gap to 95%, and a larger context window increases per-request costs. This approach optimizes the wrong variable — the model needs to learn the patterns, not see more examples at inference time.",
      c: "Continued pre-training teaches domain vocabulary (medical terminology) but the model's problem isn't understanding medical terms — it's learning the specific extraction-to-JSON mapping. CPT requires unlabeled text and addresses knowledge gaps, not task-specific behavior. The team has labeled data, which is the signal for fine-tuning, not CPT.",
      d: "A larger model increases per-request costs significantly and doesn't address the domain-specific extraction patterns. The 73% accuracy ceiling is a task-specific limitation, not a model capability limitation — the model understands the notes but hasn't learned the extraction patterns."
    },
    parseStrategy: {
      keyPhrase: "few-shot plateaued at 73% … 200 labeled examples … 95% required … minimize inference costs",
      eliminationHints: [
        "More few-shot = diminishing returns already demonstrated",
        "CPT = teaches vocabulary, not task behavior (team has labeled data)",
        "Larger model = higher cost, doesn't fix domain-specific patterns",
        "Fine-tuning = uses labeled data, eliminates few-shot token overhead"
      ],
      decisionFramework: "The escalation path: zero-shot → few-shot → fine-tuning. When few-shot plateaus and you have labeled data, fine-tuning is the next step. CPT is for unlabeled domain knowledge, not task behavior."
    },
    services: ["Amazon Bedrock"],
    examTip: "Key signals: (1) few-shot diminishing returns = prompting has hit ceiling, (2) labeled data available = fine-tuning is viable, (3) structured output format = fine-tuning excels at learning consistent output patterns.",
    strategicBreakdown: {
      whatIsBeingAsked: "When few-shot prompting plateaus for a structured extraction task and you have 200 labeled examples, what's the next step?",
      testedConcepts: ["Prompt engineering ceiling", "Fine-tuning vs continued pre-training", "Labeled vs unlabeled data", "Inference cost optimization"],
      servicesInPlay: [
        { service: "Amazon Bedrock (Fine-Tuning)", role: "Trains on labeled examples to learn extraction patterns and JSON output format", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Few-shot plateaued (73%) with diminishing returns. 2. 200 labeled examples = fine-tuning signal (not CPT, which uses unlabeled data). 3. More few-shot = wrong direction — eliminate A. 4. CPT = vocabulary, not task behavior — eliminate C. 5. Larger model = cost increase without domain-specific improvement — eliminate D. 6. Fine-tuning = directly learns the mapping.",
      commonMistakes: [
        "Confusing CPT (unlabeled, learns vocabulary) with fine-tuning (labeled, learns task behavior)",
        "Thinking more few-shot examples always help — they have diminishing returns",
        "Assuming a larger model overcomes task-specific accuracy ceilings — it's about patterns, not raw capability",
        "Not recognizing that fine-tuning eliminates few-shot token overhead, reducing inference costs"
      ],
      timeManagementTip: "Few-shot plateau + labeled data = fine-tuning. The scenario gives you the escalation path explicitly."
    }
  },

  // ─── op-35 ── Domain 5 — Deployment (UPGRADED to Select TWO) ──────
  {
    id: "op-35",
    domain: 5,
    task: "5.2",
    skills: ["5.2.1"],
    type: "multiple-response",
    difficulty: "hard",
    scenario: "A company is upgrading their GenAI customer service application from Claude Sonnet to Claude Opus for improved response quality. Before the full cutover, the team must: (1) Gradually shift production traffic from Sonnet to Opus to monitor quality differences under real-world conditions. (2) Automatically roll back to Sonnet if Opus's customer satisfaction score (CSAT) drops below a threshold, without manual intervention. (3) Maintain a single application endpoint — the client application should not be aware of which model is serving responses. The team uses Amazon CloudWatch for operational monitoring and has existing CSAT scoring pipeline that publishes metrics to CloudWatch.",
    question: "Which combination of steps will meet these requirements? (Select TWO.)",
    options: [
      { id: "a", text: "Use Amazon Bedrock inference profiles to route a configurable percentage of traffic to Claude Opus while the remainder continues to be served by Claude Sonnet, providing a single inference profile ARN as the application endpoint." },
      { id: "b", text: "Deploy both models behind an Application Load Balancer with weighted target groups. Adjust target group weights to shift traffic gradually." },
      { id: "c", text: "Create a CloudWatch Alarm on the CSAT metric with an Amazon EventBridge rule that triggers an AWS Lambda function to update the inference profile's traffic weights back to 100% Sonnet when CSAT drops below the threshold." },
      { id: "d", text: "Implement A/B testing by randomly routing requests in the application code based on a feature flag, logging which model served each request." },
      { id: "e", text: "Create a CloudWatch dashboard to visualize CSAT differences between models and have an on-call engineer manually adjust traffic weights when issues are detected." }
    ],
    correctAnswers: ["a", "c"],
    explanation: "Bedrock inference profiles provide native traffic splitting between models with a single endpoint ARN — the application sends all requests to one inference profile and the routing happens transparently (requirement #3). CloudWatch Alarm on CSAT → EventBridge → Lambda → update inference profile weights provides automated rollback when quality drops (requirement #2), without manual intervention.",
    incorrectExplanations: {
      b: "An Application Load Balancer requires hosting model endpoints as separate targets, which adds infrastructure complexity. Bedrock models aren't deployed as ALB targets — they're invoked via API calls. This approach doesn't work with Bedrock's managed inference model.",
      d: "Application-level A/B routing means the client application must be aware of the routing logic and model selection, violating requirement #3 (single endpoint, client unaware). Feature flags add application complexity instead of using the managed infrastructure.",
      e: "Manual monitoring and adjustment by an on-call engineer violates requirement #2 (automatically roll back without manual intervention). Human response time introduces delay that could affect customer experience during a quality degradation."
    },
    parseStrategy: {
      keyPhrase: "gradually shift traffic … automatically roll back … single endpoint … no manual intervention",
      eliminationHints: [
        "ALB = Bedrock models aren't ALB targets, adds unnecessary infrastructure",
        "Application-level routing = client must be aware, violates single endpoint",
        "Manual engineer adjustment = violates 'without manual intervention'",
        "Inference profiles = native traffic splitting with single ARN",
        "CloudWatch Alarm → EventBridge → Lambda = automated rollback"
      ],
      decisionFramework: "Gradual model migration on Bedrock = inference profiles. Automated rollback = CloudWatch Alarm → EventBridge → Lambda → update weights."
    },
    services: ["Amazon Bedrock", "Amazon CloudWatch", "Amazon EventBridge", "AWS Lambda"],
    examTip: "Multi-step automation pattern: metric threshold (CloudWatch Alarm) → event (EventBridge) → action (Lambda). This pattern appears frequently for automated remediation.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you gradually migrate Bedrock models with automated quality-based rollback and a transparent single endpoint?",
      testedConcepts: ["Bedrock inference profiles", "Automated rollback via CloudWatch/EventBridge/Lambda", "Canary deployment patterns", "Single-endpoint model migration"],
      servicesInPlay: [
        { service: "Amazon Bedrock Inference Profiles", role: "Native traffic splitting between models with single endpoint ARN", isCorrectAnswer: true },
        { service: "CloudWatch Alarm → EventBridge → Lambda", role: "Automated rollback when CSAT drops below threshold", isCorrectAnswer: true },
        { service: "Application Load Balancer", role: "Doesn't work with Bedrock's API-based model invocation", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Two requirements: traffic splitting + automated rollback. 2. ALB = doesn't work with Bedrock — eliminate B. 3. App-level routing = client must be aware — eliminate D. 4. Manual engineer = not automated — eliminate E. 5. Inference profiles (A) = traffic splitting. 6. CW Alarm → EB → Lambda (C) = automated rollback.",
      commonMistakes: [
        "Trying to use ALB with Bedrock models — Bedrock is API-invoked, not load-balanced",
        "Implementing routing in application code when inference profiles handle it transparently",
        "Choosing manual monitoring when the question explicitly requires automated rollback"
      ],
      timeManagementTip: "'Automatically' eliminates manual (E). 'Single endpoint' eliminates app-level routing (D). 'Bedrock' eliminates ALB (B). Quick to two answers."
    }
  },

  // ─── op-36 ── Domain 2 — KB sync (UPGRADED) ──────────────────────
  {
    id: "op-36",
    domain: 2,
    task: "2.3",
    skills: ["2.3.3"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A company has an Amazon Bedrock Knowledge Base backed by documents in Amazon S3. The content team updates approximately 500 documents daily out of a total corpus of 100,000 documents. Users report that the RAG application returns outdated information for up to 24 hours after document updates. The team wants near-real-time freshness (updates reflected within 15 minutes) with resilient processing that doesn't lose document updates if a component fails temporarily. The solution must handle the daily update volume without manual intervention and must be cost-effective by processing only changed documents, not the entire 100,000-document corpus.",
    question: "Which architecture ensures near-real-time knowledge base freshness with resilient processing?",
    options: [
      { id: "a", text: "Schedule a full data source sync (StartIngestionJob) every 15 minutes using an Amazon EventBridge rule. The sync processes the entire S3 data source to ensure all changes are captured." },
      { id: "b", text: "Configure S3 Event Notifications to send object-change events to an Amazon SQS queue. An AWS Lambda function consumes messages from the queue and calls the Bedrock IngestKnowledgeBaseDocuments API for each changed document." },
      { id: "c", text: "Deploy an AWS Lambda function triggered directly by S3 Event Notifications that calls the StartIngestionJob API for each document change." },
      { id: "d", text: "Delete and recreate the entire Knowledge Base data source connection every 15 minutes to force a full re-ingestion of all documents." }
    ],
    correctAnswers: ["b"],
    explanation: "S3 Event Notifications → SQS → Lambda → IngestKnowledgeBaseDocuments provides event-driven, per-document ingestion. SQS adds resilience by buffering events if Lambda is throttled or temporarily fails (messages are retried from the queue). IngestKnowledgeBaseDocuments processes only the specified documents, not the entire corpus, making it cost-effective for 500 daily updates out of 100,000. The 15-minute freshness target is easily met since processing is triggered within seconds of each S3 update.",
    incorrectExplanations: {
      a: "Full StartIngestionJob every 15 minutes processes all 100,000 documents each time, even though only ~500 change daily. This is extremely wasteful — processing 100,000 documents 96 times per day when only 500 changed. It also may not complete within 15 minutes for a corpus this size.",
      c: "Lambda triggered directly by S3 events without SQS has no buffering. If Lambda is throttled, hits concurrency limits, or the Bedrock API is temporarily unavailable, document events are lost with no retry mechanism. This fails the resilience requirement.",
      d: "Deleting and recreating the data source connection is destructive, processes all 100,000 documents each time, and causes downtime during re-ingestion. This is the most wasteful and disruptive approach."
    },
    parseStrategy: {
      keyPhrase: "near-real-time … resilient … only changed documents … 500 out of 100,000",
      eliminationHints: [
        "Full sync every 15 min = processes 100K docs when only 500 changed",
        "Direct Lambda from S3 = no buffering, events lost on failure",
        "Delete/recreate = destructive, processes everything",
        "S3 → SQS → Lambda → IngestKnowledgeBaseDocuments = event-driven, resilient, per-document"
      ],
      decisionFramework: "Event-driven incremental sync pattern: S3 Events → SQS (buffering for resilience) → Lambda → IngestKnowledgeBaseDocuments (per-document API). SQS is the key for resilience."
    },
    services: ["Amazon Bedrock Knowledge Bases", "Amazon S3", "Amazon SQS", "AWS Lambda"],
    examTip: "The S3 → SQS → Lambda pattern is an AWS best practice for resilient event processing. SQS provides the buffering and retry mechanism that direct S3-to-Lambda lacks.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you keep a large KB fresh with near-real-time incremental updates that are resilient to transient failures?",
      testedConcepts: ["Event-driven knowledge base sync", "IngestKnowledgeBaseDocuments vs StartIngestionJob", "SQS buffering for resilience", "Incremental vs full corpus processing"],
      servicesInPlay: [
        { service: "Amazon S3 Event Notifications", role: "Triggers on document changes", isCorrectAnswer: true },
        { service: "Amazon SQS", role: "Buffers events for resilient processing with automatic retries", isCorrectAnswer: true },
        { service: "AWS Lambda", role: "Processes queue messages and calls Bedrock API", isCorrectAnswer: true },
        { service: "Amazon Bedrock (IngestKnowledgeBaseDocuments)", role: "Per-document incremental ingestion API", isCorrectAnswer: true }
      ],
      approachStrategy: "1. 'Only changed documents' eliminates full-corpus approaches (A, D). 2. 'Resilient' eliminates direct Lambda-from-S3 (C) — no retry buffer. 3. S3 → SQS → Lambda → IngestKnowledgeBaseDocuments = event-driven + buffered + per-document.",
      commonMistakes: [
        "Using StartIngestionJob for incremental updates — it processes the entire data source, not individual documents",
        "Skipping the SQS queue and connecting S3 directly to Lambda — no resilience against failures",
        "Not knowing about IngestKnowledgeBaseDocuments API (per-document) vs StartIngestionJob (full corpus)"
      ],
      timeManagementTip: "'Only changed documents' eliminates full-sync options (A, D). 'Resilient' = needs SQS buffering, eliminates direct Lambda (C). One answer left."
    }
  },

  // ─── op-37 ── Domain 3 — Hallucination (KEPT, minor upgrade) ──────
  {
    id: "op-37",
    domain: 3,
    task: "3.1",
    skills: ["3.1.3"],
    type: "multiple-response",
    difficulty: "hard",
    scenario: "A pharmaceutical company's GenAI application generates drug interaction summaries for pharmacists. The application uses RAG to retrieve interaction data from a verified FDA drug database. Despite retrieving correct source documents, the model sometimes generates plausible-sounding but factually incorrect interaction warnings — either fabricating interactions not in the source data or mischaracterizing the severity of documented interactions. This is a critical patient safety concern. The application must also log which source documents were used for each generated summary to support clinical audits.",
    question: "Which combination of techniques will MOST effectively reduce hallucinations while supporting clinical audits? (Select TWO.)",
    options: [
      { id: "a", text: "Increase the temperature parameter to 0.9 to encourage more diverse and comprehensive interaction coverage." },
      { id: "b", text: "Configure Amazon Bedrock Guardrails with contextual grounding checks to detect and block response claims that are not supported by the retrieved source documents." },
      { id: "c", text: "Enable Amazon Bedrock model invocation logging to capture the retrieved source documents alongside each generated summary, providing the source-to-output traceability required for clinical audits." },
      { id: "d", text: "Switch to a larger foundation model with more parameters for improved factual recall of drug interactions from its training data." },
      { id: "e", text: "Add instructions to the system prompt stating 'Only cite interactions that appear in the provided documents. Do not fabricate drug interactions.'" }
    ],
    correctAnswers: ["b", "c"],
    explanation: "Contextual grounding checks verify that each claim in the model's response is supported by the retrieved reference documents, catching fabricated or mischaracterized interactions before they reach the pharmacist. Model invocation logging with the retrieved source documents provides the source-to-output audit trail required for clinical investigations. Together, these address both hallucination reduction and audit requirements.",
    incorrectExplanations: {
      a: "Higher temperature increases randomness in generation, which increases the likelihood of hallucinations. For safety-critical factual content, lower temperature is preferred. This would make the problem worse.",
      d: "A larger model may have better general factual recall but cannot be relied upon for specific, up-to-date drug interaction data. The correct source is the FDA database (via RAG), not the model's parametric memory. Relying on model training data for drug interactions is dangerous.",
      e: "Prompt instructions cannot reliably prevent hallucinations — models generate plausible text that they cannot verify against the source material. The model doesn't 'know' when it's hallucinating. For patient safety, enforcement must be structural (guardrails), not instructional (prompts)."
    },
    parseStrategy: {
      keyPhrase: "fabricated interactions … not in source data … clinical audit traceability",
      eliminationHints: [
        "Higher temperature = MORE hallucinations",
        "Larger model = training data unreliable for current drug data",
        "'Don't hallucinate' prompt = ineffective, models can't self-detect",
        "Grounding checks = verifies claims against source documents",
        "Invocation logging = source-to-output audit trail"
      ],
      decisionFramework: "Two requirements: (1) prevent hallucinations = grounding checks, (2) clinical audit trail = invocation logging. RAG provides data, grounding checks verify faithfulness, logging proves traceability."
    },
    services: ["Amazon Bedrock Knowledge Bases", "Amazon Bedrock Guardrails"],
    examTip: "RAG + Guardrails grounding checks = complementary anti-hallucination layers. RAG provides the data, grounding checks verify the model stays faithful to it.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you prevent hallucinations in a safety-critical RAG application AND provide audit traceability of source documents?",
      testedConcepts: ["Contextual grounding checks", "Model invocation logging", "Hallucination reduction", "Clinical audit requirements", "RAG faithfulness"],
      servicesInPlay: [
        { service: "Amazon Bedrock Guardrails (Grounding Checks)", role: "Verifies response claims against retrieved source documents", isCorrectAnswer: true },
        { service: "Amazon Bedrock Invocation Logging", role: "Captures source documents alongside generated output for audit trail", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Two requirements: reduce hallucinations + audit trail. 2. Higher temperature = worse — eliminate A. 3. Larger model's training data ≠ FDA database — eliminate D. 4. Prompt instructions = unreliable — eliminate E. 5. Grounding checks (B) = hallucination prevention. 6. Invocation logging (C) = audit trail.",
      commonMistakes: [
        "Increasing temperature for safety-critical content — it increases hallucinations",
        "Relying on model training data for drug interactions instead of the verified FDA database",
        "Thinking prompt instructions can prevent hallucinations — structural enforcement is required"
      ],
      timeManagementTip: "Two requirements: prevent + audit. Grounding checks = prevention. Invocation logging = audit. Quick pair."
    }
  },

  // ─── op-38 ── Domain 4 — VPC (UPGRADED to Select TWO) ────────────
  {
    id: "op-38",
    domain: 4,
    task: "4.1",
    skills: ["4.1.2"],
    type: "multiple-response",
    difficulty: "hard",
    scenario: "A defense contractor's application runs on EC2 instances in private subnets within a VPC. The security policy requires that: (1) All API calls to Amazon Bedrock must not traverse the public internet — traffic must remain entirely within the AWS network. (2) Bedrock API calls must be restricted to originate only from the company's specific VPC — no other VPC or network should be able to use the company's Bedrock access. (3) All network traffic to Bedrock must be encrypted in transit. The current architecture has no internet gateway, no NAT gateway, and no VPN connections.",
    question: "Which combination of configurations meets all three security requirements? (Select TWO.)",
    options: [
      { id: "a", text: "Create a VPC interface endpoint (AWS PrivateLink) for Amazon Bedrock in the VPC to establish a private connection that keeps all API traffic within the AWS network." },
      { id: "b", text: "Add a NAT gateway to route Bedrock API calls through an internet gateway with TLS encryption to secure the traffic in transit." },
      { id: "c", text: "Attach a VPC endpoint policy to the Bedrock interface endpoint that restricts access to requests originating from the company's specific VPC, denying calls from any other source." },
      { id: "d", text: "Configure a VPN connection between the VPC and the Bedrock service endpoint to create an encrypted tunnel for API traffic." },
      { id: "e", text: "Create a security group for the VPC endpoint that allows only HTTPS (port 443) inbound traffic from the private subnets' CIDR ranges." }
    ],
    correctAnswers: ["a", "c"],
    explanation: "A VPC interface endpoint (PrivateLink) creates a private connection from the VPC to Bedrock that never traverses the public internet (requirement #1), and all PrivateLink traffic is encrypted in transit by default (requirement #3). A VPC endpoint policy restricts which VPC or principals can use the endpoint to call Bedrock, ensuring only the company's VPC has access (requirement #2). Together, these satisfy all three requirements.",
    incorrectExplanations: {
      b: "A NAT gateway routes traffic through an internet gateway, meaning API calls traverse the public internet — directly violating requirement #1. TLS encryption addresses transit security but doesn't solve the private routing requirement.",
      d: "VPN connections are designed for connecting on-premises networks or remote networks to a VPC, not for connecting a VPC to an AWS service. PrivateLink is the correct mechanism for private VPC-to-service connectivity. Additionally, the scenario states no VPN connections exist.",
      e: "Security groups on VPC endpoints control network-level access (IP ranges, ports) but don't restrict which VPC or principal can use the endpoint to call the service. A VPC endpoint policy provides the identity-based and VPC-based access control required by requirement #2."
    },
    parseStrategy: {
      keyPhrase: "not traverse public internet … restricted to specific VPC … encrypted in transit",
      eliminationHints: [
        "NAT gateway = routes through public internet (violates #1)",
        "VPN = wrong mechanism for VPC-to-service connectivity",
        "Security group = network-level, can't restrict by VPC identity",
        "PrivateLink = private connection within AWS network",
        "VPC endpoint policy = restricts which VPC/principal can use the endpoint"
      ],
      decisionFramework: "Private service access = PrivateLink (interface endpoint). Access restriction = VPC endpoint policy. These are complementary — one provides the path, the other controls who can use it."
    },
    services: ["Amazon Bedrock", "AWS PrivateLink", "Amazon VPC"],
    examTip: "PrivateLink = private path. VPC endpoint policy = access control on that path. Security groups control network-level access but not identity/VPC-level access.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you ensure Bedrock traffic stays private AND is restricted to a specific VPC, with encryption in transit?",
      testedConcepts: ["VPC interface endpoints", "VPC endpoint policies", "PrivateLink encryption", "Security group vs endpoint policy scope"],
      servicesInPlay: [
        { service: "AWS PrivateLink (VPC Interface Endpoint)", role: "Private connection — no internet, encrypted in transit by default", isCorrectAnswer: true },
        { service: "VPC Endpoint Policy", role: "Restricts which VPC/principal can use the endpoint to call Bedrock", isCorrectAnswer: true },
        { service: "NAT Gateway", role: "Routes through public internet — violates private routing", isCorrectAnswer: false },
        { service: "Security Groups", role: "Network-level ACL — can't restrict by VPC identity", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Three requirements: private path, VPC restriction, encryption. 2. NAT = public internet — eliminate B. 3. VPN = wrong use case — eliminate D. 4. Security group = network-level, not VPC identity — eliminate E. 5. PrivateLink (A) = private + encrypted. 6. Endpoint policy (C) = VPC restriction.",
      commonMistakes: [
        "Thinking NAT Gateway keeps traffic private — it explicitly routes through the internet",
        "Confusing security groups (IP/port) with VPC endpoint policies (identity/VPC)",
        "Choosing VPN for VPC-to-service connectivity — VPN is for remote/on-premises networks"
      ],
      timeManagementTip: "'Not traverse public internet' eliminates NAT (B). 'Restricted to specific VPC' eliminates security groups (E) — they're IP-based, not VPC-identity-based. Quick elimination."
    }
  },

  // ─── op-39 ── Domain 5 — Drift (UPGRADED) ────────────────────────
  {
    id: "op-39",
    domain: 5,
    task: "5.2",
    skills: ["5.2.2"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A company deployed a GenAI customer service application six months ago. Initially, the application maintained a 4.5/5.0 user satisfaction score. Over the past two months, the score has gradually declined to 3.8/5.0 even though no changes were made to the application code, prompts, or model version. The operations team has verified that: (1) API error rates and latency metrics in CloudWatch are unchanged. (2) The model version and configuration are identical to the original deployment. (3) The company recently expanded into three new product categories. Analysis of recent support tickets shows that most dissatisfied users are asking about the new product categories.",
    question: "What is the MOST likely cause of the performance degradation, and which monitoring approach will help the team address it?",
    options: [
      { id: "a", text: "The foundation model provider has silently updated the model weights. Implement model version pinning and re-evaluate the updated model's performance against the original baseline." },
      { id: "b", text: "The application's prompt template has become less effective over time due to prompt drift. Implement automated prompt regression testing to detect when prompt performance degrades." },
      { id: "c", text: "The real-world query distribution has shifted because of the new product categories, creating a gap between the model's training/tuning data and current customer inquiries. Implement continuous evaluation with updated test datasets that include the new product categories to detect and quantify this drift." },
      { id: "d", text: "The vector database embeddings have degraded over time due to index fragmentation. Schedule regular re-indexing of the knowledge base to refresh the vector representations." }
    ],
    correctAnswers: ["c"],
    explanation: "The scenario provides clear evidence of data distribution shift: the company expanded into three new product categories, and dissatisfied users are asking about those new categories. The model's training/tuning data and test datasets don't include these new categories, so its responses are less relevant. Continuous evaluation with updated test datasets that include the new product categories will quantify the gap and guide targeted improvements (updating knowledge bases, adding few-shot examples, or fine-tuning for new categories).",
    incorrectExplanations: {
      a: "The scenario explicitly states the model version is identical to the original deployment. Silent model updates would affect all queries equally, not specifically queries about new product categories. The pattern of dissatisfaction (concentrated on new categories) points to data distribution shift, not model changes.",
      b: "Prompt drift implies the prompts became less effective, but the scenario states no changes were made to prompts. Prompts don't degrade on their own — they're static text. The issue is that the real-world queries changed (new product categories), not that the prompts degraded.",
      d: "Vector database embeddings don't 'degrade' from index fragmentation over time. The embeddings are static mathematical representations. If the knowledge base hasn't been updated with new product category content, that's a data freshness issue, not an indexing issue. Re-indexing the same content produces the same embeddings."
    },
    parseStrategy: {
      keyPhrase: "no code/prompt/model changes … expanded into new product categories … dissatisfied users asking about new categories",
      eliminationHints: [
        "Silent model update = disproven (version confirmed identical)",
        "Prompt drift = prompts are static text, don't degrade",
        "Vector degradation = embeddings are static, don't fragment",
        "Data distribution shift = new categories not in training/test data"
      ],
      decisionFramework: "Gradual quality decline + no code changes + new use patterns = data distribution shift. The fix is updating evaluation datasets and knowledge bases to cover the new patterns."
    },
    services: ["Amazon Bedrock", "Amazon CloudWatch"],
    examTip: "Performance degradation diagnosis: (1) Check infrastructure (CloudWatch) — ruled out. (2) Check code/config changes — ruled out. (3) Check data distribution shift — new use patterns are the most common cause of gradual decline.",
    strategicBreakdown: {
      whatIsBeingAsked: "Why is a GenAI application's quality declining when nothing in the application has changed, and how do you monitor for this?",
      testedConcepts: ["Data distribution shift", "Concept drift detection", "Continuous evaluation", "Diagnostic reasoning for quality degradation"],
      servicesInPlay: [
        { service: "Amazon Bedrock Model Evaluation", role: "Continuous evaluation with updated test datasets to detect and quantify distribution shift", isCorrectAnswer: true },
        { service: "Amazon CloudWatch", role: "Infrastructure metrics — already confirmed unchanged (not the issue)", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Scenario provides diagnosis: new product categories + dissatisfied users asking about them. 2. Model version confirmed identical — eliminate A. 3. Prompts are static — eliminate B. 4. Embeddings don't degrade — eliminate D. 5. Distribution shift = query patterns changed, model/data didn't keep up.",
      commonMistakes: [
        "Blaming silent model updates when the version is confirmed identical",
        "Thinking prompts can 'drift' on their own — they're static text",
        "Attributing quality issues to vector index fragmentation — embeddings are deterministic",
        "Not reading the scenario clues: new categories + new-category dissatisfaction = distribution shift"
      ],
      timeManagementTip: "The scenario gives you the answer: 'new product categories' + 'dissatisfied users asking about new categories.' Read the clues."
    }
  },

  // ─── op-40 ── Domain 2 — Converse API (UPGRADED) ──────────────────
  {
    id: "op-40",
    domain: 2,
    task: "2.1",
    skills: ["2.1.1"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A development team is building a multi-model chat application on Amazon Bedrock that supports conversations across Claude, Amazon Nova, and Llama models. Users can switch models mid-conversation. Currently, the team maintains separate API integration code for each model's unique request format (message structure, parameter names, system prompt handling), which has led to bugs when one model's integration is updated but others aren't. The team wants to unify the integration code while meeting these requirements: (1) Support text conversations and tool use across all three model families. (2) Maintain conversation history consistently regardless of which model is active. (3) Allow model-specific inference parameters (like Claude's top_k) to be passed when needed. (4) Support streaming responses from all models.",
    question: "Which approach will simplify the integration while meeting all requirements?",
    options: [
      { id: "a", text: "Build a custom abstraction layer that maps a unified internal format to each model's native InvokeModel request format, handling parameter translation and response normalization for each model family." },
      { id: "b", text: "Use the Amazon Bedrock Converse API, which provides a unified request and response format for text, tool use, and streaming across all supported models. Pass model-specific parameters through the additionalModelRequestFields for features like Claude's top_k." },
      { id: "c", text: "Standardize on a single model family to eliminate the need for multiple integrations, and use prompt engineering to match the behavior of the other models." },
      { id: "d", text: "Use Amazon Bedrock Prompt Management to store model-specific prompt templates, and invoke each model through its native API format using the template that corresponds to the active model." }
    ],
    correctAnswers: ["b"],
    explanation: "The Converse API provides a model-agnostic interface with unified message format, tool use protocol, and streaming support across all Bedrock models. Conversation history is maintained in a consistent format regardless of which model is active. For model-specific parameters like Claude's top_k that aren't part of the unified schema, the additionalModelRequestFields parameter provides an escape hatch to pass them through. This meets all four requirements with a single API integration.",
    incorrectExplanations: {
      a: "A custom abstraction layer replicates what the Converse API already provides — and must be maintained by the team. Every time a model provider changes their API format, the abstraction layer needs updating. This is the current problem repackaged, not a solution.",
      c: "Standardizing on a single model eliminates the multi-model capability that the application requires. Users need to switch models mid-conversation. Prompt engineering cannot replicate model-specific capabilities (different models have different strengths for different query types).",
      d: "Prompt Management handles prompt versioning and storage, not API format unification. Each model would still need its own InvokeModel integration code with model-specific request formatting. Prompt Management solves a different problem (prompt lifecycle) than API unification."
    },
    parseStrategy: {
      keyPhrase: "multi-model … separate integration code … unify … tool use … model-specific parameters … streaming",
      eliminationHints: [
        "Custom abstraction = builds what Converse API provides, still needs maintenance",
        "Single model = eliminates multi-model requirement",
        "Prompt Management = prompt storage, not API unification",
        "Converse API = unified format + additionalModelRequestFields for model-specific params"
      ],
      decisionFramework: "Multi-model API unification = Converse API. Model-specific parameters = additionalModelRequestFields. Don't confuse Prompt Management (lifecycle) with Converse API (format unification)."
    },
    services: ["Amazon Bedrock", "Amazon Bedrock Converse API"],
    examTip: "The Converse API unifies model interactions. additionalModelRequestFields handles model-specific parameters. Prompt Management is for prompt lifecycle, not API format.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you eliminate separate integration code for each model while still supporting model-specific features?",
      testedConcepts: ["Converse API unification", "additionalModelRequestFields", "Multi-model integration", "Prompt Management vs API management"],
      servicesInPlay: [
        { service: "Amazon Bedrock Converse API", role: "Unified format for text, tools, streaming + additionalModelRequestFields for model-specific params", isCorrectAnswer: true },
        { service: "Amazon Bedrock Prompt Management", role: "Prompt lifecycle — doesn't address API format unification", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Need unified API + model-specific params + tool use + streaming. 2. Custom abstraction = maintains the same problem — eliminate A. 3. Single model = loses multi-model — eliminate C. 4. Prompt Management = wrong scope (prompts, not API format) — eliminate D. 5. Converse API = all four requirements via one API.",
      commonMistakes: [
        "Building custom abstraction layers when Converse API already exists",
        "Confusing Prompt Management (prompt storage/versioning) with Converse API (API format unification)",
        "Not knowing about additionalModelRequestFields for model-specific parameters",
        "Thinking standardizing on one model is equivalent to multi-model support"
      ],
      timeManagementTip: "Multi-model + unified API = Converse API. The 'additionalModelRequestFields' detail confirms it handles model-specific params too."
    }
  }
];

// ---------------------------------------------------------------------------
// Main — replace questions op-21 through op-40 in place
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

  const idsToReplace = new Set(upgradedQuestions.map(q => q.id));
  let replacedCount = 0;

  data.questions = data.questions.map(q => {
    if (idsToReplace.has(q.id)) {
      const replacement = upgradedQuestions.find(u => u.id === q.id);
      replacedCount++;
      return replacement;
    }
    return q;
  });

  try {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  } catch (err) {
    console.error(`Error writing ${FILE}: ${err.message}`);
    process.exit(1);
  }

  console.log(`Replaced ${replacedCount} questions: ${upgradedQuestions.map(q => q.id).join(', ')}`);
  console.log(`Total questions: ${data.questions.length}`);

  // Stats
  const multiResponse = upgradedQuestions.filter(q => q.type === 'multiple-response').length;
  const hard = upgradedQuestions.filter(q => q.difficulty === 'hard').length;
  const fiveOptions = upgradedQuestions.filter(q => q.options.length === 5).length;
  console.log(`\nUpgraded stats:`);
  console.log(`  Multiple-response (Select TWO): ${multiResponse}/20 (${Math.round(multiResponse/20*100)}%)`);
  console.log(`  Hard difficulty: ${hard}/20 (${Math.round(hard/20*100)}%)`);
  console.log(`  5 options: ${fiveOptions}/20 (${Math.round(fiveOptions/20*100)}%)`);
}

main();
