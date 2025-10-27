import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { BroadcastNotification } from '../types/platform';

const STORAGE_KEY = 'dismissedBroadcasts';

const nowIso = () => new Date().toISOString();

const isTimeActive = (n: BroadcastNotification, now: Date) => {
  const start = n.startAt ? new Date(n.startAt) : null;
  const end = n.endAt ? new Date(n.endAt) : null;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
};

const matchesAudience = (n: BroadcastNotification, role: string | null, tenant: string | null) => {
  // Roles: missing or including 'all' means everyone
  const roleOk = !n.roles || n.roles.includes('all') || (!!role && n.roles.includes(role));
  // Tenants: missing or including 'all' means all tenants
  const tenantOk = !n.tenants || n.tenants.includes('all') || (!!tenant && n.tenants.includes(tenant));
  return roleOk && tenantOk;
};

const getDismissed = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setDismissed = (map: Record<string, string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
};

export type ActiveBroadcast = BroadcastNotification & { dismissed?: boolean };

export const useBroadcastNotifications = () => {
  const { platformSettings, role, subdomain } = useAuth();
  const [active, setActive] = useState<ActiveBroadcast[]>([]);
  const [sessionSeen, setSessionSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    const all: BroadcastNotification[] = (platformSettings?.notifications || []) as BroadcastNotification[];
    const now = new Date();
    const dismissedMap = getDismissed();

    const filtered = all
      .filter(n => isTimeActive(n, now))
      .filter(n => matchesAudience(n, role, subdomain))
      .map(n => ({ ...n, dismissed: !!dismissedMap[n.id] }));

    setActive(filtered);
  }, [platformSettings, role, subdomain]);

  const dismiss = (id: string) => {
    const map = getDismissed();
    map[id] = nowIso();
    setDismissed(map);
    setActive(prev => prev.map(n => (n.id === id ? { ...n, dismissed: true } : n)));
  };

  const visibleBanners = useMemo(() => active.filter(n => n.channel === 'banner' && !n.dismissed), [active]);
  const visibleToasts = useMemo(() => active.filter(n => n.channel === 'toast' && !n.dismissed), [active]);
  const visibleModals = useMemo(() => active.filter(n => n.channel === 'modal' && !n.dismissed), [active]);

  const dispatchToast = (n: ActiveBroadcast) => {
    const eventName = n.type === 'error' ? 'show-global-error' : 'show-global-success';
    // CTA resolution: prefer role-specific CTA when available
    const roleCta = n.ctaByRole && role ? n.ctaByRole[role] : undefined;
    const actionText = roleCta?.text || n.ctaText;
    const actionUrl = roleCta?.url || n.ctaUrl;
    const payload = { detail: { message: n.message, title: n.title, actionText, actionUrl } };
    window.dispatchEvent(new CustomEvent(eventName, payload));
  };

  const dispatchAllToasts = () => {
    visibleToasts.forEach(n => {
      dispatchToast(n);
      recordImpression(n.id);
    });
  };

  // Analytics
  const getAnalytics = (): Record<string, { impressions: number; dismissals: number; lastShownIso?: string }> => {
    try {
      const raw = localStorage.getItem('broadcastAnalytics');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  };
  const setAnalytics = (m: Record<string, { impressions: number; dismissals: number; lastShownIso?: string }>) => {
    try { localStorage.setItem('broadcastAnalytics', JSON.stringify(m)); } catch {}
  };
  const recordImpression = (id: string) => {
    if (sessionSeen.has(id)) return; // avoid double count per view session
    setSessionSeen(prev => new Set(prev).add(id));
    const m = getAnalytics();
    const cur = m[id] || { impressions: 0, dismissals: 0 };
    cur.impressions += 1;
    cur.lastShownIso = nowIso();
    m[id] = cur;
    setAnalytics(m);
  };
  const recordDismiss = (id: string) => {
    const m = getAnalytics();
    const cur = m[id] || { impressions: 0, dismissals: 0 };
    cur.dismissals += 1;
    m[id] = cur;
    setAnalytics(m);
  };

  const passesRepeatRule = (n: BroadcastNotification) => {
    const repeat = n.repeat || 'always';
    const m = getAnalytics();
    const last = m[n.id]?.lastShownIso ? new Date(m[n.id].lastShownIso!) : null;
    if (!last) return true;
    const now = new Date();
    if (repeat === 'always') return true;
    if (repeat === 'once') return false;
    if (repeat === 'daily') {
      return now.toDateString() !== last.toDateString();
    }
    if (repeat === 'weekly') {
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      return now.getTime() - last.getTime() >= oneWeekMs;
    }
    return true;
  };

  // Include repeat rule in filtering
  useEffect(() => {
    const all: BroadcastNotification[] = (platformSettings?.notifications || []) as BroadcastNotification[];
    const now = new Date();
    const dismissedMap = getDismissed();

    const filtered = all
      .filter(n => isTimeActive(n, now))
      .filter(n => matchesAudience(n, role, subdomain))
      .filter(n => passesRepeatRule(n))
      .map(n => ({ ...n, dismissed: !!dismissedMap[n.id] }));

    setActive(filtered);
  }, [platformSettings, role, subdomain]);

  const dismissWithAnalytics = (id: string) => { recordDismiss(id); dismiss(id); };

  return { active, visibleBanners, visibleToasts, visibleModals, dismiss: dismissWithAnalytics, dispatchToast, dispatchAllToasts, recordImpression };
};