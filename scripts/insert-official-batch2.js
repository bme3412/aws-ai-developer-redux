#!/usr/bin/env node

/**
 * insert-official-batch2.js
 *
 * Inserts 20 additional official-style AWS practice exam questions (op-21 through op-40)
 * into official-practice.json. Each question includes full strategicBreakdown.
 *
 * Usage: node scripts/insert-official-batch2.js
 */

const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'src', 'data', 'questions', 'official-practice.json');

const newQuestions = [
  // ─── op-21 ── Domain 1 — FM selection: multimodal ───────────────────
  {
    id: "op-21",
    domain: 1,
    task: "1.1",
    skills: ["1.1.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A media company wants to build an application that accepts a product image and generates a detailed marketing description. The application must understand the visual content of the image, identify objects and branding elements, and produce persuasive copy. The team wants to minimize custom model training.",
    question: "Which approach meets these requirements with the LEAST development effort?",
    options: [
      { id: "a", text: "Use Amazon Rekognition to extract labels from the image, then pass the labels to a text-only FM on Amazon Bedrock to generate the description." },
      { id: "b", text: "Fine-tune a text-only FM on Amazon Bedrock with image-caption pairs so the model learns to generate descriptions from images." },
      { id: "c", text: "Invoke a multimodal FM on Amazon Bedrock, passing both the image and a text prompt requesting a marketing description." },
      { id: "d", text: "Train a custom computer vision model on Amazon SageMaker to generate captions, then post-process captions into marketing copy." }
    ],
    correctAnswers: ["c"],
    explanation: "Multimodal FMs on Amazon Bedrock (such as Claude or Nova) natively accept images alongside text prompts. The model understands the visual content and generates text in a single API call, requiring no additional services, pipelines, or training — the least development effort.",
    incorrectExplanations: {
      a: "Chaining Rekognition with a text FM adds an extra service, integration code, and loses visual nuance that labels cannot capture. More development effort than a single multimodal call.",
      b: "Fine-tuning a text-only FM with image-caption pairs is not how text-only models work — they cannot process image inputs even after fine-tuning. This approach is technically invalid.",
      d: "Training a custom CV model on SageMaker requires labeled training data, model development, and hosting — far more effort than using a managed multimodal FM."
    },
    parseStrategy: {
      keyPhrase: "LEAST development effort",
      eliminationHints: [
        "Chaining services = more integration work",
        "Fine-tuning text-only FM with images = technically invalid",
        "Custom SageMaker model = maximum effort",
        "Single multimodal FM call = minimal effort"
      ],
      decisionFramework: "When the task requires understanding both image and text, a multimodal FM handles it in one call. Chaining vision + text services is more effort."
    },
    services: ["Amazon Bedrock", "Amazon Rekognition", "Amazon SageMaker"],
    examTip: "Multimodal FMs eliminate the need to chain separate vision and text services. If the question involves image+text, look for multimodal first.",
    strategicBreakdown: {
      whatIsBeingAsked: "What is the simplest way to go from a product image to a marketing description using AWS AI services?",
      testedConcepts: ["Multimodal foundation models", "Image-to-text generation", "Amazon Bedrock model capabilities", "Build vs managed trade-offs"],
      servicesInPlay: [
        { service: "Amazon Bedrock (Multimodal FM)", role: "Accepts image + text prompt, generates description in one call", isCorrectAnswer: true },
        { service: "Amazon Rekognition", role: "Image label extraction — adds extra step and loses nuance", isCorrectAnswer: false },
        { service: "Amazon SageMaker", role: "Custom model training — maximum overhead", isCorrectAnswer: false }
      ],
      approachStrategy: "1. 'LEAST development effort' means fewest services, fewest integration steps. 2. Custom SageMaker = most effort — eliminate D. 3. Fine-tuning text-only FM with images is invalid — eliminate B. 4. Rekognition + text FM = two services, label extraction loses context — eliminate A. 5. Multimodal FM = single API call with image + prompt.",
      commonMistakes: [
        "Thinking Rekognition + text FM is simpler because both are managed — it still requires two integrations",
        "Not knowing that text-only FMs cannot be fine-tuned to accept image inputs",
        "Confusing multimodal FM capabilities with multi-service architectures"
      ],
      timeManagementTip: "Image + text input = multimodal FM. Immediate answer, no elimination needed. Under 30 seconds."
    }
  },

  // ─── op-22 ── Domain 1 — FM selection: latency vs quality ──────────
  {
    id: "op-22",
    domain: 1,
    task: "1.2",
    skills: ["1.2.1"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A startup is building a real-time customer support chatbot that handles high volumes of simple, repetitive queries such as order status checks and return policies. Average response time must be under 500 milliseconds. The company has a limited budget and does not need complex reasoning capabilities for these queries.",
    question: "Which model selection strategy is MOST appropriate?",
    options: [
      { id: "a", text: "Use the largest available FM on Amazon Bedrock to ensure the highest quality responses for all queries." },
      { id: "b", text: "Select a smaller, faster FM on Amazon Bedrock optimized for low latency and lower per-token cost." },
      { id: "c", text: "Deploy a custom-trained model on Amazon SageMaker with GPU-optimized instances for faster inference." },
      { id: "d", text: "Use Amazon Bedrock Provisioned Throughput with the largest FM to guarantee sub-500ms response times." }
    ],
    correctAnswers: ["b"],
    explanation: "For simple, repetitive queries that don't require complex reasoning, a smaller FM (such as Claude Haiku or Amazon Nova Micro) provides faster inference at lower cost. These models are optimized for low latency and can easily meet the 500ms target on simple queries without overspending on unnecessary capability.",
    incorrectExplanations: {
      a: "The largest FM adds unnecessary cost and latency for simple queries. Larger models have higher per-token costs and slower inference, which is wasteful when complex reasoning isn't needed.",
      c: "Custom SageMaker deployment adds operational overhead and doesn't provide faster inference than purpose-built small FMs on Bedrock for this use case.",
      d: "Provisioned Throughput guarantees consistent throughput but doesn't change the model's inference speed. Using the largest FM still adds unnecessary cost for simple queries."
    },
    parseStrategy: {
      keyPhrase: "simple, repetitive queries … limited budget … under 500 milliseconds",
      eliminationHints: [
        "Largest FM = expensive + slower for no benefit",
        "Custom SageMaker = operational overhead",
        "Provisioned Throughput = doesn't speed up the model itself",
        "Smaller FM = faster + cheaper for simple tasks"
      ],
      decisionFramework: "Match model capability to task complexity. Simple tasks + latency constraints + budget = smallest adequate model."
    },
    services: ["Amazon Bedrock"],
    examTip: "The exam frequently tests whether you can right-size model selection. Bigger is not always better — match the model to the task complexity.",
    strategicBreakdown: {
      whatIsBeingAsked: "Which FM size is appropriate when queries are simple, latency must be low, and budget is tight?",
      testedConcepts: ["Model right-sizing", "Latency vs model size trade-offs", "Cost optimization", "Inference performance characteristics"],
      servicesInPlay: [
        { service: "Amazon Bedrock (Small FM)", role: "Low-latency, low-cost inference for simple queries", isCorrectAnswer: true },
        { service: "Amazon Bedrock (Large FM)", role: "Overkill for simple queries — slower and more expensive", isCorrectAnswer: false },
        { service: "Amazon SageMaker", role: "Custom deployment adds unnecessary operational overhead", isCorrectAnswer: false },
        { service: "Amazon Bedrock Provisioned Throughput", role: "Throughput guarantee doesn't change per-request latency of large models", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Identify the task complexity — simple, repetitive. 2. Identify constraints — 500ms latency, limited budget. 3. Large FM = slow + expensive for simple tasks — eliminate A. 4. Provisioned Throughput won't make a large FM faster per-request — eliminate D. 5. Custom SageMaker = overhead — eliminate C. 6. Small FM = fast + cheap = correct fit.",
      commonMistakes: [
        "Assuming bigger models are always better — they add latency and cost for simple tasks",
        "Thinking Provisioned Throughput reduces per-request latency — it guarantees throughput capacity, not speed",
        "Overlooking that model right-sizing is a primary cost optimization strategy"
      ],
      timeManagementTip: "Simple task + low latency + low budget = small model. No need to overthink — 30 seconds."
    }
  },

  // ─── op-23 ── Domain 2 — RAG: chunking strategies ─────────────────
  {
    id: "op-23",
    domain: 2,
    task: "2.3",
    skills: ["2.3.2"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A legal firm is building a RAG application that searches through contracts and legal documents. The documents contain complex clauses where a single legal provision may span multiple paragraphs and reference other sections. Using fixed-size chunking, the application frequently returns partial clauses that lack essential context, leading to incorrect answers.",
    question: "Which chunking strategy will MOST improve the quality of retrieved context?",
    options: [
      { id: "a", text: "Decrease the fixed chunk size to retrieve more granular text segments." },
      { id: "b", text: "Increase the fixed chunk size to 4,000 tokens to capture more surrounding text." },
      { id: "c", text: "Implement hierarchical chunking that preserves document structure, keeping related sections and subsections together." },
      { id: "d", text: "Add a metadata filter to exclude short chunks from retrieval results." }
    ],
    correctAnswers: ["c"],
    explanation: "Hierarchical chunking preserves the logical structure of documents by keeping parent-child relationships between sections, subsections, and clauses intact. For legal documents where provisions reference other sections, this approach ensures that semantically related content stays together, providing complete context for accurate answers.",
    incorrectExplanations: {
      a: "Smaller chunks would fragment legal clauses even further, worsening the problem of partial context.",
      b: "Larger fixed chunks may capture more context but will also include unrelated content from adjacent sections, reducing retrieval precision. It doesn't solve the structural problem.",
      d: "Filtering by chunk length doesn't address the core issue of clauses being split across boundaries. Short chunks may still be relevant."
    },
    parseStrategy: {
      keyPhrase: "complex clauses … span multiple paragraphs … reference other sections",
      eliminationHints: [
        "Smaller chunks = more fragmentation (worse)",
        "Larger fixed chunks = captures noise, doesn't preserve structure",
        "Metadata filter on length = irrelevant to the structural problem",
        "Hierarchical = preserves document structure"
      ],
      decisionFramework: "When document structure matters (legal, technical docs), use structure-aware chunking instead of fixed-size."
    },
    services: ["Amazon Bedrock Knowledge Bases"],
    examTip: "Fixed-size chunking breaks document structure. For structured documents (legal, technical, medical), hierarchical or semantic chunking preserves meaning.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you fix a RAG system that splits legal clauses across chunk boundaries, losing essential context?",
      testedConcepts: ["RAG chunking strategies", "Hierarchical chunking", "Document structure preservation", "Retrieval quality optimization"],
      servicesInPlay: [
        { service: "Amazon Bedrock Knowledge Bases (Hierarchical Chunking)", role: "Preserves parent-child document structure for complete context retrieval", isCorrectAnswer: true }
      ],
      approachStrategy: "1. The problem is structural — clauses split across boundaries. 2. Smaller chunks make it worse — eliminate A. 3. Larger fixed chunks add noise without solving structure — eliminate B. 4. Length filtering is irrelevant to structure — eliminate D. 5. Hierarchical chunking preserves document sections and references.",
      commonMistakes: [
        "Thinking bigger chunks always solve context problems — they add noise",
        "Not recognizing that fixed-size chunking is fundamentally structure-unaware",
        "Confusing chunk size tuning with chunking strategy changes"
      ],
      timeManagementTip: "Document structure problem = structure-aware chunking. The word 'hierarchical' maps directly to the problem description."
    }
  },

  // ─── op-24 ── Domain 2 — Agents: session management ───────────────
  {
    id: "op-24",
    domain: 2,
    task: "2.2",
    skills: ["2.2.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A travel agency is building an Amazon Bedrock Agent that helps customers plan multi-day trips. During a conversation, the agent must remember the customer's destination, travel dates, and preferences mentioned earlier in the chat so it can make coherent follow-up recommendations. Currently, the agent treats each user message independently, losing context between turns.",
    question: "Which solution will enable the agent to maintain conversation context across multiple turns?",
    options: [
      { id: "a", text: "Store conversation history in an Amazon DynamoDB table and retrieve it with each new invocation using a Lambda function." },
      { id: "b", text: "Include the full conversation history in the system prompt for each new invocation." },
      { id: "c", text: "Use the session management capability of Amazon Bedrock Agents by passing a consistent sessionId across invocations." },
      { id: "d", text: "Fine-tune the foundation model with multi-turn conversation examples to improve its memory." }
    ],
    correctAnswers: ["c"],
    explanation: "Amazon Bedrock Agents natively support multi-turn conversations through session management. By passing the same sessionId with each InvokeAgent call, the agent automatically maintains conversation history and context across turns without any additional infrastructure.",
    incorrectExplanations: {
      a: "While DynamoDB could store conversation history, this adds unnecessary infrastructure and code when Bedrock Agents already provide built-in session management.",
      b: "Including full conversation history in the system prompt wastes tokens, increases cost, and may exceed context length limits for long conversations. It's not a scalable approach.",
      d: "Fine-tuning doesn't give the model memory of a specific user's conversation. It changes the model's general behavior, not its ability to recall session-specific information."
    },
    parseStrategy: {
      keyPhrase: "maintain conversation context across multiple turns",
      eliminationHints: [
        "DynamoDB = unnecessary custom infrastructure",
        "System prompt stuffing = token waste, doesn't scale",
        "Fine-tuning = changes model behavior, not session memory",
        "sessionId = built-in Bedrock Agent capability"
      ],
      decisionFramework: "Multi-turn conversation context = Bedrock Agent sessionId. Always prefer built-in features over custom solutions."
    },
    services: ["Amazon Bedrock Agents", "Amazon DynamoDB"],
    examTip: "Bedrock Agents manage session state automatically via sessionId. Don't build custom conversation history infrastructure when the managed feature exists.",
    strategicBreakdown: {
      whatIsBeingAsked: "How does a Bedrock Agent remember what the user said in previous turns of the same conversation?",
      testedConcepts: ["Bedrock Agent session management", "Multi-turn conversation handling", "sessionId parameter", "Managed vs custom state management"],
      servicesInPlay: [
        { service: "Amazon Bedrock Agents (sessionId)", role: "Built-in session state management across conversation turns", isCorrectAnswer: true },
        { service: "Amazon DynamoDB", role: "Custom state store — unnecessary when built-in feature exists", isCorrectAnswer: false }
      ],
      approachStrategy: "1. The question is about maintaining context across turns in a Bedrock Agent. 2. Check if there's a built-in feature first — yes, sessionId. 3. DynamoDB is custom infrastructure — unnecessary — eliminate A. 4. System prompt stuffing = wasteful and fragile — eliminate B. 5. Fine-tuning doesn't add session memory — eliminate D. 6. sessionId is the native solution.",
      commonMistakes: [
        "Building custom DynamoDB-based session stores when Bedrock Agents handle it natively",
        "Confusing fine-tuning (model behavior) with session memory (conversation state)",
        "Thinking system prompt is the right place for conversation history"
      ],
      timeManagementTip: "Multi-turn + Bedrock Agent = sessionId. Built-in feature, instant answer."
    }
  },

  // ─── op-25 ── Domain 2 — Prompt engineering: few-shot ──────────────
  {
    id: "op-25",
    domain: 2,
    task: "2.1",
    skills: ["2.1.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A developer is building a sentiment analysis feature using Amazon Bedrock. The FM correctly classifies obvious positive and negative reviews but struggles with sarcastic or ambiguous reviews, often misclassifying them. The developer wants to improve accuracy without fine-tuning the model.",
    question: "Which prompt engineering technique will MOST effectively improve classification of ambiguous reviews?",
    options: [
      { id: "a", text: "Add a system prompt instructing the model to 'be more careful with sarcastic reviews.'" },
      { id: "b", text: "Use few-shot prompting by including examples of sarcastic and ambiguous reviews with their correct sentiment labels in the prompt." },
      { id: "c", text: "Increase the temperature parameter to generate more diverse classification outputs." },
      { id: "d", text: "Reduce the maximum token limit to force the model to respond more concisely." }
    ],
    correctAnswers: ["b"],
    explanation: "Few-shot prompting provides the model with concrete examples of the edge cases it struggles with. By including sarcastic and ambiguous reviews with their correct labels, the model learns the expected classification pattern in-context without requiring fine-tuning.",
    incorrectExplanations: {
      a: "Vague instructions like 'be more careful' don't teach the model what sarcasm looks like or how to classify it. Without examples, the model has no reference for the expected behavior.",
      c: "Higher temperature increases randomness in outputs, which would make classification less consistent, not more accurate. For classification tasks, lower temperature is preferred.",
      d: "Reducing max tokens limits output length but has no effect on classification accuracy. The model's classification decision happens before token generation limits apply."
    },
    parseStrategy: {
      keyPhrase: "struggles with sarcastic or ambiguous … without fine-tuning",
      eliminationHints: [
        "Vague system prompt = no concrete guidance",
        "Higher temperature = more randomness = worse for classification",
        "Token limit = output length, not accuracy",
        "Few-shot examples = teaches by demonstration"
      ],
      decisionFramework: "When the model fails on edge cases and you can't fine-tune, provide examples of those edge cases via few-shot prompting."
    },
    services: ["Amazon Bedrock"],
    examTip: "Few-shot prompting is the go-to technique for improving model performance on specific edge cases without fine-tuning. Provide examples of what the model gets wrong.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you improve FM accuracy on tricky edge cases using only prompt engineering (no fine-tuning)?",
      testedConcepts: ["Few-shot prompting", "Prompt engineering techniques", "In-context learning", "Temperature parameter effects", "Classification optimization"],
      servicesInPlay: [
        { service: "Amazon Bedrock", role: "FM inference with prompt engineering", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Problem = model fails on edge cases. 2. Constraint = no fine-tuning. 3. Vague instructions don't help — eliminate A. 4. Temperature increases randomness — worse for classification — eliminate C. 5. Token limits don't affect accuracy — eliminate D. 6. Few-shot examples directly address the gap by showing the model what correct classification looks like.",
      commonMistakes: [
        "Thinking vague instructions like 'be more careful' are effective prompt engineering",
        "Increasing temperature for classification tasks (should decrease it)",
        "Confusing output length limits with classification accuracy"
      ],
      timeManagementTip: "Edge case failures + no fine-tuning = few-shot prompting. Classic prompt engineering question."
    }
  },

  // ─── op-26 ── Domain 3 — Guardrails: PII handling ─────────────────
  {
    id: "op-26",
    domain: 3,
    task: "3.1",
    skills: ["3.1.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A healthcare company's GenAI application processes patient inquiries. Regulations require that personally identifiable information (PII) such as Social Security numbers, phone numbers, and email addresses must never appear in model responses. The team needs an automated solution that blocks PII in outputs without requiring application code changes for each new PII type.",
    question: "Which solution BEST meets the compliance requirement?",
    options: [
      { id: "a", text: "Add instructions to the system prompt telling the model to never include PII in responses." },
      { id: "b", text: "Implement a Lambda post-processing function that uses regex patterns to redact PII from model responses." },
      { id: "c", text: "Configure Amazon Bedrock Guardrails with sensitive information filters to automatically detect and block PII in model outputs." },
      { id: "d", text: "Fine-tune the model on a dataset that has all PII removed so it never learns to generate PII." }
    ],
    correctAnswers: ["c"],
    explanation: "Amazon Bedrock Guardrails include sensitive information filters that automatically detect and block PII types (SSNs, phone numbers, emails, etc.) in both inputs and outputs. New PII types can be added through configuration without code changes, meeting the regulatory requirement for automated, maintainable PII protection.",
    incorrectExplanations: {
      a: "Prompt-based PII prevention is unreliable. Models can be manipulated to ignore instructions, and compliance requirements cannot depend on model compliance alone.",
      b: "Regex-based Lambda filtering requires maintaining pattern libraries, updating code for new PII types, and handling edge cases. It requires code changes for each new PII type, violating the requirement.",
      d: "Fine-tuning on PII-free data doesn't prevent the model from generating PII-like patterns in responses. The model can still produce text that resembles real PII."
    },
    parseStrategy: {
      keyPhrase: "automated … blocks PII … without application code changes",
      eliminationHints: [
        "System prompt = unreliable for compliance",
        "Lambda regex = requires code changes per PII type",
        "Fine-tuning = doesn't prevent PII-like output",
        "Guardrails PII filters = automated, configurable"
      ],
      decisionFramework: "PII compliance + no code changes + automated = Bedrock Guardrails sensitive information filters."
    },
    services: ["Amazon Bedrock Guardrails"],
    examTip: "For PII protection in Bedrock applications, Guardrails sensitive information filters are the managed solution. Don't rely on prompts or custom regex for compliance.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you automatically prevent PII from appearing in GenAI outputs in a way that's configurable without code changes?",
      testedConcepts: ["Bedrock Guardrails sensitive information filters", "PII detection and redaction", "Compliance automation", "Managed vs custom content filtering"],
      servicesInPlay: [
        { service: "Amazon Bedrock Guardrails", role: "Automated PII detection and blocking via configuration", isCorrectAnswer: true },
        { service: "AWS Lambda", role: "Custom regex filtering — requires code changes per PII type", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Compliance requirement = must be reliable and auditable. 2. System prompt = unreliable — eliminate A. 3. Fine-tuning = doesn't prevent PII patterns — eliminate D. 4. Lambda regex = requires code updates per PII type — violates 'no code changes' — eliminate B. 5. Guardrails PII filters = managed, configurable, no code changes.",
      commonMistakes: [
        "Trusting prompt instructions for compliance — models can be jailbroken",
        "Thinking fine-tuning on clean data prevents PII generation — it doesn't",
        "Building custom Lambda regex instead of using the managed Guardrails feature"
      ],
      timeManagementTip: "PII + compliance + no code changes = Guardrails. The 'without code changes' constraint eliminates Lambda immediately."
    }
  },

  // ─── op-27 ── Domain 3 — Responsible AI: bias detection ────────────
  {
    id: "op-27",
    domain: 3,
    task: "3.2",
    skills: ["3.2.1"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A financial institution uses a GenAI model to generate loan application summaries for underwriters. During testing, the team discovers that the model produces subtly different language when describing applicants from different demographic groups — using more positive language for some groups and more cautious language for others, even when financial profiles are identical.",
    question: "Which approach should the team take FIRST to address this bias?",
    options: [
      { id: "a", text: "Remove all demographic information from the input data before sending it to the model." },
      { id: "b", text: "Use Amazon SageMaker Clarify to run bias metrics on the model outputs across demographic groups and quantify the disparity." },
      { id: "c", text: "Switch to a different foundation model that is known to be unbiased." },
      { id: "d", text: "Add instructions to the system prompt requiring the model to treat all applicants equally regardless of demographics." }
    ],
    correctAnswers: ["b"],
    explanation: "Before implementing any fix, the team should first quantify the bias using SageMaker Clarify's bias detection metrics. This provides measurable baselines and identifies specific dimensions of bias, enabling targeted mitigation. Acting without measurement may not address the actual problem or could introduce new issues.",
    incorrectExplanations: {
      a: "Removing demographic data may help but should come after measurement. Also, models can infer demographics from proxy variables (ZIP codes, names), so removal alone may be insufficient.",
      c: "No foundation model is guaranteed to be unbiased. Switching models without measuring the specific bias doesn't ensure the problem is resolved and may introduce different biases.",
      d: "Prompt instructions alone are insufficient for systematic bias in model outputs. The model may still produce biased language despite instructions, and this isn't measurable or auditable."
    },
    parseStrategy: {
      keyPhrase: "FIRST to address this bias",
      eliminationHints: [
        "Remove demographics = mitigation step, not first step",
        "Switch models = no model is bias-free, doesn't measure",
        "Prompt instructions = unreliable for systematic bias",
        "Measure first = SageMaker Clarify bias metrics"
      ],
      decisionFramework: "Bias remediation starts with measurement. Quantify the problem before applying fixes. 'FIRST' = measure and establish baseline."
    },
    services: ["Amazon SageMaker Clarify"],
    examTip: "When asked what to do FIRST about bias, the answer is almost always 'measure it.' You can't fix what you haven't quantified.",
    strategicBreakdown: {
      whatIsBeingAsked: "What is the correct first step when you discover bias in a GenAI model's outputs?",
      testedConcepts: ["Bias detection and measurement", "SageMaker Clarify", "Responsible AI workflow", "Measurement before mitigation"],
      servicesInPlay: [
        { service: "Amazon SageMaker Clarify", role: "Quantifies bias across demographic groups with measurable metrics", isCorrectAnswer: true }
      ],
      approachStrategy: "1. The keyword is 'FIRST' — this is a sequencing question. 2. In responsible AI, you always measure before you mitigate. 3. Removing data, switching models, and adding prompts are all mitigation steps — not measurement. 4. SageMaker Clarify provides quantitative bias metrics — this is the measurement step.",
      commonMistakes: [
        "Jumping to mitigation (removing data, switching models) before measuring the bias",
        "Thinking any FM can be 'known to be unbiased' — all models have potential biases",
        "Relying on prompt instructions for systematic bias issues"
      ],
      timeManagementTip: "'FIRST' + bias = measure. SageMaker Clarify is the measurement tool. Quick pattern recognition."
    }
  },

  // ─── op-28 ── Domain 2 — Knowledge Bases: embedding model ─────────
  {
    id: "op-28",
    domain: 2,
    task: "2.3",
    skills: ["2.3.1"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A company is setting up an Amazon Bedrock Knowledge Base to enable RAG over their technical documentation. The documentation is written in English and contains highly specialized domain terminology. The team needs to choose an embedding model and wants the best semantic search accuracy for their domain-specific content.",
    question: "Which factor is MOST important when selecting an embedding model for this use case?",
    options: [
      { id: "a", text: "Choose the embedding model with the highest number of output dimensions for maximum precision." },
      { id: "b", text: "Select an embedding model that has been trained on data similar to the company's technical domain for better semantic understanding of specialized terminology." },
      { id: "c", text: "Use the least expensive embedding model to minimize per-document embedding costs." },
      { id: "d", text: "Choose an embedding model that supports the most languages to future-proof the solution." }
    ],
    correctAnswers: ["b"],
    explanation: "Embedding model performance depends heavily on how well its training data aligns with the target domain. An embedding model trained on data similar to the technical domain will better understand specialized terminology and produce more semantically accurate vector representations, leading to better retrieval quality.",
    incorrectExplanations: {
      a: "Higher dimensions don't automatically mean better accuracy. Dimension count affects storage and compute costs, and models with moderate dimensions can outperform higher-dimension models if better trained for the domain.",
      c: "Cost is a consideration but not the most important factor when the goal is semantic search accuracy. A cheaper model that doesn't understand the domain will produce poor results regardless of cost savings.",
      d: "The documentation is in English only. Multi-language support is irrelevant for this use case and may come at the cost of English-domain performance."
    },
    parseStrategy: {
      keyPhrase: "specialized domain terminology … best semantic search accuracy",
      eliminationHints: [
        "Max dimensions ≠ best accuracy",
        "Cheapest = prioritizes cost over accuracy",
        "Most languages = irrelevant for English-only docs",
        "Domain-aligned training = best semantic understanding"
      ],
      decisionFramework: "For domain-specific semantic search, the embedding model's training data alignment with your domain matters most."
    },
    services: ["Amazon Bedrock Knowledge Bases"],
    examTip: "Embedding model selection for RAG: domain alignment > dimensions > cost > language coverage. Training data relevance is the primary quality driver.",
    strategicBreakdown: {
      whatIsBeingAsked: "What's the most important criterion for choosing an embedding model when your content has specialized domain terminology?",
      testedConcepts: ["Embedding model selection", "Domain-specific semantic search", "Vector embedding quality factors", "RAG optimization"],
      servicesInPlay: [
        { service: "Amazon Bedrock Knowledge Bases", role: "RAG system using embedding models for semantic search", isCorrectAnswer: true }
      ],
      approachStrategy: "1. The question emphasizes 'specialized domain terminology' and 'best accuracy.' 2. Dimensions ≠ accuracy — eliminate A. 3. Cost optimization contradicts accuracy focus — eliminate C. 4. Multi-language is irrelevant for English-only — eliminate D. 5. Domain-aligned training data = better semantic understanding of specialized terms.",
      commonMistakes: [
        "Equating higher embedding dimensions with better accuracy — it's about training data quality",
        "Choosing the cheapest option when the question asks about accuracy",
        "Over-indexing on future-proofing (multi-language) when it's not relevant to the stated requirements"
      ],
      timeManagementTip: "Domain-specific + accuracy = domain-aligned model. Eliminate irrelevant factors (language, cost) quickly."
    }
  },

  // ─── op-29 ── Domain 4 — Security: model access control ───────────
  {
    id: "op-29",
    domain: 4,
    task: "4.1",
    skills: ["4.1.1"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A company has multiple development teams using Amazon Bedrock. The security team requires that only the ML platform team can invoke expensive large language models, while application teams should only access smaller, less expensive models. All teams are in the same AWS account.",
    question: "Which approach provides the MOST granular access control for this requirement?",
    options: [
      { id: "a", text: "Create separate AWS accounts for each team and enable only the approved models in each account's Bedrock console." },
      { id: "b", text: "Use IAM policies with condition keys to restrict which Bedrock model IDs each team's IAM roles can invoke." },
      { id: "c", text: "Implement a proxy Lambda function that checks the caller's team membership before forwarding requests to Bedrock." },
      { id: "d", text: "Use Amazon Bedrock model access management to enable only the approved models at the account level." }
    ],
    correctAnswers: ["b"],
    explanation: "IAM policies with condition keys allow fine-grained control over which Bedrock models specific IAM roles can invoke. By using the bedrock:ModelId condition key, you can restrict each team's role to only the approved model ARNs, providing granular per-team model access within the same account.",
    incorrectExplanations: {
      a: "Separate AWS accounts add significant organizational overhead and complexity. This is not the most granular approach — it's the most heavy-handed. Cross-account access management is more complex than IAM conditions.",
      c: "A proxy Lambda adds latency, complexity, and a custom authorization layer that must be maintained. IAM provides this control natively without additional infrastructure.",
      d: "Bedrock model access management operates at the account level, enabling or disabling models for the entire account. It cannot differentiate between teams within the same account."
    },
    parseStrategy: {
      keyPhrase: "MOST granular access control … same AWS account",
      eliminationHints: [
        "Separate accounts = heavy-handed, not granular within an account",
        "Proxy Lambda = custom infrastructure, unnecessary",
        "Account-level model access = cannot differentiate teams",
        "IAM condition keys = per-role, per-model control"
      ],
      decisionFramework: "Per-team model access control within the same account = IAM policies with model ID condition keys."
    },
    services: ["Amazon Bedrock", "AWS IAM"],
    examTip: "IAM condition keys for Bedrock (bedrock:ModelId) enable per-role model access control. Account-level model access is all-or-nothing.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you restrict which Bedrock models specific teams can use within the same AWS account?",
      testedConcepts: ["IAM policy condition keys", "Bedrock model access control", "Least privilege access", "Per-role resource restrictions"],
      servicesInPlay: [
        { service: "AWS IAM (Condition Keys)", role: "Restricts model invocation by role using bedrock:ModelId conditions", isCorrectAnswer: true },
        { service: "Amazon Bedrock Model Access", role: "Account-level control — cannot differentiate teams", isCorrectAnswer: false },
        { service: "AWS Lambda", role: "Custom proxy — unnecessary infrastructure", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Same account, multiple teams, different model permissions. 2. Account-level controls can't differentiate teams — eliminate D. 3. Separate accounts = overkill — eliminate A. 4. Lambda proxy = custom solution when native IAM exists — eliminate C. 5. IAM condition keys on model IDs per role = native, granular.",
      commonMistakes: [
        "Confusing Bedrock model access management (account-level) with IAM-based access control (role-level)",
        "Creating separate accounts when IAM policies solve the problem within one account",
        "Building custom proxy authorization when IAM provides native support"
      ],
      timeManagementTip: "Same account + per-team control = IAM condition keys. Account-level features can't differentiate teams."
    }
  },

  // ─── op-30 ── Domain 5 — Evaluation: human evaluation ─────────────
  {
    id: "op-30",
    domain: 5,
    task: "5.1",
    skills: ["5.1.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A company has built a GenAI application that generates creative marketing copy. Automated metrics like ROUGE and BLEU scores are consistently high, but marketing stakeholders report that the generated copy lacks brand voice and emotional appeal. The team needs a more meaningful evaluation approach.",
    question: "Which evaluation method will BEST address the stakeholder concerns?",
    options: [
      { id: "a", text: "Increase the size of the automated evaluation dataset to get more statistically significant ROUGE and BLEU scores." },
      { id: "b", text: "Use Amazon Bedrock Model Evaluation with a human evaluation workflow where marketing experts rate outputs on brand voice, creativity, and emotional appeal." },
      { id: "c", text: "Switch to a different automated metric such as BERTScore that better captures semantic similarity." },
      { id: "d", text: "Fine-tune the model on more marketing examples to improve the automated metric scores further." }
    ],
    correctAnswers: ["b"],
    explanation: "When automated metrics don't capture the qualities that matter to stakeholders (brand voice, creativity, emotional appeal), human evaluation is necessary. Amazon Bedrock Model Evaluation supports human evaluation workflows where domain experts can rate outputs on custom criteria that align with business requirements.",
    incorrectExplanations: {
      a: "More data won't help if the metrics themselves don't measure what stakeholders care about. ROUGE and BLEU measure textual overlap, not brand voice or emotional appeal.",
      c: "BERTScore captures semantic similarity better than ROUGE/BLEU but still doesn't measure subjective qualities like brand voice and emotional appeal. It's an improvement but not sufficient.",
      d: "Fine-tuning to improve automated metrics optimizes for the wrong objective. If the metrics don't capture stakeholder concerns, higher scores are meaningless."
    },
    parseStrategy: {
      keyPhrase: "lacks brand voice and emotional appeal … automated metrics are high",
      eliminationHints: [
        "More data for same metrics = same blind spots",
        "Different automated metric = still can't measure subjective qualities",
        "Fine-tuning for automated metrics = optimizing wrong objective",
        "Human evaluation = captures subjective, domain-specific quality"
      ],
      decisionFramework: "When automated metrics miss qualitative aspects, human evaluation fills the gap. Subjective quality requires human judgment."
    },
    services: ["Amazon Bedrock Model Evaluation"],
    examTip: "Automated metrics measure textual properties. Brand voice, creativity, and emotional appeal require human evaluation. Know when each is appropriate.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you evaluate GenAI outputs when automated metrics don't capture the qualities stakeholders actually care about?",
      testedConcepts: ["Human vs automated evaluation", "Evaluation metric limitations", "Amazon Bedrock Model Evaluation", "Subjective quality assessment"],
      servicesInPlay: [
        { service: "Amazon Bedrock Model Evaluation (Human)", role: "Domain experts rate outputs on custom qualitative criteria", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Automated metrics are high but stakeholders are unsatisfied — the metrics don't measure what matters. 2. More data for same metrics = same gap — eliminate A. 3. Different automated metric = still can't capture subjective qualities — eliminate C. 4. Fine-tuning for wrong metrics = wrong optimization — eliminate D. 5. Human evaluation with domain experts rating on brand voice, creativity, appeal.",
      commonMistakes: [
        "Assuming higher automated metric scores always mean better quality",
        "Trying to solve subjective evaluation problems with better automated metrics",
        "Optimizing the model for metrics that don't align with business requirements"
      ],
      timeManagementTip: "Automated metrics high + stakeholders unsatisfied = human evaluation. The gap is qualitative, not quantitative."
    }
  },

  // ─── op-31 ── Domain 2 — Bedrock: streaming responses ─────────────
  {
    id: "op-31",
    domain: 2,
    task: "2.1",
    skills: ["2.1.3"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A developer is building a conversational AI interface using Amazon Bedrock. Users complain about long wait times because the application waits for the entire response to be generated before displaying anything. The developer wants users to see text appear progressively as the model generates it.",
    question: "Which implementation change will provide progressive text display?",
    options: [
      { id: "a", text: "Increase the model's max token limit to generate longer responses faster." },
      { id: "b", text: "Use the InvokeModelWithResponseStream API to receive and display response chunks as they are generated." },
      { id: "c", text: "Enable caching on the Bedrock endpoint to reduce response generation time for repeated queries." },
      { id: "d", text: "Switch to a smaller, faster model to reduce overall generation time." }
    ],
    correctAnswers: ["b"],
    explanation: "InvokeModelWithResponseStream returns response tokens as a stream of chunks rather than waiting for the complete response. The application can display each chunk as it arrives, giving users immediate visual feedback and the perception of faster responses.",
    incorrectExplanations: {
      a: "Increasing max tokens allows longer responses but doesn't change how the response is delivered. The user still waits for the full response before seeing anything.",
      c: "Caching helps with repeated queries but doesn't solve the fundamental problem of waiting for complete response generation on new queries.",
      d: "A smaller model may generate faster overall, but without streaming, the user still waits for the complete response. The perceived wait time improvement is limited."
    },
    parseStrategy: {
      keyPhrase: "text appear progressively as the model generates it",
      eliminationHints: [
        "Max tokens = response length, not delivery method",
        "Caching = only helps repeated queries",
        "Smaller model = faster overall but still synchronous",
        "Response stream = progressive delivery"
      ],
      decisionFramework: "Progressive text display = streaming API. InvokeModelWithResponseStream is the Bedrock streaming endpoint."
    },
    services: ["Amazon Bedrock"],
    examTip: "InvokeModelWithResponseStream for progressive display. InvokeModel for complete response. Know which API to use for each UX pattern.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you make a Bedrock-powered chat show text word-by-word instead of all at once after a long wait?",
      testedConcepts: ["Bedrock streaming API", "InvokeModelWithResponseStream", "User experience optimization", "Synchronous vs streaming responses"],
      servicesInPlay: [
        { service: "Amazon Bedrock (InvokeModelWithResponseStream)", role: "Returns response tokens as a stream for progressive display", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Problem = users wait for full response. 2. Solution = send response incrementally. 3. Max tokens doesn't change delivery — eliminate A. 4. Caching is for repeated queries — eliminate C. 5. Smaller model is still synchronous — eliminate D. 6. Streaming API = progressive delivery.",
      commonMistakes: [
        "Confusing response generation speed with response delivery method",
        "Thinking a faster model solves the progressive display problem — it doesn't without streaming",
        "Not knowing the specific API name: InvokeModelWithResponseStream"
      ],
      timeManagementTip: "Progressive display = streaming. One API name to know. Under 20 seconds."
    }
  },

  // ─── op-32 ── Domain 4 — Security: data encryption ────────────────
  {
    id: "op-32",
    domain: 4,
    task: "4.2",
    skills: ["4.2.1"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A government agency is using Amazon Bedrock Knowledge Bases to store classified documents. Security policy mandates that all data stored in the vector database must be encrypted with customer-managed encryption keys that the agency controls. The agency must be able to rotate keys and audit key usage.",
    question: "Which solution meets the encryption requirements?",
    options: [
      { id: "a", text: "Use the default AWS-managed encryption provided by Amazon OpenSearch Serverless." },
      { id: "b", text: "Encrypt the documents before uploading them to S3 using application-level encryption, then let Bedrock process the encrypted files." },
      { id: "c", text: "Configure the Amazon OpenSearch Serverless collection with a customer-managed AWS KMS key for encryption at rest." },
      { id: "d", text: "Store the documents in an encrypted Amazon EBS volume attached to an EC2 instance running a custom vector database." }
    ],
    correctAnswers: ["c"],
    explanation: "Amazon OpenSearch Serverless (used as the vector store for Bedrock Knowledge Bases) supports customer-managed AWS KMS keys for encryption at rest. This gives the agency full control over the encryption key, including rotation schedules and usage auditing through AWS CloudTrail.",
    incorrectExplanations: {
      a: "AWS-managed encryption doesn't give the agency control over the key. They cannot manage rotation schedules or have independent audit trails for key usage.",
      b: "Application-level encryption before upload would prevent Bedrock from being able to read and process the documents. The vector embeddings would be meaningless if generated from encrypted text.",
      d: "A custom vector database on EC2/EBS introduces significant operational overhead and loses the managed benefits of Bedrock Knowledge Bases. This doesn't integrate with the Bedrock RAG pipeline."
    },
    parseStrategy: {
      keyPhrase: "customer-managed encryption keys … rotate keys … audit key usage",
      eliminationHints: [
        "AWS-managed keys = no customer control",
        "App-level encryption = Bedrock can't read the data",
        "Custom EC2 vector DB = operational overhead, loses managed benefits",
        "Customer-managed KMS = full control, rotation, audit"
      ],
      decisionFramework: "Customer-managed encryption + key rotation + audit = AWS KMS customer-managed key (CMK)."
    },
    services: ["Amazon Bedrock Knowledge Bases", "Amazon OpenSearch Serverless", "AWS KMS"],
    examTip: "Customer-managed KMS keys provide key control, rotation, and CloudTrail audit. AWS-managed keys are convenient but don't meet 'customer-controlled' requirements.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you encrypt Bedrock Knowledge Base vector data with keys the customer controls, rotates, and audits?",
      testedConcepts: ["Customer-managed KMS keys", "Encryption at rest", "OpenSearch Serverless encryption", "Key rotation and auditing"],
      servicesInPlay: [
        { service: "AWS KMS (Customer-Managed Key)", role: "Customer-controlled encryption with rotation and CloudTrail auditing", isCorrectAnswer: true },
        { service: "Amazon OpenSearch Serverless", role: "Vector store that supports CMK encryption at rest", isCorrectAnswer: true },
        { service: "AWS-Managed Encryption", role: "Default encryption — no customer key control", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Requirement: customer-managed keys + rotation + audit. 2. AWS-managed = no customer control — eliminate A. 3. App-level encryption = Bedrock can't process data — eliminate B. 4. Custom EC2 = operational overhead — eliminate D. 5. OpenSearch Serverless with CMK = managed + customer-controlled encryption.",
      commonMistakes: [
        "Confusing AWS-managed encryption with customer-managed keys — very different levels of control",
        "Thinking application-level encryption works with managed services that need to read the data",
        "Defaulting to self-managed infrastructure for encryption when managed services support CMKs"
      ],
      timeManagementTip: "Customer-managed keys = AWS KMS CMK. Eliminate AWS-managed and app-level encryption immediately."
    }
  },

  // ─── op-33 ── Domain 2 — Agents: return of control ────────────────
  {
    id: "op-33",
    domain: 2,
    task: "2.2",
    skills: ["2.2.3"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A banking application uses an Amazon Bedrock Agent to process fund transfer requests. Before executing any transfer, the application must present the transfer details to the user for explicit confirmation. The agent should pause execution after determining the transfer parameters and wait for user approval before proceeding.",
    question: "Which Bedrock Agent feature enables this confirmation workflow?",
    options: [
      { id: "a", text: "Configure the agent to generate a confirmation message in its response and process the transfer in the next user turn." },
      { id: "b", text: "Use the Return of Control (ROC) feature to pause agent execution and return the proposed action to the calling application for user confirmation." },
      { id: "c", text: "Implement a separate confirmation Lambda function that the agent calls before executing the transfer action." },
      { id: "d", text: "Add a guardrail that blocks all transfer actions and requires manual override." }
    ],
    correctAnswers: ["b"],
    explanation: "Return of Control (ROC) is a Bedrock Agent feature that pauses the agent's execution after it determines the action to take but before executing it. The proposed action and parameters are returned to the calling application, which can present them to the user for confirmation. Once confirmed, the application sends the approval back to the agent to proceed.",
    incorrectExplanations: {
      a: "Relying on the agent to generate a confirmation message doesn't guarantee the transfer won't execute. There's no mechanism to pause execution — the agent may proceed with the action in the same turn.",
      c: "A separate confirmation Lambda adds complexity and doesn't provide a standard mechanism for pausing agent execution and returning control to the application for user interaction.",
      d: "A guardrail that blocks all transfers defeats the purpose. Guardrails are for content filtering, not for implementing confirmation workflows."
    },
    parseStrategy: {
      keyPhrase: "pause execution … wait for user approval before proceeding",
      eliminationHints: [
        "Confirmation message = no execution pause guarantee",
        "Separate Lambda = custom complexity, no standard pause mechanism",
        "Guardrail blocking = prevents transfers entirely, not confirmation flow",
        "Return of Control = built-in pause-and-confirm feature"
      ],
      decisionFramework: "When an agent needs to pause for human confirmation before executing an action, use Return of Control (ROC)."
    },
    services: ["Amazon Bedrock Agents"],
    examTip: "Return of Control (ROC) is the Bedrock Agent feature for human-in-the-loop confirmation workflows. It pauses execution and returns the proposed action to the application.",
    strategicBreakdown: {
      whatIsBeingAsked: "How does a Bedrock Agent pause before executing a sensitive action so the user can confirm?",
      testedConcepts: ["Bedrock Agent Return of Control", "Human-in-the-loop workflows", "Agent execution control", "Action confirmation patterns"],
      servicesInPlay: [
        { service: "Amazon Bedrock Agents (Return of Control)", role: "Pauses agent execution and returns proposed action for user confirmation", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Need: pause agent before action execution. 2. Agent-generated message = no actual pause — eliminate A. 3. Extra Lambda = unnecessary complexity — eliminate C. 4. Guardrail = blocks entirely, not confirms — eliminate D. 5. Return of Control = built-in pause + confirm feature.",
      commonMistakes: [
        "Thinking the agent can reliably self-pause by generating a confirmation message",
        "Building custom confirmation infrastructure instead of using the built-in ROC feature",
        "Confusing guardrails (content filtering) with workflow control (ROC)"
      ],
      timeManagementTip: "Pause + confirm + agent = Return of Control. Know the feature name."
    }
  },

  // ─── op-34 ── Domain 1 — FM selection: fine-tuning vs prompt ───────
  {
    id: "op-34",
    domain: 1,
    task: "1.3",
    skills: ["1.3.1"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A healthcare company needs an FM to extract structured data (medication names, dosages, frequencies) from unstructured doctor's notes. The model must consistently output results in a specific JSON schema. Prompt engineering with few-shot examples produces correct output 70% of the time, but the company requires 95%+ accuracy for production use.",
    question: "Which approach is MOST likely to achieve the required accuracy?",
    options: [
      { id: "a", text: "Add more few-shot examples to the prompt until accuracy reaches 95%." },
      { id: "b", text: "Fine-tune the FM on a labeled dataset of doctor's notes mapped to the target JSON schema." },
      { id: "c", text: "Switch to a larger FM that has more parameters and reasoning capability." },
      { id: "d", text: "Reduce the temperature to 0 to make outputs fully deterministic." }
    ],
    correctAnswers: ["b"],
    explanation: "Fine-tuning on a labeled dataset of domain-specific examples (doctor's notes → JSON) teaches the model the exact extraction patterns and output format required. This is the standard approach when prompt engineering alone cannot achieve the required accuracy for structured extraction tasks.",
    incorrectExplanations: {
      a: "More few-shot examples consume context window tokens and have diminishing returns. Beyond a certain point, additional examples don't significantly improve accuracy and may degrade performance by reducing available context for the actual input.",
      c: "A larger model may help with reasoning but doesn't address the domain-specific extraction patterns. Larger models are also more expensive and slower — not necessarily more accurate for specialized extraction tasks.",
      d: "Temperature 0 makes sampling deterministic but doesn't improve the model's understanding of the extraction task. If the model's learned patterns are wrong at 70% accuracy, deterministic sampling just consistently reproduces the same errors."
    },
    parseStrategy: {
      keyPhrase: "70% with prompt engineering … requires 95%+ accuracy … structured extraction",
      eliminationHints: [
        "More few-shot = diminishing returns, context waste",
        "Larger model = more expensive, doesn't address domain specificity",
        "Temperature 0 = deterministic but same accuracy",
        "Fine-tuning = teaches domain patterns and output format"
      ],
      decisionFramework: "When prompt engineering hits a ceiling for structured tasks, fine-tuning is the next step. It teaches domain-specific patterns the base model lacks."
    },
    services: ["Amazon Bedrock"],
    examTip: "The prompt engineering → fine-tuning escalation path: try prompts first, fine-tune when prompts plateau. Especially important for structured output tasks.",
    strategicBreakdown: {
      whatIsBeingAsked: "When prompt engineering can't reach the required accuracy for structured data extraction, what's the next step?",
      testedConcepts: ["Fine-tuning vs prompt engineering", "Structured data extraction", "Model customization", "Accuracy optimization strategies"],
      servicesInPlay: [
        { service: "Amazon Bedrock (Fine-tuning)", role: "Custom training on labeled examples to learn domain-specific extraction patterns", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Prompt engineering plateaus at 70%, need 95%. 2. More few-shot = diminishing returns — eliminate A. 3. Larger model ≠ domain-specific accuracy — eliminate C. 4. Temperature 0 = same accuracy, just deterministic — eliminate D. 5. Fine-tuning on labeled data teaches the exact patterns needed.",
      commonMistakes: [
        "Thinking more few-shot examples always improve accuracy — they have diminishing returns",
        "Assuming a larger model will be better at domain-specific tasks without domain-specific training",
        "Confusing temperature (sampling randomness) with accuracy (model understanding)"
      ],
      timeManagementTip: "Prompt engineering plateau + accuracy gap = fine-tuning. Standard escalation path."
    }
  },

  // ─── op-35 ── Domain 5 — Deployment: A/B testing ──────────────────
  {
    id: "op-35",
    domain: 5,
    task: "5.2",
    skills: ["5.2.1"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A company is upgrading their GenAI application from one foundation model to a newer version. They want to gradually shift traffic from the current model to the new model while monitoring quality metrics. If the new model underperforms, they need to quickly roll back to the previous model with no downtime.",
    question: "Which deployment strategy BEST supports this gradual migration?",
    options: [
      { id: "a", text: "Deploy the new model and switch all traffic at once, monitoring for issues and rolling back manually if needed." },
      { id: "b", text: "Use Amazon Bedrock inference profiles to route a percentage of traffic to the new model and gradually increase it based on quality metrics." },
      { id: "c", text: "Deploy both models behind an Application Load Balancer with weighted target groups for traffic splitting." },
      { id: "d", text: "Run the new model in a separate staging environment, validate manually, then do a full cutover in production." }
    ],
    correctAnswers: ["b"],
    explanation: "Amazon Bedrock inference profiles allow traffic routing between models with configurable traffic splits. This enables gradual migration by starting with a small percentage of traffic to the new model, monitoring quality metrics, and incrementally increasing the split — with instant rollback by adjusting the traffic weight back to 0%.",
    incorrectExplanations: {
      a: "All-at-once deployment with manual rollback risks exposing all users to potential quality issues. It's the highest risk migration strategy and doesn't support gradual validation.",
      c: "An ALB with weighted target groups could work for custom-hosted models but adds unnecessary infrastructure for Bedrock-managed models. Bedrock's native traffic management is simpler.",
      d: "Staging validation followed by full cutover is better than all-at-once but doesn't provide gradual production traffic migration or real-time quality monitoring under actual load."
    },
    parseStrategy: {
      keyPhrase: "gradually shift traffic … monitoring quality … quickly roll back",
      eliminationHints: [
        "All-at-once = high risk, no gradual migration",
        "ALB = unnecessary infrastructure for Bedrock models",
        "Staging + cutover = no gradual production traffic shift",
        "Inference profiles = native Bedrock traffic splitting"
      ],
      decisionFramework: "Gradual model migration on Bedrock = inference profiles with traffic splitting. No external infrastructure needed."
    },
    services: ["Amazon Bedrock"],
    examTip: "Bedrock inference profiles enable canary and blue/green deployments natively. Don't build custom traffic splitting for Bedrock-hosted models.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you safely migrate from one Bedrock model to another with gradual traffic shifting and easy rollback?",
      testedConcepts: ["Model deployment strategies", "Canary deployments", "Traffic splitting", "Bedrock inference profiles", "Rollback mechanisms"],
      servicesInPlay: [
        { service: "Amazon Bedrock Inference Profiles", role: "Native traffic splitting between models with configurable weights", isCorrectAnswer: true },
        { service: "Application Load Balancer", role: "Traffic splitting — unnecessary for Bedrock-managed models", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Gradual traffic shift + rollback = canary deployment pattern. 2. All-at-once = highest risk — eliminate A. 3. Staging + cutover = no gradual production shift — eliminate D. 4. ALB = external infrastructure for a Bedrock-native problem — eliminate C. 5. Inference profiles = built-in canary for Bedrock.",
      commonMistakes: [
        "Choosing all-at-once deployment when the question explicitly asks for gradual migration",
        "Building custom ALB-based traffic splitting for models that Bedrock manages natively",
        "Confusing staging validation (pre-production) with canary deployment (gradual production rollout)"
      ],
      timeManagementTip: "Gradual migration + Bedrock = inference profiles. Native feature, no custom infrastructure."
    }
  },

  // ─── op-36 ── Domain 2 — Knowledge Bases: data source sync ────────
  {
    id: "op-36",
    domain: 2,
    task: "2.3",
    skills: ["2.3.3"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A company has an Amazon Bedrock Knowledge Base backed by documents in S3. The content team updates documents daily, but users report that the RAG application still returns outdated information days after documents are updated. The team wants the knowledge base to stay current with minimal manual intervention.",
    question: "Which solution ensures the knowledge base reflects document updates in a timely manner?",
    options: [
      { id: "a", text: "Delete and recreate the entire knowledge base each time documents are updated." },
      { id: "b", text: "Configure an automated data source sync schedule or trigger an incremental sync using the StartIngestionJob API when documents change." },
      { id: "c", text: "Increase the number of vector database replicas to improve read throughput." },
      { id: "d", text: "Clear the vector database cache to force re-reading of source documents." }
    ],
    correctAnswers: ["b"],
    explanation: "Bedrock Knowledge Bases require a data source sync (ingestion job) to re-process documents and update vector embeddings. Configuring an automated sync schedule or triggering the StartIngestionJob API via S3 event notifications ensures updated documents are re-embedded and searchable without manual intervention.",
    incorrectExplanations: {
      a: "Deleting and recreating the entire knowledge base is destructive and unnecessary. Incremental sync processes only changed documents, which is far more efficient.",
      c: "Vector database replicas improve read throughput and availability but have no effect on data freshness. Stale embeddings are replicated just as well as current ones.",
      d: "Vector databases don't have a simple cache to clear. The embeddings stored in the vector database are the indexed representations — they need to be re-generated from updated source documents via a sync job."
    },
    parseStrategy: {
      keyPhrase: "outdated information … stay current … minimal manual intervention",
      eliminationHints: [
        "Delete/recreate = destructive, unnecessary",
        "More replicas = throughput, not freshness",
        "Cache clear = misunderstanding of vector DB architecture",
        "Sync schedule / StartIngestionJob = designed for this"
      ],
      decisionFramework: "Knowledge base showing stale data = needs data source sync. StartIngestionJob or automated schedule."
    },
    services: ["Amazon Bedrock Knowledge Bases", "Amazon S3"],
    examTip: "Bedrock Knowledge Bases don't auto-sync. You must trigger or schedule ingestion jobs to pick up document changes.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you keep a Bedrock Knowledge Base up to date when source documents change regularly?",
      testedConcepts: ["Knowledge Base data source sync", "StartIngestionJob API", "Incremental ingestion", "Data freshness management"],
      servicesInPlay: [
        { service: "Amazon Bedrock Knowledge Bases (StartIngestionJob)", role: "Re-processes changed documents and updates vector embeddings", isCorrectAnswer: true },
        { service: "Amazon S3", role: "Source document storage — changes trigger sync", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Problem = stale data in knowledge base. 2. Delete/recreate = wasteful — eliminate A. 3. Replicas = throughput, not freshness — eliminate C. 4. Cache clear = wrong mental model — eliminate D. 5. Ingestion job sync = the mechanism to update embeddings from changed documents.",
      commonMistakes: [
        "Thinking Knowledge Bases automatically detect and sync document changes — they don't",
        "Confusing vector DB replicas (availability) with data freshness",
        "Attempting to 'clear cache' on a vector database — embeddings must be re-generated"
      ],
      timeManagementTip: "Stale KB data = needs sync. StartIngestionJob. Immediate elimination of the three distractors."
    }
  },

  // ─── op-37 ── Domain 3 — Responsible AI: hallucination reduction ──
  {
    id: "op-37",
    domain: 3,
    task: "3.1",
    skills: ["3.1.3"],
    type: "multiple-response",
    difficulty: "hard",
    scenario: "A pharmaceutical company's GenAI application generates drug interaction summaries for pharmacists. The application sometimes produces plausible-sounding but factually incorrect information about drug interactions — a critical safety concern. The team must reduce hallucinations to ensure patient safety.",
    question: "Which combination of techniques will MOST effectively reduce hallucinations in this application? (Select TWO.)",
    options: [
      { id: "a", text: "Increase the temperature parameter to encourage more creative and diverse responses." },
      { id: "b", text: "Implement RAG with a curated, verified drug interaction database as the knowledge source." },
      { id: "c", text: "Configure Amazon Bedrock Guardrails with grounding checks to detect responses not supported by the provided reference material." },
      { id: "d", text: "Use a larger foundation model with more parameters for improved factual recall." },
      { id: "e", text: "Add instructions to the system prompt saying 'Do not hallucinate.'" }
    ],
    correctAnswers: ["b", "c"],
    explanation: "RAG grounds the model's responses in verified source data, ensuring answers come from the curated drug interaction database rather than the model's parametric memory. Bedrock Guardrails grounding checks add a verification layer that detects when the model's response isn't supported by the provided reference material, catching remaining hallucinations before they reach the user.",
    incorrectExplanations: {
      a: "Higher temperature increases randomness and creativity, which actually increases the likelihood of hallucinations. For factual accuracy, lower temperature is preferred.",
      d: "Larger models may have better factual recall on some topics but are not reliable for specialized medical information. Model size doesn't guarantee accuracy for domain-specific facts.",
      e: "Instructing the model not to hallucinate is ineffective — hallucinations are an inherent characteristic of generative models. The model doesn't 'know' when it's hallucinating."
    },
    parseStrategy: {
      keyPhrase: "reduce hallucinations … drug interactions … critical safety",
      eliminationHints: [
        "Higher temperature = MORE hallucinations",
        "Larger model ≠ domain-specific accuracy guarantee",
        "'Don't hallucinate' prompt = ineffective, models can't self-detect hallucinations",
        "RAG = grounds in verified data",
        "Grounding checks = catches unsupported claims"
      ],
      decisionFramework: "Hallucination reduction = ground in data (RAG) + verify grounding (Guardrails). Two complementary layers."
    },
    services: ["Amazon Bedrock Knowledge Bases", "Amazon Bedrock Guardrails"],
    examTip: "RAG provides the data grounding, Guardrails grounding checks verify the grounding. Together they're the strongest anti-hallucination combination on the exam.",
    strategicBreakdown: {
      whatIsBeingAsked: "Which two techniques best reduce factually incorrect outputs in a safety-critical GenAI application?",
      testedConcepts: ["Hallucination reduction", "RAG grounding", "Guardrails grounding checks", "Temperature effects", "Responsible AI for safety-critical applications"],
      servicesInPlay: [
        { service: "Amazon Bedrock Knowledge Bases (RAG)", role: "Grounds responses in verified drug interaction data", isCorrectAnswer: true },
        { service: "Amazon Bedrock Guardrails (Grounding Checks)", role: "Detects responses not supported by reference material", isCorrectAnswer: true }
      ],
      approachStrategy: "1. Safety-critical = need maximum hallucination reduction. 2. Higher temp = more randomness = more hallucinations — eliminate A. 3. 'Don't hallucinate' prompt = ineffective — eliminate E. 4. Larger model ≠ domain accuracy — eliminate D. 5. RAG = data grounding. 6. Grounding checks = verification. Both complement each other.",
      commonMistakes: [
        "Thinking higher temperature improves quality — it increases hallucinations",
        "Believing larger models are always more factually accurate — they aren't for specialized domains",
        "Thinking prompt instructions can prevent hallucinations — models can't detect their own hallucinations"
      ],
      timeManagementTip: "Hallucination reduction = RAG + Guardrails grounding. Eliminate temp increase and 'don't hallucinate' instantly."
    }
  },

  // ─── op-38 ── Domain 4 — Security: VPC endpoints ──────────────────
  {
    id: "op-38",
    domain: 4,
    task: "4.1",
    skills: ["4.1.2"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A company's security policy requires that all API calls to Amazon Bedrock from their application must not traverse the public internet. The application runs on EC2 instances in a private subnet within a VPC. The team needs to invoke Bedrock models while keeping all traffic within the AWS network.",
    question: "Which networking configuration meets this requirement?",
    options: [
      { id: "a", text: "Configure a NAT Gateway in a public subnet to route Bedrock API calls from the private subnet through the internet gateway." },
      { id: "b", text: "Create a VPC interface endpoint (AWS PrivateLink) for Amazon Bedrock in the VPC to keep API traffic within the AWS network." },
      { id: "c", text: "Set up a VPN connection between the VPC and the Bedrock service endpoint." },
      { id: "d", text: "Deploy a forward proxy in a public subnet to relay Bedrock API calls from the private subnet." }
    ],
    correctAnswers: ["b"],
    explanation: "A VPC interface endpoint (powered by AWS PrivateLink) creates a private connection between the VPC and Amazon Bedrock. API calls from the private subnet go directly to Bedrock through the endpoint without traversing the public internet, satisfying the security requirement.",
    incorrectExplanations: {
      a: "A NAT Gateway routes traffic through the internet gateway, which means API calls traverse the public internet — directly violating the security requirement.",
      c: "VPN connections are for connecting on-premises networks to VPCs, not for connecting VPCs to AWS services. PrivateLink is the correct mechanism for private service access.",
      d: "A forward proxy still sends traffic through the internet (via the public subnet's internet gateway), just through an intermediary. The traffic still traverses the public internet."
    },
    parseStrategy: {
      keyPhrase: "must not traverse the public internet … private subnet",
      eliminationHints: [
        "NAT Gateway = routes through internet gateway = public internet",
        "VPN = for on-premises connectivity, not AWS service access",
        "Forward proxy = still uses internet gateway",
        "VPC endpoint (PrivateLink) = private connection to AWS services"
      ],
      decisionFramework: "Private access to AWS services from VPC = VPC interface endpoint (PrivateLink). No internet traversal."
    },
    services: ["Amazon Bedrock", "AWS PrivateLink", "Amazon VPC"],
    examTip: "VPC interface endpoints (PrivateLink) provide private connectivity to AWS services without internet. NAT Gateways still use the public internet.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you call Bedrock APIs from a private subnet without any traffic going over the public internet?",
      testedConcepts: ["VPC interface endpoints", "AWS PrivateLink", "Private subnet connectivity", "Network security for AI services"],
      servicesInPlay: [
        { service: "AWS PrivateLink (VPC Interface Endpoint)", role: "Private connection from VPC to Bedrock — no internet traversal", isCorrectAnswer: true },
        { service: "NAT Gateway", role: "Enables internet access from private subnet — uses public internet", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Requirement: no public internet. 2. NAT Gateway = uses internet gateway — eliminate A. 3. Forward proxy = still uses internet — eliminate D. 4. VPN = wrong use case (on-prem, not service access) — eliminate C. 5. VPC endpoint (PrivateLink) = private path to Bedrock.",
      commonMistakes: [
        "Thinking NAT Gateway keeps traffic private — it routes through the public internet",
        "Confusing VPN (on-premises connectivity) with PrivateLink (AWS service connectivity)",
        "Not knowing that Bedrock supports VPC interface endpoints"
      ],
      timeManagementTip: "Private access to AWS service = PrivateLink. Classic networking question with a quick answer."
    }
  },

  // ─── op-39 ── Domain 5 — Monitoring: model performance drift ──────
  {
    id: "op-39",
    domain: 5,
    task: "5.2",
    skills: ["5.2.2"],
    type: "multiple-choice",
    difficulty: "hard",
    scenario: "A company deployed a GenAI customer service application three months ago. Initially, the application had high user satisfaction scores. Over time, user satisfaction has gradually declined even though no changes were made to the application or model. The team suspects the model's responses are becoming less relevant to current customer inquiries.",
    question: "Which monitoring approach will help the team identify and address this performance degradation?",
    options: [
      { id: "a", text: "Review the Amazon Bedrock invocation logs for increases in API error rates or latency." },
      { id: "b", text: "Implement continuous evaluation by periodically running the model against updated test datasets that reflect current customer inquiry patterns, and compare results to baseline metrics." },
      { id: "c", text: "Increase the Provisioned Throughput allocation to handle more concurrent requests." },
      { id: "d", text: "Retrain the foundation model on the latest training data to update its knowledge." }
    ],
    correctAnswers: ["b"],
    explanation: "Performance drift occurs when the real-world data distribution shifts over time while the model remains static. Continuous evaluation with updated test datasets detects this drift by comparing current performance against established baselines. This identifies when and how the model's relevance is declining, enabling targeted corrective actions.",
    incorrectExplanations: {
      a: "API error rates and latency metrics indicate infrastructure issues, not content relevance degradation. The model is functioning correctly — its outputs are just becoming less relevant to evolving customer needs.",
      c: "Provisioned Throughput affects capacity and consistency, not response quality or relevance. The problem is content relevance, not throughput.",
      d: "You typically cannot retrain a foundation model — you can fine-tune it. But the first step should be identifying the specific nature of the drift through evaluation before deciding on remediation."
    },
    parseStrategy: {
      keyPhrase: "gradually declined … no changes … becoming less relevant",
      eliminationHints: [
        "API errors/latency = infrastructure metrics, not relevance",
        "More throughput = capacity, not quality",
        "Retrain FM = not standard practice, need to diagnose first",
        "Continuous evaluation = detects drift in content relevance"
      ],
      decisionFramework: "Gradual quality decline without code changes = data/concept drift. Detect with continuous evaluation against current patterns."
    },
    services: ["Amazon Bedrock", "Amazon CloudWatch"],
    examTip: "Performance drift requires ongoing evaluation, not one-time testing. Set up continuous evaluation pipelines that reflect current real-world patterns.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you detect and diagnose gradual GenAI performance degradation caused by changing real-world patterns?",
      testedConcepts: ["Model performance drift", "Continuous evaluation", "Data distribution shift", "Monitoring strategies for GenAI"],
      servicesInPlay: [
        { service: "Amazon Bedrock Model Evaluation", role: "Periodic evaluation against updated test datasets to detect drift", isCorrectAnswer: true },
        { service: "Amazon CloudWatch", role: "Infrastructure monitoring — doesn't capture relevance", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Problem = gradual decline, no code changes = drift. 2. API metrics = infrastructure, not relevance — eliminate A. 3. More throughput = capacity, not quality — eliminate C. 4. Retrain FM = premature without diagnosis — eliminate D. 5. Continuous evaluation detects drift by comparing to updated baselines.",
      commonMistakes: [
        "Looking at infrastructure metrics (errors, latency) for content quality problems",
        "Jumping to retraining before diagnosing the specific nature of the drift",
        "Thinking more capacity solves quality degradation"
      ],
      timeManagementTip: "Gradual decline + no changes = drift. Continuous evaluation is the detection mechanism. Standard MLOps concept."
    }
  },

  // ─── op-40 ── Domain 2 — Converse API ─────────────────────────────
  {
    id: "op-40",
    domain: 2,
    task: "2.1",
    skills: ["2.1.1"],
    type: "multiple-choice",
    difficulty: "medium",
    scenario: "A development team is building a multi-model chat application on Amazon Bedrock. They need to support conversations across Claude, Amazon Nova, and Llama models. Currently, they maintain separate API integration code for each model's unique request and response format, which increases maintenance burden.",
    question: "Which approach will simplify the integration and reduce code maintenance?",
    options: [
      { id: "a", text: "Create a custom abstraction layer that translates a common format into each model's specific API format." },
      { id: "b", text: "Use the Amazon Bedrock Converse API, which provides a unified request and response format across all supported models." },
      { id: "c", text: "Standardize on a single model to eliminate the need for multiple integrations." },
      { id: "d", text: "Use AWS Step Functions to orchestrate calls to different models with separate Lambda functions for each model's format." }
    ],
    correctAnswers: ["b"],
    explanation: "The Amazon Bedrock Converse API provides a model-agnostic interface with a unified request and response format. Instead of maintaining separate integration code for each model's native API format, developers use one consistent API structure. The Converse API handles the translation to each model's native format internally.",
    incorrectExplanations: {
      a: "Building a custom abstraction layer requires developing and maintaining translation logic for each model — exactly the maintenance burden the team wants to reduce. The Converse API already provides this abstraction.",
      c: "Standardizing on a single model eliminates multi-model flexibility, which is a business requirement. The team needs to support multiple models, not reduce to one.",
      d: "Step Functions with separate Lambda functions per model increases complexity and cost. Each Lambda still needs model-specific formatting code, so the maintenance burden remains."
    },
    parseStrategy: {
      keyPhrase: "multi-model … separate API integration code … reduce code maintenance",
      eliminationHints: [
        "Custom abstraction = builds what Converse API already provides",
        "Single model = loses multi-model requirement",
        "Step Functions + Lambdas = more complexity, not less",
        "Converse API = unified format across models"
      ],
      decisionFramework: "Multi-model integration with consistent API = Converse API. Don't build custom abstractions when a managed API exists."
    },
    services: ["Amazon Bedrock", "Amazon Bedrock Converse API"],
    examTip: "The Converse API is Bedrock's answer to multi-model integration complexity. One API format, many models. Know this for any question about model-agnostic development.",
    strategicBreakdown: {
      whatIsBeingAsked: "How do you avoid maintaining separate integration code for each Bedrock model's unique API format?",
      testedConcepts: ["Amazon Bedrock Converse API", "Model-agnostic development", "API abstraction", "Multi-model integration"],
      servicesInPlay: [
        { service: "Amazon Bedrock Converse API", role: "Unified request/response format across all Bedrock models", isCorrectAnswer: true },
        { service: "AWS Step Functions", role: "Orchestration — adds complexity, doesn't simplify model integration", isCorrectAnswer: false }
      ],
      approachStrategy: "1. Problem = maintaining separate code per model. 2. Custom abstraction = recreates what Converse API offers — eliminate A. 3. Single model = violates multi-model requirement — eliminate C. 4. Step Functions = more complexity — eliminate D. 5. Converse API = built-in unified interface.",
      commonMistakes: [
        "Building custom model abstraction layers when the Converse API exists",
        "Thinking Step Functions simplifies API integration — it adds orchestration complexity",
        "Not knowing the Converse API exists and defaulting to model-specific InvokeModel calls"
      ],
      timeManagementTip: "Multi-model + unified API = Converse API. One of the most important Bedrock APIs to know for the exam."
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

  // Check for existing IDs
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

  // Update metadata
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
