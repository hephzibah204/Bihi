import React from 'react';

const ReportCardFooter = () => {
  return (
    <div className="mt-8 pt-4 border-t-2 border-gray-300 flex justify-between text-xs">
      <div>
        <p className="font-bold">_________________________</p>
        <p className="mt-1">Principal's Signature</p>
      </div>
      <div>
        <p className="font-bold">_________________________</p>
        <p className="mt-1">Class Teacher's Signature</p>
      </div>
    </div>
  );
};

export default ReportCardFooter;
