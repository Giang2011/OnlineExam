import React from 'react';
import { ArrowLeft, Search, UserPlus, Trash2 } from 'lucide-react';
import { Button, ConfirmDialog, EmptyState, Modal, Spinner, Table } from '../../../shared/components';
import type { Participant } from '../api/participantApi';

export interface StudentCandidate {
  id: number;
  name: string;
  studentId?: string;
  username?: string;
}

export const ParticipantHeader: React.FC<{
  total: number;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenAddModal: () => void;
  onBack: () => void;
}> = ({ total, search, onSearchChange, onOpenAddModal, onBack }) => (
  <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
    <div>
      <Button variant="outline" className="mb-3 gap-2" onClick={onBack}>
        <ArrowLeft size={16} /> Quay lại quản lý đợt thi
      </Button>
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Quản lý thí sinh</h1>
      <p className="mt-2 text-slate-500">Hiện có {total} thí sinh đã ghi danh.</p>
    </div>
    <div className="flex w-full gap-2 md:w-auto">
      <div className="relative min-w-[260px]">
        <Search className="absolute left-3 top-3 text-slate-400" size={16} />
        <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Tìm theo tên/MSSV" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3" />
      </div>
      <Button onClick={onOpenAddModal} className="gap-2"><UserPlus size={16} /> Thêm thí sinh</Button>
    </div>
  </div>
);

export const ParticipantTable: React.FC<{
  participants: Participant[];
  loading?: boolean;
  onRemove: (participant: Participant) => void;
}> = ({ participants, loading = false, onRemove }) => (
  <Table headers={[<span key="name">Thí sinh</span>, <span key="studentId">MSSV</span>, <span key="actions">Thao tác</span>]}> 
    {loading ? (
      <tr><td colSpan={3} className="px-6 py-14 text-center"><Spinner className="mx-auto" /><p className="mt-3 text-sm text-slate-500">Đang tải danh sách thí sinh...</p></td></tr>
    ) : participants.length === 0 ? (
      <tr><td colSpan={3} className="px-6 py-10"><EmptyState title="Chưa có thí sinh" description="Hãy thêm thí sinh vào kỳ thi." /></td></tr>
    ) : participants.map((p) => (
      <tr key={p.userId}>
        <td className="px-6 py-4 font-medium text-slate-700">{p.name}</td>
        <td className="px-6 py-4 text-slate-600">{p.studentId || 'N/A'}</td>
        <td className="px-6 py-4">
          <Button variant="danger" className="!p-2" onClick={() => onRemove(p)}><Trash2 size={16} /></Button>
        </td>
      </tr>
    ))}
  </Table>
);

export const AddParticipantModal: React.FC<{
  open: boolean;
  users: StudentCandidate[];
  loading?: boolean;
  onClose: () => void;
  onAdd: (userId: number) => void;
}> = ({ open, users, loading = false, onClose, onAdd }) => (
  <Modal open={open} title="Thêm thí sinh" onClose={onClose}>
    {loading ? (
      <div className="py-8 text-center"><Spinner className="mx-auto" /></div>
    ) : users.length === 0 ? (
      <EmptyState title="Không có tài khoản phù hợp" description="Tất cả sinh viên đã được thêm hoặc không có dữ liệu." />
    ) : (
      <div className="max-h-[360px] space-y-2 overflow-y-auto">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            <div>
              <div className="font-medium text-slate-700">{u.name}</div>
              <div className="text-xs text-slate-500">{u.studentId || u.username || 'N/A'}</div>
            </div>
            <Button className="!px-3 !py-1.5 text-xs" onClick={() => onAdd(u.id)}>Thêm</Button>
          </div>
        ))}
      </div>
    )}
  </Modal>
);

export const DeleteParticipantDialog: React.FC<{
  open: boolean;
  participant?: Participant | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, participant, loading = false, onConfirm, onCancel }) => (
  <ConfirmDialog
    open={open}
    title="Xoá thí sinh khỏi kỳ thi"
    description={`Bạn có chắc muốn xoá ${participant?.name ?? ''} khỏi danh sách?`}
    confirmText="Xoá"
    cancelText="Huỷ"
    danger
    loading={loading}
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);
