// functions/api/restore.js
import JSZip from 'jszip';
import { handleCors } from '../_lib/cors';
import { requireSuperAdmin } from '../_lib/auth';

const SAFE_TABLES = [
  'tenants',
  'teachers',
  'settings',
  'subjects',
  'students',
  'scores',
  'communication_logs'
];

async function getBackupRecord(env, id) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Accept': 'application/json'
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/backup_records?id=eq.${id}&select=*`, { headers });
  if (!res.ok) throw new Error(`Fetch record failed: ${await res.text()}`);
  const arr = await res.json();
  return arr[0] || null;
}

async function downloadFromStorage(env, path) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
  };
  const url = `${SUPABASE_URL}/storage/v1/object/backups/${encodeURI(path)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Download failed: ${await res.text()}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

async function upsertChunk(env, table, rows) {
  if (!rows.length) return { inserted: 0 };
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers, body: JSON.stringify(rows) });
  if (!res.ok && res.status !== 201 && res.status !== 204) {
    throw new Error(`Upsert ${table} failed: ${await res.text()}`);
  }
  return { inserted: rows.length };
}

async function restoreTables(env, files) {
  const summary = {};
  for (const table of SAFE_TABLES) {
    const file = files[`data/${table}.json`];
    if (!file) continue;
    const content = await file.async('string');
    let rows = [];
    try { rows = JSON.parse(content); } catch { rows = []; }
    const chunkSize = 500;
    let processed = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await upsertChunk(env, table, chunk);
      processed += chunk.length;
    }
    summary[table] = { restored: processed };
  }
  return summary;
}

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'POST, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requireSuperAdmin(request, env);
  if (!auth.ok) return auth.res;

  try {
    if (request.method !== 'POST') {
      const res = new Response('Method Not Allowed', { status: 405 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const body = await request.json();
    const backupId = body?.backupId;
    if (!backupId) {
      const res = new Response(JSON.stringify({ error: 'backupId is required' }), { status: 400 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const record = await getBackupRecord(env, backupId);
    if (!record?.storage_path) {
      const res = new Response(JSON.stringify({ error: 'Backup not found' }), { status: 404 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
    const zipBytes = await downloadFromStorage(env, record.storage_path);
    const zip = await JSZip.loadAsync(zipBytes);
    const summary = await restoreTables(env, zip.files);

    const res = new Response(JSON.stringify({ ok: true, summary }), { status: 200 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}