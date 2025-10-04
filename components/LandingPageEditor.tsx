import React, { useState } from 'react';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

const LandingPageEditor = ({ settings, onSave }) => {
    const [content, setContent] = useState(settings.landingPageContent);

    const handleHeroChange = (e) => {
        const { name, value } = e.target;
        setContent(prev => ({ ...prev, hero: { ...prev.hero, [name]: value } }));
    };

    const handleProblemChange = (e) => {
        const { name, value } = e.target;
        setContent(prev => ({ ...prev, problem: { ...prev.problem, [name]: value } }));
    };

    const handleFeatureChange = (index, e) => {
        const { name, value } = e.target;
        const newFeatures = [...content.problem.features];
        newFeatures[index] = { ...newFeatures[index], [name]: value };
        setContent(prev => ({ ...prev, problem: { ...prev.problem, features: newFeatures } }));
    };
    
    const handleFaqChange = (index, e) => {
        const { name, value } = e.target;
        const newFaqs = [...content.faq.items];
        newFaqs[index] = { ...newFaqs[index], [name]: value };
        setContent(prev => ({ ...prev, faq: { ...prev.faq, items: newFaqs } }));
    };
    
    const addFaq = () => {
        const newFaqs = [...content.faq.items, { q: '', a: '' }];
        setContent(prev => ({ ...prev, faq: { ...prev.faq, items: newFaqs } }));
    };

    const removeFaq = (index) => {
        const newFaqs = content.faq.items.filter((_, i) => i !== index);
        setContent(prev => ({ ...prev, faq: { ...prev.faq, items: newFaqs } }));
    };

    const handleSaveChanges = () => {
        onSave({ ...settings, landingPageContent: content });
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold">Edit Landing Page Content</h3>

            {/* Hero Section */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Hero Section</h4>
                <div><label className="label">Title</label><textarea name="title" value={content.hero.title} onChange={handleHeroChange} className="input-field" rows={2}></textarea></div>
                <div><label className="label">Subtitle</label><textarea name="subtitle" value={content.hero.subtitle} onChange={handleHeroChange} className="input-field" rows={3}></textarea></div>
            </div>

            {/* Problem/Features Section */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Features Section</h4>
                <div><label className="label">Title</label><input type="text" name="title" value={content.problem.title} onChange={handleProblemChange} className="input-field" /></div>
                <div className="mt-4 space-y-2">
                    {content.problem.features.map((feature, index) => (
                        <div key={index} className="p-2 border rounded">
                            <label className="label text-xs">Feature {index + 1}</label>
                            <input type="text" name="title" value={feature.title} onChange={(e) => handleFeatureChange(index, e)} className="input-field mb-1" placeholder="Feature Title" />
                            <textarea name="desc" value={feature.desc} onChange={(e) => handleFeatureChange(index, e)} className="input-field" rows={2} placeholder="Feature Description"></textarea>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ Section */}
            <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">FAQ Section</h4>
                    <button onClick={addFaq} className="btn btn-secondary"><PlusIcon className="w-4 h-4 mr-1"/> Add FAQ</button>
                </div>
                <div className="space-y-2">
                    {content.faq.items.map((item, index) => (
                        <div key={index} className="p-2 border rounded flex items-start gap-2">
                            <div className="flex-grow">
                                <input type="text" name="q" value={item.q} onChange={(e) => handleFaqChange(index, e)} className="input-field mb-1" placeholder="Question" />
                                <textarea name="a" value={item.a} onChange={(e) => handleFaqChange(index, e)} className="input-field" rows={2} placeholder="Answer"></textarea>
                            </div>
                            <button onClick={() => removeFaq(index)} className="btn btn-secondary bg-red-50 text-red-600 mt-1"><TrashIcon className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>
            </div>

             <div className="text-right">
                <button onClick={handleSaveChanges} className="btn btn-primary">Save Landing Page Content</button>
            </div>
        </div>
    );
};

export default LandingPageEditor;