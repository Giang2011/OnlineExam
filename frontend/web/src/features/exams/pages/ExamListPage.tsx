import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/lib/ui/alert-dialog';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { formatDateTime } from '@/shared/utils/format';
import { getApiErrorMessage } from '@/shared/lib/error-handler';
import { useDeleteExam, useExams } from '@/features/exams/hooks/useExams';
import { ExamStatusBadge } from '@/features/exams/components/ExamStatusBadge';
import type { Exam } from '@/features/exams/types';

type StatusFilter = 'ALL' | 'UPCOMING' | 'ONGOING' | 'COMPLETED';

export function ExamListPage() {
  const examsQuery = useExams();
  const deleteExam = useDeleteExam();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);

  const rows = useMemo(() => {
    const all = examsQuery.data ?? [];
    const term = keyword.trim().toLowerCase();
    return all.filter((exam) => {
      if (statusFilter !== 'ALL' && exam.status !== statusFilter) return false;
      if (!term) return true;
      return (
        exam.title.toLowerCase().includes(term) || exam.subjectName.toLowerCase().includes(term)
      );
    });
  }, [examsQuery.data, keyword, statusFilter]);

  const columns: Column<Exam>[] = [
    {
      id: 'title',
      header: 'Kỳ thi',
      cell: (exam) => (
        <div className="min-w-0">
          <Link to={`/exams/${exam.id}`} className="font-medium text-ink hover:text-chalk">
            {exam.title}
          </Link>
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
      hideBelow: 'md',
      cell: (exam) => (
        <span className="tabular text-sm text-slate">
          {formatDateTime(exam.startTime)} → {formatDateTime(exam.endTime)}
        </span>
      ),
    },
    {
      id: 'meta',
      header: 'Cấu trúc',
      hideBelow: 'lg',
      cell: (exam) => (
        <span className="tabular text-sm text-slate">
          {exam.totalQuestions} câu · {exam.totalVariants} đề · {exam.duration} phút · tối đa {exam.maxAttempts} lượt
        </span>
      ),
    },
    {
      id: 'participants',
      header: 'Thí sinh',
      hideBelow: 'sm',
      cell: (exam) => <span className="tabular text-sm text-slate">{exam.participantCount}</span>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      cell: (exam) => (
        <div className="flex justify-end gap-1">
          {exam.status === 'UPCOMING' ? (
            <>
              <Button variant="ghost" size="icon-sm" asChild aria-label={`Sửa kỳ thi ${exam.title}`}>
                <Link to={`/exams/${exam.id}/edit`}>
                  <Pencil className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Xoá kỳ thi ${exam.title}`}
                onClick={() => setDeletingExam(exam)}
              >
                <Trash2 className="size-4 text-pen" aria-hidden="true" />
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kỳ thi"
        description="Mỗi kỳ thi có thời gian bắt đầu, kết thúc và danh sách thí sinh riêng."
        actions={
          <Button asChild>
            <Link to="/exams/new">
              <Plus className="size-4" aria-hidden="true" />
              Tạo kỳ thi
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1 space-y-1.5">
          <Label htmlFor="exam-search">Tìm theo tên kỳ thi hoặc môn học</Label>
          <Input
            id="exam-search"
            value={keyword}
            placeholder="Nhập từ khoá…"
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exam-status">Trạng thái</Label>
          <select
            id="exam-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-9 rounded-md border border-input bg-paper-raised px-3 text-sm text-ink"
          >
            <option value="ALL">Tất cả</option>
            <option value="UPCOMING">Sắp diễn ra</option>
            <option value="ONGOING">Đang diễn ra</option>
            <option value="COMPLETED">Đã kết thúc</option>
          </select>
        </div>
      </div>

      {examsQuery.isPending ? (
        <p className="text-sm text-slate">Đang tải danh sách kỳ thi…</p>
      ) : examsQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(examsQuery.error)}
          onRetry={() => void examsQuery.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Không có kỳ thi phù hợp"
          description="Tạo kỳ thi đầu tiên để bắt đầu cho học sinh."
          action={
            <Button asChild>
              <Link to="/exams/new">
                <Plus className="size-4" aria-hidden="true" />
                Tạo kỳ thi
              </Link>
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(exam) => exam.id} />
      )}

      <AlertDialog
        open={Boolean(deletingExam)}
        onOpenChange={(open) => !open && setDeletingExam(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá kỳ thi này?</AlertDialogTitle>
            <AlertDialogDescription>
              Kỳ thi “{deletingExam?.title}” sẽ bị xoá. Chỉ kỳ thi chưa bắt đầu mới xoá được.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingExam) deleteExam.mutate(deletingExam.id);
              }}
            >
              Xoá kỳ thi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
