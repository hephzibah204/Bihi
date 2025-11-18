export function isSensitiveFinanceQuery(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return /(fee|debtors|arrears|invoice|payment|ledger|refund)/.test(p);
}
export function needsStructuredOutput(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return /(json|csv|schema|fields|columns|return as json|structured json)/.test(p);
}