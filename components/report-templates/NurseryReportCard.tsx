import React from 'react';
import ReportCardHeader from './ReportCardHeader';
import ReportCardFooter from './ReportCardFooter';
import SkillsRatingTable from './SkillsRatingTable';

// Fix: Added missing props to match the interface of other report card components, resolving type errors.
const NurseryReportCard = ({ student, settings, remarks, session, term, students, scores, subjects, attendance }) => {
    const { reportCardSettings } = settings;
    const generalRemark = (remarks || []).find(r => r.studentId === student.id && r.term === term && r.session === session)?.generalComment;

    const renderSection = (section) => {
        if (!section.enabled) return null;

        switch (section.id) {
            case 'affective':
                return <SkillsRatingTable key={section.id} title={section.title} skills={reportCardSettings.affectiveSkills} ratings={{}} />;
            case 'psychomotor':
                return <SkillsRatingTable key={section.id} title={section.title} skills={reportCardSettings.psychomotorSkills} ratings={{}} />;
            case 'comment':
                 return (
                    <div key={section.id} className="mt-6">
                        <h3 className="font-bold text-md mb-2 border-b">{section.title}</h3>
                        <p className="text-sm p-2 border rounded-md min-h-[40px]">
                            {generalRemark || `${student.name} is a cheerful and enthusiastic learner. He/she has shown great improvement in social interaction this term.`}
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="report-card-layout report-card-a4-size p-6 shadow-lg" id={`report-card-${student.id}`}>
            <ReportCardHeader settings={settings} />
            <div className="flex items-center space-x-4 my-4 text-sm">
                <img 
                    src={student.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(student.name)}`} 
                    alt="Student" 
                    className="w-20 h-20 object-cover rounded-md border"
                />
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div><strong>Name:</strong> {student.name}</div>
                    <div><strong>Class:</strong> {student.class}</div>
                    <div><strong>Session:</strong> {session}</div>
                    <div><strong>Term:</strong> {term}</div>
                </div>
            </div>
            
            {reportCardSettings.sections.map(renderSection)}

            <div className="mt-auto pt-6">
                <ReportCardFooter principalName={reportCardSettings.principalName} />
            </div>
        </div>
    );
};

export default NurseryReportCard;
