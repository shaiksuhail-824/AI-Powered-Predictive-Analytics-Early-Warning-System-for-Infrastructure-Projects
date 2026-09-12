import { create } from 'zustand';
import { User, Role } from '../types';
import { apiClient, authStorage } from '../services/api';

const USER_STORAGE_KEY = 'paimana_user_profile';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadSession: () => Promise<void>;
  clearError: () => void;
}

const getInitialState = (): { user: User | null; isAuthenticated: boolean } => {
  if (typeof window !== 'undefined') {
    try {
      const token = authStorage.getToken();
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (token && stored) {
        const user = JSON.parse(stored) as User;
        return { user, isAuthenticated: true };
      }
    } catch {
      // ignore storage parsing error
    }
  }
  return { user: null, isAuthenticated: false };
};

const initial = getInitialState();

export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  isAuthenticated: initial.isAuthenticated,
  isLoading: false,
  error: null,

  login: async (username: string, password: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const resp = await apiClient.login({ username, password });
      const user: User = {
        id: resp.user.username,
        name: resp.user.name,
        email: resp.user.email,
        role: resp.user.role as Role,
        organizationId: resp.user.organization,
        scopedAgency: resp.user.scoped_agency,
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } catch {
          // ignore storage error
        }
      }

      set({ user, isAuthenticated: true, isLoading: false, error: null });
      return true;
    } catch (err: any) {
      const errorMsg = err?.message || 'Invalid username or password';
      set({ user: null, isAuthenticated: false, isLoading: false, error: errorMsg });
      return false;
    }
  },

  logout: () => {
    authStorage.clearToken();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  loadSession: async () => {
    const token = authStorage.getToken();
    if (!token) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(USER_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const user = await apiClient.getMe();
      if (user) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
          } catch {
            // ignore
          }
        }
        set({ user, isAuthenticated: true, isLoading: false, error: null });
      } else {
        authStorage.clearToken();
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(USER_STORAGE_KEY);
          } catch {
            // ignore
          }
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      authStorage.clearToken();
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(USER_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
