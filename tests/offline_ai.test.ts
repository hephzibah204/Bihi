import { runOfflineModel } from '../lib/ai/offline-engine/offline_llm';
test('offline model basic run', async () => {
  const out = await runOfflineModel({ prompt: 'Generate a payment summary', role: 'Bursar', tenantId: 'demo' });
  expect(typeof out).toBe('string');
  expect(out.length).toBeGreaterThan(10);
});
