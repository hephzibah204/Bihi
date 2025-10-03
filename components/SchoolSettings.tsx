import React, { useState, useEffect } from 'react';
import { apiGetSchoolSettings, updateSchoolSettings } from '../services/api';
import TrashIcon from './icons/TrashIcon';
import { SchoolSettings as SchoolSettingsType } from '../types';

const SchoolSettings = () => {
    const [settings, setSettings] = useState<Partial<SchoolSettingsType>>({
        schoolName: '',
        schoolAddress: '',
        schoolLogo: '',
        session: '',
        term: '',
        paystackPublicKey: '',
        gradingSystem: [],
        schoolType: 'secondary',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const currentSettings = await apiGetSchoolSettings();
            if(currentSettings) {
                setSettings(prev => ({ ...prev, ...currentSettings }));
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await updateSchoolSettings(() => settings as SchoolSettingsType);
        setSaving(false);
        alert('Settings saved!');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setSettings(prev => ({...prev, [e.target.name]: e.target.value}));
    }

    const handleGradingChange = (index: number, field: string, value: string | number) => {
        const newGrading = [...(settings.gradingSystem || [])];
        newGrading[index] = { ...newGrading[index], [field]: value };
        setSettings(prev => ({ ...prev, gradingSystem: newGrading }));
    };

    const addGrade = () => {
        setSettings(prev => ({
            ...prev,
            gradingSystem: [...(prev.gradingSystem || []), { grade: '', from: 0, to: 0, remark: '' }],
        }));
    };

    const removeGrade = (index: number) => {
        setSettings(prev => ({
            ...prev,
            gradingSystem: prev.gradingSystem.filter((_, i) => i !== index),
        }));
    };

    if (loading) return <div className="card p-6 text-center">Loading settings...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div></div>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                    {saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold">School Information</h2>
                        <div className="mt-6 space-y-4">
                            <div><label className="label">School Name</label><input type="text" name="schoolName" value={settings.schoolName || ''} onChange={handleChange} className="input-field"/></div>
                            <div><label className="label">School Address</label><input type="text" name="schoolAddress" value={settings.schoolAddress || ''} onChange={handleChange} className="input-field"/></div>
                            <div><label className="label">School Logo URL</label><input type="text" name="schoolLogo" value={settings.schoolLogo || ''} onChange={handleChange} className="input-field"/></div>
                            <div><label className="label">School Level</label><select name="schoolType" value={settings.schoolType || 'secondary'} onChange={handleChange} className="input-field"><option value="nursery_primary">Nursery & Primary</option><option value="secondary">Secondary</option><option value="all">All Levels</option></select></div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold">Academic Settings</h2>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div><label className="label">Current Session</label><input type="text" name="session" value={settings.session || ''} onChange={handleChange} className="input-field" placeholder="e.g., 2023/2024"/></div>
                            <div><label className="label">Current Term</label><select name="term" value={settings.term || ''} onChange={handleChange} className="input-field"><option>First Term</option><option>Second Term</option><option>Third Term</option></select></div>
                            <div><label className="label" title="Used for student payments in Parent/Student portal.">Paystack Public Key</label><input type="text" name="paystackPublicKey" value={settings.paystackPublicKey || ''} onChange={handleChange} className="input-field" placeholder="pk_live_..."/></div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 card">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold">Grading System</h2>
                        <div className="mt-4 space-y-2">
                            {(settings.gradingSystem || []).map((grade, index) => (
                                <div key={index} className="grid grid-cols-5 gap-2 items-center">
                                    <input type="text" placeholder="Grade (A)" value={grade.grade} onChange={e => handleGradingChange(index, 'grade', e.target.value)} className="input-field"/>
                                    <input type="number" placeholder="From (%)" value={grade.from} onChange={e => handleGradingChange(index, 'from', Number(e.target.value))} className="input-field"/>
                                    <input type="number" placeholder="To (%)" value={grade.to} onChange={e => handleGradingChange(index, 'to', Number(e.target.value))} className="input-field"/>
                                    <input type="text" placeholder="Remark" value={grade.remark} onChange={e => handleGradingChange(index, 'remark', e.target.value)} className="input-field col-span-2 md:col-span-1"/>
                                    <div className="col-span-5 md:col-span-1 flex items-center gap-2">
                                        <input type="text" placeholder="Comment" value={grade.remark} onChange={e => handleGradingChange(index, 'remark', e.target.value)} className="input-field"/>
                                        <button onClick={() => removeGrade(index)} className="text-red-500 hover:text-red-700 p-2"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={addGrade} className="btn btn-secondary mt-4">Add Grade</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolSettings;
