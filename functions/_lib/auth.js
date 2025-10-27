// functions/_lib/auth.js

export async function requireSuperAdmin(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        ok: false,
        res: new Response(JSON.stringify({ error: 'Unauthorized: Missing token' }), { status: 401 })
      };
    }
    const token = authHeader.split(' ')[1];
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = env || {};
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return {
        ok: false,
        res: new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 })
      };
    }

    const ures = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY }
    });
    if (!ures.ok) {
      return { ok: false, res: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) };
    }
    const user = await ures.json();
    const role = user?.user_metadata?.platform_role || user?.user_metadata?.role;
    if (role !== 'Super Admin') {
      return { ok: false, res: new Response(JSON.stringify({ error: 'Forbidden: Super Admin required' }), { status: 403 }) };
    }
    return { ok: true, user };
  } catch (err) {
    return { ok: false, res: new Response(JSON.stringify({ error: 'Auth error', details: err.message }), { status: 500 }) };
  }
}