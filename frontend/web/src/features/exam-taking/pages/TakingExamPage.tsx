import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, Send, WifiOff } from 'lucide-react';
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
import { ErrorState } from '@/shared/components/ErrorState';
import { cn } from '@/shared/utils/cn';
import { formatDuration } from '@/shared/utils/format';
import { resolveUploadUrl } from '@/shared/lib/upload-url';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { useExamTaking } from '@/features/exam-taking/hooks/useExamTaking';
import { OmrNavigator } from '@/features/exam-taking/components/OmrNavigator';

export function TakingExamPage() {
  const { sessionId } = useParams();
  const id = sessionId ? Number(sessionId) : null;
  const online = useOnlineStatus();

  const state = useExamTaking(id ?? 0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const questions = useMemo(() => state.questions ?? [], [state.questions]);
  const current = questions[state.currentIndex];

  const answeredIndexes = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((question, index) => {
      const selected = state.answers.get(question.variantQuestionId);
      if (selected && selected.length > 0) set.add(index);
    });
    return set;
  }, [questions, state.answers]);

  useEffect(() => {
    if (state.currentIndex > questions.length - 1 && questions.length > 0) {
      state.setCurrentIndex(questions.length - 1);
    }
  }, [state, questions.length]);

  if (!id) return null;

  if (state.remainingSeconds <= 0 && state.answeredCount >= 0 && !state.isSubmitting) {
    // Đồng hồ hết giờ -> hook tự nộp. Giữ màn hình trong lúc chờ.
  }

  const lowTime = state.remainingSeconds > 0 && state.remainingSeconds < 300;

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-rule bg-paper-raised">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">
              {state.examTitle || 'Đang tải đề thi…'}
            </p>
            <p className="tabular text-xs text-slate">
              Đã trả lời {state.answeredCount} / {questions.length}
            </p>
          </div>

          {!online ? (
            <span className="flex items-center gap-1.5 rounded border border-pen/40 bg-pen-wash px-2.5 py-1 text-xs font-medium text-pen">
              <WifiOff className="size-3.5" aria-hidden="true" />
              Mất kết nối
            </span>
          ) : null}

          {state.desynced ? (
            <span className="flex items-center gap-1.5 rounded border border-rule-strong bg-paper-sunken px-2.5 py-1 text-xs text-slate">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              Đồng hồ máy lệch
            </span>
          ) : null}

          <div
            className={cn(
              'tabular flex items-center gap-2 rounded border px-3 py-1.5 text-base font-semibold',
              lowTime ? 'border-pen/40 bg-pen-wash text-pen' : 'border-rule bg-paper text-ink',
            )}
            role="timer"
            aria-live="off"
          >
            {formatDuration(state.remainingSeconds)}
          </div>

          <Button size="sm" disabled={state.isSubmitting} onClick={() => setConfirmOpen(true)}>
            <Send className="size-4" aria-hidden="true" />
            Nộp bài
          </Button>
        </div>
        {lowTime ? (
          <p className="bg-pen-wash px-4 py-1.5 text-center text-xs font-medium text-pen">
            Còn dưới 5 phút. Hệ thống sẽ tự nộp bài khi hết giờ.
          </p>
        ) : null}
      </header>

      <div className="mx-auto grid max-w-[1100px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_280px]">
        <main className="min-w-0">
          {state.questions === undefined ? (
            <p className="text-sm text-slate">Đang tải đề thi…</p>
          ) : questions.length === 0 ? (
            <ErrorState title="Không có câu hỏi" message="Đề thi của phiên này không có câu hỏi nào." />
          ) : current ? (
            <article className="rounded-md border border-rule bg-paper-raised p-5">
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-serif text-lg font-semibold text-ink">
                  Câu {current.orderIndex}
                </h1>
                <span className="shrink-0 text-xs text-slate">
                  {current.isMultipleChoice ? 'Chọn nhiều đáp án' : 'Chọn một đáp án'}
                </span>
              </div>

              <p className="font-document mt-3 text-ink">{current.content}</p>

              {current.imageUrl ? (
                <img
                  src={resolveUploadUrl(current.imageUrl) ?? undefined}
                  alt="Ảnh minh hoạ câu hỏi"
                  className="mt-4 max-h-80 rounded-md border border-rule bg-paper object-contain"
                />
              ) : null}

              <ul className="mt-5 space-y-2">
                {current.answers.map((answer) => {
                  const selected = (state.answers.get(current.variantQuestionId) ?? []).includes(
                    answer.answerId,
                  );
                  const letter = String.fromCharCode(65 + (answer.orderIndex - 1));
                  return (
                    <li key={answer.answerId}>
                      <button
                        type="button"
                        onClick={() =>
                          state.toggleAnswer(current.variantQuestionId, answer.answerId, current.isMultipleChoice)
                        }
                        aria-pressed={selected}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors',
                          selected
                            ? 'border-chalk bg-chalk-wash text-ink'
                            : 'border-rule bg-paper-raised text-ink hover:bg-paper-sunken',
                        )}
                      >
                        <span
                          className={cn(
                            'tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border text-xs font-semibold',
                            selected ? 'border-chalk bg-chalk text-white' : 'border-rule-strong text-slate',
                          )}
                        >
                          {letter}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="font-document block">{answer.content}</span>
                          {answer.imageUrl ? (
                            <img
                              src={resolveUploadUrl(answer.imageUrl) ?? undefined}
                              alt="Ảnh minh hoạ đáp án"
                              className="mt-2 max-h-48 rounded border border-rule bg-paper object-contain"
                            />
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 flex items-center justify-between border-t border-rule pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={state.currentIndex === 0}
                  onClick={() => state.setCurrentIndex(state.currentIndex - 1)}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Câu trước
                </Button>
                <span className="tabular text-sm text-slate">
                  {state.currentIndex + 1} / {questions.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={state.currentIndex >= questions.length - 1}
                  onClick={() => state.setCurrentIndex(state.currentIndex + 1)}
                >
                  Câu sau
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </article>
          ) : null}
        </main>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-md border border-rule bg-paper-raised p-4">
            <h2 className="text-sm font-semibold text-ink">Phiếu trả lời</h2>
            <OmrNavigator
              className="mt-3"
              total={questions.length}
              currentIndex={state.currentIndex}
              answeredIndexes={answeredIndexes}
              onSelect={state.setCurrentIndex}
            />
            <p className="mt-4 text-xs text-slate">
              Đáp án được lưu tự động mỗi 20 giây và khi bạn đóng tab.
            </p>
          </div>
        </aside>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nộp bài?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đã trả lời {state.answeredCount} / {questions.length} câu. Sau khi nộp bài không thể sửa đáp án.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục làm bài</AlertDialogCancel>
            <AlertDialogAction onClick={() => state.submit()}>
              {state.isSubmitting ? 'Đang nộp…' : 'Nộp bài'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
