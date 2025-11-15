import { useEffect, useMemo, useState } from 'react';
import { initSupabase, getSupabase } from '../services/supabaseClient';

export interface FileRow {
  id: string;
  tenant_id: string;
  student_id?: string | null;
  owner_user_id?: string | null;
  r2_key: string;
  linked_type?: string | null;
  linked_id?: string | null;
  category?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  created_at?: string | null;
}

export interface UseFilesListOptions {
  tenantId: string;
  linkedType: string;
  linkedId: string;
  categoryFilter?: string | string[];
}

export const useFilesList = (opts: UseFilesListOptions) => {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categorySet = useMemo(() => {
    if (!opts.categoryFilter) return null;
    return Array.isArray(opts.categoryFilter) ? new Set(opts.categoryFilter) : new Set([opts.categoryFilter]);
  }, [opts.categoryFilter]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      await initSupabase();
      const supabase = getSupabase();
      let q = supabase
        .from('files')
        .select('*')
        .eq('tenant_id', opts.tenantId)
        .eq('linked_type', opts.linkedType)
        .eq('linked_id', String(opts.linkedId))
        .order('created_at', { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      let rows = (data || []) as FileRow[];
      if (categorySet) {
        rows = rows.filter(r => r.category && categorySet.has(r.category));
      }
      setFiles(rows);
    } catch (e: any) {
      setError(e?.message || 'Failed to load files');
      try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Files Load Error', message: e?.message || 'Failed to load files' } })); } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, [opts.tenantId, opts.linkedType, opts.linkedId, opts.categoryFilter]);

  return { files, loading, error, refresh: fetchFiles };
};

