import React from 'react';
import { Book, ChevronRight, Layers, Plus, Save, Trash2, X, Edit } from 'lucide-react';
import { Badge, Button, ConfirmDialog, EmptyState, Modal, Spinner, Table } from '../../../shared/components';

export interface SubjectItem {
  id: number | string;
  name: string;
  description?: string | null;
  code?: string | null;
  status?: string | null;
}

export interface ChapterItem {
  id: number | string;
  subjectId?: number | string;
  name: string;
  chapterOrder?: number;
  description?: string | null;
  status?: string | null;
}

export interface SubjectFormValues {
  name: string;
}

export interface ChapterFormValues {
  name: string;
}

export const SubjectManagementHeader: React.FC<{
  total: number;
  onCreateSubject: () => void;
}> = ({ total, onCreateSubject }) => (
  <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
    <div>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        <Book size={14} /> Hệ thống môn học
      </div>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Quản lý môn học</h1>
      <p className="mt-2 font-medium text-slate-500">Tổng cộng {total} môn học đang được quản lý.</p>
    </div>
    <Button onClick={onCreateSubject} className="gap-2 px-6 py-3">
      <Plus size={18} /> Thêm môn học
    </Button>
  </div>
);

export const SubjectManagementTable: React.FC<{
  subjects: SubjectItem[];
  loading?: boolean;
  selectedSubjectId?: number | string | null;
  onSelectSubject: (subject: SubjectItem) => void;
  onEditSubject: (subject: SubjectItem) => void;
  onDeleteSubject: (subject: SubjectItem) => void;
}> = ({ subjects, loading = false, selectedSubjectId, onSelectSubject, onEditSubject, onDeleteSubject }) => (
  <Table headers={[<span key="name">Tên môn</span>, <span key="actions" className="text-right block">Thao tác</span>]}>
    {loading ? (
      <tr>
        <td colSpan={2} className="px-6 py-14 text-center text-slate-500">
          <Spinner className="mx-auto" />
          <div className="mt-3 text-sm">Đang tải danh sách môn học...</div>
        </td>
      </tr>
    ) : subjects.length === 0 ? (
      <tr>
        <td colSpan={2} className="px-6 py-10">
          <EmptyState title="Chưa có môn học nào" description="Hãy tạo môn học đầu tiên để bắt đầu quản lý chapter." />
        </td>
      </tr>
    ) : subjects.map((subject) => {
      const selected = selectedSubjectId === subject.id;
      return (
        <tr key={String(subject.id)} className={selected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'} onClick={() => onSelectSubject(subject)}>
          <td className="px-6 py-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${selected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
                {(subject.name?.charAt(0) || 'M').toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-slate-800">{subject.name}</div>
                {subject.code ? <div className="text-xs text-slate-400">Mã: {subject.code}</div> : null}
              </div>
            </div>
          </td>
          <td className="px-6 py-5 text-right">
            <div className="flex items-center justify-end gap-1">
              <button type="button" onClick={(e) => { e.stopPropagation(); onEditSubject(subject); }} className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-indigo-600">
                <Edit size={16} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteSubject(subject); }} className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-red-500">
                <Trash2 size={16} />
              </button>
              <ChevronRight size={16} className={`text-slate-300 transition-transform ${selected ? 'rotate-90 text-indigo-500' : ''}`} />
            </div>
          </td>
        </tr>
      );
    })}
  </Table>
);

export const SubjectFormModal: React.FC<{
  open: boolean;
  mode: 'create' | 'edit';
  initialValues: SubjectFormValues;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: SubjectFormValues) => void;
}> = ({ open, mode, initialValues, submitting = false, onClose, onSubmit }) => {
  const [values, setValues] = React.useState<SubjectFormValues>(initialValues);

  React.useEffect(() => {
    if (open) setValues(initialValues);
  }, [initialValues, open]);

  return (
    <Modal open={open} title={mode === 'create' ? 'Thêm môn học mới' : 'Cập nhật môn học'} onClose={onClose} footer={<div className="flex justify-end gap-3"><Button variant="outline" onClick={onClose} disabled={submitting}>Huỷ</Button><Button onClick={() => onSubmit(values)} isLoading={submitting}>Lưu</Button></div>}>
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Tên môn học
          <input value={values.name} onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none ring-0 focus:border-indigo-500" placeholder="Ví dụ: Toán rời rạc" />
        </label>
      </div>
    </Modal>
  );
};

export const ChapterEditorCard: React.FC<{
  subjectName: string;
  chapters: ChapterItem[];
  loading?: boolean;
  onCreateChapter: () => void;
  onEditChapter: (chapter: ChapterItem) => void;
  onDeleteChapter: (chapter: ChapterItem) => void;
  onClose: () => void;
}> = ({ subjectName, chapters, loading = false, onCreateChapter, onEditChapter, onDeleteChapter, onClose }) => (
  <div className="modern-card rounded-3xl border border-slate-100 bg-white shadow-sm">
    <div className="border-b border-slate-100 bg-slate-50/40 p-8">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700">
          <Layers size={12} /> Chapters
        </div>
        <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>
      <h2 className="text-2xl font-black tracking-tight text-slate-900">{subjectName}</h2>
      <p className="mt-1 text-sm font-medium text-slate-500">Quản lý danh sách chapter theo môn học.</p>
    </div>

    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Danh sách chapter ({chapters.length})</span>
        <Button onClick={onCreateChapter} className="gap-2 bg-slate-900 text-white hover:bg-indigo-600">
          <Plus size={14} /> Thêm chapter mới
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : chapters.length === 0 ? (
        <EmptyState title="Chưa có chapter nào" description="Môn học này chưa có chapter. Hãy tạo chapter đầu tiên." />
      ) : (
        <div className="space-y-4">
          {chapters.map((chapter) => (
            <div key={String(chapter.id)} className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50">
              <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-xs font-black text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  <Layers size={14} />
                </div>
                <div>
                  <div className="font-bold text-slate-700 transition-colors group-hover:text-slate-900">{chapter.name}</div>
                  {chapter.description ? <div className="text-xs text-slate-400">{chapter.description}</div> : null}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                <button type="button" onClick={() => onEditChapter(chapter)} className="rounded-lg p-2 text-slate-400 transition-colors hover:text-indigo-600">
                  <Edit size={16} />
                </button>
                <button type="button" onClick={() => onDeleteChapter(chapter)} className="rounded-lg p-2 text-slate-400 transition-colors hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export const ChapterFormModal: React.FC<{
  open: boolean;
  mode: 'create' | 'edit';
  initialValues: ChapterFormValues;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ChapterFormValues) => void;
}> = ({ open, mode, initialValues, submitting = false, onClose, onSubmit }) => {
  const [values, setValues] = React.useState<ChapterFormValues>(initialValues);

  React.useEffect(() => {
    if (open) setValues(initialValues);
  }, [initialValues, open]);

  return (
    <Modal open={open} title={mode === 'create' ? 'Thêm chapter mới' : 'Cập nhật chapter'} onClose={onClose} footer={<div className="flex justify-end gap-3"><Button variant="outline" onClick={onClose} disabled={submitting}>Huỷ</Button><Button onClick={() => onSubmit(values)} isLoading={submitting}><Save size={16} className="mr-2" />Lưu</Button></div>}>
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Tên chapter
          <div className="relative mt-2">
            <Layers className="pointer-events-none absolute left-4 top-3.5 text-slate-400" size={18} />
            <input value={values.name} onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-2xl border border-slate-200 py-3.5 pl-12 pr-4 outline-none focus:border-indigo-500" placeholder="Ví dụ: Chương 1 - Số phức" />
          </div>
        </label>
      </div>
    </Modal>
  );
};

export const DeleteSubjectDialog: React.FC<{
  open: boolean;
  subject?: SubjectItem | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, subject, loading = false, onConfirm, onCancel }) => (
  <ConfirmDialog
    open={open}
    title="Xoá môn học"
    description={`Bạn có chắc muốn xoá môn học ${subject?.name || ''}? Hành động này có thể ảnh hưởng đến chapter và dữ liệu liên quan.`}
    confirmText="Xoá"
    cancelText="Huỷ"
    danger
    loading={loading}
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);

export const DeleteChapterDialog: React.FC<{
  open: boolean;
  chapter?: ChapterItem | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, chapter, loading = false, onConfirm, onCancel }) => (
  <ConfirmDialog
    open={open}
    title="Xoá chapter"
    description={`Bạn có chắc muốn xoá chapter ${chapter?.name || ''}?`}
    confirmText="Xoá"
    cancelText="Huỷ"
    danger
    loading={loading}
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);

export const SubjectChapterEmptyHint: React.FC<{ onCreateSubject: () => void; hasSubjects: boolean }> = ({ onCreateSubject, hasSubjects }) => (
  <EmptyState
    title={hasSubjects ? 'Chọn môn học để quản lý chapter' : 'Chưa có môn học nào'}
    description={hasSubjects ? 'Vui lòng chọn một môn học ở danh sách bên trái để xem và quản lý chapter.' : 'Hãy tạo môn học đầu tiên để bắt đầu quản lý chapter.'}
    action={hasSubjects ? undefined : <Button onClick={onCreateSubject}>Thêm môn học đầu tiên</Button>}
  />
);

export const SubjectSectionBadge: React.FC<{ status?: string | null }> = ({ status }) => {
  if (!status) return null;
  const tone = status === 'ACTIVE' ? 'green' : status === 'INACTIVE' ? 'slate' : 'blue';
  return <Badge tone={tone as 'green' | 'slate' | 'blue'}>{status}</Badge>;
};
