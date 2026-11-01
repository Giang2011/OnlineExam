import React from 'react';
import { appToast, Button, Input, Select } from '../../../shared/components';
import { buildUploadUrl } from '../../../shared/lib/uploadUrl';
import {
  QuestionDeleteConfirmDialog,
  QuestionEditor,
  QuestionList,
  type QuestionFormAnswer,
  type QuestionFormValue,
  type SelectOption,
} from '../components/QuestionManagementComponents';
import { useAdminChapters } from '../hooks/useAdminChapters';
import { useAdminQuestions } from '../hooks/useAdminQuestions';
import { useAdminSubjects } from '../hooks/useAdminSubjects';
import type { Question } from '../types';

interface QuestionDetail extends Question {
  imageUrl?: string | null;
  answers?: Array<{
    content: string;
    isCorrect: boolean;
    imageUrl?: string | null;
  }>;
}

const createEmptyAnswer = (): QuestionFormAnswer => ({
  content: '',
  isCorrect: false,
  imageFile: null,
  previewUrl: null,
  imageRemoved: false,
});

const buildEmptyForm = (subjectId?: number | null): QuestionFormValue => ({
  content: '',
  subjectId: subjectId ? String(subjectId) : '',
  chapterId: '',
  imageFile: null,
  imagePreviewUrl: null,
  imageRemoved: false,
  answers: [createEmptyAnswer(), createEmptyAnswer()],
});

const resolveImageUrl = (value?: string | null): string | null => buildUploadUrl(value) || null;

const buildFormValueFromDetail = (detail: QuestionDetail): QuestionFormValue => {
  const answers = detail.answers?.length
    ? detail.answers.map((answer) => ({
        content: answer.content ?? '',
        isCorrect: Boolean(answer.isCorrect),
        imageFile: null,
        previewUrl: resolveImageUrl(answer.imageUrl) ?? null,
        imageRemoved: false,
      }))
    : [createEmptyAnswer(), createEmptyAnswer()];

  return {
    content: detail.content ?? '',
    subjectId: detail.subjectId ? String(detail.subjectId) : '',
    chapterId: detail.chapterId ? String(detail.chapterId) : '',
    imageFile: null,
    imagePreviewUrl: resolveImageUrl(detail.imageUrl) ?? null,
    imageRemoved: false,
    answers,
  };
};

const QuestionManagement: React.FC = () => {
  const { subjects, loading: subjectsLoading } = useAdminSubjects();
  const {
    filteredQuestions,
    loading: questionsLoading,
    error: questionsError,
    search,
    subjectId,
    chapterId,
    setSearch,
    setSubjectId,
    setChapterId,
    selectQuestion,
    createQuestion,
    updateQuestion,
    removeQuestion,
  } = useAdminQuestions();

  const {
    chapters: filterChapters,
    loading: filterChaptersLoading,
    setActiveSubjectId: setFilterSubjectId,
  } = useAdminChapters(null);

  const {
    chapters: formChapters,
    setActiveSubjectId: setFormSubjectId,
  } = useAdminChapters(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');
  const [formValue, setFormValue] = React.useState<QuestionFormValue>(() => buildEmptyForm());
  const [editingId, setEditingId] = React.useState<number | string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Question | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  React.useEffect(() => {
    if (questionsError) {
      appToast.error(questionsError);
    }
  }, [questionsError]);

  React.useEffect(() => {
    setFilterSubjectId(subjectId ?? null);
  }, [setFilterSubjectId, subjectId]);

  const subjectOptions = React.useMemo<SelectOption[]>(() => (
    subjects.map((subject) => ({ value: String(subject.id), label: subject.name }))
  ), [subjects]);

  const filterChapterOptions = React.useMemo<SelectOption[]>(() => (
    filterChapters.map((chapter) => ({ value: String(chapter.id), label: chapter.name }))
  ), [filterChapters]);

  const formChapterOptions = React.useMemo<SelectOption[]>(() => (
    formChapters.map((chapter) => ({ value: String(chapter.id), label: chapter.name }))
  ), [formChapters]);

  const handleFilterSubjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSubjectId = event.target.value ? Number(event.target.value) : null;
    setSubjectId(nextSubjectId);
    setChapterId(null);
  };

  const handleFilterChapterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextChapterId = event.target.value ? Number(event.target.value) : null;
    setChapterId(nextChapterId);
  };

  const handleFormChange = React.useCallback((next: QuestionFormValue) => {
    setFormValue(next);
    const nextSubjectId = next.subjectId ? Number(next.subjectId) : null;
    setFormSubjectId(nextSubjectId);
  }, [setFormSubjectId]);

  const openCreateForm = () => {
    const defaultSubjectId = subjectId ?? subjects[0]?.id ?? null;
    const nextForm = buildEmptyForm(defaultSubjectId);
    setEditingId(null);
    setFormMode('create');
    setFormValue(nextForm);
    setFormOpen(true);
    setFormSubjectId(defaultSubjectId);
  };

  const openEditForm = async (question: Question) => {
    setDetailLoading(true);
    try {
      const detail = await selectQuestion(question.id);
      if (!detail) {
        appToast.error('Không thể tải dữ liệu câu hỏi');
        return;
      }
      const nextForm = buildFormValueFromDetail(detail as QuestionDetail);
      setEditingId(question.id);
      setFormMode('edit');
      setFormValue(nextForm);
      setFormOpen(true);
      setFormSubjectId(detail.subjectId ?? null);
    } catch (error) {
      console.error('Failed to load question detail:', error);
      appToast.error('Không thể tải dữ liệu câu hỏi');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormValue(buildEmptyForm(subjectId));
    setFilterSubjectId(subjectId ?? null);
  };

  const handleSubmit = async () => {
    if (!formValue.subjectId || !formValue.chapterId) {
      appToast.error('Vui lòng chọn môn học và chương');
      return;
    }

    if (!formValue.content.trim()) {
      appToast.error('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    if (!formValue.answers.some((answer) => answer.isCorrect)) {
      appToast.error('Vui lòng chọn ít nhất một đáp án đúng');
      return;
    }

    const payload = {
      data: {
        content: formValue.content,
        subjectId: Number(formValue.subjectId),
        chapterId: Number(formValue.chapterId),
        questionImageRemoved: formValue.imageRemoved && !formValue.imageFile,
        answers: formValue.answers.map((answer) => ({
          content: answer.content,
          isCorrect: answer.isCorrect,
          imageRemoved: Boolean(answer.imageRemoved && !answer.imageFile),
        })),
      },
      questionImage: formValue.imageFile ?? null,
      answerImages: formValue.answers.map((answer) => answer.imageFile ?? null),
    };

    setSubmitting(true);
    try {
      if (formMode === 'create') {
        const created = await createQuestion(payload);
        if (!created) {
          appToast.error('Không thể tạo câu hỏi');
          return;
        }
      } else if (editingId != null) {
        const updated = await updateQuestion(editingId, payload);
        if (!updated) {
          appToast.error('Không thể cập nhật câu hỏi');
          return;
        }
      }
      appToast.success('Lưu câu hỏi thành công');
      closeForm();
    } catch (error) {
      console.error('Failed to submit question:', error);
      appToast.error('Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const ok = await removeQuestion(deleteTarget.id);
      if (!ok) {
        appToast.error('Không thể xoá câu hỏi');
        return;
      }
      setDeleteTarget(null);
      appToast.success('Đã xoá câu hỏi');
    } catch (error) {
      console.error('Failed to delete question:', error);
      appToast.error('Không thể xoá câu hỏi');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Ngân hàng câu hỏi</h1>
          <p className="mt-2 text-sm text-slate-500">Quản lý nội dung câu hỏi theo môn học và chương.</p>
        </div>
        <Button onClick={openCreateForm} className="gap-2">+ Thêm câu hỏi</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Select
          value={subjectId ? String(subjectId) : ''}
          onChange={handleFilterSubjectChange}
          options={subjectOptions}
          placeholder={subjectsLoading ? 'Đang tải môn học...' : 'Chọn môn học'}
        />
        <Select
          value={chapterId ? String(chapterId) : ''}
          onChange={handleFilterChapterChange}
          options={filterChapterOptions}
          placeholder={filterChaptersLoading ? 'Đang tải chương...' : 'Chọn chương'}
          disabled={!subjectId}
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo nội dung câu hỏi"
        />
      </div>

      {subjectsLoading && !subjects.length ? (
        <div className="rounded-xl border border-slate-200 p-6 text-center text-slate-500">Đang tải dữ liệu...</div>
      ) : (
        <QuestionList
          questions={filteredQuestions}
          loading={questionsLoading}
          onEditClick={openEditForm}
          onDeleteClick={setDeleteTarget}
        />
      )}

      <QuestionEditor
        open={formOpen}
        mode={formMode}
        value={formValue}
        subjectOptions={subjectOptions}
        chapterOptions={formChapterOptions}
        loading={submitting || detailLoading}
        onClose={closeForm}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
      />

      <QuestionDeleteConfirmDialog
        open={Boolean(deleteTarget)}
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default QuestionManagement;
