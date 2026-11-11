import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { PageHeader } from '@/shared/components/PageHeader';
import { getApiErrorMessage } from '@/shared/lib/error-handler';
import { useSubjects } from '@/features/subjects/hooks/useSubjects';
import { useCreatePaperExam } from '@/features/paper-exams/hooks/usePaperExams';

interface ChapterDraft {
  chapterId: number;
  questionCount: number;
}

export function PaperExamFormPage() {
  const navigate = useNavigate();
  const subjectsQuery = useSubjects();
  const createPaperExam = useCreatePaperExam();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [chapterConfigs, setChapterConfigs] = useState<ChapterDraft[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const subjects = useMemo(() => subjectsQuery.data ?? [], [subjectsQuery.data]);
  const chapters = useMemo(
    () => subjects.find((subject) => subject.id === subjectId)?.chapters ?? [],
    [subjects, subjectId],
  );

  const sumConfigured = chapterConfigs.reduce((sum, config) => sum + (config.questionCount || 0), 0);
  const overCapacity = chapterConfigs.some((config) => {
    const chapter = chapters.find((item) => item.id === config.chapterId);
    return chapter ? config.questionCount > chapter.questionCount : false;
  });

  const canSubmit =
    title.trim().length > 0 &&
    subjectId !== '' &&
    chapterConfigs.length > 0 &&
    sumConfigured === totalQuestions &&
    !overCapacity &&
    durationMinutes > 0 &&
    totalQuestions > 0;

  const handleSubmit = async () => {
    setServerError(null);
    try {
      const created = await createPaperExam.mutateAsync({
        title: title.trim(),
        subjectId: subjectId as number,
        durationMinutes,
        totalQuestions,
        chapterConfigs: chapterConfigs.map((config) => ({
          chapterId: config.chapterId,
          questionCount: config.questionCount,
        })),
      });
      navigate(`/paper-exams/${created.id}`);
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Không tạo được đề giấy.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tạo đề giấy"
        description="Nội dung đề được đóng băng tại thời điểm tạo, nên sửa câu hỏi gốc sau đó không làm đề và phiếu lệch nhau."
      />

      <div className="max-w-3xl space-y-6">
        <section className="space-y-4 rounded-md border border-rule bg-paper-raised p-5">
          <h2 className="text-base font-semibold text-ink">Thông tin đề</h2>

          <div className="space-y-1.5">
            <Label htmlFor="paper-title">Tiêu đề</Label>
            <Input
              id="paper-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Đề giữa kỳ — Toán cao cấp"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="paper-subject">Môn học</Label>
              <select
                id="paper-subject"
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
              <Label htmlFor="paper-duration">Thời lượng (phút)</Label>
              <Input
                id="paper-duration"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="paper-total">Tổng số câu</Label>
              <Input
                id="paper-total"
                type="number"
                min={1}
                value={totalQuestions}
                onChange={(event) => setTotalQuestions(Number(event.target.value))}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-md border border-rule bg-paper-raised p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Cấu hình chương</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!subjectId || chapters.length === 0}
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
              {subjectId ? 'Chọn số câu cho từng chương.' : 'Chọn môn học trước để chọn chương.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {chapterConfigs.map((config, index) => {
                const chapter = chapters.find((item) => item.id === config.chapterId);
                const tooMany = chapter ? config.questionCount > chapter.questionCount : false;
                return (
                  <li key={index} className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[200px] flex-1 space-y-1.5">
                      <Label htmlFor={`paper-chapter-${index}`}>Chương</Label>
                      <select
                        id={`paper-chapter-${index}`}
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
                      <Label htmlFor={`paper-count-${index}`}>Số câu</Label>
                      <Input
                        id={`paper-count-${index}`}
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
                      onClick={() => setChapterConfigs((current) => current.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="size-4 text-pen" aria-hidden="true" />
                    </Button>
                    {tooMany ? (
                      <p className="w-full text-xs text-pen">
                        Chương này chỉ có {chapter?.questionCount} câu.
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              sumConfigured === totalQuestions
                ? 'border-jade/40 bg-jade-wash text-jade'
                : 'border-pen/30 bg-pen-wash text-pen'
            }`}
            role="status"
          >
            Tổng câu đã cấu hình: {sumConfigured} / {totalQuestions}
          </div>
        </section>

        {serverError ? (
          <p className="rounded-md border border-pen/30 bg-pen-wash px-3 py-2 text-sm text-pen" role="alert">
            {serverError}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button type="button" disabled={!canSubmit || createPaperExam.isPending} onClick={() => void handleSubmit()}>
            {createPaperExam.isPending ? 'Đang tạo…' : 'Tạo đề giấy'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
      </div>
    </div>
  );
}
