import React from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudentExams } from '../hooks/useStudentExams';
import { ExamCard } from '../components';

const ExamList: React.FC = () => {
  const navigate = useNavigate();
  const { exams, loading, error, refetch } = useStudentExams();

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'UPCOMING':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Sắp diễn ra</span>;
      case 'ONGOING':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Đang diễn ra</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">Đã kết thúc</span>;
      default:
        return <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">{status || 'Không xác định'}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Danh sách kỳ thi</h1>
          <p className="text-slate-500 mt-2">Tham gia các kỳ thi do giảng viên phân công</p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Tải lại
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-red-700 font-medium">Không thể tải danh sách kỳ thi.</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Không có kỳ thi nào</h3>
          <p className="text-slate-500 mt-1">Hiện chưa có kỳ thi nào được phân cho bạn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} onClick={() => navigate(`/student/exams/${exam.id}`)} className="cursor-pointer">
              <ExamCard exam={exam} statusBadge={getStatusBadge(exam.status)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamList;
