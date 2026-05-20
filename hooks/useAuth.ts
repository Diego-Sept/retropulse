'use client';
import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const equipoActivo = useAuthStore((state) => state.equipoActivo);
  const setEquipoActivo = useAuthStore((state) => state.setEquipoActivo);
  const logout = useAuthStore((state) => state.logout);

  return { user, isLoading, equipoActivo, setEquipoActivo, logout };
}
