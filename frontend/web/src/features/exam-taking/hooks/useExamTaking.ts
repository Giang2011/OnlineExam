import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { showApiError } from '@/shared/lib/error-handler';
import {
  useDraftAnswers,
  useSessionDetail,
  useSessionQuestions,
} from '@/features/exam-taking/hooks/useSessions';
import { sessionsApi } from '@/features/exam-taking/api';
import { useServerCountdown } from '@/features/exam-taking/hooks/useServerCountdown';
import type { DraftAnswer } from '@/features/exam-taking/types';

const AUTOSAVE_INTERVAL_MS = 20_000;

export interface ExamTakingState {
  questions: ReturnType<typeof useSessionQuestions>['data'];
  examTitle: string;
  answers: Map<number, number[]>;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  toggleAnswer: (variantQuestionId: number, answerId: number, multiple: boolean) => void;
  remainingSeconds: number;
  desynced: boolean;
  answeredCount: number;
  isSubmitting: boolean;
  submit: () => void;
  lastSavedAt: Date | null;
}

/** Hook quản lý toàn bộ vòng đời làm bài: đáp án, autosave, đồng hồ, nộp bài. */
export function useExamTaking(sessionId: number): ExamTakingState {
  const navigate = useNavigate();
  const detailQuery = useSessionDetail(sessionId);
  const questionsQuery = useSessionQuestions(sessionId);
  const draftQuery = useDraftAnswers(sessionId);

  /** Đáp án người thi vừa chọn. null = chưa chọn gì, dùng bản draft từ server. */
  const [userAnswers, setUserAnswers] = useState<Map<number, number[]> | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Bản đáp án đã autosave từ trước (khôi phục phiên). */
  const draftAnswers = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const draft of draftQuery.data?.answers ?? []) {
      map.set(draft.variantQuestionId, draft.selectedAnswerIds);
    }
    return map;
  }, [draftQuery.data]);

  const answers = userAnswers ?? draftAnswers;

  const answersRef = useRef<Map<number, number[]>>(answers);
  const submittingRef = useRef(false);

  // Đồng bộ ref với đáp án hiện tại để autosave đọc được phiên bản mới nhất.
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  /** Đã tải xong bản draft -> được phép autosave. */
  const hydrated = draftQuery.isFetched;

  const { remainingSeconds, desynced } = useServerCountdown(
    detailQuery.data?.serverTime,
    detailQuery.data?.deadlineAt,
    detailQuery.data?.remainingSeconds,
  );

  const toPayload = useCallback((): DraftAnswer[] => {
    return Array.from(answersRef.current.entries()).map(([variantQuestionId, selectedAnswerIds]) => ({
      variantQuestionId,
      selectedAnswerIds,
    }));
  }, []);

  /**
   * Gọi `sessionsApi` trực tiếp thay vì qua `useMutation`: object trả về từ
   * useMutation đổi identity mỗi render, nếu dùng nó trong dependency của
   * effect autosave thì interval 20s bị reset mỗi lần đồng hồ tick (500ms)
   * và không bao giờ tới hạn.
   */
  const save = useCallback(async () => {
    if (!hydrated) return;
    const payload = toPayload();
    if (payload.length === 0) return;
    try {
      await sessionsApi.saveAnswers(sessionId, payload);
      setLastSavedAt(new Date());
    } catch {
      // Không chặn luồng thi — lần autosave sau sẽ thử lại.
    }
  }, [hydrated, toPayload, sessionId]);

  // Autosave định kỳ.
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setInterval(() => {
      void save();
    }, AUTOSAVE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [hydrated, save]);

  // Autosave khi đóng tab / đổi tab.
  useEffect(() => {
    if (!hydrated) return;

    const flush = () => {
      const payload = toPayload();
      if (payload.length === 0) return;
      // keepalive để request vẫn gửi được khi trang đang đóng.
      void fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/sessions/${sessionId}/answers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader(),
        },
        body: JSON.stringify({ answers: payload }),
        credentials: 'include',
        keepalive: true,
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', flush);
    };
  }, [hydrated, sessionId, toPayload]);

  const submit = useCallback(() => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    sessionsApi
      .submit(sessionId, toPayload())
      .then((session) => {
        // Response của submit đã kèm score/totalCorrect/totalQuestions — hiển thị ngay.
        const score = session.score;
        const correct = session.totalCorrect;
        const total = session.totalQuestions;
        if (typeof score === 'number' && typeof correct === 'number' && typeof total === 'number') {
          toast.success(`Đã nộp bài. Điểm: ${score.toFixed(1)} — đúng ${correct}/${total} câu.`);
        } else {
          toast.success('Đã nộp bài thành công.');
        }
        navigate(`/my-results?session=${session.id}`, { replace: true });
      })
      .catch((error: unknown) => {
        submittingRef.current = false;
        setIsSubmitting(false);
        const message = error instanceof Error ? error.message : '';
        if (message.includes('tự nộp')) {
          toast.info('Bài đã được hệ thống tự nộp do hết giờ. Xem kết quả để biết điểm.');
          navigate('/my-results', { replace: true });
          return;
        }
        showApiError(error, 'Không nộp được bài.');
      });
  }, [toPayload, navigate, sessionId]);

  // Hết giờ -> nộp bài bằng draft đã autosave.
  // Chỉ được coi là hết giờ khi đã tải được chi tiết phiên — trước đó
  // `remainingSeconds` mặc định bằng 0 và sẽ nộp bài oan.
  useEffect(() => {
    if (!detailQuery.data) return;
    if (remainingSeconds > 0 || !hydrated || autoSubmitted) return;
    if (submittingRef.current) return;
    setAutoSubmitted(true);
    toast.warning('Đã hết giờ. Hệ thống đang nộp bài bằng đáp án đã lưu.');
    submit();
  }, [detailQuery.data, remainingSeconds, hydrated, autoSubmitted, submit]);

  const toggleAnswer = useCallback(
    (variantQuestionId: number, answerId: number, multiple: boolean) => {
      setUserAnswers((current) => {
        const base = current ?? draftAnswers;
        const next = new Map(base);
        const existing = next.get(variantQuestionId) ?? [];
        if (multiple) {
          next.set(
            variantQuestionId,
            existing.includes(answerId)
              ? existing.filter((id) => id !== answerId)
              : [...existing, answerId],
          );
        } else {
          next.set(variantQuestionId, existing.includes(answerId) ? [] : [answerId]);
        }
        answersRef.current = next;
        return next;
      });
    },
    [draftAnswers],
  );

  const answeredCount = useMemo(() => {
    let count = 0;
    for (const selected of answers.values()) {
      if (selected.length > 0) count += 1;
    }
    return count;
  }, [answers]);

  return {
    questions: questionsQuery.data,
    examTitle: detailQuery.data?.examTitle ?? '',
    answers,
    currentIndex,
    setCurrentIndex,
    toggleAnswer,
    remainingSeconds,
    desynced,
    answeredCount,
    isSubmitting,
    submit,
    lastSavedAt,
  };
}

/** Đọc CSRF token từ cookie — cùng cơ chế với api-client. */
function csrfHeader(): Record<string, string> {
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('XSRF-TOKEN='));
  if (!match) return {};
  return { 'X-XSRF-TOKEN': decodeURIComponent(match.slice('XSRF-TOKEN='.length)) };
}
