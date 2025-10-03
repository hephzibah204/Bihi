import React, { useState, useEffect, useMemo } from 'react';
import { apiGetStudents, apiGetSubjects, updateStudents } from '../services/api';
import { Student, Subject } from '../types';
import GraduationCapIcon from './icons/GraduationCapIcon';

const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const Promotions = () => {
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
    const [fromClass, setFromClass] = useState('');
    const [toClass, setToClass] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [studentsData, subjectsData] = await Promise.all([apiGetStudents(), apiGetSubjects()]);
                setAllStudents(studentsData);
                setAllSubjects(subjectsData);
                const allClasses = [...new Set(subjectsData.flatMap(s => s.classes))].sort();
                if (allClasses.length > 0) {
                    setFromClass(allClasses[0]);
                    setToClass(allClasses[1] || '');
                }
            } catch (error) {
                console.error("Failed to fetch data for promotions:", error);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const studentsInFromClass = useMemo(() => {
        return allStudents.filter(s => s.class === fromClass && s.status !== 'alumni');
    }, [allStudents, fromClass]);

    const allClasses = useMemo(() => [...new Set(allSubjects.flatMap(s => s.classes))].sort(), [allSubjects]);

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
        if (selectedStudents.size === 0 || !toClass || fromClass === toClass) return;

        await updateStudents(currentStudents =>
            currentStudents.map(student =>
                selectedStudents.has(student.id) ? { ...student, class: toClass } : student
            )
        );

        const updatedStudents = allStudents.map(student =>
            selectedStudents.has(student.id) ? { ...student, class: toClass } : student
        );
        setAllStudents(updatedStudents);
        setSelectedStudents(new Set());
        alert(`${selectedStudents.size} students promoted to ${toClass}!`);
    };
    
    const handleGraduate = async () => {
         if (selectedStudents.size === 0) return;
         
        await updateStudents(currentStudents =>
            currentStudents.map((student): Student =>
                selectedStudents.has(student.id) ? { ...student, status: 'alumni', graduationYear: new Date().getFullYear() } : student
            )
        );
        
        // Fix: Explicitly type the return value of the map function as Student to prevent TypeScript
        // from incorrectly widening the 'status' property to a generic string.
        const updatedStudents = allStudents.map((student): Student =>
            selectedStudents.has(student.id) ? { ...student, status: 'alumni', graduationYear: new Date().getFullYear() } : student
        );
        setAllStudents(updatedStudents);
        setSelectedStudents(new Set());
        alert(`${selectedStudents.size} students have been moved to Alumni!`);
    };

    if (loading) return <div className="card p-6 text-center">Loading...</div>;

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
                            {studentsInFromClass.map(student => (
                                <tr key={student.id}>
                                    <td className="td"><input type="checkbox" checked={selectedStudents.has(student.id)} onChange={() => handleSelectStudent(student.id)} /></td>
                                    <td className="td">{student.name}</td>
                                    <td className="td">{student.admissionNo}</td>
                                </tr>
                            ))}
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