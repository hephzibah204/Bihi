import React, { useState, useEffect } from 'react';
import { apiGetPlatformSettings, apiSavePlatformSettings } from '../services/api';
import { Page } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import { formatDate } from '../utils/dateHelpers';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import RichTextEditor from './RichTextEditor';

const PageManager = () => {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<Page | null>(null);
    const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            setLoading(true);
            setError(null);
            const settings = await apiGetPlatformSettings();
            setPages(settings.pages || []);
        } catch (e: any) {
            const msg = e?.message || 'Failed to load pages';
            setError(msg);
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: msg } }));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updatedPages: Page[]) => {
        try {
            const settings = await apiGetPlatformSettings();
            await apiSavePlatformSettings({ ...settings, pages: updatedPages });
            setPages(updatedPages);
            window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Pages saved' } }));
        } catch (e: any) {
            const msg = e?.message || 'Failed to save pages';
            setError(msg);
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: msg } }));
        }
    };

    const handleOpenModal = (page: Page | null = null) => {
        setEditingPage(page);
        setModalOpen(true);
    };
    
    const openDeleteModal = (page: Page) => {
        setPageToDelete(page);
        setDeleteModalOpen(true);
    }

    const handleDelete = async () => {
        if (!pageToDelete) return;
        const updatedPages = pages.filter(p => p.id !== pageToDelete.id);
        await handleSave(updatedPages);
        setDeleteModalOpen(false);
    }

    if (loading) return <p>Loading pages...</p>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Page Manager</h2>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> New Page</button>
                </div>
                {error && <div className="mt-4 px-4 py-2 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}
                <div className="table-container mt-4">
                    <table className="table">
                        <thead><tr><th className="th">Title</th><th className="th">Slug</th><th className="th">Status</th><th className="th">Last Updated</th><th className="th text-right">Actions</th></tr></thead>
                        <tbody>
                            {pages.map(page => (
                                <tr key={page.id}>
                                    <td className="td font-medium">{page.title}</td>
                                    <td className="td font-mono">{page.slug}</td>
                                    <td className="td"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${page.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{page.status}</span></td>
                                    <td className="td">{formatDate(page.lastUpdated)}</td>
                                    <td className="td text-right space-x-1">
                                        <a href={page.slug} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-sm">View</a>
                                        <button onClick={() => handleOpenModal(page)} className="icon-button" title="Edit"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openDeleteModal(page)} className="icon-button text-red-500" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <PageEditorModal page={editingPage} allPages={pages} onSave={handleSave} onClose={() => setModalOpen(false)} />}
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete} title="Delete Page" message={`Are you sure you want to delete the page "${pageToDelete?.title}"? This cannot be undone.`} />
        </div>
    );
};

const PageEditorModal = ({ page, allPages, onSave, onClose }) => {
    const [pageData, setPageData] = useState<Partial<Page>>(page || { title: '', slug: '', content: '', status: 'draft', metaTitle: '', metaDescription: '' });
    const [validationError, setValidationError] = useState<string | null>(null);

    const slugify = (text: string) => {
        return '/' + text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newPageData = { ...pageData, [name]: value };
        if (name === 'title' && !page) { // Auto-generate slug for new pages
            newPageData.slug = slugify(value);
        }
        setPageData(newPageData);
    };

    const handleContentChange = (content: string) => {
        setPageData(prev => ({ ...prev, content }));
    };

    const handleSubmit = () => {
        setValidationError(null);
        // Basic validation: title required, slug must start with '/'
        const titleOk = !!pageData.title && pageData.title.trim().length > 0;
        const slugOk = !!pageData.slug && /^\//.test(pageData.slug.trim());
        const uniqueSlug = !allPages.some(p => p.slug === pageData.slug && (!page || p.id !== page.id));
        if (!titleOk || !slugOk || !uniqueSlug) {
            const msg = !titleOk ? 'Title is required' : !slugOk ? 'Slug must start with "/"' : 'Slug must be unique';
            setValidationError(msg);
            return;
        }
        let updatedPages;
        const pagePayload: Page = {
            ...pageData,
            lastUpdated: new Date().toISOString()
        } as Page;
        
        if (page) { // Editing existing page
            updatedPages = allPages.map(p => p.id === page.id ? { ...pagePayload, id: p.id } : p);
        } else { // Adding new page
            updatedPages = [...allPages, { ...pagePayload, id: `page_${Date.now()}` }];
        }
        onSave(updatedPages);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={page ? 'Edit Page' : 'New Page'} size="lg">
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div><label className="label">Page Title</label><input name="title" value={pageData.title} onChange={handleChange} className="input-field" /></div>
                <div><label className="label">URL Slug</label><input name="slug" value={pageData.slug} onChange={handleChange} className="input-field font-mono" /></div>
                <div>
                    <label className="label">Content</label>
                    <RichTextEditor value={pageData.content} onChange={handleContentChange} />
                </div>
                <div><label className="label">Status</label><select name="status" value={pageData.status} onChange={handleChange} className="input-field"><option value="draft">Draft</option><option value="published">Published</option></select></div>
                <div className="border-t pt-4">
                    <h4 className="font-semibold">SEO Settings</h4>
                    <div><label className="label">Meta Title (for search engines)</label><input name="metaTitle" value={pageData.metaTitle} onChange={handleChange} className="input-field" placeholder="e.g., About Brightstar Academy | ReportSheet" /></div>
                    <div><label className="label">Meta Description</label><textarea name="metaDescription" value={pageData.metaDescription} onChange={handleChange} className="input-field" rows={2} placeholder="A brief summary for search engines."></textarea></div>
                </div>
                {validationError && <div className="text-red-600 text-xs">{validationError}</div>}
                <div className="flex justify-end pt-2"><button onClick={handleSubmit} className="btn btn-primary">Save Page</button></div>
            </div>
        </Modal>
    );
}

export default PageManager;