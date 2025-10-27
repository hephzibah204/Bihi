import React, { useState } from 'react';
import { apiSendMessage } from '../services/api';
import { SchoolSettings } from '../types';

interface IntegrationSettingsProps {
    settings: Partial<SchoolSettings>;
    onSettingsChange: (changed: Partial<SchoolSettings>) => void;
}

const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({ settings, onSettingsChange }) => {
    const [activeSection, setActiveSection] = useState<string>('payment');
    const [testPhone, setTestPhone] = useState('');
    const [testEmail, setTestEmail] = useState('');
    const [diagMsg, setDiagMsg] = useState<string>('');
    const [diagBusy, setDiagBusy] = useState<boolean>(false);
    
    const handleIntegrationChange = (field: string, value: string) => {
        onSettingsChange({
            integrations: {
                ...settings.integrations,
                [field]: value,
            },
        });
    };

    const integrations = settings.integrations || {};

    const sections = [
        { id: 'payment', name: 'Payment Gateways', icon: '💳' },
        { id: 'ai', name: 'AI Services', icon: '🤖' },
        { id: 'whatsapp', name: 'WhatsApp Business', icon: '📱' },
        { id: 'sms', name: 'SMS Gateways', icon: '📨' },
        { id: 'email', name: 'Email Services', icon: '📧' },
        { id: 'storage', name: 'Cloud Storage', icon: '☁️' },
        { id: 'analytics', name: 'Analytics', icon: '📊' },
        { id: 'notifications', name: 'Push Notifications', icon: '🔔' },
        { id: 'social', name: 'Social Media', icon: '🌐' },
        { id: 'other', name: 'Other APIs', icon: '🔧' },
    ];

    const renderPaymentSection = () => (
        <div className="space-y-6">
            {/* Paystack */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-green-600">💳</span> Paystack
                </h4>
                <p className="text-sm text-gray-500 mt-1">Nigerian payment gateway for local and international payments. <a href="https://paystack.com/" target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:underline">Get API keys</a></p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="paystack-public-key" className="label">Public Key</label>
                        <input 
                            id="paystack-public-key"
                            type="text" 
                            value={integrations.paystack_public_key || ''}
                            onChange={e => handleIntegrationChange('paystack_public_key', e.target.value)}
                            className="input-field" 
                            placeholder="pk_live_..."
                        />
                    </div>
                    <div>
                        <label htmlFor="paystack-secret-key" className="label">Secret Key</label>
                        <input 
                            id="paystack-secret-key"
                            type="password" 
                            value={integrations.paystack_secret_key || ''}
                            onChange={e => handleIntegrationChange('paystack_secret_key', e.target.value)}
                            className="input-field" 
                            placeholder="sk_live_..."
                        />
                    </div>
                </div>
            </div>

            {/* Flutterwave */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-orange-600">💳</span> Flutterwave
                </h4>
                <p className="text-sm text-gray-500 mt-1">African payment gateway supporting multiple countries and currencies. <a href="https://flutterwave.com/" target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:underline">Get API keys</a></p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Public Key</label>
                        <input 
                            type="text" 
                            value={integrations.flutterwave_public_key || ''}
                            onChange={e => handleIntegrationChange('flutterwave_public_key', e.target.value)}
                            className="input-field" 
                            placeholder="FLWPUBK_..."
                        />
                    </div>
                    <div>
                        <label className="label">Secret Key</label>
                        <input 
                            type="password" 
                            value={integrations.flutterwave_secret_key || ''}
                            onChange={e => handleIntegrationChange('flutterwave_secret_key', e.target.value)}
                            className="input-field" 
                            placeholder="FLWSECK_..."
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="label">Encryption Key</label>
                        <input 
                            type="password" 
                            value={integrations.flutterwave_encryption_key || ''}
                            onChange={e => handleIntegrationChange('flutterwave_encryption_key', e.target.value)}
                            className="input-field" 
                            placeholder="FLWSECK_TEST..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAISection = () => (
        <div className="space-y-6">
            {/* Gemini API */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-blue-600">🤖</span> Google Gemini API
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                    AI-powered features for content generation and analysis. 
                    <span className="font-medium text-orange-600"> If set, this will override the sitewide Gemini key.</span>
                </p>
                <div className="mt-4">
                    <label className="label">API Key</label>
                    <input 
                        type="password" 
                        value={integrations.gemini_api_key || ''}
                        onChange={e => handleIntegrationChange('gemini_api_key', e.target.value)}
                        className="input-field" 
                        placeholder="AIzaSy..."
                    />
                </div>
            </div>

            {/* OpenAI */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-green-600">🤖</span> OpenAI API
                </h4>
                <p className="text-sm text-gray-500 mt-1">ChatGPT and GPT models for advanced AI features</p>
                <div className="mt-4">
                    <label className="label">API Key</label>
                    <input 
                        type="password" 
                        value={integrations.openai_api_key || ''}
                        onChange={e => handleIntegrationChange('openai_api_key', e.target.value)}
                        className="input-field" 
                        placeholder="sk-..."
                    />
                </div>
            </div>
        </div>
    );

    const renderWhatsAppSection = () => (
        <div className="space-y-6">
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-green-600">📱</span> WhatsApp Business API
                </h4>
                <p className="text-sm text-gray-500 mt-1">Send notifications and messages via WhatsApp Business</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Access Token</label>
                        <input 
                            type="password" 
                            value={integrations.whatsapp_business_token || ''}
                            onChange={e => handleIntegrationChange('whatsapp_business_token', e.target.value)}
                            className="input-field" 
                            placeholder="EAAx..."
                        />
                    </div>
                    <div>
                        <label className="label">Phone Number ID</label>
                        <input 
                            type="text" 
                            value={integrations.whatsapp_phone_number_id || ''}
                            onChange={e => handleIntegrationChange('whatsapp_phone_number_id', e.target.value)}
                            className="input-field" 
                            placeholder="123456789012345"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="label">Webhook Verify Token</label>
                        <input 
                            type="password" 
                            value={integrations.whatsapp_webhook_verify_token || ''}
                            onChange={e => handleIntegrationChange('whatsapp_webhook_verify_token', e.target.value)}
                            className="input-field" 
                            placeholder="your_verify_token"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSMSSection = () => (
        <div className="space-y-6">
            {/* SMS Provider Selection */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">SMS Provider</h4>
                <p className="text-sm text-gray-500 mt-1">Choose your preferred Nigerian SMS gateway</p>
                <div className="mt-4">
                    <label className="label" htmlFor="sms-provider-select">Provider</label>
                    <select 
                        id="sms-provider-select"
                        value={integrations.sms_provider || 'termii'}
                        onChange={e => handleIntegrationChange('sms_provider', e.target.value)}
                        className="input-field"
                    >
                        <option value="termii">Termii</option>
                        <option value="smartsmssolutions">Smart SMS Solutions</option>
                        <option value="bulk-sms-nigeria">Bulk SMS Nigeria</option>
                        <option value="nigeriabulksms">Nigeria Bulk SMS</option>
                        <option value="custom">Custom Provider</option>
                    </select>
                </div>
            </div>

            {/* Termii */}
            {integrations.sms_provider === 'termii' && (
                <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                        <span className="text-blue-600">📨</span> Termii
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">Popular Nigerian SMS gateway with good delivery rates. <a href="https://termii.com/" target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:underline">Get API keys</a></p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">API Key</label>
                            <input 
                                type="password" 
                                value={integrations.termii_api_key || ''}
                                onChange={e => handleIntegrationChange('termii_api_key', e.target.value)}
                                className="input-field" 
                                placeholder="TL..."
                            />
                        </div>
                        <div>
                            <label className="label">Sender ID</label>
                            <input 
                                type="text" 
                                value={integrations.termii_sender_id || ''}
                                onChange={e => handleIntegrationChange('termii_sender_id', e.target.value)}
                                className="input-field" 
                                placeholder="MySchool"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Smart SMS Solutions */}
            {integrations.sms_provider === 'smartsmssolutions' && (
                <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                        <span className="text-green-600">📨</span> Smart SMS Solutions
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">Reliable SMS service with competitive pricing. <a href="https://smartsmssolutions.com/" target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:underline">Get API keys</a></p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Username</label>
                            <input 
                                type="text" 
                                value={integrations.smartsms_username || ''}
                                onChange={e => handleIntegrationChange('smartsms_username', e.target.value)}
                                className="input-field" 
                                placeholder="username"
                            />
                        </div>
                        <div>
                            <label className="label">Password</label>
                            <input 
                                type="password" 
                                value={integrations.smartsms_password || ''}
                                onChange={e => handleIntegrationChange('smartsms_password', e.target.value)}
                                className="input-field" 
                                placeholder="password"
                            />
                        </div>
                        <div>
                            <label className="label">Sender</label>
                            <input 
                                type="text" 
                                value={integrations.smartsms_sender || ''}
                                onChange={e => handleIntegrationChange('smartsms_sender', e.target.value)}
                                className="input-field" 
                                placeholder="MySchool"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk SMS Nigeria */}
            {integrations.sms_provider === 'bulk-sms-nigeria' && (
                <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                        <span className="text-purple-600">📨</span> Bulk SMS Nigeria
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">Affordable bulk SMS service for Nigerian businesses. <a href="https://www.bulksmsnigeria.com/" target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:underline">Get API keys</a></p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Username</label>
                            <input 
                                type="text" 
                                value={integrations.bulksms_username || ''}
                                onChange={e => handleIntegrationChange('bulksms_username', e.target.value)}
                                className="input-field" 
                                placeholder="username"
                            />
                        </div>
                        <div>
                            <label className="label">Password</label>
                            <input 
                                type="password" 
                                value={integrations.bulksms_password || ''}
                                onChange={e => handleIntegrationChange('bulksms_password', e.target.value)}
                                className="input-field" 
                                placeholder="password"
                            />
                        </div>
                        <div>
                            <label className="label">API Token</label>
                            <input 
                                type="password" 
                                value={integrations.bulksms_api_token || ''}
                                onChange={e => handleIntegrationChange('bulksms_api_token', e.target.value)}
                                className="input-field" 
                                placeholder="token-..."
                            />
                        </div>
                        <div>
                            <label className="label">Sender ID</label>
                            <input 
                                type="text" 
                                value={integrations.bulksms_sender || ''}
                                onChange={e => handleIntegrationChange('bulksms_sender', e.target.value)}
                                className="input-field" 
                                placeholder="MySchool"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Nigeria Bulk SMS */}
            {integrations.sms_provider === 'nigeriabulksms' && (
                <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                        <span className="text-red-600">📨</span> Nigeria Bulk SMS
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">Fast and reliable SMS delivery across Nigeria. <a href="https://www.nigeriabulksms.com/" target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:underline">Get API keys</a></p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Username</label>
                            <input 
                                type="text" 
                                value={integrations.nigeriabulksms_username || ''}
                                onChange={e => handleIntegrationChange('nigeriabulksms_username', e.target.value)}
                                className="input-field" 
                                placeholder="username"
                            />
                        </div>
                        <div>
                            <label className="label">Password</label>
                            <input 
                                type="password" 
                                value={integrations.nigeriabulksms_password || ''}
                                onChange={e => handleIntegrationChange('nigeriabulksms_password', e.target.value)}
                                className="input-field" 
                                placeholder="password"
                            />
                        </div>
                        <div>
                            <label className="label">Sender ID</label>
                            <input 
                                type="text" 
                                value={integrations.nigeriabulksms_sender || ''}
                                onChange={e => handleIntegrationChange('nigeriabulksms_sender', e.target.value)}
                                className="input-field" 
                                placeholder="MySchool"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Provider */}
            {integrations.sms_provider === 'custom' && (
                <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2">
                        <span className="text-gray-600">📨</span> Custom SMS Provider
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">Configure your own SMS gateway</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">API Key</label>
                            <input 
                                type="password" 
                                value={integrations.sms_api_key || ''}
                                onChange={e => handleIntegrationChange('sms_api_key', e.target.value)}
                                className="input-field" 
                                placeholder="Your API Key"
                            />
                        </div>
                        <div>
                            <label className="label">Sender ID</label>
                            <input 
                                type="text" 
                                value={integrations.sms_sender_id || ''}
                                onChange={e => handleIntegrationChange('sms_sender_id', e.target.value)}
                                className="input-field" 
                                placeholder="MySchool"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">API URL</label>
                            <input 
                                type="url" 
                                value={integrations.sms_api_url || ''}
                                onChange={e => handleIntegrationChange('sms_api_url', e.target.value)}
                                className="input-field" 
                                placeholder="https://api.yourprovider.com/sms"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Diagnostics */}
            <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold">Diagnostics</h4>
                <p className="text-sm text-gray-500 mt-1">Send a test SMS to verify your current provider setup.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="label" htmlFor="sms-test-phone">Test Phone Number</label>
                        <input
                            id="sms-test-phone"
                            type="tel"
                            value={testPhone}
                            onChange={e => setTestPhone(e.target.value)}
                            className="input-field"
                            placeholder="2348XXXXXXXXX"
                        />
                    </div>
                    <div className="md:col-span-2 flex items-end">
                        <button
                            onClick={async () => {
                                setDiagBusy(true);
                                setDiagMsg('');
                                try {
                                    await apiSendMessage({ channel: 'sms', content: 'This is a test SMS from ReportSheet.', recipients: [testPhone], type: 'direct' });
                                    setDiagMsg('Test SMS sent successfully. Check the phone for delivery.');
                                } catch (err: unknown) {
                                    const msg = (err as { message?: string })?.message || 'Unknown error';
                                    setDiagMsg(`SMS test failed: ${msg}`);
                                } finally {
                                    setDiagBusy(false);
                                }
                            }}
                            className="btn btn-secondary"
                            disabled={diagBusy || !testPhone}
                        >
                            {diagBusy ? 'Sending...' : 'Send Test SMS'}
                        </button>
                    </div>
                </div>
                {diagMsg && <p className="mt-3 text-sm text-gray-700">{diagMsg}</p>}
            </div>
        </div>
    );

    const renderEmailSection = () => (
        <div className="space-y-6">
                        {/* SendGrid */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-blue-600">📧</span> SendGrid
                </h4>
                <p className="text-sm text-gray-500 mt-1">Reliable email delivery service. <a href="https://sendgrid.com/" target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:underline">Get API keys</a></p>
                <div className="mt-4">
                    <label className="label">API Key</label>
                    <input
                        type="password"
                        value={integrations.sendgrid_api_key || ''}
                        onChange={e => handleIntegrationChange('sendgrid_api_key', e.target.value)}
                        className="input-field"
                        placeholder="SG..."
                    />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">From Email</label>
                        <input
                            type="email"
                            value={integrations.sendgrid_from_email || ''}
                            onChange={e => handleIntegrationChange('sendgrid_from_email', e.target.value)}
                            className="input-field"
                            placeholder="no-reply@yourdomain.com"
                        />
                    </div>
                    <div>
                        <label className="label">From Name</label>
                        <input
                            type="text"
                            value={integrations.sendgrid_from_name || ''}
                            onChange={e => handleIntegrationChange('sendgrid_from_name', e.target.value)}
                            className="input-field"
                            placeholder="Your School Name"
                        />
                    </div>
                </div>
            </div>

            {/* Mailgun */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-red-600">📧</span> Mailgun
                </h4>
                <p className="text-sm text-gray-500 mt-1">Powerful email API for developers. <a href="https://www.mailgun.com/" target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:underline">Get API keys</a></p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">API Key</label>
                        <input 
                            type="password" 
                            value={integrations.mailgun_api_key || ''}
                            onChange={e => handleIntegrationChange('mailgun_api_key', e.target.value)}
                            className="input-field" 
                            placeholder="key-..."
                        />
                                    <div className="mt-4">
                    <label className="label">From Email</label>
                    <input
                        type="email"
                        value={integrations.mailgun_from_email || ''}
                        onChange={e => handleIntegrationChange('mailgun_from_email', e.target.value)}
                        className="input-field"
                        placeholder="no-reply@yourdomain.com"
                    />
                </div></div>
                    <div>
                        <label className="label">Domain</label>
                        <input 
                            type="text" 
                            value={integrations.mailgun_domain || ''}
                            onChange={e => handleIntegrationChange('mailgun_domain', e.target.value)}
                            className="input-field" 
                            placeholder="mg.yourdomain.com"
                        />
                    </div>
                </div>
            </div>

            {/* Diagnostics */}
            <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold">Diagnostics</h4>
                <p className="text-sm text-gray-500 mt-1">Send a test email using the current email provider.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="label" htmlFor="email-test-address">Test Email Address</label>
                        <input
                            id="email-test-address"
                            type="email"
                            value={testEmail}
                            onChange={e => setTestEmail(e.target.value)}
                            className="input-field"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="md:col-span-2 flex items-end">
                        <button
                            onClick={async () => {
                                setDiagBusy(true);
                                setDiagMsg('');
                                try {
                                    await apiSendMessage({ channel: 'email', content: 'This is a test email from ReportSheet.', recipients: [testEmail], type: 'direct' });
                                    setDiagMsg('Test email queued successfully. Check the inbox for delivery.');
                                } catch (err: unknown) {
                                    const msg = (err as { message?: string })?.message || 'Unknown error';
                                    setDiagMsg(`Email test failed: ${msg}`);
                                } finally {
                                    setDiagBusy(false);
                                }
                            }}
                            className="btn btn-secondary"
                            disabled={diagBusy || !testEmail}
                        >
                            {diagBusy ? 'Sending...' : 'Send Test Email'}
                        </button>
                    </div>
                </div>
                {diagMsg && <p className="mt-3 text-sm text-gray-700">{diagMsg}</p>}
            </div>
        </div>
    );

    const renderStorageSection = () => (
        <div className="space-y-6">
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-blue-600">☁️</span> Cloudinary
                </h4>
                <p className="text-sm text-gray-500 mt-1">Image and video management in the cloud</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Cloud Name</label>
                        <input 
                            type="text" 
                            value={integrations.cloudinary_cloud_name || ''}
                            onChange={e => handleIntegrationChange('cloudinary_cloud_name', e.target.value)}
                            className="input-field" 
                            placeholder="your-cloud-name"
                        />
                    </div>
                    <div>
                        <label className="label">API Key</label>
                        <input 
                            type="text" 
                            value={integrations.cloudinary_api_key || ''}
                            onChange={e => handleIntegrationChange('cloudinary_api_key', e.target.value)}
                            className="input-field" 
                            placeholder="123456789012345"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="label">API Secret</label>
                        <input 
                            type="password" 
                            value={integrations.cloudinary_api_secret || ''}
                            onChange={e => handleIntegrationChange('cloudinary_api_secret', e.target.value)}
                            className="input-field" 
                            placeholder="abcdefghijklmnopqrstuvwxyz"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAnalyticsSection = () => (
        <div className="space-y-6">
            {/* Google Analytics */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-orange-600">📊</span> Google Analytics
                </h4>
                <p className="text-sm text-gray-500 mt-1">Track website usage and user behavior</p>
                <div className="mt-4">
                    <label className="label">Measurement ID</label>
                    <input 
                        type="text" 
                        value={integrations.google_analytics_id || ''}
                        onChange={e => handleIntegrationChange('google_analytics_id', e.target.value)}
                        className="input-field" 
                        placeholder="G-XXXXXXXXXX"
                    />
                </div>
            </div>

            {/* Mixpanel */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-purple-600">📊</span> Mixpanel
                </h4>
                <p className="text-sm text-gray-500 mt-1">Advanced product analytics</p>
                <div className="mt-4">
                    <label className="label">Project Token</label>
                    <input 
                        type="text" 
                        value={integrations.mixpanel_token || ''}
                        onChange={e => handleIntegrationChange('mixpanel_token', e.target.value)}
                        className="input-field" 
                        placeholder="abcdef1234567890"
                    />
                </div>
            </div>
        </div>
    );

    const renderNotificationsSection = () => (
        <div className="space-y-6">
            {/* Firebase */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-orange-600">🔔</span> Firebase Cloud Messaging
                </h4>
                <p className="text-sm text-gray-500 mt-1">Push notifications for mobile and web apps</p>
                <div className="mt-4">
                    <label className="label">Server Key</label>
                    <input 
                        type="password" 
                        value={integrations.firebase_server_key || ''}
                        onChange={e => handleIntegrationChange('firebase_server_key', e.target.value)}
                        className="input-field" 
                        placeholder="AAAA..."
                    />
                </div>
            </div>

            {/* OneSignal */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-red-600">🔔</span> OneSignal
                </h4>
                <p className="text-sm text-gray-500 mt-1">Multi-platform push notification service</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">App ID</label>
                        <input 
                            type="text" 
                            value={integrations.onesignal_app_id || ''}
                            onChange={e => handleIntegrationChange('onesignal_app_id', e.target.value)}
                            className="input-field" 
                            placeholder="12345678-1234-1234-1234-123456789012"
                        />
                    </div>
                    <div>
                        <label className="label">API Key</label>
                        <input 
                            type="password" 
                            value={integrations.onesignal_api_key || ''}
                            onChange={e => handleIntegrationChange('onesignal_api_key', e.target.value)}
                            className="input-field" 
                            placeholder="YWJjZGVm..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSocialSection = () => (
        <div className="space-y-6">
            {/* Facebook */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-blue-600">🌐</span> Facebook
                </h4>
                <p className="text-sm text-gray-500 mt-1">Facebook login and social features</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">App ID</label>
                        <input 
                            type="text" 
                            value={integrations.facebook_app_id || ''}
                            onChange={e => handleIntegrationChange('facebook_app_id', e.target.value)}
                            className="input-field" 
                            placeholder="123456789012345"
                        />
                    </div>
                    <div>
                        <label className="label">App Secret</label>
                        <input 
                            type="password" 
                            value={integrations.facebook_app_secret || ''}
                            onChange={e => handleIntegrationChange('facebook_app_secret', e.target.value)}
                            className="input-field" 
                            placeholder="abcdef1234567890"
                        />
                    </div>
                </div>
            </div>

            {/* Twitter */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-blue-400">🌐</span> Twitter/X
                </h4>
                <p className="text-sm text-gray-500 mt-1">Twitter API integration</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">API Key</label>
                        <input 
                            type="password" 
                            value={integrations.twitter_api_key || ''}
                            onChange={e => handleIntegrationChange('twitter_api_key', e.target.value)}
                            className="input-field" 
                            placeholder="abcdefghijklmnopqrstuvwx"
                        />
                    </div>
                    <div>
                        <label className="label">API Secret</label>
                        <input 
                            type="password" 
                            value={integrations.twitter_api_secret || ''}
                            onChange={e => handleIntegrationChange('twitter_api_secret', e.target.value)}
                            className="input-field" 
                            placeholder="abcdefghijklmnopqrstuvwxyz1234567890"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderOtherSection = () => (
        <div className="space-y-6">
            {/* Google Maps */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-green-600">🔧</span> Google Maps
                </h4>
                <p className="text-sm text-gray-500 mt-1">Location services and mapping</p>
                <div className="mt-4">
                    <label className="label">API Key</label>
                    <input 
                        type="password" 
                        value={integrations.google_maps_api_key || ''}
                        onChange={e => handleIntegrationChange('google_maps_api_key', e.target.value)}
                        className="input-field" 
                        placeholder="AIzaSy..."
                    />
                </div>
            </div>

            {/* reCAPTCHA */}
            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                    <span className="text-gray-600">🔧</span> Google reCAPTCHA
                </h4>
                <p className="text-sm text-gray-500 mt-1">Protect forms from spam and abuse</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Site Key</label>
                        <input 
                            type="text" 
                            value={integrations.recaptcha_site_key || ''}
                            onChange={e => handleIntegrationChange('recaptcha_site_key', e.target.value)}
                            className="input-field" 
                            placeholder="6Lc..."
                        />
                    </div>
                    <div>
                        <label className="label">Secret Key</label>
                        <input 
                            type="password" 
                            value={integrations.recaptcha_secret_key || ''}
                            onChange={e => handleIntegrationChange('recaptcha_secret_key', e.target.value)}
                            className="input-field" 
                            placeholder="6Lc..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'payment': return renderPaymentSection();
            case 'ai': return renderAISection();
            case 'whatsapp': return renderWhatsAppSection();
            case 'sms': return renderSMSSection();
            case 'email': return renderEmailSection();
            case 'storage': return renderStorageSection();
            case 'analytics': return renderAnalyticsSection();
            case 'notifications': return renderNotificationsSection();
            case 'social': return renderSocialSection();
            case 'other': return renderOtherSection();
            default: return renderPaymentSection();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold">API Integrations</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Connect third-party services to enhance your school management system. 
                    All secret keys are stored securely and encrypted.
                </p>
            </div>

            {/* Section Navigation */}
            <div className="border-b">
                <nav className="flex space-x-8 overflow-x-auto">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                activeSection === section.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <span>{section.icon}</span>
                            {section.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Section Content */}
            <div className="mt-6">
                {renderSectionContent()}
            </div>

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <span className="text-blue-600">🔒</span>
                    </div>
                    <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">Security Notice</h4>
                        <p className="mt-1 text-sm text-blue-700">
                            All API keys and sensitive information are encrypted and stored securely. 
                            Secret keys are never exposed to client-side code or logs. 
                            Only authorized server-side processes can access these credentials.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntegrationSettings;


