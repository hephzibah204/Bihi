import React, { useState, useEffect, useMemo } from 'react';
import { apiGetStudents, apiGetSubjects, apiBatchUpdateStudents } from '../services/api';
import { Student, Subject } from '../types';
import GraduationCapIcon from './icons/GraduationCapIcon';

const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const Promotions = () => {
    const [studentsInFromClass, setStudentsInFromClass] = useState<Student[]>([]);
    const [allClasses, setAllClasses] = useState<string[]>([]);
    const [fromClass, setFromClass] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem('reportsheet_promotions_filters') || '{}').fromClass || '' } catch { return '' }
    });
    const [toClass, setToClass] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem('reportsheet_promotions_filters') || '{}').toClass || '' } catch { return '' }
    });
    const [loading, setLoading] = useState(true);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

    useEffect(() => {
        try {
            sessionStorage.setItem('reportsheet_promotions_filters', JSON.stringify({ fromClass, toClass }));
        } catch (e) {
            console.error("Failed to save promotions filters", e);
        }
    }, [fromClass, toClass]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const subjectsData = await apiGetSubjects();
                const allClasses = [...new Set(subjectsData.flatMap(s => s.classes))].sort();
                setAllClasses(allClasses);
                if (allClasses.length > 0) {
                    if (!fromClass) {
                        setFromClass(allClasses[0]);
                    }
                    if (!toClass) {
                        setToClass(allClasses[1] || '');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch subjects for promotions:", error);
            }
            setLoading(false);
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!fromClass) return;

        const fetchStudentsForClass = async () => {
            setLoading(true);
            try {
                const students = await apiGetStudents({ classFilter: fromClass });
                setStudentsInFromClass(students.filter(s => s.status !== 'alumni'));
                setSelectedStudents(new Set());
            } catch (error) {
                console.error(`Failed to fetch students for class ${fromClass}:`, error);
            }
            setLoading(false);
        };
        fetchStudentsForClass();
    }, [fromClass]);

    const handleSelectStudent = (studentId: string) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            newSet.has(studentId) ? newSet.delete(studentId) : newSet.add(studentId);
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedStudents(e.target.checked ? new Set(studentsInFromClass.map(s => s.id)) : new Set());
    };

    const handlePromote = async () => {
        if (selectedStudents.size === 0 || !toClass || fromClass === toClass) return;
        
        // FIX: Explicitly typed the 'id' parameter as string to resolve an 'unknown' type inference error.
        const studentsToUpdate: Partial<Student>[] = Array.from(selectedStudents).map((id: string) => ({ id, class: toClass }));
        await apiBatchUpdateStudents(studentsToUpdate);
        
        // Refresh UI
        setStudentsInFromClass(prev => prev.filter(s => !selectedStudents.has(s.id)));
        setSelectedStudents(new Set());
        alert(`${selectedStudents.size} students promoted to ${toClass}!`);
    };
    
    const handleGraduate = async () => {
         if (selectedStudents.size === 0) return;
         
        // FIX: Explicitly typed the 'id' parameter as string to resolve an 'unknown' type inference error.
        const studentsToUpdate: Partial<Student>[] = Array.from(selectedStudents).map((id: string) => ({ id, status: 'alumni', graduationYear: new Date().getFullYear() }));
        await apiBatchUpdateStudents(studentsToUpdate);
        
        // Refresh UI
        setStudentsInFromClass(prev => prev.filter(s => !selectedStudents.has(s.id)));
        setSelectedStudents(new Set());
        alert(`${selectedStudents.size} students have been moved to Alumni!`);
    };

    if (loading && studentsInFromClass.length === 0) return <div className="card p-6 text-center">Loading...</div>;

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Student Promotions</h2>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-2">
                        <label className="label">From Class</label>
                        <select className="input-field" value={fromClass} onChange={e => setFromClass(e.target.value)}>
                            {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center justify-center pt-6">
                         <ArrowRightIcon className="h-6 w-6 text-gray-400"/>
                    </div>
                    <div className="lg:col-span-2">
                        <label className="label">To Class</label>
                        <select className="input-field" value={toClass} onChange={e => setToClass(e.target.value)}>
                            <option value="">-- Select Destination --</option>
                            {allClasses.filter(c => c !== fromClass).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="table-container mt-6">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedStudents.size === studentsInFromClass.length && studentsInFromClass.length > 0} /></th>
                                <th className="th">Student Name</th>
                                <th className="th">Admission No.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={3} className="td text-center">Loading students...</td></tr>
                            ) : studentsInFromClass.length > 0 ? (
                                studentsInFromClass.map(student => (
                                    <tr key={student.id}>
                                        <td className="td"><input type="checkbox" checked={selectedStudents.has(student.id)} onChange={() => handleSelectStudent(student.id)} /></td>
                                        <td className="td"><div className="truncate max-w-sm" title={student.name}>{student.name}</div></td>
                                        <td className="td">{student.admissionNo}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={3} className="td text-center">No students to promote in this class.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                     <button onClick={handleGraduate} disabled={selectedStudents.size === 0} className="btn btn-secondary">
                        <GraduationCapIcon className="w-5 h-5 mr-2" />
                        Graduate Selected ({selectedStudents.size})
                    </button>
                    <button onClick={handlePromote} disabled={selectedStudents.size === 0 || !toClass || fromClass === toClass} className="btn btn-primary">
                        Promote Selected ({selectedStudents.size})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Promotions;