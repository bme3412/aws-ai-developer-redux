/**
 * Environment configuration check for Bedrock features
 * Logs available features based on configured env vars
 */

interface FeatureStatus {
  name: string;
  available: boolean;
  envVar: string;
  labPath?: string;
}

export function checkBedrockEnv(): FeatureStatus[] {
  const features: FeatureStatus[] = [
    {
      name: 'Bedrock Model Invocation',
      available: !!(process.env.AWS_REGION && (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE)),
      envVar: 'AWS_REGION, AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY (or AWS_PROFILE)',
      labPath: '/labs/bedrock-playground',
    },
    {
      name: 'Knowledge Base (RAG)',
      available: !!process.env.BEDROCK_KNOWLEDGE_BASE_ID,
      envVar: 'BEDROCK_KNOWLEDGE_BASE_ID',
      labPath: '/labs/rag-builder',
    },
    {
      name: 'Guardrails',
      available: !!process.env.BEDROCK_GUARDRAIL_ID,
      envVar: 'BEDROCK_GUARDRAIL_ID',
      labPath: '/labs/guardrails-demo',
    },
    {
      name: 'Bedrock Agents',
      available: !!(process.env.BEDROCK_AGENT_ID && process.env.BEDROCK_AGENT_ALIAS_ID),
      envVar: 'BEDROCK_AGENT_ID, BEDROCK_AGENT_ALIAS_ID',
      labPath: '/labs/agent-workshop',
    },
  ];

  return features;
}

export function logBedrockStatus(): void {
  const features = checkBedrockEnv();
  const available = features.filter(f => f.available);
  const unavailable = features.filter(f => !f.available);

  console.log('\n========================================');
  console.log('  AWS Bedrock Feature Status');
  console.log('========================================\n');

  if (available.length > 0) {
    console.log('Available features:');
    available.forEach(f => {
      console.log(`  [OK] ${f.name}`);
    });
  }

  if (unavailable.length > 0) {
    console.log('\nUnavailable features (missing env vars):');
    unavailable.forEach(f => {
      console.log(`  [ ] ${f.name}`);
      console.log(`      Set: ${f.envVar}`);
    });
  }

  console.log('\n----------------------------------------');
  console.log('Copy .env.example to .env.local and fill');
  console.log('in your AWS credentials to enable labs.');
  console.log('----------------------------------------\n');
}

// For API routes to check if a feature is configured
export function isFeatureAvailable(feature: 'invoke' | 'knowledge-base' | 'guardrails' | 'agents'): boolean {
  switch (feature) {
    case 'invoke':
      return !!(process.env.AWS_REGION);
    case 'knowledge-base':
      return !!process.env.BEDROCK_KNOWLEDGE_BASE_ID;
    case 'guardrails':
      return !!process.env.BEDROCK_GUARDRAIL_ID;
    case 'agents':
      return !!(process.env.BEDROCK_AGENT_ID && process.env.BEDROCK_AGENT_ALIAS_ID);
    default:
      return false;
  }
}
