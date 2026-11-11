import { create } from 'zustand';
import type { AuthUser } from '@/shared/types/common';

interface AuthState {
  user: AuthUser | null;
  /** true khi đã thử khôi phục phiên từ cookie và biết chắc trạng thái. */
  initialized: boolean;
  setUser: (user: AuthUser | null) => void;
  setInitialized: (initialized: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  setUser: (user) => set({ user, initialized: true }),
  setInitialized: (initialized) => set({ initialized }),
  clear: () => set({ user: null, initialized: true }),
}));
