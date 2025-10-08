import React from 'react';
import SkeletonLoader from '../SkeletonLoader';

const ListItemSkeleton = () => (
    <div className="w-full p-4 bg-white rounded-lg shadow-sm flex justify-between items-center">
        <div>
            <SkeletonLoader className="h-5 w-40 mb-2" />
            <SkeletonLoader className="h-4 w-24" />
        </div>
        <SkeletonLoader className="h-7 w-12" />
    </div>
);

export default ListItemSkeleton;
