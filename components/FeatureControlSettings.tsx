import React from 'react';
import { SchoolSettings } from '../types';
import { TEACHER_CONTROLLABLE_FEATURES, STUDENT_CONTROLLABLE_FEATURES, PARENT_CONTROLLABLE_FEATURES } from '../utils/constants';

const FeatureToggleList = ({ title, features, controls, onChange }) => (
    <div>
        <h4 className="font-semibold text-lg mb-2">{title}</h4>
        <div className="space-y-3">
            {features.map(feature => (
                <label key={feature.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span>{feature.name}</span>
                    <input
                        type="checkbox"
                        className="h-5 w-5 rounded"
                        checked={controls?.[feature.key] ?? true}
                        onChange={(e) => onChange(feature.key, e.target.checked)}
                    />
                </label>
            ))}
        </div>
    </div>
);

interface FeatureControlSettingsProps {
    settings: SchoolSettings;
    onSettingsChange: (newSettings: Partial<SchoolSettings>) => void;
}

const FeatureControlSettings: React.FC<FeatureControlSettingsProps> = ({ settings, onSettingsChange }) => {

    const handleFeatureChange = (role: 'teacher' | 'student' | 'parent', featureKey: string, isEnabled: boolean) => {
        const updatedControls = {
            ...settings.featureControls,
            [role]: {
                ...settings.featureControls[role],
                [featureKey]: isEnabled,
            },
        };
        onSettingsChange({ featureControls: updatedControls });
    };

    return (
        <div className="space-y-6">
            <FeatureToggleList
                title="Teacher Portal Features"
                features={TEACHER_CONTROLLABLE_FEATURES}
                controls={settings.featureControls?.teacher}
                onChange={(key, val) => handleFeatureChange('teacher', key, val)}
            />
            <FeatureToggleList
                title="Student Portal Features"
                features={STUDENT_CONTROLLABLE_FEATURES}
                controls={settings.featureControls?.student}
                onChange={(key, val) => handleFeatureChange('student', key, val)}
            />
            <FeatureToggleList
                title="Parent Portal Features"
                features={PARENT_CONTROLLABLE_FEATURES}
                controls={settings.featureControls?.parent}
                onChange={(key, val) => handleFeatureChange('parent', key, val)}
            />
        </div>
    );
};

export default FeatureControlSettings;