import { create } from 'zustand';
import { AuthUser, FishermanProfile } from './types';

export interface AuthStore {
  user: AuthUser | null;
  profile: FishermanProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: FishermanProfile | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  logout: () => set({ user: null, profile: null, isAuthenticated: false }),
}));
