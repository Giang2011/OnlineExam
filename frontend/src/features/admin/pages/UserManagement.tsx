import React from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  CredentialsModal,
  DeleteUserDialog,
  UserFormModal,
  UserManagementHeader,
  UserManagementTable,
  type AdminUser,
  type GeneratedCredentials,
  type UserFormValues,
} from '../components/UserManagementComponents';
import { useAdminUsers } from '../hooks/useAdminUsers';
import type { AdminUserRole } from '../types';

const emptyForm: UserFormValues = {
  name: '',
  role: 'STUDENT',
  password: '',
  studentId: '',
  username: '',
};

const UserManagement: React.FC = () => {
  const {
    users,
    filteredUsers,
    loading,
    currentRole,
    createStudent,
    createTeacher,
    updateUser,
    removeUser,
  } = useAdminUsers();

  const [submitting, setSubmitting] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null);
  const [mode, setMode] = React.useState<'create-student' | 'create-teacher' | 'edit' | null>(null);
  const [credentials, setCredentials] = React.useState<GeneratedCredentials | null>(null);
  const [formValues, setFormValues] = React.useState<UserFormValues>(emptyForm);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const openCreateStudent = () => {
    setMode('create-student');
    setSelectedUser(null);
    setFormValues({ ...emptyForm, role: 'STUDENT' });
  };

  const openCreateTeacher = () => {
    setMode('create-teacher');
    setSelectedUser(null);
    setFormValues({ ...emptyForm, role: 'TEACHER' });
  };

  const openEdit = (user: AdminUser) => {
    setMode('edit');
    setSelectedUser(user);
    setFormValues({
      name: user.name || '',
      role: user.role as AdminUserRole,
      password: '',
      studentId: user.studentId || '',
      username: user.username || '',
    });
  };

  const closeForm = () => {
    setMode(null);
    setSelectedUser(null);
    setFormValues(emptyForm);
  };

  const submitForm = async (values: UserFormValues) => {
    setSubmitting(true);

    try {
      if (mode === 'create-student') {
        const result = await createStudent({ studentId: values.studentId || '', name: values.name });
        if (result) {
          setCredentials({ username: result.username, password: result.password });
        }
      } else if (mode === 'create-teacher') {
        const result = await createTeacher({ username: values.username || '', password: values.password, name: values.name });
        if (result) {
          setCredentials({ username: result.username, password: values.password });
        }
      } else if (mode === 'edit' && selectedUser) {
        await updateUser(selectedUser.id, {
          name: values.name,
          username: values.username || undefined,
          password: values.password || undefined,
        });
        toast.success('Cập nhật người dùng thành công');
      }

      closeForm();
    } catch (error) {
      console.error('Failed to submit user form:', error);
      toast.error('Thao tác không thành công');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const result = await Swal.fire({
      title: 'Xoá tài khoản?',
      text: `Bạn có chắc muốn xoá ${deleteTarget.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xoá',
      cancelButtonText: 'Huỷ',
    });

    if (!result.isConfirmed) return;

    setDeleteLoading(true);
    try {
      await removeUser(deleteTarget.id);
      toast.success('Xoá người dùng thành công');
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Không thể xoá người dùng');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <UserManagementHeader
        total={users.length}
        currentRole={currentRole}
        onCreateStudent={openCreateStudent}
        onCreateTeacher={openCreateTeacher}
      />

      <UserManagementTable
        users={filteredUsers}
        loading={loading}
        currentRole={currentRole}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <UserFormModal
        open={Boolean(mode)}
        title={mode === 'create-student' ? 'Tạo sinh viên' : mode === 'create-teacher' ? 'Tạo giảng viên' : 'Cập nhật người dùng'}
        mode={mode || 'edit'}
        initialValues={formValues}
        onClose={closeForm}
        onSubmit={submitForm}
        submitting={submitting}
      />

      <CredentialsModal
        open={Boolean(credentials)}
        credentials={credentials}
        onClose={() => setCredentials(null)}
      />

      <DeleteUserDialog
        open={Boolean(deleteTarget)}
        user={deleteTarget}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default UserManagement;
