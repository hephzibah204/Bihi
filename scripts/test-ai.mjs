#!/usr/bin/env node
// scripts/test-ai.mjs
// Quick connectivity test for AI services (Gemini and Hugging Face)
// Uses environment variables and avoids printing secrets.

const withTimeout = async (promise, ms, label) => {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await promise(ctrl.signal);
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw new Error(`${label} failed: ${e?.message || e}`);
  }
};

const getEnv = () => ({
  GEMINI_KEY: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  GEMINI_MODEL: process.env.VITE_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  HF_KEY: process.env.VITE_HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY || process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY,
  HF_MODEL: process.env.HF_MODEL || 'google/flan-t5-base'
});

async function testGemini(modelsOnly = false) {
  const { GEMINI_KEY, GEMINI_MODEL } = getEnv();
  if (!GEMINI_KEY) return { available: false, reason: 'missing_key' };

  const testModels = async (signal) => {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      method: 'GET', headers: { 'x-goog-api-key': GEMINI_KEY }, signal
    });
    return { ok: r.ok, status: r.status };
  };

  const models = await withTimeout(testModels, 8000, 'Gemini models');
  if (!models.ok) return { available: false, reason: `models_status_${models.status}` };
  if (modelsOnly) return { available: true, reason: 'models_ok' };

  const testGenerate = async (signal) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
    const body = { contents: [{ role: 'user', parts: [{ text: 'Say OK' }] }] };
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
    const txt = await r.text();
    return { ok: r.ok, status: r.status, sample: txt.slice(0, 120) };
  };

  const gen = await withTimeout(testGenerate, 10000, 'Gemini generate');
  return { available: gen.ok, status: gen.status, sample: gen.sample };
}

async function testHuggingFace() {
  const { HF_KEY, HF_MODEL } = getEnv();
  if (!HF_KEY) return { available: false, reason: 'missing_key' };

  const testGenerate = async (signal) => {
    const url = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;
    const body = { inputs: 'Say OK', parameters: { max_new_tokens: 16, return_full_text: false } };
    const r = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${HF_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
    const txt = await r.text();
    return { ok: r.ok, status: r.status, sample: txt.slice(0, 120) };
  };

  const res = await withTimeout(testGenerate, 12000, 'HuggingFace generate');
  return { available: res.ok, status: res.status, sample: res.sample };
}

(async () => {
  const online = typeof navigator === 'undefined' ? true : navigator.onLine;
  const summary = { onlineHint: online };
  try { summary.gemini = await testGemini(false); } catch (e) { summary.gemini = { available: false, error: e.message }; }
  try { summary.huggingface = await testHuggingFace(); } catch (e) { summary.huggingface = { available: false, error: e.message }; }
  console.log(JSON.stringify(summary, null, 2));
})();
