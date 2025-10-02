import React from 'react';

const TrophyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.006 9.006 0 01-5.183-1.683.75.75 0 01.385-1.393A10.5 10.5 0 0112 15c2.47 0 4.801.72 6.798 2.064a.75.75 0 01.385 1.393A9.006 9.006 0 0116.5 18.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75V3m0 0L9 6m3-3l3 6m-3-6h6a9 9 0 019 9v1.5a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25V18a2.25 2.25 0 00-2.25-2.25h-1.5a2.25 2.25 0 00-2.25 2.25V21a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 21v-1.5a9 9 0 019-9h6" />
  </svg>
);

export default TrophyIcon;