import React from 'react';

const PrinterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0a.225.225 0 01.225 0l1.757 1.757a.225.225 0 010 .225l-1.757 1.757a.225.225 0 01-.225 0l-1.757-1.757a.225.225 0 010-.225l1.757-1.757zM6.34 18a2.25 2.25 0 01.225 0l1.757 1.757a.225.225 0 010 .225l-1.757 1.757a.225.225 0 01-.225 0l-1.757-1.757a.225.225 0 010-.225l1.757-1.757z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18h12a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v9.75A2.25 2.25 0 006 18z" />
  </svg>
);

export default PrinterIcon;