const fs = require('fs');
const path = require('path');

const components = [
    { name: 'TenantManagement', title: 'Tenant Management', desc: 'Manage all tenant accounts and subscriptions', icon: '🏫', gradient: 'from-indigo-600 to-blue-600' },
    { name: 'PlatformSettings', title: 'Platform Settings', desc: 'Configure global platform settings', icon: '⚙️', gradient: 'from-slate-600 to-gray-600' },
    { name: 'ThemeManager', title: 'Theme Manager', desc: 'Customize platform appearance and branding', icon: '🎨', gradient: 'from-pink-600 to-purple-600' },
    { name: 'MediaLibrary', title: 'Media Library', desc: 'Manage images, documents, and media files', icon: '📸', gradient: 'from-green-600 to-teal-600' },
    { name: 'EmailCenter', title: 'Email Center', desc: 'Configure and monitor email communications', icon: '📧', gradient: 'from-indigo-600 to-blue-600' },
    { name: 'BackupManager', title: 'Backup Manager', desc: 'Automated backups and disaster recovery', icon: '💾', gradient: 'from-gray-700 to-slate-600' },
    { name: 'AuditLogs', title: 'Audit Logs', desc: 'Track all system activities and changes', icon: '📋', gradient: 'from-orange-600 to-red-600' },
    { name: 'PerformanceOptimizer', title: 'Performance Optimizer', desc: 'Optimize system performance and speed', icon: '⚡', gradient: 'from-yellow-500 to-orange-500' },
    { name: 'APIManager', title: 'API Manager', desc: 'Manage API endpoints and integrations', icon: '🔌', gradient: 'from-teal-600 to-green-600' },
    { name: 'NotificationCenter', title: 'Notification Center', desc: 'Configure system-wide notifications', icon: '🔔', gradient: 'from-purple-600 to-pink-600' },
    { name: 'LicenseManager', title: 'License Manager', desc: 'Manage software licenses and subscriptions', icon: '📝', gradient: 'from-blue-700 to-indigo-700' },
    { name: 'AdvancedAnalytics', title: 'Advanced Analytics', desc: 'Deep insights and business intelligence', icon: '📈', gradient: 'from-emerald-600 to-teal-600' },
    { name: 'SystemTools', title: 'System Tools', desc: 'Advanced system utilities and maintenance', icon: '🛠️', gradient: 'from-slate-700 to-gray-700' }
];

const componentTemplate = (name, title, desc, icon, gradient) => `import React from 'react';

const ${name} = () => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r ${gradient} text-white p-6 rounded-xl">
            <h1 className="text-2xl font-bold mb-2">${title}</h1>
            <p className="opacity-80">${desc}</p>
        </div>
        
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
            <div className="text-6xl mb-4">${icon}</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">${title}</h3>
            <p className="text-slate-600 mb-6">${desc}</p>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Configure ${name}
            </button>
        </div>
    </div>
);

export default ${name};`;

// Skip components that already exist
const existingComponents = ['UserManagement', 'SecurityCenter', 'PluginManager', 'DatabaseManager', 'SuperAdminOverview', 'SystemMonitoring'];

const superAdminDir = 'C:/Users/User/Downloads/Dossier.NG/components/SuperAdmin';

components.forEach(comp => {
    if (!existingComponents.includes(comp.name)) {
        const filePath = path.join(superAdminDir, `${comp.name}.tsx`);
        const content = componentTemplate(comp.name, comp.title, comp.desc, comp.icon, comp.gradient);
        
        try {
            fs.writeFileSync(filePath, content);
            console.log(`Created ${comp.name}.tsx`);
        } catch (err) {
            console.error(`Error creating ${comp.name}.tsx:`, err.message);
        }
    }
});

console.log('Component generation complete!');