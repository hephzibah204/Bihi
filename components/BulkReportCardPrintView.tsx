

import React, { useEffect, useState } from 'react';
import { getReportCardTemplate } from '../utils/reportCardHelper';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PrinterIcon from './icons/PrinterIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import ClassicReportCard from './report-templates/ClassicReportCard';
import ModernReportCard from './report-templates/ModernReportCard';
import MinimalistReportCard from './report-templates/MinimalistReportCard';
import SpinnerIcon from './icons/SpinnerIcon';
import '../styles/report-card.css';
import { sanitizeFilename, downloadElementsAsPdf } from '../utils/pdfUtils';

const BulkReportCardPrintView = ({ studentIds, allData, onClose, action, templateKey = 'auto', sessionOverride, termOverride }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false;
    const silentMode = action === 'download' || action === 'print';
    
    const handleDownload = async () => {
        setIsProcessing(true);
        // Ensure offscreen content is temporarily visible for capture
        const container = document.querySelector('.printable-content') as HTMLElement | null;
        const hadOffscreen = !!container && container.classList.contains('offscreen');
        if (hadOffscreen) {
            container.classList.remove('offscreen');
        }
        // Determine filename: if all selected students share one class, use that; otherwise generic
        const uniqueClasses: string[] = Array.from(new Set(studentsToPrint.map((s: any) => s.class))).filter(Boolean) as string[];
        const baseName: string = uniqueClasses.length === 1 ? uniqueClasses[0] : 'report-cards';
        await downloadElementsAsPdf('.page-break', sanitizeFilename(baseName));
        // Restore offscreen state
        if (hadOffscreen && container) {
            container.classList.add('offscreen');
        }
        setIsProcessing(false);
        if (silentMode && typeof onClose === 'function') {
            onClose();
        }
    };
    
    useEffect(() => {
        if (!action) return;
        if (action === 'download') {
            setTimeout(() => { handleDownload(); }, 50);
        } else if (action === 'print') {
            const container = document.querySelector('.printable-content') as HTMLElement | null;
            const hadOffscreen = !!container && container.classList.contains('offscreen');
            if (hadOffscreen) {
                container.classList.remove('offscreen');
            }
            setTimeout(() => {
                window.print();
                setTimeout(() => {
                    if (hadOffscreen && container) {
                        container.classList.add('offscreen');
                    }
                    if (silentMode && typeof onClose === 'function') {
                        onClose();
                    }
                }, 300);
            }, 50);
        }
    }, [action]);

    const studentsToPrint = allData.allStudents.filter(s => studentIds.includes(s.id));
    const effectiveSession = sessionOverride || allData?.settings?.session;
    const effectiveTerm = termOverride || allData?.settings?.term;

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
             {isProcessing && (
                <div className="no-print fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg text-center">
                        <SpinnerIcon className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-600" />
                        <p className="font-semibold">Generating PDF...</p>
                        <p className="text-sm text-gray-500 mt-1">Please wait, this may take a moment.</p>
                    </div>
                </div>
            )}
            {!silentMode && (
            <div className="no-print p-4 bg-white dark:bg-gray-900 shadow-md flex justify-between items-center sticky top-0 z-10">
                <button onClick={onClose} className="btn btn-secondary">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>
                <h2 className="font-semibold text-lg hidden md:block">Previewing {studentsToPrint.length} Report Cards</h2>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="btn btn-secondary">
                        <PrinterIcon className="w-5 h-5 mr-2" />
                        Print
                    </button>
                    <button onClick={handleDownload} className="btn btn-primary">
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                        Download
                    </button>
                </div>
            </div>
            )}
            
            {/* Mobile hint: we disable visible preview but keep print/download working */}
            {isMobile && (
                <div className="no-print p-3 text-center text-xs text-gray-600">
                    Preview disabled on mobile. Use Download/Print buttons above.
                </div>
            )}
            {/* Empty-state and validation */}
            {studentsToPrint.length === 0 ? (
                <div className="card m-4 p-6 text-center text-gray-600">
                    No students selected. Go back and pick at least one student.
                </div>
            ) : (!effectiveSession || !effectiveTerm) ? (
                <div className="card m-4 p-6 text-center text-gray-600">
                    Missing session or term. Please set both before printing.
                </div>
            ) : (
            <div className={(isMobile || silentMode) ? "printable-content offscreen" : "printable-content"}>
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
                                term={effectiveTerm}
                                session={effectiveSession}
                                remarks={allData.remarks}
                                attendance={allData.attendance}
                            />}
                        </div>
                    );
                })}
            </div>
            )}
        </div>
    );
};

export default BulkReportCardPrintView;