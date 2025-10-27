import React, { useEffect, useMemo, useState } from 'react';
import { apiGetPlatformSettings, apiSavePlatformSettings, apiGetTenants } from '../../services/api';
import { usePlatformPermission } from '../../utils/usePlatformPermission';
import { USER_ROLES } from '../../utils/constants';
import type { BroadcastNotification, BroadcastType, BroadcastChannel, Tenant } from '../../types/platform';
import Modal from '../Modal';

type EditableNotification = BroadcastNotification;

const emptyNotification = (): EditableNotification => ({
  id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
  title: '',
  message: '',
  type: 'info',
  channel: 'banner',
  roles: ['all'],
  tenants: ['all'],
  startAt: new Date().toISOString(),
  endAt: undefined,
  dismissible: true,
});

const typeOptions: BroadcastType[] = ['info', 'success', 'warning', 'error'];
const channelOptions: BroadcastChannel[] = ['banner', 'toast', 'modal'];
const roleOptions: string[] = Object.values(USER_ROLES);

const NotificationForm: React.FC<{
  value: EditableNotification;
  onChange: (n: EditableNotification) => void;
  tenantsList: Tenant[];
}> = ({ value, onChange, tenantsList }) => {
  const update = (patch: Partial<EditableNotification>) => onChange({ ...value, ...patch });

  const startLocal = useMemo(() => (value.startAt ? new Date(value.startAt) : new Date()), [value.startAt]);
  const endLocal = useMemo(() => (value.endAt ? new Date(value.endAt) : undefined), [value.endAt]);

  const toLocalInput = (d?: Date) => d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16) : '';

  const onRoleToggle = (role: string) => {
    const current = new Set(value.roles || []);
    if (current.has('all') && role !== 'all') current.delete('all');
    if (current.has(role)) current.delete(role); else current.add(role);
    const next = Array.from(current);
    if (next.length === 0) next.push('all');
    update({ roles: next });
  };

  const onAllRoles = () => update({ roles: ['all'] });

  // Tenant autocomplete state
  const [tenantQuery, setTenantQuery] = useState('');
  const suggestions = useMemo(() => {
    const q = tenantQuery.trim().toLowerCase();
    if (!q) return [] as Tenant[];
    return (tenantsList || []).filter(t =>
      t.id.toLowerCase().includes(q) || (t.name || '').toLowerCase().includes(q)
    ).slice(0, 6);
  }, [tenantQuery, tenantsList]);

  const addTenant = (tenantId: string) => {
    const set = new Set(value.tenants || []);
    if (set.has('all')) set.delete('all');
    set.add(tenantId);
    update({ tenants: Array.from(set) });
    setTenantQuery('');
  };
  const removeTenant = (tenantId: string) => {
    const set = new Set(value.tenants || []);
    set.delete(tenantId);
    const next = Array.from(set);
    update({ tenants: next.length ? next : ['all'] });
  };
  const setAllTenants = () => update({ tenants: ['all'] });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Title</label>
        <input className="form-input mt-1 w-full" value={value.title} onChange={e => update({ title: e.target.value })} placeholder="Announcement title" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Message</label>
        <textarea className="form-textarea mt-1 w-full" rows={4} value={value.message} onChange={e => update({ message: e.target.value })} placeholder="Message content" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Type</label>
          <select className="form-select mt-1 w-full" value={value.type} onChange={e => update({ type: e.target.value as BroadcastType })}>
            {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Channel</label>
          <select className="form-select mt-1 w-full" value={value.channel} onChange={e => update({ channel: e.target.value as BroadcastChannel })}>
            {channelOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Audience Roles</label>
        <div className="flex flex-wrap gap-2 mt-2">
          <button type="button" className={`btn ${value.roles?.includes('all') ? 'btn-primary' : 'btn-ghost'}`} onClick={onAllRoles}>All</button>
          {roleOptions.map(r => (
            <button key={r} type="button" className={`btn ${value.roles?.includes(r) ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onRoleToggle(r)}>{r}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Tenants (subdomains)</label>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <button type="button" className={`btn ${value.tenants?.includes('all') ? 'btn-primary' : 'btn-ghost'}`} onClick={setAllTenants}>All tenants</button>
          {(value.tenants || []).filter(t => t !== 'all').map(t => (
            <span key={t} className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs">
              {t}
              <button type="button" className="ml-2" onClick={() => removeTenant(t)}>×</button>
            </span>
          ))}
        </div>
        <div className="relative mt-2">
          <input className="form-input w-full" placeholder="Type subdomain or school name" value={tenantQuery} onChange={e => setTenantQuery(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter' && tenantQuery.trim()) addTenant(tenantQuery.trim());
          }} />
          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-48 overflow-auto">
              {suggestions.map(s => (
                <button key={s.id} type="button" className="w-full text-left px-3 py-2 hover:bg-slate-50" onClick={() => addTenant(s.id)}>
                  <div className="font-medium">{s.id}</div>
                  <div className="text-xs text-slate-500">{s.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Start At</label>
          <input type="datetime-local" className="form-input mt-1 w-full" value={toLocalInput(startLocal)} onChange={e => {
            const dt = new Date(e.target.value);
            update({ startAt: dt.toISOString() });
          }} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">End At</label>
          <input type="datetime-local" className="form-input mt-1 w-full" value={toLocalInput(endLocal)} onChange={e => {
            const val = e.target.value;
            update({ endAt: val ? new Date(val).toISOString() : undefined });
          }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">CTA Text</label>
          <input className="form-input mt-1 w-full" value={value.ctaText || ''} onChange={e => update({ ctaText: e.target.value })} placeholder="e.g., View details" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">CTA URL</label>
          <input className="form-input mt-1 w-full" value={value.ctaUrl || ''} onChange={e => update({ ctaUrl: e.target.value })} placeholder="https://portal/link" />
        </div>
      </div>
      {/* Advanced per-role CTAs */}
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-slate-700">Advanced: Per-role CTAs</summary>
        <div className="mt-2 border rounded p-3 space-y-3">
          <p className="text-xs text-slate-600">Override CTA text/URL for specific roles. Leave blank to use the global CTA above.</p>
          {roleOptions.map(r => {
            const current = (value.ctaByRole || {})[r];
            const textVal = current?.text || '';
            const urlVal = current?.url || '';
            const setRoleCta = (patch: { text?: string; url?: string }) => {
              const next = { ...(value.ctaByRole || {}) };
              const merged = { text: patch.text ?? textVal, url: patch.url ?? urlVal };
              if (!merged.text && !merged.url) {
                delete next[r];
              } else {
                next[r] = merged;
              }
              update({ ctaByRole: next });
            };
            const clearRoleCta = () => {
              const next = { ...(value.ctaByRole || {}) };
              delete next[r];
              update({ ctaByRole: next });
            };
            return (
              <div key={r} className="grid grid-cols-5 gap-2 items-end">
                <label className="col-span-5 text-xs font-medium text-slate-700">{r}</label>
                <input className="form-input col-span-2" placeholder="CTA text" value={textVal} onChange={e => setRoleCta({ text: e.target.value })} />
                <input className="form-input col-span-3" placeholder="CTA URL" value={urlVal} onChange={e => setRoleCta({ url: e.target.value })} />
                <div className="col-span-5">
                  <button type="button" className="btn btn-ghost text-xs" onClick={clearRoleCta}>Clear override</button>
                </div>
              </div>
            );
          })}
        </div>
      </details>
      <div>
        <label className="block text-sm font-medium text-slate-700">Repeat Behavior</label>
        <select className="form-select mt-1 w-full" value={value.repeat || 'always'} onChange={e => update({ repeat: e.target.value as any })}>
          {['always','once','daily','weekly'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <p className="text-xs text-slate-500 mt-1">Controls how often users see this notification. "once" shows only once per user; "daily" and "weekly" are based on last impression.</p>
      </div>
      <div className="flex items-center gap-2">
        <input id="dismissible" type="checkbox" className="form-checkbox" checked={value.dismissible !== false} onChange={e => update({ dismissible: e.target.checked })} />
        <label htmlFor="dismissible" className="text-sm text-slate-700">Dismissible</label>
      </div>
    </div>
  );
};

const NotificationCenter: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [notifications, setNotifications] = useState<EditableNotification[]>([]);
  const [editing, setEditing] = useState<EditableNotification | null>(null);
  const [editingPreviewRole, setEditingPreviewRole] = useState<string>('Admin');
  const [editingPreviewTenant, setEditingPreviewTenant] = useState<string>('all');
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, { impressions: number; dismissals: number; lastShownIso?: string }>>({});
  const [previewing, setPreviewing] = useState<{ item: EditableNotification | null; role: string; tenant: string } | null>(null);
  const { can } = usePlatformPermission();

  useEffect(() => {
    const load = async () => {
      try {
        const [s, tenants] = await Promise.all([apiGetPlatformSettings(), apiGetTenants()]);
        setSettings(s);
        setNotifications((s?.notifications || []) as EditableNotification[]);
        setTenantsList(tenants as Tenant[]);
        // Load local analytics
        try {
          const raw = localStorage.getItem('broadcastAnalytics');
          setAnalytics(raw ? JSON.parse(raw) : {});
        } catch { setAnalytics({}); }
      } catch (e) {
        window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: 'Failed to load notifications.' } }));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveAll = async (next: EditableNotification[]) => {
    try {
      const merged = { ...(settings || {}), notifications: next };
      await apiSavePlatformSettings(merged);
      setSettings(merged);
      setNotifications(next);
      window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Notifications saved.' } }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: 'Failed to save notifications.' } }));
    }
  };

  const onCreate = () => { if (!can('send_broadcasts')) return; setEditing(emptyNotification()); };
  const onEdit = (n: EditableNotification) => { if (!can('send_broadcasts')) return; setEditing({ ...n }); };
  const onDelete = async (id: string) => { if (!can('send_broadcasts')) return;
    if (!confirm('Delete this notification?')) return;
    const next = notifications.filter(n => n.id !== id);
    await saveAll(next);
  };
  const onBroadcastNow = async (id: string) => { if (!can('send_broadcasts')) return;
    const next = notifications.map(n => n.id === id ? { ...n, startAt: new Date().toISOString() } : n);
    await saveAll(next);
  };

  const onSaveEditing = async () => { if (!can('send_broadcasts')) return;
    if (!editing) return;
    if (!editing.title?.trim() || !editing.message?.trim()) {
      window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: 'Title and message are required.' } }));
      return;
    }
    const exists = notifications.some(n => n.id === editing.id);
    const next = exists ? notifications.map(n => n.id === editing.id ? editing : n) : [editing, ...notifications];
    await saveAll(next);
    setEditing(null);
  };

  const onCancelEditing = () => setEditing(null);

  const refreshAnalytics = () => {
    try {
      const raw = localStorage.getItem('broadcastAnalytics');
      setAnalytics(raw ? JSON.parse(raw) : {});
    } catch { setAnalytics({}); }
  };
  const resetAnalytics = (id?: string) => {
    try {
      if (!id) {
        localStorage.removeItem('broadcastAnalytics');
        setAnalytics({});
      } else {
        const raw = localStorage.getItem('broadcastAnalytics');
        const map = raw ? JSON.parse(raw) : {};
        delete map[id];
        localStorage.setItem('broadcastAnalytics', JSON.stringify(map));
        setAnalytics(map);
      }
    } catch { /* noop */ }
  };

  const resolveCta = (n: EditableNotification, role: string) => {
    const roleCta = n.ctaByRole && role ? n.ctaByRole[role] : undefined;
    const actionText = roleCta?.text || n.ctaText;
    const actionUrl = roleCta?.url || n.ctaUrl;
    return { actionText, actionUrl };
  };

  const onPreview = (n: EditableNotification) => {
    setPreviewing({ item: n, role: roleOptions[0] || 'Admin', tenant: 'all' });
  };
  const closePreview = () => setPreviewing(null);
  const triggerToastPreview = () => {
    if (!previewing?.item) return;
    const n = previewing.item;
    const type = n.type === 'error' ? 'show-global-error' : 'show-global-success';
    const { actionText, actionUrl } = resolveCta(n, previewing.role);
    window.dispatchEvent(new CustomEvent(type, { detail: { message: n.message, title: n.title, actionText, actionUrl } }));
  };

  if (loading) return <div className="card p-6">Loading Notification Center...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">Notification Center</h1>
        <p className="opacity-80">Create, schedule, and broadcast notifications across roles and tenants.</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900">Scheduled & Active Notifications</h2>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={refreshAnalytics}>Refresh Analytics</button>
          <button className="btn btn-ghost" onClick={() => resetAnalytics()}>Reset All Analytics</button>
          <button className={`btn ${can('send_broadcasts') ? 'btn-primary' : 'btn-disabled'}`} disabled={!can('send_broadcasts')} onClick={onCreate}>New Notification</button>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 && (
          <div className="card p-6 text-center text-slate-600">No notifications yet. Click "New Notification" to add one.</div>
        )}
        {notifications.map(n => (
          <div key={n.id} className="card p-4 border border-slate-200 rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-slate-900">{n.title} <span className="ml-2 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">{n.type} / {n.channel}</span></div>
                <div className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{n.message}</div>
                {(n.ctaText || n.ctaUrl) && (
                  <div className="mt-2 text-xs text-slate-600">CTA: {n.ctaText || '—'} → {n.ctaUrl || '—'}</div>
                )}
                <div className="mt-2 text-xs text-slate-500">Roles: {(n.roles || ['all']).join(', ')} | Tenants: {(n.tenants || ['all']).join(', ')}</div>
                <div className="mt-1 text-xs text-slate-500">Start: {n.startAt ? new Date(n.startAt).toLocaleString() : '—'} | End: {n.endAt ? new Date(n.endAt).toLocaleString() : '—'}</div>
                <div className="mt-1 text-xs text-slate-500">Repeat: {n.repeat || 'always'} | Dismissible: {n.dismissible !== false ? 'yes' : 'no'}</div>
                <div className="mt-2 text-xs text-slate-700">
                  <span className="inline-block mr-2">Impressions: {analytics[n.id]?.impressions || 0}</span>
                  <span className="inline-block mr-2">Dismissals: {analytics[n.id]?.dismissals || 0}</span>
                  <span className="inline-block">Last shown: {analytics[n.id]?.lastShownIso ? new Date(analytics[n.id]!.lastShownIso!).toLocaleString() : '—'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className={`btn btn-ghost ${!can('send_broadcasts') ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!can('send_broadcasts')} onClick={() => onEdit(n)}>Edit</button>
                <button className={`btn btn-ghost ${!can('send_broadcasts') ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!can('send_broadcasts')} onClick={() => onBroadcastNow(n.id)}>Broadcast Now</button>
                <button className="btn btn-secondary" onClick={() => onPreview(n)}>Preview</button>
                <button className="btn btn-ghost" onClick={() => resetAnalytics(n.id)}>Reset Analytics</button>
                <button className={`btn btn-danger ${!can('send_broadcasts') ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!can('send_broadcasts')} onClick={() => onDelete(n.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{notifications.some(n => n.id === editing.id) ? 'Edit Notification' : 'New Notification'}</h3>
            <NotificationForm value={editing} onChange={setEditing} tenantsList={tenantsList} />
            {/* Inline Preview inside editor */}
            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Preview (Role/Tenant)</h4>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Role</label>
                  <select className="form-select mt-1 w-full" value={editingPreviewRole} onChange={e => setEditingPreviewRole(e.target.value)}>
                    {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tenant (subdomain)</label>
                  <input className="form-input mt-1 w-full" value={editingPreviewTenant} onChange={e => setEditingPreviewTenant(e.target.value)} placeholder="all or subdomain" />
                </div>
              </div>
              {(() => {
                const n = editing!;
                const { actionText, actionUrl } = resolveCta(n, editingPreviewRole);
                if (n.channel === 'banner') {
                  return (
                    <div className={`border rounded-md px-4 py-2 ${n.type === 'error' ? 'border-red-300 bg-red-50' : n.type === 'warning' ? 'border-amber-300 bg-amber-50' : n.type === 'success' ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="font-semibold">{n.title}</div>
                      <div className="text-sm opacity-90 whitespace-pre-wrap">{n.message}</div>
                      {actionUrl && (
                        <a href={actionUrl} className="underline mt-2 inline-block" target="_blank" rel="noreferrer">{actionText || 'Learn more'}</a>
                      )}
                    </div>
                  );
                }
                if (n.channel === 'toast') {
                  return (
                    <div>
                      <p className="text-sm text-slate-600">Toast preview will show as a floating notification.</p>
                      <button
                        className="btn btn-primary mt-2"
                        onClick={() => {
                          const type = n.type === 'error' ? 'show-global-error' : 'show-global-success';
                          window.dispatchEvent(new CustomEvent(type, { detail: { message: n.message, title: n.title, actionText, actionUrl } }));
                        }}
                      >
                        Trigger Toast Preview
                      </button>
                    </div>
                  );
                }
                // modal channel
                return (
                  <div className="border rounded-md px-4 py-2">
                    <p className="text-sm text-slate-600">This is how the modal content will appear.</p>
                    <div className="mt-3">
                      <div className="font-semibold">{n.title}</div>
                      <div className="text-sm opacity-90 whitespace-pre-wrap">{n.message}</div>
                      {actionUrl && (
                        <a href={actionUrl} className="btn btn-primary mt-4 inline-block" target="_blank" rel="noreferrer">{actionText || 'Open'}</a>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={onCancelEditing}>Cancel</button>
              <button className={`btn ${can('send_broadcasts') ? 'btn-primary' : 'btn-disabled'}`} disabled={!can('send_broadcasts')} onClick={onSaveEditing}>Save</button>
            </div>
          </div>
        </div>
      )}

      {previewing?.item && (
        <Modal isOpen={!!previewing?.item} onClose={closePreview} title={`Preview: ${previewing.item.title}`} size="lg">
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Role</label>
                <select className="form-select mt-1 w-full" value={previewing.role} onChange={e => setPreviewing(prev => prev ? { ...prev, role: e.target.value } : prev)}>
                  {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Tenant (subdomain)</label>
                <input className="form-input mt-1 w-full" value={previewing.tenant} onChange={e => setPreviewing(prev => prev ? { ...prev, tenant: e.target.value } : prev)} placeholder="all or subdomain" />
              </div>
            </div>

            {(() => {
              const n = previewing.item!;
              const { actionText, actionUrl } = resolveCta(n, previewing.role);
              if (n.channel === 'banner') {
                return (
                  <div className={`border rounded-md px-4 py-2 ${n.type === 'error' ? 'border-red-300 bg-red-50' : n.type === 'warning' ? 'border-amber-300 bg-amber-50' : n.type === 'success' ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="font-semibold">{n.title}</div>
                    <div className="text-sm opacity-90 whitespace-pre-wrap">{n.message}</div>
                    {actionUrl && (
                      <a href={actionUrl} className="underline mt-2 inline-block">{actionText || 'Learn more'}</a>
                    )}
                  </div>
                );
              }
              if (n.channel === 'toast') {
                return (
                  <div>
                    <p className="text-sm text-slate-600">Toast preview will show as a floating notification.</p>
                    <button className="btn btn-primary mt-2" onClick={triggerToastPreview}>Trigger Toast Preview</button>
                  </div>
                );
              }
              // modal channel
              return (
                <div className="border rounded-md px-4 py-2">
                  <p className="text-sm text-slate-600">This is how the modal content will appear.</p>
                  <div className="mt-3">
                    <div className="font-semibold">{n.title}</div>
                    <div className="text-sm opacity-90 whitespace-pre-wrap">{n.message}</div>
                    {actionUrl && (
                      <a href={actionUrl} className="btn btn-primary mt-4 inline-block">{actionText || 'Open'}</a>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={closePreview}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NotificationCenter;