import React from 'react';

const MathIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-6h6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6.375l-9 11.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6.375l9 11.25" />
  </svg>
);

export default MathIcon;