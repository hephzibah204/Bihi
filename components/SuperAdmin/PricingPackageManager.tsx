import React, { useState } from 'react';
import { usePlatformPermission } from '../../utils/usePlatformPermission';

interface Feature {
    id: string;
    name: string;
    description: string;
    category: 'core' | 'advanced' | 'premium';
}

interface Package {
    id: string;
    name: string;
    displayName: string;
    description: string;
    price: number;
    currency: string;
    billingCycle: 'monthly' | 'yearly';
    features: string[]; // Feature IDs
    maxUsers: number;
    maxStudents: number;
    maxSchools: number;
    storage: string; // e.g., "50GB", "500GB", "Unlimited"
    isActive: boolean;
    isPopular: boolean;
    customizations: {
        backgroundColor: string;
        accentColor: string;
        buttonText: string;
    };
}

const PricingPackageManager = () => {
    const { can } = usePlatformPermission();
    const canManagePlatformSettings = can('manage_platform_settings');
    const [activeTab, setActiveTab] = useState<'packages' | 'features'>('packages');
    
    // All Available Features
    const [allFeatures] = useState<Feature[]>([
        // Core Features
        { id: 'student_management', name: 'Student Management', description: 'Add, edit, and manage students', category: 'core' },
        { id: 'attendance', name: 'Attendance Tracking', description: 'Daily attendance marking', category: 'core' },
        { id: 'basic_reports', name: 'Basic Reports', description: 'Generate basic academic reports', category: 'core' },
        { id: 'parent_portal', name: 'Parent Portal', description: 'Parents can view student progress', category: 'core' },
        
        // Advanced Features
        { id: 'fee_management', name: 'Fee Management', description: 'Manage school fees and payments', category: 'advanced' },
        { id: 'online_payments', name: 'Online Payments', description: 'Accept payments via Paystack/Flutterwave', category: 'advanced' },
        { id: 'sms_notifications', name: 'SMS Notifications', description: 'Send SMS to parents and students', category: 'advanced' },
        { id: 'email_notifications', name: 'Email Notifications', description: 'Automated email communications', category: 'advanced' },
        { id: 'timetable', name: 'Timetable Management', description: 'Create and manage class schedules', category: 'advanced' },
        { id: 'exam_management', name: 'Exam Management', description: 'Conduct and grade examinations', category: 'advanced' },
        
        // Premium Features
        { id: 'library_management', name: 'Library Management', description: 'Track books and borrowing', category: 'premium' },
        { id: 'transport_management', name: 'Transport Management', description: 'Manage school buses and routes', category: 'premium' },
        { id: 'hostel_management', name: 'Hostel Management', description: 'Manage boarding facilities', category: 'premium' },
        { id: 'inventory', name: 'Inventory Management', description: 'Track school assets and supplies', category: 'premium' },
        { id: 'hr_payroll', name: 'HR & Payroll', description: 'Manage staff and payroll', category: 'premium' },
        { id: 'advanced_analytics', name: 'Advanced Analytics', description: 'Detailed insights and reporting', category: 'premium' },
        { id: 'mobile_app', name: 'Mobile App Access', description: 'iOS and Android apps', category: 'premium' },
        { id: 'api_access', name: 'API Access', description: 'Integrate with external systems', category: 'premium' },
        { id: 'white_label', name: 'White Label', description: 'Custom branding and domain', category: 'premium' },
        { id: 'priority_support', name: 'Priority Support', description: '24/7 dedicated support', category: 'premium' }
    ]);

    const [packages, setPackages] = useState<Package[]>([
        {
            id: 'basic',
            name: 'basic',
            displayName: 'Basic Plan',
            description: 'Perfect for small schools getting started',
            price: 15000,
            currency: 'NGN',
            billingCycle: 'monthly',
            features: ['student_management', 'attendance', 'basic_reports', 'parent_portal'],
            maxUsers: 10,
            maxStudents: 200,
            maxSchools: 1,
            storage: '10GB',
            isActive: true,
            isPopular: false,
            customizations: {
                backgroundColor: '#F3F4F6',
                accentColor: '#3B82F6',
                buttonText: 'Get Started'
            }
        },
        {
            id: 'professional',
            name: 'professional',
            displayName: 'Professional Plan',
            description: 'For growing schools with advanced needs',
            price: 35000,
            currency: 'NGN',
            billingCycle: 'monthly',
            features: [
                'student_management', 'attendance', 'basic_reports', 'parent_portal',
                'fee_management', 'online_payments', 'sms_notifications', 'email_notifications',
                'timetable', 'exam_management'
            ],
            maxUsers: 50,
            maxStudents: 1000,
            maxSchools: 1,
            storage: '100GB',
            isActive: true,
            isPopular: true,
            customizations: {
                backgroundColor: '#EFF6FF',
                accentColor: '#2563EB',
                buttonText: 'Start Free Trial'
            }
        },
        {
            id: 'enterprise',
            name: 'enterprise',
            displayName: 'Enterprise Plan',
            description: 'Complete solution for large institutions',
            price: 75000,
            currency: 'NGN',
            billingCycle: 'monthly',
            features: allFeatures.map(f => f.id), // All features
            maxUsers: -1, // Unlimited
            maxStudents: -1, // Unlimited
            maxSchools: -1, // Unlimited
            storage: 'Unlimited',
            isActive: true,
            isPopular: false,
            customizations: {
                backgroundColor: '#F5F3FF',
                accentColor: '#7C3AED',
                buttonText: 'Contact Sales'
            }
        }
    ]);

    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const handleCreatePackage = () => {
        if (!canManagePlatformSettings) {
            alert('You do not have permission to manage platform settings.');
            return;
        }
        const newPackage: Package = {
            id: `package_${Date.now()}`,
            name: 'new_package',
            displayName: 'New Package',
            description: 'Package description',
            price: 0,
            currency: 'NGN',
            billingCycle: 'monthly',
            features: [],
            maxUsers: 10,
            maxStudents: 100,
            maxSchools: 1,
            storage: '10GB',
            isActive: false,
            isPopular: false,
            customizations: {
                backgroundColor: '#F3F4F6',
                accentColor: '#3B82F6',
                buttonText: 'Get Started'
            }
        };
        setPackages([...packages, newPackage]);
        setSelectedPackage(newPackage);
        setIsEditing(true);
        setShowCreateModal(false);
    };

    const handleSavePackage = () => {
        if (!canManagePlatformSettings) {
            alert('You do not have permission to manage platform settings.');
            return;
        }
        if (selectedPackage) {
            setPackages(packages.map(p => p.id === selectedPackage.id ? selectedPackage : p));
            alert('Package saved successfully!');
            setIsEditing(false);
        }
    };

    const handleDeletePackage = (id: string) => {
        if (!canManagePlatformSettings) {
            alert('You do not have permission to manage platform settings.');
            return;
        }
        if (confirm('Are you sure you want to delete this package?')) {
            setPackages(packages.filter(p => p.id !== id));
            setSelectedPackage(null);
        }
    };

    const toggleFeature = (featureId: string) => {
        if (!selectedPackage) return;
        if (!canManagePlatformSettings) {
            alert('You do not have permission to manage platform settings.');
            return;
        }
        const features = selectedPackage.features.includes(featureId)
            ? selectedPackage.features.filter(f => f !== featureId)
            : [...selectedPackage.features, featureId];
        setSelectedPackage({ ...selectedPackage, features });
    };

    const PackagesPanel = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Subscription Packages</h3>
                    <p className="text-sm text-slate-500">Create and manage pricing plans</p>
                </div>
                <button
                    onClick={() => canManagePlatformSettings ? setShowCreateModal(true) : alert('You do not have permission to manage platform settings.')}
                    disabled={!canManagePlatformSettings}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    + Create Package
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map(pkg => (
                    <div
                        key={pkg.id}
                        className={`relative bg-white border-2 rounded-xl p-6 cursor-pointer transition-all ${
                            selectedPackage?.id === pkg.id
                                ? 'border-blue-500 shadow-lg'
                                : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => {
                            setSelectedPackage(pkg);
                            setIsEditing(false);
                        }}
                    >
                        {pkg.isPopular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                                    MOST POPULAR
                                </span>
                            </div>
                        )}
                        
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{pkg.displayName}</h3>
                            <p className="text-sm text-slate-600 mb-4">{pkg.description}</p>
                            <div className="mb-4">
                                <span className="text-3xl font-bold text-slate-900">₦{pkg.price.toLocaleString()}</span>
                                <span className="text-slate-600">/{pkg.billingCycle === 'monthly' ? 'month' : 'year'}</span>
                            </div>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                pkg.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {pkg.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="text-xs text-slate-600">
                                <strong>Students:</strong> {pkg.maxStudents === -1 ? 'Unlimited' : pkg.maxStudents}
                            </div>
                            <div className="text-xs text-slate-600">
                                <strong>Users:</strong> {pkg.maxUsers === -1 ? 'Unlimited' : pkg.maxUsers}
                            </div>
                            <div className="text-xs text-slate-600">
                                <strong>Storage:</strong> {pkg.storage}
                            </div>
                            <div className="text-xs text-slate-600">
                                <strong>Features:</strong> {pkg.features.length}
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!canManagePlatformSettings) {
                                        alert('You do not have permission to manage platform settings.');
                                        return;
                                    }
                                    setSelectedPackage(pkg);
                                    setIsEditing(true);
                                }}
                                disabled={!canManagePlatformSettings}
                                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePackage(pkg.id);
                                }}
                                disabled={!canManagePlatformSettings}
                                className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedPackage && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-slate-900">
                            {isEditing ? 'Edit Package' : 'Package Details'}
                        </h3>
                        {!isEditing && (
                            <button
                                onClick={() => canManagePlatformSettings ? setIsEditing(true) : alert('You do not have permission to manage platform settings.')}
                                disabled={!canManagePlatformSettings}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Edit Package
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Package Name *</label>
                            <input
                                type="text"
                                value={selectedPackage.displayName}
                                onChange={(e) => setSelectedPackage({ ...selectedPackage, displayName: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Price (NGN) *</label>
                            <input
                                type="number"
                                value={selectedPackage.price}
                                onChange={(e) => setSelectedPackage({ ...selectedPackage, price: parseInt(e.target.value) })}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                            <textarea
                                value={selectedPackage.description}
                                onChange={(e) => setSelectedPackage({ ...selectedPackage, description: e.target.value })}
                                disabled={!isEditing}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Billing Cycle</label>
                            <select
                                value={selectedPackage.billingCycle}
                                onChange={(e) => setSelectedPackage({ ...selectedPackage, billingCycle: e.target.value as any })}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Max Students</label>
                            <input
                                type="number"
                                value={selectedPackage.maxStudents === -1 ? '' : selectedPackage.maxStudents}
                                onChange={(e) => setSelectedPackage({
                                    ...selectedPackage,
                                    maxStudents: e.target.value === '' ? -1 : parseInt(e.target.value)
                                })}
                                placeholder="Leave empty for unlimited"
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Max Users</label>
                            <input
                                type="number"
                                value={selectedPackage.maxUsers === -1 ? '' : selectedPackage.maxUsers}
                                onChange={(e) => setSelectedPackage({
                                    ...selectedPackage,
                                    maxUsers: e.target.value === '' ? -1 : parseInt(e.target.value)
                                })}
                                placeholder="Leave empty for unlimited"
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Storage</label>
                            <input
                                type="text"
                                value={selectedPackage.storage}
                                onChange={(e) => setSelectedPackage({ ...selectedPackage, storage: e.target.value })}
                                placeholder="e.g., 50GB, Unlimited"
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Button Text</label>
                            <input
                                type="text"
                                value={selectedPackage.customizations.buttonText}
                                onChange={(e) => setSelectedPackage({
                                    ...selectedPackage,
                                    customizations: { ...selectedPackage.customizations, buttonText: e.target.value }
                                })}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Accent Color</label>
                            <input
                                type="color"
                                value={selectedPackage.customizations.accentColor}
                                onChange={(e) => setSelectedPackage({
                                    ...selectedPackage,
                                    customizations: { ...selectedPackage.customizations, accentColor: e.target.value }
                                })}
                                disabled={!isEditing}
                                className="w-full h-10 px-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Package Status</h4>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={selectedPackage.isActive}
                                    onChange={(e) => setSelectedPackage({ ...selectedPackage, isActive: e.target.checked })}
                                    disabled={!isEditing}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-slate-700">Active (visible on website)</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={selectedPackage.isPopular}
                                    onChange={(e) => setSelectedPackage({ ...selectedPackage, isPopular: e.target.checked })}
                                    disabled={!isEditing}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-slate-700">Mark as Popular</span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Included Features ({selectedPackage.features.length})</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-4 bg-slate-50 rounded-lg">
                            {allFeatures.map(feature => (
                                <label
                                    key={feature.id}
                                    className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                        selectedPackage.features.includes(feature.id)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                    } ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedPackage.features.includes(feature.id)}
                                        onChange={() => toggleFeature(feature.id)}
                                        disabled={!isEditing}
                                        className="w-4 h-4 mt-1 text-blue-600 rounded"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm text-slate-900">{feature.name}</div>
                                        <div className="text-xs text-slate-500">{feature.description}</div>
                                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                                            feature.category === 'core' ? 'bg-green-100 text-green-800' :
                                            feature.category === 'advanced' ? 'bg-blue-100 text-blue-800' :
                                            'bg-purple-100 text-purple-800'
                                        }`}>
                                            {feature.category}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="mt-6 flex space-x-3">
                            <button
                                onClick={handleSavePackage}
                                disabled={!canManagePlatformSettings}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setSelectedPackage(packages.find(p => p.id === selectedPackage.id) || null);
                                }}
                                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const FeaturesPanel = () => (
        <div className="space-y-6">
            {!canManagePlatformSettings && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3">
                    You have read-only access to pricing packages (missing manage_platform_settings).
                </div>
            )}
            <div>
                <h3 className="text-lg font-semibold text-slate-900">Available Features</h3>
                <p className="text-sm text-slate-500">Manage all system features</p>
            </div>

            <div className="space-y-6">
                {['core', 'advanced', 'premium'].map(category => (
                    <div key={category} className="bg-white border border-slate-200 rounded-lg p-6">
                        <h4 className="font-semibold text-slate-900 mb-4 capitalize">{category} Features</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allFeatures
                                .filter(f => f.category === category)
                                .map(feature => (
                                    <div key={feature.id} className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-900">{feature.name}</div>
                                            <div className="text-sm text-slate-600 mt-1">{feature.description}</div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Pricing & Package Management</h1>
                <p className="text-emerald-100">Create and manage subscription plans with feature permissions</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex space-x-4">
                    {[
                        { id: 'packages', label: 'Subscription Packages', icon: '📦' },
                        { id: 'features', label: 'Features Library', icon: '⚙️' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'packages' && <PackagesPanel />}
            {activeTab === 'features' && <FeaturesPanel />}

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Create New Package</h3>
                        <p className="text-slate-600 mb-6">
                            A new package will be created with default settings. You can customize it after creation.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleCreatePackage}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create Package
                            </button>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingPackageManager;