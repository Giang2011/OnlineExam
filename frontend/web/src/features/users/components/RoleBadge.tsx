import { cn } from '@/shared/utils/cn';
import { ROLE_LABEL, ROLE_STYLE } from '@/features/users/components/role';
import type { Role } from '@/shared/types/common';

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
        ROLE_STYLE[role],
        className,
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
