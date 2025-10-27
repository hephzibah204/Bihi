

import React, { useEffect, useState } from 'react';
import { getReportCardTemplate } from '../utils/reportCardHelper';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PrinterIcon from './icons/PrinterIcon';
import ClassicReportCard from './report-templates/ClassicReportCard';
import ModernReportCard from './report-templates/ModernReportCard';
import MinimalistReportCard from './report-templates/MinimalistReportCard';
import SpinnerIcon from './icons/SpinnerIcon';
import '../styles/report-card.css';

const BulkReportCardPrintView = ({ studentIds, allData, onClose, action, templateKey = 'auto' }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    
    const handleDownload = async () => {
        setIsProcessing(true);
        const { html2canvas, jspdf } = window;
        if (!html2canvas || !jspdf) {
            alert("PDF export library not loaded. Please try again.");
            setIsProcessing(false);
            return;
        }
        const { jsPDF } = jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const reportCardElements = document.querySelectorAll('.page-break');
        
        for (let i = 0; i < reportCardElements.length; i++) {
            const element = reportCardElements[i] as HTMLElement;
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const A4_WIDTH = 210;
            const A4_HEIGHT = 297;
            
            if (i > 0) {
                pdf.addPage();
            }
            pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');
        }
        
        // Determine filename: if all selected students share one class, use that; otherwise generic
        const uniqueClasses = Array.from(new Set(studentsToPrint.map(s => s.class))).filter(Boolean);
        const baseName = uniqueClasses.length === 1 ? uniqueClasses[0] : 'report-cards';
        pdf.save(baseName + '.pdf');
        setIsProcessing(false);
        onClose();
    };
    
    useEffect(() => {
        if (action === 'print') {
            const timer = setTimeout(() => window.print(), 500);
            return () => clearTimeout(timer);
        } else if (action === 'download') {
            // Need a short delay to ensure elements are rendered before capturing
            const timer = setTimeout(() => handleDownload(), 100);
            return () => clearTimeout(timer);
        }
    }, [action]);

    const studentsToPrint = allData.allStudents.filter(s => studentIds.includes(s.id));

    const getTemplateForStudent = (student) => {
        if (templateKey && templateKey !== 'auto') {
            if (templateKey === 'modern') return ModernReportCard;
            if (templateKey === 'classic') return ClassicReportCard;
            if (templateKey === 'minimalist') return MinimalistReportCard;
        }
        return getReportCardTemplate(student.class, allData.settings);
    }

    return (
        <div className="bg-gray-200 dark:bg-gray-800">
             {isProcessing && action === 'download' && (
                <div className="no-print fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg text-center">
                        <SpinnerIcon className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-600" />
                        <p className="font-semibold">Generating PDF...</p>
                        <p className="text-sm text-gray-500 mt-1">Please wait, this may take a moment.</p>
                    </div>
                </div>
            )}
            <div className="no-print p-4 bg-white dark:bg-gray-900 shadow-md flex justify-between items-center sticky top-0 z-10">
                <button onClick={onClose} className="btn btn-secondary">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>
                <h2 className="font-semibold text-lg hidden md:block">{action === 'print' ? 'Printing' : 'Downloading'} {studentsToPrint.length} Report Cards</h2>
                <button onClick={() => window.print()} className="btn btn-primary">
                    <PrinterIcon className="w-5 h-5 mr-2" />
                    Print
                </button>
            </div>
            
            <div className="printable-content">
                {studentsToPrint.map((student) => {
                    const ReportCardComponent = getTemplateForStudent(student);
                    return (
                        <div key={student.id} className="page-break my-4 mx-auto bg-white report-card-page">
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