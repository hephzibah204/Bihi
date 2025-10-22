import React, { useState, useEffect } from 'react';

interface SystemMetrics {
    cpu: number;
    memory: number;
    disk: number;
    network: {
        inbound: number;
        outbound: number;
    };
    requests: {
        total: number;
        success: number;
        errors: number;
        avgResponseTime: number;
    };
    database: {
        connections: number;
        queries: number;
        avgQueryTime: number;
    };
}

interface Alert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    resolved: boolean;
}

// Real-time Metrics Chart Component
const MetricsChart = ({ title, value, max, unit, color, trend }: {
    title: string;
    value: number;
    max: number;
    unit: string;
    color: string;
    trend: number[];
}) => {
    const percentage = (value / max) * 100;
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-600">{title}</h3>
                <span className={`text-2xl font-bold ${
                    percentage > 80 ? 'text-red-600' : 
                    percentage > 60 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                    {value}{unit}
                </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                        percentage > 80 ? 'bg-red-500' : 
                        percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            
            {/* Mini Chart */}
            <div className="flex items-end space-x-1 h-8">
                {trend.map((point, index) => (
                    <div
                        key={index}
                        className={`w-1 rounded-t ${color} transition-all duration-200`}
                        style={{ height: `${(point / max) * 100}%` }}
                    ></div>
                ))}
            </div>
        </div>
    );
};

// Alerts Panel Component
const AlertsPanel = ({ alerts, onResolveAlert }: { 
    alerts: Alert[]; 
    onResolveAlert: (id: string) => void; 
}) => {
    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'critical': return '🔴';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    };

    const getAlertColor = (type: string) => {
        switch (type) {
            case 'critical': return 'border-red-200 bg-red-50';
            case 'warning': return 'border-yellow-200 bg-yellow-50';
            default: return 'border-blue-200 bg-blue-50';
        }
    };

    const unresolvedAlerts = alerts.filter(alert => !alert.resolved);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">System Alerts</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    unresolvedAlerts.length > 0 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                }`}>
                    {unresolvedAlerts.length} Active
                </span>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.map((alert) => (
                    <div 
                        key={alert.id} 
                        className={`p-4 rounded-lg border-2 ${getAlertColor(alert.type)} ${
                            alert.resolved ? 'opacity-50' : ''
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                                <span className="text-lg">{getAlertIcon(alert.type)}</span>
                                <div>
                                    <h4 className="font-medium text-slate-900">{alert.title}</h4>
                                    <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                                    <span className="text-xs text-slate-500">
                                        {alert.timestamp.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            {!alert.resolved && (
                                <button
                                    onClick={() => onResolveAlert(alert.id)}
                                    className="px-3 py-1 text-xs bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                                >
                                    Resolve
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                
                {alerts.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        <span className="text-4xl mb-2 block">✅</span>
                        <p>No alerts - system running smoothly!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Database Status Component
const DatabaseStatus = ({ metrics }: { metrics: SystemMetrics }) => {
    const dbStats = [
        { name: 'Active Connections', value: metrics.database.connections, max: 100, unit: '' },
        { name: 'Queries/sec', value: metrics.database.queries, max: 1000, unit: '/s' },
        { name: 'Avg Query Time', value: metrics.database.avgQueryTime, max: 1000, unit: 'ms' }
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Database Health</h3>
            <div className="space-y-4">
                {dbStats.map((stat, index) => (
                    <div key={index}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-600">{stat.name}</span>
                            <span className="text-sm font-semibold text-slate-900">
                                {stat.value}{stat.unit}
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    (stat.value / stat.max) > 0.8 ? 'bg-red-500' : 
                                    (stat.value / stat.max) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min((stat.value / stat.max) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Network Traffic Component
const NetworkTraffic = ({ network }: { network: { inbound: number; outbound: number } }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Network Traffic</h3>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600 flex items-center">
                            ⬇️ Inbound Traffic
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                            {network.inbound.toFixed(1)} MB/s
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                            className="h-2 bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(network.inbound * 10, 100)}%` }}
                        ></div>
                    </div>
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600 flex items-center">
                            ⬆️ Outbound Traffic
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                            {network.outbound.toFixed(1)} MB/s
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                            className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(network.outbound * 10, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Request Analytics Component
const RequestAnalytics = ({ requests }: { requests: SystemMetrics['requests'] }) => {
    const successRate = (requests.success / requests.total) * 100;
    const errorRate = ((requests.total - requests.success) / requests.total) * 100;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Request Analytics</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{requests.success}</div>
                    <div className="text-xs text-slate-500">Successful</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{requests.errors}</div>
                    <div className="text-xs text-slate-500">Errors</div>
                </div>
            </div>
            
            {/* Success Rate Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Success Rate</span>
                    <span className="font-semibold text-green-600">{successRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: `${successRate}%` }}
                    ></div>
                </div>
            </div>
            
            {/* Average Response Time */}
            <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-lg font-bold text-slate-900">{requests.avgResponseTime}ms</div>
                <div className="text-xs text-slate-500">Avg Response Time</div>
            </div>
        </div>
    );
};

// Main System Monitoring Component
const SystemMonitoring = () => {
    const [metrics, setMetrics] = useState<SystemMetrics>({
        cpu: 0,
        memory: 0,
        disk: 0,
        network: { inbound: 0, outbound: 0 },
        requests: { total: 0, success: 0, errors: 0, avgResponseTime: 0 },
        database: { connections: 0, queries: 0, avgQueryTime: 0 }
    });

    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [cpuTrend, setCpuTrend] = useState<number[]>([]);
    const [memoryTrend, setMemoryTrend] = useState<number[]>([]);
    const [diskTrend, setDiskTrend] = useState<number[]>([]);

    // Simulate real-time metrics updates
    useEffect(() => {
        const generateMetrics = (): SystemMetrics => ({
            cpu: Math.random() * 100,
            memory: 40 + Math.random() * 40,
            disk: 60 + Math.random() * 20,
            network: {
                inbound: Math.random() * 10,
                outbound: Math.random() * 5
            },
            requests: {
                total: 1000 + Math.floor(Math.random() * 500),
                success: 950 + Math.floor(Math.random() * 49),
                errors: Math.floor(Math.random() * 10),
                avgResponseTime: 200 + Math.floor(Math.random() * 100)
            },
            database: {
                connections: 30 + Math.floor(Math.random() * 20),
                queries: 100 + Math.floor(Math.random() * 200),
                avgQueryTime: 10 + Math.floor(Math.random() * 40)
            }
        });

        const updateMetrics = () => {
            const newMetrics = generateMetrics();
            setMetrics(newMetrics);

            // Update trends (keep last 20 points)
            setCpuTrend(prev => [...prev.slice(-19), newMetrics.cpu]);
            setMemoryTrend(prev => [...prev.slice(-19), newMetrics.memory]);
            setDiskTrend(prev => [...prev.slice(-19), newMetrics.disk]);

            // Generate alerts based on metrics
            const newAlerts: Alert[] = [];
            if (newMetrics.cpu > 90) {
                newAlerts.push({
                    id: `cpu-${Date.now()}`,
                    type: 'critical',
                    title: 'High CPU Usage',
                    message: `CPU usage is at ${newMetrics.cpu.toFixed(1)}%`,
                    timestamp: new Date(),
                    resolved: false
                });
            }
            if (newMetrics.memory > 85) {
                newAlerts.push({
                    id: `memory-${Date.now()}`,
                    type: 'warning',
                    title: 'High Memory Usage',
                    message: `Memory usage is at ${newMetrics.memory.toFixed(1)}%`,
                    timestamp: new Date(),
                    resolved: false
                });
            }

            if (newAlerts.length > 0) {
                setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
            }
        };

        // Initial update
        updateMetrics();

        // Update every 3 seconds
        const interval = setInterval(updateMetrics, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleResolveAlert = (id: string) => {
        setAlerts(prev => 
            prev.map(alert => 
                alert.id === id ? { ...alert, resolved: true } : alert
            )
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">System Monitoring</h1>
                    <p className="text-slate-600">Real-time system health and performance metrics</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-slate-600">Live Updates</span>
                    </div>
                </div>
            </div>

            {/* Real-time Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricsChart 
                    title="CPU Usage"
                    value={Number(metrics.cpu.toFixed(1))}
                    max={100}
                    unit="%"
                    color="bg-blue-500"
                    trend={cpuTrend}
                />
                <MetricsChart 
                    title="Memory Usage"
                    value={Number(metrics.memory.toFixed(1))}
                    max={100}
                    unit="%"
                    color="bg-green-500"
                    trend={memoryTrend}
                />
                <MetricsChart 
                    title="Disk Usage"
                    value={Number(metrics.disk.toFixed(1))}
                    max={100}
                    unit="%"
                    color="bg-purple-500"
                    trend={diskTrend}
                />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <NetworkTraffic network={metrics.network} />
                    <DatabaseStatus metrics={metrics} />
                </div>
                <div className="space-y-6">
                    <RequestAnalytics requests={metrics.requests} />
                    <AlertsPanel alerts={alerts} onResolveAlert={handleResolveAlert} />
                </div>
            </div>
        </div>
    );
};

export default SystemMonitoring;