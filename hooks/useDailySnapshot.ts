import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSubdomain } from '../utils/subdomain';

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function useDailySnapshot() {
  const { session } = useAuth();

  useEffect(() => {
    const run = async () => {
      const tenant = getSubdomain();
      if (!tenant || tenant === 'admin') return;
      const key = `dailySnapshot:${tenant}`;
      const last = localStorage.getItem(key);
      const today = todayKey();
      if (last === today) return;
      const url = `/api/daily-snapshot?tenant=${encodeURIComponent(tenant)}`;
      const headers = { 'Content-Type': 'application/json' } as Record<string, string>;
      const token = session?.access_token || session?.accessToken || null;
      if (token) headers['Authorization'] = `Bearer ${token}`;
      try {
        await fetch(url, { method: 'POST', headers });
        localStorage.setItem(key, today);
      } catch {}
    };
    run();
  }, [session]);
}