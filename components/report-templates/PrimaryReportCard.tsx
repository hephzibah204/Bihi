import React from 'react';
import { calculateGrade, calculateOverallPerformance, summarizeAttendance } from '../../utils/reportCardHelper';
import ReportCardHeader from './ReportCardHeader';
import ReportCardFooter from './ReportCardFooter';

const PrimaryReportCard = ({ student, students, scores, subjects, settings, term, session, remarks, attendance }) => {
    if (!student || !settings) return <div className="p-4">Loading report card data...</div>;

    const studentScores = scores.filter(s => s.studentId === student.id && s.term === term && s.session === session);
    const studentSubjects = subjects.filter(sub => sub.classes.includes(student.class));
    
    const results = studentSubjects.map(subject => {
        const score = studentScores.find(s => s.subjectId === subject.id);
        const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);
        const gradeInfo = calculateGrade(total, settings.gradingSystem || []);
        return { subjectName: subject.name, total, ...gradeInfo, comment: score?.comment };
    });

    const performance = calculateOverallPerformance(student.id, student.class, students, scores, subjects, term, session);
    const attendanceSummary = summarizeAttendance(student.id, attendance);
    const generalRemark = (remarks || []).find(r => r.studentId === student.id && r.term === term && r.session === session)?.generalComment;

    return (
        <div className="bg-white p-6" style={{ width: '210mm', minHeight: '297mm', fontSize: '10px' }}>
            <ReportCardHeader settings={settings} />
            
            <div className="grid grid-cols-2 gap-x-4 my-4">
                <div><strong>Name:</strong> {student.name}</div>
                <div><strong>Class:</strong> {student.class}</div>
                <div><strong>Session:</strong> {session}</div>
                <div><strong>Term:</strong> {term}</div>
            </div>
            
            <h3 className="font-bold text-md mt-4 mb-2 border-b">ACADEMIC PERFORMANCE</h3>
            <table className="w-full">
                <thead>
                    <tr className="border-b bg-gray-50">
                        <th className="text-left py-1 px-2">Subject</th>
                        <th className="text-center py-1 px-2">Score</th>
                        <th className="text-center py-1 px-2">Grade</th>
                        <th className="text-left py-1 px-2">Remark</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map(res => (
                        <tr key={res.subjectName} className="border-b">
                            <td className="py-1 px-2">{res.subjectName}</td>
                            <td className="text-center py-1 px-2">{res.total}</td>
                            <td className="text-center py-1 px-2">{res.grade}</td>
                            <td className="py-1 px-2">{res.remark}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="grid grid-cols-2 gap-8 mt-4">
                <div>
                    <h3 className="font-bold text-md mb-1">SUMMARY</h3>
                    <p><strong>Total Score:</strong> {performance.totalScore}</p>
                    <p><strong>Average:</strong> {performance.average}%</p>
                    <p><strong>Position:</strong> {performance.position} of {performance.totalStudentsInClass}</p>
                </div>
                <div>
                    <h3 className="font-bold text-md mb-1">ATTENDANCE</h3>
                    <p><strong>Present:</strong> {attendanceSummary.present} | <strong>Late:</strong> {attendanceSummary.late} | <strong>Absent:</strong> {attendanceSummary.absent}</p>
                </div>
            </div>

            <div className="mt-4">
                <h3 className="font-bold text-md mb-1">GENERAL COMMENT</h3>
                <p className="p-2 border rounded-md min-h-[40px]">{generalRemark || ''}</p>
            </div>
            
            <div className="mt-auto pt-6">
                <ReportCardFooter />
            </div>
        </div>
    );
};

export default PrimaryReportCard;
