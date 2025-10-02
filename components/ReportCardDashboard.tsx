


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
import BulkReportCardPrintView from './BulkReportCardPrintView';
import ConfirmationModal from './ConfirmationModal';


const ReportCardDashboard = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [allData, setAllData] = useState<{scores: Score[], subjects: Subject[], settings: any, allStudents: Student[], attendance: any[], remarks: Remark[]} | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const { exporting, exportToPDF } = useReportCardExporter();

    // Bulk action states
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [isPrintingBulk, setIsPrintingBulk] = useState(false);
    const [isConfirmingGeneration, setIsConfirmingGeneration] = useState(false);
    const [bulkGenerationProgress, setBulkGenerationProgress] = useState<{ current: number; total: number; studentName?: string; } | null>(null);

    // Modal state
    const [activeModalTab, setActiveModalTab] = useState('edit');
    const [selectedTemplate, setSelectedTemplate] = useState('default');
    const [generatingCommentFor, setGeneratingCommentFor] = useState<string | null>(null);
    const [generatingGeneralComment, setGeneratingGeneralComment] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // Fix: Explicitly type the destructured data to ensure correct type inference downstream.
                const [subjects, scores, settings, allStudents, attendance, remarks]: [Subject[], Score[], any, Student[], any[], Remark[]] = await Promise.all([
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
        setSelectedStudents(new Set()); // Reset selection on class change
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
        // This is for single generation
    };

    const handleGenerateGeneralComment = async () => {
        // This is for single generation
    };

    // --- Bulk Action Handlers ---
    const handleSelectStudent = (studentId: string) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudents(new Set(students.map(s => s.id)));
        } else {
            setSelectedStudents(new Set());
        }
    };
    
    const handlePrintSelected = () => {
        if (selectedStudents.size > 0) {
            setIsPrintingBulk(true);
        }
    };

    const handleInitiateBulkGenerate = () => {
        if (selectedStudents.size > 0) {
            setIsConfirmingGeneration(true);
        }
    };

    const handleConfirmBulkGenerate = async () => {
        setIsConfirmingGeneration(false);
        const studentsToProcess = students.filter(s => selectedStudents.has(s.id));
        setBulkGenerationProgress({ current: 0, total: studentsToProcess.length, studentName: 'Initializing...' });
    
        const generateGeneralCommentForStudent = async (student: Student) => {
             const studentScores = allData.scores.filter(s => s.studentId === student.id);
             const performanceSummary = allData.subjects.filter(sub => sub.classes.includes(student.class)).map(sub => {
                 const score = studentScores.find(s => s.subjectId === sub.id);
                 const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);
                 return `${sub.name}: ${total}/100`;
             }).join(', ');
             const prompt = `Generate a holistic, constructive, and encouraging general comment for a student's report card (2-3 sentences). Student: ${student.name}, Class: ${student.class}, Performance: ${performanceSummary || 'No scores.'}`;
             return generateText(prompt);
        };
    
        const generateSubjectCommentForStudent = async (student: Student, subject: Subject) => {
            const score = allData.scores.find(s => s.studentId === student.id && s.subjectId === subject.id);
            const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);
            const prompt = `Generate a constructive report card comment (1-2 sentences). Student: ${student.name}, Subject: ${subject.name}, Score: ${total}/100.`;
            return generateText(prompt);
        };

        const generationPromises = studentsToProcess.map(async (student) => {
            const generalCommentPromise = generateGeneralCommentForStudent(student);
            const studentSubjects = allData.subjects.filter(s => s.classes.includes(student.class));
            const subjectCommentPromises = studentSubjects.map(subject => generateSubjectCommentForStudent(student, subject));
    
            const [generalComment, ...subjectComments] = await Promise.all([generalCommentPromise, ...subjectCommentPromises]);
            setBulkGenerationProgress(prev => ({ ...prev, current: prev.current + 1, studentName: student.name }));
    
            return {
                studentId: student.id,
                generalComment,
                subjectComments: subjectComments.map((comment, index) => ({
                    subjectId: studentSubjects[index].id,
                    comment,
                })),
            };
        });
    
        try {
            const allGeneratedData = await Promise.all(generationPromises);
    
            // Atomically update remarks
            updateTenantData('remarks', (currentRemarks: Remark[] = []) => {
                let newRemarks = [...currentRemarks];
                const { term, session } = allData.settings;
                allGeneratedData.forEach(data => {
                    const { studentId, generalComment } = data;
                    const remarkIndex = newRemarks.findIndex(r => r.studentId === studentId && r.term === term && r.session === session);
                    if (remarkIndex > -1) newRemarks[remarkIndex].generalComment = generalComment;
                    else newRemarks.push({ studentId, term, session, generalComment });
                });
                return newRemarks;
            });
    
            // Atomically update scores with new comments
            updateScores(currentScores => {
                let newScores = [...currentScores];
                const { term, session } = allData.settings;
                allGeneratedData.forEach(data => {
                    const { studentId, subjectComments } = data;
                    subjectComments.forEach(sc => {
                        const { subjectId, comment } = sc;
                        const scoreIndex = newScores.findIndex(s => s.studentId === studentId && s.subjectId === subjectId && s.term === term && s.session === session);
                        if (scoreIndex > -1) newScores[scoreIndex].comment = comment;
                        else newScores.push({ studentId, subjectId, term, session, comment });
                    });
                });
                return newScores;
            });

        } catch (error) {
            console.error("Bulk generation failed:", error);
            setError("An error occurred during AI comment generation. Please try again.");
        } finally {
            setBulkGenerationProgress(null);
        }
    };


    if (isPrintingBulk) {
        return <BulkReportCardPrintView studentIds={Array.from(selectedStudents)} allData={allData} onClose={() => setIsPrintingBulk(false)} />;
    }

    const renderStudentList = () => {
        if (loading && !allData) return <div className="card mt-6"><div className="p-6 text-center">Loading school data...</div></div>;
        if (students.length === 0) return <div className="card mt-6"><div className="p-6 text-center">No students found in this class.</div></div>;
        
        return (
            <div className="table-container mt-6">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th w-12"><input type="checkbox" className="rounded" onChange={handleSelectAll} checked={selectedStudents.size === students.length && students.length > 0} /></th>
                            <th className="th">Name</th>
                            <th className="th">Admission No.</th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {students.map(student => (
                            <tr key={student.id}>
                                <td className="td"><input type="checkbox" className="rounded" checked={selectedStudents.has(student.id)} onChange={() => handleSelectStudent(student.id)} /></td>
                                <td className="td font-medium">{student.name}</td>
                                <td className="td">{student.admissionNo}</td>
                                <td className="td text-right"><button onClick={() => handleViewReport(student)} className="btn btn-secondary">View & Edit Report</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const ReportCardComponent = selectedStudent ? getReportCardTemplate(selectedStudent.class) : null;
    const generalRemark = (allData?.remarks || []).find(r => r.studentId === selectedStudent?.id && r.term === allData?.settings.term && r.session === allData?.settings.session)?.generalComment || '';
    
    // Fix: Defined a variable for the preview component to avoid re-rendering issues.
    const ReportCardComponentForPreview = selectedStudent && (
        selectedTemplate === 'default' ? ReportCardComponent
      : selectedTemplate === 'classic' ? ClassicReportCard
      : selectedTemplate === 'modern' ? ModernReportCard
      : MinimalistReportCard
    );

    return (
        <div>
             {bulkGenerationProgress && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center max-w-sm">
                        <SpinnerIcon className="w-12 h-12 text-indigo-500 mx-auto animate-spin" />
                        <h3 className="text-lg font-semibold mt-4">Generating AI Comments...</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {bulkGenerationProgress.studentName !== 'Initializing...' ? `Processing student: ${bulkGenerationProgress.studentName}` : 'Please wait...'}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
                            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${(bulkGenerationProgress.current / bulkGenerationProgress.total) * 100}%` }}></div>
                        </div>
                        <p className="text-sm font-bold mt-2">
                            {bulkGenerationProgress.current} / {bulkGenerationProgress.total} students completed.
                        </p>
                    </div>
                </div>
            )}
            <h1 className="text-2xl font-semibold">Generate Report Cards</h1>
            <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <label className="label">Select Class</label>
                    <select className="input-field max-w-xs" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} disabled={!allData}>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                 <div className="flex items-center space-x-2">
                    <button onClick={handleInitiateBulkGenerate} className="btn btn-secondary" disabled={selectedStudents.size === 0 || loading || bulkGenerationProgress !== null}>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        AI Generate for Selected ({selectedStudents.size})
                    </button>
                    <button onClick={handlePrintSelected} className="btn btn-primary" disabled={selectedStudents.size === 0 || loading}>
                        <PrinterIcon className="w-5 h-5 mr-2" />
                        Print Selected ({selectedStudents.size})
                    </button>
                </div>
            </div>
            {renderStudentList()}
            {selectedStudent && allData && (
                <Modal isOpen={!!selectedStudent} onClose={handleCloseModal} size="full" title={`Report for ${selectedStudent.name}`}>
                    <div className="flex h-full">
                        {/* Left Panel: Edit Form */}
                        <div className="w-1/3 p-6 border-r dark:border-gray-700 overflow-y-auto no-print">
                            <div className="flex border-b dark:border-gray-700 mb-4">
                                <button
                                    onClick={() => setActiveModalTab('edit')}
                                    className={`px-4 py-2 font-semibold ${activeModalTab === 'edit' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
                                >
                                    Edit Comments
                                </button>
                                <button
                                    onClick={() => setActiveModalTab('preview')}
                                    className={`px-4 py-2 font-semibold ${activeModalTab === 'preview' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
                                >
                                    Preview & Print
                                </button>
                            </div>

                            {activeModalTab === 'edit' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="label">Form Teacher's General Comment</label>
                                        <textarea
                                            className="input-field"
                                            rows={4}
                                            value={generalRemark}
                                            onChange={(e) => handleGeneralCommentChange(e.target.value)}
                                        />
                                        <button onClick={handleGenerateGeneralComment} className="btn btn-secondary text-sm mt-1" disabled={generatingGeneralComment}>
                                                <SparklesIcon className="w-4 h-4 mr-1" />
                                                {generatingGeneralComment ? 'Generating...' : 'AI Generate'}
                                        </button>
                                    </div>
                                    <h4 className="font-semibold pt-4 border-t dark:border-gray-600">Subject Teacher Comments</h4>
                                    {allData.subjects.filter(s => s.classes.includes(selectedStudent.class)).map(subject => {
                                        const score = allData.scores.find(s => s.studentId === selectedStudent.id && s.subjectId === subject.id);
                                        return (
                                            <div key={subject.id}>
                                                <label className="label">{subject.name}</label>
                                                <textarea
                                                    className="input-field"
                                                    rows={2}
                                                    value={score?.comment || ''}
                                                    onChange={(e) => handleCommentChange(subject.id, e.target.value)}
                                                />
                                                <button onClick={() => handleGenerateComment(subject)} className="btn btn-secondary text-sm mt-1" disabled={generatingCommentFor === subject.id}>
                                                    <SparklesIcon className="w-4 h-4 mr-1" />
                                                    {generatingCommentFor === subject.id ? 'Generating...' : 'AI Generate'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {activeModalTab === 'preview' && (
                                <div>
                                    <label className="label">Select Template</label>
                                    <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="input-field">
                                        <option value="default">School Default</option>
                                        <option value="classic">Classic</option>
                                        <option value="modern">Modern</option>
                                        <option value="minimalist">Minimalist</option>
                                    </select>
                                    <button 
                                        onClick={() => exportToPDF(`report-card-${selectedStudent.id}`, `${selectedStudent.name}-report.pdf`)}
                                        className="btn btn-primary w-full mt-4"
                                        disabled={exporting}
                                    >
                                        {exporting ? 'Exporting...' : 'Export as PDF'}
                                    </button>
                                    <button 
                                        onClick={() => window.print()}
                                        className="btn btn-secondary w-full mt-2"
                                    >
                                        <PrinterIcon className="w-5 h-5 mr-2" />
                                        Print Report
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Right Panel: Report Card Preview */}
                        <div className="w-2/3 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-8 flex justify-center">
                            <div className="printable-content">
                                <div id={`report-card-${selectedStudent.id}`} className="transform scale-[0.8] origin-top">
                                    {ReportCardComponentForPreview && <ReportCardComponentForPreview
                                        student={selectedStudent}
                                        students={allData.allStudents}
                                        scores={allData.scores}
                                        subjects={allData.subjects}
                                        settings={allData.settings}
                                        term={allData.settings.term}
                                        session={allData.settings.session}
                                        remarks={allData.remarks}
                                        attendance={allData.attendance}
                                    />}
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
             <ConfirmationModal
                isOpen={isConfirmingGeneration}
                onClose={() => setIsConfirmingGeneration(false)}
                onConfirm={handleConfirmBulkGenerate}
                title="Confirm Bulk Comment Generation"
                message={`This will use AI to generate and save comments for all subjects and general remarks for the ${selectedStudents.size} selected students. Any existing comments will be overwritten. This action cannot be undone. Proceed?`}
            />
        </div>
    );
};

export default ReportCardDashboard;