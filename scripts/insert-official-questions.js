#!/usr/bin/env node

/**
 * insert-official-questions.js
 *
 * Inserts 20 official AWS practice exam questions into the existing domain JSON files.
 * Each question uses the "d{domain}-op{nn}" ID format to distinguish them from
 * community-authored questions.
 *
 * Usage: node scripts/insert-official-questions.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'src', 'data', 'questions');

// ---------------------------------------------------------------------------
// All 20 questions grouped by domain
// ---------------------------------------------------------------------------

const questionsByDomain = {
  1: [
    // Q3 — d1-op01
    {
      id: "d1-op01",
      domain: 1,
      task: "1.2",
      skills: ["1.2.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "An ecommerce company has an application that uses Amazon Bedrock to generate product descriptions and recommendations. Currently, the application resides in a single AWS Region. When invoking a model in Amazon Bedrock during peak periods, the application receives an error: \"Too many requests, please wait before trying again.\" The company must increase throughput during peak periods without additional operational overhead, maintain Bedrock API compatibility, and use the same foundation model.",
      question: "Which solution will meet these requirements in the MOST cost-effective way?",
      options: [
        { id: "a", text: "Create a Lambda function that detects throttling errors and retries requests to a secondary AWS Region with the same model deployed" },
        { id: "b", text: "Enable cross-Region inference in Amazon Bedrock to automatically route requests to Regions with available capacity" },
        { id: "c", text: "Use prompt routing to distribute requests across multiple foundation models to reduce load on any single model" },
        { id: "d", text: "Purchase Provisioned Throughput for the foundation model to guarantee dedicated capacity during peak periods" }
      ],
      correctAnswers: ["b"],
      explanation: "Cross-Region inference in Amazon Bedrock automatically distributes requests across multiple AWS Regions, increasing throughput during peak periods without any additional infrastructure or operational overhead. It maintains full API compatibility and uses the same foundation model, making it the most cost-effective solution since you only pay for what you use without committing to provisioned capacity.",
      incorrectExplanations: {
        a: "A Lambda function with fallback logic to a secondary Region adds operational overhead for managing the retry logic, Region configuration, and error handling. This contradicts the requirement to avoid additional operational overhead.",
        c: "Prompt routing distributes requests across different foundation models, not the same FM. The requirement explicitly states the company must use the same foundation model, making this option non-compliant.",
        d: "Provisioned Throughput requires committing to a fixed capacity and paying regardless of actual usage. It is designed for consistent baseline throughput, not cost-effective handling of peak-period spikes."
      },
      parseStrategy: {
        keyPhrase: "MOST cost-effective way",
        eliminationHints: [
          "Lambda fallback = adds operational overhead (violates requirement)",
          "Prompt routing = uses different FMs (violates same-FM requirement)",
          "Provisioned Throughput = fixed cost regardless of usage, not cost-effective for peaks"
        ],
        decisionFramework: "When you see throttling errors + need same FM + no operational overhead + cost-effective, cross-Region inference is the built-in Bedrock feature designed for exactly this."
      },
      services: ["Amazon Bedrock", "Amazon Bedrock Cross-Region Inference"],
      examTip: "Cross-Region inference is Amazon Bedrock's native solution for handling throughput limits without provisioning dedicated capacity. It is transparent to the application and maintains API compatibility.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to handle Bedrock throttling during peak periods while keeping the same model, low cost, and minimal operational overhead.",
        testedConcepts: ["Amazon Bedrock throttling and throughput management", "Cross-Region inference", "Provisioned Throughput vs on-demand", "Cost optimization for variable workloads"],
        servicesInPlay: [
          { service: "Amazon Bedrock Cross-Region Inference", role: "Automatically routes requests to Regions with available capacity", isCorrectAnswer: true },
          { service: "AWS Lambda", role: "Distractor — adds operational overhead for retry logic", isCorrectAnswer: false },
          { service: "Amazon Bedrock Prompt Routing", role: "Distractor — routes across different FMs, not the same one", isCorrectAnswer: false },
          { service: "Amazon Bedrock Provisioned Throughput", role: "Distractor — fixed cost, not cost-effective for peak spikes", isCorrectAnswer: false }
        ],
        approachStrategy: "First, identify the constraints: same FM, no operational overhead, cost-effective. Then eliminate options that violate any constraint. Lambda adds overhead (eliminate A). Prompt routing uses different FMs (eliminate C). Provisioned Throughput is fixed cost (eliminate D). Cross-Region inference meets all constraints.",
        commonMistakes: [
          "Confusing Provisioned Throughput (dedicated capacity) with cross-Region inference (distributed on-demand)",
          "Thinking prompt routing can use the same FM — it distributes across different models",
          "Assuming custom Lambda retry logic is operationally simple"
        ],
        timeManagementTip: "The key constraint is 'same FM' — this immediately eliminates prompt routing. Then 'cost-effective' eliminates Provisioned Throughput. Quick two-step elimination."
      }
    },

    // Q9 — d1-op02
    {
      id: "d1-op02",
      domain: 1,
      task: "1.5",
      skills: ["1.5.1"],
      type: "multiple-response",
      difficulty: "hard",
      scenario: "A company is developing a RAG application by using Amazon Bedrock. The application processes customer support documents. Initially, the application retrieves many relevant documents. However, users report that the most relevant information often appears lower in the results. The company wants to improve the relevance ranking of retrieved results.",
      question: "Which combination of steps will improve the relevance of retrieved results with MINIMAL operational overhead? (Select TWO.)",
      options: [
        { id: "a", text: "Implement Amazon OpenSearch Serverless with the Learning to Rank plugin to train a custom ranking model on historical query-document relevance pairs" },
        { id: "b", text: "Deploy Amazon Aurora PostgreSQL with pgvector extension and implement custom scoring functions to re-rank results based on metadata attributes" },
        { id: "c", text: "Use Amazon Bedrock reranker models with Amazon OpenSearch Service to re-rank retrieved documents based on semantic relevance to the query" },
        { id: "d", text: "Deploy a custom reranking model on Amazon SageMaker JumpStart and integrate with Amazon Kendra Intelligent Ranking API" },
        { id: "e", text: "Configure Amazon Bedrock Knowledge Bases with hybrid search combining semantic and keyword matching, backed by Amazon OpenSearch Serverless" }
      ],
      correctAnswers: ["c", "e"],
      explanation: "Using Bedrock reranker models with OpenSearch Service provides semantic re-ranking of results with minimal operational overhead since both are managed services. Configuring Knowledge Bases with hybrid search combines the strengths of semantic similarity and keyword matching, improving relevance without custom infrastructure. Together, these two approaches address the problem from both the retrieval and re-ranking stages.",
      incorrectExplanations: {
        a: "Learning to Rank requires training a custom ranking model on historical relevance data, which adds significant operational overhead for data collection, model training, and maintenance.",
        b: "Aurora PostgreSQL with pgvector and custom scoring functions requires managing database infrastructure and writing custom ranking logic, adding operational complexity.",
        d: "Deploying a custom model on SageMaker JumpStart and integrating with Kendra Intelligent Ranking involves managing multiple services and custom integrations, increasing operational overhead."
      },
      parseStrategy: {
        keyPhrase: "MINIMAL operational overhead",
        eliminationHints: [
          "Learning to Rank = requires training data and custom model training (high overhead)",
          "Aurora + pgvector + custom scoring = database management + custom code (high overhead)",
          "SageMaker JumpStart + Kendra = multiple custom integrations (high overhead)",
          "Managed services like Bedrock reranker and Knowledge Bases = low overhead"
        ],
        decisionFramework: "For minimal overhead in RAG relevance improvement, look for managed Bedrock-native features: reranker models for re-ranking and hybrid search in Knowledge Bases for better retrieval."
      },
      services: ["Amazon Bedrock", "Amazon Bedrock Knowledge Bases", "Amazon OpenSearch Service", "Amazon OpenSearch Serverless"],
      examTip: "When a RAG app retrieves relevant documents but in the wrong order, the solution is re-ranking (Bedrock reranker) plus better retrieval (hybrid search). These are the lowest-overhead options in the Bedrock ecosystem.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to improve the ranking order of retrieved RAG results using managed services with minimal custom work.",
        testedConcepts: ["RAG retrieval quality", "Reranking models", "Hybrid search (semantic + keyword)", "Bedrock Knowledge Bases configuration", "Operational overhead comparison"],
        servicesInPlay: [
          { service: "Amazon Bedrock Reranker Models", role: "Re-rank retrieved documents by semantic relevance to the query", isCorrectAnswer: true },
          { service: "Amazon Bedrock Knowledge Bases", role: "Enable hybrid search combining semantic and keyword matching", isCorrectAnswer: true },
          { service: "Amazon OpenSearch Serverless", role: "Backing vector store for Knowledge Bases hybrid search", isCorrectAnswer: true },
          { service: "OpenSearch Learning to Rank", role: "Distractor — requires custom model training on relevance data", isCorrectAnswer: false },
          { service: "Amazon SageMaker JumpStart", role: "Distractor — custom model deployment adds overhead", isCorrectAnswer: false }
        ],
        approachStrategy: "The question says results are retrieved but poorly ranked. This is a two-part problem: (1) improve retrieval quality via hybrid search, and (2) improve ranking via reranking. Look for managed Bedrock-native solutions for both parts. Eliminate anything requiring custom training, custom code, or multiple non-Bedrock service integrations.",
        commonMistakes: [
          "Choosing Learning to Rank without recognizing the training data requirement",
          "Overlooking hybrid search as a retrieval-stage improvement",
          "Not distinguishing between retrieval quality and re-ranking quality"
        ],
        timeManagementTip: "In multi-select questions, start by eliminating the highest-overhead options first. Custom training (A), custom scoring (B), and multi-service integration (D) are all high overhead."
      }
    },

    // Q10 — d1-op03
    {
      id: "d1-op03",
      domain: 1,
      task: "1.4",
      skills: ["1.4.1"],
      type: "multiple-choice",
      difficulty: "hard",
      scenario: "A company uses an AI assistant to answer customer questions based on internal company documents. The company wants to include new documents as soon as possible and exclude deleted documents as soon as possible. Documents are stored in Amazon S3. The AI assistant uses Amazon Bedrock Knowledge Bases with S3 as the data source. A generative AI developer must create a scalable, event-driven, and resilient solution.",
      question: "Which solution will meet these requirements?",
      options: [
        { id: "a", text: "Create an Amazon EventBridge rule that runs every 5 minutes. Configure the rule to invoke an AWS Lambda function. Configure the Lambda function to track changed files and invoke the IngestKnowledgeBaseDocuments and DeleteKnowledgeBaseDocuments APIs accordingly." },
        { id: "b", text: "Configure S3 Event Notifications to directly invoke an AWS Lambda function when objects are created or deleted. Configure the Lambda function to call the IngestKnowledgeBaseDocuments and DeleteKnowledgeBaseDocuments APIs." },
        { id: "c", text: "Configure S3 Event Notifications to send messages to an Amazon SQS queue when objects are created or deleted. Create an AWS Lambda function that polls the SQS queue and invokes the IngestKnowledgeBaseDocuments and DeleteKnowledgeBaseDocuments APIs." },
        { id: "d", text: "Create an Amazon EventBridge rule that runs every 5 minutes. Configure the rule to invoke an AWS Lambda function that calls the StartIngestionJob API to resync the entire data source." }
      ],
      correctAnswers: ["c"],
      explanation: "S3 Event Notifications to SQS with Lambda polling provides an event-driven, scalable, and resilient architecture. The SQS queue acts as a buffer, ensuring no events are lost even if Lambda is temporarily unavailable. Individual document-level APIs (IngestKnowledgeBaseDocuments/DeleteKnowledgeBaseDocuments) process only changed documents rather than resyncing everything, making it efficient and near-real-time.",
      incorrectExplanations: {
        a: "EventBridge on a 5-minute schedule is not event-driven — it is poll-based. Additionally, tracking changed files adds complexity. This does not meet the event-driven requirement.",
        b: "Direct S3-to-Lambda invocation lacks resilience. If the Lambda function fails, the event is lost because there is no buffer or retry mechanism. SQS provides this durability.",
        d: "Running StartIngestionJob every 5 minutes resyncs the entire data source, which is neither event-driven nor efficient. It introduces unnecessary latency (up to 5 minutes) and processes all documents instead of only changes."
      },
      parseStrategy: {
        keyPhrase: "scalable, event-driven, and resilient",
        eliminationHints: [
          "EventBridge schedule = poll-based, not event-driven (eliminates A and D)",
          "Direct S3→Lambda = no buffer, not resilient to failures (eliminates B)",
          "StartIngestionJob = full resync, not incremental (eliminates D)",
          "SQS queue = buffer for resilience + event-driven via S3 notifications"
        ],
        decisionFramework: "Event-driven means triggered by the actual event (S3 notification), not a schedule. Resilient means no data loss on failure (SQS buffer). Scalable means handle bursts (SQS absorbs spikes)."
      },
      services: ["Amazon S3", "Amazon SQS", "AWS Lambda", "Amazon Bedrock Knowledge Bases"],
      examTip: "For event-driven architectures that must be resilient, always place a queue (SQS) between the event source and the processor. Direct invocation risks event loss on failure.",
      strategicBreakdown: {
        whatIsBeingAsked: "Design an event-driven pipeline that immediately syncs S3 document changes (additions and deletions) to a Bedrock Knowledge Base, with resilience and scalability.",
        testedConcepts: ["Event-driven architecture patterns", "S3 Event Notifications", "SQS as a resilience buffer", "Bedrock Knowledge Bases document-level APIs vs full sync", "Scalable decoupled architectures"],
        servicesInPlay: [
          { service: "Amazon S3 Event Notifications", role: "Triggers events when objects are created or deleted", isCorrectAnswer: true },
          { service: "Amazon SQS", role: "Buffers events for resilience and handles burst traffic", isCorrectAnswer: true },
          { service: "AWS Lambda", role: "Polls SQS and calls Bedrock Knowledge Base APIs", isCorrectAnswer: true },
          { service: "Amazon Bedrock Knowledge Bases", role: "Target for document ingestion and deletion via API", isCorrectAnswer: true },
          { service: "Amazon EventBridge", role: "Distractor — schedule-based polling is not event-driven", isCorrectAnswer: false }
        ],
        approachStrategy: "Check each requirement separately. Event-driven: must be triggered by S3 events, not a schedule. Resilient: must not lose events on failure. Scalable: must handle bursts. Then match the architecture pattern: S3 → SQS → Lambda → Bedrock APIs meets all three.",
        commonMistakes: [
          "Thinking direct S3→Lambda is resilient (it is not — events can be lost on Lambda failure)",
          "Confusing scheduled polling with event-driven architecture",
          "Not recognizing that StartIngestionJob resyncs everything rather than processing individual changes"
        ],
        timeManagementTip: "The three requirements (scalable, event-driven, resilient) each eliminate at least one option. Map requirements to options for fast elimination."
      }
    },

    // Q13 — d1-op04
    {
      id: "d1-op04",
      domain: 1,
      task: "1.4",
      skills: ["1.4.1"],
      type: "multiple-choice",
      difficulty: "hard",
      scenario: "A company is building a diagnostic imaging application. The application needs to perform similarity searches across 50 million images. The application must process new images daily. Similarity searches will be infrequent. The company wants a cost-effective solution with responsive search performance without infrastructure management.",
      question: "Which solution will meet these requirements MOST cost-effectively?",
      options: [
        { id: "a", text: "Use Amazon OpenSearch Serverless with vector search to store and query image embeddings" },
        { id: "b", text: "Use Amazon DynamoDB with custom AWS Lambda search logic to perform similarity matching" },
        { id: "c", text: "Use Amazon S3 vector bucket with vector indexes to store image embeddings and perform similarity searches" },
        { id: "d", text: "Use Amazon RDS for PostgreSQL with the pgvector extension to store and query image embeddings" }
      ],
      correctAnswers: ["c"],
      explanation: "Amazon S3 vector bucket with vector indexes provides a serverless, cost-effective solution for storing and searching large-scale vector data. For infrequent searches across 50 million images, S3 vector buckets avoid the cost of maintaining always-on infrastructure like OpenSearch or RDS. There is no infrastructure to manage, and you pay primarily for storage and queries.",
      incorrectExplanations: {
        a: "OpenSearch Serverless, while managed, still incurs costs for indexing and search compute units that run continuously. For infrequent queries on 50 million images, this is significantly more expensive than S3 vector buckets.",
        b: "DynamoDB is not designed for vector similarity search. Custom Lambda search logic would be complex, slow, and expensive at 50-million-image scale.",
        d: "RDS PostgreSQL with pgvector requires provisioning and managing database instances. For 50 million vectors with infrequent queries, the always-on instance cost is not cost-effective."
      },
      parseStrategy: {
        keyPhrase: "MOST cost-effectively",
        eliminationHints: [
          "Infrequent searches = always-on infrastructure is wasteful (eliminates A, D)",
          "DynamoDB + Lambda = not designed for vector similarity search (eliminates B)",
          "No infrastructure management = eliminates RDS (D) and custom Lambda logic (B)",
          "S3 vector bucket = pay per query, no infrastructure management"
        ],
        decisionFramework: "For large-scale vector search with infrequent queries and no infrastructure management, S3 vector buckets are the most cost-effective option because you avoid always-on compute costs."
      },
      services: ["Amazon S3", "Amazon S3 Vector Buckets"],
      examTip: "S3 vector buckets are a newer AWS feature designed for cost-effective vector storage and search, especially when query frequency is low. They avoid the always-on cost of OpenSearch Serverless or RDS.",
      strategicBreakdown: {
        whatIsBeingAsked: "What is the cheapest way to do vector similarity search over 50M images with infrequent queries and no infrastructure management?",
        testedConcepts: ["Vector search storage options", "S3 vector buckets", "Cost optimization for infrequent workloads", "Serverless vs always-on infrastructure", "Scale considerations for vector databases"],
        servicesInPlay: [
          { service: "Amazon S3 Vector Buckets", role: "Serverless vector storage and search with pay-per-query pricing", isCorrectAnswer: true },
          { service: "Amazon OpenSearch Serverless", role: "Distractor — continuous compute cost even for infrequent queries", isCorrectAnswer: false },
          { service: "Amazon DynamoDB", role: "Distractor — not designed for vector similarity search", isCorrectAnswer: false },
          { service: "Amazon RDS PostgreSQL (pgvector)", role: "Distractor — requires always-on instance management", isCorrectAnswer: false }
        ],
        approachStrategy: "Key factors: 50M images (large scale), infrequent searches (low query volume), no infrastructure management, cost-effective. The combination of large scale + infrequent queries makes pay-per-query models ideal. S3 vector buckets are the only option that combines serverless, pay-per-query, and no infrastructure management.",
        commonMistakes: [
          "Defaulting to OpenSearch Serverless for all vector search use cases without considering query frequency",
          "Not knowing about S3 vector buckets as a newer AWS capability",
          "Assuming DynamoDB can efficiently handle vector similarity searches"
        ],
        timeManagementTip: "The word 'infrequent' is the key differentiator. Any always-on solution is over-provisioned for infrequent queries."
      }
    },

    // Q17 — d1-op05
    {
      id: "d1-op05",
      domain: 1,
      task: "1.6",
      skills: ["1.6.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A generative AI developer is building a virtual assistant application by using Anthropic Claude on Amazon Bedrock. The application sends user queries and expects conversational responses. The developer wants to configure the application to stop generating output after a specific phrase is generated.",
      question: "Which solution will meet these requirements?",
      options: [
        { id: "a", text: "Add a trigger phrase to the end of the user prompt instructing the model to stop generating after the phrase appears in the output" },
        { id: "b", text: "Use the stop sequences inference parameter to specify the phrase that signals the model to stop generating output" },
        { id: "c", text: "Use the top-k inference parameter to limit the number of tokens the model considers, causing it to stop at the desired phrase" },
        { id: "d", text: "Use the temperature inference parameter set to 0 to make the model deterministic and stop at the specific phrase" }
      ],
      correctAnswers: ["b"],
      explanation: "The stop sequences parameter is specifically designed for this purpose. When the model generates text that matches one of the configured stop sequences, it immediately stops generating further output. This is a standard inference parameter supported across Bedrock models.",
      incorrectExplanations: {
        a: "Adding a trigger phrase to the prompt is unreliable. The model may or may not follow the instruction, and there is no guarantee it will stop at exactly the right point. Stop sequences provide deterministic control.",
        c: "The top-k parameter controls the number of most probable tokens considered during sampling. It affects randomness/diversity of output, not when the model stops generating.",
        d: "Temperature controls the randomness of token selection. Setting it to 0 makes output deterministic but does not cause the model to stop at any specific phrase."
      },
      parseStrategy: {
        keyPhrase: "stop generating output after a specific phrase",
        eliminationHints: [
          "Prompt-based instructions = unreliable, not deterministic (eliminates A)",
          "top-k = controls token diversity, not stopping (eliminates C)",
          "temperature = controls randomness, not stopping (eliminates D)",
          "stop sequences = designed exactly for stopping at a phrase"
        ],
        decisionFramework: "When you need to stop generation at a specific phrase, the answer is always stop sequences. This is the only inference parameter that controls when generation terminates."
      },
      services: ["Amazon Bedrock", "Anthropic Claude"],
      examTip: "Know your inference parameters: temperature (randomness), top-k (token diversity), top-p (nucleus sampling), max tokens (length limit), and stop sequences (stop at specific text). Each has a distinct purpose.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which inference parameter makes a model stop generating when it produces a specific phrase?",
        testedConcepts: ["Bedrock inference parameters", "Stop sequences", "Temperature vs top-k vs top-p", "Controlling model output behavior"],
        servicesInPlay: [
          { service: "Amazon Bedrock (Stop Sequences)", role: "Inference parameter that terminates generation at a specified phrase", isCorrectAnswer: true },
          { service: "Amazon Bedrock (Temperature)", role: "Distractor — controls randomness, not stopping behavior", isCorrectAnswer: false },
          { service: "Amazon Bedrock (Top-K)", role: "Distractor — controls token diversity, not stopping behavior", isCorrectAnswer: false }
        ],
        approachStrategy: "This is a knowledge-recall question about inference parameters. Map each parameter to its function: stop sequences = stop at phrase, temperature = randomness, top-k = token pool size, top-p = cumulative probability cutoff. Only stop sequences controls when generation terminates.",
        commonMistakes: [
          "Confusing top-k with max tokens — top-k controls sampling diversity, max tokens controls length",
          "Thinking temperature = 0 creates stopping behavior (it only makes output deterministic)",
          "Relying on prompt engineering when a deterministic API parameter exists"
        ],
        timeManagementTip: "This is a straightforward knowledge question. If you know your inference parameters, answer immediately and move on. Do not overthink it."
      }
    }
  ],

  2: [
    // Q1 — d2-op01
    {
      id: "d2-op01",
      domain: 2,
      task: "2.2",
      skills: ["2.2.1"],
      type: "multiple-response",
      difficulty: "hard",
      scenario: "A financial services company is developing a research agent that processes complex financial data queries. The company must deploy existing Python agent code to Amazon Bedrock AgentCore Runtime. The company wants to reduce infrastructure management overhead. The agent must handle quick data lookups (sub-second) and comprehensive research report generation (streaming over several minutes). The solution must automatically manage HTTP server configuration, endpoint routing, and health monitoring.",
      question: "Which deployment approaches will meet these requirements with MINIMAL operational overhead? (Select TWO.)",
      options: [
        { id: "a", text: "Deploy the agent code as a FastAPI server with custom /invocations and /ping endpoints in a Docker container managed by the team" },
        { id: "b", text: "Use the Amazon Bedrock AgentCore SDK with the @app.entrypoint decorator to define the agent logic, allowing the SDK to handle server setup and routing" },
        { id: "c", text: "Deploy the agent on Amazon ECS on AWS Fargate with a custom container and Application Load Balancer for routing and health checks" },
        { id: "d", text: "Deploy the agent using Amazon SageMaker AI real-time endpoints with a custom inference container" },
        { id: "e", text: "Use the Amazon Bedrock AgentCore starter toolkit to scaffold the project structure, configuration, and deployment pipeline" }
      ],
      correctAnswers: ["b", "e"],
      explanation: "The AgentCore SDK with @app.entrypoint decorator automatically handles HTTP server configuration, endpoint routing, and health monitoring — eliminating the need for manual server setup. The AgentCore starter toolkit scaffolds the project structure and deployment pipeline, accelerating development. Together, they provide the lowest operational overhead for deploying Python agent code to AgentCore Runtime.",
      incorrectExplanations: {
        a: "A custom FastAPI server requires manually implementing endpoints, health checks, and server configuration. This adds operational overhead that the AgentCore SDK handles automatically.",
        c: "ECS on Fargate with ALB requires managing container definitions, load balancer configuration, target groups, and health check settings. This is significantly more operational overhead than AgentCore.",
        d: "SageMaker real-time endpoints are designed for ML model inference, not general agent deployment. They require custom inference containers and do not natively support the streaming-over-minutes pattern needed for research reports."
      },
      parseStrategy: {
        keyPhrase: "MINIMAL operational overhead",
        eliminationHints: [
          "Custom FastAPI server = manual endpoint management (eliminates A)",
          "ECS + Fargate + ALB = infrastructure management overhead (eliminates C)",
          "SageMaker endpoints = wrong service for agent deployment (eliminates D)",
          "AgentCore SDK + starter toolkit = purpose-built for this use case"
        ],
        decisionFramework: "When deploying to AgentCore Runtime, use AgentCore-native tools: the SDK for code-level integration and the starter toolkit for project scaffolding. These are purpose-built for minimal overhead."
      },
      services: ["Amazon Bedrock AgentCore Runtime", "Amazon Bedrock AgentCore SDK"],
      examTip: "Amazon Bedrock AgentCore SDK and starter toolkit are the lowest-overhead options for deploying agent code to AgentCore Runtime. The SDK auto-manages server config, routing, and health checks.",
      strategicBreakdown: {
        whatIsBeingAsked: "What are the two lowest-overhead ways to deploy Python agent code to Amazon Bedrock AgentCore Runtime with automatic server management?",
        testedConcepts: ["Amazon Bedrock AgentCore Runtime", "AgentCore SDK decorators", "AgentCore starter toolkit", "Agent deployment patterns", "Operational overhead comparison"],
        servicesInPlay: [
          { service: "Amazon Bedrock AgentCore SDK", role: "Provides @app.entrypoint decorator for automatic server setup, routing, and health monitoring", isCorrectAnswer: true },
          { service: "Amazon Bedrock AgentCore Starter Toolkit", role: "Scaffolds project structure, configuration, and deployment pipeline", isCorrectAnswer: true },
          { service: "FastAPI", role: "Distractor — requires manual server and endpoint management", isCorrectAnswer: false },
          { service: "Amazon ECS on Fargate", role: "Distractor — adds infrastructure management overhead", isCorrectAnswer: false },
          { service: "Amazon SageMaker AI", role: "Distractor — designed for ML inference, not agent deployment", isCorrectAnswer: false }
        ],
        approachStrategy: "The question specifies deploying to AgentCore Runtime. Look for AgentCore-native tools that reduce overhead. The SDK handles runtime concerns automatically, and the starter toolkit handles project setup. All other options require manual infrastructure or endpoint management.",
        commonMistakes: [
          "Choosing FastAPI because it is familiar, without recognizing AgentCore SDK handles the same concerns automatically",
          "Selecting ECS/Fargate as a 'serverless' option without recognizing the infrastructure management it still requires",
          "Confusing SageMaker inference endpoints with AgentCore Runtime"
        ],
        timeManagementTip: "When the question names a specific AWS service (AgentCore Runtime), prioritize answers that use native tools for that service. Eliminate generic infrastructure options."
      }
    },

    // Q2 — d2-op02
    {
      id: "d2-op02",
      domain: 2,
      task: "2.5",
      skills: ["2.5.1"],
      type: "multiple-response",
      difficulty: "medium",
      scenario: "A cross-functional team is developing a generative AI application. The team needs to optimize developer productivity and enforce consistent integration patterns. The team needs to automate performance tuning and accelerate AI testing across multiple business units. The team wants to use Amazon Q Developer.",
      question: "Which combination of steps will meet these requirements? (Select TWO.)",
      options: [
        { id: "a", text: "Configure Amazon Q Developer for automated security scanning and require mandatory manual code review for every generated suggestion" },
        { id: "b", text: "Use Amazon Q Developer exclusively for retrospective code analysis after deployment to identify improvement opportunities" },
        { id: "c", text: "Configure Amazon Q Developer to provide real-time code generation, automated refactoring suggestions, API integration guidance, and performance optimization recommendations during development" },
        { id: "d", text: "Restrict Amazon Q Developer usage to only the merge phase of the development pipeline to enforce consistency" },
        { id: "e", text: "Integrate Amazon Q Developer automated test generation capabilities into the CI/CD pipeline to accelerate testing across business units" }
      ],
      correctAnswers: ["c", "e"],
      explanation: "Configuring Q Developer for real-time code generation, refactoring, API guidance, and performance optimization directly addresses the productivity and consistency requirements during development. Integrating Q Developer's automated test generation into CI/CD accelerates testing across business units. Together, these cover the full development lifecycle from coding to testing.",
      incorrectExplanations: {
        a: "While security scanning is useful, mandatory manual review for every suggestion defeats the productivity optimization goal. This approach creates bottlenecks instead of accelerating development.",
        b: "Retrospective-only analysis misses the opportunity to improve productivity during development. Q Developer is most valuable when used in real-time, not just after deployment.",
        d: "Restricting to merge-only usage ignores the productivity benefits during active development. Developers benefit most from real-time suggestions while writing code, not just at merge time."
      },
      parseStrategy: {
        keyPhrase: "optimize developer productivity and enforce consistent integration patterns",
        eliminationHints: [
          "Mandatory manual review = bottleneck, hurts productivity (eliminates A)",
          "Retrospective only = misses real-time benefits (eliminates B)",
          "Merge-phase only = ignores development-time benefits (eliminates D)",
          "Real-time guidance + CI/CD test generation = full lifecycle coverage"
        ],
        decisionFramework: "For developer productivity, Q Developer must be active during development (real-time), not just at review or merge time. For testing acceleration, integrate into CI/CD pipeline."
      },
      services: ["Amazon Q Developer"],
      examTip: "Amazon Q Developer provides maximum value when used throughout the development lifecycle — real-time code generation during development and automated testing in CI/CD. Restricting it to a single phase reduces its benefits.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to use Amazon Q Developer to maximize developer productivity and testing automation across a multi-team organization?",
        testedConcepts: ["Amazon Q Developer capabilities", "Developer productivity optimization", "CI/CD integration", "Automated testing", "GenAI-assisted development workflows"],
        servicesInPlay: [
          { service: "Amazon Q Developer (Real-time)", role: "Provides code generation, refactoring, API guidance, and performance optimization during development", isCorrectAnswer: true },
          { service: "Amazon Q Developer (CI/CD Testing)", role: "Automates test generation and integrates into CI/CD pipeline", isCorrectAnswer: true }
        ],
        approachStrategy: "Map the requirements: productivity → real-time assistance during coding. Consistent patterns → automated guidance. Performance tuning → optimization recommendations. Testing acceleration → CI/CD integration. Then select the options that cover all requirements across the development lifecycle.",
        commonMistakes: [
          "Thinking mandatory manual review is always required for AI-generated code — this creates productivity bottlenecks",
          "Limiting Q Developer to one phase of development instead of using it throughout the lifecycle",
          "Confusing retrospective analysis with proactive real-time guidance"
        ],
        timeManagementTip: "Focus on which options directly address 'productivity' and 'testing acceleration.' Anything that adds friction (mandatory review, phase restrictions) works against the stated goals."
      }
    },

    // Q5 — d2-op03
    {
      id: "d2-op03",
      domain: 2,
      task: "2.3",
      skills: ["2.3.1"],
      type: "multiple-response",
      difficulty: "hard",
      scenario: "A company needs to implement secure authentication for a third-party application that accesses Amazon Bedrock. The solution must integrate with the company's existing identity provider (IdP), maintain comprehensive audit logs, eliminate long-lived credentials, and provide temporary access to AWS resources.",
      question: "Which solutions will meet these requirements? (Select TWO.)",
      options: [
        { id: "a", text: "Configure OIDC federation with Amazon Cognito to integrate with the existing IdP and issue temporary AWS credentials through Cognito identity pools" },
        { id: "b", text: "Set up an Amazon API Gateway with a Lambda authorizer that validates credentials against an LDAP directory and generates session tokens" },
        { id: "c", text: "Create individual IAM users for each employee and use AWS Secrets Manager to automatically rotate their access keys on a regular schedule" },
        { id: "d", text: "Configure an IAM role with STS AssumeRole permissions but store IAM user credentials in the application configuration file for initial authentication" },
        { id: "e", text: "Set up IAM Identity Center with SAML federation to the existing IdP and configure permission sets for Amazon Bedrock access" }
      ],
      correctAnswers: ["a", "e"],
      explanation: "OIDC federation with Amazon Cognito integrates with existing IdPs and provides temporary credentials through identity pools, eliminating long-lived credentials. IAM Identity Center with SAML federation provides enterprise-grade SSO integration with the existing IdP and uses temporary credentials via permission sets. Both solutions support audit logging through CloudTrail and eliminate long-lived credentials.",
      incorrectExplanations: {
        b: "API Gateway with Lambda authorizer and LDAP is a custom solution that requires managing LDAP infrastructure and custom authorization logic. It does not natively integrate with AWS IAM for temporary credential issuance.",
        c: "Creating individual IAM users with rotated access keys still uses long-lived credentials (even if rotated). The requirement explicitly states to eliminate long-lived credentials entirely, not just rotate them.",
        d: "Storing IAM credentials in a configuration file directly contradicts the requirement to eliminate long-lived credentials. Even with STS AssumeRole, the initial IAM credentials in the config file are a security risk."
      },
      parseStrategy: {
        keyPhrase: "eliminate long-lived credentials",
        eliminationHints: [
          "IAM users + Secrets Manager rotation = still long-lived credentials (eliminates C)",
          "IAM credentials in config file = long-lived credentials stored insecurely (eliminates D)",
          "LDAP + Lambda authorizer = custom solution, not native AWS identity integration (eliminates B)",
          "OIDC/Cognito and SAML/Identity Center = federated, temporary credentials"
        ],
        decisionFramework: "For eliminating long-lived credentials with IdP integration, use federation (OIDC or SAML) with services that issue temporary credentials (Cognito identity pools or IAM Identity Center)."
      },
      services: ["Amazon Cognito", "IAM Identity Center", "AWS IAM", "AWS STS"],
      examTip: "When a question requires IdP integration + no long-lived credentials, look for federation (OIDC or SAML) with temporary credential services. IAM users and stored credentials always violate the 'eliminate long-lived credentials' requirement.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which two solutions provide federated authentication with an existing IdP, audit logging, and temporary credentials for Bedrock access?",
        testedConcepts: ["Identity federation (OIDC, SAML)", "Temporary vs long-lived credentials", "Amazon Cognito identity pools", "IAM Identity Center", "AWS security best practices"],
        servicesInPlay: [
          { service: "Amazon Cognito (OIDC Federation)", role: "Integrates with IdP via OIDC and issues temporary AWS credentials", isCorrectAnswer: true },
          { service: "IAM Identity Center (SAML Federation)", role: "Provides SSO with IdP integration and temporary permission sets", isCorrectAnswer: true },
          { service: "API Gateway + Lambda", role: "Distractor — custom auth solution, not native federation", isCorrectAnswer: false },
          { service: "IAM Users + Secrets Manager", role: "Distractor — still uses long-lived credentials even with rotation", isCorrectAnswer: false },
          { service: "IAM + STS", role: "Distractor — storing IAM creds in config violates security requirements", isCorrectAnswer: false }
        ],
        approachStrategy: "Apply each requirement as a filter: (1) IdP integration → federation required. (2) No long-lived credentials → eliminates IAM users and stored creds. (3) Temporary access → STS or Cognito identity pools or Identity Center permission sets. (4) Audit logs → CloudTrail integration. Only OIDC/Cognito and SAML/Identity Center satisfy all four.",
        commonMistakes: [
          "Thinking rotated access keys are not long-lived — they are, just regularly replaced",
          "Confusing STS AssumeRole with eliminating long-lived credentials — you still need initial credentials to assume a role",
          "Selecting LDAP/Lambda because it 'integrates with an existing directory' without recognizing it is not native AWS federation"
        ],
        timeManagementTip: "The phrase 'eliminate long-lived credentials' is an instant filter. Any option with IAM users, access keys, or stored credentials is immediately eliminated."
      }
    },

    // Q12 — d2-op04
    {
      id: "d2-op04",
      domain: 2,
      task: "2.4",
      skills: ["2.4.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A news media company wants to build a content conformance tool that reviews articles against a style guide. Journalists need a web-based editor with real-time analysis. When they click \"analyze,\" the system should immediately begin providing suggested revisions. Articles are tagged with content categories in metadata. The company wants the LEAST operational overhead.",
      question: "Which architecture will meet these requirements with the LEAST operational overhead?",
      options: [
        { id: "a", text: "Configure an Amazon SQS queue to receive article submissions. Use AWS Step Functions to orchestrate analysis. Use an AWS Lambda function to invoke Amazon Bedrock. Store results in Amazon DynamoDB. Use an API Gateway WebSocket API to push results to the editor." },
        { id: "b", text: "Create an Amazon API Gateway WebSocket API. Use an AWS Lambda function to retrieve style guide prompts from Amazon Bedrock Prompt Management and invoke the Amazon Bedrock streaming API to return real-time revisions to the connected editor." },
        { id: "c", text: "Deploy an Amazon API Gateway REST API with AWS Lambda function URLs. Configure the Lambda function to invoke Amazon Bedrock with chunked transfer encoding to stream partial responses back to the editor." },
        { id: "d", text: "Set up an Application Load Balancer with Amazon ECS custom containers. Implement server-sent events for streaming Amazon Bedrock responses. Configure WebSocket connections through a custom middleware layer." }
      ],
      correctAnswers: ["b"],
      explanation: "API Gateway WebSocket API with Lambda invoking Bedrock's streaming API provides real-time streaming of revisions directly to the editor with minimal operational overhead. Bedrock Prompt Management stores style guide prompts as managed templates. This architecture uses only serverless managed services with no custom infrastructure.",
      incorrectExplanations: {
        a: "SQS + Step Functions + DynamoDB adds unnecessary complexity. The asynchronous queue-based approach contradicts the real-time streaming requirement. Multiple services increase operational overhead.",
        c: "REST APIs with chunked transfer encoding do not provide true real-time streaming. REST APIs are request-response based and Lambda function URLs add configuration complexity for this use case.",
        d: "ECS custom containers with ALB and custom WebSocket middleware require managing container infrastructure, load balancer configuration, and custom middleware code — significantly more operational overhead than serverless alternatives."
      },
      parseStrategy: {
        keyPhrase: "LEAST operational overhead",
        eliminationHints: [
          "SQS + Step Functions + DynamoDB = too many services, async pattern (eliminates A)",
          "REST API + chunked encoding = not true streaming (eliminates C)",
          "ECS + ALB + custom middleware = infrastructure management (eliminates D)",
          "WebSocket API + Lambda + Bedrock streaming = serverless real-time"
        ],
        decisionFramework: "For real-time streaming with least overhead: WebSocket API (serverless bidirectional) + Lambda (serverless compute) + Bedrock streaming API (managed FM). All serverless, minimal moving parts."
      },
      services: ["Amazon API Gateway", "AWS Lambda", "Amazon Bedrock", "Amazon Bedrock Prompt Management"],
      examTip: "For real-time streaming to clients, API Gateway WebSocket API + Bedrock streaming is the lowest-overhead pattern. Avoid queue-based architectures when immediate streaming is required.",
      strategicBreakdown: {
        whatIsBeingAsked: "What is the simplest serverless architecture for streaming real-time AI-generated content to a web editor?",
        testedConcepts: ["Real-time streaming architectures", "API Gateway WebSocket API", "Amazon Bedrock streaming API", "Bedrock Prompt Management", "Serverless vs container-based architectures"],
        servicesInPlay: [
          { service: "Amazon API Gateway WebSocket API", role: "Provides bidirectional real-time connection to the web editor", isCorrectAnswer: true },
          { service: "AWS Lambda", role: "Retrieves prompt templates and invokes Bedrock streaming API", isCorrectAnswer: true },
          { service: "Amazon Bedrock Streaming API", role: "Generates streaming revisions in real-time", isCorrectAnswer: true },
          { service: "Amazon Bedrock Prompt Management", role: "Stores managed style guide prompt templates", isCorrectAnswer: true },
          { service: "Amazon SQS + Step Functions", role: "Distractor — async pattern, not real-time", isCorrectAnswer: false },
          { service: "Amazon ECS", role: "Distractor — requires infrastructure management", isCorrectAnswer: false }
        ],
        approachStrategy: "The two key requirements are 'real-time' (streaming) and 'least operational overhead' (serverless). Identify the serverless streaming pattern: WebSocket API + Lambda + Bedrock streaming. Eliminate async patterns (SQS) and infrastructure-heavy options (ECS).",
        commonMistakes: [
          "Choosing SQS-based architecture for a real-time use case — SQS is for asynchronous processing",
          "Thinking REST APIs support true streaming — they are request-response based",
          "Overlooking Bedrock Prompt Management as a managed prompt template store"
        ],
        timeManagementTip: "Real-time + least overhead = WebSocket + serverless. If you see these keywords, jump to the serverless streaming option."
      }
    },

    // Q16 — d2-op05
    {
      id: "d2-op05",
      domain: 2,
      task: "2.2",
      skills: ["2.2.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A generative AI developer tested a pre-trained Hugging Face model using Amazon SageMaker JumpStart. The developer now needs to deploy the model for on-demand image generation. The deployment must use GPU instances, handle text datasets up to 50 MB per request, and return responses within 15 minutes.",
      question: "Which deployment strategy will meet these requirements?",
      options: [
        { id: "a", text: "Deploy the model using Amazon SageMaker Asynchronous Inference with accelerated computing instances" },
        { id: "b", text: "Deploy the model using Amazon SageMaker Serverless Inference with general-purpose instances" },
        { id: "c", text: "Deploy the model using Amazon SageMaker Real-Time Inference with accelerated computing instances" },
        { id: "d", text: "Deploy the model using Amazon SageMaker batch transform with accelerated computing instances" }
      ],
      correctAnswers: ["a"],
      explanation: "SageMaker Asynchronous Inference is designed for large payloads (up to 1 GB) and long processing times (up to 15 minutes). It supports GPU (accelerated computing) instances, making it ideal for image generation workloads with 50 MB inputs. Requests are queued and processed asynchronously, with results stored in S3.",
      incorrectExplanations: {
        b: "SageMaker Serverless Inference does not support GPU instances — it only runs on general-purpose (CPU) instances. Additionally, it has payload size limits and timeout constraints that may not accommodate 50 MB inputs and 15-minute processing.",
        c: "SageMaker Real-Time Inference has a 60-second timeout for responses. A 15-minute processing requirement exceeds this limit. Real-time inference is designed for sub-second to low-latency responses.",
        d: "SageMaker batch transform is designed for offline batch processing of large datasets, not on-demand individual requests. It processes entire datasets as jobs, not individual inference requests."
      },
      parseStrategy: {
        keyPhrase: "50 MB per request and responses within 15 minutes",
        eliminationHints: [
          "Serverless Inference = no GPU support (eliminates B)",
          "Real-Time Inference = 60-second timeout limit (eliminates C)",
          "Batch transform = offline batch processing, not on-demand (eliminates D)",
          "Asynchronous Inference = large payloads + long timeouts + GPU support"
        ],
        decisionFramework: "Match SageMaker inference types to requirements: payload size, timeout, GPU support, and on-demand vs batch. Asynchronous Inference is the only option that supports all four requirements."
      },
      services: ["Amazon SageMaker", "Amazon SageMaker Asynchronous Inference"],
      examTip: "Know the SageMaker inference types: Real-Time (sub-60s, small payloads), Serverless (CPU only, auto-scaling), Asynchronous (large payloads, up to 15 min, GPU), Batch Transform (offline bulk processing).",
      strategicBreakdown: {
        whatIsBeingAsked: "Which SageMaker inference type supports GPU instances, 50 MB payloads, and 15-minute processing for on-demand requests?",
        testedConcepts: ["SageMaker inference types comparison", "Asynchronous Inference capabilities", "GPU instance requirements", "Payload size and timeout limits"],
        servicesInPlay: [
          { service: "SageMaker Asynchronous Inference", role: "Handles large payloads (up to 1 GB), long processing (up to 15 min), and supports GPU instances", isCorrectAnswer: true },
          { service: "SageMaker Serverless Inference", role: "Distractor — no GPU support, limited payload size and timeout", isCorrectAnswer: false },
          { service: "SageMaker Real-Time Inference", role: "Distractor — 60-second timeout limit, too short for 15-minute processing", isCorrectAnswer: false },
          { service: "SageMaker Batch Transform", role: "Distractor — offline batch processing, not on-demand individual requests", isCorrectAnswer: false }
        ],
        approachStrategy: "Create a mental table of SageMaker inference types and their limits. Then check each requirement against each type. Only Asynchronous Inference meets all three: GPU support, large payload, and long timeout.",
        commonMistakes: [
          "Choosing Real-Time Inference for all on-demand use cases without checking the timeout limit",
          "Assuming Serverless Inference supports GPUs (it does not)",
          "Confusing batch transform (offline jobs) with asynchronous inference (on-demand with queue)"
        ],
        timeManagementTip: "The 15-minute timeout is the key constraint. Real-Time maxes out at 60 seconds, so it is immediately eliminated. Then GPU eliminates Serverless, and on-demand eliminates Batch."
      }
    },

    // Q18 — d2-op06
    {
      id: "d2-op06",
      domain: 2,
      task: "2.5",
      skills: ["2.5.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A company wants to create an application to analyze fashion trends. The application must analyze videos and photos from public fashion shows. The application must store extracted information and provide a dashboard summarizing fashion trends. The company wants the LEAST operational overhead.",
      question: "Which solution will meet these requirements with the LEAST operational overhead?",
      options: [
        { id: "a", text: "Use Amazon EventBridge to schedule analysis jobs. Use AWS Lambda to process media files with Amazon Bedrock. Display results using Amazon QuickSight Q natural language queries." },
        { id: "b", text: "Use AWS Step Functions to orchestrate the workflow. Use Amazon Bedrock multimodal foundation models to analyze videos and photos. Store extracted data in Amazon S3. Create a dashboard using Amazon QuickSight." },
        { id: "c", text: "Use Amazon Rekognition Custom Labels to train a custom model for fashion detection. Store results in Amazon DynamoDB. Create dashboards using Amazon Managed Grafana." },
        { id: "d", text: "Use Anthropic Claude on Amazon Bedrock to generate text descriptions of fashion items. Use Stable Diffusion to generate comparison images. Store data in Amazon OpenSearch Service. Build dashboards using Grafana." }
      ],
      correctAnswers: ["b"],
      explanation: "Step Functions orchestrating Bedrock multimodal FMs provides a fully managed workflow for analyzing both videos and photos. Bedrock multimodal models can directly process visual content without custom model training. S3 provides durable storage, and QuickSight provides managed dashboards. All components are serverless or fully managed, minimizing operational overhead.",
      incorrectExplanations: {
        a: "While EventBridge + Lambda + Bedrock works for processing, QuickSight Q (natural language queries) is not a dashboard — it is a query interface. The question asks for a dashboard summarizing trends, not ad-hoc queries. Also, Lambda may not handle large video files within timeout limits.",
        c: "Rekognition Custom Labels requires training a custom model on labeled fashion data, which adds significant operational overhead. DynamoDB + Managed Grafana adds complexity compared to S3 + QuickSight.",
        d: "Using Claude for text descriptions + Stable Diffusion for comparison images is unnecessarily complex. OpenSearch + Grafana requires managing infrastructure. This combines too many services with high operational overhead."
      },
      parseStrategy: {
        keyPhrase: "LEAST operational overhead",
        eliminationHints: [
          "Custom model training (Rekognition Custom Labels) = high overhead (eliminates C)",
          "Multiple specialized models + OpenSearch + Grafana = complex architecture (eliminates D)",
          "QuickSight Q ≠ dashboard (eliminates A for requirement mismatch)",
          "Step Functions + Bedrock multimodal + S3 + QuickSight = all managed, no custom training"
        ],
        decisionFramework: "For media analysis with least overhead: use multimodal FMs (no custom training) + managed orchestration (Step Functions) + managed dashboards (QuickSight). Avoid custom model training and self-managed infrastructure."
      },
      services: ["AWS Step Functions", "Amazon Bedrock", "Amazon S3", "Amazon QuickSight"],
      examTip: "Bedrock multimodal FMs eliminate the need for Rekognition Custom Labels when you need flexible visual analysis. Multimodal models can analyze both images and video without custom training.",
      strategicBreakdown: {
        whatIsBeingAsked: "What is the simplest end-to-end architecture for analyzing fashion show media (video + photos) and displaying trend dashboards?",
        testedConcepts: ["Multimodal foundation models", "Step Functions orchestration", "Managed dashboard solutions", "Custom model training vs pre-trained FMs", "Operational overhead comparison"],
        servicesInPlay: [
          { service: "AWS Step Functions", role: "Orchestrates the analysis workflow", isCorrectAnswer: true },
          { service: "Amazon Bedrock (Multimodal FMs)", role: "Analyzes videos and photos without custom training", isCorrectAnswer: true },
          { service: "Amazon S3", role: "Stores extracted fashion trend data", isCorrectAnswer: true },
          { service: "Amazon QuickSight", role: "Provides managed dashboard for trend visualization", isCorrectAnswer: true },
          { service: "Amazon Rekognition Custom Labels", role: "Distractor — requires custom model training", isCorrectAnswer: false },
          { service: "Stable Diffusion", role: "Distractor — image generation not needed for analysis", isCorrectAnswer: false }
        ],
        approachStrategy: "Evaluate each option for total number of custom components and training requirements. Option B uses only managed services with no custom training. All others require custom models, custom infrastructure, or mismatched services.",
        commonMistakes: [
          "Defaulting to Rekognition for image analysis without considering multimodal FMs as a simpler alternative",
          "Confusing QuickSight Q (NL query) with QuickSight dashboards",
          "Overcomplicating the architecture with Stable Diffusion for a use case that only needs analysis, not generation"
        ],
        timeManagementTip: "Count the number of custom or self-managed components in each option. The option with the fewest custom components typically has the least operational overhead."
      }
    }
  ],

  3: [
    // Q7 — d3-op01
    {
      id: "d3-op01",
      domain: 3,
      task: "3.1",
      skills: ["3.1.1"],
      type: "multiple-choice",
      difficulty: "hard",
      scenario: "A company is developing an AI assistant using Amazon Bedrock with multiple guardrails, including prompt injection detection, sensitive information filtering, and denied topic blocking. When queries are blocked, a developer needs detailed analysis of which guardrail rule was invoked and why content was flagged.",
      question: "Which configuration provides the MOST detailed analysis of guardrail decision-making for content filtering?",
      options: [
        { id: "a", text: "Enable Amazon Bedrock model evaluation with guardrail assessment metrics to analyze guardrail performance across test datasets" },
        { id: "b", text: "Enable invocation logging and configure Amazon CloudWatch alarms on the InvocationsIntervened metric filtered by the GuardrailContentSource dimension" },
        { id: "c", text: "Enable guardrail tracing by setting trace to enabled in the API request and monitor the InvocationsIntervened metric with the GuardrailContentSource dimension" },
        { id: "d", text: "Enable guardrail tracing by setting trace to enabled in the API request and monitor the InvocationsIntervened metric with the GuardrailPolicyType dimensions" }
      ],
      correctAnswers: ["d"],
      explanation: "Guardrail tracing with {trace: enabled} provides detailed per-request analysis showing exactly which guardrail rules were triggered and why content was flagged. The InvocationsIntervened metric with GuardrailPolicyType dimensions shows which type of policy (content filter, denied topic, sensitive info, etc.) intervened. This combination provides the most detailed analysis of guardrail decision-making.",
      incorrectExplanations: {
        a: "Model evaluation with guardrail assessment provides aggregate performance metrics across test datasets, not detailed per-request analysis of which specific rule was invoked. This is for evaluation, not real-time debugging.",
        b: "Invocation logging captures request/response data but does not include the detailed guardrail trace showing which specific rule was triggered. CloudWatch alarms on InvocationsIntervened by GuardrailContentSource only shows whether the input or output was blocked, not which policy type was responsible.",
        c: "GuardrailContentSource dimension only differentiates between INPUT and OUTPUT content. GuardrailPolicyType dimensions provide more granular detail about which specific policy type (content filter, denied topic, sensitive info, word filter) was triggered."
      },
      parseStrategy: {
        keyPhrase: "MOST detailed analysis of guardrail decision-making",
        eliminationHints: [
          "Model evaluation = aggregate metrics, not per-request detail (eliminates A)",
          "Invocation logging without trace = no guardrail trace detail (eliminates B)",
          "GuardrailContentSource = only INPUT vs OUTPUT (eliminates C)",
          "GuardrailPolicyType = which policy type triggered (most detailed)"
        ],
        decisionFramework: "For detailed guardrail analysis: trace:enabled gives per-request detail, and GuardrailPolicyType dimensions give which policy type intervened. Together they provide the most granular view."
      },
      services: ["Amazon Bedrock", "Amazon Bedrock Guardrails", "Amazon CloudWatch"],
      examTip: "GuardrailPolicyType is more granular than GuardrailContentSource. PolicyType tells you WHICH rule triggered (content filter, denied topic, etc.), while ContentSource only tells you WHETHER input or output was blocked.",
      strategicBreakdown: {
        whatIsBeingAsked: "What combination of Bedrock guardrail monitoring features provides the most granular detail about why content was blocked?",
        testedConcepts: ["Bedrock guardrail tracing", "CloudWatch metric dimensions for guardrails", "GuardrailPolicyType vs GuardrailContentSource", "Monitoring and debugging guardrail behavior"],
        servicesInPlay: [
          { service: "Amazon Bedrock Guardrail Tracing", role: "Provides per-request detail about which guardrail rules were triggered", isCorrectAnswer: true },
          { service: "CloudWatch InvocationsIntervened (GuardrailPolicyType)", role: "Metric dimension showing which policy type intervened", isCorrectAnswer: true },
          { service: "Amazon Bedrock Model Evaluation", role: "Distractor — aggregate evaluation, not per-request debugging", isCorrectAnswer: false },
          { service: "CloudWatch InvocationsIntervened (GuardrailContentSource)", role: "Distractor — only shows INPUT vs OUTPUT, less granular", isCorrectAnswer: false }
        ],
        approachStrategy: "The question asks for 'MOST detailed analysis.' Compare the two dimensions: GuardrailContentSource (INPUT/OUTPUT) vs GuardrailPolicyType (content filter, denied topic, sensitive info, word filter). PolicyType is clearly more granular. Both C and D use trace:enabled, so the differentiator is the metric dimension.",
        commonMistakes: [
          "Confusing GuardrailContentSource (INPUT/OUTPUT direction) with GuardrailPolicyType (which policy triggered)",
          "Thinking invocation logging alone provides guardrail trace detail — you need trace:enabled",
          "Choosing model evaluation for debugging (it is for aggregate performance assessment)"
        ],
        timeManagementTip: "Options C and D are nearly identical — the only difference is the metric dimension. Focus on comparing GuardrailContentSource vs GuardrailPolicyType to pick the more detailed one."
      }
    },

    // Q8 — d3-op02
    {
      id: "d3-op02",
      domain: 3,
      task: "3.2",
      skills: ["3.2.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A financial services company wants to develop a mobile application for customer account inquiries. The company has email exchange data between customers and support staff stored in Amazon S3. The data contains personally identifiable information (PII) that should not appear in search results.",
      question: "Which solution will meet these requirements?",
      options: [
        { id: "a", text: "Use Amazon Kendra to index the S3 data. Configure a Bedrock foundation model with a system prompt instructing it to remove PII from responses." },
        { id: "b", text: "Use Amazon Comprehend to detect and redact PII from the email data before indexing. Use Amazon Kendra for enterprise search over the redacted data." },
        { id: "c", text: "Use Amazon Textract to extract text from emails. Use Amazon Macie to identify PII. Index the results with Amazon Kendra." },
        { id: "d", text: "Use Amazon Comprehend to detect PII entities. Store the detected entities in Amazon DocumentDB for filtered search queries." }
      ],
      correctAnswers: ["b"],
      explanation: "Amazon Comprehend provides reliable, deterministic PII detection and redaction capabilities. By redacting PII before indexing, the data in the search index never contains sensitive information, ensuring PII cannot appear in search results. Amazon Kendra then provides enterprise search over the clean, redacted data.",
      incorrectExplanations: {
        a: "System prompts are not a reliable PII protection mechanism. LLMs can leak information despite prompt instructions, and a system prompt cannot guarantee PII removal. PII should be redacted from the source data, not filtered at the response level.",
        c: "Amazon Textract is designed for extracting text from scanned documents and images, not email text data. Amazon Macie identifies sensitive data in S3 but does not redact it — it only classifies and alerts. The emails are already text data that does not require OCR extraction.",
        d: "Amazon DocumentDB is a document database, not a search engine. Comprehend detects PII entities, but this solution stores them in a database rather than redacting them from the source data and providing search functionality."
      },
      parseStrategy: {
        keyPhrase: "PII that should not appear in search results",
        eliminationHints: [
          "System prompt for PII removal = unreliable, LLMs can leak data (eliminates A)",
          "Textract = for scanned documents, not email text (eliminates C)",
          "Macie = identifies PII but does not redact it (eliminates C)",
          "DocumentDB = not a search engine (eliminates D)",
          "Comprehend + redaction + Kendra = deterministic PII removal + enterprise search"
        ],
        decisionFramework: "For PII protection: always redact at the source (before indexing), never rely on model-level filtering. Comprehend detects and redacts PII; Kendra searches the clean data."
      },
      services: ["Amazon Comprehend", "Amazon Kendra"],
      examTip: "Never rely on LLM system prompts for PII protection. PII must be redacted from the source data before it enters any search index or model context. Comprehend is the AWS service for PII detection and redaction.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to build a search system over email data while ensuring PII is never exposed in results?",
        testedConcepts: ["PII detection and redaction", "Amazon Comprehend capabilities", "Data sanitization before indexing", "Enterprise search with Amazon Kendra", "Security by design vs prompt-based filtering"],
        servicesInPlay: [
          { service: "Amazon Comprehend", role: "Detects and redacts PII from email data before indexing", isCorrectAnswer: true },
          { service: "Amazon Kendra", role: "Provides enterprise search over redacted, PII-free data", isCorrectAnswer: true },
          { service: "Amazon Bedrock (System Prompt)", role: "Distractor — unreliable for PII protection", isCorrectAnswer: false },
          { service: "Amazon Textract", role: "Distractor — designed for OCR of scanned documents, not email text", isCorrectAnswer: false },
          { service: "Amazon Macie", role: "Distractor — identifies but does not redact PII", isCorrectAnswer: false }
        ],
        approachStrategy: "The security principle is 'redact at the source.' Any solution that relies on filtering PII at query time or in the model response is unreliable. Look for the solution that removes PII before it enters the search index.",
        commonMistakes: [
          "Trusting LLM system prompts to reliably filter PII — this is a security anti-pattern",
          "Confusing Macie (detection/classification) with Comprehend (detection/redaction)",
          "Using Textract for text that is already in text format (Textract is for OCR)"
        ],
        timeManagementTip: "When PII protection is required, immediately eliminate any solution that relies on model-level filtering. Then compare the remaining options for completeness."
      }
    },

    // Q14 — d3-op03
    {
      id: "d3-op03",
      domain: 3,
      task: "3.3",
      skills: ["3.3.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A company is implementing AI governance policies that require all foundation model interactions to be secured with guardrails. The company must ensure that all InvokeModel and Converse API calls include guardrails.",
      question: "Which solution will enforce guardrail compliance in the MOST operationally efficient way?",
      options: [
        { id: "a", text: "Create IAM policies with condition keys for both bedrock:GuardrailIdentifier and bedrock:PromptRouterArn to require guardrails and prompt routing for all API calls" },
        { id: "b", text: "Deploy an AWS Lambda function that validates guardrail parameters before proxying requests to Amazon Bedrock" },
        { id: "c", text: "Store guardrail IDs in AWS Systems Manager Parameter Store and create an AWS Lambda function that retrieves and validates guardrail configuration before each API call" },
        { id: "d", text: "Create IAM policies with the bedrock:GuardrailIdentifier condition key to deny InvokeModel and Converse API calls that do not include a guardrail identifier" }
      ],
      correctAnswers: ["d"],
      explanation: "IAM policies with the bedrock:GuardrailIdentifier condition key provide a declarative, operationally efficient way to enforce that all Bedrock API calls include guardrails. This is a policy-level enforcement that cannot be bypassed, requires no custom code, and is automatically applied to all users and roles covered by the policy.",
      incorrectExplanations: {
        a: "Adding bedrock:PromptRouterArn as a requirement forces all API calls to use prompt routing, which is unrelated to the guardrail requirement. The question only asks for guardrail enforcement, not prompt routing enforcement.",
        b: "A Lambda proxy adds operational overhead for maintaining custom code, managing the Lambda function, and routing all traffic through it. IAM policies provide the same enforcement without any custom infrastructure.",
        c: "Parameter Store + Lambda validation adds unnecessary complexity. Storing guardrail IDs in Parameter Store and validating via Lambda requires maintaining two additional services when IAM condition keys provide native enforcement."
      },
      parseStrategy: {
        keyPhrase: "MOST operationally efficient",
        eliminationHints: [
          "Lambda proxy = custom code, operational overhead (eliminates B)",
          "Parameter Store + Lambda = two extra services (eliminates C)",
          "bedrock:PromptRouterArn = unrelated to guardrail enforcement (eliminates A)",
          "IAM condition key = declarative, no code, cannot be bypassed"
        ],
        decisionFramework: "For policy enforcement, always prefer IAM condition keys over custom Lambda validation. IAM policies are declarative, automatic, and cannot be bypassed at the API level."
      },
      services: ["AWS IAM", "Amazon Bedrock Guardrails"],
      examTip: "IAM condition keys are the most operationally efficient way to enforce compliance requirements. For Bedrock, bedrock:GuardrailIdentifier ensures all API calls include guardrails without custom code.",
      strategicBreakdown: {
        whatIsBeingAsked: "What is the simplest, most automated way to ensure every Bedrock API call includes a guardrail?",
        testedConcepts: ["IAM condition keys for Bedrock", "Policy-based enforcement vs custom validation", "Guardrail compliance automation", "Operational efficiency in governance"],
        servicesInPlay: [
          { service: "AWS IAM (Condition Keys)", role: "Enforces guardrail requirement declaratively via bedrock:GuardrailIdentifier", isCorrectAnswer: true },
          { service: "AWS Lambda", role: "Distractor — adds operational overhead for custom validation", isCorrectAnswer: false },
          { service: "AWS Systems Manager Parameter Store", role: "Distractor — adds complexity without benefit over IAM", isCorrectAnswer: false }
        ],
        approachStrategy: "Policy enforcement questions almost always favor native AWS mechanisms (IAM policies, SCPs) over custom Lambda solutions. The bedrock:GuardrailIdentifier condition key is purpose-built for this exact requirement.",
        commonMistakes: [
          "Adding unnecessary condition keys (PromptRouterArn) that enforce unrelated requirements",
          "Building custom Lambda validation when IAM provides native enforcement",
          "Over-engineering with Parameter Store when the requirement is simply 'require guardrails'"
        ],
        timeManagementTip: "When you see 'enforce' + 'operationally efficient,' think IAM policies first. If an IAM-based answer exists, it is almost always correct over custom code solutions."
      }
    },

    // Q15 — d3-op04
    {
      id: "d3-op04",
      domain: 3,
      task: "3.3",
      skills: ["3.3.1"],
      type: "multiple-response",
      difficulty: "hard",
      scenario: "A financial services company needs to deploy an Amazon Bedrock AI assistant across business units. Prompt templates must be governed through approval workflows. The company requires comprehensive logging of all model invocations with 7-year retention for regulatory compliance.",
      question: "Which combination of steps will meet these requirements with MINIMAL operational overhead? (Select TWO.)",
      options: [
        { id: "a", text: "Use Amazon Bedrock Prompt Management with multi-stage approval workflows and IAM multi-party authorization to govern prompt template changes" },
        { id: "b", text: "Create Amazon DynamoDB tables to store prompt templates and configure IAM item-level permissions to control who can modify templates" },
        { id: "c", text: "Configure Amazon EventBridge rules to capture Bedrock invocation events. Route events to Amazon CloudWatch Logs. Archive logs to Amazon S3 with Object Lock for 7-year retention." },
        { id: "d", text: "Enable AWS CloudTrail data events for Amazon Bedrock API calls and configure CloudTrail Lake with a 7-year retention policy" },
        { id: "e", text: "Enable Amazon Bedrock model invocation logging to Amazon S3. Configure S3 Object Lock with a 7-year compliance retention policy." }
      ],
      correctAnswers: ["a", "e"],
      explanation: "Bedrock Prompt Management with multi-stage approval workflows provides native prompt governance with approval processes built in. IAM multi-party authorization ensures changes require multiple approvals. Bedrock model invocation logging to S3 with Object Lock provides immutable, comprehensive logging with 7-year retention. Both are managed Bedrock-native features requiring minimal operational overhead.",
      incorrectExplanations: {
        b: "DynamoDB tables for prompt templates require building custom approval workflows, version control, and governance logic. Bedrock Prompt Management provides all of this natively with less overhead.",
        c: "EventBridge + CloudWatch Logs + S3 archival is a custom logging pipeline that requires configuring and maintaining multiple services. Bedrock model invocation logging to S3 provides the same result with a single configuration.",
        d: "CloudTrail data events capture API call metadata but do not include the full model invocation content (prompts, responses). Bedrock model invocation logging captures the complete request and response content needed for regulatory compliance."
      },
      parseStrategy: {
        keyPhrase: "MINIMAL operational overhead",
        eliminationHints: [
          "DynamoDB + custom governance = building what Bedrock Prompt Management provides natively (eliminates B)",
          "EventBridge + CloudWatch + S3 = custom logging pipeline (eliminates C)",
          "CloudTrail data events = API metadata only, not full invocation content (eliminates D)",
          "Bedrock Prompt Management + S3 invocation logging = native, managed solutions"
        ],
        decisionFramework: "For governance with minimal overhead: use native Bedrock features (Prompt Management for governance, invocation logging for compliance). Avoid custom pipelines or workarounds."
      },
      services: ["Amazon Bedrock Prompt Management", "Amazon Bedrock Model Invocation Logging", "Amazon S3", "AWS IAM"],
      examTip: "For regulatory compliance logging, Bedrock model invocation logging captures full prompts and responses — CloudTrail only captures API metadata. S3 Object Lock with compliance mode ensures immutable retention for regulatory requirements.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to implement governed prompt management and 7-year immutable logging for Bedrock model invocations with the least custom infrastructure?",
        testedConcepts: ["Bedrock Prompt Management governance", "Model invocation logging vs CloudTrail", "S3 Object Lock compliance retention", "Multi-party authorization", "Regulatory compliance for AI"],
        servicesInPlay: [
          { service: "Amazon Bedrock Prompt Management", role: "Provides native multi-stage approval workflows for prompt templates", isCorrectAnswer: true },
          { service: "Amazon Bedrock Model Invocation Logging", role: "Captures full invocation content (prompts + responses)", isCorrectAnswer: true },
          { service: "Amazon S3 Object Lock", role: "Provides immutable 7-year retention for compliance", isCorrectAnswer: true },
          { service: "Amazon DynamoDB", role: "Distractor — requires building custom governance logic", isCorrectAnswer: false },
          { service: "AWS CloudTrail", role: "Distractor — captures API metadata, not full invocation content", isCorrectAnswer: false }
        ],
        approachStrategy: "Split the requirements: (1) prompt governance with approval workflows → Bedrock Prompt Management (native). (2) comprehensive invocation logging with 7-year retention → Bedrock invocation logging + S3 Object Lock. For both, prefer native Bedrock features over custom solutions.",
        commonMistakes: [
          "Confusing CloudTrail data events (API metadata) with Bedrock invocation logging (full content)",
          "Building custom prompt governance in DynamoDB when Bedrock Prompt Management exists",
          "Creating custom EventBridge logging pipelines when Bedrock has built-in invocation logging"
        ],
        timeManagementTip: "Split the question into its two independent requirements (prompt governance + logging retention) and evaluate options for each independently."
      }
    },

    // Q20 — d3-op05
    {
      id: "d3-op05",
      domain: 3,
      task: "3.3",
      skills: ["3.3.1"],
      type: "multiple-response",
      difficulty: "hard",
      scenario: "An education company built a content generation system on Amazon Bedrock that generates practice questions from educational materials. The system uses both curated and web-scraped data. Human reviewers must approve generated question-response sets before publication. The company wants to improve the system by adding source lineage tracking so reviewers can verify the credibility of the data sources used to generate each question.",
      question: "Which combination of steps will meet these requirements with the LEAST operational overhead? (Select TWO.)",
      options: [
        { id: "a", text: "Enable Amazon Bedrock invocation logging and correlate each generated question with its data source by analyzing the invocation logs" },
        { id: "b", text: "Tag foundation model outputs with metadata attributes from the data source, including source URL, collection date, and credibility classification" },
        { id: "c", text: "Register all input datasets with AWS Glue Data Catalog, including metadata about source origin, update frequency, and data quality classification" },
        { id: "d", text: "Use Amazon SageMaker Clarify to explain model predictions and trace which input features contributed to each generated question" },
        { id: "e", text: "Use AWS CloudTrail to log reviewer feedback and approval decisions for each generated question-response set" }
      ],
      correctAnswers: ["b", "c"],
      explanation: "Tagging FM outputs with source metadata (URL, date, credibility) creates direct lineage between generated questions and their data sources, enabling reviewers to verify credibility. Registering datasets in AWS Glue Data Catalog creates a centralized catalog of all input data with provenance metadata. Together, these provide end-to-end source lineage from data ingestion to output.",
      incorrectExplanations: {
        a: "Bedrock invocation logging captures API request/response data but does not automatically correlate outputs with specific data sources. Manual correlation from logs is operationally heavy and unreliable for source lineage.",
        d: "SageMaker Clarify is designed for ML model explainability (feature attribution) on traditional ML models. Foundation models do not have discrete input features that Clarify can trace. This tool is not applicable to FM-based content generation.",
        e: "CloudTrail logging of reviewer feedback captures the approval process but does not address source lineage tracking. The question asks about tracing which data sources contributed to generated content, not logging reviewer actions."
      },
      parseStrategy: {
        keyPhrase: "source lineage tracking",
        eliminationHints: [
          "Invocation logging = captures API data, not source lineage (eliminates A)",
          "SageMaker Clarify = for ML model explainability, not FM lineage (eliminates D)",
          "CloudTrail = logs reviewer actions, not source provenance (eliminates E)",
          "Output metadata tagging + Glue Data Catalog = end-to-end source lineage"
        ],
        decisionFramework: "Source lineage requires two things: (1) cataloging input data provenance (Glue Data Catalog) and (2) linking outputs to their sources (metadata tagging). These cover both ends of the data pipeline."
      },
      services: ["AWS Glue Data Catalog", "Amazon Bedrock"],
      examTip: "Source lineage in GenAI systems requires tracking data from ingestion (Glue Data Catalog for input provenance) to output (metadata tags linking generated content to sources). These are complementary, not alternatives.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to enable reviewers to trace generated practice questions back to their original data sources for credibility verification?",
        testedConcepts: ["Data lineage and provenance", "AWS Glue Data Catalog for data governance", "Metadata tagging for output traceability", "AI governance and content review workflows"],
        servicesInPlay: [
          { service: "AWS Glue Data Catalog", role: "Catalogs input datasets with provenance metadata (source, quality, update frequency)", isCorrectAnswer: true },
          { service: "Metadata Tagging (FM Outputs)", role: "Links generated questions to their data sources via metadata attributes", isCorrectAnswer: true },
          { service: "Amazon Bedrock Invocation Logging", role: "Distractor — captures API data but not source-to-output lineage", isCorrectAnswer: false },
          { service: "Amazon SageMaker Clarify", role: "Distractor — ML model explainability, not applicable to FMs", isCorrectAnswer: false },
          { service: "AWS CloudTrail", role: "Distractor — logs API calls and reviewer actions, not source lineage", isCorrectAnswer: false }
        ],
        approachStrategy: "Source lineage = tracking data from origin to output. Two perspectives: (1) Where did the input data come from? → Glue Data Catalog. (2) Which source produced this output? → metadata tagging. Both are needed for end-to-end lineage.",
        commonMistakes: [
          "Thinking Bedrock invocation logging provides source lineage — it logs API calls, not data provenance",
          "Applying SageMaker Clarify to foundation models — Clarify is designed for traditional ML models",
          "Confusing reviewer feedback logging (CloudTrail) with source lineage tracking"
        ],
        timeManagementTip: "The phrase 'source lineage' narrows the answer to options that track data provenance. Eliminate anything that tracks API calls, reviewer actions, or model explainability."
      }
    }
  ],

  4: [
    // Q6 — d4-op01
    {
      id: "d4-op01",
      domain: 4,
      task: "4.2",
      skills: ["4.2.1"],
      type: "multiple-response",
      difficulty: "hard",
      scenario: "A generative AI developer deployed a fine-tuned large language model to an Amazon SageMaker AI endpoint using Deep Java Library (DJL) with continuous batching on GPU-based instances with 8 GPUs. The deployment requires too many instances to handle production traffic. Analysis shows that the maximum input/output sequence length observed in real requests is 10 times smaller than the configured maximum. Concurrency is low. Model weights and activations fit within 4 GPUs.",
      question: "Which combination of steps can improve resource utilization? (Select TWO.)",
      options: [
        { id: "a", text: "Increase the number of SageMaker instances to distribute the load across more endpoints" },
        { id: "b", text: "Reduce the model's configured maximum sequence length to match observed usage, enabling a higher rolling batch size" },
        { id: "c", text: "Enable speculative decoding to generate multiple tokens per forward pass and improve throughput" },
        { id: "d", text: "Set tensor parallelism degree to 4 to deploy two model replicas per instance, doubling per-instance throughput" },
        { id: "e", text: "Set tensor parallelism degree to 8 to maximize parallelism across all available GPUs" }
      ],
      correctAnswers: ["b", "d"],
      explanation: "Reducing the configured maximum sequence length to match actual usage (10x smaller) frees GPU memory, allowing a larger rolling batch size and better throughput. Setting tensor parallelism to 4 (model fits in 4 GPUs) allows deploying two model replicas per 8-GPU instance, effectively doubling per-instance throughput. Together, these changes maximize resource utilization without adding instances.",
      incorrectExplanations: {
        a: "Adding more instances does not improve resource utilization — it increases cost. The problem is that each instance is underutilized, not that there are too few instances.",
        c: "Speculative decoding improves latency for individual requests by predicting multiple tokens, but does not fundamentally improve throughput or resource utilization when the bottleneck is over-provisioned sequence length and under-utilized GPUs.",
        e: "Tensor parallelism degree 8 across all GPUs is the current configuration (model spread across 8 GPUs). Since the model fits in 4 GPUs, using TP=8 wastes GPU resources by spreading unnecessarily."
      },
      parseStrategy: {
        keyPhrase: "improve resource utilization",
        eliminationHints: [
          "More instances = more cost, not better utilization (eliminates A)",
          "Speculative decoding = latency optimization, not utilization (eliminates C)",
          "TP=8 = current config, model already spread across all GPUs (eliminates E)",
          "Reduce sequence length = free memory for larger batch size",
          "TP=4 = fit two replicas per instance, double throughput"
        ],
        decisionFramework: "Resource utilization = doing more with existing resources. Two levers: (1) free wasted memory (reduce sequence length) to increase batch size, and (2) use extra GPUs for additional model replicas (TP=4 instead of 8)."
      },
      services: ["Amazon SageMaker", "Deep Java Library (DJL)"],
      examTip: "When a model fits in fewer GPUs than available, reduce tensor parallelism degree to run multiple model replicas per instance. When configured sequence length far exceeds actual usage, reduce it to free memory for larger batches.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to get more throughput from existing GPU instances by fixing over-provisioned sequence length and under-utilized GPU count?",
        testedConcepts: ["Tensor parallelism and model replicas", "Sequence length and GPU memory trade-offs", "Rolling batch size optimization", "GPU resource utilization", "DJL serving configuration"],
        servicesInPlay: [
          { service: "Amazon SageMaker (Sequence Length Config)", role: "Reducing configured max sequence length frees GPU memory for larger batches", isCorrectAnswer: true },
          { service: "Amazon SageMaker (Tensor Parallelism)", role: "TP=4 allows two model replicas per 8-GPU instance", isCorrectAnswer: true },
          { service: "Amazon SageMaker (Scaling)", role: "Distractor — adding instances increases cost without improving utilization", isCorrectAnswer: false },
          { service: "Speculative Decoding", role: "Distractor — latency optimization, not throughput/utilization", isCorrectAnswer: false }
        ],
        approachStrategy: "Identify the two waste sources: (1) sequence length is 10x over-provisioned → wasted GPU memory. (2) model uses 8 GPUs but only needs 4 → wasted GPU compute. Fix each: reduce sequence length to free memory, reduce TP degree to run multiple replicas.",
        commonMistakes: [
          "Thinking more instances improves 'utilization' — it improves capacity but not per-instance utilization",
          "Not understanding that tensor parallelism degree determines how many GPUs one model replica uses",
          "Confusing speculative decoding (latency) with batching optimization (throughput)"
        ],
        timeManagementTip: "The scenario gives you two clear clues: (1) sequence length is 10x too large, and (2) model fits in 4 of 8 GPUs. Each clue maps to exactly one answer."
      }
    },

    // Q11 — d4-op02
    {
      id: "d4-op02",
      domain: 4,
      task: "4.3",
      skills: ["4.3.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A company runs a question-answering application using an Amazon Bedrock knowledge base that ingests documents from multiple Amazon S3 buckets. The company needs to monitor data ingestion operations to identify and troubleshoot document processing issues.",
      question: "Which solution will meet these requirements to monitor knowledge base operations?",
      options: [
        { id: "a", text: "Configure knowledge base logging to send logs to Amazon CloudWatch Logs. Use CloudWatch Logs Insights to query and analyze document processing events." },
        { id: "b", text: "Enable Amazon CloudWatch Application Signals to automatically detect anomalies in knowledge base ingestion performance" },
        { id: "c", text: "Enable AWS CloudTrail for Amazon Bedrock API calls and analyze the trail for ingestion-related events" },
        { id: "d", text: "Implement Amazon Bedrock model invocation logging to capture and analyze all knowledge base query operations" }
      ],
      correctAnswers: ["a"],
      explanation: "Knowledge base logging to CloudWatch Logs captures detailed document processing events including ingestion status, errors, and document-level details. CloudWatch Logs Insights enables querying and analyzing these logs to identify specific processing issues. This is the purpose-built monitoring solution for knowledge base ingestion operations.",
      incorrectExplanations: {
        b: "CloudWatch Application Signals is designed for monitoring application performance (latency, error rates, SLIs/SLOs), not for detailed document-level ingestion troubleshooting. It does not provide the granular processing logs needed to diagnose individual document issues.",
        c: "CloudTrail logs API calls (StartIngestionJob, etc.) but does not capture detailed document processing events like which specific documents failed, why they failed, or processing metrics. It tracks who called what API, not what happened during processing.",
        d: "Model invocation logging captures FM inference requests and responses (prompts and completions). It does not capture data ingestion events. Ingestion and query are separate operations — invocation logging covers queries, not ingestion."
      },
      parseStrategy: {
        keyPhrase: "monitor data ingestion to identify and troubleshoot",
        eliminationHints: [
          "Application Signals = application performance monitoring, not ingestion detail (eliminates B)",
          "CloudTrail = API call auditing, not processing detail (eliminates C)",
          "Model invocation logging = query/inference logging, not ingestion (eliminates D)",
          "Knowledge base logging = purpose-built for ingestion monitoring"
        ],
        decisionFramework: "For monitoring knowledge base ingestion, use knowledge base logging (document processing detail). CloudTrail tracks API calls. Model invocation logging tracks queries. Knowledge base logging tracks ingestion."
      },
      services: ["Amazon Bedrock Knowledge Bases", "Amazon CloudWatch Logs", "Amazon CloudWatch Logs Insights"],
      examTip: "Distinguish between three types of Bedrock logging: (1) Knowledge base logging = ingestion/processing events. (2) Model invocation logging = FM queries and responses. (3) CloudTrail = API call auditing. Each serves a different purpose.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which monitoring solution provides detailed visibility into document processing during knowledge base ingestion?",
        testedConcepts: ["Bedrock Knowledge Base logging", "CloudWatch Logs Insights", "Distinguishing monitoring types (ingestion vs invocation vs API audit)", "Troubleshooting document processing"],
        servicesInPlay: [
          { service: "Amazon Bedrock Knowledge Base Logging", role: "Captures detailed document processing events during ingestion", isCorrectAnswer: true },
          { service: "Amazon CloudWatch Logs Insights", role: "Enables querying and analyzing ingestion logs for troubleshooting", isCorrectAnswer: true },
          { service: "CloudWatch Application Signals", role: "Distractor — monitors application performance, not ingestion detail", isCorrectAnswer: false },
          { service: "AWS CloudTrail", role: "Distractor — logs API calls, not processing events", isCorrectAnswer: false },
          { service: "Bedrock Model Invocation Logging", role: "Distractor — captures inference/query events, not ingestion", isCorrectAnswer: false }
        ],
        approachStrategy: "The question asks about 'data ingestion' monitoring, not query monitoring or API auditing. Knowledge base logging is the only option that specifically captures ingestion processing events at the document level.",
        commonMistakes: [
          "Confusing model invocation logging (queries) with knowledge base logging (ingestion)",
          "Thinking CloudTrail provides processing-level detail (it only records API calls)",
          "Selecting Application Signals for a monitoring question without considering what it actually monitors"
        ],
        timeManagementTip: "The key word is 'ingestion.' Map each option to what it monitors: ingestion (KB logging), queries (invocation logging), API calls (CloudTrail), app performance (Application Signals)."
      }
    }
  ],

  5: [
    // Q4 — d5-op01
    {
      id: "d5-op01",
      domain: 5,
      task: "5.2",
      skills: ["5.2.1"],
      type: "multiple-choice",
      difficulty: "hard",
      scenario: "A financial services company operates a RAG application. The application uses Amazon Bedrock for text embedding, Amazon OpenSearch Service as the vector store, and an AWS Lambda function for embedding generation and search logic. After a recent code update to the Lambda function, the application returns \"no relevant information found\" for all queries, even for questions that previously returned accurate answers. Amazon CloudWatch shows no errors in the Lambda function logs. AWS X-Ray confirms successful foundation model invocations. The OpenSearch cluster is healthy and query latency remains normal.",
      question: "What is the cause of this issue?",
      options: [
        { id: "a", text: "The document embeddings in OpenSearch were deleted during the Lambda function update process" },
        { id: "b", text: "The Lambda function's IAM role is missing the bedrock:InvokeModel permission after the code update" },
        { id: "c", text: "The Amazon Bedrock temperature parameter was increased in the code update, causing inconsistent embedding generation" },
        { id: "d", text: "The updated Lambda function is using a different embedding model version than the one used to generate the stored document embeddings" }
      ],
      correctAnswers: ["d"],
      explanation: "When a Lambda code update switches to a different embedding model version, the query embeddings generated at search time exist in a different vector space than the stored document embeddings. Even though both embedding operations succeed without errors, the mathematical similarity between vectors from different models is effectively random, resulting in no relevant matches. This is the classic 'embedding model mismatch' issue in RAG systems.",
      incorrectExplanations: {
        a: "If document embeddings were deleted, OpenSearch queries would return empty results or errors, not 'no relevant information found.' Additionally, a Lambda code update does not affect data stored in OpenSearch.",
        b: "X-Ray confirms successful FM invocations, which means the Lambda function has the necessary bedrock:InvokeModel permission. If the permission were missing, X-Ray would show failed invocations and CloudWatch would log permission errors.",
        c: "The temperature parameter affects text generation randomness, not embedding generation. Embedding models produce deterministic vector representations regardless of temperature settings. Temperature is not applicable to embedding API calls."
      },
      parseStrategy: {
        keyPhrase: "after a recent code update ... no relevant information found",
        eliminationHints: [
          "No CloudWatch errors + successful X-Ray invocations = everything is executing correctly (eliminates B)",
          "Healthy OpenSearch + normal latency = data is intact (eliminates A)",
          "Temperature does not affect embeddings (eliminates C)",
          "Code update + 'no relevant results' despite success = embedding model version mismatch"
        ],
        decisionFramework: "When a RAG system returns no results after a code change but shows no errors, the most likely cause is an embedding model mismatch. Query vectors and document vectors must be in the same vector space."
      },
      services: ["Amazon Bedrock", "Amazon OpenSearch Service", "AWS Lambda"],
      examTip: "In RAG systems, document embeddings and query embeddings MUST use the same embedding model version. A model version mismatch produces no errors but returns irrelevant or empty results because vectors are in different mathematical spaces.",
      strategicBreakdown: {
        whatIsBeingAsked: "What causes a RAG application to suddenly return no relevant results after a Lambda code update, with no errors in logs or traces?",
        testedConcepts: ["Embedding model version consistency", "RAG system debugging", "Vector space compatibility", "Silent failures in embedding pipelines"],
        servicesInPlay: [
          { service: "Amazon Bedrock (Embedding Model)", role: "Different model version produces incompatible query embeddings", isCorrectAnswer: true },
          { service: "Amazon OpenSearch Service", role: "Vector store is healthy — stored embeddings are from the old model version", isCorrectAnswer: false },
          { service: "AWS Lambda", role: "Code update changed the embedding model version referenced in the function", isCorrectAnswer: true },
          { service: "AWS X-Ray", role: "Confirms API calls succeed — helps rule out permission issues", isCorrectAnswer: false }
        ],
        approachStrategy: "Use the diagnostic clues to eliminate options: (1) No errors → permissions are fine (eliminate B). (2) OpenSearch healthy → data intact (eliminate A). (3) Successful invocations → embeddings are generated (eliminate C, since temperature does not apply). (4) Code update → model version changed → vector space mismatch (D).",
        commonMistakes: [
          "Assuming errors must appear somewhere for a real problem — embedding mismatches produce no errors",
          "Thinking temperature affects embedding models — it only affects generative models",
          "Blaming data deletion when the vector store is reported as healthy"
        ],
        timeManagementTip: "The diagnostic clues (no errors, successful invocations, healthy cluster) rule out three options. Only model version mismatch explains a silent failure after a code change."
      }
    },

    // Q19 — d5-op02 (ORDERING question)
    {
      id: "d5-op02",
      domain: 5,
      task: "5.1",
      skills: ["5.1.1"],
      type: "ordering",
      difficulty: "hard",
      scenario: "A company is implementing a systematic evaluation process for a newly deployed foundation model in Amazon Bedrock. The company wants to replace an existing model with the new one. The change depends on the new model demonstrating better performance. The evaluation must follow sequential validation, with each step reviewed before proceeding to the next.",
      question: "Select and order each step to implement the evaluation workflow.",
      options: [
        { id: "a", text: "Analyze results and generate a comprehensive evaluation report" },
        { id: "b", text: "Conduct A/B testing to compare the new model against the existing model" },
        { id: "c", text: "Create a test dataset with diverse scenarios and edge cases" },
        { id: "d", text: "Define evaluation metrics for relevance, factual accuracy, and fluency" },
        { id: "e", text: "Implement automated quality gates using AWS Step Functions" }
      ],
      correctAnswers: ["d", "c", "b", "e", "a"],
      explanation: "The correct evaluation workflow follows a logical sequence: (1) Define evaluation metrics first — you need to know what you are measuring before creating tests. (2) Create a test dataset with diverse scenarios that exercise the defined metrics. (3) Conduct A/B testing comparing the new model against the existing one using the test dataset. (4) Implement automated quality gates to enforce minimum performance thresholds before proceeding. (5) Analyze results and generate a comprehensive report for stakeholders to make the final decision.",
      incorrectExplanations: {
        a: "Analysis and reporting must come last because it requires all previous steps (metrics, testing, quality gates) to produce meaningful results. You cannot analyze results before you have them.",
        b: "A/B testing requires both defined metrics and a test dataset to be meaningful. Testing before defining what you are measuring produces unstructured, uninterpretable results.",
        c: "Creating a test dataset before defining metrics may result in tests that do not cover the relevant evaluation criteria. Metrics should drive test design, not the other way around.",
        e: "Quality gates should be implemented after A/B testing produces results, as they automate the pass/fail decision based on the metrics gathered during testing."
      },
      parseStrategy: {
        keyPhrase: "sequential validation with each step reviewed before proceeding",
        eliminationHints: [
          "Metrics must be defined before tests are created (D before C)",
          "Tests must exist before A/B testing can run (C before B)",
          "A/B testing must produce results before quality gates evaluate them (B before E)",
          "Analysis and reporting is always the final step (A last)"
        ],
        decisionFramework: "Follow the evaluation lifecycle: Define → Design → Execute → Validate → Report. Map each option: D=Define, C=Design, B=Execute, E=Validate, A=Report."
      },
      services: ["Amazon Bedrock", "AWS Step Functions"],
      examTip: "Model evaluation workflows always follow: Define metrics → Create test data → Run evaluation → Automate decisions → Report results. This is a universal pattern regardless of the specific tools used.",
      strategicBreakdown: {
        whatIsBeingAsked: "What is the correct sequential order for implementing a systematic FM evaluation workflow to decide whether to replace an existing model?",
        testedConcepts: ["Model evaluation methodology", "Sequential validation processes", "A/B testing for model comparison", "Automated quality gates", "Evaluation workflow design"],
        servicesInPlay: [
          { service: "Amazon Bedrock (Model Evaluation)", role: "Platform for evaluating and comparing foundation models", isCorrectAnswer: true },
          { service: "AWS Step Functions", role: "Implements automated quality gates for pass/fail decisions", isCorrectAnswer: true }
        ],
        approachStrategy: "Apply logical dependency analysis. Ask: 'What must exist before this step can execute?' Metrics → required for test design. Test data → required for A/B testing. A/B results → required for quality gates. All results → required for final report. This gives the order: D, C, B, E, A.",
        commonMistakes: [
          "Putting test dataset creation before metric definition — metrics should drive what tests are needed",
          "Placing quality gates before A/B testing — gates need results to evaluate",
          "Starting with A/B testing before establishing metrics and test data"
        ],
        timeManagementTip: "For ordering questions, identify the first and last steps immediately (define metrics = first, report = last). Then determine the middle steps by dependency analysis. This anchors the order."
      }
    }
  ]
};


// ---------------------------------------------------------------------------
// Main script logic
// ---------------------------------------------------------------------------

function main() {
  const domainIds = [1, 2, 3, 4, 5];
  let totalInserted = 0;

  for (const domainId of domainIds) {
    const questions = questionsByDomain[domainId];
    if (!questions || questions.length === 0) {
      console.log(`Domain ${domainId}: No new questions to insert.`);
      continue;
    }

    const filePath = path.join(DATA_DIR, `domain-${domainId}.json`);

    // Read existing file
    let fileContent;
    try {
      fileContent = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      console.error(`Error reading ${filePath}: ${err.message}`);
      process.exit(1);
    }

    // Parse JSON
    let data;
    try {
      data = JSON.parse(fileContent);
    } catch (err) {
      console.error(`Error parsing JSON in ${filePath}: ${err.message}`);
      process.exit(1);
    }

    // Check for existing IDs to avoid duplicates
    const existingIds = new Set(data.questions.map(q => q.id));
    const newQuestions = questions.filter(q => {
      if (existingIds.has(q.id)) {
        console.log(`  Skipping ${q.id} (already exists in domain-${domainId}.json)`);
        return false;
      }
      return true;
    });

    if (newQuestions.length === 0) {
      console.log(`Domain ${domainId}: All questions already exist. Skipping.`);
      continue;
    }

    // Append new questions
    data.questions.push(...newQuestions);

    // Write back with consistent formatting (2-space indent)
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    } catch (err) {
      console.error(`Error writing ${filePath}: ${err.message}`);
      process.exit(1);
    }

    console.log(`Domain ${domainId}: Inserted ${newQuestions.length} question(s) — ${newQuestions.map(q => q.id).join(', ')}`);
    totalInserted += newQuestions.length;
  }

  console.log(`\nDone. Inserted ${totalInserted} question(s) across all domains.`);
}

main();
