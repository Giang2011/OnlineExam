import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Checkbox } from '@/lib/ui/checkbox';
import { PageHeader } from '@/shared/components/PageHeader';
import { DataTable, type Column } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { Pagination } from '@/shared/components/Pagination';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { resolveUploadUrl } from '@/shared/lib/upload-url';
import { getApiErrorMessage } from '@/shared/lib/error-handler';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';
import { useCreateQuestion, useDeleteQuestion, useQuestions, useUpdateQuestion } from '@/features/questions/hooks/useQuestions';
import { ImagePicker } from '@/features/questions/components/ImagePicker';
import type { Question, QuestionRequest } from '@/features/questions/types';

const PAGE_SIZE = 20;

export function QuestionListPage() {
  const [keyword, setKeyword] = useState('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [chapterId, setChapterId] = useState<number | ''>('');
  const [page, setPage] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

  const debouncedKeyword = useDebounce(keyword);

  const params = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      ...(subjectId ? { subjectId } : {}),
      ...(chapterId ? { chapterId } : {}),
      ...(debouncedKeyword.trim() ? { keyword: debouncedKeyword.trim() } : {}),
    }),
    [page, subjectId, chapterId, debouncedKeyword],
  );

  const questionsQuery = useQuestions(params);
  const deleteQuestion = useDeleteQuestion();

  const rows = questionsQuery.data?.content ?? [];

  const columns: Column<Question>[] = [
    {
      id: 'content',
      header: 'Nội dung',
      cell: (question) => (
        <div className="flex items-start gap-3">
          {question.imageUrl ? (
            <img
              src={resolveUploadUrl(question.imageUrl) ?? undefined}
              alt=""
              className="h-10 w-10 shrink-0 rounded border border-rule bg-paper object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="font-document line-clamp-2 text-ink">{question.content}</p>
            <p className="mt-0.5 text-xs text-slate">
              {question.subjectName} · {question.chapterName}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'answers',
      header: 'Đáp án',
      hideBelow: 'md',
      cell: (question) => (
        <span className="tabular text-sm text-slate">
          {question.answers.length} đáp án · {question.answers.filter((answer) => answer.isCorrect).length} đúng
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Ngày tạo',
      hideBelow: 'lg',
      cell: (question) => <span className="tabular text-sm text-slate">{question.createdAt.slice(0, 10)}</span>,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Thao tác</span>,
      cell: (question) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Sửa câu hỏi"
            onClick={() => {
              setEditingQuestion(question);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Xoá câu hỏi"
            onClick={() => setDeletingQuestion(question)}
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
        title="Ngân hàng câu hỏi"
        description="Câu hỏi thuộc chương của một môn học và dùng để sinh đề cho kỳ thi."
        actions={
          <Button
            onClick={() => {
              setEditingQuestion(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Thêm câu hỏi
          </Button>
        }
      />

      <QuestionFilters
        keyword={keyword}
        onKeywordChange={(value) => {
          setKeyword(value);
          setPage(0);
        }}
        subjectId={subjectId}
        onSubjectIdChange={(value) => {
          setSubjectId(value);
          setChapterId('');
          setPage(0);
        }}
        chapterId={chapterId}
        onChapterIdChange={(value) => {
          setChapterId(value);
          setPage(0);
        }}
      />

      {questionsQuery.isPending ? (
        <p className="text-sm text-slate">Đang tải câu hỏi…</p>
      ) : questionsQuery.isError ? (
        <ErrorState
          message={getApiErrorMessage(questionsQuery.error)}
          onRetry={() => void questionsQuery.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Không có câu hỏi phù hợp"
          description="Thử đổi bộ lọc hoặc tạo câu hỏi mới cho chương đã chọn."
          action={
            <Button
              onClick={() => {
                setEditingQuestion(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Thêm câu hỏi
            </Button>
          }
        />
      ) : (
        <>
          <DataTable columns={columns} rows={rows} rowKey={(question) => question.id} />
          <Pagination
            page={questionsQuery.data?.number ?? 0}
            totalPages={questionsQuery.data?.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}

      <QuestionFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingQuestion(null);
        }}
        question={editingQuestion}
      />

      <AlertDialog
        open={Boolean(deletingQuestion)}
        onOpenChange={(open) => !open && setDeletingQuestion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá câu hỏi này?</AlertDialogTitle>
            <AlertDialogDescription>
              Câu hỏi sẽ bị xoá khỏi ngân hàng và không còn dùng cho các kỳ thi sắp tạo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingQuestion) deleteQuestion.mutate(deletingQuestion.id);
              }}
            >
              Xoá câu hỏi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function QuestionFilters({
  keyword,
  onKeywordChange,
  subjectId,
  onSubjectIdChange,
  chapterId,
  onChapterIdChange,
}: {
  keyword: string;
  onKeywordChange: (value: string) => void;
  subjectId: number | '';
  onSubjectIdChange: (value: number | '') => void;
  chapterId: number | '';
  onChapterIdChange: (value: number | '') => void;
}) {
  const subjectsQuery = useSubjects();
  const subjects = subjectsQuery.data ?? [];
  const chapters = subjects.find((subject) => subject.id === subjectId)?.chapters ?? [];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[220px] flex-1 space-y-1.5">
        <Label htmlFor="question-search">Tìm trong nội dung câu hỏi</Label>
        <Input
          id="question-search"
          value={keyword}
          placeholder="Nhập từ khoá…"
          onChange={(event) => onKeywordChange(event.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="question-subject">Môn học</Label>
        <select
          id="question-subject"
          value={subjectId}
          onChange={(event) => onSubjectIdChange(event.target.value ? Number(event.target.value) : '')}
          className="h-9 rounded-md border border-input bg-paper-raised px-3 text-sm text-ink"
        >
          <option value="">Tất cả</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="question-chapter">Chương</Label>
        <select
          id="question-chapter"
          value={chapterId}
          disabled={!subjectId}
          onChange={(event) => onChapterIdChange(event.target.value ? Number(event.target.value) : '')}
          className="h-9 rounded-md border border-input bg-paper-raised px-3 text-sm text-ink disabled:opacity-50"
        >
          <option value="">Tất cả</option>
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface AnswerDraft {
  content: string;
  isCorrect: boolean;
  imageFile: File | null;
  imageRemoved: boolean;
  existingImageUrl: string | null;
}

function QuestionFormDialog({
  open,
  onOpenChange,
  question,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
}) {
  // Key theo id để state của form khởi tạo lại khi đổi câu hỏi.
  return (
    <QuestionFormBody
      key={question?.id ?? 'new'}
      open={open}
      onOpenChange={onOpenChange}
      question={question}
    />
  );
}

function QuestionFormBody({
  open,
  onOpenChange,
  question,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
}) {
  const subjectsQuery = useSubjects();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();

  const [content, setContent] = useState(question?.content ?? '');
  const [subjectId, setSubjectId] = useState<number | ''>(question?.subjectId ?? '');
  const [chapterId, setChapterId] = useState<number | ''>(question?.chapterId ?? '');
  const [answers, setAnswers] = useState<AnswerDraft[]>(
    question
      ? question.answers.map((answer) => ({
          content: answer.content,
          isCorrect: answer.isCorrect,
          imageFile: null,
          imageRemoved: false,
          existingImageUrl: answer.imageUrl,
        }))
      : [
          { content: '', isCorrect: false, imageFile: null, imageRemoved: false, existingImageUrl: null },
          { content: '', isCorrect: false, imageFile: null, imageRemoved: false, existingImageUrl: null },
        ],
  );
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [questionImageRemoved, setQuestionImageRemoved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const subjects = useMemo(() => subjectsQuery.data ?? [], [subjectsQuery.data]);
  const chapters = useMemo(
    () => subjects.find((subject) => subject.id === subjectId)?.chapters ?? [],
    [subjects, subjectId],
  );

  const updateAnswer = (index: number, patch: Partial<AnswerDraft>) => {
    setAnswers((current) => current.map((answer, i) => (i === index ? { ...answer, ...patch } : answer)));
  };

  const hasCorrect = answers.some((answer) => answer.isCorrect);
  const canSubmit =
    content.trim().length > 0 &&
    subjectId !== '' &&
    chapterId !== '' &&
    answers.length >= 2 &&
    answers.every((answer) => answer.content.trim().length > 0) &&
    hasCorrect;

  const handleSubmit = async () => {
    setServerError(null);
    const request: QuestionRequest = {
      content: content.trim(),
      subjectId: subjectId as number,
      chapterId: chapterId as number,
      ...(questionImageRemoved ? { questionImageRemoved: true } : {}),
      answers: answers.map((answer) => ({
        content: answer.content.trim(),
        isCorrect: answer.isCorrect,
        ...(answer.imageRemoved ? { imageRemoved: true } : {}),
      })),
    };

    try {
      if (question) {
        await updateQuestion.mutateAsync({
          id: question.id,
          data: request,
          questionImage,
          answerImages: answers.map((answer) => answer.imageFile),
        });
      } else {
        await createQuestion.mutateAsync({
          data: request,
          questionImage,
          answerImages: answers.map((answer) => answer.imageFile),
        });
      }
      onOpenChange(false);
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Không lưu được câu hỏi.'));
    }
  };
  const isPending = createQuestion.isPending || updateQuestion.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{question ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}</DialogTitle>
          <DialogDescription>
            Có thể đánh dấu nhiều đáp án đúng. Câu hỏi cần ít nhất 2 đáp án và ít nhất 1 đáp án đúng.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="question-content">Nội dung câu hỏi</Label>
            <textarea
              id="question-content"
              value={content}
              rows={3}
              onChange={(event) => setContent(event.target.value)}
              className="font-document w-full rounded-md border border-input bg-paper-raised px-3 py-2 text-sm text-ink"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="form-subject">Môn học</Label>
              <select
                id="form-subject"
                value={subjectId}
                onChange={(event) => {
                  setSubjectId(event.target.value ? Number(event.target.value) : '');
                  setChapterId('');
                }}
                className="h-9 w-full rounded-md border border-input bg-paper-raised px-3 text-sm text-ink"
              >
                <option value="">Chọn môn học</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="form-chapter">Chương</Label>
              <select
                id="form-chapter"
                value={chapterId}
                disabled={!subjectId}
                onChange={(event) => setChapterId(event.target.value ? Number(event.target.value) : '')}
                className="h-9 w-full rounded-md border border-input bg-paper-raised px-3 text-sm text-ink disabled:opacity-50"
              >
                <option value="">Chọn chương</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ImagePicker
            label="Ảnh minh hoạ câu hỏi"
            currentUrl={question?.imageUrl}
            file={questionImage}
            removed={questionImageRemoved}
            onFileChange={setQuestionImage}
            onRemovedChange={setQuestionImageRemoved}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">Đáp án</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setAnswers((current) => [
                    ...current,
                    { content: '', isCorrect: false, imageFile: null, imageRemoved: false, existingImageUrl: null },
                  ])
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                Thêm đáp án
              </Button>
            </div>

            {answers.map((answer, index) => (
              <div key={index} className="space-y-3 rounded-md border border-rule p-3">
                <div className="flex items-start gap-3">
                  <label className="flex shrink-0 items-center gap-2 pt-2 text-sm text-ink">
                    <Checkbox
                      checked={answer.isCorrect}
                      aria-label={`Đáp án ${index + 1} là đáp án đúng`}
                      onCheckedChange={(checked) => updateAnswer(index, { isCorrect: checked === true })}
                    />
                    Đúng
                  </label>
                  <Input
                    value={answer.content}
                    placeholder={`Nội dung đáp án ${index + 1}`}
                    onChange={(event) => updateAnswer(index, { content: event.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Xoá đáp án ${index + 1}`}
                    disabled={answers.length <= 2}
                    onClick={() => setAnswers((current) => current.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4 text-pen" aria-hidden="true" />
                  </Button>
                </div>
                <ImagePicker
                  label={`Ảnh đáp án ${index + 1}`}
                  currentUrl={answer.existingImageUrl}
                  file={answer.imageFile}
                  removed={answer.imageRemoved}
                  onFileChange={(file) => updateAnswer(index, { imageFile: file })}
                  onRemovedChange={(removed) => updateAnswer(index, { imageRemoved: removed })}
                />
              </div>
            ))}

            {!hasCorrect ? (
              <p className="text-xs text-pen">Cần đánh dấu ít nhất một đáp án đúng.</p>
            ) : null}
          </div>

          {serverError ? (
            <p className="rounded-md border border-pen/30 bg-pen-wash px-3 py-2 text-sm text-pen" role="alert">
              {serverError}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button type="button" disabled={!canSubmit || isPending} onClick={() => void handleSubmit()}>
            {isPending ? 'Đang lưu…' : question ? 'Lưu câu hỏi' : 'Tạo câu hỏi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
