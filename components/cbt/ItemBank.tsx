import { useEffect, useMemo, useState } from 'react';
import { useAIRouter } from '../../hooks/useAIRouter';
import { useAuth } from '../../contexts/AuthContext';

type Item = {
  id: string;
  type: string;
  stem: string;
  difficulty?: number;
  tags?: string[];
  options?: Array<{ id: string; text: string }>;
  answer_key?: { correct?: string | string[] };
  rubric?: any;
};

const ItemBank = () => {
  const { session } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('');
  const [tags, setTags] = useState('');
  const [lo, setLo] = useState('');
  const [difficultyMin, setDifficultyMin] = useState('');
  const [difficultyMax, setDifficultyMax] = useState('');
  const [preview, setPreview] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { generate, isLoading: aiLoading } = useAIRouter({ conversationId: 'item-authoring' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set('select', 'id,type,stem,difficulty,tags');
    p.set('limit', '50');
    if (type) p.set('type', type);
    if (tags) p.set('tags', tags);
    if (lo) p.set('lo', lo);
    if (difficultyMin) p.set('difficultyMin', difficultyMin);
    if (difficultyMax) p.set('difficultyMax', difficultyMax);
    return p.toString();
  }, [type, tags, lo, difficultyMin, difficultyMax]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cbt/items?${query}`, { headers: { 'Accept': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) } })
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [query]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/cbt/import', { method: 'POST', body: fd });
      const d = await r.json();
      setPreview(d);
    } finally {
      setUploading(false);
    }
  };

  const commitImport = async (file: File, createExam: boolean) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('commit', 'true');
      if (createExam) fd.append('create_exam', 'true');
      const r = await fetch('/api/cbt/import', { method: 'POST', body: fd });
      const d = await r.json();
      setPreview(d);
      fetch(`/api/cbt/items?${query}`, { headers: { 'Accept': 'application/json' } })
        .then(r => r.json())
        .then(d => setItems(Array.isArray(d) ? d : []));
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (it: Item) => setEditing(it);
  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;
    const nextErrors: Record<string, string> = {};
    if (!editing.stem?.trim()) nextErrors.stem = 'Stem is required';
    if (editing.type === 'mcq') {
      if (!editing.options || editing.options.length < 2) nextErrors.options = 'At least two options required';
      const correct = editing.answer_key?.correct;
      if (!correct || (Array.isArray(correct) ? correct.length === 0 : String(correct).length === 0)) nextErrors.answer_key = 'Provide correct answer';
    }
    if (editing.type === 'multiple_answer') {
      if (!editing.options || editing.options.length < 3) nextErrors.options = 'At least three options required';
      const correct = editing.answer_key?.correct as any;
      if (!Array.isArray(correct) || correct.length < 2) nextErrors.answer_key = 'Select two or more correct answers';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cbt/items/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ type: editing.type, stem: editing.stem, difficulty: editing.difficulty, tags: editing.tags, options: editing.options, answer_key: editing.answer_key, rubric: editing.rubric })
      });
      if (!res.ok) {
        try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Save Failed', message: await res.text() } })); } catch {}
        return;
      }
      const updated = await res.json();
      setItems(prev => prev.map(i => (i.id === updated.id ? { ...i, ...updated } : i)));
      setEditing(null);
      try {
        window.dispatchEvent(new CustomEvent('show-global-success', { detail: { title: 'Item Updated', message: 'Your changes were saved.' } }));
      } catch {}
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    setDeletingId(id);
    try {
      const r = await fetch(`/api/cbt/items/${id}`, { method: 'DELETE', headers: { 'Accept': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) } });
      if (!r.ok) {
        try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Delete Failed', message: await r.text() } })); } catch {}
        return;
      }
      setItems(prev => prev.filter(i => i.id !== id));
      try { window.dispatchEvent(new CustomEvent('show-global-success', { detail: { title: 'Item Deleted', message: 'The item has been removed.' } })); } catch {}
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">CBT Item Bank</h1>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <input className="input" placeholder="Type (mcq, essay...)" value={type} onChange={e => setType(e.target.value)} />
        <input className="input" placeholder="Tags (math,algebra)" value={tags} onChange={e => setTags(e.target.value)} />
        <input className="input" placeholder="LO (LO-12,LO-1)" value={lo} onChange={e => setLo(e.target.value)} />
        <input className="input" placeholder="Min diff" value={difficultyMin} onChange={e => setDifficultyMin(e.target.value)} />
        <input className="input" placeholder="Max diff" value={difficultyMax} onChange={e => setDifficultyMax(e.target.value)} />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full">
            <thead>
              <tr className="text-left">
                <th className="p-3">Stem</th>
                <th className="p-3">Type</th>
                <th className="p-3">Difficulty</th>
                <th className="p-3">Tags</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="p-3">{it.stem}</td>
                  <td className="p-3">{it.type}</td>
                  <td className="p-3">{it.difficulty ?? ''}</td>
                  <td className="p-3">{(it.tags || []).join(', ')}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={() => startEdit(it)}>Edit</button>
                      <button className="btn btn-danger btn-sm" disabled={deletingId===it.id} onClick={() => deleteItem(it.id)}>{deletingId===it.id?'Deleting...':'Delete'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-full max-w-lg">
            <h2 className="font-semibold mb-4">Edit Item</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Type</label>
                <input className="input w-full" value={editing.type} onChange={e=>setEditing({ ...editing, type: e.target.value })} />
              </div>
              <div>
                <label className="text-sm">Stem</label>
                <textarea className="textarea w-full" value={editing.stem} onChange={e=>setEditing({ ...editing, stem: e.target.value })} />
                {errors.stem && (<p className="text-xs text-red-600 mt-1">{errors.stem}</p>)}
                <div className="mt-2">
                  <button className="btn btn-secondary btn-sm" disabled={aiLoading} onClick={async ()=>{
                    if (!editing) return;
                    const tagsPart = (editing.tags||[]).join(', ');
                    const prompt = `Generate a ${editing.type} item stem for Nigerian curriculum. Tags: ${tagsPart}. Return concise stem.`;
                    const res = await generate(prompt, { domain: 'cbt_item_authoring' });
                    if (res?.content) setEditing({ ...editing, stem: res.content });
                  }}>{aiLoading?'Generating...':'Generate with AI'}</button>
                </div>
              </div>
              {editing.type === 'mcq' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Options</label>
                    <button className="btn btn-secondary btn-sm" disabled={aiLoading} onClick={async ()=>{
                      if (!editing) return;
                      const diff = editing.difficulty || 1;
                      const tagsPart = (editing.tags||[]).join(', ');
                      const prompt = `Generate 4 MCQ options with realistic distractors aligned to Nigerian curriculum.
Stem: "${editing.stem}"
Difficulty: ${diff}
Tags: ${tagsPart}
Return JSON: { options: [{ id:'A', text:'...' },{ id:'B', text:'...' },{ id:'C', text:'...' },{ id:'D', text:'...' }], answer_key: { correct: 'A' }, rubric: { maxPoints: 1, criteria: ['Choose the best answer'] } }`;
                      const res = await generate(prompt, { domain: 'cbt_item_options' });
                      const text = res?.content || '';
                      const m = text.match(/\{[\s\S]*\}/);
                      if (m) {
                        try {
                          const obj = JSON.parse(m[0]);
                          setEditing({ ...editing, options: obj.options, answer_key: obj.answer_key, rubric: obj.rubric });
                          setErrors({ ...errors, options: '', answer_key: '' });
                        } catch {}
                      }
                    }}>AI: Options & Rubric</button>
                  </div>
                  <div className="space-y-2">
                    {(editing.options||[]).map((op, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                        <input className="input" value={op.id} onChange={e=>{
                          const next = [...(editing.options||[])]; next[idx] = { ...op, id: e.target.value }; setEditing({ ...editing, options: next });
                        }} />
                        <input className="input col-span-3" value={op.text} onChange={e=>{
                          const next = [...(editing.options||[])]; next[idx] = { ...op, text: e.target.value }; setEditing({ ...editing, options: next });
                        }} />
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <button className="btn btn-secondary btn-sm" onClick={()=>{
                        const next = [...(editing.options||[])]; next.push({ id: String.fromCharCode(65 + next.length), text: '' }); setEditing({ ...editing, options: next });
                      }}>Add Option</button>
                      <button className="btn btn-secondary btn-sm" onClick={()=>{
                        const next = [...(editing.options||[])]; next.pop(); setEditing({ ...editing, options: next });
                      }} disabled={!editing.options || editing.options.length===0}>Remove Last</button>
                    </div>
                    {errors.options && (<p className="text-xs text-red-600 mt-1">{errors.options}</p>)}
                  </div>
                  <div className="mt-3">
                    <label className="text-sm font-medium">Correct Answer</label>
                    <select className="input w-full" value={String(editing.answer_key?.correct||'')} onChange={e=>setEditing({ ...editing, answer_key: { correct: e.target.value } })}>
                      <option value="">-- Select --</option>
                      {(editing.options||[]).map(op => (<option key={op.id} value={op.id}>{op.id}</option>))}
                    </select>
                    {errors.answer_key && (<p className="text-xs text-red-600 mt-1">{errors.answer_key}</p>)}
                  </div>
                </div>
              )}
              {editing.type === 'multiple_answer' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Options</label>
                    <button className="btn btn-secondary btn-sm" disabled={aiLoading} onClick={async ()=>{
                      if (!editing) return;
                      const diff = editing.difficulty || 2;
                      const tagsPart = (editing.tags||[]).join(', ');
                      const prompt = `Generate 5 options for a multiple-answer item with at least 2 correct choices.
Stem: "${editing.stem}"
Difficulty: ${diff}
Tags: ${tagsPart}
Return JSON: { options: [{ id:'A', text:'...' },{ id:'B', text:'...' },{ id:'C', text:'...' },{ id:'D', text:'...' },{ id:'E', text:'...' }], answer_key: { correct: ['A','C'] }, rubric: { maxPoints: 2, criteria: ['Select all that apply'] } }`;
                      const res = await generate(prompt, { domain: 'cbt_item_options_multi' });
                      const text = res?.content || '';
                      const m = text.match(/\{[\s\S]*\}/);
                      if (m) {
                        try {
                          const obj = JSON.parse(m[0]);
                          setEditing({ ...editing, options: obj.options, answer_key: obj.answer_key, rubric: obj.rubric });
                          setErrors({ ...errors, options: '', answer_key: '' });
                        } catch {}
                      }
                    }}>AI: Options & Rubric</button>
                  </div>
                  <div className="space-y-2">
                    {(editing.options||[]).map((op, idx) => (
                      <label key={idx} className="flex items-center gap-2">
                        <input type="checkbox" checked={Array.isArray(editing.answer_key?.correct) ? (editing.answer_key?.correct as any[]).includes(op.id) : false} onChange={e=>{
                          const arr = Array.isArray(editing.answer_key?.correct) ? ([...(editing.answer_key?.correct as any[])]) : []
                          if (e.target.checked) arr.push(op.id); else {
                            const i = arr.indexOf(op.id); if (i>=0) arr.splice(i,1)
                          }
                          setEditing({ ...editing, answer_key: { correct: arr } })
                        }} />
                        <span className="w-10">{op.id}</span>
                        <input className="input flex-1" value={op.text} onChange={e=>{
                          const next = [...(editing.options||[])]; next[idx] = { ...op, text: e.target.value }; setEditing({ ...editing, options: next });
                        }} />
                      </label>
                    ))}
                    {errors.answer_key && (<p className="text-xs text-red-600 mt-1">{errors.answer_key}</p>)}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Difficulty</label>
                  <input className="input w-full" value={String(editing.difficulty||'')} onChange={e=>setEditing({ ...editing, difficulty: Number(e.target.value)||undefined })} />
                </div>
                <div>
                  <label className="text-sm">Tags (comma-separated)</label>
                  <input className="input w-full" value={(editing.tags||[]).join(', ')} onChange={e=>setEditing({ ...editing, tags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={saveEdit}>{saving?'Saving...':'Save'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 bg-white p-4 rounded shadow">
        <div className="font-medium mb-2">Import Items (txt or docx)</div>
        <input type="file" accept=".txt,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
        {uploading && <div className="mt-2 text-sm">Processing...</div>}
        {preview && (
          <div className="mt-3 text-sm">
            <div>Preview count: {preview.itemsCount || preview.previewCount}</div>
            <div className="mt-2 flex gap-2">
              <button className="btn btn-primary" onClick={() => { const f = (document.querySelector('input[type=file]') as HTMLInputElement)?.files?.[0]; if (f) commitImport(f, false); }}>Import as Items</button>
              <button className="btn btn-secondary" onClick={() => { const f = (document.querySelector('input[type=file]') as HTMLInputElement)?.files?.[0]; if (f) commitImport(f, true); }}>Import and Create Exam</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemBank;
