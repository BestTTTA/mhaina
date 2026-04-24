'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { userService } from '@/lib/api';
import type { AuthStore } from '@/lib/store';

interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const setUser = useAuthStore((state: AuthStore) => state.setUser);
  const setProfile = useAuthStore((state: AuthStore) => state.setProfile);
  const setIsLoading = useAuthStore((state: AuthStore) => state.setIsLoading);
  const setIsAuthenticated = useAuthStore((state: AuthStore) => state.setIsAuthenticated);

  useEffect(() => {
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(safetyTimer);
      setIsLoading(false);
    };
    // Hard ceiling: if getSession hasn't returned in 5s (network stall, slow cold
    // start), release the auth gate so pages don't show the spinner forever.
    const safetyTimer = setTimeout(() => {
      if (resolved) return;
      console.warn('[SupabaseProvider] auth check exceeded 5s — releasing loading gate');
      finish();
    }, 5000);

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata,
          });
          setIsAuthenticated(true);
        }
        finish();

        if (session?.user) {
          let profile = await userService.getProfile(session.user.id);
          if (!profile) {
            const nickname =
              session.user.user_metadata?.nickname ||
              session.user.email?.split('@')[0] ||
              'นักตกปลา';
            profile = await userService.createProfile(session.user.id, nickname);
          }
          if (profile) {
            setProfile(profile);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        finish();
      }
    };

    checkAuth();

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata,
        });
        setIsAuthenticated(true);

        const profile = await userService.getProfile(session.user.id);
        if (profile) {
          setProfile(profile);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, [setUser, setProfile, setIsLoading, setIsAuthenticated]);

  return <>{children}</>;
}
