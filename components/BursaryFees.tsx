import React, { useState, useEffect, useMemo } from 'react';
import { apiGetFeeStructures, apiSaveFeeStructures, apiGetSubjects, apiGetSchoolSettings, apiGetStudents, apiGetInvoices, apiBatchUpdateInvoices } from '../services/api';
import { FeeStructure, Subject, SchoolSettings, Student, Invoice } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import SpinnerIcon from './icons/SpinnerIcon';

const BursaryFees = () => {
    const [structures, setStructures] = useState<FeeStructure[]>([]);
    const [allClasses, setAllClasses] = useState<string[]>([]);
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [structureToDelete, setStructureToDelete] = useState<FeeStructure | null>(null);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const [structData, subData, setData] = await Promise.all([apiGetFeeStructures(), apiGetSubjects(), apiGetSchoolSettings()]);
        setStructures(structData);
        setAllClasses([...new Set<string>(subData.flatMap(s => s.classes))].sort());
        setSettings(setData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (structureData: Partial<FeeStructure>) => {
        let updatedStructures;
        if (editingStructure) {
            updatedStructures = structures.map(s => s.id === editingStructure.id ? { ...s, ...structureData } : s);
        } else {
            updatedStructures = [...structures, { ...structureData, id: `fs_${Date.now()}` }];
        }
        await apiSaveFeeStructures(updatedStructures as FeeStructure[]);
        setStructures(updatedStructures as FeeStructure[]);
        setModalOpen(false);
    };

    const handleDelete = async () => {
        if (!structureToDelete) return;
        const updated = structures.filter(s => s.id !== structureToDelete.id);
        await apiSaveFeeStructures(updated);
        setStructures(updated);
        setDeleteModalOpen(false);
    };

    const handleGenerateInvoices = async (structure: FeeStructure) => {
        if (!window.confirm(`This will generate invoices for all students in ${structure.applicableClasses.join(', ')} for ${structure.term}, ${structure.session}. This will not override existing invoices for the same students in the same term. Continue?`)) return;

        setIsGenerating(structure.id);
        try {
            const [allStudents, allInvoices] = await Promise.all([apiGetStudents(), apiGetInvoices()]);

            const studentsToBill = allStudents.filter(s => structure.applicableClasses.includes(s.class));
            const newInvoices: Invoice[] = [];

            studentsToBill.forEach(student => {
                const alreadyExists = allInvoices.some(inv =>
                    inv.studentId === student.id &&
                    inv.session === structure.session &&
                    inv.term === structure.term
                );
                if (!alreadyExists) {
                    newInvoices.push({
                        id: `inv_${student.id}_${structure.session.replace('/', '-')}_${structure.term.replace(' ', '')}`,
                        studentId: student.id,
                        class: student.class,
                        session: structure.session,
                        term: structure.term,
                        issueDate: new Date().toISOString(),
                        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Due in 14 days
                        totalAmount: structure.totalAmount,
                        amountPaid: 0,
                        status: 'unpaid',
                        items: structure.items,
                    });
                }
            });

            if (newInvoices.length > 0) {
                await apiBatchUpdateInvoices(newInvoices);
                window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: `${newInvoices.length} invoices generated successfully.` } }));
            } else {
                window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: "No new invoices to generate. Invoices may already exist for these students for the selected term/session." } }));
            }
        } catch (error) {
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: `Error generating invoices: ${error.message}` } }));
        } finally {
            setIsGenerating(null);
        }
    };

    if (loading) return <div>Loading fee structures...</div>;

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => { setEditingStructure(null); setModalOpen(true); }} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> New Fee Structure</button>
            </div>
            <div className="table-container">
                <table className="table">
                    <thead><tr><th className="th">Name</th><th className="th">Term</th><th className="th">Classes</th><th className="th text-right">Amount (₦)</th><th className="th text-right">Actions</th></tr></thead>
                    <tbody>
                        {structures.map(s => (
                            <tr key={s.id}>
                                <td className="td font-medium">{s.name}</td>
                                <td className="td">{s.term}, {s.session}</td>
                                <td className="td">{s.applicableClasses.join(', ')}</td>
                                <td className="td text-right font-mono">{s.totalAmount.toLocaleString()}</td>
                                <td className="td text-right space-x-1">
                                    <button onClick={() => handleGenerateInvoices(s)} className="btn btn-secondary text-xs" disabled={!!isGenerating}>
                                        {isGenerating === s.id ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : 'Generate Invoices'}
                                    </button>
                                    <button onClick={() => { setEditingStructure(s); setModalOpen(true); }} className="icon-button"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => { setStructureToDelete(s); setDeleteModalOpen(true); }} className="icon-button text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <FeeStructureFormModal structure={editingStructure} all_classes={allClasses} settings={settings} onSave={handleSave} onClose={() => setModalOpen(false)} />}
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete} title="Delete Fee Structure" message={`Are you sure you want to delete "${structureToDelete?.name}"? This cannot be undone.`} />
        </div>
    );
};

const FeeStructureFormModal = ({ structure, all_classes, settings, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        session: settings?.session || '',
        term: settings?.term || 'First Term',
        applicableClasses: [],
        items: [{ description: 'Tuition Fee', amount: 0 }],
        totalAmount: 0,
        ...structure
    });

    useEffect(() => {
        const total = formData.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        setFormData(prev => ({ ...prev, totalAmount: total }));
    }, [formData.items]);

    const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const values = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
        setFormData(prev => ({...prev, applicableClasses: values}));
    };
    
    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => setFormData(prev => ({ ...prev, items: [...prev.items, { description: '', amount: 0 }] }));
    const removeItem = index => setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

    const handleSubmit = e => { e.preventDefault(); onSave(formData); };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={structure ? 'Edit Fee Structure' : 'New Fee Structure'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label">Structure Name</label><input name="name" value={formData.name} onChange={handleChange} className="input-field" required /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Session</label><input name="session" value={formData.session} onChange={handleChange} className="input-field" required /></div>
                    <div><label className="label">Term</label><select name="term" value={formData.term} onChange={handleChange} className="input-field"><option>First Term</option><option>Second Term</option><option>Third Term</option></select></div>
                </div>
                <div><label className="label">Applicable Classes (hold Ctrl/Cmd to select multiple)</label><select multiple value={formData.applicableClasses} onChange={handleClassChange} className="input-field h-32"><option value="all">All Classes</option>{all_classes.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                
                <div>
                    <label className="label">Fee Items</label>
                    <div className="space-y-2">
                        {formData.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input type="text" placeholder="Description" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className="input-field w-2/3" />
                                <input type="number" placeholder="Amount" value={item.amount} onChange={e => handleItemChange(index, 'amount', e.target.value)} className="input-field w-1/3" />
                                <button type="button" onClick={() => removeItem(index)} className="icon-button text-red-500"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={addItem} className="btn btn-secondary text-sm mt-2"><PlusIcon className="w-4 h-4 mr-1"/> Add Item</button>
                </div>

                <div className="text-right font-bold text-lg">Total: ₦{formData.totalAmount.toLocaleString()}</div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save Structure</button></div>
            </form>
        </Modal>
    )
}

export default BursaryFees;