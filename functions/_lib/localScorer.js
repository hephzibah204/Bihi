export function scoreTheoryLocal(stem, rubric, answer) {
  const text = String(answer || '').toLowerCase()
  const criteria = Array.isArray(rubric?.criteria) ? rubric.criteria : []
  const maxPoints = Number(rubric?.maxPoints || rubric?.max_points || 10)
  if (!criteria.length) {
    const len = Math.min(text.length, 2000)
    const base = len > 50 ? 0.6 : len > 20 ? 0.4 : 0.2
    const score = Math.round(base * maxPoints)
    return { score, rationale: 'Length-based heuristic due to missing rubric.' }
  }
  let totalWeight = 0
  let achieved = 0
  const parts = []
  for (const c of criteria) {
    const weight = Number(c.weight || 1)
    totalWeight += weight
    const keywords = (c.keywords || []).map(k => String(k).toLowerCase())
    const matched = keywords.filter(k => text.includes(k)).length
    const coverage = keywords.length > 0 ? matched / keywords.length : 0
    const contrib = weight * coverage
    achieved += contrib
    parts.push(`${c.name || 'criterion'}: ${Math.round(coverage*100)}% keywords matched`)
  }
  const fraction = totalWeight > 0 ? (achieved / totalWeight) : 0
  const score = Math.round(fraction * maxPoints)
  const rationale = `Heuristic rubric match. ${parts.join('; ')}`
  return { score, rationale }
}
