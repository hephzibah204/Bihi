import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className }) => {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
};

export default SkeletonLoader;
