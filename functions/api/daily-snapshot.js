import { handleCors } from '../_lib/cors';
import { requireSuperAdmin, requirePlatformRoles } from '../_lib/auth';

async function fetchRows(env, table, filters = [], select = null) {
  // Security: Require explicit column selection, no broad SELECT *
  if (!select || select.trim() === '*') {
    throw new Error('Explicit column selection required for security reasons');
  }
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Accept': 'application/json'
  };
  const limit = 10000;
  let offset = 0;
  let all = [];
  while (true) {
    const params = new URLSearchParams();
    params.set('select', select);
    for (const [k, v] of filters) params.set(`${k}=eq.${v}`);
    params.set('limit', String(limit));
    params.set('offset', String(offset));
    const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(await res.text());
    const batch = await res.json();
    all = all.concat(batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return all;
}

function currency(n) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₦${Math.round(n).toLocaleString()}`;
  }
}

function computeFinanceMetrics(invoices) {
  const totalBilled = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
  const outstanding = invoices.reduce((sum, i) => sum + Math.max(0, (i.totalAmount || 0) - (i.amountPaid || 0)), 0);
  const paidCount = invoices.filter(i => i.status === 'paid').length;
  const unpaidCount = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue' || i.status === 'partially-paid').length;
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const collectionRate = totalBilled > 0 ? +(100 * (totalPaid / totalBilled)).toFixed(1) : 0;
  return {
    totalBilled,
    totalPaid,
    outstanding,
    paidCount,
    unpaidCount,
    overdueCount,
    collectionRate,
    display: {
      totalBilled: currency(totalBilled),
      totalPaid: currency(totalPaid),
      outstanding: currency(outstanding)
    }
  };
}

function computeAttendanceMetrics(records, days = 30) {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = records.filter(r => {
    const ts = Date.parse(r.date || r.created_at || '');
    return isFinite(ts) && ts >= since;
  });
  let present = 0;
  let total = 0;
  for (const r of recent) {
    const statuses = r.statuses || {};
    for (const k of Object.keys(statuses)) {
      total += 1;
      if (String(statuses[k]).toLowerCase() === 'present') present += 1;
    }
  }
  const rate = total > 0 ? +(100 * (present / total)).toFixed(1) : 0;
  return { windowDays: days, samples: recent.length, presentCount: present, totalCount: total, attendanceRate: rate };
}

async function snapshotTenant(env, tenantId) {
  const settings = await fetchRows(env, 'settings', [['tenant_id', tenantId]], 'id,schoolName,session,term,gradingSystem,maxCa1,maxCa2,maxExam,reportCardSettings').catch(() => []);
  const current = settings[0] || {};
  const invoices = await fetchRows(env, 'invoices', [['tenant_id', tenantId]], 'id,totalAmount,amountPaid,status,createdAt,dueDate').catch(() => []);
  const attendance = await fetchRows(env, 'attendance', [['tenant_id', tenantId]], 'id,studentId,date,status,classId').catch(() => []);
  const finance = computeFinanceMetrics(invoices);
  const att = computeAttendanceMetrics(attendance, 30);
  const alerts = [];
  if (finance.collectionRate < 65 && finance.totalBilled > 0) alerts.push({ type: 'finance', severity: 'warn', message: 'Low collection rate', value: finance.collectionRate });
  if (att.attendanceRate < 75 && att.totalCount > 0) alerts.push({ type: 'attendance', severity: 'warn', message: 'Low attendance rate', value: att.attendanceRate });
  return {
    tenant_id: tenantId,
    session: current.session || current.currentSession || null,
    term: current.term || current.currentTerm || null,
    finance,
    attendance: att,
    alerts
  };
}

async function notifyAlerts(env, tenantId, alerts) {
  if (!alerts || !alerts.length) return;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json'
  };
  const content = alerts.map(a => `${a.type}: ${a.message} (${a.value}%)`).join('; ');
  const payload = { tenant_id: tenantId, type: 'admin_alert', channel: 'system', content, recipients: [], sentAt: new Date().toISOString() };
  await fetch(`${SUPABASE_URL}/rest/v1/communication_logs`, { method: 'POST', headers, body: JSON.stringify(payload) }).catch(() => {});
}

async function authorize(context) {
  const { request, env } = context;
  const secretHeader = request.headers.get('X-Cron-Secret');
  if (secretHeader && env?.ADMIN_CRON_SECRET && secretHeader === env.ADMIN_CRON_SECRET) return { ok: true, role: 'cron' };
  const admin = await requireSuperAdmin(request, env);
  if (admin.ok) return { ok: true, role: 'superadmin', user: admin.user };
  const roles = await requirePlatformRoles(request, env, ['Tenant Admin']);
  if (roles.ok) return { ok: true, role: 'tenantadmin', user: roles.user };
  return { ok: false, res: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) };
}

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request);
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await authorize(context);
  if (!auth.ok) return auth.res;

  try {
    const url = new URL(request.url);
    const singleTenant = url.searchParams.get('tenant') || url.searchParams.get('id') || null;
    let res;
    if (request.method === 'GET') {
      if (singleTenant) {
        const snap = await snapshotTenant(env, singleTenant);
        res = new Response(JSON.stringify(snap), { status: 200 });
      } else {
        const tenants = await fetchRows(env, 'tenants', [], 'id,name,slug,subdomain,subscriptionStatus,trialEndDate,planId').catch(() => []);
        const out = [];
        for (const t of tenants) {
          const id = String(t.id || t.slug || t.subdomain || '').trim();
          if (!id) continue;
          const snap = await snapshotTenant(env, id);
          out.push(snap);
        }
        res = new Response(JSON.stringify({ tenants: out }), { status: 200 });
      }
    } else if (request.method === 'POST') {
      if (singleTenant) {
        const snap = await snapshotTenant(env, singleTenant);
        await notifyAlerts(env, singleTenant, snap.alerts);
        res = new Response(JSON.stringify(snap), { status: 201 });
      } else {
        const tenants = await fetchRows(env, 'tenants', [], 'id,name,slug,subdomain,subscriptionStatus,trialEndDate,planId').catch(() => []);
        const out = [];
        for (const t of tenants) {
          const id = String(t.id || t.slug || t.subdomain || '').trim();
          if (!id) continue;
          const snap = await snapshotTenant(env, id);
          await notifyAlerts(env, id, snap.alerts);
          out.push(snap);
        }
        res = new Response(JSON.stringify({ tenants: out }), { status: 201 });
      }
    } else {
      res = new Response('Method Not Allowed', { status: 405 });
    }
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}

