# Data Pipelines for GenAI

**Domain 1 | Task 1.3 | ~30 minutes**

---

## Why This Matters

Garbage in, garbage out—this old rule applies double for AI. Feed your model messy data, and you'll get messy responses. But clean, well-formatted inputs? That's how you get impressive results without changing a single line of your prompt.

This topic is about everything that happens to data before it reaches the model.

---

## Data Quality

Here's the frustrating thing about AI: it won't tell you when input data is bad. It'll just produce garbage output and act like everything's fine. That's why validation matters so much.

### Format Validation

Catches the obvious stuff:
- Is the text actually UTF-8?
- Is that JSON parseable?
- Is the image actually an image, not a corrupted file?

These sound basic, but you'd be amazed what shows up in production data.

### Completeness Checking

Ensures nothing's missing. Your prompt template expects a customer name and order history? Make sure both actually exist before building the prompt.

Missing data leads to weird, generic responses—or worse, the model invents information to fill the gap.

### Anomaly Detection

Flags the weird stuff:
- A product price of -$50?
- A date in year 2099?
- An email that's 500 characters long?

Something's wrong. Domain-specific rules catch these issues.

### Tools for Validation

**AWS Glue Data Quality** handles batch validation with declarative rules. Write rules like `price > 0` or `email contains @` in DQDL syntax. Run them automatically in your Glue ETL jobs. If data fails quality checks, stop the pipeline before wasting money on bad AI calls.

**SageMaker Data Wrangler** is your visual Swiss Army knife for data prep. Explore distributions, spot anomalies, build transformation recipes—all through a GUI. Great for understanding your data before building production pipelines.

**Lambda functions** handle real-time validation. Custom business logic that checks inputs the moment they arrive. Reject bad data immediately instead of discovering problems after expensive processing.

---

## Multimodal Data Processing

Modern AI doesn't just read text—it sees images, reads documents, and hears audio. But each type needs specific prep work.

### Images

Models have resolution limits, so scale down massive images. Convert to supported formats (JPEG, PNG, GIF, WebP). Encode as **base64** for API transmission.

For Bedrock's multimodal models (Claude 3, Titan), images go directly into the message content alongside text.

### Documents (PDFs, Word files, scanned pages)

Need text extraction. **Amazon Textract** is your OCR powerhouse with multiple APIs:

| API | Best For |
|-----|----------|
| DetectDocumentText | Basic OCR, returns lines and words |
| AnalyzeDocument | Forms (key-value pairs) and tables |
| AnalyzeExpense | Receipts and invoices |
| AnalyzeID | Identity documents |

Textract preserves document structure that simple OCR loses—critical for maintaining context in RAG systems.

### Textract Deep Dive: FeatureTypes

When calling **AnalyzeDocument**, you specify which features to extract through the `FeatureTypes` parameter. Understanding these is exam-critical:

**TABLES**
Extracts tabular data with row/column structure preserved. Perfect for financial statements, specification sheets, and any document with grid layouts. The response includes `TABLE`, `CELL`, and relationship data showing which cells belong to which tables.

**FORMS**
Extracts key-value pairs from form-like documents. "Name: John Smith" becomes `{key: "Name", value: "John Smith"}`. Essential for applications, questionnaires, and structured documents. Returns `KEY_VALUE_SET` blocks with relationships.

**SIGNATURES**
Detects the presence and location of signatures. Useful for contract processing—verify a document was signed before processing. Returns bounding box coordinates for each signature found.

**QUERIES**
Ask specific questions about the document. Instead of extracting everything, ask "What is the invoice total?" and get a direct answer. Reduces post-processing and improves accuracy for targeted extraction.

**LAYOUT**
Analyzes document structure—titles, headers, paragraphs, lists, page numbers. Critical for preserving semantic structure when chunking documents for RAG. A heading shouldn't be split from its content.

You can combine multiple features in a single call:

```python
response = textract.analyze_document(
    Document={'S3Object': {'Bucket': 'my-bucket', 'Name': 'doc.pdf'}},
    FeatureTypes=['TABLES', 'FORMS', 'SIGNATURES', 'LAYOUT']
)
```

### Synchronous vs Asynchronous Textract

**Synchronous APIs** (`DetectDocumentText`, `AnalyzeDocument`) process single-page documents and return immediately. Max file size: **10 MB**. Best for real-time processing of individual pages.

**Asynchronous APIs** (`StartDocumentTextDetection`, `StartDocumentAnalysis`) handle multi-page PDFs up to **3,000 pages** and **500 MB**. You submit a job, and Textract processes it in the background.

The async workflow:
1. Call `StartDocumentAnalysis` → receive a `JobId`
2. Poll `GetDocumentAnalysis` with the `JobId`, or set up SNS notification
3. When complete, retrieve results page by page using `NextToken` pagination

```python
# Start async job
start_response = textract.start_document_analysis(
    DocumentLocation={'S3Object': {'Bucket': 'my-bucket', 'Name': 'large-doc.pdf'}},
    FeatureTypes=['TABLES', 'FORMS'],
    NotificationChannel={
        'SNSTopicArn': 'arn:aws:sns:...:textract-complete',
        'RoleArn': 'arn:aws:iam::...:role/TextractRole'
    }
)
job_id = start_response['JobId']

# Later, retrieve results
get_response = textract.get_document_analysis(JobId=job_id)
```

**Exam tip**: Multi-page documents require async APIs. If you see "500-page PDF" in a question, the answer involves `Start*` APIs and job polling.

### Audio

Becomes text through **Amazon Transcribe**.

Key features:
- **Speaker diarization**: Identifies different speakers (who said what)
- **Custom vocabularies**: Improve accuracy for domain jargon
- **Real-time streaming**: For live transcription
- **Batch processing**: For recorded audio at scale

### Video

The combo meal—extract key frames for image analysis, transcribe the audio track for spoken content. Some workflows analyze both and synthesize insights.

### Error Handling

**Handle errors gracefully**. Corrupted images, garbled audio, password-protected PDFs—they all happen. Skip bad inputs, log issues, continue processing. Don't let one bad file crash your entire pipeline.

---

## API-Ready Data Formatting

AI APIs are picky about input format. Get it wrong and your request fails—sometimes with cryptic errors that take forever to debug.

### Bedrock's Messages API

Uses a specific structure:

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "..."}
      ]
    }
  ]
}
```

Miss a bracket? Wrong field name? Improper nesting? Request fails.

### Token Limits

Every model has a maximum context size. If your input exceeds it, the request fails or gets truncated.

**Know your model's limits.**

Options for oversized inputs:
- **Truncate**: Simple but loses data
- **Summarize**: Adds processing step
- **Chunk and aggregate**: Complex but complete

### Special Characters

Need proper escaping in JSON. Newlines, quotes, backslashes, control characters—they'll all break your JSON if not escaped correctly.

**Use proper serialization libraries, not string concatenation.**

### Best Practice

**Build a formatting layer.** Don't construct JSON throughout your codebase. Create utility functions that handle serialization consistently. When the API changes (and it will), you fix one place.

---

## Input Enhancement Techniques

Raw user input is often... raw. Typos, abbreviations, missing context. You can improve AI responses dramatically by preprocessing input before it reaches the model.

### Entity Extraction

**Amazon Comprehend** pulls out names, dates, locations, and organizations. It detects sentiment and key phrases.

Use this info to:
- Route requests (is this a complaint?)
- Filter responses (is sentiment negative?)
- Add context to prompts (what product are they discussing?)

### Comprehend Deep Dive: Custom Models

Out-of-the-box Comprehend recognizes standard entities (PERSON, ORGANIZATION, DATE, etc.), but your domain likely has specific entities it doesn't know—product codes, medical terms, internal project names. That's where **custom models** come in.

**Custom Entity Recognition**

Train Comprehend to find your specific entity types. The workflow:

1. **Prepare training data**: Create an annotations file mapping text spans to your entity types

```csv
File,Line,Begin Offset,End Offset,Type
document1.txt,0,15,25,PRODUCT_CODE
document1.txt,0,45,60,CUSTOMER_ID
```

Or use **entity lists**—simpler, just list examples of each entity type:

```csv
Text,Type
ABC-1234,PRODUCT_CODE
XYZ-5678,PRODUCT_CODE
CUST-001,CUSTOMER_ID
```

2. **Train the model**: Comprehend handles the ML infrastructure

```python
response = comprehend.create_entity_recognizer(
    RecognizerName='product-entity-recognizer',
    DataAccessRoleArn='arn:aws:iam::...:role/ComprehendRole',
    InputDataConfig={
        'EntityTypes': [
            {'Type': 'PRODUCT_CODE'},
            {'Type': 'CUSTOMER_ID'}
        ],
        'Documents': {'S3Uri': 's3://bucket/docs/'},
        'EntityList': {'S3Uri': 's3://bucket/entities.csv'}
    },
    LanguageCode='en'
)
```

3. **Create an endpoint** for real-time inference, or run batch jobs for async processing

Training takes hours; plan accordingly. Once trained, custom recognizers work just like built-in ones but find YOUR entities.

**Custom Classification**

Categorize documents into your own taxonomy—support ticket types, document categories, content topics.

The workflow:

1. **Prepare labeled data**: CSV or augmented manifest format

```csv
CLASS,TEXT
billing_issue,"I was charged twice for my subscription"
technical_problem,"The app crashes when I click the settings button"
feature_request,"It would be great if you added dark mode"
```

2. **Train the classifier**:

```python
response = comprehend.create_document_classifier(
    DocumentClassifierName='support-ticket-classifier',
    DataAccessRoleArn='arn:aws:iam::...:role/ComprehendRole',
    InputDataConfig={
        'S3Uri': 's3://bucket/training-data.csv'
    },
    LanguageCode='en',
    Mode='MULTI_CLASS'  # or 'MULTI_LABEL' for multiple categories per document
)
```

3. **Deploy and use**: Create an endpoint for real-time, or use batch jobs

**MULTI_CLASS** vs **MULTI_LABEL**:
- **MULTI_CLASS**: Document belongs to exactly one category
- **MULTI_LABEL**: Document can belong to multiple categories (e.g., a ticket about "billing" AND "cancellation")

**When to Use Custom Comprehend vs FM**

| Use Case | Comprehend Custom | Foundation Model |
|----------|-------------------|------------------|
| High-volume classification | ✓ Cheaper at scale | ✗ Expensive per call |
| Domain-specific entities | ✓ After training | ✓ Zero-shot with prompting |
| Latency-critical | ✓ Faster inference | ✗ Slower response |
| Changing categories | ✗ Requires retraining | ✓ Just update prompt |

For stable, high-volume tasks, train Comprehend. For flexible, evolving needs, use FMs.

### Text Normalization

Cleans things up:
- Expand 'u' to 'you'
- Fix obvious typos
- Standardize date formats
- Remove excessive punctuation

The model handles imperfect input, but cleaner input often produces cleaner output.

### Context Enrichment

Adds background. User asks about 'my order'? Inject their recent order details into the prompt. References a product by nickname? Resolve it to the full name.

This context enables specific, helpful responses instead of generic ones.

### Query Expansion

Broadens retrieval. A question about 'compute options' might expand to include 'EC2', 'Lambda', 'Fargate'. This helps RAG systems find relevant documents that use different terminology.

### Personalization

Tailors responses. Include relevant user history, preferences, or role. A developer might want technical details; an exec might want a summary.

---

## Validating Input Data

Validation catches problems before they become expensive mistakes.

**Glue Data Quality** defines rules declaratively:
- `Completeness of customer_id > 99%`
- `price between 0 and 10000`

Rules run automatically in Glue ETL jobs. If data fails, the pipeline stops—you don't waste money processing garbage.

**Data Wrangler** helps you understand data visually. View distributions, spot outliers, explore relationships. Great for building intuition before writing validation rules.

**Lambda** handles real-time custom validation:
- Check that referenced products exist in your catalog
- Verify prices fall within valid ranges
- Confirm customer IDs match authenticated users

**Design validation to fail fast.** If input is bad, reject immediately. Return clear error messages so users can fix their input.

---

## Preparing Multimodal Inputs

Each input type needs specific preparation.

**Bedrock multimodal models** accept images directly in the message content. Base64-encode them, keep them within size limits, and they're ready.

**SageMaker Processing** handles heavy batch transformations. Need to preprocess 10,000 images? Processing jobs run on managed infrastructure that scales automatically.

**Textract** extracts text while preserving structure. For forms and tables, it identifies fields and their values. The structured output feeds directly into AI prompts.

**Transcribe** converts speech to text with speaker identification. Custom vocabularies improve accuracy for your industry's jargon.

---

## Formatting Data for FM APIs

Getting the format right means your requests work. Getting it wrong means cryptic errors.

**Bedrock's Messages API** is your interface to most foundation models. Learn its structure: system messages for instructions, user/assistant roles for conversation, content arrays for multimodal inputs.

**Token counting** before sending requests prevents surprises. If input exceeds limits, decide how to handle it.

**Error handling** catches the inevitable failures. Parse errors, encoding issues, malformed responses—they all happen. Build robust handling that logs problems and returns meaningful errors.

**Centralize formatting logic.** Don't build JSON in ten different places. Create a formatting layer that everyone uses.

---

## Enhancing Input Quality

Enhancement makes raw input work better without changing the model.

**Comprehend** extracts entities and sentiment. Use it for routing, filtering, or context. It's faster and cheaper than using an FM for these standard NLP tasks.

**Lambda** implements custom enhancement. Normalize text, expand abbreviations, inject user context, enrich with database lookups.

**Context injection** is powerful:

Before: "What's my order status?"

After (with context injected): "Customer John Smith (ID: 12345) has order #98765, shipped yesterday, arriving Friday. What's my order status?"

The AI can give a useful, personalized response.

**Measure what works.** Not all preprocessing improves results. Some adds latency without benefit. A/B test enhanced vs. raw inputs.

---

## Service Comparison

| Criterion | Glue Data Quality | Data Wrangler | Lambda |
|-----------|------------------|---------------|--------|
| Best for | Batch validation with declarative rules | Visual exploration and recipe dev | Real-time custom processing |
| Interface | DQDL rule definitions | Visual no-code UI | Full code control |
| Scale | Batch in Glue ETL jobs | Interactive analysis | Per-request with auto-scaling |

---

## Exam Tips

| When you see... | Think... |
|-----------------|----------|
| "data quality rules" or "batch validation" | Glue Data Quality |
| "real-time custom validation" | Lambda |
| "forms or tables" | Textract AnalyzeDocument with **FORMS** or **TABLES** FeatureTypes |
| "speaker identification" | Transcribe with diarization |
| "receipts" | Textract AnalyzeExpense |
| "entity or sentiment" | Amazon Comprehend |
| "multi-page PDF" or "large documents" | Textract **async APIs** (StartDocumentAnalysis) |
| "domain-specific entities" | Comprehend **Custom Entity Recognition** |
| "document categorization at scale" | Comprehend **Custom Classification** |
| "document structure" or "headings" | Textract **LAYOUT** FeatureType |
| "signature detection" | Textract **SIGNATURES** FeatureType |

---

## Key Takeaways

> **1. Validate before sending to AI.**
> Catch errors early, save money. The model won't tell you when input is bad—it just produces garbage output.

> **2. Match the service to the task.**
> Glue Data Quality for batch validation with declarative rules. Lambda for real-time custom logic.

> **3. Use Comprehend for standard NLP.**
> Entity extraction and sentiment analysis are faster and cheaper than FM calls for these common tasks.

> **4. Choose the right extraction tool.**
> Textract for documents and OCR, Transcribe for audio, Bedrock's native multimodal for images.

> **5. Centralize formatting logic.**
> Build a formatting layer instead of constructing JSON throughout your codebase. When APIs change, you fix one place.

---

## Common Mistakes

| Mistake | Why It Matters |
|---------|----------------|
| **Skipping validation** | AI produces garbage output, not errors. You won't know until users complain about nonsensical responses. |
| **Using FMs for standard NLP tasks** | Comprehend handles entity extraction and sentiment faster and cheaper. Reserve FMs for complex reasoning. |
| **Forgetting token limits** | Inputs get truncated or requests fail outright. Count tokens before sending and handle oversized inputs gracefully. |
| **Incorrect image encoding** | Multimodal APIs need proper base64 encoding with correct content type headers. Corrupted images fail silently. |
| **Scattered formatting logic** | JSON construction in ten places means ten places to update when APIs change. Centralize it. |
