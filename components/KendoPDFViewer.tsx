import React, { useState, useRef } from 'react';
import { PDFExport } from '@progress/kendo-react-pdf';
import KendoReportCardPDF from './pdf/KendoReportCardPDF';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import PrinterIcon from './icons/PrinterIcon';
import EyeIcon from './icons/EyeIcon';
import XMarkIcon from './icons/XMarkIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';

interface KendoPDFViewerProps {
  reportData: {
    student: {
      name: string;
      class: string;
      admissionNo?: string;
    };
    schoolName?: string;
    session: string;
    term: string;
    subjects: Array<{
      name: string;
      ca1?: number;
      ca2?: number;
      exam?: number;
      total: number;
      grade: string;
    }>;
    totalScore?: number;
    maxScore?: number;
    average?: number;
    position?: number;
    totalStudents?: number;
    classTeacherRemark?: string;
    principalRemark?: string;
    attendance?: {
      present: number;
      absent: number;
      total: number;
    };
  };
  filename: string;
  title?: string;
  onClose?: () => void;
}

const KendoPDFViewer: React.FC<KendoPDFViewerProps> = ({
  reportData,
  filename,
  title = 'Report Card',
  onClose
}) => {
  const [showPreview, setShowPreview] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string>('');
  const pdfExportRef = useRef<PDFExport>(null);

  const handleExportPDF = async () => {
    if (!pdfExportRef.current) return;
    
    setIsExporting(true);
    setExportError('');
    
    try {
      await pdfExportRef.current.save();
    } catch (error: any) {
      console.error('PDF export failed:', error);
      setExportError(error.message || 'Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const showHelp = () => {
    const helpText = `
KendoReact PDF Export Features:

✓ High-quality PDF generation
✓ Precise control over layout and styling
✓ Support for complex tables and grids
✓ Professional document formatting
✓ Optimized for report cards and forms

Tips:
• Use "Export PDF" for best quality
• Print function uses browser's print dialog
• All content is optimized for A4 paper size
• Colors and fonts are preserved in PDF export
    `;
    alert(helpText);
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* Header Controls */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onClose && (
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                  title="Close"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                KendoReact PDF
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="btn btn-secondary"
                title="Toggle Preview"
              >
                <EyeIcon className="w-5 h-5 mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="btn btn-primary"
                title="Export as PDF"
              >
                {isExporting ? (
                  <SpinnerIcon className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                )}
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
              
              <button
                onClick={handlePrint}
                className="btn btn-secondary"
                title="Print Document"
              >
                <PrinterIcon className="w-5 h-5 mr-2" />
                Print
              </button>
              
              <button
                onClick={showHelp}
                className="btn btn-outline"
                title="Help"
              >
                <QuestionMarkCircleIcon className="w-5 h-5 mr-2" />
                Help
              </button>
            </div>
          </div>
          
          {exportError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{exportError}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {showPreview ? (
          /* Document Preview */
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-medium text-gray-900">Document Preview</h3>
              <p className="text-sm text-gray-600 mt-1">
                This preview shows how your report card will appear in the exported PDF
              </p>
            </div>
            <div className="p-4">
              <div className="max-w-4xl mx-auto">
                <PDFExport
                  ref={pdfExportRef}
                  fileName={`${filename}.pdf`}
                  title={title}
                  subject="Student Report Card"
                  keywords="report card, student, academic"
                  creator="ReportSheet"
                  paperSize="A4"
                  margin="20mm"
                  landscape={false}
                  repeatHeaders={true}
                  scale={0.8}
                >
                  <KendoReportCardPDF
                    student={{
                      name: reportData.student.name,
                      class: reportData.student.class,
                      admissionNo: reportData.student.admissionNo || 'N/A'
                    }}
                    schoolName={reportData.schoolName}
                    session={reportData.session}
                    term={reportData.term}
                    subjects={reportData.subjects}
                    totalScore={reportData.totalScore}
                    maxScore={reportData.maxScore}
                    average={reportData.average}
                    position={reportData.position}
                    totalStudents={reportData.totalStudents}
                    classTeacherRemark={reportData.classTeacherRemark}
                    principalRemark={reportData.principalRemark}
                    attendance={reportData.attendance}
                  />
                </PDFExport>
              </div>
            </div>
          </div>
        ) : (
          /* Document Info */
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center py-12">
              <EyeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {title} Ready for Export
              </h3>
              <p className="text-gray-500 mb-6">
                Your report card is ready to be exported as a high-quality PDF using KendoReact.
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Student:</span> {reportData.student.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Class:</span> {reportData.student.class}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Session:</span> {reportData.session}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Term:</span> {reportData.term}
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 max-w-md mx-auto">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">KendoReact PDF Features:</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Professional PDF generation</li>
                    <li>• Precise layout control</li>
                    <li>• High-quality output</li>
                    <li>• Optimized for printing</li>
                  </ul>
                </div>
                
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="btn btn-primary"
                  >
                    <EyeIcon className="w-5 h-5 mr-2" />
                    Show Preview
                  </button>
                  
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="btn btn-secondary"
                  >
                    {isExporting ? (
                      <SpinnerIcon className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    )}
                    {isExporting ? 'Exporting...' : 'Export PDF'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KendoPDFViewer;
