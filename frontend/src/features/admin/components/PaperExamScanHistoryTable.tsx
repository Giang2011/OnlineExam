import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { PaperExamScanListItem } from '../types';

interface PaperExamScanHistoryTableProps {
  paperExamId: number;
  scanResults: PaperExamScanListItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void | Promise<void>;
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return date.toLocaleString('vi-VN');
};

const scanStatusStyles: Record<string, string> = {
  SUCCESS: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  FAILED_TO_READ: 'border-amber-200 bg-amber-50 text-amber-700',
  NEEDS_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  TIMEOUT: 'border-rose-200 bg-rose-50 text-rose-700',
  INVALID_IMAGE: 'border-rose-200 bg-rose-50 text-rose-700',
  SERVICE_UNAVAILABLE: 'border-slate-200 bg-slate-50 text-slate-700',
};

const ScanStatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${scanStatusStyles[status] ?? scanStatusStyles.SERVICE_UNAVAILABLE}`}
  >
    {status}
  </span>
);

const PaperExamScanHistoryTable: React.FC<PaperExamScanHistoryTableProps> = ({
  paperExamId,
  scanResults,
  loading = false,
  error = null,
  onRetry,
}) => {
  const navigate = useNavigate();

  return (
    <section id="scan-results-section" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Lịch sử scan</h2>
          <p className="mt-1 text-sm text-slate-500">Danh sách các lần chấm bài giấy bằng ảnh của đề này.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{scanResults.length} lần scan</span>
          <button
            type="button"
            onClick={() => navigate(`/admin/paper-exams/${paperExamId}/scan`)}
            className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            Chấm ảnh mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Đang tải lịch sử scan...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>{error}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={() => void onRetry()}
              className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
            >
              Thử lại
            </button>
          ) : null}
        </div>
      ) : scanResults.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          Chưa có lịch sử scan nào cho đề giấy này.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Điểm</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Đúng</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Sai</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Thiếu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Tạo lúc</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scanResults.map((result) => (
                <tr key={result.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 text-sm text-slate-700">#{result.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <ScanStatusBadge status={result.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{result.score ?? '--'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{result.totalCorrect}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{result.totalWrong}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{result.totalEmpty}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{formatDateTime(result.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/paper-exams/scan-results/${result.id}`)}
                      className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-100"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default PaperExamScanHistoryTable;
