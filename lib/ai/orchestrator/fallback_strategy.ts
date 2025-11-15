export function isSensitiveFinanceQuery(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return /(fee|debtors|arrears|invoice|payment|ledger|refund)/.test(p);
}
export function needsStructuredOutput(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return /(json|table|schema|fields|columns)/.test(p);
}
