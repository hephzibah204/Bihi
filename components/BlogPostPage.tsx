

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGetPlatformSettings } from '../services/api';
import { formatDate } from '../utils/dateHelpers';
import { HtmlContent } from './HtmlContent';

const BlogPostPage = () => {
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id: articleId } = useParams();

    useEffect(() => {
        const fetchArticle = async () => {
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
    }, [articleId]);

    if (loading) return <p>Loading article...</p>;
    if (!article) return <div><h1 className="text-2xl">Article not found.</h1><Link to="/blog">Back to Blog</Link></div>;

    return (
        <article className="prose max-w-none">
            <h1>{article.title}</h1>
            <p className="text-sm text-gray-500">Last updated: {formatDate(article.lastUpdated)}</p>
            <HtmlContent html={article.content || ''} />
            <Link to="/blog" className="mt-8 inline-block no-underline">← Back to all articles</Link>
        </article>
    );
};

export default BlogPostPage;
