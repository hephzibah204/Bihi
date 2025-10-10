import React, { ReactNode } from 'react';
import ArrowTrendingUpIcon from './icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from './icons/ArrowTrendingDownIcon';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: { value: string; direction: 'up' | 'down' } | null;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => {
    return (
        <div className="card p-6">
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                    {icon}
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{value}</p>
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-baseline">
                    <div className={`flex items-center text-sm font-semibold ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.direction === 'up' ? (
                            <ArrowTrendingUpIcon className="h-5 w-5 mr-1" />
                        ) : (
                            <ArrowTrendingDownIcon className="h-5 w-5 mr-1" />
                        )}
                        {trend.value}
                    </div>
                    <div className="ml-2 text-sm text-gray-500">
                        from last period
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatCard;
