


import React from 'react';
import { calculateGrade, calculateOverallPerformance, summarizeAttendance } from '../../utils/reportCardHelper';
import ReportCardFooter from './ReportCardFooter';

const ModernReportCard = ({ student, students, scores, subjects, settings, term, session, remarks, attendance }) => {
    if (!student || !settings) return null;

    const studentScores = scores.filter(s => s.studentId === student.id && s.term === term && s.session === session);
    const studentSubjects = subjects.filter(sub => student.class === sub.classes.find(c => c === student.class));
    const results = studentSubjects.map(subject => {
        const score = studentScores.find(s => s.subjectId === subject.id);
        const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);
        const gradeInfo = calculateGrade(total, settings.gradingSystem || []);
        return { subjectName: subject.name, total, grade: gradeInfo.grade, remark: gradeInfo.remark, comment: score?.comment || '' };
    });
    
    const performance = calculateOverallPerformance(student.id, student.class, students, scores, subjects, term, session);
    const attendanceSummary = summarizeAttendance(student.id, attendance);
    const generalRemark = (remarks || []).find(r => r.studentId === student.id && r.term === term && r.session === session)?.generalComment;
    const comments = results.filter(r => r.comment);

    return (
        <div className="bg-white p-8 font-sans text-gray-800" style={{ width: '210mm', minHeight: '297mm' }}>
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-indigo-600">{settings.schoolName}</h1>
                    <p className="text-xs text-gray-500">{settings.schoolAddress}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-semibold">Student Progress Report</h2>
                    <p className="text-sm">{session} - {term}</p>
                </div>
            </div>
            <div className="mt-8 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-2xl font-bold">{student.name}</h3>
                <div className="flex space-x-8 text-sm mt-1">
                    <span><strong>Class:</strong> {student.class}</span>
                    <span><strong>Admission No:</strong> {student.admissionNo}</span>
                </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-8">
                <div>
                    <h4 className="font-bold mb-2 text-lg">Academic Performance</h4>
                    <div className="space-y-2 text-sm">
                        {results.map((res, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                                <span>{res.subjectName}</span>
                                <div className="flex items-center space-x-4">
                                    <span className="font-bold w-12 text-center">{res.total}%</span>
                                    <span className="font-semibold text-indigo-600 w-8 text-center">{res.grade}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                        <h4 className="font-bold mb-2 text-lg">Overall Summary</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><p className="text-gray-500">Total Score</p><p className="font-bold text-xl">{performance.totalScore}</p></div>
                            <div><p className="text-gray-500">Average</p><p className="font-bold text-xl">{performance.average}%</p></div>
                            {/* Fix: Replaced invalid `colSpan` prop on div with `className="col-span-2"`. */}
                            <div className="col-span-2"><p className="text-gray-500">Class Position</p><p className="font-bold text-xl">{performance.position} of {performance.totalStudentsInClass}</p></div>
                        </div>
                    </div>
                     <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold mb-2 text-lg">Attendance</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm text-center">
                            <div><p className="text-gray-500">Present</p><p className="font-bold text-xl">{attendanceSummary.present}</p></div>
                            <div><p className="text-gray-500">Late</p><p className="font-bold text-xl">{attendanceSummary.late}</p></div>
                            <div><p className="text-gray-500">Absent</p><p className="font-bold text-xl">{attendanceSummary.absent}</p></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-6">
                 <h4 className="font-bold mb-2 text-lg">Comments</h4>
                 <div className="text-sm bg-gray-50 p-4 rounded-lg space-y-3">
                    {generalRemark && <p><strong>Form Teacher:</strong> {generalRemark}</p>}
                    {comments.map(c => (
                        <p key={c.subjectName}><strong>{c.subjectName}:</strong> {c.comment}</p>
                    ))}
                 </div>
            </div>
            <ReportCardFooter />
        </div>
    );
};

export default ModernReportCard;