import React from 'react';
import { useNavigate } from 'react-router-dom';
import { appToast } from '../../../shared/components';
import PaperExamListTable from '../components/PaperExamListTable';
import { useAdminPaperExams } from '../hooks/useAdminPaperExams';

const PaperExamManagement: React.FC = () => {
  const navigate = useNavigate();
  const { paperExams, loading, error, refetch } = useAdminPaperExams();

  const handleRefetch = async () => {
    try {
      await refetch();
    } catch {
      appToast.error('Không thể tải lại danh sách đề giấy.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý đề giấy</h1>
          <p className="mt-1 text-sm text-slate-500">Xem danh sách đề giấy và truy cập các thao tác quản trị.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/paper-exams/create')}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Tạo đề giấy
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Đang tải danh sách đề giấy...</div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-rose-700">{error}</p>
          <button
            type="button"
            onClick={handleRefetch}
            className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            Thử lại
          </button>
        </div>
      ) : paperExams.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">Chưa có đề giấy nào. Hãy tạo đề giấy đầu tiên.</p>
          <button
            type="button"
            onClick={() => navigate('/admin/paper-exams/create')}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Tạo đề giấy
          </button>
        </div>
      ) : (
        <PaperExamListTable
          items={paperExams}
          onViewDetail={(id) => navigate(`/admin/paper-exams/${id}`)}
          onViewAnswers={(id) => navigate(`/admin/paper-exams/${id}/answers`)}
          onDeleted={refetch}
        />
      )}
    </div>
  );
};

export default PaperExamManagement;
