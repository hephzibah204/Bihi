import React from 'react';

const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="8" r="3" />
    <path d="M4 20a8 8 0 0116 0H4z" />
  </svg>
);

export default UserCircleIcon;