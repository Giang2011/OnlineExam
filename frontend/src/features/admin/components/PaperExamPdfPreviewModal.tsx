import React, { useEffect, useMemo } from 'react';
import Modal from '../../../shared/components/Modal';

interface PaperExamPdfPreviewModalProps {
  open: boolean;
  blob: Blob | null;
  loading?: boolean;
  title?: string;
  error?: string | null;
  onClose: () => void;
}

const PaperExamPdfPreviewModal: React.FC<PaperExamPdfPreviewModalProps> = ({
  open,
  blob,
  loading = false,
  title = 'Preview PDF',
  error,
  onClose,
}) => {
  const objectUrl = useMemo(() => {
    if (!open || !blob) return null;
    return URL.createObjectURL(blob);
  }, [open, blob]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {loading ? (
        <div className="flex h-[70vh] items-center justify-center text-sm text-slate-500">Đang tải PDF...</div>
      ) : error ? (
        <div className="flex h-[70vh] items-center justify-center text-sm font-medium text-rose-600">{error}</div>
      ) : objectUrl ? (
        <iframe title={title} src={objectUrl} className="h-[70vh] w-full rounded-lg border border-slate-200" />
      ) : (
        <div className="flex h-[70vh] items-center justify-center text-sm text-slate-500">Không có dữ liệu PDF để hiển thị.</div>
      )}
    </Modal>
  );
};

export default PaperExamPdfPreviewModal;
