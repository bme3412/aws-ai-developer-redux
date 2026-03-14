export async function register() {
  // Only run on the server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { logBedrockStatus } = await import('./lib/env-check');
    logBedrockStatus();
  }
}
