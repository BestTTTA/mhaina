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

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// Read the cached session straight out of localStorage. Supabase stores it
// under a key shaped like `sb-<project-ref>-auth-token`. We do this synchronously
// before any await so RequireAuth never sees `user === null` on a refresh —
// otherwise it bounces the user to /auth before getSession() finishes.
function readCachedSession():
  | { id: string; email: string; user_metadata: any }
  | null {
  if (typeof window === 'undefined') return null;
  try {
    const allKeys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k) allKeys.push(k);
    }
    const authKeys = allKeys.filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    console.log('[SupabaseProvider] localStorage keys:', allKeys);
    console.log('[SupabaseProvider] auth keys found:', authKeys);

    for (const key of authKeys) {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      console.log('[SupabaseProvider] parsed session shape:', {
        key,
        topLevelKeys: Object.keys(parsed || {}),
        hasUser: !!parsed?.user,
        hasCurrentSession: !!parsed?.currentSession,
        userIdAtTop: parsed?.user?.id,
        userIdNested: parsed?.currentSession?.user?.id,
      });
      const sess = parsed?.user ? parsed : parsed?.currentSession;
      const u = sess?.user;
      if (u?.id) {
        console.log('[SupabaseProvider] ✓ restored user from cache:', u.id);
        return {
          id: u.id,
          email: u.email || '',
          user_metadata: u.user_metadata,
        };
      }
    }
    console.log('[SupabaseProvider] no usable cached session found');
  } catch (e) {
    console.warn('[SupabaseProvider] failed to read cached session', e);
  }
  return null;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const setUser = useAuthStore((state: AuthStore) => state.setUser);
  const setProfile = useAuthStore((state: AuthStore) => state.setProfile);
  const setIsLoading = useAuthStore((state: AuthStore) => state.setIsLoading);
  const setIsAuthenticated = useAuthStore((state: AuthStore) => state.setIsAuthenticated);

  useEffect(() => {
    let cancelled = false;

    // Optimistic restore — prevents the login flash on refresh.
    const cached = readCachedSession();
    if (cached) {
      setUser(cached);
      setIsAuthenticated(true);
      setIsLoading(false);
    }

    const fetchProfileFor = async (userId: string, fallbackNickname: string) => {
      try {
        let profile = await withTimeout(userService.getProfile(userId), 5000, 'getProfile');
        if (cancelled) return;
        if (!profile) {
          profile = await withTimeout(
            userService.createProfile(userId, truncateNickname(fallbackNickname)),
            5000,
            'createProfile'
          );
        }
        if (!cancelled && profile) setProfile(profile);
      } catch (error) {
        console.warn('[SupabaseProvider] profile fetch failed (non-fatal):', error);
      }
    };

    const checkAuth = async () => {
      let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] = null;

      try {
        const result = await withTimeout(supabase.auth.getSession(), 8000, 'getSession');
        session = result.data.session;
      } catch (error) {
        console.warn(
          '[SupabaseProvider] getSession timed out — keeping cached session, onAuthStateChange will recover',
          error
        );
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
      } else if (!cached) {
        // Only clear when there's no cached session either. If we already
        // restored from localStorage, trust the cache until SIGNED_OUT fires.
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);

      if (session?.user) {
        const fallback =
          session.user.user_metadata?.nickname ||
          session.user.email?.split('@')[0] ||
          'นักตกปลา';
        fetchProfileFor(session.user.id, fallback);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (cancelled) return;
      console.log('[SupabaseProvider] onAuthStateChange', event, {
        hasSession: !!session,
        userId: session?.user?.id,
      });

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
        setIsLoading(false);

        // Only fetch profile on a real sign-in. INITIAL_SESSION races with
        // checkAuth(); TOKEN_REFRESHED / USER_UPDATED don't change the row.
        if (event === 'SIGNED_IN') {
          const existing = useAuthStore.getState().profile;
          if (existing?.user_id !== session.user.id) {
            const fallback =
              session.user.user_metadata?.nickname ||
              session.user.email?.split('@')[0] ||
              'นักตกปลา';
            fetchProfileFor(session.user.id, fallback);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        // Only an explicit sign-out wipes state. INITIAL_SESSION with null
        // can fire transiently during slow init and must NOT log the user out.
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [setUser, setProfile, setIsLoading, setIsAuthenticated]);

  return <>{children}</>;
}
