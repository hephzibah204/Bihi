import React from 'react';
import SkeletonLoader from '../SkeletonLoader';

const StatCardSkeleton: React.FC = () => {
    return (
        <div className="card p-6">
            <div className="flex items-center">
                <SkeletonLoader className="h-12 w-12 rounded-full" />
                <div className="ml-4 w-full">
                    <SkeletonLoader className="h-4 w-3/4 mb-2" />
                    <SkeletonLoader className="h-6 w-1/2" />
                </div>
            </div>
        </div>
    );
};

export default StatCardSkeleton;
