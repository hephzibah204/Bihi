import React, { useState } from 'react';
import { apiSendMessage } from '../../services/api';
import { usePlatformPermission } from '../../utils/usePlatformPermission';

interface SMTPConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    encryption: 'none' | 'ssl' | 'tls';
    fromEmail: string;
    fromName: string;
}

interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    variables: string[];
    category: string;
}

const EmailCenter = () => {
    const [activeTab, setActiveTab] = useState<'smtp' | 'templates' | 'send' | 'logs'>('smtp');
    const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>({
        host: '',
        port: 587,
        username: '',
        password: '',
        encryption: 'tls',
        fromEmail: '',
        fromName: ''
    });
    const [testEmail, setTestEmail] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const { can } = usePlatformPermission();

    const [templates] = useState<EmailTemplate[]>([
        {
            id: '1',
            name: 'Welcome Email',
            subject: 'Welcome to {{school_name}}!',
            body: 'Dear {{student_name}},\n\nWelcome to our platform!',
            variables: ['school_name', 'student_name'],
            category: 'Student'
        },
        {
            id: '2',
            name: 'Payment Reminder',
            subject: 'Payment Due - {{school_name}}',
            body: 'Dear {{parent_name}},\n\nYour payment of {{amount}} is due.',
            variables: ['school_name', 'parent_name', 'amount'],
            category: 'Finance'
        }
    ]);

    const handleSMTPSave = () => {
        // Save SMTP configuration
        if (!can('manage_integrations')) return;
        localStorage.setItem('smtp_config', JSON.stringify(smtpConfig));
        alert('SMTP Configuration saved successfully!');
    };

    const handleTestEmail = async () => {
        if (!can('send_broadcasts')) return;
        setIsTesting(true);
        setTestResult(null);
        try {
            if (!testEmail) throw new Error('Enter a test email');
            await apiSendMessage({ channel: 'email', content: 'This is a test email from ReportSheet SuperAdmin Email Center.', recipients: [testEmail], type: 'direct' });
            setTestResult('success');
        } catch (e) {
            setTestResult('error');
        } finally {
            setIsTesting(false);
        }
    };

    const SMTPConfigPanel = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <span className="text-2xl">ℹ️</span>
                    <div>
                        <h4 className="font-semibold text-blue-900">SMTP Configuration</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            Configure your SMTP server to send emails from the platform. Popular providers: Gmail, SendGrid, Mailgun, AWS SES.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="smtp-host" className="block text-sm font-medium text-slate-700 mb-2">
                        SMTP Host *
                    </label>
                    <input
                        id="smtp-host"
                        type="text"
                        value={smtpConfig.host}
                        onChange={e => setSmtpConfig({...smtpConfig, host: e.target.value})}
                        placeholder="smtp.gmail.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="smtp-port" className="block text-sm font-medium text-slate-700 mb-2">
                        Port *
                    </label>
                    <input
                        id="smtp-port"
                        type="number"
                        value={smtpConfig.port}
                        onChange={e => setSmtpConfig({...smtpConfig, port: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="smtp-username" className="block text-sm font-medium text-slate-700 mb-2">
                        Username/Email *
                    </label>
                    <input
                        id="smtp-username"
                        type="text"
                        value={smtpConfig.username}
                        onChange={e => setSmtpConfig({...smtpConfig, username: e.target.value})}
                        placeholder="your-email@gmail.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="smtp-password" className="block text-sm font-medium text-slate-700 mb-2">
                        Password/API Key *
                    </label>
                    <input
                        id="smtp-password"
                        type="password"
                        value={smtpConfig.password}
                        onChange={e => setSmtpConfig({...smtpConfig, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="smtp-encryption" className="block text-sm font-medium text-slate-700 mb-2">
                        Encryption
                    </label>
                    <select
                        id="smtp-encryption"
                        value={smtpConfig.encryption}
                        onChange={e => setSmtpConfig({...smtpConfig, encryption: e.target.value as any})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="none">None</option>
                        <option value="ssl">SSL</option>
                        <option value="tls">TLS (Recommended)</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="from-email" className="block text-sm font-medium text-slate-700 mb-2">
                        From Email *
                    </label>
                    <input
                        id="from-email"
                        type="email"
                        value={smtpConfig.fromEmail}
                        onChange={e => setSmtpConfig({...smtpConfig, fromEmail: e.target.value})}
                        placeholder="noreply@yourschool.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="from-name" className="block text-sm font-medium text-slate-700 mb-2">
                        From Name
                    </label>
                    <input
                        id="from-name"
                        type="text"
                        value={smtpConfig.fromName}
                        onChange={e => setSmtpConfig({...smtpConfig, fromName: e.target.value})}
                        placeholder="Your School Name"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-900 mb-4">Test SMTP Configuration</h3>
                <div className="flex items-end space-x-3">
                    <div className="flex-1">
                        <label htmlFor="test-email" className="block text-sm font-medium text-slate-700 mb-2">
                            Send test email to:
                        </label>
                        <input
                            id="test-email"
                            type="email"
                            value={testEmail}
                            onChange={e => setTestEmail(e.target.value)}
                            placeholder="test@example.com"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={handleTestEmail}
                        disabled={!can('send_broadcasts') || isTesting || !testEmail}
className={`px-6 py-2 rounded-lg transition-colors ${!can('send_broadcasts') ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isTesting ? 'Sending...' : 'Send Test'}
                    </button>
                </div>
                
                {testResult && (
                    <div className={`mt-4 p-4 rounded-lg ${
                        testResult === 'success' 
                            ? 'bg-green-50 border border-green-200 text-green-800' 
                            : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                        {testResult === 'success' 
                            ? '✅ Test email sent successfully!' 
                            : '❌ Failed to send test email. Please check your configuration.'}
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    onClick={handleSMTPSave}
                    disabled={!can('manage_integrations')}
                    className={`px-6 py-2 rounded-lg transition-colors ${!can('manage_integrations') ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    Save Configuration
                </button>
            </div>
        </div>
    );

    const EmailTemplatesPanel = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-900">Email Templates</h3>
                        <button className={`px-4 py-2 rounded-lg transition-colors ${!can('manage_content') ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`} disabled={!can('manage_content')}>
                            + New Template
                        </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                    <div key={template.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-semibold text-slate-900">{template.name}</h4>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                    {template.category}
                                </span>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600">⋮</button>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                            <strong>Subject:</strong> {template.subject}
                        </p>
                        <p className="text-sm text-slate-500 line-clamp-2">{template.body}</p>
                        <div className="mt-3 flex items-center space-x-2">
                            <button className={`text-sm ${!can('manage_content') ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700'}`} disabled={!can('manage_content')}>Edit</button>
                            <button className="text-sm text-green-600 hover:text-green-700">Preview</button>
                            <button className={`text-sm ${!can('manage_content') ? 'text-slate-400 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`} disabled={!can('manage_content')}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const SendEmailPanel = () => (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Send Bulk Email</h3>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="recipients" className="block text-sm font-medium text-slate-700 mb-2">
                            Recipients
                        </label>
                        <select 
                            id="recipients"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option>All Parents</option>
                            <option>All Students</option>
                            <option>All Teachers</option>
                            <option>Custom List</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="email-subject" className="block text-sm font-medium text-slate-700 mb-2">
                            Subject
                        </label>
                        <input
                            id="email-subject"
                            type="text"
                            placeholder="Enter email subject"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="email-body" className="block text-sm font-medium text-slate-700 mb-2">
                            Message
                        </label>
                        <textarea
                            id="email-body"
                            rows={10}
                            placeholder="Enter your message..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button className={`px-6 py-2 border rounded-lg transition-colors ${!can('manage_content') ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300 hover:bg-slate-50'}`} disabled={!can('manage_content')}>
                            Save Draft
                        </button>
                        <button className={`px-6 py-2 rounded-lg transition-colors ${!can('send_broadcasts') ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`} disabled={!can('send_broadcasts')}>
                            Send Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const EmailLogsPanel = () => (
        <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Email Logs</h3>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Date</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">To</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Subject</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-slate-100">
                            <td className="py-3 px-4 text-sm">2024-01-20 10:30</td>
                            <td className="py-3 px-4 text-sm">parent@example.com</td>
                            <td className="py-3 px-4 text-sm">Payment Reminder</td>
                            <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Delivered</span>
                            </td>
                        </tr>
                        <tr className="border-t border-slate-100">
                            <td className="py-3 px-4 text-sm">2024-01-20 09:15</td>
                            <td className="py-3 px-4 text-sm">student@example.com</td>
                            <td className="py-3 px-4 text-sm">Welcome Email</td>
                            <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Delivered</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Email Center</h1>
                <p className="text-indigo-100">Configure SMTP, manage templates, and send emails</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex space-x-4 border-b border-slate-200 mb-6">
                    {[
                        { id: 'smtp', label: 'SMTP Config', icon: '⚙️' },
                        { id: 'templates', label: 'Templates', icon: '📧' },
                        { id: 'send', label: 'Send Email', icon: '📤' },
                        { id: 'logs', label: 'Email Logs', icon: '📊' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center space-x-2 py-2 px-4 font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {activeTab === 'smtp' && <SMTPConfigPanel />}
                {activeTab === 'templates' && <EmailTemplatesPanel />}
                {activeTab === 'send' && <SendEmailPanel />}
                {activeTab === 'logs' && <EmailLogsPanel />}
            </div>
        </div>
    );
};

export default EmailCenter;