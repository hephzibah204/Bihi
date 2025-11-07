import React from 'react';
import sanitizeHtml from '../../utils/sanitizeHtml';
import { calculateGrade, calculateOverallPerformance, summarizeAttendance } from '../../utils/reportCardHelper';
import ReportCardHeader from './ReportCardHeader';
import ReportCardFooter from './ReportCardFooter';
import SkillsRatingTable from './SkillsRatingTable';

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

    // Compute class subject averages for the selected term/session
    const classStudentIds = new Set((students || []).filter(s => s.class === student.class).map(s => s.id));
    const classSubjectAverages: Record<string, number> = {};
    studentSubjects.forEach(subject => {
        const subjectScoresForClass = (scores || []).filter(sc => sc.term === term && sc.session === session && sc.subjectId === subject.id && classStudentIds.has(sc.studentId));
        const totals = subjectScoresForClass.map(sc => (sc?.ca1 || 0) + (sc?.ca2 || 0) + (sc?.exam || 0));
        const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
        classSubjectAverages[subject.name] = Number(avg.toFixed(1));
    });

    const performance = calculateOverallPerformance(student.id, student.class, students, scores, subjects, term, session);
    const studentRemark = (remarks || []).find(r => r.studentId === student.id && r.term === term && r.session === session);
    const generalRemark = studentRemark?.generalComment;

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

    // Attendance summary
    const attendanceSummary = summarizeAttendance(student.id, attendance);

    // Grade analysis (count occurrences)
    const gradeCounts: Record<string, number> = results.reduce((acc, r) => {
        const key = r.grade || 'N/A';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const gradeScale = settings?.gradingSystem || [];

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
                        <th className="p-2 border">Class Avg</th>
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
                            <td className="p-2 border text-center">{classSubjectAverages[res.subjectName] ?? '-'}</td>
                            <td
                              className="p-2 border"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(res.comment || '') }}
                            />
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Performance and Attendance Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="border rounded-md p-2">
                    <h3 className="font-bold text-sm mb-2">Performance Summary</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <span>Total Score:</span><span className="font-semibold text-right">{performance.totalScore}</span>
                        <span>Average:</span><span className="font-semibold text-right">{performance.average}</span>
                        <span>Position:</span><span className="font-semibold text-right">{performance.position}</span>
                        <span>Class Size:</span><span className="text-right">{performance.totalStudentsInClass}</span>
                    </div>
                </div>
                <div className="border rounded-md p-2">
                    <h3 className="font-bold text-sm mb-2">Attendance Summary</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <span>Times Present:</span><span className="text-right">{attendanceSummary.present}</span>
                        <span>Times Late:</span><span className="text-right">{attendanceSummary.late}</span>
                        <span>Times Absent:</span><span className="text-right">{attendanceSummary.absent}</span>
                        <span>Total School Days:</span><span className="text-right">{attendanceSummary.total}</span>
                    </div>
                </div>
                <div className="border rounded-md p-2">
                    <h3 className="font-bold text-sm mb-2">Grade Analysis</h3>
                    <div className="grid grid-cols-5 gap-2 text-center">
                        {Object.keys(gradeCounts).sort().map(g => (
                            <div key={g} className="border p-1">
                                <div className="font-semibold">{g}</div>
                                <div>{gradeCounts[g]}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grade Scale */}
            {gradeScale && gradeScale.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-bold text-sm mb-2">Grade Scale</h3>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-1 border">Score Range</th>
                                <th className="p-1 border">Grade</th>
                                <th className="p-1 border">Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gradeScale.map((g, idx) => (
                                <tr key={idx}>
                                    <td className="p-1 border text-center">{g.from} - {g.to}</td>
                                    <td className="p-1 border text-center font-semibold">{g.grade}</td>
                                    <td className="p-1 border">{g.remark}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Rating Indices removed as requested */}
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
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h3 className="font-bold text-md mb-2">Class Teacher's Remark</h3>
                    <div
                      className="text-sm p-2 border rounded-md min-h-[40px] prose-content"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(generalRemark || '') }}
                    />
                </div>
                <div>
                    <h3 className="font-bold text-md mb-2">Head Teacher's Remark</h3>
                    <div className="text-sm p-2 border rounded-md min-h-[40px]">{/* Optional: can be filled later from settings */}</div>
                    <div className="mt-2 text-xs text-gray-600">Next Term Begins: {settings?.reportCardSettings?.nextTermBeginsDate || '-'}</div>
                </div>
            </div>
            <div className="mt-auto pt-8">
                <ReportCardFooter principalName={settings.reportCardSettings.principalName} />
            </div>
        </div>
        </div>
    );
};

export default SecondaryReportCard;