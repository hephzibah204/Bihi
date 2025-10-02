

import React, { useState, useEffect, useRef } from 'react';
import { apiGetStudentsForClasses, apiGetSubjects, apiGetSchoolSettings } from '../services/api';
import ClassicIDCard from './id-cards/ClassicIDCard';
import ModernIDCard from './id-cards/ModernIDCard';
import MinimalistIDCard from './id-cards/MinimalistIDCard';
import ProfessionalPortrait from './report-templates/ProfessionalPortrait';
import ClassicLandscape from './report-templates/ClassicLandscape';
import BasicPortrait from './report-templates/BasicPortrait';
import BasicLandscape from './report-templates/BasicLandscape';
import SpinnerIcon from './icons/SpinnerIcon';
import { Student, Subject } from '../types';

import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';

// CDN libraries are declared on the window object
declare global {
    interface Window {
        html2canvas: any;
        jspdf: any;
    }
}

const templates = {
    classic: ClassicIDCard,
    modern: ModernIDCard,
    minimalist: MinimalistIDCard,
    professional: ProfessionalPortrait,
    classicLandscape: ClassicLandscape,
    basicPortrait: BasicPortrait,
    basicLandscape: BasicLandscape,
};

const IDCardGenerator = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [settings, setSettings] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState('classic');
    const cardRef = useRef(null);
    const [exporting, setExporting] = useState(false);
    
    // States for providing immediate visual feedback during data loading
    const [initialLoading, setInitialLoading] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [subjects, schoolSettings]: [Subject[], any] = await Promise.all([
                    apiGetSubjects(),
                    apiGetSchoolSettings()
                ]);
                const allClasses = [...new Set(subjects.flatMap(s => s.classes))].sort();
                setClasses(allClasses);
                setSettings(schoolSettings);
                if (allClasses.length > 0) {
                    setSelectedClass(allClasses[0]);
                }
            } catch (error) {
                console.error("Failed to load initial ID card data", error);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedClass) {
            setStudents([]);
            setSelectedStudent(null);
            return;
        }
        const fetchStudents = async () => {
            setStudentsLoading(true);
            try {
                const fetchedStudents = await apiGetStudentsForClasses([selectedClass]);
                setStudents(fetchedStudents);
                setSelectedStudent(fetchedStudents[0] || null);
            } catch (error) {
                console.error("Failed to fetch students for class", error);
                setStudents([]);
                setSelectedStudent(null);
            } finally {
                setStudentsLoading(false);
            }
        };
        fetchStudents();
    }, [selectedClass]);

    const handleStudentChange = (studentId) => {
        const student = students.find(s => s.id === studentId);
        setSelectedStudent(student || null);
    };
    
    const handleExport = () => {
        if (!cardRef.current || !selectedStudent) return;
        setExporting(true);
        
        const { html2canvas, jspdf } = window;
        if (!html2canvas || !jspdf) {
            console.error("html2canvas or jspdf is not available for export.");
            setExporting(false);
            return;
        }
        const { jsPDF } = jspdf;

        html2canvas(cardRef.current, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${selectedStudent.name}_ID_Card.pdf`);
        }).catch(err => {
            console.error("Error exporting ID card:", err);
        }).finally(() => {
            setExporting(false);
        });
    };

    const SelectedTemplateComponent = templates[selectedTemplate];
    const isLoading = initialLoading || studentsLoading;

    return (
        <div>
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Settings Panel */}
                <div className="lg:col-span-1 card">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold border-b pb-3">Customize ID Card</h2>
                        <div className="space-y-4 mt-4">
                            <div>
                                <label className="label">Template</label>
                                <select className="input-field" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} disabled={isLoading}>
                                    <option value="classic">Classic Portrait</option>
                                    <option value="modern">Modern Portrait</option>
                                    <option value="minimalist">Minimalist Portrait</option>
                                    <option value="professional">Professional Portrait</option>
                                    <option value="classicLandscape">Classic Landscape</option>
                                    <option value="basicPortrait">Basic Portrait</option>
                                    <option value="basicLandscape">Basic Landscape</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Class</label>
                                <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} disabled={isLoading}>
                                    {initialLoading ? (
                                        <option>Loading classes...</option>
                                    ) : (
                                        classes.map(c => <option key={c} value={c}>{c}</option>)
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="label">Student</label>
                                <select className="input-field" value={selectedStudent?.id || ''} onChange={e => handleStudentChange(e.target.value)} disabled={isLoading || students.length === 0}>
                                    {studentsLoading ? (
                                        <option>Loading students...</option>
                                    ) : (
                                        students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                                    )}
                                </select>
                            </div>
                             <button onClick={handleExport} className="w-full btn btn-primary mt-4" disabled={exporting || isLoading || !selectedStudent}>
                                 <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                                {exporting ? 'Exporting...' : 'Export as PDF'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-2 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg p-8 min-h-[450px]">
                    {isLoading ? (
                        <div className="text-center text-gray-500">
                            <SpinnerIcon className="w-10 h-10 animate-spin mx-auto mb-3" />
                            <p>{initialLoading ? 'Loading configuration...' : 'Loading students...'}</p>
                        </div>
                    ) : selectedStudent && settings ? (
                         <div ref={cardRef}>
                             <SelectedTemplateComponent student={selectedStudent} schoolSettings={settings} />
                         </div>
                    ) : (
                        <div className="text-center text-gray-500">
                            <p>{classes.length > 0 ? "No students found in this class." : "No classes configured yet."}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IDCardGenerator;