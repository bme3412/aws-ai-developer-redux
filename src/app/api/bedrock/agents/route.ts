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
      return NextResponse.json(
        { error: 'Agent ID and Alias ID are required. Set BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID in env.' },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to invoke agent' },
      { status: 500 }
    );
  }
}
