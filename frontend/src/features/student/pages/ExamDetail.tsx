import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { BookOpen, Calendar, Clock } from 'lucide-react';
import { ExamActionBar, ExamRulesPanel } from '../components';
import { useExamDetail } from '../hooks/useExamDetail';
import { useStartExamSession } from '../hooks/useStartExamSession';

const ExamDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const examId = Number(id);
  const { exam, loading, error, notFound, refetch } = useExamDetail(examId);
  const { startSession, starting, error: startError } = useStartExamSession();

  const handleStartExam = async () => {
    if (!exam) {
      return;
    }

    if (exam.status !== 'ONGOING') {
      toast.error('Kỳ thi chưa mở hoặc đã kết thúc.');
      return;
    }

    const confirmStart = await Swal.fire({
      title: 'Bắt đầu làm bài',
      text: 'Thời gian làm bài sẽ được tính ngay sau khi bắt đầu. Bạn đã sẵn sàng?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Bắt đầu',
      cancelButtonText: 'Hủy',
    });

    if (!confirmStart.isConfirmed) {
      return;
    }

    const session = await startSession(exam.id);
    if (!session) {
      toast.error(startError || 'Không thể bắt đầu kỳ thi ngay lúc này.');
      return;
    }

    const calculatedEndMs = Date.now() + exam.duration * 60 * 1000;
    const calculatedEndTime = new Date(calculatedEndMs).toISOString();
    localStorage.setItem(`exam_end_${session.id}`, calculatedEndTime);

    navigate(`/student/sessions/${session.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (notFound) {
    return <div className="text-center p-8 text-slate-500">Không tìm thấy thông tin kỳ thi.</div>;
  }

  if (!exam) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 font-medium">Không thể tải chi tiết kỳ thi.</p>
        <p className="text-slate-500 mt-1">{error || 'Vui lòng thử lại sau.'}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Tải lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 px-8 py-10 text-white text-center pb-16">
          <div className="inline-flex py-1 px-3 rounded-full bg-white/20 text-white text-xs font-semibold mb-4 backdrop-blur-sm">
            {exam.subjectName}
          </div>
          <h1 className="text-4xl font-bold mb-4">{exam.title}</h1>
          <p className="text-indigo-100 max-w-2xl mx-auto opacity-90">
            Hãy chuẩn bị môi trường yên tĩnh, kết nối mạng ổn định trước khi bắt đầu bài thi.
          </p>
        </div>

        <div className="px-8 pb-10 relative mt-[-2rem]">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 flex flex-col md:flex-row gap-8 justify-between relative z-10">
            <div className="grid grid-cols-2 gap-6 flex-1">
              <div className="flex items-start">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mr-4"><Clock size={24} /></div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Thời gian</p>
                  <p className="text-lg font-bold text-slate-800">{exam.duration} phút</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl mr-4"><BookOpen size={24} /></div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Số lượng</p>
                  <p className="text-lg font-bold text-slate-800">{exam.totalQuestions} câu hỏi</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mr-4"><Calendar size={24} /></div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Trạng thái</p>
                  <p className="text-lg font-bold text-emerald-600">{exam.status}</p>
                </div>
              </div>
            </div>

            <ExamActionBar canStart={exam.status === 'ONGOING'} starting={starting} onStart={handleStartExam} />
          </div>

          {!!error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {!!startError && <p className="mt-2 text-sm text-red-600">{startError}</p>}

          <ExamRulesPanel />
        </div>
      </div>
    </div>
  );
};

export default ExamDetail;
