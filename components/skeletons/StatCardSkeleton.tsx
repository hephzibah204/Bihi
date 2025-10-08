import React from 'react';
import SkeletonLoader from '../SkeletonLoader';

const StatCardSkeleton = () => (
    <div className="card p-6">
        <div className="flex justify-between items-start">
            <div>
                <SkeletonLoader className="h-5 w-32" />
                <SkeletonLoader className="h-9 w-24 mt-2" />
            </div>
            <SkeletonLoader className="w-12 h-12 rounded-full" />
        </div>
    </div>
);

export default StatCardSkeleton;
