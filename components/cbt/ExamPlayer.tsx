import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

type ExamSection = { id: string; title: string; itemIds?: string[]; timeLimitMinutes?: number }
type Exam = { id: string; title: string; description?: string; sections: ExamSection[]; rules?: any }
type Rubric = { maxPoints?: number; criteria?: string[] }
type Item = { id: string; type: string; stem: string; options?: Array<{ id: string; text: string }>; rubric?: Rubric }

const ExamPlayer = () => {
  const { examId } = useParams()
  const { session } = useAuth()
  const [exam, setExam] = useState<Exam | null>(null)
  const [items, setItems] = useState<Record<string, Item>>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [grade, setGrade] = useState<any>(null)
  const [paused, setPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState<Record<string, number>>({})
  const timerRef = useRef<number | null>(null)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [itemTimes, setItemTimes] = useState<Record<string, number>>({})
  const autoSubmittedRef = useRef(false)

  useEffect(() => {
    const run = async () => {
      if (!examId) return
      setLoading(true)
      let ex: any
      try {
        const r = await fetch(`/api/cbt/exams/${examId}`, { headers: { 'Accept': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) } })
        if (!r.ok) { try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Load Exam Failed', message: await r.text() } })); } catch {} }
        ex = await r.json()
      } catch (e: any) { try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Load Exam Failed', message: String(e?.message||e) } })); } catch {} }
      if (!ex || !ex.id) { setLoading(false); return }
      setExam(ex)
      // Start session
      let sess: any
      try {
        const s = await fetch(`/api/cbt/sessions/start`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify({ exam_id: ex.id }) })
        if (!s.ok) { try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Start Session Failed', message: await s.text() } })); } catch {} }
        sess = await s.json()
      } catch (e: any) { try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Start Session Failed', message: String(e?.message||e) } })); } catch {} }
      setSessionId(sess?.id || null)
      // Fetch items in batch if available
      const ids = (ex.sections || []).flatMap(s => s.itemIds || [])
      if (ids.length) {
        const url = new URL(`/api/cbt/items`, window.location.origin)
        url.searchParams.set('select', 'id,type,stem,options,rubric')
        url.searchParams.set('limit', String(ids.length))
        url.searchParams.set('ids', ids.join(','))
        let list: any
        try {
          const li = await fetch(url.toString(), { headers: { 'Accept': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) } })
          if (!li.ok) { try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Load Items Failed', message: await li.text() } })); } catch {} }
          list = await li.json()
        } catch (e: any) { try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Load Items Failed', message: String(e?.message||e) } })); } catch {} }
        const map: Record<string, Item> = {}
        for (const it of Array.isArray(list) ? list : []) { map[it.id] = it }
        setItems(map)
        const initTimes: Record<string, number> = {}
        for (const iid of ids) initTimes[iid] = 0
        setItemTimes(initTimes)
      }
      // Initialize timers per section
      const tl: Record<string, number> = {}
      for (const s of ex.sections || []) {
        if (s.timeLimitMinutes) tl[s.id] = s.timeLimitMinutes * 60
      }
      setTimeLeft(tl)
      setLoading(false)
    }
    run()
  }, [examId, session?.access_token])

  const sections = useMemo(() => exam?.sections || [], [exam])

  const setAnswer = (itemId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [itemId]: value }))
    setActiveItemId(itemId)
  }

  const submit = async () => {
    if (!sessionId) return
    setSubmitting(true)
    try {
      const responses = Object.entries(answers).map(([item_id, answer]) => ({ item_id, answer, time_on_item_seconds: itemTimes[item_id] || 0 }))
      const r = await fetch(`/api/cbt/sessions/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify({ session_id: sessionId, responses }) })
      if (!r.ok) { try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Submit Failed', message: await r.text() } })); } catch {} }
      const res = await r.json()
      setGrade(res?.grade || null)
    } catch (e: any) { try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Submit Failed', message: String(e?.message||e) } })); } catch {} }
    setSubmitting(false)
  }

  useEffect(() => {
    if (paused) return
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        const next: Record<string, number> = {}
        for (const [k, v] of Object.entries(prev)) next[k] = Math.max(0, v - 1)
        return next
      })
      setItemTimes(prev => {
        if (!activeItemId) return prev
        const next = { ...prev }
        next[activeItemId] = (next[activeItemId] || 0) + 1
        return next
      })
    }, 1000)
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [paused, activeItemId])

  useEffect(() => {
    const zero = Object.values(timeLeft).some(v => v === 0)
    if (zero && !autoSubmittedRef.current && !submitting) {
      autoSubmittedRef.current = true
      submit()
    }
  }, [timeLeft, submitting])

  useEffect(() => {
    const onVis = () => {
      const hidden = document.hidden
      if (!sessionId) return
      if (hidden) {
        fetch('/api/cbt/proctor-events', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify({ session_id: sessionId, event_type: 'tab_switch', payload: { hidden: true }, risk_increment: 1 }) })
        setPaused(true)
      } else {
        fetch('/api/cbt/proctor-events', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify({ session_id: sessionId, event_type: 'restore', payload: {}, risk_increment: 0 }) })
        setPaused(false)
      }
    }
    const onBlur = () => {
      if (!sessionId) return
      fetch('/api/cbt/proctor-events', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify({ session_id: sessionId, event_type: 'focus_loss', payload: {}, risk_increment: 1 }) })
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', onBlur)
    }
  }, [sessionId, session?.access_token])

  if (loading) return <div className="p-6">Loading exam...</div>
  if (!exam) return <div className="p-6">Exam not found</div>

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{exam.title}</h1>
        {exam.description && <p className="text-gray-600">{exam.description}</p>}
        <div className="mt-2 flex items-center gap-3">
          <button className="btn btn-secondary btn-sm" onClick={()=>setPaused(p=>!p)}>{paused?'Resume':'Pause'}</button>
          <div className="text-sm text-gray-600">{Object.entries(timeLeft).map(([sid, secs]) => (<span key={sid} className="mr-3">{sid}: {Math.floor(secs/60)}:{String(secs%60).padStart(2,'0')}</span>))}</div>
        </div>
      </div>
      <div className="space-y-6">
        {sections.map((sec) => (
          <div key={sec.id} className="bg-white rounded shadow p-4">
            <div className="font-semibold mb-2">{sec.title}</div>
            <div className="space-y-4">
              {(sec.itemIds || []).map((iid) => {
                const it = items[iid]
                return (
                  <div key={iid} className="border rounded p-3">
                    <div className="mb-2"><span className="text-sm text-gray-500">{it?.type || 'item'}</span></div>
                    <div className="font-medium mb-3">{it?.stem || 'Item stem'}</div>
                    {it?.type === 'mcq' && Array.isArray(it?.options) ? (
                      <div className="space-y-2">
                        {it.options.map(opt => (
                          <label key={opt.id} className="flex items-center gap-2">
                            <input type="radio" name={`i-${iid}`} onChange={()=>setAnswer(iid, opt.id)} />
                            <span>{opt.text}</span>
                          </label>
                        ))}
                      </div>
                    ) : it?.type === 'multiple_answer' && Array.isArray(it?.options) ? (
                      <div className="space-y-2">
                        {it.options.map(opt => (
                          <label key={opt.id} className="flex items-center gap-2">
                            <input type="checkbox" onChange={e=>{
                              const arr = Array.isArray(answers[iid]) ? ([...(answers[iid] as any[])]) : []
                              if (e.target.checked) arr.push(opt.id); else { const ix = arr.indexOf(opt.id); if (ix>=0) arr.splice(ix,1) }
                              setAnswer(iid, arr)
                            }} />
                            <span>{opt.text}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea className="textarea w-full" placeholder="Your answer" onChange={e=>setAnswer(iid, e.target.value)} />
                    )}
                    <div className="mt-2 text-xs text-gray-500">Time on item: {Math.floor((itemTimes[iid]||0)/60)}:{String((itemTimes[iid]||0)%60).padStart(2,'0')}</div>
                    {items[iid]?.rubric && Array.isArray(items[iid]?.rubric?.criteria) && (items[iid]?.rubric?.criteria as any[])?.length ? (
                      <div className="mt-2 text-xs text-gray-600">
                        <div className="font-medium">Hints:</div>
                        <ul>
                          {(items[iid]?.rubric?.criteria || []).map((c: any, idx: number) => (<li key={idx}>• {c}</li>))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <button className="btn btn-primary" disabled={submitting} onClick={submit}>{submitting?'Submitting...':'Submit'}</button>
      </div>
      {grade && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <div className="font-semibold">Grade</div>
          <pre className="text-sm mt-2">{JSON.stringify(grade, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default ExamPlayer
