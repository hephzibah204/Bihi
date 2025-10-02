


import React from 'react';
import { calculateGrade, calculateOverallPerformance, summarizeAttendance } from '../../utils/reportCardHelper';
import ReportCardFooter from './ReportCardFooter';

const SecondaryReportCard = ({ student, students, scores, subjects, settings, term, session, remarks, attendance }) => {
    if (!student || !settings || !students) {
        return <div className="p-4">Loading report card data...</div>;
    }

    const studentClassSubjects = subjects.filter(sub => student.class === sub.classes.find(c => c === student.class));
    const results = studentClassSubjects.map(subject => {
        const score = scores.find(s => s.studentId === student.id && s.term === term && s.session === session && s.subjectId === subject.id);
        const ca1 = score?.ca1 || 0;
        const ca2 = score?.ca2 || 0;
        const exam = score?.exam || 0;
        const total = ca1 + ca2 + exam;
        const gradeInfo = calculateGrade(total, settings.gradingSystem || []);
        return { subjectName: subject.name, ca1, ca2, exam, total, grade: gradeInfo.grade, remark: gradeInfo.remark, comment: score?.comment || '' };
    });

    const performance = calculateOverallPerformance(student.id, student.class, students, scores, subjects, term, session);
    const attendanceSummary = summarizeAttendance(student.id, attendance);
    const generalRemark = (remarks || []).find(r => r.studentId === student.id && r.term === term && r.session === session)?.generalComment;
    const comments = results.filter(r => r.comment);

    return (
        <div className="bg-white p-6 shadow-lg" id={`report-card-${student.id}`}>
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold">{settings.schoolName}</h1>
                <p>{settings.schoolAddress}</p>
                <h2 className="text-xl font-semibold mt-2">Student Report Card</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div><strong>Name:</strong> {student.name}</div>
                <div><strong>Class:</strong> {student.class}</div>
                <div><strong>Admission No:</strong> {student.admissionNo}</div>
                <div><strong>Session:</strong> {session}</div>
                <div><strong>Term:</strong> {term}</div>
                 <div><strong>Position in Class:</strong> {performance.position} of {performance.totalStudentsInClass}</div>
            </div>

            <table className="w-full border-collapse border border-gray-400 text-sm">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-gray-400 p-2">Subject</th>
                        <th className="border border-gray-400 p-2">CA 1 (20)</th>
                        <th className="border border-gray-400 p-2">CA 2 (20)</th>
                        <th className="border border-gray-400 p-2">Exam (60)</th>
                        <th className="border border-gray-400 p-2">Total (100)</th>
                        <th className="border border-gray-400 p-2">Grade</th>
                        <th className="border border-gray-400 p-2">Remark</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((res, index) => (
                        <tr key={index}>
                            <td className="border border-gray-400 p-2">{res.subjectName}</td>
                            <td className="border border-gray-400 p-2 text-center">{res.ca1}</td>
                            <td className="border border-gray-400 p-2 text-center">{res.ca2}</td>
                            <td className="border border-gray-400 p-2 text-center">{res.exam}</td>
                            <td className="border border-gray-400 p-2 text-center font-bold">{res.total}</td>
                            <td className="border border-gray-400 p-2 text-center">{res.grade}</td>
                            <td className="border border-gray-400 p-2">{res.remark}</td>
                        </tr>
                    ))}
                     <tr className="font-bold bg-gray-100">
                        {/* Fix: Changed colSpan from string to number. */}
                        <td className="border border-gray-400 p-2 text-right" colSpan={4}>Total Score</td>
                        <td className="border border-gray-400 p-2 text-center">{performance.totalScore}</td>
                        {/* Fix: Changed colSpan from string to number. */}
                        <td className="border border-gray-400 p-2 text-right" colSpan={1}>Average</td>
                        <td className="border border-gray-400 p-2 text-center">{performance.average}</td>
                    </tr>
                </tbody>
            </table>

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
                <div className="mt-6">
                    <h3 className="font-bold text-md mb-2 border-b">Subject Teacher's Comments</h3>
                    <div className="text-sm space-y-1">
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

export default SecondaryReportCard;