import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  RetrieveCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { NextRequest, NextResponse } from 'next/server';

const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function POST(req: NextRequest) {
  try {
    const { query, knowledgeBaseId, mode, retrievalConfig = {} } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const kbId = knowledgeBaseId || process.env.BEDROCK_KNOWLEDGE_BASE_ID;
    if (!kbId) {
      return NextResponse.json({
        error: 'Knowledge Base not configured',
        details: 'Set BEDROCK_KNOWLEDGE_BASE_ID in .env.local',
        setup: {
          steps: [
            '1. Go to AWS Console > Bedrock > Knowledge bases',
            '2. Create a knowledge base with your data source (S3, etc.)',
            '3. Copy the Knowledge Base ID to BEDROCK_KNOWLEDGE_BASE_ID in .env.local',
          ],
        },
      }, { status: 503 });
    }

    if (mode === 'retrieve-only') {
      // Show just the retrieval step — what chunks come back
      const command = new RetrieveCommand({
        knowledgeBaseId: kbId,
        retrievalQuery: { text: query },
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: retrievalConfig.numberOfResults || 5,
            // Demonstrate hybrid search vs. semantic-only
            ...(retrievalConfig.overrideSearchType && {
              overrideSearchType: retrievalConfig.overrideSearchType, // 'HYBRID' | 'SEMANTIC'
            }),
          },
        },
      });

      const response = await client.send(command);

      return NextResponse.json({
        mode: 'retrieve-only',
        chunks: response.retrievalResults?.map(r => ({
          text: r.content?.text,
          score: r.score,
          source: r.location?.s3Location?.uri,
          metadata: r.metadata,
        })) || [],
      });
    }

    if (mode === 'retrieve-and-generate') {
      // Full RAG pipeline — retrieval + FM generation
      const command = new RetrieveAndGenerateCommand({
        input: { text: query },
        retrieveAndGenerateConfiguration: {
          type: 'KNOWLEDGE_BASE',
          knowledgeBaseConfiguration: {
            knowledgeBaseId: kbId,
            modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0',
            retrievalConfiguration: {
              vectorSearchConfiguration: {
                numberOfResults: retrievalConfig.numberOfResults || 5,
              },
            },
          },
        },
      });

      const response = await client.send(command);

      return NextResponse.json({
        mode: 'retrieve-and-generate',
        answer: response.output?.text,
        citations: response.citations?.map(c => ({
          generatedText: c.generatedResponsePart?.textResponsePart?.text,
          references: c.retrievedReferences?.map(ref => ({
            text: ref.content?.text?.substring(0, 200),
            source: ref.location?.s3Location?.uri,
          })),
        })) || [],
        sessionId: response.sessionId,
      });
    }

    return NextResponse.json(
      { error: 'Invalid mode. Use "retrieve-only" or "retrieve-and-generate".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Knowledge base error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to query knowledge base';

    if (errorMessage.includes('Could not load credentials') ||
        errorMessage.includes('Missing credentials')) {
      return NextResponse.json({
        error: 'AWS credentials not configured',
        details: 'Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env.local',
      }, { status: 503 });
    }

    if (errorMessage.includes('ResourceNotFoundException')) {
      return NextResponse.json({
        error: 'Knowledge Base not found',
        details: 'Check that BEDROCK_KNOWLEDGE_BASE_ID matches a knowledge base in your AWS account',
      }, { status: 404 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
