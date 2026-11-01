import React from 'react';
import { getApiBaseUrl } from '../../../shared/lib/apiBaseUrl';
import type { PaperExamScanQuestionResult, PaperExamScanResponse, PaperExamScanStatus } from '../types';

const statusStyles: Record<PaperExamScanStatus, string> = {
  SUCCESS: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  FAILED_TO_READ: 'border-amber-200 bg-amber-50 text-amber-700',
  NEEDS_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  TIMEOUT: 'border-rose-200 bg-rose-50 text-rose-700',
  INVALID_IMAGE: 'border-rose-200 bg-rose-50 text-rose-700',
  SERVICE_UNAVAILABLE: 'border-slate-200 bg-slate-50 text-slate-700',
};

const questionStatusStyles: Record<string, string> = {
  CORRECT: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  WRONG: 'border-rose-200 bg-rose-50 text-rose-700',
  EMPTY: 'border-slate-200 bg-slate-50 text-slate-700',
  MULTI_MARKED: 'border-amber-200 bg-amber-50 text-amber-700',
  NEEDS_REVIEW: 'border-orange-200 bg-orange-50 text-orange-700',
  IGNORED: 'border-slate-200 bg-slate-50 text-slate-500',
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('vi-VN');
};

const joinValues = (values: string[]): string => (values.length > 0 ? values.join(', ') : '--');

const renderConfidence = (value?: number | null): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  if (value <= 1) return `${Math.round(value * 100)}%`;
  return `${value.toFixed(2)}%`;
};

const getImageUrl = (imagePath?: string | null): string | null => {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

const QuestionResultCard: React.FC<{ item: PaperExamScanQuestionResult }> = ({ item }) => {
  const style = questionStatusStyles[item.status] ?? questionStatusStyles.IGNORED;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Câu {item.questionIndex}</h3>
          <p className="mt-1 text-sm text-slate-500">Số lựa chọn được tô: {item.markedCount}</p>
        </div>
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style}`}>{item.status}</span>
      </div>

      <dl className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-500">Đáp án chọn</dt>
          <dd className="mt-1 font-medium text-slate-900">{joinValues(item.selectedOptions)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Đáp án đúng</dt>
          <dd className="mt-1 font-medium text-slate-900">{joinValues(item.correctOptions)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Độ tin cậy</dt>
          <dd className="mt-1 font-medium text-slate-900">{renderConfidence(item.confidence)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Trạng thái bỏ trống</dt>
          <dd className="mt-1 font-medium text-slate-900">{item.isEmpty ? 'Có' : 'Không'}</dd>
        </div>
      </dl>

      {item.note ? <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{item.note}</p> : null}
    </div>
  );
};

interface PaperExamScanResultViewProps {
  scanResult: PaperExamScanResponse;
  imageUrl?: string | null;
  showImage?: boolean;
  showErrors?: boolean;
  showRawVisionOutput?: boolean;
}

const PaperExamScanResultView: React.FC<PaperExamScanResultViewProps> = ({
  scanResult,
  imageUrl,
  showImage = true,
  showErrors = true,
  showRawVisionOutput = true,
}) => {
  const resolvedImageUrl = imageUrl ?? getImageUrl(scanResult.imagePath);
  const statusStyle = statusStyles[scanResult.status] ?? statusStyles.SERVICE_UNAVAILABLE;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle}`}>{scanResult.status}</span>
              <span className="text-sm text-slate-500">Scan ID #{scanResult.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Điểm</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.score ?? '--'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Đúng</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.totalCorrect}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Sai</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.totalWrong}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Thiếu</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.totalEmpty}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Cần review</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.totalNeedsReview}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Tô nhiều</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.totalMultiMarked}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Form variant</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.formVariant}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Số câu</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.totalQuestions}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
              <div>
                <span className="font-medium text-slate-500">Đề giấy:</span> #{scanResult.paperExamId}
              </div>
              <div>
                <span className="font-medium text-slate-500">Actual question count:</span> {scanResult.actualQuestionCount}
              </div>
              <div>
                <span className="font-medium text-slate-500">Tạo lúc:</span> {formatDateTime(scanResult.createdAt)}
              </div>
              <div>
                <span className="font-medium text-slate-500">Cập nhật:</span> {formatDateTime(scanResult.updatedAt)}
              </div>
            </div>
          </div>

          {showImage ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {resolvedImageUrl ? (
                <a href={resolvedImageUrl} target="_blank" rel="noreferrer" className="block">
                  <img src={resolvedImageUrl} alt={`Scan result ${scanResult.id}`} className="max-h-[420px] w-full rounded-xl object-contain" />
                </a>
              ) : (
                <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                  Không có ảnh scan
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {showErrors && scanResult.errors.length > 0 ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-rose-800">Errors</h2>
            <span className="text-xs font-medium uppercase tracking-wide text-rose-600">{scanResult.errors.length} lỗi</span>
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-700">
            {scanResult.errors.map((message, index) => (
              <li key={`${index}-${message}`}>{message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* {showRawVisionOutput && scanResult.rawVisionOutput ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Raw vision output</h2>
              <p className="mt-1 text-sm text-slate-400">Dữ liệu gốc trả về từ service vision để debug khi cần.</p>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">Debug</span>
          </div>
          <pre className="max-h-[480px] overflow-auto p-6 text-xs leading-relaxed text-slate-100">{scanResult.rawVisionOutput}</pre>
        </section>
      ) : null} */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Kết quả từng câu</h2>
            <p className="mt-1 text-sm text-slate-500">Danh sách câu hỏi đã được scan và đối chiếu.</p>
          </div>
          <span className="text-sm text-slate-500">{scanResult.questionResults.length} câu</span>
        </div>

        {scanResult.questionResults.length === 0 ? (
          <p className="text-sm text-slate-500">Không có dữ liệu câu hỏi trong lần scan này.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {scanResult.questionResults.map((item) => (
              <QuestionResultCard key={item.questionIndex} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PaperExamScanResultView;
