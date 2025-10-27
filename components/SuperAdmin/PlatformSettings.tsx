import React, { useState, useEffect, PropsWithChildren } from 'react';
import { apiGetPlatformSettings, apiSavePlatformSettings } from '../../services/api';
import { usePlatformPermission } from '../../utils/usePlatformPermission';
import LandingPageEditor from '../LandingPageEditor';
import PlanManager from '../PlanManager';

const GeneralSettings = ({ settings, handleChange }) => (
    <div className="mt-6 space-y-4">
        <div>
            <label htmlFor="platform-name" className="block text-sm font-medium text-slate-700 mb-2">Platform Name</label>
            <input 
                id="platform-name"
                type="text" 
                name="platformName" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={settings.platformName} 
                onChange={handleChange} 
            />
        </div>
        <div>
            <label htmlFor="accent-color" className="block text-sm font-medium text-slate-700 mb-2">Accent Color</label>
            <input 
                id="accent-color"
                type="color" 
                name="accentColor" 
                className="w-full h-12 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={settings.accentColor} 
                onChange={handleChange} 
            />
        </div>
    </div>
);

const PaymentSettings = ({ settings, handleChange }) => (
    <div className="mt-6 space-y-6">
        <p className="text-sm text-slate-500">These keys are used for billing schools for their subscriptions.</p>
        <div>
            <h3 className="font-semibold text-lg border-b pb-2">Paystack</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="paystack-public" className="block text-sm font-medium text-slate-700 mb-2">Public Key</label>
                    <input 
                        id="paystack-public"
                        type="text" 
                        name="paystackPublicKey" 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={settings.paystackPublicKey || ''} 
                        onChange={handleChange} 
                    />
                </div>
                <div>
                    <label htmlFor="paystack-secret" className="block text-sm font-medium text-slate-700 mb-2">Secret Key</label>
                    <input 
                        id="paystack-secret"
                        type="password" 
                        name="paystackSecretKey" 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={settings.paystackSecretKey || ''} 
                        onChange={handleChange} 
                    />
                </div>
            </div>
        </div>
        {/* Add other payment gateways here */}
    </div>
);

const PlatformSettings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const platformSettings = await apiGetPlatformSettings();
                setSettings(platformSettings);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);
    
    useEffect(() => {
        if (settings?.accentColor) {
            document.documentElement.style.setProperty('--brand-color-primary', settings.accentColor);
        }
    }, [settings?.accentColor]);

    const handleChange = (e) => {
        setSettings(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSave = async (updatedSettings = settings) => {
        setSaving(true);
        try {
            await apiSavePlatformSettings(updatedSettings);
            setSettings(updatedSettings);
            // Show success notification
        } catch (error) {
            console.error('Failed to save settings:', error);
            // Show error notification
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-slate-600 to-gray-600 text-white p-6 rounded-xl">
                    <h1 className="text-2xl font-bold mb-2">Platform Settings</h1>
                    <p className="text-slate-100">Configure global platform settings</p>
                </div>
                <div className="text-center py-8">Loading settings...</div>
            </div>
        );
    }

    const TabButton = ({ view, children }: PropsWithChildren<{ view: string }>) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`px-4 py-2 font-semibold ${
                activeTab === view 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-slate-500 hover:text-slate-700'
            }`}
        >
            {children}
        </button>
    );

    const { can } = usePlatformPermission();

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-600 to-gray-600 text-white p-6 rounded-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Platform Settings</h1>
                        <p className="text-slate-100">Configure global platform settings and preferences</p>
                    </div>
                    <button 
                        onClick={() => handleSave()} 
                        disabled={saving || !can('manage_platform_settings')} 
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            saving || !can('manage_platform_settings')
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                                : 'bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        {saving ? 'Saving...' : can('manage_platform_settings') ? 'Save All Settings' : 'Read-only'}
                    </button>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="border-b border-slate-200 mb-6">
                    <TabButton view="general">General</TabButton>
                    <TabButton view="landing-page">Landing Page</TabButton>
                    <TabButton view="plans">Plans</TabButton>
                    <TabButton view="payments">Payment Gateways</TabButton>
                </div>

                <div>
                    {activeTab === 'general' && <GeneralSettings settings={settings} handleChange={handleChange} />}
                    {activeTab === 'landing-page' && <LandingPageEditor settings={settings} onSave={handleSave} />}
                    {activeTab === 'plans' && <PlanManager />}
                    {activeTab === 'payments' && <PaymentSettings settings={settings} handleChange={handleChange} />}
                </div>
            </div>
        </div>
    );
};

export default PlatformSettings;