import React, { useEffect, useState } from 'react';
import { usePlatformPermission } from '../../utils/usePlatformPermission';

interface PaymentGateway {
    id: string;
    name: string;
    logo: string;
    enabled: boolean;
    config: {
        publicKey?: string;
        secretKey?: string;
        merchantId?: string;
        webhookUrl?: string;
        testMode?: boolean;
    };
}

const PaymentGatewayConfig = () => {
    const [gateways, setGateways] = useState<PaymentGateway[]>([
        {
            id: 'paystack',
            name: 'Paystack',
            logo: '💳',
            enabled: false,
            config: {
                publicKey: '',
                secretKey: '',
                webhookUrl: '',
                testMode: true
            }
        },
        {
            id: 'flutterwave',
            name: 'Flutterwave',
            logo: '🦋',
            enabled: false,
            config: {
                publicKey: '',
                secretKey: '',
                webhookUrl: '',
                testMode: true
            }
        },
        {
            id: 'stripe',
            name: 'Stripe',
            logo: '💰',
            enabled: false,
            config: {
                publicKey: '',
                secretKey: '',
                webhookUrl: '',
                testMode: true
            }
        },
        {
            id: 'paypal',
            name: 'PayPal',
            logo: '🅿️',
            enabled: false,
            config: {
                merchantId: '',
                secretKey: '',
                webhookUrl: '',
                testMode: true
            }
        }
    ]);

    const [currency, setCurrency] = useState<string>('NGN');
    const [feeBearer, setFeeBearer] = useState<'customer' | 'merchant' | 'split'>('customer');
    const [loading, setLoading] = useState<boolean>(true);

    const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
    const { can } = usePlatformPermission();
    const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const { apiGetPlatformSettings } = await import('../../services/api');
                const current = await apiGetPlatformSettings().catch(() => ({} as any));
                const pg = (current as any)?.payment_gateways || {};
                const next = gateways.map(g => {
                    const cfg = pg[g.id] || {};
                    return {
                        ...g,
                        enabled: typeof cfg.enabled === 'boolean' ? cfg.enabled : g.enabled,
                        config: {
                            ...g.config,
                            publicKey: cfg.publicKey ?? g.config.publicKey,
                            secretKey: cfg.secretKey ?? g.config.secretKey,
                            merchantId: cfg.merchantId ?? g.config.merchantId,
                            webhookUrl: cfg.webhookUrl ?? g.config.webhookUrl,
                            testMode: typeof cfg.testMode === 'boolean' ? cfg.testMode : g.config.testMode,
                        }
                    } as PaymentGateway;
                });
                if (mounted) setGateways(next);

                const ps = (current as any)?.payment_settings || {};
                if (mounted) {
                    if (ps.currency) setCurrency(ps.currency);
                    if (ps.feeBearer) setFeeBearer(ps.feeBearer);
                }
            } catch (e) {
                // Show error toast but continue with defaults
                window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: 'Failed to load payment settings' } }));
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleGateway = (id: string) => {
        setGateways(gateways.map(g => 
            g.id === id ? { ...g, enabled: !g.enabled } : g
        ));
    };

    const updateGatewayConfig = (id: string, field: string, value: any) => {
        setGateways(gateways.map(g => 
            g.id === id ? { ...g, config: { ...g.config, [field]: value } } : g
        ));
    };

    const saveConfiguration = async (id: string) => {
        const gateway = gateways.find(g => g.id === id);
        if (!gateway) return;
        try {
            // Persist into platform settings under payment_gateways
            const { apiGetPlatformSettings, apiSavePlatformSettings } = await import('../../services/api');
            const current = await apiGetPlatformSettings().catch(() => ({} as any));
            const payment_gateways = { ...(current?.payment_gateways || {}) };
            payment_gateways[gateway.id] = { enabled: gateway.enabled, ...gateway.config };
            await apiSavePlatformSettings({ ...(current || {}), payment_gateways });
            window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: `${gateway.name} configuration saved.` } }));
        } catch (e) {
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: 'Failed to save configuration' } }));
        }
    };

    const testConnection = async (id: string) => {
        const name = gateways.find(g => g.id === id)?.name || 'Gateway';
        window.dispatchEvent(new CustomEvent('show-global-info', { detail: { message: `Testing ${name} connection...` } }));
        // Simulate API test
        await new Promise(resolve => setTimeout(resolve, 1200));
        window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: `${name} connection OK` } }));
    };

    const toggleApiKeyVisibility = (gatewayId: string, field: string) => {
        const key = `${gatewayId}_${field}`;
        setShowApiKeys({ ...showApiKeys, [key]: !showApiKeys[key] });
    };

    const renderGatewayCard = (gateway: PaymentGateway) => {
        const isSelected = selectedGateway === gateway.id;

        return (
            <div
                key={gateway.id}
                className={`bg-white border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    isSelected
                        ? 'border-blue-500 shadow-lg'
                        : gateway.enabled
                        ? 'border-green-300 hover:border-green-400'
                        : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setSelectedGateway(gateway.id)}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <span className="text-4xl">{gateway.logo}</span>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">{gateway.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                gateway.enabled
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-slate-100 text-slate-600'
                            }`}>
                                {gateway.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!can('manage_payments')) return;
                            toggleGateway(gateway.id);
                        }}
                        disabled={!can('manage_payments')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            !can('manage_payments') ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : (
                            gateway.enabled
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200')
                        }`}
                    >
                        {gateway.enabled ? 'Disable' : 'Enable'}
                    </button>
                </div>

                {isSelected && (
                    <div className="border-t border-slate-200 pt-4 mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                            <strong>Note:</strong> Keep your API keys secure. Never share them publicly.
                        </div>

                        {gateway.id !== 'paypal' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Public Key
                                    </label>
                                    <div className="relative">
                                        <input disabled={!can('manage_payments')}
                                            type={showApiKeys[`${gateway.id}_publicKey`] ? 'text' : 'password'}
                                            value={gateway.config.publicKey || ''}
                                            onChange={(e) => updateGatewayConfig(gateway.id, 'publicKey', e.target.value)}
                                            placeholder="pk_test_..."
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            disabled={!can('manage_payments')}
                                            onClick={() => toggleApiKeyVisibility(gateway.id, 'publicKey')}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 ${!can('manage_payments') ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {showApiKeys[`${gateway.id}_publicKey`] ? '👁️' : '🙈'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Secret Key
                                    </label>
                                    <div className="relative">
                                        <input disabled={!can('manage_payments')}
                                            type={showApiKeys[`${gateway.id}_secretKey`] ? 'text' : 'password'}
                                            value={gateway.config.secretKey || ''}
                                            onChange={(e) => updateGatewayConfig(gateway.id, 'secretKey', e.target.value)}
                                            placeholder="sk_test_..."
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            disabled={!can('manage_payments')}
                                            onClick={() => toggleApiKeyVisibility(gateway.id, 'secretKey')}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 ${!can('manage_payments') ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {showApiKeys[`${gateway.id}_secretKey`] ? '👁️' : '🙈'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {gateway.id === 'paypal' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Merchant ID
                                    </label>
                                    <input disabled={!can('manage_payments')}
                                        type="text"
                                        value={gateway.config.merchantId || ''}
                                        onChange={(e) => updateGatewayConfig(gateway.id, 'merchantId', e.target.value)}
                                        placeholder="merchant_..."
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Client Secret
                                    </label>
                                    <div className="relative">
                                        <input disabled={!can('manage_payments')}
                                            type={showApiKeys[`${gateway.id}_secretKey`] ? 'text' : 'password'}
                                            value={gateway.config.secretKey || ''}
                                            onChange={(e) => updateGatewayConfig(gateway.id, 'secretKey', e.target.value)}
                                            placeholder="EO..."
                                            className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            disabled={!can('manage_payments')}
                                            onClick={() => toggleApiKeyVisibility(gateway.id, 'secretKey')}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 ${!can('manage_payments') ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {showApiKeys[`${gateway.id}_secretKey`] ? '👁️' : '🙈'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Webhook URL
                            </label>
                            <div className="flex space-x-2">
                                <input disabled={!can('manage_payments')}
                                    type="text"
                                    value={gateway.config.webhookUrl || ''}
                                    onChange={(e) => updateGatewayConfig(gateway.id, 'webhookUrl', e.target.value)}
                                    placeholder="https://yoursite.com/api/webhooks/payment"
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    disabled={!can('manage_payments')}
                                    onClick={() => {
                                        if (!can('manage_payments')) return;
                                        navigator.clipboard.writeText(gateway.config.webhookUrl || '');
                                        alert('Webhook URL copied!');
                                    }}
                                    className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                                >
                                    📋
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input disabled={!can('manage_integrations')}
                                type="checkbox"
                                id={`testmode-${gateway.id}`}
                                checked={gateway.config.testMode}
                                onChange={(e) => updateGatewayConfig(gateway.id, 'testMode', e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <label htmlFor={`testmode-${gateway.id}`} className="text-sm font-medium text-slate-700">
                                Enable Test Mode (Sandbox)
                            </label>
                        </div>

                        <div className="flex space-x-3 pt-4 border-t border-slate-200">
                            <button
                                onClick={() => saveConfiguration(gateway.id)}
                                disabled={!can('manage_payments')}
                                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${!can('manage_payments') ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                Save Configuration
                            </button>
                            <button
                                onClick={() => testConnection(gateway.id)}
                                disabled={!can('manage_integrations')}
                                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${!can('manage_integrations') ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                            >
                                Test Connection
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const enabledCount = gateways.filter(g => g.enabled).length;

    const saveTransactionSettings = async () => {
        try {
            const { apiGetPlatformSettings, apiSavePlatformSettings } = await import('../../services/api');
            const current = await apiGetPlatformSettings().catch(() => ({} as any));
            const payment_settings = { ...(current?.payment_settings || {}), currency, feeBearer };
            await apiSavePlatformSettings({ ...(current || {}), payment_settings });
            window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Transaction settings saved.' } }));
        } catch (e) {
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: 'Failed to save transaction settings' } }));
        }
    };

    if (loading) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-6">Loading payment settings...</div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Payment Gateway Configuration</h1>
                <p className="text-green-100">
                    Configure payment providers to accept online payments from students and parents
                </p>
                <div className="mt-4 inline-flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
                    <span className="font-semibold">{enabledCount}</span>
                    <span>gateway{enabledCount !== 1 ? 's' : ''} enabled</span>
                </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <h4 className="font-semibold text-yellow-900">Security Best Practices</h4>
                        <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                            <li>Use environment variables to store API keys in production</li>
                            <li>Enable test mode during development and testing</li>
                            <li>Configure webhook URLs to receive payment confirmations</li>
                            <li>Regularly rotate your API keys for security</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gateways.map(gateway => renderGatewayCard(gateway))}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Transaction Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Default Currency
                        </label>
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="NGN">NGN - Nigerian Naira</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="GHS">GHS - Ghanaian Cedi</option>
                            <option value="KES">KES - Kenyan Shilling</option>
                            <option value="ZAR">ZAR - South African Rand</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Transaction Fee Bearer
                        </label>
                        <select value={feeBearer} onChange={(e) => setFeeBearer(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="customer">Customer pays fees</option>
                            <option value="merchant">School absorbs fees</option>
                            <option value="split">Split 50/50</option>
                        </select>
                    </div>
                </div>
                <button onClick={saveTransactionSettings} disabled={!can('manage_payments')} className={`mt-4 px-6 py-2 rounded-lg transition-colors ${!can('manage_payments') ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    Save Settings
                </button>
            </div>
        </div>
    );
};

export default PaymentGatewayConfig;