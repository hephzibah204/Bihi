export function buildTopicSuggestionPrompt(subject: string, classLevel: string, curriculum: string, term?: string): string {
  const s = subject || '';
  const lvl = classLevel || '';
  const curr = curriculum || 'NERDC';
  const trm = term || 'Any';
  const isEarly = /nursery|kg|kindergarten|lower\s*basic|basic\s*[1-3]/i.test(lvl);
  const isBasic = /primary|lower\s*basic|middle\s*basic|basic\s*[1-9]/i.test(lvl);
  const isSenior = /ss|senior\s*secondary|ss[1-3]/i.test(lvl);
  const guidance = isSenior ? 'Senior Secondary: allow WAEC/NECO orientation when relevant.' : (isBasic ? 'Basic (NERDC-aligned): do NOT include WAEC/NECO references.' : 'ECCDE/Foundational: keep age-appropriate and simple.');
  return `Subject: ${s}\nClass: ${lvl}\nTerm: ${trm}\nCurriculum: ${curr}\nGuidance: ${guidance}\n\nGenerate 12 concise, classroom-appropriate topic titles for this subject and level in Nigeria. Return one topic per line (no numbering, no extra text).`;
}