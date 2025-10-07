import React from 'react';
import { calculateGrade, calculateOverallPerformance, summarizeAttendance } from '../../utils/reportCardHelper';
import ReportCardFooter from './ReportCardFooter';

const ModernReportCard = ({ student, students, scores, subjects, settings, term, session, remarks, attendance }) => {
    if (!student || !settings) return null;

    const studentScores = scores.filter(s => s.studentId === student.id && s.term === term && s.session === session);
    const studentSubjects = subjects.filter(sub => sub.classes.includes(student.class));
    const results = studentSubjects.map(subject => {
        const score = studentScores.find(s => s.subjectId === subject.id);
        const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);
        const gradeInfo = calculateGrade(total, settings.gradingSystem || []);
        return { subjectName: subject.name, total, grade: gradeInfo.grade, comment: score?.comment || '' };
    });

    const performance = calculateOverallPerformance(student.id, student.class, students, scores, subjects, term, session);
    const generalRemark = (remarks || []).find(r => r.studentId === student.id && r.term === term && r.session === session)?.generalComment;

    return (
        <div className="bg-white p-10 font-sans" style={{ width: '210mm', minHeight: '297mm', fontSize: '10px' }}>
            <header className="flex justify-between items-center pb-6 border-b-2 border-indigo-500">
                <div>
                    <h1 className="text-3xl font-bold text-indigo-600">{settings.schoolName}</h1>
                    <p className="text-gray-500">Student Progress Report</p>
                </div>
                {settings.schoolLogo && <img src={settings.schoolLogo} alt="Logo" className="w-16 h-16 rounded-full"/>}
            </header>
            <section className="grid grid-cols-3 gap-8 my-8">
                <div><strong className="block text-gray-500 text-sm">Student</strong>{student.name}</div>
                <div><strong className="block text-gray-500 text-sm">Class</strong>{student.class}</div>
                <div><strong className="block text-gray-500 text-sm">Session</strong>{session} {term}</div>
            </section>
            <section className="grid grid-cols-2 gap-12">
                <div>
                    <h3 className="font-semibold mb-3">Academic Performance</h3>
                    <div className="space-y-2">
                        {results.map(res => (
                            <div key={res.subjectName} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                                <span>{res.subjectName}</span>
                                <div className="flex items-center space-x-4">
                                    <span className="font-bold w-8 text-right">{res.total}</span>
                                    <span className="font-semibold text-indigo-600 w-6 text-center">{res.grade}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-3">Performance Summary</h3>
                     <div className="bg-indigo-50 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between"><span>Average Score</span> <span className="font-bold">{performance.average}%</span></div>
                        <div className="flex justify-between"><span>Class Position</span> <span className="font-bold">{performance.position} / {performance.totalStudentsInClass}</span></div>
                    </div>
                     <h3 className="font-semibold mb-3 mt-6">Comments</h3>
                     <div className="space-y-2 bg-gray-50 p-4 rounded-lg min-h-[100px]">
                        <p><strong>General:</strong> {generalRemark || 'N/A'}</p>
                     </div>
                </div>
            </section>
             <div className="mt-auto pt-10">
                {/* Fix: Pass principalName prop to ReportCardFooter to resolve missing property error. */}
                <ReportCardFooter principalName={settings.reportCardSettings.principalName} />
            </div>
        </div>
    );
};

export default ModernReportCard;
