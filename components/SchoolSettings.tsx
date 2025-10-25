import React, { useState, useEffect, PropsWithChildren } from 'react';
import { apiGetSchoolSettings, apiSaveSchoolSettings } from '../services/api';
import { SchoolSettings, ReportCardSkill, ClassLevel, ClassSection } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import FeatureControlSettings from './FeatureControlSettings';
import IntegrationSettings from './IntegrationSettings';
import ManualBankSettings from './ManualBankSettings';
import { CONTROLLABLE_FEATURES } from '../utils/constants';

const TabButton = ({ view, active, onClick, children }: PropsWithChildren<{ view: string, active: boolean, onClick: (view: string) => void }>) => (
    <button
        onClick={() => onClick(view)}
        className={`px-4 py-2 font-semibold text-sm transition-colors ${active ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
    >
        {children}
    </button>
);

const GeneralSettings = ({ settings, onSettingsChange }) => (
    <div className="space-y-4">
        <div><label className="label">School Name</label><input type="text" value={settings.schoolName || ''} onChange={e => onSettingsChange({ schoolName: e.target.value })} className="input-field" /></div>
        <div><label className="label">School Address</label><input type="text" value={settings.schoolAddress || ''} onChange={e => onSettingsChange({ schoolAddress: e.target.value })} className="input-field" /></div>
        <div><label className="label">School Logo URL</label><input type="text" value={settings.schoolLogo || ''} onChange={e => onSettingsChange({ schoolLogo: e.target.value })} className="input-field" /></div>
        <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Current Session</label><input type="text" value={settings.session || ''} onChange={e => onSettingsChange({ session: e.target.value })} className="input-field" placeholder="e.g., 2023/2024" /></div>
            <div><label className="label">Current Term</label><select value={settings.term || ''} onChange={e => onSettingsChange({ term: e.target.value })} className="input-field"><option>First Term</option><option>Second Term</option><option>Third Term</option></select></div>
        </div>
    </div>
);

const GradingSettings = ({ settings, onSettingsChange }) => {
    const handleChange = (index: number, field: string, value: any) => {
        const newGrading = [...(settings.gradingSystem || [])];
        newGrading[index] = { ...newGrading[index], [field]: value };
        onSettingsChange({ gradingSystem: newGrading });
    };

    const addGrade = () => {
        onSettingsChange({ gradingSystem: [...(settings.gradingSystem || []), { grade: '', from: 0, to: 0, remark: '' }] });
    };

    const removeGrade = (index: number) => {
        onSettingsChange({ gradingSystem: (settings.gradingSystem || []).filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <div><label className="label">Max CA 1 Score</label><input type="number" value={settings.maxCa1 || 0} onChange={e => onSettingsChange({ maxCa1: Number(e.target.value) })} className="input-field"/></div>
                <div><label className="label">Max CA 2 Score</label><input type="number" value={settings.maxCa2 || 0} onChange={e => onSettingsChange({ maxCa2: Number(e.target.value) })} className="input-field"/></div>
                <div><label className="label">Max Exam Score</label><input type="number" value={settings.maxExam || 0} onChange={e => onSettingsChange({ maxExam: Number(e.target.value) })} className="input-field"/></div>
            </div>
            <div className="space-y-2">
                {settings.gradingSystem?.map((grade, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-center">
                        <input type="text" placeholder="Grade" value={grade.grade} onChange={e => handleChange(index, 'grade', e.target.value)} className="input-field"/>
                        <input type="number" placeholder="From" value={grade.from} onChange={e => handleChange(index, 'from', Number(e.target.value))} className="input-field"/>
                        <input type="number" placeholder="To" value={grade.to} onChange={e => handleChange(index, 'to', Number(e.target.value))} className="input-field"/>
                        <input type="text" placeholder="Remark" value={grade.remark} onChange={e => handleChange(index, 'remark', e.target.value)} className="input-field"/>
                        <button onClick={() => removeGrade(index)} className="icon-button text-red-500"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                ))}
            </div>
            <button onClick={addGrade} className="btn btn-secondary"><PlusIcon className="w-4 h-4 mr-2"/>Add Grade</button>
        </div>
    );
};

const ReportCardSettingsTab = ({ settings, onSettingsChange }) => {
    const handleSkillChange = (type: 'affectiveSkills' | 'psychomotorSkills', index: number, value: string) => {
        const reportCardSettings = settings.reportCardSettings || { principalName: '', affectiveSkills: [], psychomotorSkills: [] };
        const newSkills = [...(reportCardSettings[type] || [])];
        newSkills[index] = { ...newSkills[index], label: value };
        onSettingsChange({ reportCardSettings: { ...reportCardSettings, [type]: newSkills } });
    };

    const addSkill = (type: 'affectiveSkills' | 'psychomotorSkills') => {
        const reportCardSettings = settings.reportCardSettings || { principalName: '', affectiveSkills: [], psychomotorSkills: [] };
        const newSkill: ReportCardSkill = { id: `skill_${Date.now()}`, label: '' };
        onSettingsChange({ reportCardSettings: { ...reportCardSettings, [type]: [...(reportCardSettings[type] || []), newSkill] } });
    };

    const removeSkill = (type: 'affectiveSkills' | 'psychomotorSkills', index: number) => {
        const reportCardSettings = settings.reportCardSettings || { principalName: '', affectiveSkills: [], psychomotorSkills: [] };
        onSettingsChange({ reportCardSettings: { ...reportCardSettings, [type]: (reportCardSettings[type] || []).filter((_, i) => i !== index) } });
    };
    
    const reportCardSettings = settings.reportCardSettings || { principalName: '', schoolMotto: '', affectiveSkills: [], psychomotorSkills: [] };

    return (
        <div className="space-y-4">
            <div><label className="label">Principal's Name</label><input type="text" value={reportCardSettings.principalName || ''} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, principalName: e.target.value } })} className="input-field" /></div>
            <div><label className="label">School Motto</label><input type="text" value={reportCardSettings.schoolMotto || ''} onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, schoolMotto: e.target.value } })} className="input-field" /></div>
            <div>
              <label className="label">Primary Report Card Template</label>
              <select
                className="input-field"
                value={reportCardSettings.primaryTemplate || 'primary_default'}
                onChange={e => onSettingsChange({ reportCardSettings: { ...reportCardSettings, primaryTemplate: e.target.value } })}
              >
                <option value="primary_default">Default (Primary)</option>
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimalist">Minimalist</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold">Affective Skills</h4>
                    {reportCardSettings.affectiveSkills.map((skill, index) => (
                        <div key={skill.id} className="flex items-center gap-2 mt-2">
                            <input type="text" value={skill.label} onChange={e => handleSkillChange('affectiveSkills', index, e.target.value)} className="input-field" />
                            <button onClick={() => removeSkill('affectiveSkills', index)}><TrashIcon className="w-4 h-4 text-red-500"/></button>
                        </div>
                    ))}
                    <button onClick={() => addSkill('affectiveSkills')} className="btn btn-secondary text-sm mt-2"><PlusIcon className="w-4 h-4 mr-1"/>Add</button>
                </div>
                 <div>
                    <h4 className="font-semibold">Psychomotor Skills</h4>
                    {reportCardSettings.psychomotorSkills.map((skill, index) => (
                        <div key={skill.id} className="flex items-center gap-2 mt-2">
                            <input type="text" value={skill.label} onChange={e => handleSkillChange('psychomotorSkills', index, e.target.value)} className="input-field" />
                            <button onClick={() => removeSkill('psychomotorSkills', index)}><TrashIcon className="w-4 h-4 text-red-500"/></button>
                        </div>
                    ))}
                    <button onClick={() => addSkill('psychomotorSkills')} className="btn btn-secondary text-sm mt-2"><PlusIcon className="w-4 h-4 mr-1"/>Add</button>
                </div>
            </div>
        </div>
    );
};

const ClassSettings = ({ settings, onSettingsChange }) => {
    const structure = settings.schoolStructure || { levels: [], sections: [] };

    const handleLevelChange = (index, value) => {
        const newLevels = [...structure.levels];
        newLevels[index].name = value;
        onSettingsChange({ schoolStructure: { ...structure, levels: newLevels } });
    };

    const handleSectionChange = (index, value) => {
        const newSections = [...(structure.sections || [])];
        newSections[index].name = value;
        onSettingsChange({ schoolStructure: { ...structure, sections: newSections } });
    };

    const addSection = () => {
        const newSection: ClassSection = { id: `sec_${Date.now()}`, name: '' };
        const next = [...(structure.sections || []), newSection];
        onSettingsChange({ schoolStructure: { ...structure, sections: next } });
    };

    const removeSection = (index: number) => {
        const next = (structure.sections || []).filter((_, i) => i !== index);
        onSettingsChange({ schoolStructure: { ...structure, sections: next } });
    };

    const addLevel = () => {
        const newLevel: ClassLevel = { id: `level_${Date.now()}`, name: '', classes: [] };
        onSettingsChange({ schoolStructure: { ...structure, levels: [...structure.levels, newLevel] } });
    };

    const removeLevel = (index) => {
        onSettingsChange({ schoolStructure: { ...structure, levels: structure.levels.filter((_, i) => i !== index) } });
    };
    
    const addClassToLevel = (levelIndex) => {
        const newLevels = [...structure.levels];
        const newClass = { id: `class_${Date.now()}`, name: '' };
        newLevels[levelIndex].classes.push(newClass);
        onSettingsChange({ schoolStructure: { ...structure, levels: newLevels } });
    };
    
     const handleClassNameChange = (levelIndex, classIndex, value) => {
        const newLevels = [...structure.levels];
        newLevels[levelIndex].classes[classIndex].name = value;
        onSettingsChange({ schoolStructure: { ...structure, levels: newLevels } });
    };
    
    const removeClassFromLevel = (levelIndex, classIndex) => {
        const newLevels = [...structure.levels];
        newLevels[levelIndex].classes.splice(classIndex, 1);
        onSettingsChange({ schoolStructure: { ...structure, levels: newLevels } });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-semibold">Class Levels</h4>
                <p className="text-xs text-gray-500 mb-2">e.g., Nursery, Primary, JSS</p>
                <div className="space-y-4">
                    {structure.levels.map((level, levelIndex) => (
                        <div key={level.id} className="p-3 border rounded-md">
                            <div className="flex items-center gap-2">
                                <input type="text" value={level.name} onChange={e => handleLevelChange(levelIndex, e.target.value)} className="input-field font-semibold" placeholder="Level Name"/>
                                <button onClick={() => removeLevel(levelIndex)} className="icon-button text-red-500"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                            <div className="pl-4 mt-2 space-y-2">
                                {level.classes.map((cls, classIndex) => (
                                    <div key={cls.id} className="flex items-center gap-2">
                                        <input type="text" value={cls.name} onChange={e => handleClassNameChange(levelIndex, classIndex, e.target.value)} className="input-field text-sm" placeholder="Class Name (e.g., 1, 2)"/>
                                        <button onClick={() => removeClassFromLevel(levelIndex, classIndex)} className="icon-button text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                ))}
                                <button onClick={() => addClassToLevel(levelIndex)} className="btn btn-secondary btn-sm text-xs"><PlusIcon className="w-3 h-3 mr-1"/> Add Class</button>
                            </div>
                        </div>
                    ))}
                </div>
                 <button onClick={addLevel} className="btn btn-secondary mt-4"><PlusIcon className="w-4 h-4 mr-2"/> Add Level</button>
            </div>
            <div>
                <h4 className="font-semibold">Class Sections / Arms</h4>
                <p className="text-xs text-gray-500 mb-2">e.g., A, B, Gold, Blue</p>
                <div className="space-y-2">
                    {(structure.sections || []).map((section, index) => (
                        <div key={section.id} className="flex items-center gap-2">
                            <input type="text" value={section.name} onChange={e => handleSectionChange(index, e.target.value)} className="input-field" placeholder="Section Name"/>
                            <button onClick={() => removeSection(index)} className="icon-button text-red-500" title="Remove section"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>
                <button onClick={addSection} className="btn btn-secondary mt-3"><PlusIcon className="w-4 h-4 mr-2"/> Add Section</button>
            </div>
        </div>
    );
};


// School Settings Component - Fixed duplicate declaration issue
const SchoolSettingsComponent = () => {
    const [settings, setSettings] = useState<Partial<SchoolSettings> | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        apiGetSchoolSettings().then(data => {
            const base = data || {};
            const existingFeatures = base.features || {};
            const normalizedFeatures = { ...existingFeatures } as Record<string, boolean>;
            // Ensure all controllable features default to enabled when not yet configured
            CONTROLLABLE_FEATURES.forEach(f => {
                if (normalizedFeatures[f.key] === undefined) {
                    normalizedFeatures[f.key] = true;
                }
            });
            setSettings({ ...base, features: normalizedFeatures });
            setLoading(false);
        });
    }, []);

    const handleSettingsChange = (changed: Partial<SchoolSettings>) => {
        setSettings(prev => ({ ...prev, ...changed }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiSaveSchoolSettings(settings as SchoolSettings);
            window.dispatchEvent(new CustomEvent('storage-update', { detail: { key: 'settings' } }));
            window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Settings saved successfully!' } }));
        } catch (error) {
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: 'Error saving settings.' } }));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="card p-6">Loading settings...</div>;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general': return <GeneralSettings settings={settings!} onSettingsChange={handleSettingsChange} />;
            case 'classes': return <ClassSettings settings={settings!} onSettingsChange={handleSettingsChange} />;
            case 'grading': return <GradingSettings settings={settings!} onSettingsChange={handleSettingsChange} />;
            case 'report-card': return <ReportCardSettingsTab settings={settings!} onSettingsChange={handleSettingsChange} />;
            case 'features': return <FeatureControlSettings settings={settings!} onSettingsChange={handleSettingsChange} />;
            case 'integrations': return <IntegrationSettings settings={settings!} onSettingsChange={handleSettingsChange} />;
            case 'payments': return <ManualBankSettings settings={settings!} onSettingsChange={handleSettingsChange} />;
            default: return null;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">School Settings</h1>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                    {saving ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Save Settings'}
                </button>
            </div>
            
            <div className="card">
                <div className="p-6">
                    <div className="border-b flex flex-wrap">
                        <TabButton view="general" active={activeTab === 'general'} onClick={setActiveTab}>General</TabButton>
                        <TabButton view="classes" active={activeTab === 'classes'} onClick={setActiveTab}>Classes</TabButton>
                        <TabButton view="grading" active={activeTab === 'grading'} onClick={setActiveTab}>Grading</TabButton>
                        <TabButton view="report-card" active={activeTab === 'report-card'} onClick={setActiveTab}>Report Card</TabButton>
                        <TabButton view="features" active={activeTab === 'features'} onClick={setActiveTab}>Features</TabButton>
                        <TabButton view="integrations" active={activeTab === 'integrations'} onClick={setActiveTab}>Integrations</TabButton>
                        <TabButton view="payments" active={activeTab === 'payments'} onClick={setActiveTab}>Payments</TabButton>
                    </div>
                    <div className="mt-6">{renderTabContent()}</div>
                </div>
            </div>
        </div>
    );
};

export default SchoolSettingsComponent;