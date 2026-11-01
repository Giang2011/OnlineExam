import React, { useEffect, useMemo, useState } from 'react';
import { BarChart as BarChartIcon, FileText, RefreshCw, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getExams, type ExamResponse } from '../api/examApi';
import useAdminReports from '../hooks/useAdminReports';
import { normalizeApiErrorMessage } from '../../../shared/lib/apiError';
import { EmptyState, Select, Spinner } from '../../../shared/components';

const ExamReports: React.FC = () => {
  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [examLoading, setExamLoading] = useState(true);
  const [examError, setExamError] = useState<string | null>(null);

  const { results, statistics, loading, error, selectedExamId, selectExam, refetch } = useAdminReports();

  useEffect(() => {
    const loadExams = async () => {
      setExamLoading(true);
      setExamError(null);

      try {
        const data = await getExams();
        setExams(data);
      } catch (err) {
        setExamError(normalizeApiErrorMessage(err));
      } finally {
        setExamLoading(false);
      }
    };

    void loadExams();
  }, []);

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === selectedExamId) ?? null,
    [exams, selectedExamId],
  );

  const averageScore = useMemo(() => statistics?.average ?? 0, [statistics]);

  const handleExamChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;

    if (!value) {
      void selectExam(null);
      return;
    }

    const examId = Number(value);
    if (!Number.isFinite(examId) || Number.isNaN(examId) || examId <= 0) {
      return;
    }

    void selectExam(examId);
  };

  const examOptions = exams.map((exam) => ({
    value: String(exam.id),
    label: exam.title,
  }));

  const scoreDistribution = [
    { label: '0-2', value: statistics?.distribution.from0To2 ?? 0 },
    { label: '2-4', value: statistics?.distribution.from2To4 ?? 0 },
    { label: '4-6', value: statistics?.distribution.from4To6 ?? 0 },
    { label: '6-8', value: statistics?.distribution.from6To8 ?? 0 },
    { label: '8-10', value: statistics?.distribution.from8To10 ?? 0 },
  ];

  const chartColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thống kê & Báo cáo</h1>
          <p className="mt-1 text-sm text-slate-500">Xem bảng điểm chi tiết theo từng kỳ thi.</p>
        </div>

        <div className="w-full md:w-96">
          <Select
            value={selectedExamId ? String(selectedExamId) : ''}
            onChange={handleExamChange}
            options={examOptions}
            placeholder={examLoading ? 'Đang tải danh sách kỳ thi...' : 'Chọn kỳ thi'}
            disabled={examLoading || Boolean(examError)}
          />
        </div>
      </div>

      {examLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Spinner size="lg" />
        </div>
      ) : examError ? (
        <EmptyState
          title="Không thể tải kỳ thi"
          description={examError}
          action={
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              <RefreshCw size={16} />
              Tải lại trang
            </button>
          }
        />
      ) : !selectedExamId ? (
        <EmptyState
          title="Chưa chọn kỳ thi"
          description="Hãy chọn một kỳ thi để xem bảng điểm chi tiết."
          className="py-14"
        />
      ) : loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <EmptyState
          title="Không thể tải báo cáo"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              <RefreshCw size={16} />
              Thử lại
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <div className="mb-2 inline-flex rounded-lg bg-white p-2 text-indigo-600">
                <BarChartIcon size={18} />
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">Kỳ thi</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{selectedExam?.title ?? `#${selectedExamId}`}</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="mb-2 inline-flex rounded-lg bg-white p-2 text-emerald-600">
                <Users size={18} />
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Bài nộp</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{statistics?.totalSubmitted ?? results.length}</p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <div className="mb-2 inline-flex rounded-lg bg-white p-2 text-amber-600">
                <FileText size={18} />
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Điểm trung bình</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{averageScore.toFixed(2)}/10</p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
              <div className="mb-2 inline-flex rounded-lg bg-white p-2 text-rose-600">
                <FileText size={18} />
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-rose-700">Điểm cao nhất</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{(statistics?.highest ?? 0).toFixed(2)}/10</p>
            </div>

            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
              <div className="mb-2 inline-flex rounded-lg bg-white p-2 text-cyan-600">
                <FileText size={18} />
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-cyan-700">Điểm thấp nhất</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{(statistics?.lowest ?? 0).toFixed(2)}/10</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Phân bố điểm</h2>
                <p className="mt-1 text-sm text-slate-500">Số bài nộp theo từng khoảng điểm.</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    formatter={(value) => [`${value} bài`, 'Số bài nộp']}
                    labelFormatter={(label) => `Khoảng điểm ${label}`}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${entry.label}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {results.length === 0 ? (
            <EmptyState
              title="Chưa có bài nộp nào"
              description="Kỳ thi này chưa có sinh viên nộp bài hoặc chưa phát sinh kết quả."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">Bảng điểm chi tiết</h2>
                <p className="mt-1 text-sm text-slate-500">Sắp xếp theo điểm giảm dần.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Sinh viên</th>
                      <th className="px-5 py-3">Mã SV</th>
                      <th className="px-5 py-3">Điểm</th>
                      <th className="px-5 py-3">Số câu đúng</th>
                      <th className="px-5 py-3">Thời gian nộp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-700">{index + 1}</td>
                        <td className="px-5 py-3 text-slate-900">{item.studentName}</td>
                        <td className="px-5 py-3 text-slate-700">{item.studentId}</td>
                        <td className="px-5 py-3 font-semibold text-indigo-700">{item.score.toFixed(2)}</td>
                        <td className="px-5 py-3 text-slate-700">{item.totalCorrect}</td>
                        <td className="px-5 py-3 text-slate-700">
                          {new Date(item.submittedAt).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamReports;
