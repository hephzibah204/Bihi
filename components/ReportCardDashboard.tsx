
import React, { useState, useEffect, useMemo } from 'react';
import { apiGetStudents, apiGetSubjects, apiGetSchoolSettings, apiGetScores, apiGetRemarks, apiGetAttendance } from '../services/api';
import { Student, Subject, SchoolSettings, Score, Remark } from '../types';
import BulkReportCardPrintView from './BulkReportCardPrintView';
import { getReportCardTemplate } from '../utils/reportCardHelper';
import SpinnerIcon from './icons/SpinnerIcon';
import PrinterIcon from './icons/PrinterIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';

const ReportCardDashboard = () => {
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [remarks, setRemarks] = useState<Remark[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

    const [loading, setLoading] = useState(true);
    const [exportAction, setExportAction] = useState<'print' | 'download' | null>(null);
    
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [studentData, subjectData, settingsData, scoreData, remarksData, attendanceData] = await Promise.all([
                    apiGetStudents(),
                    apiGetSubjects(),
                    apiGetSchoolSettings(),
                    apiGetScores(),
                    apiGetRemarks(),
                    apiGetAttendance()
                ]);

                setAllStudents(studentData);
                setSubjects(subjectData);
                setSettings(settingsData);
                setScores(scoreData);
                setRemarks(remarksData);
                setAttendance(attendanceData);

                const allClasses = [...new Set<string>(subjectData.flatMap(s => s.classes))].sort();
                setClasses(allClasses);
                if (allClasses.length > 0) {
                    setSelectedClass(allClasses[0]);
                }
            } catch (error) {
                console.error("Failed to load report card dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    useEffect(() => {
        const students = allStudents.filter(s => s.class === selectedClass);
        setStudentsInClass(students);
        setSelectedStudents(new Set(students.map(s => s.id))); // Select all by default
    }, [selectedClass, allStudents]);

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
            setSelectedStudents(new Set(studentsInClass.map(s => s.id)));
        } else {
            setSelectedStudents(new Set());
        }
    };

    if (loading) {
        return <div className="card p-6 text-center"><SpinnerIcon className="w-8 h-8 animate-spin mx-auto" /> Loading Report Card Data...</div>;
    }

    if (exportAction) {
        const allDataForPrint = { allStudents, scores, subjects, settings, remarks, attendance };
        return <BulkReportCardPrintView 
            studentIds={Array.from(selectedStudents)} 
            allData={allDataForPrint} 
            onClose={() => setExportAction(null)}
            action={exportAction}
        />;
    }

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Generate Report Cards</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="label">Select Class</label>
                        <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setExportAction('download')} disabled={selectedStudents.size === 0} className="btn btn-secondary w-full">
                            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                            Download ({selectedStudents.size})
                        </button>
                        <button onClick={() => setExportAction('print')} disabled={selectedStudents.size === 0} className="btn btn-primary w-full">
                            <PrinterIcon className="w-5 h-5 mr-2" />
                            Print ({selectedStudents.size})
                        </button>
                    </div>
                </div>

                <div className="table-container mt-6">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th w-12">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedStudents.size === studentsInClass.length && studentsInClass.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="th">Student Name</th>
                                <th className="th">Admission No.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentsInClass.map(student => (
                                <tr key={student.id}>
                                    <td className="td">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedStudents.has(student.id)}
                                            onChange={() => handleSelectStudent(student.id)}
                                        />
                                    </td>
                                    <td className="td font-medium">{student.name}</td>
                                    <td className="td">{student.admissionNo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportCardDashboard;
