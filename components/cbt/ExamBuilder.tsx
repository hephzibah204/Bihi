import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FileUpload from '../FileUpload';
import FileList from '../FileList';
import { getTenantId } from '../../services/api';

type ExamSection = { id: string; title: string; itemIds?: string[]; timeLimitMinutes?: number };
type Exam = { id?: string; title: string; description?: string; sections: ExamSection[]; rules?: any; status?: string };

const ExamBuilder = () => {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<ExamSection[]>([{ id: crypto.randomUUID(), title: 'Section 1' }]);
  const [saving, setSaving] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [autoGradeOnSubmit, setAutoGradeOnSubmit] = useState(true);
  const [autoEnterScores, setAutoEnterScores] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [className, setClassName] = useState('');
  const [term, setTerm] = useState('');
  const [examWeight, setExamWeight] = useState('100');

  useEffect(() => {
    fetch(`/api/cbt/exams?select=id,title,status&limit=50`, { headers: { 'Accept': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) } })
      .then(r => r.json())
      .then(d => setExams(Array.isArray(d) ? d : []));
  }, [session?.access_token]);

  const addSection = () => {
    setSections(prev => [...prev, { id: crypto.randomUUID(), title: `Section ${prev.length + 1}` }]);
  };

  const updateSectionTitle = (id: string, t: string) => {
    setSections(prev => prev.map(s => (s.id === id ? { ...s, title: t } : s)));
  };

  const saveExam = () => {
    setSaving(true);
    const payload: Exam = {
      title,
      description,
      sections,
      rules: {
        shuffleItems: true,
        autoGradeOnSubmit,
        autoEnterScores,
        scoreEntry: {
          subjectId: subjectId || undefined,
          className: className || undefined,
          term: term || undefined,
          examWeight: Number(examWeight || '100')
        }
      },
      status: 'draft'
    };
    fetch(`/api/cbt/exams`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify(payload) })
      .then(r => r.json())
      .then((row) => { setTitle(''); setExams(prev => [row, ...prev]); })
      .finally(() => setSaving(false));
  };

  const startEdit = (exam: Exam) => setEditingExam(exam);
  const cancelEdit = () => setEditingExam(null);
  const saveEdit = async () => {
    if (!editingExam || !editingExam.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cbt/exams/${editingExam.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify({ title: editingExam.title, description: editingExam.description, status: editingExam.status, rules: editingExam.rules }) });
      const updated = await res.json();
      setExams(prev => prev.map(e => (e.id === updated.id ? { ...e, ...updated } : e)));
      setEditingExam(null);
      try { window.dispatchEvent(new CustomEvent('show-global-success', { detail: { title: 'Exam Updated', message: 'Changes saved.' } })); } catch {}
    } finally {
      setSaving(false);
    }
  };

  const deleteExam = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/cbt/exams/${id}`, { method: 'DELETE', headers: { 'Accept': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) } });
      setExams(prev => prev.filter(e => e.id !== id));
      try { window.dispatchEvent(new CustomEvent('show-global-success', { detail: { title: 'Exam Deleted', message: 'Exam removed.' } })); } catch {}
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">CBT Exam Builder</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="mb-3">
            <label className="block text-sm mb-1">Title</label>
            <input className="input w-full" value={title} onChange={e => setTitle(e.target.value)} />
            {!title?.trim() && (<p className="text-xs text-red-600 mt-1">Title is required</p>)}
          </div>
          <div className="mb-3">
            <label className="block text-sm mb-1">Description</label>
            <textarea className="textarea w-full" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Sections</span>
              <button className="btn btn-primary" onClick={addSection}>Add Section</button>
            </div>
            <div className="space-y-3">
              {sections.map(s => (
                <div key={s.id} className="border rounded p-3">
                  <input className="input w-full" value={s.title} onChange={e => updateSectionTitle(s.id, e.target.value)} />
                  {!s.title?.trim() && (<p className="text-xs text-red-600 mt-1">Section title is required</p>)}
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <div className="font-medium mb-2">Automation</div>
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={autoGradeOnSubmit} onChange={e => setAutoGradeOnSubmit(e.target.checked)} />
              <span>Auto grade on submit</span>
            </label>
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={autoEnterScores} onChange={e => setAutoEnterScores(e.target.checked)} />
              <span>Auto enter scores in gradebook</span>
            </label>
            {autoEnterScores && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="input" placeholder="Subject ID" value={subjectId} onChange={e => setSubjectId(e.target.value)} />
                <input className="input" placeholder="Class Name" value={className} onChange={e => setClassName(e.target.value)} />
                <input className="input" placeholder="Term" value={term} onChange={e => setTerm(e.target.value)} />
                <input className="input" placeholder="Exam Weight (default 100)" value={examWeight} onChange={e => setExamWeight(e.target.value)} />
              </div>
            )}
          </div>
          <button className="btn btn-success" disabled={saving || !title} onClick={saveExam}>{saving ? 'Saving...' : 'Save Exam'}</button>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="font-medium mb-2">Recent Exams</div>
          <ul className="divide-y">
            {exams.map(e => (
              <li key={e.id} className="py-2 flex items-center justify-between">
                <span>{e.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{e.status}</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(e)}>Edit</button>
                  <button className="btn btn-danger btn-sm" disabled={deletingId===String(e.id)} onClick={() => deleteExam(String(e.id))}>{deletingId===String(e.id)?'Deleting...':'Delete'}</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {editingExam && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-full max-w-lg">
            <h2 className="font-semibold mb-4">Edit Exam</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Title</label>
                <input className="input w-full" value={editingExam.title} onChange={e=>setEditingExam({ ...editingExam, title: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Description</label>
                <textarea className="textarea w-full" value={editingExam.description || ''} onChange={e=>setEditingExam({ ...editingExam, description: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Status</label>
                <select className="input w-full" value={editingExam.status || 'draft'} onChange={e=>setEditingExam({ ...editingExam, status: e.target.value })}>
                  <option value="draft">draft</option>
                  <option value="ready">ready</option>
                  <option value="archived">archived</option>
                </select>
              </div>
              <div>
                <div className="font-medium">Automation</div>
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" checked={!!editingExam.rules?.autoGradeOnSubmit} onChange={e=>setEditingExam({ ...editingExam, rules: { ...(editingExam.rules||{}), autoGradeOnSubmit: e.target.checked } })} />
                  <span>Auto grade on submit</span>
                </label>
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" checked={!!editingExam.rules?.autoEnterScores} onChange={e=>setEditingExam({ ...editingExam, rules: { ...(editingExam.rules||{}), autoEnterScores: e.target.checked } })} />
                  <span>Auto enter scores in gradebook</span>
                </label>
                {!!editingExam.rules?.autoEnterScores && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <input className="input" placeholder="Subject ID" value={editingExam.rules?.scoreEntry?.subjectId || ''} onChange={e=>setEditingExam({ ...editingExam, rules: { ...(editingExam.rules||{}), scoreEntry: { ...(editingExam.rules?.scoreEntry||{}), subjectId: e.target.value } } })} />
                    <input className="input" placeholder="Class Name" value={editingExam.rules?.scoreEntry?.className || ''} onChange={e=>setEditingExam({ ...editingExam, rules: { ...(editingExam.rules||{}), scoreEntry: { ...(editingExam.rules?.scoreEntry||{}), className: e.target.value } } })} />
                    <input className="input" placeholder="Term" value={editingExam.rules?.scoreEntry?.term || ''} onChange={e=>setEditingExam({ ...editingExam, rules: { ...(editingExam.rules||{}), scoreEntry: { ...(editingExam.rules?.scoreEntry||{}), term: e.target.value } } })} />
                    <input className="input" placeholder="Exam Weight" value={String(editingExam.rules?.scoreEntry?.examWeight || '')} onChange={e=>setEditingExam({ ...editingExam, rules: { ...(editingExam.rules||{}), scoreEntry: { ...(editingExam.rules?.scoreEntry||{}), examWeight: Number(e.target.value||'0') } } })} />
                  </div>
                )}
              </div>
              {!!editingExam.id && (
                <div className="mt-4">
                  <div className="font-medium mb-2">Support Media</div>
                  <FileUpload tenantId={getTenantId() || ''} linkedType="cbt_exam" linkedId={String(editingExam.id)} category="cbt_media" label="Upload Media" />
                  <div className="mt-3">
                    <FileList tenantId={getTenantId() || ''} linkedType="cbt_exam" linkedId={String(editingExam.id)} title="Media Files" />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={saveEdit}>{saving?'Saving...':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamBuilder;
