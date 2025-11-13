import { useState } from 'react';
import { sanitizeFilename } from '../utils/pdfUtils';

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

    const exportToPDF = (elementId: string, fileName: string = 'document') => {
        const element = document.getElementById(elementId);
        if (!element) {
            return;
        }

        setExporting(true);
        
        const { html2canvas, jspdf } = window;
        if (!html2canvas || !jspdf) {
            setExporting(false);
            return;
        }
        const { jsPDF } = jspdf;

        html2canvas(element, { scale: 2 })
            .then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                try {
                    const blob = pdf.output('blob');
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = sanitizeFilename(fileName) + '.pdf';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                } catch (e) {
                    try { pdf.save(sanitizeFilename(fileName) + '.pdf'); } catch {}
                }
            })
            .catch(() => {
            })
            .finally(() => {
                setExporting(false);
            });
    };

    return { exporting, exportToPDF };
};
