import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { NextRequest, NextResponse } from 'next/server';

const client = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function POST(req: NextRequest) {
  try {
    const { agentId, agentAliasId, sessionId, inputText, enableTrace = true } = await req.json();

    if (!inputText) {
      return NextResponse.json({ error: 'inputText is required' }, { status: 400 });
    }

    const aId = agentId || process.env.BEDROCK_AGENT_ID;
    const aAliasId = agentAliasId || process.env.BEDROCK_AGENT_ALIAS_ID;

    if (!aId || !aAliasId) {
      return NextResponse.json({
        error: 'Bedrock Agent not configured',
        details: 'Set BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID in .env.local',
        setup: {
          steps: [
            '1. Go to AWS Console > Bedrock > Agents',
            '2. Create an agent with action groups',
            '3. Create an alias for the agent',
            '4. Copy Agent ID to BEDROCK_AGENT_ID in .env.local',
            '5. Copy Alias ID to BEDROCK_AGENT_ALIAS_ID in .env.local',
          ],
        },
      }, { status: 503 });
    }

    const command = new InvokeAgentCommand({
      agentId: aId,
      agentAliasId: aAliasId,
      sessionId: sessionId || crypto.randomUUID(),
      inputText,
      enableTrace,
    });

    const response = await client.send(command);

    // Process the streaming response
    const chunks: string[] = [];
    const traces: Array<{
      type: string;
      data: unknown;
    }> = [];

    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk) {
          chunks.push(new TextDecoder().decode(event.chunk.bytes));
        }
        if (event.trace?.trace) {
          const traceData = event.trace.trace;
          let traceType = 'unknown';

          if (traceData.orchestrationTrace) {
            traceType = 'orchestration';
          } else if (traceData.preProcessingTrace) {
            traceType = 'preprocessing';
          } else if (traceData.postProcessingTrace) {
            traceType = 'postprocessing';
          } else if (traceData.failureTrace) {
            traceType = 'failure';
          }

          traces.push({
            type: traceType,
            data: traceData,
          });
        }
      }
    }

    return NextResponse.json({
      response: chunks.join(''),
      sessionId: sessionId || 'new-session',
      traces, // Shows reasoning: which tools were considered, called, and why
    });
  } catch (error) {
    console.error('Agent invocation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to invoke agent';

    if (errorMessage.includes('Could not load credentials') ||
        errorMessage.includes('Missing credentials')) {
      return NextResponse.json({
        error: 'AWS credentials not configured',
        details: 'Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env.local',
      }, { status: 503 });
    }

    if (errorMessage.includes('ResourceNotFoundException')) {
      return NextResponse.json({
        error: 'Agent not found',
        details: 'Check that BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID match an agent in your AWS account',
      }, { status: 404 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
