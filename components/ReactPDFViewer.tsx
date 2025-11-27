import React, { useState, useEffect } from 'react';
import { PDFDownloadLink, PDFViewer as ReactPDFViewer, pdf } from '@react-pdf/renderer';
import ReportCardPDF from './pdf/ReportCardPDF';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import PrinterIcon from './icons/PrinterIcon';
import EyeIcon from './icons/EyeIcon';
import XMarkIcon from './icons/XMarkIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface ReactPDFViewerProps {
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

const ReactPDFViewerComponent: React.FC<ReactPDFViewerProps> = ({
  reportData,
  filename,
  title = 'Report Card',
  onClose
}) => {
  const [showViewer, setShowViewer] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  const pdfDocument = (
    <ReportCardPDF
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
  );

  const generatePdfBlob = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const blob = await pdf(pdfDocument).toBlob();
      setPdfBlob(blob);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPdf = async () => {
    if (pdfBlob && pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      // Generate and download directly
      try {
        const blob = await pdf(pdfDocument).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err: any) {
        console.error('Direct download failed:', err);
        setError('Download failed: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const printPdf = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else {
      // Generate PDF and open in new window for printing
      pdf(pdfDocument).toBlob().then(blob => {
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url);
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }).catch(err => {
        console.error('Print failed:', err);
        setError('Print failed: ' + (err.message || 'Unknown error'));
      });
    }
  };

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

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
            </div>
            
            <div className="flex items-center space-x-2">
              {!showViewer && (
                <button
                  onClick={() => {
                    setShowViewer(true);
                    if (!pdfBlob) generatePdfBlob();
                  }}
                  disabled={isGenerating}
                  className="btn btn-secondary"
                  title="Show PDF Preview"
                >
                  {isGenerating ? (
                    <SpinnerIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                  {isGenerating ? 'Generating...' : 'Preview'}
                </button>
              )}
              
              {showViewer && (
                <button
                  onClick={() => setShowViewer(false)}
                  className="btn btn-secondary"
                  title="Hide Preview"
                >
                  Hide Preview
                </button>
              )}
              
              <PDFDownloadLink
                document={pdfDocument}
                fileName={`${filename}.pdf`}
                className="btn btn-primary"
              >
                {({ loading }) => (
                  <>
                    {loading ? (
                      <SpinnerIcon className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    )}
                    {loading ? 'Generating...' : 'Download'}
                  </>
                )}
              </PDFDownloadLink>
              
              <button
                onClick={printPdf}
                className="btn btn-secondary"
                title="Print PDF"
              >
                <PrinterIcon className="w-5 h-5 mr-2" />
                Print
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {showViewer ? (
          /* PDF Viewer */
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-medium text-gray-900">PDF Preview</h3>
            </div>
            <div className="p-4">
              <div className="w-full" style={{ height: '800px' }}>
                <ReactPDFViewer width="100%" height="100%">
                  {pdfDocument}
                </ReactPDFViewer>
              </div>
            </div>
          </div>
        ) : (
          /* Document Info */
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center py-12">
              <EyeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {title} Ready
              </h3>
              <p className="text-gray-500 mb-6">
                Your report card has been generated and is ready for download or preview.
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
                
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowViewer(true);
                      if (!pdfBlob) generatePdfBlob();
                    }}
                    disabled={isGenerating}
                    className="btn btn-primary"
                  >
                    {isGenerating ? (
                      <SpinnerIcon className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <EyeIcon className="w-5 h-5 mr-2" />
                    )}
                    {isGenerating ? 'Generating...' : 'Preview PDF'}
                  </button>
                  
                  <PDFDownloadLink
                    document={pdfDocument}
                    fileName={`${filename}.pdf`}
                    className="btn btn-secondary"
                  >
                    {({ loading }) => (
                      <>
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                        {loading ? 'Preparing...' : 'Download'}
                      </>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactPDFViewerComponent;
