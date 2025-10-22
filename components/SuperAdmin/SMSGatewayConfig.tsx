import React, { useState } from 'react';

interface SMSProvider {
    id: string;
    name: string;
    logo: string;
    enabled: boolean;
    config: {
        apiKey?: string;
        apiSecret?: string;
        senderId?: string;
        accountSid?: string;
        authToken?: string;
        username?: string;
    };
    pricing: string;
}

const SMSGatewayConfig = () => {
    const [providers, setProviders] = useState<SMSProvider[]>([
        {
            id: 'twilio',
            name: 'Twilio',
            logo: '📱',
            enabled: false,
            config: {
                accountSid: '',
                authToken: '',
                senderId: ''
            },
            pricing: '$0.0075/SMS'
        },
        {
            id: 'africas_talking',
            name: "Africa's Talking",
            logo: '🌍',
            enabled: false,
            config: {
                apiKey: '',
                username: '',
                senderId: ''
            },
            pricing: '~$0.02/SMS'
        },
        {
            id: 'termii',
            name: 'Termii',
            logo: '💬',
            enabled: false,
            config: {
                apiKey: '',
                senderId: ''
            },
            pricing: '~$0.015/SMS'
        },
        {
            id: 'bulk_sms_ng',
            name: 'BulkSMS Nigeria',
            logo: '📧',
            enabled: false,
            config: {
                apiKey: '',
                senderId: ''
            },
            pricing: '~₦2.50/SMS'
        }
    ]);

    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const toggleProvider = (id: string) => {
        setProviders(providers.map(p => 
            p.id === id ? { ...p, enabled: !p.enabled } : p
        ));
    };

    const updateProviderConfig = (id: string, field: string, value: any) => {
        setProviders(providers.map(p => 
            p.id === id ? { ...p, config: { ...p.config, [field]: value } } : p
        ));
    };

    const saveConfiguration = (id: string) => {
        const provider = providers.find(p => p.id === id);
        if (provider) {
            localStorage.setItem(`sms_provider_${id}`, JSON.stringify(provider));
            alert(`${provider.name} configuration saved successfully!`);
        }
    };

    const sendTestSMS = async () => {
        if (!testPhone || !testMessage) {
            alert('Please enter phone number and message');
            return;
        }
        
        setIsSending(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsSending(false);
        alert('Test SMS sent successfully!');
    };

    const toggleApiKeyVisibility = (providerId: string, field: string) => {
        const key = `${providerId}_${field}`;
        setShowApiKeys({ ...showApiKeys, [key]: !showApiKeys[key] });
    };

    const renderProviderCard = (provider: SMSProvider) => {
        const isSelected = selectedProvider === provider.id;

        return (
            <div
                key={provider.id}
                className={`bg-white border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    isSelected
                        ? 'border-purple-500 shadow-lg'
                        : provider.enabled
                        ? 'border-green-300 hover:border-green-400'
                        : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setSelectedProvider(provider.id)}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <span className="text-4xl">{provider.logo}</span>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">{provider.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                provider.enabled
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-slate-100 text-slate-600'
                            }`}>
                                {provider.enabled ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">{provider.pricing}</span>
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleProvider(provider.id);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            provider.enabled
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                    >
                        {provider.enabled ? 'Disable' : 'Enable'}
                    </button>
                </div>

                {isSelected && (
                    <div className="border-t border-slate-200 pt-4 mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                            <strong>Tip:</strong> Store API credentials securely. Test with small batches first.
                        </div>

                        {provider.id === 'twilio' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Account SID
                                    </label>
                                    <input
                                        type="text"
                                        value={provider.config.accountSid || ''}
                                        onChange={(e) => updateProviderConfig(provider.id, 'accountSid', e.target.value)}
                                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Auth Token
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showApiKeys[`${provider.id}_authToken`] ? 'text' : 'password'}
                                            value={provider.config.authToken || ''}
                                            onChange={(e) => updateProviderConfig(provider.id, 'authToken', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            onClick={() => toggleApiKeyVisibility(provider.id, 'authToken')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showApiKeys[`${provider.id}_authToken`] ? '👁️' : '🙈'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {provider.id === 'africas_talking' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={provider.config.username || ''}
                                        onChange={(e) => updateProviderConfig(provider.id, 'username', e.target.value)}
                                        placeholder="sandbox"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        API Key
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showApiKeys[`${provider.id}_apiKey`] ? 'text' : 'password'}
                                            value={provider.config.apiKey || ''}
                                            onChange={(e) => updateProviderConfig(provider.id, 'apiKey', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            onClick={() => toggleApiKeyVisibility(provider.id, 'apiKey')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showApiKeys[`${provider.id}_apiKey`] ? '👁️' : '🙈'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {(provider.id === 'termii' || provider.id === 'bulk_sms_ng') && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    API Key
                                </label>
                                <div className="relative">
                                    <input
                                        type={showApiKeys[`${provider.id}_apiKey`] ? 'text' : 'password'}
                                        value={provider.config.apiKey || ''}
                                        onChange={(e) => updateProviderConfig(provider.id, 'apiKey', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                        onClick={() => toggleApiKeyVisibility(provider.id, 'apiKey')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showApiKeys[`${provider.id}_apiKey`] ? '👁️' : '🙈'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Sender ID (Name displayed to recipients)
                            </label>
                            <input
                                type="text"
                                value={provider.config.senderId || ''}
                                onChange={(e) => updateProviderConfig(provider.id, 'senderId', e.target.value)}
                                placeholder="YourSchool"
                                maxLength={11}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Max 11 characters, alphanumeric</p>
                        </div>

                        <div className="flex space-x-3 pt-4 border-t border-slate-200">
                            <button
                                onClick={() => saveConfiguration(provider.id)}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const enabledCount = providers.filter(p => p.enabled).length;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">SMS Gateway Configuration</h1>
                <p className="text-purple-100">
                    Configure SMS providers to send bulk messages, notifications, and alerts
                </p>
                <div className="mt-4 inline-flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
                    <span className="font-semibold">{enabledCount}</span>
                    <span>provider{enabledCount !== 1 ? 's' : ''} active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {providers.map(provider => renderProviderCard(provider))}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Test SMS</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Phone Number (with country code)
                        </label>
                        <input
                            type="tel"
                            value={testPhone}
                            onChange={(e) => setTestPhone(e.target.value)}
                            placeholder="+234 803 123 4567"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Message
                        </label>
                        <textarea
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            placeholder="Hello! This is a test message from our SMS system."
                            rows={3}
                            maxLength={160}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">{testMessage.length}/160 characters</p>
                    </div>
                    <button
                        onClick={sendTestSMS}
                        disabled={isSending || !testPhone || !testMessage}
                        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? 'Sending...' : '📤 Send Test SMS'}
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-4">SMS Settings</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-900">Auto-send Payment Reminders</h4>
                            <p className="text-sm text-slate-500">Send SMS reminders for pending payments</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-900">Send Attendance Notifications</h4>
                            <p className="text-sm text-slate-500">Notify parents about student absences</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-900">Exam Results Notifications</h4>
                            <p className="text-sm text-slate-500">Send SMS when exam results are published</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                </div>
                <button className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Save SMS Settings
                </button>
            </div>
        </div>
    );
};

export default SMSGatewayConfig;