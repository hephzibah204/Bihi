import React, { useState, useEffect, useMemo, FC, PropsWithChildren } from 'react';
import { apiGetTeachers, apiUpsertTeacher, apiDeleteTeacher } from '../services/api';
import { Teacher } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import ConfirmationModal from './ConfirmationModal';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import { USER_ROLES } from '../utils/constants';

const EditableNameAmountList = ({ title, items, onChange }) => {
    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onChange(newItems);
    };

    const addItem = () => {
        onChange([...items, { name: '', amount: 0 }]);
    };

    const removeItem = (index) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <div>
            <div className="flex justify-between items-center">
                <label className="label">{title}</label>
                <button type="button" onClick={addItem} className="btn btn-secondary text-sm p-1.5"><PlusIcon className="w-4 h-4"/> Add</button>
            </div>
            <div className="space-y-2 mt-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-md">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Name"
                            value={item.name}
                            onChange={e => handleItemChange(index, 'name', e.target.value)}
                            className="input-field p-1 text-sm"
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            value={item.amount}
                            onChange={e => handleItemChange(index, 'amount', Number(e.target.value))}
                            className="input-field p-1 text-sm w-28"
                        />
                        <button type="button" onClick={() => removeItem(index)} className="icon-button text-red-500"><TrashIcon className="w-4 h-4"/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};


const Staff = () => {
    const [staffList, setStaffList] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Partial<Teacher> | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState<Teacher | null>(null);
    const [activeTab, setActiveTab] = useState('all');

    const fetchStaff = async () => {
        setLoading(true);
        const data = await apiGetTeachers();
        setStaffList(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchStaff();
    }, []);
    
    const filteredStaff = useMemo(() => {
        if (activeTab === 'all') {
            return staffList;
        }
        return staffList.filter(s => s.role === activeTab);
    }, [staffList, activeTab]);

    const handleOpenModal = (staff: Teacher | null = null) => {
        setEditingStaff(staff);
        setModalOpen(true);
    };

    const handleSaveStaff = async (staffData: Partial<Teacher>) => {
        await apiUpsertTeacher(staffData);
        fetchStaff();
        setModalOpen(false);
    };
    
    const openDeleteModal = (staff: Teacher) => {
        setStaffToDelete(staff);
        setDeleteModalOpen(true);
    };

    const handleDeleteStaff = async () => {
        if (!staffToDelete) return;
        await apiDeleteTeacher(staffToDelete.id);
        fetchStaff();
        setDeleteModalOpen(false);
        setStaffToDelete(null);
    };
    
    interface TabButtonProps {
        name: string;
        label: string;
    }

    const TabButton: FC<PropsWithChildren<TabButtonProps>> = ({ name, label }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`px-4 py-1.5 rounded-md font-semibold text-sm transition-colors ${activeTab === name ? 'bg-white shadow-sm' : 'text-gray-600'}`}
        >
            {label}
        </button>
    );

    if (loading) return <div>Loading staff...</div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                 <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
                    <TabButton name="all" label="All Staff" />
                    <TabButton name={USER_ROLES.ADMIN} label="Admins" />
                    <TabButton name={USER_ROLES.TEACHER} label="Teachers" />
                    <TabButton name={USER_ROLES.BURSAR} label="Bursars" />
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary w-full md:w-auto"><PlusIcon className="w-5 h-5 mr-2"/> Add Staff</button>
            </div>
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Name</th>
                            <th className="th">Email</th>
                            <th className="th">Role</th>
                            <th className="th">Base Salary</th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y">
                        {filteredStaff.map(staff => (
                            <tr key={staff.id}>
                                <td className="td font-medium">{staff.name}</td>
                                <td className="td">{staff.email}</td>
                                <td className="td">{staff.role}</td>
                                <td className="td font-mono">{staff.baseSalary ? `₦${staff.baseSalary.toLocaleString()}`: 'Not Set'}</td>
                                <td className="td text-right space-x-1">
                                    <button onClick={() => handleOpenModal(staff)} className="icon-button" title="Edit"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => openDeleteModal(staff)} className="icon-button text-red-500" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <StaffFormModal staff={editingStaff} onSave={handleSaveStaff} onClose={() => setModalOpen(false)} />}
             <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteStaff}
                title="Delete Staff Member"
                message={`Are you sure you want to delete ${staffToDelete?.name}?`}
            />
        </div>
    );
};

const StaffFormModal = ({ staff, onSave, onClose }) => {
    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        role: 'Teacher',
        baseSalary: 0,
        allowances: [],
        deductions: [], 
        enableAutoTax: true,
        enableAutoPension: true,
        ...staff 
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={staff ? 'Edit Staff Member' : 'Add Staff Member'} size="md">
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div><label className="label">Full Name</label><input name="name" value={formData.name} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required /></div>
                <div>
                    <label className="label">Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="input-field">
                        <option value={USER_ROLES.TEACHER}>Teacher</option>
                        <option value={USER_ROLES.ADMIN}>Admin</option>
                        <option value={USER_ROLES.BURSAR}>Bursar</option>
                    </select>
                </div>
                <div className="border-t pt-4">
                    <h3 className="font-semibold">Payroll Information</h3>
                    <div className="mt-2 space-y-4">
                        <div><label className="label">Base Salary (Monthly)</label><input type="number" name="baseSalary" value={formData.baseSalary || ''} onChange={handleChange} className="input-field" /></div>
                        
                        <div className="space-y-2 rounded-md border p-3">
                            <label className="flex items-center justify-between">
                                <span className="font-medium text-sm">Enable Automatic Pension Deduction (8%)</span>
                                <input type="checkbox" name="enableAutoPension" checked={formData.enableAutoPension} onChange={handleChange} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500" />
                            </label>
                            <label className="flex items-center justify-between">
                                <span className="font-medium text-sm">Enable Automatic Tax (PAYE) Calculation</span>
                                <input type="checkbox" name="enableAutoTax" checked={formData.enableAutoTax} onChange={handleChange} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500" />
                            </label>
                        </div>

                        <EditableNameAmountList title="Additional Allowances" items={formData.allowances || []} onChange={(newItems) => setFormData(prev => ({...prev, allowances: newItems}))} />
                        <EditableNameAmountList title="Other Deductions (e.g., Loans)" items={formData.deductions || []} onChange={(newItems) => setFormData(prev => ({...prev, deductions: newItems}))} />
                    </div>
                </div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save Staff</button></div>
            </form>
        </Modal>
    );
};

export default Staff;