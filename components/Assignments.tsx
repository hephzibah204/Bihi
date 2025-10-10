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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [asgData, subData, scoreData] = await Promise.all([apiGetAssignments(), apiGetSubjects(), apiGetAssignmentScores()]);
            setAssignments(asgData);
            setSubjects(subData);
            setScores(scoreData);
            // Fix: Specify the generic type for `new Set` as `<string>` to ensure `allClasses` is correctly typed as `string[]`.
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
                        <button onClick={() => { setEditingAssignment(assignment); setModalOpen(true); }} className="text-indigo-600 text-sm mt-2">Edit</button>
                    </div>
                ))}
            </div>

            {isModalOpen && <AssignmentFormModal assignment={editingAssignment} subjects={subjects.filter(s => s.classes.includes(selectedClass))} selectedClass={selectedClass} onSave={handleSave} onClose={() => setModalOpen(false)} />}
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
