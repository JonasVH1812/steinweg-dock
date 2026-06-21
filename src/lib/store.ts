import { create } from 'zustand';
import { signOut } from 'next-auth/react';

export type UserRole = 'dock_worker' | 'chauffeur' | 'admin';

export type AppView = 
  | 'dashboard'
  | 'shifts'
  | 'cargo'
  | 'documents'
  | 'safety'
  | 'trucks'
  | 'warehouses'
  | 'notifications'
  | 'reports';

interface AppState {
  currentUser: any | null;
  currentRole: UserRole;
  currentView: AppView;
  seeded: boolean;
  sidebarOpen: boolean;
  setCurrentUser: (user: any) => void;
  setCurrentRole: (role: UserRole) => void;
  setCurrentView: (view: AppView) => void;
  setSeeded: (seeded: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  currentRole: 'dock_worker',
  currentView: 'dashboard',
  seeded: false,
  sidebarOpen: false,
  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentRole: (role) => set({ currentRole: role, currentView: 'dashboard' }),
  setCurrentView: (view) => set({ currentView: view, sidebarOpen: false }),
  setSeeded: (seeded) => set({ seeded }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  logout: () => {
    signOut({ redirect: false });
    set({ currentUser: null, currentRole: 'dock_worker', currentView: 'dashboard' });
  },
}));
