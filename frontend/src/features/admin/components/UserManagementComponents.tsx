import React from 'react';
import { Edit, Shield, Trash2, Users } from 'lucide-react';
import { Badge, Button, ConfirmDialog, FormField, Input, Modal, Select } from '../../../shared/components';

export type AdminRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface AdminUser {
  id: number | string;
  name: string;
  role: AdminRole;
  studentId?: string | null;
  username?: string | null;
  isActive?: boolean;
}

export interface UserFormValues {
  name: string;
  role: AdminRole | '';
  password: string;
  studentId?: string;
  username?: string;
}

export interface GeneratedCredentials {
  username: string;
  password: string;
}

const roleColorMap: Record<AdminRole, string> = {
  ADMIN: 'bg-purple-50 text-purple-700',
  TEACHER: 'bg-amber-50 text-amber-700',
  STUDENT: 'bg-blue-50 text-blue-700',
};

export const UserManagementHeader: React.FC<{
  total: number;
  currentRole?: string | null;
  onCreateStudent: () => void;
  onCreateTeacher: () => void;
}> = ({ total, currentRole, onCreateStudent, onCreateTeacher }) => {
  const canManage = currentRole === 'ADMIN';

  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          <Users size={14} /> Danh sách người dùng
        </div>
        <h2 className="mt-2 text-2xl font-black text-slate-900">Quản lý tài khoản</h2>
        <p className="mt-1 text-sm text-slate-500">Tổng cộng {total} người dùng.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={onCreateStudent}>+ Thêm sinh viên</Button>
        {canManage ? (
          <Button onClick={onCreateTeacher}>
            <Shield size={16} /> + Thêm giáo viên
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export const UserManagementTable: React.FC<{
  users: AdminUser[];
  loading?: boolean;
  currentRole?: string | null;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}> = ({ users, loading = false, currentRole, onEdit, onDelete }) => {
  const canManage = currentRole === 'ADMIN';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Thành viên</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Vai trò</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
            {canManage ? <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Thao tác</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {loading ? (
            <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={canManage ? 4 : 3}>Đang tải dữ liệu...</td></tr>
          ) : users.length === 0 ? (
            <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={canManage ? 4 : 3}>Chưa có người dùng nào</td></tr>
          ) : users.map((user) => (
            <tr key={String(user.id)} className="hover:bg-slate-50/80">
              <td className="px-4 py-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl font-black ${roleColorMap[user.role]}`}>
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-400">ID: #{user.id}{user.studentId ? ` | MSSV: ${user.studentId}` : ''}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4"><Badge tone={user.role === 'ADMIN' ? 'info' : user.role === 'TEACHER' ? 'warning' : 'default'}>{user.role}</Badge></td>
              <td className="px-4 py-4 text-sm text-slate-600">Active</td>
              {canManage ? (
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(user)}><Edit size={16} /></Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(user)}><Trash2 size={16} /></Button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const UserFormModal: React.FC<{
  open: boolean;
  title: string;
  mode: 'create-student' | 'create-teacher' | 'edit';
  initialValues: UserFormValues;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
  submitting?: boolean;
}> = ({ open, title, mode, initialValues, onClose, onSubmit, submitting = false }) => {
  const [values, setValues] = React.useState<UserFormValues>(initialValues);

  React.useEffect(() => { if (open) setValues(initialValues); }, [initialValues, open]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={<div className="flex justify-end gap-3"><Button variant="outline" onClick={onClose} disabled={submitting}>Huỷ</Button><Button onClick={() => onSubmit(values)} isLoading={submitting}>{mode === 'edit' ? 'Lưu thay đổi' : 'Tạo tài khoản'}</Button></div>}
    >
      <div className="space-y-4">
        <FormField label="Họ và tên"><Input value={values.name} onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))} /></FormField>
        {mode === 'create-student' ? (
          <FormField label="MSSV"><Input value={values.studentId || ''} onChange={(e) => setValues((p) => ({ ...p, studentId: e.target.value }))} /></FormField>
        ) : (
          <FormField label="Username"><Input value={values.username || ''} onChange={(e) => setValues((p) => ({ ...p, username: e.target.value }))} /></FormField>
        )}
        {mode === 'edit' ? (
          <FormField label="Vai trò">
            <Select value={values.role} onChange={(e) => setValues((p) => ({ ...p, role: e.target.value as AdminRole }))} options={[{ value: 'STUDENT', label: 'Student' }, { value: 'TEACHER', label: 'Teacher' }, { value: 'ADMIN', label: 'Admin' }]} />
          </FormField>
        ) : null}
        {mode !== 'create-student' ? (
          <FormField label={mode === 'edit' ? 'Mật khẩu mới (tuỳ chọn)' : 'Mật khẩu'}><Input type="password" value={values.password} onChange={(e) => setValues((p) => ({ ...p, password: e.target.value }))} /></FormField>
        ) : null}
      </div>
    </Modal>
  );
};

export const CredentialsModal: React.FC<{
  open: boolean;
  credentials: GeneratedCredentials | null;
  onClose: () => void;
}> = ({ open, credentials, onClose }) => (
  <Modal
    open={open && Boolean(credentials)}
    title="Tài khoản đã được tạo"
    onClose={onClose}
    footer={<div className="flex justify-end"><Button onClick={onClose}>Đã ghi lại</Button></div>}
  >
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Thông tin này chỉ hiển thị một lần.</p>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm">
        <div className="flex items-center justify-between"><span className="text-slate-500">Username</span><strong>{credentials?.username}</strong></div>
        <div className="my-3 h-px bg-slate-200" />
        <div className="flex items-center justify-between"><span className="text-slate-500">Password</span><strong>{credentials?.password}</strong></div>
      </div>
    </div>
  </Modal>
);

export const DeleteUserDialog: React.FC<{
  open: boolean;
  user?: AdminUser | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, user, loading = false, onConfirm, onCancel }) => (
  <ConfirmDialog
    open={open}
    title="Xoá người dùng"
    description={`Bạn có chắc muốn xoá tài khoản ${user?.name || ''}?`}
    confirmText="Xoá"
    cancelText="Huỷ"
    danger
    loading={loading}
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);
