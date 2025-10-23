import React from 'react';
import { calculateGrade, calculateOverallPerformance } from '../../utils/reportCardHelper';
import ReportCardHeader from './ReportCardHeader';
import ReportCardFooter from './ReportCardFooter';

const SecondaryReportCard = ({ student, students, scores, subjects, settings, term, session, remarks, attendance }) => {
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

    // Settings-driven options (no hardcoding)
    const subjectsTable = settings?.reportCardSettings?.subjectsTable || {};
    const showCA1 = subjectsTable.showCA1 ?? true;
    const showCA2 = subjectsTable.showCA2 ?? true;
    const showExam = subjectsTable.showExam ?? true;
    const showTotal = subjectsTable.showTotal ?? true;
    const showGrade = subjectsTable.showGrade ?? true;
    const zebra = subjectsTable.zebra ?? false;
    const remarksWidth = subjectsTable.remarksWidth || undefined;

    const termColors = settings?.reportCardSettings?.termColors || {};
    const accentColor = /first/i.test(term)
        ? termColors.first
        : /second/i.test(term)
        ? termColors.second
        : /third/i.test(term)
        ? termColors.third
        : undefined;

    const showPhoto = settings?.reportCardSettings?.showStudentPhoto ?? false;
    const watermarkEnabled = settings?.reportCardSettings?.watermarkEnabled ?? false;
    const watermarkOpacity = settings?.reportCardSettings?.watermarkOpacity ?? 0.08;

    return (
        <div className="report-card-layout report-card-a4-size p-8 relative">
            {watermarkEnabled && settings.schoolLogo && (
                <img
                    src={settings.schoolLogo}
                    alt="Watermark"
                    className="absolute inset-0 m-auto pointer-events-none"
                    style={{ opacity: watermarkOpacity, width: '70%', filter: 'grayscale(100%)', zIndex: 0 }}
                />
            )}
            {accentColor && <div className="w-full h-1.5 rounded-full mb-4" style={{ backgroundColor: accentColor }} />}
            <div style={{ position: 'relative', zIndex: 1 }}>
                <ReportCardHeader settings={settings} />
                <div className="grid grid-cols-4 gap-4 my-4 text-sm">
                <span><strong>Name:</strong> {student.name}</span>
                <span><strong>Class:</strong> {student.class}</span>
                <span><strong>Session:</strong> {session}</span>
                <span><strong>Term:</strong> {term}</span>
            </div>
            <table className="w-full mt-4 text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border text-left">Subject</th>
                        <th className="p-2 border">CA1 ({maxCa1})</th>
                        <th className="p-2 border">CA2 ({maxCa2})</th>
                        <th className="p-2 border">Exam ({maxExam})</th>
                        <th className="p-2 border">Total (100)</th>
                        <th className="p-2 border">Grade</th>
                        <th className="p-2 border text-left">Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map(res => (
                        <tr key={res.subjectName}>
                            <td className="p-2 border">{res.subjectName}</td>
                            <td className="p-2 border text-center">{res.ca1 ?? '-'}</td>
                            <td className="p-2 border text-center">{res.ca2 ?? '-'}</td>
                            <td className="p-2 border text-center">{res.exam ?? '-'}</td>
                            <td className="p-2 border text-center font-semibold">{res.total}</td>
                            <td className="p-2 border text-center font-semibold">{res.grade}</td>
                            <td className="p-2 border" dangerouslySetInnerHTML={{ __html: res.comment }} />
                        </tr>
                    ))}
                </tbody>
            </table>
             <div className="mt-6">
                <h3 className="font-bold text-md mb-2">General Comment</h3>
                <div className="text-sm p-2 border rounded-md min-h-[40px] prose-content" dangerouslySetInnerHTML={{ __html: generalRemark || '' }} />
            </div>
            <div className="mt-auto pt-8">
                <ReportCardFooter principalName={settings.reportCardSettings.principalName} />
            </div>
        </div>
        </div>
    );
};

export default SecondaryReportCard;