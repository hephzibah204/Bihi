import React, { useState, useEffect } from 'react';
import PlusIcon from './icons/PlusIcon';
import Modal from './Modal';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import { apiGetSchoolSettings, apiGetPaymentMethods, apiSavePaymentMethods } from '../services/api';
import { supabase } from '../services/supabaseClient';
import SpinnerIcon from './icons/SpinnerIcon';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const PaymentSettings = () => {
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [methodToDelete, setMethodToDelete] = useState(null);
    const [paystackKey, setPaystackKey] = useState('');
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [settings, paymentMethods] = await Promise.all([
                    apiGetSchoolSettings(),
                    apiGetPaymentMethods()
                ]);
                setPaystackKey(settings.paystackPublicKey || '');
                setMethods(paymentMethods || []);

                if (supabase) {
                    const { data, error } = await supabase.auth.getUser();
                    if (data?.user) {
                        setUserEmail(data.user.email);
                    }
                }
            } catch (error) {
                // error handled silently
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleAddMethod = () => {
        if (!window.PaystackPop || !paystackKey || !userEmail) {
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: "Payment service is not configured correctly. Please contact support." } }));
            return;
        }

        const handler = window.PaystackPop.setup({
            key: paystackKey,
            email: userEmail,
            amount: 5000, // Authorize card with ₦50 (in kobo)
            ref: 'auth_' + Math.floor((Math.random() * 1000000000) + 1),
            onClose: () => {},
            callback: async (response) => {
                if (response.status === 'success') {
                    const { authorization } = response;
                    const newMethod = {
                        id: authorization.last4 + Date.now(),
                        type: authorization.card_type,
                        last4: authorization.last4,
                        expiry: `${authorization.exp_month}/${authorization.exp_year.slice(-2)}`,
                    };
                    const updatedMethods = [...methods, newMethod];
                    await apiSavePaymentMethods(updatedMethods);
                    setMethods(updatedMethods);
                } else {
                    window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: 'Card authorization failed. Please try again.' } }));
                }
            }
        });
        handler.openIframe();
    };

    const openDeleteModal = (method) => {
        setMethodToDelete(method);
        setDeleteModalOpen(true);
    };
    
    const handleDeleteMethod = async () => {
        if (!methodToDelete) return;
        const updatedMethods = methods.filter(m => m.id !== methodToDelete.id);
        await apiSavePaymentMethods(updatedMethods);
        setMethods(updatedMethods);
        setDeleteModalOpen(false);
        setMethodToDelete(null);
    };

    if (loading) {
        return <div className="card p-6">Loading payment methods...</div>;
    }

    return (
        <>
            <div className="card">
                <div className="p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Payment Methods</h2>
                        <button onClick={handleAddMethod} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> Add Method</button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">A temporary ₦50 charge will be placed to verify your card.</p>
                    <div className="mt-4 space-y-4">
                        {methods.length > 0 ? methods.map(method => (
                            <div key={method.id} className="p-4 border dark:border-gray-600 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold capitalize">{method.type} **** {method.last4}</p>
                                    <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                                </div>
                                <button onClick={() => openDeleteModal(method)} className="text-red-600 hover:text-red-800" title="Remove method">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-center py-4">No payment methods added.</p>
                        )}
                    </div>
                </div>
            </div>
            
            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteMethod}
                title="Remove Payment Method"
                message={`Are you sure you want to remove the card ending in ${methodToDelete?.last4}?`}
            />
        </>
    );
};

export default PaymentSettings;