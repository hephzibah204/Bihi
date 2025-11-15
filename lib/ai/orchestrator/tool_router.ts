type ToolDef = { name: string; description: string; parameters: any; run: (args: any, context: any) => Promise<any> };
const registry: Record<string, ToolDef> = {};
export function registerTool(def: ToolDef) { registry[def.name] = def; }
export function detectTools(prompt: string): string[] {
  const p = prompt.toLowerCase();
  const names: string[] = [];
  if (/(fee|debt|invoice|payment)/.test(p)) names.push('fee_overview', 'top_debtors', 'payment_projection');
  if (/(subject performance|risk profile|weak student|comment)/.test(p)) names.push('subject_performance', 'student_risk_profile', 'weak_students', 'comments_generator');
  if (/(letter|sms|policy)/.test(p)) names.push('letter_generator', 'sms_generator', 'policy_summary');
  return Array.from(new Set(names));
}
export async function executeTools(names: string[], args: any, context: any): Promise<string[]> {
  const out: string[] = [];
  for (const n of names) {
    const tool = registry[n];
    if (!tool) continue;
    try {
      const res = await tool.run(args?.[n] || {}, context);
      out.push(JSON.stringify({ name: n, result: res }));
    } catch {}
  }
  return out;
}
