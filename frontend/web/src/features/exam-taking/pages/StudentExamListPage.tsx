import { Link, useNavigate } from 'react-router-dom';
import { Clock, FileText } from 'lucide-react';
import { Button } from '@/lib/ui/button';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatDateTime } from '@/shared/utils/format';
import { getApiErrorMessage } from '@/shared/lib/error-handler';
import { useExams } from '@/features/exams/hooks/useExams';
import { useStartSession } from '@/features/exam-taking/hooks/useSessions';
import { ExamStatusBadge } from '@/features/exams/components/ExamStatusBadge';
import type { Exam } from '@/features/exams/types';

export function StudentExamListPage() {
  const navigate = useNavigate();
  const examsQuery = useExams();
  const startSession = useStartSession();

  const start = async (examId: number) => {
    try {
      const session = await startSession.mutateAsync(examId);
      navigate(`/exam-taking/${session.id}`);
    } catch {
      // Toast đã hiển thị trong hook.
    }
  };

  const columns: Column<Exam>[] = [
    {
      id: 'title',
      header: 'Kỳ thi',
      cell: (exam) => (
        <div className="min-w-0">
          <p className="font-medium text-ink">{exam.title}</p>
          <p className="mt-0.5 text-xs text-slate">{exam.subjectName}</p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (exam) => <ExamStatusBadge status={exam.status} />,
    },
    {
      id: 'time',
      header: 'Thời gian',
      hideBelow: 'sm',
      cell: (exam) => (
        <span className="tabular text-sm text-slate">
          {formatDateTime(exam.startTime)} → {formatDateTime(exam.endTime)}
        </span>
      ),
    },
    {
      id: 'meta',
      header: 'Cấu trúc',
      hideBelow: 'md',
      cell: (exam) => (
        <span className="tabular text-sm text-slate">
          {exam.totalQuestions} câu · {exam.duration} phút · tối đa {exam.maxAttempts} lượt
        </span>
      ),
    },
    {
      id: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      cell: (exam) => (
        <div className="flex justify-end">
          {exam.status === 'ONGOING' ? (
            <Button
              size="sm"
              disabled={startSession.isPending}
              onClick={() => void start(exam.id)}
            >
              {startSession.isPending ? 'Đang mở…' : 'Bắt đầu thi'}
            </Button>
          ) : (
            <span className="tabular text-sm text-slate">
              {exam.status === 'UPCOMING' ? 'Chưa mở' : 'Đã đóng'}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kỳ thi của tôi"
        description="Các kỳ thi bạn được phân công. Chỉ mở được khi kỳ thi đang diễn ra."
      />

      {examsQuery.isPending ? (
        <p className="text-sm text-slate">Đang tải kỳ thi…</p>
      ) : examsQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(examsQuery.error)}
          onRetry={() => void examsQuery.refetch()}
        />
      ) : (examsQuery.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="Chưa có kỳ thi nào"
          description="Khi giáo viên phân công kỳ thi, nó sẽ xuất hiện ở đây."
          action={
            <Button asChild variant="outline">
              <Link to="/my-results">
                <FileText className="size-4" aria-hidden="true" />
                Xem kết quả đã thi
              </Link>
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={examsQuery.data ?? []} rowKey={(exam) => exam.id} />
      )}

      <p className="flex items-center gap-2 text-xs text-slate">
        <Clock className="size-4" aria-hidden="true" />
        Đồng hồ thi bám theo máy chủ, nên bạn không thể kéo dài thời gian bằng cách đổi đồng hồ máy.
      </p>
    </div>
  );
}
