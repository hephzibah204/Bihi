import React, { useState, useEffect } from 'react';
import { apiGetKbArticles, apiSaveKbArticles } from '../services/api';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';

const KBArticleManager = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [articleData, setArticleData] = useState({ title: '', content: '', status: 'draft' });

    useEffect(() => {
        const fetchArticles = async () => {
            const kbArticles = await apiGetKbArticles();
            setArticles(kbArticles || []);
            setLoading(false);
        };
        fetchArticles();
    }, []);

    const handleSave = async (updatedArticles) => {
        await apiSaveKbArticles(updatedArticles);
        setArticles(updatedArticles);
    };

    const handleOpenModal = (article = null) => {
        if (article) {
            setEditingArticle(article);
            setArticleData(article);
        } else {
            setEditingArticle(null);
            setArticleData({ title: '', content: '', status: 'draft' });
        }
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        let updatedArticles;
        const articlePayload = {
            ...articleData,
            lastUpdated: new Date().toISOString()
        };
        if (editingArticle) {
            updatedArticles = articles.map(a => a.id === editingArticle.id ? { ...articlePayload, id: a.id } : a);
        } else {
            updatedArticles = [...articles, { ...articlePayload, id: `kb_${Date.now()}` }];
        }
        await handleSave(updatedArticles);
        setModalOpen(false);
    };
    
    const handleDelete = async (articleId) => {
        if (!window.confirm("Are you sure?")) return;
        const updatedArticles = articles.filter(a => a.id !== articleId);
        await handleSave(updatedArticles);
    }

    if (loading) return <p>Loading articles...</p>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Knowledge Base Manager</h2>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> New KB Article</button>
                </div>
                <div className="table-container mt-4">
                    <table className="table">
                        <thead><tr><th className="th">Title</th><th className="th">Status</th><th className="th">Last Updated</th><th className="th text-right">Actions</th></tr></thead>
                        <tbody>
                            {articles.map(article => (
                                <tr key={article.id}>
                                    <td className="td font-medium">{article.title}</td>
                                    <td className="td">{article.status}</td>
                                    <td className="td">{new Date(article.lastUpdated).toLocaleDateString()}</td>
                                    <td className="td text-right">
                                        <button onClick={() => handleOpenModal(article)} className="text-indigo-600 mr-4">Edit</button>
                                        <button onClick={() => handleDelete(article.id)} className="text-red-500">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingArticle ? 'Edit KB Article' : 'New KB Article'}>
                 <div className="p-6 space-y-4">
                    <div>
                        <label className="label">Title</label>
                        <input value={articleData.title} onChange={e => setArticleData({...articleData, title: e.target.value})} className="input-field" />
                    </div>
                    <div>
                        <label className="label">Content (Markdown supported)</label>
                        <textarea rows="10" value={articleData.content} onChange={e => setArticleData({...articleData, content: e.target.value})} className="input-field"></textarea>
                    </div>
                    <div>
                        <label className="label">Status</label>
                         <select value={articleData.status} onChange={e => setArticleData({...articleData, status: e.target.value})} className="input-field">
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleSubmit} className="btn btn-primary">Save Article</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default KBArticleManager;