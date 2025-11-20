import React, { useEffect, useMemo, useState } from 'react';
import { apiGetTeacherAttendance, apiGetTeachers } from '../services/api';
import { TeacherAttendanceRecord, Teacher } from '../types';
import TableSkeleton from './skeletons/TableSkeleton';
import EmptyState from './EmptyState';
import { exportToCSV } from '../utils/csvExporter';
import { formatDate } from '../utils/dateHelpers';

const TeacherAttendanceHistory: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [records, setRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      const ts = await apiGetTeachers();
      setTeachers(ts);
    };
    init();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await apiGetTeacherAttendance({ teacherId: selectedTeacherId || undefined, from: fromDate || undefined, to: toDate || undefined });
      setRecords(res || []);
      setLoading(false);
    };
    load();
  }, [selectedTeacherId, fromDate, toDate]);

  const teacherMap = useMemo(() => {
    const m = new Map<string, string>();
    teachers.forEach(t => m.set(t.id, t.name));
    return m;
  }, [teachers]);

  const exportCsv = () => {
    const rows = records.map(r => ({
      timestamp: r.timestamp,
      date: formatDate(r.timestamp),
      teacherId: r.teacherId,
      teacherName: teacherMap.get(r.teacherId) || '',
      status: r.status,
      method: r.method || '',
      accuracy_m: r.accuracy_m ?? '',
      lat: r.lat ?? '',
      lng: r.lng ?? '',
      notes: r.notes || '',
    }));
    exportToCSV(rows, 'teacher-attendance-history.csv');
  };

  const renderTable = () => {
    if (loading) return <TableSkeleton cols={5} />;
    if (!records || records.length === 0) return <div className="mt-4"><EmptyState message="No records found for the selected filters." /></div>;
    return (
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="th">Date/Time</th>
              <th className="th">Teacher</th>
              <th className="th">Status</th>
              <th className="th">Method</th>
              <th className="th">Accuracy (m)</th>
              <th className="th">Location</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, idx) => (
              <tr key={idx}>
                <td className="td">{formatDate(r.timestamp)}</td>
                <td className="td">{teacherMap.get(r.teacherId) || r.teacherId}</td>
                <td className="td">{r.status}</td>
                <td className="td">{r.method || ''}</td>
                <td className="td">{r.accuracy_m ?? ''}</td>
                <td className="td">{(r.lat && r.lng) ? `${r.lat.toFixed(6)}, ${r.lng.toFixed(6)}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex gap-3 w-full md:w-auto">
            <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="input-field">
              <option value="">All Teachers</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input-field" />
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <button className="btn btn-secondary" onClick={exportCsv}>Export CSV</button>
          </div>
        </div>
        {renderTable()}
      </div>
    </div>
  );
};

export default TeacherAttendanceHistory;