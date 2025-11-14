

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGetKbArticles } from '../services/api';
import { formatDate } from '../utils/dateHelpers';
import { HtmlContent } from './HtmlContent';

const KBPostPage = () => {
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id: articleId } = useParams();

    useEffect(() => {
        const fetchArticle = async () => {
            if (!articleId) {
                setLoading(false);
                return;
            }
            const articles = await apiGetKbArticles();
            const foundArticle = articles.find(a => a.id === articleId);
            setArticle(foundArticle);
            setLoading(false);
        };
        fetchArticle();
    }, [articleId]);

    if (loading) return <p>Loading article...</p>;
    if (!article) return <div><h1 className="text-2xl">Article not found.</h1><Link to="/kb">Back to Knowledge Base</Link></div>;

    return (
        <article className="prose max-w-none">
            <h1>{article.title}</h1>
            <p className="text-sm text-gray-500">Last updated: {formatDate(article.lastUpdated)}</p>
            <HtmlContent html={article.content || ''} />
            <Link to="/kb" className="mt-8 inline-block no-underline hover:text-indigo-600">← Back to Knowledge Base</Link>
        </article>
    );
};

export default KBPostPage;
