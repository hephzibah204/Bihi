import React, { useState, useEffect } from 'react';
import { apiGetPlatformSettings, apiSavePlatformSettings } from '../services/api';

const PlatformCustomization = () => {
    const [settings, setSettings] = useState({
        platformName: 'ReportSheet',
        accentColor: '#4f46e5',
        paystackPublicKey: '',
        paystackSecretKey: '',
        flutterwavePublicKey: '',
        flutterwaveSecretKey: '',
        payvesselMerchantId: '',
        payvesselApiKey: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const platformSettings = await apiGetPlatformSettings();
            setSettings(prev => ({ ...prev, ...platformSettings }));
            setLoading(false);
        };
        fetchSettings();
    }, []);
    
    useEffect(() => {
        document.documentElement.style.setProperty('--brand-color', settings.accentColor);
    }, [settings.accentColor]);

    const handleChange = (e) => {
        setSettings(prev => ({...prev, [e.target.name]: e.target.value}));
    }

    const handleSave = async () => {
        setSaving(true);
        const currentSettings = await apiGetPlatformSettings();
        await apiSavePlatformSettings({ ...currentSettings, ...settings });
        setSaving(false);
    };
    
    if (loading) return <p>Loading settings...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Platform Settings</h1>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                    {saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>
            <div className="space-y-8">
                <div className="card">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold">Branding & Customization</h2>
                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="label">Platform Name</label>
                                <input 
                                    type="text" 
                                    name="platformName"
                                    className="input-field" 
                                    value={settings.platformName} 
                                    onChange={handleChange} 
                                />
                            </div>
                            <div>
                                <label className="label">Accent Color</label>
                                <input 
                                    type="color" 
                                    name="accentColor"
                                    className="input-field h-10" 
                                    value={settings.accentColor} 
                                    onChange={handleChange} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold">Payment Gateway API Settings</h2>
                        <p className="text-sm text-gray-500 mt-1">These keys are used for billing schools for their subscriptions.</p>
                        <div className="mt-6 space-y-6">
                            {/* Paystack Section */}
                            <div>
                                <h3 className="font-semibold text-lg border-b pb-2 dark:border-gray-700">Paystack</h3>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Public Key</label>
                                        <input type="text" name="paystackPublicKey" className="input-field" value={settings.paystackPublicKey || ''} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="label">Secret Key</label>
                                        <input type="password" name="paystackSecretKey" className="input-field" value={settings.paystackSecretKey || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                            {/* Flutterwave Section */}
                            <div>
                                <h3 className="font-semibold text-lg border-b pb-2 dark:border-gray-700">Flutterwave</h3>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Public Key</label>
                                        <input type="text" name="flutterwavePublicKey" className="input-field" value={settings.flutterwavePublicKey || ''} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="label">Secret Key</label>
                                        <input type="password" name="flutterwaveSecretKey" className="input-field" value={settings.flutterwaveSecretKey || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                            {/* Payvessel Section */}
                             <div>
                                <h3 className="font-semibold text-lg border-b pb-2 dark:border-gray-700">Payvessel</h3>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Merchant ID</label>
                                        <input type="text" name="payvesselMerchantId" className="input-field" value={settings.payvesselMerchantId || ''} onChange={handleChange} />
                                    </div>
                                    <div>
                                        <label className="label">API Key</label>
                                        <input type="password" name="payvesselApiKey" className="input-field" value={settings.payvesselApiKey || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformCustomization;