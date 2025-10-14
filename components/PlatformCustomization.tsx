
import React, { useState, PropsWithChildren } from 'react';
import { apiGetPlatformSettings, apiSavePlatformSettings } from '../services/api';
import LandingPageEditor from './LandingPageEditor';

const GeneralSettings = ({ settings, handleChange }) => (
    <div className="mt-6 space-y-4">
        <div>
            <label className="label">Platform Name</label>
            <input type="text" name="platformName" className="input-field" value={settings.platformName} onChange={handleChange} />
        </div>
        <div>
            <label className="label">Accent Color</label>
            <input type="color" name="accentColor" className="input-field h-10" value={settings.accentColor} onChange={handleChange} />
        </div>
    </div>
);

const PaymentSettings = ({ settings, handleChange }) => (
    <div className="mt-6 space-y-6">
        <p className="text-sm text-gray-500">These keys are used for billing schools for their subscriptions.</p>
        <div>
            <h3 className="font-semibold text-lg border-b pb-2">Paystack</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Public Key</label><input type="text" name="paystackPublicKey" className="input-field" value={settings.paystackPublicKey || ''} onChange={handleChange} /></div>
                <div><label className="label">Secret Key</label><input type="password" name="paystackSecretKey" className="input-field" value={settings.paystackSecretKey || ''} onChange={handleChange} /></div>
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

    React.useEffect(() => {
        const fetchSettings = async () => {
            const platformSettings = await apiGetPlatformSettings();
            setSettings(platformSettings);
            setLoading(false);
        };
        fetchSettings();
    }, []);
    
    React.useEffect(() => {
        if (settings?.accentColor) {
            document.documentElement.style.setProperty('--brand-color-primary', settings.accentColor);
        }
    }, [settings?.accentColor]);

    const handleChange = (e) => {
        setSettings(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSave = async (updatedSettings = settings) => {
        setSaving(true);
        await apiSavePlatformSettings(updatedSettings);
        setSettings(updatedSettings);
        setSaving(false);
    };
    
    if (loading) return <p>Loading settings...</p>;

    const TabButton = ({ view, children }: PropsWithChildren<{ view: string }>) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`px-4 py-2 font-semibold ${activeTab === view ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
        >
            {children}
        </button>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Platform Settings</h1>
                <button onClick={() => handleSave()} disabled={saving} className="btn btn-primary">
                    {saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>
            
            <div className="card">
                <div className="p-6">
                    <div className="border-b">
                        <TabButton view="general">General</TabButton>
                        <TabButton view="landing-page">Landing Page</TabButton>
                        <TabButton view="payments">Payment Gateways</TabButton>
                    </div>

                    <div className="mt-6">
                        {activeTab === 'general' && <GeneralSettings settings={settings} handleChange={handleChange} />}
                        {activeTab === 'landing-page' && <LandingPageEditor settings={settings} onSave={handleSave} />}
                        {activeTab === 'payments' && <PaymentSettings settings={settings} handleChange={handleChange} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformSettings;
