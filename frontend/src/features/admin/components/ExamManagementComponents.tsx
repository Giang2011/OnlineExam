import React from 'react';
import { AlertCircle, Clock, Edit, Layers, Plus, Save, Shuffle, Trash2, Users, X } from 'lucide-react';
import { Button, EmptyState, Modal, Spinner, Table, ConfirmDialog } from '../../../shared/components';
import type { ExamResponse, CreateExamPayload, UpdateExamPayload, ExamStatus } from '../api/examApi';

export interface ChapterOption {
  id: number;
  name: string;
  questionCount: number;
}

export interface SubjectOption {
  id: number;
  name: string;
}

export interface ExamFormValues {
  id?: number;
  title: string;
  subjectId: number | '';
  duration: number;
  totalQuestions: number;
  totalVariants: number;
  startTime: string;
  endTime: string;
  chapterQuestions: Record<number, number>;
}

export const defaultExamFormValues: ExamFormValues = {
  title: '',
  subjectId: '',
  duration: 60,
  totalQuestions: 10,
  totalVariants: 1,
  startTime: '',
  endTime: '',
  chapterQuestions: {},
};

export const ExamManagementHeader: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
  <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
    <div>
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Quản lý đợt thi</h1>
      <p className="mt-2 font-medium text-slate-500">Thiết lập kỳ thi, cấu hình chapter và phân bổ thí sinh.</p>
    </div>
    <Button onClick={onCreate} className="gap-2 px-6 py-3">
      <Plus size={18} /> Tạo kỳ thi
    </Button>
  </div>
);

const toDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getExamStatus = (exam: ExamResponse): ExamStatus => {
  if (exam.status) return exam.status;

  const now = new Date();
  const start = toDate(exam.startTime);
  const end = toDate(exam.endTime);

  if (!start || now < start) return 'UPCOMING';
  if (!end || now > end) return 'COMPLETED';
  return 'ONGOING';
};

const formatDateTime = (value: string | null | undefined): string => {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleString('vi-VN');
};

const statusBadgeClass = (status: ExamStatus) => {
  if (status === 'UPCOMING') return 'bg-sky-100 text-sky-700';
  if (status === 'ONGOING') return 'bg-amber-100 text-amber-700';
  if (status === 'COMPLETED') return 'bg-slate-200 text-slate-700';
  return 'bg-slate-100 text-slate-600';
};

const statusLabel = (status: ExamStatus) => {
  if (status === 'UPCOMING') return 'Sắp diễn ra';
  if (status === 'ONGOING') return 'Đang diễn ra';
  if (status === 'COMPLETED') return 'Đã kết thúc';
  return status;
};

export const ExamManagementTable: React.FC<{
  exams: ExamResponse[];
  loading?: boolean;
  onEdit: (exam: ExamResponse) => void;
  onDelete: (exam: ExamResponse) => void;
  onManageParticipants: (exam: ExamResponse) => void;
}> = ({ exams, loading = false, onEdit, onDelete, onManageParticipants }) => (
  <Table headers={[<span key="info">Thông tin kỳ thi</span>, <span key="config">Cấu hình</span>, <span key="actions">Thao tác</span>]}> 
    {loading ? (
      <tr><td colSpan={3} className="px-6 py-14 text-center"><Spinner className="mx-auto" /><p className="mt-3 text-sm text-slate-500">Đang tải danh sách kỳ thi...</p></td></tr>
    ) : exams.length === 0 ? (
      <tr><td colSpan={3} className="px-6 py-10"><EmptyState title="Chưa có kỳ thi" description="Hãy tạo kỳ thi đầu tiên để bắt đầu." /></td></tr>
    ) : exams.map((exam) => {
      const status = getExamStatus(exam);
      const canMutate = status === 'UPCOMING';

      return (
        <tr key={exam.id} className="hover:bg-slate-50/80">
          <td className="px-6 py-5">
            <div className="flex items-center gap-2">
              <div className="font-bold text-slate-800">{exam.title}</div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}>{statusLabel(status)}</span>
            </div>
            <div className="text-xs text-slate-500">Môn: {exam.subjectName ?? `#${exam.subjectId}`}</div>
            <div className="mt-1 text-xs text-slate-500">Bắt đầu: {formatDateTime(exam.startTime)} • Kết thúc: {formatDateTime(exam.endTime)}</div>
          </td>
          <td className="px-6 py-5">
            <div className="grid grid-cols-1 gap-1 text-sm text-slate-600 md:grid-cols-2">
              <span className="inline-flex items-center gap-1"><Layers size={14} /> {exam.totalQuestions} câu</span>
              <span className="inline-flex items-center gap-1"><Clock size={14} /> {exam.duration} phút</span>
              <span className="inline-flex items-center gap-1"><Shuffle size={14} /> {exam.totalVariants} mã đề</span>
              <span className="inline-flex items-center gap-1"><Users size={14} /> {exam.participantCount ?? 0} thí sinh</span>
            </div>
          </td>
          <td className="px-6 py-5">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="!p-2"
                onClick={() => onManageParticipants(exam)}
                title="Quản lý thí sinh"
              >
                <Users size={16} />
              </Button>
              <Button variant="outline" className="!p-2" onClick={() => onEdit(exam)} disabled={!canMutate} title={canMutate ? 'Sửa kỳ thi' : 'Chỉ sửa được kỳ thi UPCOMING'}><Edit size={16} /></Button>
              <Button variant="danger" className="!p-2" onClick={() => onDelete(exam)} disabled={!canMutate} title={canMutate ? 'Xóa kỳ thi' : 'Chỉ xóa được kỳ thi UPCOMING'}><Trash2 size={16} /></Button>
            </div>
          </td>
        </tr>
      );
    })}
  </Table>
);

export const ChapterConfigEditor: React.FC<{
  chapters: ChapterOption[];
  values: Record<number, number>;
  totalQuestions: number;
  onChange: (chapterId: number, count: number) => void;
}> = ({ chapters, values, totalQuestions, onChange }) => {
  const totalSelected = Object.values(values).reduce((sum, x) => sum + (Number(x) || 0), 0);
  const valid = totalSelected === totalQuestions;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Cấu trúc đề theo chapter</span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${valid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {totalSelected}/{totalQuestions} câu
        </span>
      </div>
      {chapters.length === 0 ? (
        <EmptyState title="Chưa có chapter" description="Chọn môn học để hiển thị chapter." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-700">{chapter.name}</span>
                <span className="mt-1 block text-xs text-slate-500">Tổng số câu hiện có: {chapter.questionCount} câu</span>
              </div>
              <input
                type="number"
                min={0}
                className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right"
                value={values[chapter.id] ?? 0}
                onChange={(e) => onChange(chapter.id, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      )}
      {!valid ? <div className="inline-flex items-center gap-1 text-xs text-red-600"><AlertCircle size={14} /> Tổng số câu theo chapter phải bằng tổng số câu.</div> : null}
    </div>
  );
};

export const ExamBuilderModal: React.FC<{
  open: boolean;
  mode: 'create' | 'edit';
  values: ExamFormValues;
  subjects: SubjectOption[];
  chapters: ChapterOption[];
  submitting?: boolean;
  onClose: () => void;
  onChange: (patch: Partial<ExamFormValues>) => void;
  onChangeChapterCount: (chapterId: number, count: number) => void;
  onSubmit: () => void;
}> = ({ open, mode, values, subjects, chapters, submitting = false, onClose, onChange, onChangeChapterCount, onSubmit }) => (
  <Modal
    open={open}
    title={mode === 'create' ? 'Tạo kỳ thi mới' : 'Cập nhật kỳ thi'}
    onClose={onClose}
    footer={<div className="flex justify-end gap-3"><Button variant="outline" onClick={onClose} disabled={submitting}>Huỷ</Button><Button onClick={onSubmit} isLoading={submitting}><Save size={16} className="mr-2" />Lưu</Button></div>}
  >
    <div className="space-y-4">
      <input className="w-full rounded-xl border border-slate-200 px-4 py-3" placeholder="Tên kỳ thi" value={values.title} onChange={(e) => onChange({ title: e.target.value })} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Môn học</span>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={values.subjectId}
            onChange={(e) => onChange({ subjectId: e.target.value === '' ? '' : Number(e.target.value) })}
          >
            <option value="">Chọn môn học</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Thời lượng (phút)</span>
          <input
            type="number"
            min={1}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={values.duration}
            onChange={(e) => onChange({ duration: Number(e.target.value) })}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Tổng số câu hỏi</span>
          <input
            type="number"
            min={1}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={values.totalQuestions}
            onChange={(e) => onChange({ totalQuestions: Number(e.target.value) })}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Tổng số mã đề</span>
          <input
            type="number"
            min={1}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={values.totalVariants}
            onChange={(e) => onChange({ totalVariants: Number(e.target.value) })}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Thời gian bắt đầu</span>
          <input
            type="datetime-local"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={values.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-600">Thời gian kết thúc</span>
          <input
            type="datetime-local"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={values.endTime}
            onChange={(e) => onChange({ endTime: e.target.value })}
          />
        </label>
      </div>
      <ChapterConfigEditor chapters={chapters} values={values.chapterQuestions} totalQuestions={values.totalQuestions} onChange={onChangeChapterCount} />
    </div>
  </Modal>
);

export const DeleteExamDialog: React.FC<{
  open: boolean;
  exam?: ExamResponse | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, exam, loading = false, onConfirm, onCancel }) => (
  <ConfirmDialog
    open={open}
    title="Xoá kỳ thi"
    description={`Bạn có chắc muốn xoá kỳ thi ${exam?.title ?? ''}?`}
    confirmText="Xoá"
    cancelText="Huỷ"
    danger
    loading={loading}
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);
