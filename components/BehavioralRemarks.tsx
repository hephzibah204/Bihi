import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetSubjects, apiGetBehavioralRecords, apiUpsertBehavioralRecord } from '../services/api';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import { Student, Subject, BehavioralLogEntry } from '../types';
import { formatDate } from '../utils/dateHelpers';

const BehavioralRemarks = () => {
    const [allRecords, setAllRecords] = useState<BehavioralLogEntry[]>([]);
    const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
    const [studentMap, setStudentMap] = useState<Record<string, Student>>({});
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [newRecord, setNewRecord] = useState({ studentId: '', type: 'positive', remark: '' });

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [subjectsData, studentsData]: [Subject[], Student[]] = await Promise.all([
                apiGetSubjects(),
                apiGetStudents(),
            ]);

            const sMap = studentsData.reduce((acc, student) => {
                acc[student.id] = student;
                return acc;
            }, {});
            setStudentMap(sMap);

            const allClasses = [...new Set(subjectsData.flatMap(s => s.classes))].sort();
            setClasses(allClasses);
            if (allClasses.length > 0 && !selectedClass) {
                setSelectedClass(allClasses[0]);
            }
        } catch (error) {
            console.error("Failed to load initial behavioral data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchClassData = async () => {
        if (!selectedClass) return;
        setLoading(true);
        try {
            const [students, records] = await Promise.all([
                apiGetStudents({ classFilter: selectedClass }),
                apiGetBehavioralRecords({ classFilter: selectedClass })
            ]);
            setStudentsInClass(students);
            setAllRecords(records);
        } catch (error) {
            console.error("Failed to load class-specific data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassData();
    }, [selectedClass]);

    const handleAddRecord = async () => {
        if (!newRecord.studentId || !newRecord.remark) return;
        const recordToAdd = {
            ...newRecord,
            teacherId: '', // In a real app, get from session
            date: new Date().toISOString(),
        } as Partial<BehavioralLogEntry>;
        
        apiUpsertBehavioralRecord(recordToAdd);
        
        // Optimistic update
        setAllRecords(prev => [...prev, { ...recordToAdd, id: `bhv_${Date.now()}` } as BehavioralLogEntry]);
        
        setModalOpen(false);
        setNewRecord({ studentId: '', type: 'positive', remark: '' });
    };

    const getStudentName = (studentId) => studentMap[studentId]?.name || 'Unknown Student';

    const recordsForView = allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div></div>
                <div className="flex items-center gap-4">
                     <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={() => setModalOpen(true)} className="btn btn-primary">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add Remark
                    </button>
                </div>
            </div>
            
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Student</th>
                            <th className="th">Remark</th>
                            <th className="th">Type</th>
                            <th className="th">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y">
                        {loading ? (
                            <tr><td colSpan={4} className="td text-center">Loading records...</td></tr>
                        ) : recordsForView.length === 0 ? (
                             <tr><td colSpan={4} className="td text-center">No records for this class.</td></tr>
                        ) : (
                            recordsForView.map(rec => (
                                <tr key={rec.id}>
                                    <td className="td font-medium"><div className="truncate max-w-xs" title={getStudentName(rec.studentId)}>{getStudentName(rec.studentId)}</div></td>
                                    <td className="td"><div className="truncate max-w-sm" title={rec.remark}>{rec.remark}</div></td>
                                    <td className="td">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rec.type === 'positive' ? 'bg-green-100 text-green-800' : rec.type === 'negative' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {rec.type}
                                        </span>
                                    </td>
                                    <td className="td">{formatDate(rec.date)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add Behavioral Remark">
                <div className="p-6 space-y-4">
                     <p className="text-sm">Adding remark for class: <strong>{selectedClass}</strong></p>
                    <div>
                        <label className="label">Student</label>
                        <select className="input-field" value={newRecord.studentId} onChange={e => setNewRecord({...newRecord, studentId: e.target.value})}>
                            <option value="">-- Select Student --</option>
                            {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Remark Type</label>
                        <select className="input-field" value={newRecord.type} onChange={e => setNewRecord({...newRecord, type: e.target.value})}>
                            <option value="positive">Positive</option>
                            <option value="negative">Negative</option>
                            <option value="neutral">Neutral</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Remark</label>
                        <textarea className="input-field" rows={3} value={newRecord.remark} onChange={e => setNewRecord({...newRecord, remark: e.target.value})}></textarea>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button onClick={handleAddRecord} className="btn btn-primary">Save Remark</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BehavioralRemarks;
