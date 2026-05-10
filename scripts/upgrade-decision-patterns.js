#!/usr/bin/env node

/**
 * Replaces all decisionPatterns in service-decision-guide.json with
 * scenario-based format: one-sentence hypothetical + service + why.
 */

const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'src', 'data', 'service-decision-guide.json');

const upgradedPatterns = {
  "rag-pipeline": [
    {
      scenario: "A law firm's RAG app splits contract clauses across chunks because provisions span multiple paragraphs and reference other sections.",
      service: "Hierarchical Chunking",
      why: "Preserves the parent-child structure of document sections so multi-paragraph clauses stay intact as complete units."
    },
    {
      scenario: "A company's knowledge base covers 50 products, but search results for Product A keep returning docs from Product B because they share similar terminology.",
      service: "Metadata Filtering",
      why: "Pre-filters vector search by product or category tag before semantic matching, so only the correct product's documents are considered."
    },
    {
      scenario: "A pharma company's RAG search misunderstands specialized drug names and chemical terminology because the embedding model was trained on general web text.",
      service: "Domain-Aligned Embedding Model",
      why: "An embedding model trained on scientific/medical text produces more meaningful vectors for specialized terminology than a generic model with more dimensions."
    },
    {
      scenario: "Users complain the knowledge base still shows yesterday's product specs even though the S3 source documents were updated this morning.",
      service: "StartIngestionJob API or Automated Sync",
      why: "Bedrock Knowledge Bases don't auto-sync — you must trigger an ingestion job (or schedule one) to re-embed updated documents into the vector store."
    },
    {
      scenario: "A RAG app retrieves the correct FDA drug documents, but the model's summary includes a drug interaction warning that doesn't appear anywhere in the source material.",
      service: "Guardrails Contextual Grounding Checks",
      why: "Verifies each claim in the model's response against the retrieved source documents and blocks statements that aren't supported by the reference material."
    },
    {
      scenario: "A medical GenAI app sometimes invents plausible-sounding but incorrect treatment recommendations, which could endanger patient safety.",
      service: "RAG + Guardrails Grounding Checks (together)",
      why: "RAG grounds responses in verified source data; grounding checks verify the model stayed faithful to that data. Two complementary layers for safety-critical applications."
    }
  ],

  "guardrails": [
    {
      scenario: "A chatbot occasionally generates responses containing hate speech or violent language that violates company policy.",
      service: "Content Filters",
      why: "Blocks harmful content categories (hate, violence, sexual, misconduct) with configurable severity thresholds on both inputs and outputs."
    },
    {
      scenario: "A financial chatbot must never provide investment recommendations or tax advice, regardless of how creatively users phrase their requests.",
      service: "Denied Topic Policies",
      why: "Uses natural language descriptions to detect prohibited business topics semantically — understands intent even when users rephrase to avoid specific keywords."
    },
    {
      scenario: "A company wants to block specific competitor brand names and profanity from ever appearing in chatbot responses.",
      service: "Word Filters",
      why: "Exact keyword/phrase matching that blocks specific strings. Simple and precise for known words, but won't catch rephrased versions."
    },
    {
      scenario: "A healthcare app must ensure Social Security numbers, phone numbers, and emails never appear in model outputs — and adding new PII types shouldn't require code changes.",
      service: "Sensitive Information Filters (PII)",
      why: "Auto-detects and blocks built-in PII types in outputs. New PII types are added via configuration, not code — meeting compliance without deployment cycles."
    },
    {
      scenario: "A compliance team needs to know which specific guardrail policy (content filter, denied topic, or PII filter) blocked a particular response.",
      service: "GuardrailPolicyType CloudWatch Dimension",
      why: "Shows which policy category triggered the block. The GuardrailContentSource dimension only tells you input vs output — not which policy fired."
    },
    {
      scenario: "A security team needs to ensure every Bedrock API call across the organization must pass through a specific guardrail — no exceptions.",
      service: "IAM Condition Key: bedrock:GuardrailIdentifier",
      why: "Attaches a condition to InvokeModel IAM policies requiring a specific guardrail ID, making it impossible to invoke models without the guardrail."
    }
  ],

  "model-customization": [
    {
      scenario: "A startup's chatbot handles simple order-status queries and return policies — no complex reasoning needed, but responses must be under 500ms on a tight budget.",
      service: "Smallest Adequate Model (Haiku, Nova Micro)",
      why: "Simple tasks don't need large models. A smaller FM is faster and cheaper per token — right-sizing to the task saves both latency and cost."
    },
    {
      scenario: "A sentiment classifier works well on obvious reviews but misclassifies sarcastic ones. The team can't fine-tune but has examples of sarcastic reviews with correct labels.",
      service: "Few-Shot Prompting",
      why: "Providing labeled examples of the edge cases in the prompt teaches the model the pattern in-context without requiring training infrastructure."
    },
    {
      scenario: "A model keeps getting multi-step math problems wrong because it jumps straight to the answer without working through intermediate calculations.",
      service: "Chain-of-Thought Prompting",
      why: "Instructing the model to 'show step-by-step reasoning' forces it to work through intermediate logic, catching errors before the final answer."
    },
    {
      scenario: "Few-shot prompting plateaued at 73% accuracy for extracting medication data from doctor's notes into JSON. The team has 200 labeled examples and needs 95%+.",
      service: "Fine-Tuning on Amazon Bedrock",
      why: "When prompting hits a ceiling and you have labeled input→output pairs, fine-tuning teaches the model the exact extraction patterns. It also eliminates the token overhead of few-shot examples in every request."
    },
    {
      scenario: "A genomics FM performs poorly on proprietary research terminology. The company has 50,000 unlabeled research papers but no labeled question-answer pairs.",
      service: "Continued Pre-Training",
      why: "Exposes the FM to the unlabeled domain corpus so it learns specialized vocabulary and concepts. Unlike fine-tuning, CPT doesn't require labeled data."
    },
    {
      scenario: "A company sends 2 million templated email replies per month using a large FM. The replies follow predictable patterns and the cost is unsustainable.",
      service: "Model Distillation",
      why: "Creates a smaller, cheaper model optimized for this narrow task by learning from the larger teacher model. Dramatically reduces per-invocation cost at high volume."
    }
  ],

  "throughput-cost": [
    {
      scenario: "An app gets 'Too many requests' throttling errors from Bedrock during peak hours but needs to keep using the same FM without adding infrastructure.",
      service: "Cross-Region Inference",
      why: "Automatically distributes requests to Regions with available capacity. Same FM, same API, no operational overhead — just more throughput during peaks."
    },
    {
      scenario: "A marketing team needs to generate personalized emails for 500,000 customers. Results are needed within 24 hours, and cost must be minimized.",
      service: "Batch Inference",
      why: "Processes large request volumes asynchronously at a discounted rate compared to on-demand. Perfect for non-real-time, high-volume jobs."
    },
    {
      scenario: "Every API call to Bedrock includes the same 5,000-token system prompt with company policies. The team wants to reduce both cost and latency for these repeated tokens.",
      service: "Prompt Caching",
      why: "Caches static prompt components across requests so those tokens aren't reprocessed each time — reducing both per-request cost and first-token latency."
    },
    {
      scenario: "A European company must comply with GDPR and ensure all Bedrock data processing stays within the EU.",
      service: "Deploy in EU Region Only",
      why: "AWS Regions are physically isolated — deploying in eu-west-1 or eu-central-1 keeps all processing in the EU. Cross-Region inference must be disabled because it may route to non-EU Regions."
    }
  ],

  "agent-patterns": [
    {
      scenario: "An AI assistant needs to autonomously check inventory, update shipping status, and calculate delivery estimates by calling the company's internal REST APIs.",
      service: "Bedrock Agents with Action Groups",
      why: "Action Groups define available API operations via OpenAPI schemas. The agent decides which to call based on user intent, and Lambda executes the actual API calls."
    },
    {
      scenario: "A banking agent processes fund transfers, but regulations require the user to explicitly confirm transfer details before the agent executes the transaction.",
      service: "Return of Control (ROC)",
      why: "Pauses agent execution after determining the action parameters but before executing. Returns the proposed action to the application so it can present details to the user and wait for confirmation."
    },
    {
      scenario: "A travel planning chatbot needs to remember the customer's destination, dates, and hotel preferences mentioned 30 turns ago in the same conversation.",
      service: "Bedrock Agent sessionId",
      why: "Passing the same sessionId with each InvokeAgent call maintains conversation history natively. No need for custom DynamoDB session storage."
    },
    {
      scenario: "A customer service system has separate specialist agents for orders, recommendations, and complaints — a supervisor must route each request to the right specialist.",
      service: "Multi-Agent Collaboration",
      why: "A supervisor agent dynamically routes to specialized sub-agents, each with their own instructions, tools, and knowledge bases. The supervisor coordinates and synthesizes results."
    },
    {
      scenario: "A developer needs to build a document processing pipeline: extract text with Textract, summarize with an FM, classify the document type, and store results — using a visual drag-and-drop interface.",
      service: "Amazon Bedrock Flows",
      why: "Visual, low-code workflow builder for predefined multi-step GenAI pipelines. Different from Agents (which are autonomous and conversational) — Flows are for structured, sequential processing."
    },
    {
      scenario: "A Converse API application needs the model to check real-time weather data and do currency conversions during a chat, deciding when to use each tool.",
      service: "Converse API Tool Use",
      why: "Define tool specifications in the Converse API request. The model requests tool invocations, your code executes them, and you return results in the next turn. Developer-managed, not a separate agent service."
    }
  ],

  "observability": [
    {
      scenario: "An ops team needs automated Slack alerts when Bedrock error rates spike or p99 latency exceeds 3 seconds.",
      service: "CloudWatch Metrics + Alarms + SNS",
      why: "Bedrock publishes native metrics (errors, latency, token counts) to CloudWatch. Set Alarms on thresholds to trigger SNS notifications — no custom log parsing needed."
    },
    {
      scenario: "A compliance team needs the full text of every prompt and model response stored for 7 years, searchable for regulatory audits.",
      service: "Bedrock Model Invocation Logging → S3",
      why: "Captures complete request/response payloads and delivers to S3 for long-term retention. Query with Athena for investigations. CloudTrail only logs API metadata (who/when), not content."
    },
    {
      scenario: "A security team needs to investigate which IAM user called Bedrock at 2am last Tuesday and from which IP address.",
      service: "AWS CloudTrail",
      why: "Logs API call metadata: principal, timestamp, source IP, API action. It does NOT capture the prompt or response content — that's invocation logging."
    },
    {
      scenario: "A GenAI app's satisfaction scores have been slowly declining for two months, but no code, prompts, or model versions have changed.",
      service: "Continuous Evaluation with Updated Test Datasets",
      why: "Gradual decline without code changes usually means data/concept drift — real-world patterns have shifted. Regular evaluation against current test data detects this. CloudWatch metrics show infrastructure health, not content quality."
    },
    {
      scenario: "A developer needs to debug why a Guardrail blocked a specific response — was it a content filter, denied topic, or PII filter?",
      service: "GuardrailPolicyType Dimension + Trace Logging",
      why: "The GuardrailPolicyType CloudWatch dimension shows which policy category triggered. GuardrailContentSource only shows whether it was the input or output that was flagged."
    }
  ],

  "security": [
    {
      scenario: "Two teams in the same AWS account need different Bedrock model access — the ML team gets Claude Opus, app teams get Haiku only.",
      service: "IAM Condition Keys (bedrock:ModelId)",
      why: "Per-role IAM conditions restrict which model ARNs each role can invoke. Bedrock's account-level model access is all-or-nothing — IAM conditions provide per-team granularity."
    },
    {
      scenario: "An enterprise with 20 AWS accounts needs to prevent all accounts from using unauthorized Bedrock models, and account admins must not be able to override the restriction.",
      service: "Service Control Policies (SCPs)",
      why: "SCPs are organization-level permission guardrails that no account administrator can override. The only AWS mechanism that provides non-bypassable restrictions across all member accounts."
    },
    {
      scenario: "Security policy requires that all Bedrock API calls from EC2 instances in a private subnet must never traverse the public internet.",
      service: "VPC Interface Endpoint (PrivateLink)",
      why: "Creates a private connection from the VPC to Bedrock within the AWS network. NAT Gateways route through the internet gateway — that's public internet, not private."
    },
    {
      scenario: "A government agency needs vector database encryption with keys they control, rotate on schedule, and can revoke immediately if compromised.",
      service: "AWS KMS Customer-Managed Key",
      why: "The agency owns the key, sets rotation schedules, and can disable/delete it instantly. AWS-managed keys don't give the customer control over rotation or revocation."
    },
    {
      scenario: "A European company must ensure GDPR compliance — all customer data processed by Bedrock must stay within EU boundaries.",
      service: "Deploy in EU Region Only",
      why: "AWS Regions are isolated. Deploying in eu-west-1 keeps all data in the EU. Cross-Region inference must be disabled because it may route requests to non-EU Regions."
    }
  ],

  "deployment-inference": [
    {
      scenario: "Users complain about staring at a blank screen for 10 seconds while the chatbot generates a long response before anything appears.",
      service: "InvokeModelWithResponseStream + WebSocket API",
      why: "The streaming API returns tokens as they're generated. WebSocket (not REST) API Gateway enables pushing chunks to the browser in real-time. REST is synchronous — it can't stream partial responses."
    },
    {
      scenario: "A team maintains separate API integration code for Claude, Nova, and Llama — each with different request formats. Bugs appear when one integration is updated but others aren't.",
      service: "Bedrock Converse API",
      why: "Provides a unified request/response format across all models. One integration instead of three. Model-specific parameters go through additionalModelRequestFields."
    },
    {
      scenario: "A company wants to gradually migrate from Claude Sonnet to Opus, shifting 10% of traffic first and automatically rolling back if quality drops.",
      service: "Bedrock Inference Profiles",
      why: "Native traffic splitting between models with a single endpoint ARN. Adjust weights to shift traffic gradually. Pair with CloudWatch Alarms for automated rollback."
    },
    {
      scenario: "An app needs to look at a product photo and generate a marketing description — understanding both the visual content and producing persuasive text.",
      service: "Multimodal FM (single API call)",
      why: "Multimodal FMs accept image + text in one call. Chaining Rekognition labels + text FM loses visual nuance and adds an extra API call. One multimodal call is simpler and richer."
    },
    {
      scenario: "A SageMaker model needs to process 500MB research documents that take 12 minutes per inference, and the endpoint should scale to zero when idle.",
      service: "SageMaker Async Inference",
      why: "Handles payloads up to 1GB and long-running inferences. Auto-scales to zero when idle. Real-Time endpoints have a 25MB limit and no scale-to-zero."
    }
  ],

  "evaluation-metrics": [
    {
      scenario: "A team needs to measure how well their model's summaries capture the same information as human-written reference summaries.",
      service: "ROUGE",
      why: "Measures n-gram overlap between generated and reference text — the standard metric for summarization. BLEU is for translation, not summarization."
    },
    {
      scenario: "A company is choosing between three FMs for a reasoning-heavy application and needs standardized benchmarks to compare general knowledge and logic.",
      service: "MMLU / HellaSwag / ARC",
      why: "Industry-standard benchmarks: MMLU tests knowledge breadth, HellaSwag tests common-sense reasoning, ARC tests science reasoning. BLEU/ROUGE measure text similarity, not reasoning."
    },
    {
      scenario: "Automated metrics score 0.9+ but the marketing director says the AI copy 'reads like a Wikipedia article' — it lacks brand personality and emotional hooks.",
      service: "Human Evaluation (Bedrock Model Evaluation)",
      why: "Brand voice, emotional appeal, and creative tone are subjective qualities no automated metric can capture. Domain experts rate outputs on custom rubrics. Supplements, not replaces, automated metrics."
    },
    {
      scenario: "A loan summary generator uses subtly different language for different demographic groups with identical financial profiles — the team needs to address this bias.",
      service: "SageMaker Clarify (measure FIRST)",
      why: "Always quantify bias before trying to fix it. Clarify provides measurable fairness metrics across groups. Without a baseline, you can't tell if your mitigation actually helped."
    },
    {
      scenario: "A GenAI app's quality has been gradually declining for two months even though nothing in the code or model has changed.",
      service: "Continuous Evaluation (drift detection)",
      why: "Real-world query patterns shifted while the model stayed static. Periodic evaluation against updated test datasets detects this concept drift. CloudWatch only shows infrastructure health."
    }
  ],

  "responsible-ai": [
    {
      scenario: "A news org wants readers and other platforms to be able to verify whether an image was AI-generated, even if someone crops or resizes it.",
      service: "Bedrock Watermarking",
      why: "Embeds imperceptible markers in AI-generated images that survive modifications. Machine-verifiable — unlike text disclaimers, which are easily removed and not detectable by tools."
    },
    {
      scenario: "Regulators need to audit which source documents were used to generate each AI output to verify the credibility of the information.",
      service: "Output Metadata Tagging + Glue Data Catalog",
      why: "Tagging outputs with source references creates content-to-source traceability. Glue Data Catalog provides a searchable inventory of all source datasets. CloudTrail tracks API calls, not content lineage."
    },
    {
      scenario: "An audit reveals a model produces subtly biased language across demographic groups — the team needs to know the first step before implementing any fix.",
      service: "SageMaker Clarify (measure first)",
      why: "You can't fix what you haven't measured. Clarify quantifies the bias with statistical metrics, establishing a baseline so you can prove your mitigation actually reduced it."
    }
  ],

  "prompt-management": [
    {
      scenario: "A team manages 30 prompts across 5 apps and needs version control, instant rollback when a new prompt causes regressions, and a single source of truth.",
      service: "Amazon Bedrock Prompt Management",
      why: "Centralized prompt versioning with ARN-based references. Apps point to a prompt ARN — switching versions is instant, no redeployment needed. Git+CI/CD adds unnecessary deployment overhead for prompt-only changes."
    },
    {
      scenario: "A cross-functional team wants to accelerate their GenAI development workflow — auto-generating code, running tests in CI/CD, and getting real-time optimization suggestions.",
      service: "Amazon Q Developer (proactive mode)",
      why: "Use Q Developer proactively for continuous code generation, test automation in CI/CD, and real-time refactoring. Using it only at merge time or for retrospective analysis underutilizes its capabilities."
    }
  ]
};

function main() {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  let updated = 0;
  for (const cat of data.categories) {
    if (upgradedPatterns[cat.id]) {
      cat.decisionPatterns = upgradedPatterns[cat.id];
      updated++;
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`Updated decision patterns in ${updated} categories.`);
}

main();
