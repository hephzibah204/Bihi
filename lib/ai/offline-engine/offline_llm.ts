import { selectModel } from '../models/model_selector';
import { buildPrompt } from '../prompting/prompt_builder';
import { getRagContext } from '../rag/rag_service';
import { detectTools, executeTools, registerTool } from '../orchestrator/tool_router';
import { generateEnhancedFallbackResponse } from '../../../services/enhancedFallbackAI';
type Msg = { role: 'user'|'assistant'|'system'; content: string };
type RunArgs = { prompt: string; role: 'Owner'|'Bursar'|'Teacher'|'Parent'; tenantId: string; conversationHistory?: Array<string|Msg>; topK?: number; toolArgs?: any; context?: any };
export async function runOfflineModel(args: RunArgs): Promise<string> {
  const model = await selectModel();
  try {
    const { fee_overview, top_debtors, payment_projection } = await import('../../../supabase/functions/tools/finance');
    const { subject_performance, student_risk_profile, weak_students, comments_generator } = await import('../../../supabase/functions/tools/academic');
    const { letter_generator, sms_generator, policy_summary } = await import('../../../supabase/functions/tools/admin');
    [fee_overview, top_debtors, payment_projection, subject_performance, student_risk_profile, weak_students, comments_generator, letter_generator, sms_generator, policy_summary].forEach(t => registerTool(t as any));
  } catch {}
  const rag = await getRagContext(args.tenantId, args.prompt, args.topK || 5);
  let toolNames = detectTools(args.prompt);
  if (args.role === 'Parent') toolNames = toolNames.filter(n => ['subject_performance','student_risk_profile','weak_students','comments_generator'].includes(n));
  const toolResults = await executeTools(toolNames, args.toolArgs || {}, { tenantId: args.tenantId });
  const messages = buildPrompt(args.role, args.prompt, (args.conversationHistory || []) as any, rag, toolResults);
  if (model.engine === 'ollama') {
    try {
      const payload = { model: model.model, prompt: `${messages[0].content}\n\nUser:\n${messages[1].content}`, stream: false };
      // Prefer server proxy to avoid CORS issues in cloud
      const r0 = await fetch('/api/ai/ollama-generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (r0.ok) { const j0 = await r0.json(); return String(j0.response || j0.text || j0.output || ''); }
      const r = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (r.ok) { const j = await r.json(); return String(j.response || ''); }
    } catch {}
  }
  return generateEnhancedFallbackResponse(args.prompt, { role: args.role, ragContext: rag, tools: toolNames });
}
