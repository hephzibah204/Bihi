
import React, { useState, useEffect } from 'react';
import { apiGetPlatformSettings, apiSavePlatformSettings } from '../services/api';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import { formatDate } from '../utils/dateHelpers';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import RichTextEditor from './RichTextEditor';

const ArticleManager = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [articleData, setArticleData] = useState({ title: '', content: '', status: 'draft' });

    useEffect(() => {
        const fetchArticles = async () => {
            const settings = await apiGetPlatformSettings();
            setArticles(settings.articles || []);
            setLoading(false);
        };
        fetchArticles();
    }, []);

    const handleSave = async (updatedArticles) => {
        const settings = await apiGetPlatformSettings();
        await apiSavePlatformSettings({ ...settings, articles: updatedArticles });
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
        if (editingArticle) {
            updatedArticles = articles.map(a => a.id === editingArticle.id ? { ...articleData, id: a.id } : a);
        } else {
            updatedArticles = [...articles, { ...articleData, id: `art_${Date.now()}`, lastUpdated: new Date().toISOString() }];
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
                    <h2 className="text-xl font-semibold">Content Manager</h2>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> New Article</button>
                </div>
                <div className="table-container mt-4">
                    <table className="table">
                        <thead><tr><th className="th">Title</th><th className="th">Status</th><th className="th">Last Updated</th><th className="th text-right">Actions</th></tr></thead>
                        <tbody>
                            {articles.map(article => (
                                <tr key={article.id}>
                                    <td className="td font-medium">{article.title}</td>
                                    <td className="td">{article.status}</td>
                                    <td className="td">{formatDate(article.lastUpdated)}</td>
                                    <td className="td text-right space-x-1">
                                        <button onClick={() => handleOpenModal(article)} className="icon-button" title="Edit"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(article.id)} className="icon-button text-red-500" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingArticle ? 'Edit Article' : 'New Article'} size="lg">
                 <div className="p-6 space-y-4">
                    <div>
                        <label className="label">Title</label>
                        <input value={articleData.title} onChange={e => setArticleData({...articleData, title: e.target.value})} className="input-field" />
                    </div>
                    <div>
                        <label className="label">Content</label>
                        <RichTextEditor
                            value={articleData.content}
                            onChange={(content) => setArticleData(prev => ({ ...prev, content }))}
                        />
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

export default ArticleManager;
