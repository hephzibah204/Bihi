import React from 'react';
import { calculateGrade, calculateOverallPerformance, summarizeAttendance } from '../../utils/reportCardHelper';
import ReportCardFooter from './ReportCardFooter';
import SkillsRatingTable from './SkillsRatingTable';

const MinimalistReportCard = ({ student, students, scores, subjects, settings, term, session, remarks, attendance }) => {
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
    const studentRemark = (remarks || []).find(r => r.studentId === student.id && r.term === term && r.session === session);
    const generalRemark = studentRemark?.generalComment;
    const comments = results.filter(r => r.comment);

    return (
        <div className="report-card-layout report-card-a4-size p-12 font-sans text-gray-700">
            <header className="mb-12">
                {settings.schoolLogo && (
                    <img src={settings.schoolLogo} alt="School Logo" className="w-16 h-16 mb-4" />
                )}
                <h1 className="text-2xl font-semibold tracking-tight">{settings.schoolName}</h1>
                <p className="text-sm text-gray-500">Academic Report</p>
            </header>
            <section className="mb-8">
                <h2 className="text-3xl font-bold">{student.name}</h2>
                <p className="text-gray-600">{student.class} &middot; {session} &middot; {term}</p>
            </section>
            
            <section className="grid grid-cols-3 gap-8 mb-8">
                <div className="col-span-2">
                     <h3 className="text-lg font-semibold text-gray-900 mb-2">Subject Performance</h3>
                    <div className="flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Subject</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Score</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {results.map((res) => (
                                            <tr key={res.subjectName}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{res.subjectName}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{res.total}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{res.grade}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="col-span-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b pb-1"><span>Average Score</span> <span className="font-semibold">{performance.average}%</span></div>
                        <div className="flex justify-between border-b pb-1"><span>Class Position</span> <span className="font-semibold">{performance.position} of {performance.totalStudentsInClass}</span></div>
                    </div>
                 </div>
            </section>
            
            <section className="mt-4">
                 <h3 className="text-lg font-semibold text-gray-900 mb-2">Comments</h3>
                 <div className="text-sm space-y-3 text-gray-600 border-t pt-4">
                    {generalRemark && <p><strong className="text-gray-800">General Remark:</strong> <span dangerouslySetInnerHTML={{ __html: generalRemark }} /></p>}
                    {comments.map(c => (
                        <p key={c.subjectName}><strong className="text-gray-800">{c.subjectName}:</strong> <span dangerouslySetInnerHTML={{ __html: c.comment }} /></p>
                    ))}
                 </div>
            </section>

            {/* Skills Section */}
            <section className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
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
            </section>

            <div className="mt-auto">
                {/* Fix: Pass principalName prop to ReportCardFooter to resolve missing property error. */}
                <ReportCardFooter principalName={settings.reportCardSettings?.principalName} />
            </div>
        </div>
    );
};

export default MinimalistReportCard;