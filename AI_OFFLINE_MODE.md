# Offline AI Mode

This project supports a force-offline mode that routes all AI requests directly to the Enhanced Fallback engine (`services/enhancedFallbackAI.ts`). Use this when you want the app to work without any external network calls or to validate offline-first behavior end-to-end.

## Enable Offline Mode

- Set one of these environment variables:
  - `AI_FORCE_OFFLINE=true`
  - `VITE_AI_FORCE_OFFLINE=true`
  - `NEXT_PUBLIC_AI_FORCE_OFFLINE=true`
- Optional runtime toggle (for quick testing in console or app boot):
  - `window.__AI_FORCE_OFFLINE__ = true` (or `globalThis.__AI_FORCE_OFFLINE__ = true`)

When enabled, `utils/aiAdapter.ts` will bypass Gemini and Hugging Face and return results from the Enhanced Fallback immediately.

## What Changes Under Offline Mode

- Provider order short-circuits: `offline` is used immediately; no network calls are made.
- All responses remain normalized to plain strings via `ensureString` and `extractAIText`.
- Client components should continue to use `analyzeWithFallback(prompt)` and parse via `regexTestOn` or `ensureString(...).match(...)`.

## Quick Verification

1. Set `AI_FORCE_OFFLINE=true` in your environment (or `window.__AI_FORCE_OFFLINE__ = true`).
2. Trigger any AI feature in the app.
3. Add a debug log temporarily where you call the adapter:
   ```ts
   const res = await analyzeWithFallback(prompt);
   console.info('AI provider used:', res.provider);
   ```
4. Expect `res.provider === 'offline'` and output sourced from the Enhanced Fallback (templates + knowledge base).

## Notes

- No UI changes are required; this is a backend/adapter-level toggle.
- You can keep caches active; the offline engine does not depend on external APIs.
- If you need per-request control, you can set `window.__AI_FORCE_OFFLINE__ = true` before the call and reset afterward.