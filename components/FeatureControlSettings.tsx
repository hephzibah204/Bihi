import React from 'react';
import { SchoolSettings } from '../types';
import { CONTROLLABLE_FEATURES } from '../utils/constants';

interface FeatureControlSettingsProps {
    settings: Partial<SchoolSettings>;
    onSettingsChange: (changed: Partial<SchoolSettings>) => void;
}

const FeatureControlSettings: React.FC<FeatureControlSettingsProps> = ({ settings, onSettingsChange }) => {
    
    const handleFeatureChange = (featureKey: string, isEnabled: boolean) => {
        const updatedFeatures = {
            ...settings.features,
            [featureKey]: isEnabled,
        };
        onSettingsChange({ features: updatedFeatures });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold">Feature Access Control</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Enable or disable specific modules for all users in this school portal (Admin, Teacher, etc.).
                    This does not affect your subscription plan.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CONTROLLABLE_FEATURES.map(feature => (
                    <div key={feature.key} className="p-4 border rounded-lg flex justify-between items-center">
                        <label htmlFor={`feature-${feature.key}`} className="font-medium">{feature.name}</label>
                        <div className="flex items-center">
                             <input
                                id={`feature-${feature.key}`}
                                type="checkbox"
                                className="toggle-switch"
                                checked={!!settings.features?.[feature.key]}
                                onChange={(e) => handleFeatureChange(feature.key, e.target.checked)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeatureControlSettings;
