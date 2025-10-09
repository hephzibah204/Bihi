import React, { useState, useEffect } from 'react';
import { apiGetKbArticles } from '../services/api';
import Modal from './Modal';
import SpinnerIcon from './icons/SpinnerIcon';
import SearchIcon from './icons/SearchIcon';
import { Page as Article } from '../types';

const DashboardKnowledgeBase = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            try {
                const allArticles = await apiGetKbArticles();
                const publishedArticles = allArticles.filter(a => a.status === 'published');
                setArticles(publishedArticles);
            } catch (error) {
                console.error("Failed to load knowledge base:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, []);

    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="card p-6 text-center"><SpinnerIcon className="w-8 h-8 animate-spin mx-auto"/> Loading Knowledge Base...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                 <h1 className="text-2xl font-semibold">Help & Knowledge Base</h1>
                 <div className="relative w-full max-w-sm">
                     <input
                        type="text"
                        placeholder="Search articles..."
                        className="input-field pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            </div>
           
            <div className="space-y-4">
                {filteredArticles.length > 0 ? filteredArticles.map(article => (
                    <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="w-full text-left card p-6 hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-xl font-semibold text-indigo-700">{article.title}</h2>
                        <p className="mt-2 text-gray-600 line-clamp-2" dangerouslySetInnerHTML={{ __html: article.content.replace(/<[^>]+>/g, '') }} />
                    </button>
                )) : (
                    <div className="card p-8 text-center text-gray-500">
                        <p>No articles found matching your search.</p>
                    </div>
                )}
            </div>
            
            {selectedArticle && (
                <Modal isOpen={!!selectedArticle} onClose={() => setSelectedArticle(null)} title={selectedArticle.title} size="lg">
                    <div className="p-6 max-h-[70vh] overflow-y-auto prose prose-indigo">
                        <div className="prose-content" dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default DashboardKnowledgeBase;