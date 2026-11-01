import React from 'react';
import { ImagePlaceholder } from './ImagePlaceholder';

export interface FileUploadProps {
  label?: string;
  accept?: string;
  previewUrl?: string;
  error?: string;
  onChange: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, accept, previewUrl, error, onChange }) => {
  return (
    <div>
      {label ? <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label> : null}
      <div className="flex items-start gap-4">
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="h-24 w-24 rounded-xl object-cover" />
        ) : (
          <ImagePlaceholder className="h-24 w-24" />
        )}
        <div className="flex-1">
          <input type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
          {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
