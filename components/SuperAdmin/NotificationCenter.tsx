import React, { useState } from 'react';

type NotificationChannel = 'system' | 'email' | 'sms' | 'in-app';

const NotificationCenter = () => {
    const [activeChannel, setActiveChannel] = useState<NotificationChannel>('system');
    const [digestEnabled, setDigestEnabled] = useState(true);

    const scheduledAlerts = [
        {
            title: 'Daily Finance Digest',
            audience: 'Super Admins',
            time: '07:00 AM',
            channel: 'Email',
            status: 'Active'
        },
        {
            title: 'Infrastructure Health',
            audience: 'DevOps Team',
            time: 'Hourly',
            channel: 'In-app',
            status: 'Active'
        },
        {
            title: 'Debtor Escalation',
            audience: 'Bursary Officers',
            time: 'Immediate',
            channel: 'SMS',
            status: 'Paused'
        }
    ];

    const renderChannelSettings = () => {
        switch (activeChannel) {
            case 'email':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900">Digest Summary</h4>
                                <p className="text-xs text-slate-500">Send a daily overview of key activities</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={digestEnabled}
                                    onChange={() => setDigestEnabled(prev => !prev)}
                                />
                                <span className="w-11 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:h-5 after:w-5 after:bg-white after:rounded-full after:top-[2px] after:left-[2px] peer-checked:after:translate-x-full"></span>
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'Sender Name', value: 'Bihi ControlHub' },
                                { label: 'Reply-to Email', value: 'no-reply@bihi.app' },
                                { label: 'DKIM Status', value: 'Verified' },
                                { label: 'Template Version', value: 'v3.2' }
                            ].map(setting => (
                                <div key={setting.label} className="bg-white border border-slate-200 p-4 rounded-lg">
                                    <p className="text-xs text-slate-500 uppercase">{setting.label}</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-1">{setting.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'sms':
                return (
                    <div className="space-y-4">
                        <div className="bg-white border border-slate-200 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">SMS Gateway</h4>
                            <p className="text-xs text-slate-500">Twilio · Nigeria Sender ID Verified</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Daily Quota', value: '2,500' },
                                { label: 'Usage', value: '42%' },
                                { label: 'Delivery Rate', value: '96%' }
                            ].map(item => (
                                <div key={item.label} className="bg-slate-50 p-4 rounded-lg">
                                    <p className="text-xs text-slate-500 uppercase">{item.label}</p>
                                    <p className="text-lg font-semibold text-slate-900 mt-1">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'in-app':
                return (
                    <div className="space-y-4">
                        <div className="bg-white border border-slate-200 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">In-app Stream</h4>
                            <p className="text-xs text-slate-500">Displayed in ControlHub activity feed and real-time toasts.</p>
                        </div>
                        <div className="space-y-3">
                            {['System Health', 'AI Insights', 'Security Events', 'Finance Alerts'].map(channel => (
                                <label key={channel} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                                    <span className="text-sm font-medium text-slate-700">{channel}</span>
                                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                                </label>
                            ))}
                        </div>
                    </div>
                );
            case 'system':
            default:
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[{ label: 'Critical', value: 4, color: 'bg-red-100 text-red-700' }, { label: 'Warnings', value: 9, color: 'bg-amber-100 text-amber-700' }, { label: 'Informational', value: 32, color: 'bg-blue-100 text-blue-700' }, { label: 'Resolved', value: 18, color: 'bg-emerald-100 text-emerald-700' }].map(item => (
                                <div key={item.label} className={`p-4 rounded-lg ${item.color}`}>
                                    <p className="text-xs uppercase">{item.label}</p>
                                    <p className="text-2xl font-semibold mt-2">{item.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white border border-slate-200 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3">Recent Events</h4>
                            <div className="space-y-3">
                                {[
                                    { message: 'New plugin version deployed', time: '3 minutes ago', severity: 'Info' },
                                    { message: 'High memory usage on api-eu cluster', time: '12 minutes ago', severity: 'Warning' },
                                    { message: 'Background job retries exceeded threshold', time: '34 minutes ago', severity: 'Critical' }
                                ].map(event => (
                                    <div key={event.message} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{event.message}</p>
                                            <p className="text-xs text-slate-500 mt-1">{event.time}</p>
                                        </div>
                                        <span className="text-xs font-semibold text-blue-600">{event.severity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
        }
    };

    const channelOptions: { id: NotificationChannel; label: string; icon: string }[] = [
        { id: 'system', label: 'System Feed', icon: '🖥️' },
        { id: 'email', label: 'Email', icon: '📧' },
        { id: 'sms', label: 'SMS', icon: '📱' },
        { id: 'in-app', label: 'In-app', icon: '🔔' }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Notification Center</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage automated alerts, delivery channels, and communication policies.</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        ➕ Create Alert Rule
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex flex-wrap gap-2">
                    {channelOptions.map(option => (
                        <button
                            key={option.id}
                            onClick={() => setActiveChannel(option.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                                activeChannel === option.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Scheduled Alerts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {scheduledAlerts.map(alert => (
                        <div key={alert.title} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{alert.audience}</p>
                            <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
                                <span>{alert.time}</span>
                                <span>{alert.channel}</span>
                            </div>
                            <span className="inline-flex mt-3 text-xs font-semibold text-emerald-600">{alert.status}</span>
                        </div>
                    ))}
                </div>

                <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-sm font-semibold text-slate-900 mb-4">Channel Configuration</h4>
                    {renderChannelSettings()}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;

