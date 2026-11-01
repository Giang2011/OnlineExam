import React from 'react';
import { buildUploadUrl } from '../../../shared/lib/uploadUrl';
import type { PaperExamAnswerQuestion, PaperExamAnswerView } from '../types';

interface PaperExamAnswerViewerProps {
  data: PaperExamAnswerView;
}

const renderOrder = (question: PaperExamAnswerQuestion, index: number): string => {
  if (typeof question.orderIndex === 'number' && question.orderIndex > 0) {
    return `Câu ${question.orderIndex}`;
  }

  return `Câu ${index + 1}`;
};

const toAbsoluteImageUrl = (url?: string | null): string | null => {
  if (!url) return null;

  const normalized = url.trim();
  if (!normalized) return null;

  if (normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized;
  }

  return buildUploadUrl(normalized) || null;
};

const PaperExamAnswerViewer: React.FC<PaperExamAnswerViewerProps> = ({ data }) => {
  return (
    <div className="space-y-5">
      {data.questions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Đề giấy này chưa có dữ liệu đáp án.
        </div>
      ) : (
        data.questions.map((question, index) => (
          <section key={`${question.id}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-blue-100 px-2.5 py-1 font-semibold text-blue-700">{renderOrder(question, index)}</span>
              {question.chapterName ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{question.chapterName}</span>
              ) : null}
            </div>

            <p className="mb-4 whitespace-pre-line text-sm leading-6 text-slate-900">{question.content}</p>

            {toAbsoluteImageUrl(question.imageUrl) ? (
              <img
                src={toAbsoluteImageUrl(question.imageUrl) ?? undefined}
                alt={`Hình minh họa câu ${index + 1}`}
                className="mb-4 max-h-72 rounded-xl border border-slate-200 object-contain"
              />
            ) : null}

            <div className="space-y-2">
              {question.answers.map((answer, answerIndex) => {
                const optionLabel = String.fromCharCode(65 + answerIndex);
                const isCorrect = Boolean(answer.isCorrect);

                return (
                  <div
                    key={`${answer.id}-${answerIndex}`}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      isCorrect
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-semibold">
                        {optionLabel}
                      </span>
                      <div className="flex-1">
                        <p className="whitespace-pre-line">{answer.content}</p>
                        {toAbsoluteImageUrl(answer.imageUrl) ? (
                          <img
                            src={toAbsoluteImageUrl(answer.imageUrl) ?? undefined}
                            alt={`Hình đáp án ${optionLabel}`}
                            className="mt-2 max-h-56 rounded-lg border border-slate-200 object-contain"
                          />
                        ) : null}
                      </div>
                      {isCorrect ? <span className="text-xs font-semibold">Đáp án đúng</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

export default PaperExamAnswerViewer;
