import { scoreTheoryLocal } from '../../_lib/localScorer'

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

async function tryGemini(stem, rubric, answer, env) {
  try {
    const { GOOGLE_API_KEY } = env || {}
    if (!GOOGLE_API_KEY) return null
    const prompt = {
      instructions: 'Grade the student answer strictly using the rubric. Return JSON {score, rationale, confidence}.',
      stem, rubric, answer
    }
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GOOGLE_API_KEY, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: JSON.stringify(prompt) }] }] })
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = JSON.stringify(data)
    const m = text.match(/\{\"score\".*?\}/)
    if (m) {
      const obj = JSON.parse(m[0])
      if (typeof obj.score === 'number') return obj
    }
    return null
  } catch { return null }
}

async function tryHuggingFace(stem, rubric, answer, env) {
  try {
    const { HUGGINGFACE_API_KEY } = env || {}
    if (!HUGGINGFACE_API_KEY) return null
    const payload = `Grade the answer using rubric. Return JSON with score,rationale,confidence.\nStem:${stem}\nRubric:${JSON.stringify(rubric)}\nAnswer:${answer}`
    const res = await fetch('https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct', {
      method: 'POST', headers: { 'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs: payload })
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = Array.isArray(data) ? data[0]?.generated_text || '' : (data?.generated_text || '')
    const m = String(text).match(/\{\"score\".*?\}/)
    if (m) {
      const obj = JSON.parse(m[0])
      if (typeof obj.score === 'number') return obj
    }
    return null
  } catch { return null }
}

export async function onRequest(context) {
  const { request, env } = context
  let body
  try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }
  const sessionId = body?.session_id
  if (!sessionId) return new Response(JSON.stringify({ error: 'session_id required' }), { status: 400 })
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {}
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 })
  const headers = { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': SUPABASE_SERVICE_ROLE_KEY }

  try {
    const responses = await fetchJson(`${SUPABASE_URL}/rest/v1/cbt_responses?select=*&session_id=eq.${encodeURIComponent(sessionId)}`, headers)
    if (!responses || !responses.length) return new Response(JSON.stringify({ error: 'No responses' }), { status: 404 })
    const itemIds = [...new Set(responses.map(r => r.item_id))]
    const items = await fetchJson(`${SUPABASE_URL}/rest/v1/cbt_items?select=id,type,stem,answer_key,rubric&in.id=(${itemIds.map(encodeURIComponent).join(',')})`, headers)
    const itemMap = new Map(items.map(i => [i.id, i]))

    let total = 0
    const updates = []
    for (const r of responses) {
      const item = itemMap.get(r.item_id)
      if (!item) continue
      const maxPoints = Number(item?.rubric?.maxPoints || 1)
      if (['mcq','true_false','multiple_answer'].includes(item.type)) {
        let score = 0
        try {
          const key = item.answer_key
          const ans = r.answer
          if (item.type === 'mcq' || item.type === 'true_false') {
            score = String(ans) === String(key?.correct) ? maxPoints : 0
          } else if (item.type === 'multiple_answer') {
            const correct = new Set((key?.correct || []).map(String))
            const chosen = new Set((ans || []).map(String))
            const ok = [...correct].every(v => chosen.has(v)) && [...chosen].every(v => correct.has(v))
            score = ok ? maxPoints : 0
          }
        } catch {}
        total += score
        updates.push({ id: r.id, auto_score: score })
      } else {
        const stem = item.stem
        const rubric = item.rubric || {}
        const answer = r.answer
        let final = null
        final = await tryGemini(stem, rubric, answer, env)
        if (!final) final = await tryHuggingFace(stem, rubric, answer, env)
        if (!final) {
          const loc = scoreTheoryLocal(stem, rubric, answer)
          final = { score: loc.score, rationale: loc.rationale, confidence: 0.5 }
        }
        const s = Math.max(0, Math.min(Number(final.score || 0), maxPoints))
        total += s
        updates.push({ id: r.id, ai_score: s, rationale: final.rationale, provider: final.provider || 'fallback' })
      }
    }

    // Persist response scores
    const patchHeaders = { ...headers, 'Content-Type': 'application/json' }
    for (const u of updates) {
      await fetch(`${SUPABASE_URL}/rest/v1/cbt_responses?id=eq.${encodeURIComponent(u.id)}`, { method: 'PATCH', headers: patchHeaders, body: JSON.stringify({ auto_score: u.auto_score, ai_score: u.ai_score, rationale: u.rationale }) })
    }

    // Upsert grade
    const gradeRes = await fetch(`${SUPABASE_URL}/rest/v1/cbt_grades`, { method: 'POST', headers: patchHeaders, body: JSON.stringify({ session_id: sessionId, total_score: total }), })
    if (!gradeRes.ok) {
      // Try update
      await fetch(`${SUPABASE_URL}/rest/v1/cbt_grades?session_id=eq.${encodeURIComponent(sessionId)}`, { method: 'PATCH', headers: patchHeaders, body: JSON.stringify({ total_score: total }) })
    }

    return new Response(JSON.stringify({ total_score: total }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Marking failed', details: String(err.message || err) }), { status: 500 })
  }
}
