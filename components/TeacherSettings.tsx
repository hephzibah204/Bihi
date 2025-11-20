import React, { useEffect, useState } from 'react';
import Card from './ui/Card';
import { supabase } from '../services/supabaseClient';

const TeacherSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [compactSidebar, setCompactSidebar] = useState<boolean>(true);
  const [notifyEmail, setNotifyEmail] = useState<boolean>(true);
  const [notifySms, setNotifySms] = useState<boolean>(false);
  const [themeDark, setThemeDark] = useState<boolean>(false);

  useEffect(() => { (async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const meta: any = data?.user?.user_metadata || {};
      setCompactSidebar(Boolean(meta.compact_sidebar));
      setNotifyEmail(meta.notify_email !== false);
      setNotifySms(Boolean(meta.notify_sms));
      setThemeDark(Boolean(meta.prefers_dark));
    } finally { setLoading(false); }
  })(); }, []);

  const save = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ data: {
        compact_sidebar: compactSidebar,
        notify_email: notifyEmail,
        notify_sms: notifySms,
        prefers_dark: themeDark,
      }});
      if (error) throw error;
      if (themeDark) document.body.setAttribute('data-theme','dark'); else document.body.removeAttribute('data-theme');
      window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Settings saved' } }));
    } catch (e:any) {
      window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: e?.message || 'Save failed' } }));
    } finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card header={<div className="text-base font-semibold">Interface</div>}>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={compactSidebar} onChange={e=>setCompactSidebar(e.target.checked)} />
            Compact sidebar
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={themeDark} onChange={e=>setThemeDark(e.target.checked)} />
            Prefer dark theme
          </label>
        </div>
      </Card>
      <Card header={<div className="text-base font-semibold">Notifications</div>}>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={notifyEmail} onChange={e=>setNotifyEmail(e.target.checked)} />
            Email notifications
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={notifySms} onChange={e=>setNotifySms(e.target.checked)} />
            SMS notifications
          </label>
        </div>
      </Card>
      <div className="xl:col-span-2">
        <button className="btn btn-primary" onClick={save} disabled={loading}>Save Changes</button>
      </div>
    </div>
  );
};

export default TeacherSettings;