import React, { useState, useEffect, useMemo } from 'react';
import { apiGetAssignments, apiSaveAssignments, apiGetSubjects, apiGetStudents, apiGetAssignmentScores, apiSaveAssignmentScores } from '../services/api';
import { Assignment, Subject, Student, AssignmentScore } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import { formatDate } from '../utils/dateHelpers';

const Assignments = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [scores, setScores] = useState<AssignmentScore[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Partial<Assignment> | null>(null);
    const [isScoreModalOpen, setScoreModalOpen] = useState(false);
    const [scoringAssignment, setScoringAssignment] = useState<Assignment | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [asgData, subData, scoreData] = await Promise.all([apiGetAssignments(), apiGetSubjects(), apiGetAssignmentScores()]);
            setAssignments(asgData);
            setSubjects(subData);
            setScores(scoreData);
            const allClasses = [...new Set<string>(subData.flatMap(s => s.classes))].sort();
            setClasses(allClasses);
            if (allClasses.length > 0) {
                setSelectedClass(allClasses[0]);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredAssignments = useMemo(() => {
        return assignments.filter(a => a.class === selectedClass);
    }, [assignments, selectedClass]);

    const handleSave = async (assignmentData: Partial<Assignment>) => {
        let updated;
        if (editingAssignment?.id) {
            updated = assignments.map(a => a.id === editingAssignment.id ? { ...a, ...assignmentData } : a);
        } else {
            updated = [...assignments, { ...assignmentData, id: `asg_${Date.now()}` }];
        }
        await apiSaveAssignments(updated as Assignment[]);
        setAssignments(updated as Assignment[]);
        setModalOpen(false);
        setEditingAssignment(null);
    };

    if (loading) return <div>Loading assignments...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-field max-w-xs">
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={() => { setEditingAssignment(null); setModalOpen(true); }} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2"/> Add Assignment</button>
            </div>
            
            <div className="space-y-4">
                {filteredAssignments.map(assignment => (
                    <div key={assignment.id} className="card p-4">
                        <h3 className="font-bold">{assignment.title}</h3>
                        <p className="text-sm text-gray-500">{subjects.find(s=>s.id === assignment.subjectId)?.name}</p>
                        <p className="text-sm mt-2">{assignment.description}</p>
                        <div className="text-xs mt-2">Due: {formatDate(assignment.dueDate)}</div>
                        <div className="flex gap-3 mt-2">
                            <button onClick={() => { setEditingAssignment(assignment); setModalOpen(true); }} className="text-indigo-600 text-sm">Edit</button>
                            <button onClick={() => { setScoringAssignment(assignment); setScoreModalOpen(true); }} className="text-indigo-600 text-sm">Record Scores</button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && <AssignmentFormModal assignment={editingAssignment} subjects={subjects.filter(s => s.classes.includes(selectedClass))} selectedClass={selectedClass} onSave={handleSave} onClose={() => setModalOpen(false)} />}
            {isScoreModalOpen && scoringAssignment && (
                <RecordScoresModal
                    assignment={scoringAssignment}
                    selectedClass={selectedClass}
                    onClose={() => { setScoreModalOpen(false); setScoringAssignment(null); }}
                />
            )}
        </div>
    );
};

const AssignmentFormModal = ({ assignment, subjects, selectedClass, onSave, onClose }) => {
    const [formData, setFormData] = useState({ class: selectedClass, title: '', description: '', subjectId: '', dueDate: '', maxScore: 10, ...assignment });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={assignment ? 'Edit Assignment' : 'Add Assignment'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label">Title</label><input name="title" value={formData.title} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Subject</label><select name="subjectId" value={formData.subjectId} onChange={handleChange} className="input-field" required><option value="">-- Select --</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="label">Description</label><textarea name="description" value={formData.description} onChange={handleChange} className="input-field" rows={3}></textarea></div>
                <div><label className="label">Due Date</label><input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Max Score</label><input type="number" name="maxScore" value={formData.maxScore} onChange={handleChange} className="input-field" required /></div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save Assignment</button></div>
            </form>
        </Modal>
    );
};


export default Assignments;

const RecordScoresModal = ({ assignment, selectedClass, onClose }: { assignment: Assignment; selectedClass: string; onClose: () => void }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [scores, setScores] = useState<Record<string, { score: number; comment?: string }>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            const studs = await apiGetStudents({ classFilter: selectedClass });
            setStudents(studs);
            const allExisting = await apiGetAssignmentScores();
            const existingForThis = allExisting.filter(s => s.assignmentId === assignment.id);
            const initial: Record<string, { score: number; comment?: string }> = {};
            existingForThis.forEach(s => { initial[s.studentId] = { score: s.score, comment: s.comment }; });
            setScores(initial);
        };
        load();
    }, [assignment.id, selectedClass]);

    const setScore = (studentId: string, value: number) => {
        setScores(prev => ({ ...prev, [studentId]: { ...prev[studentId], score: value } }));
    };

    const setComment = (studentId: string, value: string) => {
        setScores(prev => ({ ...prev, [studentId]: { ...prev[studentId], comment: value } }));
    };

    const saveScores = async () => {
        setSaving(true);
        try {
            const entries: AssignmentScore[] = students.map(s => ({
                id: `asgscore_${assignment.id}_${s.id}`,
                assignmentId: assignment.id,
                studentId: s.id,
                score: Math.max(0, Math.min(Number(scores[s.id]?.score || 0), Number(assignment.maxScore || 10))),
                comment: scores[s.id]?.comment || '',
            }));
            await apiSaveAssignmentScores(entries);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Record Scores: ${assignment.title}`} size="lg">
            <div className="p-6">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th">Student</th>
                                <th className="th text-right">Score (/{assignment.maxScore})</th>
                                <th className="th">Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(st => (
                                <tr key={st.id}>
                                    <td className="td font-medium">{st.name}</td>
                                    <td className="td text-right">
                                        <input type="number" className="input-field w-24 text-right" min={0} max={Number(assignment.maxScore || 10)}
                                            value={scores[st.id]?.score ?? ''}
                                            onChange={e => setScore(st.id, e.target.valueAsNumber)} />
                                    </td>
                                    <td className="td">
                                        <input type="text" className="input-field" placeholder="Optional"
                                            value={scores[st.id]?.comment ?? ''}
                                            onChange={e => setComment(st.id, e.target.value)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={saveScores} disabled={saving}>{saving ? 'Saving...' : 'Save Scores'}</button>
                </div>
            </div>
        </Modal>
    );
};