import React, { useState, useEffect } from 'react';
import { apiGetPlatformSettings } from '../services/api';

const BlogIndexPage = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            const settings = await apiGetPlatformSettings();
            const publishedArticles = (settings.articles || []).filter(a => a.status === 'published');
            setArticles(publishedArticles);
            setLoading(false);
        };
        fetchArticles();
    }, []);

    if (loading) return <p>Loading articles...</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold mb-8">Knowledge Base</h1>
            <div className="space-y-8">
                {articles.map(article => (
                    <div key={article.id} className="card p-6">
                        <h2 className="text-2xl font-semibold hover:text-indigo-600">
                            <a href={`?view=article&id=${article.id}`}>{article.title}</a>
                        </h2>
                        <p className="mt-2 text-gray-600">
                            {article.content.substring(0, 150)}...
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BlogIndexPage;