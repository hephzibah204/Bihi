import React from 'react';
import {
  calculateGrade,
  calculateOverallPerformance,
  summarizeAttendance,
} from '../../utils/reportCardHelper';
import ReportCardFooter from './ReportCardFooter';
import SkillsRatingTable from './SkillsRatingTable';

const MinimalistReportCard = ({
  student,
  students = [],
  scores = [],
  subjects = [],
  settings,
  term,
  session,
  remarks = [],
  attendance = [],
}) => {
  if (!student || !settings) return null;

  const gradingSystem = settings.gradingSystem || [];
  const reportCfg = settings.reportCardSettings || {};

  // Scores for this student / term / session
  const studentScores = scores.filter(
    (s) =>
      s.studentId === student.id &&
      s.term === term &&
      s.session === session
  );

  // Subjects for this class
  const studentSubjects = subjects.filter((sub) =>
    (sub.classes || []).includes(student.class)
  );

  // Build subject results
  const results = studentSubjects.map((subject) => {
    const score = studentScores.find((s) => s.subjectId === subject.id);
    const ca = (score?.ca1 || 0) + (score?.ca2 || 0);
    const exam = score?.exam || 0;
    const total = ca + exam;
    const gradeInfo = calculateGrade(total, gradingSystem);
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      ca,
      exam,
      total,
      grade: gradeInfo.grade || '',
      remark: score?.comment || gradeInfo.remark || '',
    };
  });

  // Overall performance
  const performance = calculateOverallPerformance(
    student.id,
    student.class,
    students,
    scores,
    subjects,
    term,
    session
  );

  const totalSubjects = studentSubjects.length || 1;
  const totalObtainable = totalSubjects * 100;
  const totalObtained = performance.totalScore || 0;
  const overallPercentage =
    totalObtainable > 0
      ? ((totalObtained / totalObtainable) * 100).toFixed(1)
      : '0.0';

  const overallGradeInfo = calculateGrade(Number(overallPercentage), gradingSystem);

  // Attendance
  const attendanceSummary = summarizeAttendance(student.id, attendance);
  const opened = attendanceSummary.total || 0;
  const present = attendanceSummary.present || 0;
  const absent = attendanceSummary.absent || 0;
  const attendanceRate =
    opened > 0 ? ((present / opened) * 100).toFixed(1) : '0.0';

  // Remarks
  const studentRemark = remarks.find(
    (r) =>
      r.studentId === student.id &&
      r.term === term &&
      r.session === session
  );
  const generalRemark = studentRemark?.generalComment || '';

  // Skills
  const affectiveSkills = [
    ...(reportCfg.affectiveSkills || []),
    ...(studentRemark?.customAffectiveSkills || []),
  ];
  const psychomotorSkills = [
    ...(reportCfg.psychomotorSkills || []),
    ...(studentRemark?.customPsychomotorSkills || []),
  ];
  const cognitiveSkills = [
    ...(reportCfg.cognitiveSkills || []),
    ...(studentRemark?.customCognitiveSkills || []),
  ];
  const affectiveRatings = studentRemark?.affectiveRatings || {};
  const psychomotorRatings = studentRemark?.psychomotorRatings || {};
  const cognitiveRatings = studentRemark?.cognitiveRatings || {};

  return (
    <div
      className="
        report-card-layout report-card-a4-size
        mx-auto bg-white text-gray-800 font-sans
        text-[9px] leading-snug
        p-4 flex flex-col
        border border-gray-300
      "
    >
      {/* HEADER */}
      <header className="flex items-start justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="flex items-start gap-2">
          {settings.schoolLogo && (
            <img
              src={settings.schoolLogo}
              alt="School Logo"
              className="w-10 h-10 object-contain"
            />
          )}
          <div>
            <div className="text-sm font-semibold tracking-tight">
              {settings.schoolName || 'School Name'}
            </div>
            {settings.motto && (
              <div className="text-[8px] text-gray-500">
                {settings.motto}
              </div>
            )}
            <div className="text-[8px] text-gray-500">
              {term} Term • {session} Session
            </div>
          </div>
        </div>
        <div className="text-right text-[8px] text-gray-500">
          {settings.address && <div>{settings.address}</div>}
          {settings.phone && <div>{settings.phone}</div>}
          {settings.email && <div>{settings.email}</div>}
        </div>
      </header>

      {/* STUDENT + KPIs */}
      <section className="mt-2 mb-1 flex justify-between gap-4">
        <div>
          <div className="text-[13px] font-semibold">
            {student.name}
          </div>
          <div className="text-[8px] text-gray-500">
            {student.class} • {term} • {session}
          </div>
          <div className="text-[8px] text-gray-400 mt-0.5">
            Adm No: {student.admissionNo || '—'} &nbsp;|&nbsp; Sex:{' '}
            {student.gender || '—'}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-right">
          <div>
            <div className="text-[7px] text-gray-500">
              Average
            </div>
            <div className="text-[11px] font-semibold">
              {overallPercentage}%
            </div>
          </div>
          <div>
            <div className="text-[7px] text-gray-500">
              Position
            </div>
            <div className="text-[11px] font-semibold">
              {performance.position || '—'}
              <span className="text-[7px] text-gray-400">
                {' '}
                / {performance.totalStudentsInClass || '—'}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[7px] text-gray-500">
              Attendance
            </div>
            <div className="text-[11px] font-semibold">
              {attendanceRate}%
            </div>
          </div>
          <div>
            <div className="text-[7px] text-gray-500">
              Subjects
            </div>
            <div className="text-[10px] font-semibold">
              {studentSubjects.length}
            </div>
          </div>
          <div>
            <div className="text-[7px] text-gray-500">
              Overall Grade
            </div>
            <div className="text-[10px] font-semibold">
              {overallGradeInfo.grade || '—'}
            </div>
          </div>
          <div>
            <div className="text-[7px] text-gray-500">
              Total
            </div>
            <div className="text-[10px] font-semibold">
              {totalObtained}/{totalObtainable}
            </div>
          </div>
        </div>
      </section>

      {/* MID GRID: SUBJECT TABLE + SUMMARY/ATTENDANCE */}
      <section className="grid grid-cols-12 gap-3 mb-2">
        {/* SUBJECT TABLE (8/12) */}
        <div className="col-span-8">
          <div className="border border-gray-200 rounded-sm overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left font-medium">
                    Subject
                  </th>
                  <th className="px-1 py-1 text-right font-medium">
                    CA
                  </th>
                  <th className="px-1 py-1 text-right font-medium">
                    Exam
                  </th>
                  <th className="px-1 py-1 text-right font-medium">
                    Total
                  </th>
                  <th className="px-1 py-1 text-center font-medium">
                    Grade
                  </th>
                  <th className="px-2 py-1 text-left font-medium">
                    Remark
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((res) => (
                  <tr
                    key={res.subjectId || res.subjectName}
                    className="border-t border-gray-100"
                  >
                    <td className="px-2 py-0.5 text-left">
                      {res.subjectName}
                    </td>
                    <td className="px-1 py-0.5 text-right text-gray-600">
                      {res.ca}
                    </td>
                    <td className="px-1 py-0.5 text-right text-gray-600">
                      {res.exam}
                    </td>
                    <td className="px-1 py-0.5 text-right font-semibold">
                      {res.total}
                    </td>
                    <td className="px-1 py-0.5 text-center">
                      {res.grade}
                    </td>
                    <td className="px-2 py-0.5 text-gray-500">
                      {res.remark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SUMMARY + ATTENDANCE (4/12) */}
        <div className="col-span-4 flex flex-col gap-2">
          <div className="border border-gray-200 rounded-sm p-2">
            <div className="text-[8px] font-semibold text-gray-800 mb-1">
              Performance Summary
            </div>
            <div className="flex justify-between text-[8px]">
              <span>Average</span>
              <span className="font-semibold">
                {performance.average || overallPercentage}%
              </span>
            </div>
            <div className="flex justify-between text-[8px]">
              <span>Passed</span>
              <span className="font-semibold">
                {
                  results.filter((r) => {
                    const gi = calculateGrade(r.total, gradingSystem);
                    return (gi.grade || '').toUpperCase() !== 'F';
                  }).length
                }{' '}
                / {totalSubjects}
              </span>
            </div>
            <div className="flex justify-between text-[8px]">
              <span>Overall Grade</span>
              <span className="font-semibold">
                {overallGradeInfo.grade || '—'}
              </span>
            </div>
          </div>
          <div className="border border-gray-200 rounded-sm p-2">
            <div className="text-[8px] font-semibold text-gray-800 mb-1">
              Attendance
            </div>
            <div className="flex justify-between text-[8px]">
              <span>Opened</span>
              <span className="font-semibold">{opened}</span>
            </div>
            <div className="flex justify-between text-[8px]">
              <span>Present</span>
              <span className="font-semibold">{present}</span>
            </div>
            <div className="flex justify-between text-[8px]">
              <span>Absent</span>
              <span className="font-semibold">{absent}</span>
            </div>
            <div className="flex justify-between text-[8px]">
              <span>Rate</span>
              <span className="font-semibold">
                {attendanceRate}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM GRID: COMMENTS + SKILLS */}
      <section className="grid grid-cols-12 gap-3 text-[8px]">
        {/* COMMENTS (7/12) */}
        <div className="col-span-7">
          <div className="text-[8px] font-semibold text-gray-900 mb-1">
            Comments
          </div>
          <div className="border border-gray-200 rounded-sm p-2 space-y-1 min-h-[40px]">
            {generalRemark && (
              <p>
                <span className="font-semibold">
                  General:{' '}
                </span>
                <span
                  dangerouslySetInnerHTML={{
                    __html: require('../../utils/sanitizeHtml').default(generalRemark || ''),
                  }}
                />
              </p>
            )}
            {results
              .filter((r) => r.remark && r.remark !== r.grade)
              .slice(0, 4)
              .map((r) => (
                <p key={r.subjectId || r.subjectName}>
                  <span className="font-semibold">
                    {r.subjectName}:{' '}
                  </span>
                  {r.remark}
                </p>
              ))}
            {!generalRemark &&
              results.filter((r) => r.remark).length === 0 && (
                <p className="text-gray-400">
                  No comments recorded.
                </p>
              )}
          </div>
        </div>

        {/* SKILLS (5/12) */}
        <div className="col-span-5 flex flex-col gap-1.5">
          {affectiveSkills.length > 0 && (
            <div className="border border-gray-200 rounded-sm p-1.5">
              <div className="text-[7px] font-semibold mb-0.5">
                Affective
              </div>
              <SkillsRatingTable
                title=""
                compact
                skills={affectiveSkills}
                ratings={affectiveRatings}
              />
            </div>
          )}
          {psychomotorSkills.length > 0 && (
            <div className="border border-gray-200 rounded-sm p-1.5">
              <div className="text-[7px] font-semibold mb-0.5">
                Psychomotor
              </div>
              <SkillsRatingTable
                title=""
                compact
                skills={psychomotorSkills}
                ratings={psychomotorRatings}
              />
            </div>
          )}
          {cognitiveSkills.length > 0 && (
            <div className="border border-gray-200 rounded-sm p-1.5">
              <div className="text-[7px] font-semibold mb-0.5">
                Cognitive
              </div>
              <SkillsRatingTable
                title=""
                compact
                skills={cognitiveSkills}
                ratings={cognitiveRatings}
              />
            </div>
          )}
        </div>
      </section>

      {/* FOOTER pinned to bottom */}
      <div className="mt-auto pt-2">
        <ReportCardFooter
          principalName={reportCfg.principalName}
        />
      </div>
    </div>
  );
};

export default MinimalistReportCard;
