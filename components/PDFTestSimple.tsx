import React from 'react';
import PDFViewer from './PDFViewer';

const PDFTestSimple: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">PDF Generation Test - Simple Version</h1>
        <p className="text-gray-600 mb-8">
          This test uses only basic HTML and CSS to avoid compatibility issues.
        </p>
        
        <PDFViewer
          elementId="simple-test-content"
          filename="simple-test-document"
          title="Simple Test Document"
          showPreview={true}
        >
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            fontFamily: 'Arial, sans-serif',
            color: 'black',
            lineHeight: '1.4'
          }}>
            <h1 style={{ textAlign: 'center', marginBottom: '20px', color: 'black' }}>
              SIMPLE TEST DOCUMENT
            </h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <p><strong>Student Name:</strong> Test Student</p>
                <p><strong>Class:</strong> Test Class</p>
                <p><strong>ID:</strong> TEST001</p>
              </div>
              <div>
                <p><strong>Session:</strong> 2023/2024</p>
                <p><strong>Term:</strong> Test Term</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              marginBottom: '20px',
              border: '1px solid #ccc'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left', color: 'black' }}>Subject</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', color: 'black' }}>Score</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', color: 'black' }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #ccc', padding: '8px', color: 'black' }}>Mathematics</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', color: 'black' }}>85</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', color: 'black' }}>A</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #ccc', padding: '8px', color: 'black' }}>English</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', color: 'black' }}>78</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', color: 'black' }}>B</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #ccc', padding: '8px', color: 'black' }}>Science</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', color: 'black' }}>92</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', color: 'black' }}>A</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'black' }}>
                <p><strong>Total Score:</strong> 255/300</p>
                <p><strong>Average:</strong> 85%</p>
              </div>
              <div style={{ color: 'black' }}>
                <p><strong>Position:</strong> 3rd out of 30</p>
                <p><strong>Grade:</strong> A</p>
              </div>
            </div>

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <p style={{ color: 'black', fontSize: '12px' }}>
                Generated on {new Date().toLocaleDateString()} - This is a test document
              </p>
            </div>
          </div>
        </PDFViewer>
      </div>
    </div>
  );
};

export default PDFTestSimple;
