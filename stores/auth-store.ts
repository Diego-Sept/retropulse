import { create } from 'zustand';
import { AuthUser, Equipo } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  equipoActivo: Equipo | null;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setEquipoActivo: (equipo: Equipo | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  equipoActivo: null,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setEquipoActivo: (equipo) => set({ equipoActivo: equipo }),
  logout: () => {
    set({ user: null, equipoActivo: null });
    fetch('/api/auth/logout', { method: 'POST' });
  },
}));
