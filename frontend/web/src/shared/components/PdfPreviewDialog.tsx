import { useEffect, useState } from 'react';
import { apiDownload } from '@/shared/lib/api-client';
import { ApiError } from '@/shared/types/api-error';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/lib/ui/dialog';

interface PdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Đường dẫn API trả về PDF (application/pdf). */
  path: string;
}

/** Xem trước PDF trong modal bằng object URL, có huỷ URL khi đóng. */
export function PdfPreviewDialog({ open, onOpenChange, title, path }: PdfPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {open ? <PdfBody path={path} title={title} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function PdfBody({ path, title }: { path: string; title: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    apiDownload(path)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Không tải được tệp PDF.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (loading) {
    return <p className="p-6 text-sm text-slate">Đang tải tệp PDF…</p>;
  }

  if (error) {
    return (
      <p className="p-6 text-sm text-pen" role="alert">
        {error}
      </p>
    );
  }

  if (!url) return null;

  return (
    <object data={url} type="application/pdf" className="h-[70vh] w-full" aria-label={title}>
      <p className="p-6 text-sm text-slate">
        Trình duyệt không hiển thị được PDF. Hãy tải tệp xuống để xem.
      </p>
    </object>
  );
}
