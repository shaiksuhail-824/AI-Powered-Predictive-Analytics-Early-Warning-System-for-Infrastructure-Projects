import { create } from 'zustand';
import { User } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: mockUsers[0],
  isAuthenticated: true,
  
  login: (email: string) => {
    // Basic mock authentication
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
