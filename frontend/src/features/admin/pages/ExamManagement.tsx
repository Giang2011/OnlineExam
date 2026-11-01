import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAdminExams } from '../hooks/useAdminExams';
import { useAdminSubjects } from '../hooks/useAdminSubjects';
import { useAdminChapters } from '../hooks/useAdminChapters';
import type { ExamResponse, CreateExamPayload, UpdateExamPayload } from '../api/examApi';
import {
  DeleteExamDialog,
  ExamBuilderModal,
  ExamManagementHeader,
  ExamManagementTable,
  defaultExamFormValues,
  type ExamFormValues,
} from '../components/ExamManagementComponents';

const toLocalDatetime = (value: string | null): string => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const toIsoOrNow = (value: string): string => {
  if (!value.trim()) return new Date().toISOString();
  return new Date(value).toISOString();
};

const mapExamToForm = (exam: ExamResponse): ExamFormValues => ({
  id: exam.id,
  title: exam.title,
  subjectId: exam.subjectId,
  duration: exam.duration,
  totalQuestions: exam.totalQuestions,
  totalVariants: exam.totalVariants,
  startTime: toLocalDatetime(exam.startTime),
  endTime: toLocalDatetime(exam.endTime),
  chapterQuestions: Object.fromEntries((exam.chapterConfigs ?? []).map((x) => [x.chapterId, x.questionCount])),
});

const ExamManagement: React.FC = () => {
  const examsHook = useAdminExams();
  const subjectsHook = useAdminSubjects();
  const chaptersHook = useAdminChapters(null);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [formValues, setFormValues] = useState<ExamFormValues>(defaultExamFormValues);
  const [deletingExam, setDeletingExam] = useState<ExamResponse | null>(null);

  const totalChapterQuestions = useMemo(
    () => Object.values(formValues.chapterQuestions).reduce((sum, x) => sum + (Number(x) || 0), 0),
    [formValues.chapterQuestions],
  );

  const subjects = useMemo(
    () => subjectsHook.filteredSubjects.map((s) => ({ id: Number(s.id), name: s.name })),
    [subjectsHook.filteredSubjects],
  );

  const chapters = useMemo(
    () => chaptersHook.filteredChapters.map((c) => ({ id: Number(c.id), name: c.name, questionCount: Number(c.questionCount) || 0 })),
    [chaptersHook.filteredChapters],
  );

  const openCreateModal = () => {
    setMode('create');
    const firstSubjectId = subjects[0]?.id ?? '';
    setFormValues({ ...defaultExamFormValues, subjectId: firstSubjectId });
    setIsModalOpen(true);
    if (firstSubjectId) {
      chaptersHook.setActiveSubjectId(firstSubjectId);
    }
  };

  const openEditModal = async (exam: ExamResponse) => {
    setMode('edit');
    const detail = await examsHook.selectExam(exam.id);
    const source = detail ?? exam;
    setFormValues(mapExamToForm(source));
    chaptersHook.setActiveSubjectId(source.subjectId);
    setIsModalOpen(true);
  };

  const handleSubjectChange = (nextSubjectId: number | '') => {
    setFormValues((prev) => ({ ...prev, subjectId: nextSubjectId, chapterQuestions: {} }));
    if (nextSubjectId === '') {
      chaptersHook.setActiveSubjectId(null);
      return;
    }
    chaptersHook.setActiveSubjectId(nextSubjectId);
  };

  const handleSubmit = async () => {
    if (formValues.subjectId === '') {
      toast.error('Vui lòng chọn môn học.');
      return;
    }

    if (!formValues.startTime.trim() || !formValues.endTime.trim()) {
      toast.error('Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc.');
      return;
    }

    const start = new Date(formValues.startTime);
    const end = new Date(formValues.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('Thời gian không hợp lệ.');
      return;
    }

    if (end <= start) {
      toast.error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
      return;
    }

    if (formValues.totalVariants < 1) {
      toast.error('Tổng số mã đề phải lớn hơn hoặc bằng 1.');
      return;
    }

    const chapterConfigs = Object.entries(formValues.chapterQuestions)
      .map(([chapterId, questionCount]) => ({ chapterId: Number(chapterId), questionCount: Number(questionCount) }))
      .filter((x) => x.questionCount > 0);

    for (const config of chapterConfigs) {
      const chapter = chapters.find((c) => c.id === config.chapterId);
      if (!chapter) {
        toast.error(`Không tìm thấy chương #${config.chapterId}.`);
        return;
      }
      if (config.questionCount > chapter.questionCount) {
        toast.error(`Chương "${chapter.name}" chỉ có ${chapter.questionCount} câu hỏi.`);
        return;
      }
    }

    if (totalChapterQuestions !== formValues.totalQuestions) {
      toast.error(`Tổng số câu theo chương (${totalChapterQuestions}) phải bằng ${formValues.totalQuestions}.`);
      return;
    }

    const payload: CreateExamPayload | UpdateExamPayload = {
      title: formValues.title,
      subjectId: Number(formValues.subjectId),
      duration: formValues.duration,
      totalQuestions: formValues.totalQuestions,
      totalVariants: formValues.totalVariants,
      chapterConfigs,
      startTime: toIsoOrNow(formValues.startTime),
      endTime: toIsoOrNow(formValues.endTime),
    };

    setSubmitting(true);
    try {
      if (mode === 'edit' && formValues.id) {
        const ok = await examsHook.updateExam(formValues.id, payload);
        if (ok) toast.success('Cập nhật kỳ thi thành công.');
      } else {
        const ok = await examsHook.createExam(payload);
        if (ok) toast.success('Tạo kỳ thi thành công.');
      }
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!deletingExam) return;
    setSubmitting(true);
    try {
      const ok = await examsHook.removeExam(deletingExam.id);
      if (ok) {
        toast.success('Xóa kỳ thi thành công.');
        setDeletingExam(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ExamManagementHeader onCreate={openCreateModal} />

      <ExamManagementTable
        exams={examsHook.filteredExams}
        loading={examsHook.loading}
        onEdit={openEditModal}
        onDelete={(exam) => setDeletingExam(exam)}
        onManageParticipants={(exam) => navigate(`/admin/exams/${exam.id}/participants`)}
      />

      <ExamBuilderModal
        open={isModalOpen}
        mode={mode}
        values={formValues}
        subjects={subjects}
        chapters={chapters}
        submitting={submitting}
        onClose={() => setIsModalOpen(false)}
        onChange={(patch) => {
          if (Object.prototype.hasOwnProperty.call(patch, 'subjectId')) {
            handleSubjectChange((patch.subjectId ?? '') as number | '');
            return;
          }
          setFormValues((prev) => ({ ...prev, ...patch }));
        }}
        onChangeChapterCount={(chapterId, count) =>
          setFormValues((prev) => ({ ...prev, chapterQuestions: { ...prev.chapterQuestions, [chapterId]: count } }))
        }
        onSubmit={handleSubmit}
      />

      <DeleteExamDialog
        open={Boolean(deletingExam)}
        exam={deletingExam}
        loading={submitting}
        onCancel={() => setDeletingExam(null)}
        onConfirm={handleDeleteExam}
      />
    </div>
  );
};

export default ExamManagement;
