import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appToast } from '../../../shared/components';
import { useAdminSubjects } from '../hooks/useAdminSubjects';
import { useAdminChapters } from '../hooks/useAdminChapters';
import { useCreatePaperExam } from '../hooks/useAdminPaperExams';
import PaperExamChapterConfigEditor from '../components/PaperExamChapterConfigEditor';
import type { PaperExamChapterConfigPayload } from '../types';

interface PaperExamCreateFormErrors {
  title?: string;
  subjectId?: string;
  durationMinutes?: string;
  totalQuestions?: string;
  chapterConfigs?: string;
}

const PaperExamCreate: React.FC = () => {
  const navigate = useNavigate();
  const subjectsHook = useAdminSubjects();
  const chaptersHook = useAdminChapters(null);

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [chapterConfigs, setChapterConfigs] = useState<PaperExamChapterConfigPayload[]>([]);
  const [errors, setErrors] = useState<PaperExamCreateFormErrors>({});

  const { create, loading: creating, error: createError } = useCreatePaperExam(async (created) => {
    appToast.success('Tạo đề giấy thành công');
    navigate(`/admin/paper-exams/${created.id}`);
  });

  const subjects = useMemo(
    () => subjectsHook.filteredSubjects.map((s) => ({ id: Number(s.id), name: s.name })),
    [subjectsHook.filteredSubjects],
  );

  const chapterTotal = useMemo(
    () => chapterConfigs.reduce((sum, item) => sum + item.questionCount, 0),
    [chapterConfigs],
  );

  const handleSubjectChange = (nextSubjectId: number | '') => {
    setSubjectId(nextSubjectId);
    setChapterConfigs([]);
    setErrors((prev) => ({ ...prev, subjectId: undefined, chapterConfigs: undefined }));

    if (nextSubjectId === '') {
      chaptersHook.setActiveSubjectId(null);
      return;
    }

    chaptersHook.setActiveSubjectId(nextSubjectId);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: PaperExamCreateFormErrors = {};

    if (!title.trim()) {
      nextErrors.title = 'Vui lòng nhập tiêu đề đề giấy.';
    }

    if (subjectId === '') {
      nextErrors.subjectId = 'Vui lòng chọn môn học.';
    }

    if (durationMinutes <= 0) {
      nextErrors.durationMinutes = 'Thời lượng làm bài phải lớn hơn 0.';
    }

    if (totalQuestions <= 0) {
      nextErrors.totalQuestions = 'Tổng số câu hỏi phải lớn hơn 0.';
    }

    if (chapterConfigs.length === 0) {
      nextErrors.chapterConfigs = 'Vui lòng cấu hình ít nhất 1 chương.';
    }

    const duplicatedChapterIds = new Set<number>();
    const seenChapterIds = new Set<number>();

    chapterConfigs.forEach((config) => {
      if (seenChapterIds.has(config.chapterId)) {
        duplicatedChapterIds.add(config.chapterId);
      }
      seenChapterIds.add(config.chapterId);

      if (!Number.isFinite(config.questionCount) || config.questionCount <= 0) {
        nextErrors.chapterConfigs = 'Mỗi chương phải có số câu lớn hơn 0.';
      }
    });

    if (duplicatedChapterIds.size > 0) {
      nextErrors.chapterConfigs = 'Cấu hình chương đang bị trùng. Vui lòng kiểm tra lại.';
    }

    if (!nextErrors.chapterConfigs && chapterTotal !== totalQuestions) {
      nextErrors.chapterConfigs = `Tổng số câu theo chương (${chapterTotal}) phải bằng tổng số câu (${totalQuestions}).`;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      appToast.error(nextErrors.chapterConfigs ?? 'Vui lòng kiểm tra lại thông tin đã nhập.');
      return;
    }

    try {
      await create({
        title,
        subjectId: Number(subjectId),
        durationMinutes,
        totalQuestions,
        chapterConfigs,
      });
    } catch {
      appToast.error(createError ?? 'Không thể tạo đề giấy.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tạo đề giấy</h1>
          <p className="mt-1 text-sm text-slate-500">Tạo đề thi giấy theo môn học và cấu hình số câu theo chương.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/paper-exams')}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Quay lại danh sách
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Tiêu đề</span>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="Ví dụ: Đề giấy Vật lý 12 - HK1"
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ring-0 transition focus:border-blue-500 ${
                errors.title ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Môn học</span>
            <select
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value ? Number(e.target.value) : '')}
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-blue-500 ${
                errors.subjectId ? 'border-rose-400' : 'border-slate-300'
              }`}
            >
              <option value="">Chọn môn học</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            {errors.subjectId && <p className="mt-1 text-xs text-rose-600">{errors.subjectId}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Thời lượng (phút)</span>
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => {
                setDurationMinutes(Number(e.target.value) || 0);
                setErrors((prev) => ({ ...prev, durationMinutes: undefined }));
              }}
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ring-0 transition focus:border-blue-500 ${
                errors.durationMinutes ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.durationMinutes && <p className="mt-1 text-xs text-rose-600">{errors.durationMinutes}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Tổng số câu</span>
            <input
              type="number"
              min={1}
              value={totalQuestions}
              onChange={(e) => {
                setTotalQuestions(Number(e.target.value) || 0);
                setErrors((prev) => ({ ...prev, totalQuestions: undefined, chapterConfigs: undefined }));
              }}
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ring-0 transition focus:border-blue-500 ${
                errors.totalQuestions ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.totalQuestions && <p className="mt-1 text-xs text-rose-600">{errors.totalQuestions}</p>}
          </label>
        </div>

        <PaperExamChapterConfigEditor
          chapters={chaptersHook.filteredChapters}
          loading={chaptersHook.loading}
          value={chapterConfigs}
          onChange={(next) => {
            setChapterConfigs(next);
            setErrors((prev) => ({ ...prev, chapterConfigs: undefined }));
          }}
        />
        {errors.chapterConfigs && <p className="-mt-3 text-xs text-rose-600">{errors.chapterConfigs}</p>}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/paper-exams')}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {creating ? 'Đang tạo...' : 'Tạo đề giấy'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaperExamCreate;
