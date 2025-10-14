import React from 'react';
import { SchoolSettings } from '../types';

interface IntegrationSettingsProps {
    settings: Partial<SchoolSettings>;
    onSettingsChange: (changed: Partial<SchoolSettings>) => void;
}

const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({ settings, onSettingsChange }) => {
    
    const handleIntegrationChange = (field: string, value: string) => {
        onSettingsChange({
            integrations: {
                ...settings.integrations,
                [field]: value,
            },
        });
    };

    const integrations = settings.integrations || {};

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold">Service Integrations</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Connect third-party services by providing your API keys. Secret keys are stored securely and are not visible to users.
                </p>
            </div>

            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">Paystack (Payment Gateway)</h4>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Public Key</label>
                        <input 
                            type="text" 
                            value={integrations.paystack_public_key || ''}
                            onChange={e => handleIntegrationChange('paystack_public_key', e.target.value)}
                            className="input-field" 
                            placeholder="pk_live_..."
                        />
                    </div>
                    <div>
                        <label className="label">Secret Key</label>
                        <input 
                            type="password" 
                            value={integrations.paystack_secret_key || ''}
                            onChange={e => handleIntegrationChange('paystack_secret_key', e.target.value)}
                            className="input-field" 
                            placeholder="sk_live_..."
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">SMS Gateway</h4>
                 <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">SMS API Key</label>
                        <input 
                            type="password" 
                            value={integrations.sms_api_key || ''}
                            onChange={e => handleIntegrationChange('sms_api_key', e.target.value)}
                            className="input-field" 
                            placeholder="Your SMS Provider API Key"
                        />
                    </div>
                    <div>
                        <label className="label">Sender ID</label>
                        <input 
                            type="text" 
                            value={integrations.sms_sender_id || ''}
                            onChange={e => handleIntegrationChange('sms_sender_id', e.target.value)}
                            className="input-field" 
                            placeholder="e.g., MySchool"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntegrationSettings;
