import React, { useState } from 'react';

interface AnalyticsData {
    pageViews: number;
    uniqueVisitors: number;
    avgSessionDuration: string;
    bounceRate: string;
    topPages: { page: string; views: number; avgTime: string }[];
    traffic: { date: string; views: number; users: number }[];
    topCountries: { country: string; users: number; percentage: number }[];
    devices: { device: string; percentage: number; users: number }[];
    conversionRate: number;
    totalSignups: number;
}

const AnalyticsDashboard = () => {
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
    const [isGAConnected, setIsGAConnected] = useState(true);
    const [showGASetup, setShowGASetup] = useState(false);
    
    const [analytics] = useState<AnalyticsData>({
        pageViews: 125847,
        uniqueVisitors: 42356,
        avgSessionDuration: '4m 32s',
        bounceRate: '42.3%',
        topPages: [
            { page: '/', views: 35420, avgTime: '5m 12s' },
            { page: '/pricing', views: 18765, avgTime: '3m 45s' },
            { page: '/features', views: 15230, avgTime: '4m 20s' },
            { page: '/blog/improve-fee-collection', views: 8942, avgTime: '6m 10s' },
            { page: '/knowledge-base/setup-guide', views: 6123, avgTime: '8m 35s' }
        ],
        traffic: [
            { date: '2024-01-01', views: 3245, users: 1204 },
            { date: '2024-01-02', views: 3567, users: 1389 },
            { date: '2024-01-03', views: 2987, users: 1123 },
            { date: '2024-01-04', views: 4123, users: 1567 },
            { date: '2024-01-05', views: 4567, users: 1789 },
            { date: '2024-01-06', views: 3876, users: 1456 },
            { date: '2024-01-07', views: 5234, users: 2034 }
        ],
        topCountries: [
            { country: 'Nigeria', users: 32456, percentage: 76.5 },
            { country: 'Ghana', users: 4234, percentage: 10.0 },
            { country: 'Kenya', users: 2134, percentage: 5.0 },
            { country: 'South Africa', users: 1567, percentage: 3.7 },
            { country: 'Others', users: 1965, percentage: 4.8 }
        ],
        devices: [
            { device: 'Desktop', percentage: 58, users: 24567 },
            { device: 'Mobile', percentage: 35, users: 14825 },
            { device: 'Tablet', percentage: 7, users: 2964 }
        ],
        conversionRate: 3.4,
        totalSignups: 1441
    });

    const [gaConfig, setGaConfig] = useState({
        propertyId: 'G-XXXXXXXXXX',
        trackingId: 'UA-XXXXXXXXX-X',
        measurementId: 'G-XXXXXXXXXX',
        apiKey: '',
        viewId: ''
    });

    const handleConnectGA = () => {
        alert('Google Analytics connected successfully!');
        setIsGAConnected(true);
        setShowGASetup(false);
    };

    const handleDisconnectGA = () => {
        if (confirm('Are you sure you want to disconnect Google Analytics?')) {
            setIsGAConnected(false);
            alert('Google Analytics disconnected');
        }
    };

    const GoogleAnalyticsSetup = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Connect Google Analytics</h3>
                    <button
                        onClick={() => setShowGASetup(false)}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">📊 Why Connect Google Analytics?</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Track detailed user behavior and interactions</li>
                            <li>• Monitor conversion funnels and goal completions</li>
                            <li>• Analyze traffic sources and marketing campaigns</li>
                            <li>• Generate comprehensive reports and insights</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 mb-3">Step 1: Get Your Google Analytics Property ID</h4>
                        <ol className="text-sm text-slate-600 space-y-2 ml-4">
<li>1. Go to <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">analytics.google.com</a></li>
                            <li>2. Select your account and property</li>
                            <li>3. Go to Admin → Property Settings</li>
                            <li>4. Copy your Measurement ID (starts with G-)</li>
                        </ol>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Google Analytics 4 Measurement ID *
                        </label>
                        <input
                            type="text"
                            value={gaConfig.measurementId}
                            onChange={(e) => setGaConfig({ ...gaConfig, measurementId: e.target.value })}
                            placeholder="G-XXXXXXXXXX"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Format: G-XXXXXXXXXX</p>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                        <h4 className="font-semibold text-slate-900 mb-3">Step 2: Set Up API Access (Optional)</h4>
                        <p className="text-sm text-slate-600 mb-4">For advanced reporting, connect Google Analytics API</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Property ID
                                </label>
                                <input
                                    type="text"
                                    value={gaConfig.propertyId}
                                    onChange={(e) => setGaConfig({ ...gaConfig, propertyId: e.target.value })}
                                    placeholder="G-XXXXXXXXXX"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    API Key
                                </label>
                                <input
                                    type="password"
                                    value={gaConfig.apiKey}
                                    onChange={(e) => setGaConfig({ ...gaConfig, apiKey: e.target.value })}
                                    placeholder="Enter your API key"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    View/Stream ID
                                </label>
                                <input
                                    type="text"
                                    value={gaConfig.viewId}
                                    onChange={(e) => setGaConfig({ ...gaConfig, viewId: e.target.value })}
                                    placeholder="Enter View/Stream ID"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            💡 <strong>Tip:</strong> You'll need to add the tracking code to your website. 
                            This will be automatically generated after connection.
                        </p>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={handleConnectGA}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            Connect Google Analytics
                        </button>
                        <button
                            onClick={() => setShowGASetup(false)}
                            className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {showGASetup && <GoogleAnalyticsSetup />}
            
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Website Analytics</h1>
                        <p className="text-purple-100">Monitor your website performance and user behavior</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {isGAConnected ? (
                            <>
                                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                                    <span>✓</span>
                                    <span>GA Connected</span>
                                </div>
                                <button
                                    onClick={handleDisconnectGA}
                                    className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm"
                                >
                                    Disconnect
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setShowGASetup(true)}
                                className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 font-medium"
                            >
                                Connect Google Analytics
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Date Range Selector */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900">Analytics Overview</h3>
                    <div className="flex space-x-2">
                        {['7d', '30d', '90d'].map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    dateRange === range
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Last {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Page Views</span>
                        <span className="text-2xl">👁️</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{analytics.pageViews.toLocaleString()}</div>
                    <div className="text-sm text-green-600 mt-2">↑ 12.5% from last period</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Unique Visitors</span>
                        <span className="text-2xl">👥</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{analytics.uniqueVisitors.toLocaleString()}</div>
                    <div className="text-sm text-green-600 mt-2">↑ 8.3% from last period</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Avg. Session</span>
                        <span className="text-2xl">⏱️</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{analytics.avgSessionDuration}</div>
                    <div className="text-sm text-green-600 mt-2">↑ 5.2% from last period</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Bounce Rate</span>
                        <span className="text-2xl">📊</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">{analytics.bounceRate}</div>
                    <div className="text-sm text-red-600 mt-2">↓ 2.1% from last period</div>
                </div>
            </div>

            {/* Traffic Chart */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Traffic Overview</h3>
                <div className="h-64 flex items-end justify-between space-x-2">
                    {analytics.traffic.map((day, index) => {
                        const maxViews = Math.max(...analytics.traffic.map(d => d.views));
                        const height = (day.views / maxViews) * 100;
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div className="relative w-full group">
                                    <div
                                        className="bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg w-full hover:from-purple-700 hover:to-purple-500 transition-colors cursor-pointer"
                                        style={{ height: `${height}%`, minHeight: '10px' }}
                                    >
                                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {day.views.toLocaleString()} views
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500 mt-2">
                                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Pages */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Pages</h3>
                    <div className="space-y-4">
                        {analytics.topPages.map((page, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900">{page.page}</div>
                                    <div className="text-sm text-slate-500">Avg. time: {page.avgTime}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-slate-900">{page.views.toLocaleString()}</div>
                                    <div className="text-xs text-slate-500">views</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Countries */}
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Countries</h3>
                    <div className="space-y-4">
                        {analytics.topCountries.map((country, index) => (
                            <div key={index}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-slate-900">{country.country}</span>
                                    <span className="text-sm text-slate-600">{country.users.toLocaleString()} users</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className="bg-purple-600 h-2 rounded-full"
                                        style={{ width: `${country.percentage}%` }}
                                    />
                                </div>
                                <div className="text-xs text-slate-500 mt-1">{country.percentage}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Devices & Conversions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Device Breakdown</h3>
                    <div className="space-y-4">
                        {analytics.devices.map((device, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                                        {device.percentage}%
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{device.device}</div>
                                        <div className="text-sm text-slate-500">{device.users.toLocaleString()} users</div>
                                    </div>
                                </div>
                                <div className="w-24 bg-slate-100 rounded-full h-2">
                                    <div
                                        className="bg-purple-600 h-2 rounded-full"
                                        style={{ width: `${device.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Conversion Metrics</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-600">Conversion Rate</span>
                                <span className="text-2xl font-bold text-purple-600">{analytics.conversionRate}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-3 rounded-full"
                                    style={{ width: `${analytics.conversionRate * 10}%` }}
                                />
                            </div>
                        </div>
                        <div className="border-t border-slate-200 pt-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-slate-600">Total Signups</div>
                                    <div className="text-3xl font-bold text-slate-900">{analytics.totalSignups.toLocaleString()}</div>
                                </div>
                                <div className="text-5xl">🎉</div>
                            </div>
                            <div className="text-sm text-green-600 mt-2">↑ 15.8% from last period</div>
                        </div>
                    </div>
                </div>
            </div>

            {!isGAConnected && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                        <span className="text-2xl">ℹ️</span>
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-1">Connect Google Analytics for Enhanced Tracking</h4>
                            <p className="text-sm text-blue-800 mb-3">
                                Currently showing sample data. Connect your Google Analytics account to see real-time data,
                                custom events, conversion tracking, and advanced reporting.
                            </p>
                            <button
                                onClick={() => setShowGASetup(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
                                Connect Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;