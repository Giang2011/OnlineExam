import React, { useMemo, useState } from 'react';
import type { Chapter, PaperExamChapterConfigPayload } from '../types';

interface PaperExamChapterConfigEditorProps {
  chapters: Chapter[];
  loading?: boolean;
  value: PaperExamChapterConfigPayload[];
  onChange: (next: PaperExamChapterConfigPayload[]) => void;
}

const PaperExamChapterConfigEditor: React.FC<PaperExamChapterConfigEditorProps> = ({
  chapters,
  loading = false,
  value,
  onChange,
}) => {
  const [pendingChapterId, setPendingChapterId] = useState<number | ''>('');

  const selectedChapterIds = useMemo(() => new Set(value.map((item) => item.chapterId)), [value]);

  const chapterById = useMemo(() => {
    const map = new Map<number, Chapter>();
    chapters.forEach((chapter) => map.set(Number(chapter.id), chapter));
    return map;
  }, [chapters]);

  const availableChapters = useMemo(
    () => chapters.filter((chapter) => !selectedChapterIds.has(Number(chapter.id))),
    [chapters, selectedChapterIds],
  );

  const totalConfigured = useMemo(
    () => value.reduce((sum, item) => sum + (Number(item.questionCount) || 0), 0),
    [value],
  );

  const handleAddChapter = () => {
    if (pendingChapterId === '') return;

    if (selectedChapterIds.has(pendingChapterId)) {
      setPendingChapterId('');
      return;
    }

    onChange([...value, { chapterId: pendingChapterId, questionCount: 0 }]);
    setPendingChapterId('');
  };

  const handleQuestionCountChange = (chapterId: number, rawValue: string) => {
    const normalized = Math.max(0, Number(rawValue) || 0);
    onChange(
      value.map((item) =>
        item.chapterId === chapterId
          ? {
              ...item,
              questionCount: normalized,
            }
          : item,
      ),
    );
  };

  const handleRemoveChapter = (chapterId: number) => {
    onChange(value.filter((item) => item.chapterId !== chapterId));
  };

  return (
    <div className="rounded-xl border border-slate-200">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Cấu hình chương</h2>
        <p className="mt-1 text-xs text-slate-500">Chọn chương và nhập số câu cho từng chương.</p>
      </div>

      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={pendingChapterId}
            onChange={(e) => setPendingChapterId(e.target.value ? Number(e.target.value) : '')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 sm:max-w-sm"
            disabled={loading || availableChapters.length === 0}
          >
            <option value="">Chọn chương để thêm</option>
            {availableChapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.name} ({chapter.questionCount} câu hiện có)
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAddChapter}
            disabled={pendingChapterId === '' || loading}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Thêm chương
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-5 text-sm text-slate-500">Đang tải danh sách chương...</div>
      ) : value.length === 0 ? (
        <div className="px-4 py-5 text-sm text-slate-500">Chưa có cấu hình chương. Hãy chọn một chương để bắt đầu.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {value.map((item) => {
            const chapter = chapterById.get(item.chapterId);
            const chapterName = chapter?.name ?? `Chương #${item.chapterId}`;
            const chapterQuestionCount = chapter?.questionCount ?? null;
            const exceedsAvailable =
              chapterQuestionCount !== null && Number(item.questionCount) > Number(chapterQuestionCount);

            return (
              <div key={item.chapterId} className="px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{chapterName}</p>
                    {chapterQuestionCount !== null && (
                      <p className="text-xs text-slate-500">Số câu hiện có: {chapterQuestionCount}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={item.questionCount}
                      onChange={(e) => handleQuestionCountChange(item.chapterId, e.target.value)}
                      className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none transition focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveChapter(item.chapterId)}
                      className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {exceedsAvailable && (
                  <p className="mt-2 text-xs text-amber-600">
                    Cảnh báo: chương này hiện có {chapterQuestionCount} câu, nhưng bạn đang yêu cầu {item.questionCount} câu.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Tổng câu theo chương: <span className="font-semibold">{totalConfigured}</span>
      </div>
    </div>
  );
};

export default PaperExamChapterConfigEditor;
