import React from 'react';
import { DashboardView } from '../types';

interface UpgradePromptProps {
  featureName: string;
  setActiveView: (view: DashboardView) => void;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ featureName, setActiveView }) => {
    return (
        <div className="p-6 text-center border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold">Upgrade to unlock {featureName}</h3>
            <p className="mt-2 text-gray-500">This feature is not available on your current plan.</p>
            <button onClick={() => setActiveView('billing')} className="mt-4 btn btn-primary">Upgrade Plan</button>
        </div>
    );
};

export default UpgradePrompt;