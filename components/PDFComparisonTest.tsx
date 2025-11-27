import React from 'react';
import MultiPDFViewer from './MultiPDFViewer';

const PDFComparisonTest: React.FC = () => {
  const sampleReportData = {
    student: {
      name: 'John Doe',
      class: 'JSS 1A',
      admissionNo: 'BSA/001'
    },
    schoolName: 'BRIGHTSTAR ACADEMY',
    session: '2023/2024',
    term: 'First Term',
    subjects: [
      {
        name: 'Mathematics',
        ca1: 18,
        ca2: 17,
        exam: 45,
        total: 80,
        grade: 'A'
      },
      {
        name: 'English Language',
        ca1: 16,
        ca2: 18,
        exam: 41,
        total: 75,
        grade: 'A'
      },
      {
        name: 'Physics',
        ca1: 15,
        ca2: 16,
        exam: 39,
        total: 70,
        grade: 'B'
      },
      {
        name: 'Chemistry',
        ca1: 17,
        ca2: 15,
        exam: 38,
        total: 70,
        grade: 'B'
      },
      {
        name: 'Biology',
        ca1: 19,
        ca2: 18,
        exam: 43,
        total: 80,
        grade: 'A'
      }
    ],
    totalScore: 375,
    maxScore: 500,
    average: 75,
    position: 5,
    totalStudents: 45,
    classTeacherRemark: 'Excellent performance. John shows great understanding of all subjects and maintains consistent effort. Keep up the good work!',
    principalRemark: 'Outstanding academic achievement. John is a role model for other students. Continue to strive for excellence.',
    attendance: {
      present: 85,
      absent: 5,
      total: 90
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              PDF Generation Comparison Test
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Compare different PDF generation methods for report cards
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">React PDF</h3>
                <p className="text-sm text-green-800">
                  Declarative PDF generation with React components. Best for professional documents.
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Recommended
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">KendoReact PDF</h3>
                <p className="text-sm text-blue-800">
                  Enterprise-grade PDF export with advanced features and commercial support.
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Enterprise
                  </span>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">HTML to PDF</h3>
                <p className="text-sm text-yellow-800">
                  Convert existing HTML/CSS to PDF with multiple fallback methods.
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Fallback
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MultiPDFViewer
        reportData={sampleReportData}
        filename="test-report-card"
        title="Test Report Card - PDF Comparison"
        onClose={() => window.history.back()}
      />
    </div>
  );
};

export default PDFComparisonTest;
