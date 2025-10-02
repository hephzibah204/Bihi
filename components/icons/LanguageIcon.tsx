import React from 'react';

const LanguageIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h6m-6.375 0l-3.375-7.125-3.375 7.125M3 3h18" />
  </svg>
);

export default LanguageIcon;