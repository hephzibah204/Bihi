import React, { useState, useEffect } from 'react';
import { apiGetSchoolSettings, updateSchoolSettings } from '../services/api';
import TrashIcon from './icons/TrashIcon';

const SchoolSettings = () => {
    const [settings, setSettings] = useState({
        schoolName: '',
        schoolAddress: '',
        schoolLogo: '',
        session: '',
        term: '',
        paystackPublicKey: '',
        gradingSystem: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const currentSettings = await apiGetSchoolSettings();
            setSettings(prev => ({ ...prev, ...currentSettings }));
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await updateSchoolSettings(() => settings);
        setSaving(false);
    };

    const handleChange = (e) => {
        setSettings(prev => ({...prev, [e.target.name]: e.target.value}));
    }

    const handleGradingChange = (index, field, value) => {
        const newGrading = [...settings.gradingSystem];
        newGrading[index][field] = value;
        setSettings(prev => ({ ...prev, gradingSystem: newGrading }));
    };

    const addGrade = () => {
        setSettings(prev => ({
            ...prev,
            gradingSystem: [...(prev.gradingSystem || []), { grade: '', from: '', to: '', remark: '' }],
        }));
    };

    const removeGrade = (index) => {
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
                            <div><label className="label">School Name</label><input type="text" name="schoolName" value={settings.schoolName} onChange={handleChange} className="input-field"/></div>
                            <div><label className="label">School Address</label><input type="text" name="schoolAddress" value={settings.schoolAddress} onChange={handleChange} className="input-field"/></div>
                            <div><label className="label">School Logo URL</label><input type="text" name="schoolLogo" value={settings.schoolLogo} onChange={handleChange} className="input-field"/></div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold">Academic Settings</h2>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div><label className="label">Current Session</label><input type="text" name="session" value={settings.session} onChange={handleChange} className="input-field" placeholder="e.g., 2023/2024"/></div>
                            <div><label className="label">Current Term</label><select name="term" value={settings.term} onChange={handleChange} className="input-field"><option>First Term</option><option>Second Term</option><option>Third Term</option></select></div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 card">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold">Grading System</h2>
                        <div className="mt-4 space-y-2">
                            {settings.gradingSystem && settings.gradingSystem.map((grade, index) => (
                                <div key={index} className="grid grid-cols-5 gap-2 items-center">
                                    <input type="text" placeholder="Grade (A)" value={grade.grade} onChange={e => handleGradingChange(index, 'grade', e.target.value)} className="input-field"/>
                                    <input type="number" placeholder="From (%)" value={grade.from} onChange={e => handleGradingChange(index, 'from', e.target.value)} className="input-field"/>
                                    <input type="number" placeholder="To (%)" value={grade.to} onChange={e => handleGradingChange(index, 'to', e.target.value)} className="input-field"/>
                                    <input type="text" placeholder="Remark" value={grade.remark} onChange={e => handleGradingChange(index, 'remark', e.target.value)} className="input-field"/>
                                    <button onClick={() => removeGrade(index)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
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