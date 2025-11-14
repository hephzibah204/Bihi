import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { evaluateEligibility, issueCertificate, listCertificates } from '../services/teacherCertification';
import PrinterIcon from './icons/PrinterIcon';
import TeacherCourseCertificate from './certificates/TeacherCourseCertificate';

const TeacherCertificatePrintView: React.FC = () => {
  const { user } = useAuth();
  const [minCourses, setMinCourses] = useState(3);
  const [minScorePct, setMinScorePct] = useState(70);
  const [issued, setIssued] = useState<any | null>(null);

  const eligibility = useMemo(() => evaluateEligibility({ minCourses, minScorePct }), [minCourses, minScorePct]);
  const certificates = useMemo(() => listCertificates(), []);

  const handleIssue = () => {
    if (!eligibility.eligible) return;
    const rec = issueCertificate((user as any)?.name || (user as any)?.fullName || undefined, { minCourses, minScorePct });
    setIssued(rec);
  };

  const doPrint = () => {
    window.print();
  };

  const showCert = issued || certificates[certificates.length - 1] || null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Course Certificates</h2>
        <div className="text-sm text-gray-500">Printable PDF format via browser print</div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-sm">Minimum Courses</label>
            <input type="number" min={1} max={10} value={minCourses} onChange={e => setMinCourses(Math.max(1, Math.min(10, parseInt(e.target.value || '0') || 1)))} className="border rounded px-2 py-1 w-24" />
          </div>
          <div>
            <label className="text-sm">Minimum Average Score (%)</label>
            <input type="number" min={0} max={100} value={minScorePct} onChange={e => setMinScorePct(Math.max(0, Math.min(100, parseInt(e.target.value || '0') || 0)))} className="border rounded px-2 py-1 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleIssue} disabled={!eligibility.eligible} className={`px-3 py-2 rounded ${eligibility.eligible ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Issue Certificate</button>
            {showCert && (
              <button onClick={doPrint} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-green-600 text-white">
                <PrinterIcon className="h-5 w-5" />
                Print
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 text-sm">
          <div>Completed Courses: {eligibility.completedCourseIds.length}</div>
          <div>Average Quiz Score: {eligibility.avgScorePct}%</div>
          <div>Status: {eligibility.eligible ? 'Eligible' : 'Not eligible'}</div>
        </div>
      </div>

      {showCert && (
        <div className="bg-white rounded-lg shadow p-2">
          <TeacherCourseCertificate
            teacherName={showCert.teacherName}
            certificateId={showCert.id}
            issuedAt={showCert.issuedAt}
            completedCourses={showCert.completedCourseIds}
            avgScorePct={showCert.avgScorePct}
          />
        </div>
      )}
    </div>
  );
};

export default TeacherCertificatePrintView;

