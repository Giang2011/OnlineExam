import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PaperExamScanResultView from '../components/PaperExamScanResultView';
import { useAdminPaperExamScanResultDetail } from '../hooks/useAdminPaperExams';

const PaperExamScanResultDetail: React.FC = () => {
  const navigate = useNavigate();
  const { scanResultId } = useParams<{ scanResultId: string }>();
  const validScanResultId = scanResultId ? Number(scanResultId) : null;
  const isValidId = validScanResultId !== null && Number.isFinite(validScanResultId) && validScanResultId > 0;
  const { scanResult, loading, error, refetch } = useAdminPaperExamScanResultDetail(isValidId ? validScanResultId : null);

  if (!isValidId) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-rose-700">ID scan result không hợp lệ.</p>
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chi tiết scan đề giấy</h1>
          <p className="mt-1 text-sm text-slate-500">Xem kết quả scan và từng câu được nhận diện từ ảnh.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Quay lại
          </button>
          <button type="button" onClick={() => navigate('/admin/paper-exams')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Danh sách đề giấy
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Đang tải chi tiết scan...</div>
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
      ) : scanResult ? (
        <PaperExamScanResultView
          scanResult={scanResult}
          showImage
          showErrors
          showRawVisionOutput
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Không tìm thấy dữ liệu scan.</div>
      )}
    </div>
  );
};

export default PaperExamScanResultDetail;
