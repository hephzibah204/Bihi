

import React from 'react';
import { calculateGrade, calculateOverallPerformance, summarizeAttendance } from '../../utils/reportCardHelper';
import ReportCardFooter from './ReportCardFooter';

const ClassicReportCard = ({ student, students, scores, subjects, settings, term, session, remarks, attendance }) => {
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
        <div className="bg-white p-8 font-serif text-gray-800" style={{ width: '210mm', minHeight: '297mm' }}>
            <div className="text-center border-b-2 border-gray-800 pb-4">
                <h1 className="text-4xl font-bold tracking-wider">{settings.schoolName}</h1>
                <p className="text-sm mt-1">{settings.schoolAddress}</p>
                <h2 className="text-2xl font-semibold mt-4">ACADEMIC REPORT</h2>
            </div>
            <div className="mt-6 text-sm">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <p><strong>Student's Name:</strong> {student.name}</p>
                    <p><strong>Admission No:</strong> {student.admissionNo}</p>
                    <p><strong>Class:</strong> {student.class}</p>
                    <p><strong>Session:</strong> {session}</p>
                    <p><strong>Term:</strong> {term}</p>
                </div>
            </div>
            <table className="w-full mt-6 text-sm border-collapse border border-gray-500">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-500 p-2 text-left">SUBJECT</th>
                        <th className="border border-gray-500 p-2">SCORE</th>
                        <th className="border border-gray-500 p-2">GRADE</th>
                        <th className="border border-gray-500 p-2 text-left">REMARK</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((res, index) => (
                        <tr key={index}>
                            <td className="border border-gray-500 p-2">{res.subjectName}</td>
                            <td className="border border-gray-500 p-2 text-center">{res.total}</td>
                            <td className="border border-gray-500 p-2 text-center">{res.grade}</td>
                            <td className="border border-gray-500 p-2">{res.remark}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-6 p-4 border border-gray-500 text-sm">
                 <h3 className="font-bold text-md mb-2 text-center">PERFORMANCE SUMMARY</h3>
                 <div className="grid grid-cols-2 gap-x-8">
                    <p><strong>Total Score:</strong> {performance.totalScore}</p>
                    <p><strong>Average Score:</strong> {performance.average}</p>
                    <p><strong>Position in Class:</strong> {performance.position} of {performance.totalStudentsInClass}</p>
                 </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
                 <div>
                    <h3 className="font-bold mb-2 border-b">Attendance Summary</h3>
                    <p><strong>Days School Opened:</strong> {attendanceSummary.total}</p>
                    <p><strong>Days Present:</strong> {attendanceSummary.present}</p>
                    <p><strong>Days Absent:</strong> {attendanceSummary.absent}</p>
                </div>
                {generalRemark && (
                    <div>
                        <h3 className="font-bold mb-2 border-b">Form Teacher's General Comment</h3>
                        <p>{generalRemark}</p>
                    </div>
                )}
            </div>

            {comments.length > 0 && (
                <div className="mt-6 text-sm">
                    <h3 className="font-bold text-md mb-2">SUBJECT TEACHER'S COMMENTS</h3>
                     <div className="space-y-1">
                        {comments.map(c => (
                            <p key={c.subjectName}><strong>{c.subjectName}:</strong> {c.comment}</p>
                        ))}
                    </div>
                </div>
            )}
            <ReportCardFooter />
        </div>
    );
};

export default ClassicReportCard;