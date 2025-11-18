import React, { useEffect, useState } from 'react';
import { apiGetAttendance, apiGetSchoolSettings } from '../services/api';
import useAttendanceMetrics from '../hooks/useAttendanceMetrics';

type ClassAttendance = { className: string; attendanceRate: number; present: number; total: number };

const AttendanceSnapshotWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overallRate, setOverallRate] = useState<number>(0);
  const [classRates, setClassRates] = useState<ClassAttendance[]>([]);
  const [label, setLabel] = useState<string>('');
  const { metrics: att } = useAttendanceMetrics();

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [settings, attendance] = await Promise.all([
          apiGetSchoolSettings(),
          apiGetAttendance(),
        ]);

        const currentTerm = settings?.currentTerm || settings?.term || 'Current Term';
        const currentSession = settings?.currentSession || settings?.session || '';
        setLabel([currentSession, currentTerm].filter(Boolean).join(' • '));

        // Consider last 30 days by default
        const today = new Date();
        const cutoff = new Date();
        cutoff.setDate(today.getDate() - 30);

        const recent = attendance.filter(a => new Date(a.date).getTime() >= cutoff.getTime());
        if (recent.length === 0) {
          setOverallRate(0);
          setClassRates([]);
          return;
        }

        let totalMarked = 0;
        let totalPresent = 0;

        const byClass = new Map<string, { present: number; total: number }>();

        recent.forEach(rec => {
          const statuses = rec.statuses || {};
          const ids = Object.keys(statuses);
          ids.forEach(id => {
            const status = statuses[id];
            // Treat 'late' as 0.5 present to penalize habitual lateness slightly
            const presentValue = status === 'present' ? 1 : (status === 'late' ? 0.5 : 0);
            totalPresent += presentValue;
            totalMarked += 1;

            const bucket = byClass.get(rec.class) || { present: 0, total: 0 };
            byClass.set(rec.class, { present: bucket.present + presentValue, total: bucket.total + 1 });
          });
        });

        const overall = totalMarked > 0 ? +(100 * (totalPresent / totalMarked)).toFixed(1) : 0;
        setOverallRate(att.snapshotRate || overall);

        const classList: ClassAttendance[] = Array.from(byClass.entries()).map(([cls, vals]) => ({
          className: cls,
          present: vals.present,
          total: vals.total,
          attendanceRate: vals.total > 0 ? +(100 * (vals.present / vals.total)).toFixed(1) : 0,
        }));

        // Sort ascending to surface classes that need attention first
        classList.sort((a, b) => a.attendanceRate - b.attendanceRate);
        setClassRates(classList.slice(0, 5));
      } catch (e) {
        console.error('Failed to load attendance snapshot', e);
        setOverallRate(0);
        setClassRates([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <div className="card mt-6">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold clamp-2" title="Attendance Snapshot">Attendance Snapshot</h3>
          <p className="text-xs text-gray-500 ellipsis-1" title={label || 'Last 30 days'}>{label || 'Last 30 days'}</p>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-gray-500">Loading attendance...</div>
        ) : (
          <>
            <div className="mt-2">
              <p className="text-sm text-gray-600">Overall attendance</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="text-2xl font-bold">{overallRate}%</div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, overallRate))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-gray-600">Classes needing attention</p>
              <ul className="mt-2 space-y-2">
                {classRates.length === 0 && (
                  <li className="text-sm text-gray-500">No recent attendance data.</li>
                )}
                {classRates.map(c => (
                  <li key={c.className} className="flex justify-between text-sm">
                    <span className="ellipsis-1 pr-3" title={c.className}>{c.className}</span>
                    <span className={
                      c.attendanceRate < 75 ? 'font-semibold text-rose-600' : (c.attendanceRate < 85 ? 'font-semibold text-amber-600' : 'font-semibold text-gray-800')
                    }>{c.attendanceRate}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceSnapshotWidget;
