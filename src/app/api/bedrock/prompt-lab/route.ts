import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { NextRequest, NextResponse } from 'next/server';

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

interface Example {
  input: string;
  output: string;
}

interface PromptParams {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  examples?: Example[];
  schema?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      systemPrompt,
      technique,
      params = {},
    }: {
      prompt: string;
      systemPrompt?: string;
      technique: string;
      params: PromptParams;
    } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Build the request based on technique
    let messages: Array<{ role: string; content: string }> = [];

    switch (technique) {
      case 'zero-shot':
        messages = [{ role: 'user', content: prompt }];
        break;

      case 'few-shot':
        if (!params.examples || params.examples.length === 0) {
          return NextResponse.json({ error: 'Few-shot requires examples' }, { status: 400 });
        }
        messages = [
          { role: 'user', content: params.examples[0].input },
          { role: 'assistant', content: params.examples[0].output },
          ...params.examples.slice(1).flatMap((ex: Example) => [
            { role: 'user', content: ex.input },
            { role: 'assistant', content: ex.output },
          ]),
          { role: 'user', content: prompt },
        ];
        break;

      case 'chain-of-thought':
        messages = [
          {
            role: 'user',
            content: `${prompt}\n\nThink through this step-by-step before providing your final answer.`,
          },
        ];
        break;

      case 'structured-output':
        if (!params.schema) {
          return NextResponse.json({ error: 'Structured output requires a schema' }, { status: 400 });
        }
        messages = [
          {
            role: 'user',
            content: `${prompt}\n\nRespond ONLY with valid JSON in the following format:\n${JSON.stringify(params.schema, null, 2)}`,
          },
        ];
        break;

      case 'role-play':
        // Role-play uses system prompt heavily
        messages = [{ role: 'user', content: prompt }];
        break;

      default:
        messages = [{ role: 'user', content: prompt }];
    }

    const body: Record<string, unknown> = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: params.maxTokens || 1024,
      temperature: params.temperature ?? 0.7,
      top_p: params.topP || 0.9,
      messages,
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const startTime = Date.now();
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    });

    const response = await client.send(command);
    const latencyMs = Date.now() - startTime;
    const result = JSON.parse(new TextDecoder().decode(response.body));

    return NextResponse.json({
      technique,
      response: result.content[0].text,
      latencyMs,
      usage: result.usage,
      params: {
        temperature: params.temperature ?? 0.7,
        topP: params.topP || 0.9,
        maxTokens: params.maxTokens || 1024,
      },
      stopReason: result.stop_reason,
    });
  } catch (error) {
    console.error('Prompt lab error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute prompt' },
      { status: 500 }
    );
  }
}
