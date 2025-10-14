import React, { useState, useEffect } from 'react';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import { LandingPageContent } from '../types';
import { DEFAULT_LANDING_PAGE_CONTENT } from '../utils/landingPageContent';

// An array of available icon names for the feature selector
const availableIcons = [
    'ClockIcon', 'SparklesIcon', 'ChatBubbleLeftRightIcon', 
    'ChartBarIcon', 'DocumentArrowDownIcon', 'BrainCircuitIcon'
];

const LandingPageEditor = ({ settings, onSave }) => {
    const [content, setContent] = useState<LandingPageContent>(settings.landingPageContent || DEFAULT_LANDING_PAGE_CONTENT);

    useEffect(() => {
        // When settings are fetched and passed as props, update the local state.
        // This ensures the editor loads content even if it's initially missing.
        setContent(settings.landingPageContent || DEFAULT_LANDING_PAGE_CONTENT);
    }, [settings.landingPageContent]);

    const handleContentChange = (section: string, field: string, value: any) => {
        setContent(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };

    const handleArrayItemChange = (section: string, itemKey: string, index: number, field: string | null, value: any) => {
        setContent(prev => {
            const newItems = [...prev[section][itemKey]];
            if (field) {
                newItems[index] = { ...newItems[index], [field]: value };
            } else {
                // For simple string arrays
                newItems[index] = value;
            }
            return {
                ...prev,
                [section]: { ...prev[section], [itemKey]: newItems }
            };
        });
    };

    const addArrayItem = (section: string, itemKey: string, newItem: any) => {
        setContent(prev => ({
            ...prev,
            [section]: { ...prev[section], [itemKey]: [...prev[section][itemKey], newItem] }
        }));
    };

    const removeArrayItem = (section: string, itemKey: string, index: number) => {
        setContent(prev => {
            const newItems = prev[section][itemKey].filter((_, i) => i !== index);
            return {
                ...prev,
                [section]: { ...prev[section], [itemKey]: newItems }
            };
        });
    };

    const handleSaveChanges = () => {
        onSave({ ...settings, landingPageContent: content });
    };
    
    if (!content) {
        return <div>Loading editor...</div>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Edit Landing Page Content</h3>

            {/* Hero Section */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Hero Section</h4>
                <div><label className="label">Title</label><textarea value={content.hero.title} onChange={e => handleContentChange('hero', 'title', e.target.value)} className="input-field" rows={2}></textarea></div>
                <div><label className="label">Subtitle</label><textarea value={content.hero.subtitle} onChange={e => handleContentChange('hero', 'subtitle', e.target.value)} className="input-field" rows={3}></textarea></div>
            </div>

            {/* Problem Section */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Problem Section</h4>
                <div><label className="label">Title</label><input type="text" value={content.problem.title} onChange={e => handleContentChange('problem', 'title', e.target.value)} className="input-field" /></div>
                <div><label className="label">Extra Text</label><textarea value={content.problem.extraText} onChange={e => handleContentChange('problem', 'extraText', e.target.value)} className="input-field" rows={2}></textarea></div>
                <div className="mt-4">
                    <label className="label">Bullet Points</label>
                    {content.problem.points.map((point, index) => (
                         <div key={index} className="flex items-center gap-2 mb-2">
                             <input type="text" value={point} onChange={(e) => handleArrayItemChange('problem', 'points', index, null, e.target.value)} className="input-field" />
                             <button onClick={() => removeArrayItem('problem', 'points', index)} className="btn btn-secondary bg-red-50 text-red-600"><TrashIcon className="w-4 h-4"/></button>
                         </div>
                    ))}
                    <button onClick={() => addArrayItem('problem', 'points', '')} className="btn btn-secondary text-sm"><PlusIcon className="w-4 h-4 mr-1"/> Add Point</button>
                </div>
            </div>

            {/* Solution/Features Section */}
            <div className="p-4 border rounded-lg">
                 <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Solution / Features Section</h4>
                    <button onClick={() => addArrayItem('solution', 'features', { icon: 'SparklesIcon', title: '', desc: '' })} className="btn btn-secondary"><PlusIcon className="w-4 h-4 mr-1"/> Add Feature</button>
                </div>
                <div><label className="label">Title</label><input type="text" value={content.solution.title} onChange={e => handleContentChange('solution', 'title', e.target.value)} className="input-field" /></div>
                <div className="mt-4 space-y-2">
                    {content.solution.features.map((feature, index) => (
                        <div key={index} className="p-3 border rounded-md">
                            <div className="flex justify-between items-center">
                                <label className="label text-xs">Feature {index + 1}</label>
                                <button onClick={() => removeArrayItem('solution', 'features', index)} className="icon-button text-red-500"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div><label className="label text-xs">Icon</label><select value={feature.icon} onChange={(e) => handleArrayItemChange('solution', 'features', index, 'icon', e.target.value)} className="input-field">{availableIcons.map(icon => <option key={icon} value={icon}>{icon}</option>)}</select></div>
                                <div><label className="label text-xs">Title</label><input type="text" value={feature.title} onChange={(e) => handleArrayItemChange('solution', 'features', index, 'title', e.target.value)} className="input-field" /></div>
                            </div>
                            <div className="mt-2"><label className="label text-xs">Description</label><textarea value={feature.desc} onChange={(e) => handleArrayItemChange('solution', 'features', index, 'desc', e.target.value)} className="input-field" rows={2}></textarea></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Comparison Table Section */}
            <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Comparison Table Section</h4>
                    <button onClick={() => addArrayItem('comparison', 'features', { name: '', regular: '', reportsheet: '' })} className="btn btn-secondary"><PlusIcon className="w-4 h-4 mr-1"/> Add Row</button>
                </div>
                <div><label className="label">Title</label><input type="text" value={content.comparison.title} onChange={e => handleContentChange('comparison', 'title', e.target.value)} className="input-field" /></div>
                <div className="mt-4 space-y-2">
                    {content.comparison.features.map((feature, index) => (
                        <div key={index} className="p-3 border rounded-md">
                            <div className="flex justify-between items-center">
                                <label className="label text-xs">Row {index + 1}</label>
                                <button onClick={() => removeArrayItem('comparison', 'features', index)} className="icon-button text-red-500"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div><label className="label text-xs">Feature Name</label><input type="text" value={feature.name} onChange={(e) => handleArrayItemChange('comparison', 'features', index, 'name', e.target.value)} className="input-field" /></div>
                                <div><label className="label text-xs">Regular Portals</label><input type="text" value={feature.regular} onChange={(e) => handleArrayItemChange('comparison', 'features', index, 'regular', e.target.value)} className="input-field" /></div>
                                <div><label className="label text-xs">ReportSheet</label><input type="text" value={feature.reportsheet} onChange={(e) => handleArrayItemChange('comparison', 'features', index, 'reportsheet', e.target.value)} className="input-field" /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ Section */}
            <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">FAQ Section</h4>
                    <button onClick={() => addArrayItem('faq', 'items', { q: '', a: '' })} className="btn btn-secondary"><PlusIcon className="w-4 h-4 mr-1"/> Add FAQ</button>
                </div>
                <div><label className="label">Title</label><input type="text" value={content.faq.title} onChange={e => handleContentChange('faq', 'title', e.target.value)} className="input-field" /></div>
                <div className="mt-4 space-y-2">
                    {content.faq.items.map((item, index) => (
                        <div key={index} className="p-2 border rounded flex items-start gap-2">
                            <div className="flex-grow">
                                <label className="label text-xs">Question</label><input type="text" value={item.q} onChange={(e) => handleArrayItemChange('faq', 'items', index, 'q', e.target.value)} className="input-field mb-1" />
                                <label className="label text-xs">Answer</label><textarea value={item.a} onChange={(e) => handleArrayItemChange('faq', 'items', index, 'a', e.target.value)} className="input-field" rows={2}></textarea>
                            </div>
                            <button onClick={() => removeArrayItem('faq', 'items', index)} className="btn btn-secondary bg-red-50 text-red-600 mt-1"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>
            </div>

             <div className="text-right mt-6">
                <button onClick={handleSaveChanges} className="btn btn-primary">Save Landing Page Content</button>
            </div>
        </div>
    );
};

export default LandingPageEditor;