import React, { useState, useEffect, useMemo } from 'react';
import { apiGetBehavioralRecords, apiUpsertBehavioralRecord, apiDeleteBehavioralRecord, apiGetStudents } from '../services/api';
import { BehavioralLogEntry, Student } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import { formatDate } from '../utils/dateHelpers';
import { useTenant } from '../contexts/TenantContext';
import { generateClassNames } from '../utils/classManager';

const BehavioralRemarks = () => {
    const [remarks, setRemarks] = useState<BehavioralLogEntry[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [remarkToDelete, setRemarkToDelete] = useState<BehavioralLogEntry | null>(null);
    const { settings } = useTenant();
    const classNames = useMemo(() => generateClassNames(settings), [settings]);
    const [classFilter, setClassFilter] = useState('');

    useEffect(() => {
        if(classNames.length > 0 && !classFilter) {
            setClassFilter(classNames[0]);
        }
    }, [classNames, classFilter]);

    const fetchData = async () => {
        setLoading(true);
        const [remarksData, studentsData] = await Promise.all([
            apiGetBehavioralRecords(),
            apiGetStudents()
        ]);
        setRemarks(remarksData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setStudents(studentsData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const handleSave = async (data: Partial<BehavioralLogEntry>) => {
        await apiUpsertBehavioralRecord(data);
        fetchData();
        setModalOpen(false);
    };
    
    const handleDelete = async () => {
        if (!remarkToDelete) return;
        await apiDeleteBehavioralRecord(remarkToDelete.id);
        fetchData();
        setDeleteModalOpen(false);
    };

    const studentsInClass = useMemo(() => students.filter(s => s.class === classFilter), [students, classFilter]);
    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    const remarksForClass = useMemo(() => remarks.filter(r => studentMap.get(r.studentId)?.class === classFilter), [remarks, studentMap, classFilter]);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input-field max-w-xs">
                    {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={() => setModalOpen(true)} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> New Remark</button>
            </div>
            <div className="card p-6">
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th className="th">Student</th><th className="th">Date</th><th className="th">Remark</th><th className="th text-right">Actions</th></tr></thead>
                        <tbody>
                            {remarksForClass.map(remark => (
                                <tr key={remark.id}>
                                    <td className="td font-medium">{studentMap.get(remark.studentId)?.name}</td>
                                    <td className="td">{formatDate(remark.date)}</td>
                                    <td className="td">{remark.remark}</td>
                                    <td className="td text-right">
                                        <button onClick={() => { setRemarkToDelete(remark); setDeleteModalOpen(true); }} className="icon-button text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <RemarkFormModal onSave={handleSave} onClose={() => setModalOpen(false)} students={studentsInClass} />}
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete} title="Delete Remark" message="Are you sure you want to delete this behavioral remark?" />
        </div>
    );
};

const RemarkFormModal = ({ onSave, onClose, students }) => {
    const [formData, setFormData] = useState({ studentId: students[0]?.id || '', date: new Date().toISOString().split('T')[0], remark: '', type: 'neutral' as const });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <Modal isOpen={true} onClose={onClose} title="Add Behavioral Remark">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label">Student</label><select name="studentId" value={formData.studentId} onChange={handleChange} className="input-field" required>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="label">Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Remark</label><textarea name="remark" value={formData.remark} onChange={handleChange} className="input-field" rows={3} required></textarea></div>
                <div><label className="label">Type</label><select name="type" value={formData.type} onChange={handleChange} className="input-field"><option value="neutral">Neutral</option><option value="positive">Positive</option><option value="negative">Negative</option></select></div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save Remark</button></div>
            </form>
        </Modal>
    );
};


export default BehavioralRemarks;