import React, { useState } from 'react';

interface Page {
    id: string;
    title: string;
    slug: string;
    type: 'landing' | 'blog' | 'knowledge-base';
    status: 'published' | 'draft' | 'scheduled';
    author: string;
    publishDate: string;
    views: number;
    featured: boolean;
    category?: string;
    tags: string[];
    seoTitle: string;
    seoDescription: string;
    content: string;
}

const PageBuilder = () => {
    const [activeTab, setActiveTab] = useState<'all' | 'landing' | 'blog' | 'knowledge'>('all');
    const [selectedPage, setSelectedPage] = useState<Page | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const [pages, setPages] = useState<Page[]>([
        {
            id: '1',
            title: 'Welcome to Dossier.NG',
            slug: 'welcome',
            type: 'landing',
            status: 'published',
            author: 'Admin',
            publishDate: '2024-01-15',
            views: 2453,
            featured: true,
            tags: ['featured', 'home'],
            seoTitle: 'Dossier.NG - School Management System',
            seoDescription: 'Best school management software in Nigeria',
            content: '<h1>Welcome to Dossier.NG</h1><p>Complete school management solution...</p>'
        },
        {
            id: '2',
            title: 'How to Set Up Your School',
            slug: 'setup-guide',
            type: 'knowledge-base',
            status: 'published',
            author: 'Support Team',
            publishDate: '2024-01-10',
            views: 1234,
            featured: false,
            category: 'Getting Started',
            tags: ['tutorial', 'setup'],
            seoTitle: 'School Setup Guide - Dossier.NG',
            seoDescription: 'Complete guide to setting up your school on Dossier.NG',
            content: '<h2>Getting Started</h2><p>Step 1: Create your account...</p>'
        },
        {
            id: '3',
            title: '5 Ways to Improve Fee Collection',
            slug: 'improve-fee-collection',
            type: 'blog',
            status: 'published',
            author: 'Admin',
            publishDate: '2024-01-20',
            views: 876,
            featured: true,
            category: 'Tips & Tricks',
            tags: ['fees', 'tips', 'finance'],
            seoTitle: '5 Ways to Improve School Fee Collection',
            seoDescription: 'Learn effective strategies to improve fee collection in your school',
            content: '<h1>5 Ways to Improve Fee Collection</h1><p>Introduction...</p>'
        }
    ]);

    const [categories] = useState([
        'Getting Started',
        'Tips & Tricks',
        'Features',
        'Announcements',
        'Updates',
        'Tutorials'
    ]);

    const handleCreatePage = (type: 'landing' | 'blog' | 'knowledge-base') => {
        const newPage: Page = {
            id: `page_${Date.now()}`,
            title: 'New Page',
            slug: 'new-page',
            type,
            status: 'draft',
            author: 'Admin',
            publishDate: new Date().toISOString().split('T')[0],
            views: 0,
            featured: false,
            tags: [],
            seoTitle: '',
            seoDescription: '',
            content: ''
        };
        setPages([...pages, newPage]);
        setSelectedPage(newPage);
        setIsEditing(true);
    };

    const handleSavePage = () => {
        if (selectedPage) {
            setPages(pages.map(p => p.id === selectedPage.id ? selectedPage : p));
            alert('Page saved successfully!');
            setIsEditing(false);
        }
    };

    const handleDeletePage = (id: string) => {
        if (confirm('Are you sure you want to delete this page?')) {
            setPages(pages.filter(p => p.id !== id));
            setSelectedPage(null);
        }
    };

    const handlePublish = (id: string) => {
        setPages(pages.map(p => 
            p.id === id ? { ...p, status: 'published', publishDate: new Date().toISOString().split('T')[0] } : p
        ));
        alert('Page published successfully!');
    };

    const filteredPages = pages.filter(page => {
        if (activeTab === 'all') return true;
        if (activeTab === 'landing') return page.type === 'landing';
        if (activeTab === 'blog') return page.type === 'blog';
        if (activeTab === 'knowledge') return page.type === 'knowledge-base';
        return true;
    });

    const getStatusBadge = (status: Page['status']) => {
        switch (status) {
            case 'published':
                return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Published</span>;
            case 'draft':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Draft</span>;
            case 'scheduled':
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Scheduled</span>;
        }
    };

    const getTypeIcon = (type: Page['type']) => {
        switch (type) {
            case 'landing': return '🏠';
            case 'blog': return '📝';
            case 'knowledge-base': return '📚';
        }
    };

    const PagesList = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">All Pages ({filteredPages.length})</h3>
                    <p className="text-sm text-slate-500">Create and manage your website pages</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleCreatePage('landing')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                        + Landing Page
                    </button>
                    <button
                        onClick={() => handleCreatePage('blog')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                        + Blog Post
                    </button>
                    <button
                        onClick={() => handleCreatePage('knowledge-base')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                        + Knowledge Base
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Title</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Type</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Views</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Date</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPages.map(page => (
                            <tr key={page.id} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="py-3 px-4">
                                    <div className="flex items-center space-x-2">
                                        {page.featured && <span className="text-yellow-500">⭐</span>}
                                        <div>
                                            <div className="font-medium text-slate-900">{page.title}</div>
                                            <div className="text-xs text-slate-500">/{page.slug}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="flex items-center space-x-1">
                                        <span>{getTypeIcon(page.type)}</span>
                                        <span className="text-sm capitalize">{page.type.replace('-', ' ')}</span>
                                    </span>
                                </td>
                                <td className="py-3 px-4">{getStatusBadge(page.status)}</td>
                                <td className="py-3 px-4 text-sm text-slate-600">{page.views.toLocaleString()}</td>
                                <td className="py-3 px-4 text-sm text-slate-600">{page.publishDate}</td>
                                <td className="py-3 px-4">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedPage(page);
                                                setIsEditing(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-700 text-sm"
                                        >
                                            Edit
                                        </button>
                                        {page.status === 'draft' && (
                                            <button
                                                onClick={() => handlePublish(page.id)}
                                                className="text-green-600 hover:text-green-700 text-sm"
                                            >
                                                Publish
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeletePage(page.id)}
                                            className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const PageEditor = () => {
        if (!selectedPage) return null;

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900">
                        {isEditing ? 'Edit Page' : 'Page Details'}
                    </h3>
                    <div className="flex space-x-2">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Edit Page
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setSelectedPage(null);
                                setIsEditing(false);
                            }}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                        >
                            Back to List
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Page Title *
                            </label>
                            <input
                                type="text"
                                value={selectedPage.title}
                                onChange={(e) => setSelectedPage({ ...selectedPage, title: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                URL Slug *
                            </label>
                            <input
                                type="text"
                                value={selectedPage.slug}
                                onChange={(e) => setSelectedPage({ ...selectedPage, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            />
                            <p className="text-xs text-slate-500 mt-1">URL: /pages/{selectedPage.slug}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Page Type
                            </label>
                            <select
                                value={selectedPage.type}
                                onChange={(e) => setSelectedPage({ ...selectedPage, type: e.target.value as any })}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            >
                                <option value="landing">Landing Page</option>
                                <option value="blog">Blog Post</option>
                                <option value="knowledge-base">Knowledge Base</option>
                            </select>
                        </div>

                        {(selectedPage.type === 'blog' || selectedPage.type === 'knowledge-base') && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={selectedPage.category || ''}
                                    onChange={(e) => setSelectedPage({ ...selectedPage, category: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Status
                            </label>
                            <select
                                value={selectedPage.status}
                                onChange={(e) => setSelectedPage({ ...selectedPage, status: e.target.value as any })}
                                disabled={!isEditing}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="scheduled">Scheduled</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={selectedPage.featured}
                                    onChange={(e) => setSelectedPage({ ...selectedPage, featured: e.target.checked })}
                                    disabled={!isEditing}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-slate-700">Featured (show on homepage)</span>
                            </label>
                        </div>

                        <div className="md:col-span-2 border-t border-slate-200 pt-6">
                            <h4 className="font-semibold text-slate-900 mb-4">SEO Settings</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        SEO Title (60 chars max)
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedPage.seoTitle}
                                        onChange={(e) => setSelectedPage({ ...selectedPage, seoTitle: e.target.value })}
                                        disabled={!isEditing}
                                        maxLength={60}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">{selectedPage.seoTitle.length}/60</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        SEO Description (160 chars max)
                                    </label>
                                    <textarea
                                        value={selectedPage.seoDescription}
                                        onChange={(e) => setSelectedPage({ ...selectedPage, seoDescription: e.target.value })}
                                        disabled={!isEditing}
                                        maxLength={160}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">{selectedPage.seoDescription.length}/160</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 border-t border-slate-200 pt-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Content *
                            </label>
                            <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 mb-2">
                                <p className="text-xs text-slate-600 mb-2">
                                    💡 Use a rich text editor like TinyMCE or CKEditor for better content editing
                                </p>
                            </div>
                            <textarea
                                value={selectedPage.content}
                                onChange={(e) => setSelectedPage({ ...selectedPage, content: e.target.value })}
                                disabled={!isEditing}
                                rows={12}
                                placeholder="Enter page content here... (supports HTML)"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 font-mono text-sm"
                            />
                        </div>
                    </div>

                    {isEditing && (
                        <div className="mt-6 flex space-x-3 pt-6 border-t border-slate-200">
                            <button
                                onClick={handleSavePage}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setSelectedPage(pages.find(p => p.id === selectedPage.id) || null);
                                }}
                                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Page Builder & CMS</h1>
                <p className="text-cyan-100">Create and manage landing pages, blog posts, and knowledge base articles</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex space-x-2">
                    {[
                        { id: 'all', label: 'All Pages', count: pages.length },
                        { id: 'landing', label: 'Landing Pages', count: pages.filter(p => p.type === 'landing').length },
                        { id: 'blog', label: 'Blog Posts', count: pages.filter(p => p.type === 'blog').length },
                        { id: 'knowledge', label: 'Knowledge Base', count: pages.filter(p => p.type === 'knowledge-base').length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>
            </div>

            {selectedPage ? <PageEditor /> : <PagesList />}
        </div>
    );
};

export default PageBuilder;