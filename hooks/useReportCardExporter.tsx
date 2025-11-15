import { useState, useRef } from 'react';
import { sanitizeFilename, downloadElementAsPdf } from '../utils/pdfUtils';

// Ensure jspdf types are available if you have @types/jspdf
// For CDN usage, we can declare them on the window object
declare global {
    interface Window {
        html2canvas: any;
        jspdf: any;
    }
}

export const useReportCardExporter = () => {
    const [exporting, setExporting] = useState(false);
    const cancelledRef = useRef(false);

    const exportToPDF = async (elementId: string, fileName: string = 'document') => {
        const element = document.getElementById(elementId);
        if (!element) {
            return;
        }
        cancelledRef.current = false;
        setExporting(true);
        try {
            await downloadElementAsPdf(element, sanitizeFilename(fileName));
        } finally {
            setExporting(false);
        }
    };

    const cancelExport = () => {
        cancelledRef.current = true;
        setExporting(false);
    };

    return { exporting, exportToPDF, cancelExport };
};
