

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiGetStudents, apiGetSubjects, apiGetSchoolSettings, apiUpsertRemark, getTenantData, apiGetScores, apiGetBehavioralRecords, apiUpsertScore } from '../services/api';
// Fix: Import `Remark` type to correctly type the component's state.
import { Student, Subject, Remark, SchoolSettings, Score, BehavioralLogEntry, ReportCardSkill } from '../types';
import Modal from './Modal';
import { debounce } from 'lodash';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import EditIcon from './icons/EditIcon';

// Fix: Typed Star as a React.FC to allow React's special 'key' prop to be passed during iteration without causing a type error.
const Star: React.FC<{ filled: boolean, onClick: () => void }> = ({ filled, onClick }) => (
    <button type="button" onClick={onClick} className="focus:outline-none">
        <svg className={`w-5 h-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    </button>
);

const EditableSkillsRating = ({ title, skills, ratings, onRatingChange }: { title: string, skills: ReportCardSkill[], ratings: Record<string, number>, onRatingChange: (skillId: string, rating: number) => void }) => {
    return (
        <div>
            <h4 className="font-semibold text-gray-700">{title}</h4>
            <div className="space-y-2 mt-2">
                {skills.map(skill => (
                    <div key={skill.id} className="flex justify-between items-center p-2 rounded-md bg-gray-50">
                        <span className="text-sm">{skill.label}</span>
                        <div className="flex space-x-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    filled={i < (ratings[skill.id] || 0)}
                                    onClick={() => onRatingChange(skill.id, i + 1)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const StudentReportCardEditorModal = ({ student, allData, onClose, onDataUpdate }) => {
    const { subjects, scores, remarks, settings, behavioralRecords } = allData;
    const [currentScores, setCurrentScores] = useState({});
    // Fix: Explicitly type `currentRemark` state as `Partial<Remark>` to prevent errors when accessing its properties.
    const [currentRemark, setCurrentRemark] = useState<Partial<Remark>>({});
    const [generating, setGenerating] = useState({ subjectComment: null, generalComment: false });

    useEffect(() => {
        const studentScoresForTerm = scores.filter(s => s.studentId === student.id && s.session === settings.session && s.term === settings.term);
        const scoresMap = studentScoresForTerm.reduce((acc, s) => ({ ...acc, [s.subjectId]: s }), {});
        setCurrentScores(scoresMap);
        
        const remarkForTerm = remarks.find(r => r.studentId === student.id && r.session === settings.session && r.term === settings.term) || {};
        setCurrentRemark(remarkForTerm);
    }, [student, scores, remarks, settings]);
    
    const debouncedSaveScore = useCallback(debounce((scoreData) => apiUpsertScore(scoreData), 500), []);
    const debouncedSaveRemark = useCallback(debounce((remarkData) => apiUpsertRemark(remarkData), 500), []);
    
    const handleScoreChange = (subjectId, field, value) => {
        const updatedScores = { ...currentScores };
        if (!updatedScores[subjectId]) {
            updatedScores[subjectId] = { studentId: student.id, subjectId, session: settings.session, term: settings.term };
        }
        updatedScores[subjectId][field] = value;
        setCurrentScores(updatedScores);
        debouncedSaveScore(updatedScores[subjectId]);
    };
    
    const handleRemarkDataChange = (field, value) => {
        const updatedRemark = { ...currentRemark, [field]: value };
        setCurrentRemark(updatedRemark);
        debouncedSaveRemark({
            studentId: student.id,
            session: settings.session,
            term: settings.term,
            ...updatedRemark
        });
    };

    const handleGenerateSubjectComment = async (subjectId) => {
        // AI generation logic for subject comment
    };
    
    const handleGenerateGeneralComment = async () => {
        // AI generation logic for general comment
    };

    const subjectsForClass = subjects.filter(s => s.classes.includes(student.class));

    return (
        <Modal isOpen={true} onClose={onClose} title={`Report Card Data: ${student.name}`} size="full">
            <div className="p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                {/* Academic Section */}
                <div className="card">
                    <div className="p-4">
                        <h3 className="text-lg font-semibold">Academic Performance</h3>
                        <div className="table-container mt-2">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="th">Subject</th>
                                        <th className="th text-center">CA 1 ({settings.maxCa1})</th>
                                        <th className="th text-center">CA 2 ({settings.maxCa2})</th>
                                        <th className="th text-center">Exam ({settings.maxExam})</th>
                                        <th className="th w-1/3">Subject Comment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjectsForClass.map(subject => {
                                        const score = currentScores[subject.id] || {};
                                        return (
                                            <tr key={subject.id}>
                                                <td className="td font-medium">{subject.name}</td>
                                                <td className="td"><input type="number" className="input-field p-1 text-sm text-center" value={score.ca1 ?? ''} onChange={e => handleScoreChange(subject.id, 'ca1', e.target.valueAsNumber)} /></td>
                                                <td className="td"><input type="number" className="input-field p-1 text-sm text-center" value={score.ca2 ?? ''} onChange={e => handleScoreChange(subject.id, 'ca2', e.target.valueAsNumber)} /></td>
                                                <td className="td"><input type="number" className="input-field p-1 text-sm text-center" value={score.exam ?? ''} onChange={e => handleScoreChange(subject.id, 'exam', e.target.valueAsNumber)} /></td>
                                                <td className="td"><input type="text" className="input-field p-1 text-sm" value={score.comment ?? ''} onChange={e => handleScoreChange(subject.id, 'comment', e.target.value)} /></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                {/* Skills & Comments Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card p-4 space-y-4">
                        <EditableSkillsRating 
                            title="Affective Skills"
                            skills={settings.reportCardSettings.affectiveSkills}
                            ratings={currentRemark.affectiveRatings || {}}
                            onRatingChange={(skillId, rating) => {
                                const newRatings = {...(currentRemark.affectiveRatings || {}), [skillId]: rating};
                                handleRemarkDataChange('affectiveRatings', newRatings);
                            }}
                        />
                         <EditableSkillsRating 
                            title="Psychomotor Skills"
                            skills={settings.reportCardSettings.psychomotorSkills}
                            ratings={currentRemark.psychomotorRatings || {}}
                            onRatingChange={(skillId, rating) => {
                                const newRatings = {...(currentRemark.psychomotorRatings || {}), [skillId]: rating};
                                handleRemarkDataChange('psychomotorRatings', newRatings);
                            }}
                        />
                    </div>
                     <div className="card p-4 flex flex-col">
                        <h3 className="text-lg font-semibold">General Comment</h3>
                        <textarea
                            className="input-field flex-grow mt-2"
                            value={currentRemark.generalComment || ''}
                            onChange={e => handleRemarkDataChange('generalComment', e.target.value)}
                            rows={8}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    )
};


const ComprehensiveReportEntry = () => {
    const [allData, setAllData] = useState({
        students: [], subjects: [], scores: [], remarks: [], behavioralRecords: [], settings: null,
    });
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingStudent, setEditingStudent] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [students, subjects, scores, remarks, behavioralRecords, settings] = await Promise.all([
                apiGetStudents(), apiGetSubjects(), apiGetScores(), getTenantData('remarks') || [], apiGetBehavioralRecords(), apiGetSchoolSettings()
            ]);
            setAllData({ students, subjects, scores, remarks, behavioralRecords, settings });
            const allClasses = [...new Set<string>(subjects.flatMap(s => s.classes))].sort();
            setClasses(allClasses);
            if (allClasses.length > 0) setSelectedClass(allClasses[0]);
        } catch(e) { console.error("Failed to load comprehensive data", e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const studentsInClass = useMemo(() => {
        return allData.students.filter(s => s.class === selectedClass);
    }, [selectedClass, allData.students]);

    if (loading) return <div className="card p-6 text-center">Loading Data...</div>

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Dossier</h2>
                <div className="my-6">
                    <label className="label">Select Class</label>
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-field max-w-sm">
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th">Student Name</th>
                                <th className="th">Admission No.</th>
                                <th className="th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentsInClass.map(student => (
                                <tr key={student.id}>
                                    <td className="td font-medium">{student.name}</td>
                                    <td className="td">{student.admissionNo}</td>
                                    <td className="td text-right">
                                        <button onClick={() => setEditingStudent(student)} className="btn btn-secondary text-sm">
                                            <EditIcon className="w-4 h-4 mr-2" />
                                            Edit Report Data
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {editingStudent && (
                <StudentReportCardEditorModal
                    student={editingStudent}
                    allData={allData}
                    onClose={() => setEditingStudent(null)}
                    onDataUpdate={fetchData} // A way to refresh data if needed
                />
            )}
        </div>
    );
};

export default ComprehensiveReportEntry;