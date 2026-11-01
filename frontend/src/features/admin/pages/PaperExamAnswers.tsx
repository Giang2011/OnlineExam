import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PaperExamAnswerViewer from '../components/PaperExamAnswerViewer';
import { useAdminPaperExamAnswers } from '../hooks/useAdminPaperExams';

const PaperExamAnswers: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const examId = id ? Number(id) : null;
  const isValidId = examId !== null && Number.isFinite(examId) && examId > 0;

  const { answers, loading, error, refetch } = useAdminPaperExamAnswers(isValidId ? examId : null);

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Đáp án đề giấy</h1>
          <p className="mt-1 text-sm text-slate-500">Xem chi tiết câu hỏi và đáp án đúng để hỗ trợ chấm bài giấy.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/admin/paper-exams/${examId}`)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Chi tiết đề
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/paper-exams')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Đang tải đáp án đề giấy...</div>
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
      ) : answers ? (
        <>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{answers.title}</h2>
            <p className="mt-1 text-sm text-slate-500">Tổng số câu: {answers.questions.length}</p>
          </div>
          <PaperExamAnswerViewer data={answers} />
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Không tìm thấy dữ liệu đáp án.</div>
      )}
    </div>
  );
};

export default PaperExamAnswers;
