import React from 'react';
import LockIcon from './icons/LockIcon';

const UpgradePrompt = ({ featureName, onUpgradeClick }) => {
    return (
        <div className="card max-w-lg mx-auto mt-8">
            <div className="p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto">
                    <LockIcon className="w-8 h-8" />
                </div>
                <h2 className="mt-4 text-2xl font-bold">Upgrade to Unlock This Feature</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Your current plan does not include access to {featureName}. Please upgrade your plan to continue.
                </p>
                <button onClick={onUpgradeClick} className="btn btn-primary mt-6">
                    View Plans & Upgrade
                </button>
            </div>
        </div>
    );
};

export default UpgradePrompt;