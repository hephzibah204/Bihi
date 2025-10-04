import React, { useState, useEffect } from 'react';
import { apiGetPlatformSettings } from '../services/api';
import { formatDate } from '../utils/dateHelpers';

const BlogPostPage = () => {
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticle = async () => {
            const params = new URLSearchParams(window.location.search);
            const articleId = params.get('id');
            if (!articleId) {
                setLoading(false);
                return;
            }
            const settings = await apiGetPlatformSettings();
            const foundArticle = (settings.articles || []).find(a => a.id === articleId);
            setArticle(foundArticle);
            setLoading(false);
        };
        fetchArticle();
    }, []);

    if (loading) return <p>Loading article...</p>;
    if (!article) return <div><h1 className="text-2xl">Article not found.</h1><a href="?view=blog">Back to Knowledge Base</a></div>;

    return (
        <article className="prose max-w-none">
            <h1>{article.title}</h1>
            <p className="text-sm text-gray-500">Last updated: {formatDate(article.lastUpdated)}</p>
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: article.content }} />
             <a href="?view=blog" className="mt-8 inline-block">← Back to all articles</a>
        </article>
    );
};

export default BlogPostPage;