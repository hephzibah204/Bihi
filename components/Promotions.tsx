

import React, { useState, useEffect, useRef } from 'react';
import { apiGetStudentsForClasses, apiGetSubjects, updateStudents, apiGetStudents } from '../services/api';
// Fix: Import Subject type to correctly type data from API calls.
import { Student, Subject } from '../types';

const PAGE_SIZE = 50;

const Promotions = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [fromClass, setFromClass] = useState('');
    const [toClass, setToClass] = useState('');
    const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [notification, setNotification] = useState('');

    // State for virtualization/infinite scroll
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loaderRef = useRef(null);

    // Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const first = entries[0];
            if (first.isIntersecting) {
                setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, studentsInClass.length));
            }
        }, { threshold: 1 });

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [loaderRef, studentsInClass.length]);

    const visibleStudents = studentsInClass.slice(0, visibleCount);

    const fetchClasses = async () => {
        // Fix: Explicitly type allSubjects to ensure allClasses is inferred as string[].
        const allSubjects: Subject[] = await apiGetSubjects();
        const allClasses = [...new Set(allSubjects.flatMap(s => s.classes))].sort();
        setClasses(allClasses);
        if (allClasses.length > 1) {
            if (!fromClass) setFromClass(allClasses[0]);
            if (!toClass) setToClass(allClasses[1]);
        }
    };
    
    const fetchStudents = async () => {
        if (!fromClass) {
            setStudentsInClass([]);
            return;
        }
        setLoading(true);
        const students = await apiGetStudentsForClasses([fromClass]);
        setStudentsInClass(students.filter(s => s.status !== 'alumni'));
        setLoading(false);
    };

    useEffect(() => {
        fetchClasses();
        // Initial fetchStudents is triggered by fromClass change
    }, []);

    useEffect(() => {
        fetchStudents();
        setVisibleCount(PAGE_SIZE); // Reset count when class changes
    }, [fromClass]);

    useEffect(() => {
        const handleStorageUpdate = (event: Event) => {
            const customEvent = event as CustomEvent;
            const key = customEvent.detail?.key;
            if (key === 'subjects') {
                fetchClasses();
            } else if (key === 'students') {
                fetchStudents();
            }
        };
        window.addEventListener('storage-update', handleStorageUpdate);
        return () => window.removeEventListener('storage-update', handleStorageUpdate);
    }, [fromClass]);
    
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

    const handleSelectAll = () => {
        if (selectedStudents.size === studentsInClass.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(studentsInClass.map(s => s.id)));
        }
    };
    
    const handlePromote = async () => {
        if (selectedStudents.size === 0) {
            alert('Please select students to promote.');
            return;
        }
        
        setPromoting(true);
        setNotification('');

        const lastClass = classes[classes.length - 1];
        const isGraduating = fromClass === lastClass;
        
        if (isGraduating) {
            if (!window.confirm(`You are about to graduate ${selectedStudents.size} student(s) from the final class. This will mark them as alumni. Continue?`)) {
                setPromoting(false);
                return;
            }
        } else {
            if (fromClass === toClass) {
                alert('Cannot promote students to the same class.');
                setPromoting(false);
                return;
            }
        }


        try {
            await updateStudents(allStudents => {
                return allStudents.map(student => {
                    if (selectedStudents.has(student.id)) {
                        if (isGraduating) {
                            return { 
                                ...student, 
                                status: 'alumni', 
                                graduationYear: new Date().getFullYear(),
                                class: `Graduated (${new Date().getFullYear()})`
                            };
                        } else {
                            return { ...student, class: toClass };
                        }
                    }
                    return student;
                });
            });

            // Optimistic UI update
            setStudentsInClass(prevStudents => prevStudents.filter(s => !selectedStudents.has(s.id)));
            setSelectedStudents(new Set());

            const successMessage = isGraduating
                ? `${selectedStudents.size} student(s) graduated successfully!`
                : `${selectedStudents.size} student(s) promoted successfully to ${toClass}!`;

            setNotification(successMessage);
            setTimeout(() => setNotification(''), 5000);

        } catch (error) {
            console.error("Operation failed:", error);
            alert("An error occurred during the operation.");
        } finally {
            setPromoting(false);
        }
    };
    
    const isFinalClass = fromClass === classes[classes.length - 1];

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Student Promotions & Graduation</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Promote students to the next class or graduate them from the final class.</p>

            {notification && <div className="my-4 p-3 text-sm text-green-700 bg-green-100 rounded-lg">{notification}</div>}

            <div className="card mt-6">
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="label">Promote From</label>
                        <select className="input-field" value={fromClass} onChange={e => setFromClass(e.target.value)}>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Promote To</label>
                        <select className="input-field" value={toClass} onChange={e => setToClass(e.target.value)} disabled={isFinalClass}>
                             {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {isFinalClass && <p className="text-xs text-indigo-600 mt-1">Students in the final class will be graduated.</p>}
                    </div>
                    <button onClick={handlePromote} className="btn btn-primary" disabled={promoting}>
                        {promoting ? 'Processing...' : isFinalClass ? `Graduate ${selectedStudents.size} Student(s)` : `Promote ${selectedStudents.size} Student(s)`}
                    </button>
                </div>
            </div>

            <div className="table-container mt-6">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th w-12">
                                <input type="checkbox" className="rounded"
                                    checked={selectedStudents.size === studentsInClass.length && studentsInClass.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="th">Student Name</th>
                            <th className="th">Admission No.</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                        {loading ? (
                            // Fix: Changed colSpan from string to number.
                            <tr><td colSpan={3} className="td text-center">Loading students...</td></tr>
                        ) : studentsInClass.length === 0 ? (
                             // Fix: Changed colSpan from string to number.
                             <tr><td colSpan={3} className="td text-center">No students in this class.</td></tr>
                        ) : (
                            <>
                                {visibleStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="td">
                                            <input type="checkbox" className="rounded"
                                                checked={selectedStudents.has(student.id)}
                                                onChange={() => handleSelectStudent(student.id)}
                                            />
                                        </td>
                                        <td className="td font-medium">{student.name}</td>
                                        <td className="td">{student.admissionNo}</td>
                                    </tr>
                                ))}
                                {visibleCount < studentsInClass.length && (
                                    <tr ref={loaderRef}>
                                        <td colSpan={3} className="text-center p-4 text-gray-500">
                                            Loading more...
                                        </td>
                                    </tr>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Promotions;