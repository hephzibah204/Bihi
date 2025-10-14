import React, { useEffect } from 'react';
import { Student, SchoolSettings } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PrinterIcon from './icons/PrinterIcon';

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
    onClose: () => void;
}

const BulkIDCardPrintView: React.FC<BulkIDCardPrintViewProps> = ({ studentIds, students, settings, templateKey, onClose }) => {
    
    useEffect(() => {
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }, []);

    const studentsToPrint = students.filter(s => studentIds.includes(s.id));
    const TemplateComponent = templates[templateKey];

    if (!TemplateComponent) {
        return <div>Error: Invalid template selected.</div>;
    }

    return (
        <div className="bg-gray-200">
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