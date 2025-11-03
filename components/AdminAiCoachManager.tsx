import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MicroCourse, getCoachCatalog, upsertCourse, deleteCourse, saveCoachCatalog, exportCoachCatalog } from '../services/teacherCoach';
import DocumentTextIcon from './icons/DocumentTextIcon';
import TrashIcon from './icons/TrashIcon';
import PencilIcon from './icons/PencilIcon';
import DownloadIcon from './icons/DocumentArrowDownIcon';
import UploadIcon from './icons/DocumentArrowDownIcon';
import { USER_ROLES } from '../utils/constants';

const emptyCourse: MicroCourse = {
  id: '',
  title: '',
  description: '',
  videoUrl: '',
  skills: [],
  durationMinutes: undefined,
  provider: '',
  status: 'draft',
  visibleRoles: ['Admin','Teacher'],
  categories: [],
  tags: [],
};

const AdminAiCoachManager: React.FC = () => {
  const [catalog, setCatalog] = useState<MicroCourse[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MicroCourse>({ ...emptyCourse });
  const [filter, setFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCatalog(getCoachCatalog());
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.skills.some(s => s.toLowerCase().includes(q))
    );
  }, [catalog, filter]);

  const startEdit = (course: MicroCourse) => {
    setEditingId(course.id);
    setForm({ ...course, skills: course.skills.slice() });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyCourse });
  };

  const onChange = (field: keyof MicroCourse, value: string) => {
    if (field === 'durationMinutes') {
      const num = value ? Number(value) : undefined;
      setForm(prev => ({ ...prev, durationMinutes: isNaN(num as number) ? undefined : num }));
    } else if (field === 'skills') {
      const skills = value.split(',').map(s => s.trim()).filter(Boolean);
      setForm(prev => ({ ...prev, skills }));
    } else if (field === 'status') {
      setForm(prev => ({ ...prev, status: (value as 'draft'|'published') }));
    } else if (field === 'categories') {
      const categories = value.split(',').map(s => s.trim()).filter(Boolean);
      setForm(prev => ({ ...prev, categories }));
    } else if (field === 'tags') {
      const tags = value.split(',').map(s => s.trim()).filter(Boolean);
      setForm(prev => ({ ...prev, tags }));
    } else {
      setForm(prev => ({ ...prev, [field]: value } as MicroCourse));
    }
  };

  const save = () => {
    if (!form.id || !form.title || !form.videoUrl) {
      alert('Please provide at least id, title, and videoUrl.');
      return;
    }
    const updated = upsertCourse(form);
    setCatalog(updated);
    resetForm();
  };

  const remove = (id: string) => {
    if (!confirm('Delete this course?')) return;
    const updated = deleteCourse(id);
    setCatalog(updated);
    if (editingId === id) resetForm();
  };

  const toggleRole = (role: string) => {
    setForm(prev => {
      const roles = new Set(prev.visibleRoles || []);
      if (roles.has(role)) roles.delete(role); else roles.add(role);
      return { ...prev, visibleRoles: Array.from(roles) };
    });
  };

  const exportCatalog = () => {
    const data = exportCoachCatalog();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coachCatalog.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCatalogFromFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Invalid catalog format');
      // Basic normalization
      const normalized: MicroCourse[] = parsed.map((c: any) => ({
        id: String(c.id || '').trim(),
        title: String(c.title || '').trim(),
        description: String(c.description || ''),
        videoUrl: String(c.videoUrl || ''),
        skills: Array.isArray(c.skills) ? c.skills : [],
        durationMinutes: typeof c.durationMinutes === 'number' ? c.durationMinutes : undefined,
        provider: c.provider || '',
        status: c.status === 'published' ? 'published' : 'draft',
        visibleRoles: Array.isArray(c.visibleRoles) ? c.visibleRoles : ['Admin','Teacher'],
      }));
      saveCoachCatalog(normalized);
      setCatalog(getCoachCatalog());
      alert('Catalog imported successfully');
    } catch (e: any) {
      alert('Failed to import catalog: ' + (e?.message || 'Unknown error'));
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <DocumentTextIcon className="h-6 w-6 mr-2" />
          AI Coach Catalog Manager
        </h2>
        <div className="text-sm text-gray-500">Admins control courses teachers see</div>
      </div>

      <div className="bg-white rounded-lg shadow p-3">
        <h3 className="font-semibold mb-2">Add or Edit Course</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="ID (unique)" value={form.id} onChange={e => onChange('id', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Title" value={form.title} onChange={e => onChange('title', e.target.value)} />
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Description" value={form.description} onChange={e => onChange('description', e.target.value)} />
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Video URL (YouTube/Vimeo)" value={form.videoUrl} onChange={e => onChange('videoUrl', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Skills (comma-separated)" value={form.skills.join(', ')} onChange={e => onChange('skills', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Duration (minutes)" value={form.durationMinutes ?? ''} onChange={e => onChange('durationMinutes', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Provider (YouTube/Vimeo)" value={form.provider || ''} onChange={e => onChange('provider', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Categories (comma-separated)" value={(form.categories || []).join(', ')} onChange={e => onChange('categories', e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Tags (comma-separated)" value={(form.tags || []).join(', ')} onChange={e => onChange('tags', e.target.value)} />
          <select className="border rounded px-3 py-2" value={form.status || 'draft'} onChange={e => onChange('status', e.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <div className="border rounded px-3 py-2">
            <div className="text-xs text-gray-500 mb-1">Visible To Roles</div>
            <div className="flex gap-3 text-sm">
              {[USER_ROLES.ADMIN, USER_ROLES.TEACHER].map(r => (
                <label key={r} className="inline-flex items-center gap-1">
                  <input type="checkbox" checked={(form.visibleRoles || []).includes(r)} onChange={() => toggleRole(r)} />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={save} className="bg-indigo-600 text-white px-3 py-2 rounded">{editingId ? 'Save Changes' : 'Add Course'}</button>
          {editingId && <button onClick={resetForm} className="bg-gray-200 text-gray-800 px-3 py-2 rounded">Cancel</button>}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Catalog</h3>
          <div className="flex items-center gap-2">
            <input className="border rounded px-3 py-2" placeholder="Filter by title/skill" value={filter} onChange={e => setFilter(e.target.value)} />
            <button className="inline-flex items-center gap-1 px-3 py-2 rounded bg-gray-100" onClick={exportCatalog}>
              <DownloadIcon className="h-4 w-4" /> Export JSON
            </button>
            <button className="inline-flex items-center gap-1 px-3 py-2 rounded bg-indigo-100 text-indigo-700" onClick={() => fileInputRef.current?.click()}>
              <UploadIcon className="h-4 w-4" /> Import JSON
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={e => {
              const file = e.target.files?.[0];
              if (file) importCatalogFromFile(file);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }} />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No courses found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">Title</th>
                <th className="py-2">Skills</th>
                <th className="py-2">Provider</th>
                <th className="py-2">Duration</th>
                <th className="py-2">Categories</th>
                <th className="py-2">Tags</th>
                <th className="py-2">Status</th>
                <th className="py-2">Visible To</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="py-2">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-gray-500">{c.description}</div>
                    <div className="text-gray-400 text-xs">ID: {c.id}</div>
                  </td>
                  <td className="py-2">{c.skills.join(', ')}</td>
                  <td className="py-2">{c.provider || '-'}</td>
                  <td className="py-2">{c.durationMinutes ?? '-'}</td>
                  <td className="py-2">{(c.categories || []).join(', ') || '-'}</td>
                  <td className="py-2">{(c.tags || []).join(', ') || '-'}</td>
                  <td className="py-2">{c.status || 'draft'}</td>
                  <td className="py-2">{(c.visibleRoles || []).join(', ') || '-'}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100" onClick={() => startEdit(c)}>
                        <PencilIcon className="h-4 w-4" /> Edit
                      </button>
                      <button className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700" onClick={() => remove(c.id)}>
                        <TrashIcon className="h-4 w-4" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminAiCoachManager;