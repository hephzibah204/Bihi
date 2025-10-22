import React from 'react';

const ReportCardFooter = ({ principalName }) => {
  return (
    <div className="mt-10 pt-6 border-t border-gray-300 grid grid-cols-2 gap-8 text-sm">
      <div>
        <div className="h-10 border-b border-gray-400"></div>
        <p className="mt-2 text-gray-700">{principalName || "Principal's Signature"}</p>
      </div>
      <div>
        <div className="h-10 border-b border-gray-400"></div>
        <p className="mt-2 text-gray-700">Class Teacher's Signature</p>
      </div>
    </div>
  );
};

export default ReportCardFooter;