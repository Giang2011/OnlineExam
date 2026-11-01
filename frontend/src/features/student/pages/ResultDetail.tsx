import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Target } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
} from 'recharts';
import { ResultScoreCard, ResultSummaryCard } from '../components';
import { useSessionResult } from '../hooks/useSessionResult';

const ResultDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const parsedSessionId = Number(sessionId);
  const { result, loading, error, refetch } = useSessionResult(parsedSessionId);

  const chartData = useMemo(() => {
    if (!result) {
      return [];
    }

    const wrongCount = Math.max(result.totalQuestions - result.totalCorrect, 0);

    return [
      {
        metric: 'Số câu đúng',
        'Kết quả hiện tại': result.totalCorrect,
      },
      {
        metric: 'Số câu sai',
        'Kết quả hiện tại': wrongCount,
      },
      {
        metric: 'Tổng số câu',
        'Kết quả hiện tại': result.totalQuestions,
      },
    ];
  }, [result]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center animate-pulse">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold">Đang tải kết quả bài thi...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center p-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
        <p className="text-slate-700 font-bold">Không tìm thấy thông tin kết quả.</p>
        {!!error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Tải lại
          </button>
          <Link to="/student/results" className="inline-block text-indigo-600 font-bold hover:underline">
            Quay lại lịch sử thi
          </Link>
        </div>
      </div>
    );
  }

  const scorePercentage = result.totalQuestions > 0
    ? Math.round((result.totalCorrect / result.totalQuestions) * 100)
    : 0;

  const valueFormatter = (value: number) => `${value} câu`;


  return (
    <div className="max-w-4xl mx-auto font-sans animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="mb-8">
        <Link
          to="/student/results"
          className="group inline-flex items-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 hover:text-indigo-600 transition-all"
        >
          <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Quay lại lịch sử thi
        </Link>
      </div>

      <div className="modern-card overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative flex items-center justify-center overflow-hidden">
          <div className="relative z-10 text-center text-white">
            <h1 className="text-3xl font-bold tracking-tight">{result.examTitle}</h1>
            <p className="text-white/85 text-xs font-medium uppercase tracking-[0.18em] mt-2">Báo cáo kết quả chi tiết</p>
          </div>
        </div>

        <div className="p-10 -mt-10 relative z-20">
          <ResultScoreCard result={result} scorePercentage={scorePercentage} />

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-[0.14em] flex items-center gap-3">
                <Target size={18} className="text-indigo-600" />
                Thông tin thí sinh
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]">Họ và tên</span>
                  <span className="font-semibold text-slate-800">{result.studentName}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em]">Thời gian nộp</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(result.submittedAt).toLocaleTimeString('vi-VN')} {new Date(result.submittedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <ResultSummaryCard scorePercentage={scorePercentage} />
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="ml-1 mr-1 font-semibold text-slate-900">Biểu đồ kết quả</h3>
            <p className="text-sm text-slate-500">Thể hiện kết quả hiện tại của bài thi.</p>

            <div className="mt-6 h-64 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip formatter={(value: number) => [valueFormatter(value), '']} />
                  <Legend />
                  <Bar dataKey="Kết quả hiện tại" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <h4 className="text-sm font-semibold text-slate-800">Review chi tiết câu trả lời (sắp xếp theo câu hỏi)</h4>
            <p className="mt-1 text-sm text-slate-500">
              Khu vực này sẽ được tích hợp để hiển thị phân tích từng câu hỏi khi backend mở rộng API review trong tương lai.
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ResultDetail;
