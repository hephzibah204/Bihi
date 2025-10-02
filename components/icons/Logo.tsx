import React from 'react';

const Logo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-gradient-inline" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--brand-color-primary)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--brand-color-secondary)' }} />
        </linearGradient>
      </defs>
      <path fill="url(#logo-gradient-inline)" d="M20,5 Q10,5 10,15 L10,85 Q10,95 20,95 L80,95 Q90,95 90,85 L90,35 L65,5 Z" />
      <path fill="#fff" opacity="0.3" d="M65,5 L65,35 L90,35 Z" />
      <text x="50" y="62" fontFamily="Inter, sans-serif" fontSize="40" fontWeight="800" fill="white" textAnchor="middle" dy=".3em">RS</text>
    </svg>
);

export default Logo;
