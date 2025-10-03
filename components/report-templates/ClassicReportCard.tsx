import React from 'react';
import { calculateGrade, calculateOverallPerformance } from '../../utils/reportCardHelper';
import ReportCardHeader from './ReportCardHeader';
import ReportCardFooter from './ReportCardFooter';

const ClassicReportCard = ({ student, students, scores, subjects, settings, term, session, remarks }) => {
    if (!student || !settings) return null;

    const studentScores = scores.filter(s => s.studentId === student.id && s.term === term && s.session === session);
    const studentSubjects = subjects.filter(sub => sub.classes.includes(student.class));
    const results = studentSubjects.map(subject => {
        const score = studentScores.find(s => s.subjectId === subject.id);
        const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);
        const gradeInfo = calculateGrade(total, settings.gradingSystem || []);
        return { subjectName: subject.name, ca1: score?.ca1, ca2: score?.ca2, exam: score?.exam, total, grade: gradeInfo.grade, comment: score?.comment || '' };
    });

    const performance = calculateOverallPerformance(student.id, student.class, students, scores, subjects, term, session);
    const generalRemark = (remarks || []).find(r => r.studentId === student.id && r.term === term && r.session === session)?.generalComment;

    const maxCa1 = settings?.maxCa1 ?? 20;
    const maxCa2 = settings?.maxCa2 ?? 20;
    const maxExam = settings?.maxExam ?? 60;

    return (
        <div className="bg-white p-8 border-4 border-blue-900" style={{ width: '210mm', minHeight: '297mm', fontSize: '10px' }}>
            <ReportCardHeader settings={settings} />
            <div className="grid grid-cols-4 gap-4 my-4">
                <span><strong>Name:</strong> {student.name}</span>
                <span><strong>Class:</strong> {student.class}</span>
                <span><strong>Session:</strong> {session}</span>
                <span><strong>Term:</strong> {term}</span>
            </div>
            <table className="w-full mt-4">
                <thead className="bg-blue-100">
                    <tr>
                        <th className="p-2 border border-blue-300 text-left">Subject</th>
                        <th className="p-2 border border-blue-300">CA1 ({maxCa1})</th>
                        <th className="p-2 border border-blue-300">CA2 ({maxCa2})</th>
                        <th className="p-2 border border-blue-300">Exam ({maxExam})</th>
                        <th className="p-2 border border-blue-300">Total (100)</th>
                        <th className="p-2 border border-blue-300">Grade</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map(res => (
                        <tr key={res.subjectName}>
                            <td className="p-2 border border-blue-300">{res.subjectName}</td>
                            <td className="p-2 border border-blue-300 text-center">{res.ca1 ?? '-'}</td>
                            <td className="p-2 border border-blue-300 text-center">{res.ca2 ?? '-'}</td>
                            <td className="p-2 border border-blue-300 text-center">{res.exam ?? '-'}</td>
                            <td className="p-2 border border-blue-300 text-center font-semibold">{res.total}</td>
                            <td className="p-2 border border-blue-300 text-center font-semibold">{res.grade}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
             <div className="mt-6">
                <h3 className="font-bold text-md mb-2">General Comment</h3>
                <p className="text-sm p-2 border rounded-md min-h-[40px]">{generalRemark || ''}</p>
            </div>
            <div className="mt-auto pt-8">
                <ReportCardFooter />
            </div>
        </div>
    );
};

export default ClassicReportCard;