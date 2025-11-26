import React, { useState, useEffect } from 'react';
import { getReportCardTemplate } from '../utils/reportCardHelper';
import PDFViewer from './PDFViewer';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ClassicReportCard from './report-templates/ClassicReportCard';
import ModernReportCard from './report-templates/ModernReportCard';
import MinimalistReportCard from './report-templates/MinimalistReportCard';
import '../styles/report-card.css';

interface BulkReportCardPrintViewerProps {
  studentIds: string[];
  allData: any;
  onClose: () => void;
  templateKey?: string;
  sessionOverride?: string;
  termOverride?: string;
}

const BulkReportCardPrintViewer: React.FC<BulkReportCardPrintViewerProps> = ({
  studentIds,
  allData,
  onClose,
  templateKey = 'auto',
  sessionOverride,
  termOverride
}) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure data is ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing report cards...</p>
        </div>
      </div>
    );
  }

  const studentsToPrint = allData.allStudents?.filter((s: any) => studentIds.includes(s.id)) || [];
  const effectiveSession = sessionOverride || allData?.settings?.session;
  const effectiveTerm = termOverride || allData?.settings?.term;

  const getTemplateForStudent = (student: any) => {
    if (templateKey && templateKey !== 'auto') {
      if (templateKey === 'modern') return ModernReportCard;
      if (templateKey === 'classic') return ClassicReportCard;
      if (templateKey === 'minimalist') return MinimalistReportCard;
    }
    return getReportCardTemplate(student.class, allData.settings);
  };

  // Generate filename based on selection
  const uniqueClasses = Array.from(new Set(studentsToPrint.map((s: any) => s.class))).filter(Boolean);
  const baseName = uniqueClasses.length === 1 ? uniqueClasses[0] : 'report-cards';
  const filename = `${baseName}-${effectiveSession}-${effectiveTerm}`.replace(/\s+/g, '-');

  if (studentsToPrint.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">No Students Selected</h2>
            <p className="text-gray-500 mb-6">Please go back and select at least one student to generate report cards.</p>
            <button onClick={onClose} className="btn btn-primary">
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!effectiveSession || !effectiveTerm) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Missing Information</h2>
            <p className="text-gray-500 mb-6">Please ensure both session and term are set before generating report cards.</p>
            <button onClick={onClose} className="btn btn-primary">
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={onClose} className="btn btn-secondary">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Bulk Report Cards ({studentsToPrint.length} students)
                </h1>
                <p className="text-sm text-gray-500">
                  {effectiveSession} • {effectiveTerm} • Template: {templateKey === 'auto' ? 'Auto' : templateKey}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <PDFViewer
        elementId="bulk-report-cards-content"
        filename={filename}
        title={`Bulk Report Cards - ${studentsToPrint.length} students`}
        onClose={onClose}
        showPreview={false} // Don't show preview by default for bulk (too heavy)
      >
        <div className="bulk-report-cards">
          {studentsToPrint.map((student: any, index: number) => {
            const ReportCardComponent = getTemplateForStudent(student);
            return (
              <div key={student.id} className={`page-break bg-white report-card-page ${index > 0 ? 'mt-4' : ''}`}>
                {ReportCardComponent && (
                  <ReportCardComponent 
                    student={student}
                    students={allData.allStudents}
                    scores={allData.scores}
                    subjects={allData.subjects}
                    settings={allData.settings}
                    term={effectiveTerm}
                    session={effectiveSession}
                    remarks={allData.remarks}
                    attendance={allData.attendance}
                  />
                )}
              </div>
            );
          })}
        </div>
      </PDFViewer>
    </div>
  );
};

export default BulkReportCardPrintViewer;
