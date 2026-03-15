import { create } from 'zustand';
import {
  ApiError,
  USER_EMAIL_KEY,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from '../utils/api';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  name: string;
}

interface AuthState {
  initialized: boolean;
  isAuthenticated: boolean;
  email: string | null;
  initAuth: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  initialized: false,
  isAuthenticated: false,
  email: localStorage.getItem(USER_EMAIL_KEY),

  initAuth: async () => {
    try {
      await refreshSession();
      set({ initialized: true, isAuthenticated: true, email: localStorage.getItem(USER_EMAIL_KEY) });
    } catch {
      set({ initialized: true, isAuthenticated: false, email: null });
    }
  },

  login: async (input) => {
    await loginUser(input);
    set({ isAuthenticated: true, email: input.email });
  },

  register: async (input) => {
    await registerUser(input);
    set({ isAuthenticated: true, email: input.email });
  },

  logout: async () => {
    try {
      await logoutUser();
    } catch {
      // no-op: still clear local app state
    }

    localStorage.removeItem(USER_EMAIL_KEY);
    set({ isAuthenticated: false, email: null });
  },
}));

export function isApiInvalidCredentialsError(error: unknown): boolean {
  return error instanceof ApiError && (error.code === 'INVALID_CREDENTIALS' || error.status === 401);
}
