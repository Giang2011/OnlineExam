import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, Eye, FileText, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/ui/tabs';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { PdfPreviewDialog } from '@/shared/components/PdfPreviewDialog';
import { formatDateTime } from '@/shared/utils/format';
import { getApiErrorMessage } from '@/shared/lib/error-handler';
import { resolveUploadUrl } from '@/shared/lib/upload-url';
import { cn } from '@/shared/utils/cn';
import {
  usePaperExam,
  usePaperExamAnswers,
  useScanResults,
} from '@/features/paper-exams/hooks/usePaperExams';
import { paperExamsApi } from '@/features/paper-exams/api';
import {
  SCAN_STATUS_LABEL,
  SCAN_STATUS_STYLE,
} from '@/features/paper-exams/pages/ScanResultDetailPage';

type PreviewKind = 'pdf' | 'omr' | null;

export function PaperExamDetailPage() {
  const { paperExamId } = useParams();
  const id = paperExamId ? Number(paperExamId) : null;

  const paperExamQuery = usePaperExam(id);
  const answersQuery = usePaperExamAnswers(id);
  const scanResultsQuery = useScanResults(id);

  const [preview, setPreview] = useState<PreviewKind>(null);
  const [studentId, setStudentId] = useState('');

  const download = async (kind: 'pdf' | 'omr') => {
    if (!id) return;
    try {
      const blob =
        kind === 'pdf'
          ? await paperExamsApi.downloadPdf(id)
          : await paperExamsApi.downloadOmrSheet(id, studentId || undefined);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = kind === 'pdf' ? 'de-giay.pdf' : 'phieu-omr.pdf';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải tệp PDF.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không tải được tệp PDF.'));
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

  const questions = answersQuery.data?.questions ?? [];
  const scanResults = scanResultsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={paperExam.title}
        description={`${paperExam.subjectName} · ${paperExam.totalQuestions} câu · ${paperExam.durationMinutes} phút`}
        actions={
          <>
            <Button variant="outline" onClick={() => setPreview('pdf')}>
              <Eye className="size-4" aria-hidden="true" />
              Xem đề
            </Button>
            <Button variant="outline" onClick={() => void download('pdf')}>
              <Download className="size-4" aria-hidden="true" />
              Tải đề
            </Button>
            <Button asChild>
              <Link to={`/paper-exams/${paperExam.id}/scan`}>
                <ScanLine className="size-4" aria-hidden="true" />
                Quét phiếu
              </Link>
            </Button>
          </>
        }
      />

      <dl className="grid gap-4 rounded-md border border-rule bg-paper-raised p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Số câu / trang phiếu" value={paperExam.omrQuestionsPerPage} />
        <Stat label="Số trang phiếu" value={paperExam.omrPageCount} />
        <Stat label="Lựa chọn tối đa mỗi câu" value={paperExam.omrChoicesPerQ} />
        <Stat label="Người tạo" value={paperExam.createdByName} />
      </dl>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">Phiếu trả lời OMR</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56 space-y-1.5">
            <Label htmlFor="student-id">Mã sinh viên (không bắt buộc)</Label>
            <Input
              id="student-id"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="VD: 2021001"
            />
          </div>
          <Button variant="outline" onClick={() => setPreview('omr')}>
            <Eye className="size-4" aria-hidden="true" />
            Xem phiếu
          </Button>
          <Button variant="outline" onClick={() => void download('omr')}>
            <Download className="size-4" aria-hidden="true" />
            Tải phiếu
          </Button>
        </div>
      </section>

      <Tabs defaultValue="answers">
        <TabsList>
          <TabsTrigger value="answers">Đáp án</TabsTrigger>
          <TabsTrigger value="scans">Lịch sử scan ({scanResults.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="answers" className="mt-4 space-y-3">
          {answersQuery.isPending ? (
            <p className="text-sm text-slate">Đang tải đáp án…</p>
          ) : answersQuery.isError ? (
            <ErrorState
              message={getApiErrorMessage(answersQuery.error)}
              onRetry={() => void answersQuery.refetch()}
            />
          ) : questions.length === 0 ? (
            <EmptyState title="Đề chưa có câu hỏi" description="Đề giấy không có câu hỏi nào." />
          ) : (
            questions.map((question) => (
              <article
                key={question.id}
                className="rounded-md border border-rule bg-paper-raised p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-base font-semibold text-ink">
                    Câu {question.orderIndex}
                  </h3>
                  <span className="text-xs text-slate">{question.chapterName}</span>
                </div>
                <p className="font-document mt-2 text-ink">{question.content}</p>
                {question.imageUrl ? (
                  <img
                    src={resolveUploadUrl(question.imageUrl) ?? undefined}
                    alt="Ảnh minh hoạ câu hỏi"
                    className="mt-3 max-h-64 rounded border border-rule bg-paper object-contain"
                  />
                ) : null}
                <ul className="mt-3 space-y-1">
                  {question.answers.map((answer) => {
                    const letter = String.fromCharCode(64 + answer.orderIndex);
                    return (
                      <li key={answer.answerId} className="flex items-start gap-2 text-sm">
                        <span className="tabular w-5 shrink-0 font-semibold text-slate">{letter}</span>
                        <span className={answer.isCorrect ? 'font-medium text-jade' : 'text-ink'}>
                          {answer.content}
                        </span>
                        {answer.isCorrect ? (
                          <span className="shrink-0 text-xs font-medium text-jade">Đúng</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))
          )}
        </TabsContent>

        <TabsContent value="scans" className="mt-4">
          {scanResultsQuery.isPending ? (
            <p className="text-sm text-slate">Đang tải lịch sử scan…</p>
          ) : scanResultsQuery.isError ? (
            <ErrorState
              message={getApiErrorMessage(scanResultsQuery.error)}
              onRetry={() => void scanResultsQuery.refetch()}
            />
          ) : scanResults.length === 0 ? (
            <EmptyState
              title="Chưa có lần scan nào"
              description="Quét ảnh phiếu trả lời để xem kết quả ở đây."
              action={
                <Button asChild variant="outline">
                  <Link to={`/paper-exams/${paperExam.id}/scan`}>
                    <FileText className="size-4" aria-hidden="true" />
                    Đi tới trang quét
                  </Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {scanResults.map((result) => (
                <li
                  key={result.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-rule bg-paper-raised px-4 py-3"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-ink">
                        {result.studentId ?? 'Không đọc được mã sinh viên'}
                      </p>
                      <span
                        className={cn(
                          'inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium',
                          SCAN_STATUS_STYLE[result.status] ?? 'border-rule bg-paper-sunken text-slate',
                        )}
                      >
                        {SCAN_STATUS_LABEL[result.status] ?? result.status}
                      </span>
                    </div>
                    <p className="tabular mt-0.5 text-xs text-slate">
                      {formatDateTime(result.createdAt)} · {result.totalCorrect}/{result.actualQuestionCount} đúng
                    </p>
                  </div>
                  <Link
                    to={`/paper-exams/scan-results/${result.id}`}
                    className="text-sm font-medium text-chalk hover:text-chalk-deep"
                  >
                    Xem chi tiết
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <PdfPreviewDialog
        open={preview !== null}
        onOpenChange={(open) => !open && setPreview(null)}
        title={preview === 'omr' ? 'Phiếu trả lời OMR' : 'Đề giấy'}
        path={
          preview === 'omr'
            ? `/paper-exams/${paperExam.id}/omr-sheet/preview${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''}`
            : `/paper-exams/${paperExam.id}/pdf/preview`
        }
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-slate">{label}</dt>
      <dd className="tabular mt-0.5 text-lg font-semibold text-ink">{value}</dd>
    </div>
  );
}
