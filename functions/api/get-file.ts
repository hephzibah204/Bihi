import { createClient } from '@supabase/supabase-js';
import { requirePlatformRoles } from '../_lib/auth.js';

type R2Bucket = {
  get: (key: string) => Promise<any>;
};

export async function onRequestGet(context: any): Promise<Response> {
  const { request, env } = context;
  const auth = await requirePlatformRoles(request, env, ['Super Admin','Admin','Teacher','Student','Parent']);
  if (!auth.ok) return auth.res;

  const url = new URL(request.url);
  const fileId = url.searchParams.get('fileId');
  if (!fileId) {
    return new Response(JSON.stringify({ error: 'Missing fileId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from('files')
    .select('r2_key, mime_type, tenant_id, linked_id, category')
    .eq('id', fileId)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'File metadata not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userTenant = auth.user?.user_metadata?.tenant_id || auth.user?.user_metadata?.tenantId || null;
  const platformRole = auth.user?.user_metadata?.platform_role || auth.user?.user_metadata?.role;
  const isSuperAdmin = platformRole === 'Super Admin';
  if (!isSuperAdmin && data.tenant_id && userTenant && data.tenant_id !== userTenant) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const bucket = env.R2_BUCKET as R2Bucket;
  const object = await bucket.get(data.r2_key);
  if (!object || !object.body) {
    return new Response(JSON.stringify({ error: 'File not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(object.body, {
    status: 200,
    headers: {
      'Content-Type': data.mime_type || 'application/octet-stream',
    },
  });
}
