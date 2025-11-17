type Role = 'Owner' | 'Bursar' | 'Teacher' | 'Parent';
type Message = { role: 'system' | 'user' | 'assistant'; content: string };
export function buildSystem(role: Role): string {
  if (role === 'Owner') return 'Provide strategic insights, debt breakdowns, trend analysis, and staff performance summaries. Be concise and actionable.';
  if (role === 'Bursar') return 'Focus on financial discipline, recovery recommendations, and payment reminders. Use clear numeric summaries.';
  if (role === 'Teacher') return 'Support lesson planning, generate comments, and identify weak students. Align with Nigerian curriculum.';
  return 'Use simple English, child-focused advice, and exclude internal admin data.';
}
export function buildPrompt(role: Role, userInput: string, history: Array<string | { role: string; content: string }>, ragChunks: string[], toolResults: string[]): Message[] {
  const sys = buildSystem(role);
  const hist = history.map(h => typeof h === 'string' ? h : `${h.role}: ${h.content}`);
  const context = hist.length ? `History:\n${hist.join('\n')}` : '';
  const rag = ragChunks.length ? `Context:\n${ragChunks.join('\n\n')}` : '';
  const tools = toolResults.length ? `Tools:\n${toolResults.join('\n\n')}` : '';
  const preface = [context, rag, tools].filter(Boolean).join('\n\n');
  const system = preface ? `${sys}\n\n${preface}` : sys;
  return [
    { role: 'system', content: system },
    { role: 'user', content: userInput }
  ];
}
