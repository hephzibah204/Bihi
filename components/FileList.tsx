import React from 'react';
import { useFilesList, FileRow } from '../hooks/useFilesList';

type Props = {
  tenantId: string;
  linkedType: string;
  linkedId: string;
  categoryFilter?: string | string[];
  title?: string;
  compact?: boolean;
};

const formatBytes = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return '—';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const displayNameFromKey = (key?: string | null) => {
  if (!key) return 'Unknown';
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
};

const isImage = (row: FileRow) => (row.mime_type || '').startsWith('image/');
const isPdf = (row: FileRow) => (row.mime_type || '') === 'application/pdf' || (row.mime_type || '').includes('pdf');

const FileList: React.FC<Props> = ({ tenantId, linkedType, linkedId, categoryFilter, title, compact }) => {
  const { files, loading, error, refresh } = useFilesList({ tenantId, linkedType, linkedId, categoryFilter });

  const openFile = (id: string) => {
    const url = `/api/get-file?fileId=${id}`;
    window.open(url, '_blank');
  };

  return (
    <div className={compact ? '' : 'card'}>
      <div className={compact ? '' : 'p-4'}>
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        {loading && <div className="text-sm text-gray-500 mt-2">Loading files...</div>}
        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
        {!loading && files.length === 0 && (
          <div className="text-sm text-gray-500 mt-2">No files uploaded yet.</div>
        )}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map(f => (
            <div key={f.id} className="border rounded p-2 flex items-center gap-3">
              {isImage(f) ? (
                <img src={`/api/get-file?fileId=${f.id}`} alt={displayNameFromKey(f.r2_key)} className="w-12 h-12 object-cover rounded" />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded">
                  <span className="text-xs">{isPdf(f) ? 'PDF' : 'FILE'}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{displayNameFromKey(f.r2_key)}</div>
                <div className="text-xs text-gray-500">{f.mime_type || 'unknown'} • {formatBytes(f.size_bytes)} • {f.created_at ? new Date(f.created_at).toLocaleString() : ''}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => openFile(f.id)}>View / Download</button>
            </div>
          ))}
        </div>
        {!loading && files.length > 0 && (
          <div className="mt-3">
            <button className="btn btn-outline btn-sm" onClick={refresh}>Refresh</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileList;

