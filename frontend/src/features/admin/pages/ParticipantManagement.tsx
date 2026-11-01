import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminParticipants } from '../hooks/useAdminParticipants';
import { getUsers } from '../api/userApi';
import type { AdminUser } from '../types';
import type { Participant } from '../api/participantApi';
import {
  AddParticipantModal,
  DeleteParticipantDialog,
  ParticipantHeader,
  ParticipantTable,
  type StudentCandidate,
} from '../components/ParticipantManagementComponents';

const ParticipantManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const examId = id ? Number(id) : null;

  const participantsHook = useAdminParticipants({ examId });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await getUsers();
      setAllUsers(users);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openAddModal = async () => {
    setIsAddModalOpen(true);
    await loadUsers();
  };

  const addableUsers = useMemo<StudentCandidate[]>(() => {
    const participantUserIds = new Set(participantsHook.participants.map((p) => p.userId));
    const keyword = participantsHook.search.trim().toLowerCase();

    return allUsers
      .filter((u) => u.role === 'STUDENT' && !participantUserIds.has(Number(u.id)))
      .filter((u) => {
        if (!keyword) return true;
        const haystack = [u.name, u.username ?? '', u.studentId ?? ''].join(' ').toLowerCase();
        return haystack.includes(keyword);
      })
      .map((u) => ({
        id: Number(u.id),
        name: u.name,
        studentId: u.studentId ?? undefined,
        username: u.username ?? undefined,
      }));
  }, [allUsers, participantsHook.participants, participantsHook.search]);

  const handleAddParticipant = async (userId: number) => {
    const ok = await participantsHook.addParticipant({ userId });
    if (ok) {
      toast.success('Thêm thí sinh vào kì thi thành công.');
      await loadUsers();
    }
  };

  const handleConfirmRemove = async () => {
    if (!deletingParticipant) return;
    const ok = await participantsHook.removeParticipant(deletingParticipant.userId);
    if (ok) {
      toast.success('Xóa thí sinh khỏi kỳ thi thành công.');
      setDeletingParticipant(null);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ParticipantHeader
        total={participantsHook.filteredParticipants.length}
        search={participantsHook.search}
        onSearchChange={participantsHook.setSearch}
        onOpenAddModal={openAddModal}
        onBack={() => navigate('/admin/exams')}
      />

      <ParticipantTable
        participants={participantsHook.filteredParticipants}
        loading={participantsHook.loading}
        onRemove={(participant) => setDeletingParticipant(participant)}
      />

      <AddParticipantModal
        open={isAddModalOpen}
        users={addableUsers}
        loading={loadingUsers}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddParticipant}
      />

      <DeleteParticipantDialog
        open={Boolean(deletingParticipant)}
        participant={deletingParticipant}
        loading={participantsHook.loading}
        onCancel={() => setDeletingParticipant(null)}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
};

export default ParticipantManagement;
