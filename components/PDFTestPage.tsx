import React from 'react';
import PDFViewer from './PDFViewer';

const PDFTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">PDF Generation Test</h1>
        <p className="text-gray-600 mb-8">
          This page tests PDF generation with modern CSS colors that might cause issues.
        </p>
        
        <PDFViewer
          elementId="test-content"
          filename="test-document"
          title="Test Document"
          showPreview={true}
        >
          <div className="report-card-page bg-white p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Test Document</h1>
              <p className="text-indigo-600">Testing modern CSS colors</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="text-gray-900 font-semibold mb-2">Gray Colors</h3>
                <p className="text-gray-600">This is gray-600 text</p>
                <p className="text-gray-500">This is gray-500 text</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded">
                <h3 className="text-indigo-900 font-semibold mb-2">Indigo Colors</h3>
                <p className="text-indigo-600">This is indigo-600 text</p>
                <p className="text-indigo-500">This is indigo-500 text</p>
              </div>
            </div>

            <table className="w-full border-collapse border border-gray-300 mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left text-gray-900">Column 1</th>
                  <th className="border border-gray-300 p-2 text-left text-gray-900">Column 2</th>
                  <th className="border border-gray-300 p-2 text-left text-gray-900">Column 3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 text-gray-600">Row 1, Col 1</td>
                  <td className="border border-gray-300 p-2 text-gray-600">Row 1, Col 2</td>
                  <td className="border border-gray-300 p-2 text-indigo-600">Row 1, Col 3</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-gray-600">Row 2, Col 1</td>
                  <td className="border border-gray-300 p-2 text-gray-600">Row 2, Col 2</td>
                  <td className="border border-gray-300 p-2 text-indigo-600">Row 2, Col 3</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between items-center">
              <div className="text-gray-500">
                <p>Generated: {new Date().toLocaleDateString()}</p>
              </div>
              <div className="bg-indigo-600 text-white px-4 py-2 rounded">
                <p>Status: Ready</p>
              </div>
            </div>
          </div>
        </PDFViewer>
      </div>
    </div>
  );
};

export default PDFTestPage;
