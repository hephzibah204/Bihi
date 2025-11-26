import React, { ReactNode } from 'react';
import ArrowTrendingUpIcon from './icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from './icons/ArrowTrendingDownIcon';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: { value: string; direction: 'up' | 'down' } | null;
    className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, className }) => {
    return (
        <div className={`card p-6 md:p-8 min-h-[120px] md:min-h-[140px] ${className || ''}`}>
            <div className="flex items-start gap-4">
                <div className="p-3 md:p-4 rounded-xl bg-indigo-100 text-indigo-600 flex-shrink-0">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 leading-relaxed mb-2">{title}</p>
                    <p className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight break-words">{value}</p>
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-2">
                    <div className={`flex items-center text-sm font-semibold px-2.5 py-1 rounded-full ${trend.direction === 'up' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                        {trend.direction === 'up' ? (
                            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                        ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                        )}
                        {trend.value}
                    </div>
                    <div className="text-xs text-gray-500">
                        from last period
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatCard;
