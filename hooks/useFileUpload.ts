import { useCallback, useState } from 'react';
import { getTenantId } from '../services/api';

export type LinkedType = 'student' | 'invoice' | 'cbt_exam' | 'school' | string;
export type FileCategory = 'student_photo' | 'report_card_pdf' | 'invoice_attachment' | 'cbt_media' | 'school_logo' | string;

export interface UseFileUploadOptions {
  tenantId?: string;
  linkedType: LinkedType;
  linkedId: string;
  category: FileCategory;
  onUploadStart?: () => void;
  onUploadSuccess?: (fileId: string) => void;
  onUploadError?: (error: any) => void;
}

export const useFileUpload = (opts: UseFileUploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    if (!file) return;
    const tenantId = opts.tenantId || getTenantId() || '';
    if (!tenantId) {
      const e = new Error('Missing tenantId');
      setError(e.message);
      opts.onUploadError?.(e);
      try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Upload Failed', message: 'Tenant not detected' } })); } catch {}
      return;
    }
    setError(null);
    setUploading(true);
    opts.onUploadStart?.();
    try {
      const params = new URLSearchParams({ tenantId, linkedType: opts.linkedType, linkedId: String(opts.linkedId), category: opts.category });
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/upload-file?${params.toString()}`, { method: 'POST', body: form });
      if (!res.ok) {
        const text = await res.text();
        const err = new Error(text || `Upload failed (${res.status})`);
        setError(err.message);
        opts.onUploadError?.(err);
        try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Upload Failed', message: err.message } })); } catch {}
        return;
      }
      const json = await res.json() as { fileId: string; key: string };
      opts.onUploadSuccess?.(json.fileId);
      try { window.dispatchEvent(new CustomEvent('show-global-success', { detail: { title: 'Uploaded', message: 'File uploaded successfully' } })); } catch {}
      return json;
    } catch (e: any) {
      setError(e?.message || 'Upload error');
      opts.onUploadError?.(e);
      try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Upload Error', message: e?.message || 'Network error' } })); } catch {}
    } finally {
      setUploading(false);
    }
  }, [opts]);

  return { uploading, error, upload };
};

