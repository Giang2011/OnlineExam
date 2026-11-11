import { useState } from 'react';
import { ImageOff, Paperclip, X } from 'lucide-react';
import { Button } from '@/lib/ui/button';
import { resolveUploadUrl } from '@/shared/lib/upload-url';
import { cn } from '@/shared/utils/cn';

interface ImagePickerProps {
  label: string;
  /** URL ảnh hiện tại (nếu đang sửa). */
  currentUrl?: string | null;
  file: File | null;
  removed: boolean;
  onFileChange: (file: File | null) => void;
  onRemovedChange: (removed: boolean) => void;
  accept?: string;
}

/** Chọn ảnh + hiển thị preview + cờ xoá ảnh cũ. */
export function ImagePicker({
  label,
  currentUrl,
  file,
  removed,
  onFileChange,
  onRemovedChange,
  accept = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
}: ImagePickerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const preview = file ? previewUrl : removed ? null : resolveUploadUrl(currentUrl);

  const handleFile = (nextFile: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
    onFileChange(nextFile);
    if (nextFile) onRemovedChange(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink">{label}</p>

      {preview ? (
        <div className="flex items-start gap-3">
          <img
            src={preview}
            alt={`Xem trước ${label.toLowerCase()}`}
            className="h-28 w-28 rounded-md border border-rule bg-paper object-contain"
          />
          <div className="flex flex-col gap-1.5">
            {file ? (
              <Button type="button" variant="outline" size="sm" onClick={() => handleFile(null)}>
                <X className="size-4" aria-hidden="true" />
                Bỏ ảnh đã chọn
              </Button>
            ) : currentUrl && !removed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemovedChange(true)}
              >
                <ImageOff className="size-4" aria-hidden="true" />
                Xoá ảnh hiện tại
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {removed ? (
        <p className="text-xs text-pen">Ảnh hiện tại sẽ bị xoá khi lưu.</p>
      ) : null}

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-rule bg-paper-raised px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-paper-sunken focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-chalk">
        <Paperclip className="size-4" aria-hidden="true" />
        {file || preview ? 'Chọn ảnh khác' : 'Chọn ảnh'}
        <input
          type="file"
          accept={accept}
          className={cn('sr-only')}
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <p className="text-xs text-slate">JPEG, PNG, GIF, WebP hoặc SVG. Tối đa 10MB mỗi ảnh.</p>
    </div>
  );
}
