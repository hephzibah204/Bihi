import React, { useEffect, useState } from 'react';
import { apiGetScheduledCampaigns, apiUpsertScheduledCampaign, apiDeleteScheduledCampaign, apiGetMessageTemplates, apiGetSubjects } from '../services/api';
import { ScheduledCampaign, MessageTemplate, Subject } from '../types';
import Modal from './Modal';

const ScheduledCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<ScheduledCampaign[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduledCampaign | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [campaignData, templateData, subjectData] = await Promise.all([
      apiGetScheduledCampaigns(),
      apiGetMessageTemplates(),
      apiGetSubjects()
    ]);
    setCampaigns(campaignData);
    setTemplates(templateData.filter(t => t.type === 'email'));
    const allClasses = [...new Set<string>(subjectData.flatMap((s: Subject) => s.classes))].sort();
    setClasses(allClasses);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (data: Partial<ScheduledCampaign>) => {
    await apiUpsertScheduledCampaign(data);
    setModalOpen(false);
    setEditing(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await apiDeleteScheduledCampaign(id);
    fetchData();
  };

  if (loading) return <div className="card p-6">Loading scheduled campaigns...</div>;

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Scheduled Campaigns</h2>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>New Campaign</button>
        </div>
        <p className="text-sm text-gray-500 mt-1">Schedule newsletters and email announcements to send at a specific date/time.</p>

        {campaigns.length === 0 ? (
          <p className="mt-4 text-gray-500">No campaigns scheduled yet.</p>
        ) : (
          <div className="table-container mt-4">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Name</th>
                  <th className="th">Send At</th>
                  <th className="th">Target</th>
                  <th className="th">Template</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id}>
                    <td className="td font-medium">{c.name}</td>
                    <td className="td whitespace-nowrap">{new Date(c.sendAt).toLocaleString()}</td>
                    <td className="td">{c.target === 'all' ? 'All Parents' : `Class: ${c.className}`}</td>
                    <td className="td">{templates.find(t => t.id === c.templateId)?.name || 'Unknown'}</td>
                    <td className="td text-right space-x-2">
                      <button className="icon-button" onClick={() => { setEditing(c); setModalOpen(true); }}>Edit</button>
                      <button className="icon-button text-red-500" onClick={() => handleDelete(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <CampaignFormModal
          campaign={editing}
          templates={templates}
          classes={classes}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

const CampaignFormModal = ({ campaign, templates, classes, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    channel: 'email' as const,
    target: 'all' as 'all' | 'class',
    className: '',
    sendAt: new Date().toISOString(),
    enabled: true,
    ...campaign
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

  return (
    <Modal isOpen={true} onClose={onClose} title={campaign ? 'Edit Campaign' : 'New Campaign'}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div><label className="label">Campaign Name</label><input name="name" value={formData.name} onChange={handleChange} className="input-field" required /></div>
        <div><label className="label">Email Template</label><select name="templateId" value={formData.templateId} onChange={handleChange} className="input-field" required><option value="">-- Select Template --</option>{templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        <div><label className="label">Target</label><select name="target" value={formData.target} onChange={handleChange} className="input-field"><option value="all">All Parents</option><option value="class">Specific Class</option></select></div>
        {formData.target === 'class' && (
          <div><label className="label">Class</label><select name="className" value={formData.className || ''} onChange={handleChange} className="input-field" required><option value="">-- Select Class --</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        )}
        <div><label className="label">Send At</label><input type="datetime-local" className="input-field" value={new Date(formData.sendAt).toISOString().slice(0,16)} onChange={(e) => setFormData(prev => ({ ...prev, sendAt: new Date(e.target.value).toISOString() }))} /></div>
        <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save Campaign</button></div>
      </form>
    </Modal>
  );
};

export default ScheduledCampaigns;