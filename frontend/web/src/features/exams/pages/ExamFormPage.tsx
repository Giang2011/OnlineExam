import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
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
import { ErrorState } from '@/shared/components/ErrorState';
import { toDateTimeLocal, toIsoString } from '@/shared/utils/format';
import { getApiErrorMessage } from '@/shared/lib/error-handler';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';
import { useCreateExam, useExam, useUpdateExam } from '@/features/exams/hooks/useExams';
import type { ChapterConfig, Exam, ExamRequest } from '@/features/exams/types';

interface ChapterDraft {
  chapterId: number;
  questionCount: number;
}

export function ExamFormPage() {
  const { examId } = useParams();
  const id = examId ? Number(examId) : null;

  const examQuery = useExam(id);

  if (id === null) {
    return <ExamForm exam={null} />;
  }

  if (examQuery.isPending) {
    return <p className="text-sm text-slate">Đang tải kỳ thi…</p>;
  }

  if (examQuery.isError) {
    return (
      <ErrorState
        message={getApiErrorMessage(examQuery.error)}
        onRetry={() => void examQuery.refetch()}
      />
    );
  }

  // Key theo id để state của form khởi tạo lại khi đổi kỳ thi.
  return <ExamForm key={id} exam={examQuery.data ?? null} />;
}

function ExamForm({ exam }: { exam: Exam | null }) {
  const navigate = useNavigate();
  const isEdit = exam !== null;

  const subjectsQuery = useSubjects();
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();

  const [title, setTitle] = useState(exam?.title ?? '');
  const [subjectId, setSubjectId] = useState<number | ''>(exam?.subjectId ?? '');
  const [duration, setDuration] = useState(exam?.duration ?? 60);
  const [totalQuestions, setTotalQuestions] = useState(exam?.totalQuestions ?? 10);
  const [totalVariants, setTotalVariants] = useState(exam?.totalVariants ?? 1);
  const [maxAttempts, setMaxAttempts] = useState(exam?.maxAttempts ?? 1);
  const [startTime, setStartTime] = useState(exam ? toDateTimeLocal(exam.startTime) : '');
  const [endTime, setEndTime] = useState(exam ? toDateTimeLocal(exam.endTime) : '');
  // chapterConfigs không có trong ExamResponseDTO — người dùng phải khai báo lại.
  const [chapterConfigs, setChapterConfigs] = useState<ChapterDraft[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const subjects = useMemo(() => subjectsQuery.data ?? [], [subjectsQuery.data]);
  const chapters = useMemo(
    () => subjects.find((subject) => subject.id === subjectId)?.chapters ?? [],
    [subjects, subjectId],
  );

  const sumConfigured = chapterConfigs.reduce((sum, config) => sum + (config.questionCount || 0), 0);
  const sumMatchesTotal = sumConfigured === totalQuestions;
  const overCapacity = chapterConfigs.some((config) => {
    const chapter = chapters.find((item) => item.id === config.chapterId);
    return chapter ? config.questionCount > chapter.questionCount : false;
  });

  const canSubmit =
    title.trim().length > 0 &&
    subjectId !== '' &&
    chapterConfigs.length > 0 &&
    sumMatchesTotal &&
    !overCapacity &&
    totalVariants >= 1 &&
    maxAttempts >= 1 &&
    startTime !== '' &&
    endTime !== '' &&
    new Date(startTime) < new Date(endTime);

  const buildRequest = (): ExamRequest => ({
    title: title.trim(),
    subjectId: subjectId as number,
    duration,
    totalQuestions,
    totalVariants,
    maxAttempts,
    chapterConfigs: chapterConfigs.map<ChapterConfig>((config) => ({
      chapterId: config.chapterId,
      questionCount: config.questionCount,
    })),
    startTime: toIsoString(startTime),
    endTime: toIsoString(endTime),
  });

  const submit = async () => {
    setServerError(null);
    try {
      if (exam) {
        await updateExam.mutateAsync({ id: exam.id, payload: buildRequest() });
        navigate(`/exams/${exam.id}`);
      } else {
        const created = await createExam.mutateAsync(buildRequest());
        navigate(`/exams/${created.id}`);
      }
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Không lưu được kỳ thi.'));
      setConfirmOpen(false);
    }
  };

  const handleSubmitClick = () => {
    if (isEdit) {
      setConfirmOpen(true);
      return;
    }
    void submit();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Sửa kỳ thi' : 'Tạo kỳ thi'}
        description={
          isEdit
            ? 'Chỉ kỳ thi chưa bắt đầu mới sửa được. Đổi cấu hình chương sẽ sinh lại toàn bộ đề thi.'
            : 'Chọn số câu cho từng chương. Hệ thống sẽ sinh các đề đã tráo câu hỏi.'
        }
      />

      {exam && exam.status !== 'UPCOMING' ? (
        <p className="rounded-md border border-pen/30 bg-pen-wash px-4 py-3 text-sm text-pen" role="alert">
          Kỳ thi đã {exam.status === 'ONGOING' ? 'bắt đầu' : 'kết thúc'} nên không thể sửa cấu hình.
        </p>
      ) : null}

      <form
        className="max-w-3xl space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmitClick();
        }}
        noValidate
      >
        <section className="space-y-4 rounded-md border border-rule bg-paper-raised p-5">
          <h2 className="text-base font-semibold text-ink">Thông tin chung</h2>

          <div className="space-y-1.5">
            <Label htmlFor="exam-title">Tên kỳ thi</Label>
            <Input
              id="exam-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Kiểm tra giữa kỳ — Toán cao cấp"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="exam-subject">Môn học</Label>
              <select
                id="exam-subject"
                value={subjectId}
                onChange={(event) => {
                  setSubjectId(event.target.value ? Number(event.target.value) : '');
                  setChapterConfigs([]);
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
              <Label htmlFor="exam-duration">Thời lượng (phút)</Label>
              <Input
                id="exam-duration"
                type="number"
                min={1}
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exam-total">Tổng số câu</Label>
              <Input
                id="exam-total"
                type="number"
                min={1}
                value={totalQuestions}
                onChange={(event) => setTotalQuestions(Number(event.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exam-variants">Số đề sinh ra</Label>
              <Input
                id="exam-variants"
                type="number"
                min={1}
                value={totalVariants}
                onChange={(event) => setTotalVariants(Number(event.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exam-attempts">Số lượt thi tối đa</Label>
              <Input
                id="exam-attempts"
                type="number"
                min={1}
                value={maxAttempts}
                onChange={(event) => setMaxAttempts(Number(event.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exam-start">Bắt đầu</Label>
              <Input
                id="exam-start"
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exam-end">Kết thúc</Label>
              <Input
                id="exam-end"
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-md border border-rule bg-paper-raised p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Cấu hình chương</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!subjectId}
              onClick={() =>
                setChapterConfigs((current) => [
                  ...current,
                  { chapterId: chapters[0]?.id ?? 0, questionCount: 0 },
                ])
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              Thêm chương
            </Button>
          </div>

          {chapterConfigs.length === 0 ? (
            <p className="text-sm text-slate">
              {subjectId
                ? 'Thêm từng chương và chỉ số câu lấy từ chương đó.'
                : 'Chọn môn học trước để chọn chương.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {chapterConfigs.map((config, index) => {
                const chapter = chapters.find((item) => item.id === config.chapterId);
                const tooMany = chapter ? config.questionCount > chapter.questionCount : false;
                return (
                  <li key={index} className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[200px] flex-1 space-y-1.5">
                      <Label htmlFor={`chapter-${index}`}>Chương</Label>
                      <select
                        id={`chapter-${index}`}
                        value={config.chapterId}
                        onChange={(event) =>
                          setChapterConfigs((current) =>
                            current.map((item, i) =>
                              i === index ? { ...item, chapterId: Number(event.target.value) } : item,
                            ),
                          )
                        }
                        className="h-9 w-full rounded-md border border-input bg-paper-raised px-3 text-sm text-ink"
                      >
                        {chapters.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32 space-y-1.5">
                      <Label htmlFor={`count-${index}`}>Số câu</Label>
                      <Input
                        id={`count-${index}`}
                        type="number"
                        min={0}
                        value={config.questionCount}
                        onChange={(event) =>
                          setChapterConfigs((current) =>
                            current.map((item, i) =>
                              i === index ? { ...item, questionCount: Number(event.target.value) } : item,
                            ),
                          )
                        }
                      />
                    </div>
                    <p className="tabular pb-2 text-xs text-slate">
                      {chapter ? `Có sẵn ${chapter.questionCount} câu` : ''}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mb-0.5"
                      aria-label="Bỏ chương khỏi cấu hình"
                      onClick={() =>
                        setChapterConfigs((current) => current.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="size-4 text-pen" aria-hidden="true" />
                    </Button>
                    {tooMany ? (
                      <p className="w-full text-xs text-pen">
                        Chương này chỉ có {chapter?.questionCount} câu, không thể lấy {config.questionCount} câu.
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              sumMatchesTotal
                ? 'border-jade/40 bg-jade-wash text-jade'
                : 'border-pen/30 bg-pen-wash text-pen'
            }`}
            role="status"
          >
            Tổng câu đã cấu hình: {sumConfigured} / {totalQuestions}
            {sumMatchesTotal ? ' — khớp.' : ' — chưa khớp tổng số câu của kỳ thi.'}
          </div>
        </section>

        {serverError ? (
          <p className="rounded-md border border-pen/30 bg-pen-wash px-3 py-2 text-sm text-pen" role="alert">
            {serverError}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={!canSubmit || createExam.isPending || updateExam.isPending}
          >
            {isEdit ? 'Lưu kỳ thi' : 'Tạo kỳ thi'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
      </form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sinh lại đề thi?</AlertDialogTitle>
            <AlertDialogDescription>
              Đổi cấu hình chương sẽ sinh lại toàn bộ đề thi — thí sinh sẽ thi đề mới. Chỉ làm thao tác này khi kỳ thi
              chưa bắt đầu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submit()}>
              {updateExam.isPending ? 'Đang lưu…' : 'Sinh lại đề và lưu'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
