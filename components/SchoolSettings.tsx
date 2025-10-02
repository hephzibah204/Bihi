import React, { useState, useEffect } from 'react';
import { apiGetSchoolSettings, updateSchoolSettings } from '../services/api';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

const SchoolSettings = () => {
    const [settings, setSettings] = useState({
        schoolName: '',
        schoolAddress: '',
        session: '',
        term: '',
        gradingSystem: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState('');
    const [error, setError] = useState('');

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const fetchedSettings = await apiGetSchoolSettings();
            setSettings(prev => ({ ...prev, ...fetchedSettings }));
        } catch (err) {
            setError('Failed to load settings.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

     useEffect(() => {
        const handleStorageUpdate = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.key === 'settings') {
                fetchSettings();
            }
        };
        window.addEventListener('storage-update', handleStorageUpdate);
        return () => window.removeEventListener('storage-update', handleStorageUpdate);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleGradeChange = (index, field, value) => {
        const newGradingSystem = [...settings.gradingSystem];
        newGradingSystem[index][field] = field === 'remark' ? value : Number(value);
        setSettings(prev => ({ ...prev, gradingSystem: newGradingSystem }));
    };

    const addGrade = () => {
        const newGradingSystem = [...settings.gradingSystem, { grade: '', from: 0, to: 0, remark: '' }];
        setSettings(prev => ({...prev, gradingSystem: newGradingSystem}));
    };
    
    const removeGrade = (index) => {
        const newGradingSystem = settings.gradingSystem.filter((_, i) => i !== index);
        setSettings(prev => ({ ...prev, gradingSystem: newGradingSystem }));
    };

    const handleSave = async () => {
        setSaving(true);
        setNotification('');
        setError('');
        try {
            await updateSchoolSettings(currentSettings => ({...currentSettings, ...settings}));
            setNotification('Settings saved successfully!');
            setTimeout(() => setNotification(''), 3000);
        } catch (err) {
            setError('Failed to save settings.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) return <div className="card p-6 text-center">Loading settings...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">School Settings</h1>
                <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
            
            {notification && <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-lg">{notification}</div>}
            {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* General Settings Card */}
                <div className="card">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold border-b dark:border-gray-700 pb-3">General Information</h2>
                        <div className="space-y-4 mt-4">
                            <div>
                                <label className="label" htmlFor="schoolName">School Name</label>
                                <input type="text" id="schoolName" name="schoolName" className="input-field" value={settings.schoolName} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="label" htmlFor="schoolAddress">School Address</label>
                                <input type="text" id="schoolAddress" name="schoolAddress" className="input-field" value={settings.schoolAddress} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="label" htmlFor="session">Current Session</label>
                                <input type="text" id="session" name="session" className="input-field" value={settings.session} onChange={handleChange} placeholder="e.g., 2023/2024" />
                            </div>
                            <div>
                                <label className="label" htmlFor="term">Current Term</label>
                                <select id="term" name="term" className="input-field" value={settings.term} onChange={handleChange}>
                                    <option value="First Term">First Term</option>
                                    <option value="Second Term">Second Term</option>
                                    <option value="Third Term">Third Term</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grading System Card */}
                <div className="card">
                    <div className="p-6">
                        <div className="flex justify-between items-center border-b dark:border-gray-700 pb-3">
                            <h2 className="text-lg font-semibold">Grading System</h2>
                            <button onClick={addGrade} className="btn btn-secondary flex items-center"><PlusIcon className="w-4 h-4 mr-1" /> Add Grade</button>
                        </div>
                        <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
                            {settings.gradingSystem.map((g, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                    <input className="input-field col-span-2 text-center" placeholder="A" value={g.grade} onChange={(e) => handleGradeChange(index, 'grade', e.target.value)} />
                                    <input type="number" className="input-field col-span-2 text-center" placeholder="75" value={g.from} onChange={(e) => handleGradeChange(index, 'from', e.target.value)} />
                                    <span className="text-center">to</span>
                                    <input type="number" className="input-field col-span-2 text-center" placeholder="100" value={g.to} onChange={(e) => handleGradeChange(index, 'to', e.target.value)} />
                                    <input className="input-field col-span-4" placeholder="Excellent" value={g.remark} onChange={(e) => handleGradeChange(index, 'remark', e.target.value)} />
                                    <button onClick={() => removeGrade(index)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchoolSettings;