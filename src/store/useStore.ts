import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  id: string;
  email: string;
  photoURL?: string;
  displayName?: string;
  isGuest?: boolean;
}

interface AppState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isInitializing: boolean;
  setInitializing: (val: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      isInitializing: true,
      setInitializing: (val) => set({ isInitializing: val }),
    }),
    {
      name: 'verdict-lab-storage',
    }
  )
);
