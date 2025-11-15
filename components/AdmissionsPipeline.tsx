import React, { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import { Admission } from '../types';
import { apiGetAdmissions, apiUpsertAdmission, apiDeleteAdmission, apiHandleAdmissionStageChange } from '../services/api';

const STAGES: Admission['stage'][] = ['enquiry', 'interested', 'paid_application', 'admitted', 'registered'];

const AdmissionsPipeline: React.FC = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Admission> | null>(null);
  const [stageFilter, setStageFilter] = useState<Admission['stage'] | 'all'>('all');
  const [classFilter, setClassFilter] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiGetAdmissions();
        setAdmissions(data);
      } catch (e: any) {
        setError('Failed to load admissions.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, Admission[]> = {};
    STAGES.forEach(s => { map[s] = []; });
    admissions.forEach(a => {
      const s = a.stage || 'enquiry';
      if (stageFilter !== 'all' && s !== stageFilter) return;
      if (classFilter && a.intendedClass !== classFilter) return;
      map[s].push(a);
    });
    return map;
  }, [admissions, stageFilter, classFilter]);

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (item: Admission) => { setEditing(item); setModalOpen(true); };

  const handleSave = async (data: Partial<Admission>) => {
    await apiUpsertAdmission(data);
    setModalOpen(false);
    const refreshed = await apiGetAdmissions();
    setAdmissions(refreshed);
  };

  const handleDelete = async (id: string) => {
    await apiDeleteAdmission(id);
    const refreshed = await apiGetAdmissions();
    setAdmissions(refreshed);
  };

  const handleMove = async (id: string, stage: Admission['stage']) => {
    await apiHandleAdmissionStageChange(id, stage);
    const refreshed = await apiGetAdmissions();
    setAdmissions(refreshed);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex gap-2 w-full md:w-auto">
          <select className="input-field" value={stageFilter} onChange={e => setStageFilter(e.target.value as any)}>
            <option value="all">All Stages</option>
            {STAGES.map(s => <option key={s} value={s}>{label(s)}</option>)}
          </select>
          <input className="input-field" placeholder="Filter by intended class" value={classFilter} onChange={e => setClassFilter(e.target.value)} />
        </div>
        <button onClick={openNew} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> New Admission</button>
      </div>

      {loading ? (
        <div className="card p-6">Loading admissions...</div>
      ) : error ? (
        <div className="card p-6 text-red-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STAGES.map(stage => (
            <div key={stage} className="card">
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold">{label(stage)}</h3>
                <p className="text-xs text-gray-500">{grouped[stage].length} item(s)</p>
              </div>
              <div className="p-4 space-y-3">
                {grouped[stage].length === 0 ? (
                  <p className="text-xs text-gray-500">No items</p>
                ) : (
                  grouped[stage].map(a => (
                    <div key={a.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-sm">{a.candidateName}</div>
                          <div className="text-xs text-gray-600">Class: {a.intendedClass}</div>
                          <div className="text-xs text-gray-600">Parent: {a.parentName || ''}</div>
                          <div className="text-xs text-gray-600 truncate">{a.parentEmail || ''}</div>
                          <div className="text-xs text-gray-600">{a.parentPhone || ''}</div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(a)} className="icon-button" title="Edit"><EditIcon className="w-5 h-5" /></button>
                          <button onClick={() => handleDelete(a.id)} className="icon-button text-red-500" title="Delete"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <select className="input-field text-sm" value={a.stage} onChange={e => handleMove(a.id, e.target.value as Admission['stage'])}>
                          {STAGES.map(s => <option key={s} value={s}>{label(s)}</option>)}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AdmissionFormModal admission={editing} onSave={handleSave} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
};

const AdmissionFormModal = ({ admission, onSave, onClose }: { admission: Partial<Admission> | null; onSave: (d: Partial<Admission>) => void; onClose: () => void }) => {
  const [formData, setFormData] = useState<Partial<Admission>>({
    id: admission?.id || `adm_${Date.now()}`,
    candidateName: admission?.candidateName || '',
    intendedClass: admission?.intendedClass || '',
    parentName: admission?.parentName || '',
    parentEmail: admission?.parentEmail || '',
    parentPhone: admission?.parentPhone || '',
    stage: admission?.stage || 'enquiry',
    leadSource: admission?.leadSource || '',
    campaign: admission?.campaign || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={admission ? 'Edit Admission' : 'New Admission'}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="label">Candidate Name</label>
          <input name="candidateName" value={formData.candidateName as string} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="label">Intended Class</label>
          <input name="intendedClass" value={formData.intendedClass as string} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="label">Parent Name</label>
          <input name="parentName" value={formData.parentName as string} onChange={handleChange} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Parent Email</label>
            <input type="email" name="parentEmail" value={formData.parentEmail as string} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">Parent Phone</label>
            <input type="tel" name="parentPhone" value={formData.parentPhone as string} onChange={handleChange} className="input-field" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Stage</label>
            <select name="stage" value={formData.stage as Admission['stage']} onChange={handleChange} className="input-field">
              {STAGES.map(s => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Lead Source</label>
            <input name="leadSource" value={formData.leadSource as string} onChange={handleChange} className="input-field" placeholder="e.g., Facebook Ads" />
          </div>
        </div>
        <div>
          <label className="label">Campaign</label>
          <input name="campaign" value={formData.campaign as string} onChange={handleChange} className="input-field" placeholder="e.g., Back-to-school 2025" />
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" className="btn btn-primary">Save Admission</button>
        </div>
      </form>
    </Modal>
  );
};

function label(stage: Admission['stage']) {
  if (stage === 'enquiry') return 'Enquiries';
  if (stage === 'interested') return 'Interested';
  if (stage === 'paid_application') return 'Paid Application';
  if (stage === 'admitted') return 'Admitted';
  return 'Registered';
}

export default AdmissionsPipeline;
