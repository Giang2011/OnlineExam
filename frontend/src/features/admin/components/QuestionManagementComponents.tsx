import React, { useEffect, useState } from 'react';
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button, ConfirmDialog, EmptyState, FileUpload, Modal, Select, Textarea } from '../../../shared/components';
import type { Question } from '../types';

export interface SelectOption {
  value: string;
  label: string;
}

export interface QuestionFormAnswer {
  content: string;
  isCorrect: boolean;
  imageFile?: File | null;
  previewUrl?: string | null;
  imageRemoved?: boolean;
}

export interface QuestionFormValue {
  content: string;
  subjectId: string;
  chapterId: string;
  imageFile?: File | null;
  imagePreviewUrl?: string | null;
  imageRemoved?: boolean;
  answers: QuestionFormAnswer[];
}

interface QuestionEditorProps {
  open: boolean;
  mode: 'create' | 'edit';
  value: QuestionFormValue;
  subjectOptions: SelectOption[];
  chapterOptions: SelectOption[];
  loading?: boolean;
  onClose: () => void;
  onChange: (next: QuestionFormValue) => void;
  onSubmit: () => void;
}

interface ImagePreviewState {
  src: string;
  title: string;
}

const ImagePreviewModal: React.FC<{
  preview: ImagePreviewState | null;
  onClose: () => void;
}> = ({ preview, onClose }) => {
  if (!preview) return null;

  return (
    <Modal
      open={Boolean(preview)}
      title={preview.title}
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      }
    >
      <div className="flex justify-center">
        <img
          src={preview.src}
          alt={preview.title}
          className="max-h-[70vh] w-auto rounded-xl border border-slate-200 object-contain"
        />
      </div>
    </Modal>
  );
};

const revokeBlobUrl = (url?: string | null) => {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

const AnswerEditor: React.FC<{
  answers: QuestionFormAnswer[];
  onChange: (answers: QuestionFormAnswer[]) => void;
  onPreview: (src: string, title: string) => void;
}> = ({ answers, onChange, onPreview }) => {
  const canRemove = answers.length > 2;

  const updateAt = (index: number, updater: (answer: QuestionFormAnswer) => QuestionFormAnswer) => {
    const next = answers.map((answer, i) => (i === index ? updater(answer) : answer));
    onChange(next);
  };

  const addAnswer = () => onChange([...answers, { content: '', isCorrect: false, imageFile: null, previewUrl: null, imageRemoved: false }]);

  const removeAnswer = (index: number) => {
    if (!canRemove) return;
    revokeBlobUrl(answers[index]?.previewUrl);
    onChange(answers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">Đáp án</h4>
        <Button variant="outline" size="sm" onClick={addAnswer}>
          <Plus size={14} /> Thêm đáp án
        </Button>
      </div>

      <div className="space-y-3">
        {answers.map((answer, index) => (
          <div key={index} className={`rounded-xl border p-3 ${answer.isCorrect ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
            <div className="mb-2 flex items-center gap-3">
              <input
                type="checkbox"
                checked={answer.isCorrect}
                onChange={(e) => updateAt(index, (current) => ({ ...current, isCorrect: e.target.checked }))}
              />
              <div className="text-xs text-slate-600">Đáp án đúng</div>
              <button type="button" className="ml-auto text-slate-400 hover:text-red-500" onClick={() => removeAnswer(index)} disabled={!canRemove}>
                <Trash2 size={16} />
              </button>
            </div>

            <Textarea
              value={answer.content}
              onChange={(event) => updateAt(index, (current) => ({ ...current, content: event.target.value }))}
              placeholder={`Nội dung đáp án ${index + 1}`}
              rows={2}
            />

            <div className="mt-2">
              {answer.previewUrl ? (
                <div className="inline-flex items-center gap-2">
                  <div className="relative inline-block">
                    <img src={answer.previewUrl} alt="answer" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                    <button
                      type="button"
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                      onClick={() => {
                        revokeBlobUrl(answer.previewUrl);
                        updateAt(index, (current) => ({ ...current, imageFile: null, previewUrl: null, imageRemoved: true }));
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPreview(answer.previewUrl as string, `Ảnh đáp án ${index + 1}`)}
                  >
                    <Eye size={14} /> Xem ảnh
                  </Button>
                </div>
              ) : (
                <FileUpload
                  accept="image/*"
                  onChange={(file) => {
                    if (!file) return;
                    const nextPreviewUrl = URL.createObjectURL(file);
                    updateAt(index, (current) => {
                      revokeBlobUrl(current.previewUrl);
                      return { ...current, imageFile: file, previewUrl: nextPreviewUrl, imageRemoved: false };
                    });
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  open,
  mode,
  value,
  subjectOptions,
  chapterOptions,
  loading,
  onClose,
  onChange,
  onSubmit,
}) => {
  const title = mode === 'create' ? 'Tạo câu hỏi mới' : 'Cập nhật câu hỏi';
  const [preview, setPreview] = useState<ImagePreviewState | null>(null);

  const handlePreview = (src: string, previewTitle: string) => {
    setPreview({ src, title: previewTitle });
  };

  const handleClose = () => {
    setPreview(null);
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        title={title}
        onClose={handleClose}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={loading}>Huỷ</Button>
            <Button onClick={onSubmit} isLoading={loading}>Lưu câu hỏi</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Select
              value={value.subjectId}
              options={subjectOptions}
              onChange={(event) => onChange({ ...value, subjectId: event.target.value, chapterId: '' })}
              placeholder="Chọn môn học"
            />
            <Select
              value={value.chapterId}
              options={chapterOptions}
              onChange={(event) => onChange({ ...value, chapterId: event.target.value })}
              placeholder="Chọn chương"
            />
          </div>

          <Textarea
            value={value.content}
            onChange={(event) => onChange({ ...value, content: event.target.value })}
            placeholder="Nội dung câu hỏi"
            rows={4}
          />

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Ảnh câu hỏi</p>
            {value.imagePreviewUrl ? (
              <div className="inline-flex items-center gap-2">
                <div className="relative inline-block">
                  <img src={value.imagePreviewUrl} alt="question" className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
                  <button
                    type="button"
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
                    onClick={() => onChange({ ...value, imageFile: null, imagePreviewUrl: null, imageRemoved: true })}
                  >
                    <X size={12} />
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(value.imagePreviewUrl as string, 'Ảnh câu hỏi')}
                >
                  <Eye size={14} /> Xem ảnh
                </Button>
              </div>
            ) : (
              <div className="max-w-sm">
                <FileUpload
                  accept="image/*"
                  onChange={(file) => {
                    if (!file) return;
                    onChange({ ...value, imageFile: file, imagePreviewUrl: URL.createObjectURL(file), imageRemoved: false });
                  }}
                />
              </div>
            )}
          </div>

          <AnswerEditor
            answers={value.answers}
            onChange={(answers) => onChange({ ...value, answers })}
            onPreview={handlePreview}
          />
        </div>
      </Modal>

      <ImagePreviewModal preview={preview} onClose={() => setPreview(null)} />
    </>
  );
};

export const QuestionDeleteConfirmDialog: React.FC<{
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ open, loading, onCancel, onConfirm }) => (
  <ConfirmDialog
    open={open}
    title="Xoá câu hỏi"
    description="Bạn có chắc muốn xoá câu hỏi này?"
    confirmText="Xoá"
    cancelText="Huỷ"
    danger
    loading={loading}
    onCancel={onCancel}
    onConfirm={onConfirm}
  />
);

export const QuestionList: React.FC<{
  questions: Question[];
  loading: boolean;
  getSubjectName?: (subjectId: number) => string;
  getChapterName?: (chapterId: number) => string;
  onEditClick: (question: Question) => void;
  onDeleteClick: (question: Question) => void;
}> = ({ questions, loading, getSubjectName, getChapterName, onEditClick, onDeleteClick }) => {
  if (loading) return <div className="rounded-xl border border-slate-200 p-6">Đang tải câu hỏi...</div>;
  if (!questions.length) return <EmptyState title="Chưa có câu hỏi" description="Hãy tạo câu hỏi đầu tiên." />;

  return (
    <div className="space-y-2">
      {questions.map((question) => {
        const subjectLabel = question.subjectName ?? getSubjectName?.(question.subjectId) ?? `Môn #${question.subjectId}`;
        const chapterLabel = question.chapterName ?? getChapterName?.(question.chapterId) ?? `Chương #${question.chapterId}`;

        return (
          <div key={question.id} className="flex items-start justify-between rounded-xl border border-slate-200 p-4">
            <div className="space-y-1">
              <p className="font-medium text-slate-900">{question.content}</p>
              <p className="text-xs text-slate-500">{subjectLabel} · {chapterLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onEditClick(question)}>
                <Pencil size={14} /> Sửa
              </Button>
              <Button variant="danger" size="sm" onClick={() => onDeleteClick(question)}>
                <Trash2 size={14} /> Xoá
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
