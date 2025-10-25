import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const UserMinusIcon: React.FC<IconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

export default UserMinusIcon;
