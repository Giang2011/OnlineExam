import React from 'react';
import { appToast } from '../../../shared/components';
import {
  ChapterEditorCard,
  ChapterFormModal,
  DeleteChapterDialog,
  DeleteSubjectDialog,
  SubjectChapterEmptyHint,
  SubjectFormModal,
  SubjectManagementHeader,
  SubjectManagementTable,
  type ChapterFormValues,
  type ChapterItem,
  type SubjectFormValues,
  type SubjectItem,
} from '../components/SubjectManagementComponents';
import { useAdminChapters } from '../hooks/useAdminChapters';
import { useAdminSubjects } from '../hooks/useAdminSubjects';

const SubjectManagement: React.FC = () => {
  const {
    subjects,
    loading: subjectsLoading,
    createSubject,
    updateSubject,
    removeSubject,
  } = useAdminSubjects();

  const {
    activeSubjectId,
    chapters,
    loading: chaptersLoading,
    setActiveSubjectId,
    createChapter,
    updateChapter,
    removeChapter,
  } = useAdminChapters(null);

  const selectedSubject = React.useMemo<SubjectItem | null>(() => {
    return (subjects.find((subject) => subject.id === activeSubjectId) as SubjectItem | undefined) ?? null;
  }, [activeSubjectId, subjects]);

  const [subjectModalOpen, setSubjectModalOpen] = React.useState(false);
  const [subjectModalMode, setSubjectModalMode] = React.useState<'create' | 'edit'>('create');
  const [subjectEditing, setSubjectEditing] = React.useState<SubjectItem | null>(null);
  const [subjectSubmitting, setSubjectSubmitting] = React.useState(false);
  const [subjectToDelete, setSubjectToDelete] = React.useState<SubjectItem | null>(null);
  const [subjectDeleteLoading, setSubjectDeleteLoading] = React.useState(false);

  const [chapterModalOpen, setChapterModalOpen] = React.useState(false);
  const [chapterModalMode, setChapterModalMode] = React.useState<'create' | 'edit'>('create');
  const [chapterEditing, setChapterEditing] = React.useState<ChapterItem | null>(null);
  const [chapterSubmitting, setChapterSubmitting] = React.useState(false);
  const [chapterToDelete, setChapterToDelete] = React.useState<ChapterItem | null>(null);
  const [chapterDeleteLoading, setChapterDeleteLoading] = React.useState(false);

  React.useEffect(() => {
    if (activeSubjectId == null) return;
    const stillExists = subjects.some((subject) => subject.id === activeSubjectId);
    if (!stillExists) setActiveSubjectId(null);
  }, [activeSubjectId, setActiveSubjectId, subjects]);

  const closeSubjectModal = React.useCallback(() => {
    setSubjectModalOpen(false);
    setSubjectEditing(null);
  }, []);

  const closeChapterModal = React.useCallback(() => {
    setChapterModalOpen(false);
    setChapterEditing(null);
  }, []);

  const handleOpenCreateSubject = React.useCallback(() => {
    setSubjectModalMode('create');
    setSubjectEditing(null);
    setSubjectModalOpen(true);
  }, []);

  const handleOpenEditSubject = React.useCallback((subject: SubjectItem) => {
    setSubjectModalMode('edit');
    setSubjectEditing(subject);
    setSubjectModalOpen(true);
  }, []);

  const handleSelectSubject = React.useCallback((subject: SubjectItem) => {
    setActiveSubjectId(subject.id);
    setChapterToDelete(null);
  }, [setActiveSubjectId]);

  const handleOpenCreateChapter = React.useCallback(() => {
    setChapterModalMode('create');
    setChapterEditing(null);
    setChapterModalOpen(true);
  }, []);

  const handleOpenEditChapter = React.useCallback((chapter: ChapterItem) => {
    setChapterModalMode('edit');
    setChapterEditing(chapter);
    setChapterModalOpen(true);
  }, []);

  const handleSubjectSubmit = async (values: SubjectFormValues) => {
    setSubjectSubmitting(true);
    try {
      if (subjectModalMode === 'create') {
        const created = await createSubject({ name: values.name });
        if (!created) {
          appToast.error('Không thể tạo môn học');
          return;
        }
      } else if (subjectEditing?.id != null) {
        const updated = await updateSubject(subjectEditing.id, { name: values.name });
        if (!updated) {
          appToast.error('Không thể cập nhật môn học');
          return;
        }
      }
      closeSubjectModal();
      appToast.success('Thao tác môn học thành công');
    } catch (error) {
      console.error('Failed to submit subject:', error);
      appToast.error('Có lỗi xảy ra');
    } finally {
      setSubjectSubmitting(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    setSubjectDeleteLoading(true);
    try {
      const ok = await removeSubject(subjectToDelete.id);
      if (!ok) {
        appToast.error('Không thể xoá môn học');
        return;
      }
      if (activeSubjectId === subjectToDelete.id) {
        setActiveSubjectId(null);
      }
      setSubjectToDelete(null);
      appToast.success('Đã xoá môn học thành công');
    } catch (error) {
      console.error('Failed to delete subject:', error);
      appToast.error('Không thể xoá môn học');
    } finally {
      setSubjectDeleteLoading(false);
    }
  };

  const handleChapterSubmit = async (values: ChapterFormValues) => {
    if (!selectedSubject) return;
    setChapterSubmitting(true);
    try {
      if (chapterModalMode === 'create') {
        const created = await createChapter({ name: values.name });
        if (!created) {
          appToast.error('Không thể tạo chapter');
          return;
        }
      } else if (chapterEditing?.id != null) {
        const updated = await updateChapter(chapterEditing.id, { name: values.name });
        if (!updated) {
          appToast.error('Không thể cập nhật chapter');
          return;
        }
      }
      closeChapterModal();
      appToast.success('Thao tác chapter thành công');
    } catch (error) {
      console.error('Failed to submit chapter:', error);
      appToast.error('Có lỗi xảy ra');
    } finally {
      setChapterSubmitting(false);
    }
  };

  const handleDeleteChapter = async () => {
    if (!selectedSubject || !chapterToDelete) return;
    setChapterDeleteLoading(true);
    try {
      const ok = await removeChapter(chapterToDelete.id);
      if (!ok) {
        appToast.error('Không thể xoá chapter');
        return;
      }
      setChapterToDelete(null);
      appToast.success('Đã xoá chapter');
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      appToast.error('Không thể xoá chapter');
    } finally {
      setChapterDeleteLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SubjectManagementHeader total={subjects.length} onCreateSubject={handleOpenCreateSubject} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SubjectManagementTable
            subjects={subjects}
            loading={subjectsLoading}
            selectedSubjectId={selectedSubject?.id}
            onSelectSubject={handleSelectSubject}
            onEditSubject={handleOpenEditSubject}
            onDeleteSubject={setSubjectToDelete}
          />
        </div>

        {selectedSubject ? (
          <div className="animate-in slide-in-from-right-8 duration-500 lg:col-span-7">
            <ChapterEditorCard
              subjectName={selectedSubject.name}
              chapters={chapters}
              loading={chaptersLoading}
              onCreateChapter={handleOpenCreateChapter}
              onEditChapter={handleOpenEditChapter}
              onDeleteChapter={setChapterToDelete}
              onClose={() => {
                setActiveSubjectId(null);
                setChapterToDelete(null);
              }}
            />
          </div>
        ) : (
          <div className="lg:col-span-7">
            <SubjectChapterEmptyHint onCreateSubject={handleOpenCreateSubject} hasSubjects={subjects.length > 0} />
          </div>
        )}
      </div>

      <SubjectFormModal
        open={subjectModalOpen}
        mode={subjectModalMode}
        initialValues={{ name: subjectEditing?.name || '' }}
        submitting={subjectSubmitting}
        onClose={closeSubjectModal}
        onSubmit={handleSubjectSubmit}
      />

      <ChapterFormModal
        open={chapterModalOpen}
        mode={chapterModalMode}
        initialValues={{
          name: chapterEditing?.name || '',
        }}
        submitting={chapterSubmitting}
        onClose={closeChapterModal}
        onSubmit={handleChapterSubmit}
      />

      <DeleteSubjectDialog
        open={Boolean(subjectToDelete)}
        subject={subjectToDelete}
        loading={subjectDeleteLoading}
        onConfirm={handleDeleteSubject}
        onCancel={() => setSubjectToDelete(null)}
      />

      <DeleteChapterDialog
        open={Boolean(chapterToDelete)}
        chapter={chapterToDelete}
        loading={chapterDeleteLoading}
        onConfirm={handleDeleteChapter}
        onCancel={() => setChapterToDelete(null)}
      />
    </div>
  );
};

export default SubjectManagement;
