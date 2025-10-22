import React, { useState } from 'react';

interface SEOScore {
    overall: number;
    technical: number;
    content: number;
    mobile: number;
}

const SEOManager = () => {
    const [activeTab, setActiveTab] = useState<'meta' | 'sitemap' | 'analytics' | 'score'>('meta');
    const [seoScore] = useState<SEOScore>({
        overall: 78,
        technical: 85,
        content: 72,
        mobile: 80
    });

    const [metaSettings, setMetaSettings] = useState({
        siteTitle: 'Dossier.NG - School Management System',
        siteDescription: 'Complete school management solution for modern educational institutions',
        keywords: 'school management, education software, student portal',
        ogImage: '',
        twitterCard: 'summary_large_image',
        robotsTxt: 'User-agent: *\nAllow: /',
        favicon: ''
    });

    const [analyticsKeys, setAnalyticsKeys] = useState({
        googleAnalytics: '',
        googleSearchConsole: '',
        bingWebmaster: '',
        facebookPixel: ''
    });

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const MetaTagsPanel = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <span className="text-2xl">💡</span>
                    <div>
                        <h4 className="font-semibold text-blue-900">SEO Best Practices</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            Optimize meta tags for better search engine visibility and social media sharing
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Site Title *
                    </label>
                    <input
                        type="text"
                        value={metaSettings.siteTitle}
                        onChange={(e) => setMetaSettings({...metaSettings, siteTitle: e.target.value})}
                        placeholder="Your School Name - Tagline"
                        maxLength={60}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">{metaSettings.siteTitle.length}/60 characters</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Meta Description *
                    </label>
                    <textarea
                        value={metaSettings.siteDescription}
                        onChange={(e) => setMetaSettings({...metaSettings, siteDescription: e.target.value})}
                        placeholder="Brief description of your school..."
                        maxLength={160}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">{metaSettings.siteDescription.length}/160 characters</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Keywords (comma-separated)
                    </label>
                    <input
                        type="text"
                        value={metaSettings.keywords}
                        onChange={(e) => setMetaSettings({...metaSettings, keywords: e.target.value})}
                        placeholder="school, education, management"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="border-t border-slate-200 pt-4">
                    <h3 className="font-semibold text-slate-900 mb-4">Social Media</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Open Graph Image URL (Facebook, LinkedIn)
                            </label>
                            <input
                                type="text"
                                value={metaSettings.ogImage}
                                onChange={(e) => setMetaSettings({...metaSettings, ogImage: e.target.value})}
                                placeholder="https://yourschool.com/og-image.jpg"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Recommended: 1200x630px</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Twitter Card Type
                            </label>
                            <select
                                value={metaSettings.twitterCard}
                                onChange={(e) => setMetaSettings({...metaSettings, twitterCard: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="summary">Summary</option>
                                <option value="summary_large_image">Summary with Large Image</option>
                                <option value="app">App</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                    <h3 className="font-semibold text-slate-900 mb-4">Robots.txt</h3>
                    <textarea
                        value={metaSettings.robotsTxt}
                        onChange={(e) => setMetaSettings({...metaSettings, robotsTxt: e.target.value})}
                        rows={6}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">Controls search engine crawler access</p>
                </div>

                <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Save Meta Settings
                </button>
            </div>
        </div>
    );

    const SitemapPanel = () => (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-slate-900">XML Sitemap</h3>
                        <p className="text-sm text-slate-500 mt-1">Helps search engines discover your content</p>
                    </div>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Generate Sitemap
                    </button>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <code className="text-sm text-slate-700">https://yourschool.com/sitemap.xml</code>
                    <button className="ml-4 text-sm text-blue-600 hover:text-blue-700">Copy</button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Sitemap Settings</h3>
                <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-slate-700">Include Blog Posts</span>
                    </label>
                    <label className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-slate-700">Include Pages</span>
                    </label>
                    <label className="flex items-center space-x-3">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-slate-700">Include Knowledge Base Articles</span>
                    </label>
                    <label className="flex items-center space-x-3">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-slate-700">Include Course Catalog</span>
                    </label>
                </div>
                <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Update Settings
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Submit to Search Engines</h3>
                <div className="space-y-3">
                    <button className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl">🔍</span>
                            <span className="font-medium">Google Search Console</span>
                        </div>
                        <span className="text-sm text-blue-600">Submit →</span>
                    </button>
                    <button className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl">🔷</span>
                            <span className="font-medium">Bing Webmaster Tools</span>
                        </div>
                        <span className="text-sm text-blue-600">Submit →</span>
                    </button>
                </div>
            </div>
        </div>
    );

    const AnalyticsPanel = () => (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Analytics Integration</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Google Analytics 4 Measurement ID
                        </label>
                        <input
                            type="text"
                            value={analyticsKeys.googleAnalytics}
                            onChange={(e) => setAnalyticsKeys({...analyticsKeys, googleAnalytics: e.target.value})}
                            placeholder="G-XXXXXXXXXX"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Google Search Console Verification Code
                        </label>
                        <input
                            type="text"
                            value={analyticsKeys.googleSearchConsole}
                            onChange={(e) => setAnalyticsKeys({...analyticsKeys, googleSearchConsole: e.target.value})}
                            placeholder="verification-code-here"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Bing Webmaster Verification Code
                        </label>
                        <input
                            type="text"
                            value={analyticsKeys.bingWebmaster}
                            onChange={(e) => setAnalyticsKeys({...analyticsKeys, bingWebmaster: e.target.value})}
                            placeholder="verification-code-here"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Facebook Pixel ID
                        </label>
                        <input
                            type="text"
                            value={analyticsKeys.facebookPixel}
                            onChange={(e) => setAnalyticsKeys({...analyticsKeys, facebookPixel: e.target.value})}
                            placeholder="123456789012345"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Save Analytics Keys
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Tracking Settings</h3>
                <div className="space-y-4">
                    <label className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-900">Track Admin Users</h4>
                            <p className="text-sm text-slate-500">Include admin activity in analytics</p>
                        </div>
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    </label>
                    <label className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-900">Cookie Consent Banner</h4>
                            <p className="text-sm text-slate-500">Show GDPR-compliant cookie notice</p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                    </label>
                </div>
            </div>
        </div>
    );

    const SEOScorePanel = () => (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreColor(seoScore.overall)} border-4`}>
                        <span className="text-4xl font-bold">{seoScore.overall}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mt-4">Overall SEO Score</h3>
                    <p className="text-slate-500">Your site's search engine optimization performance</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className={`inline-block px-4 py-2 rounded-full ${getScoreColor(seoScore.technical)} font-bold text-2xl`}>
                            {seoScore.technical}
                        </div>
                        <p className="text-sm font-medium text-slate-700 mt-2">Technical SEO</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className={`inline-block px-4 py-2 rounded-full ${getScoreColor(seoScore.content)} font-bold text-2xl`}>
                            {seoScore.content}
                        </div>
                        <p className="text-sm font-medium text-slate-700 mt-2">Content Quality</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                        <div className={`inline-block px-4 py-2 rounded-full ${getScoreColor(seoScore.mobile)} font-bold text-2xl`}>
                            {seoScore.mobile}
                        </div>
                        <p className="text-sm font-medium text-slate-700 mt-2">Mobile Friendly</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-semibold text-slate-900 mb-4">SEO Recommendations</h3>
                <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <span className="text-green-600">✓</span>
                        <div>
                            <p className="font-medium text-green-900">HTTPS Enabled</p>
                            <p className="text-sm text-green-700">Your site is secure</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <span className="text-green-600">✓</span>
                        <div>
                            <p className="font-medium text-green-900">Mobile Responsive</p>
                            <p className="text-sm text-green-700">Site works well on mobile devices</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <span className="text-yellow-600">⚠</span>
                        <div>
                            <p className="font-medium text-yellow-900">Improve Page Speed</p>
                            <p className="text-sm text-yellow-700">Some pages load slowly. Consider image optimization</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <span className="text-yellow-600">⚠</span>
                        <div>
                            <p className="font-medium text-yellow-900">Add Alt Text to Images</p>
                            <p className="text-sm text-yellow-700">12 images missing alt attributes</p>
                        </div>
                    </div>
                </div>
                <button className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Run Full SEO Audit
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">SEO Manager</h1>
                <p className="text-teal-100">Optimize your site for search engines and improve visibility</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex space-x-4 border-b border-slate-200 mb-6">
                    {[
                        { id: 'meta', label: 'Meta Tags', icon: '🏷️' },
                        { id: 'sitemap', label: 'Sitemap', icon: '🗺️' },
                        { id: 'analytics', label: 'Analytics', icon: '📊' },
                        { id: 'score', label: 'SEO Score', icon: '⭐' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center space-x-2 py-2 px-4 font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'border-b-2 border-teal-500 text-teal-600'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {activeTab === 'meta' && <MetaTagsPanel />}
                {activeTab === 'sitemap' && <SitemapPanel />}
                {activeTab === 'analytics' && <AnalyticsPanel />}
                {activeTab === 'score' && <SEOScorePanel />}
            </div>
        </div>
    );
};

export default SEOManager;