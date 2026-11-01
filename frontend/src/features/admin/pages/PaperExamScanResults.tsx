import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PaperExamScanHistoryTable from '../components/PaperExamScanHistoryTable';
import { useAdminPaperExamDetail, useAdminPaperExamScanResults } from '../hooks/useAdminPaperExams';

const PaperExamScanResults: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const examId = id ? Number(id) : null;
  const isValidId = examId !== null && Number.isFinite(examId) && examId > 0;

  const { paperExam, loading: paperExamLoading, error: paperExamError } = useAdminPaperExamDetail(isValidId ? examId : null);
  const { scanResults, loading, error, refetch } = useAdminPaperExamScanResults(isValidId ? examId : null);

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
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lịch sử scan đề giấy</h1>
          <p className="mt-1 text-sm text-slate-500">Xem lại toàn bộ các lần chấm bài bằng ảnh của đề giấy này.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/admin/paper-exams/${examId}`)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Quay lại chi tiết
          </button>
          <button
            type="button"
            onClick={() => navigate(`/admin/paper-exams/${examId}/scan`)}
            className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            Chấm bằng ảnh
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/paper-exams')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Danh sách đề giấy
          </button>
        </div>
      </div>

      {paperExamLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Đang tải thông tin đề giấy...</div>
      ) : paperExamError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-rose-700">{paperExamError}</p>
        </div>
      ) : paperExam ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Thông tin đề giấy</h2>
            <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
              <p><span className="font-medium text-slate-500">Tiêu đề:</span> {paperExam.title}</p>
              <p><span className="font-medium text-slate-500">Môn học:</span> {paperExam.subjectName ?? '--'}</p>
              <p><span className="font-medium text-slate-500">Tổng số câu:</span> {paperExam.totalQuestions}</p>
              <p><span className="font-medium text-slate-500">Thời lượng:</span> {paperExam.durationMinutes} phút</p>
            </div>
          </div>

          <PaperExamScanHistoryTable
            paperExamId={examId}
            scanResults={scanResults}
            loading={loading}
            error={error}
            onRetry={refetch}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Không tìm thấy đề giấy.</div>
      )}
    </div>
  );
};

export default PaperExamScanResults;
