import React from 'react';
import SkeletonLoader from '../SkeletonLoader';

interface TableSkeletonProps {
    rows?: number;
    cols?: number;
    hasCheckbox?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, cols = 4, hasCheckbox = false }) => (
    <div className="table-container">
        <table className="table">
            <thead>
                <tr>
                    {hasCheckbox && <th className="th w-12"><SkeletonLoader className="h-5 w-5" /></th>}
                    {[...Array(cols)].map((_, i) => (
                        <th key={i} className="th"><SkeletonLoader className="h-4 w-24" /></th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {[...Array(rows)].map((_, i) => (
                    <tr key={i}>
                        {hasCheckbox && <td className="td"><SkeletonLoader className="h-5 w-5" /></td>}
                        {[...Array(cols)].map((_, j) => (
                            <td key={j} className="td"><SkeletonLoader className="h-4 w-full" /></td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
export default TableSkeleton;
