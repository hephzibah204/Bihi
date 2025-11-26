import React from 'react';
import SpinnerIcon from '../icons/SpinnerIcon';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center">
        <SpinnerIcon className={`${sizeClasses[size]} animate-spin text-indigo-500 mx-auto`} />
        {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;

// Reusable loading components
export const ContentLoader = () => (
  <LoadingSpinner size="md" text="" />
);

export const FullPageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <LoadingSpinner size="lg" text="Loading..." />
  </div>
);

export const InlineLoader = ({ text }: { text?: string }) => (
  <LoadingSpinner size="sm" text={text} className="p-2" />
);
