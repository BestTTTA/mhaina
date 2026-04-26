'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { userService } from '@/lib/api';
import { truncateNickname } from '@/lib/utils';
import type { AuthStore } from '@/lib/store';

interface SupabaseProviderProps {
  children: ReactNode;
}

// Race a promise against a timeout. On timeout the race rejects, letting the
// caller decide how to recover instead of awaiting forever.
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const setUser = useAuthStore((state: AuthStore) => state.setUser);
  const setProfile = useAuthStore((state: AuthStore) => state.setProfile);
  const setIsLoading = useAuthStore((state: AuthStore) => state.setIsLoading);
  const setIsAuthenticated = useAuthStore((state: AuthStore) => state.setIsAuthenticated);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] = null;

      try {
        // On return visits Supabase tries to refresh an expired access token.
        // If the refresh endpoint hangs or localStorage is corrupted, getSession
        // can stall indefinitely. Cap it at 3s; on timeout we wipe the local
        // session so the user gets a clean login screen instead of a spinner.
        const result = await withTimeout(supabase.auth.getSession(), 3000, 'getSession');
        session = result.data.session;
      } catch (error) {
        console.warn('[SupabaseProvider] getSession failed or timed out — clearing stale session', error);
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch (signOutError) {
          console.warn('[SupabaseProvider] signOut also failed:', signOutError);
        }
        if (!cancelled) setIsLoading(false);
        return;
      }

      if (cancelled) return;

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata,
        });
        setIsAuthenticated(true);
      }
      setIsLoading(false);

      // Profile fetch runs in the background — never blocks the UI.
      if (session?.user) {
        try {
          let profile = await withTimeout(
            userService.getProfile(session.user.id),
            5000,
            'getProfile'
          );
          if (cancelled) return;
          if (!profile) {
            const rawNickname =
              session.user.user_metadata?.nickname ||
              session.user.email?.split('@')[0] ||
              'นักตกปลา';
            profile = await withTimeout(
              userService.createProfile(session.user.id, truncateNickname(rawNickname)),
              5000,
              'createProfile'
            );
          }
          if (!cancelled && profile) setProfile(profile);
        } catch (error) {
          console.warn('[SupabaseProvider] profile fetch failed (non-fatal):', error);
        }
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (cancelled) return;

      // Recovery links can land on any page (Supabase falls back to Site URL
      // when redirectTo is rejected). When the SDK detects a recovery code
      // it emits PASSWORD_RECOVERY — route to the reset-password screen no
      // matter where the user actually landed.
      if (event === 'PASSWORD_RECOVERY' && typeof window !== 'undefined') {
        if (!window.location.pathname.startsWith('/auth/reset-password')) {
          window.location.replace('/auth/reset-password');
          return;
        }
      }

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata,
        });
        setIsAuthenticated(true);

        try {
          const profile = await withTimeout(
            userService.getProfile(session.user.id),
            5000,
            'onAuthStateChange getProfile'
          );
          if (!cancelled && profile) setProfile(profile);
        } catch (error) {
          console.warn('[SupabaseProvider] onAuthStateChange profile fetch failed:', error);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [setUser, setProfile, setIsLoading, setIsAuthenticated]);

  return <>{children}</>;
}
