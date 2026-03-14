import { BedrockRuntimeClient, ApplyGuardrailCommand } from '@aws-sdk/client-bedrock-runtime';
import { NextRequest, NextResponse } from 'next/server';

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function POST(req: NextRequest) {
  try {
    const { text, guardrailId, guardrailVersion, source = 'INPUT' } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const grId = guardrailId || process.env.BEDROCK_GUARDRAIL_ID;
    if (!grId) {
      return NextResponse.json({
        error: 'Guardrail not configured',
        details: 'Set BEDROCK_GUARDRAIL_ID in .env.local',
        setup: {
          steps: [
            '1. Go to AWS Console > Bedrock > Guardrails',
            '2. Create a guardrail with your desired policies',
            '3. Copy the Guardrail ID to BEDROCK_GUARDRAIL_ID in .env.local',
          ],
        },
      }, { status: 503 });
    }

    const command = new ApplyGuardrailCommand({
      guardrailIdentifier: grId,
      guardrailVersion: guardrailVersion || 'DRAFT',
      source: source as 'INPUT' | 'OUTPUT',
      content: [
        {
          text: { text },
        },
      ],
    });

    const response = await client.send(command);

    return NextResponse.json({
      action: response.action, // 'GUARDRAIL_INTERVENED' or 'NONE'
      outputs: response.outputs,
      assessments: response.assessments?.map(a => ({
        contentPolicy: a.contentPolicy,
        sensitiveInformationPolicy: a.sensitiveInformationPolicy,
        wordPolicy: a.wordPolicy,
        topicPolicy: a.topicPolicy,
      })) || [],
      usage: response.usage,
    });
  } catch (error) {
    console.error('Guardrails error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to apply guardrails';

    if (errorMessage.includes('Could not load credentials') ||
        errorMessage.includes('Missing credentials')) {
      return NextResponse.json({
        error: 'AWS credentials not configured',
        details: 'Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env.local',
      }, { status: 503 });
    }

    if (errorMessage.includes('ResourceNotFoundException')) {
      return NextResponse.json({
        error: 'Guardrail not found',
        details: 'Check that BEDROCK_GUARDRAIL_ID matches a guardrail in your AWS account',
      }, { status: 404 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
