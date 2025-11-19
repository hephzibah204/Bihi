import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

interface AdminProfileData {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    timezone?: string;
    language?: string;
    two_factor_enabled?: boolean;
    email_notifications?: boolean;
    created_at?: string;
    last_login?: string;
}

const AdminProfile = () => {
    const [profile, setProfile] = useState<AdminProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setError(null);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Get additional profile data from profiles table
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                throw profileError;
            }

            setProfile({
                id: user.id,
                email: user.email || '',
                full_name: profileData?.full_name || user.user_metadata?.full_name || '',
                avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url || '',
                phone: profileData?.phone || user.user_metadata?.phone || '',
                timezone: profileData?.timezone || 'UTC',
                language: profileData?.language || 'en',
                two_factor_enabled: profileData?.two_factor_enabled || false,
                email_notifications: profileData?.email_notifications !== false,
                created_at: user.created_at,
                last_login: user.last_sign_in_at
            });
        } catch (e: any) {
            setError(e?.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<AdminProfileData>) => {
        if (!profile) return;
        
        setSaving(true);
        try {
            setError(null);

            // Update auth metadata if needed
            const authUpdates: any = {};
            if (updates.full_name !== undefined) authUpdates.full_name = updates.full_name;
            if (updates.avatar_url !== undefined) authUpdates.avatar_url = updates.avatar_url;
            if (updates.phone !== undefined) authUpdates.phone = updates.phone;

            if (Object.keys(authUpdates).length > 0) {
                const { error: authError } = await supabase.auth.updateUser({
                    data: authUpdates
                });
                if (authError) throw authError;
            }

            // Update profile table (exclude fields not present in schema like full_name)
            const profileUpdates: any = { ...updates };
            delete profileUpdates.full_name;
            delete profileUpdates.avatar_url;
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: profile.id,
                    ...profileUpdates,
                    updated_at: new Date().toISOString()
                });

            if (profileError) throw profileError;

            setProfile(prev => prev ? { ...prev, ...updates } : null);
            window.dispatchEvent(new CustomEvent('show-global-success', { 
                detail: { message: 'Profile updated successfully' } 
            }));
        } catch (e: any) {
            setError(e?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setSaving(true);
        try {
            setError(null);
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });
            if (error) throw error;

            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            window.dispatchEvent(new CustomEvent('show-global-success', { 
                detail: { message: 'Password updated successfully' } 
            }));
        } catch (e: any) {
            setError(e?.message || 'Failed to update password');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: keyof AdminProfileData, value: any) => {
        if (!profile) return;
        setProfile(prev => prev ? { ...prev, [field]: value } : null);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
                    <h1 className="text-2xl font-bold mb-2">Admin Profile</h1>
                    <p className="text-blue-100">Manage your personal account settings</p>
                </div>
                <div className="text-center py-8">Loading profile...</div>
            </div>
        );
    }

    const TabButton = ({ view, children }: { view: string; children: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`px-4 py-2 font-semibold ${
                activeTab === view 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-slate-500 hover:text-slate-700'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-white">
                                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'A'}
                            </span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Admin Profile</h1>
                        <p className="text-blue-100">{profile?.full_name || profile?.email}</p>
                        <p className="text-blue-200 text-sm">Super Administrator</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="border-b border-slate-200 mb-6">
                    <TabButton view="profile">Profile Information</TabButton>
                    <TabButton view="security">Security Settings</TabButton>
                    <TabButton view="preferences">Preferences</TabButton>
                </div>

                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={profile?.full_name || ''}
                                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={profile?.email || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={profile?.phone || ''}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Avatar URL</label>
                                <input
                                    type="url"
                                    value={profile?.avatar_url || ''}
                                    onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                                    placeholder="https://example.com/avatar.jpg"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => updateProfile({
                                    full_name: profile?.full_name,
                                    phone: profile?.phone,
                                    avatar_url: profile?.avatar_url
                                })}
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Change Password</h3>
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={changePassword}
                                    disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {saving ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Two-Factor Authentication</h3>
                            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                                <div>
                                    <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                                    <p className="text-sm text-slate-600">Add an extra layer of security to your account</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={profile?.two_factor_enabled || false}
                                        onChange={(e) => updateProfile({ two_factor_enabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-600">Account Created:</span>
                                    <span className="ml-2 font-medium">
                                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-600">Last Login:</span>
                                    <span className="ml-2 font-medium">
                                        {profile?.last_login ? new Date(profile.last_login).toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'preferences' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
                                <select
                                    value={profile?.timezone || 'UTC'}
                                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">Eastern Time</option>
                                    <option value="America/Chicago">Central Time</option>
                                    <option value="America/Denver">Mountain Time</option>
                                    <option value="America/Los_Angeles">Pacific Time</option>
                                    <option value="Europe/London">London</option>
                                    <option value="Europe/Paris">Paris</option>
                                    <option value="Asia/Tokyo">Tokyo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                                <select
                                    value={profile?.language || 'en'}
                                    onChange={(e) => handleInputChange('language', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="en">English</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                    <option value="de">German</option>
                                    <option value="it">Italian</option>
                                    <option value="pt">Portuguese</option>
                                </select>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Notification Preferences</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-900">Email Notifications</p>
                                        <p className="text-sm text-slate-600">Receive system alerts and updates via email</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={profile?.email_notifications !== false}
                                            onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => updateProfile({
                                    timezone: profile?.timezone,
                                    language: profile?.language,
                                    email_notifications: profile?.email_notifications
                                })}
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProfile;
