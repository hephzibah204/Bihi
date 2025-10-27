import React, { useEffect, useMemo, useState } from 'react';
import { apiGetTeachers, apiGetSubjects, apiUpsertTeacher } from '../services/api';
import { Teacher, Subject } from '../types';
import Modal from './Modal';
import EditIcon from './icons/EditIcon';

const TeacherAssignments: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<{ classTeacherOf?: string; subjects: string[] }>({ subjects: [] });

  const classes = useMemo(() => {
    return [...new Set<string>(subjects.flatMap(s => s.classes))].sort();
  }, [subjects]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [t, s] = await Promise.all([apiGetTeachers(), apiGetSubjects()]);
      setTeachers(t);
      setSubjects(s);
      setLoading(false);
    };
    load();
  }, []);

  const openEdit = (teacher: Teacher) => {
    setEditing(teacher);
    const currentSubjects = (teacher as any).subjects || [];
    setForm({ classTeacherOf: teacher.classTeacherOf || '', subjects: currentSubjects });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await apiUpsertTeacher({ id: editing.id, classTeacherOf: form.classTeacherOf, subjects: form.subjects });
    const updated = (await apiGetTeachers());
    setTeachers(updated);
    setEditing(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Teacher Assignments</h2>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
        <div className="p-4">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">Name</th>
                    <th className="th">Role</th>
                    <th className="th">Class Teacher Of</th>
                    <th className="th">Subjects</th>
                    <th className="th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map(t => (
                    <tr key={t.id}>
                      <td className="td font-medium">{t.name}</td>
                      <td className="td">{t.role}</td>
                      <td className="td">{t.classTeacherOf || '-'}</td>
                      <td className="td">{((t as any).subjects || []).map((sid: string) => subjects.find(s => s.id === sid)?.name || sid).join(', ') || '-'}</td>
                      <td className="td text-right">
                        <button className="icon-button" onClick={() => openEdit(t)}><EditIcon className="w-5 h-5"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {editing && (
          <Modal isOpen={true} onClose={() => setEditing(null)} title={`Edit Assignments: ${editing.name}`}>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Class Teacher Of</label>
                <select className="input-field" value={form.classTeacherOf || ''} onChange={e => setForm(prev => ({ ...prev, classTeacherOf: e.target.value }))}>
                  <option value="">-- None --</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Subjects</label>
                <select multiple className="input-field h-40" value={form.subjects} onChange={e => {
                  const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                  setForm(prev => ({ ...prev, subjects: selected }));
                }}>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveEdit}>Save</button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignments;
