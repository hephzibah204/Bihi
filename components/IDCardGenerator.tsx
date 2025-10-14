

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiGetStudents, apiGetSchoolSettings } from '../services/api';
import { Student, SchoolSettings } from '../types';
import BulkIDCardPrintView from './BulkIDCardPrintView';
import AnimatedCheckbox from './AnimatedCheckbox';

// Lazy load templates
const BasicPortrait = React.lazy(() => import('./id-cards/BasicIDCard'));
const ClassicIDCard = React.lazy(() => import('./id-cards/ClassicIDCard'));
const ModernIDCard = React.lazy(() => import('./id-cards/ModernIDCard'));
const MinimalistIDCard = React.lazy(() => import('./id-cards/MinimalistIDCard'));

const templates = {
    'basic': { name: 'Basic Portrait', component: BasicPortrait },
    'classic': { name: 'Classic Portrait', component: ClassicIDCard },
    'modern': { name: 'Modern Portrait', component: ModernIDCard },
    'minimalist': { name: 'Minimalist Portrait', component: MinimalistIDCard },
};

const IDCardGenerator = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('classic');
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    
    const [isPrintView, setIsPrintView] = useState(false);
    
    const allClasses = useMemo(() => {
        return [...new Set(students.map(s => s.class))].sort();
    }, [students]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentData, settingsData] = await Promise.all([apiGetStudents(), apiGetSchoolSettings()]);
                setStudents(studentData);
                setSettings(settingsData);
                if (studentData.length > 0) {
                    const classes = [...new Set(studentData.map(s => s.class))].sort();
                    setSelectedClass(classes[0]);
                }
            } catch (err) {
                console.error("Failed to load data for ID Card Generator:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const studentsInClass = useMemo(() => {
        return students.filter(s => s.class === selectedClass);
    }, [students, selectedClass]);
    
    const handleSelectStudent = (studentId: string) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            newSet.has(studentId) ? newSet.delete(studentId) : newSet.add(studentId);
            return newSet;
        });
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedStudents(e.target.checked ? new Set(studentsInClass.map(s => s.id)) : new Set());
    };

    const handlePrint = () => {
        if (selectedStudents.size > 0) {
            setIsPrintView(true);
        }
    };
    
    if (loading) return <div>Loading...</div>;
    
    if (isPrintView) {
        return <BulkIDCardPrintView 
            studentIds={Array.from(selectedStudents)} 
            students={students}
            settings={settings}
            templateKey={selectedTemplate}
            onClose={() => setIsPrintView(false)}
        />;
    }

    const TemplateComponent = templates[selectedTemplate].component;
    const previewStudent = studentsInClass.find(s => selectedStudents.has(s.id)) || studentsInClass[0];

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">ID Card Generator</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className="label">Select Class</label>
                        <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="label">Select Template</label>
                        <select className="input-field" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
                            {Object.entries(templates).map(([key, { name }]) => (
                                <option key={key} value={key}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">&nbsp;</label>
                        <button onClick={handlePrint} className="btn btn-primary w-full" disabled={selectedStudents.size === 0}>
                            Print/Download ({selectedStudents.size})
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="md:col-span-1 table-container max-h-96 overflow-y-auto">
                        <table className="table">
                            <thead><tr>
                                <th className="th"><AnimatedCheckbox onChange={handleSelectAll} checked={selectedStudents.size === studentsInClass.length && studentsInClass.length > 0} /></th>
                                <th className="th">Name</th>
                            </tr></thead>
                            <tbody>
                                {studentsInClass.map(s => (
                                    <tr key={s.id}>
                                        <td className="td"><AnimatedCheckbox checked={selectedStudents.has(s.id)} onChange={() => handleSelectStudent(s.id)} /></td>
                                        <td className="td">{s.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="md:col-span-2 flex items-center justify-center bg-gray-100 p-4 rounded-lg">
                        {previewStudent && settings ? (
                            <React.Suspense fallback={<div>Loading template...</div>}>
                                <TemplateComponent student={previewStudent} schoolSettings={settings} />
                            </React.Suspense>
                        ) : (
                            <p>Select a student to preview ID card.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IDCardGenerator;