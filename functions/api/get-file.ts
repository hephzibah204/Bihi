import { createClient } from '@supabase/supabase-js';

type R2Bucket = {
  get: (key: string) => Promise<any>;
};

export async function onRequestGet(context: any): Promise<Response> {
  const { request, env } = context;

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
    .select('r2_key, mime_type, tenant_id, linked_type, linked_id, category')
    .eq('id', fileId)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'File metadata not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
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

