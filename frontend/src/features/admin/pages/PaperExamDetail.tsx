import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PaperExamDetailPanel from '../components/PaperExamDetailPanel';
import PaperExamPdfPreviewModal from '../components/PaperExamPdfPreviewModal';
import PaperExamScanHistoryTable from '../components/PaperExamScanHistoryTable';
import { useAdminPaperExamDetail, useDeletePaperExam, useAdminPaperExamScanResults } from '../hooks/useAdminPaperExams';
import { appToast, ConfirmDialog } from '../../../shared/components';
import { downloadPaperExamPdf, previewPaperExamPdf } from '../api/paperExamApi';
import { downloadBlob } from '../../../shared/lib/downloadBlob';
import { extractBlobErrorMessage } from '../../../shared/lib/blobApiError';

const PaperExamDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const examId = id ? Number(id) : null;
  const isValidId = examId !== null && Number.isFinite(examId) && examId > 0;

  const { paperExam, loading, error, refetch } = useAdminPaperExamDetail(isValidId ? examId : null);
  const { scanResults, loading: scanResultsLoading, error: scanResultsError, refetch: refetchScanResults } =
    useAdminPaperExamScanResults(isValidId ? examId : null);
  const { loading: deleting, remove } = useDeletePaperExam(async () => {
    navigate('/admin/paper-exams');
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handlePreviewPdf = async () => {
    if (!isValidId) return;

    try {
      setPreviewOpen(true);
      setPreviewBlob(null);
      setPreviewError(null);
      setPreviewLoading(true);
      const { blob } = await previewPaperExamPdf(examId);
      setPreviewBlob(blob);
    } catch (err) {
      const message = await extractBlobErrorMessage(err, 'Không thể preview PDF.');
      setPreviewError(message);
      appToast.error(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!isValidId) return;

    try {
      const { blob, meta } = await downloadPaperExamPdf(examId);
      downloadBlob({ blob, fileName: meta.fileName ?? `paper-exam-${examId}.pdf` });
    } catch (err) {
      const message = await extractBlobErrorMessage(err, 'Không thể tải file PDF.');
      appToast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!isValidId) return;

    const ok = await remove(examId);
    if (ok) {
      appToast.success('Đã xóa đề giấy thành công.');
    }
  };

  if (!isValidId) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-rose-700">ID đề giấy không hợp lệ.</p>
        <button
          type="button"
          onClick={() => navigate('/admin/paper-exams')}
          className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          Quay về danh sách
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chi tiết đề giấy</h1>
            <p className="mt-1 text-sm text-slate-500">Xem thông tin chi tiết và thao tác với đề giấy.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/admin/paper-exams')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Quay lại</button>
            <button type="button" onClick={handlePreviewPdf} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Preview PDF</button>
            <button type="button" onClick={handleDownloadPdf} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Tải PDF</button>
            <button type="button" onClick={() => navigate(`/admin/paper-exams/${examId}/answers`)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Đáp án</button>
            <button type="button" onClick={() => navigate(`/admin/paper-exams/${examId}/scan`)} className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">Chấm bằng ảnh</button>
            <button type="button" onClick={() => navigate(`/admin/paper-exams/${examId}/scan-results`)} className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50">Xem lịch sử scan</button>
            <button type="button" disabled={deleting} onClick={() => setConfirmDeleteOpen(true)} className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60">Xóa</button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Đang tải chi tiết đề giấy...</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
            >
              Thử lại
            </button>
          </div>
        ) : paperExam ? (
          <div className="space-y-6">
            <PaperExamDetailPanel paperExam={paperExam} />

            <PaperExamScanHistoryTable
              paperExamId={examId}
              scanResults={scanResults}
              loading={scanResultsLoading}
              error={scanResultsError}
              onRetry={refetchScanResults}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Không tìm thấy đề giấy.</div>
        )}
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
        open={confirmDeleteOpen}
        title="Xóa đề giấy"
        description={paperExam ? `Bạn có chắc muốn xóa đề giấy \"${paperExam.title}\" không?` : 'Bạn có chắc muốn xóa đề giấy này không?'}
        confirmText="Xóa"
        cancelText="Hủy"
        danger
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
};

export default PaperExamDetail;
