// utils/aiNormalize.ts
// Helper to normalize AI responses of varying shapes into a clean string

export function normalizeAIText(value: unknown): string {
  // Extract likely text fields from known providers
  try {
    // Gemini result objects
    const r: any = value as any;
    const maybeFn = r?.response?.text ?? r?.text;
    if (typeof maybeFn === 'function') {
      const t = maybeFn.call(r.response ?? r);
      if (typeof t === 'string') return cleanText(t);
    }
  } catch (e) {
    // ignore shape probing errors
  }

  try {
    // Hugging Face responses
    const arr = value as any;
    if (Array.isArray(arr) && arr.length > 0 && typeof arr[0]?.generated_text === 'string') {
      return cleanText(arr[0].generated_text);
    }
    const obj = value as any;
    if (typeof obj?.generated_text === 'string') return cleanText(obj.generated_text);
  } catch (e) {
    // ignore shape probing errors
  }

  // Fallback
  return cleanText(safeString(value));
}

function safeString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  try { return String(v); } catch { return ''; }
}

function cleanText(s: string): string {
  // Remove common code fences
  let out = s.trim();
  out = out.replace(/^```(?:json)?/gi, '').replace(/```$/g, '').trim();
  return out;
}