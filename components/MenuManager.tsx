import React, { useState, useEffect } from 'react';
import { apiGetPlatformSettings, apiSavePlatformSettings } from '../services/api';
import { MenuItem, Page } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

const MenuManager = () => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const settings = await apiGetPlatformSettings();
        setMenuItems(settings.menus?.header || []);
        setPages(settings.pages || []);
        setLoading(false);
    };

    const handleSave = async (updatedItems: MenuItem[]) => {
        const settings = await apiGetPlatformSettings();
        const updatedMenus = { ...settings.menus, header: updatedItems };
        await apiSavePlatformSettings({ ...settings, menus: updatedMenus });
        setMenuItems(updatedItems);
    };

    const handleOpenModal = (item: MenuItem | null = null) => {
        setEditingItem(item);
        setModalOpen(true);
    };

    const handleDelete = async (itemId: string) => {
        if (!window.confirm("Are you sure you want to delete this menu item?")) return;
        const updatedItems = menuItems.filter(item => item.id !== itemId);
        await handleSave(updatedItems);
    };

    if (loading) return <p>Loading menus...</p>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Header Menu Manager</h2>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> Add Menu Item</button>
                </div>
                <div className="table-container mt-4">
                    <table className="table">
                        <thead><tr><th className="th">Label</th><th className="th">URL / Path</th><th className="th text-right">Actions</th></tr></thead>
                        <tbody>
                            {menuItems.map(item => (
                                <tr key={item.id}>
                                    <td className="td font-medium">{item.label}</td>
                                    <td className="td font-mono">{item.url}</td>
                                    <td className="td text-right space-x-1">
                                        <button onClick={() => handleOpenModal(item)} className="icon-button" title="Edit"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(item.id)} className="icon-button text-red-500" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <MenuItemEditorModal item={editingItem} allItems={menuItems} pages={pages} onSave={handleSave} onClose={() => setModalOpen(false)} />}
        </div>
    );
};


const MenuItemEditorModal = ({ item, allItems, pages, onSave, onClose }) => {
    const [itemData, setItemData] = useState(item || { label: '', url: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setItemData(prev => ({...prev, [name]: value}));
    };
    
    const handleUrlChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemData(prev => ({...prev, url: e.target.value}));
    };

    const handleSubmit = () => {
        let updatedItems;
        if (item) {
            updatedItems = allItems.map(i => i.id === item.id ? { ...itemData, id: i.id } : i);
        } else {
            updatedItems = [...allItems, { ...itemData, id: `menu_${Date.now()}` }];
        }
        onSave(updatedItems);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={item ? 'Edit Menu Item' : 'Add Menu Item'}>
            <div className="p-6 space-y-4">
                <div><label className="label">Label</label><input name="label" value={itemData.label} onChange={handleChange} className="input-field" placeholder="e.g., About Us"/></div>
                <div>
                    <label className="label">Link To</label>
                     <select className="input-field mb-2" onChange={handleUrlChange} value={itemData.url}>
                        <option value="">-- Select a page or enter custom URL --</option>
                        <optgroup label="Pages">
                            {pages.filter(p => p.status === 'published').map(p => (
                                <option key={p.id} value={p.slug}>{p.title} ({p.slug})</option>
                            ))}
                        </optgroup>
                         <optgroup label="Special Views">
                            <option value="?view=blog">Blog</option>
                            <option value="?view=kb">Knowledge Base</option>
                         </optgroup>
                         <optgroup label="Common Anchors">
                             <option value="#features">#features</option>
                             <option value="#pricing">#pricing</option>
                             <option value="#faq">#faq</option>
                         </optgroup>
                    </select>
                    <input name="url" value={itemData.url} onChange={handleChange} className="input-field" placeholder="Or enter a custom URL (e.g., https://...)" />
                </div>
                <div className="flex justify-end pt-2"><button onClick={handleSubmit} className="btn btn-primary">Save Item</button></div>
            </div>
        </Modal>
    );
}


export default MenuManager;