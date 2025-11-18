export type ModelChoice = { engine: 'ollama' | 'vllm' | 'none'; model: string };
export async function selectModel(): Promise<ModelChoice> {
  const isServer = typeof window === 'undefined';
  if (isServer) return { engine: 'vllm', model: 'llama3.1' };
  const override = typeof window !== 'undefined' ? localStorage.getItem('offline_model_name') : null;
  if (override) return { engine: 'ollama', model: override };
  try {
    const r = await Promise.race([
      fetch('http://localhost:11434/api/tags', { method: 'GET' }),
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1200))
    ]);
    if (r && r.ok) {
      const j = await r.json();
      const names = Array.isArray(j?.models) ? j.models.map((m: any) => m.name) : Array.isArray(j) ? j.map((m: any) => m.name || m) : [];
      const prefer = ['llama3.1:70b', 'llama3.1:latest', 'mistral:latest', 'qwen2:latest', 'phi3.5:mini'];
      const found = prefer.find(p => names.includes(p));
      return { engine: 'ollama', model: found || 'llama3.1:latest' };
    }
  } catch {}
  return { engine: 'none', model: 'phi3.5:mini' };
}
