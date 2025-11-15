import { supabase } from './supabaseClient'
import { getTenantId } from './api'

export const uploadRecording = async (blob: Blob, teacherId: string) => {
  const tenantId = getTenantId() || 'default'
  const ts = Date.now()
  const path = `recordings/${tenantId}/${teacherId}/${ts}.webm`
  const { data, error } = await supabase.storage.from('school-assets').upload(path, blob, {
    upsert: true,
    cacheControl: '3600',
    contentType: 'audio/webm'
  })
  if (error) throw error
  const { data: pub } = supabase.storage.from('school-assets').getPublicUrl(data.path)
  if (!pub?.publicUrl) throw new Error('Failed to publish recording')
  return { url: pub.publicUrl, path: data.path }
}

export const listRecordings = async (teacherId?: string) => {
  const tenantId = getTenantId() || 'default'
  const base = `recordings/${tenantId}`
  const prefix = teacherId ? `${base}/${teacherId}` : base
  const { data, error } = await supabase.storage.from('school-assets').list(prefix, { limit: 100, sortBy: { column: 'name', order: 'desc' } })
  if (error) throw error
  const items = (data || []).filter(d => d.name.endsWith('.webm')).map(d => ({
    name: d.name,
    path: `${prefix}/${d.name}`
  }))
  return items.map(i => {
    const { data: pub } = supabase.storage.from('school-assets').getPublicUrl(i.path)
    return { url: pub.publicUrl, path: i.path, name: i.name }
  })
}
