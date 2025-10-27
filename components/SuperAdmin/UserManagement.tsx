import React, { useEffect, useMemo, useState } from 'react';
import { apiGetPlatformUsers, apiSavePlatformUsers, apiCreatePlatformUser, apiDeletePlatformUser, apiGetRolePermissions, apiSaveRolePermissions } from '../../services/api';
import { PERMISSION_DEFS, DEFAULT_ROLE_PRESETS } from '../../utils/permissions';
import type { PlatformUser, UserRole } from '../../types';

const ROLES: UserRole[] = ['Super Admin', 'Admin', 'Editor', 'Author', 'Content Manager', 'Moderator', 'Support', 'Teacher', 'Student', 'Parent', 'Bursar'];

const isValidEmail = (email: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);

const emptyUser: PlatformUser = { id: '', email: '', role: 'Admin', lastLogin: '' };

const UserManagement = () => {
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [draft, setDraft] = useState<PlatformUser>(emptyUser);
    const [newName, setNewName] = useState<string>('');
    const [showAdd, setShowAdd] = useState(false);
    const [rolePerms, setRolePerms] = useState<Record<string, Record<string, boolean>>>({});
    const [savingPerms, setSavingPerms] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setError(null);
                const list = await apiGetPlatformUsers();
                setUsers(Array.isArray(list) ? list : []);
                const rp = await apiGetRolePermissions().catch(() => ({}));
                setRolePerms(rp || {});
            } catch (e: any) {
                setError(e?.message || 'Failed to load users');
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter(u =>
            u.email.toLowerCase().includes(q) ||
            (u.role || '').toLowerCase().includes(q)
        );
    }, [users, search]);

    const startAdd = () => {
        setDraft({ ...emptyUser, id: crypto.randomUUID?.() || String(Date.now()) });
        setNewName('');
        setShowAdd(true);
    };

    const cancelAdd = () => {
        setShowAdd(false);
        setDraft(emptyUser);
        setNewName('');
    };

    const addUser = async () => {
        if (!isValidEmail(draft.email)) {
            setError('Please enter a valid email');
            return;
        }
        const exists = users.some(u => u.email.toLowerCase() === draft.email.toLowerCase());
        if (exists) {
            setError('A user with this email already exists');
            return;
        }
        try {
            setSaving(true);
            const result = await apiCreatePlatformUser({ email: draft.email, role: draft.role, name: newName || undefined });
            const created = result?.user;
            if (created) {
                setUsers(prev => [...prev, created]);
                // Copy temp password to clipboard if present, without showing
                if (result?.tempPassword) {
                    try { await navigator.clipboard.writeText(result.tempPassword); } catch (err) { console.warn('Clipboard copy failed', err); }
                    window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'User created. Temporary password copied to clipboard.' } }));
                } else {
                    window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'User created.' } }));
                }
            }
            setShowAdd(false);
            setDraft(emptyUser);
            setNewName('');
        } catch (e: any) {
            setError(e?.message || 'Failed to create user');
        } finally {
            setSaving(false);
        }
    };

    const updateRole = (id: string, role: UserRole) => {
        setUsers(prev => prev.map(u => (u.id === id ? { ...u, role } : u)));
    };

    const removeUser = async (id: string) => {
        if (!window.confirm('Remove this user? This will revoke their access.')) return;
        try {
            setSaving(true);
            await apiDeletePlatformUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
            window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'User removed' } }));
        } catch (e: any) {
            setError(e?.message || 'Failed to remove user');
        } finally {
            setSaving(false);
        }
    };

    const save = async () => {
        try {
            setSaving(true);
            setError(null);
            await apiSavePlatformUsers(users);
        } catch (e: any) {
            setError(e?.message || 'Failed to save users');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">User Management</h1>
                <p className="opacity-80">Manage platform users, roles, and permissions</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by email or role"
                            className="w-64 px-3 py-2 border rounded-lg text-slate-700"
                        />
                        <button
                            onClick={startAdd}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            + Add User
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={save}
                            disabled={saving}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 px-4 py-2 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>
                )}

                {loading ? (
                    <div className="text-slate-500">Loading users...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-600 border-b">
                                    <th className="py-2 pr-4">Email</th>
                                    <th className="py-2 pr-4">Role</th>
                                    <th className="py-2 pr-4">Last Login</th>
                                    <th className="py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => (
                                    <tr key={u.id} className="border-b">
                                        <td className="py-2 pr-4 font-medium text-slate-900">{u.email}</td>
                                        <td className="py-2 pr-4">
                                            <select
                                                value={u.role}
                                                onChange={e => updateRole(u.id, e.target.value as UserRole)}
                                                className="px-3 py-2 border rounded-lg"
                                            >
                                                {ROLES.map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-2 pr-4 text-slate-600">{u.lastLogin || '—'}</td>
                                        <td className="py-2">
                                            <button
                                                onClick={() => removeUser(u.id)}
                                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="text-center text-slate-500 py-8">No users found</div>
                        )}
                    </div>
                )}
            </div>

            {showAdd && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New User</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            value={draft.email}
                            onChange={e => setDraft({ ...draft, email: e.target.value })}
                            placeholder="Email"
                            className="px-3 py-2 border rounded-lg"
                        />
                        <select
                            value={draft.role}
                            onChange={e => setDraft({ ...draft, role: e.target.value as UserRole })}
                            className="px-3 py-2 border rounded-lg"
                        >
                            {ROLES.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Full name (optional)"
                            className="px-3 py-2 border rounded-lg"
                        />
                        <div className="flex items-center gap-3">
                            <button
                                onClick={addUser}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Add
                            </button>
                            <button
                                onClick={cancelAdd}
                                className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Note: This manages platform roles in settings. Creating actual login accounts is handled separately.</p>
                </div>
            )}

            {/* Role Permissions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Role Permissions</h3>
                    <button
                        onClick={async () => {
                            try {
                                setSavingPerms(true);
                                await apiSaveRolePermissions(rolePerms);
                                window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Permissions saved' } }));
                            } catch (e: any) {
                                setError(e?.message || 'Failed to save permissions');
                            } finally {
                                setSavingPerms(false);
                            }
                        }}
                        disabled={savingPerms}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {savingPerms ? 'Saving...' : 'Save Permissions'}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ROLES.map(role => (
                        <div key={role} className="border border-slate-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-slate-900">{role}</div>
                                <div className="space-x-2 text-sm">
                                    <button
                                        className="px-2 py-1 bg-slate-100 rounded hover:bg-slate-200"
                                        onClick={() => {
                                            const preset = DEFAULT_ROLE_PRESETS[role] || {};
                                            setRolePerms(prev => ({ ...prev, [role]: { ...(prev[role] || {}), ...preset } }));
                                        }}
                                    >
                                        Apply preset
                                    </button>
                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Object.values(rolePerms[role] || {}).every(Boolean) && PERMISSION_DEFS.every(p => (rolePerms[role] || {})[p.key])}
                                            onChange={(e) => {
                                                const all = e.target.checked;
                                                setRolePerms(prev => ({
                                                    ...prev,
                                                    [role]: PERMISSION_DEFS.reduce((acc, p) => ({ ...acc, [p.key]: all }), {} as Record<string, boolean>)
                                                }));
                                            }}
                                        />
                                        <span className="text-slate-600">Select all</span>
                                    </label>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {PERMISSION_DEFS.map(p => (
                                    <label key={`${role}_${p.key}`} className="flex items-start gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!(rolePerms[role]?.[p.key])}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setRolePerms(prev => ({
                                                    ...prev,
                                                    [role]: { ...(prev[role] || {}), [p.key]: checked }
                                                }));
                                            }}
                                        />
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">{p.label}</div>
                                            <div className="text-xs text-slate-500">{p.description}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;