import React from 'react';
import { calculateGrade, calculateOverallPerformance, summarizeAttendance, formatOrdinalPosition } from '../../utils/reportCardHelper';
import ReportCardHeader from './ReportCardHeader';
import ReportCardFooter from './ReportCardFooter';

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
    const attendanceSummary = summarizeAttendance(student.id, attendance);
    const attendanceRate = attendanceSummary.total > 0
        ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100)
        : null;
    const formattedPosition = formatOrdinalPosition(performance.position);
    const generalRemark = (remarks || []).find(r => r.studentId === student.id && r.term === term && r.session === session)?.generalComment;

    return (
        <div className="report-card-layout report-card-a4-size px-6 py-8 sm:px-10 sm:py-12">
            <ReportCardHeader settings={settings} term={term} session={session} />

            <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-4 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Student Profile</h3>
                    <dl className="mt-4 grid grid-cols-1 gap-y-3 text-sm text-gray-700">
                        <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-gray-500">Name</dt>
                            <dd className="font-semibold text-gray-900 text-right">{student.name}</dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-gray-500">Class</dt>
                            <dd className="font-semibold text-gray-900 text-right">{student.class}</dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-gray-500">Academic Session</dt>
                            <dd className="font-semibold text-gray-900 text-right">{session}</dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-gray-500">Term</dt>
                            <dd className="font-semibold text-gray-900 text-right">{term}</dd>
                        </div>
                    </dl>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Performance Snapshot</h3>
                    <dl className="mt-4 grid grid-cols-1 gap-y-3 text-sm text-gray-700">
                        <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-gray-500">Average Score</dt>
                            <dd className="text-base font-semibold text-gray-900">{Number(performance.average || 0).toFixed(2)}%</dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-gray-500">Class Position</dt>
                            <dd className="text-base font-semibold text-gray-900">
                                {formattedPosition}{typeof performance.totalStudentsInClass === 'number' && performance.totalStudentsInClass > 0 && (
                                    <span className="ml-2 text-xs font-normal text-gray-500">of {performance.totalStudentsInClass}</span>
                                )}
                            </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-gray-500">Subjects Assessed</dt>
                            <dd className="text-base font-semibold text-gray-900">{results.length}</dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-gray-500">Attendance</dt>
                            <dd className="text-right">
                                {attendanceRate !== null ? (
                                    <span className="flex flex-col text-base font-semibold text-gray-900">
                                        {attendanceRate}% Present
                                        <span className="text-xs font-normal text-gray-500">{attendanceSummary.present} of {attendanceSummary.total} days</span>
                                    </span>
                                ) : (
                                    <span className="text-sm text-gray-500">Not recorded</span>
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>

            <section className="mt-8">
                <div className="overflow-hidden rounded-3xl border border-gray-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-700">
                            <thead className="bg-indigo-600 text-xs font-semibold uppercase tracking-[0.2em] text-white print:bg-gray-200 print:text-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left">Subject</th>
                                    <th className="px-4 py-3 text-center">Score</th>
                                    <th className="px-4 py-3 text-center">Grade</th>
                                    <th className="px-4 py-3 text-left">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {results.map(res => (
                                    <tr key={res.subjectName} className="odd:bg-white even:bg-indigo-50/40 print:bg-transparent">
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-100">{res.subjectName}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-gray-900 border-b border-gray-100">{res.total}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-indigo-600 border-b border-gray-100">{res.grade}</td>
                                        <td className="px-4 py-3 border-b border-gray-100 text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: res.comment || '' }} />
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {Array.isArray(settings.gradingSystem) && settings.gradingSystem.length > 0 && (
                <section className="mt-8">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Grading Key</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {settings.gradingSystem.map(range => (
                            <div key={range.grade} className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-center shadow-sm">
                                <p className="text-lg font-bold text-indigo-700">{range.grade}</p>
                                <p className="text-xs text-gray-500">{range.from} - {range.to}</p>
                                <p className="text-xs italic text-indigo-600">{range.remark}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="mt-8">
                <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">General Comment</h3>
                {generalRemark ? (
                    <div className="prose-content mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-4 text-sm leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: generalRemark }} />
                ) : (
                    <p className="mt-3 text-sm italic text-gray-500">No general comment recorded for this term.</p>
                )}
            </section>

            <div className="pt-4">
                <ReportCardFooter principalName={settings.reportCardSettings.principalName} />
            </div>
        </div>
    );
};

export default NurseryReportCard;