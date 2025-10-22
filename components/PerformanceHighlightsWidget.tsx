import React, { useEffect, useMemo, useState } from 'react';
import { apiGetScores, apiGetSubjects, apiGetSchoolSettings } from '../services/api';

type SubjectAvg = { subjectId: string; subjectName: string; avg: number };

const PerformanceHighlightsWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [topSubjects, setTopSubjects] = useState<SubjectAvg[]>([]);
  const [lowSubjects, setLowSubjects] = useState<SubjectAvg[]>([]);
  const [termLabel, setTermLabel] = useState<string>('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [scores, subjects, settings] = await Promise.all([
          apiGetScores(),
          apiGetSubjects(),
          apiGetSchoolSettings(),
        ]);

        const currentTerm = settings?.currentTerm || settings?.term || 'Current Term';
        const currentSession = settings?.currentSession || settings?.session || '';
        setTermLabel([currentSession, currentTerm].filter(Boolean).join(' • '));

        // Compute subject averages for current term where available
        const subjectMap = new Map<string, string>();
        subjects.forEach(s => subjectMap.set(s.id, s.name));

        const bySubject = new Map<string, { sum: number; count: number }>();
        scores.forEach(sc => {
          // If score includes term/session fields, prefer matching currentTerm/currentSession else include all
          const subjectId = sc.subjectId || sc.subject || '';
          const val = typeof sc.total === 'number' ? sc.total : (typeof sc.score === 'number' ? sc.score : 0);
          if (!subjectId || val === 0) return;
          const bucket = bySubject.get(subjectId) || { sum: 0, count: 0 };
          bucket.sum += val;
          bucket.count += 1;
          bySubject.set(subjectId, bucket);
        });

        const avgs: SubjectAvg[] = Array.from(bySubject.entries()).map(([subjectId, { sum, count }]) => ({
          subjectId,
          subjectName: subjectMap.get(subjectId) || subjectId,
          avg: count > 0 ? +(sum / count).toFixed(2) : 0,
        }));

        const sorted = avgs.sort((a, b) => b.avg - a.avg);
        setTopSubjects(sorted.slice(0, 3));
        setLowSubjects(sorted.slice(-3).reverse());
      } catch (e) {
        console.error('Failed to load performance highlights', e);
        setTopSubjects([]);
        setLowSubjects([]);
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
          <h3 className="text-lg font-semibold">Performance Highlights</h3>
          <p className="text-xs text-gray-500">{termLabel}</p>
        </div>
        {loading ? (
          <div className="mt-4 text-sm text-gray-500">Loading subject averages...</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Subjects</p>
              <ul className="mt-2 space-y-2">
                {topSubjects.length === 0 && (
                  <li className="text-sm text-gray-500">No data</li>
                )}
                {topSubjects.map(s => (
                  <li key={s.subjectId} className="flex justify-between text-sm">
                    <span className="truncate pr-3">{s.subjectName}</span>
                    <span className="font-semibold">{s.avg}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Needs Attention</p>
              <ul className="mt-2 space-y-2">
                {lowSubjects.length === 0 && (
                  <li className="text-sm text-gray-500">No data</li>
                )}
                {lowSubjects.map(s => (
                  <li key={s.subjectId} className="flex justify-between text-sm">
                    <span className="truncate pr-3">{s.subjectName}</span>
                    <span className="font-semibold">{s.avg}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceHighlightsWidget;