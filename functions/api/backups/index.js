// functions/api/backups/index.js
import JSZip from 'jszip';
import { handleCors } from '../../_lib/cors';
import { requireSuperAdmin } from '../../_lib/auth';

const SAFE_TABLES = [
  'tenants',
  'teachers',
  'settings',
  'subjects',
  'students',
  'scores',
  'communication_logs'
];

async function listBackups(env) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Accept': 'application/json'
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/backup_records?select=*&order=created_at.desc`, { headers });
  if (!res.ok) throw new Error(`List failed: ${await res.text()}`);
  return await res.json();
}

async function fetchAllRows(env, table) {
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
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Fetch table ${table} failed: ${await res.text()}`);
    const batch = await res.json();
    all = all.concat(batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return all;
}

async function uploadToStorage(env, path, bytes) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/zip',
    'x-upsert': 'true'
  };
  const url = `${SUPABASE_URL}/storage/v1/object/backups/${encodeURI(path)}`;
  const res = await fetch(url, { method: 'POST', headers, body: bytes });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  const size = bytes.byteLength || bytes.length || 0;
  return { size };
}

async function insertBackupRecord(env, record) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json'
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/backup_records`, { method: 'POST', headers, body: JSON.stringify(record) });
  if (!res.ok) throw new Error(`Insert record failed: ${await res.text()}`);
  return await res.json();
}

async function handleGet(request, env) {
  const backups = await listBackups(env);
  return new Response(JSON.stringify(backups), { status: 200 });
}

async function handlePost(request, env, user) {
  const startedAt = new Date().toISOString();
  const zip = new JSZip();
  const meta = { version: 1, started_at: startedAt, created_by: user?.email || 'superadmin', tables: {}, notes: 'MVP database backup' };

  for (const table of SAFE_TABLES) {
    const rows = await fetchAllRows(env, table).catch(() => []);
    meta.tables[table] = { count: rows.length };
    zip.file(`data/${table}.json`, JSON.stringify(rows));
  }
  zip.file('meta.json', JSON.stringify(meta, null, 2));
  const content = await zip.generateAsync({ type: 'uint8array' });

  const id = crypto.randomUUID();
  const storage_path = `${id}.zip`;
  const up = await uploadToStorage(env, storage_path, content);
  const finishedAt = new Date().toISOString();

  const record = {
    id,
    created_at: finishedAt,
    scope: 'platform',
    type: 'database',
    storage_path,
    size_bytes: up.size,
    status: 'completed',
    meta: { ...meta, finished_at: finishedAt }
  };
  await insertBackupRecord(env, record);
  return new Response(JSON.stringify(record), { status: 201 });
}

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request);
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requireSuperAdmin(request, env);
  if (!auth.ok) return auth.res;

  try {
    let res;
    if (request.method === 'GET') {
      res = await handleGet(request, env);
    } else if (request.method === 'POST') {
      res = await handlePost(request, env, auth.user);
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