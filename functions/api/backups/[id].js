// functions/api/backups/[id].js
import { handleCors } from '../../_lib/cors';
import { requireSuperAdmin } from '../../_lib/auth';

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
  return await fetch(url, { headers });
}

async function deleteFromStorage(env, path) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
  };
  const url = `${SUPABASE_URL}/storage/v1/object/backups/${encodeURI(path)}`;
  return await fetch(url, { method: 'DELETE', headers });
}

async function deleteBackupRecord(env, id) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/backup_records?id=eq.${id}`, { method: 'DELETE', headers });
  if (!res.ok) throw new Error(`Delete record failed: ${await res.text()}`);
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'GET, DELETE, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requireSuperAdmin(request, env);
  if (!auth.ok) return auth.res;

  const id = params?.id;
  if (!id) {
    const res = new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  try {
    if (request.method === 'GET') {
      const record = await getBackupRecord(env, id);
      if (!record?.storage_path) {
        const res = new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
      const fileRes = await downloadFromStorage(env, record.storage_path);
      if (!fileRes.ok) {
        const res = new Response(JSON.stringify({ error: 'Download failed' }), { status: 500 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
      const headers = new Headers(fileRes.headers);
      headers.set('Content-Type', 'application/zip');
      headers.set('Content-Disposition', `attachment; filename=backup-${id}.zip`);
      Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));
      return new Response(fileRes.body, { status: 200, headers });
    }
    if (request.method === 'DELETE') {
      const record = await getBackupRecord(env, id);
      if (record?.storage_path) {
        await deleteFromStorage(env, record.storage_path);
      }
      await deleteBackupRecord(env, id);
      const res = new Response(JSON.stringify({ ok: true }), { status: 200 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
    const res = new Response('Method Not Allowed', { status: 405 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}