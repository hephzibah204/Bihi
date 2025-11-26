import React, { useState, useEffect } from 'react';
import { apiGetActivityLog as apiGetActivities } from '../services/api';
import UsersIcon from './icons/UsersIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import ClockIcon from './icons/ClockIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface RecentActivityWidgetProps {
  compact?: boolean;
  maxItems?: number;
  showHeader?: boolean;
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({ 
  compact = false, 
  maxItems = 8, 
  showHeader = true 
}) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const ActivityIcon = ({ type }) => {
        const baseType = type.split('_')[0]; // STUDENT, TEACHER, SUBJECT
        const action = type.split('_')[1]; // ADD, UPDATE, DELETE

        const iconMap = {
            STUDENT: <UsersIcon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />,
            TEACHER: <BriefcaseIcon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-green-500`} />,
            SUBJECT: <BookOpenIcon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-purple-500`} />,
        };

        const actionIconMap = {
            ADD: <div className="bg-green-500 rounded-full p-0.5"><PlusIcon className="w-2 h-2 text-white" /></div>,
            UPDATE: <div className="bg-blue-500 rounded-full p-0.5"><EditIcon className="w-2 h-2 text-white" /></div>,
            DELETE: <div className="bg-red-500 rounded-full p-0.5"><TrashIcon className="w-2 h-2 text-white" /></div>,
        };

        return (
            <div className={`relative ${compact ? 'w-7 h-7' : 'w-8 h-8'} flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-full`}>
                {iconMap[baseType] || <ClockIcon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-500`} />}
                <div className="absolute -bottom-0.5 -right-0.5">
                    {actionIconMap[action] || null}
                </div>
            </div>
        );
    };

    // Helper to format time since event
    const timeSince = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    };

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            try {
                const data = await apiGetActivities();
                setActivities(data.slice(0, maxItems)); // Limit to maxItems
            } catch (error) {
                console.error('Error fetching activities:', error);
                setActivities([]);
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, [maxItems]);

    if (loading) {
        return (
            <div className="card">
                <div className={`${compact ? 'p-4' : 'p-4 md:p-6'}`}>
                    {showHeader && (
                        <div className="flex items-center gap-3 mb-4">
                            <ClockIcon className="w-5 h-5 text-gray-500" />
                            <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent Activity</h3>
                        </div>
                    )}
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center space-x-3 animate-pulse">
                                <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-1">
                                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className={`${compact ? 'p-4' : 'p-4 md:p-6'}`}>
                {showHeader && (
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <div className="flex items-center gap-3">
                            <ClockIcon className="w-5 h-5 text-gray-500" />
                            <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent Activity</h3>
                        </div>
                        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors">
                            View All
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
                
                {activities.length === 0 ? (
                    <div className="text-center py-8">
                        <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No recent activity to show.</p>
                    </div>
                ) : (
                    <div className={`space-y-${compact ? '3' : '4'} max-h-80 overflow-y-auto`}>
                        {activities.map((activity, index) => (
                            <div key={activity.id || index} className="flex items-start space-x-3 group">
                                <ActivityIcon type={activity.type} />
                                <div className="flex-1 min-w-0">
                                    <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700 leading-relaxed`}>
                                        {activity.description}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {timeSince(activity.timestamp)}
                                    </p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentActivityWidget;