import React, { useState, useEffect, PropsWithChildren } from 'react';
import { apiGetSchoolSettings, apiSaveSchoolSettings } from '../services/api';
import { SchoolSettings, Grading, ReportCardSection, ReportCardSkill } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import FeatureControlSettings from './FeatureControlSettings';

const SkillEditor = ({ title, skills, onSkillsChange }) => {
    
    const handleLabelChange = (index, newLabel) => {
        const newSkills = [...skills];
        newSkills[index].label = newLabel;
        onSkillsChange(newSkills);
    };

    const addSkill = () => {
        onSkillsChange([...skills, { id: `skill_${Date.now()}`, label: '' }]);
    };

    const removeSkill = (index) => {
        onSkillsChange(skills.filter((_, i) => i !== index));
    };

    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">{title}</h4>
                <button onClick={addSkill} className="btn btn-secondary text-sm"><PlusIcon className="w-4 h-4 mr-1"/> Add</button>
            </div>
            <div className="space-y-2">
                {skills.map((skill, index) => (
                    <div key={skill.id} className="flex items-center gap-2">
                        <input 
                            value={skill.label}
                            onChange={(e) => handleLabelChange(index, e.target.value)}
                            className="input-field"
                            placeholder="Skill label (e.g., Punctuality)"
                        />
                         <button onClick={() => removeSkill(index)} className="icon-button text-red-500"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};


const SchoolSettingsComponent = () => {
    const [settings, setSettings] = useState<Partial<SchoolSettings> | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const data = await apiGetSchoolSettings();
            setSettings(data || { gradingSystem: [] });
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubSettingsChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };
    
    const handleGradingChange = (index: number, field: keyof Grading, value: string | number) => {
        const newGradingSystem = [...(settings.gradingSystem || [])];
        newGradingSystem[index] = { ...newGradingSystem[index], [field]: value };
        setSettings(prev => ({ ...prev, gradingSystem: newGradingSystem }));
    };

    const addGrade = () => {
        const newGradingSystem = [...(settings.gradingSystem || []), { grade: '', from: 0, to: 0, remark: '' }];
        setSettings(prev => ({ ...prev, gradingSystem: newGradingSystem }));
    };

    const removeGrade = (index: number) => {
        const newGradingSystem = settings.gradingSystem.filter((_, i) => i !== index);
        setSettings(prev => ({ ...prev, gradingSystem: newGradingSystem }));
    };

    const handleReportCardSettingChange = (field: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            reportCardSettings: {
                ...prev.reportCardSettings,
                [field]: value,
            }
        }));
    };
    
    const handleSectionChange = (index: number, field: keyof ReportCardSection, value: any) => {
        const newSections = [...settings.reportCardSettings.sections];
        newSections[index] = { ...newSections[index], [field]: value };
        handleReportCardSettingChange('sections', newSections);
    };

    const handleSave = async () => {
        setSaving(true);
        await apiSaveSchoolSettings(settings as SchoolSettings);
        setSaving(false);
        alert("Settings Saved!");
    };
    
    const TabButton = ({ view, children }: PropsWithChildren<{ view: string }>) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`px-4 py-2 font-semibold ${activeTab === view ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
        >
            {children}
        </button>
    );

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">School Settings</h1>
                <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                    {saving && <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />}
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
            
            <div className="card">
                <div className="p-6">
                    <div className="border-b">
                        <TabButton view="general">General</TabButton>
                        <TabButton view="academic">Academic</TabButton>
                        <TabButton view="report-card">Report Card</TabButton>
                        <TabButton view="feature-access">Feature Access</TabButton>
                    </div>

                    <div className="mt-6">
                        {activeTab === 'general' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="label">School Name</label><input name="schoolName" value={settings?.schoolName || ''} onChange={handleChange} className="input-field" /></div>
                                <div><label className="label">School Address</label><input name="schoolAddress" value={settings?.schoolAddress || ''} onChange={handleChange} className="input-field" /></div>
                                <div><label className="label">School Logo URL</label><input name="schoolLogo" value={settings?.schoolLogo || ''} onChange={handleChange} className="input-field" /></div>
                                <div><label className="label">School Type</label><select name="schoolType" value={settings?.schoolType || 'secondary'} onChange={handleChange} className="input-field"><option value="nursery_primary">Nursery/Primary</option><option value="secondary">Secondary</option><option value="all">All Levels</option></select></div>
                            </div>
                        )}
                        {activeTab === 'academic' && (
                             <div className="space-y-6">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className="label">Current Session</label><input name="session" value={settings?.session || ''} onChange={handleChange} className="input-field" placeholder="e.g., 2023/2024" /></div>
                                    <div><label className="label">Current Term</label><select name="term" value={settings?.term || 'First Term'} onChange={handleChange} className="input-field"><option>First Term</option><option>Second Term</option><option>Third Term</option></select></div>
                                    <div><label className="label">Max CA 1 Score</label><input type="number" name="maxCa1" value={settings?.maxCa1 || 20} onChange={handleChange} className="input-field" /></div>
                                    <div><label className="label">Max CA 2 Score</label><input type="number" name="maxCa2" value={settings?.maxCa2 || 20} onChange={handleChange} className="input-field" /></div>
                                    <div><label className="label">Max Exam Score</label><input type="number" name="maxExam" value={settings?.maxExam || 60} onChange={handleChange} className="input-field" /></div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-semibold">Grading System</h3>
                                        <button onClick={addGrade} className="btn btn-secondary"><PlusIcon className="w-5 h-5 mr-2"/> Add Grade</button>
                                    </div>

                                    {/* Desktop Headers */}
                                    <div className="hidden md:grid md:grid-cols-10 md:gap-2 mt-4 mb-2">
                                        <label className="label text-xs col-span-1">Grade</label>
                                        <label className="label text-xs col-span-2">From (%)</label>
                                        <label className="label text-xs col-span-2">To (%)</label>
                                        <label className="label text-xs col-span-4">Remark</label>
                                        <label className="label text-xs col-span-1 text-right">Action</label>
                                    </div>
                                    
                                    {/* Grading System Rows */}
                                    <div className="mt-4 space-y-4">
                                        {settings?.gradingSystem?.map((grade, index) => (
                                            <div key={index} className="p-3 border rounded-lg space-y-2 md:space-y-0 md:grid md:grid-cols-10 md:gap-2 md:items-center bg-gray-50 md:bg-transparent md:p-0 md:border-0">
                                                
                                                <label className="label text-xs md:hidden">Grade</label>
                                                <input placeholder="A" value={grade.grade} onChange={e => handleGradingChange(index, 'grade', e.target.value)} className="input-field md:col-span-1" />

                                                <label className="label text-xs md:hidden">From (%)</label>
                                                <input type="number" placeholder="75" value={grade.from} onChange={e => handleGradingChange(index, 'from', Number(e.target.value))} className="input-field md:col-span-2" />

                                                <label className="label text-xs md:hidden">To (%)</label>
                                                <input type="number" placeholder="100" value={grade.to} onChange={e => handleGradingChange(index, 'to', Number(e.target.value))} className="input-field md:col-span-2" />
                                                
                                                <label className="label text-xs md:hidden">Remark</label>
                                                <input placeholder="Excellent" value={grade.remark} onChange={e => handleGradingChange(index, 'remark', e.target.value)} className="input-field md:col-span-4" />

                                                <div className="md:col-span-1 flex justify-end">
                                                    <button onClick={() => removeGrade(index)} className="icon-button text-red-500">
                                                        <TrashIcon className="w-5 h-5"/>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        )}
                        {activeTab === 'report-card' && (
                             <div className="space-y-6">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label">Principal's Name</label>
                                        <input value={settings?.reportCardSettings?.principalName || ''} onChange={e => handleReportCardSettingChange('principalName', e.target.value)} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="label">School Motto</label>
                                        <input value={settings?.reportCardSettings?.schoolMotto || ''} onChange={e => handleReportCardSettingChange('schoolMotto', e.target.value)} className="input-field" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Report Card Sections</h3>
                                    <p className="text-sm text-gray-500">Enable, disable, and rename sections that appear on the report card.</p>
                                    <div className="space-y-2 mt-2">
                                        {settings?.reportCardSettings?.sections.map((section, index) => (
                                            <div key={section.id} className="flex items-center gap-4 p-2 border rounded-md">
                                                <input type="checkbox" checked={section.enabled} onChange={e => handleSectionChange(index, 'enabled', e.target.checked)} className="h-5 w-5"/>
                                                <input value={section.title} onChange={e => handleSectionChange(index, 'title', e.target.value)} className="input-field" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <SkillEditor 
                                        title="Affective Skills"
                                        skills={settings?.reportCardSettings?.affectiveSkills || []}
                                        onSkillsChange={(newSkills) => handleReportCardSettingChange('affectiveSkills', newSkills)}
                                    />
                                     <SkillEditor 
                                        title="Psychomotor Skills"
                                        skills={settings?.reportCardSettings?.psychomotorSkills || []}
                                        onSkillsChange={(newSkills) => handleReportCardSettingChange('psychomotorSkills', newSkills)}
                                    />
                                </div>
                            </div>
                        )}
                        {activeTab === 'feature-access' && (
                            <FeatureControlSettings
                                settings={settings}
                                onSettingsChange={(changed) => handleSubSettingsChange(Object.keys(changed)[0], Object.values(changed)[0])}
                            />
                        )}
                    </div>
                </div>
            </div>
            
        </div>
    );
};

export default SchoolSettingsComponent;