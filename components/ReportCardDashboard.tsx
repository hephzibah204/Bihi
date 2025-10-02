

import React, { useState, useEffect } from 'react';
import { apiGetScores, apiGetSubjects, apiGetSchoolSettings, apiGetStudents, updateScores, apiGetAttendance, getTenantData, updateTenantData } from '../services/api';
import Modal from './Modal';
import { getReportCardTemplate } from '../utils/reportCardHelper';
import { useReportCardExporter } from '../hooks/useReportCardExporter';
import PrinterIcon from './icons/PrinterIcon';
import { Student, Score, Subject, Remark } from '../types';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import ClassicReportCard from './report-templates/ClassicReportCard';
import ModernReportCard from './report-templates/ModernReportCard';
import MinimalistReportCard from './report-templates/MinimalistReportCard';


const ReportCardDashboard = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [allData, setAllData] = useState<{scores: Score[], subjects: Subject[], settings: any, allStudents: Student[], attendance: any[], remarks: Remark[]} | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const { exporting, exportToPDF } = useReportCardExporter();

    // Modal state
    const [activeModalTab, setActiveModalTab] = useState('edit');
    const [selectedTemplate, setSelectedTemplate] = useState('default');
    const [generatingCommentFor, setGeneratingCommentFor] = useState<string | null>(null);
    const [generatingGeneralComment, setGeneratingGeneralComment] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [subjects, scores, settings, allStudents, attendance, remarks] = await Promise.all([
                    apiGetSubjects(),
                    apiGetScores(),
                    apiGetSchoolSettings(),
                    apiGetStudents(),
                    apiGetAttendance(),
                    getTenantData('remarks') || [],
                ]);
                const allClasses = [...new Set(subjects.flatMap(s => s.classes))].sort();
                setClasses(allClasses);
                if (allClasses.length > 0) {
                    setSelectedClass(allClasses[0]);
                }
                setAllData({ subjects, scores, settings, allStudents, attendance, remarks });
            } catch (err) {
                setError("Failed to load initial school data.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);
    
    useEffect(() => {
        const handleStorageUpdate = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.key === 'remarks' || customEvent.detail?.key === 'scores') {
                 if (allData) {
                    Promise.all([apiGetScores(), getTenantData('remarks') || []])
                        .then(([scores, remarks]) => {
                            setAllData(prev => ({...prev, scores, remarks}));
                        });
                }
            }
        };
        window.addEventListener('storage-update', handleStorageUpdate);
        return () => window.removeEventListener('storage-update', handleStorageUpdate);
    }, [allData]);


    useEffect(() => {
        if (!selectedClass || !allData) return;
        setStudents(allData.allStudents.filter(s => s.class === selectedClass));
    }, [selectedClass, allData]);

    const handleViewReport = (student: Student) => {
        setSelectedStudent(student);
        setActiveModalTab('edit');
        setSelectedTemplate('default');
    };
    
    const handleCloseModal = () => setSelectedStudent(null);

    const handleCommentChange = (subjectId: string, comment: string) => {
        if (!selectedStudent) return;
        const studentId = selectedStudent.id;
        
        updateScores(currentScores => {
            const scoreIndex = currentScores.findIndex(s => s.studentId === studentId && s.subjectId === subjectId);
            if (scoreIndex > -1) {
                const newScores = [...currentScores];
                newScores[scoreIndex] = { ...newScores[scoreIndex], comment };
                return newScores;
            } else {
                return [...currentScores, {
                    studentId,
                    subjectId,
                    term: allData.settings.term,
                    session: allData.settings.session,
                    comment
                }];
            }
        });
    };
    
    const handleGeneralCommentChange = (comment: string) => {
        if (!selectedStudent || !allData) return;
        const { term, session } = allData.settings;
        const studentId = selectedStudent.id;

        updateTenantData('remarks', (currentRemarks: Remark[] = []) => {
            const remarkIndex = currentRemarks.findIndex(r => r.studentId === studentId && r.term === term && r.session === session);
            const newRemarks = [...currentRemarks];
            
            if (remarkIndex > -1) {
                newRemarks[remarkIndex] = { ...newRemarks[remarkIndex], generalComment: comment };
            } else {
                newRemarks.push({ studentId, term, session, generalComment: comment });
            }
            return newRemarks;
        });
    };

    const handleGenerateComment = async (subject: Subject) => {
        if (!selectedStudent || !allData) return;
        setGeneratingCommentFor(subject.id);
        
        const score = allData.scores.find(s => s.studentId === selectedStudent.id && s.subjectId === subject.id);
        const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);

        const prompt = `
            You are a helpful teacher's assistant in a Nigerian school. 
            Generate a constructive and encouraging report card comment for a student. 
            The comment should be 1-2 sentences long.

            Student's Name: ${selectedStudent.name}
            Subject: ${subject.name}
            Score: ${total}/100

            Grading System for context:
            ${allData.settings.gradingSystem.map(g => `${g.grade}: ${g.from}-${g.to} (${g.remark})`).join('\n')}

            Generate the comment now.
        `;

        try {
            const generatedComment = await generateText(prompt);
            handleCommentChange(subject.id, generatedComment);
        } catch (error) {
            console.error("Error generating comment:", error);
            handleCommentChange(subject.id, "Error generating comment. Please try again.");
        } finally {
            setGeneratingCommentFor(null);
        }
    };

    const handleGenerateGeneralComment = async () => {
        if (!selectedStudent || !allData) return;
        setGeneratingGeneralComment(true);

        const studentScores = allData.scores.filter(s => s.studentId === selectedStudent.id);
        const performanceSummary = allData.subjects
            .filter(sub => sub.classes.includes(selectedStudent.class))
            .map(sub => {
                const score = studentScores.find(s => s.subjectId === sub.id);
                const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);
                return `${sub.name}: ${total}/100`;
            }).join(', ');

        const prompt = `
            You are a helpful Form Teacher in a Nigerian school. 
            Generate a holistic, constructive, and encouraging general comment for a student's report card. 
            The comment should be 2-3 sentences long, summarizing their overall performance for the term.

            Student's Name: ${selectedStudent.name}
            Class: ${selectedStudent.class}
            Overall Performance: ${performanceSummary || 'No scores recorded.'}

            Generate the general comment now.
        `;
        try {
            const comment = await generateText(prompt);
            handleGeneralCommentChange(comment);
        } catch (error) {
            console.error("Error generating general comment:", error);
            handleGeneralCommentChange("Error generating comment. Please try again.");
        } finally {
            setGeneratingGeneralComment(false);
        }
    };


    const renderStudentList = () => {
        if (loading && !allData) return <div className="card mt-6"><div className="p-6 text-center">Loading school data...</div></div>;
        if (students.length === 0) return <div className="card mt-6"><div className="p-6 text-center">No students found in this class.</div></div>;
        
        return (
            <div className="table-container mt-6">
                <table className="table">
                    <thead><tr><th className="th">Name</th><th className="th">Admission No.</th><th className="th text-right">Actions</th></tr></thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {students.map(student => (
                            <tr key={student.id}>
                                <td className="td font-medium">{student.name}</td>
                                <td className="td">{student.admissionNo}</td>
                                <td className="td text-right"><button onClick={() => handleViewReport(student)} className="btn btn-secondary">View Report</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const getTemplateComponent = () => {
        switch(selectedTemplate) {
            case 'classic': return ClassicReportCard;
            case 'modern': return ModernReportCard;
            case 'minimalist': return MinimalistReportCard;
            case 'default':
            default:
                return getReportCardTemplate(selectedStudent.class);
        }
    }
    const ReportCardComponent = selectedStudent ? getTemplateComponent() : null;
    
    const generalRemark = (allData?.remarks || []).find(r => r.studentId === selectedStudent?.id && r.term === allData?.settings.term && r.session === allData?.settings.session)?.generalComment || '';


    return (
        <div>
            <h1 className="text-2xl font-semibold">Generate Report Cards</h1>
            <div className="mt-6">
                <label className="label">Select Class</label>
                <select className="input-field max-w-xs" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} disabled={!allData}>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            {renderStudentList()}
            {selectedStudent && allData && (
                <Modal isOpen={!!selectedStudent} onClose={handleCloseModal} size="full" title={`Report for ${selectedStudent.name}`}>
                    <div className="flex flex-col h-full">
                        <div className="border-b px-6">
                            <nav className="flex space-x-4">
                                <button onClick={() => setActiveModalTab('edit')} className={`py-3 px-1 font-semibold ${activeModalTab === 'edit' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}>Edit Comments</button>
                                <button onClick={() => setActiveModalTab('preview')} className={`py-3 px-1 font-semibold ${activeModalTab === 'preview' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}>Preview Report</button>
                            </nav>
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-y-auto">
                            {activeModalTab === 'edit' && (
                                <div className="max-w-4xl mx-auto p-6 space-y-6">
                                    <div className="card p-4">
                                        <h3 className="font-bold">Form Teacher's General Comment</h3>
                                        <textarea 
                                            className="input-field mt-2" 
                                            rows="4" 
                                            placeholder="Enter a general comment about the student's overall performance, attitude, and behavior..."
                                            value={generalRemark}
                                            onChange={e => handleGeneralCommentChange(e.target.value)}
                                        />
                                        <button 
                                            className="btn btn-ai mt-2"
                                            onClick={handleGenerateGeneralComment}
                                            disabled={generatingGeneralComment}
                                        >
                                            {generatingGeneralComment ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4"/>}
                                            <span className="ml-1 text-xs font-semibold">Generate General Comment</span>
                                        </button>
                                    </div>

                                    {allData.subjects.filter(s => s.classes.includes(selectedStudent.class)).map(subject => {
                                        const score = allData.scores.find(s => s.studentId === selectedStudent.id && s.subjectId === subject.id);
                                        const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);
                                        return (
                                            <div key={subject.id} className="card p-4">
                                                <h3 className="font-bold">{subject.name} - <span className="text-indigo-600">{total}/100</span></h3>
                                                <textarea 
                                                    className="input-field mt-2" 
                                                    rows="3" 
                                                    placeholder={`Enter comment for ${subject.name}...`}
                                                    value={score?.comment || ''}
                                                    onChange={e => handleCommentChange(subject.id, e.target.value)}
                                                />
                                                <button 
                                                    className="btn btn-ai mt-2"
                                                    onClick={() => handleGenerateComment(subject)}
                                                    disabled={generatingCommentFor === subject.id}
                                                >
                                                    {generatingCommentFor === subject.id ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4"/>}
                                                    <span className="ml-1 text-xs font-semibold">Generate</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {activeModalTab === 'preview' && (
                                <div>
                                    <div className="sticky top-0 bg-gray-100 dark:bg-gray-900 z-10 p-4 border-b flex justify-between items-center">
                                        <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="input-field">
                                            <option value="default">Default ({getReportCardTemplate(selectedStudent.class).name.replace('ReportCard', '')})</option>
                                            <option value="classic">Classic</option>
                                            <option value="modern">Modern</option>
                                            <option value="minimalist">Minimalist</option>
                                        </select>
                                        <button onClick={() => exportToPDF(`report-card-preview`, `${selectedStudent.name}-Report.pdf`)} className="btn btn-primary" disabled={exporting}>
                                            <PrinterIcon className="w-5 h-5 mr-2" />
                                            {exporting ? 'Exporting...' : 'Export PDF'}
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <div id="report-card-preview" className="max-w-4xl mx-auto">
                                            {ReportCardComponent && (
                                                 <ReportCardComponent 
                                                    student={selectedStudent} 
                                                    students={allData.allStudents}
                                                    scores={allData.scores} 
                                                    subjects={allData.subjects} 
                                                    settings={allData.settings} 
                                                    term={allData.settings.term}
                                                    session={allData.settings.session}
                                                    remarks={allData.remarks}
                                                    attendance={allData.attendance}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ReportCardDashboard;