import React, { useEffect, useState } from 'react';
import Card from './ui/Card';
import { supabase } from '../services/supabaseClient';
import { getCurrentUser } from '../services/api';

const TeacherProfile: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subjects, setSubjects] = useState<string>('');
  const [classAssign, setClassAssign] = useState<string>('');

  useEffect(() => { (async () => {
    setLoading(true);
    try {
      const u:any = await getCurrentUser();
      setName(u?.user_metadata?.full_name || u?.name || '');
      setEmail(u?.email || '');
      setPhone(u?.user_metadata?.phone_number || u?.phone || '');
    } finally { setLoading(false); }
  })(); }, []);

  const save = async () => {
    try {
      setLoading(true);
      const payload:any = { data: { full_name: name, name, phone_number: phone, phone } };
      if (email) payload.email = email;
      const { error } = await supabase.auth.updateUser(payload);
      if (error) throw error;
      try {
        const { data: u } = await supabase.auth.getUser();
        const userId = (u?.user?.id) || null;
        if (userId) {
          await supabase.from('teachers').upsert({ id: userId, name, email, phone, subjects, class_assign: classAssign }, { onConflict: 'id' });
        }
      } catch {}
      window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Profile updated' } }));
    } catch (e:any) {
      window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: e?.message || 'Update failed' } }));
    } finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card header={<div className="text-base font-semibold">My Profile</div>}>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500">Name</div>
              <input className="input-field mt-1" value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Email</div>
              <input className="input-field mt-1" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Phone</div>
              <input className="input-field mt-1" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            <div>
              <button className="btn btn-primary" onClick={save} disabled={loading}>Save Changes</button>
            </div>
          </div>
        )}
      </Card>
      <Card header={<div className="text-base font-semibold">Teaching Details</div>}>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500">Subjects (comma-separated)</div>
            <input className="input-field mt-1" value={subjects} onChange={e=>setSubjects(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-gray-500">Class Assignment</div>
            <input className="input-field mt-1" value={classAssign} onChange={e=>setClassAssign(e.target.value)} />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TeacherProfile;
