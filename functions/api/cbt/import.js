import { handleCors } from '../../_lib/cors'
import { requirePlatformRoles } from '../../_lib/auth'
import JSZip from 'jszip'

function json(headers) {
  const res = new Response('', { status: 200 })
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

function extractTextFromDocxXml(xml) {
  try {
    const parts = Array.from(xml.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g)).map(m => m[1])
    return parts.join('\n')
  } catch { return '' }
}

function parseItemsFromText(text) {
  const blocks = String(text).split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
  const items = []
  for (const b of blocks) {
    const lines = b.split(/\n/).map(l => l.trim()).filter(Boolean)
    if (!lines.length) continue
    const header = lines[0]
    const stem = header.replace(/^Q\d+\.?\s*/i, '')
    const meta = { type: 'mcq', difficulty: undefined, tags: [], lo: [] }
    const metaMatches = header.match(/\[(.*?)\]/g) || []
    for (const m of metaMatches) {
      const kv = m.replace(/[\[\]]/g, '')
      const [k, v] = kv.split(':').map(x => x.trim())
      if (k === 'type') meta.type = v
      else if (k === 'diff' || k === 'difficulty') meta.difficulty = Number(v)
      else if (k === 'tags') meta.tags = v.split(',').map(x => x.trim()).filter(Boolean)
      else if (k === 'lo') meta.lo = v.split(',').map(x => x.trim()).filter(Boolean)
    }
    const options = []
    let answerKey = null
    let rubric = null
    for (let i = 1; i < lines.length; i++) {
      const l = lines[i]
      if (/^(A|B|C|D|E|F)\./i.test(l)) {
        const id = l[0].toUpperCase()
        const text = l.slice(2).trim()
        options.push({ id, text })
      } else if (/^Answer\s*:/i.test(l)) {
        const val = l.split(':')[1]?.trim() || ''
        if (val.includes(',')) answerKey = { correct: val.split(',').map(x => x.trim()) }
        else answerKey = { correct: val }
      } else if (/^Rubric\s*:/i.test(l)) {
        const val = l.split(':')[1]?.trim() || ''
        rubric = { description: val, maxPoints: 5 }
      }
    }
    const type = meta.type || (options.length ? 'mcq' : 'essay')
    const item = {
      type,
      stem,
      options: options.length ? options : undefined,
      answerKey: answerKey || undefined,
      rubric: rubric || undefined,
      difficulty: meta.difficulty,
      tags: meta.tags,
      learningObjectives: meta.lo
    }
    items.push(item)
  }
  return items
}

export async function onRequest(context) {
  const { request, env } = context
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'POST, OPTIONS')
  if (corsResponse) return corsResponse
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

  const auth = await requirePlatformRoles(request, env, ['Super Admin', 'School Admin', 'Teacher'])
  if (!auth.ok) return auth.res

  try {
    if (request.method === 'OPTIONS') {
      return json(corsHeaders)
    }

    const form = await request.formData()
    const file = form.get('file')
    const commit = String(form.get('commit') || '').toLowerCase() === 'true'
    const createExam = String(form.get('create_exam') || '').toLowerCase() === 'true'
    const examTitle = String(form.get('exam_title') || '') || 'Imported Exam'
    if (!(file instanceof File)) {
      const res = new Response(JSON.stringify({ error: 'file required (txt or docx)' }), { status: 400 })
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }

    const type = file.type || ''
    let text = ''
    if (type === 'text/plain' || file.name.endsWith('.txt')) {
      text = await file.text()
    } else if (type.includes('officedocument') || file.name.endsWith('.docx')) {
      const buf = await file.arrayBuffer()
      const zip = await JSZip.loadAsync(buf)
      const docXml = await zip.file('word/document.xml')?.async('string')
      text = extractTextFromDocxXml(docXml || '')
    } else {
      const res = new Response(JSON.stringify({ error: 'Unsupported file type' }), { status: 400 })
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }

    const items = parseItemsFromText(text)
    if (!commit && !createExam) {
      const res = new Response(JSON.stringify({ itemsCount: items.length, itemsPreview: items.slice(0, 20) }), { status: 200 })
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }

    const token = request.headers.get('Authorization')
    const headers = { 'Authorization': token, 'apikey': env.SUPABASE_ANON_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' }
    const tenantId = auth.user?.user_metadata?.tenant_id

    let createdItems = []
    if (commit && items.length) {
      for (const it of items) {
        const payload = { ...it, tenant_id: tenantId }
        const r = await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_items`, { method: 'POST', headers, body: JSON.stringify(payload) })
        if (r.ok) {
          const row = await r.json()
          const entry = Array.isArray(row) ? row[0] : row
          createdItems.push(entry)
        }
      }
    }

    let createdExam = null
    if (createExam) {
      const section = { id: crypto.randomUUID(), title: 'Imported', itemIds: createdItems.length ? createdItems.map(i => i.id) : undefined }
      const examPayload = { title: examTitle, sections: [section], rules: { shuffleItems: true }, tenant_id: tenantId, status: 'draft' }
      const er = await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_exams`, { method: 'POST', headers, body: JSON.stringify(examPayload) })
      if (er.ok) {
        const row = await er.json()
        createdExam = Array.isArray(row) ? row[0] : row
      }
    }

    const res = new Response(JSON.stringify({ itemsCreated: createdItems.length, exam: createdExam, previewCount: items.length }), { status: 200 })
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Import failed', details: err?.message }), { status: 500 })
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }
}

