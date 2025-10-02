import React from 'react';

interface PDFViewerProps {
    file: string; // URL or base64 string
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file }) => {
    return (
        <div className="w-full h-full">
            <iframe src={file} width="100%" height="100%" title="PDF Viewer">
                This browser does not support PDFs. Please download the PDF to view it.
            </iframe>
        </div>
    );
};

export default PDFViewer;
