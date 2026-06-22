import { create } from 'zustand';
import { signOut } from 'next-auth/react';
import { Language } from './i18n';

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
  | 'reports'
  | 'admin'
  | 'settings'
  | 'my-deliveries';

interface AppState {
  currentUser: any | null;
  currentRole: UserRole;
  currentView: AppView;
  seeded: boolean;
  sidebarOpen: boolean;
  language: Language;
  darkMode: boolean;
  setCurrentUser: (user: any) => void;
  setCurrentRole: (role: UserRole) => void;
  setCurrentView: (view: AppView) => void;
  setSeeded: (seeded: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setLanguage: (lang: Language) => void;
  setDarkMode: (dark: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  currentRole: 'dock_worker',
  currentView: 'dashboard',
  seeded: false,
  sidebarOpen: false,
  language: (typeof localStorage !== 'undefined' && localStorage.getItem('lang') as Language) || 'en',
  darkMode: (typeof localStorage !== 'undefined' && localStorage.getItem('darkMode') === 'true') || false,
  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentRole: (role) => set({ currentRole: role, currentView: 'dashboard' }),
  setCurrentView: (view) => set({ currentView: view, sidebarOpen: false }),
  setSeeded: (seeded) => set({ seeded }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setLanguage: (lang) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('lang', lang);
    set({ language: lang });
  },
  setDarkMode: (dark) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('darkMode', String(dark));
    set({ darkMode: dark });
  },
  logout: () => {
    signOut({ redirect: false });
    set({ currentUser: null, currentRole: 'dock_worker', currentView: 'dashboard' });
  },
}));
