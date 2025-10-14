

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGetKbArticles } from '../services/api'; // Using a dedicated API for KB

const KBIndexPage = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            const kbArticles = await apiGetKbArticles();
            setArticles(kbArticles.filter(a => a.status === 'published'));
            setLoading(false);
        };
        fetchArticles();
    }, []);

    if (loading) return <p>Loading knowledge base...</p>;

    return (
        <div>
            <h1 className="text-4xl font-bold mb-8">Help & Knowledge Base</h1>
            <div className="space-y-8">
                {articles.length > 0 ? articles.map(article => (
                    <div key={article.id} className="card p-6">
                        <h2 className="text-2xl font-semibold hover:text-indigo-600">
                            <Link to={`/kb/${article.id}`}>{article.title}</Link>
                        </h2>
                        <p className="mt-2 text-gray-600">
                            {article.content.substring(0, 150)}...
                        </p>
                    </div>
                )) : (
                    <div className="card p-6 text-center">
                        <p>No help articles have been published yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KBIndexPage;
