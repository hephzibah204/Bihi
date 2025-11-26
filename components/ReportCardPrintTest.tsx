import React from 'react';
import PDFViewer from './PDFViewer';

const ReportCardPrintTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PDFViewer
        elementId="test-report-card"
        filename="test-report-card"
        title="Test Report Card"
        showPreview={true}
      >
        <div className="report-card-page bg-white p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">BRIGHTSTAR ACADEMY</h1>
            <p className="text-gray-600">Student Report Card</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p><strong>Student Name:</strong> John Doe</p>
              <p><strong>Class:</strong> JSS 1A</p>
              <p><strong>Admission No:</strong> BSA/001</p>
            </div>
            <div>
              <p><strong>Session:</strong> 2023/2024</p>
              <p><strong>Term:</strong> First Term</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Subject</th>
                <th className="border border-gray-300 p-2 text-center">CA1</th>
                <th className="border border-gray-300 p-2 text-center">CA2</th>
                <th className="border border-gray-300 p-2 text-center">Exam</th>
                <th className="border border-gray-300 p-2 text-center">Total</th>
                <th className="border border-gray-300 p-2 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">Mathematics</td>
                <td className="border border-gray-300 p-2 text-center">18</td>
                <td className="border border-gray-300 p-2 text-center">17</td>
                <td className="border border-gray-300 p-2 text-center">45</td>
                <td className="border border-gray-300 p-2 text-center">80</td>
                <td className="border border-gray-300 p-2 text-center">A</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">English Language</td>
                <td className="border border-gray-300 p-2 text-center">16</td>
                <td className="border border-gray-300 p-2 text-center">18</td>
                <td className="border border-gray-300 p-2 text-center">41</td>
                <td className="border border-gray-300 p-2 text-center">75</td>
                <td className="border border-gray-300 p-2 text-center">A</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">Physics</td>
                <td className="border border-gray-300 p-2 text-center">15</td>
                <td className="border border-gray-300 p-2 text-center">16</td>
                <td className="border border-gray-300 p-2 text-center">39</td>
                <td className="border border-gray-300 p-2 text-center">70</td>
                <td className="border border-gray-300 p-2 text-center">B</td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Total Score:</strong> 225/300</p>
              <p><strong>Average:</strong> 75%</p>
              <p><strong>Position:</strong> 5th out of 45</p>
            </div>
            <div>
              <p><strong>Class Teacher's Remark:</strong></p>
              <p className="text-sm">Excellent performance. Keep it up!</p>
            </div>
          </div>

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
    </div>
  );
};

export default ReportCardPrintTest;
