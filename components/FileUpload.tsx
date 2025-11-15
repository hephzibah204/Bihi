import React, { useRef, useState } from 'react';
import { useFileUpload } from '../hooks/useFileUpload';

type Props = {
  tenantId: string;
  linkedType: string;
  linkedId: string;
  category: string;
  onUploadStart?: () => void;
  onUploadSuccess?: (fileId: string) => void;
  onUploadError?: (error: any) => void;
  maxSizeMB?: number;
  label?: string;
};

const FileUpload: React.FC<Props> = ({ tenantId, linkedType, linkedId, category, onUploadStart, onUploadSuccess, onUploadError, maxSizeMB = 20, label }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploading, error, upload } = useFileUpload({ tenantId, linkedType, linkedId, category, onUploadStart, onUploadSuccess, onUploadError });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setSelectedFile(f);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    const tooLarge = selectedFile.size > maxSizeMB * 1024 * 1024;
    if (tooLarge) {
      try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'File Too Large', message: `Please select a file under ${maxSizeMB} MB.` } })); } catch {}
      return;
    }
    const res = await upload(selectedFile);
    if (res) {
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="border rounded p-3">
      <div className="flex items-center gap-3">
        <input ref={inputRef} type="file" onChange={handleFileChange} className="input-field" />
        <button type="button" className="btn btn-primary" disabled={uploading || !selectedFile} onClick={handleSubmit}>{uploading ? 'Uploading...' : (label || 'Upload')}</button>
      </div>
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      {!selectedFile && <div className="text-xs text-gray-500 mt-1">Select a file and click Upload.</div>}
    </div>
  );
};

export default FileUpload;

