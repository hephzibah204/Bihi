import React from 'react';

type Props = {
  teacherName?: string;
  certificateId: string;
  issuedAt: string;
  completedCourses: string[];
  avgScorePct: number;
};

const TeacherCourseCertificate: React.FC<Props> = ({ teacherName, certificateId, issuedAt, completedCourses, avgScorePct }) => {
  const date = new Date(issuedAt).toLocaleDateString();
  return (
    <div className="w-[210mm] h-[297mm] mx-auto bg-white text-gray-900 p-12">
      <div className="border-4 border-indigo-600 p-8 h-full flex flex-col">
        <div className="text-center">
          <div className="text-2xl font-bold tracking-wide">Certificate of Achievement</div>
          <div className="mt-1 text-sm text-gray-700">ID: {certificateId}</div>
        </div>
        <div className="mt-10 text-center">
          <div className="text-sm">This certifies that</div>
          <div className="mt-2 text-3xl font-semibold">{teacherName || 'Teacher'}</div>
          <div className="mt-4 text-sm">has successfully completed a variety of AI Coach micro‑courses</div>
          <div className="mt-1 text-sm">and demonstrated proficiency through course quizzes.</div>
        </div>
        <div className="mt-8">
          <div className="text-sm font-semibold">Completed Courses</div>
          <div className="mt-2 text-sm">{completedCourses.length > 0 ? completedCourses.join(', ') : '—'}</div>
        </div>
        <div className="mt-4 text-sm">Average Quiz Score: {avgScorePct}%</div>
        <div className="mt-auto flex items-center justify-between pt-10">
          <div className="text-sm">Issued on {date}</div>
          <div className="text-right">
            <div className="text-sm">Authorized Signature</div>
            <div className="mt-6 border-t border-gray-400 w-48"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherCourseCertificate;

