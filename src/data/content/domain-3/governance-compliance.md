# AI Governance and Compliance

**Domain 3 | Task 3.3 | ~35 minutes**

---

## Why This Matters

AI governance isn't about bureaucracy—it's about building AI systems you can trust, explain, and defend. When your model makes a decision that affects a customer, can you explain why? When an auditor asks how you ensure compliance, can you show them? When something goes wrong, can you trace back to understand what happened?

The regulatory landscape for AI is evolving rapidly. The EU AI Act, state-level AI regulations, industry-specific requirements—organizations deploying AI face increasing scrutiny. But governance isn't just about avoiding penalties. It's about building confidence: confidence from your customers that AI treats them fairly, confidence from your leadership that AI systems are under control, confidence from your team that they're building something responsible.

Good governance means documentation, lineage tracking, audit logging, and continuous monitoring. It means knowing not just what your AI does, but why it does it, where its data comes from, and who's responsible when issues arise. AWS provides tools for each of these requirements. Your job is to weave them into a coherent governance framework.

---

## Model Documentation: Model Cards and Beyond

Models are complex artifacts. They have capabilities and limitations that aren't obvious from their code or weights. They perform differently on different types of inputs. They have biases inherited from training data. Without documentation, this knowledge exists only in the heads of the people who built them—and those people move on, forget, or simply can't remember every detail.

Model cards are the solution: standardized documentation that travels with the model through its lifecycle.

### SageMaker Model Cards

SageMaker Model Cards provide a structured way to document AI models. They capture the essential information that anyone working with the model needs to know:

**Model Purpose and Intended Use**
What is this model supposed to do? What use cases is it designed for? What use cases is it NOT designed for? Clear boundaries prevent misuse.

**Training Data Description**
What data was used to train this model? What time period does it cover? What populations are represented? What's missing? Training data shapes model behavior—understanding the data helps predict where the model will succeed and fail.

**Performance Metrics**
How well does the model perform? Not just overall accuracy, but performance across different conditions, different user groups, different input types. A model that performs 95% overall but only 70% for a specific demographic has a fairness problem that overall metrics hide.

**Known Limitations**
Every model has limitations. Document them. The model struggles with domain-specific jargon. It performs poorly on very long inputs. It sometimes hallucinates specific types of information. These aren't failures—they're known characteristics that users need to understand.

**Ethical Considerations**
What are the potential harms from this model? What bias risks exist? What safeguards are in place? Thoughtful ethical consideration demonstrates responsible AI development.

```typescript
import { SageMakerClient, CreateModelCardCommand } from '@aws-sdk/client-sagemaker';

const modelCard = await sagemaker.send(new CreateModelCardCommand({
  ModelCardName: 'customer-sentiment-classifier-v2',
  Content: JSON.stringify({
    model_overview: {
      model_description: 'Classifies customer feedback into positive, negative, or neutral sentiment',
      model_creator: 'ML Platform Team',
      problem_type: 'Text Classification',
      algorithm_type: 'Fine-tuned BERT',
      model_artifact: ['s3://models/sentiment/v2/model.tar.gz']
    },
    intended_uses: {
      purpose_of_model: 'Route customer feedback to appropriate teams based on sentiment',
      intended_uses: [
        'Classify support ticket sentiment for routing',
        'Analyze product review sentiment for reporting'
      ],
      factors_affecting_model_efficiency: [
        'Sarcasm and irony are often misclassified',
        'Non-English text returns low confidence scores',
        'Very short messages (<10 words) have reduced accuracy'
      ],
      risk_rating: 'Medium',
      explanations_for_risk_rating: 'Misclassification could delay response to urgent negative feedback'
    },
    training_details: {
      training_observations: 'Trained on 500K customer feedback samples from 2022-2023',
      training_job_details: {
        training_data_details: {
          datasets: [{
            name: 'Customer Feedback Corpus',
            description: '500K samples, manually labeled, English only',
            source_type: 'Internal'
          }]
        }
      }
    },
    evaluation_details: [{
      metric_type: 'accuracy',
      value: 0.92,
      evaluation_observation: 'Measured on held-out test set of 50K samples'
    }, {
      metric_type: 'f1_score',
      value: 0.89,
      evaluation_observation: 'Macro-averaged across sentiment classes'
    }],
    additional_information: {
      ethical_considerations: 'Model may reflect biases in historical labeling. Regular fairness audits recommended.',
      limitations: [
        'Not suitable for legal or medical sentiment analysis',
        'Requires minimum 10 words for reliable predictions',
        'English language only'
      ]
    }
  }),
  ModelCardStatus: 'Draft'
}));
```

### Model Registry: Version Tracking

Model cards attach to specific model versions in the Model Registry. This creates a complete history: which model version was deployed when, what its documented capabilities were at deployment time, and how it evolved over time.

```typescript
// Register model version with associated model card
await sagemaker.send(new CreateModelPackageCommand({
  ModelPackageGroupName: 'sentiment-classifiers',
  ModelPackageDescription: 'Sentiment classifier v2.1 - improved sarcasm handling',
  InferenceSpecification: {
    Containers: [{
      Image: '123456789012.dkr.ecr.us-east-1.amazonaws.com/sentiment:v2.1',
      ModelDataUrl: 's3://models/sentiment/v2.1/model.tar.gz'
    }],
    SupportedContentTypes: ['application/json'],
    SupportedResponseMIMETypes: ['application/json']
  },
  ModelApprovalStatus: 'PendingManualApproval',
  CustomerMetadataProperties: {
    'model-card-name': 'customer-sentiment-classifier-v2',
    'model-card-version': '3'
  }
}));
```

The `PendingManualApproval` status ensures models go through a review process before deployment. Compliance teams review the model card, approve (or reject) the deployment, and their decision is recorded.

---

## Data Lineage: Knowing Where Data Comes From

Data lineage tracks the journey of data through your systems: where it originated, how it transformed, and where it ended up. For GenAI, this is critical for several reasons:

- **Compliance**: Regulations often require knowing the source of data used in AI decisions
- **Debugging**: When outputs are wrong, trace back to understand if the problem is in the data
- **Impact analysis**: When source data changes, understand what's affected downstream
- **Attribution**: When RAG retrieves documents, know where those documents came from

### AWS Glue Data Lineage

AWS Glue automatically tracks data lineage for ETL jobs. As data flows through Glue transformations, lineage records capture source, transformation, and destination.

```
                    Glue Data Lineage View
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Source S3   │ --> │  Glue ETL   │ --> │ Destination │
│ Bucket      │     │  Transform  │     │ S3/Catalog  │
│             │     │             │     │             │
│ raw/docs/   │     │ Clean text  │     │ processed/  │
│ 2024-01-15  │     │ Extract     │     │ chunks.json │
└─────────────┘     │ metadata    │     └─────────────┘
                    └─────────────┘
```

When you query the lineage, you see:
- Which source files contributed to which outputs
- What transformations were applied
- When the transformation ran
- Who initiated it

### Glue Data Catalog: Central Metadata Repository

The Glue Data Catalog is your source of truth for data assets. Register datasets with descriptions, schemas, and classifications. Tag with sensitivity levels, ownership, and compliance requirements.

```typescript
// Register a data source in Glue Catalog
const catalogTable = new glue.CfnTable(this, 'CustomerFeedbackTable', {
  catalogId: this.account,
  databaseName: 'genai_data',
  tableInput: {
    name: 'customer_feedback',
    description: 'Customer feedback for sentiment analysis training',
    owner: 'ml-platform-team',
    parameters: {
      'classification': 'json',
      'sensitivity': 'confidential',
      'pii_types': 'email,name',
      'retention_days': '365',
      'data_owner': 'customer-experience@company.com'
    },
    storageDescriptor: {
      location: 's3://data-lake/customer-feedback/',
      inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
      outputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
      columns: [
        { name: 'feedback_id', type: 'string' },
        { name: 'customer_id', type: 'string' },
        { name: 'feedback_text', type: 'string' },
        { name: 'submitted_at', type: 'timestamp' },
        { name: 'sentiment_label', type: 'string' }
      ]
    }
  }
});
```

The catalog becomes a governance asset. Before using data for GenAI, check its catalog entry: What's the sensitivity? Who owns it? Is there PII? What are the retention requirements?

### Source Attribution in RAG Systems

When your RAG system retrieves documents and generates responses, track which sources contributed to each answer. This enables:

- **User verification**: Show users where information came from
- **Claim validation**: Check if citations actually support claims
- **Source auditing**: Track which documents are frequently cited

Bedrock Knowledge Bases return source attributions automatically:

```typescript
const response = await bedrockAgentRuntime.retrieveAndGenerate({
  input: { text: userQuestion },
  retrieveAndGenerateConfiguration: {
    type: 'KNOWLEDGE_BASE',
    knowledgeBaseConfiguration: {
      knowledgeBaseId: 'KB12345',
      modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0'
    }
  }
});

// Response includes citations
const citations = response.citations;
citations.forEach(citation => {
  console.log('Claim:', citation.generatedResponsePart.textResponsePart.text);
  console.log('Sources:', citation.retrievedReferences.map(ref => ({
    document: ref.location.s3Location.uri,
    excerpt: ref.content.text
  })));
});
```

Log these citations for audit purposes. When questions arise about where information came from, you have a complete record.

---

## Audit Logging: Recording Everything That Matters

Audit logging creates an immutable record of what happened in your GenAI system. When auditors ask "who accessed this data?" or "what model was used for this decision?", you have answers.

### CloudTrail: API-Level Auditing

CloudTrail automatically logs all AWS API calls. Every Bedrock invocation, every SageMaker deployment, every S3 access—all recorded with who, what, when, and from where.

```typescript
// CloudTrail trail for GenAI audit
const auditTrail = new cloudtrail.Trail(this, 'GenAIAuditTrail', {
  trailName: 'genai-governance-trail',
  bucket: auditBucket,
  isMultiRegionTrail: true,
  includeGlobalServiceEvents: true,
  enableFileValidation: true  // Detect log tampering
});

// Include Bedrock data events
auditTrail.addEventSelector({
  readWriteType: cloudtrail.ReadWriteType.ALL,
  includeManagementEvents: true,
  dataResources: [{
    type: 'AWS::Bedrock::Guardrail',
    values: ['arn:aws:bedrock:*']
  }]
});
```

Enable log file validation. This creates digest files that can detect if someone tampered with logs. For compliance purposes, you need to prove logs haven't been modified.

Store logs in locked-down S3 buckets with object lock enabled. Even administrators shouldn't be able to delete or modify audit logs.

### CloudWatch Logs: Application-Level Decisions

CloudTrail captures API calls, but your application makes decisions that APIs don't see. What prompts were used? What guardrails triggered? What outputs were generated?

Log these application-level events to CloudWatch Logs:

```typescript
// Structured logging for GenAI decisions
const logEvent = {
  timestamp: new Date().toISOString(),
  requestId: context.requestId,
  userId: event.userId,
  action: 'model_invocation',
  details: {
    modelId: 'anthropic.claude-3-sonnet',
    promptVersion: 'customer-support-v3',
    guardrailId: 'safety-guardrail-1',
    guardrailTriggered: false,
    inputTokens: 150,
    outputTokens: 350,
    latencyMs: 1250
  }
};

console.log(JSON.stringify(logEvent));
```

Structured JSON logs enable powerful querying with CloudWatch Logs Insights:

```sql
-- Find all guardrail triggers for a specific user
fields @timestamp, details.userId, details.guardrailTriggered
| filter details.action = 'model_invocation'
| filter details.guardrailTriggered = true
| sort @timestamp desc
```

### Log Retention and Compliance

Different regulations require different retention periods:

| Regulation | Typical Retention | Log Types |
|------------|------------------|-----------|
| GDPR | Varies (often 6 years) | Data access, processing decisions |
| HIPAA | 6 years | PHI access, system activity |
| SOC 2 | 1 year minimum | Security events, access logs |
| Financial | 7 years | Transaction decisions, customer interactions |

Configure S3 lifecycle policies to match requirements:

```typescript
auditBucket.addLifecycleRule({
  id: 'RetainForCompliance',
  enabled: true,
  transitions: [{
    storageClass: s3.StorageClass.GLACIER,
    transitionAfter: Duration.days(90)  // Move to cheaper storage
  }],
  expiration: Duration.days(2555)  // 7 years for financial compliance
});

// Enable Object Lock for tamper-proofing
const cfnBucket = auditBucket.node.defaultChild as s3.CfnBucket;
cfnBucket.objectLockEnabled = true;
cfnBucket.objectLockConfiguration = {
  objectLockEnabled: 'Enabled',
  rule: {
    defaultRetention: {
      mode: 'COMPLIANCE',  // Cannot be overridden, even by root
      years: 7
    }
  }
};
```

---

## Governance Systems: Organization-Wide Controls

Individual controls aren't enough—you need governance at the organizational level. AWS provides tools for enforcing policies across accounts and continuously monitoring compliance.

### AWS Organizations and Service Control Policies

AWS Organizations lets you apply policies across all accounts in your organization. Service Control Policies (SCPs) are guardrails that even account administrators can't override.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RequireGuardrailsForBedrock",
      "Effect": "Deny",
      "Action": "bedrock:InvokeModel",
      "Resource": "*",
      "Condition": {
        "Null": {
          "bedrock:GuardrailArn": "true"
        }
      }
    },
    {
      "Sid": "PreventCloudTrailDisable",
      "Effect": "Deny",
      "Action": [
        "cloudtrail:StopLogging",
        "cloudtrail:DeleteTrail"
      ],
      "Resource": "*"
    },
    {
      "Sid": "RequireVPCEndpoints",
      "Effect": "Deny",
      "Action": "bedrock:InvokeModel",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:SourceVpce": ["vpce-prod-1", "vpce-prod-2"]
        }
      }
    }
  ]
}
```

These SCPs enforce:
- All Bedrock invocations must use guardrails
- CloudTrail logging cannot be disabled
- Bedrock calls must come through approved VPC endpoints

Even if a developer has administrator access in their account, they can't violate these organization-wide policies.

### AWS Config: Continuous Compliance

AWS Config continuously evaluates resource configurations against rules you define. When resources drift out of compliance, Config detects and alerts (or auto-remediates).

```typescript
// Config rule: Bedrock guardrails must have PII filtering enabled
new config.ManagedRule(this, 'GuardrailPIIRule', {
  identifier: 'CUSTOM_GUARDRAIL_PII_CHECK',
  configRuleName: 'bedrock-guardrails-require-pii',
  inputParameters: {
    requiredPiiTypes: ['SSN', 'CREDIT_DEBIT_CARD_NUMBER']
  }
});

// Config rule: S3 buckets must have encryption
new config.ManagedRule(this, 'S3EncryptionRule', {
  identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
  configRuleName: 's3-encryption-required'
});

// Auto-remediation for non-compliant resources
new config.CfnRemediationConfiguration(this, 'S3EncryptionRemediation', {
  configRuleName: 's3-encryption-required',
  targetId: 'AWS-EnableS3BucketEncryption',
  targetType: 'SSM_DOCUMENT',
  automatic: true,
  parameters: {
    BucketName: { ResourceValue: { Value: 'RESOURCE_ID' } },
    SSEAlgorithm: { StaticValue: { Values: ['AES256'] } }
  }
});
```

Config rules run continuously. As soon as someone creates an unencrypted bucket or a guardrail without PII filtering, Config detects it. Auto-remediation can fix issues without human intervention.

### Compliance Dashboards

CloudWatch dashboards aggregate compliance status across your GenAI infrastructure:

```typescript
const complianceDashboard = new cloudwatch.Dashboard(this, 'ComplianceDashboard', {
  dashboardName: 'GenAI-Compliance-Status'
});

complianceDashboard.addWidgets(
  new cloudwatch.SingleValueWidget({
    title: 'Guardrail Trigger Rate (24h)',
    metrics: [guardrailTriggerMetric],
    width: 6
  }),
  new cloudwatch.SingleValueWidget({
    title: 'Compliance Status',
    metrics: [configComplianceMetric],
    width: 6
  }),
  new cloudwatch.GraphWidget({
    title: 'API Invocations by Model',
    left: [claudeInvocations, titanInvocations],
    width: 12
  }),
  new cloudwatch.LogQueryWidget({
    title: 'Recent Guardrail Triggers',
    logGroupNames: ['/aws/bedrock/guardrails'],
    queryString: `fields @timestamp, @message
      | filter action = 'GUARDRAIL_INTERVENED'
      | sort @timestamp desc
      | limit 20`,
    width: 24
  })
);
```

Governance teams get visibility without digging through raw logs. Executives see compliance status at a glance. Issues surface before they become incidents.

---

## Continuous Monitoring: Detecting Drift and Misuse

Governance isn't a one-time setup—it's continuous monitoring. Models drift, usage patterns change, and new risks emerge. Monitoring detects these issues early.

### Drift Detection

Model outputs can degrade over time as the world changes and the model's training becomes stale. Monitor output quality metrics and alert when performance drops.

```typescript
// Track output quality scores over time
const qualityMetric = new cloudwatch.Metric({
  namespace: 'GenAI/Quality',
  metricName: 'OutputQualityScore',
  dimensionsMap: { Model: 'claude-3-sonnet' },
  statistic: 'Average',
  period: Duration.hours(1)
});

new cloudwatch.Alarm(this, 'QualityDriftAlarm', {
  metric: qualityMetric,
  threshold: 0.8,  // Alert if quality drops below 80%
  comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
  evaluationPeriods: 6,  // 6 consecutive hours below threshold
  alarmDescription: 'Model output quality has degraded - investigate for drift'
});
```

### Bias Monitoring

Track outcomes across user segments. Are certain groups getting different treatment? Statistical disparities warrant investigation.

```typescript
// Track response patterns by user segment
const segmentMetrics = ['response_time', 'guardrail_trigger_rate', 'quality_score'];

segmentMetrics.forEach(metric => {
  ['segment_a', 'segment_b', 'segment_c'].forEach(segment => {
    new cloudwatch.Metric({
      namespace: 'GenAI/Fairness',
      metricName: metric,
      dimensionsMap: { UserSegment: segment }
    });
  });
});

// Dashboard comparing segments
dashoard.addWidgets(
  new cloudwatch.GraphWidget({
    title: 'Quality Score by User Segment',
    left: segmentQualityMetrics,
    width: 12
  })
);
```

### Misuse Detection

Unusual patterns might indicate misuse: prompt injection attempts, data exfiltration, or unauthorized use.

```typescript
// Anomaly detection for unusual usage patterns
const anomalyAlarm = new cloudwatch.Alarm(this, 'UsageAnomalyAlarm', {
  metric: new cloudwatch.MathExpression({
    expression: 'ANOMALY_DETECTION_BAND(m1, 2)',
    usingMetrics: {
      m1: invocationsMetric
    }
  }),
  threshold: 1,
  evaluationPeriods: 1,
  alarmDescription: 'Unusual invocation pattern detected'
});
```

---

## Key Services Summary

| Service | Governance Role | When to Use |
|---------|----------------|-------------|
| **SageMaker Model Cards** | Model documentation | Document capabilities, limitations, ethical considerations |
| **SageMaker Model Registry** | Version tracking | Track model versions with approval workflows |
| **Glue Data Catalog** | Metadata management | Register data sources with classifications |
| **Glue Data Lineage** | Transformation tracking | Trace data flow through ETL pipelines |
| **CloudTrail** | API auditing | Log all AWS API calls for compliance |
| **CloudWatch Logs** | Application auditing | Log application decisions and events |
| **AWS Organizations** | Policy enforcement | SCPs for organization-wide guardrails |
| **AWS Config** | Compliance monitoring | Continuous evaluation against rules |

---

## Exam Tips

- **"Document model capabilities"** → SageMaker Model Cards
- **"Track data lineage"** or **"data sources"** → Glue Data Lineage and Data Catalog
- **"Audit logging"** → CloudTrail for API calls, CloudWatch Logs for application events
- **"Organizational governance"** → AWS Organizations with SCPs
- **"Continuous compliance"** → AWS Config with rules and auto-remediation

---

## Common Mistakes to Avoid

1. **No model documentation** before deployment—creates compliance and knowledge gaps
2. **Not knowing where training data comes from**—lineage is essential for compliance
3. **Disabling CloudTrail to save costs**—audit logs are non-negotiable for governance
4. **Manual compliance checks** instead of automated Config rules—doesn't scale
5. **No monitoring for drift or bias** after deployment—governance is continuous
