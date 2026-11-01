import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Send } from 'lucide-react';
import { useExamSessionQuestions } from '../hooks/useExamSessionQuestions';
import { useSubmitExamSession } from '../hooks/useSubmitExamSession';
import type { SubmitSessionRequestDTO } from '../types/student.types';
import { getApiBaseUrl } from '../../../shared/lib/apiBaseUrl';

const STORAGE_KEY = (sessionId: number) => `exam_end_${sessionId}`;

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const buildImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl;
  }

  const baseUrl = getApiBaseUrl();
  const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  return `${baseUrl}${normalizedPath}`;
};

const ExamInterface: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const parsedSessionId = Number(sessionId);
  const {
    questions,
    loading,
    error,
    answersByQuestion,
    toggleAnswer,
    refetch,
  } = useExamSessionQuestions(parsedSessionId);

  const { submitSession, submitting, error: submitError } = useSubmitExamSession();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerReady, setTimerReady] = useState(false);

  useEffect(() => {
    if (!parsedSessionId || Number.isNaN(parsedSessionId)) {
      return;
    }

    const endTimeRaw = localStorage.getItem(STORAGE_KEY(parsedSessionId));
    if (!endTimeRaw) {
      setTimerReady(true);
      setTimeLeft(0);
      return;
    }

    const endMs = new Date(endTimeRaw).getTime();
    const nowMs = Date.now();
    const diff = Math.floor((endMs - nowMs) / 1000);
    setTimeLeft(Math.max(0, diff));
    setTimerReady(true);
  }, [parsedSessionId]);

  const answeredCount = useMemo(
    () => Object.values(answersByQuestion).filter((value) => value.length > 0).length,
    [answersByQuestion],
  );

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (!timerReady || submitting) {
      return;
    }

    if (timeLeft <= 0) {
      if (questions.length > 0) {
        void (async () => {
          const payload: SubmitSessionRequestDTO = {
            answers: questions.map((q) => ({
              variantQuestionId: q.variantQuestionId,
              selectedAnswerIds: answersByQuestion[q.variantQuestionId] ?? [],
            })),
          };

          const result = await submitSession(parsedSessionId, payload);
          if (result) {
            toast.success('Hết thời gian. Bài làm đã được nộp.');
            navigate('/student/completed', { replace: true });
          }
        })();
      }
      return;
    }

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    answersByQuestion,
    navigate,
    parsedSessionId,
    questions.length,
    submitSession,
    submitting,
    timeLeft,
    timerReady,
  ]);

  const handleSubmit = async () => {
    if (!parsedSessionId || Number.isNaN(parsedSessionId) || submitting) {
      return;
    }

    const confirm = await Swal.fire({
      title: 'Xác nhận nộp bài?',
      text: `Bạn đã trả lời ${answeredCount}/${questions.length} câu. Sau khi nộp sẽ không thể chỉnh sửa.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Nộp bài',
      cancelButtonText: 'Quay lại',
    });

    if (!confirm.isConfirmed) {
      return;
    }

    const payload: SubmitSessionRequestDTO = {
      answers: questions.map((q) => ({
        variantQuestionId: q.variantQuestionId,
        selectedAnswerIds: answersByQuestion[q.variantQuestionId] ?? [],
      })),
    };

    const result = await submitSession(parsedSessionId, payload);
    if (!result) {
      toast.error(submitError || 'Không thể nộp bài lúc này.');
      return;
    }

    toast.success('Nộp bài thành công.');
    navigate('/student/completed', { replace: true });
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-b-2 border-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto text-red-600" size={28} />
          <p className="mt-3 text-red-700 font-medium">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Tải lại câu hỏi
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center text-slate-600">
        Không có dữ liệu câu hỏi cho phiên thi này.
      </div>
    );
  }

  const isTimeWarning = timeLeft <= 300;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Phiên thi #{parsedSessionId}</h1>
          <p className="text-xs text-slate-500">Câu {currentQuestionIndex + 1}/{questions.length}</p>
        </div>

        <div className={`px-4 py-2 rounded-xl font-mono font-bold ${isTimeWarning ? 'bg-red-50 text-red-700' : 'bg-slate-900 text-white'}`}>
          <Clock className="inline mr-2" size={16} />
          {formatTime(timeLeft)}
        </div>

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          <Send size={16} />
          {submitting ? 'Đang nộp...' : 'Nộp bài'}
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              {currentQuestion.isMultipleChoice ? 'Chọn nhiều đáp án phù hợp' : 'Chọn một đáp án đúng nhất'}
            </p>
            <h2 className="mt-2 text-lg md:text-xl font-semibold text-slate-800">{currentQuestion.content}</h2>
            {buildImageUrl(currentQuestion.imageUrl) ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={buildImageUrl(currentQuestion.imageUrl) ?? undefined}
                  alt="Hình ảnh câu hỏi"
                  className="max-h-[420px] w-full object-contain"
                />
              </div>
            ) : null}
          </div>

          <div className="p-6 space-y-3">
            {currentQuestion.answers.map((answer, index) => {
              const selected = answersByQuestion[currentQuestion.variantQuestionId]?.includes(answer.answerId) ?? false;
              const inputType = currentQuestion.isMultipleChoice ? 'checkbox' : 'radio';

              return (
                <label
                  key={answer.answerId}
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${selected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                >
                  <input
                    type={inputType}
                    name={`q_${currentQuestion.variantQuestionId}`}
                    checked={selected}
                    onChange={() =>
                      toggleAnswer(
                        currentQuestion.variantQuestionId,
                        answer.answerId,
                        currentQuestion.isMultipleChoice,
                      )
                    }
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <p className="text-xs font-semibold text-slate-500">Đáp án {String.fromCharCode(65 + index)}</p>
                    {buildImageUrl(answer.imageUrl) ? (
                      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <img
                          src={buildImageUrl(answer.imageUrl) ?? undefined}
                          alt={`Hình ảnh đáp án ${String.fromCharCode(65 + index)}`}
                          className="max-h-64 w-full object-contain"
                        />
                      </div>
                    ) : null}
                    <p className="text-slate-800">{answer.content}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="p-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Câu trước
            </button>

            <button
              type="button"
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex >= questions.length - 1}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-white disabled:opacity-40"
            >
              Câu tiếp <ChevronRight size={16} />
            </button>
          </div>
        </section>

        <aside className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 h-fit lg:sticky lg:top-24">
          <h3 className="text-sm font-semibold text-slate-800">Tiến độ làm bài</h3>
          <div className="mt-2 text-sm text-slate-600">Đã trả lời: <span className="font-bold text-indigo-600">{answeredCount}/{questions.length}</span></div>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              const isDone = (answersByQuestion[q.variantQuestionId]?.length ?? 0) > 0;
              return (
                <button
                  key={q.variantQuestionId}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`h-9 rounded-lg text-xs font-semibold border ${isCurrent ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'} ${isDone ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700'}`}
                >
                  {isDone ? <CheckCircle2 size={14} className="mx-auto" /> : idx + 1}
                </button>
              );
            })}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default ExamInterface;
