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
      return NextResponse.json(
        { error: 'Guardrail ID is required. Set BEDROCK_GUARDRAIL_ID in env or provide guardrailId.' },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to apply guardrails' },
      { status: 500 }
    );
  }
}
