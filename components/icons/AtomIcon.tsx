import React from 'react';

const AtomIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-6h6m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default AtomIcon;