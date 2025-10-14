import React, { useState, useEffect, useMemo } from 'react';
import { apiGetAttendance, apiSaveAttendance, apiGetStudents } from '../services/api';
import { AttendanceRecord, Student } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { useTenant } from '../contexts/TenantContext';
import { generateClassNames } from '../utils/classManager';
import TableSkeleton from './skeletons/TableSkeleton';
import EmptyState from './EmptyState';

const Attendance = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
    const [loading, setLoading] = useState(false);
    const { settings } = useTenant();
    const classNames = useMemo(() => generateClassNames(settings), [settings]);

    useEffect(() => {
        if(classNames.length > 0 && !selectedClass) {
            setSelectedClass(classNames[0]);
        }
    }, [classNames, selectedClass]);
    
    useEffect(() => {
        const fetchAttendanceData = async () => {
            if (!selectedClass || !date) return;
            setLoading(true);
            const allStudents = await apiGetStudents({ classFilter: selectedClass });
            setStudents(allStudents);
            
            const records = await apiGetAttendance();
            const recordForDay = records.find(r => r.date === date && r.class === selectedClass);

            if (recordForDay) {
                setAttendance(recordForDay.statuses);
            } else {
                // Default all to present
                const initialStatuses = allStudents.reduce((acc, student) => {
                    acc[student.id] = 'present';
                    return acc;
                }, {});
                setAttendance(initialStatuses);
            }
            setLoading(false);
        };
        fetchAttendanceData();
    }, [date, selectedClass]);

    const handleStatusChange = async (studentId: string, status: 'present' | 'absent' | 'late') => {
        const newAttendance = { ...attendance, [studentId]: status };
        setAttendance(newAttendance);
        
        const record: AttendanceRecord = {
            date,
            class: selectedClass,
            statuses: newAttendance,
        };
        await apiSaveAttendance(record);
    };

    const markAll = async (status: 'present' | 'absent' | 'late') => {
        const newAttendance = students.reduce((acc, student) => {
            acc[student.id] = status;
            return acc;
        }, {});
        setAttendance(newAttendance);
         const record: AttendanceRecord = {
            date,
            class: selectedClass,
            statuses: newAttendance,
        };
        await apiSaveAttendance(record);
    };
    
    const StatusButton = ({ studentId, currentStatus }: { studentId: string, currentStatus: string }) => (
        <div className="flex rounded-lg shadow-sm">
            <button onClick={() => handleStatusChange(studentId, 'present')} className={`px-3 py-1 text-sm rounded-l-md ${currentStatus === 'present' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>Present</button>
            <button onClick={() => handleStatusChange(studentId, 'late')} className={`px-3 py-1 text-sm border-y ${currentStatus === 'late' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}>Late</button>
            <button onClick={() => handleStatusChange(studentId, 'absent')} className={`px-3 py-1 text-sm rounded-r-md ${currentStatus === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>Absent</button>
        </div>
    );

    const renderContent = () => {
        if (loading) return <TableSkeleton cols={1} />;
        if (students.length === 0) {
            return <div className="mt-4"><EmptyState message={`No students found in ${selectedClass}.`} /></div>;
        }

        return (
             <div className="table-container">
                <table className="table">
                     <thead><tr><th className="th">Student Name</th><th className="th text-right">Status</th></tr></thead>
                     <tbody>
                        {students.map(student => (
                            <tr key={student.id}>
                                <td className="td font-medium">{student.name}</td>
                                <td className="td text-right"><StatusButton studentId={student.id} currentStatus={attendance[student.id]} /></td>
                            </tr>
                        ))}
                     </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex gap-4 w-full md:w-auto">
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field"/>
                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-field">
                            {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <div className="flex gap-2">
                        <button onClick={() => markAll('present')} className="btn btn-secondary">Mark All Present</button>
                        <button onClick={() => markAll('absent')} className="btn btn-secondary">Mark All Absent</button>
                    </div>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default Attendance;