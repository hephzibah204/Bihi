import React from 'react';
import UserGroupIcon from './icons/UserGroupIcon';

const EarlyIntervention = () => {
     return (
        <div className="card opacity-50">
            <div className="p-6">
                 <div className="flex items-center">
                    <UserGroupIcon className="w-6 h-6 mr-3 text-red-500" />
                    <h2 className="text-xl font-semibold">AI Early Intervention</h2>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                   Coming Soon: Automatically identify students who may be falling behind and get actionable suggestions.
                </p>
            </div>
        </div>
    );
};

export default EarlyIntervention;
