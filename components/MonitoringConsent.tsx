import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const MonitoringConsent: React.FC = () => {
  const { user } = useAuth()
  const [className, setClassName] = useState<string>('')
  const [consent, setConsent] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      setClassName(String((user as any)?.classTeacherOf || ''))
      const teacherId = String((user as any)?.id || '')
      if (!teacherId) return
      try {
        const res = await fetch(`/api/monitoring/consent?teacher_id=${encodeURIComponent(teacherId)}`)
        if (res.ok) {
          const rows = await res.json()
          const row = Array.isArray(rows) ? rows.find((r: any) => r.class_name === className) || rows[0] : null
          if (row) setConsent(!!row.consent)
        }
      } catch {}
    }
    init()
  }, [user, className])

  const save = async () => {
    setLoading(true)
    setError(null)
    try {
      const teacherId = String((user as any)?.id || '')
      const tenantId = localStorage.getItem('tenantId') || ''
      const res = await fetch('/api/monitoring/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, teacher_id: teacherId, class_name: className, consent })
      })
      if (!res.ok) throw new Error('Failed to save consent')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Monitoring Consent</h1>
      <p className="text-sm text-gray-600 mb-4">Grant permission for Admin to monitor your class.</p>
      <div className="space-y-3">
        <label className="block">
          <span className="text-sm text-gray-700">Class</span>
          <input value={className} onChange={e => setClassName(e.target.value)} className="input-field mt-1" placeholder="Enter class name" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
          <span className="text-sm">I grant permission for live monitoring of this class</span>
        </label>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button onClick={save} className="btn btn-primary" disabled={loading || !className}>{loading ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  )
}

export default MonitoringConsent