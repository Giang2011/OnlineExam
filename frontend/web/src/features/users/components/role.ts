import type { Role } from '@/shared/types/common';

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Quản trị',
  TEACHER: 'Giáo viên',
  STUDENT: 'Học sinh',
};

export const ROLE_STYLE: Record<Role, string> = {
  ADMIN: 'border-chalk/40 bg-chalk-wash text-chalk-deep',
  TEACHER: 'border-jade/40 bg-jade-wash text-jade',
  STUDENT: 'border-rule bg-paper-sunken text-slate',
};
