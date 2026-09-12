import { create } from 'zustand';
import { User, RiskLevel, Project } from '../types';

interface AppState {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  
  user: User | null;
  setUser: (user: User | null) => void;

  filters: {
    sector: Project['sector'] | 'All';
    state: string | 'All';
    riskLevel: RiskLevel | 'All';
    searchQuery: string;
  };
  setFilter: <K extends keyof AppState['filters']>(key: K, value: AppState['filters'][K]) => void;

  notifications: { id: string; message: string; read: boolean }[];
  addNotification: (message: string) => void;
  markNotificationRead: (id: string) => void;

  // For simulating updates
  triggerProjectUpdate: () => void;
  updateCounter: number; // Increment to trigger re-renders or data refetch logic in components
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),

  user: null, // Note: This is a mock auth state for demonstration purposes only. Not secure.
  setUser: (user) => set({ user }),

  filters: {
    sector: 'All',
    state: 'All',
    riskLevel: 'All',
    searchQuery: '',
  },
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),

  notifications: [
    { id: '1', message: 'High risk breach detected in NHAI-RD-0', read: false },
    { id: '2', message: 'Contractor update pending for 3 projects', read: false }
  ],
  addNotification: (message) => set((state) => ({
    notifications: [{ id: Date.now().toString(), message, read: false }, ...state.notifications]
  })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  updateCounter: 0,
  triggerProjectUpdate: () => set((state) => ({ updateCounter: state.updateCounter + 1 }))
}));
