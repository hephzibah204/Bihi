import React from 'react';
import {
  calculateGrade,
  calculateOverallPerformance,
  summarizeAttendance,
} from '../../utils/reportCardHelper';
import ReportCardFooter from './ReportCardFooter';

/**
 * Helper: resolve skill display name from flexible config
 */
const getSkillLabel = (skill) => {
  if (!skill) return '';
  if (typeof skill === 'string') return skill;
  return skill.label || skill.name || skill.title || '';
};

/**
 * Helper: compute subject position in class (per subject, term, session)
 * Handles ties (same total => same position).
 */
const getSubjectPosition = (
  subjectId,
  studentId,
  students,
  scores,
  term,
  session,
  className
) => {
  if (!subjectId || !studentId) return '-';

  const classStudentIds = new Set(
    (students || [])
      .filter((s) => s.class === className)
      .map((s) => s.id)
  );

  const subjectScoresForClass = (scores || []).filter(
    (sc) =>
      sc.subjectId === subjectId &&
      sc.term === term &&
      sc.session === session &&
      classStudentIds.has(sc.studentId)
  );

  if (!subjectScoresForClass.length) return '-';

  const totals = subjectScoresForClass
    .map((sc) => ({
      studentId: sc.studentId,
      total: (sc.ca1 || 0) + (sc.ca2 || 0) + (sc.exam || 0),
    }))
    .sort((a, b) => b.total - a.total);

  let lastTotal = null;
  let lastRank = 0;
  let index = 0;

  for (const item of totals) {
    index += 1;
    if (item.total !== lastTotal) {
      lastRank = index;
      lastTotal = item.total;
    }
    if (item.studentId === studentId) {
      return `${lastRank}${
        lastRank === 1
          ? 'st'
          : lastRank === 2
          ? 'nd'
          : lastRank === 3
          ? 'rd'
          : 'th'
      }`;
    }
  }

  return '-';
};

/**
 * Helper: render Affective / Psychomotor table matching sample
 */
const SkillsDomainTable = ({ title, skills = [], ratings = {}, theme = {} }) => {
  // ratings expected like { [skillKey]: 1-5 }, any falsy = blank
  const resolvedSkills = skills.map((s, idx) => ({
    key: s.key || s.id || getSkillLabel(s) || `skill-${idx}`,
    label: getSkillLabel(s),
  }));
  const headerColor = theme.headerColor || '#4f81bd';
  const bandColor = theme.bandColor || '#d9e1f2';

  return (
    <div className="border border-black">
      <div className="text-white font-bold text-[8px] px-1 py-0.5 border-b border-black uppercase" style={{ backgroundColor: headerColor }}>
        {title}
      </div>
      <table className="w-full text-[7px]">
        <thead>
          <tr style={{ backgroundColor: bandColor }}>
            <th className="border border-black px-1 py-0.5 text-left">
              {title}
            </th>
            {[5, 4, 3, 2, 1].map((v) => (
              <th
                key={v}
                className="border border-black px-1 py-0.5 text-center"
              >
                {v}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resolvedSkills.map((skill) => (
            <tr key={skill.key}>
              <td className="border border-black px-1 py-0.5">
                {skill.label}
              </td>
              {[5, 4, 3, 2, 1].map((v) => (
                <td
                  key={v}
                  className="border border-black px-1 py-0.5 text-center"
                >
                  {Number(ratings[skill.key]) === v ? '✓' : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ClassicReportCard = ({
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
  const classicOptions = reportCfg.classicOptions || {};
  const classicTheme = reportCfg.classicTheme || {};
  const headerColor = classicTheme.headerColor || '#4f81bd';
  const bandColor = classicTheme.bandColor || '#d9e1f2';

  // Scores for this student / term / session
  const studentScores = (scores || []).filter(
    (s) =>
      s.studentId === student.id &&
      s.term === term &&
      s.session === session
  );

  const studentSubjects = (subjects || []).filter((sub) =>
    (sub.classes || []).includes(student.class)
  );

  // Build cognitive results
  const results = studentSubjects.map((subject) => {
    const score = studentScores.find((s) => s.subjectId === subject.id);
    const ca =
      (score?.ca1 || 0) + (score?.ca2 || 0); // combined CA (40)
    const exam = score?.exam || 0; // (60)
    const total = ca + exam; // (100)
    const gradeInfo = calculateGrade(total, gradingSystem) || {};
    return {
      subjectId: subject.id,
      subjectName: subject.name,
      ca,
      exam,
      total,
      grade: gradeInfo.grade || '',
      gradeRemark: gradeInfo.remark || '',
      remark: score?.comment || '',
    };
  });

  // Class subject averages (for CLASS AVG col)
  const classStudentIds = new Set(
    (students || [])
      .filter((s) => s.class === student.class)
      .map((s) => s.id)
  );

  const classSubjectAverages = {};
  studentSubjects.forEach((subject) => {
    const subjectScoresForClass = (scores || []).filter(
      (sc) =>
        sc.term === term &&
        sc.session === session &&
        sc.subjectId === subject.id &&
        classStudentIds.has(sc.studentId)
    );
    const totals = subjectScoresForClass.map(
      (sc) => (sc.ca1 || 0) + (sc.ca2 || 0) + (sc.exam || 0)
    );
    const avg = totals.length
      ? totals.reduce((a, b) => a + b, 0) / totals.length
      : 0;
    classSubjectAverages[subject.name] = Number(avg.toFixed(1));
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

  const totalSubjects = studentSubjects.length;
  const totalObtainable = totalSubjects * 100;
  const totalObtained = performance.totalScore || 0;
  const percentage =
    totalObtainable > 0
      ? ((totalObtained / totalObtainable) * 100).toFixed(2)
      : '0.00';

  // Attendance
  const attendanceSummary = summarizeAttendance(student.id, attendance);

  // Remarks
  const studentRemark = remarks.find(
    (r) =>
      r.studentId === student.id &&
      r.term === term &&
      r.session === session
  );
  const generalRemark = studentRemark?.generalComment || '';

  // Affective & Psychomotor config
  const affectiveSkills = [
    ...(reportCfg.affectiveSkills || []),
    ...(studentRemark?.customAffectiveSkills || []),
  ];
  const psychomotorSkills = [
    ...(reportCfg.psychomotorSkills || []),
    ...(studentRemark?.customPsychomotorSkills || []),
  ];
  const affectiveRatings = studentRemark?.affectiveRatings || {};
  const psychomotorRatings = studentRemark?.psychomotorRatings || {};

  // Grade analysis
  const gradeCounts = results.reduce((acc, r) => {
    const key = r.grade || 'N/A';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Simple auto head-teacher remark (optional, like sample)
  const autoHeadRemark =
    percentage >= 85
      ? 'Excellent performance. Keep it up.'
      : percentage >= 70
      ? 'Very good. Aim even higher next term.'
      : percentage >= 50
      ? 'Fair result. More hard work is required.'
      : 'Below expectation. Serious improvement needed.';

  const headerTitle = reportCfg.classicHeaderTitle || `${term} Term Pupil's Performance Report`;
  const summariesLocation = classicOptions.summariesLocation || 'below_subjects';
  const showLogo = classicOptions.showLogo ?? true;
  const showPhoto = classicOptions.showStudentPhoto ?? true;
  const showAttendance = classicOptions.showAttendance ?? true;
  const showAffective = classicOptions.showAffective ?? true;
  const showPsychomotor = classicOptions.showPsychomotor ?? true;
  const showGradeScale = classicOptions.showGradeScale ?? true;
  const showPerformance = classicOptions.showPerformance ?? true;
  const showGradeAnalysis = classicOptions.showGradeAnalysis ?? true;
  const showRatingIndices = classicOptions.showRatingIndices ?? true;

  const SummaryBlocks = () => (
    <div className="grid grid-cols-12 gap-1">
      {/* Performance Summary */}
      {showPerformance && (
        <div className="col-span-4 border border-black">
          <div className="text-white font-bold text-[8px] text-center px-1 py-0.5 border-b border-black uppercase" style={{ backgroundColor: headerColor }}>
            Performance Summary
          </div>
          <table className="w-full text-[7px]">
            <tbody>
              <tr>
                <td className="border border-black px-1 py-0.5">Total Obtainable:</td>
                <td className="border border-black px-1 py-0.5 text-right">{totalObtainable}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5">Total Obtained:</td>
                <td className="border border-black px-1 py-0.5 text-right">{totalObtained}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5">Percentage:</td>
                <td className="border border-black px-1 py-0.5 text-right">{percentage}%</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5">Position:</td>
                <td className="border border-black px-1 py-0.5 text-right">{performance.position || '-'} of {performance.totalStudentsInClass || '-'}</td>
              </tr>
              <tr>
                <td className="border border-black px-1 py-0.5">No. of Subjects Offered:</td>
                <td className="border border-black px-1 py-0.5 text-right">{totalSubjects}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {/* Grade Analysis */}
      {showGradeAnalysis && (
        <div className="col-span-4 border border-black">
          <div className="text-white font-bold text-[8px] text-center px-1 py-0.5 border-b border-black uppercase" style={{ backgroundColor: headerColor }}>
            Grade Analysis
          </div>
          <div className="grid grid-cols-9 gap-0.5 px-1 py-0.5 text-[7px]" style={{ backgroundColor: bandColor }}>
            {Object.keys(gradeCounts)
              .sort()
              .map((g) => (
                <div key={g} className="border border-black text-center py-0.5 bg-white">
                  <div className="font-semibold">{g}</div>
                  <div>{gradeCounts[g]}</div>
                </div>
              ))}
          </div>
        </div>
      )}
      {/* Rating Indices */}
      {showRatingIndices && (
        <div className="col-span-4 border border-black">
          <div className="text-white font-bold text-[8px] text-center px-1 py-0.5 border-b border-black uppercase" style={{ backgroundColor: headerColor }}>
            Rating Indices
          </div>
          <ul className="text-[7px] px-2 py-1 space-y-0.5 list-disc">
            <li>5 - Maintains an excellent degree of observable traits.</li>
            <li>4 - Acceptable level of observable traits.</li>
            <li>3 - Shows minimal regard for observable traits.</li>
            <li>2 - Low regard for observable traits.</li>
            <li>1 - No regard for observable traits.</li>
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="report-card-layout report-card-a4-size mx-auto p-4 border-[8px] border-black bg-white text-[8px] leading-tight font-sans">
      {/* Top Header: Logo - School Info - Passport */}
      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Logo */}
        <div className="col-span-2 flex flex-col items-center">
          {showLogo && settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="School Logo"
              className="w-16 h-16 object-contain mb-1"
            />
          ) : (
            <div className="w-16 h-16 border border-black flex items-center justify-center text-[7px]">
              LOGO
            </div>
          )}
        </div>

        {/* School details */}
        <div className="col-span-8 text-center">
          <div className="font-extrabold text-[15px] uppercase tracking-wide">
            {settings.schoolName || 'KINGS COURT ACADEMY'}
          </div>
          {settings.motto && (
            <div className="uppercase text-[7px] font-semibold">
              Motto: {settings.motto}
            </div>
          )}
          {settings.address && (
            <div className="text-[7px]">{settings.address}</div>
          )}
          {(settings.phone || settings.email) && (
            <div className="text-[7px]">
              {settings.phone && `Tel: ${settings.phone}`}
              {settings.phone && settings.email && ' | '}
              {settings.email && `Email: ${settings.email}`}
            </div>
          )}
          <div className="mt-1 border-y border-black py-0.5 text-[9px] font-bold uppercase">
            {headerTitle}
          </div>
        </div>

        {/* Passport */}
        <div className="col-span-2 flex flex-col items-center">
          {showPhoto && student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt="Student Passport"
              className="w-16 h-20 object-cover border border-black"
            />
          ) : (
            <div className="w-16 h-20 border border-black flex items-center justify-center text-[7px]">
              Passport
            </div>
          )}
        </div>
      </div>

      {/* Bio rows (2 bands like sample) */}
      <div className="mt-1 grid grid-cols-12 gap-1 bg-[#d9e1f2] border-x border-t border-black py-0.5">
        <div className="col-span-5">
          <span className="font-bold">NAME:</span> {student.name}
        </div>
        <div className="col-span-3">
          <span className="font-bold">CLASS:</span> {student.class}
        </div>
        <div className="col-span-2">
          <span className="font-bold">SESSION:</span> {session}
        </div>
        <div className="col-span-2">
          <span className="font-bold">TERM:</span> {term}
        </div>
      </div>
      <div className="grid grid-cols-12 gap-1 border-x border-b border-black py-0.5">
        <div className="col-span-3">
          <span className="font-bold">ADMISSION NO:</span>{' '}
          {student.admissionNo || '-'}
        </div>
        <div className="col-span-3">
          <span className="font-bold">GENDER:</span>{' '}
          {student.gender || '-'}
        </div>
        <div className="col-span-2">
          <span className="font-bold">D.O.B:</span>{' '}
          {student.dob || '-'}
        </div>
        <div className="col-span-2">
          <span className="font-bold">AGE:</span>{' '}
          {student.age || '-'}
        </div>
        <div className="col-span-2">
          <span className="font-bold">CLUB/SOCIETY:</span>{' '}
          {student.club || '-'}
        </div>
      </div>

      {/* Optional: place summaries above subjects based on settings */}
      {summariesLocation === 'above_subjects' && (
        <div className="mt-2">
          <SummaryBlocks />
        </div>
      )}

      {/* Main Body: Cognitive (left) + Right panels */}
      <div className="mt-2 grid grid-cols-12 gap-2">
        {/* Cognitive Domain */}
        <div className="col-span-8 border border-black">
          <div className="text-white font-bold text-[8px] px-1 py-0.5 border-b border-black uppercase" style={{ backgroundColor: headerColor }}>
            Cognitive Domain
          </div>
          <table className="w-full text-[7px]">
            <thead>
              <tr style={{ backgroundColor: bandColor }}>
                <th className="border border-black px-1 py-0.5 text-left">
                  SUBJECTS
                </th>
                <th className="border border-black px-1 py-0.5 text-center">
                  C.A<br />
                  <span className="text-[6px]">40</span>
                </th>
                <th className="border border-black px-1 py-0.5 text-center">
                  EXAM<br />
                  <span className="text-[6px]">60</span>
                </th>
                <th className="border border-black px-1 py-0.5 text-center">
                  TERM TOTAL<br />
                  <span className="text-[6px]">100</span>
                </th>
                <th className="border border-black px-1 py-0.5 text-center">
                  SUBJ POS
                </th>
                <th className="border border-black px-1 py-0.5 text-center">
                  GRADE
                </th>
                <th className="border border-black px-1 py-0.5 text-left">
                  REMARKS
                </th>
                <th className="border border-black px-1 py-0.5 text-center">
                  CLASS AVG
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((res) => (
                <tr key={res.subjectId || res.subjectName}>
                  <td className="border border-black px-1 py-0.5 text-left">
                    {res.subjectName}
                  </td>
                  <td className="border border-black px-1 py-0.5 text-center">
                    {res.ca}
                  </td>
                  <td className="border border-black px-1 py-0.5 text-center">
                    {res.exam}
                  </td>
                  <td className="border border-black px-1 py-0.5 text-center font-semibold">
                    {res.total}
                  </td>
                  <td className="border border-black px-1 py-0.5 text-center">
                    {getSubjectPosition(
                      res.subjectId,
                      student.id,
                      students,
                      scores,
                      term,
                      session,
                      student.class
                    )}
                  </td>
                  <td className="border border-black px-1 py-0.5 text-center font-semibold">
                    {res.grade}
                  </td>
                  <td
                    className="border border-black px-1 py-0.5 text-left"
                    dangerouslySetInnerHTML={{ __html: res.remark }}
                  />
                  <td className="border border-black px-1 py-0.5 text-center">
                    {classSubjectAverages[res.subjectName] ?? '-'}
                  </td>
                </tr>
              ))}
              {/* extra empty rows to mimic template grid feel */}
              {Array.from({ length: Math.max(0, 14 - results.length) }).map(
                (_, idx) => (
                  <tr key={`empty-${idx}`}>
                    <td className="border border-black px-1 py-2">&nbsp;</td>
                    <td className="border border-black" />
                    <td className="border border-black" />
                    <td className="border border-black" />
                    <td className="border border-black" />
                    <td className="border border-black" />
                    <td className="border border-black" />
                    <td className="border border-black" />
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Right Column: Attendance, Affective, Psychomotor, Grade Scale */}
        <div className="col-span-4 flex flex-col gap-1">
          {/* Attendance Summary */}
          {showAttendance && (
            <div className="border border-black">
              <div className="text-white font-bold text-[8px] px-1 py-0.5 border-b border-black uppercase" style={{ backgroundColor: headerColor }}>
                Attendance Summary
              </div>
              <table className="w-full text-[7px]">
                <tbody>
                  <tr>
                    <td className="border border-black px-1 py-0.5">No of Times School Opened</td>
                    <td className="border border-black px-1 py-0.5 text-right">{attendanceSummary.total || 0}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-1 py-0.5">No of Times Present</td>
                    <td className="border border-black px-1 py-0.5 text-right">{attendanceSummary.present || 0}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-1 py-0.5">No of Times Absent</td>
                    <td className="border border-black px-1 py-0.5 text-right">{attendanceSummary.absent || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Affective Domain */}
          {showAffective && (
            <SkillsDomainTable
              title="Affective Domain"
              skills={affectiveSkills}
              ratings={affectiveRatings}
              theme={{ headerColor, bandColor }}
            />
          )}

          {/* Psychomotor Domain */}
          {showPsychomotor && (
            <SkillsDomainTable
              title="Psychomotor Domain"
              skills={psychomotorSkills}
              ratings={psychomotorRatings}
              theme={{ headerColor, bandColor }}
            />
          )}

          {/* Grade Scale */}
          {showGradeScale && gradingSystem.length > 0 && (
            <div className="border border-black mt-1">
              <div className="text-white font-bold text-[8px] px-1 py-0.5 border-b border-black uppercase" style={{ backgroundColor: headerColor }}>
                Grade Scale
              </div>
              <table className="w-full text-[7px]">
                <thead>
                  <tr style={{ backgroundColor: bandColor }}>
                    <th className="border border-black px-1 py-0.5">Grade</th>
                    <th className="border border-black px-1 py-0.5">Score Range</th>
                    <th className="border border-black px-1 py-0.5">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {gradingSystem.map((g, idx) => (
                    <tr key={idx}>
                      <td className="border border-black px-1 py-0.5 text-center font-semibold">{g.grade}</td>
                      <td className="border border-black px-1 py-0.5 text-center">{g.from} - {g.to}</td>
                      <td className="border border-black px-1 py-0.5">{g.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary, Grade Analysis, Rating Indices (below subjects when configured) */}
      {summariesLocation === 'below_subjects' && (
        <div className="mt-2">
          <SummaryBlocks />
        </div>
      )}

      {/* Remarks and Next Term */}
      <div className="mt-2 grid grid-cols-12 gap-2 text-[7px]">
        <div className="col-span-8">
          <div className="font-bold mb-0.5">
            Class Teacher&apos;s Remark:
          </div>
          <div
            className="border border-black min-h-[22px] px-1 py-0.5"
            dangerouslySetInnerHTML={{ __html: generalRemark }}
          />
        </div>
        <div className="col-span-4">
          <div className="font-bold mb-0.5">
            Head Teacher&apos;s Remark:
          </div>
          <div className="border border-black min-h-[22px] px-1 py-0.5">
            {autoHeadRemark}
          </div>
          <div className="mt-1">
            <span className="font-bold">Next Term Begins:</span>{' '}
            {reportCfg.nextTermBeginsDate || '________________'}
          </div>
        </div>
      </div>

      {/* Signature / Footer block */}
      <div className="mt-3 text-[7px]">
        <div className="flex justify-between mb-4">
          <div>
            <div>______________________________</div>
            <div>Class Teacher&apos;s Signature / Date</div>
          </div>
          <div className="text-right">
            <div>______________________________</div>
            <div>Head Teacher / Principal&apos;s Signature / Date</div>
          </div>
        </div>
        <ReportCardFooter
          principalName={reportCfg.principalName}
        />
      </div>
    </div>
  );
};

export default ClassicReportCard;
