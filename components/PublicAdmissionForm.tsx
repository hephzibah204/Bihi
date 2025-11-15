import React, { useState } from 'react';
import Modal from './Modal';
import { apiUpsertAdmission } from '../services/api';

const PublicAdmissionForm: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    candidateName: '',
    intendedClass: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    leadSource: '',
    campaign: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiUpsertAdmission({
        id: `adm_${Date.now()}`,
        candidateName: formData.candidateName,
        intendedClass: formData.intendedClass,
        parentName: formData.parentName,
        parentEmail: formData.parentEmail,
        parentPhone: formData.parentPhone,
        leadSource: formData.leadSource,
        campaign: formData.campaign,
        stage: 'enquiry',
        created_at: new Date().toISOString()
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Admission Form">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label className="label">Candidate Name</label>
          <input name="candidateName" value={formData.candidateName} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="label">Intended Class</label>
          <input name="intendedClass" value={formData.intendedClass} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="label">Parent/Guardian Name</label>
          <input name="parentName" value={formData.parentName} onChange={handleChange} className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Parent Email</label>
            <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label">Parent Phone</label>
            <input type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleChange} className="input-field" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Lead Source</label>
            <input name="leadSource" value={formData.leadSource} onChange={handleChange} className="input-field" placeholder="e.g., Facebook Ads" />
          </div>
          <div>
            <label className="label">Campaign</label>
            <input name="campaign" value={formData.campaign} onChange={handleChange} className="input-field" placeholder="e.g., Back-to-school 2025" />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default PublicAdmissionForm;
