import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { appToast } from '../../../shared/components';
import { getApiBaseUrl } from '../../../shared/lib/apiBaseUrl';
import { useAdminPaperExamDetail, usePaperExamScan } from '../hooks/useAdminPaperExams';
import type { PaperExamScanResponse, PaperExamScanStatus } from '../types';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

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
  return `${getApiBaseUrl()}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

const QuestionResultCard: React.FC<{ item: PaperExamScanResponse['questionResults'][number] }> = ({ item }) => {
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

const PaperExamScan: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const examId = id ? Number(id) : null;
  const isValidId = examId !== null && Number.isFinite(examId) && examId > 0;

  const { paperExam, loading: paperExamLoading, error: paperExamError } = useAdminPaperExamDetail(isValidId ? examId : null);
  const { scan, loading: scanning } = usePaperExamScan();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [actualQuestionCount, setActualQuestionCount] = useState<string>('');
  const [formVariant, setFormVariant] = useState<string>('75');
  const [debug, setDebug] = useState(false);
  const [scanMode, setScanMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<PaperExamScanResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const previewImage = useMemo(() => previewUrl, [previewUrl]);
  const imageUrl = useMemo(() => getImageUrl(scanResult?.imagePath), [scanResult?.imagePath]);

  const resetPreview = (nextFile: File | null) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (!nextFile) {
      setPreviewUrl(null);
      setFile(null);
      setSelectedFileName(null);
      return;
    }
    setFile(nextFile);
    setSelectedFileName(nextFile.name);
    setPreviewUrl(URL.createObjectURL(nextFile));
  };

  const validateFile = (nextFile: File): string | null => {
    if (!nextFile.type.startsWith('image/')) {
      return 'Vui lòng chọn một file ảnh hợp lệ.';
    }
    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      return 'File ảnh quá lớn. Vui lòng chọn file nhỏ hơn 10MB.';
    }
    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setSubmitError(null);
    setValidationError(null);

    if (!nextFile) {
      resetPreview(null);
      return;
    }

    const message = validateFile(nextFile);
    if (message) {
      setValidationError(message);
      appToast.warning(message);
      event.target.value = '';
      return;
    }

    resetPreview(nextFile);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = async () => {
    if (!isValidId) return;
    if (!file) {
      const message = 'Vui lòng chọn ảnh scan trước khi chấm bài.';
      setValidationError(message);
      appToast.warning(message);
      return;
    }

    const parsedActualQuestionCount = actualQuestionCount.trim() ? Number(actualQuestionCount) : paperExam?.totalQuestions;
    if (typeof parsedActualQuestionCount !== 'number' || !Number.isFinite(parsedActualQuestionCount) || parsedActualQuestionCount <= 0) {
      const message = 'Số câu thực tế không hợp lệ.';
      setValidationError(message);
      appToast.error(message);
      return;
    }

    if (formVariant.trim() && Number.isNaN(Number(formVariant))) {
      const message = 'Form variant không hợp lệ.';
      setValidationError(message);
      appToast.error(message);
      return;
    }

    try {
      setSubmitError(null);
      setValidationError(null);
      const result = await scan(examId, {
        image: file,
        actualQuestionCount: parsedActualQuestionCount,
        formVariant: formVariant.trim() ? Number(formVariant) : 75,
        debug,
        scanMode,
      });
      setScanResult(result);
      if (result.status === 'SUCCESS') {
        appToast.success('Chấm bài thành công.');
      } else {
        appToast.warning(`Kết quả scan: ${result.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể chấm bài giấy bằng ảnh.';
      setSubmitError(message);
      appToast.error(message);
    }
  };

  const handleRetry = () => {
    setSubmitError(null);
    setValidationError(null);
    setScanResult(null);
    if (file) {
      setSelectedFileName(file.name);
    }
  };

  const statusStyle = scanResult ? statusStyles[scanResult.status] ?? statusStyles.SERVICE_UNAVAILABLE : null;

  if (!isValidId) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-rose-700">ID đề giấy không hợp lệ.</p>
        <button type="button" onClick={() => navigate('/admin/paper-exams')} className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100">
          Quay về danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chấm bài giấy bằng ảnh</h1>
          <p className="mt-1 text-sm text-slate-500">Tải ảnh bài làm và nhận kết quả scan ngay trên màn hình này.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate(`/admin/paper-exams/${examId}`)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Quay lại chi tiết
          </button>
          <button type="button" onClick={() => navigate('/admin/paper-exams')} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
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
        <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Thông tin đề giấy</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p><span className="font-medium text-slate-500">Tiêu đề:</span> {paperExam.title}</p>
                <p><span className="font-medium text-slate-500">Môn học:</span> {paperExam.subjectName ?? '--'}</p>
                <p><span className="font-medium text-slate-500">Tổng số câu:</span> {paperExam.totalQuestions}</p>
                <p><span className="font-medium text-slate-500">Thời lượng:</span> {paperExam.durationMinutes} phút</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Tải ảnh scan</h2>
              <p className="mt-1 text-sm text-slate-500">Chọn ảnh rõ nét để hệ thống nhận diện tốt hơn.</p>

              <div className="mt-4 space-y-4">
                <label className="block rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <span className="text-sm font-medium text-slate-700">Bấm để chọn ảnh hoặc kéo thả vào đây</span>
                  <span className="mt-1 block text-xs text-slate-500">Hỗ trợ JPG, PNG, WEBP - tối đa 10MB</span>
                </label>

                {selectedFileName ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="font-medium text-slate-500">File đã chọn:</span> {selectedFileName}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-medium text-slate-500">Số câu thực tế</span>
                    <input
                      type="number"
                      min={1}
                      value={actualQuestionCount}
                      onChange={(event) => setActualQuestionCount(event.target.value)}
                      placeholder={`Mặc định: ${paperExam.totalQuestions}`}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-medium text-slate-500">Form variant</span>
                    <input
                      type="number"
                      min={1}
                      value={formVariant}
                      onChange={(event) => setFormVariant(event.target.value)}
                      placeholder="75"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <input type="checkbox" checked={debug} onChange={(event) => setDebug(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    Bật debug
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-medium text-slate-500">Scan mode</span>
                    <select value={scanMode} onChange={(event) => setScanMode(event.target.value as 'AUTO' | 'MANUAL')} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500">
                      <option value="AUTO">AUTO</option>
                      <option value="MANUAL">MANUAL</option>
                    </select>
                  </label>
                </div>

                {validationError ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{validationError}</p> : null}
                {submitError ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p> : null}

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleSubmit} disabled={scanning || !file} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {scanning ? 'Đang chấm bài...' : 'Chấm bài'}
                  </button>
                  <button type="button" onClick={handleRetry} disabled={!file && !scanResult && !validationError && !submitError} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
                    Thử lại
                  </button>
                  <button type="button" onClick={() => resetPreview(null)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    Xóa ảnh
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Xem trước ảnh</h2>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                {previewImage ? (
                  <img src={previewImage} alt="Preview scan" className="max-h-[420px] w-full rounded-xl object-contain" />
                ) : (
                  <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                    Chưa có ảnh được chọn
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Kết quả scan</h2>
                  <p className="mt-1 text-sm text-slate-500">Kết quả sẽ được cập nhật ngay sau khi chấm.</p>
                </div>
                {scanResult ? <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyle ?? statusStyles.SERVICE_UNAVAILABLE}`}>{scanResult.status}</span> : null}
              </div>

              {scanResult ? (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Điểm</p><p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.score ?? '--'}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Đúng</p><p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.totalCorrect}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Sai</p><p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.totalWrong}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Thiếu</p><p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.totalEmpty}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Cần review</p><p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.totalNeedsReview}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Tô nhiều</p><p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.totalMultiMarked}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Form variant</p><p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.formVariant}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Số câu</p><p className="mt-1 text-lg font-semibold text-slate-900">{scanResult.totalQuestions}</p></div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
                    <div><span className="font-medium text-slate-500">Đề giấy:</span> #{scanResult.paperExamId}</div>
                    <div><span className="font-medium text-slate-500">Actual question count:</span> {scanResult.actualQuestionCount}</div>
                    <div><span className="font-medium text-slate-500">Tạo lúc:</span> {formatDateTime(scanResult.createdAt)}</div>
                    <div><span className="font-medium text-slate-500">Cập nhật:</span> {formatDateTime(scanResult.updatedAt)}</div>
                  </div>

                  {imageUrl ? (
                    <a href={imageUrl} target="_blank" rel="noreferrer" className="block rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <img src={imageUrl} alt={`Scan result ${scanResult.id}`} className="max-h-[420px] w-full rounded-xl object-contain" />
                    </a>
                  ) : null}

                  {scanResult.errors.length > 0 ? (
                    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-rose-800">Errors</h3>
                        <span className="text-xs font-medium uppercase tracking-wide text-rose-600">{scanResult.errors.length} lỗi</span>
                      </div>
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-700">
                        {scanResult.errors.map((message, index) => (
                          <li key={`${index}-${message}`}>{message}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {/* {scanResult.rawVisionOutput ? (
                    <section className="rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-100">Raw vision output</h3>
                          <p className="mt-1 text-xs text-slate-400">Dữ liệu gốc trả về từ service vision để debug khi cần.</p>
                        </div>
                        <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                          Debug
                        </span>
                      </div>
                      <pre className="max-h-[420px] overflow-auto p-4 text-xs leading-relaxed text-slate-100">
{scanResult.rawVisionOutput}
                      </pre>
                    </section>
                  ) : null} */}

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-900">Kết quả từng câu</h3>
                    {scanResult.questionResults.length === 0 ? (
                      <p className="text-sm text-slate-500">Chưa có dữ liệu câu hỏi.</p>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {scanResult.questionResults.map((item) => (
                          <QuestionResultCard key={item.questionIndex} item={item} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Chưa có kết quả scan.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Không tìm thấy đề giấy.</div>
      )}
    </div>
  );
};

export default PaperExamScan;
