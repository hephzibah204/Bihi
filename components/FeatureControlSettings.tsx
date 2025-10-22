import React, { useState } from 'react';
import { SchoolSettings, ControllableFeature } from '../types';
import { CONTROLLABLE_FEATURES } from '../utils/constants';

interface FeatureControlSettingsProps {
    settings: Partial<SchoolSettings>;
    onSettingsChange: (changed: Partial<SchoolSettings>) => void;
}

const FeatureControlSettings: React.FC<FeatureControlSettingsProps> = ({ settings, onSettingsChange }) => {
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    
    const roles = ['admin', 'teacher', 'student', 'parent', 'bursar'];
    const categories = [...new Set(CONTROLLABLE_FEATURES.map(f => f.category))];
    
    const handleGlobalFeatureChange = (featureKey: string, isEnabled: boolean) => {
        const updatedFeatures = {
            ...settings.features,
            [featureKey]: isEnabled,
        };
        onSettingsChange({ features: updatedFeatures });
    };

    const handleRoleBasedFeatureChange = (role: string, featureKey: string, isEnabled: boolean) => {
        const updatedRoleBasedFeatures = {
            ...settings.roleBasedFeatures,
            [role]: {
                ...settings.roleBasedFeatures?.[role],
                [featureKey]: isEnabled,
            },
        };
        onSettingsChange({ roleBasedFeatures: updatedRoleBasedFeatures });
    };

    const getFilteredFeatures = () => {
        let filtered = CONTROLLABLE_FEATURES;
        
        if (selectedRole !== 'all') {
            filtered = filtered.filter(feature => 
                feature.applicableRoles.includes(selectedRole)
            );
        }
        
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(feature => 
                feature.category === selectedCategory
            );
        }
        
        return filtered;
    };

    const isFeatureEnabledForRole = (feature: ControllableFeature, role: string) => {
        if (role === 'all') {
            return !!settings.features?.[feature.key];
        }
        return !!settings.roleBasedFeatures?.[role]?.[feature.key];
    };

    const getRoleBadgeColor = (role: string) => {
        const colors = {
            admin: 'bg-red-100 text-red-800',
            teacher: 'bg-blue-100 text-blue-800',
            student: 'bg-green-100 text-green-800',
            parent: 'bg-purple-100 text-purple-800',
            bursar: 'bg-yellow-100 text-yellow-800',
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold">Dynamic Feature Access Control</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Control feature access globally or by specific user roles. You can enable/disable features 
                    for different user types (Admin, Teacher, Parent, Student, etc.).
                </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                    <label htmlFor="role-filter" className="text-sm font-medium text-gray-700">
                        Filter by Role:
                    </label>
                    <select
                        id="role-filter"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Roles</option>
                        {roles.map(role => (
                            <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="flex items-center space-x-2">
                    <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
                        Filter by Category:
                    </label>
                    <select
                        id="category-filter"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Feature Controls */}
            <div className="space-y-4">
                {selectedRole === 'all' ? (
                    // Global Feature Control
                    <div>
                        <h4 className="text-lg font-medium mb-3">Global Feature Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {getFilteredFeatures().map(feature => (
                                <div key={feature.key} className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <label htmlFor={`global-feature-${feature.key}`} className="font-medium text-gray-900">
                                                {feature.name}
                                            </label>
                                            <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {feature.applicableRoles.map(role => (
                                                    <span key={role} className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(role)}`}>
                                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center ml-4">
                                            <input
                                                id={`global-feature-${feature.key}`}
                                                type="checkbox"
                                                className="toggle-switch"
                                                checked={!!settings.features?.[feature.key]}
                                                onChange={(e) => handleGlobalFeatureChange(feature.key, e.target.checked)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Role-Specific Feature Control
                    <div>
                        <h4 className="text-lg font-medium mb-3">
                            Feature Settings for {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}s
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {getFilteredFeatures().map(feature => (
                                <div key={feature.key} className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <label htmlFor={`role-feature-${selectedRole}-${feature.key}`} className="font-medium text-gray-900">
                                                {feature.name}
                                            </label>
                                            <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                                            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${getRoleBadgeColor(selectedRole)}`}>
                                                {feature.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center ml-4">
                                            <input
                                                id={`role-feature-${selectedRole}-${feature.key}`}
                                                type="checkbox"
                                                className="toggle-switch"
                                                checked={isFeatureEnabledForRole(feature, selectedRole)}
                                                onChange={(e) => handleRoleBasedFeatureChange(selectedRole, feature.key, e.target.checked)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Quick Actions</h5>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => {
                            const allEnabled = {};
                            CONTROLLABLE_FEATURES.forEach(feature => {
                                allEnabled[feature.key] = true;
                            });
                            onSettingsChange({ features: allEnabled });
                        }}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                        Enable All Features
                    </button>
                    <button
                        onClick={() => {
                            const allDisabled = {};
                            CONTROLLABLE_FEATURES.forEach(feature => {
                                allDisabled[feature.key] = false;
                            });
                            onSettingsChange({ features: allDisabled });
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                        Disable All Features
                    </button>
                    {selectedRole !== 'all' && (
                        <button
                            onClick={() => {
                                const roleEnabled = {};
                                getFilteredFeatures().forEach(feature => {
                                    roleEnabled[feature.key] = true;
                                });
                                const updatedRoleBasedFeatures = {
                                    ...settings.roleBasedFeatures,
                                    [selectedRole]: roleEnabled,
                                };
                                onSettingsChange({ roleBasedFeatures: updatedRoleBasedFeatures });
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                            Enable All for {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}s
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeatureControlSettings;
