// functions/api/platform-users.js
import { handleCors } from '../_lib/cors';
import { requireSuperAdmin } from '../_lib/auth';

const jsonHeaders = (env) => ({
  'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type': 'application/json'
});

async function getPlatformSettings(env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/platform_settings?select=data&id=eq.1`, {
    headers: { ...jsonHeaders(env), Accept: 'application/vnd.pgrst.object+json' }
  });
  if (res.status === 406) return {}; // none yet
  if (!res.ok) throw new Error(await res.text());
  const rec = await res.json();
  return rec?.data || {};
}

async function savePlatformSettings(env, data) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/platform_settings`, {
    method: 'POST',
    headers: { ...jsonHeaders(env), Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: 1, data })
  });
  if (!res.ok) throw new Error(await res.text());
}

function randomPassword(len = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_-+=';
  let out = '';
  crypto.getRandomValues(new Uint32Array(len)).forEach(n => { out += chars[n % chars.length]; });
  return out;
}

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'GET, POST, DELETE, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requireSuperAdmin(request, env);
  if (!auth.ok) return auth.res;

  try {
    if (request.method === 'GET') {
      const settings = await getPlatformSettings(env);
      const list = settings.platform_users || [];
      const res = new Response(JSON.stringify(list), { status: 200 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    if (request.method === 'POST') {
      let payload;
      try { payload = await request.json(); } catch { payload = {}; }
      const { email, role, name, password } = payload || {};
      if (!email || !role) {
        const res = new Response(JSON.stringify({ error: 'email and role are required' }), { status: 400 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }

      const tempPassword = password || randomPassword(16);
      // Create auth user with platform role metadata
      const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: jsonHeaders(env),
        body: JSON.stringify({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { platform_role: role, full_name: name || '', is_platform_user: true }
        })
      });
      const userData = await userRes.json();
      if (!userRes.ok) {
        const res = new Response(JSON.stringify({ error: userData?.msg || 'Failed to create auth user' }), { status: 400 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }

      const settings = await getPlatformSettings(env);
      const current = Array.isArray(settings.platform_users) ? settings.platform_users : [];
      const newUser = { id: userData.id, email, role, lastLogin: '' };
      const next = { ...settings, platform_users: [...current, newUser] };
      await savePlatformSettings(env, next);

      const res = new Response(JSON.stringify({ user: newUser, tempPassword }), { status: 201 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    if (request.method === 'DELETE') {
      let payload;
      try { payload = await request.json(); } catch { payload = {}; }
      const { id } = payload || {};
      if (!id) {
        const res = new Response(JSON.stringify({ error: 'id is required' }), { status: 400 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }

      // Delete auth user
      const delRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: jsonHeaders(env)
      });
      if (!delRes.ok) {
        const res = new Response(JSON.stringify({ error: 'Failed to delete auth user' }), { status: 400 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }

      // Remove from settings
      const settings = await getPlatformSettings(env);
      const list = Array.isArray(settings.platform_users) ? settings.platform_users : [];
      const next = { ...settings, platform_users: list.filter(u => u.id !== id) };
      await savePlatformSettings(env, next);

      const res = new Response(JSON.stringify({ success: true }), { status: 200 });
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
