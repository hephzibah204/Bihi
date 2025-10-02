import React, { useState, useEffect } from 'react';
import { apiGetActivities } from '../services/api';
import UsersIcon from './icons/UsersIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

const RecentActivityWidget = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const ActivityIcon = ({ type }) => {
        const baseType = type.split('_')[0]; // STUDENT, TEACHER, SUBJECT
        const action = type.split('_')[1]; // ADD, UPDATE, DELETE

        const iconMap = {
            STUDENT: <UsersIcon className="w-5 h-5 text-blue-500" />,
            TEACHER: <BriefcaseIcon className="w-5 h-5 text-green-500" />,
            SUBJECT: <BookOpenIcon className="w-5 h-5 text-purple-500" />,
        };

        const actionIconMap = {
            ADD: <div className="bg-green-500 rounded-full p-0.5"><PlusIcon className="w-2.5 h-2.5 text-white" /></div>,
            UPDATE: <div className="bg-blue-500 rounded-full p-0.5"><EditIcon className="w-2.5 h-2.5 text-white" /></div>,
            DELETE: <div className="bg-red-500 rounded-full p-0.5"><TrashIcon className="w-2.5 h-2.5 text-white" /></div>,
        };

        return (
            <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">
                {iconMap[baseType] || null}
                <div className="absolute -bottom-1 -right-1">
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
            const data = await apiGetActivities();
            setActivities(data);
            setLoading(false);
        };
        fetchActivities();
    }, []);

    if (loading) {
        return <div className="card mt-6 p-6">Loading activities...</div>;
    }

    return (
        <div className="card mt-6">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Activity</h3>
                {activities.length === 0 ? (
                    <p className="mt-4 text-gray-500">No recent activity to show.</p>
                ) : (
                    <ul className="mt-4 space-y-4">
                        {activities.map(activity => (
                            <li key={activity.id} className="flex items-center space-x-4">
                                <ActivityIcon type={activity.type} />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{activity.description}</p>
                                    <p className="text-xs text-gray-500">{timeSince(activity.timestamp)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default RecentActivityWidget;