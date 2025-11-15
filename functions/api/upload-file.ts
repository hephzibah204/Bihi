import { createClient } from '@supabase/supabase-js';

type R2Bucket = {
  put: (key: string, value: ArrayBuffer | ReadableStream | string, options?: any) => Promise<any>;
  get: (key: string) => Promise<any>;
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context;

  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenantId');
  const linkedType = url.searchParams.get('linkedType');
  const linkedId = url.searchParams.get('linkedId');
  const category = url.searchParams.get('category');

  if (!tenantId) return json(400, { error: 'Missing tenantId' });
  if (!linkedType) return json(400, { error: 'Missing linkedType' });
  if (!linkedId) return json(400, { error: 'Missing linkedId' });
  if (!category) return json(400, { error: 'Missing category' });

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    return json(400, { error: 'Content-Type must be multipart/form-data' });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return json(400, { error: 'Missing file field' });
  }

  const f = file as File;
  const originalName = (f as any).name || 'upload.bin';
  const safeName = String(originalName).replace(/\s+/g, '-');
  const key = `tenants/${tenantId}/${linkedType}/${linkedId}/${category}/${crypto.randomUUID()}-${safeName}`;

  const bucket = env.R2_BUCKET as R2Bucket;
  const arrayBuffer = await f.arrayBuffer();

  await bucket.put(key, arrayBuffer, {
    httpMetadata: { contentType: f.type || 'application/octet-stream' },
  });

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from('files')
    .insert({
      tenant_id: tenantId,
      linked_type: linkedType,
      linked_id: linkedId,
      r2_key: key,
      category,
      mime_type: f.type || null,
      size_bytes: arrayBuffer.byteLength,
    })
    .select('id, r2_key')
    .single();

  if (error || !data) {
    console.error('Supabase insert error', error);
    return json(500, { error: 'Failed to record file metadata' });
  }

  if (linkedType === 'student' && category === 'student_photo') {
    try {
      await supabase
        .from('students')
        .update({ photo_url: key })
        .eq('id', linkedId)
        .eq('tenant_id', tenantId);
    } catch (e) {
      console.error('Supabase student photo update error', e);
    }
  }

  return json(200, { fileId: data.id, key: data.r2_key });
}

