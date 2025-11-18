import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from './ui/Card';
import UserCircleIcon from './icons/UserCircleIcon';
import { apiGetSchoolSettings, getCurrentUser, getTenantId, apiUpsertTeacher } from '../services/api';
import TenantSelector from './TenantSelector';
import { supabase } from '../services/supabaseClient';

const AdminProfile: React.FC = () => {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState(false);
  const [password, setPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [u, s] = await Promise.all([getCurrentUser(), apiGetSchoolSettings()]);
        setProfile(u || user);
        setSchool(s || null);
        const initialName = (u as any)?.name || (u as any)?.fullName || (u as any)?.user_metadata?.full_name || '';
        const initialEmail = (u as any)?.email || '';
        const initialPhone = (u as any)?.phone || (u as any)?.phoneNumber || (u as any)?.user_metadata?.phone_number || '';
        setEditName(initialName);
        setEditEmail(initialEmail);
        setEditPhone(initialPhone);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Card header={<div className="text-base font-semibold">Admin Profile</div>}>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center text-[#1D4ED8]">
                <UserCircleIcon className="w-8 h-8" />
              </div>
              <div>
                <div className="text-lg font-semibold">{profile?.name || profile?.fullName || 'Admin'}</div>
                <div className="text-sm text-gray-500">{profile?.email || '-'}</div>
                <div className="text-xs text-gray-500">Role: {role || 'Admin'}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Phone</div>
                <div className="text-sm">{profile?.phone || profile?.phoneNumber || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Class/Dept</div>
                <div className="text-sm">{profile?.classTeacherOf || '-'}</div>
              </div>
            </div>
          </div>
        )}
      </Card>
      <Card header={<div className="text-base font-semibold">Profile Details</div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="tile-sub">Name</label>
            <input className="input-field mt-1" value={editName} onChange={e => setEditName(e.target.value)} />
          </div>
          <div>
            <label className="tile-sub">Email</label>
            <input className="input-field mt-1" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
          </div>
          <div>
            <label className="tile-sub">Phone</label>
            <input className="input-field mt-1" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <button className="btn btn-primary" onClick={async () => {
            try {
              setChanging(true);
              const payload: any = { data: { full_name: editName, name: editName, phone_number: editPhone, phone: editPhone } };
              if (editEmail && editEmail !== ((profile as any)?.email || '')) payload.email = editEmail;
              const { error } = await supabase.auth.updateUser(payload);
              if (error) throw error;
              try {
                if ((profile as any)?.id || (profile as any)?.email) {
                  await apiUpsertTeacher({ id: (profile as any)?.id, email: editEmail || (profile as any)?.email, name: editName, role: (profile as any)?.role });
                }
              } catch {}
              window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Profile updated' } }));
            } catch (e: any) {
              window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: e?.message || 'Update failed' } }));
            } finally {
              setChanging(false);
            }
          }}>Save Changes</button>
        </div>
      </Card>
      <Card header={<div className="text-base font-semibold">School</div>}>
        {school ? (
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500">Name</div>
              <div className="text-sm">{school?.schoolName || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Session</div>
              <div className="text-sm">{school?.session || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Term</div>
              <div className="text-sm">{school?.term || '-'}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No school settings found.</div>
        )}
      </Card>
      <Card header={<div className="text-base font-semibold">Avatar</div>}>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {/* In a full app, load avatar_url from user metadata */}
              <UserCircleIcon className="w-8 h-8 text-[#1D4ED8]" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="text-sm" />
            <button className="btn btn-primary" onClick={async () => {
              if (!fileInputRef.current || !fileInputRef.current.files?.[0]) return;
              const file = fileInputRef.current.files[0];
              try {
                const tenant = getTenantId() || 'default';
                const uid = String(profile?.id || (user as any)?.id || 'unknown');
                const cleanName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
                const path = `avatars/${tenant}/${uid}_${Date.now()}_${cleanName}`;
                const { data, error } = await supabase.storage.from('school-assets').upload(path, file, { upsert: true, cacheControl: '3600' });
                if (error) throw error;
                const pub = supabase.storage.from('school-assets').getPublicUrl(data.path);
                const url = pub?.data?.publicUrl;
                if (url) {
                  await supabase.auth.updateUser({ data: { avatar_url: url } });
                  window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Avatar updated' } }));
                }
              } catch (e: any) {
                window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: e?.message || 'Avatar upload failed' } }));
              }
            }}>Upload</button>
          </div>
        </div>
      </Card>
      <Card header={<div className="text-base font-semibold">Change Password</div>}>
        <div className="space-y-3">
          <input type="password" className="input-field" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn btn-primary" disabled={changing || !password.trim()} onClick={async () => {
            try { setChanging(true); await supabase.auth.updateUser({ password }); window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Password updated' } })); setPassword(''); } catch (e: any) { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: e?.message || 'Password update failed' } })); } finally { setChanging(false); }
          }}>Update Password</button>
        </div>
      </Card>
      <Card header={<div className="text-base font-semibold">Switch School Portal</div>}>
        <TenantSelector />
      </Card>
    </div>
  );
};

export default AdminProfile;
