export type ModelChoice = { engine: 'ollama' | 'vllm' | 'none'; model: string };
export async function selectModel(): Promise<ModelChoice> {
  const isServer = typeof window === 'undefined';
  if (isServer) return { engine: 'vllm', model: 'llama3.1' };
  try {
    const r = await Promise.race([
      fetch('http://localhost:11434/api/tags', { method: 'GET' }),
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1200))
    ]);
    if (r && r.ok) return { engine: 'ollama', model: 'llama3.1:latest' };
  } catch {}
  return { engine: 'none', model: 'phi3.5:mini' };
}
