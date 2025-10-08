import React from 'react';
import ArrowTrendingUpIcon from './icons/ArrowTrendingUpIcon';
import ArrowTrendingDownIcon from './icons/ArrowTrendingDownIcon';

const StatCard = ({ title, value, icon, trend }) => (
    <div className="card p-6">
        <div className="flex justify-between items-start">
            <div>
                <h4 className="font-semibold text-gray-500">{title}</h4>
                <p className="text-3xl font-bold mt-2">{value}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                {icon}
            </div>
        </div>
        {trend && (
            <p className={`text-sm mt-2 flex items-center ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trend.direction === 'up' ? <ArrowTrendingUpIcon className="w-4 h-4 mr-1"/> : <ArrowTrendingDownIcon className="w-4 h-4 mr-1"/>}
                {trend.value} vs last term
            </p>
        )}
    </div>
);

export default StatCard;
