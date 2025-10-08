import React from 'react';
import SkeletonLoader from '../SkeletonLoader';

const AccordionSkeleton = ({ count = 3 }) => (
    <div className="space-y-4">
        {[...Array(count)].map((_, i) => (
             <div key={i} className="card p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <SkeletonLoader className="h-6 w-48 mb-2" />
                        <SkeletonLoader className="h-4 w-64" />
                    </div>
                    <SkeletonLoader className="h-6 w-6 rounded-full" />
                </div>
            </div>
        ))}
    </div>
);

export default AccordionSkeleton;
