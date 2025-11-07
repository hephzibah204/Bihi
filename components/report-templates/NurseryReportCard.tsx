import React from 'react';
import sanitizeHtml from '../../utils/sanitizeHtml';
import { calculateGrade, calculateOverallPerformance } from '../../utils/reportCardHelper';
import ReportCardHeader from './ReportCardHeader';
import ReportCardFooter from './ReportCardFooter';
import SkillsRatingTable from './SkillsRatingTable';

const NurseryReportCard = ({ student, students, scores, subjects, settings, term, session, remarks, attendance }) => {
    if (!student || !settings) return null;

    const studentScores = scores.filter(s => s.studentId === student.id && s.term === term && s.session === session);
    const studentSubjects = subjects.filter(sub => sub.classes.includes(student.class));
    
    const results = studentSubjects.map(subject => {
        const score = studentScores.find(s => s.subjectId === subject.id);
        const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);
        const gradeInfo = calculateGrade(total, settings.gradingSystem || []);
        return { 
            subjectName: subject.name, 
            total, 
            grade: gradeInfo.grade, 
            comment: score?.comment || gradeInfo.remark 
        };
    });

    const performance = calculateOverallPerformance(student.id, student.class, students, scores, subjects, term, session);
    const studentRemark = (remarks || []).find(r => r.studentId === student.id && r.term === term && r.session === session);
    const generalRemark = studentRemark?.generalComment;

    return (
        <div className="report-card-layout report-card-a4-size p-8">
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
                        <th className="p-2 border text-center">Score</th>
                        <th className="p-2 border text-center">Grade</th>
                        <th className="p-2 border text-left">Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map(res => (
                        <tr key={res.subjectName}>
                            <td className="p-2 border">{res.subjectName}</td>
                            <td className="p-2 border text-center font-semibold">{res.total}</td>
                            <td className="p-2 border text-center font-semibold">{res.grade}</td>
                            <td
                              className="p-2 border"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(res.comment || '') }}
                            />
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* Skills Section */}
            <div className="mt-6">
                <h3 className="font-bold text-md mb-2">Skills</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    { (studentRemark?.useAffective ?? true) && (
                        <SkillsRatingTable
                            title="Affective Skills"
                            skills={[...(settings.reportCardSettings?.affectiveSkills || []), ...((studentRemark?.customAffectiveSkills) || [])]}
                            ratings={studentRemark?.affectiveRatings || {}}
                        />
                    )}
                    { (studentRemark?.usePsychomotor ?? true) && (
                        <SkillsRatingTable
                            title="Psychomotor Skills"
                            skills={[...(settings.reportCardSettings?.psychomotorSkills || []), ...((studentRemark?.customPsychomotorSkills) || [])]}
                            ratings={studentRemark?.psychomotorRatings || {}}
                        />
                    )}
                    { (studentRemark?.useCognitive ?? true) && (settings.reportCardSettings?.cognitiveSkills || (studentRemark?.customCognitiveSkills && studentRemark.customCognitiveSkills.length)) && (
                        <SkillsRatingTable
                            title="Cognitive Skills"
                            skills={[...(settings.reportCardSettings?.cognitiveSkills || []), ...((studentRemark?.customCognitiveSkills) || [])]}
                            ratings={studentRemark?.cognitiveRatings || {}}
                        />
                    )}
                </div>
            </div>
             <div className="mt-6">
                <h3 className="font-bold text-md mb-2">General Comment</h3>
                <div
                  className="text-sm p-2 border rounded-md min-h-[40px] prose-content"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(generalRemark || '') }}
                />
            </div>
            <div className="mt-auto pt-8">
                <ReportCardFooter principalName={settings.reportCardSettings.principalName} />
            </div>
        </div>
    );
};

export default NurseryReportCard;