import React, { useEffect, useState } from 'react';
import { Student, SchoolSettings } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PrinterIcon from './icons/PrinterIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { sanitizeFilename } from '../utils/pdfUtils';

// Import all templates
import BasicPortrait from './id-cards/BasicIDCard';
import ClassicIDCard from './id-cards/ClassicIDCard';
import ModernIDCard from './id-cards/ModernIDCard';

const templates = {
    'basic': BasicPortrait,
    'classic': ClassicIDCard,
    'modern': ModernIDCard,
};

interface BulkIDCardPrintViewProps {
    studentIds: string[];
    students: Student[];
    settings: SchoolSettings;
    templateKey: string;
    action: 'print' | 'download';
    onClose: () => void;
}

const BulkIDCardPrintView: React.FC<BulkIDCardPrintViewProps> = ({ studentIds, students, settings, templateKey, action, onClose }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (action === 'print') {
            const timer = setTimeout(() => window.print(), 500);
            return () => clearTimeout(timer);
        }
        if (action === 'download') {
            const timer = setTimeout(() => handleDownload(), 200);
            return () => clearTimeout(timer);
        }
    }, [action]);

    const handleDownload = async () => {
        setIsProcessing(true);
        try {
            const w = window as any;
            const { html2canvas, jspdf } = w;
            if (!html2canvas || !jspdf) {
                alert('PDF export library not loaded. Please try again.');
                setIsProcessing(false);
                return;
            }
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const A4_WIDTH = 210;
            const A4_HEIGHT = 297;

            const cards = Array.from(document.querySelectorAll('.page-break-inside-avoid')) as HTMLElement[];
            if (!cards.length) {
                // Fallback: capture the whole container if individual cards are not found
                const container = document.querySelector('.printable-content') as HTMLElement | null;
                if (!container) {
                    alert('No ID cards to download.');
                    setIsProcessing(false);
                    return;
                }
                const canvas = await html2canvas(container, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');
                pdf.save(sanitizeFilename('id-cards') + '.pdf');
                setIsProcessing(false);
                onClose();
                return;
            }

            for (let i = 0; i < cards.length; i++) {
                const canvas = await html2canvas(cards[i], { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');
            }

            pdf.save(sanitizeFilename('id-cards') + '.pdf');
        } finally {
            setIsProcessing(false);
            onClose();
        }
    };

    const studentsToPrint = students.filter(s => studentIds.includes(s.id));
    const TemplateComponent = templates[templateKey];

    if (!TemplateComponent) {
        return <div>Error: Invalid template selected.</div>;
    }

    return (
        <div className="bg-gray-200">
            {isProcessing && action === 'download' && (
                <div className="no-print fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg text-center">
                        <SpinnerIcon className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-600" />
                        <p className="font-semibold">Generating PDF...</p>
                        <p className="text-sm text-gray-500 mt-1">Please wait, this may take a moment.</p>
                    </div>
                </div>
            )}
            <div className="no-print p-4 bg-white shadow-md flex justify-between items-center sticky top-0 z-10">
                <button onClick={onClose} className="btn btn-secondary">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to Generator
                </button>
                <button onClick={() => window.print()} className="btn btn-primary">
                    <PrinterIcon className="w-5 h-5 mr-2" />
                    Print
                </button>
            </div>
            <div className="printable-content grid grid-cols-3 gap-4 p-4">
                {studentsToPrint.map(student => (
                    <div key={student.id} className="page-break-inside-avoid">
                        <TemplateComponent student={student} schoolSettings={settings} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BulkIDCardPrintView;