import React, { useEffect, useState } from 'react'
import { getIdleClassesAlerts } from '../services/performanceTracker'

const IdleClassesAlertWidget: React.FC = () => {
  const [alerts, setAlerts] = useState<{ className: string; reason: string; teacherId?: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getIdleClassesAlerts(1)
        setAlerts(res)
      } catch (e: any) {
        setError(e?.message || 'Failed to load alerts')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Idle Classes Alerts</h3>
          <span className="text-xs text-gray-500">Last 24h</span>
        </div>
        {loading && <div className="mt-3 text-sm text-gray-600">Checking for idle classes...</div>}
        {error && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
        {!loading && !error && (
          <ul className="mt-3 space-y-2">
            {alerts.length === 0 && <li className="text-sm text-gray-600">No idle classes detected</li>}
            {alerts.map((a, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{a.className}</span>
                  <span className="ml-2 text-gray-600">{a.reason}</span>
                </div>
                {a.teacherId && <span className="text-xs text-gray-500">Teacher: {a.teacherId}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default IdleClassesAlertWidget
