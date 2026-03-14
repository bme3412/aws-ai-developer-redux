import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { NextRequest, NextResponse } from 'next/server';

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Supported models for comparison
const MODEL_CONFIGS: Record<string, {
  modelId: string;
  formatRequest: (prompt: string, params: ModelParams) => unknown;
  parseResponse: (body: unknown) => { text: string; inputTokens: number; outputTokens: number };
}> = {
  'claude-sonnet': {
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    formatRequest: (prompt, params) => ({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: params.maxTokens || 1024,
      temperature: params.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
    parseResponse: (body: any) => ({
      text: body.content[0].text,
      inputTokens: body.usage.input_tokens,
      outputTokens: body.usage.output_tokens,
    }),
  },
  'claude-haiku': {
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    formatRequest: (prompt, params) => ({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: params.maxTokens || 1024,
      temperature: params.temperature || 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
    parseResponse: (body: any) => ({
      text: body.content[0].text,
      inputTokens: body.usage.input_tokens,
      outputTokens: body.usage.output_tokens,
    }),
  },
  'titan-text': {
    modelId: 'amazon.titan-text-express-v1',
    formatRequest: (prompt, params) => ({
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: params.maxTokens || 1024,
        temperature: params.temperature || 0.7,
        topP: params.topP || 0.9,
      },
    }),
    parseResponse: (body: any) => ({
      text: body.results[0].outputText,
      inputTokens: body.inputTextTokenCount || 0,
      outputTokens: body.results[0].tokenCount || 0,
    }),
  },
  'llama3': {
    modelId: 'meta.llama3-8b-instruct-v1:0',
    formatRequest: (prompt, params) => ({
      prompt: `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>`,
      max_gen_len: params.maxTokens || 1024,
      temperature: params.temperature || 0.7,
    }),
    parseResponse: (body: any) => ({
      text: body.generation,
      inputTokens: body.prompt_token_count || 0,
      outputTokens: body.generation_token_count || 0,
    }),
  },
  'mistral': {
    modelId: 'mistral.mistral-7b-instruct-v0:2',
    formatRequest: (prompt, params) => ({
      prompt: `<s>[INST] ${prompt} [/INST]`,
      max_tokens: params.maxTokens || 1024,
      temperature: params.temperature || 0.7,
    }),
    parseResponse: (body: any) => ({
      text: body.outputs[0].text,
      inputTokens: 0, // Mistral doesn't return token counts
      outputTokens: 0,
    }),
  },
};

interface ModelParams {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

// Approximate per-1K-token pricing (on-demand, us-east-1)
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet': { input: 0.003, output: 0.015 },
  'claude-haiku': { input: 0.00025, output: 0.00125 },
  'titan-text': { input: 0.0002, output: 0.0006 },
  'llama3': { input: 0.0003, output: 0.0006 },
  'mistral': { input: 0.00015, output: 0.0002 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = PRICING[model] || { input: 0, output: 0 };
  return (inputTokens / 1000) * p.input + (outputTokens / 1000) * p.output;
}

export async function POST(req: NextRequest) {
  try {
    // Check for AWS credentials
    if (!process.env.AWS_REGION) {
      return NextResponse.json({
        error: 'AWS not configured',
        details: 'Missing AWS_REGION. Copy .env.example to .env.local and add your AWS credentials.',
        setup: {
          required: ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
          alternative: 'Or configure AWS_PROFILE if using AWS CLI profiles',
        },
      }, { status: 503 });
    }

    const { prompt, models, params = {} } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json({ error: 'At least one model is required' }, { status: 400 });
    }

    // Invoke multiple models in parallel for comparison
    const results = await Promise.allSettled(
      models.map(async (modelKey: string) => {
        const config = MODEL_CONFIGS[modelKey];
        if (!config) {
          throw new Error(`Unknown model: ${modelKey}`);
        }

        const startTime = Date.now();
        const command = new InvokeModelCommand({
          modelId: config.modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify(config.formatRequest(prompt, params)),
        });

        const response = await client.send(command);
        const latencyMs = Date.now() - startTime;
        const body = JSON.parse(new TextDecoder().decode(response.body));
        const parsed = config.parseResponse(body);

        return {
          model: modelKey,
          modelId: config.modelId,
          text: parsed.text,
          latencyMs,
          inputTokens: parsed.inputTokens,
          outputTokens: parsed.outputTokens,
          estimatedCost: estimateCost(modelKey, parsed.inputTokens, parsed.outputTokens),
        };
      })
    );

    return NextResponse.json({
      results: results.map((r, i) =>
        r.status === 'fulfilled'
          ? r.value
          : { model: models[i], error: (r.reason as Error).message }
      ),
    });
  } catch (error) {
    console.error('Bedrock invoke error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to invoke model';

    // Detect common AWS credential/access errors
    if (errorMessage.includes('Could not load credentials') ||
        errorMessage.includes('Missing credentials')) {
      return NextResponse.json({
        error: 'AWS credentials not configured',
        details: 'Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env.local',
      }, { status: 503 });
    }

    if (errorMessage.includes('AccessDeniedException') ||
        errorMessage.includes('not authorized')) {
      return NextResponse.json({
        error: 'Bedrock model access not enabled',
        details: 'Enable model access in the AWS Bedrock console: Console > Bedrock > Model access',
      }, { status: 403 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
