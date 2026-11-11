import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { PageHeader } from '@/shared/components/PageHeader';
import { ErrorState } from '@/shared/components/ErrorState';
import { getApiErrorMessage } from '@/shared/lib/error-handler';
import { usePaperExam, useScanPaperExam } from '@/features/paper-exams/hooks/usePaperExams';

export function PaperExamScanPage() {
  const { paperExamId } = useParams();
  const id = paperExamId ? Number(paperExamId) : null;

  const paperExamQuery = usePaperExam(id);
  const scan = useScanPaperExam(id);
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [actualQuestionCount, setActualQuestionCount] = useState('');
  const [debug, setDebug] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setFiles((current) => [...current, ...Array.from(incoming)]);
  };

  const handleSubmit = async () => {
    if (!id || files.length === 0) return;
    setServerError(null);
    try {
      const result = await scan.mutateAsync({
        images: files,
        ...(actualQuestionCount ? { actualQuestionCount: Number(actualQuestionCount) } : {}),
        debug,
      });
      window.location.href = `/paper-exams/scan-results/${result.id}`;
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Không chấm được phiếu trả lời.'));
    }
  };

  if (paperExamQuery.isPending) {
    return <p className="text-sm text-slate">Đang tải đề giấy…</p>;
  }

  if (paperExamQuery.isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(paperExamQuery.error)}
        onRetry={() => void paperExamQuery.refetch()}
      />
    );
  }

  const paperExam = paperExamQuery.data;
  if (!paperExam) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Quét phiếu — ${paperExam.title}`}
        description={`Đề có ${paperExam.totalQuestions} câu, ${paperExam.omrPageCount} trang phiếu, ${paperExam.omrQuestionsPerPage} câu mỗi trang. Mỗi ảnh là một trang phiếu.`}
        actions={
          <Button asChild variant="outline">
            <Link to={`/paper-exams/${paperExam.id}`}>Về đề giấy</Link>
          </Button>
        }
      />

      <div className="max-w-3xl space-y-5">
        <section
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          className={`rounded-md border-2 border-dashed p-8 text-center transition-colors ${
            dragging ? 'border-chalk bg-chalk-wash' : 'border-rule-strong bg-paper-raised'
          }`}
        >
          <Upload className="mx-auto size-6 text-slate" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-ink">Kéo thả ảnh phiếu vào đây</p>
          <p className="mt-1 text-sm text-slate">
            Hoặc chọn từ thiết bị. Thứ tự ảnh không quan trọng — hệ thống tự ghép theo mã trang trên QR.
          </p>
          <label className="mt-4 inline-flex cursor-pointer items-center rounded-md border border-rule bg-paper-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper-sunken focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-chalk">
            Chọn ảnh
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => addFiles(event.target.files)}
            />
          </label>
        </section>

        {files.length > 0 ? (
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-md border border-rule bg-paper-raised px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                  <p className="tabular text-xs text-slate">
                    Trang {index + 1} · {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Bỏ ảnh ${file.name}`}
                  onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                >
                  <X className="size-4 text-pen" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="actual-count">Số câu thực tế của đề</Label>
            <Input
              id="actual-count"
              type="number"
              min={1}
              value={actualQuestionCount}
              placeholder={String(paperExam.totalQuestions)}
              onChange={(event) => setActualQuestionCount(event.target.value)}
            />
            <p className="text-xs text-slate">Bỏ trống để dùng tổng số câu của đề giấy.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scan-debug">Chế độ debug</Label>
            <label className="flex h-9 items-center gap-2 text-sm text-ink">
              <input
                id="scan-debug"
                type="checkbox"
                checked={debug}
                onChange={(event) => setDebug(event.target.checked)}
                className="size-4 rounded border-rule"
              />
              Lưu kết quả nhận dạng thô
            </label>
          </div>
        </div>

        {serverError ? (
          <p className="rounded-md border border-pen/30 bg-pen-wash px-3 py-2 text-sm text-pen" role="alert">
            {serverError}
          </p>
        ) : null}

        <Button
          type="button"
          disabled={files.length === 0 || scan.isPending}
          onClick={() => void handleSubmit()}
        >
          {scan.isPending ? 'Đang chấm điểm…' : `Chấm điểm ${files.length} ảnh`}
        </Button>
      </div>
    </div>
  );
}
