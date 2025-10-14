import React, { useState, useEffect } from 'react';
import { getCurrentUser, apiGetParents, apiSubmitParentUpdate } from '../services/api';
import { Parent } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';

const ParentProfile = ({ demoUserId }) => {
    const [parent, setParent] = useState<Parent | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const currentUser = await getCurrentUser();
            if (!currentUser) throw new Error("Could not identify current user.");
            
            const allParents = await apiGetParents();
            const currentParent = allParents.find(p => p.id === currentUser.id);
            if (!currentParent) throw new Error("Parent profile not found.");

            setParent(currentParent);
            setFormData({ name: currentParent.name, phone: currentParent.phone || '' });
        } catch (err) {
            setError("Failed to load profile: " + err.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchProfile();
    }, [demoUserId]);

    const handleSave = async () => {
        if (!parent) return;
        setIsSubmitting(true);
        setError('');
        try {
            const changes: Partial<Parent> = {};
            if (formData.name !== parent.name) changes.name = formData.name;
            if (formData.phone !== parent.phone) changes.phone = formData.phone;

            if (Object.keys(changes).length > 0) {
                await apiSubmitParentUpdate(parent.id, changes);
                await fetchProfile(); // Refetch to show pending status
            }
            setIsEditing(false);
        } catch (err) {
            setError("Failed to submit changes: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="card p-6 text-center"><SpinnerIcon className="w-6 h-6 animate-spin mx-auto text-indigo-500" /></div>;
    if (error) return <div className="card p-6 text-center text-red-500">{error}</div>;
    if (!parent) return <div className="card p-6 text-center">Profile not found.</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="card">
                <div className="p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">My Profile</h2>
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="btn btn-secondary">Edit Profile</button>
                        )}
                    </div>

                    {parent.pendingChanges && !isEditing && (
                        <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md text-sm">
                            You have pending changes awaiting administrator approval.
                        </div>
                    )}
                    
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="label">Full Name</label>
                            {isEditing ? (
                                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" />
                            ) : (
                                <p className="font-semibold text-gray-800">{parent.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="label">Email Address (Read-only)</label>
                            <p className="text-gray-500">{parent.email}</p>
                        </div>
                        <div>
                            <label className="label">Phone Number</label>
                             {isEditing ? (
                                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field" />
                            ) : (
                                <p className="font-semibold text-gray-800">{parent.phone || 'Not provided'}</p>
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleSave} className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentProfile;