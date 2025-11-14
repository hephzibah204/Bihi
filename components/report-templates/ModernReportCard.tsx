import React from 'react';
import sanitizeHtml from '../../utils/sanitizeHtml';
import {
  calculateGrade,
  calculateOverallPerformance,
  summarizeAttendance,
} from '../../utils/reportCardHelper';
import ReportCardFooter from './ReportCardFooter';
import SkillsRatingTable from './SkillsRatingTable';

const gradePill = (grade) => {
  const g = (grade || '').toUpperCase();
  if (!g) return 'bg-slate-100 text-slate-500 border-slate-200';
  if (['A', 'A1'].includes(g))
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (['B', 'B2', 'B3'].includes(g))
    return 'bg-sky-50 text-sky-700 border-sky-200';
  if (['C', 'C4', 'C5', 'C6'].includes(g))
    return 'bg-amber-50 text-amber-700 border-amber-200';
  if (['D', 'E'].includes(g))
    return 'bg-orange-50 text-orange-700 border-orange-200';
  if (['F'].includes(g))
    return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

// Get total for same subject in another term (for B/F columns)
const getTermTotalForSubject = (scores, subjectId, studentId, targetTerm, session) => {
  if (!targetTerm) return '';
  const match = scores.find(
    (s) =>
      s.studentId === studentId &&
      s.subjectId === subjectId &&
      s.term === targetTerm &&
      s.session === session
  );
  if (!match) return '';
  return (match.ca1 || 0) + (match.ca2 || 0) + (match.exam || 0);
};

// Simple subject position within class (for the chosen term)
const getSubjectPosition = (
  subjectId,
  studentId,
  students,
  scores,
  term,
  session,
  className
) => {
  if (!subjectId || !studentId) return '';
  const classStudentIds = new Set(
    (students || [])
      .filter((s) => s.class === className)
      .map((s) => s.id)
  );
  const subjectScores = (scores || []).filter(
    (s) =>
      s.subjectId === subjectId &&
      s.term === term &&
      s.session === session &&
      classStudentIds.has(s.studentId)
  );
  if (!subjectScores.length) return '';

  const ranking = subjectScores
    .map((s) => ({
      studentId: s.studentId,
      total: (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0),
    }))
    .sort((a, b) => b.total - a.total);

  let lastTotal = null;
  let lastRank = 0;
  let idx = 0;
  for (const r of ranking) {
    idx += 1;
    if (r.total !== lastTotal) {
      lastRank = idx;
      lastTotal = r.total;
    }
    if (r.studentId === studentId) {
      const n = lastRank;
      const suffix =
        n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
      return `${n}${suffix}`;
    }
  }
  return '';
};

const ModernReportCard = ({
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
  const cfg = settings.reportCardSettings || {};

  // Terms used for B/F (configurable; falls back gracefully)
  const bfFirstTerm = cfg.bfFirstTerm || 'First Term';
  const bfSecondTerm = cfg.bfSecondTerm || 'Second Term';

  // All scores for this session (for B/F + current)
  const sessionScores = scores.filter((s) => s.session === session);

  // Current term scores for this student
  const currentScores = sessionScores.filter(
    (s) => s.studentId === student.id && s.term === term
  );

  const studentSubjects = subjects.filter((sub) =>
    (sub.classes || []).includes(student.class)
  );

  const classStudentIds = new Set(
    (students || [])
      .filter((s) => s.class === student.class)
      .map((s) => s.id)
  );

  const rows = studentSubjects.map((subject) => {
    const cur = currentScores.find((s) => s.subjectId === subject.id) || {};
    const bf1 = getTermTotalForSubject(
      sessionScores,
      subject.id,
      student.id,
      bfFirstTerm,
      session
    );
    const bf2 = getTermTotalForSubject(
      sessionScores,
      subject.id,
      student.id,
      bfSecondTerm,
      session
    );
    const ca = (cur.ca1 || 0) + (cur.ca2 || 0);
    const exam = cur.exam || 0;
    const total = ca + exam;
    const pct = total ? (total / 100) * 100 : 0;

    // cumulative: simple sum of B/F + current term
    const cumTotal =
      (Number(bf1) || 0) + (Number(bf2) || 0) + (total || 0);

    // class average
    const classSubjectScores = (scores || []).filter(
      (s) =>
        s.subjectId === subject.id &&
        s.term === term &&
        s.session === session &&
        classStudentIds.has(s.studentId)
    );
    const classTotals = classSubjectScores.map(
      (s) => (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0)
    );
    const classAvg = classTotals.length
      ? (classTotals.reduce((a, b) => a + b, 0) /
          classTotals.length
        ).toFixed(1)
      : '';

    const gradeInfo = calculateGrade(total, gradingSystem);
    const subjPos = getSubjectPosition(
      subject.id,
      student.id,
      students,
      scores,
      term,
      session,
      student.class
    );

    return {
      subjectId: subject.id,
      name: subject.name,
      bf1,
      bf2,
      ca,
      exam,
      total,
      pct: pct ? pct.toFixed(1) : '',
      cumTotal,
      subjPos,
      classAvg,
      grade: gradeInfo.grade || '',
      remark: (cur.comment || gradeInfo.remark || '').trim(),
    };
  });

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
  const overallPct =
    totalObtainable > 0
      ? ((totalObtained / totalObtainable) * 100).toFixed(1)
      : '0.0';

  const overallGrade = calculateGrade(Number(overallPct), gradingSystem).grade || '';

  const attendanceSummary = summarizeAttendance(student.id, attendance);
  const opened = attendanceSummary.total || 0;
  const present = attendanceSummary.present || 0;
  const absent = attendanceSummary.absent || 0;
  const attendancePct =
    opened > 0 ? ((present / opened) * 100).toFixed(1) : '0.0';

  const studentRemark = remarks.find(
    (r) =>
      r.studentId === student.id &&
      r.term === term &&
      r.session === session
  );
  const generalRemark = studentRemark?.generalComment || '';

  const affectiveSkills = [
    ...(cfg.affectiveSkills || []),
    ...(studentRemark?.customAffectiveSkills || []),
  ];
  const psychomotorSkills = [
    ...(cfg.psychomotorSkills || []),
    ...(studentRemark?.customPsychomotorSkills || []),
  ];

  const affectiveRatings = studentRemark?.affectiveRatings || {};
  const psychomotorRatings = studentRemark?.psychomotorRatings || {};

  const promotionText =
    cfg.showPromotionStatus !== false
      ? studentRemark?.promotionStatus ||
        (Number(overallPct) >= (cfg.promotionCutoff || 50)
          ? `PROMOTED TO NEXT CLASS`
          : `REPEAT RECOMMENDED`)
      : '';

  return (
    <div className="report-card-layout report-card-a4-size mx-auto p-6 bg-white text-slate-800 font-sans border-[6px] border-emerald-700 rounded-[18px] flex flex-col gap-4">
      {/* HEADER */}
      <header className="grid grid-cols-12 gap-4 items-center border-b border-emerald-200 pb-3">
        {/* Logo */}
        <div className="col-span-2 flex flex-col items-center">
          {settings.schoolLogo ? (
            <img
              src={settings.schoolLogo}
              alt="Logo"
              className="w-16 h-16 object-contain rounded-full border border-emerald-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border border-emerald-300 flex items-center justify-center text-[9px]">
              LOGO
            </div>
          )}
        </div>

        {/* School Info */}
        <div className="col-span-8 text-center">
          <h1 className="text-lg font-extrabold uppercase tracking-wide text-emerald-800">
            {settings.schoolName || 'HISGRACE INTERNATIONAL SCHOOL'}
          </h1>
          {settings.address && (
            <p className="text-[9px] text-slate-600">
              {settings.address}
            </p>
          )}
          {settings.motto && (
            <p className="text-[8px] text-slate-500 italic">
              Motto: {settings.motto}
            </p>
          )}
          <p className="mt-1 text-[9px] font-semibold uppercase text-slate-800">
            {session} {term} Report Sheet
          </p>
        </div>

        {/* Passport */}
        <div className="col-span-2 flex justify-center">
          <div className="w-16 h-20 rounded-xl border border-emerald-300 overflow-hidden bg-slate-50 flex items-center justify-center text-[9px]">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              'Passport'
            )}
          </div>
        </div>
      </header>

      {/* TOP SUMMARY BLOCK */}
      <section className="grid grid-cols-12 gap-3">
        {/* Student Personal Data */}
        <div className="col-span-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[9px] space-y-1.5">
          <div className="font-semibold text-emerald-800 mb-1">
            Student&apos;s Personal Data
          </div>
          <div>
            <span className="font-semibold">Name: </span>
            {student.name}
          </div>
          <div>
            <span className="font-semibold">Date of Birth: </span>
            {student.dob || '—'}
          </div>
          <div>
            <span className="font-semibold">Sex: </span>
            {student.gender || '—'}
          </div>
          <div>
            <span className="font-semibold">Class: </span>
            {student.class}
          </div>
          <div>
            <span className="font-semibold">Admission No: </span>
            {student.admissionNo || '—'}
          </div>
        </div>

        {/* Attendance */}
        <div className="col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[9px] space-y-1">
          <div className="font-semibold text-slate-800 mb-1">
            Attendance & Term Duration
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <div>No. of Times School Opened</div>
            <div className="font-semibold text-right">
              {opened}
            </div>
            <div>No. of Times Present</div>
            <div className="font-semibold text-right">
              {present}
            </div>
            <div>No. of Times Absent</div>
            <div className="font-semibold text-right">
              {absent}
            </div>
            <div>Attendance Rate</div>
            <div className="font-semibold text-right">
              {attendancePct}%
            </div>
          </div>
          <div className="mt-1 grid grid-cols-3 gap-2 text-[8px] text-slate-500">
            <div>
              <div className="font-semibold text-slate-700">
                Term Begins
              </div>
              <div>{cfg.termBeginsDate || '—'}</div>
            </div>
            <div>
              <div className="font-semibold text-slate-700">
                Term Ends
              </div>
              <div>{cfg.termEndsDate || '—'}</div>
            </div>
            <div>
              <div className="font-semibold text-slate-700">
                Next Term Begins
              </div>
              <div>{cfg.nextTermBeginsDate || '—'}</div>
            </div>
          </div>
        </div>

        {/* Totals / Position */}
        <div className="col-span-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[9px] space-y-1">
          <div className="font-semibold text-emerald-800 mb-1">
            Summary Metrics
          </div>
          <div className="flex justify-between">
            <span>Total Score Obtainable</span>
            <span className="font-semibold">
              {totalObtainable}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Score Obtained</span>
            <span className="font-semibold">
              {totalObtained}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Average Percentage</span>
            <span className="font-semibold">
              {overallPct}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>No. in Class</span>
            <span className="font-semibold">
              {performance.totalStudentsInClass || '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Position</span>
            <span className="font-semibold">
              {performance.position || '—'}
            </span>
          </div>
          <div className="mt-1">
            <span className="font-semibold">Overall Grade: </span>
            <span
              className={
                'inline-flex items-center px-2 py-0.5 rounded-full border text-[8px] ' +
                gradePill(overallGrade)
              }
            >
              {overallGrade || '—'}
            </span>
          </div>
        </div>
      </section>

      {/* ACADEMIC PERFORMANCE TABLE */}
      <section className="bg-white border border-emerald-200 rounded-xl overflow-hidden">
        <div className="bg-emerald-600 text-white text-center text-[9px] font-semibold py-1 uppercase">
          Academic Performance
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[8px]">
            <thead>
              <tr className="bg-emerald-50 text-emerald-800">
                <th className="border border-emerald-200 px-1 py-1 text-left">
                  Subject
                </th>
                <th className="border border-emerald-200 px-1 py-1">
                  B/F 1st
                </th>
                <th className="border border-emerald-200 px-1 py-1">
                  B/F 2nd
                </th>
                <th className="border border-emerald-200 px-1 py-1">
                  CA (40)
                </th>
                <th className="border border-emerald-200 px-1 py-1">
                  Exam (60)
                </th>
                <th className="border border-emerald-200 px-1 py-1">
                  Total (100)
                </th>
                <th className="border border-emerald-200 px-1 py-1">
                  %
                </th>
                <th className="border border-emerald-200 px-1 py-1">
                  Cumulative
                </th>
                <th className="border border-emerald-200 px-1 py-1">
                  Pos. in Subj
                </th>
                <th className="border border-emerald-200 px-1 py-1">
                  Class Avg
                </th>
                <th className="border border-emerald-200 px-1 py-1">
                  Remarks
                </th>
                <th className="border border-emerald-200 px-1 py-1">
                  Grade
                </th>
                <th className="border border-emerald-200 px-1 py-1">
                  Sign.
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.subjectId || r.name} className="odd:bg-white even:bg-slate-50/40">
                  <td className="border border-emerald-100 px-1 py-0.5 text-left font-medium text-slate-800">
                    {r.name}
                  </td>
                  <td className="border border-emerald-100 px-1 py-0.5 text-center">
                    {r.bf1}
                  </td>
                  <td className="border border-emerald-100 px-1 py-0.5 text-center">
                    {r.bf2}
                  </td>
                  <td className="border border-emerald-100 px-1 py-0.5 text-center">
                    {r.ca}
                  </td>
                  <td className="border border-emerald-100 px-1 py-0.5 text-center">
                    {r.exam}
                  </td>
                  <td className="border border-emerald-100 px-1 py-0.5 text-center font-semibold">
                    {r.total}
                  </td>
                  <td className="border border-emerald-100 px-1 py-0.5 text-center">
                    {r.pct}
                  </td>
                  <td className="border border-emerald-100 px-1 py-0.5 text-center">
                    {r.cumTotal || ''}
                  </td>
                  <td className="border border-emerald-100 px-1 py-0.5 text-center">
                    {r.subjPos}
                  </td>
                  <td className="border border-emerald-100 px-1 py-0.5 text-center">
                    {r.classAvg}
                  </td>
                  <td className="border border-emerald-100 px-1 py-0.5">
                    {r.remark}
                  </td>
                  <td className="border border-emerald-100 px-1 py-0.5 text-center">
                    <span
                      className={
                        'inline-flex px-1.5 py-0.5 rounded-full border ' +
                        gradePill(r.grade)
                      }
                    >
                      {r.grade || ''}
                    </span>
                  </td>
                  <td className="border border-emerald-100 px-1 py-0.5 text-center text-slate-400">
                    {/* Signature placeholder */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* KEYS + AFFECTIVE & PSYCHOMOTOR */}
      <section className="grid grid-cols-12 gap-3 text-[8px]">
        {/* Keys to Rating */}
        <div className="col-span-12 md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-2">
          <div className="font-semibold text-slate-800 mb-1">
            Keys to Rating (Configurable)
          </div>
          <div className="flex flex-wrap gap-1">
            {(gradingSystem || []).map((g, idx) => (
              <div
                key={idx}
                className="px-1.5 py-0.5 rounded-full bg-white border border-slate-200 text-[7px]"
              >
                {g.from}-{g.to} ({g.grade}: {g.remark})
              </div>
            ))}
          </div>
        </div>

        {/* Affective Traits */}
        <div className="col-span-12 md:col-span-3 bg-white border border-slate-200 rounded-xl p-2">
          <div className="font-semibold text-slate-800 mb-1">
            Affective Traits
          </div>
          {affectiveSkills.length ? (
            <SkillsRatingTable
              title=""
              skills={affectiveSkills}
              ratings={affectiveRatings}
            />
          ) : (
            <div className="text-slate-400">No traits configured.</div>
          )}
        </div>

        {/* Psychomotor Skills */}
        <div className="col-span-12 md:col-span-4 bg-white border border-slate-200 rounded-xl p-2">
          <div className="font-semibold text-slate-800 mb-1">
            Psychomotor Skills
          </div>
          {psychomotorSkills.length ? (
            <SkillsRatingTable
              title=""
              skills={psychomotorSkills}
              ratings={psychomotorRatings}
            />
          ) : (
            <div className="text-slate-400">No skills configured.</div>
          )}
        </div>
      </section>

      {/* COMMENTS & PROMOTION */}
      <section className="grid grid-cols-12 gap-3 text-[8px] mt-1">
        <div className="col-span-12 md:col-span-6 bg-white border border-slate-200 rounded-xl p-2">
          <div className="font-semibold text-slate-800 mb-1">
            Class Teacher&apos;s Comment
          </div>
          <div
            className="min-h-[30px] text-slate-700"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(generalRemark || '—') }}
          />
        </div>
        <div className="col-span-12 md:col-span-6 bg-white border border-slate-200 rounded-xl p-2">
          <div className="font-semibold text-slate-800 mb-1">
            Principal&apos;s Comment & Promotion Status
          </div>
          <div className="min-h-[24px] text-slate-700">
            {studentRemark?.principalComment ||
              'Good, keep improving.'}
          </div>
          {promotionText && (
            <div className="mt-1 font-semibold text-emerald-700">
              Promotion Status: {promotionText}
            </div>
          )}
        </div>
      </section>

      {/* SIGNATURE + FOOTER */}
      <div className="mt-3 text-[8px] flex justify-between">
        <div>
          <div>______________________________</div>
          <div>Class Teacher&apos;s Signature / Date</div>
        </div>
        <div className="text-right">
          <div>______________________________</div>
          <div>Head Teacher&apos;s Signature / Date</div>
        </div>
      </div>

      <div className="mt-2">
        <ReportCardFooter principalName={cfg.principalName} />
      </div>
    </div>
  );
};

export default ModernReportCard;
