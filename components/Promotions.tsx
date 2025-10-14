import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { apiGetStudents, apiBatchUpdateStudents } from '../services/api';
import { useTenant } from '../contexts/TenantContext';
import { generateClassNames } from '../utils/classManager';
import AnimatedCheckbox from './AnimatedCheckbox';
import TableSkeleton from './skeletons/TableSkeleton';
import EmptyState from './EmptyState';

const Promotions = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const { settings } = useTenant();
    const classNames = useMemo(() => generateClassNames(settings), [settings]);
    const [fromClass, setFromClass] = useState('');
    const [toClass, setToClass] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    
    const studentsInFromClass = useMemo(() => {
        return students.filter(s => s.class === fromClass);
    }, [students, fromClass]);
    
    React.useEffect(() => {
        if (classNames.length > 1) {
            setFromClass(classNames[0]);
            setToClass(classNames[1]);
        }
    }, [classNames]);

    React.useEffect(() => {
        setFetching(true);
        apiGetStudents().then(data => {
            setStudents(data);
            setFetching(false);
        });
    }, []);
    
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
            setSelectedStudents(new Set(studentsInFromClass.map(s => s.id)));
        } else {
            setSelectedStudents(new Set());
        }
    };

    const handlePromote = async () => {
        if (selectedStudents.size === 0) {
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: "Please select students to promote." } }));
            return;
        }
        if (!toClass) {
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: "Please select a destination class." } }));
            return;
        }
        if (fromClass === toClass) {
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: "Source and destination classes cannot be the same." } }));
            return;
        }

        setLoading(true);
        try {
            const studentsToUpdate = students
                .filter(s => selectedStudents.has(s.id))
                .map(s => ({ ...s, class: toClass }));
            
            await apiBatchUpdateStudents(studentsToUpdate);
            
            const allStudents = await apiGetStudents();
            setStudents(allStudents);
            
            setSelectedStudents(new Set());
            window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: `${studentsToUpdate.length} students promoted successfully!` } }));

        } catch (error) {
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: "An error occurred during promotion." } }));
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (fetching) return <TableSkeleton hasCheckbox />;

        if (studentsInFromClass.length === 0) {
            return <div className="mt-6"><EmptyState message={`No students found in ${fromClass}.`} /></div>;
        }

        return (
             <div className="table-container mt-6">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th w-12"><AnimatedCheckbox onChange={handleSelectAll} checked={selectedStudents.size === studentsInFromClass.length && studentsInFromClass.length > 0} /></th>
                            <th className="th">Name</th>
                            <th className="th">Admission No.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsInFromClass.map(student => (
                            <tr key={student.id}>
                                <td className="td"><AnimatedCheckbox checked={selectedStudents.has(student.id)} onChange={_ => handleSelectStudent(student.id)} /></td>
                                <td className="td font-medium">{student.name}</td>
                                <td className="td">{student.admissionNo}</td>
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
                <h2 className="text-xl font-semibold">Student Promotions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-end">
                    <div>
                        <label className="label">Promote from</label>
                        <select value={fromClass} onChange={e => setFromClass(e.target.value)} className="input-field">
                            {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Promote to</label>
                         <select value={toClass} onChange={e => setToClass(e.target.value)} className="input-field">
                            {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <button onClick={handlePromote} className="btn btn-primary" disabled={loading || selectedStudents.size === 0}>
                        Promote Selected ({selectedStudents.size})
                    </button>
                </div>
                
                {renderContent()}
            </div>
        </div>
    );
};

export default Promotions;