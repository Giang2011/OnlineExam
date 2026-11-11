import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ScanLine, Trash2 } from 'lucide-react';
import { Button } from '@/lib/ui/button';
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
import { useDeletePaperExam, usePaperExams } from '@/features/paper-exams/hooks/usePaperExams';
import type { PaperExam } from '@/features/paper-exams/types';

export function PaperExamListPage() {
  const paperExamsQuery = usePaperExams();
  const deletePaperExam = useDeletePaperExam();
  const [deletingPaperExam, setDeletingPaperExam] = useState<PaperExam | null>(null);

  const rows = useMemo(() => paperExamsQuery.data ?? [], [paperExamsQuery.data]);

  const columns: Column<PaperExam>[] = [
    {
      id: 'title',
      header: 'Đề giấy',
      cell: (paperExam) => (
        <div className="min-w-0">
          <Link
            to={`/paper-exams/${paperExam.id}`}
            className="font-medium text-ink hover:text-chalk"
          >
            {paperExam.title}
          </Link>
          <p className="mt-0.5 text-xs text-slate">{paperExam.subjectName}</p>
        </div>
      ),
    },
    {
      id: 'structure',
      header: 'Cấu trúc',
      hideBelow: 'sm',
      cell: (paperExam) => (
        <span className="tabular text-sm text-slate">
          {paperExam.totalQuestions} câu · {paperExam.durationMinutes} phút · {paperExam.omrPageCount} trang phiếu
        </span>
      ),
    },
    {
      id: 'omr',
      header: 'Phiếu OMR',
      hideBelow: 'md',
      cell: (paperExam) => (
        <span className="tabular text-sm text-slate">
          {paperExam.omrQuestionsPerPage} câu/trang · tối đa {paperExam.omrChoicesPerQ} lựa chọn
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Ngày tạo',
      hideBelow: 'lg',
      cell: (paperExam) => (
        <span className="tabular text-sm text-slate">{formatDateTime(paperExam.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      cell: (paperExam) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" asChild aria-label={`Quét phiếu ${paperExam.title}`}>
            <Link to={`/paper-exams/${paperExam.id}/scan`}>
              <ScanLine className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Xoá đề giấy ${paperExam.title}`}
            onClick={() => setDeletingPaperExam(paperExam)}
          >
            <Trash2 className="size-4 text-pen" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đề giấy và phiếu OMR"
        description="Tạo đề giấy, in phiếu trả lời và chấm điểm bằng ảnh scan."
        actions={
          <Button asChild>
            <Link to="/paper-exams/new">
              <Plus className="size-4" aria-hidden="true" />
              Tạo đề giấy
            </Link>
          </Button>
        }
      />

      {paperExamsQuery.isPending ? (
        <p className="text-sm text-slate">Đang tải đề giấy…</p>
      ) : paperExamsQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(paperExamsQuery.error)}
          onRetry={() => void paperExamsQuery.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Chưa có đề giấy nào"
          description="Tạo đề giấy để in ra phiếu trả lời OMR và chấm điểm bằng ảnh."
          action={
            <Button asChild>
              <Link to="/paper-exams/new">
                <Plus className="size-4" aria-hidden="true" />
                Tạo đề giấy
              </Link>
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(paperExam) => paperExam.id} />
      )}

      <AlertDialog
        open={Boolean(deletingPaperExam)}
        onOpenChange={(open) => !open && setDeletingPaperExam(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá đề giấy này?</AlertDialogTitle>
            <AlertDialogDescription>
              Đề “{deletingPaperExam?.title}” sẽ bị xoá. Kết quả scan đã lưu vẫn còn trong cơ sở dữ liệu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingPaperExam) deletePaperExam.mutate(deletingPaperExam.id);
              }}
            >
              Xoá đề giấy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
