#!/usr/bin/env node

/**
 * insert-community-questions.js
 *
 * Inserts 20 community-authored practice questions into the existing domain JSON files.
 * Each question uses the "d{domain}-cq{nn}" ID format to distinguish them from
 * official practice questions (d{domain}-op{nn}).
 *
 * Questions are derived from the study guide content articles.
 *
 * Usage: node scripts/insert-community-questions.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'src', 'data', 'questions');

// ---------------------------------------------------------------------------
// All 20 questions grouped by domain
// ---------------------------------------------------------------------------

const questionsByDomain = {
  1: [
    // cq01 — RAG chunking strategies (from rag-patterns.md)
    {
      id: "d1-cq01",
      domain: 1,
      task: "1.4",
      skills: ["1.4.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A healthcare company is building a RAG application to answer clinician questions from a large corpus of medical research papers. Each paper contains sections with dense technical content averaging 15 pages. During testing, the team finds that retrieved chunks often include irrelevant paragraphs from adjacent sections, and the model's answers mix information from unrelated topics within the same paper.",
      question: "Which chunking strategy will MOST improve retrieval relevance for this use case?",
      options: [
        { id: "a", text: "Use fixed-size chunking with 512 tokens per chunk and no overlap to maximize the number of chunks indexed" },
        { id: "b", text: "Use semantic chunking that splits documents at section boundaries, with metadata tagging for paper title, section heading, and publication date" },
        { id: "c", text: "Increase the chunk size to 2048 tokens so each chunk contains more complete context from the paper" },
        { id: "d", text: "Use sentence-level chunking with 1 sentence per chunk to maximize retrieval precision" }
      ],
      correctAnswers: ["b"],
      explanation: "Semantic chunking at section boundaries keeps topically coherent content together, preventing the mixing of unrelated sections. Adding metadata (paper title, section heading, publication date) enables filtered retrieval and helps the model attribute information correctly. This directly addresses both symptoms: irrelevant adjacent paragraphs and topic mixing.",
      incorrectExplanations: {
        a: "Fixed-size chunking at 512 tokens ignores document structure entirely. Chunk boundaries will cut through paragraphs and sections arbitrarily, making the problem worse by splitting coherent content across chunks.",
        c: "Larger chunks would include even more irrelevant content from adjacent sections. The problem is not insufficient context within chunks — it is that chunks span unrelated sections.",
        d: "Sentence-level chunking provides too little context for dense medical content. Individual sentences often lack the surrounding context needed for a model to generate accurate medical answers."
      },
      parseStrategy: {
        keyPhrase: "MOST improve retrieval relevance",
        eliminationHints: [
          "Fixed-size chunking ignores document structure — worsens cross-section mixing",
          "Larger chunks = more irrelevant content included",
          "Sentence-level = too little context for technical content",
          "Section-boundary chunking = topically coherent chunks"
        ],
        decisionFramework: "When retrieved chunks mix unrelated topics, the root cause is chunking that ignores document structure. The fix is structure-aware (semantic) chunking aligned to natural document boundaries."
      },
      services: ["Amazon Bedrock Knowledge Bases", "Amazon OpenSearch Serverless"],
      examTip: "When RAG answers mix unrelated topics, the problem is almost always chunking strategy, not retrieval algorithm. Structure-aware chunking with metadata is the standard fix.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to fix RAG retrieval that returns chunks containing unrelated content from adjacent document sections.",
        testedConcepts: ["Chunking strategies", "Semantic vs fixed-size chunking", "Metadata tagging for retrieval filtering", "RAG retrieval quality"],
        servicesInPlay: [
          { service: "Amazon Bedrock Knowledge Bases", role: "RAG infrastructure — chunking strategy is configured here", isCorrectAnswer: true },
          { service: "Amazon OpenSearch Serverless", role: "Vector store backing the Knowledge Base", isCorrectAnswer: false }
        ],
        approachStrategy: "Identify the root cause: chunks span multiple sections. Then pick the solution that aligns chunks to section boundaries. Metadata tagging is a bonus that further improves relevance through filtering.",
        commonMistakes: [
          "Thinking bigger chunks solve relevance problems (they worsen them when structure is ignored)",
          "Confusing retrieval algorithm issues with chunking issues",
          "Not recognizing that metadata enables post-retrieval filtering"
        ],
        timeManagementTip: "The symptom 'mixes information from unrelated topics' points directly to chunking. Eliminate size-only solutions (A, C, D) immediately."
      }
    },

    // cq02 — Prompt engineering: few-shot vs chain-of-thought (from prompt-engineering.md)
    {
      id: "d1-cq02",
      domain: 1,
      task: "1.6",
      skills: ["1.6.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A developer is building a customer support classifier that categorizes incoming tickets into one of 12 categories. The current zero-shot prompt achieves 65% accuracy. The developer needs to improve accuracy without fine-tuning the model or increasing the model size. The solution must be maintainable and easy to update when new categories are added.",
      question: "Which prompt engineering technique will MOST effectively improve classification accuracy?",
      options: [
        { id: "a", text: "Add chain-of-thought reasoning instructions asking the model to explain its classification step by step before providing the final category" },
        { id: "b", text: "Provide 2-3 few-shot examples per category showing representative tickets and their correct classifications" },
        { id: "c", text: "Increase the temperature parameter to 0.9 to generate more diverse classification outputs" },
        { id: "d", text: "Add a system prompt instructing the model to be very careful and accurate in its classifications" }
      ],
      correctAnswers: ["b"],
      explanation: "Few-shot examples are the most effective technique for classification tasks. By showing 2-3 representative examples per category, the model leverages in-context learning to identify patterns that distinguish each category. This is especially effective when there are many categories (12), as examples clarify category boundaries. Few-shot is also maintainable — when a new category is added, you simply add examples for it.",
      incorrectExplanations: {
        a: "Chain-of-thought is most effective for reasoning and multi-step problems, not classification. Classification is pattern-matching, not reasoning. CoT adds latency and token cost without meaningful accuracy gains for this task type.",
        c: "Increasing temperature increases randomness in output generation, which hurts classification accuracy. For deterministic tasks like classification, temperature should be set to 0 or near 0.",
        d: "Vague instructions like 'be careful and accurate' provide no actionable information to the model. Without examples or specific criteria, the model has no new signal to improve its classification."
      },
      parseStrategy: {
        keyPhrase: "MOST effectively improve classification accuracy",
        eliminationHints: [
          "CoT is for reasoning tasks, not classification",
          "Higher temperature = more randomness = worse for classification",
          "Vague instructions ('be careful') provide no useful signal",
          "Few-shot examples = strongest technique for classification"
        ],
        decisionFramework: "For classification tasks, few-shot examples are the highest-leverage prompt engineering technique. CoT is for reasoning. Temperature should be low for deterministic tasks."
      },
      services: ["Amazon Bedrock"],
      examTip: "Match the prompt technique to the task type: few-shot for classification, chain-of-thought for reasoning, low temperature for deterministic outputs.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which prompt engineering technique best improves a multi-class classification task without model changes?",
        testedConcepts: ["Few-shot learning", "Chain-of-thought reasoning", "Temperature parameter", "In-context learning", "Prompt engineering techniques"],
        servicesInPlay: [
          { service: "Amazon Bedrock", role: "Foundation model inference — prompt engineering applied here", isCorrectAnswer: true }
        ],
        approachStrategy: "Identify the task type (classification) and match to the best prompt technique. Few-shot is the gold standard for classification. Eliminate techniques that don't help classification specifically.",
        commonMistakes: [
          "Applying chain-of-thought to every task (it is most effective for reasoning, not classification)",
          "Thinking higher temperature improves output quality (it increases randomness)",
          "Believing vague instructions can substitute for concrete examples"
        ],
        timeManagementTip: "Task type is classification → few-shot is the answer. 15 seconds."
      }
    },

    // cq03 — Vector store selection (from vector-stores.md)
    {
      id: "d1-cq03",
      domain: 1,
      task: "1.4",
      skills: ["1.4.1"],
      type: "multiple-choice",
      difficulty: "hard",
      scenario: "A legal technology company is building a contract analysis platform. The platform must perform semantic search across 2 million legal documents with sub-second query latency. The company also needs to run complex filtered queries combining vector similarity with metadata filters such as jurisdiction, contract type, and date range. The platform has variable traffic with periods of zero usage overnight.",
      question: "Which vector store solution BEST meets these requirements?",
      options: [
        { id: "a", text: "Amazon Aurora PostgreSQL with pgvector extension, using IVFFlat indexes for approximate nearest neighbor search" },
        { id: "b", text: "Amazon OpenSearch Serverless with vector search collection type, using HNSW indexes and metadata filtering" },
        { id: "c", text: "Amazon DynamoDB with vector embeddings stored as binary attributes and a Lambda function for similarity computation" },
        { id: "d", text: "Amazon Bedrock Knowledge Bases with a Pinecone vector database for high-performance filtered search" }
      ],
      correctAnswers: ["b"],
      explanation: "OpenSearch Serverless with vector search collection type provides sub-second vector similarity search at scale (millions of documents), native support for combining vector queries with metadata filters, HNSW indexes for high recall and low latency, and serverless scaling that automatically scales down during low-traffic periods, reducing costs during overnight zero-usage periods.",
      incorrectExplanations: {
        a: "Aurora PostgreSQL with pgvector can handle vector search but is not optimized for it at 2M document scale with sub-second latency requirements. IVFFlat indexes have lower recall than HNSW, and Aurora does not scale to zero — you pay for provisioned instances even during overnight periods.",
        c: "DynamoDB is not designed for vector similarity search. Storing embeddings as binary attributes and using Lambda for computation would be extremely slow and expensive at scale, requiring a full scan of all vectors for each query.",
        d: "Pinecone is a third-party service, not an AWS-native solution. While Bedrock Knowledge Bases supports Pinecone, the question's requirements around variable traffic and serverless scaling are best met by OpenSearch Serverless, which is fully integrated with the AWS ecosystem."
      },
      parseStrategy: {
        keyPhrase: "BEST meets these requirements",
        eliminationHints: [
          "Aurora pgvector: doesn't scale to zero, IVFFlat has lower recall than HNSW",
          "DynamoDB: not designed for vector similarity search",
          "Pinecone: third-party, not the best AWS-native fit",
          "OpenSearch Serverless: serverless scaling + HNSW + metadata filtering"
        ],
        decisionFramework: "For large-scale vector search with metadata filtering and variable traffic, OpenSearch Serverless is the AWS-native choice. It provides HNSW indexes, metadata filtering, and scales with demand."
      },
      services: ["Amazon OpenSearch Serverless", "Amazon Aurora PostgreSQL", "Amazon DynamoDB"],
      examTip: "OpenSearch Serverless is the go-to for large-scale vector search on AWS. Aurora pgvector works for smaller workloads or when you need relational features alongside vector search.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which AWS vector store handles 2M documents with sub-second latency, metadata filtering, and variable traffic efficiently?",
        testedConcepts: ["Vector store selection", "HNSW vs IVFFlat indexes", "OpenSearch Serverless scaling", "Metadata filtering in vector search", "Serverless vs provisioned"],
        servicesInPlay: [
          { service: "Amazon OpenSearch Serverless", role: "Serverless vector search with HNSW indexes and metadata filtering — scales with traffic", isCorrectAnswer: true },
          { service: "Amazon Aurora PostgreSQL (pgvector)", role: "Distractor — works but doesn't scale to zero and IVFFlat has lower recall", isCorrectAnswer: false },
          { service: "Amazon DynamoDB", role: "Distractor — not designed for vector similarity search", isCorrectAnswer: false },
          { service: "Pinecone", role: "Distractor — third-party service, not AWS-native", isCorrectAnswer: false }
        ],
        approachStrategy: "Map requirements to capabilities: sub-second at 2M docs → needs HNSW index at scale. Metadata filtering → needs native filter support. Variable traffic → needs serverless scaling. Only OpenSearch Serverless meets all three.",
        commonMistakes: [
          "Choosing Aurora pgvector for all vector search use cases without considering scale",
          "Thinking DynamoDB can efficiently perform similarity search",
          "Not recognizing that OpenSearch Serverless provides native vector + metadata filter combinations"
        ],
        timeManagementTip: "Variable traffic with zero overnight usage = serverless. That eliminates Aurora (A). DynamoDB for vector search is always wrong (C). Compare B and D on AWS-native fit."
      }
    },

    // cq04 — Bedrock model inference parameters (from bedrock-deep-dive.md)
    {
      id: "d1-cq04",
      domain: 1,
      task: "1.2",
      skills: ["1.2.1"],
      type: "multiple-choice",
      difficulty: "easy",
      scenario: "A developer is building a code generation tool using Amazon Bedrock. The tool generates boilerplate code from natural language descriptions. Users report that the generated code sometimes includes creative but syntactically invalid variations. The developer needs the output to be as deterministic and correct as possible.",
      question: "Which inference parameter adjustment will MOST reduce variability in the generated code?",
      options: [
        { id: "a", text: "Set temperature to 0 and top_p to 1" },
        { id: "b", text: "Set temperature to 1 and top_p to 0.9" },
        { id: "c", text: "Increase max_tokens to allow longer code outputs" },
        { id: "d", text: "Add a stop sequence of '```' to terminate code blocks" }
      ],
      correctAnswers: ["a"],
      explanation: "Setting temperature to 0 makes the model select the highest-probability token at each step, producing the most deterministic output possible. This eliminates creative variations that lead to syntactically invalid code. top_p at 1 means no nucleus sampling restriction, so temperature alone controls the sampling behavior. Together, this configuration produces the most consistent, repeatable outputs.",
      incorrectExplanations: {
        b: "Temperature 1 is the default and allows significant randomness in token selection. top_p at 0.9 provides some restriction but still allows variable outputs. This will not meaningfully reduce the creative variations.",
        c: "Increasing max_tokens controls output length, not output variability. It would allow longer code but would not make the code more deterministic or syntactically correct.",
        d: "Stop sequences control when generation terminates, not how tokens are selected. Adding a stop sequence does not affect the variability or correctness of the generated code."
      },
      parseStrategy: {
        keyPhrase: "MOST reduce variability",
        eliminationHints: [
          "Temperature 1 = default randomness (no improvement)",
          "max_tokens = output length, not variability",
          "Stop sequences = when to stop, not how to generate",
          "Temperature 0 = greedy decoding = most deterministic"
        ],
        decisionFramework: "Temperature controls randomness. Temperature 0 = greedy (most deterministic). Temperature 1 = default. Temperature > 1 = more random."
      },
      services: ["Amazon Bedrock"],
      examTip: "Temperature 0 = deterministic output. This is the single most important parameter for reducing variability. For code generation, always start with temperature 0.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which Bedrock inference parameter makes code generation output most deterministic?",
        testedConcepts: ["Temperature parameter", "top_p (nucleus sampling)", "max_tokens", "Stop sequences", "Inference parameter effects"],
        servicesInPlay: [
          { service: "Amazon Bedrock", role: "Foundation model inference with configurable parameters", isCorrectAnswer: true }
        ],
        approachStrategy: "The question asks about reducing variability. Temperature directly controls randomness. Temperature 0 = greedy decoding = zero randomness. The other parameters control different aspects of generation.",
        commonMistakes: [
          "Confusing temperature with top_p — both affect sampling but temperature is the primary control",
          "Thinking max_tokens affects output quality (it only affects length)",
          "Not knowing that temperature 0 produces greedy (deterministic) decoding"
        ],
        timeManagementTip: "Variability → temperature. Temperature 0 → deterministic. 10 seconds."
      }
    },

    // cq05 — Embedding model selection for RAG (from retrieval-mechanisms.md)
    {
      id: "d1-cq05",
      domain: 1,
      task: "1.5",
      skills: ["1.5.1"],
      type: "multiple-choice",
      difficulty: "hard",
      scenario: "A company deployed a RAG application 6 months ago using Amazon Titan Embeddings V1 to generate vectors for 500,000 documents stored in OpenSearch Serverless. The company now wants to switch to Amazon Titan Embeddings V2 for better multilingual support. After updating the embedding model in the application code, users report that search quality has degraded significantly — queries return irrelevant documents.",
      question: "What is the MOST likely cause of the degraded search quality?",
      options: [
        { id: "a", text: "Amazon Titan Embeddings V2 produces lower-quality vectors than V1 for this document corpus" },
        { id: "b", text: "The existing document vectors were generated by V1 and are incompatible with query vectors generated by V2, causing embedding space mismatch" },
        { id: "c", text: "OpenSearch Serverless does not support Amazon Titan Embeddings V2 vector dimensions" },
        { id: "d", text: "The V2 model requires a different similarity metric (cosine vs dot product) than what is configured in OpenSearch" }
      ],
      correctAnswers: ["b"],
      explanation: "Different embedding model versions produce vectors in different embedding spaces. V1 and V2 were trained separately, so their vectors are not directly comparable. When you query with a V2-generated vector against a corpus indexed with V1-generated vectors, the similarity scores are meaningless — you're comparing coordinates from different maps. The fix is to re-embed all documents with V2 and rebuild the index.",
      incorrectExplanations: {
        a: "V2 is generally higher quality than V1 with better multilingual support. The issue is not vector quality but embedding space incompatibility between versions.",
        c: "OpenSearch Serverless supports configurable vector dimensions. If the dimensions matched (both V1 and V2 support 1024 dimensions), the vectors would be accepted — the issue is semantic incompatibility, not dimensional incompatibility.",
        d: "While similarity metric configuration matters, both models work with cosine similarity. The fundamental issue is that vectors from different model versions exist in different embedding spaces, not the similarity metric used to compare them."
      },
      parseStrategy: {
        keyPhrase: "MOST likely cause",
        eliminationHints: [
          "V2 is newer and higher quality — not the issue",
          "Dimension support is a technical check, not a quality issue",
          "Similarity metric is secondary to embedding space compatibility",
          "Different model versions = different embedding spaces = incompatible vectors"
        ],
        decisionFramework: "When switching embedding models causes search quality degradation, the root cause is almost always embedding space mismatch. Documents must be re-embedded with the new model."
      },
      services: ["Amazon Bedrock", "Amazon OpenSearch Serverless", "Amazon Titan Embeddings"],
      examTip: "Switching embedding models requires re-indexing ALL documents. You cannot mix vectors from different embedding models — they live in different vector spaces.",
      strategicBreakdown: {
        whatIsBeingAsked: "Why did search quality degrade after switching from Titan Embeddings V1 to V2 without re-indexing documents?",
        testedConcepts: ["Embedding model versioning", "Embedding space compatibility", "Vector store re-indexing", "RAG pipeline troubleshooting"],
        servicesInPlay: [
          { service: "Amazon Titan Embeddings V1/V2", role: "Different embedding models producing incompatible vector spaces", isCorrectAnswer: true },
          { service: "Amazon OpenSearch Serverless", role: "Vector store containing V1 vectors being queried with V2 vectors", isCorrectAnswer: false }
        ],
        approachStrategy: "The scenario describes changing the query embedding model without re-indexing documents. This is a classic embedding drift / embedding space mismatch issue. Vectors from different models are not comparable.",
        commonMistakes: [
          "Assuming newer model versions are backward-compatible in vector space (they are not)",
          "Blaming the vector store when the issue is embedding model mismatch",
          "Not recognizing that re-indexing is required when changing embedding models"
        ],
        timeManagementTip: "Changed embedding model + degraded quality = embedding space mismatch. Instant recognition if you know the concept."
      }
    }
  ],

  2: [
    // cq06 — Agent ReAct pattern (from agent-patterns.md)
    {
      id: "d2-cq01",
      domain: 2,
      task: "2.6",
      skills: ["2.6.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A developer is building a Bedrock Agent that helps employees search internal databases, generate reports, and send email notifications. During testing, the agent occasionally calls the wrong tool or provides tool inputs that don't match the expected schema, causing action group failures.",
      question: "Which approach will MOST effectively reduce tool invocation errors?",
      options: [
        { id: "a", text: "Increase the agent's maximum number of reasoning turns to allow more attempts at selecting the correct tool" },
        { id: "b", text: "Write detailed, unambiguous tool descriptions that clearly specify when each tool should be used, required input parameters, and expected output format" },
        { id: "c", text: "Add a post-processing Lambda function that validates tool selections and retries with corrections when errors occur" },
        { id: "d", text: "Switch to a larger, more capable foundation model to improve the agent's reasoning ability" }
      ],
      correctAnswers: ["b"],
      explanation: "The agent selects tools based purely on text descriptions in the system prompt. Detailed, unambiguous tool descriptions give the model clear signals about when to use each tool, what inputs are required, and what outputs to expect. This is the highest-leverage fix because it addresses the root cause — the model lacks sufficient information to make correct tool selections.",
      incorrectExplanations: {
        a: "More reasoning turns allow more retries but don't fix the root cause of incorrect tool selection. The agent will keep making the same mistakes with the same inadequate tool descriptions.",
        c: "Post-processing validation adds complexity and latency. It treats the symptom (failed invocations) rather than the cause (unclear tool descriptions). The agent should select the right tool on the first attempt.",
        d: "A larger model may slightly improve tool selection, but if the tool descriptions are ambiguous, even the best model will make mistakes. Better descriptions are more effective and cost less than model upgrades."
      },
      parseStrategy: {
        keyPhrase: "MOST effectively reduce tool invocation errors",
        eliminationHints: [
          "More turns = more retries, not fewer errors",
          "Post-processing = treats symptoms, not root cause",
          "Larger model = expensive, doesn't fix ambiguous descriptions",
          "Better tool descriptions = addresses root cause directly"
        ],
        decisionFramework: "Agent tool selection is driven by tool descriptions. When the agent picks the wrong tool, improve the descriptions first. This is the prompt engineering equivalent for agents."
      },
      services: ["Amazon Bedrock Agents"],
      examTip: "Tool descriptions are the 'prompt engineering' of agentic AI. The model chooses tools based on descriptions alone — make them precise, detailed, and unambiguous.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to fix a Bedrock Agent that frequently invokes the wrong tools or provides incorrect parameters.",
        testedConcepts: ["Agent tool selection", "Action group configuration", "Tool descriptions", "Agent debugging", "ReAct pattern"],
        servicesInPlay: [
          { service: "Amazon Bedrock Agents", role: "Agent runtime — tool descriptions drive tool selection behavior", isCorrectAnswer: true }
        ],
        approachStrategy: "The agent selects tools based on text descriptions. Wrong tool selection = inadequate descriptions. Improve descriptions to fix the root cause. All other options treat symptoms.",
        commonMistakes: [
          "Thinking a more powerful model compensates for poor tool descriptions",
          "Adding retry logic instead of fixing the root cause",
          "Not realizing that tool descriptions are the primary input for tool selection decisions"
        ],
        timeManagementTip: "Wrong tool selection → look for 'tool descriptions' in the answer options. 15 seconds."
      }
    },

    // cq07 — Production resilience patterns (from production-patterns.md)
    {
      id: "d2-cq02",
      domain: 2,
      task: "2.7",
      skills: ["2.7.1"],
      type: "multiple-choice",
      difficulty: "hard",
      scenario: "A company's GenAI-powered customer service application experiences intermittent Amazon Bedrock API throttling during peak hours. When throttling occurs, the application retries immediately, causing a cascade of failures that brings down the entire system for several minutes. The team needs to implement a resilience pattern that prevents cascading failures while maintaining service availability.",
      question: "Which resilience pattern will BEST prevent cascading failures during throttling events?",
      options: [
        { id: "a", text: "Implement a circuit breaker pattern that stops sending requests to Bedrock when the error rate exceeds a threshold, returning cached or fallback responses until the circuit resets" },
        { id: "b", text: "Add a message queue (Amazon SQS) between the application and Bedrock to buffer all requests and process them at a controlled rate" },
        { id: "c", text: "Purchase Provisioned Throughput for the Bedrock model to eliminate throttling entirely" },
        { id: "d", text: "Implement retry logic with a fixed 1-second delay between attempts to prevent overwhelming the Bedrock API" }
      ],
      correctAnswers: ["a"],
      explanation: "The circuit breaker pattern is specifically designed to prevent cascading failures. When the error rate exceeds a threshold, the circuit 'opens' and stops sending requests, returning cached or fallback responses instead. This gives the downstream service time to recover without being overwhelmed by retries. After a cooldown period, the circuit 'half-opens' to test if the service has recovered. This pattern directly addresses the described cascade.",
      incorrectExplanations: {
        b: "An SQS queue buffers requests but introduces significant latency for a real-time customer service application. Users expect immediate responses, not queued processing. This pattern is better suited for asynchronous workloads.",
        c: "Provisioned Throughput reserves dedicated capacity but involves a commitment and cost regardless of usage. It doesn't address the cascading failure pattern itself — if provisioned capacity is also exhausted, the same cascade would occur.",
        d: "Fixed-delay retries still contribute to the cascade. During throttling, all instances retry at the same 1-second interval, creating synchronized retry storms. Exponential backoff with jitter would be better than fixed delay, but neither addresses cascading failures as effectively as a circuit breaker."
      },
      parseStrategy: {
        keyPhrase: "BEST prevent cascading failures",
        eliminationHints: [
          "SQS queue = adds latency, not suitable for real-time customer service",
          "Provisioned Throughput = doesn't prevent cascading failures, just reduces throttling",
          "Fixed-delay retries = creates synchronized retry storms = worsens cascading failures",
          "Circuit breaker = designed specifically for preventing cascading failures"
        ],
        decisionFramework: "Cascading failures from retries → circuit breaker pattern. This is the textbook solution. Circuit breakers stop the cascade by halting requests when errors exceed a threshold."
      },
      services: ["Amazon Bedrock"],
      examTip: "Circuit breaker pattern = prevents cascading failures. Retry with exponential backoff = handles transient errors. Queue = handles burst traffic. Know which resilience pattern matches which problem.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which pattern stops immediate retries from cascading into system-wide failure during Bedrock throttling?",
        testedConcepts: ["Circuit breaker pattern", "Retry storms", "Cascading failures", "Resilience patterns", "Production GenAI architecture"],
        servicesInPlay: [
          { service: "Amazon Bedrock", role: "Model inference API experiencing throttling", isCorrectAnswer: false },
          { service: "Circuit Breaker (application pattern)", role: "Stops sending requests during high error rates, returns fallback responses", isCorrectAnswer: true },
          { service: "Amazon SQS", role: "Distractor — message queue adds latency for real-time use case", isCorrectAnswer: false }
        ],
        approachStrategy: "The scenario describes retry storms causing cascading failures. This is the exact problem the circuit breaker pattern solves. Eliminate options that don't prevent the cascade (SQS adds latency, Provisioned Throughput doesn't fix the pattern, fixed retries worsen it).",
        commonMistakes: [
          "Thinking any retry strategy prevents cascading failures (retries can worsen cascades)",
          "Choosing Provisioned Throughput as a universal solution to throttling (it doesn't fix the retry storm pattern)",
          "Not recognizing that circuit breakers return fallback responses rather than just failing"
        ],
        timeManagementTip: "'Cascading failures' + 'retries making it worse' = circuit breaker. Pattern recognition: 15 seconds."
      }
    },

    // cq08 — Streaming API patterns (from fm-api-integrations.md)
    {
      id: "d2-cq03",
      domain: 2,
      task: "2.4",
      skills: ["2.4.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A company is building a chatbot using Amazon Bedrock that generates long-form responses (2000+ tokens). Users are complaining about the poor experience of waiting 8-10 seconds with no visible output before the full response appears. The development team wants to improve perceived responsiveness without changing the foundation model or reducing response quality.",
      question: "Which implementation change will MOST improve the user experience?",
      options: [
        { id: "a", text: "Switch from the InvokeModel API to the InvokeModelWithResponseStream API and render tokens as they are generated" },
        { id: "b", text: "Implement client-side polling that checks for the response every 500 milliseconds" },
        { id: "c", text: "Add a loading animation with an estimated time remaining indicator" },
        { id: "d", text: "Pre-generate responses for common queries and cache them in DynamoDB for instant retrieval" }
      ],
      correctAnswers: ["a"],
      explanation: "The InvokeModelWithResponseStream API returns tokens incrementally as they are generated, allowing the frontend to render them in real-time. Users see the first tokens within 1-2 seconds (time-to-first-token) instead of waiting 8-10 seconds for the complete response. The total generation time is the same, but perceived latency drops dramatically because users can start reading immediately.",
      incorrectExplanations: {
        b: "Client-side polling against the synchronous InvokeModel API doesn't help — the API only returns the complete response, not partial results. Polling every 500ms would just get repeated 'not ready' responses until the full response is available.",
        c: "A loading animation improves the experience marginally but doesn't address the fundamental issue. Users still wait 8-10 seconds with no useful content. Streaming provides actual content within seconds.",
        d: "Pre-generating and caching responses only works for predictable queries. A chatbot handles diverse, unpredictable user inputs. This approach cannot cover the long tail of possible queries and doesn't improve the experience for uncached queries."
      },
      parseStrategy: {
        keyPhrase: "MOST improve the user experience",
        eliminationHints: [
          "Polling doesn't return partial responses from InvokeModel",
          "Loading animation = cosmetic, doesn't provide content sooner",
          "Caching = only works for predictable queries",
          "Streaming = tokens appear in real-time, drastically reduces perceived latency"
        ],
        decisionFramework: "Long generation times + poor UX = switch to streaming (InvokeModelWithResponseStream). Streaming reduces time-to-first-token without changing total time."
      },
      services: ["Amazon Bedrock"],
      examTip: "InvokeModelWithResponseStream is the answer whenever the question mentions long wait times for model responses. Streaming improves perceived latency, not actual latency.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to improve user experience when Bedrock responses take 8-10 seconds to generate.",
        testedConcepts: ["Streaming API (InvokeModelWithResponseStream)", "Time-to-first-token vs total time", "Perceived latency", "Bedrock API patterns"],
        servicesInPlay: [
          { service: "Amazon Bedrock InvokeModelWithResponseStream", role: "Streams tokens incrementally for real-time rendering", isCorrectAnswer: true },
          { service: "Amazon DynamoDB", role: "Distractor — caching only works for predictable queries", isCorrectAnswer: false }
        ],
        approachStrategy: "The problem is perceived latency (waiting with no output), not actual latency. Streaming addresses perceived latency by showing tokens as they generate. All other options either don't solve the problem or only partially address it.",
        commonMistakes: [
          "Thinking streaming reduces total generation time (it doesn't — same total time, but first token appears much sooner)",
          "Choosing caching as a universal solution (only works for predictable/common queries)",
          "Not knowing the difference between InvokeModel and InvokeModelWithResponseStream"
        ],
        timeManagementTip: "Long wait for response + UX complaint = streaming. Immediate recognition."
      }
    },

    // cq09 — Multi-agent orchestration (from agentic-ai.md)
    {
      id: "d2-cq04",
      domain: 2,
      task: "2.1",
      skills: ["2.1.1"],
      type: "multiple-response",
      difficulty: "hard",
      scenario: "A company is building an automated investment research system using Amazon Bedrock Agents. The system must: (1) gather financial data from multiple APIs, (2) analyze market trends using statistical models, (3) generate natural language research reports, and (4) route reports to appropriate analysts based on sector. Each capability requires specialized tools and prompts. The team wants to ensure each component can be developed, tested, and scaled independently.",
      question: "Which combination of design decisions supports independent development and scaling of each capability? (Select TWO.)",
      options: [
        { id: "a", text: "Build a single Bedrock Agent with all four capabilities as separate action groups, using a detailed system prompt to route between them" },
        { id: "b", text: "Implement a multi-agent architecture with a supervisor agent that delegates to specialized sub-agents for data gathering, analysis, report generation, and routing" },
        { id: "c", text: "Use AWS Step Functions to orchestrate four independent Lambda functions, each handling one capability without using Bedrock Agents" },
        { id: "d", text: "Deploy each specialized agent as an independent Bedrock Agent with its own model configuration, tools, and system prompt, coordinated through Amazon Bedrock multi-agent collaboration" },
        { id: "e", text: "Build all four capabilities into a single monolithic Lambda function that calls Bedrock sequentially for each step" }
      ],
      correctAnswers: ["b", "d"],
      explanation: "Both options implement multi-agent architectures where each capability is an independent agent. Option B uses a supervisor pattern where a central agent delegates to specialized sub-agents, enabling independent development and testing of each sub-agent. Option D uses Bedrock's multi-agent collaboration feature where each agent is independently deployed with its own configuration. Both approaches allow teams to develop, test, and scale each capability independently.",
      incorrectExplanations: {
        a: "A single agent with multiple action groups couples all capabilities together. Changes to one action group risk affecting others. Testing requires the full agent, and scaling applies uniformly — you can't scale the data gathering component independently of report generation.",
        c: "Step Functions with Lambda eliminates the agentic reasoning capabilities needed for complex tasks like analyzing market trends and generating research reports. This approach is suitable for deterministic workflows, not tasks requiring LLM reasoning.",
        e: "A monolithic Lambda function is the opposite of independent development and scaling. All capabilities are tightly coupled, changes require full redeployment, and the function cannot be scaled per-capability."
      },
      parseStrategy: {
        keyPhrase: "independent development and scaling",
        eliminationHints: [
          "Single agent with action groups = tightly coupled (eliminates A)",
          "Step Functions + Lambda = no agentic reasoning (eliminates C)",
          "Monolithic Lambda = opposite of independent (eliminates E)",
          "Multi-agent patterns (supervisor or collaboration) = independent components"
        ],
        decisionFramework: "Independent development and scaling requires separate, loosely coupled components. Multi-agent architectures (supervisor pattern or multi-agent collaboration) achieve this by making each capability a separate agent."
      },
      services: ["Amazon Bedrock Agents", "Amazon Bedrock Multi-Agent Collaboration"],
      examTip: "When a question requires independent development, testing, or scaling of AI capabilities, look for multi-agent architectures over single-agent-with-many-tools.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which architecture patterns allow each AI capability to be developed, tested, and scaled independently?",
        testedConcepts: ["Multi-agent architectures", "Supervisor pattern", "Bedrock multi-agent collaboration", "Loose coupling", "Independent scaling"],
        servicesInPlay: [
          { service: "Amazon Bedrock Agents (Supervisor Pattern)", role: "Central agent delegates to specialized sub-agents", isCorrectAnswer: true },
          { service: "Amazon Bedrock Multi-Agent Collaboration", role: "Independent agents coordinated through Bedrock's native multi-agent feature", isCorrectAnswer: true },
          { service: "AWS Step Functions", role: "Distractor — orchestration without agentic reasoning", isCorrectAnswer: false }
        ],
        approachStrategy: "The key requirement is independence. Eliminate any option that couples capabilities together (A, E). Then eliminate the option that removes agentic reasoning (C). Both remaining options (B, D) provide multi-agent independence.",
        commonMistakes: [
          "Thinking a single agent with multiple action groups provides independence (it doesn't — they share the same system prompt and model)",
          "Choosing Step Functions when the task requires LLM reasoning",
          "Not distinguishing between supervisor pattern and multi-agent collaboration (both are valid)"
        ],
        timeManagementTip: "Independent development = multi-agent. Eliminate single-agent (A), monolithic (E), and non-agentic (C) immediately. B and D remain."
      }
    },

    // cq10 — Enterprise integration with identity federation (from enterprise-integration.md)
    {
      id: "d2-cq05",
      domain: 2,
      task: "2.3",
      skills: ["2.3.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A company is integrating an Amazon Bedrock-powered chatbot into its existing enterprise application. The company uses Microsoft Entra ID (formerly Azure AD) as its identity provider. The chatbot must enforce role-based access control so that managers can access financial reports while regular employees can only access general knowledge base content. The company wants to use temporary AWS credentials, not long-lived access keys.",
      question: "Which authentication architecture meets these requirements with the LEAST operational overhead?",
      options: [
        { id: "a", text: "Configure Amazon Cognito user pool with OIDC federation to Microsoft Entra ID, use Cognito groups mapped to IAM roles that scope Bedrock Knowledge Base access by content type" },
        { id: "b", text: "Create IAM users for each employee with embedded access keys, and assign IAM policies based on their role in the company" },
        { id: "c", text: "Deploy an EC2 instance running a custom SAML proxy that translates Microsoft Entra tokens to AWS STS temporary credentials" },
        { id: "d", text: "Use API Gateway with Lambda authorizers that validate Microsoft Entra JWT tokens and return hardcoded IAM policies" }
      ],
      correctAnswers: ["a"],
      explanation: "Amazon Cognito with OIDC federation provides managed identity federation with Microsoft Entra ID. Users authenticate through their existing enterprise identity, and Cognito automatically issues temporary AWS credentials (via STS) based on their group membership. Cognito groups can be mapped to IAM roles that scope Bedrock Knowledge Base access by content type, implementing RBAC without managing individual user permissions. This is fully managed with no infrastructure to maintain.",
      incorrectExplanations: {
        b: "IAM users with embedded access keys directly violates the temporary credentials requirement. Long-lived access keys are a security anti-pattern and create significant operational overhead for provisioning and rotating credentials for every employee.",
        c: "A custom SAML proxy on EC2 requires managing infrastructure (instance, patching, availability) and developing custom federation logic. This adds significant operational overhead compared to the managed Cognito service.",
        d: "Lambda authorizers with hardcoded IAM policies require custom code to validate tokens and maintain policy definitions. This is less maintainable than Cognito's built-in group-to-role mapping and doesn't natively provide temporary AWS credentials for Bedrock access."
      },
      parseStrategy: {
        keyPhrase: "LEAST operational overhead",
        eliminationHints: [
          "IAM users with access keys = violates temporary credentials requirement (eliminates B immediately)",
          "Custom EC2 SAML proxy = infrastructure to manage (high overhead)",
          "Lambda authorizers with hardcoded policies = custom code maintenance",
          "Cognito with OIDC federation = fully managed, built-in group-to-role mapping"
        ],
        decisionFramework: "Enterprise identity federation + temporary credentials + RBAC + least overhead = Cognito with OIDC. This is the managed AWS solution for exactly this pattern."
      },
      services: ["Amazon Cognito", "AWS IAM", "Amazon Bedrock Knowledge Bases"],
      examTip: "Cognito + OIDC/SAML federation is the standard answer for enterprise identity integration with temporary credentials. IAM users with long-lived keys are always wrong when temporary credentials are required.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to integrate enterprise identity (Microsoft Entra) with Bedrock RBAC using temporary credentials and minimal overhead.",
        testedConcepts: ["OIDC federation", "Amazon Cognito", "Temporary credentials vs long-lived keys", "RBAC with Cognito groups", "Enterprise identity integration"],
        servicesInPlay: [
          { service: "Amazon Cognito", role: "Managed identity federation with OIDC, group-to-role mapping, temporary credentials", isCorrectAnswer: true },
          { service: "Microsoft Entra ID", role: "Enterprise identity provider — federated via OIDC", isCorrectAnswer: false },
          { service: "AWS IAM", role: "Role-based access control — roles assumed via Cognito group mapping", isCorrectAnswer: false }
        ],
        approachStrategy: "1. Eliminate B immediately (long-lived keys violate requirements). 2. Compare remaining options on operational overhead. 3. Cognito is managed; EC2 proxy and Lambda authorizers require custom code/infrastructure.",
        commonMistakes: [
          "Not immediately eliminating IAM users with access keys when temporary credentials are required",
          "Thinking a custom proxy provides less overhead than a managed service",
          "Not recognizing Cognito's built-in group-to-role mapping for RBAC"
        ],
        timeManagementTip: "Temporary credentials requirement eliminates B instantly. 'Least overhead' points to managed service (Cognito). Two-step elimination: 20 seconds."
      }
    }
  ],

  3: [
    // cq11 — Guardrails configuration (from input-output-safety.md)
    {
      id: "d3-cq01",
      domain: 3,
      task: "3.1",
      skills: ["3.1.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A financial services company has deployed a GenAI chatbot using Amazon Bedrock with guardrails. The guardrail is configured with content filters at MEDIUM strength for all categories. Users report that the chatbot refuses to discuss legitimate investment risk scenarios, blocking responses about market crashes, portfolio losses, and recession impacts because the content filter classifies financial risk discussion as harmful content.",
      question: "Which adjustment will allow legitimate financial risk discussions while maintaining safety controls?",
      options: [
        { id: "a", text: "Remove all content filters from the guardrail to prevent false positives" },
        { id: "b", text: "Change the content filter strength from MEDIUM to LOW for the relevant categories, which raises the confidence threshold required to block content" },
        { id: "c", text: "Disable the guardrail entirely and rely on the model's built-in safety training" },
        { id: "d", text: "Add a post-processing Lambda function that overrides guardrail blocks for financial terminology" }
      ],
      correctAnswers: ["b"],
      explanation: "Changing content filter strength from MEDIUM to LOW raises the confidence threshold from approximately 0.5 to approximately 0.8. This means only clearly harmful content is blocked, while legitimate financial risk discussions (which score lower on harm classifiers) are allowed through. Safety controls remain active for genuinely harmful content.",
      incorrectExplanations: {
        a: "Removing all content filters eliminates safety controls entirely, which is unacceptable for a financial services application. The goal is to tune sensitivity, not remove protection.",
        c: "Disabling the guardrail removes all safety layers including PII protection, denied topics, and content filtering. Model built-in safety is insufficient for enterprise compliance requirements.",
        d: "A Lambda function that overrides guardrail blocks based on keyword matching creates a security bypass. Malicious users could craft prompts containing financial terminology to circumvent safety controls."
      },
      parseStrategy: {
        keyPhrase: "allow legitimate discussions while maintaining safety",
        eliminationHints: [
          "Removing filters = no safety (eliminates A)",
          "Disabling guardrail = no compliance controls (eliminates C)",
          "Lambda override = security bypass vulnerability (eliminates D)",
          "Adjusting filter strength = tuning sensitivity while keeping controls"
        ],
        decisionFramework: "When guardrails are too aggressive, lower the filter strength (MEDIUM → LOW) rather than removing them. LOW still catches clearly harmful content but reduces false positives."
      },
      services: ["Amazon Bedrock Guardrails"],
      examTip: "Guardrail content filter strengths: HIGH catches subtle content (more false positives), MEDIUM is balanced, LOW catches only clearly harmful content (fewer false positives). Adjust strength, don't remove filters.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to reduce guardrail false positives without removing safety controls.",
        testedConcepts: ["Guardrail content filter strengths", "Confidence thresholds", "False positive tuning", "Defense-in-depth"],
        servicesInPlay: [
          { service: "Amazon Bedrock Guardrails", role: "Content filtering with configurable strength levels", isCorrectAnswer: true }
        ],
        approachStrategy: "The problem is false positives (legitimate content being blocked). The solution is reducing sensitivity (MEDIUM → LOW), not removing controls (A, C) or bypassing them (D).",
        commonMistakes: [
          "Thinking LOW strength means no filtering (it still blocks clearly harmful content)",
          "Removing guardrails instead of tuning them",
          "Creating workarounds that bypass security controls"
        ],
        timeManagementTip: "False positives → reduce sensitivity. MEDIUM → LOW. Eliminate any option that removes controls entirely. 20 seconds."
      }
    },

    // cq12 — PII protection pipeline (from data-security-privacy.md)
    {
      id: "d3-cq02",
      domain: 3,
      task: "3.2",
      skills: ["3.2.1"],
      type: "multiple-response",
      difficulty: "hard",
      scenario: "A healthcare company is building a patient inquiry system using Amazon Bedrock. The system must process patient messages that may contain PII such as Social Security numbers, medical record numbers, and dates of birth. The company must ensure that PII is never sent to the foundation model and that the model's responses do not contain any patient PII. The solution must comply with HIPAA requirements.",
      question: "Which combination of controls ensures PII is protected throughout the entire request-response pipeline? (Select TWO.)",
      options: [
        { id: "a", text: "Enable Bedrock model invocation logging and store all prompts and responses in an S3 bucket for HIPAA audit trails" },
        { id: "b", text: "Configure Amazon Bedrock Guardrails with PII filters set to ANONYMIZE on both input and output, replacing detected PII with placeholder tokens" },
        { id: "c", text: "Use Amazon Comprehend to detect and redact PII from user messages before they are sent to Bedrock, storing original messages in an encrypted DynamoDB table with restricted access" },
        { id: "d", text: "Instruct the foundation model via system prompt to never include PII in its responses" },
        { id: "e", text: "Deploy the application in a VPC with no internet access to prevent data exfiltration" }
      ],
      correctAnswers: ["b", "c"],
      explanation: "Guardrails PII filters with ANONYMIZE on both input and output provide a safety net that catches PII before it reaches the model (input filter) and before it reaches the user (output filter). Amazon Comprehend provides an additional pre-processing layer with more granular PII detection and redaction, while storing originals securely for potential re-identification. Together, these two controls create defense-in-depth: Comprehend catches PII before Bedrock, and Guardrails catch anything Comprehend misses.",
      incorrectExplanations: {
        a: "Enabling invocation logging with PII-containing prompts would create a new compliance risk — the logs themselves would contain PII. This contradicts the requirement to never send PII to the model (which logging records).",
        d: "System prompt instructions are not a reliable PII protection mechanism. Foundation models do not guarantee compliance with prompt instructions and can hallucinate or reproduce PII from context. PII protection must be enforced by deterministic systems, not model behavior.",
        e: "VPC isolation prevents internet access but does not address PII within the application pipeline. Bedrock is accessed via VPC endpoints, so the data still flows to the model. VPC isolation is a network control, not a data classification control."
      },
      parseStrategy: {
        keyPhrase: "PII is protected throughout the entire request-response pipeline",
        eliminationHints: [
          "Invocation logging with PII = creates new compliance risk (eliminates A)",
          "System prompt instructions = not reliable for PII control (eliminates D)",
          "VPC isolation = network control, not PII control (eliminates E)",
          "Guardrails PII ANONYMIZE = input + output PII filtering",
          "Comprehend + encrypted storage = pre-processing PII redaction"
        ],
        decisionFramework: "PII protection requires deterministic controls (Comprehend, Guardrails), not model-behavior-dependent controls (system prompts). Defense-in-depth means multiple layers: pre-processing (Comprehend) + runtime (Guardrails)."
      },
      services: ["Amazon Bedrock Guardrails", "Amazon Comprehend", "Amazon DynamoDB"],
      examTip: "Never rely on prompt instructions for PII protection — models are not deterministic. Use Bedrock Guardrails (ANONYMIZE) and Comprehend for defense-in-depth PII control.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which two controls create a defense-in-depth PII protection pipeline for a HIPAA-compliant Bedrock application?",
        testedConcepts: ["Bedrock Guardrails PII filters", "Amazon Comprehend PII detection", "Defense-in-depth", "HIPAA compliance", "Deterministic vs model-dependent controls"],
        servicesInPlay: [
          { service: "Amazon Bedrock Guardrails", role: "Runtime PII anonymization on input and output", isCorrectAnswer: true },
          { service: "Amazon Comprehend", role: "Pre-processing PII detection and redaction", isCorrectAnswer: true },
          { service: "Amazon DynamoDB", role: "Encrypted storage for original messages (supports re-identification)", isCorrectAnswer: false },
          { service: "Bedrock Model Invocation Logging", role: "Distractor — logging PII creates new compliance risk", isCorrectAnswer: false }
        ],
        approachStrategy: "Identify controls that deterministically prevent PII from reaching the model. Eliminate model-dependent controls (D) and controls that create new risks (A). Then select the two that provide defense-in-depth: pre-processing (Comprehend) and runtime (Guardrails).",
        commonMistakes: [
          "Trusting system prompts for PII protection (models are not reliable for this)",
          "Enabling invocation logging without considering that logs will contain PII",
          "Thinking VPC isolation solves data classification problems"
        ],
        timeManagementTip: "Eliminate D immediately (prompt-based PII control is never correct). Eliminate A (logging PII = new risk). Eliminate E (network ≠ data control). B and C remain."
      }
    },

    // cq13 — Governance and compliance (from governance-compliance.md)
    {
      id: "d3-cq03",
      domain: 3,
      task: "3.3",
      skills: ["3.3.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A regulated insurance company has deployed multiple GenAI applications using Amazon Bedrock. Auditors require the company to demonstrate which foundation models are being used, what data sources are being accessed, and who is invoking the models. The company needs a comprehensive audit trail that captures model usage across all applications without requiring changes to application code.",
      question: "Which AWS service provides the MOST comprehensive audit trail for Bedrock model usage without application code changes?",
      options: [
        { id: "a", text: "Amazon CloudWatch Logs with custom metrics published by each application" },
        { id: "b", text: "AWS CloudTrail configured to log all Bedrock API calls, capturing the invoking principal, model ID, and request metadata" },
        { id: "c", text: "Amazon Bedrock model invocation logging with prompts and responses stored in S3" },
        { id: "d", text: "AWS X-Ray tracing enabled on each application's Lambda functions" }
      ],
      correctAnswers: ["b"],
      explanation: "AWS CloudTrail automatically logs all AWS API calls, including Bedrock InvokeModel calls, without any application code changes. Each log entry captures the invoking IAM principal (who), the model ID (which model), the timestamp, source IP, and request parameters. This provides the audit trail auditors need — who invoked which model and when — across all applications using the same AWS account.",
      incorrectExplanations: {
        a: "CloudWatch Logs with custom metrics requires each application to publish metrics, which means application code changes. The question explicitly requires no code changes.",
        c: "Bedrock model invocation logging captures prompts and responses, which is useful for debugging but may create compliance risks by storing sensitive data. It also requires explicit enablement per model, not automatic across all applications. CloudTrail captures the audit metadata (who, what, when) more appropriately for auditors.",
        d: "X-Ray provides performance tracing (latency, error rates) but does not capture the audit information auditors need (which model, invoking principal). It also requires instrumentation in application code."
      },
      parseStrategy: {
        keyPhrase: "MOST comprehensive audit trail without application code changes",
        eliminationHints: [
          "CloudWatch custom metrics = requires code changes (violates requirement)",
          "X-Ray = performance tracing, not audit trail + requires instrumentation",
          "Invocation logging = captures prompts (may be sensitive) + requires per-model enablement",
          "CloudTrail = automatic API logging for all Bedrock calls with no code changes"
        ],
        decisionFramework: "For audit trails of AWS API usage: CloudTrail. It is automatic, captures who/what/when, and requires no application changes."
      },
      services: ["AWS CloudTrail", "Amazon Bedrock"],
      examTip: "CloudTrail = WHO did WHAT and WHEN (audit trail). CloudWatch = metrics and logs (monitoring). X-Ray = latency and tracing (performance). Invocation logs = prompts and responses (debugging). Know which service answers which question.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which service gives auditors a complete record of Bedrock model usage (who, which model, when) without modifying applications?",
        testedConcepts: ["AWS CloudTrail", "Audit logging", "Bedrock governance", "CloudTrail vs CloudWatch vs X-Ray", "Compliance monitoring"],
        servicesInPlay: [
          { service: "AWS CloudTrail", role: "Automatic API call logging with principal, model ID, and metadata", isCorrectAnswer: true },
          { service: "Amazon CloudWatch", role: "Distractor — requires custom metrics (code changes)", isCorrectAnswer: false },
          { service: "Amazon Bedrock Invocation Logging", role: "Distractor — captures prompts/responses, not audit metadata", isCorrectAnswer: false },
          { service: "AWS X-Ray", role: "Distractor — performance tracing, not audit trail", isCorrectAnswer: false }
        ],
        approachStrategy: "The auditors need who, what model, and when. CloudTrail automatically captures all of this for every AWS API call. No code changes needed. Done.",
        commonMistakes: [
          "Confusing CloudTrail (API audit) with CloudWatch (monitoring and metrics)",
          "Choosing invocation logging when auditors want usage metadata, not prompt content",
          "Thinking X-Ray provides governance/audit capabilities"
        ],
        timeManagementTip: "Audit trail + no code changes = CloudTrail. This is a 10-second question."
      }
    },

    // cq14 — Responsible AI: contextual grounding (from responsible-ai.md)
    {
      id: "d3-cq04",
      domain: 3,
      task: "3.4",
      skills: ["3.4.1"],
      type: "multiple-choice",
      difficulty: "hard",
      scenario: "A news organization is using Amazon Bedrock to generate article summaries from source articles. Editors have found that the model sometimes adds claims not present in the original article — for example, attributing quotes to people who were not quoted in the source. The organization needs an automated mechanism to detect when the model generates claims that are not grounded in the provided source material.",
      question: "Which Amazon Bedrock feature is specifically designed to detect ungrounded claims in model outputs?",
      options: [
        { id: "a", text: "Bedrock Guardrails content filters configured with HIGH strength for the MISCONDUCT category" },
        { id: "b", text: "Bedrock Guardrails contextual grounding checks that compare model output claims against the provided reference context" },
        { id: "c", text: "Bedrock model evaluation jobs that measure ROUGE scores between generated summaries and source articles" },
        { id: "d", text: "Bedrock Guardrails denied topic filters configured with topic definitions for fabricated content" }
      ],
      correctAnswers: ["b"],
      explanation: "Contextual grounding checks in Bedrock Guardrails are specifically designed to detect hallucination — claims in the model's output that are not supported by the provided reference context. The feature compares each claim in the output against the source material and calculates a grounding score. If the score falls below the configured threshold, the response is blocked as potentially hallucinated. This directly addresses the scenario of generated summaries containing claims not present in the source article.",
      incorrectExplanations: {
        a: "Content filters detect harmful content categories (hate, violence, sexual, misconduct). They are not designed to detect factual claims that are ungrounded in source material. A fabricated quote is not necessarily harmful content — it's inaccurate content.",
        c: "Model evaluation jobs with ROUGE scores measure word overlap between generated and reference text. They run as batch evaluations, not as real-time checks on individual responses. ROUGE also doesn't detect semantic hallucination — a summary could have high ROUGE overlap while still containing a fabricated claim.",
        d: "Denied topic filters block entire responses about specified topics. They cannot detect whether individual claims within a response are grounded in source material. They operate at the topic level, not the claim level."
      },
      parseStrategy: {
        keyPhrase: "detect ungrounded claims",
        eliminationHints: [
          "Content filters = harmful content, not factual accuracy (eliminates A)",
          "ROUGE scores = word overlap, not semantic grounding + batch only (eliminates C)",
          "Denied topics = topic-level blocking, not claim-level verification (eliminates D)",
          "Contextual grounding = claim-level comparison against reference context"
        ],
        decisionFramework: "Ungrounded claims = hallucination. Bedrock's contextual grounding check is the purpose-built feature for detecting hallucination by comparing output claims against provided context."
      },
      services: ["Amazon Bedrock Guardrails"],
      examTip: "Contextual grounding checks are for hallucination detection. Content filters are for harmful content. Denied topics are for off-limits subjects. Know which guardrail component handles which problem.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which Bedrock feature detects when generated summaries contain information not present in the source material (hallucination)?",
        testedConcepts: ["Contextual grounding checks", "Hallucination detection", "Guardrail components", "Content filters vs grounding checks vs denied topics"],
        servicesInPlay: [
          { service: "Amazon Bedrock Guardrails (Contextual Grounding)", role: "Compares output claims against reference context to detect ungrounded content", isCorrectAnswer: true },
          { service: "Amazon Bedrock Guardrails (Content Filters)", role: "Distractor — detects harmful content, not factual accuracy", isCorrectAnswer: false },
          { service: "Amazon Bedrock Model Evaluation", role: "Distractor — batch evaluation with ROUGE, not real-time grounding check", isCorrectAnswer: false }
        ],
        approachStrategy: "Ungrounded claims = hallucination. Map to the guardrail component designed for hallucination detection: contextual grounding checks. Eliminate components designed for different purposes.",
        commonMistakes: [
          "Confusing content filters (harmful content) with grounding checks (factual accuracy)",
          "Thinking ROUGE scores detect hallucination (they measure word overlap, not semantic grounding)",
          "Not knowing that guardrails have separate components for different types of safety"
        ],
        timeManagementTip: "Hallucination detection = contextual grounding. Direct mapping: 10 seconds."
      }
    }
  ],

  4: [
    // cq15 — Cost optimization: model tiering (from cost-optimization.md)
    {
      id: "d4-cq01",
      domain: 4,
      task: "4.1",
      skills: ["4.1.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A company operates a GenAI-powered customer service platform that handles 100,000 queries per day. Analysis shows that 70% of queries are simple FAQ-type questions (order status, return policies), 25% require moderate reasoning (product recommendations, troubleshooting), and 5% require complex reasoning (complaint resolution, escalation decisions). Currently, all queries are processed by Claude 3.5 Sonnet, costing approximately $1,300 per day.",
      question: "Which optimization strategy will deliver the GREATEST cost reduction while maintaining response quality?",
      options: [
        { id: "a", text: "Switch all queries to Claude 3.5 Haiku to reduce per-token cost across the board" },
        { id: "b", text: "Implement a model tiering strategy using a lightweight classifier to route FAQ queries to Haiku, moderate queries to Sonnet, and complex queries to Sonnet with extended context" },
        { id: "c", text: "Enable prompt caching for all queries to reduce input token costs" },
        { id: "d", text: "Reduce the max_tokens parameter for all responses to limit output token costs" }
      ],
      correctAnswers: ["b"],
      explanation: "Model tiering routes 70% of queries (simple FAQs) to the cheaper Haiku model, which handles them with equal quality at ~4x lower cost. Moderate queries stay on Sonnet, and complex queries get the full Sonnet treatment. This targets the largest volume segment (70%) with the highest cost savings per query, while maintaining quality where it matters. Estimated savings: routing 70,000 daily FAQ queries from Sonnet to Haiku saves approximately $750/day.",
      incorrectExplanations: {
        a: "Switching all queries to Haiku reduces cost but degrades quality for the 25% moderate and 5% complex queries that benefit from Sonnet's stronger reasoning. This trades quality for cost, which the question says to maintain.",
        c: "Prompt caching reduces input token costs for repeated or similar prompts, but with 100,000 diverse customer queries, cache hit rates are typically low. The savings are much smaller than model tiering, which affects 70% of traffic.",
        d: "Reducing max_tokens for all responses risks truncating complex answers that need detailed explanations. It also only reduces output token costs, not input token costs, and the savings are proportional to the reduction — much less impactful than routing 70% of queries to a cheaper model."
      },
      parseStrategy: {
        keyPhrase: "GREATEST cost reduction while maintaining response quality",
        eliminationHints: [
          "All Haiku = quality degradation for complex queries (violates 'maintain quality')",
          "Prompt caching = low hit rate for diverse queries = small savings",
          "Reduced max_tokens = truncation risk + smaller savings",
          "Model tiering = 70% of traffic at ~4x lower cost = largest savings"
        ],
        decisionFramework: "When query complexity varies, model tiering provides the best cost-quality tradeoff. Route simple queries to cheap models, complex queries to powerful models. Target the largest volume segment for maximum impact."
      },
      services: ["Amazon Bedrock"],
      examTip: "Model tiering is the highest-leverage cost optimization for GenAI applications with diverse query complexity. Route the highest-volume, lowest-complexity queries to the cheapest model first.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to reduce costs for a high-volume GenAI application with mixed query complexity without losing quality.",
        testedConcepts: ["Model tiering strategy", "Cost per token comparison", "Query classification", "Prompt caching", "Token optimization"],
        servicesInPlay: [
          { service: "Amazon Bedrock (Claude 3.5 Haiku)", role: "Cheaper model for simple FAQ queries (70% of volume)", isCorrectAnswer: true },
          { service: "Amazon Bedrock (Claude 3.5 Sonnet)", role: "Higher-capability model for moderate and complex queries", isCorrectAnswer: true },
          { service: "Amazon Bedrock Prompt Caching", role: "Distractor — low hit rate for diverse queries", isCorrectAnswer: false }
        ],
        approachStrategy: "The question provides the query distribution (70/25/5). Model tiering targets the 70% segment for maximum savings. Calculate: 70% at ~4x savings >> any other optimization that applies uniformly.",
        commonMistakes: [
          "Switching all traffic to the cheapest model without considering quality (violates 'maintaining quality')",
          "Overestimating prompt caching hit rates for diverse query patterns",
          "Not recognizing that model tiering targets the highest-volume segment for maximum leverage"
        ],
        timeManagementTip: "70% simple queries + cost optimization = model tiering to cheaper model for simple queries. The distribution in the scenario is the hint."
      }
    },

    // cq16 — Performance: TTFT and streaming (from performance-optimization.md)
    {
      id: "d4-cq02",
      domain: 4,
      task: "4.2",
      skills: ["4.2.1"],
      type: "multiple-response",
      difficulty: "hard",
      scenario: "A company's RAG application has a p50 time-to-first-token (TTFT) of 3.2 seconds, but users report that the experience feels slow. Analysis shows that the retrieval step takes 1.8 seconds (60% of TTFT), embedding the query takes 400ms, and the remaining 1 second is model inference queuing and first-token generation. The company wants to reduce TTFT to under 1.5 seconds.",
      question: "Which combination of optimizations will MOST effectively reduce TTFT? (Select TWO.)",
      options: [
        { id: "a", text: "Switch to a smaller, faster foundation model to reduce inference time" },
        { id: "b", text: "Optimize the vector search by reducing the number of retrieved documents (k value) and using approximate nearest neighbor search with HNSW indexes" },
        { id: "c", text: "Enable response streaming to reduce the total response generation time" },
        { id: "d", text: "Cache frequently used query embeddings to eliminate redundant embedding computation for repeated or similar queries" },
        { id: "e", text: "Increase the number of OpenSearch Serverless compute units to handle more concurrent queries" }
      ],
      correctAnswers: ["b", "d"],
      explanation: "Retrieval takes 1.8 seconds (60% of TTFT), making it the primary optimization target. Reducing k and using HNSW indexes can cut retrieval time from 1.8s to under 500ms. Caching query embeddings eliminates the 400ms embedding step for repeated queries, bringing it to near-zero. Together: ~500ms retrieval + ~0ms embedding + 1s inference = ~1.5s TTFT, meeting the target.",
      incorrectExplanations: {
        a: "Model inference and queuing account for only 1 second of the 3.2s TTFT. Even halving this to 500ms only saves 500ms. The biggest bottleneck is retrieval (1.8s), not inference.",
        c: "Streaming improves perceived latency after the first token appears, but TTFT measures the time until the first token arrives. Streaming does not reduce TTFT — it improves the experience after TTFT.",
        e: "More compute units help with concurrent query throughput, not individual query latency. The p50 TTFT of 3.2 seconds is per-query latency, which is determined by retrieval logic and index performance, not total capacity."
      },
      parseStrategy: {
        keyPhrase: "MOST effectively reduce TTFT",
        eliminationHints: [
          "Smaller model saves only 500ms (inference is 1s of 3.2s) — not enough alone",
          "Streaming improves experience after TTFT, doesn't reduce TTFT itself",
          "More compute units = throughput, not individual query latency",
          "Optimize retrieval (1.8s) and embedding (400ms) for biggest impact"
        ],
        decisionFramework: "Optimize the biggest bottleneck first. Retrieval = 1.8s = 56% of TTFT → optimize retrieval. Embedding = 400ms = 13% → cache embeddings. Together they address 69% of TTFT."
      },
      services: ["Amazon OpenSearch Serverless", "Amazon Bedrock"],
      examTip: "Always optimize the biggest bottleneck first. If the question gives a latency breakdown, target the largest component. Streaming improves perceived latency after TTFT, not TTFT itself.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which two optimizations reduce time-to-first-token from 3.2s to under 1.5s, given that retrieval takes 1.8s and embedding takes 400ms?",
        testedConcepts: ["Time-to-first-token optimization", "Vector search performance", "HNSW indexes", "Embedding caching", "Streaming vs TTFT"],
        servicesInPlay: [
          { service: "Amazon OpenSearch Serverless", role: "Vector search optimization with HNSW indexes and reduced k value", isCorrectAnswer: true },
          { service: "Amazon Bedrock / Embedding Cache", role: "Cache query embeddings to eliminate redundant computation", isCorrectAnswer: true }
        ],
        approachStrategy: "Use the latency breakdown: retrieval (1.8s) + embedding (400ms) + inference (1s) = 3.2s. Target the largest components. Retrieval optimization saves ~1.3s. Embedding caching saves ~400ms. Together: 3.2 - 1.3 - 0.4 = 1.5s. Meets the target.",
        commonMistakes: [
          "Thinking streaming reduces TTFT (it doesn't — it improves experience after the first token)",
          "Targeting inference time when retrieval is the bigger bottleneck",
          "Confusing throughput (concurrent queries) with latency (individual query time)"
        ],
        timeManagementTip: "Read the latency breakdown carefully. The largest component (retrieval = 1.8s) is the primary optimization target. Then check which other component can be cached or eliminated."
      }
    },

    // cq17 — Monitoring: CloudWatch metrics for GenAI (from monitoring-systems.md)
    {
      id: "d4-cq03",
      domain: 4,
      task: "4.3",
      skills: ["4.3.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A company's GenAI application has been in production for 3 months. The operations team notices that user satisfaction scores have been gradually declining, but there are no error spikes, latency increases, or throughput changes in their CloudWatch dashboards. The team suspects the model's response quality has degraded over time.",
      question: "Which monitoring approach will MOST effectively detect response quality degradation in production?",
      options: [
        { id: "a", text: "Enable Amazon Bedrock model invocation logging and manually review a random sample of prompts and responses weekly" },
        { id: "b", text: "Implement an automated evaluation pipeline that runs a golden dataset of test queries against the model daily and tracks quality metrics (accuracy, relevance, completeness) over time in CloudWatch custom metrics" },
        { id: "c", text: "Set up CloudWatch alarms on Bedrock throttling metrics to detect when the model is under heavy load" },
        { id: "d", text: "Monitor the model's token usage per request — if token counts increase, response quality is likely degrading" }
      ],
      correctAnswers: ["b"],
      explanation: "A golden dataset evaluation pipeline provides consistent, objective quality measurement over time. By running the same test queries daily and tracking quality scores, the team can detect gradual degradation trends that manual review or infrastructure metrics would miss. Custom CloudWatch metrics enable dashboards, alarms, and trend analysis for quality — treating quality as a first-class operational metric.",
      incorrectExplanations: {
        a: "Manual review is subjective, inconsistent, and doesn't scale. Weekly sampling may miss gradual degradation trends. Without consistent evaluation criteria and baseline comparisons, manual review cannot reliably detect slow quality drift.",
        c: "Throttling metrics indicate capacity issues, not response quality. The scenario explicitly states there are no latency increases or throughput changes. Throttling is not the issue.",
        d: "Token usage per request does not correlate with response quality. A response can use many tokens and be high quality, or few tokens and be poor quality. Token count is a cost metric, not a quality metric."
      },
      parseStrategy: {
        keyPhrase: "MOST effectively detect response quality degradation",
        eliminationHints: [
          "Manual review = subjective, doesn't scale, misses gradual trends",
          "Throttling metrics = capacity, not quality",
          "Token usage = cost, not quality",
          "Golden dataset + automated evaluation = objective, consistent, trend-capable"
        ],
        decisionFramework: "Quality degradation over time requires consistent, automated measurement with a fixed benchmark (golden dataset). Infrastructure metrics (latency, throttling, tokens) don't measure quality."
      },
      services: ["Amazon CloudWatch", "Amazon Bedrock"],
      examTip: "Golden datasets are the standard for detecting quality regression in GenAI. Run the same test queries over time and track scores. Infrastructure metrics don't measure response quality.",
      strategicBreakdown: {
        whatIsBeingAsked: "How to detect gradual response quality degradation when infrastructure metrics show no issues.",
        testedConcepts: ["Golden dataset evaluation", "Quality monitoring", "Custom CloudWatch metrics", "Quality vs infrastructure metrics", "Regression detection"],
        servicesInPlay: [
          { service: "Amazon CloudWatch (Custom Metrics)", role: "Track quality scores over time with dashboards and alarms", isCorrectAnswer: true },
          { service: "Amazon Bedrock", role: "Model inference — quality may degrade due to model updates or data drift", isCorrectAnswer: false }
        ],
        approachStrategy: "The scenario says infrastructure metrics are fine but quality is declining. This eliminates all infrastructure-focused options (C, D). Between manual review (A) and automated evaluation (B), automated is more consistent and detects gradual trends.",
        commonMistakes: [
          "Assuming infrastructure metrics (latency, throughput) reflect response quality",
          "Thinking manual review can detect gradual quality trends",
          "Confusing token usage metrics with quality metrics"
        ],
        timeManagementTip: "No error spikes + quality declining = need quality-specific metrics. Golden dataset evaluation is the standard answer. 15 seconds."
      }
    }
  ],

  5: [
    // cq18 — Evaluation: LLM-as-a-Judge (from evaluation-systems.md)
    {
      id: "d5-cq01",
      domain: 5,
      task: "5.1",
      skills: ["5.1.1"],
      type: "multiple-choice",
      difficulty: "medium",
      scenario: "A company is building an evaluation system for its GenAI summarization application. The team needs to evaluate whether generated summaries accurately capture the key points of source documents. They need an evaluation approach that scales to thousands of summaries per day, captures semantic quality beyond word overlap, and does not require human reviewers for every evaluation.",
      question: "Which evaluation approach BEST meets these requirements?",
      options: [
        { id: "a", text: "Calculate ROUGE scores between generated summaries and reference summaries to measure word overlap" },
        { id: "b", text: "Use the LLM-as-a-Judge pattern where a separate foundation model evaluates each summary against the source document using a scoring rubric for accuracy, completeness, and conciseness" },
        { id: "c", text: "Hire a team of domain experts to manually score each summary on a 1-5 scale for quality" },
        { id: "d", text: "Compare the token count of the summary to the source document and calculate a compression ratio as a quality proxy" }
      ],
      correctAnswers: ["b"],
      explanation: "The LLM-as-a-Judge pattern uses a foundation model to evaluate other model outputs against scoring criteria. It scales to thousands of evaluations per day (automated), captures semantic quality beyond word overlap (the judge model understands meaning), and doesn't require human reviewers for every evaluation. This approach provides consistent, rubric-based quality assessment at scale.",
      incorrectExplanations: {
        a: "ROUGE scores measure word overlap between generated and reference text. They miss semantic equivalence — two summaries can convey the same meaning using completely different words, and ROUGE would score them low. ROUGE also requires reference summaries, which may not exist for all source documents.",
        c: "Human domain expert evaluation provides the highest quality scores but does not scale to thousands of summaries per day. The question explicitly requires scaling without human reviewers for every evaluation.",
        d: "Compression ratio measures summary length relative to source length but says nothing about whether the summary accurately captures key points. A very short summary could miss critical information while having an excellent compression ratio."
      },
      parseStrategy: {
        keyPhrase: "BEST meets these requirements",
        eliminationHints: [
          "ROUGE = word overlap only, misses semantic quality",
          "Human reviewers = doesn't scale to thousands per day",
          "Compression ratio = length metric, not quality metric",
          "LLM-as-Judge = semantic evaluation + scalable + automated"
        ],
        decisionFramework: "Requirements: scale + semantic quality + no human reviewers = LLM-as-a-Judge. ROUGE lacks semantic understanding. Humans don't scale. Compression ratio doesn't measure quality."
      },
      services: ["Amazon Bedrock"],
      examTip: "LLM-as-a-Judge fills the gap between automated metrics (fast but shallow) and human evaluation (deep but slow). Use it when you need semantic quality assessment at scale.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which evaluation approach provides automated, scalable, semantic quality assessment for generated summaries?",
        testedConcepts: ["LLM-as-a-Judge pattern", "ROUGE scores", "Human evaluation", "Evaluation scaling", "Semantic vs lexical evaluation"],
        servicesInPlay: [
          { service: "Amazon Bedrock (Judge Model)", role: "Foundation model used to evaluate other model outputs against scoring rubric", isCorrectAnswer: true }
        ],
        approachStrategy: "Map each requirement to options. Scales to thousands → eliminates C (human). Semantic quality → eliminates A (ROUGE) and D (compression). No human reviewers → confirms elimination of C. LLM-as-Judge meets all three.",
        commonMistakes: [
          "Thinking ROUGE captures semantic quality (it only measures word overlap)",
          "Not knowing that LLM-as-a-Judge exists as an evaluation pattern",
          "Confusing compression ratio with summarization quality"
        ],
        timeManagementTip: "Three requirements, each eliminates at least one option. Semantic quality eliminates ROUGE and compression. Scale eliminates humans. LLM-as-Judge remains."
      }
    },

    // cq19 — Troubleshooting: RAG retrieval quality (from troubleshooting.md)
    {
      id: "d5-cq02",
      domain: 5,
      task: "5.2",
      skills: ["5.2.1"],
      type: "multiple-choice",
      difficulty: "hard",
      scenario: "A company's RAG application uses Amazon Bedrock Knowledge Bases with OpenSearch Serverless. Users report that the application answers some questions correctly but gives completely wrong answers for queries about recently updated company policies. The old (incorrect) policy information appears in responses even though the source documents in S3 have been updated. The knowledge base sync job completed successfully 24 hours ago.",
      question: "What is the MOST likely root cause of the stale responses?",
      options: [
        { id: "a", text: "The foundation model has cached the old policy information in its weights from previous queries and is generating responses from memory instead of retrieved context" },
        { id: "b", text: "The updated documents were not included in the sync job scope, so old vector embeddings still exist in OpenSearch Serverless for the outdated policy documents" },
        { id: "c", text: "OpenSearch Serverless has a 48-hour propagation delay for updated vectors, so the new embeddings have not yet become searchable" },
        { id: "d", text: "The embedding model generates different vectors for semantically similar content in old vs new documents, causing the old documents to rank higher in similarity search" }
      ],
      correctAnswers: ["b"],
      explanation: "The most likely cause is that the updated documents were not included in the sync job scope. If the old documents were deleted and new versions uploaded with different file names or paths, the sync job may have indexed the new documents without removing the old vectors. Or if the sync job only processed a subset of documents, the outdated policy documents' vectors remain in OpenSearch. The sync job 'completed successfully' but may not have processed the specific files that changed.",
      incorrectExplanations: {
        a: "Foundation models do not cache information from previous queries in their weights. Each inference is independent — the model only uses the current prompt and retrieved context. There is no query-to-query memory in the model weights.",
        c: "OpenSearch Serverless does not have a 48-hour propagation delay. Index updates are available for search within seconds to minutes, not hours or days.",
        d: "While different embedding models produce different vectors, the same model produces consistent vectors for similar content. The issue is not embedding inconsistency — it's that old vectors still exist in the index."
      },
      parseStrategy: {
        keyPhrase: "MOST likely root cause",
        eliminationHints: [
          "Models don't cache between queries — no cross-query memory in weights (eliminates A)",
          "OpenSearch doesn't have 48-hour delays — near-real-time indexing (eliminates C)",
          "Same embedding model = consistent vectors for similar content (eliminates D)",
          "Sync job scope is the common culprit for stale data in RAG"
        ],
        decisionFramework: "When RAG returns stale data after a 'successful' sync, the issue is usually sync scope: old vectors weren't removed or updated documents weren't processed. Check what the sync job actually processed."
      },
      services: ["Amazon Bedrock Knowledge Bases", "Amazon OpenSearch Serverless", "Amazon S3"],
      examTip: "A 'successful' sync job doesn't mean all documents were processed. Check the sync scope. Old vectors persisting after document updates is the #1 cause of stale RAG responses.",
      strategicBreakdown: {
        whatIsBeingAsked: "Why does a RAG application return outdated information even after a successful knowledge base sync?",
        testedConcepts: ["Knowledge base sync scope", "Vector store stale data", "RAG troubleshooting", "Foundation model behavior"],
        servicesInPlay: [
          { service: "Amazon Bedrock Knowledge Bases", role: "Sync job completed but may not have covered the updated documents", isCorrectAnswer: true },
          { service: "Amazon OpenSearch Serverless", role: "Vector store still containing old document embeddings", isCorrectAnswer: false },
          { service: "Amazon S3", role: "Source documents have been updated", isCorrectAnswer: false }
        ],
        approachStrategy: "The scenario says sync completed successfully but old data persists. This points to sync scope (not all documents processed) rather than model behavior (A), indexing delay (C), or embedding issues (D). A successful sync doesn't mean all documents were synced.",
        commonMistakes: [
          "Thinking foundation models remember information from previous queries (they don't)",
          "Assuming OpenSearch has long propagation delays (it's near-real-time)",
          "Not questioning what 'successful sync' actually means in terms of scope"
        ],
        timeManagementTip: "Stale RAG data after 'successful' sync → sync scope issue. Eliminate model-level explanations (A) and infrastructure myths (C, D) immediately."
      }
    },

    // cq20 — Troubleshooting: Agent trace debugging (from troubleshooting.md + agent-patterns.md)
    {
      id: "d5-cq03",
      domain: 5,
      task: "5.2",
      skills: ["5.2.1"],
      type: "multiple-choice",
      difficulty: "hard",
      scenario: "A developer is debugging a Bedrock Agent that is supposed to look up a customer's order status and then check inventory for potential replacement items. The agent consistently looks up the order status correctly but then skips the inventory check and returns only the order status to the user. The agent's maximum turns are set to 5, and the agent has only used 2 turns. The developer enables agent trace logging.",
      question: "Which section of the agent trace should the developer examine to understand why the agent stopped before completing the full task?",
      options: [
        { id: "a", text: "The PreProcessing trace to check if the user's input was correctly understood" },
        { id: "b", text: "The Orchestration trace's rationale field to examine the model's reasoning about whether additional tool calls are needed" },
        { id: "c", text: "The PostProcessing trace to check if the inventory response was filtered out" },
        { id: "d", text: "The FailureTrace to identify any errors that prevented the inventory tool from being invoked" }
      ],
      correctAnswers: ["b"],
      explanation: "The Orchestration trace's rationale field shows the model's step-by-step reasoning at each turn, including why it decided to call a specific tool, what it plans to do next, and crucially, why it decided to stop and return a final response. If the agent stopped after the order lookup without checking inventory, the rationale will show whether the model decided the task was complete (reasoning error), didn't know about the inventory tool (tool description issue), or had another reason for stopping. This is the diagnostic that explains 'why did the agent stop?'",
      incorrectExplanations: {
        a: "PreProcessing shows how the input was parsed and classified, but the scenario says the agent correctly understood the request and performed the first step (order lookup). Input understanding is not the issue.",
        c: "PostProcessing applies to the final response (formatting, citations) after the agent has decided to respond. It doesn't explain why the agent decided to stop early — the decision to stop happened during orchestration.",
        d: "FailureTrace captures errors and exceptions. The scenario describes the agent completing successfully (it returned a response) — it just didn't complete all steps. There is no failure, only a premature stop."
      },
      parseStrategy: {
        keyPhrase: "why the agent stopped before completing the full task",
        eliminationHints: [
          "PreProcessing = input understanding (not the issue — first step worked fine)",
          "PostProcessing = response formatting (happens after the stop decision)",
          "FailureTrace = errors (no error occurred — agent returned successfully)",
          "Orchestration rationale = model's reasoning about what to do next and when to stop"
        ],
        decisionFramework: "To understand why an agent stopped early, examine the Orchestration trace rationale. This shows the model's reasoning about whether additional steps are needed. PreProcessing is for input issues, PostProcessing is for output formatting, FailureTrace is for errors."
      },
      services: ["Amazon Bedrock Agents"],
      examTip: "Agent trace sections: PreProcessing = input parsing. Orchestration = reasoning + tool selection + stop decisions. PostProcessing = output formatting. FailureTrace = errors. Know which section answers which question.",
      strategicBreakdown: {
        whatIsBeingAsked: "Which part of the Bedrock Agent trace explains why the agent decided to stop after one tool call instead of continuing?",
        testedConcepts: ["Agent trace components", "Orchestration rationale", "Agent debugging", "Premature agent termination"],
        servicesInPlay: [
          { service: "Amazon Bedrock Agents (Trace)", role: "Agent trace logging with PreProcessing, Orchestration, PostProcessing, and FailureTrace sections", isCorrectAnswer: true }
        ],
        approachStrategy: "The question is about the agent's decision to stop. Decisions happen in Orchestration. The rationale field in the Orchestration trace shows why the model decided to stop or continue. PreProcessing and PostProcessing handle input/output, not decision-making.",
        commonMistakes: [
          "Looking at FailureTrace when no error occurred (the agent succeeded, it just did too little)",
          "Checking PreProcessing when the first step worked correctly",
          "Not knowing that the Orchestration trace contains the model's reasoning rationale"
        ],
        timeManagementTip: "Agent stopped early → look at Orchestration rationale. No error → not FailureTrace. First step worked → not PreProcessing. 15 seconds."
      }
    }
  ]
};

// ---------------------------------------------------------------------------
// Insert logic — merges into existing domain JSON files
// ---------------------------------------------------------------------------

function loadDomainFile(domain) {
  const filePath = path.join(DATA_DIR, `domain-${domain}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`Domain file not found: ${filePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveDomainFile(domain, data) {
  const filePath = path.join(DATA_DIR, `domain-${domain}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function insertQuestions() {
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const [domain, questions] of Object.entries(questionsByDomain)) {
    const data = loadDomainFile(domain);
    const existingIds = new Set(data.questions.map(q => q.id));

    let inserted = 0;
    let skipped = 0;

    for (const q of questions) {
      if (existingIds.has(q.id)) {
        console.log(`  ⏭  ${q.id} already exists — skipping`);
        skipped++;
      } else {
        data.questions.push(q);
        inserted++;
      }
    }

    if (inserted > 0) {
      saveDomainFile(domain, data);
    }

    console.log(`Domain ${domain}: ${inserted} inserted, ${skipped} skipped`);
    totalInserted += inserted;
    totalSkipped += skipped;
  }

  console.log(`\nDone — ${totalInserted} questions inserted, ${totalSkipped} skipped.`);
}

// Run
insertQuestions();
