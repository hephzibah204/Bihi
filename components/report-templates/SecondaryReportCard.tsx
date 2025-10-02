import React from 'react';
import { calculateGrade, calculateOverallPerformance, summarizeAttendance } from '../../utils/reportCardHelper';
import ReportCardHeader from './ReportCardHeader';
import ReportCardFooter from './ReportCardFooter';

const SecondaryReportCard = ({ student, students, scores, subjects, settings, term, session, remarks, attendance }) => {
    if (!student || !settings) return null;

    const studentScores = scores.filter(s => s.studentId === student.id && s.term === term && s.session === session);
    const studentSubjects = subjects.filter(sub => student.class === sub.classes.find(c => c === student.class));
    
    const results = studentSubjects.map(subject => {
        const score = studentScores.find(s => s.subjectId === subject.id);
        const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);
        const gradeInfo = calculateGrade(total, settings.gradingSystem || []);
        return { subjectName: subject.name, total, ...gradeInfo };
    });

    const performance = calculateOverallPerformance(student.id, student.class, students, scores, subjects, term, session);
    const attendanceSummary = summarizeAttendance(student.id, attendance);
    const generalRemark = (remarks || []).find(r => r.studentId === student.id && r.term === term && r.session === session)?.generalComment;

    return (
        <div className="bg-white p-6 shadow-lg" style={{ width: '210mm', minHeight: '297mm' }}>
            <ReportCardHeader settings={settings} />
            
            <div className="grid grid-cols-2 gap-4 my-4 text-sm">
                <div><strong>Name:</strong> {student.name}</div>
                <div><strong>Class:</strong> {student.class}</div>
                <div><strong>Session:</strong> {session}</div>
                <div><strong>Term:</strong> {term}</div>
            </div>
            
            <h3 className="font-bold text-md mt-6 mb-2 border-b">Academic Performance</h3>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="text-left py-2">Subject</th>
                        <th className="text-center py-2">Score</th>
                        <th className="text-center py-2">Grade</th>
                        <th className="text-left py-2">Remark</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map(res => (
                        <tr key={res.subjectName} className="border-b">
                            <td className="py-2">{res.subjectName}</td>
                            <td className="text-center py-2">{res.total}</td>
                            <td className="text-center py-2">{res.grade}</td>
                            <td className="py-2">{res.remark}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="grid grid-cols-2 gap-8 mt-6">
                <div>
                    <h3 className="font-bold text-md mb-2">Summary</h3>
                    <p className="text-sm"><strong>Total Score:</strong> {performance.totalScore}</p>
                    <p className="text-sm"><strong>Average:</strong> {performance.average}%</p>
                    <p className="text-sm"><strong>Position in Class:</strong> {performance.position} out of {performance.totalStudentsInClass}</p>
                </div>
                <div>
                    <h3 className="font-bold text-md mb-2">Attendance</h3>
                    <p className="text-sm"><strong>Present:</strong> {attendanceSummary.present}</p>
                    <p className="text-sm"><strong>Late:</strong> {attendanceSummary.late}</p>
                    <p className="text-sm"><strong>Absent:</strong> {attendanceSummary.absent}</p>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="font-bold text-md mb-2">General Comment</h3>
                <p className="text-sm p-2 border rounded-md">{generalRemark || 'No general comment provided.'}</p>
            </div>
            
            <div className="mt-auto">
                <ReportCardFooter />
            </div>
        </div>
    );
};

export default SecondaryReportCard;
