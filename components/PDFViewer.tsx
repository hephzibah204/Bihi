import React, { useState, useEffect, useRef } from 'react';
import { downloadElementAsPdf, renderElementAsPdfBlob } from '../utils/pdfUtils';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import PrinterIcon from './icons/PrinterIcon';
import EyeIcon from './icons/EyeIcon';
import XMarkIcon from './icons/XMarkIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface PDFViewerProps {
  elementId: string;
  filename: string;
  title?: string;
  onClose?: () => void;
  showPreview?: boolean;
  children: React.ReactNode;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  elementId,
  filename,
  title = 'Document',
  onClose,
  showPreview = true,
  children
}) => {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generatePDF = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Content element not found');
      }

      const blob = await renderElementAsPdfBlob(element);
      if (!blob) {
        throw new Error('Failed to generate PDF');
      }

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

  const downloadPDF = async () => {
    if (pdfBlob && pdfUrl) {
      // Use existing blob for download
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      // Fallback to direct download
      await downloadElementAsPdf(`#${elementId}`, filename);
    }
  };

  const printDocument = () => {
    const element = document.getElementById(elementId);
    if (element) {
      // Temporarily make element visible for printing
      const hadOffscreen = element.classList.contains('offscreen');
      if (hadOffscreen) {
        element.classList.remove('offscreen');
      }
      
      window.print();
      
      // Restore after print dialog
      setTimeout(() => {
        if (hadOffscreen) {
          element.classList.add('offscreen');
        }
      }, 500);
    } else {
      window.print();
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
              {!showPdfViewer && (
                <button
                  onClick={generatePDF}
                  disabled={isGenerating}
                  className="btn btn-secondary"
                  title="Generate PDF Preview"
                >
                  {isGenerating ? (
                    <SpinnerIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                  {isGenerating ? 'Generating...' : 'PDF Preview'}
                </button>
              )}
              
              {pdfUrl && (
                <button
                  onClick={() => setShowPdfViewer(!showPdfViewer)}
                  className={`btn ${showPdfViewer ? 'btn-primary' : 'btn-secondary'}`}
                  title="Toggle PDF Viewer"
                >
                  <EyeIcon className="w-5 h-5 mr-2" />
                  {showPdfViewer ? 'Hide PDF' : 'Show PDF'}
                </button>
              )}
              
              <button
                onClick={downloadPDF}
                className="btn btn-primary"
                title="Download PDF"
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Download
              </button>
              
              <button
                onClick={printDocument}
                className="btn btn-secondary"
                title="Print Document"
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
        {showPdfViewer && pdfUrl ? (
          /* PDF Viewer */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PDF Preview */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-medium text-gray-900">PDF Preview</h3>
              </div>
              <div className="p-4">
                <div className="w-full h-96 border rounded">
                  <iframe
                    ref={iframeRef}
                    src={pdfUrl}
                    className="w-full h-full rounded"
                    title="PDF Preview"
                  />
                </div>
                <div className="mt-4 flex justify-center space-x-2">
                  <button
                    onClick={downloadPDF}
                    className="btn btn-primary"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </a>
                </div>
              </div>
            </div>

            {/* Document Preview */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-medium text-gray-900">Document Preview</h3>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="transform scale-75 origin-top-left">
                  {children}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Document Only View */
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col items-center">
              {showPreview && (
                <div className="w-full max-w-4xl mb-6">
                  {children}
                </div>
              )}
              
              {!showPreview && (
                <div className="text-center py-12">
                  <EyeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Document Ready
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Click "PDF Preview" to generate and view the PDF, or download directly.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={generatePDF}
                      disabled={isGenerating}
                      className="btn btn-primary"
                    >
                      {isGenerating ? (
                        <SpinnerIcon className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <EyeIcon className="w-5 h-5 mr-2" />
                      )}
                      {isGenerating ? 'Generating...' : 'Generate PDF'}
                    </button>
                    <button
                      onClick={downloadPDF}
                      className="btn btn-secondary"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden element for PDF generation */}
      <div id={elementId} className="offscreen">
        {children}
      </div>
    </div>
  );
};

export default PDFViewer;