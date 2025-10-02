import React, { useEffect } from 'react';
import { getReportCardTemplate } from '../utils/reportCardHelper';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PrinterIcon from './icons/PrinterIcon';
import ClassicReportCard from './report-templates/ClassicReportCard';
import ModernReportCard from './report-templates/ModernReportCard';
import MinimalistReportCard from './report-templates/MinimalistReportCard';

const BulkReportCardPrintView = ({ studentIds, allData, onClose }) => {
    useEffect(() => {
        // Automatically trigger print dialog shortly after mount to allow content to render
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }, []);

    const studentsToPrint = allData.allStudents.filter(s => studentIds.includes(s.id));

    const getTemplateForStudent = (student) => {
        const ReportCardComponent = getReportCardTemplate(student.class);
        return ReportCardComponent;
    }

    return (
        <div className="bg-gray-200 dark:bg-gray-800">
            <div className="no-print p-4 bg-white dark:bg-gray-900 shadow-md flex justify-between items-center sticky top-0 z-10">
                <button onClick={onClose} className="btn btn-secondary">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>
                <h2 className="font-semibold text-lg hidden md:block">Printing {studentsToPrint.length} Report Cards</h2>
                <button onClick={() => window.print()} className="btn btn-primary">
                    <PrinterIcon className="w-5 h-5 mr-2" />
                    Print Again
                </button>
            </div>
            
            <div className="print-area">
                {studentsToPrint.map((student) => {
                    const ReportCardComponent = getTemplateForStudent(student);
                    return (
                        <div key={student.id} className="page-break my-4 mx-auto bg-white" style={{ width: '210mm' }}>
                             {ReportCardComponent && <ReportCardComponent 
                                student={student}
                                students={allData.allStudents}
                                scores={allData.scores}
                                subjects={allData.subjects}
                                settings={allData.settings}
                                term={allData.settings.term}
                                session={allData.settings.session}
                                remarks={allData.remarks}
                                attendance={allData.attendance}
                            />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BulkReportCardPrintView;
