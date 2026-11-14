import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/lib/ui/dialog';
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
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { cn } from '@/shared/utils/cn';
import { getApiErrorMessage } from '@/shared/lib/error-handler';
import {
  useCreateChapter,
  useCreateSubject,
  useDeleteChapter,
  useDeleteSubject,
  useSubjects,
  useUpdateChapter,
  useUpdateSubject,
} from '@/features/subjects/hooks/useSubjects';
import type { Chapter, Subject } from '@/features/subjects/types';

const nameSchema = z.object({ name: z.string().trim().min(1, 'Nhập tên.') });
type NameFormValues = z.infer<typeof nameSchema>;

export function SubjectListPage() {
  const subjectsQuery = useSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Môn học"
        description="Mỗi môn học gồm các chương; câu hỏi và kỳ thi đều gắn với chương."
        actions={
          <Button onClick={() => setSubjectDialogOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Thêm môn học
          </Button>
        }
      />

      {subjectsQuery.isPending ? (
        <p className="text-sm text-slate">Đang tải danh sách môn học…</p>
      ) : subjectsQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(subjectsQuery.error)}
          onRetry={() => void subjectsQuery.refetch()}
        />
      ) : (subjectsQuery.data?.length ?? 0) === 0 ? (
        <EmptyState
          title="Chưa có môn học nào"
          description="Tạo môn học đầu tiên, rồi thêm chương cho từng môn."
          action={
            <Button onClick={() => setSubjectDialogOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Thêm môn học
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {subjectsQuery.data?.map((subject) => (
            <li key={subject.id} className="rounded-md border border-rule bg-paper-raised">
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => setExpandedId((current) => (current === subject.id ? null : subject.id))}
                  aria-expanded={expandedId === subject.id}
                >
                  {expandedId === subject.id ? (
                    <ChevronDown className="size-4 shrink-0 text-slate" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-slate" aria-hidden="true" />
                  )}
                  <span className="truncate font-medium text-ink">{subject.name}</span>
                  <span className="tabular shrink-0 text-sm text-slate">
                    {subject.chapters.length} chương ·{' '}
                    {subject.chapters.reduce((sum, chapter) => sum + chapter.questionCount, 0)} câu
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Sửa môn ${subject.name}`}
                  onClick={() => setEditingSubject(subject)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Xoá môn ${subject.name}`}
                  onClick={() => setDeletingSubject(subject)}
                >
                  <Trash2 className="size-4 text-pen" aria-hidden="true" />
                </Button>
              </div>

              {expandedId === subject.id ? (
                <ChapterPanel subject={subject} />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <NameDialog
        open={subjectDialogOpen}
        onOpenChange={setSubjectDialogOpen}
        title="Thêm môn học"
        description="Tên môn học sẽ hiển thị trong bộ lọc của ngân hàng câu hỏi và kỳ thi."
        onSubmit={(values) => createSubject.mutateAsync(values)}
        submitLabel="Tạo môn học"
      />

      <NameDialog
        open={Boolean(editingSubject)}
        onOpenChange={(open) => !open && setEditingSubject(null)}
        title="Sửa môn học"
        description="Đổi tên môn học. Các chương bên trong được giữ nguyên."
        defaultName={editingSubject?.name ?? ''}
        onSubmit={(values) => {
          if (!editingSubject) return Promise.resolve();
          return updateSubject.mutateAsync({ id: editingSubject.id, payload: values });
        }}
        submitLabel="Lưu thay đổi"
      />

      <AlertDialog
        open={Boolean(deletingSubject)}
        onOpenChange={(open) => !open && setDeletingSubject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá môn học này?</AlertDialogTitle>
            <AlertDialogDescription>
              Môn “{deletingSubject?.name}” và các chương bên trong sẽ bị xoá. Câu hỏi thuộc môn vẫn còn dữ liệu
              nhưng không hiển thị trong bộ lọc.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingSubject) deleteSubject.mutate(deletingSubject.id);
              }}
            >
              Xoá môn học
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ChapterPanel({ subject }: { subject: Subject }) {
  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null);

  return (
    <div className="border-t border-rule bg-paper px-4 py-3">
      {subject.chapters.length === 0 ? (
        <p className="text-sm text-slate">Môn này chưa có chương nào.</p>
      ) : (
        <ul className="space-y-1.5">
          {subject.chapters.map((chapter) => (
            <li key={chapter.id} className="flex items-center gap-2 rounded-md bg-paper-raised px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{chapter.name}</span>
              <span className="tabular shrink-0 text-sm text-slate">{chapter.questionCount} câu</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Sửa chương ${chapter.name}`}
                onClick={() => setEditingChapter(chapter)}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Xoá chương ${chapter.name}`}
                onClick={() => setDeletingChapter(chapter)}
              >
                <Trash2 className="size-4 text-pen" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="outline" size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Thêm chương
      </Button>

      <NameDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Thêm chương"
        description={`Thuộc môn “${subject.name}”.`}
        onSubmit={(values) => createChapter.mutateAsync({ subjectId: subject.id, payload: values })}
        submitLabel="Thêm chương"
      />

      <NameDialog
        open={Boolean(editingChapter)}
        onOpenChange={(open) => !open && setEditingChapter(null)}
        title="Sửa chương"
        defaultName={editingChapter?.name ?? ''}
        onSubmit={(values) => {
          if (!editingChapter) return Promise.resolve();
          return updateChapter.mutateAsync({
            subjectId: subject.id,
            chapterId: editingChapter.id,
            payload: values,
          });
        }}
        submitLabel="Lưu thay đổi"
      />

      <AlertDialog
        open={Boolean(deletingChapter)}
        onOpenChange={(open) => !open && setDeletingChapter(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá chương này?</AlertDialogTitle>
            <AlertDialogDescription>
              Chương “{deletingChapter?.name}” sẽ bị xoá. Câu hỏi thuộc chương sẽ không còn chương để gán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingChapter) {
                  deleteChapter.mutate({ subjectId: subject.id, chapterId: deletingChapter.id });
                }
              }}
            >
              Xoá chương
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NameDialog({
  open,
  onOpenChange,
  title,
  description,
  defaultName = '',
  onSubmit,
  submitLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  defaultName?: string;
  onSubmit: (values: NameFormValues) => Promise<unknown>;
  submitLabel: string;
}) {
  // Key theo tên mặc định để state reset khi mở với giá trị khác.
  return (
    <NameDialogForm
      key={`${title}-${defaultName}`}
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      defaultName={defaultName}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
    />
  );
}

function NameDialogForm({
  open,
  onOpenChange,
  title,
  description,
  defaultName,
  onSubmit,
  submitLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  defaultName: string;
  onSubmit: (values: NameFormValues) => Promise<unknown>;
  submitLabel: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: defaultName },
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(values);
      reset({ name: '' });
      onOpenChange(false);
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Thao tác không thành công.'));
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset({ name: defaultName });
          setServerError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor={`name-${title}`}>Tên</Label>
            <Input
              id={`name-${title}`}
              className={cn(defaultName ? '' : undefined)}
              aria-invalid={errors.name ? 'true' : undefined}
              {...register('name')}
            />
            {errors.name ? <p className="text-xs text-pen">{errors.name.message}</p> : null}
          </div>

          {serverError ? (
            <p className="rounded-md border border-pen/30 bg-pen-wash px-3 py-2 text-sm text-pen" role="alert">
              {serverError}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
