import React, { useState } from 'react';
import { appToast, ConfirmDialog } from '../../../shared/components';
import { downloadPaperExamPdf, previewPaperExamPdf } from '../api/paperExamApi';
import { useDeletePaperExam } from '../hooks/useAdminPaperExams';
import type { PaperExamListItem } from '../types';
import PaperExamPdfPreviewModal from './PaperExamPdfPreviewModal';
import { downloadBlob } from '../../../shared/lib/downloadBlob';
import { extractBlobErrorMessage } from '../../../shared/lib/blobApiError';

interface PaperExamListTableProps {
  items: PaperExamListItem[];
  onViewDetail: (id: number) => void;
  onViewAnswers: (id: number) => void;
  onDeleted?: () => Promise<void> | void;
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleString('vi-VN');
};

const PaperExamListTable: React.FC<PaperExamListTableProps> = ({ items, onViewDetail, onViewAnswers, onDeleted }) => {
  const { loading: deleting, remove } = useDeletePaperExam(onDeleted);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  const handlePreviewPdf = async (id: number) => {
    try {
      setPreviewOpen(true);
      setPreviewBlob(null);
      setPreviewError(null);
      setPreviewLoading(true);
      const { blob } = await previewPaperExamPdf(id);
      setPreviewBlob(blob);
    } catch (error) {
      const message = await extractBlobErrorMessage(error, 'Không thể preview PDF.');
      setPreviewError(message);
      appToast.error(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadPdf = async (id: number) => {
    try {
      const { blob, meta } = await downloadPaperExamPdf(id);
      downloadBlob({ blob, fileName: meta.fileName ?? `paper-exam-${id}.pdf` });
    } catch (error) {
      const message = await extractBlobErrorMessage(error, 'Không thể tải file PDF.');
      appToast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const ok = await remove(deleteTarget.id);
    if (ok) {
      appToast.success('Đã xóa đề giấy thành công.');
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Tiêu đề</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Môn học</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Thời lượng</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Số câu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Người tạo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Tạo lúc</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{exam.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{exam.subjectName ?? '--'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{exam.durationMinutes} phút</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{exam.totalQuestions}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{exam.createdByName ?? '--'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{formatDateTime(exam.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => onViewDetail(exam.id)} className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-100">Chi tiết</button>
                      <button type="button" onClick={() => handlePreviewPdf(exam.id)} className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-100">Preview PDF</button>
                      <button type="button" onClick={() => handleDownloadPdf(exam.id)} className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-100">Tải PDF</button>
                      <button type="button" onClick={() => onViewAnswers(exam.id)} className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-100">Đáp án</button>
                      <button type="button" disabled={deleting} onClick={() => setDeleteTarget({ id: exam.id, title: exam.title })} className="rounded-lg border border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60">Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PaperExamPdfPreviewModal
        open={previewOpen}
        blob={previewBlob}
        loading={previewLoading}
        error={previewError}
        title="Preview đề giấy"
        onClose={() => {
          setPreviewOpen(false);
          setPreviewBlob(null);
          setPreviewError(null);
          setPreviewLoading(false);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa đề giấy"
        description={deleteTarget ? `Bạn có chắc muốn xóa đề giấy \"${deleteTarget.title}\" không?` : ''}
        confirmText="Xóa"
        cancelText="Hủy"
        danger
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default PaperExamListTable;
