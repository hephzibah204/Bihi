import React, { useState } from 'react';
import ReactPDFViewerComponent from './ReactPDFViewer';
import KendoPDFViewer from './KendoPDFViewer';
import PDFViewer from './PDFViewer';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import XMarkIcon from './icons/XMarkIcon';

interface MultiPDFViewerProps {
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

type PDFMethod = 'react-pdf' | 'kendo' | 'html2canvas';

const MultiPDFViewer: React.FC<MultiPDFViewerProps> = ({
  reportData,
  filename,
  title = 'Report Card',
  onClose
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PDFMethod>('react-pdf');

  const pdfMethods = [
    {
      id: 'react-pdf' as PDFMethod,
      name: 'React PDF',
      description: 'Declarative PDF generation with React components',
      features: ['Precise layout control', 'Professional styling', 'Vector-based output', 'Small file sizes'],
      badge: 'Recommended',
      badgeColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'kendo' as PDFMethod,
      name: 'KendoReact PDF',
      description: 'Enterprise-grade PDF export with advanced features',
      features: ['High-quality output', 'Complex layouts', 'Commercial support', 'Advanced templates'],
      badge: 'Enterprise',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'html2canvas' as PDFMethod,
      name: 'HTML to PDF',
      description: 'Convert existing HTML/CSS to PDF (with fallbacks)',
      features: ['Preserves styling', 'Multiple fallbacks', 'Browser compatible', 'CSS support'],
      badge: 'Fallback',
      badgeColor: 'bg-yellow-100 text-yellow-800'
    }
  ];

  const renderPDFViewer = () => {
    switch (selectedMethod) {
      case 'react-pdf':
        return (
          <ReactPDFViewerComponent
            reportData={reportData}
            filename={filename}
            title={title}
            onClose={onClose}
          />
        );
      case 'kendo':
        return (
          <KendoPDFViewer
            reportData={reportData}
            filename={filename}
            title={title}
            onClose={onClose}
          />
        );
      case 'html2canvas':
        return (
          <PDFViewer
            elementId="html-report-content"
            filename={filename}
            title={title}
            onClose={onClose}
            showPreview={true}
          >
            <div className="report-card-page bg-white p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {reportData.schoolName?.toUpperCase() || 'SCHOOL NAME'}
                </h1>
                <p className="text-gray-600 font-semibold">Student Report Card</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p><strong>Student Name:</strong> {reportData.student.name}</p>
                  <p><strong>Class:</strong> {reportData.student.class}</p>
                  <p><strong>Admission No:</strong> {reportData.student.admissionNo || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Session:</strong> {reportData.session}</p>
                  <p><strong>Term:</strong> {reportData.term}</p>
                  <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <table className="w-full border-collapse border border-gray-300 mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Subject</th>
                    {reportData.subjects[0]?.ca1 !== undefined && (
                      <th className="border border-gray-300 p-2 text-center">CA1</th>
                    )}
                    {reportData.subjects[0]?.ca2 !== undefined && (
                      <th className="border border-gray-300 p-2 text-center">CA2</th>
                    )}
                    {reportData.subjects[0]?.exam !== undefined && (
                      <th className="border border-gray-300 p-2 text-center">Exam</th>
                    )}
                    <th className="border border-gray-300 p-2 text-center">Total</th>
                    <th className="border border-gray-300 p-2 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.subjects.map((subject, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">{subject.name}</td>
                      {subject.ca1 !== undefined && (
                        <td className="border border-gray-300 p-2 text-center">{subject.ca1}</td>
                      )}
                      {subject.ca2 !== undefined && (
                        <td className="border border-gray-300 p-2 text-center">{subject.ca2}</td>
                      )}
                      {subject.exam !== undefined && (
                        <td className="border border-gray-300 p-2 text-center">{subject.exam}</td>
                      )}
                      <td className="border border-gray-300 p-2 text-center font-bold">{subject.total}</td>
                      <td className="border border-gray-300 p-2 text-center font-bold">{subject.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(reportData.totalScore || reportData.average || reportData.position) && (
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded">
                  {reportData.totalScore && reportData.maxScore && (
                    <div className="text-center">
                      <p className="font-semibold">Total Score</p>
                      <p className="text-lg font-bold">{reportData.totalScore}/{reportData.maxScore}</p>
                    </div>
                  )}
                  {reportData.average && (
                    <div className="text-center">
                      <p className="font-semibold">Average</p>
                      <p className="text-lg font-bold">{reportData.average.toFixed(1)}%</p>
                    </div>
                  )}
                  {reportData.position && reportData.totalStudents && (
                    <div className="text-center">
                      <p className="font-semibold">Position</p>
                      <p className="text-lg font-bold">{reportData.position}/{reportData.totalStudents}</p>
                    </div>
                  )}
                </div>
              )}

              {(reportData.classTeacherRemark || reportData.principalRemark) && (
                <div className="mb-6 p-4 bg-gray-50 rounded">
                  {reportData.classTeacherRemark && (
                    <div className="mb-4">
                      <p className="font-semibold mb-2">Class Teacher's Remark:</p>
                      <p>{reportData.classTeacherRemark}</p>
                    </div>
                  )}
                  {reportData.principalRemark && (
                    <div>
                      <p className="font-semibold mb-2">Principal's Remark:</p>
                      <p>{reportData.principalRemark}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <div className="text-center">
                  <div className="border-t border-gray-400 w-32 mx-auto mb-1"></div>
                  <p className="text-sm">Class Teacher</p>
                </div>
                <div className="text-center">
                  <div className="border-t border-gray-400 w-32 mx-auto mb-1"></div>
                  <p className="text-sm">Principal</p>
                </div>
              </div>
            </div>
          </PDFViewer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* Method Selection Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {onClose && (
                <button onClick={onClose} className="btn btn-secondary">
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  Back
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                {title} - PDF Generation
              </h1>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pdfMethods.map((method) => (
              <div
                key={method.id}
                className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedMethod === method.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{method.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${method.badgeColor}`}>
                    {method.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  {method.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
                {selectedMethod === method.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                      <XMarkIcon className="w-3 h-3 text-white rotate-45" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected PDF Viewer */}
      {renderPDFViewer()}
    </div>
  );
};

export default MultiPDFViewer;
