import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { Button } from '@/lib/ui/button';
import { PageHeader } from '@/shared/components/PageHeader';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatDateTime } from '@/shared/utils/format';
import { getApiErrorMessage } from '@/shared/lib/error-handler';
import { cn } from '@/shared/utils/cn';
import { paperExamsApi } from '@/features/paper-exams/api';
import type { ScanQuestionStatus } from '@/features/paper-exams/types';

const STATUS_LABEL: Record<ScanQuestionStatus, string> = {
  CORRECT: 'Đúng',
  WRONG: 'Sai',
  EMPTY: 'Bỏ trống',
  MULTI_MARKED: 'Tô nhiều ô',
  NEEDS_REVIEW: 'Cần xem lại',
  IGNORED: 'Bỏ qua',
};

const STATUS_STYLE: Record<ScanQuestionStatus, string> = {
  CORRECT: 'border-jade/40 bg-jade-wash text-jade',
  WRONG: 'border-pen/40 bg-pen-wash text-pen',
  EMPTY: 'border-rule bg-paper-sunken text-slate',
  MULTI_MARKED: 'border-pen/40 bg-pen-wash text-pen',
  NEEDS_REVIEW: 'border-chalk/40 bg-chalk-wash text-chalk-deep',
  IGNORED: 'border-rule bg-paper-sunken text-slate',
};

export function ScanResultDetailPage() {
  const { scanResultId } = useParams();
  const id = scanResultId ? Number(scanResultId) : null;

  const scanResultQuery = useQuery({
    queryKey: queryKeys.paperExams.scanResult(id ?? 0),
    queryFn: () => paperExamsApi.scanResult(id as number),
    enabled: id !== null,
    retry: false,
  });

  if (scanResultQuery.isPending) {
    return <p className="text-sm text-slate">Đang tải kết quả scan…</p>;
  }

  if (scanResultQuery.isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(scanResultQuery.error)}
        onRetry={() => void scanResultQuery.refetch()}
      />
    );
  }

  const result = scanResultQuery.data;
  if (!result) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kết quả chấm phiếu"
        description={`${result.studentId ?? 'Không đọc được mã sinh viên'} · ${formatDateTime(result.createdAt)}`}
        actions={
          <Button asChild variant="outline">
            <Link to={`/paper-exams/${result.paperExamId}`}>Về đề giấy</Link>
          </Button>
        }
      />

      <dl className="grid gap-4 rounded-md border border-rule bg-paper-raised p-5 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Điểm" value={result.score} />
        <Stat label="Đúng" value={result.totalCorrect} />
        <Stat label="Sai" value={result.totalWrong} />
        <Stat label="Bỏ trống" value={result.totalEmpty} />
        <Stat label="Tô nhiều ô" value={result.totalMultiMarked} />
        <Stat label="Cần xem lại" value={result.totalNeedsReview} />
      </dl>

      {result.errors.length > 0 ? (
        <div className="rounded-md border border-pen/30 bg-pen-wash px-4 py-3">
          <p className="text-sm font-medium text-pen">Lỗi trong quá trình chấm</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-pen">
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">Kết quả từng câu</h2>
        <div className="overflow-x-auto rounded-md border border-rule bg-paper-raised">
          <table className="w-full text-sm">
            <thead className="border-b border-rule bg-paper-sunken">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-left font-medium text-ink">
                  Câu
                </th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium text-ink">
                  Đáp án tô
                </th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium text-ink">
                  Đáp án đúng
                </th>
                <th scope="col" className="px-4 py-2.5 text-left font-medium text-ink">
                  Trạng thái
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium text-ink">
                  Độ tin cậy
                </th>
              </tr>
            </thead>
            <tbody>
              {result.questionResults.map((question) => (
                <tr key={question.questionIndex} className="border-b border-rule last:border-0">
                  <td className="tabular px-4 py-2.5 font-medium text-ink">{question.questionIndex}</td>
                  <td className="tabular px-4 py-2.5 text-slate">
                    {question.selectedOptions.length > 0 ? question.selectedOptions.join(', ') : '—'}
                  </td>
                  <td className="tabular px-4 py-2.5 text-slate">
                    {question.correctOptions.length > 0 ? question.correctOptions.join(', ') : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
                        STATUS_STYLE[question.status],
                      )}
                    >
                      {STATUS_LABEL[question.status]}
                    </span>
                  </td>
                  <td className="tabular px-4 py-2.5 text-right text-slate">
                    {Math.round(question.confidence * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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
