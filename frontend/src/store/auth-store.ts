import { create } from 'zustand';
import { Usuario } from '@/types';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (user: Usuario, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: Partial<Usuario>) => void;
}

type AuthStore = AuthState & AuthActions;

// ⚠️ IMPORTANTE: Sin persistencia - la sesión se pierde al cerrar/actualizar la página
export const useAuthStore = create<AuthStore>()((set, get) => ({
  // Estado inicial
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  // Acciones
  login: (user: Usuario, token: string) =>
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    }),

  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setLoading: (loading: boolean) =>
    set({ isLoading: loading }),

  updateUser: (userData: Partial<Usuario>) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),
}));

// Selectores útiles
export const useUser = () => useAuthStore((state) => state.user);
export const useToken = () => useAuthStore((state) => state.token);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useIsAdmin = () => useAuthStore((state) => state.user?.rol === 'ADMIN');
export const useMinisterioId = () => useAuthStore((state) => state.user?.ministerioId);








