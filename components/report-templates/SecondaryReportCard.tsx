import React from 'react';
import { calculateGrade, calculateOverallPerformance, summarizeAttendance } from '../../utils/reportCardHelper';
import ReportCardHeader from './ReportCardHeader';
import ReportCardFooter from './ReportCardFooter';
import SkillsRatingTable from './SkillsRatingTable';

const SecondaryReportCard = ({ student, students, scores, subjects, settings, term, session, remarks, attendance }) => {
    if (!student || !settings) return <div className="p-4">Loading report card data...</div>;

    const { reportCardSettings } = settings;

    const studentScores = scores.filter(s => s.studentId === student.id && s.term === term && s.session === session);
    const studentSubjects = subjects.filter(sub => sub.classes.includes(student.class));
    
    const resultsData = studentSubjects.map(subject => {
        const score = studentScores.find(s => s.subjectId === subject.id);
        const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);
        const gradeInfo = calculateGrade(total, settings.gradingSystem || []);
        return { subjectName: subject.name, ca1: score?.ca1, ca2: score?.ca2, exam: score?.exam, total, ...gradeInfo, comment: score?.comment };
    });

    const performance = calculateOverallPerformance(student.id, student.class, students, scores, subjects, term, session);
    const attendanceSummary = summarizeAttendance(student.id, attendance);
    const generalRemark = (remarks || []).find(r => r.studentId === student.id && r.term === term && r.session === session)?.generalComment;

    const maxCa1 = settings?.maxCa1 ?? 20;
    const maxCa2 = settings?.maxCa2 ?? 20;
    const maxExam = settings?.maxExam ?? 60;

    const renderSection = (section) => {
        if (!section.enabled) return null;
        
        switch (section.id) {
            case 'academics':
                return (
                    <div key={section.id}>
                        <h3 className="font-bold text-md mt-4 mb-2 border-b">{section.title}</h3>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="text-left py-1 px-2">Subject</th>
                                    <th className="text-center py-1 px-2">CA1 ({maxCa1})</th>
                                    <th className="text-center py-1 px-2">CA2 ({maxCa2})</th>
                                    <th className="text-center py-1 px-2">Exam ({maxExam})</th>
                                    <th className="text-center py-1 px-2">Total (100)</th>
                                    <th className="text-center py-1 px-2">Grade</th>
                                    <th className="text-left py-1 px-2">Teacher's Comment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resultsData.map(res => (
                                    <tr key={res.subjectName} className="border-b">
                                        <td className="py-1 px-2">{res.subjectName}</td>
                                        <td className="text-center py-1 px-2">{res.ca1 ?? ''}</td>
                                        <td className="text-center py-1 px-2">{res.ca2 ?? ''}</td>
                                        <td className="text-center py-1 px-2">{res.exam ?? ''}</td>
                                        <td className="text-center py-1 px-2 font-semibold">{res.total}</td>
                                        <td className="text-center py-1 px-2 font-semibold">{res.grade}</td>
                                        <td className="py-1 px-2 italic text-gray-600">{res.comment || res.remark}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'attendance':
                 return (
                     <div key={section.id} className="mt-4">
                        <h3 className="font-bold text-md mb-1">{section.title}</h3>
                        <p><strong>Present:</strong> {attendanceSummary.present} | <strong>Late:</strong> {attendanceSummary.late} | <strong>Absent:</strong> {attendanceSummary.absent}</p>
                    </div>
                );
            case 'affective':
                 return <SkillsRatingTable key={section.id} title={section.title} skills={reportCardSettings.affectiveSkills} ratings={{}} />;
            case 'psychomotor':
                 return <SkillsRatingTable key={section.id} title={section.title} skills={reportCardSettings.psychomotorSkills} ratings={{}} />;
            case 'comment':
                return (
                    <div key={section.id} className="mt-4">
                        <h3 className="font-bold text-md mb-1">{section.title}</h3>
                        <p className="p-2 border rounded-md min-h-[40px]">{generalRemark || ''}</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-white p-6" style={{ width: '210mm', minHeight: '297mm', fontSize: '10px' }}>
            <ReportCardHeader settings={settings} />
            
            <div className="flex items-center space-x-4 my-4">
                <img 
                    src={student.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(student.name)}`} 
                    alt="Student" 
                    className="w-24 h-24 object-cover rounded-md border"
                />
                <div className="grid grid-cols-3 gap-x-2">
                    <span><strong>Name:</strong> {student.name}</span>
                    <span><strong>Class:</strong> {student.class}</span>
                    <span><strong>Session:</strong> {session}</span>
                    <span><strong>Term:</strong> {term}</span>
                    <span><strong>Admission No:</strong> {student.admissionNo}</span>
                </div>
            </div>
            
            {reportCardSettings.sections.map(renderSection)}

            <div className="grid grid-cols-2 gap-8 mt-4">
                 <div>
                    <h3 className="font-bold text-md mb-1">SUMMARY</h3>
                    <p><strong>Total Score:</strong> {performance.totalScore}</p>
                    <p><strong>Average:</strong> {performance.average}%</p>
                    <p><strong>Position:</strong> {performance.position} of {performance.totalStudentsInClass}</p>
                </div>
            </div>
            
            <div className="mt-auto pt-6">
                {/* Fix: Pass principalName prop to ReportCardFooter to resolve missing property error. */}
                <ReportCardFooter principalName={reportCardSettings.principalName} />
            </div>
        </div>
    );
};

export default SecondaryReportCard;
